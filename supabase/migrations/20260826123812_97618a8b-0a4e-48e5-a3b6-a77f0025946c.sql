-- ROLES
create type public.app_role as enum ('admin','moderator','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- UTILIZADORES (diretório de pessoas do portal)
create table public.utilizadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text unique not null,
  role text not null check (role in ('Administrador','Analista de Processos','Gestor de Processo','Dono de Processo')),
  created_at timestamptz not null default now()
);
grant select on public.utilizadores to anon;
grant select, insert, update, delete on public.utilizadores to authenticated;
grant all on public.utilizadores to service_role;
alter table public.utilizadores enable row level security;
create policy "utilizadores publicos" on public.utilizadores for select using (true);
create policy "utilizadores geridos por autenticados" on public.utilizadores for all to authenticated using (true) with check (true);

-- CATEGORIAS
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text unique not null,
  created_at timestamptz not null default now()
);
grant select on public.categorias to anon;
grant select, insert, update, delete on public.categorias to authenticated;
grant all on public.categorias to service_role;
alter table public.categorias enable row level security;
create policy "categorias publicas" on public.categorias for select using (true);
create policy "categorias geridas por autenticados" on public.categorias for all to authenticated using (true) with check (true);

-- PROCESSOS
create table public.processos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nome text not null,
  macroprocesso text not null check (macroprocesso in ('Gestão','Primários','Suporte')),
  categoria_id uuid references public.categorias(id),
  area text,
  dono_id uuid references public.utilizadores(id),
  gestor_id uuid references public.utilizadores(id),
  dono_cargo text,
  gestor_cargo text,
  descricao text,
  palavras_chave text,
  estado text not null default 'Em construção' check (estado in ('Em construção','Em aprovação','Aprovado','Concluído')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.processos to anon;
grant select, insert, update, delete on public.processos to authenticated;
grant all on public.processos to service_role;
alter table public.processos enable row level security;
create policy "processos publicos" on public.processos for select using (true);
create policy "processos geridos por autenticados" on public.processos for all to authenticated using (true) with check (true);

-- DOCUMENTO_VERSOES
create table public.documento_versoes (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos(id) on delete cascade,
  tipo_documento text not null check (tipo_documento in ('Contexto','Fluxograma','POP','RACI')),
  versao text not null default '1.0',
  estado text not null default 'Não Iniciado'
    check (estado in ('Não Iniciado','Em Elaboração','Em Validação','Em Aprovação','Aprovado')),
  imutavel boolean not null default false,
  elaborado_por_id uuid references public.utilizadores(id),
  data_inicio timestamptz,
  data_envio_validacao timestamptz,
  validado_gestor_id uuid references public.utilizadores(id),
  data_validacao_gestor timestamptz,
  forma_validacao_gestor text,
  descricao_validacao_gestor text,
  validado_dono_id uuid references public.utilizadores(id),
  data_validacao_dono timestamptz,
  forma_validacao_dono text,
  descricao_validacao_dono text,
  aprovado_por_id uuid references public.utilizadores(id),
  data_aprovacao timestamptz,
  forma_aprovacao text,
  descricao_aprovacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (processo_id, tipo_documento, versao)
);
grant select on public.documento_versoes to anon;
grant select, insert, update, delete on public.documento_versoes to authenticated;
grant all on public.documento_versoes to service_role;
alter table public.documento_versoes enable row level security;
create policy "versoes publicas" on public.documento_versoes for select using (true);
create policy "versoes geridas por autenticados" on public.documento_versoes for all to authenticated using (true) with check (true);

-- ATIVIDADES
create table public.atividades (
  id uuid primary key default gen_random_uuid(),
  documento_versao_id uuid not null references public.documento_versoes(id) on delete cascade,
  atribuido_a_id uuid references public.utilizadores(id),
  tarefa text not null,
  estado text not null default 'Pendente' check (estado in ('Pendente','Em curso','Concluída')),
  prazo date,
  created_at timestamptz not null default now()
);
grant select on public.atividades to anon;
grant select, insert, update, delete on public.atividades to authenticated;
grant all on public.atividades to service_role;
alter table public.atividades enable row level security;
create policy "atividades publicas" on public.atividades for select using (true);
create policy "atividades geridas por autenticados" on public.atividades for all to authenticated using (true) with check (true);

-- WORKFLOW_LOG
create table public.workflow_log (
  id uuid primary key default gen_random_uuid(),
  documento_versao_id uuid not null references public.documento_versoes(id) on delete cascade,
  de_estado text,
  para_estado text,
  utilizador_id uuid references public.utilizadores(id),
  comentario text,
  data timestamptz not null default now()
);
grant select on public.workflow_log to anon;
grant select, insert on public.workflow_log to authenticated;
grant all on public.workflow_log to service_role;
alter table public.workflow_log enable row level security;
create policy "log publico" on public.workflow_log for select using (true);
create policy "log escrito por autenticados" on public.workflow_log for insert to authenticated with check (true);

-- UPDATED_AT
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger trg_processos_updated before update on public.processos for each row execute function public.set_updated_at();
create trigger trg_versoes_updated before update on public.documento_versoes for each row execute function public.set_updated_at();

-- IMUTABILIDADE
create or replace function public.bloquear_edicao_imutavel() returns trigger
language plpgsql set search_path = public as $$
begin
  raise exception 'Esta versão está Aprovada e é imutável. Crie uma nova versão para alterar.';
end; $$;
create trigger trg_bloquear_imutavel before update on public.documento_versoes
for each row when (old.imutavel = true) execute function public.bloquear_edicao_imutavel();

-- ============ DADOS DE EXEMPLO ============
insert into public.categorias (nome) values
 ('Tecnologia'),('Recursos Humanos'),('Financeiro'),('Qualidade'),('Comercial'),('Jurídico');

insert into public.utilizadores (nome, email, role) values
 ('Ana Silva','ana.silva@organizacao.com','Administrador'),
 ('Carlos Mendes','carlos.mendes@organizacao.com','Analista de Processos'),
 ('Beatriz Costa','beatriz.costa@organizacao.com','Gestor de Processo'),
 ('João Ferreira','joao.ferreira@organizacao.com','Dono de Processo');

insert into public.processos (codigo, nome, macroprocesso, categoria_id, area, dono_id, gestor_id, dono_cargo, gestor_cargo, descricao, palavras_chave, estado)
select v.codigo, v.nome, v.macro,
       (select id from public.categorias where nome = v.categoria),
       v.area,
       (select id from public.utilizadores where nome = v.dono),
       (select id from public.utilizadores where nome = v.gestor),
       v.dono_cargo, v.gestor_cargo, v.descricao, v.palavras, v.estado
from (values
 ('PROC-TI-003','Gestão de Mudanças','Suporte','Tecnologia','Tecnologia da Informação','João Ferreira','Beatriz Costa','Diretor de TI','Gestor de Processos','Assegura que as alterações no ambiente tecnológico são avaliadas, autorizadas, implementadas e monitorizadas de forma controlada.','mudança, TI, controlo, RFC','Concluído'),
 ('PROC-TI-004','Gestão de Incidentes','Suporte','Tecnologia','Tecnologia da Informação','João Ferreira','Beatriz Costa','Diretor de TI','Gestor de Processos','Define como os incidentes são registados, classificados, escalados e resolvidos.','incidente, suporte, SLA','Em aprovação'),
 ('PROC-TI-007','Gestão de Licenças','Suporte','Tecnologia','Tecnologia da Informação','João Ferreira','Beatriz Costa','Diretor de TI','Gestor de Processos','Controla aquisição, atribuição e renovação de licenças de software.','licenças, software, contratos','Em construção'),
 ('PROC-TI-011','Gestão de Problemas','Suporte','Tecnologia','Tecnologia da Informação','João Ferreira','Beatriz Costa','Diretor de TI','Gestor de Processos','Identifica e trata as causas-raiz de incidentes recorrentes.','problema, causa raiz','Em construção'),
 ('PROC-RH-001','Recrutamento e Seleção','Suporte','Recursos Humanos','Recursos Humanos','João Ferreira','Beatriz Costa','Diretora de RH','Gestora de Talento','Etapas para atração, avaliação e contratação de novos colaboradores.','recrutamento, admissão, candidatos','Concluído'),
 ('PROC-RH-004','Gestão de Desempenho','Suporte','Recursos Humanos','Recursos Humanos','João Ferreira','Beatriz Costa','Diretora de RH','Gestora de Talento','Ciclo anual de objetivos, acompanhamento e avaliação de desempenho.','avaliação, desempenho, objetivos','Em aprovação'),
 ('PROC-FIN-002','Gestão Orçamental','Gestão','Financeiro','Financeira','João Ferreira','Beatriz Costa','Diretor Financeiro','Controller','Elaboração, aprovação, acompanhamento e revisão do orçamento anual.','orçamento, planeamento financeiro','Concluído'),
 ('PROC-FIN-006','Contas a Pagar','Suporte','Financeiro','Financeira','João Ferreira','Beatriz Costa','Diretor Financeiro','Controller','Circuito de receção, validação e pagamento de faturas de fornecedores.','pagamentos, fornecedores, faturação','Em aprovação'),
 ('PROC-QUA-001','Gestão de Não Conformidades','Gestão','Qualidade','Qualidade','João Ferreira','Beatriz Costa','Diretor de Qualidade','Gestor da Qualidade','Tratamento de não conformidades, análise de causa e ações corretivas.','não conformidade, ação corretiva','Concluído'),
 ('PROC-QUA-004','Auditorias Internas','Gestão','Qualidade','Qualidade','João Ferreira','Beatriz Costa','Diretor de Qualidade','Gestor da Qualidade','Planeamento e execução do programa de auditorias internas.','auditoria, conformidade, plano anual','Em construção'),
 ('PROC-COM-001','Gestão de Encomendas','Primários','Comercial','Comercial','João Ferreira','Beatriz Costa','Diretor Comercial','Gestor de Vendas','Receção, validação e processamento das encomendas de clientes.','vendas, encomendas, clientes','Concluído'),
 ('PROC-COM-005','Gestão de Reclamações','Primários','Comercial','Comercial','João Ferreira','Beatriz Costa','Diretor Comercial','Gestor de Vendas','Registo, tratamento e resposta a reclamações de clientes.','reclamação, cliente, satisfação','Em construção'),
 ('PROC-OPS-002','Produção e Fabrico','Primários','Qualidade','Operações','João Ferreira','Beatriz Costa','Diretor de Operações','Gestor de Produção','Planeamento e execução da produção, da ordem de fabrico à expedição.','produção, fabrico, operações','Concluído'),
 ('PROC-OPS-005','Gestão da Cadeia de Abastecimento','Primários','Comercial','Operações','João Ferreira','Beatriz Costa','Diretor de Operações','Gestor de Logística','Gestão de fornecedores, compras e fluxo de abastecimento.','logística, abastecimento, compras','Em aprovação')
) as v(codigo,nome,macro,categoria,area,dono,gestor,dono_cargo,gestor_cargo,descricao,palavras,estado);

insert into public.documento_versoes (processo_id, tipo_documento, versao, estado, imutavel, elaborado_por_id, data_inicio, data_aprovacao, aprovado_por_id, forma_aprovacao)
select p.id, d.tipo, '1.0', d.estado,
       d.estado = 'Aprovado',
       (select id from public.utilizadores where nome = case when d.tipo in ('Contexto','Fluxograma') then 'Carlos Mendes' else 'Beatriz Costa' end),
       now() - interval '60 days',
       case when d.estado = 'Aprovado' then now() - interval '10 days' end,
       case when d.estado = 'Aprovado' then (select id from public.utilizadores where nome = 'João Ferreira') end,
       case when d.estado = 'Aprovado' then 'Assinatura digital' end
from public.processos p
join (values
 ('PROC-TI-003','Contexto','Aprovado'),('PROC-TI-003','Fluxograma','Aprovado'),('PROC-TI-003','POP','Aprovado'),('PROC-TI-003','RACI','Aprovado'),
 ('PROC-TI-004','Contexto','Aprovado'),('PROC-TI-004','Fluxograma','Aprovado'),('PROC-TI-004','POP','Em Aprovação'),('PROC-TI-004','RACI','Em Aprovação'),
 ('PROC-TI-007','Contexto','Aprovado'),('PROC-TI-007','Fluxograma','Aprovado'),('PROC-TI-007','POP','Não Iniciado'),('PROC-TI-007','RACI','Não Iniciado'),
 ('PROC-TI-011','Contexto','Em Elaboração'),('PROC-TI-011','Fluxograma','Não Iniciado'),('PROC-TI-011','POP','Não Iniciado'),('PROC-TI-011','RACI','Não Iniciado'),
 ('PROC-RH-001','Contexto','Aprovado'),('PROC-RH-001','Fluxograma','Aprovado'),('PROC-RH-001','POP','Aprovado'),('PROC-RH-001','RACI','Aprovado'),
 ('PROC-RH-004','Contexto','Aprovado'),('PROC-RH-004','Fluxograma','Aprovado'),('PROC-RH-004','POP','Em Validação'),('PROC-RH-004','RACI','Em Validação'),
 ('PROC-FIN-002','Contexto','Aprovado'),('PROC-FIN-002','Fluxograma','Aprovado'),('PROC-FIN-002','POP','Aprovado'),('PROC-FIN-002','RACI','Aprovado'),
 ('PROC-FIN-006','Contexto','Aprovado'),('PROC-FIN-006','Fluxograma','Aprovado'),('PROC-FIN-006','POP','Aprovado'),('PROC-FIN-006','RACI','Em Aprovação'),
 ('PROC-QUA-001','Contexto','Aprovado'),('PROC-QUA-001','Fluxograma','Aprovado'),('PROC-QUA-001','POP','Aprovado'),('PROC-QUA-001','RACI','Aprovado'),
 ('PROC-QUA-004','Contexto','Aprovado'),('PROC-QUA-004','Fluxograma','Em Validação'),('PROC-QUA-004','POP','Não Iniciado'),('PROC-QUA-004','RACI','Não Iniciado'),
 ('PROC-COM-001','Contexto','Aprovado'),('PROC-COM-001','Fluxograma','Aprovado'),('PROC-COM-001','POP','Aprovado'),('PROC-COM-001','RACI','Aprovado'),
 ('PROC-COM-005','Contexto','Aprovado'),('PROC-COM-005','Fluxograma','Em Elaboração'),('PROC-COM-005','POP','Aprovado'),('PROC-COM-005','RACI','Em Aprovação'),
 ('PROC-OPS-002','Contexto','Aprovado'),('PROC-OPS-002','Fluxograma','Aprovado'),('PROC-OPS-002','POP','Aprovado'),('PROC-OPS-002','RACI','Aprovado'),
 ('PROC-OPS-005','Contexto','Aprovado'),('PROC-OPS-005','Fluxograma','Aprovado'),('PROC-OPS-005','POP','Aprovado'),('PROC-OPS-005','RACI','Em Validação')
) as d(codigo,tipo,estado) on d.codigo = p.codigo;

-- Versão anterior aprovada (histórico) para dois processos em curso
insert into public.documento_versoes (processo_id, tipo_documento, versao, estado, imutavel, elaborado_por_id, data_aprovacao, aprovado_por_id, forma_aprovacao)
select p.id, 'POP', '0.9', 'Aprovado', true,
       (select id from public.utilizadores where nome = 'Beatriz Costa'),
       now() - interval '200 days',
       (select id from public.utilizadores where nome = 'João Ferreira'),
       'Ata de reunião'
from public.processos p where p.codigo in ('PROC-TI-004','PROC-RH-004');

insert into public.atividades (documento_versao_id, atribuido_a_id, tarefa, estado, prazo)
select v.id,
       (select id from public.utilizadores where nome = 'Carlos Mendes'),
       'Elaborar ' || v.tipo_documento || ' de ' || p.nome,
       case when v.estado = 'Em Elaboração' then 'Em curso' else 'Pendente' end,
       (current_date + interval '15 days')::date
from public.documento_versoes v
join public.processos p on p.id = v.processo_id
where v.estado in ('Não Iniciado','Em Elaboração');

insert into public.workflow_log (documento_versao_id, de_estado, para_estado, utilizador_id, comentario, data)
select v.id, 'Em Aprovação', 'Aprovado',
       (select id from public.utilizadores where nome = 'João Ferreira'),
       'Aprovado pelo Dono do Processo.', v.data_aprovacao
from public.documento_versoes v where v.estado = 'Aprovado';