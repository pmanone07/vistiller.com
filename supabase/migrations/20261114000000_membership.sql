-- =============================================================================
-- Paid membership per organization (Stripe subscription, 499 kr per year).
--
-- Additive and repeatable: adds columns to organizations, one helper function
-- and one RESTRICTIVE insert policy on events. No data is changed or removed.
--
-- NB: Running this migration is what switches the paywall on. From then on an
-- organization needs a valid membership to create new events. Existing events,
-- their share links and all sign-ups keep working without a membership.
--
-- The membership columns are written only by the server (Stripe webhook, using
-- the service role). Organizers can read them but not change them: their
-- UPDATE privilege on organizations is limited to (name) by the
-- 20261111000000_harden_column_grants migration.
-- =============================================================================

alter table public.organizations
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status    text,
  add column if not exists access_until           timestamptz,
  add column if not exists cancel_at_period_end   boolean not null default false;

create unique index if not exists organizations_stripe_customer_id_key
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;

-- True while the organization's paid period is running. Three days of slack
-- cover the gap between the end of a period and Stripe confirming the renewal
-- payment (keep in sync with ACCESS_GRACE_DAYS in src/lib/membership.ts).
create or replace function public.org_has_access(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = org_id
      and o.access_until is not null
      and o.access_until + interval '3 days' > now()
  );
$$;

revoke execute on function public.org_has_access(uuid) from public, anon;
grant execute on function public.org_has_access(uuid) to authenticated, service_role;

-- Restrictive: applies in addition to "members manage events", and only to
-- INSERT, so existing events can still be read, edited, closed and deleted.
drop policy if exists "membership required for new events" on public.events;
create policy "membership required for new events" on public.events
  as restrictive
  for insert to authenticated
  with check (public.org_has_access(organization_id));

notify pgrst, 'reload schema';
