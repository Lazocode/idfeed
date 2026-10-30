-- Tabela de Feedbacks e Opiniões de Clientes e Testadores
-- Executar no SQL Editor do Supabase se necessário

create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  nome text,
  contato text,
  tipo_usuario text not null default 'cliente',
  categoria text not null default 'sugestao',
  avaliacao integer check (avaliacao is null or (avaliacao >= 1 and avaliacao <= 5)),
  mensagem text not null,
  pagina_origem text,
  criado_em timestamptz not null default now()
);

create index if not exists idx_feedbacks_criado_em on feedbacks (criado_em desc);

alter table feedbacks enable row level security;

-- Política de leitura/escrita para service_role (usado pelas Server Actions do Next.js)
revoke all on feedbacks from public, anon, authenticated;
grant all on feedbacks to service_role;
