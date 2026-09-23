/**
 * @file page.tsx
 * @description Página dedicada (/feedback) para coleta, envio e visualização de opiniões e feedbacks de clientes e testadores.
 * Permite compartilhar um link direto para testadores avaliarem a plataforma em fase de homologação e deploy.
 * @module app/feedback/page
 * @recommendedPath src/app/feedback/page.tsx
 */

// 1. Dependências e bibliotecas externas
import React from "react";
import Link from "next/link";
import { ArrowLeft, Star, MessageSquareHeart, CheckCircle2 } from "lucide-react";

// 2. Componentes internos
import FeedbackForm from "@/components/feedback-form";

// 3. Ações e serviços internos
import { listarFeedbacks } from "@/actions/feedback";

// 4. Tipos e interfaces
import type { FeedbackItem } from "@/lib/types";

/**
 * Força atualização dinâmica para exibir feedbacks recentes.
 */
export const dynamic = "force-dynamic";

/**
 * Componente da página de feedback para clientes e testadores.
 *
 * @returns Interface completa da área de feedback com formulário e histórico de contribuições.
 */
export default async function FeedbackPage() {
  const feedbacks: FeedbackItem[] = await listarFeedbacks(20);

  // Calcula média de estrelas se houver avaliações
  const feedbacksComNota = feedbacks.filter((f) => typeof f.avaliacao === "number" && f.avaliacao > 0);
  const mediaNotas = feedbacksComNota.length > 0
    ? (feedbacksComNota.reduce((acc, curr) => acc + (curr.avaliacao || 0), 0) / feedbacksComNota.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* ─── CABEÇALHO DA PÁGINA ─── */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 group focus:outline-none shrink-0"
            title="Voltar ao início do IDfleet"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-2xs">
                ID
              </div>
              <span className="text-base font-bold text-[#0F172A] tracking-tight">
                IDfleet
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span><span className="hidden sm:inline">Voltar ao </span>Sistema</span>
          </Link>
        </div>
      </header>

      {/* ─── CONTEÚDO PRINCIPAL ─── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-6 py-6 sm:py-12">
        {/* Banner de Boas-Vindas aos Testadores */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-8 shadow-xs mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Canal Oficial de Atendimento e Avaliação
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Envio de Opiniões e Sugestões
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Utilize este canal para relatar problemas técnicos, enviar sugestões de melhoria ou registrar sua avaliação sobre a consulta e uso do prontuário digital IDfleet.
              </p>
            </div>

            {/* Resumo de Avaliações */}
            {mediaNotas && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center shrink-0 min-w-[170px]">
                <div className="text-3xl font-bold text-slate-900 mb-1 flex items-center justify-center gap-1">
                  <span>{mediaNotas}</span>
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Média de {feedbacksComNota.length} {feedbacksComNota.length === 1 ? "avaliação" : "avaliações"}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Esquerda: Formulário de Feedback */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                <MessageSquareHeart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Formulário de Envio
                </h2>
                <p className="text-[11px] text-slate-500">
                  Sua mensagem será analisada pela equipe técnica
                </p>
              </div>
            </div>

            <FeedbackForm paginaOrigemPadrao="/feedback" />
          </div>

          {/* Coluna Direita: Orientações & Contribuições Recentes */}
          <div className="lg:col-span-5 space-y-6">
            {/* O que avaliar */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Pontos de Atenção Sugeridos
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span><strong>Consulta Veicular:</strong> Rapidez na busca de placa e validação de CPF.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span><strong>Prontuário e Histórico:</strong> Clareza na exibição de ordens de serviço e odômetro.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span><strong>Acesso de Oficinas:</strong> Facilidade no cadastro e emissão de manutenções.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span><strong>Navegação em Dispositivos Móveis:</strong> Ajuste visual em celulares.</span>
                </li>
              </ul>
            </div>

            {/* Feedbacks Recentes */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Registros Recentes
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {feedbacks.length} recebidos
                </span>
              </div>

              {feedbacks.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <p className="text-xs">Nenhum feedback registrado até o momento.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {feedbacks.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">
                            {item.nome || "Usuário anônimo"}
                          </span>
                          <span className="px-1.5 py-0.5 text-[9px] font-medium bg-white text-slate-500 rounded border border-slate-200">
                            {item.tipo_usuario === "cliente"
                              ? "Cliente"
                              : item.tipo_usuario === "oficina"
                              ? "Oficina"
                              : "Testador"}
                          </span>
                        </div>

                        {item.avaliacao && (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: item.avaliacao }).map((_, i) => (
                              <Star
                                key={i}
                                className="w-3 h-3 text-amber-400 fill-amber-400"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="text-slate-600 leading-relaxed italic">
                        &ldquo;{item.mensagem}&rdquo;
                      </p>

                      <div className="text-[10px] text-slate-400">
                        {new Date(item.criado_em).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ─── RODAPÉ SIMPLES ─── */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-400">
        IDfleet • Ambiente de testes e validação com clientes
      </footer>
    </div>
  );
}
