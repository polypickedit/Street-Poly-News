
import { supabase } from "@/integrations/supabase/client";
import { PayPalEventType } from "@/types/paypal";
import { Json } from "@/integrations/supabase/types";

export async function trackPayPalEvent(
  orderId: string,
  eventType: PayPalEventType,
  metadata: Json = {}
) {
  try {
    const { error } = await supabase
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
