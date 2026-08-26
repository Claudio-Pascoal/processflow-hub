-- 1. Alargar o enum de papéis
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'analista';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dono';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'leitor';