-- Harden content placement audit logging to prevent future regressions.
-- Guarantees:
-- 1) target_id is UUID
-- 2) target_type uses allowed enum value "placement"
-- 3) trigger is bound to the corrected public function

-- Backfill legacy values if the target_type constraint was previously relaxed.
UPDATE public.admin_actions
SET target_type = 'placement'
WHERE target_type = 'content_placement';

CREATE OR REPLACE FUNCTION public.log_content_placement_action()
RETURNS TRIGGER AS $$
DECLARE
    v_reason TEXT;
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        v_reason := NEW.metadata->>'reason';
    END IF;

    INSERT INTO public.admin_actions (
        admin_user_id,
        action_type,
        target_type,
        target_id,
        metadata
    )
    VALUES (
        auth.uid(),
        CASE
            WHEN TG_OP = 'INSERT' THEN 'create_placement'
            WHEN TG_OP = 'UPDATE' THEN 'update_placement'
            WHEN TG_OP = 'DELETE' THEN 'delete_placement'
            ELSE TG_OP
        END,
        'placement',
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'slot_key', COALESCE(NEW.slot_key, OLD.slot_key),
            'content_type', COALESCE(NEW.content_type, OLD.content_type),
            'previous_id', CASE WHEN TG_OP = 'UPDATE' THEN OLD.content_id ELSE NULL END,
            'reason', v_reason
        )
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_content_placement ON public.content_placements;
CREATE TRIGGER trigger_log_content_placement
AFTER INSERT OR UPDATE OR DELETE ON public.content_placements
FOR EACH ROW EXECUTE FUNCTION public.log_content_placement_action();
