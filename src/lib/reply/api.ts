import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { completeReply, extractStyle, type ReplyContext } from "./engine";
import {
  addEvent,
  bumpUsage,
  clipField,
  ensureUser,
  knowledgeFrom,
  loadWorkspace,
  normalizeBotUsername,
  resolveBotToken,
  resolveBotUsername,
  resolveWebhookSecret,
} from "./store";
import {
  AUTOMATION_MODES,
  PERSONALITIES,
  PLANS,
  type AutomationMode,
  type Knowledge,
  type Personality,
  type PlanId,
  type Product,
  type Rules,
  type StyleProfile,
} from "./types";

function replyContext(ws: Awaited<ReturnType<typeof loadWorkspace>>): ReplyContext {
  return {
    knowledge: ws.knowledge,
    products: ws.products,
    personality: ws.personality,
    customInstructions: ws.customInstructions,
    style: ws.styleConfirmed ? ws.style : null,
    rules: ws.rules,
  };
}

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => loadWorkspace(context.userId));

export const saveKnowledge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Knowledge) => knowledgeFrom(input))
  .handler(async ({ context, data }) => {
    const sql = await ensureUser(context.userId);
    await sql`update reply_profiles set
      company = ${data.company},
      industry = ${data.industry},
      audience = ${data.audience},
      services = ${data.services},
      payment_methods = ${data.paymentMethods},
      timeline = ${data.timeline},
      geography = ${data.geography},
      advantages = ${data.advantages},
      limitations = ${data.limitations},
      faqs = ${JSON.stringify(data.faqs)},
      objections = ${JSON.stringify(data.objections)},
      updated_at = now()
      where user_id = ${context.userId}`;
    await addEvent(sql, context.userId, "knowledge_saved");
    return loadWorkspace(context.userId);
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Product) => ({
    id: clipField(input.id, 80),
    name: clipField(input.name, 160),
    description: clipField(input.description, 2000),
    price: clipField(input.price, 64),
    currency: clipField(input.currency, 8) || "USD",
    terms: clipField(input.terms, 800),
    timeline: clipField(input.timeline, 200),
    constraints: clipField(input.constraints, 800),
    options: clipField(input.options, 800),
    faqs: clipField(input.faqs, 2000),
  }))
  .handler(async ({ context, data }) => {
    if (!data.name) throw new Error("Название обязательно");
    const sql = await ensureUser(context.userId);
    const id = data.id || crypto.randomUUID();
    const owned = await sql<{ id: string }>`select id from reply_products where id = ${id} and user_id = ${context.userId}`;
    if (data.id && owned.length === 0) {
      const exists = await sql<{ id: string }>`select id from reply_products where id = ${id}`;
      if (exists.length) throw new Error("Нельзя изменить чужую запись");
    }
    await sql`insert into reply_products
      (id, user_id, name, description, price, currency, terms, timeline, constraints, options, faqs)
      values (${id}, ${context.userId}, ${data.name}, ${data.description}, ${data.price}, ${data.currency},
        ${data.terms}, ${data.timeline}, ${data.constraints}, ${data.options}, ${data.faqs})
      on conflict (id) do update set
        name = excluded.name,
        description = excluded.description,
        price = excluded.price,
        currency = excluded.currency,
        terms = excluded.terms,
        timeline = excluded.timeline,
        constraints = excluded.constraints,
        options = excluded.options,
        faqs = excluded.faqs
      where reply_products.user_id = ${context.userId}`;
    return loadWorkspace(context.userId);
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => clipField(id, 80))
  .handler(async ({ context, data }) => {
    const sql = await ensureUser(context.userId);
    await sql`delete from reply_products where id = ${data} and user_id = ${context.userId}`;
    return loadWorkspace(context.userId);
  });

export const savePersonality = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { personality: Personality; customInstructions: string }) => {
    const personality = (PERSONALITIES as readonly string[]).includes(input.personality)
      ? input.personality
      : "business";
    return { personality, customInstructions: clipField(input.customInstructions, 2000) };
  })
  .handler(async ({ context, data }) => {
    const sql = await ensureUser(context.userId);
    await sql`update reply_profiles set personality = ${data.personality},
      custom_instructions = ${data.customInstructions}, updated_at = now()
      where user_id = ${context.userId}`;
    return loadWorkspace(context.userId);
  });

export const analyzeReference = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((sample: string) => clipField(sample, 20000))
  .handler(async ({ data }) => {
    if (data.length < 40) throw new Error("Нужен фрагмент хотя бы из нескольких реплик");
    const result = await extractStyle(data);
    return result;
  });

export const confirmStyle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((profile: StyleProfile) => ({
    greeting: clipField(profile.greeting, 180),
    length: clipField(profile.length, 180),
    lexicon: clipField(profile.lexicon, 180),
    structure: clipField(profile.structure, 180),
    objections: clipField(profile.objections, 180),
    presentation: clipField(profile.presentation, 180),
    negotiation: clipField(profile.negotiation, 180),
    closing: clipField(profile.closing, 180),
  }))
  .handler(async ({ context, data }) => {
    const sql = await ensureUser(context.userId);
    await sql`update reply_profiles set style_profile = ${JSON.stringify(data)},
      style_confirmed = true, updated_at = now() where user_id = ${context.userId}`;
    await addEvent(sql, context.userId, "style_saved");
    return loadWorkspace(context.userId);
  });

export const clearStyle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await ensureUser(context.userId);
    await sql`update reply_profiles set style_profile = null, style_confirmed = false, updated_at = now()
      where user_id = ${context.userId}`;
    return loadWorkspace(context.userId);
  });

export const saveRules = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((rules: Rules) => ({
    noGuarantees: Boolean(rules.noGuarantees),
    noDiscounts: Boolean(rules.noDiscounts),
    noPricesIfUnknown: Boolean(rules.noPricesIfUnknown),
    noInternal: Boolean(rules.noInternal),
    handoffComplex: Boolean(rules.handoffComplex),
    blockedTopics: clipField(rules.blockedTopics, 500),
  }))
  .handler(async ({ context, data }) => {
    const sql = await ensureUser(context.userId);
    await sql`update reply_profiles set rules = ${JSON.stringify(data)}, updated_at = now()
      where user_id = ${context.userId}`;
    return loadWorkspace(context.userId);
  });

export const saveAutomation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    mode: AutomationMode;
    enabled: boolean;
    dailyCap: number;
    quietStart: string;
    quietEnd: string;
    handoffNote: string;
    paused: boolean;
  }) => ({
    mode: ((AUTOMATION_MODES as readonly string[]).includes(input.mode) ? input.mode : "suggest") as AutomationMode,
    enabled: Boolean(input.enabled),
    dailyCap: Math.max(1, Math.min(500, Math.round(Number(input.dailyCap) || 20))),
    quietStart: /^\d{2}:\d{2}$/.test(input.quietStart) ? input.quietStart : "",
    quietEnd: /^\d{2}:\d{2}$/.test(input.quietEnd) ? input.quietEnd : "",
    handoffNote: clipField(input.handoffNote, 400),
    paused: Boolean(input.paused),
  }))
  .handler(async ({ context, data }) => {
    const sql = await ensureUser(context.userId);
    await sql`update reply_profiles set automation_mode = ${data.mode}, automation_enabled = ${data.enabled},
      daily_cap = ${data.dailyCap}, quiet_start = ${data.quietStart}, quiet_end = ${data.quietEnd},
      handoff_note = ${data.handoffNote}, updated_at = now() where user_id = ${context.userId}`;
    await sql`update reply_telegram set paused = ${data.paused}, updated_at = now() where user_id = ${context.userId}`;
    await addEvent(sql, context.userId, "automation_changed", data.enabled ? data.mode : "off");
    return loadWorkspace(context.userId);
  });

export const setChatPolicy = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { chatId: string; allowAuto: boolean }) => ({
    chatId: clipField(input.chatId, 32),
    allowAuto: Boolean(input.allowAuto),
  }))
  .handler(async ({ context, data }) => {
    const sql = await ensureUser(context.userId);
    await sql`update reply_chats set allow_auto = ${data.allowAuto}
      where user_id = ${context.userId} and chat_id = ${data.chatId}`;
    return loadWorkspace(context.userId);
  });

export const setPlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((plan: string) => ((PLANS as readonly string[]).includes(plan) ? (plan as PlanId) : "free"))
  .handler(async ({ context, data }) => {
    const sql = await ensureUser(context.userId);
    await sql`update reply_profiles set plan = ${data}, updated_at = now() where user_id = ${context.userId}`;
    await addEvent(sql, context.userId, "plan_changed", data);
    return loadWorkspace(context.userId);
  });

export const setPlatformBot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { username?: string; token?: string; xaiKey?: string }) => {
    const username = normalizeBotUsername(input?.username ?? "") ?? "";
    const token = String(input?.token ?? "").trim();
    const xaiKey = String(input?.xaiKey ?? "").trim();
    if (token && !/^\d{5,16}:[A-Za-z0-9_-]{20,120}$/.test(token)) {
      throw new Error("Токен Bot API выглядит неверно. Его даёт BotFather.");
    }
    if (xaiKey && (xaiKey.length < 20 || xaiKey.length > 200 || /\s/.test(xaiKey))) {
      throw new Error("Ключ xAI выглядит неверно");
    }
    return { username, token, xaiKey };
  })
  .handler(async ({ context, data }) => {
    const sql = await ensureUser(context.userId);
    const rows = await sql<{
      owner_user_id: string | null;
      bot_username: string | null;
      bot_token: string | null;
      webhook_secret: string | null;
    }>`select owner_user_id, bot_username, bot_token, webhook_secret from reply_platform where id = 1`;
    const ownerId = rows[0]?.owner_user_id ?? "";
    if (ownerId && ownerId !== context.userId) throw new Error("API задаёт только администратор");
    if (!data.token && !data.xaiKey) throw new Error("Вставьте токен бота или ключ xAI");
    const { verifyBotToken, bindWebhook } = await import("./webhook.server");
    let username = normalizeBotUsername(process.env.TELEGRAM_BOT_USERNAME ?? "") ?? "";
    if (data.token) {
      const checked = await verifyBotToken(data.token);
      if (data.username && data.username !== checked.username) {
        throw new Error(`Токен принадлежит @${checked.username}`);
      }
      username = checked.username;
    }
    const secret =
      (await resolveWebhookSecret()) ??
      [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, "0")).join("");
    await sql`insert into reply_platform (id, bot_username, owner_user_id, bot_token, webhook_secret, xai_api_key)
      values (1, ${username}, ${context.userId}, ${data.token}, ${secret}, ${data.xaiKey})
      on conflict (id) do update set
        owner_user_id = coalesce(reply_platform.owner_user_id, excluded.owner_user_id),
        bot_username = case
          when ${username} <> '' and (reply_platform.owner_user_id is null or reply_platform.owner_user_id = ${context.userId})
          then ${username} else reply_platform.bot_username end,
        bot_token = case
          when ${data.token} <> '' and (reply_platform.owner_user_id is null or reply_platform.owner_user_id = ${context.userId})
          then ${data.token} else reply_platform.bot_token end,
        webhook_secret = case
          when reply_platform.webhook_secret = '' then ${secret} else reply_platform.webhook_secret end,
        xai_api_key = case
          when ${data.xaiKey} <> '' and (reply_platform.owner_user_id is null or reply_platform.owner_user_id = ${context.userId})
          then ${data.xaiKey} else reply_platform.xai_api_key end`;
    const saved = await sql<{ owner_user_id: string | null }>`select owner_user_id from reply_platform where id = 1`;
    if ((saved[0]?.owner_user_id ?? "") !== context.userId) throw new Error("API задаёт только администратор");
    const activeToken = (await resolveBotToken()) ?? "";
    const activeSecret = (await resolveWebhookSecret()) ?? "";
    if (activeToken && activeSecret) {
      const webhook = await bindWebhook(activeToken, activeSecret);
      if (webhook) await sql`update reply_platform set webhook_url = ${webhook} where id = 1`;
    }
    await addEvent(sql, context.userId, "platform_bot_set");
    return loadWorkspace(context.userId);
  });

export const createTelegramLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await ensureUser(context.userId);
    const username = await resolveBotUsername(sql);
    if (!username) return { ok: false as const, reason: "bot_not_configured" as const };
    const token = crypto.randomUUID().replace(/-/g, "");
    await sql`update reply_telegram set link_token = ${token}, link_expires_at = now() + interval '20 minutes',
      updated_at = now() where user_id = ${context.userId}`;
    return { ok: true as const, url: `https://t.me/${username}?start=link_${token}` };
  });

export const refreshTelegram = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const token = await resolveBotToken();
    const sql = await ensureUser(context.userId);
    const rows = await sql<{ connection_id: string | null }>`
      select connection_id from reply_telegram where user_id = ${context.userId}`;
    const connectionId = rows[0]?.connection_id;
    if (!token) return { ok: false as const, reason: "bot_not_configured" as const };
    if (!connectionId) return { ok: false as const, reason: "no_connection" as const };
    const res = await fetch(`https://api.telegram.org/bot${token}/getBusinessConnection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_connection_id: connectionId }),
    });
    if (!res.ok) return { ok: false as const, reason: "telegram_error" as const };
    const body = (await res.json()) as {
      ok?: boolean;
      result?: { is_enabled?: boolean; rights?: { can_reply?: boolean } };
    };
    if (!body.ok || !body.result) return { ok: false as const, reason: "telegram_error" as const };
    const enabled = Boolean(body.result.is_enabled);
    const canReply = Boolean(body.result.rights?.can_reply);
    await sql`update reply_telegram set is_enabled = ${enabled}, can_reply = ${canReply},
      rights = ${JSON.stringify(body.result.rights ?? {})}, updated_at = now()
      where user_id = ${context.userId}`;
    await addEvent(sql, context.userId, enabled ? "connection_updated" : "connection_disabled");
    return { ok: true as const, workspace: await loadWorkspace(context.userId) };
  });

export const draftReply = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { inbound: string; thread: string }) => ({
    inbound: clipField(input.inbound, 4000),
    thread: clipField(input.thread, 2000),
  }))
  .handler(async ({ context, data }) => {
    const ws = await loadWorkspace(context.userId);
    const result = await completeReply(replyContext(ws), data.inbound, data.thread);
    const sql = await ensureUser(context.userId);
    if (result.provider === "local" || (result.provider === "grok" && result.reason !== "model_error")) {
      await bumpUsage(sql, context.userId, "credits", 1);
    }
    return result;
  });

export const saveFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { rating: number; note: string }) => ({
    rating: Math.max(1, Math.min(5, Math.round(Number(input.rating) || 0))),
    note: clipField(input.note, 200),
  }))
  .handler(async ({ context, data }) => {
    const sql = await ensureUser(context.userId);
    await sql`insert into reply_feedback (id, user_id, rating, note) values
      (${crypto.randomUUID()}, ${context.userId}, ${data.rating}, ${data.note})`;
    return { ok: true as const };
  });

export const deleteReplyData = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await ensureUser(context.userId);
    const id = context.userId;
    await sql`delete from reply_feedback where user_id = ${id}`;
    await sql`delete from reply_ledger where user_id = ${id}`;
    await sql`delete from reply_chats where user_id = ${id}`;
    await sql`delete from reply_usage_daily where user_id = ${id}`;
    await sql`delete from reply_events where user_id = ${id}`;
    await sql`delete from reply_products where user_id = ${id}`;
    await sql`delete from reply_telegram where user_id = ${id}`;
    await sql`delete from reply_profiles where user_id = ${id}`;
    return { ok: true as const };
  });
