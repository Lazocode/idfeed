/**
 * @file loja-dashboard-view.tsx
 * @path src/components/loja-dashboard-view.tsx
 * @description Visão técnica e analítica do painel operacional da oficina mecânica (IDfleet).
 * Implementa arquitetura Split View com tabela homologada de alta densidade à esquerda
 * e painel inspetor com dossiê técnico da viatura selecionada à direita, em tema claro.
 * 
 * Dependências Principais:
 * - react: Hooks de gerenciamento de estado e memoização (useState, useMemo)
 * - next/link: Roteamento declarativo do Next.js
 * - next-auth/react: Autenticação de sessão e encerramento (signOut)
 * - lucide-react: Conjunto padronizado de ícones vetoriais
 * - @/lib/utils: Utilitários de formatação de placa e odômetro
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  ChevronDown,
  Copy,
  Check,
  Download,
  SlidersHorizontal,
  ArrowRight,
  LogOut,
  ExternalLink,
  RotateCcw,
  X,
  Search,
  Wrench,
  Camera,
  MessageSquarePlus,
} from "lucide-react";
import { signOut } from "next-auth/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 2. Utilitários e formatadores internos
import {
  formatPlaca,
  formatKm,
  formatMoeda,
  formatData,
  TIPO_SERVICO_LABEL,
} from "@/lib/utils";

/**
 * Opções permitidas para o filtro de estado de conformidade veicular.
 */
export type FiltroEstadoVeiculo = "todos" | "conforme" | "proxima" | "vencida";

/**
 * Estrutura de visibilidade das colunas na tabela de prontuários.
 */
export interface ColunasVisiveis {
  /** Coluna de matrícula / placa veicular. */
  placa: boolean;
  /** Coluna com modelo e versão comercial. */
  modelo: boolean;
  /** Coluna do titular / proprietário. */
  proprietario: boolean;
  /** Coluna de quilometragem aferida no odômetro. */
  km_atual: boolean;
  /** Coluna da estimativa para a próxima intervenção. */
  km_proxima_revisao: boolean;
  /** Coluna de indicador de estado de conformidade. */
  estado: boolean;
}

/**
 * Interface estrita representando os atributos de um veículo no painel operacional.
 */
export interface VeiculoDashboard {
  /** Identificador único do veículo (UUID). */
  id: string;
  /** Matrícula/Placa do veículo (padrão Mercosul ou cinza). */
  placa: string;
  /** Modelo e versão comercial do veículo. */
  modelo: string;
  /** Ano de fabricação/modelo. */
  ano?: number | null;
  /** Cor predominante da lataria. */
  cor?: string | null;
  /** Número de identificação veicular (Chassi). */
  chassi?: string | null;
  /** Quilometragem registrada no odômetro no momento mais recente. */
  km_atual: number;
  /** Previsão de odômetro para a próxima intervenção preventiva. */
  km_proxima_revisao?: number | null;
  /** Nome completo do titular do veículo. */
  proprietario_nome?: string | null;
  /** Cadastro de Pessoa Física do titular. */
  proprietario_cpf?: string | null;
  /** Telefone ou celular para contato com o titular. */
  proprietario_telefone?: string | null;
  /** Endereço de correio eletrônico do titular. */
  proprietario_email?: string | null;
  /** Chave pública alfanumérica única para auditoria descentralizada. */
  public_token?: string | null;
  /** Timestamp ISO de criação do cadastro no sistema. */
  criado_em?: string;
  /** Timestamp ISO da última alteração de dados. */
  atualizado_em?: string;
  /** Ordens de serviço associadas ao veículo para exibição de histórico recente. */
  ordens_servico?: {
    id: string;
    tipo_servico: string;
    km_no_servico: number;
    custo: number | string | null;
    observacao: string | null;
    criado_em: string;
    mecanico?: { nome: string } | null;
    pecas?: { quantidade: number; material?: { nome: string } | null }[];
  }[];
  /** Fotos e documentos visuais associados ao veículo. */
  fotos?: {
    id: string;
    legenda?: string | null;
    criado_em: string;
    url?: string | null;
  }[];
}

/**
 * Interface estrita representando um item de material/peça no inventário da oficina.
 */
export interface MaterialDashboard {
  /** Identificador único do material (UUID). */
  id: string;
  /** Denominação comercial da peça ou insumo. */
  nome: string;
  /** Código SKU (Stock Keeping Unit) para rastreabilidade. */
  sku: string;
  /** Quantidade física disponível para aplicação em manutenções. */
  quantidade_atual: number;
  /** Nível mínimo de reserva antes de disparo de alerta de reposição. */
  quantidade_minima: number;
  /** Timestamp ISO de registro do insumo. */
  criado_em?: string;
}

/**
 * Propriedades para a renderização da interface do painel de controle da oficina.
 */
interface LojaDashboardViewProps {
  /** Dados cadastrais da oficina mecânica ativa. */
  loja: {
    id: string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
  } | null;
  /** Usuário logado atualmente em sessão autenticada. */
  user: {
    nome?: string | null;
    email?: string | null;
    role?: string | null;
  };
  /** Relação de veículos cadastrados e auditados na oficina. */
  veiculos: VeiculoDashboard[];
  /** Peças e insumos sob controle de estoque da oficina. */
  materiais: MaterialDashboard[];
  /** Parâmetro de busca textual aplicado na rota via query string. */
  query: string;
}

export default function LojaDashboardView({
  loja,
  user,
  veiculos,
  materiais,
  query,
}: LojaDashboardViewProps) {
  // Controle de abas de navegação
  const [activeTab, setActiveTab] = useState<
    "visao_geral" | "frota" | "ordens" | "estoque" | "auditorias" | "ajustes"
  >("visao_geral");

  // Estado para feedback visual da cópia do token LGPD
  const [tokenCopiado, setTokenCopiado] = useState(false);

  // Lista estrita de veículos reais cadastrados na oficina (sem dados fictícios de exemplo)
  const listaVeiculos = useMemo(() => {
    return veiculos || [];
  }, [veiculos]);

  // ID do veículo selecionado para o dossiê detalhado (Split View)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    veiculos?.[0]?.id || ""
  );

  // Termo da barra de pesquisa com sincronização instantânea
  const [termoBusca, setTermoBusca] = useState<string>(query || "");
  const inputBuscaRef = useRef<HTMLInputElement>(null);

  // Detecção de plataforma para o rótulo do atalho de teclado (⌘K no Mac / Ctrl+K no Windows e Linux)
  const isMac =
    typeof navigator !== "undefined"
      ? /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent)
      : false;
  const atalhoTeclado = isMac ? "⌘K" : "Ctrl+K";

  // Hook do atalho de teclado ⌘K / Ctrl+K para foco imediato no campo de pesquisa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ativa o atalho se pressionado Ctrl+K (Windows/Linux) ou ⌘K (Mac)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputBuscaRef.current?.focus();
        inputBuscaRef.current?.select();
      } else if (e.key === "Escape" && document.activeElement === inputBuscaRef.current) {
        inputBuscaRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Estados de controle para Filtros, Exportação PDF e Configuração de Colunas
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoVeiculo>("todos");
  const [isFiltrosOpen, setIsFiltrosOpen] = useState(false);
  const [isColunasOpen, setIsColunasOpen] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Referências para controle de clique externo nos popovers
  const filtrosRef = useRef<HTMLDivElement>(null);
  const colunasRef = useRef<HTMLDivElement>(null);

  // Controle de visibilidade individual das colunas da tabela
  const [colunasVisiveis, setColunasVisiveis] = useState<ColunasVisiveis>({
    placa: true,
    modelo: true,
    proprietario: true,
    km_atual: true,
    km_proxima_revisao: true,
    estado: true,
  });

  // Fecha os dropdowns abertos ao clicar fora de seus limites
  useEffect(() => {
    const handleClickFora = (evento: MouseEvent) => {
      const target = evento.target as Node;
      if (filtrosRef.current && !filtrosRef.current.contains(target)) {
        setIsFiltrosOpen(false);
      }
      if (colunasRef.current && !colunasRef.current.contains(target)) {
        setIsColunasOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickFora);
    return () => {
      document.removeEventListener("mousedown", handleClickFora);
    };
  }, []);

  // Quantidade total de colunas atualmente ativas
  const colunasAtivasCount = useMemo(() => {
    return Object.values(colunasVisiveis).filter(Boolean).length;
  }, [colunasVisiveis]);

  /**
   * Avalia a situação do estado de conformidade e formata a exibição do odômetro de próxima revisão.
   *
   * @param v - Objeto do veículo.
   * @returns Objeto com o rótulo da próxima revisão e o estado ('Conforme' | 'Próxima' | 'Imediata' | 'Vencida').
   */
  const calcularEstadoRevisao = (v: VeiculoDashboard) => {
    if (!v.km_proxima_revisao) {
      return {
        textoProxima: "—",
        estado: "Conforme" as const,
        corPonto: "bg-[#10B981]",
      };
    }

    const diff = v.km_proxima_revisao - v.km_atual;

    if (diff < 0) {
      return {
        textoProxima: `${formatKm(v.km_proxima_revisao)} (atrasada)`,
        estado: "Vencida" as const,
        corPonto: "bg-[#EF4444]",
      };
    }

    if (diff <= 300) {
      return {
        textoProxima: `${formatKm(v.km_proxima_revisao)} (em ${diff} km)`,
        estado: "Imediata" as const,
        corPonto: "bg-[#EA580C]",
      };
    }

    if (diff <= 3000) {
      const emK = (diff / 1000).toFixed(1).replace(".0", "");
      return {
        textoProxima: `${formatKm(v.km_proxima_revisao)} (em ${emK}k)`,
        estado: "Próxima" as const,
        corPonto: "bg-[#F59E0B]",
      };
    }

    const emK = (diff / 1000).toFixed(1).replace(".0", "");
    return {
      textoProxima: `${formatKm(v.km_proxima_revisao)} (em ${emK}k)`,
      estado: "Conforme" as const,
      corPonto: "bg-[#10B981]",
    };
  };

  // Contagem dinâmica por estado de conformidade para o painel de filtros
  const contagemEstados = useMemo(() => {
    let conforme = 0;
    let proxima = 0;
    let vencida = 0;

    listaVeiculos.forEach((v) => {
      const info = calcularEstadoRevisao(v);
      if (info.estado === "Conforme") conforme++;
      else if (info.estado === "Próxima" || info.estado === "Imediata") proxima++;
      else if (info.estado === "Vencida") vencida++;
    });

    return { conforme, proxima, vencida };
  }, [listaVeiculos]);

  /**
   * Sanitiza identificadores (placas, tokens, códigos) removendo hífens, pontos e caracteres especiais.
   *
   * @param valor - Texto de entrada a ser normalizado.
   * @returns String alfanumérica limpa em caixa baixa.
   */
  const sanitizarIdentificador = (valor: string | null | undefined): string => {
    if (!valor) return "";
    return valor.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  // Aplicação reativa do filtro de estado e da busca textual nos veículos
  const veiculosFiltrados = useMemo(() => {
    return listaVeiculos.filter((v) => {
      // 1. Filtro por Estado de Revisão
      if (filtroEstado !== "todos") {
        const info = calcularEstadoRevisao(v);
        if (filtroEstado === "conforme" && info.estado !== "Conforme") {
          return false;
        }
        if (
          filtroEstado === "proxima" &&
          info.estado !== "Próxima" &&
          info.estado !== "Imediata"
        ) {
          return false;
        }
        if (filtroEstado === "vencida" && info.estado !== "Vencida") {
          return false;
        }
      }

      // 2. Filtro instantâneo por busca textual (placa, modelo/versão, proprietário ou token)
      if (termoBusca && termoBusca.trim().length > 0) {
        const termoTrim = termoBusca.trim().toLowerCase();
        const termoSanitizado = sanitizarIdentificador(termoBusca);

        // Correspondência por Placa (insensível a hífens, maiúsculas/minúsculas e espaços)
        const placaSanitizada = sanitizarIdentificador(v.placa);
        const placaMatch =
          placaSanitizada.includes(termoSanitizado) ||
          (v.placa ? v.placa.toLowerCase().includes(termoTrim) : false);

        // Correspondência por Modelo e Versão
        const modeloMatch = v.modelo
          ? v.modelo.toLowerCase().includes(termoTrim)
          : false;

        // Correspondência por Nome do Proprietário
        const propMatch = v.proprietario_nome
          ? v.proprietario_nome.toLowerCase().includes(termoTrim)
          : false;

        // Correspondência por Token Público / Ordem de Serviço / ID
        const tokenMatch =
          (v.public_token && v.public_token.toLowerCase().includes(termoTrim)) ||
          v.id.toLowerCase().includes(termoTrim);

        if (!placaMatch && !modeloMatch && !propMatch && !tokenMatch) {
          return false;
        }
      }

      return true;
    });
  }, [listaVeiculos, filtroEstado, termoBusca]);

  // Viatura ativa no painel de inspeção lateral, mantida sincronizada com os filtros e busca
  const veiculoSelecionado = useMemo<VeiculoDashboard | null>(() => {
    if (veiculosFiltrados.length === 0) {
      return null;
    }
    const encontrado = veiculosFiltrados.find((v) => v.id === selectedVehicleId);
    return encontrado || veiculosFiltrados[0];
  }, [veiculosFiltrados, selectedVehicleId]);

  // 1. Cálculos de métricas e KPIs operacionais da frota (100% dados reais)
  const totalVeiculos = veiculos.length;

  const emDia = useMemo(() => {
    return veiculos.filter(
      (v) => !v.km_proxima_revisao || v.km_proxima_revisao - v.km_atual > 3000
    ).length;
  }, [veiculos]);

  const revisaoProxima = useMemo(() => {
    return veiculos.filter(
      (v) =>
        v.km_proxima_revisao &&
        v.km_proxima_revisao - v.km_atual <= 3000 &&
        v.km_proxima_revisao - v.km_atual >= 0
    ).length;
  }, [veiculos]);

  const revisoesVencidas = useMemo(() => {
    return veiculos.filter(
      (v) => v.km_proxima_revisao && v.km_proxima_revisao - v.km_atual < 0
    ).length;
  }, [veiculos]);

  const veiculosEsteMes = useMemo(() => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth();
    return veiculos.filter((v) => {
      if (!v.criado_em) return false;
      const d = new Date(v.criado_em);
      return d.getFullYear() === ano && d.getMonth() === mes;
    }).length;
  }, [veiculos]);

  const estoqueBaixo = useMemo(() => {
    return materiais.filter((m) => m.quantidade_atual < m.quantidade_minima).length;
  }, [materiais]);

  const percentEmDia = useMemo(() => {
    if (totalVeiculos > 0) {
      return ((emDia / totalVeiculos) * 100).toFixed(1);
    }
    return "100.0";
  }, [emDia, totalVeiculos]);

  /**
   * Exporta a listagem atual de veículos filtrados em formato PDF estruturado.
   * Gera um documento formatado com cabeçalho institucional do IDfleet, metadados da oficina,
   * data/hora da emissão, tabela analítica tipografada com as colunas visíveis e paginação no rodapé.
   *
   * @returns void
   */
  const handleExportarPdf = () => {
    if (veiculosFiltrados.length === 0) return;

    setExportando(true);

    try {
      // Cria o documento PDF em orientação paisagem para melhor legibilidade dos dados técnicos
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const dataHoje = new Date();
      const dataFormatada = dataHoje.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const horaFormatada = dataHoje.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dataArquivo = dataHoje.toISOString().slice(0, 10);

      // 1. Cabeçalho Institucional do IDfleet
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("IDfleet • Identidade Digital Veicular", 40, 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Relatório Operacional de Prontuários Veiculares Cadastrados", 40, 50);

      // Metadados da Oficina e Emissão alinhados à direita
      const nomeOficina = loja?.nome || "Oficina Mecânica";
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(`Oficina: ${nomeOficina}`, 802, 34, { align: "right" });
      doc.text(`Emissão: ${dataFormatada} às ${horaFormatada}`, 802, 47, { align: "right" });
      doc.text(`Total de Veículos: ${veiculosFiltrados.length}`, 802, 60, { align: "right" });

      // Linha separadora horizontal sutil
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.line(40, 68, 802, 68);

      // 2. Montagem dos Cabeçalhos e Linhas conforme colunas ativas
      const cabecalhos: string[] = [];
      if (colunasVisiveis.placa) cabecalhos.push("Matrícula / Placa");
      if (colunasVisiveis.modelo) cabecalhos.push("Veículo & Versão");
      if (colunasVisiveis.proprietario) cabecalhos.push("Proprietário");
      if (colunasVisiveis.km_atual) cabecalhos.push("Odômetro Atual");
      if (colunasVisiveis.km_proxima_revisao) cabecalhos.push("Próxima Revisão");
      if (colunasVisiveis.estado) cabecalhos.push("Estado");

      const corpoTabela: string[][] = veiculosFiltrados.map((v) => {
        const linha: string[] = [];
        const infoRevisao = calcularEstadoRevisao(v);

        if (colunasVisiveis.placa) linha.push(formatPlaca(v.placa));
        if (colunasVisiveis.modelo) linha.push(v.modelo || "—");
        if (colunasVisiveis.proprietario) linha.push(v.proprietario_nome || "—");
        if (colunasVisiveis.km_atual) linha.push(formatKm(v.km_atual));
        if (colunasVisiveis.km_proxima_revisao) linha.push(infoRevisao.textoProxima);
        if (colunasVisiveis.estado) {
          const statusMap: Record<string, string> = {
            em_dia: "Em Dia",
            alerta: "Atenção",
            vencida: "Vencida",
          };
          linha.push(statusMap[infoRevisao.estado] || infoRevisao.estado);
        }

        return linha;
      });

      // 3. Renderização tabular com jspdf-autotable
      autoTable(doc, {
        head: [cabecalhos],
        body: corpoTabela,
        startY: 78,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 8.5,
          textColor: [30, 41, 59], // slate-800
          cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
          lineColor: [241, 245, 249], // slate-100
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [15, 23, 42], // slate-900
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8.5,
          cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // slate-50
        },
        margin: { top: 40, right: 40, bottom: 40, left: 40 },
        didParseCell: (data) => {
          // Destaca visualmente o estado da revisão com cores semânticas
          if (data.section === "body" && cabecalhos[data.column.index] === "Estado") {
            const val = String(data.cell.raw).toLowerCase();
            if (val.includes("em dia")) {
              data.cell.styles.textColor = [16, 149, 106]; // emerald-700
              data.cell.styles.fontStyle = "bold";
            } else if (val.includes("atenção") || val.includes("atencao") || val.includes("alerta")) {
              data.cell.styles.textColor = [217, 119, 6]; // amber-600
              data.cell.styles.fontStyle = "bold";
            } else if (val.includes("vencida")) {
              data.cell.styles.textColor = [225, 29, 72]; // rose-600
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      // 4. Numeração e Rodapé em todas as páginas geradas
      const totalPaginas = doc.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          "IDfleet • Sistema de Prontuário e Identidade Digital Veicular Auditada",
          40,
          575
        );
        doc.text(
          `Página ${i} de ${totalPaginas}`,
          802,
          575,
          { align: "right" }
        );
      }

      // 5. Salva o arquivo no formato PDF
      doc.save(`prontuarios-veiculares-${dataArquivo}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setTimeout(() => setExportando(false), 2000);
    }
  };

  /**
   * Alterna a visibilidade de uma coluna específica da tabela.
   * Assegura que ao menos uma coluna permaneça sempre visível.
   *
   * @param chave - Identificador da coluna a ser alternada.
   */
  const handleToggleColuna = (chave: keyof ColunasVisiveis) => {
    setColunasVisiveis((prev) => {
      const ativas = Object.values(prev).filter(Boolean).length;
      if (prev[chave] && ativas <= 1) {
        return prev;
      }
      return {
        ...prev,
        [chave]: !prev[chave],
      };
    });
  };

  /**
   * Restaura todas as colunas para o estado visível padrão.
   */
  const handleRestaurarColunas = () => {
    setColunasVisiveis({
      placa: true,
      modelo: true,
      proprietario: true,
      km_atual: true,
      km_proxima_revisao: true,
      estado: true,
    });
  };

  /**
   * Limpa o termo de pesquisa e devolve o foco imediatamente ao campo de busca.
   */
  const handleLimparBusca = () => {
    setTermoBusca("");
    inputBuscaRef.current?.focus();
  };

  /**
   * Limpa o termo de pesquisa e redefine o filtro de estado para exibir todos os registros.
   */
  const handleLimparBuscaEFiltros = () => {
    setTermoBusca("");
    setFiltroEstado("todos");
    inputBuscaRef.current?.focus();
  };

  /**
   * Copia a chave pública de auditoria (token LGPD) para a área de transferência.
   *
   * @param token - Chave pública alfanumérica.
   */
  const handleCopyToken = (token: string) => {
    if (!token) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(token);
      setTokenCopiado(true);
      setTimeout(() => setTokenCopiado(false), 2000);
    }
  };

  // Formatação do nome de usuário do cabeçalho
  const displayUserName = user?.nome
    ? user.nome.split(" ").slice(0, 2).join(" ")
    : user?.email
    ? user.email.split("@")[0]
    : "Operador";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* ─────────────────────────────────────────────────────────────
          1. BARRA SUPERIOR (HEADER PRINCIPAL COM BUSCA E REGISTRO)
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Lado Esquerdo: Logo + Seleção da Oficina */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <Link
              href="/loja/dashboard"
              className="flex items-center gap-2 group focus:outline-none shrink-0"
              title="IDfleet - Identidade Digital Veicular"
              aria-label="IDfleet - Início"
            >
              <div className="relative h-7 w-28 sm:h-8 sm:w-36 flex items-center">
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

            <div className="h-4 w-px bg-slate-200 mx-0.5 sm:mx-1 shrink-0" aria-hidden="true" />

            {/* Dropdown de Seleção da Oficina Mecânica */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors min-w-0">
              <span className="truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[200px]">
                {loja?.nome || "Oficina Bom Motor"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Lado Direito: Ações (Feedback, Registrar, Perfil, Sair) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              id="btn-header-feedback"
              href="/feedback"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
              title="Deixar opinião ou avaliação durante esta fase de testes"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Feedback</span>
            </Link>

            <Link
              id="btn-cadastrar-novo"
              href="/loja/novo"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
              <span className="hidden xs:inline sm:inline">Registrar</span>
            </Link>

            {/* Pílula de Perfil do Usuário com Ponto de Estado */}
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="truncate max-w-[120px]">{displayUserName}</span>
            </div>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/loja/login" })}
              title="Encerrar Sessão"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. SEGUNDA BARRA (NAVEGAÇÃO POR ABAS HORIZONTAIS)
      ───────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200/80">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 flex items-center gap-6 sm:gap-8 text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
          
          <button
            type="button"
            onClick={() => setActiveTab("visao_geral")}
            className={`py-3.5 transition-colors relative cursor-pointer ${
              activeTab === "visao_geral"
                ? "text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            Visão Geral
            {activeTab === "visao_geral" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("frota")}
            className={`py-3.5 transition-colors relative cursor-pointer ${
              activeTab === "frota"
                ? "text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            Frota de Veículos ({totalVeiculos})
            {activeTab === "frota" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("estoque")}
            className={`py-3.5 transition-colors relative cursor-pointer ${
              activeTab === "estoque"
                ? "text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            Estoque &amp; Insumos
            {activeTab === "estoque" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          3. FAIXA SUPERIOR DE 4 MÉTRICAS COMPACTAS COM PONTOS
      ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="Indicadores Chave de Desempenho (KPIs)"
        className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-2"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          
          {/* Card 1: Veículos Cadastrados */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wider uppercase truncate">
              Veículos Cadastrados
            </span>
            <div className="mt-1.5 sm:mt-2 mb-1">
              <span className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
                {totalVeiculos}
              </span>
            </div>
            <div className="flex items-center text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A] inline-block mr-1.5 shrink-0" />
              <span className="truncate">{veiculosEsteMes > 0 ? `+${veiculosEsteMes} este mês` : "Base cadastrada"}</span>
            </div>
          </div>

          {/* Card 2: Odômetro Auditado / Em Dia */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wider uppercase truncate">
              Odômetro Em Dia
            </span>
            <div className="mt-1.5 sm:mt-2 mb-1">
              <span className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
                {emDia}
              </span>
            </div>
            <div className="flex items-center text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block mr-1.5 shrink-0" />
              <span className="truncate">{percentEmDia}% conformidade</span>
            </div>
          </div>

          {/* Card 3: Revisões Programadas (<3.000 km) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wider uppercase truncate">
              Revisões Próximas
            </span>
            <div className="mt-1.5 sm:mt-2 mb-1">
              <span className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
                {revisaoProxima}
              </span>
            </div>
            <div className="flex items-center text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 shrink-0 ${
                  revisoesVencidas > 0 ? "bg-[#EF4444]" : "bg-[#10B981]"
                }`}
              />
              <span className="truncate">
                {revisoesVencidas > 0
                  ? `${revisoesVencidas} expiradas`
                  : "Nenhuma expirada"}
              </span>
            </div>
          </div>

          {/* Card 4: Alertas de Estoque */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wider uppercase truncate">
              Alertas de Estoque
            </span>
            <div className="mt-1.5 sm:mt-2 mb-1">
              <span className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
                {String(estoqueBaixo).padStart(2, "0")}
              </span>
            </div>
            <div className="flex items-center text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 shrink-0 ${
                  estoqueBaixo > 0 ? "bg-[#EF4444]" : "bg-[#10B981]"
                }`}
              />
              <span className="truncate">
                {estoqueBaixo > 0
                  ? "Abaixo do limite"
                  : "Em conformidade"}
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. ÁREA PRINCIPAL: ARQUITETURA SPLIT VIEW (TABELA + INSPETOR)
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-4">
        
        {activeTab === "estoque" ? (
          /* Visualização de Estoque quando selecionada a aba correspondente */
          <section
            aria-label="Tabela de Materiais e Peças de Estoque"
            className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden"
          >
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A]">
                  Inventário Físico da Oficina
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Controle de peças, componentes e insumos com alertas de reposição.
                </p>
              </div>
              <Link
                href="/loja/material/novo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Material</span>
              </Link>
            </div>

            <div className="block sm:hidden text-[10px] text-slate-400 px-4 py-1.5 bg-slate-50 border-b border-[#E2E8F0] text-center">
              ⟵ Arraste para os lados para visualizar os dados ⟶
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[620px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Código SKU</th>
                    <th className="py-3 px-4">Descrição da Peça</th>
                    <th className="py-3 px-4 text-right">Qtd. em Estoque</th>
                    <th className="py-3 px-4 text-right">Cota Mínima</th>
                    <th className="py-3 px-4 text-center">Situação</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {materiais.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        Nenhum material encontrado no inventário.
                      </td>
                    </tr>
                  ) : (
                    materiais.map((m) => {
                      const isBaixo = m.quantidade_atual < m.quantidade_minima;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">
                            <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                              {m.sku}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-[#0F172A]">{m.nome}</td>
                          <td className="py-3 px-4 font-mono font-bold text-right text-[#0F172A]">
                            {m.quantidade_atual} un.
                          </td>
                          <td className="py-3 px-4 font-mono text-right text-slate-500">
                            {m.quantidade_minima} un.
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isBaixo ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#EF4444]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                                Crítico ({m.quantidade_atual} un.)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#10B981]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/loja/material/${m.id}`}
                              className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Detalhes</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          /* Split View Padrão: Barra de Filtros Externa + (Tabela Densa à Esquerda + Inspetor à Direita) */
          <div className="space-y-4">
            
            {/* ════════════ BARRA DE PESQUISA E FILTROS OPERACIONAIS (EXTERNA À TABELA) ════════════ */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Campo de Pesquisa Rápida Responsivo */}
              <div className="relative w-full md:flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={inputBuscaRef}
                  id="input-busca-dashboard"
                  name="q"
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder="Buscar por placa, modelo, proprietário..."
                  className="w-full bg-[#F8FAFC] focus:bg-white border border-[#E2E8F0] focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-lg pl-10 pr-9 sm:pr-20 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 transition-colors focus:outline-none"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {termoBusca.length > 0 ? (
                    <button
                      id="btn-limpar-busca-input"
                      type="button"
                      onClick={handleLimparBusca}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer"
                      title="Limpar pesquisa (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <kbd
                      onClick={() => {
                        inputBuscaRef.current?.focus();
                      }}
                      className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-[#E2E8F0] rounded shadow-2xs cursor-pointer select-none"
                      title={`Pressione ${atalhoTeclado} para pesquisar`}
                    >
                      {atalhoTeclado}
                    </kbd>
                  )}
                </div>
              </div>

              {/* Ações de Filtragem e Visualização */}
              <div className="w-full md:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                {/* Dropdown: Filtros */}
                <div className="relative flex-1 sm:flex-initial" ref={filtrosRef}>
                  <button
                    id="btn-tabela-filtros"
                    type="button"
                    onClick={() => {
                      setIsFiltrosOpen((prev) => !prev);
                      setIsColunasOpen(false);
                    }}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                      filtroEstado !== "todos"
                        ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                        : "text-slate-700 bg-white border-[#E2E8F0] hover:bg-slate-50"
                    }`}
                    title="Filtrar por estado de conformidade"
                  >
                    <span>Filtros</span>
                    {filtroEstado !== "todos" && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isFiltrosOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Popover Menu: Filtros */}
                  {isFiltrosOpen && (
                    <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-60 max-w-[calc(100vw-2rem)] bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                        <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                          Estado da Revisão
                        </span>
                        {filtroEstado !== "todos" && (
                          <button
                            type="button"
                            onClick={() => setFiltroEstado("todos")}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                          >
                            Limpar
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroEstado("todos");
                            setIsFiltrosOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            filtroEstado === "todos"
                              ? "bg-slate-100 text-[#0F172A] font-bold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span>Todos</span>
                          <span className="text-[11px] text-slate-400 font-mono font-normal">
                            {listaVeiculos.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFiltroEstado("conforme");
                            setIsFiltrosOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            filtroEstado === "conforme"
                              ? "bg-emerald-50 text-emerald-800 font-bold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                            <span>Conforme</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono font-normal">
                            {contagemEstados.conforme}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFiltroEstado("proxima");
                            setIsFiltrosOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            filtroEstado === "proxima"
                              ? "bg-amber-50 text-amber-800 font-bold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                            <span>Próxima revisão</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono font-normal">
                            {contagemEstados.proxima}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFiltroEstado("vencida");
                            setIsFiltrosOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            filtroEstado === "vencida"
                              ? "bg-rose-50 text-rose-800 font-bold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                            <span>Vencida</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono font-normal">
                            {contagemEstados.vencida}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dropdown: Configurar colunas */}
                <div className="relative flex-1 sm:flex-initial" ref={colunasRef}>
                  <button
                    id="btn-tabela-configurar-colunas"
                    type="button"
                    onClick={() => {
                      setIsColunasOpen((prev) => !prev);
                      setIsFiltrosOpen(false);
                    }}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                      isColunasOpen
                        ? "bg-slate-50 text-slate-900 border-slate-300 font-semibold"
                        : "text-slate-700 bg-white border-[#E2E8F0] hover:bg-slate-50"
                    }`}
                    title="Configurar visibilidade das colunas"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Colunas</span>
                  </button>

                  {/* Popover Menu: Configurar Colunas */}
                  {isColunasOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-0 top-full mt-1.5 w-64 max-w-[calc(100vw-2rem)] bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                        <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                          Colunas Visíveis
                        </span>
                        <button
                          type="button"
                          onClick={handleRestaurarColunas}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                          title="Exibir todas as colunas padrão"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Padrão</span>
                        </button>
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={colunasVisiveis.placa}
                            onChange={() => handleToggleColuna("placa")}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                          />
                          <span className="text-slate-700">Matrícula / Placa</span>
                        </label>

                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={colunasVisiveis.modelo}
                            onChange={() => handleToggleColuna("modelo")}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                          />
                          <span className="text-slate-700">Veículo &amp; Versão</span>
                        </label>

                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={colunasVisiveis.proprietario}
                            onChange={() => handleToggleColuna("proprietario")}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                          />
                          <span className="text-slate-700">Proprietário</span>
                        </label>

                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={colunasVisiveis.km_atual}
                            onChange={() => handleToggleColuna("km_atual")}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                          />
                          <span className="text-slate-700">Odômetro Atual</span>
                        </label>

                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={colunasVisiveis.km_proxima_revisao}
                            onChange={() => handleToggleColuna("km_proxima_revisao")}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                          />
                          <span className="text-slate-700">Próxima Revisão</span>
                        </label>

                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={colunasVisiveis.estado}
                            onChange={() => handleToggleColuna("estado")}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                          />
                          <span className="text-slate-700">Estado</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botão: Exportar PDF */}
                <button
                  id="btn-tabela-exportar"
                  type="button"
                  onClick={handleExportarPdf}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                  title="Exportar registros filtrados em arquivo PDF formatado"
                >
                  {exportando ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 font-semibold">Gerado!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Exportar PDF</span>
                    </>
                  )}
                </button>

                {/* Indicador de Filtro Ativo com Botão Limpar */}
                {filtroEstado !== "todos" && (
                  <button
                    type="button"
                    onClick={() => setFiltroEstado("todos")}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200"
                    title="Limpar filtro ativo"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" />
                    <span>Limpar filtro</span>
                  </button>
                )}
              </div>
            </div>

            {/* Split View: Tabela Densa à Esquerda + Inspetor à Direita */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* ════════════ LADO ESQUERDO: TABELA DENSA DE VIATURAS ════════════ */}
            <section
              aria-label="Prontuários Veiculares Ativos"
              className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden"
            >
              {/* Header da Tabela com Título e Quantidade */}
              <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-[#0F172A]">
                    Prontuários Veiculares Ativos
                  </h1>
                  <span className="text-xs text-slate-400 font-normal">
                    • {veiculosFiltrados.length}{" "}
                    {veiculosFiltrados.length === 1
                      ? "registro cadastrado"
                      : "registros cadastrados"}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  {filtroEstado !== "todos" ? (
                    <span className="font-semibold text-blue-600">
                      Filtrado: {filtroEstado}
                    </span>
                  ) : (
                    <span className="hidden sm:inline">Base homologada</span>
                  )}
                </div>
              </div>

              {/* Tabela Densa de Veículos com Rolagem Horizontal Suave */}
              <div className="block sm:hidden text-[10px] text-slate-400 px-4 py-1.5 bg-slate-50 border-b border-[#E2E8F0] text-center">
                ⟵ Arraste para os lados para visualizar os dados ⟶
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[680px]">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#FFFFFF] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {colunasVisiveis.placa && (
                        <th className="py-3 px-4 whitespace-nowrap">Matrícula / Placa</th>
                      )}
                      {colunasVisiveis.modelo && (
                        <th className="py-3 px-4 whitespace-nowrap">Veículo &amp; Versão</th>
                      )}
                      {colunasVisiveis.proprietario && (
                        <th className="py-3 px-4 whitespace-nowrap">Proprietário</th>
                      )}
                      {colunasVisiveis.km_atual && (
                        <th className="py-3 px-4 whitespace-nowrap">Odômetro Atual</th>
                      )}
                      {colunasVisiveis.km_proxima_revisao && (
                        <th className="py-3 px-4 whitespace-nowrap">Próxima Revisão</th>
                      )}
                      {colunasVisiveis.estado && (
                        <th className="py-3 px-4 whitespace-nowrap">Estado</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {veiculosFiltrados.length === 0 ? (
                      <tr>
                        <td
                          colSpan={colunasAtivasCount}
                          className="py-12 text-center text-slate-400 text-xs"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Search className="w-5 h-5 text-slate-300" />
                            <p className="font-semibold text-slate-700">
                              {termoBusca
                                ? `Nenhum veículo encontrado para "${termoBusca}".`
                                : "Nenhum veículo encontrado para os filtros ativos."}
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-sm">
                              {termoBusca
                                ? "Tente buscar por outra placa, modelo ou proprietário."
                                : "Tente alterar ou redefinir os filtros selecionados."}
                            </p>
                            <button
                              type="button"
                              onClick={handleLimparBuscaEFiltros}
                              className="mt-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md font-semibold cursor-pointer transition-colors"
                            >
                              {termoBusca ? "Limpar busca" : "Limpar filtros"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      veiculosFiltrados.map((v) => {
                        const isSelected = veiculoSelecionado?.id === v.id;
                        const { textoProxima, estado, corPonto } = calcularEstadoRevisao(v);

                        return (
                          <tr
                            key={v.id}
                            id={`row-veiculo-${v.id}`}
                            onClick={() => setSelectedVehicleId(v.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-[#F8FAFC]"
                                : "hover:bg-slate-50/80 bg-white"
                            }`}
                          >
                            {/* Coluna 1: Matrícula / Placa com Badge */}
                            {colunasVisiveis.placa && (
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="inline-block px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-xs font-bold text-[#0F172A] tracking-wider text-center min-w-[76px]">
                                  {formatPlaca(v.placa)}
                                </span>
                              </td>
                            )}

                            {/* Coluna 2: Veículo & Versão */}
                            {colunasVisiveis.modelo && (
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`text-xs ${
                                    isSelected
                                      ? "font-bold text-[#0F172A]"
                                      : "font-medium text-slate-700"
                                  }`}
                                >
                                  {v.modelo}
                                </span>
                              </td>
                            )}

                            {/* Coluna 3: Proprietário */}
                            {colunasVisiveis.proprietario && (
                              <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                                {v.proprietario_nome || "—"}
                              </td>
                            )}

                            {/* Coluna 4: Odômetro Atual */}
                            {colunasVisiveis.km_atual && (
                              <td className="py-3 px-4 font-mono font-bold text-[#0F172A] text-xs whitespace-nowrap">
                                {formatKm(v.km_atual)}
                              </td>
                            )}

                            {/* Coluna 5: Próxima Revisão */}
                            {colunasVisiveis.km_proxima_revisao && (
                              <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                                {textoProxima}
                              </td>
                            )}

                            {/* Coluna 6: Estado com Indicador de Ponto */}
                            {colunasVisiveis.estado && (
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A]">
                                  <span className={`w-2 h-2 rounded-full ${corPonto}`} />
                                  <span>{estado}</span>
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ════════════ LADO DIREITO: PAINEL INSPETOR (DOSSIÊ DO VEÍCULO) ════════════ */}
            <aside
              aria-label="Dossiê Técnico do Veículo Selecionado"
              className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs flex flex-col justify-between min-h-[480px]"
            >
              {veiculoSelecionado ? (
                <>
                  <div>
                    {/* Cabeçalho do Inspetor */}
                    <div className="pb-2">
                      <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-1">
                        Detalhe do Prontuário
                      </span>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xl font-bold font-mono text-[#0F172A] tracking-tight">
                          {formatPlaca(veiculoSelecionado.placa)}
                        </span>
                        <span className="text-sm font-medium text-slate-600">
                          {veiculoSelecionado.modelo}
                        </span>
                      </div>
                    </div>

                    {/* Card Chave Pública de Auditoria (LGPD) */}
                    <div className="mt-4 p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                          Chave Pública de Auditoria (LGPD)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyToken(
                              veiculoSelecionado.public_token || veiculoSelecionado.id
                            )
                          }
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                          title="Copiar token"
                        >
                          {tokenCopiado ? (
                            <Check className="w-3.5 h-3.5 text-[#10B981]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="mt-1">
                        <span
                          onClick={() =>
                            handleCopyToken(
                              veiculoSelecionado.public_token || veiculoSelecionado.id
                            )
                          }
                          className="text-xs font-mono font-semibold text-[#2563EB] hover:underline cursor-pointer break-all"
                        >
                          {veiculoSelecionado.public_token ||
                            `token-${veiculoSelecionado.id.slice(0, 24)}`}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1">
                        Válida para consulta pública sem expor CPF.
                      </p>
                    </div>

                    {/* Seção: Histórico Recente de Serviços */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Histórico Recente de Serviços (
                          {veiculoSelecionado.ordens_servico?.length || 0})
                        </span>
                        <Link
                          href={`/loja/veiculo/${veiculoSelecionado.id}/nova-manutencao`}
                          className="text-[11px] font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Nova OS</span>
                        </Link>
                      </div>

                      {veiculoSelecionado.ordens_servico &&
                      veiculoSelecionado.ordens_servico.length > 0 ? (
                        <div className="space-y-3 text-xs">
                          {veiculoSelecionado.ordens_servico.slice(0, 5).map((os, idx) => (
                            <div key={os.id || idx} className="flex items-start gap-2.5">
                              <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 mt-1.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="font-bold text-[#0F172A] truncate">
                                    {TIPO_SERVICO_LABEL[os.tipo_servico] || os.tipo_servico} (
                                    {formatKm(os.km_no_servico)})
                                  </span>
                                  {os.custo !== null && os.custo !== undefined && (
                                    <span className="font-mono font-bold text-[#0F172A] shrink-0">
                                      {formatMoeda(Number(os.custo))}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Realizado em {formatData(os.criado_em)}
                                  {os.mecanico?.nome ? ` por ${os.mecanico.nome}` : ""}
                                </p>
                                {os.pecas && os.pecas.length > 0 && (
                                  <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                                    Peças:{" "}
                                    {os.pecas
                                      .map((p) => `${p.quantidade}x ${p.material?.nome || "Peça"}`)
                                      .join(", ")}
                                  </p>
                                )}
                                {os.observacao && (
                                  <p className="text-[11px] text-slate-500 mt-0.5 italic line-clamp-2">
                                    &ldquo;{os.observacao}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 px-4 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] text-center">
                          <Wrench className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                          <p className="text-xs font-semibold text-slate-700">
                            Nenhum serviço registrado
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Este veículo ainda não possui manutenções ou revisões cadastradas.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Seção: Comprovação Visual Aferida (Fotos) */}
                    <div className="mt-6">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                        Comprovação Visual Aferida ({veiculoSelecionado.fotos?.length || 0})
                      </span>

                      {veiculoSelecionado.fotos && veiculoSelecionado.fotos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {veiculoSelecionado.fotos.slice(0, 4).map((f) => (
                            <div
                              key={f.id}
                              className="p-3 rounded-lg border border-[#E2E8F0] bg-white overflow-hidden"
                            >
                              <span className="text-xs font-bold text-[#0F172A] block truncate">
                                [{f.legenda || "Registro Fotográfico"}]
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {formatData(f.criado_em)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-5 px-3 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] text-center">
                          <Camera className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                          <p className="text-xs font-medium text-slate-600">
                            Nenhuma foto cadastrada
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Comprovantes e fotos podem ser anexados no prontuário completo.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botão de Ação Inferior: Abrir Prontuário Completo */}
                  <div className="mt-8 pt-2">
                    <Link
                      id="btn-abrir-prontuario-completo"
                      href={`/loja/veiculo/${veiculoSelecionado.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold tracking-wide transition-colors shadow-xs cursor-pointer text-center"
                    >
                      <span>Abrir Prontuário Completo</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </>
              ) : (
                /* Empty State do Painel Inspetor */
                <div className="h-full my-auto flex flex-col items-center justify-center text-center py-16 px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-1">
                    Nenhum veículo selecionado
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[240px] mb-4">
                    {termoBusca
                      ? `Nenhum veículo corresponde à busca por "${termoBusca}".`
                      : "Nenhum prontuário atende aos filtros atuais."}
                  </p>
                  <button
                    id="btn-limpar-busca-inspetor"
                    type="button"
                    onClick={handleLimparBuscaEFiltros}
                    className="px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Limpar busca
                  </button>
                </div>
              )}
            </aside>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}