create table if not exists reply_platform (
  id integer primary key,
  bot_username text not null default ''
);

insert into reply_platform (id, bot_username) values (1, '')
on conflict (id) do nothing;
