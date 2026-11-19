alter table reply_profiles alter column daily_cap set default 200;
update reply_profiles set daily_cap = 200 where daily_cap = 20;
