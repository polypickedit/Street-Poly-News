import React, { useState } from 'react';
import { useSlotAccess } from '@/hooks/useSlotAccess';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, CreditCard, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createSlotCheckoutSession } from '@/lib/stripe';
import { toast } from 'sonner';

import { Slot } from '@/types/slots';

interface SlotPaywallProps {
  slotSlug: string;
  children: React.ReactNode;
  preview?: React.ReactNode;
}

export const SlotPaywall: React.FC<SlotPaywallProps> = ({ slotSlug, children, preview }) => {
  const { hasAccess, reason, slot, loading } = useSlotAccess(slotSlug);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUnlock = async () => {
    if (!slot) return;
    try {
      setIsRedirecting(true);
      await createSlotCheckoutSession(slot.id, slot.slug);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout';
      toast.error(errorMessage);
      setIsRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred Preview */}
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <div className="blur-md opacity-40 pointer-events-none select-none">
            {preview}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <PaywallMessage 
              slot={slot} 
              reason={reason} 
              onUnlock={handleUnlock} 
              isRedirecting={isRedirecting} 
            />
          </div>
        </div>
      ) : (
        <div className="p-8 md:p-12 rounded-2xl border border-dashed border-border bg-muted/30 text-center flex flex-col items-center gap-4">
          <PaywallMessage 
            slot={slot} 
            reason={reason} 
            onUnlock={handleUnlock} 
            isRedirecting={isRedirecting} 
          />
        </div>
      )}
    </div>
  );
};

const PaywallMessage = ({ 
  slot, 
  reason, 
  onUnlock, 
  isRedirecting 
}: { 
  slot: Slot | undefined; 
  reason: string | undefined; 
  onUnlock: () => void;
  isRedirecting: boolean;
}) => {
  if (reason === 'unauthenticated') {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-display text-foreground">
          {slot?.name || 'Exclusive Content'}
        </h3>
        <p className="text-muted-foreground font-body">
          This slot is reserved for members. Please sign in to access {slot?.name || 'this content'}.
        </p>
        <Button asChild className="rounded-full px-8">
          <Link to="/login">
            <LogIn className="w-4 h-4 mr-2" />
            Sign In to Access
          </Link>
        </Button>
      </div>
    );
  }

  if (reason === 'payment_required') {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 bg-dem/10 rounded-full flex items-center justify-center mx-auto">
          <CreditCard className="w-6 h-6 text-dem" />
        </div>
        <h3 className="text-xl font-display text-foreground">
          {slot?.name || 'Premium Access'}
        </h3>
        <p className="text-muted-foreground font-body">
          {slot?.description || `Unlock access to ${slot?.name || 'this slot'} to continue.`}
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={onUnlock}
            disabled={isRedirecting}
            className="rounded-full bg-dem hover:bg-dem/90 text-white font-semibold"
          >
            {isRedirecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {slot?.monetization_model === 'subscription' 
              ? `Subscribe for $${slot?.price}/${slot?.billing_interval === 'month' ? 'mo' : 'yr'}` 
              : `Unlock for $${slot?.price}`}
          </Button>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            One-time pass & memberships available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
      <h3 className="text-xl font-display text-foreground">Access Restricted</h3>
      <p className="text-muted-foreground font-body">
        This content is currently unavailable.
      </p>
    </div>
  );
};

