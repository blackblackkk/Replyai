create table if not exists reply_profiles (
  user_id text primary key,
  plan text not null default 'free',
  company text not null default '',
  industry text not null default '',
  audience text not null default '',
  services text not null default '',
  payment_methods text not null default '',
  timeline text not null default '',
  geography text not null default '',
  advantages text not null default '',
  limitations text not null default '',
  faqs text not null default '[]',
  objections text not null default '[]',
  personality text not null default 'business',
  custom_instructions text not null default '',
  style_profile text,
  style_confirmed boolean not null default false,
  rules text not null default '{}',
  automation_mode text not null default 'suggest',
  automation_enabled boolean not null default false,
  daily_cap integer not null default 20,
  quiet_start text not null default '',
  quiet_end text not null default '',
  handoff_note text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists reply_products (
  id text primary key,
  user_id text not null,
  name text not null,
  description text not null default '',
  price text not null default '',
  currency text not null default 'USD',
  terms text not null default '',
  timeline text not null default '',
  constraints text not null default '',
  options text not null default '',
  faqs text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists reply_products_user_idx on reply_products (user_id);

create table if not exists reply_telegram (
  user_id text primary key,
  telegram_user_id text,
  user_chat_id text,
  connection_id text,
  is_enabled boolean not null default false,
  can_reply boolean not null default false,
  rights text not null default '{}',
  link_token text,
  link_expires_at timestamptz,
  paused boolean not null default false,
  updated_at timestamptz not null default now()
);
create unique index if not exists reply_telegram_tg_user_idx
  on reply_telegram (telegram_user_id) where telegram_user_id is not null;
create unique index if not exists reply_telegram_conn_idx
  on reply_telegram (connection_id) where connection_id is not null;

create table if not exists reply_unclaimed (
  telegram_user_id text primary key,
  connection_id text not null,
  user_chat_id text not null,
  is_enabled boolean not null default false,
  can_reply boolean not null default false,
  rights text not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists reply_chats (
  user_id text not null,
  chat_id text not null,
  title_hint text not null default '',
  allow_auto boolean not null default true,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, chat_id)
);

create table if not exists reply_events (
  id serial primary key,
  user_id text not null,
  kind text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists reply_events_user_idx on reply_events (user_id, id desc);

create table if not exists reply_usage_daily (
  user_id text not null,
  day date not null,
  inbound integer not null default 0,
  replied integer not null default 0,
  handoff integer not null default 0,
  credits integer not null default 0,
  primary key (user_id, day)
);

create table if not exists reply_update_seen (
  update_id text primary key,
  seen_at timestamptz not null default now()
);

create table if not exists reply_ledger (
  user_id text not null,
  chat_id text not null,
  message_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, chat_id, message_id)
);

create table if not exists reply_feedback (
  id text primary key,
  user_id text not null,
  rating integer not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
