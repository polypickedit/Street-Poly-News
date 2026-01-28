import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Slot, SlotAccess } from '@/types/slots';

export const useSlotAccess = (slotSlug: string) => {
  const [access, setAccess] = useState<SlotAccess>({ hasAccess: true }); // Default to true for now to avoid breaking UI while tables are missing
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        
        // 1. Get the slot
        const { data: slot, error: slotError } = await supabase
          .from('slots' as any)
          .select('*')
          .eq('slug', slotSlug)
          .single();

        if (slotError || !slot) {
          console.error('Slot not found:', slotSlug);
          setAccess({ hasAccess: true }); // Fallback
          return;
        }

        const typedSlot = slot as unknown as Slot;

        if (!typedSlot.is_active) {
          setAccess({ hasAccess: false, reason: 'inactive_slot', slot: typedSlot });
          return;
        }

        // 2. Check visibility
        if (typedSlot.visibility === 'public') {
          setAccess({ hasAccess: true, slot: typedSlot });
          return;
        }

        // 3. Check session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setAccess({ 
            hasAccess: false, 
            reason: 'unauthenticated', 
            slot: typedSlot 
          });
          return;
        }

        if (typedSlot.visibility === 'account') {
          setAccess({ hasAccess: true, slot: typedSlot });
          return;
        }

        // 4. Check entitlements for 'paid' visibility
        const { data: entitlement, error: entError } = await supabase
          .from('entitlements' as any)
          .select('*')
          .eq('user_id', session.user.id)
          .eq('slot_id', typedSlot.id)
          .eq('is_active', true)
          .maybeSingle();

        if (entError || !entitlement) {
          setAccess({ 
            hasAccess: false, 
            reason: 'payment_required', 
            slot: typedSlot 
          });
          return;
        }

        // Check expiration
        if (entitlement.expires_at && new Date(entitlement.expires_at) < new Date()) {
          setAccess({ 
            hasAccess: false, 
            reason: 'payment_required', 
            slot: typedSlot 
          });
          return;
        }

        setAccess({ hasAccess: true, slot: typedSlot });
      } catch (err) {
        console.error('Error checking slot access:', err);
        setAccess({ hasAccess: true }); // Fallback on error
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [slotSlug]);

  return { ...access, loading };
};
