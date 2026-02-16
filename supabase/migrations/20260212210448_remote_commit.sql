drop extension if exists "pg_net";

drop policy "Users can view their own capabilities" on "public"."user_capabilities";

alter table "public"."user_capabilities" drop constraint "user_capabilities_user_id_capability_granted_at_key";

drop index if exists "public"."idx_user_capabilities_capability";

drop index if exists "public"."idx_user_capabilities_user_id";

drop index if exists "public"."user_capabilities_user_id_capability_granted_at_key";


  create table "public"."consumption_audit" (
    "id" uuid not null default gen_random_uuid(),
    "user_capability_id" uuid,
    "user_id" uuid not null,
    "capability" text not null,
    "delta" bigint not null,
    "remaining_after" bigint,
    "performed_by" uuid,
    "reason" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."consumption_audit" enable row level security;

alter table "public"."credit_packs" enable row level security;

alter table "public"."submissions" alter column "status" set default 'pending'::text;

alter table "public"."user_capabilities" alter column "created_at" set not null;

alter table "public"."user_capabilities" alter column "granted_at" set not null;

CREATE UNIQUE INDEX consumption_audit_pkey ON public.consumption_audit USING btree (id);

CREATE INDEX idx_consumption_audit_user ON public.consumption_audit USING btree (user_id, capability, created_at);

CREATE INDEX idx_roles_name ON public.roles USING btree (name);

CREATE INDEX idx_submission_status_history_submission_id ON public.submission_status_history USING btree (submission_id);

CREATE INDEX idx_user_capabilities_cap_expires ON public.user_capabilities USING btree (capability, expires_at);

CREATE INDEX idx_user_capabilities_user_cap ON public.user_capabilities USING btree (user_id, capability);

CREATE INDEX idx_user_roles_user ON public.user_roles USING btree (user_id);

alter table "public"."consumption_audit" add constraint "consumption_audit_pkey" PRIMARY KEY using index "consumption_audit_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.consume_capability(p_user_id uuid, p_capability text, p_amount bigint DEFAULT 1, p_performed_by uuid DEFAULT NULL::uuid, p_reason text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_remaining bigint;
  v_uc_id uuid;
BEGIN
  -- atomic decrement if enough remaining and not expired
  UPDATE public.user_capabilities
  SET remaining = remaining - p_amount,
      updated_at = now()
  WHERE id = (
    SELECT id FROM public.user_capabilities
    WHERE user_id = p_user_id
      AND capability = p_capability
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY created_at DESC
    LIMIT 1
  )
  AND remaining >= p_amount
  RETURNING id, remaining INTO v_uc_id, v_remaining;

  IF FOUND THEN
    -- insert audit record in same transaction
    INSERT INTO public.consumption_audit(user_capability_id, user_id, capability, delta, remaining_after, performed_by, reason)
    VALUES (v_uc_id, p_user_id, p_capability, p_amount * -1, v_remaining, p_performed_by, p_reason);
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.consume_capability_v2(p_user_id uuid, p_capability text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.user_capabilities
  WHERE user_id = p_user_id
    AND capability = p_capability
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    DELETE FROM public.user_capabilities WHERE id = v_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_submission_v2_example(p_user_id uuid, p_payment_type text, p_capability text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF p_payment_type = 'capability' THEN
    IF NOT public.safe_consume_capability(p_user_id, p_capability) THEN
      RAISE EXCEPTION 'Capability subsystem not available or no capability remaining';
    END IF;
  END IF;

  -- Continue with submission creation logic here. This is a placeholder.
  RETURN;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.safe_consume_capability(p_user_id uuid, p_capability text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF p_capability IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Try to call consume_capability if it exists; if not, return FALSE
  BEGIN
    PERFORM public.consume_capability(p_user_id, p_capability);
    RETURN TRUE;
  EXCEPTION WHEN undefined_function THEN
    -- consume_capability does not exist
    RETURN FALSE;
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submission_health(target_submission_id uuid)
 RETURNS TABLE(submission_id uuid, payment_status text, paid_at timestamp with time zone, distribution_rows integer, paid_payments integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$
;

grant delete on table "public"."consumption_audit" to "anon";

grant insert on table "public"."consumption_audit" to "anon";

grant references on table "public"."consumption_audit" to "anon";

grant select on table "public"."consumption_audit" to "anon";

grant trigger on table "public"."consumption_audit" to "anon";

grant truncate on table "public"."consumption_audit" to "anon";

grant update on table "public"."consumption_audit" to "anon";

grant delete on table "public"."consumption_audit" to "authenticated";

grant insert on table "public"."consumption_audit" to "authenticated";

grant references on table "public"."consumption_audit" to "authenticated";

grant select on table "public"."consumption_audit" to "authenticated";

grant trigger on table "public"."consumption_audit" to "authenticated";

grant truncate on table "public"."consumption_audit" to "authenticated";

grant update on table "public"."consumption_audit" to "authenticated";

grant delete on table "public"."consumption_audit" to "service_role";

grant insert on table "public"."consumption_audit" to "service_role";

grant references on table "public"."consumption_audit" to "service_role";

grant select on table "public"."consumption_audit" to "service_role";

grant trigger on table "public"."consumption_audit" to "service_role";

grant truncate on table "public"."consumption_audit" to "service_role";

grant update on table "public"."consumption_audit" to "service_role";


  create policy "categories_admin_only"
  on "public"."categories"
  as permissive
  for all
  to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());



  create policy "people_admin_only"
  on "public"."people"
  as permissive
  for all
  to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());



  create policy "posts_admin_only"
  on "public"."posts"
  as permissive
  for all
  to authenticated
using (public.is_admin_or_editor())
with check (public.is_admin_or_editor());


-- Commenting out triggers that cause local reset failures
-- drop trigger if exists "objects_delete_delete_prefix" on "storage"."objects";
-- drop trigger if exists "objects_insert_create_prefix" on "storage"."objects";
-- drop trigger if exists "objects_update_create_prefix" on "storage"."objects";
-- drop trigger if exists "prefixes_create_hierarchy" on "storage"."prefixes";
-- drop trigger if exists "prefixes_delete_hierarchy" on "storage"."prefixes";

-- Commenting out storage triggers that fail in local reset if storage.protect_delete() is missing
-- CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();
-- CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


