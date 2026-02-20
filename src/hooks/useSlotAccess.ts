import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Slot, SlotAccess, Entitlement } from '@/types/slots';
import { safeQuery } from '@/lib/supabase-debug';

export const useSlotAccess = (slotSlug: string) => {
  const { session, isAdmin, appReady } = useAuth();
  const userId = session?.user?.id;

  const { data: access, isLoading: queryLoading } = useQuery({
    queryKey: ['slot-access', slotSlug, userId, isAdmin],
    queryFn: async ({ signal }) => {
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
        // 1. Get the slot
        const slot = await safeQuery(
          supabase
          .from('slots')
          .select('*')
          .eq('slug', slotSlug)
          .abortSignal(signal)
          .single()
        ) as Slot | null;

        if (!slot) {
          // Check if we have a mock fallback for this slug
          if (import.meta.env.DEV && MOCK_SLOTS[slotSlug]) {
            return { hasAccess: true, slot: MOCK_SLOTS[slotSlug] };
          }
          console.error('Slot not found:', slotSlug);
          return { hasAccess: false, reason: 'slot_unavailable' };
        }

        if (!slot.is_active) {
          return { hasAccess: false, reason: 'inactive_slot', slot };
        }

        // 2. Check if free
        if (slot.monetization_model === 'free') {
          return { hasAccess: true, slot };
        }

        // 3. Check session for paid/restricted content
        if (!userId) {
          return { 
            hasAccess: false, 
            reason: 'unauthenticated', 
            slot 
          };
        }

        // 4. Check if admin - Admins bypass paywalls
        if (isAdmin) {
          return { hasAccess: true, slot };
        }

        // 5. Check entitlements for paid slots
        const entitlement = await safeQuery(
          supabase
          .from('slot_entitlements')
          .select('*')
          .eq('user_id', userId)
          .eq('slot_id', slot.id)
          .eq('is_active', true)
          .abortSignal(signal)
          .maybeSingle()
        ) as Entitlement | null;

        if (!entitlement) {
          return { 
            hasAccess: false, 
            reason: 'payment_required', 
            slot 
          };
        }

        // Check expiration
        if (entitlement.expires_at && new Date(entitlement.expires_at) < new Date()) {
          return { 
            hasAccess: false, 
            reason: 'payment_required', 
            slot 
          };
        }

        return { hasAccess: true, slot };
      } catch (err) {
        console.error('Error checking slot access:', err);
        return { hasAccess: false, reason: 'access_check_failed' };
      }
    },
    // Strict readiness contract:
    // App boot -> auth settles -> (if authenticated) roles hydrate -> query executes
    enabled: appReady && !!slotSlug,
    staleTime: 60000, // 1 minute cache
    retry: false,
  });

  const loading = !appReady || queryLoading;

  return { 
    hasAccess: access?.hasAccess ?? false, 
    reason: access?.reason, 
    slot: access?.slot, 
    loading 
  };
};
