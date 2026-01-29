import { useState } from "react";
import { useForm } from "react-hook-form";
import { Upload, Music, Mic2, Calendar as CalendarIcon, User, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface BookingFormProps {
  type: "music" | "interview";
  onSuccess?: () => void;
}

interface BookingFormData {
  name: string;
  email: string;
  artistName: string;
  slotType: "new-music-monday" | "interview" | "showcase";
  preferredDate: string;
  description: string;
  links: string;
}

export const BookingForm = ({ type, onSuccess }: BookingFormProps) => {
  const defaultValues: BookingFormData = {
    name: "",
    email: "",
    artistName: "",
    slotType: type === "music" ? "new-music-monday" : "interview",
    preferredDate: "",
    description: "",
    links: "",
  };

  const form = useForm<BookingFormData>({
    defaultValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slotLabels: Record<BookingFormData["slotType"], string> = {
    "new-music-monday": "New Music Monday",
    interview: "Featured Interview",
    showcase: "Featured Showcase",
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    const artistName = data.artistName.trim() || data.name.trim() || "Unknown Artist";
    const preferredDate = data.preferredDate || new Date().toISOString().split("T")[0];
    const [primaryLink] = data.links.split(/\s+/).filter(Boolean);
    const genre = slotLabels[data.slotType] ?? data.slotType;
    const mood = data.description.trim() || "Needs artist input";

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingArtist } = await (supabase as any)
        .from("artists")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      let artistId = existingArtist?.id;

      if (!artistId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newArtist, error: artistError } = await (supabase as any)
          .from("artists")
          .insert({
            name: artistName,
            email: data.email,
          })
          .select("id")
          .single();

        if (artistError) throw artistError;
        artistId = newArtist.id;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: submissionError } = await (supabase as any).from("submissions").insert({
        artist_id: artistId,
        track_title: `${slotLabels[data.slotType] || "Submission"} — ${artistName}`,
        artist_name: artistName,
        spotify_track_url: primaryLink || "https://streetpolynews.com/booking",
        release_date: preferredDate,
        genre,
        mood,
        status: "pending",
        payment_status: "unpaid",
        notes_internal: `${data.description}\nPreferred slot: ${slotLabels[data.slotType] ?? data.slotType}\nPreferred date: ${preferredDate}\nLinks: ${data.links}`,
      });

      if (submissionError) throw submissionError;

      toast.success("Booking request submitted successfully!");
      form.reset(defaultValues);
      onSuccess?.();
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
                  <SelectItem value="new-music-monday">New Music Monday Review</SelectItem>
                  <SelectItem value="interview">1-on-1 Interview</SelectItem>
                  <SelectItem value="showcase">Featured Showcase</SelectItem>
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
