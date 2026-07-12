-- Retire the prototype text-based employee registry. The authoritative model
-- is now profiles + shop_members + employee_invitations.

do $$
declare
  policy_record record;
begin
  if to_regclass('public.employees') is null then
    return;
  end if;

  alter table public.employees enable row level security;

  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'employees'
  loop
    execute format('drop policy if exists %I on public.employees', policy_record.policyname);
  end loop;

  revoke all privileges on table public.employees from public, anon, authenticated;

  comment on table public.employees is
    'Locked legacy prototype table. Do not use; employee identity and access live in profiles and shop_members.';
end;
$$;
