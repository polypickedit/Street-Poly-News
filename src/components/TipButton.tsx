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
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-dem text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Tell us your story"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dem-dark border border-white/10 rounded-lg w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-white">
                Tell us your <span className="text-dem">story</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white"
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
                className="bg-white/5 border-white/10 focus-visible:ring-dem text-white"
              />
              <Input
                type="email"
                placeholder="Your email (optional)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/5 border-white/10 focus-visible:ring-dem text-white"
              />
              <Textarea
                placeholder="Tell us what you know..."
                required
                rows={4}
                value={formData.tip}
                onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                className="bg-white/5 border-white/10 resize-none focus-visible:ring-dem text-white"
              />
              <Button type="submit" className="w-full bg-dem hover:bg-dem/90 text-white">
                <Send className="w-4 h-4 mr-2" />
                Send Tip
              </Button>
            </form>

            <p className="text-white/40 text-xs font-body text-center mt-4">
              All tips are anonymous. Your identity is protected.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
