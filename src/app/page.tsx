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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo e Identidade da Marca */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="IDfeed - Início"
          >
            <div className="relative h-9 w-36 sm:w-44 flex items-center">
              <Image
                src="/IDfeed-logo.jpg"
                alt="IDfeed - Identidade Digital Veicular"
                width={200}
                height={56}
                priority
                referrerPolicy="no-referrer"
                className="h-9 w-auto object-contain"
              />
            </div>
          </Link>

          {/* Navegação e Acesso Oficina */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/loja/login"
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 rounded-lg transition-colors"
            >
              Área da Oficina
            </Link>

            <Link
              href="/loja/criar-conta"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-xs hover:shadow-sm transition-all"
            >
              Cadastrar Loja
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline-block text-slate-300" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── CONTEÚDO PRINCIPAL (HERO + FORMULÁRIO) ─── */}
      <main className="flex-1">
        <section className="py-10 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">

            {/* Headline com Tipografia Refinada */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4">
              Consulte o histórico do veículo
            </h1>

            {/* Subheading Explicativo */}
            <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Acesse o prontuário eletrônico unificado com quilometragem auditada,
              trocas de peças e revisões preventivas atestadas por oficinas
              mecânicas credenciadas.
            </p>

            {/* Componente de Consulta Interativa com Validação HMAC */}
            <div className="w-full max-w-2xl mx-auto">
              <ConsultaVeiculo />
            </div>
          </div>
        </section>

        {/* ─── PILARES DE CONFIANÇA E BENEFÍCIOS ─── */}
        <section className="no-print py-14 px-4 sm:px-6 border-t border-slate-200/80 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                Garantia & Procedência
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Por que o prontuário IDfeed valoriza o seu veículo?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Auditoria de odômetro */}
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-colors">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Proteção Contra Fraude de Odômetro
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  A quilometragem é aferida fisicamente pela oficina em cada
                  visita e gravada no histórico imutável, impedindo
                  adulterações na revenda.
                </p>
              </div>

              {/* Card 2: Dossiê completo */}
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-colors">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Dossiê Completo de Serviços
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Comprove o cuidado com seu carro apresentando datas, tipos de
                  serviço e notas de manutenção para compradores e seguradoras.
                </p>
              </div>

              {/* Card 3: LGPD e Segurança */}
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-colors">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Sigilo e Conformidade LGPD
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Consulta protegida com validação criptográfica HMAC SHA-256 do
                  CPF do titular, impedindo acessos curiosos sem autorização.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── BANNER PARA OFICINAS MECÂNICAS ─── */}
        <section className="no-print py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900 text-white p-8 sm:p-12 relative overflow-hidden shadow-md">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10 mb-4">
                Para Oficinas Mecânicas & Centros Automotivos
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
                Modernize o atendimento e fidelize seus clientes com o IDfeed
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed mb-6">
                Substitua papéis e carimbos pelo prontuário digital. Controle
                estoque de peças, ordens de serviço e emita passaportes digitais
                com a marca da sua oficina.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/loja/criar-conta"
                  className="px-5 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors shadow-sm"
                >
                  Cadastrar Minha Oficina
                </Link>
                <Link
                  href="/loja/login"
                  className="px-5 py-3 rounded-xl bg-slate-800/90 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 border border-slate-700 transition-colors"
                >
                  Acessar Minha Conta
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
