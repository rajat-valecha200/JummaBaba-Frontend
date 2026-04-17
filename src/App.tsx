import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout, VendorLayout, BuyerLayout, AdminLayout } from "@/components/layout";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SupplierDetailPage from "./pages/SupplierDetailPage";
import LoginPage from "./pages/auth/LoginPage";
import BuyerRegisterPage from "./pages/auth/BuyerRegisterPage";
import SellerRegisterPage from "./pages/auth/SellerRegisterPage";
import PolicyPage from "./pages/PolicyPage";

// Buyer Pages
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import BuyerCart from "./pages/buyer/BuyerCart";
import BuyerOrders from "./pages/buyer/BuyerOrders";
import BuyerRfqs from "./pages/buyer/BuyerRfqs";
import BuyerProfile from "./pages/buyer/BuyerProfile";
import BuyerMessages from "./pages/buyer/BuyerMessages";
import BuyerWishlist from "./pages/buyer/BuyerWishlist";
import CheckoutPage from "./pages/buyer/CheckoutPage";
import OrderConfirmationPage from "./pages/buyer/OrderConfirmationPage";

// Vendor Pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorRfqs from "./pages/vendor/VendorRfqs";
import VendorProfile from "./pages/vendor/VendorProfile";
import VendorMessages from "./pages/vendor/VendorMessages";
import VendorPayouts from "./pages/vendor/VendorPayouts";
import VendorActivity from "./pages/vendor/VendorActivity";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCommissions from "./pages/admin/AdminCommissions";
import AdminMessages from "./pages/admin/AdminMessages";

import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <WishlistProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes with main layout */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/categories" element={<CategoryPage />} />
                <Route path="/products" element={<CategoryPage />} />
                <Route path="/product/:slug" element={<ProductDetailPage />} />
                <Route path="/supplier/:id" element={<SupplierDetailPage />} />
                <Route path="/help" element={<PolicyPage />} />
                <Route path="/privacy" element={<PolicyPage />} />
                <Route path="/terms" element={<PolicyPage />} />
                <Route path="/policy/:type" element={<PolicyPage />} />
              </Route>

              {/* Auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<BuyerRegisterPage />} />
              <Route path="/buyer/register" element={<BuyerRegisterPage />} />
              <Route path="/seller/register" element={<SellerRegisterPage />} />
              <Route path="/vendor/register" element={<SellerRegisterPage />} />

              {/* Buyer dashboard routes */}
              <Route element={<ProtectedRoute allowedRoles={['buyer']}><BuyerLayout /></ProtectedRoute>}>
                <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
                <Route path="/buyer/cart" element={<BuyerCart />} />
                <Route path="/buyer/checkout" element={<CheckoutPage />} />
                <Route path="/buyer/order-confirmation" element={<OrderConfirmationPage />} />
                <Route path="/buyer/wishlist" element={<BuyerWishlist />} />
                <Route path="/buyer/orders" element={<BuyerOrders />} />
                <Route path="/buyer/rfqs" element={<BuyerRfqs />} />
                <Route path="/buyer/messages" element={<BuyerMessages />} />
                <Route path="/buyer/profile" element={<BuyerProfile />} />
                <Route path="/buyer/settings" element={<BuyerDashboard />} />
                <Route path="/post-requirement" element={<BuyerRfqs />} />
              </Route>

              {/* Vendor dashboard routes */}
              <Route element={<ProtectedRoute allowedRoles={['vendor']}><VendorLayout /></ProtectedRoute>}>
                <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                <Route path="/vendor/products" element={<VendorProducts />} />
                <Route path="/vendor/orders" element={<VendorOrders />} />
                <Route path="/vendor/rfqs" element={<VendorRfqs />} />
                <Route path="/vendor/messages" element={<VendorMessages />} />
                <Route path="/vendor/profile" element={<VendorProfile />} />
                <Route path="/vendor/payouts" element={<VendorPayouts />} />
                <Route path="/vendor/activity" element={<VendorActivity />} />
                <Route path="/vendor/settings" element={<VendorDashboard />} />
              </Route>

              {/* Admin dashboard routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
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
        </WishlistProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
