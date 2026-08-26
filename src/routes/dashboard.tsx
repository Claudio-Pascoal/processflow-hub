import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePortal } from "@/portal/data";
import { Carregando, PageHeader, PortalShell } from "@/portal/ui";
import {
  DOC_ESTADOS,
  DOC_TIPOS,
  ESTADO_PROCESSO_STYLE,
  MACROPROCESSOS,
  type DocEstado,
  type EstadoProcesso,
} from "@/portal/model";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard de processos — Portal de Processos" },
      {
        name: "description",
        content:
          "Indicadores de maturidade documental: estado dos processos, cobertura por macroprocesso e distribuição de documentos.",
      },
      { property: "og:title", content: "Dashboard de processos" },
      {
        property: "og:description",
        content: "Indicadores de cobertura documental e estado dos processos.",
      },
    ],
  }),
  component: Dashboard,
});

const CORES = ["#1f4e79", "#2e7d5b", "#c98a1b", "#8a5a2b", "#5b6b7c"];

function Dashboard() {
  const { data, isLoading } = usePortal();
  const processos = data?.processos ?? [];

  const estados: EstadoProcesso[] = ["Em Elaboração", "Em Validação", "Em Aprovação", "Concluído"];

  const porEstado = estados.map((e) => ({
    name: e,
    value: processos.filter((p) => p.estadoCalculado === e).length,
  }));

  const porMacro = MACROPROCESSOS.map((m) => {
    const lista = processos.filter((p) => p.macroprocesso === m);
    const media = lista.length
      ? Math.round(lista.reduce((acc, p) => acc + p.progresso, 0) / lista.length)
      : 0;
    return { name: m, processos: lista.length, cobertura: media };
  });

  const porTipo = DOC_TIPOS.map((t) => {
    const linha: Record<string, string | number> = { name: t };
    DOC_ESTADOS.forEach((e: DocEstado) => {
      linha[e] = processos.filter((p) => (p.atuais[t]?.estado ?? "Não Iniciado") === e).length;
    });
    return linha;
  });

  const totalDocs = processos.length * DOC_TIPOS.length;
  const aprovados = processos.reduce(
    (acc, p) => acc + DOC_TIPOS.filter((t) => p.atuais[t]?.estado === "Aprovado").length,
    0,
  );

  return (
    <PortalShell>
      <PageHeader
        title="Dashboard"
        subtitle="Maturidade documental dos processos: onde estamos, o que falta aprovar e onde está o esforço."
      />

      {isLoading ? (
        <Carregando />
      ) : (
        <>
          <div className="pcp-kpi-grid">
            {[
              ["Processos mapeados", processos.length],
              ["Processos concluídos", processos.filter((p) => p.estadoCalculado === "Concluído").length],
              ["Documentos aprovados", `${aprovados}/${totalDocs}`],
              [
                "Cobertura média",
                `${processos.length ? Math.round(processos.reduce((a, p) => a + p.progresso, 0) / processos.length) : 0}%`,
              ],
            ].map(([label, valor]) => (
              <div className="pcp-card pcp-kpi" key={String(label)}>
                <div className="value">{valor}</div>
                <div className="label">{label}</div>
              </div>
            ))}
          </div>

          <div className="pcp-chart-grid" style={{ marginTop: 20 }}>
            <div className="pcp-card" style={{ padding: "18px 20px" }}>
              <h2 style={{ fontSize: 14, margin: "0 0 12px 0", color: "var(--primary-dark)" }}>
                Processos por estado
              </h2>
              <div style={{ height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={porEstado} dataKey="value" nameKey="name" outerRadius={90} label>
                      {porEstado.map((e) => (
                        <Cell key={e.name} fill={ESTADO_PROCESSO_STYLE[e.name].fg} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pcp-card" style={{ padding: "18px 20px" }}>
              <h2 style={{ fontSize: 14, margin: "0 0 12px 0", color: "var(--primary-dark)" }}>
                Cobertura média por macroprocesso
              </h2>
              <div style={{ height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={porMacro}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis domain={[0, 100]} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="cobertura" name="Cobertura (%)" fill="#1f4e79" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="pcp-card" style={{ padding: "18px 20px", marginTop: 16 }}>
            <h2 style={{ fontSize: 14, margin: "0 0 12px 0", color: "var(--primary-dark)" }}>
              Estado dos documentos por tipo
            </h2>
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={porTipo}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {DOC_ESTADOS.map((e, i) => (
                    <Bar key={e} dataKey={e} stackId="a" fill={CORES[i % CORES.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </PortalShell>
  );
}
