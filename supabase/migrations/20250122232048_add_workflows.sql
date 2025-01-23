-- Create workflows table
create table workflows (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    description text,
    trigger jsonb not null,
    steps jsonb not null,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create workflow executions table for monitoring
create table workflow_executions (
    id uuid primary key default uuid_generate_v4(),
    workflow_id uuid references workflows(id) on delete cascade,
    trigger_type text not null,
    context jsonb not null,
    status text not null,
    started_at timestamptz default now(),
    completed_at timestamptz,
    error text,
    step_results jsonb
);

-- Create index for faster lookups
create index idx_workflow_executions_workflow_id on workflow_executions(workflow_id);
create index idx_workflow_executions_status on workflow_executions(status);
create index idx_workflow_executions_trigger_type on workflow_executions(trigger_type);

-- Enable RLS
alter table workflows enable row level security;
alter table workflow_executions enable row level security;

-- Create policies
create policy "Users can view workflows"
    on workflows for select
    using (
        exists (
            select 1 from team_members tm
            where tm.user_id = auth.uid()
            and tm.role in ('admin', 'agent')
        )
    );

create policy "Only admins can manage workflows"
    on workflows for all
    using (
        exists (
            select 1 from team_members tm
            where tm.user_id = auth.uid()
            and tm.role = 'admin'
        )
    );

create policy "Users can view workflow executions"
    on workflow_executions for select
    using (
        exists (
            select 1 from team_members tm
            where tm.user_id = auth.uid()
            and tm.role in ('admin', 'agent')
        )
    );

-- Add trigger for updated_at
create trigger update_workflows_updated_at
    before update on workflows
    for each row
    execute function update_updated_at_column(); 