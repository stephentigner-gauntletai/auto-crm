-- Enable RLS on all tables
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tickets enable row level security;
alter table ticket_history enable row level security;
alter table ticket_metadata enable row level security;
alter table conversations enable row level security;

-- Create user roles enum
create type user_role as enum ('admin', 'agent', 'customer');

-- Add role column to auth.users
alter table auth.users add column if not exists role user_role not null default 'customer';

-- Helper function to check if user is admin
create or replace function is_admin()
returns boolean as $$
begin
  return (select role = 'admin' from auth.users where id = auth.uid());
end;
$$ language plpgsql security definer;

-- Helper function to check if user is agent
create or replace function is_agent()
returns boolean as $$
begin
  return (select role = 'agent' from auth.users where id = auth.uid());
end;
$$ language plpgsql security definer;

-- Helper function to check if user is team member
create or replace function is_team_member(team_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from team_members
    where team_id = $1 and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Teams Policies
create policy "Admins can manage teams"
  on teams
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Team members can view their teams"
  on teams
  for select
  to authenticated
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    )
  );

-- Team Members Policies
create policy "Admins can manage team members"
  on team_members
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Users can view their team memberships"
  on team_members
  for select
  to authenticated
  using (user_id = auth.uid());

-- Tickets Policies
create policy "Admins have full access to tickets"
  on tickets
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Agents can view and update assigned tickets"
  on tickets
  for select
  to authenticated
  using (
    is_agent() and (
      assigned_to = auth.uid() or
      is_team_member(team_id)
    )
  );

create policy "Agents can update assigned tickets"
  on tickets
  for update
  to authenticated
  using (
    is_agent() and (
      assigned_to = auth.uid() or
      is_team_member(team_id)
    )
  )
  with check (
    is_agent() and (
      assigned_to = auth.uid() or
      is_team_member(team_id)
    )
  );

create policy "Customers can view their own tickets"
  on tickets
  for select
  to authenticated
  using (created_by = auth.uid());

create policy "Customers can create tickets"
  on tickets
  for insert
  to authenticated
  with check (
    auth.uid() is not null and
    created_by = auth.uid()
  );

-- Ticket History Policies
create policy "Ticket history visible to ticket participants"
  on ticket_history
  for select
  to authenticated
  using (
    exists (
      select 1 from tickets
      where tickets.id = ticket_history.ticket_id
      and (
        tickets.created_by = auth.uid() or
        tickets.assigned_to = auth.uid() or
        is_team_member(tickets.team_id) or
        is_admin()
      )
    )
  );

create policy "Agents and admins can create ticket history"
  on ticket_history
  for insert
  to authenticated
  with check (
    exists (
      select 1 from tickets
      where tickets.id = ticket_history.ticket_id
      and (
        tickets.assigned_to = auth.uid() or
        is_team_member(tickets.team_id) or
        is_admin()
      )
    )
  );

-- Ticket Metadata Policies
create policy "Ticket metadata visible to ticket participants"
  on ticket_metadata
  for select
  to authenticated
  using (
    exists (
      select 1 from tickets
      where tickets.id = ticket_metadata.ticket_id
      and (
        tickets.created_by = auth.uid() or
        tickets.assigned_to = auth.uid() or
        is_team_member(tickets.team_id) or
        is_admin()
      )
    )
  );

create policy "Agents and admins can manage ticket metadata"
  on ticket_metadata
  for all
  to authenticated
  using (
    exists (
      select 1 from tickets
      where tickets.id = ticket_metadata.ticket_id
      and (
        tickets.assigned_to = auth.uid() or
        is_team_member(tickets.team_id) or
        is_admin()
      )
    )
  )
  with check (
    exists (
      select 1 from tickets
      where tickets.id = ticket_metadata.ticket_id
      and (
        tickets.assigned_to = auth.uid() or
        is_team_member(tickets.team_id) or
        is_admin()
      )
    )
  );

-- Conversations Policies
create policy "Conversation visible to ticket participants"
  on conversations
  for select
  to authenticated
  using (
    exists (
      select 1 from tickets
      where tickets.id = conversations.ticket_id
      and (
        tickets.created_by = auth.uid() or
        tickets.assigned_to = auth.uid() or
        is_team_member(tickets.team_id) or
        is_admin()
      )
    )
  );

create policy "Users can create conversations on their tickets"
  on conversations
  for insert
  to authenticated
  with check (
    exists (
      select 1 from tickets
      where tickets.id = conversations.ticket_id
      and (
        tickets.created_by = auth.uid() or
        tickets.assigned_to = auth.uid() or
        is_team_member(tickets.team_id) or
        is_admin()
      )
    )
  );

create policy "Users can update their own messages"
  on conversations
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Set up authentication triggers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
