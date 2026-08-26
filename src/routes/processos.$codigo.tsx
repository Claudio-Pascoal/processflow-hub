import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Eye, Lock, Workflow as WorkflowIcon } from "lucide-react";
import { usePortal } from "@/portal/data";
import {
  Carregando,
  CoverageRing,
  DocEstadoBadge,
  EstadoProcessoBadge,
  PortalShell,
} from "@/portal/ui";
import { DOC_TIPOS, ELABORADOR_POR_TIPO, formatarData } from "@/portal/model";

export const Route = createFileRoute("/processos/$codigo")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.codigo} — Ficha de processo` },
      {
        name: "description",
        content: `Ficha do processo ${params.codigo}: descrição, responsáveis e documentação associada.`,
      },
      { property: "og:title", content: `Processo ${params.codigo}` },
      {
        property: "og:description",
        content: "Ficha detalhada do processo, com responsáveis e documentos.",
      },
    ],
  }),
  component: FichaProcesso,
});

function FichaProcesso() {
  const { codigo } = Route.useParams();
  const { data, isLoading } = usePortal();
  const p = data?.processos.find((x) => x.codigo === codigo);

  if (isLoading) return <PortalShell>{<Carregando />}</PortalShell>;

  if (!p)
    return (
      <PortalShell>
        <div className="pcp-empty pcp-card">
          Processo não encontrado.
          <Link to="/processos" className="pcp-link">
            Voltar aos processos
          </Link>
        </div>
      </PortalShell>
    );

  return (
    <PortalShell>
      <div className="pcp-crumb">
        <Link to="/processos" style={{ color: "inherit", textDecoration: "none" }}>
          <ArrowLeft size={13} /> Processos
        </Link>
        <span>/</span>
        <span>{p.codigo}</span>
      </div>

      <div className="pcp-card pcp-detail-head">
        <div>
          <span className="code-tag">{p.codigo}</span>
          <h1 className="pcp-h1">{p.nome}</h1>
          <p className="pcp-sub">{p.descricao}</p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <EstadoProcessoBadge estado={p.estadoCalculado} />
            <Link to="/workflow/$codigo" params={{ codigo: p.codigo }} className="pcp-icon-btn">
              <WorkflowIcon size={14} /> Ver workflow
            </Link>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <CoverageRing pct={p.cobertura} />
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6 }}>
            Cobertura documental
          </div>
        </div>
      </div>

      <div className="pcp-detail-grid">
        <div className="pcp-card" style={{ padding: "18px 22px" }}>
          <h2 style={{ fontSize: 14, margin: "0 0 10px 0", color: "var(--primary-dark)" }}>
            Documentação
          </h2>
          {DOC_TIPOS.map((t) => {
            const v = p.atuais[t];
            return (
              <div className="pcp-doc-row" key={t}>
                <div>
                  <div className="name">
                    {t}
                    {v?.imutavel ? <Lock size={12} /> : null}
                  </div>
                  <div className="sub">
                    {v
                      ? `v${v.versao} · atualizado a ${formatarData(v.updated_at)} · responsável: ${ELABORADOR_POR_TIPO[t]}`
                      : `Sem versão criada · responsável: ${ELABORADOR_POR_TIPO[t]}`}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <DocEstadoBadge estado={v?.estado ?? "Não Iniciado"} />
                  <div className="pcp-doc-actions">
                    <button className="pcp-icon-btn" disabled={!v}>
                      <Eye size={13} /> Ver
                    </button>
                    <button className="pcp-icon-btn" disabled={!v}>
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pcp-card" style={{ padding: "18px 22px" }}>
          <h2 style={{ fontSize: 14, margin: "0 0 10px 0", color: "var(--primary-dark)" }}>
            Identificação
          </h2>
          {[
            ["Macroprocesso", p.macroprocesso],
            ["Categoria", p.categoria],
            ["Área", p.area ?? "—"],
            ["Dono do processo", `${p.donoNome}${p.dono_cargo ? ` · ${p.dono_cargo}` : ""}`],
            ["Gestor do processo", `${p.gestorNome}${p.gestor_cargo ? ` · ${p.gestor_cargo}` : ""}`],
            ["Palavras-chave", p.palavras_chave ?? "—"],
            ["Última atualização", formatarData(p.updated_at)],
          ].map(([k, v]) => (
            <div className="pcp-info-row" key={k}>
              <span className="k">{k}</span>
              <span className="v">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
