import React, { useState, useEffect } from 'react';
import { 
  Instagram, 
  ExternalLink, 
  Heart, 
  MessageCircle, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Settings, 
  Play, 
  Image as ImageIcon, 
  Layers, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  X,
  Eye,
  Maximize2,
  Share2,
  Building2,
  Phone,
  Check
} from 'lucide-react';
import { agencyConfig } from '../../config/agencyConfig';
import { instagramService, URBEGESTION_HIGHLIGHTS } from '../../services/instagramService';
import { InstagramFeedState, InstagramPost } from '../../types/instagram';
import { InstagramPostModal } from './InstagramPostModal';

export const InstagramSection: React.FC = () => {
  const [feedState, setFeedState] = useState<InstagramFeedState>({
    posts: [],
    profile: {
      username: 'urbegestion',
      handle: '@urbegestion',
      fullName: 'UrbeGestion - Corredora de Propiedades',
      bio: 'Parcelas, casas y departamentos en RM 🏡\nTasación, administración, arriendo y venta 📑\n+56 9 7909 4519',
      followersCount: '1.752',
      followingCount: '680',
      postsCount: '57',
      profilePic: 'https://www.urbegestion.cl/assets/images/urbe_main.png',
      profileUrl: 'https://www.instagram.com/urbegestion/',
      isVerified: false
    },
    isLoading: true,
    isLiveConnected: false,
    lastUpdated: 'Reciente',
    error: null
  });

  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [inputFeedUrl, setInputFeedUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPosts = async () => {
    setIsRefreshing(true);
    try {
      const state = await instagramService.getLatestPosts(3);
      setFeedState(state);
    } catch (err) {
      console.error('Error loading Instagram feed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
    const config = instagramService.getConnectionConfig();
    setInputToken(config.token);
    setInputFeedUrl(config.feedUrl);
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    instagramService.saveConnectionConfig('token', inputToken.trim());
    instagramService.saveConnectionConfig('feed_url', inputFeedUrl.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    loadPosts();
    setIsConfigOpen(false);
  };

  const renderMediaBadge = (type: InstagramPost['mediaType']) => {
    switch (type) {
      case 'VIDEO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-[11px] font-bold">
            <Play className="w-3 h-3 fill-current text-rose-400" /> Reel / Video
          </span>
        );
      case 'CAROUSEL_ALBUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-[11px] font-bold">
            <Layers className="w-3 h-3 text-pink-400" /> Galería
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-[11px] font-bold">
            <ImageIcon className="w-3 h-3 text-emerald-400" /> Foto
          </span>
        );
    }
  };

  return (
    <section id="instagram-feed" className="py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200/80 relative overflow-hidden">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-pink-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-pink-200/50 text-pink-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Instagram className="w-3.5 h-3.5 text-pink-600 animate-pulse" />
              <span>Cuenta Oficial Instagram • @urbegestion</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Síguenos en Instagram
              <span className="hidden sm:inline-block w-2.5 h-2.5 rounded-full bg-pink-500" />
            </h2>
            
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
              Revisa nuestras <strong>últimas 3 publicaciones reales</strong> directamente en esta página. Haz clic en cualquiera de ellas para ver todas las fotos y consultar sin salir de la web.
            </p>
          </div>

          {/* Controls & Quick Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all"
              title="Conectar Token API en vivo"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Conectar API</span>
            </button>

            <button
              onClick={loadPosts}
              disabled={isRefreshing}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 shadow-sm transition-all"
              title="Actualizar publicaciones"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <a
              href="https://www.instagram.com/urbegestion/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
            >
              <Instagram className="w-4 h-4" />
              <span>Seguir en Instagram</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>
        </div>

        {/* Real UrbeGestión Profile Card (100% matched to @urbegestion) */}
        <div className="mb-10 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm hover:border-pink-200 transition-all">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="flex items-center gap-5">
              {/* Profile Avatar with Teal Graphic Circle */}
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#185558] flex items-center justify-center p-2 text-white border-2 border-white">
                  {/* Stylized Skyline Graphic matching real UrbeGestión Avatar */}
                  <Building2 className="w-9 h-9 text-teal-100" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-pink-600 text-white p-1.5 rounded-full ring-2 ring-white shadow">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    urbegestion
                  </h3>
                  <a
                    href="https://www.instagram.com/urbegestion/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-colors"
                  >
                    Seguir
                  </a>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                  UrbeGestion - Corredora de Propiedades
                </p>
                <div className="text-xs text-slate-500 mt-1 space-y-0.5 font-medium">
                  <p>🏡 Parcelas, casas y departamentos en RM</p>
                  <p>📑 Tasación, administración, arriendo y venta • <span className="font-bold text-slate-700">+56 9 7909 4519</span></p>
                </div>
              </div>
            </div>

            {/* Profile Statistics */}
            <div className="flex items-center gap-6 sm:gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 w-full md:w-auto justify-between sm:justify-start">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-black text-slate-900">{feedState.profile.postsCount}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Publicaciones</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-black text-slate-900">{feedState.profile.followersCount}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Seguidores</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-black text-slate-900">{feedState.profile.followingCount}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Seguidos</div>
              </div>
            </div>

          </div>

          {/* Story Highlights Bar (U R B E G E S T I O N) */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 hidden sm:inline">
              Destacadas:
            </span>
            {URBEGESTION_HIGHLIGHTS.map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-slate-300 to-slate-200 group-hover:from-pink-500 group-hover:to-amber-500 transition-all">
                  <div className={`w-full h-full rounded-full ${item.bg} flex items-center justify-center font-black text-sm uppercase shadow-sm border border-white`}>
                    {item.letter}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 group-hover:text-pink-600 transition-colors">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3 LATEST POSTS INTERACTIVE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {feedState.posts.map((post, idx) => (
            <article
              key={post.id || `post-${idx}`}
              onClick={() => setSelectedPost(post)}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-pink-300 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Post Top Bar */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#185558] p-1 flex items-center justify-center text-white shrink-0">
                      <Building2 className="w-4 h-4 text-teal-100" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        urbegestion
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      </div>
                      {post.location && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          <span className="truncate max-w-[150px]">{post.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {renderMediaBadge(post.mediaType)}
                </div>

                {/* Media Image Showcase with In-Page Preview Trigger */}
                <div className="relative aspect-[4/3] sm:aspect-square block overflow-hidden bg-slate-950">
                  <img
                    src={post.mediaUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />

                  {/* Price Tag Badge */}
                  {post.price && (
                    <div className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-extrabold shadow-lg border border-white/10 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {post.price}
                    </div>
                  )}

                  {/* Hover Overlay: In-Page Lightbox Trigger */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5 text-white">
                    <div className="flex justify-end">
                      <span className="p-2.5 rounded-full bg-white/20 backdrop-blur-md group-hover:bg-pink-600 transition-colors">
                        <Maximize2 className="w-4 h-4 text-white" />
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-5 text-sm font-bold text-white mb-2">
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                          {post.comments}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-300">
                        <Eye className="w-3.5 h-3.5" />
                        Ver publicación y fotos dentro de la página
                      </span>
                    </div>
                  </div>
                </div>

                {/* Caption & Post Details */}
                <div className="p-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> {post.likes} me gusta
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">{post.timestamp}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed line-clamp-3">
                    <span className="font-bold text-slate-900 mr-1.5">urbegestion</span>
                    {post.caption}
                  </p>

                  {/* Hashtags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag, tIdx) => (
                        <span key={tIdx} className="text-[11px] font-semibold text-pink-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer Action */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-pink-600 flex items-center gap-1.5 group-hover:text-pink-700">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Explorar sin salir</span>
                </span>
                <span className="text-xs font-semibold text-slate-500 group-hover:text-pink-600 transition-colors flex items-center gap-1">
                  <span>{post.comments} comentarios</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-14 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-500 text-white shadow-lg shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-bold">
                ¿Buscas comprar, vender o tasar una propiedad en la RM?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Atención personalizada con Pilar Osorio y el equipo de UrbeGestión. Conéctate con nosotros vía Instagram o WhatsApp.
              </p>
            </div>
          </div>

          <a
            href="https://www.instagram.com/urbegestion/"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-2 shrink-0 shadow-md hover:shadow-lg transition-all"
          >
            <Instagram className="w-4 h-4 text-pink-600" />
            <span>@urbegestion en Instagram</span>
          </a>
        </div>

      </div>

      {/* IN-PAGE FULL INSTAGRAM POST VIEWER MODAL */}
      <InstagramPostModal
        post={selectedPost}
        allPosts={feedState.posts}
        onClose={() => setSelectedPost(null)}
        onSelectPost={(p) => setSelectedPost(p)}
      />

      {/* Connection / API Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsConfigOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Conectar API de Instagram</h3>
                <p className="text-xs text-slate-500">Sincronización en vivo con @urbegestion</p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Token de Acceso Instagram Graph API (Opcional)
                </label>
                <input
                  type="password"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="IGQWR..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Generado en Meta for Developers (Instagram Graph API).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. O URL de Feed JSON (Behold.so / Curator / RSS)
                </label>
                <input
                  type="url"
                  value={inputFeedUrl}
                  onChange={(e) => setInputFeedUrl(e.target.value)}
                  placeholder="https://feeds.behold.so/..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Visualización Activa de @urbegestion
                </div>
                <p className="text-[11px] text-slate-500">
                  Las publicaciones reales de <strong>@urbegestion</strong> están sincronizadas y se pueden explorar interactivamente dentro del portal sin depender de iframes de terceros.
                </p>
              </div>

              {saveSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Configuración guardada con éxito
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Guardar y Sincronizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};

export default InstagramSection;
