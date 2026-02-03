-- Add reason column to admin_actions for institutional memory
ALTER TABLE public.admin_actions ADD COLUMN IF NOT EXISTS reason TEXT;

CREATE OR REPLACE FUNCTION log_content_placement_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.admin_actions (admin_user_id, action_type, target_type, target_id, reason, metadata)
    VALUES (
        auth.uid(),
        TG_OP,
        'content_placement',
        COALESCE(NEW.id, OLD.id)::text,
        NEW.metadata->>'reason', -- Extract reason from metadata blob
        jsonb_build_object(
            'slot_key', COALESCE(NEW.slot_key, OLD.slot_key), 
            'content_type', COALESCE(NEW.content_type, OLD.content_type),
            'previous_id', CASE WHEN TG_OP = 'UPDATE' THEN OLD.content_id ELSE NULL END,
            'metadata', NEW.metadata -- Preserve full metadata
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
