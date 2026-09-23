/**
 * @file page.tsx
 * @description Página inicial pública (Landing Page) da plataforma IDfeed.
 * Contém a interface de consulta pública de veículos com verificação HMAC/CPF,
 * apresentação dos pilares de segurança e acessos rápidos para oficinas e administradores.
 * @module app/page
 * @recommendedPath src/app/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

// 2. Componentes internos
import ConsultaVeiculo from "@/components/consultaVeiculos";

/**
 * Força a renderização dinâmica para garantir que dados recentes sejam obtidos na consulta.
 */
export const dynamic = "force-dynamic";

/**
 * Componente funcional da Página Inicial (Home).
 *
 * @returns Interface completa da página inicial pública com cabeçalho, hero de consulta,
 * pilares de transparência/procedência e chamada para oficinas mecânicas.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* ─── CABEÇALHO MODERNO ─── */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo e Identidade da Marca */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none shrink-0"
            aria-label="IDfeed - Início"
          >
            <div className="relative h-7 sm:h-9 w-28 sm:w-44 flex items-center">
              <Image
                src="/IDfeed-logo.jpg"
                alt="IDfeed - Identidade Digital Veicular"
                width={200}
                height={56}
                priority
                referrerPolicy="no-referrer"
                className="h-7 sm:h-9 w-auto object-contain"
              />
            </div>
          </Link>

          {/* Navegação e Acesso Oficina */}
          <nav className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              id="link-nav-login-oficina"
              href="/loja/login"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">Área da </span>Oficina
            </Link>

            <Link
              href="/loja/criar-conta"
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">Cadastrar Oficina</span>
              <span className="sm:hidden">Cadastrar</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline-block text-slate-300" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── CONTEÚDO PRINCIPAL (HERO + FORMULÁRIO) ─── */}
      <main className="flex-1">
        <section className="py-10 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            {/* Headline Direta e Funcional */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.15] mb-4">
              Consulta de Histórico e Prontuário Veicular
            </h1>

            {/* Subheading Objetivo */}
            <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Verifique o histórico oficial de manutenções, quilometragem registrada em ordens de serviço e revisões preventivas emitidas por oficinas credenciadas.
            </p>

            {/* Componente de Consulta Interativa */}
            <div className="w-full max-w-2xl mx-auto">
              <ConsultaVeiculo />
            </div>
          </div>
        </section>

        {/* ─── PILARES DE CONFIANÇA E BENEFÍCIOS ─── */}
        <section className="no-print py-14 px-4 sm:px-6 border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Como funciona o prontuário digital IDfeed
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Informações técnicas lançadas diretamente por oficinas durante a execução dos serviços.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Auditoria de odômetro */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Registro Cronológico de Km
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  A quilometragem é inserida na abertura e encerramento de cada ordem de serviço, gerando uma linha do tempo auditável de uso do veículo.
                </p>
              </div>

              {/* Card 2: Dossiê completo */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Comprovação de Manutenção
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Discriminação de serviços executados, datas de realização e oficina responsável, facilitando vistorias e negociações de compra e venda.
                </p>
              </div>

              {/* Card 3: LGPD e Segurança */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Privacidade dos Dados (LGPD)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  A consulta detalhada exige confirmação conjunta de placa e CPF do proprietário registrado, resguardando informações pessoais.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── BANNER PARA OFICINAS MECÂNICAS ─── */}
        <section className="no-print py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto rounded-2xl bg-slate-900 text-white p-8 sm:p-10 border border-slate-800">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Para Oficinas Mecânicas &amp; Centros Automotivos
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-3">
                Emita prontuários digitais e organize suas ordens de serviço
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                Cadastre sua oficina para emitir ordens de serviço digitais, registrar quilometragem conferida e fornecer ao cliente acesso transparente ao histórico do carro.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/loja/criar-conta"
                  className="px-4 py-2.5 rounded-lg bg-white text-slate-900 font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-colors"
                >
                  Cadastrar Oficina
                </Link>
                <Link
                  href="/loja/login"
                  className="px-4 py-2.5 rounded-lg bg-slate-800 text-white font-medium text-xs sm:text-sm hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  Acessar Painel da Oficina
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── RODAPÉ PROFISSIONAL ─── */}
      <footer className="no-print bg-white border-t border-slate-200 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Image
              src="/IDfeed-logo.jpg"
              alt="IDfeed"
              width={120}
              height={34}
              referrerPolicy="no-referrer"
              className="h-7 w-auto object-contain opacity-90"
            />
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} IDfeed. A identidade digital e histórico do seu veículo.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <Link
              id="link-footer-feedback"
              href="/feedback"
              className="hover:text-slate-900 transition-colors"
            >
              Canal de Opinião &amp; Suporte
            </Link>
            <Link href="/loja/login" className="hover:text-slate-900 transition-colors">
              Acesso Oficina
            </Link>
            <Link href="/loja/criar-conta" className="hover:text-slate-900 transition-colors">
              Credenciamento
            </Link>
            <Link
              href="/admin/login"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              Acesso Administrativo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
