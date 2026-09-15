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
  AlertCircle,
  CheckCircle2,
  Building2,
  ChevronRight,
  X,
  ShieldCheck,
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
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* ─── Topbar Limpa (Branco & Azul) ─── */}
      <header className="border-b border-slate-200/70 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/loja/dashboard" className="flex items-center">
              <div className="relative h-8 w-32 sm:w-36 flex items-center">
                <Image
                  src="/IDfeed-logo.jpg"
                  alt="IDfeed - Identidade Digital Veicular"
                  width={180}
                  height={48}
                  priority
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto object-contain"
                />
              </div>
            </Link>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg max-w-[200px] sm:max-w-none truncate">
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{loja?.nome || "Oficina Credenciada"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/loja/novo"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Registro</span>
            </Link>

            <LogoutButton
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* ─── Conteúdo Principal com Espaçamentos Generosos ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Painel Operacional
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Gestão da Oficina
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Consulte e atualize o prontuário dos veículos cadastrados e controle o inventário de peças.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200/80 shadow-2xs self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Sistema Ativo
          </div>
        </div>

        {/* ─── Métricas Resumidas em Azul & Branco ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total de Veículos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Veículos Cadastrados
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {totalVeiculos}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {totalVeiculos === 1 ? "1 veículo registrado" : `${totalVeiculos} veículos registrados`}
              </p>
            </div>
          </div>

          {/* Card 2: Revisões Próximas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Revisões Próximas
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarClock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {revisaoProxima}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Em até 3.000 km
              </p>
            </div>
          </div>

          {/* Card 3: Estoque Baixo */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Alerta de Reposição
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                estoqueBaixo > 0 ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
              }`}>
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {estoqueBaixo}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {estoqueBaixo === 1 ? "Item abaixo do mínimo" : "Itens abaixo do mínimo"}
              </p>
            </div>
          </div>

          {/* Card 4: Total Itens */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Itens no Estoque
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {materiais?.length ?? 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Peças e insumos cadastrados
              </p>
            </div>
          </div>
        </div>

        {/* ─── Barra de Busca Elegante ─── */}
        <form method="get" className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por placa, modelo do veículo, proprietário ou SKU..."
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-11 pr-28 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
          <div className="absolute right-2.5 flex items-center gap-2">
            {query && (
              <Link
                href="/loja/dashboard"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </Link>
            )}
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* ─── Listas Principais (Veículos & Materiais) com Linhas Abertas ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Coluna 1: Veículos */}
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Veículos
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
                    {veiculos?.length ?? 0}
                  </span>
                </div>
              </div>

              <Link
                href="/loja/veiculo/novo"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Veículo</span>
              </Link>
            </div>

            {(!veiculos || veiculos.length === 0) ? (
              <div className="text-center py-12 px-6">
                <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Car className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {query ? "Nenhum veículo encontrado." : "Nenhum veículo cadastrado."}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {query
                    ? "Tente buscar por outra placa ou nome."
                    : "Cadastre veículos para emitir o passaporte e registrar serviços."}
                </p>
                {!query && (
                  <Link
                    href="/loja/veiculo/novo"
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar Primeiro Veículo
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {veiculos.map((v) => {
                  const kmToGo = v.km_proxima_revisao
                    ? v.km_proxima_revisao - v.km_atual
                    : null;
                  const soon = kmToGo !== null && kmToGo <= 3000;

                  return (
                    <Link
                      key={v.id}
                      href={`/loja/veiculo/${v.id}`}
                      className="group flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900 tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                              {formatPlaca(v.placa)}
                            </span>
                            <span className="text-sm font-medium text-slate-700 truncate">
                              {v.modelo}
                            </span>
                          </div>
                          {v.proprietario_nome && (
                            <p className="text-xs text-slate-400 truncate mt-1">
                              Proprietário: {v.proprietario_nome}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {soon ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                            <CalendarClock className="w-3 h-3 text-amber-600" />
                            {Math.max(0, kmToGo).toLocaleString("pt-BR")} km
                          </span>
                        ) : kmToGo !== null ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Em dia
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Sem revisão
                          </span>
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Coluna 2: Materiais */}
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Materiais & Peças
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
                    {materiais?.length ?? 0}
                  </span>
                </div>
              </div>

              <Link
                href="/loja/material/novo"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Material</span>
              </Link>
            </div>

            {(!materiais || materiais.length === 0) ? (
              <div className="text-center py-12 px-6">
                <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {query ? "Nenhum material encontrado." : "Nenhum material cadastrado."}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {query
                    ? "Verifique o termo de busca ou SKU."
                    : "Cadastre componentes e insumos para controle de estoque."}
                </p>
                {!query && (
                  <Link
                    href="/loja/material/novo"
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar Primeiro Material
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {materiais.map((m) => {
                  const baixo = m.quantidade_atual < m.quantidade_minima;

                  return (
                    <Link
                      key={m.id}
                      href={`/loja/material/${m.id}`}
                      className="group flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          baixo ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                        }`}>
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {m.nome}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span>SKU: {m.sku}</span>
                            <span>•</span>
                            <span>Mín: {m.quantidade_minima} un.</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {baixo ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            {m.quantidade_atual} un.
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                            {m.quantidade_atual} un.
                          </span>
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Rodapé Interno Discreto */}
        <footer className="pt-8 pb-4 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>IDfeed • Sistema de Prontuário e Gestão para Oficinas Credenciadas</p>
          <p>© {new Date().getFullYear()} IDfeed. Todos os direitos reservados.</p>
        </footer>
      </main>
    </div>
  );
}
