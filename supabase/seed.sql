-- Seed Teams
insert into teams (id, name, description) values
    ('11111111-1111-1111-1111-111111111111', 'Support Team', 'Main customer support team'),
    ('22222222-2222-2222-2222-222222222222', 'Technical Team', 'Technical support and escalations');

-- Seed Tickets
insert into tickets (id, title, description, status, priority, team_id) values
    ('33333333-3333-3333-3333-333333333333', 'Login Issue', 'User unable to login to the system', 'open', 'high', '11111111-1111-1111-1111-111111111111'),
    ('44444444-4444-4444-4444-444444444444', 'Performance Problem', 'System running slowly during peak hours', 'in_progress', 'medium', '22222222-2222-2222-2222-222222222222');

-- Seed Ticket Metadata
insert into ticket_metadata (ticket_id, key, value) values
    ('33333333-3333-3333-3333-333333333333', 'browser', 'Chrome 120.0'),
    ('33333333-3333-3333-3333-333333333333', 'os', 'Windows 11'),
    ('44444444-4444-4444-4444-444444444444', 'server', 'prod-web-01'),
    ('44444444-4444-4444-4444-444444444444', 'component', 'database');

-- Seed Ticket History
insert into ticket_history (ticket_id, action, details) values
    ('33333333-3333-3333-3333-333333333333', 'created', '{"status": "open", "priority": "high"}'),
    ('44444444-4444-4444-4444-444444444444', 'created', '{"status": "open", "priority": "medium"}'),
    ('44444444-4444-4444-4444-444444444444', 'status_changed', '{"from": "open", "to": "in_progress"}');

-- Seed Conversations
insert into conversations (ticket_id, message) values
    ('33333333-3333-3333-3333-333333333333', 'Initial report: User is getting 403 error when attempting to login.'),
    ('44444444-4444-4444-4444-444444444444', 'System monitoring shows increased latency in database queries.'); 