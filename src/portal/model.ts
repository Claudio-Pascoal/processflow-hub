/**
 * Modelo de domínio do Portal Corporativo de Processos.
 * Regras de negócio centralizadas — não duplicar noutros ficheiros.
 */

export const MACROPROCESSOS = ["Gestão", "Primários", "Suporte"] as const;
export type Macroprocesso = (typeof MACROPROCESSOS)[number];

export const MACRO_INFO: Record<
  Macroprocesso,
  { tipo: string; cor: string; descricao: string }
> = {
  "Gestão": {
    tipo: "Processos de gestão",
    cor: "#1f4e79",
    descricao:
      "Definem a direção, monitorizam o desempenho e asseguram a conformidade da organização.",
  },
  "Primários": {
    tipo: "Processos core",
    cor: "#2e7d5b",
    descricao: "Criam valor diretamente para o cliente, do pedido à entrega do serviço.",
  },
  "Suporte": {
    tipo: "Processos de suporte",
    cor: "#8a5a2b",
    descricao: "Fornecem recursos, sistemas e competências que sustentam os processos core.",
  },
};
export const DOC_TIPOS = ["Contexto", "Fluxograma", "POP", "RACI"] as const;

export type DocTipo = (typeof DOC_TIPOS)[number];

export const DOC_ESTADOS = [
  "Não Iniciado",
  "Em Elaboração",
  "Em Validação",
  "Em Aprovação",
  "Aprovado",
] as const;
export type DocEstado = (typeof DOC_ESTADOS)[number];

/** Etapas do workflow (colunas da ficha por processo). */
export const WF_ETAPAS = ["Elaboração", "Validação", "Em Aprovação", "Aprovado"] as const;
export type WfEtapa = (typeof WF_ETAPAS)[number];

export function etapaDoEstado(estado: DocEstado): WfEtapa {
  if (estado === "Não Iniciado" || estado === "Em Elaboração") return "Elaboração";
  if (estado === "Em Validação") return "Validação";
  if (estado === "Em Aprovação") return "Em Aprovação";
  return "Aprovado";
}

/** Quem elabora cada tipo de documento. */
export const ELABORADOR_POR_TIPO: Record<DocTipo, string> = {
  Contexto: "Analista de Processos",
  Fluxograma: "Analista de Processos",
  POP: "Gestor de Processo",
  RACI: "Gestor de Processo",
};

export type EstadoProcesso = "Em Elaboração" | "Em Validação" | "Em Aprovação" | "Concluído";

/**
 * REGRA OFICIAL do estado consolidado de um processo.
 * A ordem das verificações representa o ciclo de vida:
 * Não Iniciado -> Em Elaboração -> Em Validação -> Em Aprovação -> Aprovado
 *
 * "Não Iniciado" ainda faz parte da fase de elaboração: se existir pelo menos
 * um documento que ainda não começou, o processo continua Em Elaboração.
 */
export function estadoProcesso(estados: DocEstado[]): EstadoProcesso {
  if (estados.length === 0) return "Em Elaboração";
  if (estados.some((e) => e === "Não Iniciado" || e === "Em Elaboração")) return "Em Elaboração";
  if (estados.some((e) => e === "Em Validação")) return "Em Validação";
  if (estados.some((e) => e === "Em Aprovação")) return "Em Aprovação";
  return estados.every((e) => e === "Aprovado") ? "Concluído" : "Em Elaboração";
}

export const ESTADO_PROCESSO_STYLE: Record<EstadoProcesso, { bg: string; fg: string }> = {
  "Em Elaboração": { bg: "var(--warning-soft)", fg: "var(--warning)" },
  "Em Validação": { bg: "var(--neutral-soft)", fg: "var(--neutral)" },
  "Em Aprovação": { bg: "var(--accent-soft)", fg: "var(--accent)" },
  Concluído: { bg: "var(--success-soft)", fg: "var(--success)" },
};

export const DOC_ESTADO_STYLE: Record<DocEstado, { bg: string; fg: string }> = {
  "Não Iniciado": { bg: "var(--neutral-soft)", fg: "var(--neutral)" },
  "Em Elaboração": { bg: "var(--warning-soft)", fg: "var(--warning)" },
  "Em Validação": { bg: "var(--primary-soft)", fg: "var(--primary)" },
  "Em Aprovação": { bg: "var(--accent-soft)", fg: "var(--accent)" },
  Aprovado: { bg: "var(--success-soft)", fg: "var(--success)" },
};

/** Percentagem de progresso documental (0-100) de um conjunto de documentos. */
export function progresso(estados: DocEstado[]): number {
  if (estados.length === 0) return 0;
  const peso: Record<DocEstado, number> = {
    "Não Iniciado": 0,
    "Em Elaboração": 0.25,
    "Em Validação": 0.5,
    "Em Aprovação": 0.75,
    Aprovado: 1,
  };
  const total = estados.reduce((s, e) => s + peso[e], 0);
  return Math.round((total / estados.length) * 100);
}

export function formatarData(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* ===================== PAPÉIS E PERMISSÕES ===================== */

export const PAPEIS = ["admin", "analista", "gestor", "dono", "leitor"] as const;
export type Papel = (typeof PAPEIS)[number];

export const PAPEL_LABEL: Record<Papel, string> = {
  admin: "Administrador",
  analista: "Analista de Processos",
  gestor: "Gestor de Processo",
  dono: "Dono de Processo",
  leitor: "Leitor",
};

export const PAPEL_DESCRICAO: Record<Papel, string> = {
  admin: "Tudo: criar/editar processos, atribuir papéis e todas as etapas do workflow.",
  analista: "Criar processos, elaborar documentos, enviar para validação e criar versões.",
  gestor: "Validação do Gestor de Processo.",
  dono: "Validação do Dono e aprovação final.",
  leitor: "Apenas consulta.",
};

const tem = (papeis: Papel[], ...alvos: Papel[]) => papeis.some((p) => alvos.includes(p));

/** Analista e Administrador criam e editam processos. */
export const podeCriarProcesso = (papeis: Papel[]) => tem(papeis, "admin", "analista");
/** Elaboração: iniciar, enviar para validação, criar nova versão. */
export const podeElaborar = (papeis: Papel[]) => tem(papeis, "admin", "analista");
export const podeValidarGestor = (papeis: Papel[]) => tem(papeis, "admin", "gestor");
export const podeValidarDono = (papeis: Papel[]) => tem(papeis, "admin", "dono");
export const podeAprovar = (papeis: Papel[]) => tem(papeis, "admin", "dono");
export const podeGerirPapeis = (papeis: Papel[]) => tem(papeis, "admin");

/** Papel principal a mostrar na interface. */
export function papelPrincipal(papeis: Papel[]): Papel {
  return (PAPEIS.find((p) => papeis.includes(p)) ?? "leitor") as Papel;
}
