import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/providers/AdminProvider";
import { CartSidebar } from "@/components/CartSidebar";
import { TipButton } from "@/components/TipButton";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import PostDetail from "./pages/PostDetail";
import Merch from "./pages/Merch";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import Booking from "./pages/Booking";
import Dashboard from "./pages/Dashboard";
import OrderDetails from "./pages/OrderDetails";
import Admin from "./pages/Admin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { SubmissionQueue } from "@/components/admin/SubmissionQueue";
import { PlaylistManager } from "@/components/admin/PlaylistManager";
import { PlacementManager } from "@/components/admin/PlacementManager";
import { OutletManager } from "@/components/admin/OutletManager";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { UnifiedQueue } from "@/components/admin/UnifiedQueue";
import { AdminOverlay } from "@/components/admin/AdminOverlay";
import { AdminRoute } from "@/components/AdminRoute";
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
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/booking" element={<Booking />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/queue"
          element={
            <AdminRoute>
              <AdminLayout>
                <UnifiedQueue />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/submissions"
          element={
            <AdminRoute>
              <AdminLayout>
                <SubmissionQueue />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/playlists"
          element={
            <AdminRoute>
              <AdminLayout>
                <PlaylistManager />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/outlets"
          element={
            <AdminRoute>
              <AdminLayout>
                <OutletManager />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/placements"
          element={
            <AdminRoute>
              <AdminLayout>
                <PlacementManager />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/legacy"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
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
    <AuthProvider>
      <AdminProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-white text-foreground font-sans selection:bg-dem/30">
                <AdminOverlay />
                <AnimatedRoutes />
                <CartSidebar />
                <TipButton />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
