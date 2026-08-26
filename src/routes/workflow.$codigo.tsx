import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  History,
  ListChecks,
  Lock,
  Plus,
  RefreshCw,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import {
  usePortal,
  useUtilizadorAtual,
  type Processo,
  type VersaoRow,
} from "@/portal/data";
import {
  Carregando,
  DocEstadoBadge,
  EstadoProcessoBadge,
  PortalShell,
  ProgressBar,
} from "@/portal/ui";
import {
  DOC_TIPOS,
  ELABORADOR_POR_TIPO,
  WF_ETAPAS,
  etapaDoEstado,
  formatarData,
  podeAprovar,
  podeElaborar,
  podeValidarDono,
  podeValidarGestor,
  type DocTipo,
  type Papel,
} from "@/portal/model";


export const Route = createFileRoute("/workflow/$codigo")({
  head: ({ params }) => ({
    meta: [
      { title: `Workflow ${params.codigo} — Portal de Processos` },
      {
        name: "description",
        content: `Etapas, versões, atividades e histórico de decisões do workflow do processo ${params.codigo}.`,
      },
      { property: "og:title", content: `Workflow ${params.codigo}` },
      {
        property: "og:description",
        content: "Elaboração, validação e aprovação da documentação deste processo.",
      },
    ],
  }),
  component: WorkflowProcesso,
});

type Acao =
  | { label: string; tipo: "iniciar" }
  | { label: string; tipo: "enviar_validacao" }
  | { label: string; tipo: "validar_gestor" }
  | { label: string; tipo: "validar_dono" }
  | { label: string; tipo: "aprovar" }
  | { label: string; tipo: "nova_versao" };

function acoesDisponiveis(v: VersaoRow): Acao[] {
  switch (v.estado) {
    case "Não Iniciado":
      return [{ label: "Iniciar elaboração", tipo: "iniciar" }];
    case "Em Elaboração":
      return [{ label: "Enviar para validação", tipo: "enviar_validacao" }];
    case "Em Validação":
      if (!v.validado_gestor_id)
        return [{ label: "Validar como Gestor de Processo", tipo: "validar_gestor" }];
      if (!v.validado_dono_id)
        return [{ label: "Validar como Dono do Processo", tipo: "validar_dono" }];
      return [];
    case "Em Aprovação":
      return [{ label: "Aprovar (Dono do Processo)", tipo: "aprovar" }];
    case "Aprovado":
      return [{ label: "Criar nova versão", tipo: "nova_versao" }];
  }
}

function proximaVersao(versoes: VersaoRow[], tipo: DocTipo): string {
  const maiores = versoes
    .filter((v) => v.tipo_documento === tipo)
    .map((v) => Number(v.versao.split(".")[0] ?? 1));
  return `${Math.max(1, ...maiores) + 1}.0`;
}

function WorkflowProcesso() {
  const { codigo } = Route.useParams();
  const { data, isLoading } = usePortal();
  const session = useSession();
  const queryClient = useQueryClient();
  const [tipoAberto, setTipoAberto] = useState<DocTipo | null>(null);

  const p = data?.processos.find((x) => x.codigo === codigo);

  const mutation = useMutation({
    mutationFn: async ({
      acao,
      versao,
      processo,
    }: {
      acao: Acao;
      versao: VersaoRow;
      processo: Processo;
    }) => {
      const agora = new Date().toISOString();

      if (acao.tipo === "nova_versao") {
        const { error } = await supabase.from("documento_versoes").insert({
          processo_id: processo.id,
          tipo_documento: versao.tipo_documento,
          versao: proximaVersao(processo.versoes, versao.tipo_documento),
          estado: "Não Iniciado",
        });
        if (error) throw error;
        return;
      }

      const patch: TablesUpdate<"documento_versoes"> = {};
      let de = versao.estado;
      let para = versao.estado;

      if (acao.tipo === "iniciar") {
        patch["estado"] = "Em Elaboração";
        patch["data_inicio"] = agora;
        para = "Em Elaboração";
      } else if (acao.tipo === "enviar_validacao") {
        patch["estado"] = "Em Validação";
        patch["data_envio_validacao"] = agora;
        para = "Em Validação";
      } else if (acao.tipo === "validar_gestor") {
        patch["validado_gestor_id"] = processo.gestor_id;
        patch["data_validacao_gestor"] = agora;
        patch["forma_validacao_gestor"] = "Validação no portal";
        para = "Em Validação";
      } else if (acao.tipo === "validar_dono") {
        patch["validado_dono_id"] = processo.dono_id;
        patch["data_validacao_dono"] = agora;
        patch["forma_validacao_dono"] = "Validação no portal";
        // Com gestor e dono validados, avança para Em Aprovação.
        patch["estado"] = "Em Aprovação";
        para = "Em Aprovação";
      } else if (acao.tipo === "aprovar") {
        patch["estado"] = "Aprovado";
        patch["aprovado_por_id"] = processo.dono_id;
        patch["data_aprovacao"] = agora;
        patch["forma_aprovacao"] = "Aprovação no portal";
        patch["imutavel"] = true;
        para = "Aprovado";
      }

      const { error } = await supabase
        .from("documento_versoes")
        .update(patch)
        .eq("id", versao.id);
      if (error) throw error;

      await supabase.from("workflow_log").insert({
        documento_versao_id: versao.id,
        de_estado: de,
        para_estado: para,
        comentario: acao.label,
      });
    },
    onSuccess: () => {
      toast.success("Workflow atualizado");
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <PortalShell>{<Carregando />}</PortalShell>;

  if (!p)
    return (
      <PortalShell>
        <div className="pcp-empty pcp-card">
          Processo não encontrado.
          <Link to="/workflow" className="pcp-link">
            Voltar ao workflow
          </Link>
        </div>
      </PortalShell>
    );

  const atividades = (data?.atividades ?? []).filter((a) =>
    p.versoes.some((v) => v.id === a.documento_versao_id),
  );
  const logs = (data?.logs ?? []).filter((l) =>
    p.versoes.some((v) => v.id === l.documento_versao_id),
  );
  const nomeDe = (id: string | null) =>
    data?.utilizadores.find((u) => u.id === id)?.nome ?? "—";

  return (
    <PortalShell>
      <div className="pcp-crumb">
        <Link to="/workflow" style={{ color: "inherit", textDecoration: "none" }}>
          <ArrowLeft size={13} /> Workflow
        </Link>
        <span>/</span>
        <span>{p.codigo}</span>
      </div>

      <div
        className="pcp-card"
        style={{
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <div>
          <span className="code-tag">{p.codigo}</span>
          <h1 className="pcp-h1">{p.nome}</h1>
          <p className="pcp-sub">
            Dono: {p.donoNome} · Gestor: {p.gestorNome} · {p.area}
          </p>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8 }}>
          <EstadoProcessoBadge estado={p.estadoCalculado} />
          <span className="pcp-doccov" style={{ justifyContent: "flex-end" }}>
            <ProgressBar pct={p.progresso} /> {p.progresso}%
          </span>
          <Link to="/processos/$codigo" params={{ codigo: p.codigo }} className="pcp-icon-btn">
            Ficha do processo
          </Link>
        </div>
      </div>

      {!session && (
        <div className="pcp-lockmsg" style={{ marginTop: 16 }}>
          <Lock size={14} /> Está em modo consulta. Entre com a sua conta para executar ações do
          workflow.
        </div>
      )}

      {/* ETAPAS */}
      <div className="pcp-section-title">
        <h2>Etapas do workflow deste processo</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {WF_ETAPAS.map((etapa) => {
          const docs = DOC_TIPOS.map((t) => ({ tipo: t, versao: p.atuais[t] })).filter(
            ({ versao }) => etapaDoEstado(versao?.estado ?? "Não Iniciado") === etapa,
          );
          return (
            <div key={etapa} className="pcp-card" style={{ padding: 14, minHeight: 180 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--primary-dark)",
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                  marginBottom: 10,
                }}
              >
                {etapa} <span style={{ color: "var(--text-faint)" }}>({docs.length})</span>
              </div>
              {docs.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Sem documentos</div>
              )}
              {docs.map(({ tipo, versao }) => (
                <div
                  key={tipo}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 8,
                    background: "var(--surface-alt)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <b style={{ fontSize: 13 }}>{tipo}</b>
                    {versao?.imutavel ? <Lock size={12} color="var(--text-faint)" /> : null}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "2px 0 6px" }}>
                    v{versao?.versao ?? "—"} · {ELABORADOR_POR_TIPO[tipo]}
                  </div>
                  <DocEstadoBadge estado={versao?.estado ?? "Não Iniciado"} />
                  {versao && versao.estado === "Em Validação" && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                      Gestor: {versao.validado_gestor_id ? "validado" : "pendente"} · Dono:{" "}
                      {versao.validado_dono_id ? "validado" : "pendente"}
                    </div>
                  )}
                  {versao &&
                    session &&
                    acoesDisponiveis(versao).map((a) => (
                      <button
                        key={a.tipo}
                        className="pcp-icon-btn"
                        style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate({ acao: a, versao, processo: p })}
                      >
                        {a.tipo === "nova_versao" ? <Plus size={13} /> : <CheckCircle2 size={13} />}
                        {a.label}
                      </button>
                    ))}
                  <button
                    className="pcp-icon-btn"
                    style={{ marginTop: 6, width: "100%", justifyContent: "center" }}
                    onClick={() => setTipoAberto(tipoAberto === tipo ? null : tipo)}
                  >
                    <History size={13} /> Versões
                  </button>
                  {tipoAberto === tipo && (
                    <div style={{ marginTop: 8 }}>
                      {p.versoes
                        .filter((v) => v.tipo_documento === tipo)
                        .map((v) => (
                          <div
                            key={v.id}
                            style={{
                              fontSize: 11.5,
                              color: "var(--text-muted)",
                              borderTop: "1px solid var(--border)",
                              paddingTop: 5,
                              marginTop: 5,
                            }}
                          >
                            v{v.versao} — {v.estado}
                            {v.imutavel ? " (imutável)" : ""} · {formatarData(v.updated_at)}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ATIVIDADES */}
      <div className="pcp-section-title">
        <h2>
          <ListChecks size={15} style={{ verticalAlign: "-2px" }} /> Atividades atribuídas
        </h2>
      </div>
      <div className="pcp-card" style={{ overflow: "hidden" }}>
        <table className="pcp-table">
          <thead>
            <tr>
              <th>Tarefa</th>
              <th>Atribuído a</th>
              <th>Estado</th>
              <th>Prazo</th>
            </tr>
          </thead>
          <tbody>
            {atividades.map((a) => (
              <tr key={a.id}>
                <td>{a.tarefa}</td>
                <td>
                  <UserCog size={13} style={{ verticalAlign: "-2px" }} />{" "}
                  {nomeDe(a.atribuido_a_id)}
                </td>
                <td>{a.estado}</td>
                <td>{formatarData(a.prazo)}</td>
              </tr>
            ))}
            {atividades.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: "var(--text-muted)", textAlign: "center" }}>
                  Sem atividades pendentes neste processo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* HISTÓRICO */}
      <div className="pcp-section-title">
        <h2>
          <RefreshCw size={15} style={{ verticalAlign: "-2px" }} /> Histórico de decisões
        </h2>
      </div>
      <div className="pcp-card" style={{ padding: "8px 20px" }}>
        {logs.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sem registos de workflow.</p>
        )}
        {logs.map((l) => {
          const v = p.versoes.find((x) => x.id === l.documento_versao_id);
          return (
            <div className="pcp-info-row" key={l.id}>
              <span className="k">
                {formatarData(l.data)} · {v?.tipo_documento} v{v?.versao}
              </span>
              <span className="v">
                {l.de_estado} → {l.para_estado}
                {l.comentario ? ` · ${l.comentario}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </PortalShell>
  );
}
