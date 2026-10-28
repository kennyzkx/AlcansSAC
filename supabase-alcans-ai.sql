-- Limite de solicitações de IA por usuário, aplicado atomicamente no banco.
create table if not exists public.alcans_ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  minute_bucket timestamptz not null,
  requests integer not null default 0,
  primary key(user_id,minute_bucket)
);
alter table public.alcans_ai_usage enable row level security;
revoke all on public.alcans_ai_usage from anon,authenticated;
create or replace function public.alcans_ai_allow_request()
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid := auth.uid(); v_count integer;
begin
  if v_user is null or not exists(select 1 from public.app_profiles p where p.user_id=v_user and p.active) then return false; end if;
  insert into public.alcans_ai_usage(user_id,minute_bucket,requests)
  values(v_user,date_trunc('minute',now()),1)
  on conflict(user_id,minute_bucket) do update set requests=public.alcans_ai_usage.requests+1
  returning requests into v_count;
  return v_count<=8;
end $$;
revoke all on function public.alcans_ai_allow_request() from public,anon;
grant execute on function public.alcans_ai_allow_request() to authenticated;
