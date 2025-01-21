-- Schema validation tests
create or replace function test_schema_validation()
returns boolean as $$
declare
  table_exists boolean;
  column_exists boolean;
begin
  -- Test tickets table
  select exists (
    select from information_schema.tables 
    where table_name = 'tickets'
  ) into table_exists;
  
  if not table_exists then
    raise exception 'Tickets table does not exist';
  end if;

  -- Test required columns
  select exists (
    select from information_schema.columns
    where table_name = 'tickets'
    and column_name = 'title'
  ) into column_exists;

  if not column_exists then
    raise exception 'Title column missing from tickets table';
  end if;

  return true;
end;
$$ language plpgsql;

-- RLS policy tests
create or replace function test_rls_policies()
returns boolean as $$
declare
  policy_exists boolean;
begin
  -- Test tickets table policies
  select exists (
    select from pg_policies
    where tablename = 'tickets'
    and policyname like 'tickets_%'
  ) into policy_exists;

  if not policy_exists then
    raise exception 'No RLS policies found for tickets table';
  end if;

  return true;
end;
$$ language plpgsql;

-- Relationship tests
create or replace function test_relationships()
returns boolean as $$
declare
  fk_exists boolean;
begin
  -- Test ticket to user relationship
  select exists (
    select from information_schema.table_constraints
    where table_name = 'tickets'
    and constraint_type = 'FOREIGN KEY'
  ) into fk_exists;

  if not fk_exists then
    raise exception 'Foreign key constraints missing from tickets table';
  end if;

  return true;
end;
$$ language plpgsql;

-- Realtime tests
create or replace function test_realtime_setup()
returns boolean as $$
declare
  trigger_exists boolean;
begin
  -- Test realtime triggers
  select exists (
    select from pg_trigger
    where tgname = 'ticket_update_notify'
  ) into trigger_exists;

  if not trigger_exists then
    raise exception 'Realtime trigger missing for tickets table';
  end if;

  return true;
end;
$$ language plpgsql;

-- Performance tests
create or replace function test_query_performance()
returns table (
  query_name text,
  execution_time_ms float
) as $$
declare
  start_time timestamptz;
  end_time timestamptz;
begin
  -- Test ticket search performance
  start_time := clock_timestamp();
  perform * from tickets where title ilike '%test%' limit 10;
  end_time := clock_timestamp();
  
  query_name := 'ticket_search';
  execution_time_ms := extract(epoch from (end_time - start_time)) * 1000;
  return next;

  -- Test conversation query performance
  start_time := clock_timestamp();
  perform * from conversations where ticket_id = (select id from tickets limit 1);
  end_time := clock_timestamp();
  
  query_name := 'conversation_query';
  execution_time_ms := extract(epoch from (end_time - start_time)) * 1000;
  return next;
end;
$$ language plpgsql;

-- Composite test runner
create or replace function run_all_tests()
returns table (
  test_name text,
  passed boolean,
  error_message text
) as $$
declare
  test_result boolean;
  error_text text;
begin
  -- Schema validation
  test_name := 'schema_validation';
  begin
    test_result := test_schema_validation();
    passed := true;
    error_message := null;
  exception when others then
    passed := false;
    error_message := SQLERRM;
  end;
  return next;

  -- RLS policies
  test_name := 'rls_policies';
  begin
    test_result := test_rls_policies();
    passed := true;
    error_message := null;
  exception when others then
    passed := false;
    error_message := SQLERRM;
  end;
  return next;

  -- Relationships
  test_name := 'relationships';
  begin
    test_result := test_relationships();
    passed := true;
    error_message := null;
  exception when others then
    passed := false;
    error_message := SQLERRM;
  end;
  return next;

  -- Realtime setup
  test_name := 'realtime_setup';
  begin
    test_result := test_realtime_setup();
    passed := true;
    error_message := null;
  exception when others then
    passed := false;
    error_message := SQLERRM;
  end;
  return next;
end;
$$ language plpgsql;
