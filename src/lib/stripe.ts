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
      throw new Error('You must be signed in to purchase this service');
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
        returnUrl: window.location.origin + `/booking?slotType=${slotSlug}&submissionId=${submissionId}&session_id={CHECKOUT_SESSION_ID}`
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
export interface MerchCheckoutOptions {
  shippingAddress?: string;
  contactMethod?: 'email' | 'phone';
  contactValue?: string;
}

export const createMerchCheckoutSession = async (items: any[], options?: MerchCheckoutOptions) => {
  const { shippingAddress, contactMethod, contactValue } = options || {};

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be signed in to complete your purchase');
    }

    // Determine return URL - if it's a single booking, go back to booking page for confirmation
    const bookingItem = items.find(i => typeof i.id === 'string' && i.id.startsWith('booking-'));
    let returnUrl = window.location.origin + '/merch?session_id={CHECKOUT_SESSION_ID}';
    
    if (items.length === 1 && bookingItem) {
      const submissionId = bookingItem.id.replace('booking-', '');
      returnUrl = window.location.origin + `/booking?submissionId=${submissionId}&session_id={CHECKOUT_SESSION_ID}`;
    }

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { 
        items,
        type: 'merch',
        userId: session.user.id,
        userEmail: session.user.email,
        returnUrl,
        shippingAddress,
        contactMethod,
        contactValue,
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
