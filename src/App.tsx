import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { MainLayout, VendorLayout, BuyerLayout, AdminLayout, EmployeeLayout, ScrollToTop } from "@/components/layout";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MaintenanceGuard } from "@/components/auth/MaintenanceGuard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import SupplierDetailPage from "./pages/SupplierDetailPage";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import BuyerRegisterPage from "./pages/auth/BuyerRegisterPage";
import SellerRegisterPage from "./pages/auth/SellerRegisterPage";
import PolicyPage from "./pages/PolicyPage";
import GenesisSetup from "./pages/GenesisSetup";
import SuppliersPage from "./pages/SuppliersPage";

// Buyer Pages
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import BuyerCart from "./pages/buyer/BuyerCart";
import BuyerOrders from "./pages/buyer/BuyerOrders";
import BuyerDirectOrders from "./pages/buyer/BuyerDirectOrders";
import BuyerRfqs from "./pages/buyer/BuyerRfqs";
import RfqDetailPage from "./pages/shared/RfqDetailPage";
import BuyerProfile from "./pages/buyer/BuyerProfile";
import BuyerMessages from "./pages/buyer/BuyerMessages";
import BuyerWishlist from "./pages/buyer/BuyerWishlist";
import CheckoutPage from "./pages/buyer/CheckoutPage";
import OrderConfirmationPage from "./pages/buyer/OrderConfirmationPage";
import PostRfqPage from "./pages/buyer/PostRfqPage";
import BuyerSettings from "./pages/buyer/BuyerSettings";
import InvoicePage from "./pages/buyer/InvoicePage";
import RfqPaymentPage from "./pages/buyer/RfqPaymentPage";

// Vendor Pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorDirectOrders from "./pages/vendor/VendorDirectOrders";
import VendorPOPage from "./pages/vendor/VendorPOPage";
import VendorRfqs from "./pages/vendor/VendorRfqs";
import VendorProfile from "./pages/vendor/VendorProfile";
import VendorMessages from "./pages/vendor/VendorMessages";
import VendorPayouts from "./pages/vendor/VendorPayouts";
import VendorActivity from "./pages/vendor/VendorActivity";
import VendorSettings from "./pages/vendor/VendorSettings";
import VendorEarnings from "./pages/vendor/VendorEarnings";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCommissions from "./pages/admin/AdminCommissions";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminRfqs from "./pages/admin/AdminRfqs";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDirectOrders from "./pages/admin/AdminDirectOrders";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminEmployeeDetail from "./pages/admin/AdminEmployeeDetail";
import AdminReferralDetail from "./pages/admin/AdminReferralDetail";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeReferrals from "./pages/employee/EmployeeReferrals";
import EmployeeLeads from "./pages/employee/EmployeeLeads";
import EmployeePoints from "./pages/employee/EmployeePoints";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import { captureReferralFromUrl } from "@/lib/referral";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminEarnings from "./pages/admin/AdminEarnings";
import AdminWaitlist from "./pages/admin/AdminWaitlist";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Picks a shared referral link's ?ref=CODE out of the URL on any page and remembers it, so it's
// still there when the visitor eventually gets to a signup form.
const RefCapture = () => {
  const { search } = useLocation();
  useEffect(() => captureReferralFromUrl(search), [search]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WishlistProvider>
          <BrowserRouter basename={(import.meta.env.VITE_BASE_PATH || "/").replace(/\/$/, "") || "/"}>
            <ScrollToTop />
            <RefCapture />
            <MaintenanceGuard>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes with main layout */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/categories" element={<CategoryPage />} />
                  <Route path="/products" element={<CategoryPage />} />
                  <Route path="/product/:slug" element={<ProductDetailPage />} />
                  <Route path="/supplier/:id" element={<SupplierDetailPage />} />
                  <Route path="/suppliers" element={<SuppliersPage />} />
                  <Route path="/help" element={<PolicyPage />} />
                  <Route path="/privacy" element={<PolicyPage />} />
                  <Route path="/terms" element={<PolicyPage />} />
                  <Route path="/cancellation-policy" element={<PolicyPage />} />
                  <Route path="/refund-policy" element={<PolicyPage />} />
                  <Route path="/shipping-policy" element={<PolicyPage />} />
                  <Route path="/contact" element={<PolicyPage />} />
                  <Route path="/policy/:type" element={<PolicyPage />} />
                  <Route path="/genesis-setup" element={<GenesisSetup />} />
                </Route>

                {/* Auth routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/register" element={<BuyerRegisterPage />} />
                <Route path="/buyer/register" element={<BuyerRegisterPage />} />
                <Route path="/seller/register" element={<SellerRegisterPage />} />
                <Route path="/vendor/register" element={<SellerRegisterPage />} />

                {/* Buyer dashboard routes */}
                <Route element={<ProtectedRoute allowedRoles={['buyer']}><BuyerLayout /></ProtectedRoute>}>
                  <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
                  <Route path="/buyer/cart" element={<BuyerCart />} />
                  <Route path="/buyer/checkout" element={<CheckoutPage />} />
                  <Route path="/buyer/rfq-payment/:rfqId" element={<RfqPaymentPage />} />
                  <Route path="/buyer/invoice/:rfqId" element={<InvoicePage />} />
                  <Route path="/buyer/order-confirmation" element={<OrderConfirmationPage />} />
                  <Route path="/buyer/wishlist" element={<BuyerWishlist />} />
                  <Route path="/buyer/orders" element={<BuyerOrders />} />
                  <Route path="/buyer/direct-orders" element={<BuyerDirectOrders />} />
                  <Route path="/buyer/rfqs" element={<BuyerRfqs />} />
                  <Route path="/buyer/rfqs/:id" element={<RfqDetailPage role="buyer" />} />
                  <Route path="/buyer/messages" element={<BuyerMessages />} />
                  <Route path="/buyer/profile" element={<BuyerProfile />} />
                  <Route path="/buyer/settings" element={<BuyerSettings />} />
                  <Route path="/post-requirement" element={<PostRfqPage />} />
                </Route>

                {/* Vendor dashboard routes */}
                <Route element={<ProtectedRoute allowedRoles={['vendor']}><VendorLayout /></ProtectedRoute>}>
                  <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                  <Route path="/vendor/products" element={<VendorProducts />} />
                  <Route path="/vendor/orders" element={<VendorOrders />} />
                  <Route path="/vendor/direct-orders" element={<VendorDirectOrders />} />
                  <Route path="/vendor/po/:rfqId" element={<VendorPOPage />} />
                  <Route path="/vendor/rfqs" element={<VendorRfqs />} />
                  <Route path="/vendor/rfqs/:id" element={<RfqDetailPage role="vendor" />} />
                  <Route path="/vendor/messages" element={<VendorMessages />} />
                  <Route path="/vendor/profile" element={<VendorProfile />} />
                  <Route path="/vendor/payouts" element={<VendorPayouts />} />
                  <Route path="/vendor/activity" element={<VendorActivity />} />
                  <Route path="/vendor/settings" element={<VendorSettings />} />
                  <Route path="/vendor/earnings" element={<VendorEarnings />} />
                </Route>

                {/* Admin dashboard routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/messages" element={<AdminMessages />} />
                  <Route path="/admin/rfqs" element={<AdminRfqs />} />
                  <Route path="/admin/rfqs/:id" element={<RfqDetailPage role="admin" />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/direct-orders" element={<AdminDirectOrders />} />
                  <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
                  <Route path="/admin/vendors" element={<AdminVendors />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/commissions" element={<AdminCommissions />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/waitlist" element={<AdminWaitlist />} />
                  <Route path="/admin/categories" element={<AdminCategories />} />
                  <Route path="/admin/earnings" element={<AdminEarnings />} />
                  <Route path="/admin/employees" element={<AdminEmployees />} />
                  <Route path="/admin/employees/:id" element={<AdminEmployeeDetail />} />
                  <Route path="/admin/employees/:id/referrals/:userId" element={<AdminReferralDetail />} />
                </Route>

                {/* Employee (referral partner) portal */}
                <Route element={<ProtectedRoute allowedRoles={['employee']}><EmployeeLayout /></ProtectedRoute>}>
                  <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
                  <Route path="/employee/referrals" element={<EmployeeReferrals />} />
                  <Route path="/employee/leads" element={<EmployeeLeads />} />
                  <Route path="/employee/points" element={<EmployeePoints />} />
                  <Route path="/employee/profile" element={<EmployeeProfile />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </MaintenanceGuard>
          </BrowserRouter>
        </WishlistProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
