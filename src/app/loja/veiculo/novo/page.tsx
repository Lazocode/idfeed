/**
 * @file page.tsx
 * @description Página de cadastro de novos veículos da oficina mecânica.
 * Coleta os dados de identificação do automóvel (placa, modelo, odômetro atual)
 * e informações cadastrais do proprietário (nome, CPF, contato) para geração do passaporte digital.
 * @module app/loja/veiculo/novo/page
 * @recommendedPath src/app/loja/veiculo/novo/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

// 2. Componentes internos
import CadastrarVeiculoForm from "@/components/cadastrar-veiculo-form";

// 3. Hooks, utilitários, libs e serviços
import { requireApprovedRole } from "@/lib/security";

/**
 * Metadados estáticos para a tela de cadastro de veículo.
 */
export const metadata = {
  title: "Novo Veículo • IDfeed",
  description: "Cadastre um veículo para emissão de passaporte digital e prontuário veicular.",
};

/**
 * Componente assíncrono da Página de Cadastro de Veículo.
 * Valida autorização da oficina e renderiza o formulário interativo de cadastro.
 *
 * @returns Interface de formulário com dados veiculares e dados do proprietário.
 */
export default async function NovoVeiculoPage() {
  // Exige que o usuário possua papel de admin, mecânico ou atendente em oficina homologada
  await requireApprovedRole(["admin", "mecanico", "atendente"]);

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
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Cadastrar Veículo
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Gera o passaporte digital do veículo com controle de odômetro auditado e histórico de revisões.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8">
          <CadastrarVeiculoForm />
        </div>
      </main>
    </div>
  );
}
