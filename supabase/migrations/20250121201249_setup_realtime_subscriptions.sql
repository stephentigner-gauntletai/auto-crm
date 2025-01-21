-- Enable realtime for specific tables
alter publication supabase_realtime add table tickets;
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table ticket_history;

-- Create channels for specific updates
create or replace function notify_ticket_update()
returns trigger as $$
begin
  perform pg_notify(
    'ticket_updates',
    json_build_object(
      'type', 'ticket_update',
      'ticket_id', NEW.id,
      'status', NEW.status,
      'priority', NEW.priority,
      'team_id', NEW.team_id,
      'assigned_to', NEW.assigned_to
    )::text
  );
  return NEW;
end;
$$ language plpgsql;

create or replace function notify_conversation_update()
returns trigger as $$
begin
  perform pg_notify(
    'chat_updates',
    json_build_object(
      'type', 'chat_update',
      'ticket_id', NEW.ticket_id,
      'message_id', NEW.id,
      'user_id', NEW.user_id
    )::text
  );
  return NEW;
end;
$$ language plpgsql;

create or replace function notify_ticket_history()
returns trigger as $$
begin
  perform pg_notify(
    'notification_updates',
    json_build_object(
      'type', 'history_update',
      'ticket_id', NEW.ticket_id,
      'action', NEW.action,
      'user_id', NEW.user_id
    )::text
  );
  return NEW;
end;
$$ language plpgsql;

-- Create triggers for realtime notifications
create trigger ticket_update_notify
  after insert or update on tickets
  for each row
  execute function notify_ticket_update();

create trigger conversation_update_notify
  after insert on conversations
  for each row
  execute function notify_conversation_update();

create trigger ticket_history_notify
  after insert on ticket_history
  for each row
  execute function notify_ticket_history();

-- Set up rate limiting for realtime subscriptions
create or replace function check_subscription_rate_limit()
returns trigger as $$
declare
  rate_limit_count int;
  rate_limit_period interval = interval '1 minute';
begin
  select count(*)
  into rate_limit_count
  from pg_stat_activity
  where application_name like 'realtime%'
    and backend_start > now() - rate_limit_period
    and usename = current_user;

  if rate_limit_count > 100 then
    raise exception 'Rate limit exceeded for realtime subscriptions';
  end if;

  return NEW;
end;
$$ language plpgsql;

-- Create user presence tracking
create table if not exists user_presence (
  id uuid primary key references auth.users(id) on delete cascade,
  last_seen timestamptz default now(),
  status text default 'online'
);

-- Function to update user presence
create or replace function update_user_presence()
returns trigger as $$
begin
  insert into user_presence (id, last_seen, status)
  values (NEW.id, now(), 'online')
  on conflict (id) do update
  set last_seen = now(),
      status = 'online';
  return NEW;
end;
$$ language plpgsql;

-- Trigger for user presence
create trigger user_presence_update
  after insert or update on auth.users
  for each row
  execute function update_user_presence();

-- Function to mark users as offline (will be called by application logic)
create or replace function mark_inactive_users() returns void as $$
begin
  update user_presence
  set status = 'offline'
  where last_seen < now() - interval '5 minutes';
end;
$$ language plpgsql;
