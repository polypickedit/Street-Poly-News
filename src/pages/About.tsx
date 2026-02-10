import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";

const About = () => {
  return (
    <PageLayoutWithAds>
      <PageTransition>
        <div className="max-w-3xl mx-auto py-8 md:py-12">
          <h1 className="font-display text-4xl md:text-6xl text-white mb-8">
            About <span className="text-dem">Streetpoly</span> <span className="text-rep">News</span>
          </h1>
          <div className="prose prose-invert max-w-none">
            <p className="font-body text-white/40 text-base md:text-lg leading-relaxed mb-6">
              Streetpoly News is an independent media outlet dedicated to bringing you 
              unfiltered coverage of grassroots movements, political developments, and 
              community voices that mainstream media often overlooks.
            </p>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 md:p-8 my-8">
              <h2 className="font-display text-2xl md:text-3xl text-white mb-4">Our Mission</h2>
              <p className="font-body text-white/40 text-sm md:text-base">
                To amplify the voices of the streets and provide authentic, on-the-ground 
                reporting that matters to real communities. We believe in journalism that 
                serves the people, not the powerful.
              </p>
            </div>
            
            <h2 className="font-display text-2xl md:text-3xl text-white mb-4">What We Cover</h2>
            <ul className="space-y-3 mb-8">
              {[
                "Local and national political movements",
                "Community activism and organizing",
                "Social justice issues",
                "Street-level perspectives on policy",
                "Interviews with everyday people making a difference",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-dem rounded-full mt-2 flex-shrink-0" />
                  <span className="font-body text-white/40 text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="border-t border-white/10 pt-8">
              <h2 className="font-display text-2xl md:text-3xl text-white mb-4">Contact</h2>
              <p className="font-body text-white/40 text-sm md:text-base">
                Have a story tip or want to get in touch? Reach out to us at{" "}
                <a href="mailto:contact@streetpolynews.com" className="text-dem hover:underline transition-colors">
                  contact@streetpolynews.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default About;