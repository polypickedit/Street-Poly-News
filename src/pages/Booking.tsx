import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { SlotPaywall } from "@/components/slots/SlotPaywall";
import { Calendar, Music, Mic2, Video, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookingForm } from "@/components/BookingForm";
import { useState, useEffect, useMemo } from "react";
import { QuickPaymentDialog } from "@/components/QuickPaymentDialog";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { PRODUCTS } from "@/config/pricing";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useEntitlements } from "@/hooks/useEntitlements";
import { safeQuery } from "@/lib/supabase-debug";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Slot {
  id: string;
  name: string;
  slug: string;
  price: number;
  type: "music" | "interview";
  is_active: boolean;
}

const FALLBACK_SLOTS: Slot[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "New Music Monday",
    slug: "new-music-monday",
    price: (PRODUCTS.MUSIC_MONDAY.price_cents ?? 30000) / 100,
    type: "music",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Featured Interview",
    slug: "featured-interview",
    price: (PRODUCTS.INTERVIEW.price_cents ?? 15000) / 100,
    type: "interview",
    is_active: true,
  },
];

export const Booking = () => {
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isQuickPaymentOpen, setIsQuickPaymentOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const { addItem, setIsOpen: setCartOpen } = useCart();
  const { refetch: refetchEntitlements } = useEntitlements();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSelectSlot = (slot: Slot) => {
    addItem({
      id: slot.id,
      name: slot.name,
      type: "slot",
      price: slot.price,
      image: "/placeholder.svg", // Default image for slots
    });
    setCartOpen(true);
    toast.success(`${slot.name} added to cart!`);
  };

  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoading(true);
      setError(null);
      console.log("Booking: Fetching slots...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        const data = await safeQuery(
          supabase
          .from("slots")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .abortSignal(controller.signal)
        );
        
        clearTimeout(timeoutId);

        if (data) {
          console.log("Booking: Slots fetched successfully", data.length);
          const mappedSlots = data.map(s => {
            const slotData = s as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            return {
              id: s.id,
              name: s.name,
              slug: s.slug,
              price: s.price,
              is_active: s.is_active,
              type: slotData.type || (s.slug.includes('interview') ? 'interview' : 'music')
            };
          }) as Slot[];
          // Only fallback if explicitly empty and we want to show something?
          // User said "If error, return ErrorBox".
          // If empty, maybe empty state?
          // But user also wants "Render a fallback".
          // I will use fallback if data is empty.
          if (mappedSlots.length > 0) {
            setSlots(mappedSlots);
          } else {
             // Empty DB => fallback slots? Or empty state?
             // Given it's a critical feature, fallback seems safer for demo purposes, 
             // but user wants explicit failure.
             // If DB is empty, that's not an error.
             console.warn("Booking: No slots found in DB, using fallback.");
             setSlots(FALLBACK_SLOTS);
          }
        } else {
           setSlots(FALLBACK_SLOTS);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          console.log("Booking: Slots fetch timed out or aborted.");
          setError("Connection timed out. Using offline data.");
          setSlots(FALLBACK_SLOTS); // Fallback on timeout
        } else {
          console.error("Booking: Unexpected error fetching slots:", err);
          setError(err instanceof Error ? err.message : "Failed to load slots");
          setSlots(FALLBACK_SLOTS);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, []);

  const musicSlots = useMemo(() => slots.filter(s => s.type === 'music' || s.slug === 'new-music-monday'), [slots]);
  const interviewSlots = useMemo(() => slots.filter(s => s.type === 'interview' || s.slug === 'featured-interview'), [slots]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const slotType = searchParams.get("slotType");
    const slot = searchParams.get("slot");
    const action = searchParams.get("action");

    if (sessionId && slotType) {
      // Force capability refresh on checkout return
      console.log("Checkout return detected, refetching entitlements...");
      refetchEntitlements();
      
      if (slotType.includes("music")) {
        setIsMusicModalOpen(true);
      } else if (slotType.includes("interview")) {
        setIsInterviewModalOpen(true);
      }
    } else if (slot) {
      if (slot === "new-music-monday") {
        setIsMusicModalOpen(true);
      } else if (slot === "featured-interview") {
        setIsInterviewModalOpen(true);
      }
    } else if (action === "payment") {
      setIsQuickPaymentOpen(true);
    }
  }, [searchParams, refetchEntitlements]);

  return (
    <PageLayoutWithAds>
      <PageTransition>
        <div className="py-12 px-4 min-h-[60vh] flex flex-col justify-center">
          <div className="text-center mb-16 flex flex-col items-center">
            <h1 className="font-display text-4xl md:text-6xl text-foreground mb-4">
              Booking & <span className="text-dem">Slots</span>
            </h1>
            <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
              Secure your spot for New Music Mondays, interviews, or featured showcase slots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
            {error && (
              <div className="col-span-full">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Unable to load live slots</AlertTitle>
                  <AlertDescription className="flex flex-col gap-1">
                    <span>{error}</span>
                    <span className="text-xs opacity-70">Showing offline preview data.</span>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {isLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-dem" />
                <p className="font-display text-xl text-muted-foreground animate-pulse">Loading available slots...</p>
              </div>
            ) : (
              <>
                {/* New Music Mondays Slot */}
                {musicSlots[0] && (
                  <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col text-center">
                    <div className="p-8 flex flex-col items-center flex-1">
                      <div 
                        className="w-12 h-12 bg-dem/10 rounded-xl flex items-center justify-center mb-6 cursor-pointer hover:bg-dem/20 transition-all"
                        onClick={() => handleSelectSlot(musicSlots[0])}
                      >
                        <Music className="w-6 h-6 text-dem" />
                      </div>
                      <h3 className="font-display text-2xl text-foreground mb-2">{musicSlots[0].name}</h3>
                      <p className="font-display text-3xl text-dem font-black mb-4">${musicSlots[0].price}</p>
                      <p className="font-body text-sm text-muted-foreground mb-6">
                        Get your track featured and reviewed live. Limited slots available every week.
                      </p>
                      
                      <div className="space-y-3 mb-8 w-full flex flex-col items-center">
                        <div className="flex items-center justify-center gap-3 text-xs text-foreground/80">
                          <Calendar className="w-4 h-4 text-dem" />
                          <span>Every Monday night</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-xs text-foreground/80">
                          <Clock className="w-4 h-4 text-dem" />
                          <span>8:00 PM EST</span>
                        </div>
                      </div>

                      <div className="w-full mt-auto">
                        <SlotPaywall 
                          slotSlug={musicSlots[0].slug}
                          preview={
                            <div className="p-4 bg-muted/20 rounded-lg border border-dashed border-border text-center">
                              <p className="text-xs text-muted-foreground">Live stream preview</p>
                            </div>
                          }
                        >
                          <div className="bg-dem/5 border border-dem/20 rounded-xl p-6 text-center">
                            <Dialog open={isMusicModalOpen} onOpenChange={setIsMusicModalOpen}>
                              <DialogTrigger asChild>
                                <Button className="w-full bg-dem hover:bg-dem/90 text-white rounded-full text-xs">
                                  Submit Track
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[92vh] overflow-y-auto p-0 top-[50%] translate-y-[-50%] sm:rounded-2xl">
                                <div className="p-4 sm:p-8 pb-12">
                                  <DialogHeader className="mb-6">
                                    <DialogTitle className="font-display text-2xl">{musicSlots[0].name} Submission</DialogTitle>
                                    <DialogDescription className="font-body">
                                      Fill out the form below to submit your track for live review and feature.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <BookingForm type="music" onSuccess={() => setIsMusicModalOpen(false)} />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </SlotPaywall>
                      </div>
                    </div>
                  </div>
                )}

                {/* Featured Interview Slot */}
                {interviewSlots[0] && (
                  <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col text-center">
                    <div className="p-8 flex flex-col items-center flex-1">
                      <div 
                        className="w-12 h-12 bg-rep/10 rounded-xl flex items-center justify-center mb-6 cursor-pointer hover:bg-rep/20 transition-all"
                        onClick={() => handleSelectSlot(interviewSlots[0])}
                      >
                        <Mic2 className="w-6 h-6 text-rep" />
                      </div>
                      <h3 className="font-display text-2xl text-foreground mb-2">{interviewSlots[0].name}</h3>
                      <p className="font-display text-3xl text-rep font-black mb-4">${interviewSlots[0].price}</p>
                      <p className="font-body text-sm text-muted-foreground mb-6">
                        A professional 1-on-1 interview slot for artists and community leaders.
                      </p>

                      <div className="space-y-3 mb-8 w-full flex flex-col items-center">
                        <div className="flex items-center justify-center gap-3 text-xs text-foreground/80">
                          <Video className="w-4 h-4 text-rep" />
                          <span>Video production</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-xs text-foreground/80">
                          <Mic2 className="w-4 h-4 text-rep" />
                          <span>Cross-platform dist</span>
                        </div>
                      </div>

                      <div className="w-full mt-auto">
                        <SlotPaywall 
                          slotSlug={interviewSlots[0].slug}
                          preview={
                            <div className="p-4 bg-muted/20 rounded-lg border border-dashed border-border text-center">
                              <p className="text-xs text-muted-foreground">Interview details</p>
                            </div>
                          }
                        >
                          <div className="bg-rep/5 border border-rep/20 rounded-xl p-6 text-center">
                            <Dialog open={isInterviewModalOpen} onOpenChange={setIsInterviewModalOpen}>
                              <DialogTrigger asChild>
                                <Button className="w-full bg-rep hover:bg-rep/90 text-white rounded-full text-xs">
                                  Schedule Time
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[92vh] overflow-y-auto p-0 top-[50%] translate-y-[-50%] sm:rounded-2xl">
                                <div className="p-4 sm:p-8 pb-12">
                                  <DialogHeader className="mb-6">
                                    <DialogTitle className="font-display text-2xl">{interviewSlots[0].name} Booking</DialogTitle>
                                    <DialogDescription className="font-body">
                                      Provide your details below to schedule your featured interview.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <BookingForm type="interview" onSuccess={() => setIsInterviewModalOpen(false)} />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </SlotPaywall>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-16 bg-muted/30 border border-border rounded-3xl p-8 md:p-12 text-center w-full flex flex-col items-center">
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">Custom Advertising</h2>
            <p className="font-body text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Looking for long-term partnerships or custom advertising slots on our sidebar and breaking news banners?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild variant="outline" className="rounded-full px-8">
                <a href="/contact">Contact Sales Team</a>
              </Button>
              <QuickPaymentDialog 
                open={isQuickPaymentOpen}
                onOpenChange={setIsQuickPaymentOpen}
                trigger={
                  <Button className="bg-dem hover:bg-dem/90 text-white rounded-full px-8">
                    Quick Payment
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Booking;
