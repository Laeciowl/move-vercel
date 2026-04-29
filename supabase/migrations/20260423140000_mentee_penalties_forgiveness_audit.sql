-- Auditoria de perdão administrativo em penalidades de mentorado
ALTER TABLE public.mentee_penalties
  ADD COLUMN IF NOT EXISTS last_forgiven_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_forgiven_by UUID REFERENCES auth.users (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.mentee_penalties.last_forgiven_at IS 'Quando um admin usou “Perdoar” para zerar faltas / desbloquear.';
COMMENT ON COLUMN public.mentee_penalties.last_forgiven_by IS 'auth.users.id do admin que aplicou o perdão.';
