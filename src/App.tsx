import React, { useState, useEffect } from 'react';
import { AgencyPitchBanner } from './site/components/AgencyPitchBanner';
import { Navbar } from './site/components/Navbar';
import { HeroSection } from './site/components/HeroSection';
import { SearchFilterBar } from './modules/catalogo/components/SearchFilterBar';
import { PropertyGrid } from './modules/catalogo/components/PropertyGrid';
import { PropertyModal } from './modules/catalogo/components/PropertyModal';
import { OwnerValuation } from './modules/captacion/components/OwnerValuation';
import { AboutSection } from './site/components/AboutSection';
import { TestimonialsSection } from './site/components/TestimonialsSection';
import { Footer } from './site/components/Footer';
import { MobileQuickBar } from './site/components/MobileQuickBar';
import { AiChatWidget } from './modules/captacion/components/AiChatWidget';
import { AdminDashboard } from './core/admin/AdminDashboard';
import { ADMIN_ENABLED } from './core/config/adminAccess';
import { useBrandStore } from './core/brand/useBrandStore';
import { useAuthStore } from './core/auth/useAuthStore';
import { usePropertyStore } from './modules/catalogo/stores/usePropertyStore';
import { useMarketStore } from './core/market/useMarketStore';
import { Property } from './modules/catalogo/types/property';

export const App: React.FC = () => {
  const { themeColors, layoutConfig } = useBrandStore();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isValuationOpen, setIsValuationOpen] = useState(false);
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-urbe-primary', themeColors.primary);
    document.documentElement.style.setProperty('--color-urbe-primary-dark', themeColors.primaryDark);
    document.documentElement.style.setProperty('--color-urbe-accent', themeColors.accent);
    document.documentElement.style.setProperty('--color-urbe-accent-hover', themeColors.accentHover);
  }, [themeColors]);

  // Con Supabase, el catálogo público y el mercado y las zonas de la corredora se leen de la base (sin Supabase no hace nada)
  useEffect(() => {
    void usePropertyStore.getState().load();
    void useMarketStore.getState().load();
  }, []);

  // Restaura la sesión al cargar y escucha cambios (ingreso, salida, enlace de recuperación de clave)
  useEffect(() => {
    if (ADMIN_ENABLED) void useAuthStore.getState().init();
  }, []);

  // El enlace del correo de recuperación abre el sitio: se muestra de inmediato el formulario de clave nueva
  useEffect(() => {
    if (authStatus === 'recuperando') setIsAdminOpen(true);
  }, [authStatus]);

  const handleOpenBooking = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleRequestAdminAccess = () => {
    if (ADMIN_ENABLED) setIsAdminOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-urbe-accent/30 selection:text-urbe-primary">
      
      {/* Top Demo Pitch Banner for AI Agency Presentations */}
      <AgencyPitchBanner onOpenAdmin={handleRequestAdminAccess} />

      {/* Main Sticky Navbar (Mobile-First) */}
      <Navbar 
        onOpenAdmin={handleRequestAdminAccess} 
        onOpenValuation={() => setIsValuationOpen(true)} 
      />

      <main>
        {/* Luxury Hero Section */}
        <HeroSection onOpenValuation={() => setIsValuationOpen(true)} />

        {/* Real-Time Multi-Filter Search Bar */}
        {layoutConfig.showSearchFilter && <SearchFilterBar />}

        {/* Dynamic Property Catalog Grid */}
        <PropertyGrid 
          onOpenDetails={(prop) => setSelectedProperty(prop)}
          onOpenBooking={handleOpenBooking}
        />

        {/* About & Trust Section */}
        {layoutConfig.showAboutSection && <AboutSection />}

        {/* Real Testimonials from Former ACOP President & Clients */}
        {layoutConfig.showTestimonialsSection && <TestimonialsSection />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Sticky Mobile Quick Access Bottom Bar (Mobile Only) */}
      <MobileQuickBar />

      {/* 24/7 AI Concierge Chatbot Widget */}
      {layoutConfig.showAiChat && (
        <AiChatWidget onOpenPropertyModal={(prop) => setSelectedProperty(prop)} />
      )}

      {/* Full Property Technical Sheet Modal with Location Map */}
      <PropertyModal 
        property={selectedProperty} 
        onClose={() => setSelectedProperty(null)} 
      />

      {/* Property Owner Valuation / Capture Form */}
      <OwnerValuation 
        isOpen={isValuationOpen} 
        onClose={() => setIsValuationOpen(false)} 
      />

      {/* Admin Dashboard & CRM Kanban (solo si Supabase está configurado; exige iniciar sesión) */}
      {ADMIN_ENABLED && (
        <AdminDashboard
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

    </div>
  );
};

export default App;
