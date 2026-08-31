import React, { useState } from 'react';
import { ZenithHero } from './components/zenith/ZenithHero';
import { ZenithProperties } from './components/zenith/ZenithProperties';
import { ZenithHowItWorks } from './components/zenith/ZenithHowItWorks';
import { ZenithAnalytics } from './components/zenith/ZenithAnalytics';
import { PropertyModal } from './components/properties/PropertyModal';
import { OwnerValuation } from './components/owners/OwnerValuation';
import { initialProperties } from './data/initialProperties';
import { Property } from './types/property';
import { agencyConfig } from './config/agencyConfig';

export const ZenithApp: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isValuationOpen, setIsValuationOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSelectProperty = (propId: string) => {
    // Match against our real property catalog
    if (propId === 'prop-vitacura') {
      setSelectedProperty(initialProperties[0]); // Penthouse Vitacura
    } else if (propId === 'prop-lo-barnechea') {
      setSelectedProperty(initialProperties[1]); // Casa Los Trapenses
    } else if (propId === 'prop-melipilla') {
      setSelectedProperty(initialProperties[3]); // Parcela Melipilla
    } else {
      setSelectedProperty(initialProperties[0]);
    }
  };

  const handleBookCall = () => {
    const waUrl = `https://wa.me/${agencyConfig.contact.whatsapp}?text=${encodeURIComponent(
      'Hola Pilar, estoy interesado en agendar una asesoría privada para comprar/vender una propiedad en Santiago.'
    )}`;
    window.open(waUrl, '_blank');
    showToast('Abriendo WhatsApp con Pilar Osorio (+56 9 7909 4519)...');
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#141414] font-lato antialiased selection:bg-[#141414] selection:text-white">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141414] text-white text-[13px] px-6 py-3 shadow-2xl animate-fade-in flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      {/* Floating Switcher Link to switch between views */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <a
          href="/"
          className="bg-white/90 backdrop-blur-md border border-black/10 px-3.5 py-1.5 text-[11px] font-medium text-slate-700 hover:text-black hover:bg-white shadow-sm transition-all"
        >
          ← Volver a UrbeGestión (Original)
        </a>
      </div>

      <main>
        {/* Section 1: Hero & Navbar */}
        <ZenithHero 
          onBookCall={handleBookCall}
          onPostProperty={() => setIsValuationOpen(true)}
        />

        {/* Section 2: Properties */}
        <ZenithProperties onSelectProperty={handleSelectProperty} />

        {/* Section 3: How it Works */}
        <ZenithHowItWorks 
          onFreeConsult={handleBookCall}
        />

        {/* Section 4: Investment / Analytics */}
        <ZenithAnalytics />
      </main>

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

      {/* Note: As explicitly requested, no footer is included */}
    </div>
  );
};

export default ZenithApp;
