import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import EnhancedLoginPage from "./components/EnhancedLoginPage";
import MemberLogin from "./pages/member/Login";
import ForgotPassword from "./pages/member/ForgotPassword";
import BlockLogin from "./pages/admin/BlockLogin";
import DistrictLogin from "./pages/admin/DistrictLogin";
import StateLogin from "./pages/admin/StateLogin";
import SuperAdminLogin from "./pages/admin/SuperAdminLogin";
import MemberRegister from "./pages/member/Register";
import MemberDashboard from "./pages/member/Dashboard";
import SidebarPage from "./pages/member/SidebarPage";
import Explore from "./pages/member/Explore";
import Notifications from "./pages/member/Notifications";
import ADFForm from "./pages/member/ADF";
import MemberCertificate from "./pages/member/Certificate";
import MemberProfile from "./pages/member/Profile";
import ApplicationSubmitted from "./pages/member/ApplicationSubmitted";
import ApplicationStatus from "./pages/member/ApplicationStatus";
import PaymentPage from "./pages/member/Payment";
import PaymentSuccess from "./pages/member/PaymentSuccess";
import MemberHelp from "./pages/member/Help";
import MemberEvents from "./pages/member/Events";
import Account from "./pages/member/Account";
import PaymentHistory from "./pages/member/PaymentHistory";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSidebarPage from "./pages/admin/SidebarPage";
import Approvals from "./pages/admin/Approvals";
import Members from "./pages/admin/Members";
import Settings from "./pages/admin/Settings";
import ApplicationView from "./pages/admin/ApplicationView";
import SuperAdminGenerate from "./pages/admin/SuperAdminGenerate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<EnhancedLoginPage />} />
          {/* Aliases for member-specific paths used in some pages */}
          <Route path="/member/login" element={<MemberLogin />} />
          <Route path="/member/register" element={<MemberRegister />} />
          <Route path="/member/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<MemberRegister />} />

          {/* Admin Login Routes */}
          <Route path="/admin/block/login" element={<BlockLogin />} />
          <Route path="/admin/district/login" element={<DistrictLogin />} />
          <Route path="/admin/state/login" element={<StateLogin />} />
          <Route path="/admin/super/login" element={<SuperAdminLogin />} />

          {/* Member Routes */}
          <Route path="/member/dashboard" element={<MemberDashboard />} />
          <Route path="/member/sidebar" element={<SidebarPage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/notifications" element={<Notifications />} />
            <Route path="/member/adf" element={<ADFForm />} />
            <Route path="/member/certificate" element={<MemberCertificate />} />
            <Route path="/member/profile" element={<MemberProfile />} />
            <Route path="/member/account" element={<Account />} />
            <Route path="/member/payment-history" element={<PaymentHistory />} />
            <Route path="/member/application-submitted" element={<ApplicationSubmitted />} />
            <Route path="/member/application-status" element={<ApplicationStatus />} />
            <Route path="/member/payment" element={<PaymentPage />} />
            <Route path="/member/payment-success" element={<PaymentSuccess />} />
            <Route path="/member/help" element={<MemberHelp />} />
            <Route path="/member/events" element={<MemberEvents />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/block/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/applications" element={<Approvals />} />
          <Route path="/admin/sidebar" element={<AdminSidebarPage />} />
          <Route path="/admin/approvals" element={<Approvals />} />
          <Route path="/admin/members" element={<Members />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/application/:id" element={<ApplicationView />} />
          
          {/* Super Admin Routes */}
          <Route path="/admin/super/generate" element={<SuperAdminGenerate />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;