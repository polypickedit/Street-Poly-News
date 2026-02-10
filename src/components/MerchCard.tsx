import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/hooks/use-cart";
import { toast } from "@/hooks/use-toast";

const sizes = ["XS", "S", "M", "L", "XL", "2XL"];
const colors = [
  { name: "Black", value: "black", hex: "#1a1a1a" },
  { name: "White", value: "white", hex: "#f5f5f5" },
  { name: "Red", value: "red", hex: "#dc2626" },
  { name: "Navy", value: "navy", hex: "#1e3a5f" },
];

interface MerchItem {
  id: number;
  name: string;
  type: string;
  price: number;
  image: string;
}

interface MerchCardProps {
  item: MerchItem;
}

export const MerchCard = ({ item }: MerchCardProps) => {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      toast({
        title: "Please select options",
        description: "Choose a size and color before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    const colorName = colors.find((c) => c.value === selectedColor)?.name || selectedColor;
    
    addItem({
      id: item.id * 1000 + sizes.indexOf(selectedSize) * 10 + colors.findIndex((c) => c.value === selectedColor),
      name: item.name,
      type: item.type,
      price: item.price,
      image: item.image,
      size: selectedSize,
      color: colorName,
    });
    
    toast({
      title: "Added to cart",
      description: `${item.name} (${selectedSize}, ${colorName}) added to your cart.`,
    });
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden group hover:border-dem/50 transition-colors">
      <div className="aspect-square overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <span className="text-xs font-body uppercase tracking-wider text-dem">
          {item.type}
        </span>
        <h3 className="font-display text-xl text-white mt-1">
          {item.name}
        </h3>
        <p className="font-body text-lg text-white mt-2">
          ${item.price.toFixed(2)}
        </p>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger className="bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent className="bg-dem-dark border-white/10 z-50">
              {sizes.map((size) => (
                <SelectItem key={size} value={size} className="text-white hover:bg-white/10">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedColor} onValueChange={setSelectedColor}>
            <SelectTrigger className="bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent className="bg-dem-dark border-white/10 z-50">
              {colors.map((color) => (
                <SelectItem key={color.value} value={color.value} className="text-white hover:bg-white/10">
                  <div className="flex items-center gap-2">
                    <style>{`.color-swatch-${color.value.replace(/[^a-zA-Z0-9]/g, '-')} { background-color: ${color.hex}; }`}</style>
                    <span
                      className={`w-4 h-4 rounded-full border border-white/10 shrink-0 color-swatch-${color.value.replace(/[^a-zA-Z0-9]/g, '-')}`}
                    />
                    {color.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full mt-4 bg-dem hover:bg-dem/90 text-white font-body uppercase text-xs tracking-wider"
          onClick={handleAddToCart}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
};
