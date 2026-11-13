-- Cole no SQL Editor do Supabase, uma vez.
-- Depois crie só duas contas em Authentication → Users → Add user
-- (cadastro público desligado em Authentication → Sign In / Providers → Email).
-- O JSON da ficha do usuário é só leitura. O nome entra com:
-- update auth.users
-- set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"Tiago"}'::jsonb
-- where email = 'email-da-conta';
-- Um e-mail com tiago ou marcele já mostra o nome, mesmo sem esse update.

create table if not exists public.planilhas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.planilhas enable row level security;

drop policy if exists "cada um vê a própria planilha" on public.planilhas;
create policy "cada um vê a própria planilha"
  on public.planilhas
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
