-- supabase/migrations/0002_clients_grouping.sql

alter table clients
  add column niche text,
  add column service_type text
    check (service_type in ('trafego', 'conteudo', 'chamadas', '360', 'outro')),
  add column assigned_to uuid references agency_members(id) on delete set null,
  add column health text not null default 'green'
    check (health in ('green', 'yellow', 'red'));
