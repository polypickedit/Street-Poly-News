import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { MerchCard } from "@/components/MerchCard";

const mockMerch = [
  {
    id: 1,
    name: "Streetpoly Logo Tee",
    type: "T-Shirt",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    name: "Urban Voices Hoodie",
    type: "Hoodie",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    name: "Movement Graphic Tee",
    type: "T-Shirt",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    name: "Street Culture Hoodie",
    type: "Hoodie",
    price: 64.99,
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop",
  },
  {
    id: 5,
    name: "Resist Classic Tee",
    type: "T-Shirt",
    price: 27.99,
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop",
  },
  {
    id: 6,
    name: "Block Party Zip Hoodie",
    type: "Hoodie",
    price: 69.99,
    image: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=400&h=400&fit=crop",
  },
];

const Merch = () => {
  return (
    <PageLayoutWithAds mainClassName="max-w-7xl mx-auto">
      <PageTransition>
        <div className="px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center mb-12">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-dem/10 flex items-center justify-center mx-auto mb-6 md:mb-8">
              <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-dem" />
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl text-dem mb-4">
              STREETPOLY <span className="text-rep">MERCH</span>
            </h1>
            
            <p className="text-white/40 font-body max-w-xl mx-auto px-4">
              Support independent journalism and wear the message. High-quality apparel 
              for the voices of the street.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {mockMerch.map((item) => (
              <MerchCard key={item.id} item={item} />
            ))}
          </div>

          <div className="text-center">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/10 text-white hover:bg-white/5 font-body uppercase tracking-wider"
            >
              <a
                href="https://yourstore.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Visit Full Store
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Merch;
