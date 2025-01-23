-- Create notifications table
create table notifications (
    id uuid primary key default uuid_generate_v4(),
    type text not null check (type in ('email', 'in_app', 'webhook')),
    recipients text[] not null,
    template text not null,
    context jsonb not null,
    status text not null check (status in ('sent', 'failed')),
    error text,
    metadata jsonb,
    created_at timestamptz default now()
);

-- Create user_notifications table
create table user_notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    type text not null,
    message text not null,
    data jsonb,
    read boolean default false,
    created_at timestamptz default now()
);

-- Create indexes
create index idx_notifications_type on notifications(type);
create index idx_notifications_status on notifications(status);
create index idx_user_notifications_user_id on user_notifications(user_id);
create index idx_user_notifications_read on user_notifications(read);

-- Enable RLS
alter table notifications enable row level security;
alter table user_notifications enable row level security;

-- Create RLS policies
create policy "Notifications are viewable by team members"
    on notifications for select
    using (
        exists (
            select 1 from team_members
            where team_members.user_id = auth.uid()
        )
    );

create policy "User notifications are viewable by the user"
    on user_notifications for select
    using (user_id = auth.uid());

create policy "User notifications are updatable by the user"
    on user_notifications for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid()); 