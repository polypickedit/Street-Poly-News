import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { SlotPaywall } from "@/components/slots/SlotPaywall";
import { Calendar, Music, Mic2, Video, Clock, Headphones, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookingForm } from "@/components/BookingForm";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { QuickPaymentDialog } from "@/components/QuickPaymentDialog";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS } from "@/config/pricing";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useEntitlements } from "@/hooks/useEntitlements";
import { safeQuery } from "@/lib/supabase-debug";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  createListeningSubmission,
  findPaidPurchaseForTier,
  listOpenListeningSessions,
  type ListeningSession,
  type ListeningSessionTier,
} from "@/lib/listeningSessions";
import { createListeningTierCheckoutSession } from "@/lib/stripe";

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
  const { user } = useAuth();
  const { profile } = useProfile();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [listeningSessions, setListeningSessions] = useState<ListeningSession[]>([]);
  const [listeningLoading, setListeningLoading] = useState(true);
  const [listeningError, setListeningError] = useState<string | null>(null);

  const [isListeningSubmitDialogOpen, setIsListeningSubmitDialogOpen] = useState(false);
  const [listeningPurchaseId, setListeningPurchaseId] = useState<string | null>(null);
  const [listeningTrackTitle, setListeningTrackTitle] = useState("");
  const [listeningTrackUrl, setListeningTrackUrl] = useState("");
  const [listeningSubmissionBusy, setListeningSubmissionBusy] = useState(false);
  const [listeningPurchasePending, setListeningPurchasePending] = useState(false);

  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [pendingTierId, setPendingTierId] = useState<string | null>(null);

  const selectedListening = useMemo(() => {
    if (!pendingSessionId || !pendingTierId) return null;
    const session = listeningSessions.find((s) => s.id === pendingSessionId);
    if (!session) return null;
    const tier = session.tiers.find((t) => t.id === pendingTierId);
    if (!tier) return null;
    return { session, tier };
  }, [listeningSessions, pendingSessionId, pendingTierId]);

  const handleSelectSlot = (slot: Slot) => {
    addItem({
      id: slot.id,
      name: slot.name,
      type: "slot",
      price: slot.price,
      image: "/placeholder.svg",
    });
    setCartOpen(true);
    toast.success(`${slot.name} added to cart!`);
  };

  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

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
          const mappedSlots = data.map((s) => {
            const slotData = s as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            return {
              id: s.id,
              name: s.name,
              slug: s.slug,
              price: s.price,
              is_active: s.is_active,
              type: slotData.type || (s.slug.includes("interview") ? "interview" : "music"),
            };
          }) as Slot[];

          setSlots(mappedSlots.length > 0 ? mappedSlots : FALLBACK_SLOTS);
        } else {
          setSlots(FALLBACK_SLOTS);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && (err.name === "AbortError" || err.message?.includes("abort"))) {
          setError("Connection timed out. Using offline data.");
          setSlots(FALLBACK_SLOTS);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load slots");
          setSlots(FALLBACK_SLOTS);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, []);

  useEffect(() => {
    let active = true;

    const fetchListeningSessions = async () => {
      setListeningLoading(true);
      setListeningError(null);

      try {
        const sessions = await listOpenListeningSessions();
        if (!active) return;
        setListeningSessions(sessions);
      } catch (err) {
        if (!active) return;
        setListeningError(err instanceof Error ? err.message : "Failed to load listening sessions");
      } finally {
        if (active) setListeningLoading(false);
      }
    };

    fetchListeningSessions();

    return () => {
      active = false;
    };
  }, []);

  const musicSlots = useMemo(() => slots.filter((s) => s.type === "music" || s.slug === "new-music-monday"), [slots]);
  const interviewSlots = useMemo(() => slots.filter((s) => s.type === "interview" || s.slug === "featured-interview"), [slots]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const slotType = searchParams.get("slotType");
    const slot = searchParams.get("slot");
    const action = searchParams.get("action");

    if (sessionId && slotType) {
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

  useEffect(() => {
    let cancelled = false;

    const hydrateListeningPurchaseFromReturn = async () => {
      const sessionId = searchParams.get("session_id");
      const slotType = searchParams.get("slotType");
      const listeningSessionId = searchParams.get("listeningSessionId");
      const listeningTierId = searchParams.get("listeningTierId");

      if (!sessionId || slotType !== "listening_tier" || !listeningSessionId || !listeningTierId) return;

      setPendingSessionId(listeningSessionId);
      setPendingTierId(listeningTierId);
      setListeningPurchasePending(true);

      const attempts = 10;
      for (let i = 0; i < attempts; i += 1) {
        if (cancelled) return;
        try {
          const purchase = await findPaidPurchaseForTier(listeningSessionId, listeningTierId, sessionId);
          if (purchase?.id) {
            setListeningPurchaseId(purchase.id);
            setIsListeningSubmitDialogOpen(true);
            toast.success("Payment confirmed. Submit your track now.");
            setListeningPurchasePending(false);
            return;
          }
        } catch (_error) {
          // Continue retrying while webhook finalizes.
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      if (!cancelled) {
        setListeningPurchasePending(false);
        toast.error("Payment is still processing. Refresh in a few moments to submit your track.");
      }
    };

    hydrateListeningPurchaseFromReturn();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleListeningCheckout = async (sessionId: string, tier: ListeningSessionTier) => {
    if (!user) {
      toast.error("Please sign in to book a listening tier");
      return;
    }

    if (!profile?.username || !profile?.display_name) {
      toast.error("Complete username and display name before submitting");
      window.location.href = "/settings/profile";
      return;
    }

    if (tier.sold_out) {
      toast.error("This tier is sold out");
      return;
    }

    try {
      await createListeningTierCheckoutSession(sessionId, tier.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to start checkout");
    }
  };

  const handleListeningSubmission = async (e: FormEvent) => {
    e.preventDefault();

    if (!listeningPurchaseId) {
      toast.error("No paid purchase found for this submission");
      return;
    }

    if (!listeningTrackTitle.trim() || !listeningTrackUrl.trim()) {
      toast.error("Track title and URL are required");
      return;
    }

    setListeningSubmissionBusy(true);
    try {
      await createListeningSubmission(listeningPurchaseId, listeningTrackTitle.trim(), listeningTrackUrl.trim());
      setListeningTrackTitle("");
      setListeningTrackUrl("");
      setIsListeningSubmitDialogOpen(false);
      toast.success("Listening submission received");

      const sessions = await listOpenListeningSessions();
      setListeningSessions(sessions);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit track");
    } finally {
      setListeningSubmissionBusy(false);
    }
  };

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
                                <Button className="w-full bg-dem hover:bg-dem/90 text-white rounded-full text-xs">Submit Track</Button>
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
                                <Button className="w-full bg-rep hover:bg-rep/90 text-white rounded-full text-xs">Schedule Time</Button>
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

          <div className="mt-16 w-full max-w-6xl mx-auto">
            <div className="mb-6 flex items-center gap-3">
              <Headphones className="w-5 h-5 text-dem" />
              <h2 className="font-display text-2xl md:text-3xl text-foreground">Listening Sessions</h2>
            </div>

            {listeningError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unable to load listening sessions</AlertTitle>
                <AlertDescription>{listeningError}</AlertDescription>
              </Alert>
            )}

            {listeningPurchasePending && (
              <Alert className="mb-4 border-dem/30 bg-dem/5">
                <Loader2 className="h-4 w-4 animate-spin text-dem" />
                <AlertTitle>Finalizing your purchase</AlertTitle>
                <AlertDescription>Waiting for payment confirmation so your submission form can unlock.</AlertDescription>
              </Alert>
            )}

            {listeningLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-dem" />
              </div>
            ) : listeningSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No open listening sessions right now.
              </div>
            ) : (
              <div className="space-y-6">
                {listeningSessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-border bg-card p-6 md:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-xl font-display text-foreground">{session.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{session.description || "Structured editorial review session."}</p>
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest">
                        {new Date(session.scheduled_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {session.tiers.map((tier) => {
                        const remaining = Math.max(0, tier.remaining_slots);
                        const soldOut = tier.sold_out;

                        return (
                          <div key={tier.id} className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-foreground">{tier.tier_name}</h4>
                              {soldOut ? (
                                <span className="text-[10px] px-2 py-1 rounded-full bg-rep/15 text-rep font-black uppercase tracking-wider">SOLD OUT</span>
                              ) : (
                                <span className="text-[10px] px-2 py-1 rounded-full bg-dem/15 text-dem font-black uppercase tracking-wider">
                                  {remaining} of {tier.slot_limit} remaining
                                </span>
                              )}
                            </div>

                            <p className="text-2xl font-black text-dem mt-2">${(tier.price_cents / 100).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground mt-2 flex-1">{tier.description || "Guaranteed review and consideration."}</p>

                            <Button
                              className="mt-4 w-full"
                              onClick={() => handleListeningCheckout(session.id, tier)}
                              disabled={soldOut}
                              variant={soldOut ? "outline" : "default"}
                            >
                              {soldOut ? "Sold Out" : "Pay and Submit"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
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

        <Dialog open={isListeningSubmitDialogOpen} onOpenChange={setIsListeningSubmitDialogOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-dem" />
                Submit Your Listening Track
              </DialogTitle>
              <DialogDescription>
                {selectedListening
                  ? `${selectedListening.session.title} · ${selectedListening.tier.tier_name}`
                  : "Your payment is confirmed. Add your track details to complete submission."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleListeningSubmission} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="listening-track-title">Track Title</Label>
                <Input
                  id="listening-track-title"
                  value={listeningTrackTitle}
                  onChange={(e) => setListeningTrackTitle(e.target.value)}
                  placeholder="Your Song Title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="listening-track-url">Track URL</Label>
                <Input
                  id="listening-track-url"
                  value={listeningTrackUrl}
                  onChange={(e) => setListeningTrackUrl(e.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={listeningSubmissionBusy || !listeningPurchaseId}>
                {listeningSubmissionBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Track
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Booking;
