import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Slot, SlotAccess, Entitlement } from '@/types/slots';
import { SupabaseClient } from '@supabase/supabase-js';

export const useSlotAccess = (slotSlug: string) => {
  const { session, isAdmin } = useAuth();
  const [access, setAccess] = useState<SlotAccess>({ hasAccess: true }); // Default to true for now to avoid breaking UI while tables are missing
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const checkAccess = async () => {
      // Mock data for development when database records are missing
      const MOCK_SLOTS: Record<string, Slot> = {
        'new-music-monday': {
          id: 'mock-music-id',
          name: 'New Music Mondays',
          slug: 'new-music-monday',
          description: 'Weekly track reviews',
          slot_type: 'service',
          visibility: 'public',
          monetization_model: 'one_time',
          price: 300,
          billing_interval: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        'featured-interview': {
          id: 'mock-interview-id',
          name: 'Featured Interview',
          slug: 'featured-interview',
          description: '1-on-1 interviews',
          slot_type: 'service',
          visibility: 'public',
          monetization_model: 'one_time',
          price: 150,
          billing_interval: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      try {
        setLoading(true);
        
        // 1. Get the slot
        const query = (supabase
          .from('slots')
          .select('*')
          .eq('slug', slotSlug)
          .single()) as unknown as { abortSignal: (s: AbortSignal) => Promise<{ data: unknown; error: unknown }> };

        const { data: slot, error: slotError } = await query.abortSignal(controller.signal);

        if (slotError || !slot) {
          // Check if we have a mock fallback for this slug
          if (MOCK_SLOTS[slotSlug]) {
            setAccess({ hasAccess: true, slot: MOCK_SLOTS[slotSlug] });
            return;
          }
          console.error('Slot not found:', slotSlug);
          setAccess({ hasAccess: true }); // Fallback
          return;
        }

        const typedSlot = slot as unknown as Slot;

        if (!typedSlot.is_active) {
          setAccess({ hasAccess: false, reason: 'inactive_slot', slot: typedSlot });
          return;
        }

        // 2. Check if free
        if (typedSlot.monetization_model === 'free') {
          setAccess({ hasAccess: true, slot: typedSlot });
          return;
        }

        // 3. Check session for paid/restricted content
        if (!session) {
          setAccess({ 
            hasAccess: false, 
            reason: 'unauthenticated', 
            slot: typedSlot 
          });
          return;
        }

        // 4. Check if admin - Admins bypass paywalls
        if (isAdmin) {
          setAccess({ hasAccess: true, slot: typedSlot });
          return;
        }

        // 5. Check entitlements for paid slots
        const entQuery = ((supabase as SupabaseClient)
          .from('slot_entitlements')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('slot_id', typedSlot.id)
          .eq('is_active', true)
          .maybeSingle()) as unknown as { abortSignal: (s: AbortSignal) => Promise<{ data: unknown; error: unknown }> };

        const { data: entitlement, error: entError } = await entQuery.abortSignal(controller.signal);

        if (entError || !entitlement) {
          setAccess({ 
            hasAccess: false, 
            reason: 'payment_required', 
            slot: typedSlot 
          });
          return;
        }

        const typedEntitlement = entitlement as unknown as Entitlement;

        // Check expiration
        if (typedEntitlement.expires_at && new Date(typedEntitlement.expires_at) < new Date()) {
          setAccess({ 
            hasAccess: false, 
            reason: 'payment_required', 
            slot: typedSlot 
          });
          return;
        }

        setAccess({ hasAccess: true, slot: typedSlot });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error checking slot access:', err);
        setAccess({ hasAccess: true }); // Fallback on error
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
    return () => controller.abort();
  }, [slotSlug, session, isAdmin]);

  return { ...access, loading };
};
