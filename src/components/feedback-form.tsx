/**
 * @file feedback-form.tsx
 * @description Formulário interativo para envio de feedbacks, opiniões e avaliações de clientes e testadores.
 * Utilizado tanto na página dedicada (/feedback) quanto no modal flutuante de testes.
 * @module components/feedback-form
 * @recommendedPath src/components/feedback-form.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Send, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

// 2. Componentes e serviços internos
import { enviarFeedback } from "@/actions/feedback";

// 3. Tipos e interfaces
import type { FeedbackCategoria, FeedbackTipoUsuario } from "@/lib/types";

/**
 * Propriedades para o componente FeedbackForm.
 */
export interface FeedbackFormProps {
  /** Rota ou contexto da tela de origem para auditoria automática. */
  paginaOrigemPadrao?: string;
  /** Função de callback chamada opcionalmente após o envio bem-sucedido. */
  aoConcluir?: () => void;
  /** Se verdadeiro, renderiza uma versão visual mais compacta para modais. */
  compacto?: boolean;
}

/**
 * Componente de formulário para coleta de opiniões e feedbacks de testes.
 *
 * @param props - Propriedades do componente.
 * @returns Interface do formulário de feedback com seleção de estrelas, categoria e envio assíncrono.
 */
export default function FeedbackForm({
  paginaOrigemPadrao,
  aoConcluir,
  compacto = false,
}: FeedbackFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estados dos campos do formulário
  const [avaliacao, setAvaliacao] = useState<number>(5);
  const [hoverAvaliacao, setHoverAvaliacao] = useState<number | null>(null);
  const [tipoUsuario, setTipoUsuario] = useState<FeedbackTipoUsuario>("cliente");
  const [categoria, setCategoria] = useState<FeedbackCategoria>("sugestao");
  const [mensagem, setMensagem] = useState<string>("");
  const [nome, setNome] = useState<string>("");
  const [contato, setContato] = useState<string>("");

  // Estados de feedback visual da submissão
  const [enviadoSucesso, setEnviadoSucesso] = useState<boolean>(false);
  const [mensagemRetorno, setMensagemRetorno] = useState<string>("");
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  // Labels das estrelas para melhor orientação
  const rotulosEstrelas: Record<number, string> = {
    1: "Muito insatisfeito",
    2: "Pode melhorar",
    3: "Neutro / Razoável",
    4: "Bom",
    5: "Excelente experiência!",
  };

  /**
   * Processa o envio do formulário utilizando Server Action.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao(null);

    if (!mensagem.trim()) {
      setErroValidacao("Por favor, digite sua mensagem ou opinião.");
      return;
    }

    const rotaOrigem = paginaOrigemPadrao || (typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined);

    startTransition(async () => {
      try {
        const resultado = await enviarFeedback({
          nome: nome.trim() || undefined,
          contato: contato.trim() || undefined,
          tipo_usuario: tipoUsuario,
          categoria,
          avaliacao,
          mensagem: mensagem.trim(),
          pagina_origem: rotaOrigem,
        });

        if (resultado.success) {
          setEnviadoSucesso(true);
          setMensagemRetorno(resultado.message);
          setMensagem("");
          router.refresh();
          if (aoConcluir) {
            setTimeout(() => {
              aoConcluir();
            }, 2500);
          }
        } else {
          setErroValidacao(resultado.message || "Ocorreu um erro ao enviar. Tente novamente.");
        }
      } catch (err) {
        console.error("Erro no envio:", err);
        setErroValidacao("Não foi possível registrar o feedback no momento.");
      }
    });
  };

  /**
   * Reseta o formulário para permitir novo feedback.
   */
  const handleNovoFeedback = () => {
    setEnviadoSucesso(false);
    setMensagem("");
    setErroValidacao(null);
  };

  if (enviadoSucesso) {
    return (
      <div className="py-8 px-4 text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
          Feedback Enviado com Sucesso!
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed mb-6">
          {mensagemRetorno || "Agradecemos muito pela sua contribuição. Sua opinião nos ajuda a construir uma plataforma cada vez melhor."}
        </p>

        <button
          id="btn-enviar-outro-feedback"
          type="button"
          onClick={handleNovoFeedback}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Enviar outra mensagem</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ─── 1. Avaliação por Estrelas ─── */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 sm:p-4 text-center">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Como está sendo sua experiência geral?
        </label>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1">
          {[1, 2, 3, 4, 5].map((estrela) => {
            const ativa = (hoverAvaliacao !== null ? hoverAvaliacao : avaliacao) >= estrela;
            return (
              <button
                key={estrela}
                id={`btn-estrela-${estrela}`}
                type="button"
                onClick={() => setAvaliacao(estrela)}
                onMouseEnter={() => setHoverAvaliacao(estrela)}
                onMouseLeave={() => setHoverAvaliacao(null)}
                className="p-1 sm:p-1.5 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                title={`Nota ${estrela} de 5`}
              >
                <Star
                  className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                    ativa
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-300 hover:text-slate-400"
                  }`}
                />
              </button>
            );
          })}
        </div>
        <p className="text-[11px] sm:text-xs font-medium text-slate-600">
          {rotulosEstrelas[hoverAvaliacao !== null ? hoverAvaliacao : avaliacao]}
        </p>
      </div>

      {/* ─── 2. Perfil do Testador / Usuário ─── */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Você está testando como:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: "cliente", label: "Cliente / Condutor" },
            { id: "oficina", label: "Oficina Mecânica" },
            { id: "testador", label: "Testador Geral" },
          ].map((item) => (
            <button
              key={item.id}
              id={`btn-perfil-${item.id}`}
              type="button"
              onClick={() => setTipoUsuario(item.id as FeedbackTipoUsuario)}
              className={`px-2.5 py-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                tipoUsuario === item.id
                  ? "bg-blue-50 border-blue-400 text-blue-800 font-semibold shadow-2xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3. Categoria da Mensagem ─── */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Tipo de contribuição:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "sugestao", label: "💡 Sugestão" },
            { id: "elogio", label: "❤️ Elogio" },
            { id: "problema", label: "⚠️ Problema / Bug" },
            { id: "opiniao", label: "💬 Opinião Geral" },
          ].map((item) => (
            <button
              key={item.id}
              id={`btn-cat-${item.id}`}
              type="button"
              onClick={() => setCategoria(item.id as FeedbackCategoria)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer truncate ${
                categoria === item.id
                  ? "bg-slate-900 border-slate-900 text-white font-semibold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 4. Campo de Mensagem Principal ─── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="input-feedback-mensagem" className="block text-xs font-semibold text-slate-700">
            Sua opinião ou relato <span className="text-rose-500">*</span>
          </label>
          <span className="text-[10px] text-slate-400">
            {mensagem.length} / 3000
          </span>
        </div>
        <textarea
          id="input-feedback-mensagem"
          name="mensagem"
          rows={compacto ? 3 : 4}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Conte o que achou da interface, clareza das informações, se encontrou alguma dificuldade ou o que gostaria de ver na plataforma..."
          className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
          maxLength={3000}
          required
        />
      </div>

      {/* ─── 5. Identificação Voluntária (Nome e Contato) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label htmlFor="input-feedback-nome" className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
            <span>Seu nome (opcional)</span>
          </label>
          <input
            id="input-feedback-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Carlos Silva"
            className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label htmlFor="input-feedback-contato" className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
            <span>Contato (WhatsApp / E-mail, opcional)</span>
          </label>
          <input
            id="input-feedback-contato"
            type="text"
            value={contato}
            onChange={(e) => setContato(e.target.value)}
            placeholder="Para retorno sobre sua sugestão"
            className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Mensagem de Erro de Validação */}
      {erroValidacao && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{erroValidacao}</span>
        </div>
      )}

      {/* ─── 6. Botão de Envio ─── */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400 flex items-center gap-1 order-2 sm:order-1 text-center sm:text-left">
          <span>Fase de testes beta do IDfleet</span>
        </p>

        <button
          id="btn-submeter-feedback"
          type="submit"
          disabled={isPending || !mensagem.trim()}
          className="order-1 sm:order-2 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
        >
          {isPending ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Opinião</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
