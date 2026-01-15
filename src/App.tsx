import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CartProvider } from "@/contexts/CartContext";
import { CartSidebar } from "@/components/CartSidebar";
import { TipButton } from "@/components/TipButton";
import Index from "./pages/Index";
import PostDetail from "./pages/PostDetail";
import Merch from "./pages/Merch";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Search from "./pages/Search";
import Category from "./pages/Category";
import Categories from "./pages/Categories";
import Person from "./pages/Person";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/merch" element={<Merch />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/search" element={<Search />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/person/:slug" element={<Person />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <CartSidebar />
        <TipButton />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
