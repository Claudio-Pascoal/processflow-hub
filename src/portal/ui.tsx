import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Building2,
  FileText,
  GitBranch,
  Home as HomeIcon,
  Layers,
  LogIn,
  LogOut,
  Search,
  Settings,
  Workflow as WorkflowIcon,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  DOC_ESTADO_STYLE,
  ESTADO_PROCESSO_STYLE,
  type DocEstado,
  type EstadoProcesso,
} from "./model";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}

export function EstadoProcessoBadge({ estado }: { estado: EstadoProcesso }) {
  const s = ESTADO_PROCESSO_STYLE[estado];
  return (
    <span className="pcp-badge" style={{ background: s.bg, color: s.fg }}>
      {estado}
    </span>
  );
}

export function DocEstadoBadge({ estado }: { estado: DocEstado }) {
  const s = DOC_ESTADO_STYLE[estado];
  return (
    <span className="pcp-badge" style={{ background: s.bg, color: s.fg }}>
      {estado}
    </span>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="pcp-doccov-bar" style={{ width: 84 }}>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CoverageRing({ pct, size = 64 }: { pct: number; size?: number }) {
  return (
    <div
      className="pcp-coverage-ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--accent) ${pct * 3.6}deg, var(--neutral-soft) 0deg)`,
      }}
    >
      <div
        style={{
          width: size - 12,
          height: size - 12,
          borderRadius: "50%",
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size > 50 ? 14 : 11,
        }}
      >
        {pct}%
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 22,
      }}
    >
      <div>
        <h1 className="pcp-h1">{title}</h1>
        {subtitle ? <p className="pcp-sub">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

const NAV = [
  { to: "/", label: "Início", icon: HomeIcon, grupo: "Portal" },
  { to: "/cadeia-de-valor", label: "Cadeia de Valor", icon: GitBranch, grupo: "Portal" },
  { to: "/processos", label: "Processos", icon: Layers, grupo: "Portal" },
  { to: "/workflow", label: "Workflow", icon: WorkflowIcon, grupo: "Gestão" },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3, grupo: "Gestão" },
  { to: "/administracao", label: "Administração", icon: Settings, grupo: "Gestão" },
] as const;

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useSession();
  const [q, setQ] = useState("");

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="pcp-root">
      <aside className="pcp-sidebar">
        <div className="pcp-sidebar-brand">
          <div className="pcp-sidebar-brand-mark">
            <Building2 size={17} color="#fff" />
          </div>
          <div className="pcp-sidebar-brand-text">
            <b>Portal de Processos</b>
            <span>Repositório corporativo</span>
          </div>
        </div>

        {["Portal", "Gestão"].map((grupo) => (
          <div className="pcp-nav-group" key={grupo}>
            <div className="pcp-nav-label">{grupo}</div>
            {NAV.filter((n) => n.grupo === grupo).map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`pcp-nav-item${isActive(n.to) ? " active" : ""}`}
                >
                  <Icon size={16} />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </div>
        ))}

        <div className="pcp-sidebar-footer">
          {session ? "Sessão ativa" : "Modo consulta"}
          <br />v1.0
        </div>
      </aside>

      <div className="pcp-main">
        <header className="pcp-topbar">
          <form
            className="pcp-topbar-search"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) window.location.assign(`/processos?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <Search size={15} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar processos, documentos, palavras-chave..."
              aria-label="Pesquisar"
            />
          </form>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            {session ? (
              <>
                <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {session.user.email}
                </span>
                <button
                  className="pcp-icon-btn"
                  onClick={() => supabase.auth.signOut()}
                  type="button"
                >
                  <LogOut size={14} /> Sair
                </button>
              </>
            ) : (
              <Link to="/auth" className="pcp-icon-btn">
                <LogIn size={14} /> Entrar
              </Link>
            )}
            <div className="pcp-avatar">
              {session?.user.email?.slice(0, 2).toUpperCase() ?? "PC"}
            </div>
          </div>
        </header>

        <main className="pcp-page">{children}</main>
      </div>
    </div>
  );
}

export function EstadoVazio({ texto }: { texto: string }) {
  return (
    <div className="pcp-empty pcp-card">
      <FileText size={26} />
      {texto}
    </div>
  );
}

export function Carregando() {
  return (
    <div className="pcp-empty pcp-card" style={{ border: "none", boxShadow: "none" }}>
      A carregar…
    </div>
  );
}
