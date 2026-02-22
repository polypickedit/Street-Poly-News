import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, ShieldCheck, Users, Youtube } from "lucide-react";

const About = () => {
  const coveragePillars = [
    "Grassroots political movements and local civic power",
    "Policy impacts explained from a street-level perspective",
    "Community organizing, public safety, and justice stories",
    "Independent culture, music, and voices shaping the conversation",
  ];

  const standards = [
    "People first: We prioritize the voices most affected by the issues.",
    "Context over clout: We focus on what matters, not what trends.",
    "Transparent corrections: If we get something wrong, we fix it clearly.",
    "No pay-to-play coverage: Editorial decisions are independent.",
  ];

  return (
    <PageLayoutWithAds>
      <PageTransition>
        <div className="max-w-5xl mx-auto py-8 md:py-12 px-4">
          <header className="mb-10">
            <p className="font-body uppercase tracking-[0.2em] text-dem text-xs md:text-sm mb-3">
              Independent Media Platform
            </p>
            <h1 className="font-display text-4xl md:text-6xl text-white mb-4 leading-tight">
              About <span className="text-dem">Streetpoly</span> <span className="text-rep">News</span>
            </h1>
            <p className="font-body text-white/60 text-base md:text-lg max-w-3xl leading-relaxed">
              Streetpoly News documents real stories from real communities. We report on
              power, policy, and culture from the ground up, with a focus on voices often
              ignored in mainstream narratives.
            </p>
          </header>

          <section className="grid gap-5 md:grid-cols-3 mb-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-dem mb-3">
                <Users className="w-5 h-5" />
                <h2 className="font-display text-xl text-white">Who We Serve</h2>
              </div>
              <p className="font-body text-white/60 text-sm md:text-base leading-relaxed">
                Communities organizing for change, independent creators, and readers who
                want facts with context, not watered-down headlines.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-rep mb-3">
                <ShieldCheck className="w-5 h-5" />
                <h2 className="font-display text-xl text-white">How We Report</h2>
              </div>
              <p className="font-body text-white/60 text-sm md:text-base leading-relaxed">
                We center firsthand voices, verify claims, and publish with accountability.
                Speed matters, but accuracy comes first.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-dem mb-3">
                <Mail className="w-5 h-5" />
                <h2 className="font-display text-xl text-white">Open Line</h2>
              </div>
              <p className="font-body text-white/60 text-sm md:text-base leading-relaxed">
                Tips, corrections, and partnerships are always welcome through our contact
                form and direct email.
              </p>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 mb-10">
            <h2 className="font-display text-2xl md:text-3xl text-white mb-3">Our Mission</h2>
            <p className="font-body text-white/70 text-sm md:text-base leading-relaxed mb-4">
              We exist to make grassroots reporting visible, credible, and impossible to
              ignore. Our goal is to bridge the gap between what communities experience and
              what the wider public understands.
            </p>
            <p className="font-body text-white/70 text-sm md:text-base leading-relaxed">
              Streetpoly News is built for people who want direct reporting without the gatekeeping.
            </p>
          </section>

          <section className="grid gap-8 md:grid-cols-2 mb-10">
            <div>
              <h2 className="font-display text-2xl md:text-3xl text-white mb-4">What We Cover</h2>
              <ul className="space-y-3">
                {coveragePillars.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-dem rounded-full mt-2 flex-shrink-0" />
                    <span className="font-body text-white/70 text-sm md:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl md:text-3xl text-white mb-4">Editorial Standards</h2>
              <ul className="space-y-3">
                {standards.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-rep rounded-full mt-2 flex-shrink-0" />
                    <span className="font-body text-white/70 text-sm md:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="border-t border-white/10 pt-8">
            <h2 className="font-display text-2xl md:text-3xl text-white mb-4">Connect With Us</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="font-body text-white/70 text-sm md:text-base mb-3">
                  Have a story tip, correction, or collaboration request?
                </p>
                <a
                  href="mailto:contact@streetpolynews.com"
                  className="inline-flex items-center gap-2 text-dem hover:text-dem/80 transition-colors font-black uppercase tracking-widest text-xs md:text-sm"
                >
                  contact@streetpolynews.com
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <a
                  href="https://www.youtube.com/@STREETPOLY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-rep hover:text-rep/80 transition-colors font-black uppercase tracking-widest text-xs md:text-sm"
                >
                  <Youtube className="w-5 h-5" />
                  YouTube Channel
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-dem hover:text-dem/80 transition-colors font-black uppercase tracking-widest text-xs md:text-sm"
                >
                  Contact Page
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default About;
