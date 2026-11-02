import React from 'react';
import { PlatformSection } from './PlatformSection';

// Solo la ve el dueño del producto. Aquí irá lo operativo de la plataforma (H-036); el control comercial vive en ventas (ADR-009).
export const PlatformTab: React.FC = () => (
  <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
    <PlatformSection />
  </div>
);
