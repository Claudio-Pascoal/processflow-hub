import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileCheck2,
  LockKeyhole,
  Mail,
  Network,
  ShieldCheck,
} from "lucide-react";
import "./login-screen.css";

export type LoginMode = "entrar" | "registar";

export interface LoginScreenProps {
  /** Chamado ao submeter o formulário de email/palavra-passe */
  onSubmit?: (data: {
    modo: LoginMode;
    email: string;
    password: string;
    nome?: string | undefined;
  }) => void;
  /** Chamado ao clicar em "Continuar com Google" */
  onGoogle?: () => void;
  /** Título da página (opcional) */
  title?: string;
}

export function LoginScreen({
  onSubmit,
  onGoogle,
  title = "Portal Corporativo de Processos",
}: LoginScreenProps) {
  const [modo, setModo] = useState<LoginMode>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setOcupado(true);

    // Simula um pequeno atraso para parecer uma ação real
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (onSubmit) {
      onSubmit({ modo, email, password, nome: modo === "registar" ? nome : undefined });
    } else {
      // Comportamento padrão apenas para demonstração visual
      window.alert(
        modo === "entrar"
          ? `Entrar com: ${email}`
          : `Registar: ${nome} (${email})`
      );
    }

    setOcupado(false);
  };

  const entrarGoogle = async () => {
    setOcupado(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (onGoogle) {
      onGoogle();
    } else {
      window.alert("Ação: entrar com Google (sem backend ligado)");
    }
    setOcupado(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-label="Acesso ao Portal Corporativo de Processos">
        <div className="auth-brand-panel">
          <div className="auth-grid" aria-hidden="true" />
          <svg className="auth-flow-map" viewBox="0 0 620 620" aria-hidden="true">
            <g className="auth-flow-lines">
              <path d="M52 142H210V245H362V350H548" />
              <path d="M52 350H155V456H362" />
              <path d="M362 142H548V225" />
            </g>
            <g className="auth-flow-nodes">
              <rect x="36" y="126" width="32" height="32" rx="7" />
              <rect x="194" y="126" width="32" height="32" rx="7" />
              <rect x="194" y="229" width="32" height="32" rx="7" />
              <rect x="346" y="229" width="32" height="32" rx="7" />
              <rect x="346" y="334" width="32" height="32" rx="7" />
              <rect x="532" y="334" width="32" height="32" rx="7" />
              <rect x="36" y="334" width="32" height="32" rx="7" />
              <rect x="139" y="334" width="32" height="32" rx="7" />
              <rect x="139" y="440" width="32" height="32" rx="7" />
              <rect x="346" y="440" width="32" height="32" rx="7" />
              <rect x="346" y="126" width="32" height="32" rx="7" />
              <rect x="532" y="126" width="32" height="32" rx="7" />
            </g>
          </svg>

          <div className="auth-brand-content">
            <div className="auth-brand-lockup">
              <div className="auth-brand-mark">
                <Network size={27} strokeWidth={1.8} />
              </div>
              <div>
                <strong>SETIC-FP</strong>
                <span>
                  Serviço de Tecnologias de Informação
                  <br />
                  e Comunicação das Finanças Públicas
                </span>
              </div>
            </div>

            <div className="auth-brand-copy">
              <span className="auth-eyebrow">
                <ShieldCheck size={14} /> Plataforma institucional
              </span>
              <h1>
                {title.includes("Portal") ? "Portal Corporativo" : title}
                <br />
                de Processos
              </h1>
              <p>
                Consulte, documente e acompanhe os processos da organização —
                da cadeia de valor à aprovação final.
              </p>
            </div>

            <div className="auth-process-steps" aria-label="Etapas do processo">
              <div>
                <span>
                  <FileCheck2 size={15} />
                </span>
                <b>Documentar</b>
              </div>
              <i />
              <div>
                <span>
                  <ShieldCheck size={15} />
                </span>
                <b>Validar</b>
              </div>
              <i />
              <div>
                <span>
                  <Network size={15} />
                </span>
                <b>Aprovar</b>
              </div>
            </div>
          </div>

          <footer className="auth-brand-footer">
            <span>Ética</span>
            <i /> <span>Transparência</span>
            <i /> <span>Compromisso</span>
            <i /> <span>Inovação</span>
          </footer>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-wrap">
            <div className="auth-form-heading">
              <span className="auth-mobile-brand">SETIC-FP</span>
              <h2>{modo === "entrar" ? "Bem-vindo" : "Criar conta"}</h2>
              <p>
                {modo === "entrar"
                  ? "Aceda com as suas credenciais institucionais."
                  : "Preencha os dados para solicitar acesso ao portal."}
              </p>
            </div>

            <button
              type="button"
              className="auth-google-btn"
              onClick={entrarGoogle}
              disabled={ocupado}
            >
              <span className="auth-google-mark" aria-hidden="true">
                G
              </span>
              Continuar com Google
            </button>

            <div className="auth-divider">
              <span>ou com email</span>
            </div>

            <form onSubmit={submeter} className="auth-form">
              {modo === "registar" && (
                <label className="auth-field">
                  <span>Nome completo</span>
                  <div>
                    <Mail size={17} />
                    <input
                      placeholder="O seu nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>
                </label>
              )}
              <label className="auth-field">
                <span>Email</span>
                <div>
                  <Mail size={17} />
                  <input
                    type="email"
                    placeholder="nome@instituicao.ao"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </label>
              <label className="auth-field">
                <span>Palavra-passe</span>
                <div>
                  <LockKeyhole size={17} />
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="Mínimo de 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      modo === "entrar" ? "current-password" : "new-password"
                    }
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setMostrarPassword((valor) => !valor)}
                    aria-label={
                      mostrarPassword
                        ? "Ocultar palavra-passe"
                        : "Mostrar palavra-passe"
                    }
                  >
                    {mostrarPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <button type="submit" className="auth-submit" disabled={ocupado}>
                <span>
                  {ocupado
                    ? "A processar…"
                    : modo === "entrar"
                    ? "Entrar no portal"
                    : "Criar conta"}
                </span>
                {!ocupado && <ArrowRight size={17} />}
              </button>
            </form>

            <p className="auth-switch-copy">
              {modo === "entrar" ? "Ainda não tem conta?" : "Já tem uma conta?"}
              <button
                type="button"
                onClick={() =>
                  setModo(modo === "entrar" ? "registar" : "entrar")
                }
              >
                {modo === "entrar" ? "Registar" : "Entrar"}
              </button>
            </p>

            {modo === "registar" && (
              <p className="auth-reader-note">
                <ShieldCheck size={14} /> Novas contas começam com acesso de
                Leitor.
              </p>
            )}
          </div>
          <footer className="auth-form-footer">
            Acesso seguro e reservado a utilizadores autorizados
          </footer>
        </div>
      </section>
    </main>
  );
}
