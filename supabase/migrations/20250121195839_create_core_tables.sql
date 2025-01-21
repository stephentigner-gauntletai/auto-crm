-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create teams table
create table teams (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create team_members table
create table team_members (
    id uuid primary key default uuid_generate_v4(),
    team_id uuid references teams(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    role text not null check (role in ('admin', 'member')),
    created_at timestamptz default now(),
    unique(team_id, user_id)
);

-- Create tickets table
create table tickets (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    status text not null check (status in ('open', 'in_progress', 'resolved', 'closed')),
    priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    created_by uuid references auth.users(id),
    assigned_to uuid references auth.users(id),
    team_id uuid references teams(id) on delete set null
);

-- Create ticket_history table
create table ticket_history (
    id uuid primary key default uuid_generate_v4(),
    ticket_id uuid references tickets(id) on delete cascade,
    user_id uuid references auth.users(id),
    action text not null,
    details jsonb,
    created_at timestamptz default now()
);

-- Create ticket_metadata table
create table ticket_metadata (
    id uuid primary key default uuid_generate_v4(),
    ticket_id uuid references tickets(id) on delete cascade,
    key text not null,
    value text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(ticket_id, key)
);

-- Create conversations table
create table conversations (
    id uuid primary key default uuid_generate_v4(),
    ticket_id uuid references tickets(id) on delete cascade,
    user_id uuid references auth.users(id),
    message text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create indexes
create index idx_tickets_status on tickets(status);
create index idx_tickets_priority on tickets(priority);
create index idx_tickets_assigned_to on tickets(assigned_to);
create index idx_tickets_team_id on tickets(team_id);
create index idx_ticket_history_ticket_id on ticket_history(ticket_id);
create index idx_conversations_ticket_id on conversations(ticket_id);
create index idx_team_members_user_id on team_members(user_id);

-- Add updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger update_tickets_updated_at
    before update on tickets
    for each row
    execute function update_updated_at_column();

create trigger update_teams_updated_at
    before update on teams
    for each row
    execute function update_updated_at_column();

create trigger update_ticket_metadata_updated_at
    before update on ticket_metadata
    for each row
    execute function update_updated_at_column();

create trigger update_conversations_updated_at
    before update on conversations
    for each row
    execute function update_updated_at_column();
