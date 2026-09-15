import Link from "next/link";
import Image from "next/image";
import { Car, Package, ArrowLeft, ArrowRight, Info } from "lucide-react";

export default function NovoRegistroPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Topbar */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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
          <Link
            href="/loja/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Novo Registro
          </h1>
          <p className="text-sm text-slate-500">
            Selecione o tipo de cadastro que você deseja iniciar na sua oficina:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Card Veículo */}
          <Link
            href="/loja/veiculo/novo"
            className="group block p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
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
            className="group block p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                Material ou Peça
              </h2>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Adicione insumos, peças, óleos ou componentes para controle de estoque e consumo nas manutenções.
            </p>
          </Link>
        </div>

        <div className="mt-8 p-4 rounded-xl bg-slate-100/80 border border-slate-200/70 flex items-start gap-3 text-xs text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            Dica: Para registrar uma ordem de serviço, manutenção ou foto de um veículo que já está cadastrado, localize o veículo no painel principal e acesse o botão dentro da página dele.
          </p>
        </div>
      </main>
    </div>
  );
}
