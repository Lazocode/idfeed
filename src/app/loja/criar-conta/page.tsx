import Link from "next/link";
import Image from "next/image";
import { criarContaLoja } from "@/actions/conta";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Cadastrar Oficina • IDfeed",
  description: "Credencie sua oficina mecânica e comece a emitir prontuários veiculares auditados.",
};

export default function CriarContaPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
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
            href="/loja/login"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Já tenho conta</span>
          </Link>
        </div>
      </header>

      {/* Formulário Central */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Credenciamento de Oficina
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                Cadastre sua oficina para emitir o passaporte digital e garantir a procedência das revisões.
              </p>
            </div>

            <form action={criarContaLoja} className="space-y-6 text-left">
              {/* SEÇÃO: RESPONSÁVEL */}
              <div>
                <div className="pb-2 mb-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Dados do Responsável
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nome completo *
                    </label>
                    <input
                      name="nome"
                      required
                      maxLength={100}
                      placeholder="Seu nome completo"
                      autoComplete="name"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        CPF *
                      </label>
                      <input
                        name="cpf"
                        required
                        maxLength={14}
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        autoComplete="off"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Telefone *
                      </label>
                      <input
                        name="telefone"
                        required
                        maxLength={20}
                        placeholder="(21) 99999-9999"
                        inputMode="tel"
                        autoComplete="tel"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      E-mail de acesso *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                      placeholder="voce@oficina.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: OFICINA */}
              <div>
                <div className="pb-2 mb-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Dados da Oficina
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nome fantasia da oficina *
                    </label>
                    <input
                      name="nomeLoja"
                      required
                      maxLength={100}
                      placeholder="Ex: Auto Center Mecânica Silva"
                      autoComplete="organization"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        CNPJ *
                      </label>
                      <input
                        name="cnpj"
                        required
                        maxLength={18}
                        placeholder="00.000.000/0000-00"
                        inputMode="numeric"
                        autoComplete="off"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Telefone da oficina *
                      </label>
                      <input
                        name="telefoneLoja"
                        required
                        maxLength={20}
                        placeholder="(21) 3333-3333"
                        inputMode="tel"
                        autoComplete="tel"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO: SENHA */}
              <div>
                <div className="pb-2 mb-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Segurança de Acesso
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Senha (mínimo 10 carac.) *
                    </label>
                    <input
                      type="password"
                      name="senha"
                      required
                      minLength={10}
                      maxLength={128}
                      autoComplete="new-password"
                      placeholder="••••••••••"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirmar senha *
                    </label>
                    <input
                      type="password"
                      name="confirmarSenha"
                      required
                      minLength={10}
                      maxLength={128}
                      autoComplete="new-password"
                      placeholder="••••••••••"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-xs cursor-pointer mt-4"
              >
                <span>Finalizar Cadastro da Oficina</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/loja/login"
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Já possui credenciais cadastradas? Fazer login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
