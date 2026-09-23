/**
 * @file page.tsx
 * @description Seletor de novos cadastros da oficina.
 * Permite ao colaborador escolher entre cadastrar um veículo ou cadastrar
 * um novo material/insumo no estoque da oficina mecânica.
 * @module app/loja/novo/page
 * @recommendedPath src/app/loja/novo/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";

// 2. Hooks, utilitários, libs e serviços
import { requireApprovedRole } from "@/lib/security";

/**
 * Metadados estáticos para a página de seleção de novo cadastro.
 */
export const metadata = {
  title: "Novo Registro • IDfleet",
  description: "Selecione o tipo de cadastro a ser realizado na oficina: veículo ou material.",
};

/**
 * Componente funcional da Página de Seleção de Cadastro (Novo Registro).
 *
 * @returns Interface de escolha entre criação de veículo ou peça/material.
 */
export default async function NovoRegistroPage() {
  // Exige perfil autorizado e oficina homologada
  await requireApprovedRole(["admin", "mecanico", "atendente"]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Topbar */}
      <header className="border-b border-slate-200/70 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-3 sm:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/loja/dashboard" className="flex items-center shrink-0">
            <div className="relative h-7 sm:h-8 w-28 sm:w-36 flex items-center">
              <Image
                src="/IDfeed-logo.jpg"
                alt="IDfleet - Identidade Digital Veicular"
                width={180}
                height={48}
                priority
                referrerPolicy="no-referrer"
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </div>
          </Link>
          <Link
            href="/loja/dashboard"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span><span className="hidden sm:inline">Voltar ao </span>Painel</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-8 py-6 sm:py-14">
        <div className="mb-6 sm:mb-10 text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Novo Registro
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Selecione o tipo de cadastro que você deseja iniciar na sua oficina:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Card Veículo */}
          <Link
            href="/loja/veiculo/novo"
            className="group block p-5 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                Veículo Novo
              </h2>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Cadastre um veículo para emitir seu passaporte digital, gerenciar ordens de serviço e alimentar o prontuário.
            </p>
          </Link>

          {/* Card Material */}
          <Link
            href="/loja/material/novo"
            className="group block p-5 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                Material ou Peça
              </h2>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Adicione insumos, peças, óleos ou componentes para controle de estoque e consumo nas manutenções.
            </p>
          </Link>
        </div>

        <div className="mt-10 p-5 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-3.5 text-xs text-slate-500 shadow-2xs">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Para registrar uma ordem de serviço, manutenção ou foto de um veículo que já está cadastrado, localize o veículo no painel principal e acesse o botão dentro da página dele.
          </p>
        </div>
      </main>
    </div>
  );
}

