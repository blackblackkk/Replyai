export const PLANS = ["free", "starter", "pro", "team"] as const;
export type PlanId = (typeof PLANS)[number];

export const PLAN_CREDITS: Record<PlanId, number> = {
  free: 40,
  starter: 500,
  pro: 2500,
  team: 10000,
};

export const PERSONALITIES = [
  "friendly",
  "business",
  "informal",
  "confident",
  "brief",
  "detailed",
  "selling",
] as const;
export type Personality = (typeof PERSONALITIES)[number];

export const AUTOMATION_MODES = ["suggest", "auto", "hybrid"] as const;
export type AutomationMode = (typeof AUTOMATION_MODES)[number];

export type Faq = { q: string; a: string };
export type Objection = { objection: string; answer: string };

export type Knowledge = {
  company: string;
  industry: string;
  audience: string;
  services: string;
  paymentMethods: string;
  timeline: string;
  geography: string;
  advantages: string;
  limitations: string;
  faqs: Faq[];
  objections: Objection[];
};

export type Product = {
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
};

export type StyleProfile = {
  greeting: string;
  length: string;
  lexicon: string;
  structure: string;
  objections: string;
  presentation: string;
  negotiation: string;
  closing: string;
};

export type Rules = {
  noGuarantees: boolean;
  noDiscounts: boolean;
  noPricesIfUnknown: boolean;
  noInternal: boolean;
  handoffComplex: boolean;
  blockedTopics: string;
};

export type TelegramView = {
  configured: boolean;
  botUsername: string | null;
  linked: boolean;
  connected: boolean;
  canReply: boolean;
  isEnabled: boolean;
  rights: Record<string, boolean>;
  updatedAt: string | null;
  isAdmin: boolean;
  adminClaimed: boolean;
  apiConfigured: boolean;
  aiConfigured: boolean;
  webhookReady: boolean;
};

export type ChatPolicy = {
  chatId: string;
  titleHint: string;
  allowAuto: boolean;
  lastSeenAt: string;
};

export type UsageDay = {
  day: string;
  inbound: number;
  replied: number;
  handoff: number;
  credits: number;
};

export type TechEvent = {
  id: number;
  kind: string;
  detail: string;
  createdAt: string;
};

export type Workspace = {
  plan: PlanId;
  creditsUsed: number;
  creditLimit: number;
  knowledge: Knowledge;
  personality: Personality;
  customInstructions: string;
  style: StyleProfile | null;
  styleConfirmed: boolean;
  rules: Rules;
  automation: {
    mode: AutomationMode;
    enabled: boolean;
    dailyCap: number;
    quietStart: string;
    quietEnd: string;
    handoffNote: string;
    paused: boolean;
  };
  telegram: TelegramView;
  products: Product[];
  chats: ChatPolicy[];
  events: TechEvent[];
  usage: UsageDay[];
  totals: { inbound: number; replied: number; handoff: number };
};

export type ReplyResult = {
  action: "reply" | "handoff";
  text: string;
  provider: "grok" | "local" | "rules";
  reason: string;
};

export const DEFAULT_RULES: Rules = {
  noGuarantees: true,
  noDiscounts: true,
  noPricesIfUnknown: true,
  noInternal: true,
  handoffComplex: true,
  blockedTopics: "",
};

export const EMPTY_KNOWLEDGE: Knowledge = {
  company: "",
  industry: "",
  audience: "",
  services: "",
  paymentMethods: "",
  timeline: "",
  geography: "",
  advantages: "",
  limitations: "",
  faqs: [],
  objections: [],
};
