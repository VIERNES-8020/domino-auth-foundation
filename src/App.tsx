import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Index from "./pages/Index";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import LeaderboardPage from "./pages/LeaderboardPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import NotFound from "./pages/NotFound";
import AgentsPage from "./pages/AgentsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import AgentPublicPage from "./pages/AgentPublicPage";
import AdminUserManagement from "./pages/AdminUserManagement";
import FranchiseApplicationPage from "./pages/FranchiseApplicationPage";
import VendePage from "./pages/VendePage";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/auth" element={<Index />} />
          <Route path="/solicitar-franquicia" element={<FranchiseApplicationPage />} />
          <Route path="/vende" element={<VendePage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          <Route 
            path="/dashboard/agent" 
            element={
              <ProtectedRoute requiredRole="Agente Inmobiliario">
                <AgentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredRole="Super Administrador">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard/users" 
            element={
              <ProtectedRoute requiredRole="Super Administrador">
                <AdminUserManagement />
              </ProtectedRoute>
            } 
          />
          <Route path="/dashboard/franchise/:franchiseId/leaderboard" element={<LeaderboardPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/agente/:code" element={<AgentPublicPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
