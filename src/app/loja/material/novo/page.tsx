/**
 * @file page.tsx
 * @description Página de cadastro de novos insumos e peças de estoque da oficina.
 * Permite registrar SKU, localização física no galpão/prateleira, quantidade inicial
 * e estoque mínimo para acionamento de alertas de reposição.
 * @module app/loja/material/novo/page
 * @recommendedPath src/app/loja/material/novo/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";

// 2. Ações de servidor (Server Actions)
import { criarMaterial } from "@/actions/materiais";

/**
 * Metadados estáticos para a página de criação de material.
 */
export const metadata = {
  title: "Novo Material • IDfeed",
  description: "Cadastre uma nova peça ou insumo no estoque da oficina.",
};

/**
 * Componente funcional da Página de Cadastro de Material.
 *
 * @returns Interface de formulário para cadastramento de produto no estoque.
 */
export default function NovoMaterialPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <Link href="/loja/dashboard" className="flex items-center gap-3">
            <Image
              src="/IDfeed-logo.jpg"
              alt="IDfeed - Identidade Digital Veicular"
              width={180}
              height={48}
              priority
              referrerPolicy="no-referrer"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            href="/loja/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 text-left">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Cadastrar Material
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Adicione uma peça, filtro ou fluido ao controle de estoque interno da oficina.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8">
          <form action={criarMaterial} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="mat-nome"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Nome da Peça / Insumo *
                </label>
                <input
                  id="mat-nome"
                  name="nome"
                  placeholder="Ex: Pastilha de Freio Dianteira"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="mat-sku"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Código SKU / Referência *
                </label>
                <input
                  id="mat-sku"
                  name="sku"
                  placeholder="Ex: PST-FRE-01"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="mat-localizacao"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Localização Física no Estoque
              </label>
              <input
                id="mat-localizacao"
                name="localizacao"
                placeholder="Ex: Galpão 2 · Prateleira B2"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="mat-quantidadeAtual"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Quantidade Inicial
                </label>
                <input
                  id="mat-quantidadeAtual"
                  name="quantidadeAtual"
                  type="number"
                  min={0}
                  placeholder="0"
                  defaultValue={0}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="mat-quantidadeMinima"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Estoque Mínimo (Alerta)
                </label>
                <input
                  id="mat-quantidadeMinima"
                  name="quantidadeMinima"
                  type="number"
                  min={0}
                  placeholder="5"
                  defaultValue={5}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                id="btn-criar-material-submit"
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-xs cursor-pointer"
              >
                <span>Cadastrar Material</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </button>
              <Link
                href="/loja/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

