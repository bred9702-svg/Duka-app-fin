-- DUKWISE STRICT API PERMISSIONS V1
-- Remove Supabase default grants and expose only the application API.

-- Anonymous users never write directly to business tables. Public invitation
-- preview remains a security-definer RPC and needs no table privilege.
do $$
declare
  table_record record;
begin
  for table_record in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  loop
    execute format(
      'revoke insert, update, delete, truncate, references, trigger on table %I.%I from anon',
      table_record.schema_name,
      table_record.table_name
    );
  end loop;
end;
$$;

-- Remove all implicit/default client execution first. Trigger functions and
-- administrative helpers therefore become non-callable through PostgREST.
do $$
declare
  function_record record;
begin
  for function_record in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      function_record.signature
    );
  end loop;
end;
$$;

-- The only anonymous public-schema RPC is the exact-code employee invitation
-- preview. Authentication itself is handled by Supabase Auth, not these RPCs.
do $$
declare
  function_record record;
begin
  for function_record in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'get_employee_invitation_preview'
  loop
    execute format(
      'grant execute on function %s to anon, authenticated',
      function_record.signature
    );
  end loop;
end;
$$;

-- Authenticated application API. Catalog lookup makes this compatible with
-- projects that have only a subset of historical optional RPCs installed.
do $$
declare
  function_record record;
  allowed_names constant text[] := array[
    'accept_employee_invitation',
    'apply_debt_payment_atomic',
    'classify_transaction_atomic',
    'create_debt_sale_atomic',
    'create_employee_invitation',
    'create_owner_shop',
    'create_shop_customer',
    'create_shop_product',
    'current_user_shop_id',
    'finalize_sale_atomic',
    'get_current_shop_context',
    'get_current_shop_entitlements',
    'get_employee_invitation_preview',
    'get_owned_shop_payment_settings',
    'get_shop_business_preferences',
    'get_shop_entitlements',
    'get_shop_team',
    'is_shop_member',
    'is_shop_owner',
    'record_cash_transaction',
    'record_stock_purchase_atomic',
    'request_account_deletion',
    'revoke_employee_invitation',
    'shop_has_current_pro_access',
    'shop_has_pro_access',
    'update_owned_shop_payment_settings',
    'update_owned_shop_profile',
    'update_shop_business_preferences'
  ];
begin
  for function_record in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(allowed_names)
  loop
    execute format(
      'grant execute on function %s to authenticated',
      function_record.signature
    );
  end loop;
end;
$$;

-- Privileged operations are available only to trusted server-side code.
do $$
declare
  function_record record;
  service_only_names constant text[] := array[
    'activate_manual_pro_subscription',
    'admin_activate_pro_subscription',
    'restore_deleted_account',
    'finalize_account_deletion'
  ];
begin
  for function_record in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(service_only_names)
  loop
    execute format(
      'grant execute on function %s to service_role',
      function_record.signature
    );
  end loop;
end;
$$;

comment on schema public is
  'Dukwise API schema: client function execution is explicit and least-privilege.';
