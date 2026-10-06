/**
 * @file loja-dashboard-view.tsx
 * @path src/components/loja-dashboard-view.tsx
 * @description Painel operacional moderno e humanizado da oficina mecânica (IDfleet).
 * Oferece navegação intuitiva em abas (Visão Geral, Frota de Veículos, Ordens de Serviço, Estoque & Peças),
 * menu rápido com acolhimento contextual da equipe, atalho ⌘K/Ctrl+K, filtros por conformidade,
 * exportação estruturada em PDF e arquitetura Split View com dossiê técnico da viatura selecionada.
 *
 * Dependências Principais:
 * - react: Gerenciamento de estado, ciclo de vida e memoização (useState, useMemo, useEffect, useRef)
 * - next/link: Roteamento declarativo do Next.js
 * - next/image: Exibição otimizada da identidade visual
 * - next-auth/react: Sessão autenticada e logout
 * - lucide-react: Conjunto padronizado de ícones vetoriais
 * - jspdf e jspdf-autotable: Exportação de relatórios tabulares em PDF
 * - @/lib/utils: Utilitários de formatação de placas, odômetro, moeda e datas
 * - @/lib/validation: Formatação amigável de telefone e normalização
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Car,
  Wrench,
  Package,
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
  Camera,
  MessageSquarePlus,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Menu,
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
import {
  formatarTelefoneExibicao,
  normalizarTelefone,
} from "@/lib/validation";

/**
 * Identificadores das abas principais da navegação do painel.
 */
export type AbaNavegacao = "visao_geral" | "frota" | "ordens" | "estoque";

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

/**
 * Componente principal do painel operacional da oficina.
 *
 * @param props - Propriedades contendo oficina, usuário autenticado, veículos e estoque.
 * @returns Interface de gerenciamento completa e humanizada do ecossistema IDfleet.
 */
export default function LojaDashboardView({
  loja,
  user,
  veiculos,
  materiais,
  query,
}: LojaDashboardViewProps) {
  // Controle de abas de navegação (Visão Geral é o padrão mais acolhedor)
  const [activeTab, setActiveTab] = useState<AbaNavegacao>("visao_geral");

  // Estado para feedback visual da cópia do token LGPD
  const [tokenCopiado, setTokenCopiado] = useState(false);

  // Lista estrita de veículos reais cadastrados na oficina
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

  // Controle de menu mobile e dropdown de ações rápidas
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAcoesRapidasOpen, setIsAcoesRapidasOpen] = useState(false);
  const acoesRapidasRef = useRef<HTMLDivElement>(null);

  // Modal para iniciar nova OS escolhendo o veículo de destino
  const [modalNovaOsAberto, setModalNovaOsAberto] = useState(false);

  // Detecção de plataforma para atalho de teclado (⌘K no Mac / Ctrl+K no Windows/Linux)
  const isMac =
    typeof navigator !== "undefined"
      ? /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent)
      : false;
  const atalhoTeclado = isMac ? "⌘K" : "Ctrl+K";

  // Hook do atalho de teclado ⌘K / Ctrl+K para foco imediato no campo de pesquisa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputBuscaRef.current?.focus();
        inputBuscaRef.current?.select();
      } else if (
        e.key === "Escape" &&
        document.activeElement === inputBuscaRef.current
      ) {
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

  // Fecha dropdowns e popovers abertos ao clicar fora
  useEffect(() => {
    const handleClickFora = (evento: MouseEvent) => {
      const target = evento.target as Node;
      if (filtrosRef.current && !filtrosRef.current.contains(target)) {
        setIsFiltrosOpen(false);
      }
      if (colunasRef.current && !colunasRef.current.contains(target)) {
        setIsColunasOpen(false);
      }
      if (
        acoesRapidasRef.current &&
        !acoesRapidasRef.current.contains(target)
      ) {
        setIsAcoesRapidasOpen(false);
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
   * Avalia a situação do estado de conformidade e formata o odômetro de próxima revisão.
   *
   * @param v - Objeto do veículo.
   * @returns Objeto com o rótulo da próxima revisão e o estado ('Conforme' | 'Próxima' | 'Imediata' | 'Vencida').
   */
  const calcularEstadoRevisao = (v: VeiculoDashboard) => {
    if (!v.km_proxima_revisao) {
      return {
        textoProxima: "—",
        estado: "Conforme" as const,
        corPonto: "bg-emerald-500",
      };
    }

    const diff = v.km_proxima_revisao - v.km_atual;

    if (diff < 0) {
      return {
        textoProxima: `${formatKm(v.km_proxima_revisao)} (${Math.abs(diff)} km vencida)`,
        estado: "Vencida" as const,
        corPonto: "bg-rose-500",
      };
    }

    if (diff <= 300) {
      return {
        textoProxima: `${formatKm(v.km_proxima_revisao)} (em ${diff} km)`,
        estado: "Imediata" as const,
        corPonto: "bg-amber-600",
      };
    }

    if (diff <= 3000) {
      const emK = (diff / 1000).toFixed(1).replace(".0", "");
      return {
        textoProxima: `${formatKm(v.km_proxima_revisao)} (em ${emK}k km)`,
        estado: "Próxima" as const,
        corPonto: "bg-amber-500",
      };
    }

    const emK = (diff / 1000).toFixed(1).replace(".0", "");
    return {
      textoProxima: `${formatKm(v.km_proxima_revisao)} (em ${emK}k km)`,
      estado: "Conforme" as const,
      corPonto: "bg-emerald-500",
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
   * Sanitiza identificadores removendo hífens, pontos e caracteres especiais.
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

      // 2. Filtro instantâneo por busca textual
      if (termoBusca && termoBusca.trim().length > 0) {
        const termoTrim = termoBusca.trim().toLowerCase();
        const termoSanitizado = sanitizarIdentificador(termoBusca);

        const placaSanitizada = sanitizarIdentificador(v.placa);
        const placaMatch =
          placaSanitizada.includes(termoSanitizado) ||
          (v.placa ? v.placa.toLowerCase().includes(termoTrim) : false);

        const modeloMatch = v.modelo
          ? v.modelo.toLowerCase().includes(termoTrim)
          : false;

        const propMatch = v.proprietario_nome
          ? v.proprietario_nome.toLowerCase().includes(termoTrim)
          : false;

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

  // Viatura ativa no painel de inspeção lateral
  const veiculoSelecionado = useMemo<VeiculoDashboard | null>(() => {
    if (veiculosFiltrados.length === 0) {
      return null;
    }
    const encontrado = veiculosFiltrados.find((v) => v.id === selectedVehicleId);
    return encontrado || veiculosFiltrados[0];
  }, [veiculosFiltrados, selectedVehicleId]);

  // Cálculos de métricas e KPIs operacionais da frota
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
      return ((emDia / totalVeiculos) * 100).toFixed(0);
    }
    return "100";
  }, [emDia, totalVeiculos]);

  // Relação consolidada de todas as Ordens de Serviço da oficina em ordem cronológica
  const todasOrdensServico = useMemo(() => {
    const lista: {
      id: string;
      veiculoId: string;
      veiculoPlaca: string;
      veiculoModelo: string;
      tipo_servico: string;
      km_no_servico: number;
      custo: number | string | null;
      observacao: string | null;
      criado_em: string;
      mecanico?: { nome: string } | null;
      pecas?: { quantidade: number; material?: { nome: string } | null }[];
    }[] = [];

    veiculos.forEach((v) => {
      (v.ordens_servico || []).forEach((os) => {
        lista.push({
          ...os,
          veiculoId: v.id,
          veiculoPlaca: v.placa,
          veiculoModelo: v.modelo,
        });
      });
    });

    return lista.sort(
      (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
    );
  }, [veiculos]);

  // Veículos que exigem atenção de revisão para contato humanizado
  const veiculosAtencao = useMemo(() => {
    return veiculos
      .filter((v) => {
        if (!v.km_proxima_revisao) return false;
        const diff = v.km_proxima_revisao - v.km_atual;
        return diff <= 3000;
      })
      .sort((a, b) => {
        const diffA = (a.km_proxima_revisao || 0) - a.km_atual;
        const diffB = (b.km_proxima_revisao || 0) - b.km_atual;
        return diffA - diffB;
      });
  }, [veiculos]);

  // Itens de estoque que atingiram cota mínima
  const materiaisCriticos = useMemo(() => {
    return materiais.filter((m) => m.quantidade_atual < m.quantidade_minima);
  }, [materiais]);

  // Saudação humana baseada no horário do dia
  const saudacaoHorario = useMemo(() => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "Bom dia";
    if (hora >= 12 && hora < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  // Data atual amigável por extenso em português
  const dataHojeExtenso = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date());
    } catch {
      return "Hoje";
    }
  }, []);

  // Papel descritivo amigável do usuário
  const papelDescritivo = useMemo(() => {
    if (user?.role === "admin") return "Administrador";
    if (user?.role === "mecanico") return "Mecânico Responsável";
    if (user?.role === "atendente") return "Atendente";
    return "Membro da Equipe";
  }, [user?.role]);

  // Primeiro nome para saudação calorosa
  const primeiroNome = user?.nome
    ? user.nome.split(" ")[0]
    : user?.email
    ? user.email.split("@")[0]
    : "Operador";

  /**
   * Gera o link direto com mensagem amigável no WhatsApp para contato com o cliente.
   *
   * @param v - Dados do veículo cujo proprietário será contatado.
   * @returns URL formatada do WhatsApp ou null caso sem telefone.
   */
  const gerarLinkWhatsapp = (v: VeiculoDashboard): string | null => {
    if (!v.proprietario_telefone) return null;
    const digitos = normalizarTelefone(v.proprietario_telefone);
    if (!digitos || digitos.length < 10) return null;

    const nomeCliente = v.proprietario_nome
      ? v.proprietario_nome.split(" ")[0]
      : "Cliente";
    const nomeOficina = loja?.nome || "nossa oficina";
    const texto = `Olá, ${nomeCliente}! Tudo bem? Aqui é da ${nomeOficina}. Notamos pelo prontuário digital IDfleet que o seu ${v.modelo} (placa ${formatPlaca(
      v.placa
    )}) está no momento da revisão preventiva. Gostaria de verificar a disponibilidade para agendarmos um horário com nossa equipe?`;

    return `https://wa.me/55${digitos}?text=${encodeURIComponent(texto)}`;
  };

  /**
   * Exporta a listagem atual de veículos filtrados em formato PDF estruturado.
   */
  const handleExportarPdf = () => {
    if (veiculosFiltrados.length === 0) return;

    setExportando(true);

    try {
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

      // Cabeçalho Institucional
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text("IDfleet • Identidade Digital Veicular", 40, 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Relatório Operacional de Prontuários Veiculares Cadastrados",
        40,
        50
      );

      const nomeOficina = loja?.nome || "Oficina Mecânica";
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Oficina: ${nomeOficina}`, 802, 34, { align: "right" });
      doc.text(`Emissão: ${dataFormatada} às ${horaFormatada}`, 802, 47, {
        align: "right",
      });
      doc.text(
        `Total de Veículos: ${veiculosFiltrados.length}`,
        802,
        60,
        { align: "right" }
      );

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(40, 68, 802, 68);

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
        if (colunasVisiveis.km_proxima_revisao)
          linha.push(infoRevisao.textoProxima);
        if (colunasVisiveis.estado) {
          linha.push(infoRevisao.estado);
        }

        return linha;
      });

      autoTable(doc, {
        head: [cabecalhos],
        body: corpoTabela,
        startY: 78,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 8.5,
          textColor: [30, 41, 59],
          cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
          lineColor: [241, 245, 249],
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8.5,
          cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { top: 40, right: 40, bottom: 40, left: 40 },
      });

      const totalPaginas = doc.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          "IDfleet • Sistema de Prontuário e Identidade Digital Veicular Auditada",
          40,
          575
        );
        doc.text(`Página ${i} de ${totalPaginas}`, 802, 575, { align: "right" });
      }

      doc.save(`prontuarios-veiculares-${dataArquivo}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setTimeout(() => setExportando(false), 2000);
    }
  };

  /**
   * Alterna a visibilidade de uma coluna específica da tabela.
   *
   * @param chave - Identificador da coluna.
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
   * Restaura todas as colunas para o padrão visível.
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
   * Limpa o campo de busca textual.
   */
  const handleLimparBusca = () => {
    setTermoBusca("");
    inputBuscaRef.current?.focus();
  };

  /**
   * Limpa a busca e restaura o filtro de conformidade para todos.
   */
  const handleLimparBuscaEFiltros = () => {
    setTermoBusca("");
    setFiltroEstado("todos");
    inputBuscaRef.current?.focus();
  };

  /**
   * Copia a chave pública de auditoria com feedback visual de 2 segundos.
   *
   * @param token - Token alfanumérico a ser copiado.
   */
  const handleCopyToken = (token: string) => {
    if (!token) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(token);
      setTokenCopiado(true);
      setTimeout(() => setTokenCopiado(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col selection:bg-slate-200">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER PRINCIPAL (MODERNO, INTUITIVO E HUMANO)
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Lado Esquerdo: Marca IDfleet + Contexto Acolhedor da Oficina */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Abrir menu de navegação"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              href="/loja/dashboard"
              className="flex items-center gap-2 group focus:outline-none shrink-0"
              title="IDfleet - Painel da Oficina"
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

            <div
              className="h-5 w-px bg-slate-200 mx-1 hidden sm:block shrink-0"
              aria-hidden="true"
            />

            {/* Contexto da Oficina com indicador amigável de status ativo */}
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[180px] lg:max-w-[260px]">
                {loja?.nome || "Oficina Mecânica"}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden md:inline">Atendimento ativo</span>
              </span>
            </div>
          </div>

          {/* Centro: Barra de Busca Rápida Global */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputBuscaRef}
                id="input-busca-global-header"
                name="q"
                type="text"
                value={termoBusca}
                onChange={(e) => {
                  setTermoBusca(e.target.value);
                  if (activeTab === "visao_geral" && e.target.value.trim().length > 0) {
                    setActiveTab("frota");
                  }
                }}
                placeholder="Buscar placa, modelo, cliente ou CPF..."
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-lg pl-10 pr-16 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {termoBusca.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleLimparBusca}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                    title="Limpar pesquisa (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd
                    onClick={() => inputBuscaRef.current?.focus()}
                    className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs cursor-pointer select-none"
                    title={`Pressione ${atalhoTeclado} para pesquisar`}
                  >
                    {atalhoTeclado}
                  </kbd>
                )}
              </div>
            </div>
          </div>

          {/* Lado Direito: Ações Rápidas Humanas, Suporte, Usuário e Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Menu Dropdown de Ações Rápidas (+ Registrar) */}
            <div className="relative" ref={acoesRapidasRef}>
              <button
                id="btn-cadastrar-novo"
                type="button"
                onClick={() => setIsAcoesRapidasOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-colors shadow-xs cursor-pointer"
                title="Cadastrar novo veículo, manutenção ou peça"
              >
                <Plus className="w-4 h-4 text-slate-300" />
                <span className="hidden xs:inline">Registrar</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isAcoesRapidasOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Popover de Ações Rápidas com opções amigáveis */}
              {isAcoesRapidasOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      O que deseja registrar agora?
                    </span>
                  </div>

                  <Link
                    href="/loja/novo"
                    onClick={() => setIsAcoesRapidasOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        Novo Veículo
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                        Cadastrar novo prontuário com placa e proprietário.
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAcoesRapidasOpen(false);
                      setModalNovaOsAberto(true);
                    }}
                    className="w-full text-left flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        Nova Manutenção / OS
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                        Lançar serviço realizado, troca de óleo ou peças.
                      </span>
                    </div>
                  </button>

                  <Link
                    href="/loja/material/novo"
                    onClick={() => setIsAcoesRapidasOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        Nova Peça / Insumo
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                        Adicionar componente ao inventário da oficina.
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Canal de Feedback Acolhedor */}
            <Link
              id="btn-header-feedback"
              href="/feedback"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
              title="Deixar sugestão ou opinião para aprimoramento da plataforma"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Feedback</span>
            </Link>

            {/* Perfil Humano do Operador */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                  {primeiroNome}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {papelDescritivo}
                </span>
              </div>
            </div>

            {/* Encerrar Sessão */}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/loja/login" })}
              title="Encerrar Sessão Segura"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Menu Mobile Retrátil */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">
                Conectado como <strong className="text-slate-800">{user?.nome || user?.email}</strong>
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {papelDescritivo}
              </span>
            </div>

            {/* Campo de Busca no Mobile */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => {
                  setTermoBusca(e.target.value);
                  if (activeTab === "visao_geral" && e.target.value.trim().length > 0) {
                    setActiveTab("frota");
                  }
                }}
                placeholder="Buscar placa, modelo ou cliente..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. NAVEGAÇÃO SECUNDÁRIA POR ABAS (INTUITIVA E MODERNA)
      ───────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-16 sm:top-20 z-30">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-3 py-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("visao_geral")}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "visao_geral"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Visão Geral</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("frota")}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "frota"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Frota de Veículos</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === "frota"
                    ? "bg-slate-700 text-slate-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {totalVeiculos}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ordens")}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "ordens"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Ordens de Serviço</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === "ordens"
                    ? "bg-slate-700 text-slate-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {todasOrdensServico.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("estoque")}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "estoque"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Estoque &amp; Peças</span>
              {estoqueBaixo > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500" title="Peças em nível crítico" />
              )}
            </button>
          </div>

          {/* Atalho para rápida exportação de relatório se estiver na aba de frota */}
          {activeTab === "frota" && (
            <button
              type="button"
              onClick={handleExportarPdf}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium py-1 px-2.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Exportar todos os prontuários em PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Exportar PDF</span>
            </button>
          )}
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          3. ÁREA DE CONTEÚDO PRINCIPAL (DASHBOARD INTUITIVO E HUMANO)
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ════════════════════════════════════════════════════════════
            ABA 1: VISÃO GERAL (DASHBOARD MODERNO E HUMANO)
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "visao_geral" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Boas-Vindas Humanas e Panorama do Dia */}
            <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="capitalize">{dataHojeExtenso}</span>
                    <span aria-hidden="true">·</span>
                    <span>{loja?.nome || "Oficina Mecânica"}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {saudacaoHorario}, {primeiroNome}! 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {revisoesVencidas > 0 || revisaoProxima > 0 ? (
                      <>
                        Sua oficina possui <strong>{totalVeiculos} veículos</strong> sob custódia digital.{" "}
                        <span className="text-amber-700 font-medium">
                          Identificamos {revisoesVencidas + revisaoProxima} veículo(s) com revisão preventiva próxima ou vencida
                        </span>{" "}
                        que merecem contato com os proprietários.
                      </>
                    ) : (
                      <>
                        Sua frota de <strong>{totalVeiculos} veículos</strong> está com 100% de conformidade nos odômetros e prontuários atualizados.
                      </>
                    )}
                  </p>
                </div>

                {/* Botões de Ação Imediata no topo da Visão Geral */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    href="/loja/novo"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Veículo</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setModalNovaOsAberto(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lançar Manutenção</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Grade de 4 Indicadores Estratégicos (KPIs Claros e Amigáveis) */}
            <section
              aria-label="Indicadores Chave de Desempenho"
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {/* Card 1: Veículos na Base */}
              <div
                onClick={() => setActiveTab("frota")}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 sm:p-5 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Frota Cadastrada</span>
                  <Car className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
                    {totalVeiculos}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{veiculosEsteMes > 0 ? `+${veiculosEsteMes} este mês` : "Base digital ativa"}</span>
                  <span className="text-blue-600 font-medium group-hover:underline inline-flex items-center gap-0.5">
                    Ver <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>

              {/* Card 2: Saúde do Odômetro */}
              <div
                onClick={() => {
                  setFiltroEstado("conforme");
                  setActiveTab("frota");
                }}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 sm:p-5 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Odômetro em Dia</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
                    {emDia}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 font-medium flex items-center justify-between">
                  <span>{percentEmDia}% conformidade</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
              </div>

              {/* Card 3: Revisões Programadas / Próximas */}
              <div
                onClick={() => {
                  setFiltroEstado("proxima");
                  setActiveTab("frota");
                }}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 sm:p-5 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Revisões Próximas</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
                    {revisaoProxima}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>
                    {revisoesVencidas > 0 ? (
                      <strong className="text-rose-600">{revisoesVencidas} expiradas</strong>
                    ) : (
                      "Nenhuma atrasada"
                    )}
                  </span>
                  <span className="text-blue-600 font-medium group-hover:underline inline-flex items-center gap-0.5">
                    Filtrar <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>

              {/* Card 4: Alertas de Reposição de Peças */}
              <div
                onClick={() => setActiveTab("estoque")}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 sm:p-5 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Itens em Estoque</span>
                  <Package className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
                    {materiais.length}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>
                    {estoqueBaixo > 0 ? (
                      <strong className="text-rose-600">{estoqueBaixo} para reposição</strong>
                    ) : (
                      "Estoque normal"
                    )}
                  </span>
                  <span className="text-blue-600 font-medium group-hover:underline inline-flex items-center gap-0.5">
                    Estoque <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            </section>

            {/* Seções Centrais: Central de Relacionamento (WhatsApp / Atenção) + Últimos Atendimentos */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Lado Esquerdo (7 colunas): Veículos que Necessitam Contato Proativo */}
              <section className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Central de Revisões &amp; Relacionamento
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Veículos que atingiram o intervalo recomendado para manutenção preventiva.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    {veiculosAtencao.length}{" "}
                    {veiculosAtencao.length === 1 ? "viatura" : "viaturas"}
                  </span>
                </div>

                {veiculosAtencao.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tudo em dia!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Nenhum veículo possui revisão preventiva atrasada ou prevista para breve.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {veiculosAtencao.slice(0, 6).map((v) => {
                      const { textoProxima, estado, corPonto } = calcularEstadoRevisao(v);
                      const linkWhatsapp = gerarLinkWhatsapp(v);

                      return (
                        <div
                          key={v.id}
                          className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-xs font-bold text-slate-900">
                                {formatPlaca(v.placa)}
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {v.modelo}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                                <span className={`w-1.5 h-1.5 rounded-full ${corPonto}`} />
                                <span>{estado}</span>
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                              <span>Odômetro: {formatKm(v.km_atual)}</span>
                              <span aria-hidden="true">·</span>
                              <span>Próxima: {textoProxima}</span>
                              {v.proprietario_nome && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>Cliente: {v.proprietario_nome}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Ações Humanas com o Cliente */}
                          <div className="flex items-center gap-2 shrink-0">
                            {linkWhatsapp ? (
                              <a
                                href={linkWhatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                title="Contatar cliente no WhatsApp para agendar revisão preventiva"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            ) : v.proprietario_telefone ? (
                              <span className="text-xs text-slate-500 font-mono">
                                {formatarTelefoneExibicao(v.proprietario_telefone)}
                              </span>
                            ) : null}

                            <Link
                              href={`/loja/veiculo/${v.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                            >
                              <span>Prontuário</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Lado Direito (5 colunas): Atividades e Serviços Recentes */}
              <section className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Últimas Manutenções Realizadas
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Registro recente de ordens de serviço executadas na oficina.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("ordens")}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Ver todas
                  </button>
                </div>

                {todasOrdensServico.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    <Wrench className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Sem serviços recentes</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Lance a primeira ordem de serviço utilizando o botão de ação rápida.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todasOrdensServico.slice(0, 5).map((os) => (
                      <div
                        key={os.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">
                              {TIPO_SERVICO_LABEL[os.tipo_servico] || os.tipo_servico}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                              {formatPlaca(os.veiculoPlaca)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {os.veiculoModelo} • {formatKm(os.km_no_servico)}
                            {os.mecanico?.nome ? ` • ${os.mecanico.nome}` : ""}
                          </p>
                          {os.pecas && os.pecas.length > 0 && (
                            <p className="text-[10px] text-slate-500 truncate">
                              Peças: {os.pecas.map((p) => p.material?.nome || "Peça").join(", ")}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {os.custo !== null && os.custo !== undefined && (
                            <span className="font-mono font-bold text-xs text-slate-900 block">
                              {formatMoeda(Number(os.custo))}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {formatData(os.criado_em)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Alerta Adicional: Reposição de Peças Críticas se houver */}
            {materiaisCriticos.length > 0 && (
              <section className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Atenção ao Inventário: {materiaisCriticos.length} item(ns) abaixo da cota mínima de segurança
                    </h3>
                    <p className="text-xs text-amber-800/90 mt-0.5">
                      Itens com quantidade baixa podem impactar manutenções em andamento. Considere emitir pedido de reposição.
                    </p>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {materiaisCriticos.slice(0, 4).map((m) => (
                        <Link
                          key={m.id}
                          href={`/loja/material/${m.id}`}
                          className="px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs font-medium text-slate-800 hover:bg-amber-50 inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span>{m.nome}</span>
                          <span className="font-mono text-rose-600 font-bold">
                            ({m.quantidade_atual}/{m.quantidade_minima} un.)
                          </span>
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={() => setActiveTab("estoque")}
                        className="text-xs font-semibold text-amber-900 hover:underline px-2 py-1 cursor-pointer"
                      >
                        Abrir estoque completo →
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            ABA 2: FROTA DE VEÍCULOS (ARQUITETURA SPLIT VIEW COMPLETA)
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "frota" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Barra de Pesquisa e Filtros Operacionais */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Campo de Pesquisa Rápida */}
              <div className="relative w-full md:flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-busca-dashboard"
                  name="q"
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder="Buscar por placa, modelo, proprietário ou token..."
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-lg pl-10 pr-9 sm:pr-20 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {termoBusca.length > 0 && (
                    <button
                      type="button"
                      onClick={handleLimparBusca}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-md transition-colors cursor-pointer"
                      title="Limpar pesquisa (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Controles de Filtro, Colunas e Exportação */}
              <div className="w-full md:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                {/* Dropdown: Filtros por Conformidade */}
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
                        : "text-slate-700 bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                    title="Filtrar por estado de conformidade"
                  >
                    <span>Filtros</span>
                    {filtroEstado !== "todos" && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isFiltrosOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isFiltrosOpen && (
                    <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-60 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
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
                              ? "bg-slate-100 text-slate-900 font-bold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span>Todos</span>
                          <span className="text-[11px] text-slate-400 font-mono">
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
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Conforme</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
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
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Próxima revisão</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
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
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>Vencida</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {contagemEstados.vencida}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dropdown: Colunas */}
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
                        : "text-slate-700 bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                    title="Configurar visibilidade das colunas"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Colunas</span>
                  </button>

                  {isColunasOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-0 top-full mt-1.5 w-64 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                          Colunas Visíveis
                        </span>
                        <button
                          type="button"
                          onClick={handleRestaurarColunas}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
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
                            className="rounded border-slate-300 text-slate-900"
                          />
                          <span className="text-slate-700">Matrícula / Placa</span>
                        </label>
                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={colunasVisiveis.modelo}
                            onChange={() => handleToggleColuna("modelo")}
                            className="rounded border-slate-300 text-slate-900"
                          />
                          <span className="text-slate-700">Veículo &amp; Versão</span>
                        </label>
                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={colunasVisiveis.proprietario}
                            onChange={() => handleToggleColuna("proprietario")}
                            className="rounded border-slate-300 text-slate-900"
                          />
                          <span className="text-slate-700">Proprietário</span>
                        </label>
                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={colunasVisiveis.km_atual}
                            onChange={() => handleToggleColuna("km_atual")}
                            className="rounded border-slate-300 text-slate-900"
                          />
                          <span className="text-slate-700">Odômetro Atual</span>
                        </label>
                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={colunasVisiveis.km_proxima_revisao}
                            onChange={() => handleToggleColuna("km_proxima_revisao")}
                            className="rounded border-slate-300 text-slate-900"
                          />
                          <span className="text-slate-700">Próxima Revisão</span>
                        </label>
                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={colunasVisiveis.estado}
                            onChange={() => handleToggleColuna("estado")}
                            className="rounded border-slate-300 text-slate-900"
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
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {exportando ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Gerado!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>Exportar PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Split View: Tabela à Esquerda (8 cols) + Dossiê Inspetor à Direita (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Lado Esquerdo: Tabela Densa de Viaturas */}
              <section
                aria-label="Prontuários Veiculares Ativos"
                className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden"
              >
                <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      Prontuários Veiculares Ativos
                    </h2>
                    <span className="text-xs text-slate-400">
                      • {veiculosFiltrados.length}{" "}
                      {veiculosFiltrados.length === 1 ? "registro" : "registros"}
                    </span>
                  </div>

                  {filtroEstado !== "todos" && (
                    <button
                      type="button"
                      onClick={() => setFiltroEstado("todos")}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      Limpar filtro ({filtroEstado})
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[680px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {colunasVisiveis.placa && (
                          <th className="py-3 px-4">Matrícula / Placa</th>
                        )}
                        {colunasVisiveis.modelo && (
                          <th className="py-3 px-4">Veículo &amp; Versão</th>
                        )}
                        {colunasVisiveis.proprietario && (
                          <th className="py-3 px-4">Proprietário</th>
                        )}
                        {colunasVisiveis.km_atual && (
                          <th className="py-3 px-4">Odômetro Atual</th>
                        )}
                        {colunasVisiveis.km_proxima_revisao && (
                          <th className="py-3 px-4">Próxima Revisão</th>
                        )}
                        {colunasVisiveis.estado && (
                          <th className="py-3 px-4">Estado</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
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
                                  : "Nenhum prontuário encontrado para os filtros ativos."}
                              </p>
                              <button
                                type="button"
                                onClick={handleLimparBuscaEFiltros}
                                className="mt-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 rounded-md font-semibold cursor-pointer"
                              >
                                Limpar filtros e busca
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        veiculosFiltrados.map((v) => {
                          const isSelected = veiculoSelecionado?.id === v.id;
                          const { textoProxima, estado, corPonto } =
                            calcularEstadoRevisao(v);

                          return (
                            <tr
                              key={v.id}
                              id={`row-veiculo-${v.id}`}
                              onClick={() => setSelectedVehicleId(v.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-slate-100/70"
                                  : "hover:bg-slate-50/80 bg-white"
                              }`}
                            >
                              {colunasVisiveis.placa && (
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className="inline-block px-2.5 py-1 rounded bg-white border border-slate-200 font-mono text-xs font-bold text-slate-900 tracking-wider">
                                    {formatPlaca(v.placa)}
                                  </span>
                                </td>
                              )}

                              {colunasVisiveis.modelo && (
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span
                                    className={`text-xs ${
                                      isSelected
                                        ? "font-bold text-slate-900"
                                        : "font-medium text-slate-700"
                                    }`}
                                  >
                                    {v.modelo}
                                  </span>
                                </td>
                              )}

                              {colunasVisiveis.proprietario && (
                                <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                                  {v.proprietario_nome || "—"}
                                </td>
                              )}

                              {colunasVisiveis.km_atual && (
                                <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                                  {formatKm(v.km_atual)}
                                </td>
                              )}

                              {colunasVisiveis.km_proxima_revisao && (
                                <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                                  {textoProxima}
                                </td>
                              )}

                              {colunasVisiveis.estado && (
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900">
                                    <span
                                      className={`w-2 h-2 rounded-full ${corPonto}`}
                                    />
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

              {/* Lado Direito: Painel Inspetor (Dossiê do Veículo Selecionado) */}
              <aside
                aria-label="Dossiê Técnico do Veículo Selecionado"
                className="lg:col-span-4 bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between min-h-[480px]"
              >
                {veiculoSelecionado ? (
                  <>
                    <div className="space-y-5">
                      {/* Cabeçalho do Inspetor */}
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-1">
                          Prontuário Selecionado
                        </span>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                            {formatPlaca(veiculoSelecionado.placa)}
                          </span>
                          <span className="text-sm font-medium text-slate-600">
                            {veiculoSelecionado.modelo}
                          </span>
                        </div>
                      </div>

                      {/* Card Chave Pública de Auditoria (LGPD) */}
                      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                            Chave Pública de Auditoria (LGPD)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyToken(
                                veiculoSelecionado.public_token ||
                                  veiculoSelecionado.id
                              )
                            }
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                            title="Copiar token de auditoria"
                          >
                            {tokenCopiado ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="mt-1">
                          <span
                            onClick={() =>
                              handleCopyToken(
                                veiculoSelecionado.public_token ||
                                  veiculoSelecionado.id
                              )
                            }
                            className="text-xs font-mono font-semibold text-blue-600 hover:underline cursor-pointer break-all"
                          >
                            {veiculoSelecionado.public_token ||
                              `token-${veiculoSelecionado.id.slice(0, 24)}`}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-1">
                          Válida para consulta pública sem expor CPF do proprietário.
                        </p>
                      </div>

                      {/* Histórico Recente de Serviços */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Serviços Registrados ({veiculoSelecionado.ordens_servico?.length || 0})
                          </span>
                          <Link
                            href={`/loja/veiculo/${veiculoSelecionado.id}/nova-manutencao`}
                            className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Nova OS</span>
                          </Link>
                        </div>

                        {veiculoSelecionado.ordens_servico &&
                        veiculoSelecionado.ordens_servico.length > 0 ? (
                          <div className="space-y-2.5 text-xs">
                            {veiculoSelecionado.ordens_servico.slice(0, 4).map((os, idx) => (
                              <div
                                key={os.id || idx}
                                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50"
                              >
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="font-bold text-slate-900 truncate">
                                    {TIPO_SERVICO_LABEL[os.tipo_servico] || os.tipo_servico}
                                  </span>
                                  {os.custo !== null && os.custo !== undefined && (
                                    <span className="font-mono font-bold text-slate-900 shrink-0">
                                      {formatMoeda(Number(os.custo))}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {formatKm(os.km_no_servico)} • {formatData(os.criado_em)}
                                  {os.mecanico?.nome ? ` por ${os.mecanico.nome}` : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-5 px-3 rounded-lg border border-dashed border-slate-200 text-center">
                            <Wrench className="w-4 h-4 text-slate-300 mx-auto mb-1" />
                            <p className="text-xs font-semibold text-slate-700">
                              Nenhum serviço registrado
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Fotos Reais do Veículo */}
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                          Fotos do Veículo ({veiculoSelecionado.fotos?.length || 0})
                        </span>

                        {veiculoSelecionado.fotos && veiculoSelecionado.fotos.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {veiculoSelecionado.fotos.slice(0, 4).map((f) => (
                              <div
                                key={f.id}
                                className="p-2 rounded border border-slate-100 bg-slate-50 text-[11px]"
                              >
                                <span className="font-semibold text-slate-800 block truncate">
                                  {f.legenda || "Registro Fotográfico"}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {formatData(f.criado_em)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 px-2 rounded-lg border border-dashed border-slate-200 text-center">
                            <Camera className="w-4 h-4 text-slate-300 mx-auto mb-1" />
                            <p className="text-xs text-slate-500">
                              Sem fotos anexadas ainda
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botão de Ação Inferior: Abrir Prontuário Completo */}
                    <div className="mt-6 pt-2">
                      <Link
                        id="btn-abrir-prontuario-completo"
                        href={`/loja/veiculo/${veiculoSelecionado.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold tracking-wide transition-colors shadow-xs"
                      >
                        <span>Abrir Prontuário Completo</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="h-full my-auto flex flex-col items-center justify-center text-center py-12 px-4">
                    <Search className="w-6 h-6 text-slate-300 mb-2" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Nenhum veículo selecionado
                    </h3>
                    <p className="text-xs text-slate-500 max-w-[200px] mt-1 mb-3">
                      Selecione um veículo da tabela para visualizar o prontuário.
                    </p>
                    <button
                      type="button"
                      onClick={handleLimparBuscaEFiltros}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg"
                    >
                      Limpar busca
                    </button>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            ABA 3: ORDENS DE SERVIÇO (HISTÓRICO CONSOLIDADO DA OFICINA)
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "ordens" && (
          <section className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden animate-in fade-in duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Ordens de Serviço da Oficina
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Relação de todas as manutenções, peças aplicadas e mecânicos responsáveis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaOsAberto(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Ordem de Serviço</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Veículo / Placa</th>
                    <th className="py-3 px-4">Tipo de Serviço</th>
                    <th className="py-3 px-4">Odômetro</th>
                    <th className="py-3 px-4">Mecânico</th>
                    <th className="py-3 px-4">Peças Utilizadas</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-right">Data</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todasOrdensServico.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        Nenhuma ordem de serviço cadastrada na oficina ainda.
                      </td>
                    </tr>
                  ) : (
                    todasOrdensServico.map((os) => (
                      <tr key={os.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900">
                              {formatPlaca(os.veiculoPlaca)}
                            </span>
                            <span className="text-slate-700 font-medium truncate max-w-[140px]">
                              {os.veiculoModelo}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {TIPO_SERVICO_LABEL[os.tipo_servico] || os.tipo_servico}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {formatKm(os.km_no_servico)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {os.mecanico?.nome || "Equipe"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[180px] truncate">
                          {os.pecas && os.pecas.length > 0
                            ? os.pecas.map((p) => `${p.quantidade}x ${p.material?.nome || "Peça"}`).join(", ")
                            : "—"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-right text-slate-900">
                          {formatMoeda(Number(os.custo))}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {formatData(os.criado_em)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/loja/veiculo/${os.veiculoId}/ordem/${os.id}/editar`}
                            className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            <span>Editar</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════
            ABA 4: ESTOQUE & PEÇAS (INVENTÁRIO COMPLETO COM ALERTAS)
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "estoque" && (
          <section
            aria-label="Tabela de Materiais e Peças de Estoque"
            className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden animate-in fade-in duration-200"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Inventário Físico da Oficina
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Controle de peças, componentes e insumos com alertas de reposição.
                </p>
              </div>
              <Link
                href="/loja/material/novo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Material</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Código SKU</th>
                    <th className="py-3 px-4">Descrição da Peça</th>
                    <th className="py-3 px-4 text-right">Qtd. em Estoque</th>
                    <th className="py-3 px-4 text-right">Cota Mínima</th>
                    <th className="py-3 px-4 text-center">Situação</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                              {m.sku}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">{m.nome}</td>
                          <td className="py-3 px-4 font-mono font-bold text-right text-slate-900">
                            {m.quantidade_atual} un.
                          </td>
                          <td className="py-3 px-4 font-mono text-right text-slate-500">
                            {m.quantidade_minima} un.
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isBaixo ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Crítico ({m.quantidade_atual} un.)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          4. MODAL RÁPIDO PARA SELEÇÃO DE VEÍCULO NA NOVA OS
      ───────────────────────────────────────────────────────────── */}
      {modalNovaOsAberto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Lançar Nova Ordem de Serviço
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaOsAberto(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Selecione em qual veículo deseja registrar a manutenção:
            </p>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {veiculos.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Nenhum veículo cadastrado para receber manutenção.
                </div>
              ) : (
                veiculos.map((v) => (
                  <Link
                    key={v.id}
                    href={`/loja/veiculo/${v.id}/nova-manutencao`}
                    onClick={() => setModalNovaOsAberto(false)}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 px-2 py-0.5 rounded bg-slate-100">
                          {formatPlaca(v.placa)}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {v.modelo}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {v.proprietario_nome || "Proprietário não informado"} • {formatKm(v.km_atual)}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalNovaOsAberto(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
