import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";

export default function NovoRegistroPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Topbar */}
      <header className="border-b border-slate-200/70 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between gap-4">
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
          <Link
            href="/loja/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="mb-10 text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Novo Registro
          </h1>
          <p className="text-sm text-slate-500">
            Selecione o tipo de cadastro que você deseja iniciar na sua oficina:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card Veículo */}
          <Link
            href="/loja/veiculo/novo"
            className="group block p-8 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                Veículo Novo
              </h2>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Cadastre um veículo para emitir seu passaporte digital, gerenciar ordens de serviço e alimentar o prontuário.
            </p>
          </Link>

          {/* Card Material */}
          <Link
            href="/loja/material/novo"
            className="group block p-8 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                Material ou Peça
              </h2>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
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
