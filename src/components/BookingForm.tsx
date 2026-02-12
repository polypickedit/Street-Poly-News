import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { 
  Upload, Music, Mic2, Calendar as CalendarIcon, User, Mail, 
  MessageSquare, CreditCard, Share2, Loader2, CheckCircle2 
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
import { getProductBySlotSlug } from "@/config/pricing";
import { submissionService, SubmissionPayload } from "@/lib/submissionService";

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
  type: "music" | "interview";
}

export const BookingForm = ({ type, onSuccess }: BookingFormProps) => {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'confirming' | 'paid' | 'failed'>('idle');
  
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const { user, isAdmin, isEditor } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'capability'>('stripe');

  const requiredCapability = selectedSlot ? getProductBySlotSlug(selectedSlot.slug).grants[0] : 'post.submit';
  const canUseCapability = isAdmin || isEditor;

  useEffect(() => {
    // Default to stripe even for admins so they can see prices/test the flow.
    // They can still manually switch to 'capability' via the UI buttons.
    setPaymentMethod('stripe');
  }, []);

  const verifyPayment = useCallback(async (submissionId: string, sessionId?: string) => {
    setPaymentStatus('confirming');
    try {
      const isPaid = await submissionService.verifyPayment(submissionId, sessionId);
      if (isPaid) {
        setPaymentStatus('paid');
        toast.success("Payment confirmed!");
      } else {
        setPaymentStatus('failed');
        toast.error("Payment not yet confirmed. It may take a few minutes for Stripe to process.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setPaymentStatus('failed');
      toast.error("Error verifying payment status.");
    }
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const submissionId = searchParams.get('submissionId');
    if (sessionId && submissionId) {
      verifyPayment(submissionId, sessionId);
    }
  }, [searchParams, verifyPayment]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        // Try to fetch using the new 'type' column first (World-class filtering)
        let { data, error } = await (supabase.from("slots") as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          .select("id, name, slug, price, type")
          .eq("is_active", true)
          .eq("type", type);
        
        // Fallback to legacy inference if the 'type' column doesn't exist yet
        if (error && (error.message?.includes('type') || error.code === 'PGRST204')) {
          const { data: legacyData, error: legacyError } = await supabase
            .from("slots")
            .select("id, name, slug, price, display_category")
            .eq("is_active", true);
          
          if (legacyError) throw legacyError;
          
          data = (legacyData || []).filter(s => {
            const inferred = (s.slug?.includes('interview') || s.display_category === 'interview') ? 'interview' : 'music';
            return inferred === type;
          });
          error = null;
        }

        if (error) throw error;

        if (data) {
          const fetchedSlots = (data as any[]).map(s => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
            id: s.id,
            name: s.name,
            slug: s.slug,
            price: Number(s.price),
            type: (s.type || ((s.slug?.includes('interview') || s.display_category === 'interview') ? 'interview' : 'music')) as "music" | "interview"
          })) as Slot[];
          
          setSlots(fetchedSlots);
          
          // Set initial selected slot dynamically from DB results
          if (fetchedSlots.length > 0) {
            const defaultSlot = fetchedSlots[0];
            form.setValue("slotType", defaultSlot.slug);
            setSelectedSlot(defaultSlot);
          }
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
        toast.error("Failed to load available service options.");
      } finally {
        setIsLoadingSlots(false);
      }
    };

    const fetchOutlets = async () => {
      const query = supabase.from("media_outlets").select("id, name, price_cents, outlet_type").eq("active", true);
      const { data } = await (query as unknown as { abortSignal: (s: AbortSignal) => Promise<{ data: Outlet[] | null }> }).abortSignal(controller.signal);
      if (data) setOutlets(data || []);
    };

    fetchSlots();
    fetchOutlets();

    return () => controller.abort();
  }, [type]);

  const defaultValues: BookingFormData = {
    name: "",
    email: "",
    artistName: "",
    slotType: "", // Will be set dynamically by fetchSlots
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
  const outletsTotal = (watchOutlets || []).reduce((acc, id) => {
    const outlet = outlets.find(o => o.id === id);
    return acc + (outlet?.price_cents || 0);
  }, 0) / 100;

  const totalPrice = (selectedSlot?.price || 0) + outletsTotal;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const marketValue = (selectedSlot?.price || 0) * 1.5 + (outletsTotal * 1.2);

  if (paymentStatus === 'confirming') {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-dem" />
        <p className="text-sm font-medium text-muted-foreground">Confirming payment...</p>
      </div>
    );
  }

  if (paymentStatus === 'paid') {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20 shadow-lg shadow-green-500/10">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-2xl font-black text-foreground tracking-tight">Booking Confirmed!</h3>
        <p className="text-sm text-muted-foreground max-w-[320px] leading-relaxed">
          Your submission is being processed by our media engine. You'll receive a notification as soon as it goes live.
        </p>
        <div className="pt-6 w-full max-w-[240px]">
          <Button 
            onClick={() => onSuccess?.()} 
            className="w-full rounded-full h-11 bg-dem hover:bg-dem/90 font-bold uppercase tracking-widest shadow-md"
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  const uploadMedia = async (submissionId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${submissionId}/${crypto.randomUUID()}.${fileExt}`;
      const filePath = `submissions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      urls.push(publicUrl);
    }
    return urls;
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!user) {
      toast.error("You must be signed in to submit.");
      return;
    }

    if (isSubmitting) return; // Prevent double-click
    if (isLoadingSlots) {
      toast.error("Please wait for service options to load.");
      return;
    }

    if (!selectedSlot || !selectedSlot.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      toast.error("Please select a valid service option.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SubmissionPayload = {
        artist_name: data.artistName || data.name,
        artist_email: data.email,
        track_title: data.artistName || "Untitled",
        spotify_track_url: data.links.split(/\s+/)[0] || "",
        release_date: data.preferredDate || new Date().toISOString().split('T')[0],
        genre: "General",
        mood: "General",
        slot_id: selectedSlot?.id || "",
        slot_slug: data.slotType,
        description: data.description,
        links: data.links.split(/\s+/).filter(Boolean),
        preferred_date: data.preferredDate,
        submission_type: data.submissionType,
        distribution_targets: data.selectedOutlets,
        media_urls: []
      };

      if (files.length > 0) {
        toast.info("Uploading media assets...");
      }

      const submissionId = await submissionService.submit(payload, user.id, {
        paymentMethod,
        capability: requiredCapability,
        files
      });

      if (paymentMethod === 'capability') {
        setPaymentStatus('paid');
        toast.success("Submission successful!");
      }
      // Stripe flow handles redirect inside submissionService.createWithStripe
    } catch (error) {
      console.error("Submission error:", error);
      const message = error instanceof Error ? error.message : "Failed to create submission.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <FormField
          control={form.control}
          name="slotType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Select Your Service Option
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <div className="relative">
                    <SelectTrigger className="h-12 bg-muted/30 border-muted-foreground/20 rounded-xl hover:border-dem/50 transition-all">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                  </div>
                </FormControl>
                <SelectContent className="rounded-xl border-border shadow-xl">
                  {slots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.slug} className="py-3 cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{slot.name}</span>
                        <span className="text-[10px] text-dem font-black uppercase tracking-widest mt-0.5">
                          ${slot.price.toFixed(2)} — Professional Tier
                        </span>
                      </div>
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

        <div className="bg-gradient-to-br from-dem/20 to-dem/5 border border-dem/20 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-dem">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Investment Summary</span>
            </div>
            {canUseCapability && (
              <div className="text-[10px] font-black px-3 py-1 bg-dem text-white rounded-full uppercase tracking-tighter animate-pulse">
                Editor Access Active
              </div>
            )}
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Market Value</span>
              <span className="text-muted-foreground line-through font-bold">${marketValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                  Your Price
                </p>
                <p className="text-3xl font-black text-foreground tracking-tighter">
                  {paymentMethod === 'capability' ? "FREE" : `$${totalPrice.toFixed(2)}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-dem font-black uppercase tracking-widest bg-dem/10 px-2 py-1 rounded">
                  {paymentMethod === 'capability' ? "100% Covered" : `Save $${(marketValue - totalPrice).toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>

          {canUseCapability && (
            <div className="pt-5 border-t border-dem/10 flex gap-3">
              <Button
                type="button"
                variant={paymentMethod === 'stripe' ? 'default' : 'outline'}
                className={`flex-1 h-10 text-xs font-bold uppercase tracking-wider transition-all ${paymentMethod === 'stripe' ? 'bg-dem shadow-lg shadow-dem/20' : ''}`}
                onClick={() => setPaymentMethod('stripe')}
              >
                Pay with Card
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'capability' ? 'default' : 'outline'}
                className={`flex-1 h-10 text-xs font-bold uppercase tracking-wider transition-all ${paymentMethod === 'capability' ? 'bg-dem shadow-lg shadow-dem/20' : ''}`}
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
          <p className="text-[10px] text-muted-foreground italic mb-4 bg-muted/30 p-2 rounded-md border border-border/50">
            * All bookings are handled on a first-come, first-served basis. Secure your slot early to ensure preferred placement.
          </p>
          
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
            name="artistName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{type === "music" ? "Artist/Band Name" : "Organization/Public Figure Name"}</FormLabel>
                <FormControl>
                  <div className="relative">
                    {type === "music" ? (
                      <Music className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mic2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input placeholder="Enter name" className="pl-9 h-11" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="John Doe" className="pl-9 h-11" {...field} />
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="john@example.com" type="email" className="pl-9 h-11" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="links"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{type === "music" ? "Spotify/Social Link" : "Website/Social Link"}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Share2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="https://..." className="pl-9 h-11" {...field} />
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
            name="preferredDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Date</FormLabel>
                <FormControl>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="pl-9 h-11" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        <div className="space-y-4">
          <FormLabel className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Media Assets
          </FormLabel>
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-8 text-center hover:border-dem/50 transition-all cursor-pointer group bg-muted/30">
            <input 
              type="file" 
              className="hidden" 
              id="file-upload" 
              multiple 
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="w-12 h-12 text-muted-foreground group-hover:text-dem transition-colors mx-auto mb-4" />
              <p className="text-sm font-bold text-foreground">Click to upload or drag and drop</p>
              <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">MP3, WAV, JPG, or PDF (max. 50MB)</p>
            </label>
          </div>
          
          {files.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2 border border-border">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Selected Files ({files.length})</p>
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-background p-2 rounded border border-border">
                  <span className="truncate max-w-[200px] font-medium">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              ))}
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="w-full text-[10px] font-bold uppercase tracking-tighter h-8"
                onClick={() => setFiles([])}
              >
                Clear All Files
              </Button>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || isLoadingSlots}
          className={`w-full rounded-full h-12 text-white font-medium transition ${type === "music" ? "bg-dem hover:bg-dem/90" : "bg-rep hover:bg-rep/90"} ${isSubmitting || isLoadingSlots ? "opacity-80 cursor-wait" : ""}`}
        >
          {isSubmitting ? "Submitting..." : isLoadingSlots ? "Loading options..." : "Submit Booking Request"}
        </Button>
      </form>
    </Form>
  );
};
