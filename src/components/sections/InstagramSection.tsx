import React from 'react';
import { Instagram, ExternalLink, Heart, MessageCircle, Sparkles } from 'lucide-react';
import { agencyConfig } from '../../config/agencyConfig';

export const InstagramSection: React.FC = () => {
  const instagramPosts = [
    {
      id: 'ig-1',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600',
      caption: 'Nueva captación en Vitacura. Penthouse de lujo con terraza panorámica y vista a la cordillera.',
      likes: '142',
      comments: '18',
    },
    {
      id: 'ig-2',
      image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=600',
      caption: 'Casa mediterránea en Los Trapenses. Exclusividad, seguridad y piscina climatizada.',
      likes: '215',
      comments: '29',
    },
    {
      id: 'ig-3',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600',
      caption: 'Parcela agrícola productiva en Melipilla con derechos de agua inscritos.',
      likes: '98',
      comments: '12',
    }
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-600 text-xs font-bold uppercase tracking-wider mb-2">
              <Instagram className="w-3.5 h-3.5" />
              Comunidad & Novedades
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Síguenos en Instagram
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Conoce los últimos ingresos de propiedades y consejos del mercado inmobiliario.
            </p>
          </div>

          <a
            href={agencyConfig.contact.instagram}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Instagram className="w-4 h-4" />
            <span>@urbegestion</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {instagramPosts.map((post) => (
            <a
              key={post.id}
              href={agencyConfig.contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="group relative bg-slate-950 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all aspect-square block"
            >
              <img
                src={post.image}
                alt="Instagram Post"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Hover overlay with engagement stats */}
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-5 text-white">
                <div className="flex justify-end">
                  <Instagram className="w-5 h-5 text-pink-400" />
                </div>
                
                <p className="text-xs line-clamp-3 text-slate-200 font-medium">
                  {post.caption}
                </p>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-300 pt-2 border-t border-white/20">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                    {post.comments}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
};
