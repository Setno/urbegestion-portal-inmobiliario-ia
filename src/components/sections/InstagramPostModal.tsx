import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  Share2, 
  CheckCircle2, 
  Instagram, 
  ExternalLink,
  MapPin, 
  Phone, 
  Play, 
  Pause,
  Copy,
  Check
} from 'lucide-react';
import { InstagramPost, InstagramComment } from '../../types/instagram';
import { agencyConfig } from '../../config/agencyConfig';

interface InstagramPostModalProps {
  post: InstagramPost | null;
  allPosts: InstagramPost[];
  onClose: () => void;
  onSelectPost: (post: InstagramPost) => void;
}

export const InstagramPostModal: React.FC<InstagramPostModalProps> = ({
  post,
  allPosts,
  onClose,
  onSelectPost,
}) => {
  if (!post) return null;

  const currentIndex = allPosts.findIndex((p) => p.id === post.id);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(typeof post.likes === 'number' ? post.likes : parseInt(String(post.likes)) || 150);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<InstagramComment[]>(post.commentsList || []);
  const [newComment, setNewComment] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // Reset slide when post changes
  useEffect(() => {
    setActiveSlide(0);
    setIsLiked(false);
    setLikeCount(typeof post.likes === 'number' ? post.likes : parseInt(String(post.likes)) || 150);
    setComments(post.commentsList || []);
  }, [post.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < allPosts.length - 1) {
        onSelectPost(allPosts[currentIndex + 1]);
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onSelectPost(allPosts[currentIndex - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allPosts, onClose, onSelectPost]);

  const galleryImages = post.gallery && post.gallery.length > 0 ? post.gallery : [post.mediaUrl];

  const handleToggleLike = () => {
    if (isLiked) {
      setLikeCount((prev) => prev - 1);
      setIsLiked(false);
    } else {
      setLikeCount((prev) => prev + 1);
      setIsLiked(true);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const added: InstagramComment = {
      id: `c-user-${Date.now()}`,
      user: 'usuario_visitante',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
      text: newComment.trim(),
      time: 'Hace un momento',
      likes: 0
    };

    setComments((prev) => [...prev, added]);
    setNewComment('');
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(post.permalink || agencyConfig.contact.instagram);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const whatsappInquiryUrl = `https://wa.me/${agencyConfig.contact.whatsapp}?text=${encodeURIComponent(
    `Hola Pilar, vi la publicación de Instagram sobre "${post.propertyType || 'la propiedad en ' + (post.location || 'Santiago')}" (${post.price || ''}) y me gustaría recibir más información.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Prev Navigation Button */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectPost(allPosts[currentIndex - 1]);
          }}
          className="absolute left-2 sm:left-4 md:left-6 z-50 p-2.5 sm:p-3 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all shadow-lg hidden sm:flex items-center justify-center"
          title="Publicación anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next Navigation Button */}
      {currentIndex < allPosts.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectPost(allPosts[currentIndex + 1]);
          }}
          className="absolute right-2 sm:right-4 md:right-6 z-50 p-2.5 sm:p-3 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all shadow-lg hidden sm:flex items-center justify-center"
          title="Siguiente publicación"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Modal Card */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden w-full max-w-5xl max-h-[92vh] flex flex-col md:flex-row"
      >
        {/* Close Button Mobile/Desktop */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
          title="Cerrar visor"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: Media Showcase (Images / Video / Carousel) */}
        <div className="w-full md:w-3/5 bg-slate-950 relative flex items-center justify-center min-h-[320px] sm:min-h-[420px] md:min-h-[580px] max-h-[50vh] md:max-h-full">
          
          <img
            src={galleryImages[activeSlide]}
            alt={post.caption}
            className="w-full h-full object-cover select-none"
          />

          {/* Video Mockup Play Button Overlay */}
          {post.mediaType === 'VIDEO' && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
            >
              <div className="w-16 h-16 rounded-full bg-white/25 group-hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110">
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </div>
            </button>
          )}

          {/* Carousel Arrows (if multiple images) */}
          {galleryImages.length > 1 && (
            <>
              {activeSlide > 0 && (
                <button
                  onClick={() => setActiveSlide((prev) => prev - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-sm shadow-md transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {activeSlide < galleryImages.length - 1 && (
                <button
                  onClick={() => setActiveSlide((prev) => prev + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-sm shadow-md transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Dots indicator */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeSlide === idx ? 'bg-white w-5 shadow' : 'bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Price / Location Tag Overlay */}
          {post.price && (
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md text-white text-xs font-extrabold shadow-lg border border-white/10 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {post.price}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Author, Caption, Comments, Actions */}
        <div className="w-full md:w-2/5 flex flex-col justify-between bg-white h-[50vh] md:h-[580px] overflow-hidden">
          
          {/* 1. Header Bar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-500 to-pink-600 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=150"
                  alt="urbegestion"
                  className="w-9 h-9 rounded-full object-cover bg-white"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                  urbegestion
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white" />
                </div>
                {post.location && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{post.location}</span>
                  </div>
                )}
              </div>
            </div>

            <a
              href={agencyConfig.contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-3 py-1 rounded-full border border-pink-200 transition-colors"
            >
              Seguir
            </a>
          </div>

          {/* 2. Scrollable Content Area: Caption + Comments */}
          <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs leading-relaxed text-slate-700">
            
            {/* Main Post Caption */}
            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=150"
                alt="urbegestion"
                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
              />
              <div className="space-y-2">
                <p className="whitespace-pre-line">
                  <span className="font-bold text-slate-900 mr-1.5">urbegestion</span>
                  {post.caption}
                </p>

                {/* Hashtags */}
                {post.tags && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="text-pink-600 font-semibold hover:underline">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[11px] text-slate-400 pt-1">
                  {post.timestamp} • Publicación oficial
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Comentarios ({comments.length})
              </div>

              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5 group">
                  <img
                    src={comment.avatar}
                    alt={comment.user}
                    className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                  />
                  <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-[11px]">
                        {comment.user}
                      </span>
                      <span className="text-[10px] text-slate-400">{comment.time}</span>
                    </div>
                    <p className="text-slate-700 text-xs mt-0.5">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* 3. Interactive Engagement Footer & Quick WhatsApp Action */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0 space-y-3">
            
            {/* Actions: Heart, Comment, Share, Save */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleLike}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                  title="Me gusta"
                >
                  <Heart
                    className={`w-6 h-6 transition-all ${
                      isLiked ? 'text-rose-500 fill-rose-500 scale-110' : 'text-slate-700 hover:text-rose-500'
                    }`}
                  />
                </button>

                <button
                  onClick={handleCopyShare}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-700 hover:text-slate-900"
                  title="Copiar enlace"
                >
                  {copiedLink ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </button>

                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-full hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 transition-colors"
                  title="Consultar por WhatsApp"
                >
                  <Share2 className="w-5 h-5" />
                </a>
              </div>

              <button
                onClick={() => setIsSaved(!isSaved)}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                title="Guardar publicación"
              >
                <Bookmark
                  className={`w-5 h-5 ${isSaved ? 'text-slate-900 fill-slate-900' : 'text-slate-700'}`}
                />
              </button>
            </div>

            {/* Like Counter & Timestamp */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">
                {likeCount.toLocaleString('es-CL')} me gusta
              </span>
              <a
                href={post.permalink || agencyConfig.contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-slate-500 hover:text-pink-600 flex items-center gap-1"
              >
                <Instagram className="w-3 h-3 text-pink-500" />
                <span>Abrir en Instagram</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {/* Direct WhatsApp Call to Action for the Property */}
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Consultar por esta propiedad ({post.price || 'Disponible'})</span>
            </a>

            {/* Add Comment Input Form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Añade un comentario..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-3 py-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 disabled:opacity-40 disabled:hover:text-pink-600 transition-colors"
              >
                Publicar
              </button>
            </form>

          </div>

        </div>

      </div>

    </div>
  );
};
