import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Building,
  Users,
  Phone,
  CheckCircle2,
  Check,
  Palette,
  RotateCcw,
  Camera,
} from 'lucide-react';
import { useBrandStore, BRAND_COLOR_PRESETS } from '../../brand/useBrandStore';
import { isRemoteData } from '../../data/dataSource';
import { uploadOriginalIfRemote } from '../../../modules/catalogo/services/imageStorage';
import { SiteTextsSection } from './SiteTextsSection';

const SAVE_ERRORS: Record<string, string> = {
  permiso: 'Tu cuenta no puede cambiar la marca de esta corredora, o su plan no lo incluye. Los cambios no se guardaron.',
  demasiado_grande: 'Los datos son demasiado grandes para guardarlos. Revisa los textos y las imágenes pegadas como dirección.',
  conexion: 'No se pudo guardar: revisa tu conexión e inténtalo de nuevo. Los cambios no se aplicaron.',
  no_configurado: 'No se pudo guardar: falta configurar la conexión con la base de datos.',
  sin_datos: 'No se pudieron leer los datos actuales de la corredora. Recarga la página e inténtalo de nuevo.',
  enlace_invalido: 'Una de las direcciones no es válida. Revisa el logo, la foto y el enlace de Instagram.',
  foto: 'No se pudo subir la imagen. Usa un JPG, PNG o WebP de hasta 5 MB.',
};

// Guardar reemplaza la marca completa: el formulario solo aparece con los datos reales ya leídos,
// y se arma de nuevo con ellos si la lectura termina después de abrir la pestaña.
export const BrandingTab: React.FC = () => {
  const loadStatus = useBrandStore((state) => state.loadStatus);
  const load = useBrandStore((state) => state.load);

  if (loadStatus !== 'ok') {
    return (
      <div className="flex-1 p-6 bg-slate-50 text-center text-xs text-slate-600 space-y-3">
        <p>
          {loadStatus === 'idle'
            ? 'Cargando los datos de la corredora...'
            : 'No se pudieron leer los datos de la corredora. No se puede editar la marca hasta leerlos.'}
        </p>
        {loadStatus === 'error' && (
          <button
            type="button"
            onClick={() => void load()}
            className="px-4 py-2 rounded-xl bg-urbe-primary text-white font-bold"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }
  return <BrandingForm />;
};

const BrandingForm: React.FC = () => {

  // Brand Customizer State
  const { config: brandConfig, themeColors, saveBrand, resetToDefault: resetBrand } = useBrandStore();
  const [bBrandName, setBBrandName] = useState(brandConfig.brandName);
  const [bTagline, setBTagline] = useState(brandConfig.tagline);
  const [bLogoUrl, setBLogoUrl] = useState(brandConfig.logoUrl);
  const [bBrokerName, setBBrokerName] = useState(brandConfig.brokerName);
  const [bBrokerRole, setBBrokerRole] = useState(brandConfig.brokerRole);
  const [bBrokerPhotoUrl, setBBrokerPhotoUrl] = useState(brandConfig.brokerPhotoUrl);
  const [bExperienceYears, setBExperienceYears] = useState(brandConfig.experienceYears);
  const [bPhoneDisplay, setBPhoneDisplay] = useState(brandConfig.contact.phoneDisplay);
  const [bWhatsapp, setBWhatsapp] = useState(brandConfig.contact.whatsapp);
  const [bEmail, setBEmail] = useState(brandConfig.contact.email);
  const [bInstagram, setBInstagram] = useState(brandConfig.contact.instagram);
  const [bPrimaryColor, setBPrimaryColor] = useState(themeColors.primary);
  const [bAccentColor, setBAccentColor] = useState(themeColors.accent);
  const [brandSavedToast, setBrandSavedToast] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const brokerPhotoInputRef = useRef<HTMLInputElement>(null);

  // Layout Modular Toggles State
  const { layoutConfig } = useBrandStore();
  const [bShowSearch, setBShowSearch] = useState(layoutConfig.showSearchFilter);
  const [bShowAbout, setBShowAbout] = useState(layoutConfig.showAboutSection);
  const [bShowTestimonials, setBShowTestimonials] = useState(layoutConfig.showTestimonialsSection);
  const [bShowAiChat, setBShowAiChat] = useState(layoutConfig.showAiChat);

  // Con Supabase la imagen va al almacenamiento de la corredora; sin Supabase queda como texto en el navegador, como hasta hoy.
  const readImage = async (file: File, apply: (url: string) => void) => {
    setSaveError(null);
    setUploads((n) => n + 1);
    try {
      const uploaded = await uploadOriginalIfRemote(file);
      if (uploaded) {
        apply(uploaded);
        return;
      }
    } catch (err) {
      console.warn('[marca] No se pudo subir la imagen:', err);
      setSaveError(SAVE_ERRORS.foto);
      return;
    } finally {
      setUploads((n) => n - 1);
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') apply(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void readImage(file, setBLogoUrl);
  };

  const handleBrokerPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void readImage(file, setBBrokerPhotoUrl);
  };

  const handleSaveBrand = async () => {
    setSaveError(null);
    setIsSaving(true);
    const result = await saveBrand({
      brandName: bBrandName,
      tagline: bTagline,
      logoUrl: bLogoUrl,
      // El pie de página usa el logo claro: si se cambia el logo, cambia también ahí
      logoWhiteUrl: bLogoUrl !== brandConfig.logoUrl ? bLogoUrl : brandConfig.logoWhiteUrl,
      brokerName: bBrokerName,
      brokerRole: bBrokerRole,
      brokerPhotoUrl: bBrokerPhotoUrl,
      experienceYears: Number(bExperienceYears),
      contact: {
        ...brandConfig.contact,
        phone: bPhoneDisplay.replace(/[^\d+]/g, '') || bWhatsapp,
        phoneDisplay: bPhoneDisplay,
        whatsapp: bWhatsapp,
        email: bEmail,
        instagram: bInstagram,
      },
    }, {
      primary: bPrimaryColor,
      primaryDark: bPrimaryColor,
      accent: bAccentColor,
      accentHover: bAccentColor,
    }, {
      showSearchFilter: bShowSearch,
      showAboutSection: bShowAbout,
      showTestimonialsSection: bShowTestimonials,
      showAiChat: bShowAiChat,
    });
    setIsSaving(false);

    if (result.ok === false) {
      setSaveError(SAVE_ERRORS[result.error]);
      return;
    }

    // Lo guardado puede venir corregido (por ejemplo, con https:// agregado)
    const saved = useBrandStore.getState().config;
    setBLogoUrl(saved.logoUrl);
    setBBrokerPhotoUrl(saved.brokerPhotoUrl);
    setBInstagram(saved.contact.instagram);

    setBrandSavedToast(true);
    setTimeout(() => setBrandSavedToast(false), 3000);
  };

  const handleResetBrand = () => {
    if (window.confirm('¿Deseas restaurar la marca a los valores originales de UrbeGestión?')) {
      resetBrand();
      const defaultC = useBrandStore.getState().config;
      const defaultT = useBrandStore.getState().themeColors;
      const defaultL = useBrandStore.getState().layoutConfig;
      setBBrandName(defaultC.brandName);
      setBTagline(defaultC.tagline);
      setBLogoUrl(defaultC.logoUrl);
      setBBrokerName(defaultC.brokerName);
      setBBrokerRole(defaultC.brokerRole);
      setBBrokerPhotoUrl(defaultC.brokerPhotoUrl);
      setBExperienceYears(defaultC.experienceYears);
      setBPhoneDisplay(defaultC.contact.phoneDisplay);
      setBWhatsapp(defaultC.contact.whatsapp);
      setBEmail(defaultC.contact.email);
      setBInstagram(defaultC.contact.instagram);
      setBPrimaryColor(defaultT.primary);
      setBAccentColor(defaultT.accent);
      setBShowSearch(defaultL.showSearchFilter);
      setBShowAbout(defaultL.showAboutSection);
      setBShowTestimonials(defaultL.showTestimonialsSection);
      setBShowAiChat(defaultL.showAiChat);
      setBrandSavedToast(true);
      setTimeout(() => setBrandSavedToast(false), 3000);
    }
  };

  return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Palette className="w-5 h-5 text-urbe-accent" />
              Personalizador de Identidad de Marca (White-Label)
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Modifica el nombre, logo, foto del corredor, teléfono y paleta de colores sin entrar al código. Los cambios se aplican en vivo en toda la web.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Volver a la marca de ejemplo solo tiene sentido sin base de datos */}
            {!isRemoteData && (
            <button
              type="button"
              onClick={handleResetBrand}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Original</span>
            </button>
            )}

            <button
              type="button"
              onClick={handleSaveBrand}
              disabled={isSaving || uploads > 0}
              className="px-5 py-2 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{brandSavedToast ? '¡Marca Guardada con Éxito!' : 'Guardar y Aplicar'}</span>
            </button>
          </div>
        </div>

        {saveError && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold">
            {saveError}
          </div>
        )}

        {brandSavedToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>La identidad de la marca y la paleta de colores han sido actualizadas en vivo en todo el portal.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Logo & Agency Details */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider text-urbe-primary flex items-center gap-2">
              <Building className="w-4 h-4" />
              1. Corredora & Logotipo
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Corredora</label>
              <input
                type="text"
                value={bBrandName}
                onChange={(e) => setBBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                placeholder="Ej: Inmobiliaria Las Condes"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Eslogan / Subtítulo</label>
              <textarea
                rows={2}
                value={bTagline}
                onChange={(e) => setBTagline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                placeholder="Tu frase de presentación..."
              />
            </div>

            {/* Logo uploader */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">Logo Oficial</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 p-2 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                  {bLogoUrl ? (
                    <img src={bLogoUrl} alt="Preview Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-slate-400">Sin logo</span>
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Subir desde PC</span>
                  </button>
                  <input
                    type="url"
                    value={bLogoUrl}
                    onChange={(e) => setBLogoUrl(e.target.value)}
                    placeholder="O pegar URL de imagen..."
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Broker Profile & Photo */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider text-urbe-primary flex items-center gap-2">
              <Users className="w-4 h-4" />
              2. Perfil del Corredor / Asesor
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo del Asesor</label>
              <input
                type="text"
                value={bBrokerName}
                onChange={(e) => setBBrokerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                placeholder="Ej: Ana Pérez"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Título</label>
                <input
                  type="text"
                  value={bBrokerRole}
                  onChange={(e) => setBBrokerRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  placeholder="Corredora Senior"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Años Trayectoria</label>
                <input
                  type="number"
                  value={bExperienceYears}
                  onChange={(e) => setBExperienceYears(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                />
              </div>
            </div>

            {/* Broker photo uploader */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">Foto de Perfil del Asesor</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-urbe-accent overflow-hidden shrink-0 shadow-sm">
                  {bBrokerPhotoUrl ? (
                    <img src={bBrokerPhotoUrl} alt="Preview Broker" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-slate-400 m-auto mt-3" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <input
                    type="file"
                    ref={brokerPhotoInputRef}
                    accept="image/*"
                    onChange={handleBrokerPhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => brokerPhotoInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Subir desde PC</span>
                  </button>
                  <input
                    type="url"
                    value={bBrokerPhotoUrl}
                    onChange={(e) => setBBrokerPhotoUrl(e.target.value)}
                    placeholder="O pegar URL de imagen..."
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Contact & Social Channels */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider text-urbe-primary flex items-center gap-2">
              <Phone className="w-4 h-4" />
              3. Teléfono & Canales de Cierre
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Visible en Web</label>
              <input
                type="text"
                value={bPhoneDisplay}
                onChange={(e) => setBPhoneDisplay(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp (Para botón de fichas)</label>
              <input
                type="text"
                value={bWhatsapp}
                onChange={(e) => setBWhatsapp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                placeholder="56912345678"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico Oficial</label>
              <input
                type="email"
                value={bEmail}
                onChange={(e) => setBEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                placeholder="contacto@inmobiliaria.cl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enlace de Instagram</label>
              <input
                type="url"
                value={bInstagram}
                onChange={(e) => setBInstagram(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                placeholder="https://instagram.com/tu-corredora"
              />
            </div>
          </div>

        </div>

        {/* Card 4: Color Palettes & Custom Theme */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider text-urbe-primary flex items-center gap-2">
            <Palette className="w-4 h-4" />
            4. Paleta de Colores Corporativos
          </h4>
          <p className="text-xs text-slate-500">
            Selecciona una de las combinaciones prediseñadas de alta gama para inmobiliarias o personaliza tus códigos hexadecimales:
          </p>

          {/* Preset Grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {BRAND_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setBPrimaryColor(preset.primary);
                  setBAccentColor(preset.accent);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all hover:scale-[1.02] ${
                  bPrimaryColor === preset.primary && bAccentColor === preset.accent
                    ? 'border-urbe-accent bg-amber-50/50 ring-2 ring-urbe-accent'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{preset.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{preset.primary} • {preset.accent}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.primary }} />
                  <div className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.accent }} />
                </div>
              </button>
            ))}
          </div>

          {/* Custom Color Pickers */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Color Primario (Botones principales, encabezados)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bPrimaryColor}
                  onChange={(e) => setBPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={bPrimaryColor}
                  onChange={(e) => setBPrimaryColor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Color de Acento (Dorado, badges, destacados)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bAccentColor}
                  onChange={(e) => setBAccentColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={bAccentColor}
                  onChange={(e) => setBAccentColor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={handleSaveBrand}
              disabled={isSaving || uploads > 0}
              className="px-6 py-2.5 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{brandSavedToast ? '¡Marca Guardada con Éxito!' : 'Guardar y Aplicar a Toda la Web'}</span>
            </button>
          </div>
        </div>

        {/* Card 5: Architecture & Modular Section Toggles */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider text-urbe-primary flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              5. Arquitectura & Módulos Activos de la Landing Page
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Activa o desactiva secciones completas de la página según el tipo de cliente o modelo de negocio:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Module 1: Search Bar */}
            <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={bShowSearch}
                onChange={(e) => setBShowSearch(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-urbe-primary focus:ring-urbe-primary"
              />
              <div>
                <span className="font-bold text-xs text-slate-900 block">🔍 Buscador Multifiltro Superior</span>
                <span className="text-[11px] text-slate-500">Muestra la barra de búsqueda por comuna, tipo y rango de precio en UF.</span>
              </div>
            </label>

            {/* Module 2: About Broker */}
            <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={bShowAbout}
                onChange={(e) => setBShowAbout(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-urbe-primary focus:ring-urbe-primary"
              />
              <div>
                <span className="font-bold text-xs text-slate-900 block">👤 Sección "Sobre Mí" / Corredor</span>
                <span className="text-[11px] text-slate-500">Muestra la biografía, años de trayectoria y credenciales del broker.</span>
              </div>
            </label>

            {/* Module 3: Testimonials */}
            <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={bShowTestimonials}
                onChange={(e) => setBShowTestimonials(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-urbe-primary focus:ring-urbe-primary"
              />
              <div>
                <span className="font-bold text-xs text-slate-900 block">⭐ Reseñas & Testimonios</span>
                <span className="text-[11px] text-slate-500">Muestra las opiniones y casos de éxito de clientes anteriores.</span>
              </div>
            </label>

            {/* Module 4: AI Chat Widget */}
            <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={bShowAiChat}
                onChange={(e) => setBShowAiChat(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-urbe-primary focus:ring-urbe-primary"
              />
              <div>
                <span className="font-bold text-xs text-slate-900 block">🤖 Asistente Virtual IA Flotante</span>
                <span className="text-[11px] text-slate-500">Muestra el widget de chat 24/7 en la esquina inferior derecha.</span>
              </div>
            </label>

          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={handleSaveBrand}
              disabled={isSaving || uploads > 0}
              className="px-6 py-2.5 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{brandSavedToast ? '¡Estructura Guardada con Éxito!' : 'Guardar y Aplicar Estructura'}</span>
            </button>
          </div>
        </div>

        <SiteTextsSection />
      </div>
  );
};
