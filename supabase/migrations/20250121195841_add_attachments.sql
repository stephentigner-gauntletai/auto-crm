-- Create attachments table
create table attachments (
    id uuid primary key default uuid_generate_v4(),
    ticket_id uuid references tickets(id) on delete cascade,
    user_id uuid references auth.users(id),
    file_name text not null,
    file_size bigint not null,
    content_type text not null,
    storage_path text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create index for faster lookups
create index idx_attachments_ticket_id on attachments(ticket_id);

-- Enable RLS
alter table attachments enable row level security;

-- Create policies
create policy "Users can view attachments for tickets they have access to"
    on attachments for select
    using (
        exists (
            select 1 from tickets t
            inner join team_members tm on t.team_id = tm.team_id
            where t.id = attachments.ticket_id
            and tm.user_id = auth.uid()
        )
    );

create policy "Users can upload attachments for tickets they have access to"
    on attachments for insert
    with check (
        exists (
            select 1 from tickets t
            inner join team_members tm on t.team_id = tm.team_id
            where t.id = ticket_id
            and tm.user_id = auth.uid()
        )
    );

create policy "Users can delete their own attachments"
    on attachments for delete
    using (
        user_id = auth.uid()
    );

-- Add trigger for updated_at
create trigger update_attachments_updated_at
    before update on attachments
    for each row
    execute function update_updated_at_column(); 