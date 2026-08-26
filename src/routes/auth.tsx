import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { PortalShell } from "@/portal/ui";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Portal de Processos" },
      {
        name: "description",
        content: "Autentique-se para elaborar, validar e aprovar documentação de processos.",
      },
      { property: "og:title", content: "Entrar no Portal de Processos" },
      {
        property: "og:description",
        content: "Acesso reservado a colaboradores para gestão documental de processos.",
      },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "registar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setOcupado(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Sessão iniciada");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome },
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Confirme o email para entrar.");
        setModo("entrar");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível autenticar");
    } finally {
      setOcupado(false);
    }
  };

  const entrarGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <PortalShell>
      <div style={{ maxWidth: 420, margin: "40px auto" }}>
        <div className="pcp-card" style={{ padding: "26px 26px" }}>
          <h1 className="pcp-h1" style={{ fontSize: 22 }}>
            {modo === "entrar" ? "Entrar no portal" : "Criar conta"}
          </h1>
          <p className="pcp-sub" style={{ marginBottom: 18 }}>
            A consulta é livre. A autenticação é necessária para executar ações de workflow.
          </p>

          <button
            type="button"
            className="pcp-icon-btn"
            style={{ width: "100%", justifyContent: "center", padding: "10px" }}
            onClick={entrarGoogle}
          >
            Continuar com Google
          </button>

          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "var(--text-faint)",
              margin: "14px 0",
            }}
          >
            ou com email
          </div>

          <form onSubmit={submeter} style={{ display: "grid", gap: 10 }}>
            {modo === "registar" && (
              <input
                className="pcp-input"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            )}
            <input
              className="pcp-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="pcp-input"
              type="password"
              placeholder="Palavra-passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="submit"
              className="pcp-btn-primary"
              disabled={ocupado}
              style={{ justifyContent: "center" }}
            >
              <LogIn size={15} /> {modo === "entrar" ? "Entrar" : "Registar"}
            </button>
          </form>

          <button
            type="button"
            className="pcp-link"
            style={{ marginTop: 14 }}
            onClick={() => setModo(modo === "entrar" ? "registar" : "entrar")}
          >
            {modo === "entrar" ? "Não tenho conta — registar" : "Já tenho conta — entrar"}
          </button>
        </div>
      </div>
    </PortalShell>
  );
}
