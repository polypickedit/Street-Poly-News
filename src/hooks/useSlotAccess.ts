import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Slot, SlotAccess, Entitlement } from '@/types/slots';

export const useSlotAccess = (slotSlug: string) => {
  const { session, isAdmin } = useAuth();

  const { data: access, isLoading: loading } = useQuery({
    queryKey: ['slot-access', slotSlug, session?.user?.id, isAdmin],
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
        const { data: slot, error: slotError } = await (supabase
          .from('slots')
          .select('*')
          .eq('slug', slotSlug)
          .single() as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          .abortSignal(signal);

        if (slotError || !slot) {
          // Check if we have a mock fallback for this slug
          if (MOCK_SLOTS[slotSlug]) {
            return { hasAccess: true, slot: MOCK_SLOTS[slotSlug] };
          }
          console.error('Slot not found:', slotSlug);
          return { hasAccess: true }; // Fallback
        }

        const typedSlot = slot as unknown as Slot;

        if (!typedSlot.is_active) {
          return { hasAccess: false, reason: 'inactive_slot', slot: typedSlot };
        }

        // 2. Check if free
        if (typedSlot.monetization_model === 'free') {
          return { hasAccess: true, slot: typedSlot };
        }

        // 3. Check session for paid/restricted content
        if (!session) {
          return { 
            hasAccess: false, 
            reason: 'unauthenticated', 
            slot: typedSlot 
          };
        }

        // 4. Check if admin - Admins bypass paywalls
        if (isAdmin) {
          return { hasAccess: true, slot: typedSlot };
        }

        // 5. Check entitlements for paid slots
        const { data: entitlement, error: entError } = await (supabase
          .from('slot_entitlements')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('slot_id', typedSlot.id)
          .eq('is_active', true)
          .maybeSingle() as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          .abortSignal(signal);

        if (entError || !entitlement) {
          return { 
            hasAccess: false, 
            reason: 'payment_required', 
            slot: typedSlot 
          };
        }

        const typedEntitlement = entitlement as unknown as Entitlement;

        // Check expiration
        if (typedEntitlement.expires_at && new Date(typedEntitlement.expires_at) < new Date()) {
          return { 
            hasAccess: false, 
            reason: 'payment_required', 
            slot: typedSlot 
          };
        }

        return { hasAccess: true, slot: typedSlot };
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          throw err; // Let React Query handle it
        }
        console.error('Error checking slot access:', err);
        return { hasAccess: true }; // Fallback on error
      }
    },
    staleTime: 60000, // 1 minute cache
    retry: false,
  });

  return { 
    hasAccess: access?.hasAccess ?? true, 
    reason: access?.reason, 
    slot: access?.slot, 
    loading 
  };
};
