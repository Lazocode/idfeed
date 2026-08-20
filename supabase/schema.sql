-- Schema seguro do LOTE
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create type papel as enum ('admin', 'mecanico', 'atendente');
create type tipo_movimentacao as enum ('entrada', 'saida', 'transferencia', 'inventario');
create type tipo_servico as enum ('oleo', 'freios', 'revisao', 'eletrica', 'outros');
create type entidade_foto as enum ('veiculo', 'material', 'ordem_servico');

create table lojas (
  id uuid primary key default uuid_generate_v4(), nome text not null, criado_em timestamptz not null default now()
);
create table usuarios (
  id uuid primary key default uuid_generate_v4(), loja_id uuid not null references lojas(id) on delete cascade,
  nome text not null, email text not null unique, senha_hash text not null, papel papel not null default 'mecanico', criado_em timestamptz not null default now()
);
create index on usuarios (loja_id);

create table veiculos (
  id uuid primary key default uuid_generate_v4(), loja_id uuid not null references lojas(id) on delete cascade,
  public_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  placa text not null unique, modelo text not null, proprietario_nome text not null, proprietario_contato text,
  km_atual integer not null default 0 check (km_atual >= 0), km_proxima_revisao integer check (km_proxima_revisao is null or km_proxima_revisao >= 0),
  nota_proxima_revisao text, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create index on veiculos (loja_id);

create table materiais (
  id uuid primary key default uuid_generate_v4(), loja_id uuid not null references lojas(id) on delete cascade,
  nome text not null, sku text not null, localizacao text, quantidade_atual integer not null default 0 check (quantidade_atual >= 0),
  quantidade_minima integer not null default 5 check (quantidade_minima >= 0), criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(), unique (loja_id, sku)
);
create index on materiais (loja_id);

create table ordens_servico (
  id uuid primary key default uuid_generate_v4(), veiculo_id uuid not null references veiculos(id) on delete cascade,
  tipo_servico tipo_servico not null, km_no_servico integer not null check (km_no_servico >= 0), mecanico_usuario_id uuid references usuarios(id),
  custo numeric(10,2) check (custo is null or custo >= 0), observacao text, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create index on ordens_servico (veiculo_id);

create table movimentacoes_estoque (
  id uuid primary key default uuid_generate_v4(), material_id uuid not null references materiais(id) on delete cascade,
  tipo tipo_movimentacao not null, quantidade integer not null, ordem_servico_id uuid references ordens_servico(id), responsavel_usuario_id uuid references usuarios(id), observacao text, criado_em timestamptz not null default now()
);
create index on movimentacoes_estoque (material_id);

create table ordem_servico_materiais (
  id uuid primary key default uuid_generate_v4(), ordem_servico_id uuid not null references ordens_servico(id) on delete cascade,
  material_id uuid not null references materiais(id), quantidade integer not null check (quantidade > 0), unique (ordem_servico_id, material_id)
);

create table fotos (
  id uuid primary key default uuid_generate_v4(), entidade_tipo entidade_foto not null, entidade_id uuid not null,
  url text not null, legenda text, enviado_por_usuario_id uuid references usuarios(id), criado_em timestamptz not null default now()
);
create index on fotos (entidade_tipo, entidade_id);

-- RLS fechado: o Next.js usa Service Role no servidor e faz autorização explícita por loja/papel.
alter table lojas enable row level security;
alter table usuarios enable row level security;
alter table veiculos enable row level security;
alter table materiais enable row level security;
alter table ordens_servico enable row level security;
alter table movimentacoes_estoque enable row level security;
alter table ordem_servico_materiais enable row level security;
alter table fotos enable row level security;

create or replace function criar_ordem_servico(
  p_veiculo_id uuid, p_tipo_servico tipo_servico, p_km_no_servico integer, p_mecanico_usuario_id uuid,
  p_custo numeric, p_observacao text, p_pecas jsonb, p_loja_id uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_os_id uuid; v_km_atual integer; v_placa text; v_item jsonb; v_material_id uuid; v_quantidade integer; v_estoque_atual integer;
begin
  if p_km_no_servico < 0 or p_km_no_servico > 10000000 then raise exception 'Quilometragem inválida'; end if;
  if p_custo is not null and (p_custo < 0 or p_custo > 99999999.99) then raise exception 'Custo inválido'; end if;
  if not exists (select 1 from usuarios where id = p_mecanico_usuario_id and loja_id = p_loja_id) then raise exception 'Usuário inválido'; end if;
  select km_atual, placa into v_km_atual, v_placa from veiculos where id = p_veiculo_id and loja_id = p_loja_id;
  if not found then raise exception 'Veículo não pertence à loja'; end if;

  insert into ordens_servico (veiculo_id, tipo_servico, km_no_servico, mecanico_usuario_id, custo, observacao)
  values (p_veiculo_id, p_tipo_servico, p_km_no_servico, p_mecanico_usuario_id, p_custo, p_observacao) returning id into v_os_id;
  if p_km_no_servico > v_km_atual then update veiculos set km_atual = p_km_no_servico, atualizado_em = now() where id = p_veiculo_id and loja_id = p_loja_id; end if;

  for v_item in select * from jsonb_array_elements(coalesce(p_pecas, '[]'::jsonb)) loop
    v_material_id := (v_item->>'material_id')::uuid; v_quantidade := (v_item->>'quantidade')::integer;
    if v_quantidade <= 0 or v_quantidade > 100000 then continue; end if;
    select quantidade_atual into v_estoque_atual from materiais where id = v_material_id and loja_id = p_loja_id for update;
    if not found then continue; end if;
    v_quantidade := least(v_quantidade, v_estoque_atual);
    if v_quantidade <= 0 then continue; end if;
    insert into ordem_servico_materiais (ordem_servico_id, material_id, quantidade) values (v_os_id, v_material_id, v_quantidade);
    insert into movimentacoes_estoque (material_id, tipo, quantidade, ordem_servico_id, responsavel_usuario_id, observacao)
    values (v_material_id, 'saida', -v_quantidade, v_os_id, p_mecanico_usuario_id, 'Usado na manutenção de ' || v_placa);
    update materiais set quantidade_atual = quantidade_atual - v_quantidade, atualizado_em = now() where id = v_material_id and loja_id = p_loja_id;
  end loop;
  return v_os_id;
end; $$;

revoke all on function criar_ordem_servico(uuid, tipo_servico, integer, uuid, numeric, text, jsonb, uuid) from public, anon, authenticated;
grant execute on function criar_ordem_servico(uuid, tipo_servico, integer, uuid, numeric, text, jsonb, uuid) to service_role;

create or replace function registrar_movimentacao(
  p_material_id uuid, p_tipo tipo_movimentacao, p_delta integer, p_responsavel_usuario_id uuid, p_observacao text, p_loja_id uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_mov_id uuid;
begin
  if p_delta > 10000000 or p_delta < -10000000 then raise exception 'Quantidade inválida'; end if;
  if not exists (select 1 from usuarios where id = p_responsavel_usuario_id and loja_id = p_loja_id) then raise exception 'Usuário inválido'; end if;
  if not exists (select 1 from materiais where id = p_material_id and loja_id = p_loja_id) then raise exception 'Material não pertence à loja'; end if;
  insert into movimentacoes_estoque (material_id, tipo, quantidade, responsavel_usuario_id, observacao) values (p_material_id, p_tipo, p_delta, p_responsavel_usuario_id, p_observacao) returning id into v_mov_id;
  update materiais set quantidade_atual = greatest(0, quantidade_atual + p_delta), atualizado_em = now() where id = p_material_id and loja_id = p_loja_id;
  return v_mov_id;
end; $$;

revoke all on function registrar_movimentacao(uuid, tipo_movimentacao, integer, uuid, text, uuid) from public, anon, authenticated;
grant execute on function registrar_movimentacao(uuid, tipo_movimentacao, integer, uuid, text, uuid) to service_role;

-- Bucket privado: imagens só são exibidas por URLs assinadas de curta duração.
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', false)
on conflict (id) do update set public = false;
