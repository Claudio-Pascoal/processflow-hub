import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DOC_TIPOS,
  estadoProcesso,
  progresso,
  type DocEstado,
  type DocTipo,
  type EstadoProcesso,
} from "./model";

export type Utilizador = { id: string; nome: string; email: string; role: string };
export type Categoria = { id: string; nome: string };

export type VersaoRow = {
  id: string;
  processo_id: string;
  tipo_documento: DocTipo;
  versao: string;
  estado: DocEstado;
  imutavel: boolean;
  elaborado_por_id: string | null;
  data_inicio: string | null;
  data_envio_validacao: string | null;
  validado_gestor_id: string | null;
  data_validacao_gestor: string | null;
  validado_dono_id: string | null;
  data_validacao_dono: string | null;
  aprovado_por_id: string | null;
  data_aprovacao: string | null;
  forma_aprovacao: string | null;
  updated_at: string;
};

export type AtividadeRow = {
  id: string;
  documento_versao_id: string;
  atribuido_a_id: string | null;
  tarefa: string;
  estado: "Pendente" | "Em curso" | "Concluída";
  prazo: string | null;
};

export type LogRow = {
  id: string;
  documento_versao_id: string;
  de_estado: string | null;
  para_estado: string | null;
  utilizador_id: string | null;
  comentario: string | null;
  data: string;
};

export type ProcessoRow = {
  id: string;
  codigo: string;
  nome: string;
  macroprocesso: string;
  categoria_id: string | null;
  area: string | null;
  dono_id: string | null;
  gestor_id: string | null;
  dono_cargo: string | null;
  gestor_cargo: string | null;
  descricao: string | null;
  palavras_chave: string | null;
  estado: string;
  updated_at: string;
};

export type Processo = ProcessoRow & {
  categoria: string;
  donoNome: string;
  gestorNome: string;
  /** Versão mais recente de cada tipo de documento. */
  atuais: Record<DocTipo, VersaoRow | null>;
  versoes: VersaoRow[];
  estadoCalculado: EstadoProcesso;
  progresso: number;
  cobertura: number;
};

export type PortalData = {
  processos: Processo[];
  utilizadores: Utilizador[];
  categorias: Categoria[];
  versoes: VersaoRow[];
  atividades: AtividadeRow[];
  logs: LogRow[];
};

function ordemVersao(v: string): number {
  const [maior, menor = "0"] = v.split(".");
  return Number(maior) * 1000 + Number(menor);
}

async function fetchPortal(): Promise<PortalData> {
  const [proc, util, cat, ver, ativ, log] = await Promise.all([
    supabase.from("processos").select("*").order("codigo"),
    supabase.from("utilizadores").select("*").order("nome"),
    supabase.from("categorias").select("*").order("nome"),
    supabase.from("documento_versoes").select("*"),
    supabase.from("atividades").select("*"),
    supabase.from("workflow_log").select("*").order("data", { ascending: false }),
  ]);

  const erro = [proc, util, cat, ver, ativ, log].find((r) => r.error)?.error;
  if (erro) throw new Error(erro.message);

  const utilizadores = (util.data ?? []) as Utilizador[];
  const categorias = (cat.data ?? []) as Categoria[];
  const versoes = (ver.data ?? []) as VersaoRow[];

  const processos: Processo[] = ((proc.data ?? []) as ProcessoRow[]).map((p) => {
    const suas = versoes
      .filter((v) => v.processo_id === p.id)
      .sort((a, b) => ordemVersao(b.versao) - ordemVersao(a.versao));

    const atuais = Object.fromEntries(
      DOC_TIPOS.map((t) => [t, suas.find((v) => v.tipo_documento === t) ?? null]),
    ) as Record<DocTipo, VersaoRow | null>;

    const estados = DOC_TIPOS.map((t) => atuais[t]?.estado ?? "Não Iniciado") as DocEstado[];

    return {
      ...p,
      categoria: categorias.find((c) => c.id === p.categoria_id)?.nome ?? "—",
      donoNome: utilizadores.find((u) => u.id === p.dono_id)?.nome ?? "—",
      gestorNome: utilizadores.find((u) => u.id === p.gestor_id)?.nome ?? "—",
      atuais,
      versoes: suas,
      estadoCalculado: estadoProcesso(estados),
      progresso: progresso(estados),
      cobertura: Math.round(
        (estados.filter((e) => e !== "Não Iniciado").length / DOC_TIPOS.length) * 100,
      ),
    };
  });

  return {
    processos,
    utilizadores,
    categorias,
    versoes,
    atividades: (ativ.data ?? []) as AtividadeRow[],
    logs: (log.data ?? []) as LogRow[],
  };
}

export function usePortal() {
  return useQuery({ queryKey: ["portal"], queryFn: fetchPortal, staleTime: 30_000 });
}

export function matchesQuery(p: Processo, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return [p.codigo, p.nome, p.categoria, p.area, p.palavras_chave, p.descricao]
    .filter(Boolean)
    .some((f) => String(f).toLowerCase().includes(t));
}
