import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const createSlotCheckoutSession = async (slotId: string, slotSlug: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be signed in to make a purchase');
    }

    // Call Supabase Edge Function to create the checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { 
        slotId, 
        slotSlug,
        userId: session.user.id,
        userEmail: session.user.email,
        returnUrl: window.location.origin + '/booking?session_id={CHECKOUT_SESSION_ID}'
      }
    });

    if (error) throw error;

    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe failed to initialize');

    const { error: checkoutError } = await stripe.redirectToCheckout({
      sessionId: data.sessionId
    });

    if (checkoutError) throw checkoutError;
  } catch (err) {
    console.error('Stripe checkout error:', err);
    throw err;
  }
};

export const createMerchCheckoutSession = async (items: any[]) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be signed in to make a purchase');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { 
        items,
        type: 'merch',
        userId: session.user.id,
        userEmail: session.user.email,
        returnUrl: window.location.origin + '/merch?session_id={CHECKOUT_SESSION_ID}'
      }
    });

    if (error) throw error;

    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe failed to initialize');

    const { error: checkoutError } = await stripe.redirectToCheckout({
      sessionId: data.sessionId
    });

    if (checkoutError) throw checkoutError;
  } catch (err) {
    console.error('Stripe merch checkout error:', err);
    throw err;
  }
};
