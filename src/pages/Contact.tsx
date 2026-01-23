import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
      
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error sending message",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <PageLayoutWithAds>
      <PageTransition>
        <div className="max-w-3xl mx-auto py-8 md:py-12 px-4">
          <h1 className="font-display text-4xl md:text-6xl text-foreground mb-8">
            Contact <span className="text-dem">Us</span>
          </h1>
          
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="font-body text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
                Have a story tip, question, or just want to say hello? Fill out the form or reach us directly via email.
              </p>
              
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <h3 className="font-display text-xl text-foreground mb-2">Email Us</h3>
                <a href="mailto:contact@streetpolynews.com" className="text-dem hover:underline transition-colors break-all">
                  contact@streetpolynews.com
                </a>
              </div>
            </div>

            <div className="bg-card/50 border border-border rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="What is this about?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Your message..."
                    className="min-h-[120px]"
                  />
                </div>
                
                <Button type="submit" className="w-full bg-dem hover:bg-dem/90 text-white" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Contact;
