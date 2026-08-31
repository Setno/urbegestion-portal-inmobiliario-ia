import React from 'react';
import { motion } from 'framer-motion';
import { ZenithNavbar } from './ZenithNavbar';

interface ZenithHeroProps {
  onBookCall?: () => void;
  onPostProperty?: () => void;
}

export const ZenithHero: React.FC<ZenithHeroProps> = ({ onBookCall, onPostProperty }) => {
  return (
    <section id="hero" className="relative h-screen w-full overflow-hidden bg-[#F8F8F8]">
      
      {/* Background Video: Absolutely positioned, covering the full area */}
      <video 
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_144509_89e2d612-8af2-45c3-90f4-4831bc60715d.mp4" 
        autoPlay 
        muted 
        loop 
        playsInline 
        className="absolute top-0 left-0 w-full h-full object-cover z-0" 
      />

      {/* Content Overlay: Over the video, use a relative wrapper with z-10 and bg-white/10 */}
      <div className="relative z-10 w-full h-full bg-white/10 flex flex-col justify-between">
        
        {/* Top Navbar */}
        <ZenithNavbar onPostProperty={onPostProperty} onBookCall={onBookCall} />

        {/* Hero Main Content */}
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pb-16 md:pb-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6 items-end">
            
            {/* Left Side: Headline and Button (md:col-span-8) */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col items-start">
              
              {/* Headline: "Descubre el espacio donde verdaderamente perteneces" */}
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-5xl lg:text-7xl font-medium tracking-tight leading-[1.05] text-[#141414] mb-8 md:mb-10 max-w-3xl"
              >
                Descubre el espacio donde verdaderamente perteneces
              </motion.h1>

              {/* Button: "Agendar Asesoría" (animate fade in with delay 0.6) */}
              <motion.button 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                onClick={onBookCall}
                className="bg-[#141414] text-white px-9 py-4 text-[13px] font-medium uppercase tracking-wider shadow-2xl hover:bg-black/90 transition-all cursor-pointer hover:shadow-black/20"
              >
                Agendar asesoría
              </motion.button>
            </div>

            {/* Right Side: Subtext on the right side of the grid (md:col-span-4 md:col-start-9) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-4 md:col-start-9 pb-1"
            >
              <p className="text-[#A5A5A5] text-[15px] md:text-[18px] leading-[1.4]">
                Más de 25 años guiando inversiones residenciales y agrícolas de alto patrimonio en Santiago y la Región Metropolitana con respaldo legal y tecnología IA.
              </p>
            </motion.div>

          </div>
        </div>

      </div>

    </section>
  );
};
