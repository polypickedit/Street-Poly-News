import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { trackPayPalEvent } from "@/lib/paypal-analytics";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<{ id: string; item_name: string; quantity: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stripeSessionId = searchParams.get("session_id");
    let finalOrderId = searchParams.get("order_id");
    
    if (!finalOrderId) {
      finalOrderId = localStorage.getItem("latest_paypal_order_id");
    }

    if (stripeSessionId) {
      setSessionId(stripeSessionId);
      verifyStripePayment(stripeSessionId);
    } else if (finalOrderId) {
      setOrderId(finalOrderId);
      setLoading(false);
      
      // Track: returned_from_paypal
      // We only track this once per page load to avoid spamming
      trackPayPalEvent(finalOrderId, 'returned_from_paypal', {});
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const verifyStripePayment = async (sessionId: string) => {
    try {
      // Poll for order completion (max 10 attempts, 2s interval)
      let attempts = 0;
      const maxAttempts = 10;
      
      const poll = async () => {
        // 1. Check Merch Orders
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: order, error: orderError } = await (supabase as any)
          .from('merch_orders')
          .select('*, merch_order_items(*)')
          .eq('stripe_session_id', sessionId)
          .single();

        if (order && order.status === 'paid') {
          setVerified(true);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPurchasedItems((order.merch_order_items || []) as any[]);
          setLoading(false);
          toast.success("Payment verified successfully!");
          return;
        }

        // 2. Check Commerce Events (fallback or for other types)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: event, error: eventError } = await (supabase as any)
          .from('commerce_events')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .single();

        if (event && event.status === 'completed') {
           setVerified(true);
           setLoading(false);
           toast.success("Payment verified successfully!");
           return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setLoading(false);
          setError("Payment verification timed out. Please check your email for confirmation.");
        }
      };

      poll();
    } catch (err) {
      console.error("Verification error:", err);
      setError("An error occurred while verifying payment.");
      setLoading(false);
    }
  };

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      toast.success("Order ID copied to clipboard");
    }
  };

  if (loading) {
    return (
      <PageLayoutWithAds>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
          <h1 className="text-2xl font-bold mb-2">Verifying Payment...</h1>
          <p className="text-muted-foreground">Please wait while we confirm your transaction.</p>
        </div>
      </PageLayoutWithAds>
    );
  }

  if (error) {
    return (
      <PageLayoutWithAds>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verification Issue</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link to="/contact">Contact Support</Link>
          </Button>
        </div>
      </PageLayoutWithAds>
    );
  }

  return (
    <PageLayoutWithAds>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">
          {verified ? "Purchase Complete!" : "Payment Pending Confirmation"}
        </h1>
        
        {verified && purchasedItems.length > 0 && (
          <div className="mb-8 w-full max-w-md">
             <h3 className="font-semibold mb-4 text-left">Your Items:</h3>
             <div className="bg-muted/50 rounded-lg p-4 space-y-3">
               {purchasedItems.map((item) => (
                 <div key={item.id} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0 last:pb-0">
                   <span className="font-medium">{item.item_name}</span>
                   <span className="text-muted-foreground">x{item.quantity}</span>
                 </div>
               ))}
             </div>
          </div>
        )}

        {!verified && (
          <p className="text-muted-foreground max-w-md mb-8">
            Thank you for your payment. To complete your order, please save your Order ID below.
          </p>
        )}

        {orderId && (
          <div className="bg-muted p-4 rounded-lg mb-8 flex items-center gap-3">
            <code className="text-lg font-mono font-bold">{orderId}</code>
            <Button size="icon" variant="ghost" onClick={copyOrderId}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg max-w-md mb-8 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">Final Step: Verification</h3>
          <p className="text-blue-800 text-sm mb-4">
            To speed up verification, please email us with:
          </p>
          <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
            <li>Your <strong>Order ID</strong> (above)</li>
            <li>Your <strong>PayPal Transaction ID</strong></li>
          </ul>
        </div>

        <Button asChild>
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </PageLayoutWithAds>
  );
};

export default PaymentSuccessPage;
