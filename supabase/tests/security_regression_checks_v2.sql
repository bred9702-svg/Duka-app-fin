-- DUKWISE CONSOLIDATED SECURITY TESTS V2
-- Dukwise security regression checks (read-only).
-- Run after all migrations. Supabase will display one consolidated result set.

with
tenant_tables(table_name) as (
  values
    ('profiles'), ('shops'), ('shop_members'), ('subscriptions'),
    ('employee_invitations'), ('products'), ('customers'), ('transactions'),
    ('stock_purchases'), ('stock_purchase_items'),
    ('shop_business_preferences'), ('account_deletion_requests'),
    ('security_events')
),
rls_checks as (
  select
    'RLS enabled: ' || tenant_tables.table_name as check_name,
    case when c.oid is not null and c.relrowsecurity then 'PASS' else 'FAIL' end as result
  from tenant_tables
  left join pg_class c
    on c.relname = tenant_tables.table_name
    and c.relnamespace = 'public'::regnamespace
),
anonymous_table_checks as (
  select
    'No anonymous write privilege: ' || c.relname as check_name,
    case when
      not has_table_privilege('anon', c.oid, 'INSERT')
      and not has_table_privilege('anon', c.oid, 'UPDATE')
      and not has_table_privilege('anon', c.oid, 'DELETE')
    then 'PASS' else 'FAIL' end as result
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p')
),
anonymous_function_check as (
  select
    'Anonymous function allowlist' as check_name,
    case when count(*) filter (
      where has_function_privilege('anon', p.oid, 'EXECUTE')
        and p.oid::regprocedure::text <> 'get_employee_invitation_preview(text)'
    ) = 0 then 'PASS' else 'FAIL' end as result
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
),
search_path_check as (
  select
    'SECURITY DEFINER functions fix search_path' as check_name,
    case when count(*) = 0 then 'PASS' else 'FAIL' end as result
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and not exists (
      select 1 from unnest(coalesce(p.proconfig, array[]::text[])) setting
      where setting like 'search_path=%'
    )
),
protected_functions as (
  select
    to_regprocedure(
      'public.activate_manual_pro_subscription(uuid,text,integer,timestamp with time zone)'
    ) as activation_function,
    to_regprocedure('public.restore_deleted_account(uuid)') as recovery_function
),
manual_activation_check as (
  select
    'Manual Pro activation is service-role only' as check_name,
    case when activation_function is not null
      and has_function_privilege('service_role', activation_function, 'EXECUTE')
      and not has_function_privilege('authenticated', activation_function, 'EXECUTE')
      and not has_function_privilege('anon', activation_function, 'EXECUTE')
    then 'PASS' else 'FAIL' end as result
  from protected_functions
),
account_recovery_check as (
  select
    'Account recovery is service-role only' as check_name,
    case when recovery_function is not null
      and has_function_privilege('service_role', recovery_function, 'EXECUTE')
      and not has_function_privilege('authenticated', recovery_function, 'EXECUTE')
      and not has_function_privilege('anon', recovery_function, 'EXECUTE')
    then 'PASS' else 'FAIL' end as result
  from protected_functions
),
security_events_check as (
  select
    'Security events cannot be written by clients' as check_name,
    case when
      not has_table_privilege('authenticated', 'public.security_events', 'INSERT')
      and not has_table_privilege('authenticated', 'public.security_events', 'UPDATE')
      and not has_table_privilege('authenticated', 'public.security_events', 'DELETE')
    then 'PASS' else 'FAIL' end as result
),
all_checks as (
  select * from rls_checks
  union all select * from anonymous_table_checks
  union all select * from anonymous_function_check
  union all select * from search_path_check
  union all select * from manual_activation_check
  union all select * from account_recovery_check
  union all select * from security_events_check
)
select check_name, result
from all_checks
order by case when result = 'FAIL' then 0 else 1 end, check_name;
