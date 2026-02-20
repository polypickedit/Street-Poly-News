
import { supabase } from "@/integrations/supabase/client";
import { PayPalEventType } from "@/types/paypal";

export async function trackPayPalEvent(
  orderId: string,
  eventType: PayPalEventType,
  metadata: Record<string, unknown> = {}
) {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: placement_order_events table created manually
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('placement_order_events')
      .insert([
        {
          order_id: orderId,
          event_type: eventType,
          metadata
        }
      ]);

    if (error) {
      console.error('[PayPal Analytics] Failed to track event:', eventType, error);
    } else {
      // console.log('[PayPal Analytics] Tracked:', eventType, orderId);
    }
  } catch (err) {
    console.error('[PayPal Analytics] Unexpected error:', err);
  }
}
