-- Ligação conta de login -> utilizador do portal
ALTER TABLE public.utilizadores ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

-- Papel efetivo do utilizador com sessão
CREATE OR REPLACE FUNCTION public.tem_papel_editor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','analista'))
$$;

CREATE OR REPLACE FUNCTION public.tem_papel_validador(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','gestor','dono'))
$$;

REVOKE ALL ON FUNCTION public.tem_papel_editor(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.tem_papel_validador(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tem_papel_editor(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tem_papel_validador(uuid) TO authenticated, service_role;

-- Criação automática de utilizador + papel leitor no registo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_papel public.app_role;
BEGIN
  v_papel := CASE WHEN lower(NEW.email) = 'claudio.gengue@gmail.com' THEN 'admin'::public.app_role ELSE 'leitor'::public.app_role END;

  UPDATE public.utilizadores SET auth_user_id = NEW.id
   WHERE auth_user_id IS NULL AND lower(email) = lower(NEW.email);

  IF NOT FOUND THEN
    INSERT INTO public.utilizadores (nome, email, role, auth_user_id)
    VALUES (COALESCE(NULLIF(NEW.raw_user_meta_data->>'nome',''), NULLIF(NEW.raw_user_meta_data->>'full_name',''), split_part(NEW.email,'@',1)), NEW.email, v_papel::text, NEW.id);
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_papel)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Papéis: administrador gere tudo
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
DROP POLICY IF EXISTS "admins podem ver todos os papeis" ON public.user_roles;
CREATE POLICY "admins podem ver todos os papeis" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins atribuem papeis" ON public.user_roles;
CREATE POLICY "admins atribuem papeis" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins removem papeis" ON public.user_roles;
CREATE POLICY "admins removem papeis" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Processos: escrita apenas analista/admin
DROP POLICY IF EXISTS "processos geridos por autenticados" ON public.processos;
CREATE POLICY "processos escritos por editores" ON public.processos FOR ALL TO authenticated
  USING (public.tem_papel_editor(auth.uid())) WITH CHECK (public.tem_papel_editor(auth.uid()));

-- Documento versões: editores e validadores
DROP POLICY IF EXISTS "versoes geridas por autenticados" ON public.documento_versoes;
CREATE POLICY "versoes inseridas por editores" ON public.documento_versoes FOR INSERT TO authenticated
  WITH CHECK (public.tem_papel_editor(auth.uid()));
CREATE POLICY "versoes atualizadas por editores ou validadores" ON public.documento_versoes FOR UPDATE TO authenticated
  USING (public.tem_papel_editor(auth.uid()) OR public.tem_papel_validador(auth.uid()))
  WITH CHECK (public.tem_papel_editor(auth.uid()) OR public.tem_papel_validador(auth.uid()));
CREATE POLICY "versoes removidas por editores" ON public.documento_versoes FOR DELETE TO authenticated
  USING (public.tem_papel_editor(auth.uid()));

-- Atividades: editores
DROP POLICY IF EXISTS "atividades geridas por autenticados" ON public.atividades;
CREATE POLICY "atividades geridas por editores" ON public.atividades FOR ALL TO authenticated
  USING (public.tem_papel_editor(auth.uid())) WITH CHECK (public.tem_papel_editor(auth.uid()));

-- Utilizadores: escrita apenas admin/analista, cada um pode atualizar o seu registo
DROP POLICY IF EXISTS "utilizadores geridos por autenticados" ON public.utilizadores;
CREATE POLICY "utilizadores geridos por editores" ON public.utilizadores FOR ALL TO authenticated
  USING (public.tem_papel_editor(auth.uid()) OR auth_user_id = auth.uid())
  WITH CHECK (public.tem_papel_editor(auth.uid()) OR auth_user_id = auth.uid());