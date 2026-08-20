import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import "dotenv/config";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed bloqueado em produção.");
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 10) throw new Error("Defina SEED_PASSWORD com pelo menos 10 caracteres.");
  const senhaHash = await bcrypt.hash(seedPassword, 12);

  const { data: lojaBomMotor, error: e1 } = await supabase
    .from("lojas")
    .insert({ nome: "Oficina Bom Motor" })
    .select()
    .single();
  if (e1) throw e1;

  const { data: lojaAutoCenter, error: e2 } = await supabase
    .from("lojas")
    .insert({ nome: "AutoCenter Rio Norte" })
    .select()
    .single();
  if (e2) throw e2;

  const { data: usuario1 } = await supabase
    .from("usuarios")
    .insert({ loja_id: lojaBomMotor.id, nome: "Diego Alves", email: "diego@bommotor.com", senha_hash: senhaHash, papel: "admin" })
    .select()
    .single();

  const { data: usuario2 } = await supabase
    .from("usuarios")
    .insert({ loja_id: lojaAutoCenter.id, nome: "Fábio Reis", email: "fabio@autocenter.com", senha_hash: senhaHash, papel: "admin" })
    .select()
    .single();

  const { data: oleo } = await supabase
    .from("materiais")
    .insert({ loja_id: lojaBomMotor.id, nome: "Óleo 5W30 4L", sku: "OLE-5W30-4", localizacao: "Galpão 1 · Estante A1", quantidade_atual: 6, quantidade_minima: 6 })
    .select()
    .single();

  await supabase.from("materiais").insert({ loja_id: lojaBomMotor.id, nome: "Pastilha de Freio (par)", sku: "PST-FRE-01", localizacao: "Galpão 2 · Prateleira B2", quantidade_atual: 3, quantidade_minima: 6 });
  await supabase.from("materiais").insert({ loja_id: lojaBomMotor.id, nome: "Amortecedor Dianteiro", sku: "AMD-2201", localizacao: "Galpão 2 · Prateleira C4", quantidade_atual: 18, quantidade_minima: 6 });
  await supabase.from("materiais").insert({ loja_id: lojaAutoCenter.id, nome: "Bateria 60Ah", sku: "BAT-60AH", localizacao: "Pátio 1 · Setor A", quantidade_atual: 4, quantidade_minima: 6 });

  const { data: strada } = await supabase
    .from("veiculos")
    .insert({
      loja_id: lojaBomMotor.id,
      placa: "ABC1D23",
      modelo: "Fiat Strada 1.4 Endurance (2021)",
      proprietario_nome: "João Pereira",
      km_atual: 58200,
      km_proxima_revisao: 63000,
      nota_proxima_revisao: "Revisão dos 60 mil km",
    })
    .select()
    .single();

  await supabase.from("veiculos").insert({
    loja_id: lojaAutoCenter.id,
    placa: "XYZ8F41",
    modelo: "VW Saveiro 1.6 (2019)",
    proprietario_nome: "Marta Cordeiro",
    km_atual: 91700,
    km_proxima_revisao: 95000,
    nota_proxima_revisao: "Troca de correia dentada",
  });

  // Ordem de serviço de exemplo, usando a mesma função (RPC) que o app usa em produção —
  // garante que o histórico inicial já nasce consistente com o estoque.
  await supabase.rpc("criar_ordem_servico", {
    p_veiculo_id: strada!.id,
    p_tipo_servico: "revisao",
    p_km_no_servico: 58200,
    p_mecanico_usuario_id: usuario1!.id,
    p_custo: 510.0,
    p_observacao: "Revisão programada",
    p_pecas: [{ material_id: oleo!.id, quantidade: 1 }],
  });

  console.log("Seed concluído.");
  console.log("Usuários de demonstração:", usuario1?.email, usuario2?.email);
  console.log("A senha foi fornecida por SEED_PASSWORD.");
  console.log("Placas de teste: ABC-1D23, XYZ-8F41");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
