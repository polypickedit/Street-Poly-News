import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingCart, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface Product {
  id: string;
  source: 'stripe' | 'ecwid' | 'internal';
  category: 'join' | 'book' | 'learn' | 'shop';
  entitlement_key: string;
  price: number;
  status: 'active' | 'archived' | 'draft';
  title: string;
  description?: string;
  image_url?: string;
}

interface ProductCardProps {
  product: Product;
  onPurchase: (product: Product) => Promise<void>;
  className?: string;
}

export function ProductCard({ product, onPurchase, className }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (loading || product.status !== 'active') return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onPurchase(product);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Purchase initialization failed";
      setError(message);
      console.error(`[ProductCard] Purchase error for ${product.id}:`, err);
      
      toast({
        title: "Purchase Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isStripe = product.source === 'stripe';
  const isEcwid = product.source === 'ecwid';

  return (
    <Card className={cn("overflow-hidden flex flex-col h-full hover:shadow-lg transition-all duration-300", className)}>
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden bg-muted">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.title}
            className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No Image
          </div>
        )}
        
        {/* Status Badge */}
        {product.status !== 'active' && (
          <div className="absolute top-2 right-2 bg-yellow-500/90 text-black px-2 py-1 text-xs font-bold rounded">
            {product.status.toUpperCase()}
          </div>
        )}
      </div>

      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-bold leading-tight line-clamp-2">
            {product.title}
          </CardTitle>
          <span className="font-mono font-semibold text-lg whitespace-nowrap">
            ${(product.price / 100).toFixed(2)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {product.description || "No description available."}
        </p>
        
        {/* Error State */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive text-xs rounded-md flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2">
        <Button 
          className="w-full font-semibold relative overflow-hidden" 
          onClick={handlePurchase} 
          disabled={loading || product.status !== 'active'}
          variant={isStripe ? "default" : "secondary"}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {isStripe ? (
                <CreditCard className="mr-2 h-4 w-4" />
              ) : (
                <ShoppingCart className="mr-2 h-4 w-4" />
              )}
              {isStripe ? "Buy Now" : isEcwid ? "Add to Cart" : "Buy Now"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
