import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, Info } from "lucide-react";
import { createQuickPaymentSession } from "@/lib/stripe";
import { useToast } from "@/components/ui/use-toast";

interface QuickPaymentDialogProps {
  trigger?: React.ReactNode;
}

export function QuickPaymentDialog({ trigger }: QuickPaymentDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a description for this payment.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createQuickPaymentSession(numAmount, description);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to initiate payment session.";
      toast({
        title: "Payment error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="rounded-full px-8">
            Quick Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-dem" />
            Quick Payment
          </DialogTitle>
          <DialogDescription>
            Enter the amount and details for your offline item or custom service.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handlePayment} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">What is this for?</Label>
            <Input
              id="description"
              placeholder="e.g. Offline Merch, Custom Feature..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="bg-white/5 p-4 rounded-lg flex gap-3 text-xs text-muted-foreground">
            <Info className="w-4 h-4 shrink-0 text-dem" />
            <p>
              This will create a secure Stripe checkout session for the specified amount. 
              Once paid, your order will be updated in your dashboard.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-dem hover:bg-dem/90 text-white rounded-full h-11"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Proceed to Payment"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
