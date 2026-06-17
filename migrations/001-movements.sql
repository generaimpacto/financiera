-- ─────────────────────────────────────────────────────────────
-- Movimientos: libro unificado de ingresos y egresos (agencia + clientes)
-- Aplicar en Supabase (idempotente).
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.movements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type           TEXT NOT NULL CHECK (type IN ('income', 'expense')),       -- ingreso / egreso
  amount         NUMERIC NOT NULL CHECK (amount > 0),                        -- monto
  movement_date  DATE NOT NULL DEFAULT CURRENT_DATE,                         -- fecha
  origin         TEXT,                                                       -- origen del monto
  scope          TEXT NOT NULL DEFAULT 'agency' CHECK (scope IN ('agency', 'client')),
  client_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,          -- de qué cliente (opcional)
  client_name    TEXT,                                                       -- nombre cliente (denormalizado / texto libre)
  concept        TEXT,                                                       -- en qué concepto
  payment_method TEXT NOT NULL DEFAULT 'transferencia'
                   CHECK (payment_method IN ('efectivo','transferencia','tarjeta','debito','cheque','mercadopago','cripto','otro')),
  notes          TEXT,
  receipt_url    TEXT,
  created_by     UUID NOT NULL REFERENCES auth.users(id),                    -- quién lo cargó
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movements_date ON public.movements (movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_movements_client ON public.movements (client_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.movements (type);

ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- SELECT: admin ve todo; el cliente ve los movimientos atribuidos a él.
DROP POLICY IF EXISTS "Admins view all movements" ON public.movements;
CREATE POLICY "Admins view all movements"
  ON public.movements FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Clients view their movements" ON public.movements;
CREATE POLICY "Clients view their movements"
  ON public.movements FOR SELECT USING (auth.uid() = client_id);

-- INSERT / UPDATE / DELETE: solo admin (la agencia gestiona el libro).
DROP POLICY IF EXISTS "Admins insert movements" ON public.movements;
CREATE POLICY "Admins insert movements"
  ON public.movements FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update movements" ON public.movements;
CREATE POLICY "Admins update movements"
  ON public.movements FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete movements" ON public.movements;
CREATE POLICY "Admins delete movements"
  ON public.movements FOR DELETE USING (public.is_admin());
