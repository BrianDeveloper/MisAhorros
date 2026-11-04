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
  IF p_amount <> round(p_amount, 2) THEN
    RAISE EXCEPTION 'Transaction amount cannot have more than two decimal places';
  END IF;
  IF p_date IS NOT NULL AND p_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Transaction date cannot be in the future';
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
  IF p_type = 'egreso' AND p_amount > v_balance THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
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

CREATE OR REPLACE FUNCTION public.update_profile_preferences(p_currency_preference text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_currency_preference IS NULL OR p_currency_preference NOT IN ('USD', 'VES') THEN
    RAISE EXCEPTION 'Currency preference must be USD or VES';
  END IF;

  UPDATE public.profiles
  SET currency_preference = p_currency_preference
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_transaction(text, numeric, uuid, text, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_profile_preferences(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_transaction(text, numeric, uuid, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_preferences(text) TO authenticated;
