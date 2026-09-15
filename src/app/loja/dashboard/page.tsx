import Link from "next/link";
import Image from "next/image";
import { requireApprovedRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import { formatPlaca } from "@/lib/utils";
import LogoutButton from "@/components/logout-button";
import {
  Car,
  Boxes,
  Package,
  Search,
  Plus,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireApprovedRole([
    "admin",
    "mecanico",
    "atendente",
  ]);

  const lojaId = session.user.lojaId;
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const { data: loja } = await supabaseAdmin
    .from("lojas")
    .select("*")
    .eq("id", lojaId)
    .single();

  let veiculosQuery = supabaseAdmin
    .from("veiculos")
    .select("*")
    .eq("loja_id", lojaId)
    .order("criado_em", { ascending: false });
  if (query) {
    veiculosQuery = veiculosQuery.or(
      `placa.ilike.%${query}%,modelo.ilike.%${query}%,proprietario_nome.ilike.%${query}%`
    );
  }
  const { data: veiculos } = await veiculosQuery;

  let materiaisQuery = supabaseAdmin
    .from("materiais")
    .select("*")
    .eq("loja_id", lojaId)
    .order("criado_em", { ascending: false });
  if (query) {
    materiaisQuery = materiaisQuery.or(
      `nome.ilike.%${query}%,sku.ilike.%${query}%`
    );
  }
  const { data: materiais } = await materiaisQuery;

  const totalVeiculos = veiculos?.length ?? 0;
  const revisaoProxima =
    veiculos?.filter(
      (v) =>
        v.km_proxima_revisao &&
        v.km_proxima_revisao - v.km_atual <= 3000
    ).length ?? 0;
  const estoqueBaixo =
    materiais?.filter((m) => m.quantidade_atual < m.quantidade_minima)
      .length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ─── Topbar Moderna ─── */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/loja/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo-idfeed.png"
                alt="IDfeed"
                width={112}
                height={32}
                priority
                referrerPolicy="no-referrer"
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </Link>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/60 max-w-[180px] sm:max-w-none truncate">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{loja?.nome || "Oficina Credenciada"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/loja/novo"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-xs hover:shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-slate-300" />
              <span>Novo Registro</span>
            </Link>

            <LogoutButton
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* ─── Conteúdo Principal ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Intro da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
              <Building2 className="w-4 h-4" />
              Painel de Operações da Oficina
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Gestão de Veículos e Estoque
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Acompanhe veículos cadastrados, controle o estoque de peças e mantenha os registros de manutenção sempre atualizados.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs self-start sm:self-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Operação Conectada
          </div>
        </div>

        {/* ─── Cards de Métricas Estilo Consulta ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total de Veículos */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <p>Total de Veículos</p>
              <Car className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {totalVeiculos}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {totalVeiculos === 1 ? "1 veículo cadastrado" : `${totalVeiculos} veículos cadastrados`}
              </p>
            </div>
          </div>

          {/* Card 2: Revisões Próximas */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-amber-900 text-xs font-semibold uppercase tracking-wider">
              <p>Revisões Próximas</p>
              <CalendarClock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
                {revisaoProxima}
              </div>
              <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                Próximas em até 3.000 km
              </p>
            </div>
          </div>

          {/* Card 3: Estoque Baixo */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-xs hover:border-rose-300 transition-all flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-rose-900 text-xs font-semibold uppercase tracking-wider">
              <p>Estoque Baixo</p>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                {estoqueBaixo}
              </div>
              <p className="text-[11px] text-rose-800 font-medium mt-0.5">
                {estoqueBaixo === 1 ? "Item abaixo da cota mínima" : "Itens abaixo da cota mínima"}
              </p>
            </div>
          </div>

          {/* Card 4: Itens em Estoque */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <p>Itens em Estoque</p>
              <Boxes className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {materiais?.length ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Peças e insumos catalogados
              </p>
            </div>
          </div>
        </div>

        {/* ─── Campo de Busca Moderno ─── */}
        <form method="get" className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por placa, modelo do veículo, proprietário ou SKU de peça..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-24 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            {query && (
              <Link
                href="/loja/dashboard"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </Link>
            )}
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* ─── Duas Colunas: Veículos e Materiais ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Coluna 1: Veículos */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 text-left">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Veículos
                    </h2>
                    <div className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                      {veiculos?.length ?? 0}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Histórico oficial e manutenções
                  </p>
                </div>
              </div>

              <Link
                href="/loja/veiculo/novo"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Veículo
              </Link>
            </div>

            {(!veiculos || veiculos.length === 0) ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  {query ? "Nenhum veículo encontrado para esta busca." : "Nenhum veículo cadastrado na oficina."}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {query ? "Tente buscar com outros termos de placa ou modelo." : "Cadastre o primeiro veículo para registrar ordens de serviço e manutenções."}
                </p>
                {!query && (
                  <Link
                    href="/loja/veiculo/novo"
                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar Veículo
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {veiculos.map((v) => {
                  const kmToGo = v.km_proxima_revisao
                    ? v.km_proxima_revisao - v.km_atual
                    : null;
                  const soon = kmToGo !== null && kmToGo <= 3000;

                  return (
                    <Link
                      key={v.id}
                      href={`/loja/veiculo/${v.id}`}
                      className="group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-black text-slate-900 tracking-wide">
                              {formatPlaca(v.placa)}
                            </p>
                          </div>
                          <p className="text-xs text-slate-600 font-medium truncate">
                            {v.modelo}
                          </p>
                          {v.proprietario_nome && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              Prop.: {v.proprietario_nome}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {soon ? (
                          <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <CalendarClock className="w-3 h-3 text-amber-600" />
                            {Math.max(0, kmToGo).toLocaleString("pt-BR")} km
                          </div>
                        ) : kmToGo !== null ? (
                          <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Em dia
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Sem revisão
                          </div>
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna 2: Materiais */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 text-left">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Materiais & Peças
                    </h2>
                    <div className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                      {materiais?.length ?? 0}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Estoque e reposições
                  </p>
                </div>
              </div>

              <Link
                href="/loja/material/novo"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Material
              </Link>
            </div>

            {(!materiais || materiais.length === 0) ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  {query ? "Nenhum material encontrado para esta busca." : "Nenhum material cadastrado no estoque."}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {query ? "Verifique se digitou o SKU ou o nome da peça corretamente." : "Cadastre peças, filtros ou óleos para vincular às ordens de serviço."}
                </p>
                {!query && (
                  <Link
                    href="/loja/material/novo"
                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar Material
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {materiais.map((m) => {
                  const baixo = m.quantidade_atual < m.quantidade_minima;

                  return (
                    <Link
                      key={m.id}
                      href={`/loja/material/${m.id}`}
                      className="group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            baixo
                              ? "bg-rose-50 text-rose-600 border border-rose-200/80"
                              : "bg-slate-100 text-slate-600 border border-slate-200/80"
                          }`}
                        >
                          {baixo ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <Package className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {m.nome}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                            <span>SKU: {m.sku}</span>
                            <span>•</span>
                            <span>Mín: {m.quantidade_minima}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {baixo ? (
                          <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {m.quantidade_atual} un.
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {m.quantidade_atual} un.
                          </div>
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé Interno Discreto */}
        <div className="pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <p>Painel operacional credenciado IDfeed • Histórico e certificação veicular</p>
          </div>
          <p>© {new Date().getFullYear()} IDfeed. Todos os direitos reservados.</p>
        </div>
      </main>
    </div>
  );
}
