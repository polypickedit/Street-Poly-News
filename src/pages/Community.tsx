import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export default function Community() {
  const { user } = useAuth();

  return (
    <PageLayoutWithAds>
      <PageTransition>
        <div className="px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-5 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Community & Dialogue</p>
            <h1 className="font-display text-4xl md:text-5xl text-white font-black uppercase">Circle & Community Space</h1>
            <p className="text-white/70">
              The Circle is where members hold salons, share filings, and keep the conversation grounded. Passes and entitlements
              grant deeper rooms.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {user ? (
                <Button asChild className="rounded-full px-8 bg-dem text-white font-black text-xs uppercase tracking-[0.4em]">
                  <Link to="/dashboard">Enter your Circle</Link>
                </Button>
              ) : (
                <Button asChild className="rounded-full px-8 bg-dem text-white font-black text-xs uppercase tracking-[0.4em]">
                  <Link to="/login">Sign In to Join</Link>
                </Button>
              )}
            </div>
          </div>

          <section className="mt-16 space-y-10">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
              <h2 className="font-display text-2xl text-white font-black uppercase">Membership Pitch</h2>
              <p className="text-white/70">
                Annual membership keeps the Circle alive: early access to events, moderated salons, and a private resource desk. You can
                stay connected without full membership, but entitlements unlock the deeper rooms instantly.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full px-8 bg-dem text-white font-black text-xs uppercase tracking-[0.4em]">
                  <Link to="/booking?type=membership">Request Membership Pass</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-8 text-xs uppercase tracking-[0.4em]">
                  <a href="mailto:hello@streetpolynews.com">Ask a question</a>
                </Button>
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
              <h2 className="font-display text-2xl text-white font-black uppercase">Living Rooms</h2>
              <p className="text-white/70">
                Live salons, member stories, and resource desk updates rotate weekly. Members get push notifications and access to
                exclusive archives.
              </p>
            </article>
          </section>
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
}
