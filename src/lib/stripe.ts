import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const createSlotCheckoutSession = async (
  slotId: string, 
  slotSlug: string, 
  submissionId?: string,
  selectedOutlets?: string[]
) => {
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
        submissionId,
        selectedOutlets,
        userId: session.user.id,
        userEmail: session.user.email,
        returnUrl: window.location.origin + '/booking?session_id={CHECKOUT_SESSION_ID}'
      }
    });

    if (error) throw error;

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned from server');
    }
  } catch (err) {
    console.error('Stripe checkout error:', err);
    throw err;
  }
};

export const createCreditPackCheckoutSession = async (packId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be signed in to purchase credits');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { 
        type: 'credits',
        packId,
        userId: session.user.id,
        userEmail: session.user.email,
        returnUrl: window.location.origin + '/dashboard?session_id={CHECKOUT_SESSION_ID}'
      }
    });

    if (error) throw error;

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned from server');
    }
  } catch (err) {
    console.error('Stripe credit purchase error:', err);
    throw err;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned from server');
    }
  } catch (err) {
    console.error('Stripe merch checkout error:', err);
    throw err;
  }
};

export const createQuickPaymentSession = async (amount: number, description: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be signed in to make a payment');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { 
        type: 'quick_payment',
        amount,
        description,
        userId: session.user.id,
        userEmail: session.user.email,
        returnUrl: window.location.origin + '/dashboard?session_id={CHECKOUT_SESSION_ID}'
      }
    });

    if (error) throw error;

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned from server');
    }
  } catch (err) {
    console.error('Stripe quick payment error:', err);
    throw err;
  }
};
