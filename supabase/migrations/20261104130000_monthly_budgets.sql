CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  month date NOT NULL,
  amount numeric(14, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budgets_amount_positive CHECK (amount > 0 AND amount < 1000000000000),
  CONSTRAINT budgets_month_start CHECK (month = date_trunc('month', month)::date),
  CONSTRAINT budgets_user_category_month_unique UNIQUE (user_id, category_id, month)
);

CREATE INDEX IF NOT EXISTS budgets_user_month_idx
  ON public.budgets (user_id, month);

CREATE OR REPLACE FUNCTION public.prevent_category_type_change_with_budget()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF OLD.type IS DISTINCT FROM NEW.type
     AND EXISTS (SELECT 1 FROM public.budgets WHERE category_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot change category type while budgets are associated';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_category_type_change_with_budget ON public.categories;
CREATE TRIGGER prevent_category_type_change_with_budget
  BEFORE UPDATE OF type ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_category_type_change_with_budget();

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
CREATE POLICY "Users can view their own budgets"
  ON public.budgets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own budgets" ON public.budgets;
CREATE POLICY "Users can create their own budgets"
  ON public.budgets FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.categories
      WHERE categories.id = category_id
        AND categories.user_id = auth.uid()
        AND categories.type = 'egreso'
    )
  );

DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
CREATE POLICY "Users can update their own budgets"
  ON public.budgets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.categories
      WHERE categories.id = category_id
        AND categories.user_id = auth.uid()
        AND categories.type = 'egreso'
    )
  );

DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
CREATE POLICY "Users can delete their own budgets"
  ON public.budgets FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON public.budgets FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
