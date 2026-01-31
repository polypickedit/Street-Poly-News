-- Helper functions and views to make testing easier
CREATE OR REPLACE FUNCTION public.submission_health(target_submission_id UUID)
RETURNS TABLE (
  submission_id UUID,
  payment_status TEXT,
  paid_at TIMESTAMPTZ,
  distribution_rows INTEGER,
  paid_payments INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.payment_status,
    s.paid_at,
    COUNT(sd.id) AS distribution_rows,
    COUNT(p.id) FILTER (WHERE p.status = 'succeeded') AS paid_payments
  FROM public.submissions s
  LEFT JOIN public.submission_distribution sd ON sd.submission_id = s.id
  LEFT JOIN public.payments p ON p.submission_id = s.id
  WHERE s.id = target_submission_id
  GROUP BY s.id, s.payment_status, s.paid_at;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
