import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { trackPayPalEvent } from "@/lib/paypal-analytics";

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    let finalOrderId = searchParams.get("order_id");
    
    if (!finalOrderId) {
      finalOrderId = localStorage.getItem("latest_paypal_order_id");
    }

    if (finalOrderId) {
      setOrderId(finalOrderId);
      
      // Track: returned_from_paypal
      // We only track this once per page load to avoid spamming
      trackPayPalEvent(finalOrderId, 'returned_from_paypal', {});
    }
  }, [searchParams]);

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      toast.success("Order ID copied to clipboard");
    }
  };

  return (
    <PageLayoutWithAds>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Payment Pending Confirmation</h1>
        
        <p className="text-muted-foreground max-w-md mb-8">
          Thank you for your payment. To complete your order, please save your Order ID below.
        </p>

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
