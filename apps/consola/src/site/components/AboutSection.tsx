import React from 'react';
import { 
  Award, 
  ShieldCheck, 
  Clock, 
  Users, 
  FileCheck, 
  Phone,
  Instagram,
  Mail,
} from 'lucide-react';
import { useBrandStore } from '../../core/brand/useBrandStore';
import { instagramHandle } from '@portal/sitio-datos';

const HIGHLIGHT_ICONS = [ShieldCheck, FileCheck, Users, Clock];

export const AboutSection: React.FC = () => {
  const { config: agencyConfig, content } = useBrandStore();
  const { about } = content;
  const handle = instagramHandle(agencyConfig.contact.instagram);
  return (
    <section id="sobre-mi" className="py-16 sm:py-24 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Photo & Credential Cards (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {agencyConfig.brokerPhotoUrl && (
            <div className="relative max-w-sm mx-auto lg:max-w-none">
              {/* Profile Image with subtle gold border */}
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100 relative bg-slate-100">
                <img
                  src={agencyConfig.brokerPhotoUrl}
                  alt={agencyConfig.brokerName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="text-2xl font-black block">{agencyConfig.brokerName}</span>
                  <span className="text-xs text-urbe-accent font-bold uppercase tracking-wider block">
                    {agencyConfig.brokerRole}
                  </span>
                  {about.credential && (
                  <p className="text-[11px] text-slate-300 mt-1">
                    {about.credential}
                  </p>
                  )}
                </div>
              </div>

              {/* Floating Experience Badge */}
              {agencyConfig.stats.yearsExperience && (
              <div className="absolute -bottom-4 -right-2 sm:-bottom-5 sm:-right-5 bg-urbe-primary text-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-white/20 text-center min-w-[110px]">
                <span className="text-2xl sm:text-3xl font-black block text-urbe-accent">{agencyConfig.stats.yearsExperience}</span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-200">Años de Trayectoria</span>
              </div>
              )}
            </div>
            )}

            {/* Direct Contact Card under Photo */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              {agencyConfig.contact.phone && (
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <a href={`tel:${agencyConfig.contact.phone}`} className="font-bold hover:underline">
                  {agencyConfig.contact.phoneDisplay}
                </a>
              </div>
              )}
              {agencyConfig.contact.email && (
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-urbe-primary shrink-0" />
                <a href={`mailto:${agencyConfig.contact.email}`} className="font-medium hover:underline truncate">
                  {agencyConfig.contact.email}
                </a>
              </div>
              )}
              {agencyConfig.contact.instagram && (
              <div className="flex items-center gap-2 text-pink-700">
                <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                <a href={agencyConfig.contact.instagram} target="_blank" rel="noreferrer" className="font-bold hover:underline">
                  {handle ? `${handle} en Instagram` : 'Instagram'}
                </a>
              </div>
              )}
            </div>
          </div>

          {/* Biography & Pillar Points (Right 7 Cols) */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            
            {about.eyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-urbe-primary/10 text-urbe-primary text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-urbe-accent" />
              {about.eyebrow}
            </div>
            )}

            {about.title && (
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {about.title}
            </h2>
            )}

            {about.paragraphs.map((paragraph, idx) => (
              <p key={idx} className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {paragraph}
              </p>
            ))}

            {/* Core Values / Competencies Grid */}
            {about.highlights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {about.highlights.map((highlight, idx) => {
                const Icon = HIGHLIGHT_ICONS[idx % HIGHLIGHT_ICONS.length];
                return (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <Icon className="w-5 h-5 text-urbe-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{highlight.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{highlight.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
