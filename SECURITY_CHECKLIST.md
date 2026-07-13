# Dukwise Security Checklist

This checklist complements the database protections in the repository. Review
it before every APK release and after any authentication, payment or role
change.

## Supabase Auth

- Keep email confirmation enabled.
- Keep the minimum password length at 8 or higher and require letters and digits.
- In Authentication > Rate Limits, keep conservative limits for sign-up,
  password sign-in, email OTP and password recovery.
- Enable CAPTCHA before opening public self-registration beyond the controlled
  test group.
- Keep anonymous sign-ins disabled.
- Keep leaked-password protection enabled when the Supabase plan supports it.
- Use MFA for every Supabase dashboard administrator.
- Review Auth audit logs weekly during the test phase.

## Secrets and APK

- The APK may contain only `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`. These are public identifiers protected by RLS.
- Never place `service_role`, database passwords, M-Pesa credentials, webhook
  secrets or private API keys in Vite variables, source code or Android files.
- Store privileged secrets only in Supabase Edge Function secrets or another
  server-side secret manager.
- Rotate a secret immediately if it appears in Git history, logs, screenshots
  or chat messages.

## Database

- Execute migrations in timestamp order.
- Run `supabase/tests/security_regression_checks.sql` after every migration.
- Every result from that file must be `PASS` before release.
- New tenant tables must enable RLS before client access is granted.
- New `SECURITY DEFINER` functions must set an explicit `search_path`, validate
  `auth.uid()` and receive only the minimum required grants.
- Subscription activation, account recovery and permanent deletion remain
  service-role-only operations.

## Backups and Recovery

- Confirm the Supabase backup policy available for the current project plan.
- Before a destructive migration, export the affected schema and business data.
- Test a restore procedure before the public launch; an untested backup is not
  a recovery plan.
- Record who may request, approve and perform account recovery.

## Monitoring and Incident Response

- Monitor Supabase Auth logs, Postgres logs and `public.security_events`.
- Investigate repeated failed sign-ins, unusual invitation creation, access from
  unexpected locations and abnormal transaction volume.
- If an attack is suspected: restrict the affected account, preserve logs,
  rotate exposed secrets, identify affected shops, restore safely, and notify
  affected users or authorities when legally required.
- Do not delete evidence before the incident is understood.

## APK Release Gate

- Production build succeeds.
- Capacitor sync succeeds.
- Android build and installation succeed on a real device.
- Registration, confirmation, sign-in, sign-out and password recovery work.
- An Owner cannot see another shop's data.
- An Employee cannot access Owner-only screens or functions.
- Free/Pro restrictions are enforced by the database, not only by the UI.
- No secret appears in the generated APK or browser network logs.
- Terms of Service, Privacy Policy and support contact are reachable.
