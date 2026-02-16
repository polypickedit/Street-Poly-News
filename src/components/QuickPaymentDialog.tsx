import { useState, useEffect } from "react";
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
import { CreditCard, Loader2, Info, Music, Mic2, Radio, Ticket, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/use-cart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const services = [
  { name: "New Music Monday", slug: "new-music-monday", icon: Music, description: "Featured Live Review", price: 300 },
  { name: "Featured Interview", slug: "featured-interview", icon: Mic2, description: "1-on-1 Session", price: 150 },
  { name: "Radio Promo", slug: "radio-promo", icon: Radio, description: "On-Air Promotion", price: 200 },
  { name: "Show Promo", slug: "show-promo", icon: Ticket, description: "Event Marketing", price: 250 },
];

interface QuickPaymentDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuickPaymentDialog({ trigger, open, onOpenChange }: QuickPaymentDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("custom");
  const [isLoading, setIsLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;
  
  const { toast } = useToast();
  const { addItem, setIsOpen: setCartOpen } = useCart();

  // Auto-load amount and description when service is selected
  useEffect(() => {
    if (selectedService && selectedService !== "custom") {
      const service = services.find(s => s.slug === selectedService);
      if (service) {
        setAmount(service.price.toString());
        setDescription(service.name);
      }
    }
  }, [selectedService]);

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
      // Route to cart instead of direct Stripe
      addItem({
        id: `service-${selectedService}-${Date.now()}`,
        name: description,
        type: "service",
        price: numAmount,
        image: "/placeholder.svg", // Default image for services
      });
      
      setIsOpen(false); // Close the dialog
      setCartOpen(true); // Open the cart
      
      toast({
        title: "Added to cart",
        description: `${description} has been added to your cart.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add to cart.";
      toast({
        title: "Error",
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
            Select a service or enter a custom amount for your payment.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handlePayment} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="service">Service Type</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Payment</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.slug} value={service.slug}>
                    <div className="flex items-center gap-2">
                      <service.icon className="w-4 h-4 text-dem" />
                      <span>{service.name} (${service.price})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7 h-11"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (selectedService !== "custom") setSelectedService("custom");
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">What is this for?</Label>
            <Input
              id="description"
              placeholder="e.g. Offline Merch, Custom Feature..."
              className="h-11"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (selectedService !== "custom") setSelectedService("custom");
              }}
              required
            />
          </div>

          <div className="bg-white/5 p-4 rounded-lg flex gap-3 text-xs text-muted-foreground">
            <Info className="w-4 h-4 shrink-0 text-dem" />
            <p>
              This will add the service to your cart. You can complete the checkout process there.
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
              "Add to Cart"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
