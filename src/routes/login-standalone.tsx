import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/login-standalone/LoginScreen";

export const Route = createFileRoute("/login-standalone")({
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <LoginScreen
      onSubmit={(data) => {
        // eslint-disable-next-line no-console
        console.log("[login-standalone] submeter", data);
      }}
      onGoogle={() => {
        // eslint-disable-next-line no-console
        console.log("[login-standalone] Google");
      }}
    />
  ),
});
