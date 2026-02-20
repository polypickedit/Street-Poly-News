import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackPayPalEvent } from "@/lib/paypal-analytics";

const PAYPAL_LINK = "https://www.paypal.com/instantcommerce/checkout/8XA2E9JLPHUDG";

const formSchema = z.object({
  slot_type: z.string().min(1, "Slot type is required"),
  outlet_id: z.string().optional(),
  artist_name: z.string().min(1, "Artist name is required"),
  email: z.string().email("Invalid email address"),
  release_link: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PayPalStabilizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<FormData>;
}

export const PayPalStabilizerModal = ({
  isOpen,
  onClose,
  initialData,
}: PayPalStabilizerModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slot_type: initialData?.slot_type || "new_music_monday",
      outlet_id: initialData?.outlet_id || "",
      artist_name: initialData?.artist_name || "",
      email: initialData?.email || "",
      release_link: initialData?.release_link || "",
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    const orderId = crypto.randomUUID();

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: placement_orders table created manually, types not yet generated
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("placement_orders").insert({
        order_id: orderId,
        slot_type: values.slot_type,
        outlet_id: values.outlet_id || null,
        artist_name: values.artist_name,
        email: values.email,
        release_link: values.release_link || null,
        notes: values.notes || null,
        status: "pending_paypal",
        payment_method: "paypal",
      });

      if (error) throw error;

      // Track: intake_created
      await trackPayPalEvent(orderId, 'intake_created', {
        slot_type: values.slot_type,
        artist_name: values.artist_name,
        outlet_id: values.outlet_id,
      });

      // Track: redirected_to_paypal
      await trackPayPalEvent(orderId, 'redirected_to_paypal', {});

      // Store order_id for recovery on success page
      localStorage.setItem("latest_paypal_order_id", orderId);

      // Redirect to PayPal
      window.location.href = `${PAYPAL_LINK}?order_id=${orderId}`;
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to initiate payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
          <DialogDescription>
            Temporary PayPal Checkout – You will receive confirmation after manual verification.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="slot_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slot Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a slot type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new_music_monday">New Music Monday</SelectItem>
                      <SelectItem value="mixtape">Mixtape</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="playlist">Playlist</SelectItem>
                      <SelectItem value="merch">Merch</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="artist_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist / Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="release_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Release Link (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Spotify, Apple Music, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any special instructions?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to PayPal...
                  </>
                ) : (
                  "Proceed to PayPal"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
