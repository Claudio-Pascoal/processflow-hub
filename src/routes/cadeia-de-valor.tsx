import { createFileRoute, Link } from "@tanstack/react-router";
import { usePortal } from "@/portal/data";
import { Carregando, EstadoProcessoBadge, PageHeader, PortalShell } from "@/portal/ui";
import { MACROPROCESSOS, MACRO_INFO } from "@/portal/model";

export const Route = createFileRoute("/cadeia-de-valor")({
  head: () => ({
    meta: [
      { title: "Cadeia de Valor — Portal de Processos" },
      {
        name: "description",
        content:
          "Visão da cadeia de valor: processos de gestão, processos core e processos de suporte da organização.",
      },
      { property: "og:title", content: "Cadeia de Valor" },
      {
        property: "og:description",
        content: "Processos de gestão, core e suporte organizados por macroprocesso.",
      },
    ],
  }),
  component: CadeiaDeValor,
});

function CadeiaDeValor() {
  const { data, isLoading } = usePortal();
  const processos = data?.processos ?? [];

  return (
    <PortalShell>
      <PageHeader
        title="Cadeia de Valor"
        subtitle="Como os processos se articulam para entregar valor: gestão no topo, processos core no centro, suporte na base."
      />

      {isLoading ? (
        <Carregando />
      ) : (
        MACROPROCESSOS.map((macro) => {
          const info = MACRO_INFO[macro];
          const lista = processos.filter((p) => p.macroprocesso === macro);
          return (
            <section key={macro} className="pcp-vc-band" style={{ borderLeftColor: info.cor }}>
              <div className="pcp-vc-band-head">
                <h2 style={{ color: info.cor }}>{macro}</h2>
                <span>
                  {info.tipo} · {lista.length} processo(s)
                </span>
              </div>
              <p className="pcp-vc-band-desc">{info.descricao}</p>
              <div className="pcp-vc-cards">
                {lista.map((p) => (
                  <Link
                    key={p.id}
                    to="/processos/$codigo"
                    params={{ codigo: p.codigo }}
                    className="pcp-vc-card"
                  >
                    <div className="code">{p.codigo}</div>
                    <div className="name">{p.nome}</div>
                    <EstadoProcessoBadge estado={p.estadoCalculado} />
                  </Link>
                ))}
                {lista.length === 0 && (
                  <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>
                    Sem processos registados.
                  </span>
                )}
              </div>
            </section>
          );
        })
      )}
    </PortalShell>
  );
}
