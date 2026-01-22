import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export const CartSidebar = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-dem" />
            YOUR CART
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="font-body text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-background/50 rounded-lg border border-border"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-body uppercase tracking-wider text-dem">
                      {item.type}
                    </span>
                    <h4 className="font-display text-sm text-foreground truncate">
                      {item.name}
                    </h4>
                    {(item.size || item.color) && (
                      <p className="text-xs font-body text-muted-foreground mt-0.5">
                        {item.size}{item.size && item.color && " / "}{item.color}
                      </p>
                    )}
                    <p className="font-body text-foreground mt-1">
                      ${item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 border-border"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-body text-sm w-6 text-center text-foreground">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 border-border"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-body text-muted-foreground">Subtotal</span>
                <span className="font-display text-2xl text-foreground">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <Button
                className="w-full bg-dem hover:bg-dem/90 text-dem-foreground font-body uppercase tracking-wider"
                size="lg"
              >
                Checkout
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground font-body"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
