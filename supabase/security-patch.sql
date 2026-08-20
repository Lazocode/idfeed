-- Patch de segurança para uma base LOTE existente.
create extension if not exists "pgcrypto";
alter table veiculos add column if not exists public_token text;
update veiculos set public_token = encode(gen_random_bytes(24), 'hex') where public_token is null;
alter table veiculos alter column public_token set not null;
create unique index if not exists veiculos_public_token_key on veiculos(public_token);
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', false) on conflict (id) do update set public = false;
drop function if exists criar_ordem_servico(uuid, tipo_servico, integer, uuid, numeric, text, jsonb);
drop function if exists registrar_movimentacao(uuid, tipo_movimentacao, integer, uuid, text);

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


