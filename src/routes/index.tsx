import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardCheck, Layers, Search, ShieldCheck } from "lucide-react";
import { usePortal } from "@/portal/data";
import { Carregando, EstadoProcessoBadge, PortalShell, ProgressBar } from "@/portal/ui";
import { MACROPROCESSOS, formatarData } from "@/portal/model";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal Corporativo de Processos" },
      {
        name: "description",
        content:
          "Consulte, documente e aprove os processos de negócio da organização num único repositório corporativo.",
      },
      { property: "og:title", content: "Portal Corporativo de Processos" },
      {
        property: "og:description",
        content: "Repositório corporativo de processos, documentação e aprovações.",
      },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { data, isLoading } = usePortal();

  const processos = data?.processos ?? [];
  const concluidos = processos.filter((p) => p.estadoCalculado === "Concluído").length;
  const emAprovacao = processos.filter((p) => p.estadoCalculado === "Em Aprovação").length;
  const docs = data?.versoes.filter((v) => v.estado === "Aprovado").length ?? 0;

  const recentes = [...processos]
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    .slice(0, 6);

  return (
    <PortalShell>
      <section className="pcp-hero">
        <h1>Portal Corporativo de Processos</h1>
        <p>
          Um único lugar para consultar, documentar e aprovar os processos da organização — da
          cadeia de valor ao procedimento operacional.
        </p>
        <form
          className="pcp-hero-search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q");
            window.location.assign(`/processos?q=${encodeURIComponent(String(q ?? ""))}`);
          }}
        >
          <Search size={17} color="var(--text-faint)" />
          <input name="q" placeholder="Pesquisar por processo, área ou palavra-chave" />
          <button className="pcp-icon-btn" type="submit">
            Pesquisar
          </button>
        </form>
      </section>

      {isLoading ? (
        <Carregando />
      ) : (
        <>
          <div className="pcp-stat-grid">
            {[
              { lbl: "Processos", num: processos.length },
              { lbl: "Concluídos", num: concluidos },
              { lbl: "Em aprovação", num: emAprovacao },
              { lbl: "Documentos aprovados", num: docs },
            ].map((s) => (
              <div className="pcp-card pcp-stat" key={s.lbl}>
                <span className="num pcp-tabular">{s.num}</span>
                <span className="lbl">{s.lbl}</span>
              </div>
            ))}
          </div>

          <div className="pcp-section-title">
            <h2>Macroprocessos</h2>
            <Link to="/cadeia-de-valor" className="pcp-link">
              Ver cadeia de valor <ArrowRight size={14} />
            </Link>
          </div>
          <div className="pcp-macro-grid">
            {MACROPROCESSOS.map((m) => {
              const lista = processos.filter((p) => p.macroprocesso === m);
              return (
                <Link
                  key={m}
                  to="/processos"
                  search={{ macro: m }}
                  className="pcp-card pcp-macro-card"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="top">
                    <div className="icon">
                      {m === "Gestão" ? (
                        <ShieldCheck size={17} />
                      ) : m === "Primários" ? (
                        <Layers size={17} />
                      ) : (
                        <ClipboardCheck size={17} />
                      )}
                    </div>
                    <span className="count pcp-tabular">{lista.length}</span>
                  </div>
                  <b>{m}</b>
                  <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    {lista.filter((p) => p.estadoCalculado === "Concluído").length} concluídos
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="pcp-section-title">
            <h2>Atualizados recentemente</h2>
            <Link to="/processos" className="pcp-link">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="pcp-process-grid">
            {recentes.map((p) => (
              <Link
                key={p.id}
                to="/processos/$codigo"
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
                  <span>{p.area}</span>
                  <span>Atualizado a {formatarData(p.updated_at)}</span>
                </div>
                <div className="foot">
                  <span className="pcp-doccov">
                    <ProgressBar pct={p.progresso} /> {p.progresso}%
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {p.macroprocesso}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </PortalShell>
  );
}
