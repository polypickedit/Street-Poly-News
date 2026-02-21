import { PageLayoutWithAds } from "@/components/PageLayoutWithAds";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { ProductCard, Product } from "@/components/store/ProductCard";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { PayPalStabilizerModal } from "@/components/PayPalStabilizerModal";
import { supabase } from "@/integrations/supabase/client";

const Merch = () => {
  const { addItem, setIsOpen: setCartOpen } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // PayPal Stabilizer State
  const [isPayPalModalOpen, setIsPayPalModalOpen] = useState(false);
  const [payPalInitialData, setPayPalInitialData] = useState<{ slot_type?: string; notes?: string }>({});
  const ENABLE_PAYPAL_STABILIZER = true;

  useEffect(() => {
    async function fetchProducts() {
      try {
        // @ts-expect-error: products table not in types yet
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', 'shop')
          .eq('status', 'active');

        if (error) {
          console.error('Error fetching products:', error);
          toast.error("Failed to load products");
          return;
        }

        if (data) {
          setProducts(data as unknown as Product[]);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

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
      image: product.image_url || "/placeholder.svg",
    });
    setCartOpen(true);
    toast.success(`${product.title} added to cart!`);
  };

  return (
    <PageLayoutWithAds>
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold font-display uppercase tracking-wider mb-2">
                Street Merch
              </h1>
              <p className="text-muted-foreground">
                Support the movement. Wear the culture.
              </p>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Partner Store
              </Button>
            </div>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="h-[400px] bg-muted/20 animate-pulse rounded-lg" />
               ))}
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onPurchase={handlePurchase}
                />
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No products available at the moment.
                </div>
              )}
            </div>
          )}

          <div className="bg-muted/30 rounded-lg p-8 text-center max-w-2xl mx-auto">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">More Coming Soon</h2>
            <p className="text-muted-foreground">
              We're constantly collaborating with local artists to bring you fresh designs.
              Check back often for limited edition drops.
            </p>
          </div>
        </div>
      </PageTransition>

      <PayPalStabilizerModal
        isOpen={isPayPalModalOpen}
        onClose={() => setIsPayPalModalOpen(false)}
        initialData={payPalInitialData}
      />
    </PageLayoutWithAds>
  );
};

export default Merch;
