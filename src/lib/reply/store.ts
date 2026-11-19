import { getSql, type Sql } from "@/lib/db";
import {
  AUTOMATION_MODES,
  DEFAULT_RULES,
  EMPTY_KNOWLEDGE,
  PERSONALITIES,
  PLAN_CREDITS,
  PLANS,
  type AutomationMode,
  type Faq,
  type Knowledge,
  type Objection,
  type Personality,
  type PlanId,
  type Product,
  type Rules,
  type StyleProfile,
  type Workspace,
} from "./types";

type ProfileRow = {
  plan: string;
  company: string;
  industry: string;
  audience: string;
  services: string;
  payment_methods: string;
  timeline: string;
  geography: string;
  advantages: string;
  limitations: string;
  faqs: string;
  objections: string;
  personality: string;
  custom_instructions: string;
  style_profile: string | null;
  style_confirmed: boolean;
  rules: string;
  automation_mode: string;
  automation_enabled: boolean;
  daily_cap: number;
  quiet_start: string;
  quiet_end: string;
  handoff_note: string;
};

function text(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function bool(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1;
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function readJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function asPlan(value: string): PlanId {
  return (PLANS as readonly string[]).includes(value) ? (value as PlanId) : "free";
}

function asPersonality(value: string): Personality {
  return (PERSONALITIES as readonly string[]).includes(value) ? (value as Personality) : "business";
}

function asMode(value: string): AutomationMode {
  return (AUTOMATION_MODES as readonly string[]).includes(value) ? (value as AutomationMode) : "suggest";
}

function asFaqs(raw: unknown): Faq[] {
  const rows = readJson<unknown[]>(raw, []);
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const item = row as { q?: unknown; a?: unknown };
      return { q: text(item?.q).slice(0, 400), a: text(item?.a).slice(0, 800) };
    })
    .filter((item) => item.q || item.a)
    .slice(0, 40);
}

function asObjections(raw: unknown): Objection[] {
  const rows = readJson<unknown[]>(raw, []);
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const item = row as { objection?: unknown; answer?: unknown };
      return { objection: text(item?.objection).slice(0, 400), answer: text(item?.answer).slice(0, 800) };
    })
    .filter((item) => item.objection || item.answer)
    .slice(0, 40);
}

function asRules(raw: unknown): Rules {
  const parsed = readJson<Partial<Rules>>(raw, {});
  return {
    noGuarantees: parsed.noGuarantees !== false,
    noDiscounts: parsed.noDiscounts !== false,
    noPricesIfUnknown: parsed.noPricesIfUnknown !== false,
    noInternal: parsed.noInternal !== false,
    handoffComplex: parsed.handoffComplex !== false,
    blockedTopics: text(parsed.blockedTopics).slice(0, 500),
  };
}

function asStyle(raw: unknown): StyleProfile | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const parsed = readJson<Partial<StyleProfile> | null>(raw, null);
  if (!parsed) return null;
  return {
    greeting: text(parsed.greeting).slice(0, 180),
    length: text(parsed.length).slice(0, 180),
    lexicon: text(parsed.lexicon).slice(0, 180),
    structure: text(parsed.structure).slice(0, 180),
    objections: text(parsed.objections).slice(0, 180),
    presentation: text(parsed.presentation).slice(0, 180),
    negotiation: text(parsed.negotiation).slice(0, 180),
    closing: text(parsed.closing).slice(0, 180),
  };
}

export function normalizeBotUsername(raw: string): string | null {
  const name = raw.trim().replace(/^@/, "");
  return /^[A-Za-z0-9_]{5,32}$/.test(name) ? name : null;
}

export async function resolveBotUsername(sql: Sql): Promise<string | null> {
  const fromEnv = normalizeBotUsername(process.env.TELEGRAM_BOT_USERNAME ?? "");
  if (fromEnv) return fromEnv;
  const rows = await sql<{ bot_username: string }>`select bot_username from reply_platform where id = 1`;
  return normalizeBotUsername(text(rows[0]?.bot_username));
}

const BOT_TOKEN = /^\d{5,16}:[A-Za-z0-9_-]{20,120}$/;

export async function resolveBotToken(): Promise<string | null> {
  const fromEnv = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  if (BOT_TOKEN.test(fromEnv)) return fromEnv;
  const sql = await getSql();
  const rows = await sql<{ bot_token: string }>`select bot_token from reply_platform where id = 1`;
  const token = text(rows[0]?.bot_token);
  return BOT_TOKEN.test(token) ? token : null;
}

export async function resolveWebhookSecret(): Promise<string | null> {
  const fromEnv = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "";
  if (/^[A-Za-z0-9_-]{8,256}$/.test(fromEnv)) return fromEnv;
  const sql = await getSql();
  const rows = await sql<{ webhook_secret: string }>`select webhook_secret from reply_platform where id = 1`;
  const secret = text(rows[0]?.webhook_secret);
  return /^[A-Za-z0-9_-]{8,256}$/.test(secret) ? secret : null;
}

export async function resolveXaiKey(): Promise<string | null> {
  const sql = await getSql();
  const rows = await sql<{ xai_api_key: string }>`select xai_api_key from reply_platform where id = 1`;
  const saved = text(rows[0]?.xai_api_key);
  if (saved.length >= 20 && saved.length <= 200 && !/\s/.test(saved)) return saved;
  const fromEnv = process.env.XAI_API_KEY?.trim() ?? "";
  if (fromEnv.length >= 20 && fromEnv.length <= 200 && !/\s/.test(fromEnv)) return fromEnv;
  return null;
}

export async function ensureUser(userId: string): Promise<Sql> {
  const sql = await getSql();
  await sql`insert into reply_profiles (user_id) values (${userId}) on conflict (user_id) do nothing`;
  await sql`insert into reply_telegram (user_id) values (${userId}) on conflict (user_id) do nothing`;
  return sql;
}

export async function addEvent(sql: Sql, userId: string, kind: string, detail = ""): Promise<void> {
  await sql`insert into reply_events (user_id, kind, detail) values (${userId}, ${kind.slice(0, 64)}, ${detail.slice(0, 120)})`;
}

export async function bumpUsage(
  sql: Sql,
  userId: string,
  field: "inbound" | "replied" | "handoff" | "credits",
  amount = 1,
): Promise<void> {
  if (field === "inbound") {
    await sql`insert into reply_usage_daily (user_id, day, inbound) values (${userId}, current_date, ${amount})
      on conflict (user_id, day) do update set inbound = reply_usage_daily.inbound + ${amount}`;
  } else if (field === "replied") {
    await sql`insert into reply_usage_daily (user_id, day, replied) values (${userId}, current_date, ${amount})
      on conflict (user_id, day) do update set replied = reply_usage_daily.replied + ${amount}`;
  } else if (field === "handoff") {
    await sql`insert into reply_usage_daily (user_id, day, handoff) values (${userId}, current_date, ${amount})
      on conflict (user_id, day) do update set handoff = reply_usage_daily.handoff + ${amount}`;
  } else {
    await sql`insert into reply_usage_daily (user_id, day, credits) values (${userId}, current_date, ${amount})
      on conflict (user_id, day) do update set credits = reply_usage_daily.credits + ${amount}`;
  }
}

export async function loadWorkspace(userId: string): Promise<Workspace> {
  const sql = await ensureUser(userId);
  const profiles = await sql<ProfileRow>`select plan, company, industry, audience, services, payment_methods, timeline,
    geography, advantages, limitations, faqs, objections, personality, custom_instructions, style_profile,
    style_confirmed, rules, automation_mode, automation_enabled, daily_cap, quiet_start, quiet_end, handoff_note
    from reply_profiles where user_id = ${userId}`;
  const profile = profiles[0];
  const plan = asPlan(text(profile?.plan));
  const tgRows = await sql<{
    telegram_user_id: string | null;
    connection_id: string | null;
    is_enabled: boolean;
    can_reply: boolean;
    rights: string;
    paused: boolean;
    updated_at: string;
  }>`select telegram_user_id, connection_id, is_enabled, can_reply, rights, paused, updated_at::text as updated_at
    from reply_telegram where user_id = ${userId}`;
  const tg = tgRows[0];
  const products = await sql<{
    id: string;
    name: string;
    description: string;
    price: string;
    currency: string;
    terms: string;
    timeline: string;
    constraints: string;
    options: string;
    faqs: string;
  }>`select id, name, description, price, currency, terms, timeline, constraints, options, faqs
    from reply_products where user_id = ${userId} order by created_at asc`;
  const chats = await sql<{
    chat_id: string;
    title_hint: string;
    allow_auto: boolean;
    last_seen_at: string;
  }>`select chat_id, title_hint, allow_auto, last_seen_at::text as last_seen_at
    from reply_chats where user_id = ${userId} order by last_seen_at desc limit 30`;
  const events = await sql<{ id: number; kind: string; detail: string; created_at: string }>`
    select id, kind, detail, created_at::text as created_at from reply_events
    where user_id = ${userId} order by id desc limit 12`;
  const usage = await sql<{
    day: string;
    inbound: number;
    replied: number;
    handoff: number;
    credits: number;
  }>`select day::text as day, inbound, replied, handoff, credits from reply_usage_daily
    where user_id = ${userId} and day >= current_date - 13 order by day asc`;
  const totalsRows = await sql<{ inbound: number; replied: number; handoff: number; credits: number }>`
    select coalesce(sum(inbound), 0) as inbound, coalesce(sum(replied), 0) as replied,
      coalesce(sum(handoff), 0) as handoff, coalesce(sum(credits), 0) as credits
    from reply_usage_daily where user_id = ${userId}`;
  const totals = totalsRows[0];
  const knowledge: Knowledge = {
    ...EMPTY_KNOWLEDGE,
    company: text(profile?.company),
    industry: text(profile?.industry),
    audience: text(profile?.audience),
    services: text(profile?.services),
    paymentMethods: text(profile?.payment_methods),
    timeline: text(profile?.timeline),
    geography: text(profile?.geography),
    advantages: text(profile?.advantages),
    limitations: text(profile?.limitations),
    faqs: asFaqs(profile?.faqs),
    objections: asObjections(profile?.objections),
  };
  const rights = readJson<Record<string, boolean>>(tg?.rights, {});
  const username = await resolveBotUsername(sql);
  const platform = await sql<{
    owner_user_id: string | null;
    bot_token: string | null;
    xai_api_key: string | null;
    webhook_url: string | null;
  }>`select owner_user_id, bot_token, xai_api_key, webhook_url from reply_platform where id = 1`;
  const ownerId = text(platform[0]?.owner_user_id);
  const tokenReady = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()) || text(platform[0]?.bot_token).includes(":");
  const aiReady = Boolean(process.env.XAI_API_KEY?.trim()) || text(platform[0]?.xai_api_key).length >= 20;
  const webhookReady = text(platform[0]?.webhook_url).startsWith("https://");
  return {
    plan,
    creditsUsed: num(totals?.credits),
    creditLimit: PLAN_CREDITS[plan],
    knowledge,
    personality: asPersonality(text(profile?.personality)),
    customInstructions: text(profile?.custom_instructions),
    style: profile?.style_confirmed ? asStyle(profile.style_profile) : asStyle(profile?.style_profile),
    styleConfirmed: bool(profile?.style_confirmed),
    rules: asRules(profile?.rules ?? JSON.stringify(DEFAULT_RULES)),
    automation: {
      mode: asMode(text(profile?.automation_mode)),
      enabled: bool(profile?.automation_enabled),
      dailyCap: Math.max(1, Math.min(500, num(profile?.daily_cap) || 200)),
      quietStart: text(profile?.quiet_start),
      quietEnd: text(profile?.quiet_end),
      handoffNote: text(profile?.handoff_note),
      paused: bool(tg?.paused),
    },
    telegram: {
      configured: Boolean(username),
      botUsername: username,
      linked: Boolean(tg?.telegram_user_id),
      connected: Boolean(tg?.connection_id) && bool(tg?.is_enabled),
      canReply: bool(tg?.can_reply),
      isEnabled: bool(tg?.is_enabled),
      rights,
      updatedAt: tg?.updated_at ? text(tg.updated_at) : null,
      isAdmin: ownerId !== "" && ownerId === userId,
      adminClaimed: ownerId !== "",
      apiConfigured: tokenReady,
      aiConfigured: aiReady,
      webhookReady,
    },
    products: products.map((p) => ({
      id: text(p.id),
      name: text(p.name),
      description: text(p.description),
      price: text(p.price),
      currency: text(p.currency) || "USD",
      terms: text(p.terms),
      timeline: text(p.timeline),
      constraints: text(p.constraints),
      options: text(p.options),
      faqs: text(p.faqs),
    })),
    chats: chats.map((c) => ({
      chatId: text(c.chat_id),
      titleHint: text(c.title_hint),
      allowAuto: bool(c.allow_auto),
      lastSeenAt: text(c.last_seen_at),
    })),
    events: events.map((e) => ({
      id: num(e.id),
      kind: text(e.kind),
      detail: text(e.detail),
      createdAt: text(e.created_at),
    })),
    usage: usage.map((u) => ({
      day: text(u.day),
      inbound: num(u.inbound),
      replied: num(u.replied),
      handoff: num(u.handoff),
      credits: num(u.credits),
    })),
    totals: {
      inbound: num(totals?.inbound),
      replied: num(totals?.replied),
      handoff: num(totals?.handoff),
    },
  };
}

export function clipField(value: unknown, max: number): string {
  return text(value).trim().slice(0, max);
}

export function knowledgeFrom(input: Knowledge): Knowledge {
  return {
    company: clipField(input.company, 160),
    industry: clipField(input.industry, 160),
    audience: clipField(input.audience, 400),
    services: clipField(input.services, 2000),
    paymentMethods: clipField(input.paymentMethods, 400),
    timeline: clipField(input.timeline, 400),
    geography: clipField(input.geography, 200),
    advantages: clipField(input.advantages, 800),
    limitations: clipField(input.limitations, 800),
    faqs: asFaqs(JSON.stringify(input.faqs ?? [])),
    objections: asObjections(JSON.stringify(input.objections ?? [])),
  };
}
