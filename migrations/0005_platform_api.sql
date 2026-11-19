alter table reply_platform add column if not exists bot_token text not null default '';
alter table reply_platform add column if not exists webhook_secret text not null default '';
alter table reply_platform add column if not exists xai_api_key text not null default '';
alter table reply_platform add column if not exists webhook_url text not null default '';
