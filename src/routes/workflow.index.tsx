import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ListChecks } from "lucide-react";
import { usePortal } from "@/portal/data";
import { Carregando, EstadoProcessoBadge, PageHeader, PortalShell, ProgressBar } from "@/portal/ui";
import { DOC_TIPOS, type DocEstado } from "@/portal/model";

export const Route = createFileRoute("/workflow/")({
  head: () => ({
    meta: [
      { title: "Workflow por processo — Portal de Processos" },
      {
        name: "description",
        content:
          "Acompanhe a elaboração, validação e aprovação da documentação, processo a processo.",
      },
      { property: "og:title", content: "Workflow por processo" },
      {
        property: "og:description",
        content: "Estado de elaboração, validação e aprovação de cada processo.",
      },
    ],
  }),
  component: WorkflowLista,
});

function resumo(estados: DocEstado[]) {
  const contagem = new Map<DocEstado, number>();
  estados.forEach((e) => contagem.set(e, (contagem.get(e) ?? 0) + 1));
  return [...contagem.entries()].map(([e, n]) => `${n} ${e}`).join(" · ");
}

function WorkflowLista() {
  const { data, isLoading } = usePortal();
  const processos = data?.processos ?? [];
  const atividades = data?.atividades ?? [];

  const grupos = ["Em Elaboração", "Em Validação", "Em Aprovação", "Concluído"] as const;

  return (
    <PortalShell>
      <PageHeader
        title="Workflow"
        subtitle="O workflow está organizado por processo. Escolha um processo para ver as suas etapas, versões, atividades e histórico de decisões."
      />

      <div className="pcp-card" style={{ padding: "14px 18px", marginBottom: 20 }}>
        <strong style={{ fontSize: 13, color: "var(--primary-dark)" }}>
          Regra do estado do processo
        </strong>
        <p style={{ margin: "6px 0 0 0", fontSize: 12.5, color: "var(--text-muted)" }}>
          Há algum documento <em>Não Iniciado</em> ou <em>Em Elaboração</em>? → Em Elaboração. Caso
          contrário, há algum <em>Em Validação</em>? → Em Validação. Caso contrário, há algum{" "}
          <em>Em Aprovação</em>? → Em Aprovação. Só quando os 4 documentos estão Aprovados o processo
          fica Concluído.
        </p>
      </div>

      {isLoading ? (
        <Carregando />
      ) : (
        grupos.map((g) => {
          const lista = processos.filter((p) => p.estadoCalculado === g);
          if (lista.length === 0) return null;
          return (
            <section key={g} style={{ marginBottom: 26 }}>
              <div className="pcp-section-title" style={{ margin: "0 0 12px 0" }}>
                <h2>
                  {g} <span style={{ color: "var(--text-faint)" }}>({lista.length})</span>
                </h2>
              </div>
              <div className="pcp-process-grid">
                {lista.map((p) => {
                  const estados = DOC_TIPOS.map(
                    (t) => p.atuais[t]?.estado ?? "Não Iniciado",
                  ) as DocEstado[];
                  const tarefas = atividades.filter((a) =>
                    p.versoes.some((v) => v.id === a.documento_versao_id),
                  ).length;
                  return (
                    <Link
                      key={p.id}
                      to="/workflow/$codigo"
                      params={{ codigo: p.codigo }}
                      className="pcp-card pcp-process-card"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div className="head">
                        <div>
                          <div className="code">{p.codigo}</div>
                          <p className="name">{p.nome}</p>
                        </div>
                        <EstadoProcessoBadge estado={p.estadoCalculado} />
                      </div>
                      <div className="meta">
                        <span>
                          {DOC_TIPOS.length} documentos · {resumo(estados)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <ListChecks size={13} /> {tarefas} atividade(s)
                        </span>
                      </div>
                      <div className="foot">
                        <span className="pcp-doccov">
                          <ProgressBar pct={p.progresso} /> {p.progresso}%
                        </span>
                        <span
                          className="pcp-link"
                          style={{ fontSize: 12.5, display: "flex", alignItems: "center" }}
                        >
                          Abrir workflow <ChevronRight size={14} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </PortalShell>
  );
}
