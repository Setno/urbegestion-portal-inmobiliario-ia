import React, { useState } from 'react';
import { AgencyPitchBanner } from './components/pitch/AgencyPitchBanner';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { SearchFilterBar } from './components/search/SearchFilterBar';
import { PropertyGrid } from './components/properties/PropertyGrid';
import { PropertyModal } from './components/properties/PropertyModal';
import { OwnerValuation } from './components/owners/OwnerValuation';
import { AboutSection } from './components/sections/AboutSection';
import { TestimonialsSection } from './components/sections/TestimonialsSection';
import { InstagramSection } from './components/sections/InstagramSection';
import { Footer } from './components/layout/Footer';
import { MobileQuickBar } from './components/layout/MobileQuickBar';
import { AiChatWidget } from './components/chat/AiChatWidget';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Property } from './types/property';

export const App: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isValuationOpen, setIsValuationOpen] = useState(false);

  const handleOpenBooking = (property: Property) => {
    setSelectedProperty(property);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-urbe-accent/30 selection:text-urbe-primary">
      
      {/* Top Demo Pitch Banner for AI Agency Presentations */}
      <AgencyPitchBanner onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Main Sticky Navbar (Mobile-First) */}
      <Navbar 
        onOpenAdmin={() => setIsAdminOpen(true)} 
        onOpenValuation={() => setIsValuationOpen(true)} 
      />

      <main>
        {/* Luxury Hero Section */}
        <HeroSection onOpenValuation={() => setIsValuationOpen(true)} />

        {/* Real-Time Multi-Filter Search Bar */}
        <SearchFilterBar />

        {/* Dynamic Property Catalog Grid */}
        <PropertyGrid 
          onOpenDetails={(prop) => setSelectedProperty(prop)}
          onOpenBooking={handleOpenBooking}
        />

        {/* About & Trust Section (Pilar Osorio - 25+ Years Experience) */}
        <AboutSection />

        {/* Instagram Community Section (@urbegestion) */}
        <InstagramSection />

        {/* Real Testimonials from Former ACOP President & Clients */}
        <TestimonialsSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Sticky Mobile Quick Access Bottom Bar (Mobile Only) */}
      <MobileQuickBar />

      {/* 24/7 AI Concierge Chatbot Widget */}
      <AiChatWidget onOpenPropertyModal={(prop) => setSelectedProperty(prop)} />

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

      {/* Auto-Manageable Admin Dashboard & CRM Kanban (Mobile Optimized) */}
      <AdminDashboard 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
      />

    </div>
  );
};

export default App;
