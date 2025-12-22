import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout, VendorLayout, BuyerLayout, AdminLayout } from "@/components/layout";

// Pages
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/auth/LoginPage";

// Buyer Pages
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import BuyerCart from "./pages/buyer/BuyerCart";
import BuyerOrders from "./pages/buyer/BuyerOrders";
import BuyerRfqs from "./pages/buyer/BuyerRfqs";
import BuyerProfile from "./pages/buyer/BuyerProfile";
import BuyerMessages from "./pages/buyer/BuyerMessages";

// Vendor Pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorRfqs from "./pages/vendor/VendorRfqs";
import VendorProfile from "./pages/vendor/VendorProfile";
import VendorMessages from "./pages/vendor/VendorMessages";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCommissions from "./pages/admin/AdminCommissions";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes with main layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/products" element={<CategoryPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
          </Route>

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />
          <Route path="/vendor/register" element={<LoginPage />} />

          {/* Buyer dashboard routes */}
          <Route element={<BuyerLayout />}>
            <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
            <Route path="/buyer/cart" element={<BuyerCart />} />
            <Route path="/buyer/orders" element={<BuyerOrders />} />
            <Route path="/buyer/rfqs" element={<BuyerRfqs />} />
            <Route path="/buyer/messages" element={<BuyerMessages />} />
            <Route path="/buyer/profile" element={<BuyerProfile />} />
            <Route path="/buyer/settings" element={<BuyerDashboard />} />
          </Route>

          {/* Vendor dashboard routes */}
          <Route element={<VendorLayout />}>
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/vendor/products" element={<VendorProducts />} />
            <Route path="/vendor/orders" element={<VendorOrders />} />
            <Route path="/vendor/rfqs" element={<VendorRfqs />} />
            <Route path="/vendor/messages" element={<VendorMessages />} />
            <Route path="/vendor/profile" element={<VendorProfile />} />
            <Route path="/vendor/settings" element={<VendorDashboard />} />
          </Route>

          {/* Admin dashboard routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/vendors" element={<AdminVendors />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/commissions" element={<AdminCommissions />} />
            <Route path="/admin/settings" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
