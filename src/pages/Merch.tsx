import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { ProductCard, Product } from "@/components/store/ProductCard";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useState } from "react";
import { PayPalStabilizerModal } from "@/components/PayPalStabilizerModal";

const mockMerch: Product[] = [
  {
    id: "1",
    title: "Streetpoly Logo Tee",
    category: "shop",
    source: "internal",
    entitlement_key: "merch_tee_logo",
    status: "active",
    price: 2999,
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    description: "Classic logo tee."
  },
  {
    id: "2",
    title: "Urban Voices Hoodie",
    category: "shop",
    source: "internal",
    entitlement_key: "merch_hoodie_urban",
    status: "active",
    price: 5999,
    image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
    description: "Premium heavyweight hoodie."
  },
  {
    id: "3",
    title: "Movement Graphic Tee",
    category: "shop",
    source: "internal",
    entitlement_key: "merch_tee_movement",
    status: "active",
    price: 3499,
    image_url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop",
    description: "Graphic tee with movement design."
  },
  {
    id: "4",
    title: "Street Culture Hoodie",
    category: "shop",
    source: "internal",
    entitlement_key: "merch_hoodie_culture",
    status: "active",
    price: 6499,
    image_url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop",
    description: "Street culture inspired hoodie."
  },
  {
    id: "5",
    title: "Resist Classic Tee",
    category: "shop",
    source: "internal",
    entitlement_key: "merch_tee_resist",
    status: "active",
    price: 2799,
    image_url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop",
    description: "Classic resist tee."
  },
  {
    id: "6",
    title: "Block Party Zip Hoodie",
    category: "shop",
    source: "internal",
    entitlement_key: "merch_hoodie_block",
    status: "active",
    price: 6999,
    image_url: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=400&h=400&fit=crop",
    description: "Zip hoodie for block parties."
  },
];

const Merch = () => {
  const { addItem } = useCart();
  
  // PayPal Stabilizer State
  const [isPayPalModalOpen, setIsPayPalModalOpen] = useState(false);
  const [payPalInitialData, setPayPalInitialData] = useState<{ slot_type?: string; notes?: string }>({});
  const ENABLE_PAYPAL_STABILIZER = true;

  const handlePurchase = async (product: Product) => {
    if (ENABLE_PAYPAL_STABILIZER) {
      setPayPalInitialData({ 
        slot_type: "merch",
        notes: `Product: ${product.title} (${product.id})`
      });
      setIsPayPalModalOpen(true);
      return;
    }

    addItem({
      id: product.id,
      name: product.title,
      type: "merch",
      price: product.price / 100,
      image: product.image_url || "",
    });
    toast.success(`${product.title} added to cart`);
  };

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
            {mockMerch.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onPurchase={handlePurchase}
              />
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

        <PayPalStabilizerModal
          isOpen={isPayPalModalOpen}
          onClose={() => setIsPayPalModalOpen(false)}
          initialData={payPalInitialData}
        />
      </PageTransition>
    </PageLayoutWithAds>
  );
};

export default Merch;
