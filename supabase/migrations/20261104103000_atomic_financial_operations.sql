CREATE OR REPLACE FUNCTION public.create_savings_goal(
  p_title text,
  p_target_amount numeric,
  p_icon text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_goal_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NULLIF(btrim(p_title), '') IS NULL
     OR p_target_amount IS NULL
     OR p_target_amount <= 0
     OR p_target_amount::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RAISE EXCEPTION 'A goal title and a positive target amount are required';
  END IF;

  INSERT INTO public.savings_goals (user_id, title, target_amount, current_amount, icon, status)
  VALUES (v_user_id, btrim(p_title), p_target_amount, 0, p_icon, 'en_progreso')
  RETURNING id INTO v_goal_id;

  RETURN v_goal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_transaction(
  p_type text,
  p_amount numeric,
  p_category_id uuid,
  p_description text,
  p_date date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_delta numeric;
  v_transaction_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_type IS NULL
     OR p_type NOT IN ('ingreso', 'egreso')
     OR p_amount IS NULL
     OR p_amount <= 0
     OR p_amount::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RAISE EXCEPTION 'Transaction type or amount is invalid';
  END IF;

  IF p_category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.categories
    WHERE id = p_category_id AND user_id = v_user_id AND type = p_type
  ) THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  SELECT balance_actual INTO v_balance
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_delta := CASE WHEN p_type = 'ingreso' THEN p_amount ELSE -p_amount END;

  UPDATE public.profiles
  SET balance_actual = v_balance + v_delta
  WHERE user_id = v_user_id;

  INSERT INTO public.transactions (user_id, type, amount, category_id, description, date)
  VALUES (v_user_id, p_type, p_amount, p_category_id, NULLIF(btrim(p_description), ''), COALESCE(p_date, CURRENT_DATE))
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_transaction(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_type text;
  v_amount numeric;
  v_balance numeric;
  v_delta numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT type, amount INTO v_type, v_amount
  FROM public.transactions
  WHERE id = p_transaction_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  SELECT balance_actual INTO v_balance
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_delta := CASE WHEN v_type = 'ingreso' THEN -v_amount ELSE v_amount END;

  UPDATE public.profiles
  SET balance_actual = v_balance + v_delta
  WHERE user_id = v_user_id;

  DELETE FROM public.transactions
  WHERE id = p_transaction_id AND user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_goal_contribution(
  p_goal_id uuid,
  p_amount numeric,
  p_note text,
  p_is_withdrawal boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_current_amount numeric;
  v_target_amount numeric;
  v_contribution_amount numeric;
  v_new_contribution_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_amount IS NULL
     OR p_amount <= 0
     OR p_amount::text IN ('NaN', 'Infinity', '-Infinity')
     OR p_is_withdrawal IS NULL THEN
    RAISE EXCEPTION 'Amount or operation is invalid';
  END IF;

  SELECT balance_actual INTO v_balance
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  SELECT current_amount, target_amount INTO v_current_amount, v_target_amount
  FROM public.savings_goals
  WHERE id = p_goal_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Savings goal not found';
  END IF;

  IF p_is_withdrawal THEN
    IF p_amount > v_current_amount THEN
      RAISE EXCEPTION 'Insufficient funds in savings goal';
    END IF;
    v_contribution_amount := -p_amount;
  ELSE
    IF p_amount > v_balance THEN
      RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;
    v_contribution_amount := p_amount;
  END IF;

  UPDATE public.profiles
  SET balance_actual = v_balance - v_contribution_amount
  WHERE user_id = v_user_id;

  UPDATE public.savings_goals
  SET current_amount = v_current_amount + v_contribution_amount,
      status = CASE
        WHEN v_current_amount + v_contribution_amount >= v_target_amount THEN 'completado'
        ELSE 'en_progreso'
      END
  WHERE id = p_goal_id AND user_id = v_user_id;

  INSERT INTO public.savings_contributions (user_id, goal_id, amount, note)
  VALUES (v_user_id, p_goal_id, v_contribution_amount, NULLIF(btrim(p_note), ''))
  RETURNING id INTO v_new_contribution_id;

  RETURN v_new_contribution_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_savings_goal(text, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_transaction(text, numeric, uuid, text, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_transaction(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_goal_contribution(uuid, numeric, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_savings_goal(text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_transaction(text, numeric, uuid, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_transaction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_goal_contribution(uuid, numeric, text, boolean) TO authenticated;

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can update their own savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can insert their own savings contributions" ON public.savings_contributions;
DROP POLICY IF EXISTS "Users can update their own savings contributions" ON public.savings_contributions;
DROP POLICY IF EXISTS "Users can delete their own savings contributions" ON public.savings_contributions;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;

CREATE POLICY "Users can create an empty profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND balance_actual = 0);
