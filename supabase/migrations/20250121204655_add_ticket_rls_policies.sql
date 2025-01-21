-- Add customer_id column to tickets table
alter table tickets 
add column if not exists customer_id uuid references auth.users(id);

-- Update existing tickets to have a default customer (if any exist)
update tickets 
set customer_id = (select id from auth.users limit 1)
where customer_id is null;

-- Enable RLS on tickets table
alter table tickets enable row level security;

-- Policy for admins (full access)
create policy "tickets_admin_all"
  on tickets
  as permissive
  for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin');

-- Policy for agents to view all tickets
create policy "tickets_agent_select"
  on tickets
  as permissive
  for select
  to authenticated
  using (auth.jwt() ->> 'role' = 'agent');

-- Policy for agents to update assigned tickets
create policy "tickets_agent_update"
  on tickets
  as permissive
  for update
  to authenticated
  using (auth.jwt() ->> 'role' = 'agent' and assigned_to = auth.uid());

-- Policy for customers to view their own tickets
create policy "tickets_customer_select"
  on tickets
  as permissive
  for select
  to authenticated
  using (customer_id = auth.uid());

-- Policy for customers to create tickets
create policy "tickets_customer_insert"
  on tickets
  as permissive
  for insert
  to authenticated
  with check (
    auth.jwt() ->> 'role' = 'customer' 
    and customer_id = auth.uid()
  );
