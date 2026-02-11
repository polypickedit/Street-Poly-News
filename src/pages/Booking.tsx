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
import { useState, useEffect } from "react";
import { QuickPaymentDialog } from "@/components/QuickPaymentDialog";
import { useSearchParams } from "react-router-dom";

export const Booking = () => {
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const slotType = searchParams.get("slotType");

    if (sessionId && slotType) {
      if (slotType.includes("music")) {
        setIsMusicModalOpen(true);
      } else if (slotType.includes("interview")) {
        setIsInterviewModalOpen(true);
      }
    }
  }, [searchParams]);

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full justify-items-center">
            {/* New Music Mondays Slot */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col text-center">
              <div className="p-8 flex flex-col items-center flex-1">
                <div className="w-12 h-12 bg-dem/10 rounded-xl flex items-center justify-center mb-6">
                  <Music className="w-6 h-6 text-dem" />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-2">New Music Mondays</h3>
                <p className="font-display text-3xl text-dem font-black mb-4">$300</p>
                <p className="font-body text-muted-foreground mb-6">
                  Get your track featured and reviewed live. Limited slots available every week.
                </p>
                
                <div className="space-y-3 mb-8 w-full flex flex-col items-center">
                  <div className="flex items-center justify-center gap-3 text-sm text-foreground/80">
                    <Calendar className="w-4 h-4 text-dem" />
                    <span>Every Monday night</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-sm text-foreground/80">
                    <Clock className="w-4 h-4 text-dem" />
                    <span>8:00 PM EST</span>
                  </div>
                </div>

                <div className="w-full">
                  <SlotPaywall 
                    slotSlug="new-music-monday"
                    preview={
                      <div className="p-4 bg-muted/20 rounded-lg border border-dashed border-border text-center">
                        <p className="text-sm text-muted-foreground">Live stream preview and slot details</p>
                      </div>
                    }
                  >
                    <div className="bg-dem/5 border border-dem/20 rounded-xl p-6 text-center">
                      <p className="text-dem font-medium mb-4">You have access to this slot!</p>
                      <Dialog open={isMusicModalOpen} onOpenChange={setIsMusicModalOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-dem hover:bg-dem/90 text-white rounded-full">
                            Submit Your Track
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[92vh] overflow-y-auto p-0 top-[50%] translate-y-[-50%] sm:rounded-2xl">
                           <div className="p-4 sm:p-8 pb-12">
                             <DialogHeader className="mb-6">
                               <DialogTitle className="font-display text-2xl">New Music Monday Submission</DialogTitle>
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

            {/* Featured Interview Slot */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col text-center">
              <div className="p-8 flex flex-col items-center flex-1">
                <div className="w-12 h-12 bg-rep/10 rounded-xl flex items-center justify-center mb-6">
                  <Mic2 className="w-6 h-6 text-rep" />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-2">Featured Interview</h3>
                <p className="font-display text-3xl text-rep font-black mb-4">$150</p>
                <p className="font-body text-muted-foreground mb-6">
                  A professional 1-on-1 interview slot for artists, activists, and community leaders.
                </p>

                <div className="space-y-3 mb-8 w-full flex flex-col items-center">
                  <div className="flex items-center justify-center gap-3 text-sm text-foreground/80">
                    <Video className="w-4 h-4 text-rep" />
                    <span>High-quality video production</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-sm text-foreground/80">
                    <Mic2 className="w-4 h-4 text-rep" />
                    <span>Cross-platform distribution</span>
                  </div>
                </div>

                <div className="w-full">
                  <SlotPaywall 
                    slotSlug="featured-interview"
                    preview={
                      <div className="p-4 bg-muted/20 rounded-lg border border-dashed border-border text-center">
                        <p className="text-sm text-muted-foreground">Interview package details</p>
                      </div>
                    }
                  >
                    <div className="bg-rep/5 border border-rep/20 rounded-xl p-6 text-center">
                      <p className="text-rep font-medium mb-4">Interview Slot Confirmed</p>
                      <Dialog open={isInterviewModalOpen} onOpenChange={setIsInterviewModalOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-rep hover:bg-rep/90 text-white rounded-full">
                            Schedule Your Time
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[92vh] overflow-y-auto p-0 top-[50%] translate-y-[-50%] sm:rounded-2xl">
                           <div className="p-4 sm:p-8 pb-12">
                             <DialogHeader className="mb-6">
                               <DialogTitle className="font-display text-2xl">Featured Interview Booking</DialogTitle>
                               <DialogDescription className="font-body">
                                 Provide your details below to schedule your 1-on-1 featured interview.
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
