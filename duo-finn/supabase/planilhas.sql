-- Cole no SQL Editor do Supabase, uma vez.
-- Depois crie só duas contas em Authentication → Users
-- (cadastro público desligado em Authentication → Providers → Email).
-- No nome de cada usuário, preencha User Metadata: {"full_name":"Tiago"} ou {"full_name":"Marcele"}.

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
