import { createContext } from "react";

export interface CartItem {
  id: number;
  name: string;
  type: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
