import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Loader2,
  ArrowLeft,
  CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";
import { createMerchCheckoutSession } from "@/lib/stripe";
import { toast } from "sonner";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const Checkout = () => {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, status: authStatus } = useAuth();
  const [shippingAddress, setShippingAddress] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [contactValue, setContactValue] = useState("");

  useEffect(() => {
    if (session?.user?.email) {
      setContactValue(session.user.email);
    }
  }, [session?.user?.email]);

  const contactLabel = contactMethod === "phone" ? "Phone number" : "Email address";

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      toast.error("Please provide a shipping address for this order.");
      return;
    }

    if (!contactValue.trim()) {
      toast.error(`Please provide a ${contactLabel}.`);
      return;
    }

    try {
      if (authStatus === "initializing") {
        toast.error("Authentication is still loading. Please try again.");
        return;
      }

      if (!session) {
        toast.error("Please sign in to complete your purchase");
        navigate(`/login?redirectTo=${encodeURIComponent(location.pathname)}`);
        return;
      }
      setIsCheckingOut(true);
      await createMerchCheckoutSession(items, {
        shippingAddress,
        contactMethod,
        contactValue
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <PageLayoutWithAds>
        <PageTransition>
          <div className="py-24 px-4 min-h-[60vh] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-3xl mb-4 uppercase tracking-wider">Your cart is empty</h1>
            <p className="font-body text-muted-foreground mb-8 max-w-md">
              Looks like you haven't added anything to your cart yet. Check out our merch or booking services!
            </p>
            <div className="flex gap-4">
              <Button asChild variant="outline" className="rounded-full px-8">
                <Link to="/merch">Browse Merch</Link>
              </Button>
              <Button asChild className="bg-dem hover:bg-dem/90 text-white rounded-full px-8">
                <Link to="/booking">Book a Service</Link>
              </Button>
            </div>
          </div>
        </PageTransition>
      </PageLayoutWithAds>
    );
  }

  return (
    <PageLayoutWithAds>
      <PageTransition>
        <div className="py-12 px-4 max-w-6xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-8 hover:bg-white/5 text-white/60 hover:text-white -ml-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="font-display text-4xl mb-2 uppercase tracking-tight">Checkout</h1>
                <p className="font-body text-muted-foreground">Review your items and complete your purchase.</p>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-6 p-6 bg-card border border-border rounded-2xl group transition-all hover:border-dem/30">
                    <div className="w-24 h-24 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-border/50">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-display text-lg uppercase tracking-wide group-hover:text-dem transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-body">{item.type}</p>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2 -mr-2"
                          aria-label={`Remove ${item.name} from cart`}
                          type="button"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-4 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-white/40 hover:text-white transition-colors"
                            aria-label="Decrease quantity"
                            type="button"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-display w-6 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-white/40 hover:text-white transition-colors"
                            aria-label="Increase quantity"
                            type="button"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-display text-xl text-dem">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-muted/40 border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-display text-lg text-foreground">Shipping & Contact</h3>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Shipping Address</Label>
                  <Textarea
                    value={shippingAddress}
                    onChange={(event) => setShippingAddress(event.target.value)}
                    placeholder="Street, city, state, ZIP, country"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Preferred Contact Method</Label>
                    <Select value={contactMethod} onValueChange={(value) => setContactMethod(value as "email" | "phone")}> 
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{contactLabel}</Label>
                    <Input
                      value={contactValue}
                      onChange={(event) => setContactValue(event.target.value)}
                      placeholder={contactLabel}
                      className="h-10"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  We will use this information to reach out with shipping updates or handle delivery issues.
                </p>
              </div>

              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={clearCart}
              >
                Clear all items
              </Button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-8 sticky top-24">
                <h2 className="font-display text-2xl mb-6 uppercase tracking-wider">Order Summary</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="font-body">Subtotal</span>
                    <span className="font-display text-white">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="font-body">Shipping</span>
                    <span className="font-display text-white">Calculated at next step</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="font-body">Taxes</span>
                    <span className="font-display text-white">$0.00</span>
                  </div>
                  
                  <Separator className="bg-border" />
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-display text-lg uppercase tracking-wider">Total</span>
                    <span className="font-display text-3xl text-dem font-black">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    className="w-full bg-dem hover:bg-dem/90 text-white font-display text-lg py-6 rounded-xl uppercase tracking-widest shadow-lg shadow-dem/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pay with Stripe
                      </>
                    )}
                  </Button>
                  
                  <p className="text-[10px] text-center text-muted-foreground font-body uppercase tracking-tighter opacity-50">
                    Secure checkout powered by Stripe. Your data is protected by industry-standard encryption.
                  </p>
                </div>

                <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By completing your purchase, you agree to our <Link to="/terms" className="text-dem hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-dem hover:underline">Privacy Policy</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Checkout;
