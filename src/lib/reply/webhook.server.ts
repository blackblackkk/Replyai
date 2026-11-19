import { timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import { completeReply, withinQuietHours, type ReplyContext } from "./engine";
import { addEvent, bumpUsage, loadWorkspace, resolveBotToken, resolveWebhookSecret } from "./store";

type TgUser = { id?: number; first_name?: string; username?: string; is_bot?: boolean };
type TgChat = { id?: number; first_name?: string; username?: string; type?: string };
type TgMessage = {
  message_id?: number;
  business_connection_id?: string;
  from?: TgUser;
  chat?: TgChat;
  text?: string;
  date?: number;
};
type BusinessConnection = {
  id?: string;
  user?: TgUser;
  user_chat_id?: number;
  is_enabled?: boolean;
  rights?: Record<string, boolean | undefined>;
};
type Update = {
  update_id?: number;
  message?: TgMessage;
  business_connection?: BusinessConnection;
  business_message?: TgMessage;
  edited_business_message?: TgMessage;
  deleted_business_messages?: {
    business_connection_id?: string;
    chat?: TgChat;
    message_ids?: number[];
  };
};

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function telegram(method: string, body: Record<string, unknown>): Promise<boolean> {
  const token = await resolveBotToken();
  if (!token) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

function contextOf(ws: Awaited<ReturnType<typeof loadWorkspace>>): ReplyContext {
  return {
    knowledge: ws.knowledge,
    products: ws.products,
    personality: ws.personality,
    customInstructions: ws.customInstructions,
    style: ws.styleConfirmed ? ws.style : null,
    rules: ws.rules,
  };
}

async function rememberChat(userId: string, chatId: string, title: string) {
  const sql = await getSql();
  const hint = title.replace(/\s+/g, " ").trim().slice(0, 80);
  await sql`insert into reply_chats (user_id, chat_id, title_hint) values (${userId}, ${chatId}, ${hint})
    on conflict (user_id, chat_id) do update set
      title_hint = case when ${hint} = '' then reply_chats.title_hint else ${hint} end,
      last_seen_at = now()`;
}

async function claimMessage(userId: string, chatId: string, messageId: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ message_id: string }>`
    insert into reply_ledger (user_id, chat_id, message_id) values (${userId}, ${chatId}, ${messageId})
    on conflict do nothing returning message_id`;
  return rows.length > 0;
}

async function applyConnection(conn: BusinessConnection) {
  const sql = await getSql();
  const tgUser = conn.user?.id != null ? String(conn.user.id) : "";
  const connectionId = conn.id ?? "";
  const userChatId = conn.user_chat_id != null ? String(conn.user_chat_id) : "";
  if (!tgUser || !connectionId || !userChatId) return;
  const enabled = Boolean(conn.is_enabled);
  const canReply = Boolean(conn.rights?.can_reply);
  const rights = JSON.stringify(conn.rights ?? {});
  const linked = await sql<{ user_id: string }>`
    select user_id from reply_telegram where telegram_user_id = ${tgUser}`;
  if (linked[0]) {
    await sql`update reply_telegram set connection_id = ${connectionId}, user_chat_id = ${userChatId},
      is_enabled = ${enabled}, can_reply = ${canReply}, rights = ${rights}, updated_at = now()
      where user_id = ${linked[0].user_id}`;
    await sql`delete from reply_unclaimed where telegram_user_id = ${tgUser}`;
    await addEvent(sql, linked[0].user_id, enabled ? "connection_updated" : "connection_disabled");
    return;
  }
  await sql`insert into reply_unclaimed (telegram_user_id, connection_id, user_chat_id, is_enabled, can_reply, rights)
    values (${tgUser}, ${connectionId}, ${userChatId}, ${enabled}, ${canReply}, ${rights})
    on conflict (telegram_user_id) do update set
      connection_id = excluded.connection_id, user_chat_id = excluded.user_chat_id,
      is_enabled = excluded.is_enabled, can_reply = excluded.can_reply, rights = excluded.rights, updated_at = now()`;
}

async function bindStart(message: TgMessage) {
  const text = message.text ?? "";
  const match = text.match(/^\/start(?:@[A-Za-z0-9_]+)?\s+link_([a-f0-9]{32})$/);
  if (!match || message.from?.is_bot || message.chat?.id == null || message.from?.id == null) return;
  const sql = await getSql();
  const token = match[1];
  const rows = await sql<{ user_id: string }>`
    select user_id from reply_telegram where link_token = ${token} and link_expires_at > now()`;
  const userId = rows[0]?.user_id;
  if (!userId) return;
  const tgUser = String(message.from.id);
  const chatId = String(message.chat.id);
  await sql`update reply_telegram set telegram_user_id = null where telegram_user_id = ${tgUser} and user_id <> ${userId}`;
  await sql`update reply_telegram set telegram_user_id = ${tgUser}, user_chat_id = ${chatId},
    link_token = null, link_expires_at = null, updated_at = now() where user_id = ${userId}`;
  const pending = await sql<{
    connection_id: string;
    user_chat_id: string;
    is_enabled: boolean;
    can_reply: boolean;
    rights: string;
  }>`select connection_id, user_chat_id, is_enabled, can_reply, rights from reply_unclaimed where telegram_user_id = ${tgUser}`;
  if (pending[0]) {
    await sql`update reply_telegram set connection_id = ${pending[0].connection_id}, user_chat_id = ${pending[0].user_chat_id},
      is_enabled = ${pending[0].is_enabled}, can_reply = ${pending[0].can_reply}, rights = ${pending[0].rights}, updated_at = now()
      where user_id = ${userId}`;
    await sql`delete from reply_unclaimed where telegram_user_id = ${tgUser}`;
  }
  await addEvent(sql, userId, "account_linked");
  await telegram("sendMessage", {
    chat_id: message.chat.id,
    text: "Аккаунт REPLY привязан. Подключение из «Автоматизация чатов» подтвердится отдельным событием Telegram.",
  });
}

async function onBusinessMessage(message: TgMessage) {
  const connectionId = message.business_connection_id ?? "";
  const chatId = message.chat?.id != null ? String(message.chat.id) : "";
  const messageId = message.message_id != null ? String(message.message_id) : "";
  if (!connectionId || !chatId || !messageId || message.from?.is_bot) return;
  const sql = await getSql();
  const owners = await sql<{ user_id: string; telegram_user_id: string | null }>`
    select user_id, telegram_user_id from reply_telegram where connection_id = ${connectionId} and is_enabled = true`;
  const owner = owners[0];
  if (!owner) return;
  if (message.from?.id != null && String(message.from.id) === owner.telegram_user_id) return;
  const title = message.chat?.username || message.chat?.first_name || "";
  await rememberChat(owner.user_id, chatId, title);
  if (!(await claimMessage(owner.user_id, chatId, messageId))) return;
  await bumpUsage(sql, owner.user_id, "inbound", 1);

  const ws = await loadWorkspace(owner.user_id);
  const chat = ws.chats.find((item) => item.chatId === chatId);
  const windowSet = Boolean(ws.automation.quietStart && ws.automation.quietEnd);
  const outsideHours = windowSet && !withinQuietHours(ws.automation.quietStart, ws.automation.quietEnd);
  const usage = await sql<{ replied: number }>`
    select replied from reply_usage_daily where user_id = ${owner.user_id} and day = current_date`;
  const overCap = (usage[0]?.replied ?? 0) >= ws.automation.dailyCap;
  const tooOld = message.date != null && Math.floor(Date.now() / 1000) - message.date > 24 * 60 * 60;
  if (!ws.automation.enabled || ws.automation.paused) {
    await addEvent(sql, owner.user_id, "inbound_observed");
    return;
  }
  if (!ws.telegram.canReply) {
    await addEvent(sql, owner.user_id, "reply_skipped_rights");
    return;
  }
  if (chat && !chat.allowAuto) {
    await addEvent(sql, owner.user_id, "reply_skipped_chat");
    return;
  }
  if (!message.text?.trim()) {
    await addEvent(sql, owner.user_id, "inbound_non_text");
    return;
  }
  if (tooOld) {
    await addEvent(sql, owner.user_id, "reply_skipped_window");
    return;
  }
  if (outsideHours) {
    await addEvent(sql, owner.user_id, "reply_skipped_hours");
    return;
  }
  if (overCap) {
    await addEvent(sql, owner.user_id, "reply_skipped_cap");
    return;
  }
  const result = await completeReply(contextOf(ws), message.text, "");
  if (result.provider === "local" || (result.provider === "grok" && result.reason !== "model_error")) {
    await bumpUsage(sql, owner.user_id, "credits", 1);
  }
  const handoff = result.action !== "reply" || (ws.automation.mode === "hybrid" && result.reason === "complex");
  if (handoff || ws.automation.mode === "suggest") {
    await bumpUsage(sql, owner.user_id, "handoff", 1);
    await addEvent(sql, owner.user_id, handoff ? "handoff" : "reply_suggested", result.reason);
    if (ws.telegram && owner) {
      const ownerChat = await sql<{ user_chat_id: string | null }>`
        select user_chat_id from reply_telegram where user_id = ${owner.user_id}`;
      const dest = ownerChat[0]?.user_chat_id;
      if (dest) {
        const note = result.text
          ? `REPLY draft (not sent to the chat):\n${result.text}`
          : `REPLY handed this chat to you (${result.reason}). The incoming text was not stored.`;
        await telegram("sendMessage", { chat_id: dest, text: note.slice(0, 3500) });
      }
    }
    if (ws.automation.mode === "suggest" || handoff) return;
  }
  const sent = await telegram("sendMessage", {
    business_connection_id: connectionId,
    chat_id: chatId,
    text: result.text,
    reply_parameters: { message_id: message.message_id },
  });
  if (!sent) {
    await addEvent(sql, owner.user_id, "reply_failed");
    return;
  }
  await bumpUsage(sql, owner.user_id, "replied", 1);
  await addEvent(sql, owner.user_id, "reply_sent", result.provider);
}

export async function handleTelegramWebhook(request: Request): Promise<Response> {
  const secret = (await resolveWebhookSecret()) ?? "";
  const token = (await resolveBotToken()) ?? "";
  if (!token || !secret) return new Response("bot_not_configured", { status: 503 });
  const header = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!safeEqual(header, secret)) return new Response("forbidden", { status: 401 });
  let update: Update;
  try {
    update = (await request.json()) as Update;
  } catch {
    return new Response("bad_json", { status: 400 });
  }
  const updateId = update.update_id != null ? String(update.update_id) : "";
  if (!updateId) return new Response("ok");
  const sql = await getSql();
  const seen = await sql<{ update_id: string }>`
    insert into reply_update_seen (update_id) values (${updateId})
    on conflict do nothing returning update_id`;
  if (!seen.length) return new Response("ok");
  try {
    if (update.business_connection) await applyConnection(update.business_connection);
    else if (update.message) await bindStart(update.message);
    else if (update.business_message) await onBusinessMessage(update.business_message);
    else if (update.edited_business_message) await onBusinessMessage(update.edited_business_message);
    else if (update.deleted_business_messages?.business_connection_id) {
      const owners = await sql<{ user_id: string }>`
        select user_id from reply_telegram where connection_id = ${update.deleted_business_messages.business_connection_id}`;
      if (owners[0]) await addEvent(sql, owners[0].user_id, "messages_deleted");
    }
  } catch {
    return new Response("ok");
  }
  return new Response("ok");
}

export async function verifyBotToken(token: string): Promise<{ username: string }> {
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  if (!res.ok) throw new Error("Telegram не принял токен Bot API");
  const body = (await res.json()) as {
    ok?: boolean;
    result?: { username?: string; is_bot?: boolean; can_connect_to_business?: boolean };
  };
  const username = body.result?.username ?? "";
  if (!body.ok || !body.result?.is_bot || !/^[A-Za-z0-9_]{5,32}$/.test(username)) {
    throw new Error("Telegram не принял токен Bot API");
  }
  if (body.result.can_connect_to_business === false) {
    throw new Error("В BotFather включите Business Mode у этого бота");
  }
  return { username };
}

async function publicHttpsOrigin(): Promise<string | null> {
  const fromEnv = (process.env.APP_URL || process.env.PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (fromEnv.startsWith("https://")) return fromEnv;
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const url = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || url.host;
    const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    if (proto !== "https" || !host || /^(localhost|127\.0\.0\.1)(:|$)/.test(host)) return null;
    return `https://${host}`;
  } catch {
    return null;
  }
}

export async function bindWebhook(token: string, secret: string): Promise<string | null> {
  const origin = await publicHttpsOrigin();
  if (!origin) return null;
  const webhook = `${origin}/api/telegram/webhook`;
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhook,
      secret_token: secret,
      allowed_updates: [
        "message",
        "business_connection",
        "business_message",
        "edited_business_message",
        "deleted_business_messages",
      ],
      drop_pending_updates: false,
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { ok?: boolean };
  return body.ok ? webhook : null;
}
