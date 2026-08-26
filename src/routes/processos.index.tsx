import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { matchesQuery, usePortal } from "@/portal/data";
import { Carregando, EstadoProcessoBadge, PageHeader, PortalShell, ProgressBar } from "@/portal/ui";
import { MACROPROCESSOS, formatarData } from "@/portal/model";

type Busca = { q?: string; macro?: string; estado?: string };

export const Route = createFileRoute("/processos/")({
  validateSearch: (search: Record<string, unknown>): Busca => {
    const out: Busca = {};
    for (const k of ["q", "macro", "estado"] as const) {
      const v = search[k];
      if (typeof v === "string" && v) out[k] = v;
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "Processos — Portal Corporativo de Processos" },
      {
        name: "description",
        content:
          "Lista completa dos processos da organização, com filtros por macroprocesso, estado e cobertura documental.",
      },
      { property: "og:title", content: "Processos" },
      {
        property: "og:description",
        content: "Pesquise e filtre os processos documentados da organização.",
      },
    ],
  }),
  component: Processos,
});

const ESTADOS = ["Em Elaboração", "Em Validação", "Em Aprovação", "Concluído"];

function Processos() {
  const { q = "", macro = "", estado = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/processos/" });
  const { data, isLoading } = usePortal();

  const set = (patch: Partial<Busca>) =>
    navigate({ search: (prev: Busca) => ({ ...prev, ...patch }), replace: true });

  const lista = (data?.processos ?? []).filter(
    (p) =>
      matchesQuery(p, q) &&
      (!macro || p.macroprocesso === macro) &&
      (!estado || p.estadoCalculado === estado),
  );

  return (
    <PortalShell>
      <PageHeader
        title="Processos"
        subtitle={`${lista.length} processo(s) encontrados no repositório.`}
      />

      <div className="pcp-toolbar">
        <div className="pcp-search-inline">
          <Search size={15} />
          <input
            value={q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Pesquisar por nome, código ou palavra-chave"
          />
        </div>
        <select
          className="pcp-select"
          value={macro}
          onChange={(e) => set({ macro: e.target.value })}
        >
          <option value="">Todos os macroprocessos</option>
          {MACROPROCESSOS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          className="pcp-select"
          value={estado}
          onChange={(e) => set({ estado: e.target.value })}
        >
          <option value="">Todos os estados</option>
          {ESTADOS.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        {(q || macro || estado) && (
          <button className="pcp-clear-btn" onClick={() => set({ q: "", macro: "", estado: "" })}>
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {isLoading ? (
        <Carregando />
      ) : (
        <div className="pcp-card" style={{ overflow: "hidden" }}>
          <table className="pcp-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Processo</th>
                <th>Macroprocesso</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Documentação</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id}>
                  <td className="pcp-tabular" style={{ color: "var(--text-faint)" }}>
                    {p.codigo}
                  </td>
                  <td>
                    <Link
                      to="/processos/$codigo"
                      params={{ codigo: p.codigo }}
                      style={{ fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}
                    >
                      {p.nome}
                    </Link>
                  </td>
                  <td>{p.macroprocesso}</td>
                  <td>{p.area}</td>
                  <td>
                    <EstadoProcessoBadge estado={p.estadoCalculado} />
                  </td>
                  <td>
                    <span className="pcp-doccov">
                      <ProgressBar pct={p.progresso} /> {p.progresso}%
                    </span>
                  </td>
                  <td>{formatarData(p.updated_at)}</td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    Nenhum processo corresponde aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
