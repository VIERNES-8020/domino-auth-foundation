import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import PropertiesPage from "@/pages/PropertiesPage";
import PropertyDetailPage from "@/pages/PropertyDetailPage";
import VendePage from "@/pages/VendePage";
import AgentsPage from "@/pages/AgentsPage";
import AgentPublicPage from "@/pages/AgentPublicPage";
import ClientsPage from "@/pages/ClientsPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import FranchiseApplicationPage from "@/pages/FranchiseApplicationPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import NotFound from "@/pages/NotFound";

export default function PublicPortal() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/propiedades" element={<PropertiesPage />} />
            <Route path="/propiedad/:id" element={<PropertyDetailPage />} />
            <Route path="/vende" element={<VendePage />} />
            <Route path="/agentes" element={<AgentsPage />} />
            <Route path="/nuestros-agentes" element={<AgentsPage />} />
            <Route path="/agente/:agentCode" element={<AgentPublicPage />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/nuestros-clientes" element={<ClientsPage />} />
            <Route path="/sobre-nosotros" element={<AboutPage />} />
            <Route path="/contacto" element={<ContactPage />} />
            <Route path="/franquicia" element={<FranchiseApplicationPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster />
    </SidebarProvider>
  );
}