import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Lock, Plus, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePapeisTodos, usePortal, useUtilizadorAtual } from "@/portal/data";
import { Carregando, EstadoProcessoBadge, PageHeader, PortalShell } from "@/portal/ui";
import {
  DOC_TIPOS,
  MACROPROCESSOS,
  PAPEIS,
  PAPEL_DESCRICAO,
  PAPEL_LABEL,
  podeCriarProcesso,
  podeGerirPapeis,
  type Macroprocesso,
  type Papel,
} from "@/portal/model";


export const Route = createFileRoute("/administracao")({
  head: () => ({
    meta: [
      { title: "Administração — Portal de Processos" },
      {
        name: "description",
        content:
          "Gestão do inventário de processos, responsáveis e utilizadores do portal corporativo de processos.",
      },
      { property: "og:title", content: "Administração do portal" },
      {
        property: "og:description",
        content: "Criar e manter processos, responsáveis e utilizadores.",
      },
    ],
  }),
  component: Administracao,
});

function Administracao() {
  const { data, isLoading } = usePortal();
  const { session, papeis } = useUtilizadorAtual();
  const podeCriar = podeCriarProcesso(papeis);
  const gerePapeis = podeGerirPapeis(papeis);
  const papeisTodos = usePapeisTodos(gerePapeis);

  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    codigo: "",
    nome: "",
    descricao: "",
    macroprocesso: "Primários" as Macroprocesso,
    categoria_id: "",
    area: "",
    dono_id: "",
    gestor_id: "",
    palavras_chave: "",
  });

  const criar = useMutation({
    mutationFn: async () => {
      const { data: novo, error } = await supabase
        .from("processos")
        .insert({
          codigo: form.codigo.trim(),
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || null,
          macroprocesso: form.macroprocesso,
          categoria_id: form.categoria_id || null,
          area: form.area.trim() || null,
          dono_id: form.dono_id || null,
          gestor_id: form.gestor_id || null,
          palavras_chave: form.palavras_chave.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: erroDocs } = await supabase.from("documento_versoes").insert(
        DOC_TIPOS.map((t) => ({
          processo_id: novo.id,
          tipo_documento: t,
          versao: "1.0",
          estado: "Não Iniciado",
        })),
      );
      if (erroDocs) throw erroDocs;
    },
    onSuccess: () => {
      toast.success("Processo criado com os 4 documentos base");
      setForm({ ...form, codigo: "", nome: "", descricao: "", palavras_chave: "" });
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const atribuirPapel = useMutation({
    mutationFn: async ({ authUserId, papel }: { authUserId: string; papel: Papel | "" }) => {
      const { error: erroDel } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", authUserId);
      if (erroDel) throw erroDel;
      if (papel) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: authUserId, role: papel });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Papel atualizado");
      queryClient.invalidateQueries({ queryKey: ["papeis-todos"] });
      queryClient.invalidateQueries({ queryKey: ["papeis"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const utilizadores = data?.utilizadores ?? [];
  const papelDe = (authUserId: string | null): Papel | "" =>
    (papeisTodos.data?.find((r) => r.user_id === authUserId)?.role ?? "") as Papel | "";

  return (
    <PortalShell>
      <PageHeader
        title="Administração"
        subtitle="Inventário de processos, responsáveis e utilizadores do portal."
      />

      {!session && (
        <div className="pcp-lockmsg">
          <Lock size={14} /> Entre com a sua conta para criar ou alterar registos.
        </div>
      )}
      {session && !podeCriar && (
        <div className="pcp-lockmsg">
          <Lock size={14} /> A criação de processos está reservada a Analistas de Processos e
          Administradores. Peça a um Administrador para lhe atribuir o papel.
        </div>
      )}


      <div className="pcp-card" style={{ padding: "20px 22px" }}>
        <h2 style={{ fontSize: 14, margin: "0 0 14px 0", color: "var(--primary-dark)" }}>
          <Plus size={15} style={{ verticalAlign: "-2px" }} /> Novo processo
        </h2>
        <form
          className="pcp-form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            criar.mutate();
          }}
        >
          <label>
            <span>Código</span>
            <input
              className="pcp-input"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              placeholder="P-15"
              required
            />
          </label>
          <label>
            <span>Nome</span>
            <input
              className="pcp-input"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </label>
          <label>
            <span>Macroprocesso</span>
            <select
              className="pcp-input"
              value={form.macroprocesso}
              onChange={(e) =>
                setForm({ ...form, macroprocesso: e.target.value as Macroprocesso })
              }
            >
              {MACROPROCESSOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Categoria</span>
            <select
              className="pcp-input"
              value={form.categoria_id}
              onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
            >
              <option value="">—</option>
              {(data?.categorias ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Área</span>
            <input
              className="pcp-input"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
            />
          </label>
          <label>
            <span>Dono do processo</span>
            <select
              className="pcp-input"
              value={form.dono_id}
              onChange={(e) => setForm({ ...form, dono_id: e.target.value })}
            >
              <option value="">—</option>
              {utilizadores.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Gestor do processo</span>
            <select
              className="pcp-input"
              value={form.gestor_id}
              onChange={(e) => setForm({ ...form, gestor_id: e.target.value })}
            >
              <option value="">—</option>
              {utilizadores.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Palavras-chave</span>
            <input
              className="pcp-input"
              value={form.palavras_chave}
              onChange={(e) => setForm({ ...form, palavras_chave: e.target.value })}
            />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            <span>Descrição</span>
            <textarea
              className="pcp-input"
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </label>
          <div style={{ gridColumn: "1 / -1" }}>
            <button
              type="submit"
              className="pcp-btn-primary"
              disabled={!podeCriar || criar.isPending}
            >
              <Save size={15} /> Criar processo
            </button>
          </div>

        </form>
      </div>

      <div className="pcp-section-title">
        <h2>Processos registados</h2>
      </div>
      <div className="pcp-card" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <Carregando />
        ) : (
          <table className="pcp-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Processo</th>
                <th>Macroprocesso</th>
                <th>Dono</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(data?.processos ?? []).map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: "var(--font-data)" }}>{p.codigo}</td>
                  <td>{p.nome}</td>
                  <td>{p.macroprocesso}</td>
                  <td>{p.donoNome}</td>
                  <td>
                    <EstadoProcessoBadge estado={p.estadoCalculado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="pcp-section-title">
        <h2>
          <Users size={15} style={{ verticalAlign: "-2px" }} /> Utilizadores e papéis
        </h2>
      </div>
      {gerePapeis ? (
        <p className="pcp-sub" style={{ marginTop: -8 }}>
          {PAPEIS.map((p) => `${PAPEL_LABEL[p]}: ${PAPEL_DESCRICAO[p]}`).join("  ·  ")}
        </p>
      ) : null}
      <div className="pcp-card" style={{ overflow: "hidden" }}>
        <table className="pcp-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Perfil no processo</th>
              <th>Email</th>
              <th>Papel de acesso</th>
            </tr>
          </thead>
          <tbody>
            {utilizadores.map((u) => {
              const papelAtual = papelDe(u.auth_user_id);
              return (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td>{u.role}</td>
                  <td>{u.email ?? "—"}</td>
                  <td>
                    {!gerePapeis ? (
                      papelAtual ? (
                        PAPEL_LABEL[papelAtual]
                      ) : (
                        "—"
                      )
                    ) : !u.auth_user_id ? (
                      <span style={{ color: "var(--text-faint)" }}>Sem conta de login</span>
                    ) : (
                      <select
                        className="pcp-input"
                        value={papelAtual}
                        disabled={atribuirPapel.isPending}
                        onChange={(e) =>
                          atribuirPapel.mutate({
                            authUserId: u.auth_user_id!,
                            papel: e.target.value as Papel | "",
                          })
                        }
                      >
                        <option value="">Sem papel</option>
                        {PAPEIS.map((p) => (
                          <option key={p} value={p}>
                            {PAPEL_LABEL[p]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </PortalShell>
  );
}
