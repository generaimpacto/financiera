-- ─────────────────────────────────────────────────────────────
-- Marca un egreso como "pago de comisión" del cliente a la agencia.
-- Permite calcular la comisión PENDIENTE (generada − cobrada).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS is_commission_payment BOOLEAN NOT NULL DEFAULT false;
