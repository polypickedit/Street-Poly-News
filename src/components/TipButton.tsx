import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function TipButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", tip: "" });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Tip Received!",
      description: "Thanks for the tip. We'll look into it.",
    });
    setFormData({ name: "", email: "", tip: "" });
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-dem text-dem-foreground p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Got a Tip?"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-foreground">
                Got a <span className="text-dem">Tip?</span>
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Your name (optional)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-muted border-border focus-visible:ring-dem"
              />
              <Input
                type="email"
                placeholder="Your email (optional)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-muted border-border focus-visible:ring-dem"
              />
              <Textarea
                placeholder="Tell us what you know..."
                required
                rows={4}
                value={formData.tip}
                onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                className="bg-muted border-border resize-none focus-visible:ring-dem"
              />
              <Button type="submit" className="w-full bg-dem hover:bg-dem/90 text-dem-foreground">
                <Send className="w-4 h-4 mr-2" />
                Send Tip
              </Button>
            </form>

            <p className="text-muted-foreground text-xs font-body text-center mt-4">
              All tips are anonymous. Your identity is protected.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
