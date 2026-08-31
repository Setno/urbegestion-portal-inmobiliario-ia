import React, { useState, useEffect } from 'react';
import { AgencyPitchBanner } from './components/pitch/AgencyPitchBanner';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { SearchFilterBar } from './components/search/SearchFilterBar';
import { PropertyGrid } from './components/properties/PropertyGrid';
import { PropertyModal } from './components/properties/PropertyModal';
import { OwnerValuation } from './components/owners/OwnerValuation';
import { AboutSection } from './components/sections/AboutSection';
import { TestimonialsSection } from './components/sections/TestimonialsSection';
import { Footer } from './components/layout/Footer';
import { MobileQuickBar } from './components/layout/MobileQuickBar';
import { AiChatWidget } from './components/chat/AiChatWidget';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/auth/AdminLoginModal';
import { useBrandStore } from './stores/useBrandStore';
import { Property } from './types/property';

export const App: React.FC = () => {
  const { themeColors, layoutConfig } = useBrandStore();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isValuationOpen, setIsValuationOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-urbe-primary', themeColors.primary);
    document.documentElement.style.setProperty('--color-urbe-primary-dark', themeColors.primaryDark);
    document.documentElement.style.setProperty('--color-urbe-accent', themeColors.accent);
    document.documentElement.style.setProperty('--color-urbe-accent-hover', themeColors.accentHover);
  }, [themeColors]);

  const handleOpenBooking = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleRequestAdminAccess = () => {
    const isAuth = sessionStorage.getItem('urbe_admin_authenticated') === 'true';
    if (isAuth) {
      setIsAdminOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
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

      {/* Protected Admin Dashboard & CRM Kanban */}
      <AdminDashboard 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
      />

      {/* Role-Based Authentication / Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsAdminOpen(true)}
      />

    </div>
  );
};

export default App;
