# Papéis, login e criação de processos

## Como funciona hoje (verificado)

- O login está em `/auth` (email + password ou Google). Qualquer conta autenticada pode criar processos em `/administracao` e executar todas as ações de workflow.
- Os papéis "Analista de Processos", "Gestor de Processo", "Dono de Processo" e "Administrador" existem apenas como texto na tabela de utilizadores de exemplo (4 registos) e **não estão ligados às contas de login**, nem controlam permissões.
- Ou seja: hoje não existe "entrar como analista" — existe só "entrar".

## O que vai ser construído

### 1. Ligar contas de login a utilizadores do portal
- Cada conta criada passa a ter um registo de utilizador do portal associado (nome + email), criado automaticamente no primeiro acesso.
- Registo aberto: quem se registar fica como **Leitor** (só consulta) até um Administrador lhe atribuir papel.
- `claudio.gengue@gmail.com` fica como **Administrador** desde o início.

### 2. Papéis e permissões
| Papel | Pode |
| --- | --- |
| Administrador | Tudo: criar/editar processos, atribuir papéis, todas as etapas de workflow |
| Analista de Processos | Criar processos, iniciar e elaborar documentos, enviar para validação, criar novas versões |
| Gestor de Processo | Validação do Gestor |
| Dono de Processo | Validação do Dono e Aprovação final |
| Leitor | Apenas consultar |

### 3. Administração > Utilizadores
- Nova secção onde o Administrador vê todas as contas e atribui/remove papéis num seletor.
- O formulário "Novo processo" fica visível/ativo apenas para Analista e Administrador; para os restantes aparece uma mensagem a explicar o motivo.

### 4. Workflow com botões por papel
- Na ficha de workflow, cada ação (Iniciar, Enviar para validação, Validar Gestor, Validar Dono, Aprovar) só está ativa para quem tem o papel correspondente; caso contrário mostra "reservado ao Gestor/Dono".
- O topo da aplicação passa a mostrar o utilizador com sessão e o seu papel, além de Sair.

### 5. Como criar um processo (fluxo final)
1. Entrar em `/auth`.
2. Ir a **Administração**, preencher código, nome, macroprocesso, área, dono e gestor.
3. Ao gravar, o processo é criado já com os 4 documentos base (Contexto, Fluxograma, POP, RACI) em "Não Iniciado".
4. Em **Workflow > processo**, o Analista inicia e envia para validação; o Gestor valida; o Dono valida e aprova; o processo passa a "Concluído".

## Notas técnicas

- Migração: alargar o enum `app_role` para `admin`, `analista`, `gestor`, `dono`, `leitor`; adicionar `auth_user_id` (referência a `auth.users`) em `utilizadores`; trigger em `auth.users` para criar o registo de utilizador e o papel `leitor` por omissão; seed do papel `admin` para o email indicado.
- `user_roles` continua a ser a única fonte de verdade dos papéis (nunca guardar papel efetivo na tabela de perfis); leitura via `has_role` (SECURITY DEFINER) e política para o Administrador gerir papéis.
- RLS: escrita em `processos`, `documento_versoes`, `atividades` restrita por papel via `has_role`, em vez do atual "qualquer autenticado". Leitura pública mantém-se.
- Frontend: hook `useUtilizadorAtual` (sessão + papéis) em `src/portal/data.ts`, helpers de permissão em `src/portal/model.ts`, aplicados em `administracao.tsx`, `workflow.$codigo.tsx` e no shell em `src/portal/ui.tsx`.
