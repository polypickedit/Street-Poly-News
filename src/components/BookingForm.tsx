import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { 
  Upload, Music, Mic2, Calendar as CalendarIcon, User, Mail, 
  MessageSquare, CreditCard, Share2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";
import { createSlotCheckoutSession } from "@/lib/stripe";
import { getProductBySlotSlug } from "@/config/pricing";

interface BookingFormProps {
  type: "music" | "interview";
  onSuccess?: () => void;
}

interface BookingFormData {
  name: string;
  email: string;
  artistName: string;
  slotType: string;
  preferredDate: string;
  description: string;
  links: string;
  selectedOutlets: string[];
  submissionType: "music" | "story" | "announcement";
}

interface Outlet {
  id: string;
  name: string;
  price_cents: number;
  outlet_type: string;
}

interface Slot {
  id: string;
  name: string;
  slug: string;
  price: number;
}

export const BookingForm = ({ type, onSuccess }: BookingFormProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'confirming' | 'paid' | 'failed'>('idle');
  
  const [slots, setSlots] = useState<Slot[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const { user, isAdmin, isEditor } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'capability'>('stripe');

  const requiredCapability = selectedSlot ? getProductBySlotSlug(selectedSlot.slug).grants[0] : 'post.submit';
  const canUseCapability = isAdmin || isEditor;

  useEffect(() => {
    if (canUseCapability) {
      setPaymentMethod('capability');
    } else {
      setPaymentMethod('stripe');
    }
  }, [canUseCapability]);

  const checkPaymentStatus = useCallback(async (signal?: AbortSignal) => {
    setPaymentStatus('confirming');
    
    let attempts = 0;
    const maxAttempts = 15;
    
    const poll = async () => {
      if (signal?.aborted) return;
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession) return;

        const query = supabase
          .from("submissions")
          .select("id, payment_status")
          .eq("user_id", authSession.user.id)
          .eq("payment_status", "paid") as unknown as { abortSignal: (s?: AbortSignal) => Promise<{ data: { id: string, payment_status: string }[] | null, error: unknown }> };

        const { data: submissions, error } = await query.abortSignal(signal);

        if (error) throw error;

        if (submissions && submissions.length > 0) {
          setPaymentStatus('paid');
          toast.success("Payment confirmed!");
          onSuccess?.();
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setPaymentStatus('failed');
          toast.error("Payment confirmation timed out. Please check your dashboard later.");
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error("Polling error:", error);
      }
    };

    poll();
  }, [onSuccess]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      const controller = new AbortController();
      checkPaymentStatus(controller.signal);
      return () => controller.abort();
    }
  }, [searchParams, checkPaymentStatus]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSlots = async () => {
      const query = supabase.from("slots").select("*").eq("is_active", true) as unknown as { abortSignal: (s: AbortSignal) => Promise<{ data: Slot[] | null; error: unknown }> };
      const { data } = await query.abortSignal(controller.signal);
      if (data) setSlots(data);
    };

    const fetchOutlets = async () => {
      const query = supabase.from("media_outlets").select("id, name, price_cents, outlet_type").eq("active", true) as unknown as { abortSignal: (s: AbortSignal) => Promise<{ data: Outlet[] | null; error: unknown }> };
      const { data } = await query.abortSignal(controller.signal);
      if (data) setOutlets(data as unknown as Outlet[]);
    };

    fetchSlots();
    fetchOutlets();

    return () => controller.abort();
  }, []);

  const defaultValues: BookingFormData = {
    name: "",
    email: "",
    artistName: "",
    slotType: type === "music" ? "new-music-monday" : "interview",
    preferredDate: "",
    description: "",
    links: "",
    selectedOutlets: [],
    submissionType: type === "music" ? "music" : "story",
  };

  const form = useForm<BookingFormData>({
    defaultValues,
  });

  useEffect(() => {
    const slotType = form.watch("slotType");
    const slot = slots.find(s => s.slug === slotType);
    setSelectedSlot(slot || null);
  }, [form, slots]);

  const watchOutlets = form.watch("selectedOutlets");
  const outletsTotal = watchOutlets.reduce((acc, id) => {
    const outlet = outlets.find(o => o.id === id);
    return acc + (outlet?.price_cents || 0);
  }, 0) / 100;

  const totalPrice = (selectedSlot?.price || 0) + outletsTotal;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    const artistName = data.artistName.trim() || data.name.trim() || "Unknown Artist";
    const preferredDate = data.preferredDate || new Date().toISOString().split("T")[0];
    const [primaryLink] = data.links.split(/\s+/).filter(Boolean);
    const mood = data.description.trim() || "Needs artist input";

    try {
      const { data: existingArtist } = await supabase
        .from("artists")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      let artistId = existingArtist?.id;

      if (!artistId) {
        const { data: newArtist, error: artistError } = await supabase
          .from("artists")
          .insert({
            name: artistName,
            email: data.email,
            user_id: user?.id,
          })
          .select("id")
          .single();

        if (artistError) throw artistError;
        artistId = newArtist!.id;
      }

      const submissionPayload = {
        artist_id: artistId,
        slot_id: selectedSlot?.id,
        track_title: `${selectedSlot?.name || "Submission"} — ${artistName}`,
        artist_name: artistName,
        spotify_track_url: primaryLink || "https://streetpolynews.com/booking",
        release_date: preferredDate,
        genre: selectedSlot?.name || "General",
        mood,
        notes_internal: `${data.description}\nPreferred slot: ${selectedSlot?.name}\nPreferred date: ${preferredDate}\nLinks: ${data.links}`,
        submission_type: data.submissionType,
        distribution_targets: data.selectedOutlets,
        content_bundle: {
          artist_name: artistName,
          title: `${selectedSlot?.name || "Submission"} — ${artistName}`,
          description: data.description,
          links: data.links.split(/\s+/).filter(Boolean),
          preferred_date: preferredDate
        }
      };

      let submissionId: string;

      if (paymentMethod === 'capability') {
        const { data: consumed, error: consumeError } = await supabase.rpc("consume_capability", {
          p_user_id: user?.id || "",
          p_capability: requiredCapability || ""
        });

        if (consumeError) throw consumeError;
        if (!consumed) throw new Error(`You don't have an available ${requiredCapability} capability.`);

        const { data: submission, error: submissionError } = await supabase.from("submissions").insert({
          ...submissionPayload,
          user_id: user?.id,
          status: "pending",
          payment_status: "paid",
          payment_type: "credits"
        }).select("id").single();

        if (submissionError) throw submissionError;
        submissionId = submission!.id;
      } else {
        const { data: submission, error: submissionError } = await supabase.from("submissions").insert({
          ...submissionPayload,
          user_id: user?.id,
          status: "pending",
          payment_status: "unpaid",
          payment_type: "stripe"
        }).select("id").single();

        if (submissionError) throw submissionError;
        submissionId = submission!.id;
      }

      if (data.selectedOutlets.length > 0) {
        const distributionRecords = data.selectedOutlets.map(outletId => ({
          submission_id: submissionId,
          outlet_id: outletId,
          status: 'pending'
        }));
        const { error: distError } = await supabase.from("submission_distribution").insert(distributionRecords);
        if (distError) throw distError;
      }

      if (paymentMethod === 'stripe' && selectedSlot && selectedSlot.price > 0) {
        toast.info("Redirecting to Stripe Checkout...");
        await createSlotCheckoutSession(
          selectedSlot.id, 
          selectedSlot.slug, 
          submissionId,
          data.selectedOutlets
        );
      } else {
        toast.success(paymentMethod === 'capability' ? "Capability used! Submission successful." : "Submission successful!");
        form.reset(defaultValues);
        onSuccess?.();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <div className="bg-dem/10 border border-dem/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-dem">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">Estimated Total</span>
            </div>
            {canUseCapability && (
              <div className="text-[10px] font-bold px-2 py-1 bg-dem/20 text-dem rounded-full border border-dem/30 uppercase tracking-widest">
                Capability Available
              </div>
            )}
          </div>
          
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Service: <span className="text-foreground font-black">{selectedSlot?.name || "Loading..."}</span>
              </p>
              {watchOutlets.length > 0 && (
                <p className="text-xs text-muted-foreground font-medium">
                  + {watchOutlets.length} Syndication Outlets
                </p>
              )}
            </div>
            <p className="text-2xl font-black text-foreground">
              {paymentMethod === 'capability' ? "FREE" : `$${totalPrice.toFixed(2)}`}
            </p>
          </div>

          {canUseCapability && (
            <div className="pt-4 border-t border-dem/10 flex gap-2">
              <Button
                type="button"
                variant={paymentMethod === 'stripe' ? 'default' : 'outline'}
                className="flex-1 h-9 text-xs"
                onClick={() => setPaymentMethod('stripe')}
              >
                Pay with Card
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'capability' ? 'default' : 'outline'}
                className="flex-1 h-9 text-xs bg-dem hover:bg-dem/90 border-dem/50"
                onClick={() => setPaymentMethod('capability')}
              >
                Use Capability
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 text-dem">
            <Share2 className="w-4 h-4" />
            <h4 className="text-sm font-semibold uppercase tracking-wider">Syndication Network & Promotional Opportunities (Optional)</h4>
          </div>
          <p className="text-xs text-muted-foreground font-medium mb-4">Select outlets to distribute your content or other promotional opportunities. One click, maximum reach.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {outlets.map((outlet) => (
              <FormField
                key={outlet.id}
                control={form.control}
                name="selectedOutlets"
                render={({ field }) => {
                  return (
                    <FormItem
                      key={outlet.id}
                      className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(outlet.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, outlet.id])
                              : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== outlet.id
                                  )
                                )
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {outlet.name}
                        </FormLabel>
                        <p className="text-[10px] text-dem font-bold">
                          +${(outlet.price_cents / 100).toFixed(2)}
                        </p>
                      </div>
                    </FormItem>
                  )
                }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="John Doe" className="pl-9" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="john@example.com" type="email" className="pl-9" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="artistName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{type === "music" ? "Artist/Band Name" : "Organization/Public Figure Name"}</FormLabel>
                <FormControl>
                  <div className="relative">
                    {type === "music" ? (
                      <Music className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mic2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input placeholder="Enter name" className="pl-9" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="preferredDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Date</FormLabel>
                <FormControl>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="pl-9" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="slotType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slot Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a slot type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {slots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.slug}>
                      {slot.name} (${slot.price.toFixed(2)})
                    </SelectItem>
                  ))}
                  {slots.length === 0 && (
                    <SelectItem value="loading" disabled>
                      Loading services...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === "music" ? "Track Description" : "Interview Topic/Focus"}</FormLabel>
              <FormControl>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea 
                    placeholder={type === "music" ? "Tell us about your track..." : "What would you like to discuss?"} 
                    className="pl-9 min-h-[100px]"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 sm:space-y-4">
          <FormLabel>Media Assets</FormLabel>
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 sm:p-8 text-center hover:border-dem/50 transition-colors cursor-pointer group">
            <input type="file" className="hidden" id="file-upload" multiple />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground group-hover:text-dem transition-colors mx-auto mb-2 sm:mb-4" />
              <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">MP3, WAV, JPG, or PDF (max. 50MB)</p>
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full rounded-full h-12 text-white font-medium transition ${type === "music" ? "bg-dem hover:bg-dem/90" : "bg-rep hover:bg-rep/90"} ${isSubmitting ? "opacity-80 cursor-wait" : ""}`}
        >
          {isSubmitting ? "Submitting..." : "Submit Booking Request"}
        </Button>
      </form>
    </Form>
  );
};
