-- Dados coletados no onboarding; mantidos nulos para agências já existentes.
alter table public.agencies
  add column niche text,
  add column team_size text check (team_size in ('1', '2-5', '6-10', '11+'));

-- Cria agência e membership na mesma transação, sem abrir INSERT direto nas tabelas.
create function public.create_agency_for_current_user(
  p_name text,
  p_niche text,
  p_team_size text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_user_id uuid;
  new_agency_id uuid;
begin
  select users.id
    into current_user_id
    from auth.users as users
    where users.id = auth.uid()
    for update;

  if current_user_id is null then
    raise exception 'É necessário entrar na conta para criar uma agência.';
  end if;

  if nullif(btrim(p_name), '') is null or length(btrim(p_name)) > 80 then
    raise exception 'Informe um nome de agência válido.';
  end if;

  if nullif(btrim(p_niche), '') is null or length(btrim(p_niche)) > 100 then
    raise exception 'Informe um nicho válido.';
  end if;

  if p_team_size is null or p_team_size not in ('1', '2-5', '6-10', '11+') then
    raise exception 'Selecione um tamanho de equipe válido.';
  end if;

  if exists (
    select 1
      from public.agency_members as members
      where members.user_id = current_user_id
  ) then
    raise exception 'Este usuário já está vinculado a uma agência.';
  end if;

  insert into public.agencies (name, niche, team_size)
    values (btrim(p_name), btrim(p_niche), p_team_size)
    returning id into new_agency_id;

  insert into public.agency_members (agency_id, user_id, role)
    values (new_agency_id, current_user_id, 'owner');

  return new_agency_id;
end;
$$;

revoke all on function public.create_agency_for_current_user(text, text, text) from public;
revoke all on function public.create_agency_for_current_user(text, text, text) from anon;
grant execute on function public.create_agency_for_current_user(text, text, text) to authenticated;
