import React, { useState } from 'react';
import { Check, FileText, Plus, Trash2 } from 'lucide-react';
import type { SiteContent, SiteTestimonial } from '@portal/sitio-datos';
import { useBrandStore } from '../../brand/useBrandStore';
import { uploadOriginalIfRemote } from '../../../modules/catalogo/services/imageStorage';

const SAVE_ERRORS: Record<string, string> = {
  permiso: 'Tu cuenta no puede cambiar los textos de esta corredora, o su plan no lo incluye. Los cambios no se guardaron.',
  demasiado_grande: 'Los textos son demasiado largos para guardarlos. Acórtalos e inténtalo de nuevo.',
  conexion: 'No se pudo guardar: revisa tu conexión e inténtalo de nuevo. Los cambios no se aplicaron.',
  no_configurado: 'No se pudo guardar: falta configurar la conexión con la base de datos.',
  sin_datos: 'No se pudieron leer los textos actuales. Recarga la página e inténtalo de nuevo.',
  foto: 'No se pudo subir la foto. Usa un JPG, PNG o WebP de hasta 5 MB.',
};

const EMPTY_TESTIMONIAL: SiteTestimonial = { name: '', role: '', photo: '', initials: '', quote: '', stars: 5 };

// Los párrafos se escriben en un solo cuadro y se separan con una línea en blanco.
const toParagraphs = (text: string): string[] => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const toList = (text: string): string[] => text.split(',').map((p) => p.trim()).filter(Boolean);

const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-urbe-primary';

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }> = ({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}) => (
  <label className="block text-[11px] font-bold text-slate-700">
    {label}
    {multiline ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} placeholder={placeholder} className={`${inputClass} mt-1 font-normal`} />
    ) : (
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} mt-1 font-normal`} />
    )}
  </label>
);

const Block: React.FC<{ title: string; help: string; children: React.ReactNode }> = ({ title, help, children }) => (
  <fieldset className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 min-w-0">
    <legend className="px-1 font-bold text-xs text-slate-900">{title}</legend>
    <p className="text-[11px] text-slate-500 -mt-1">{help}</p>
    {children}
  </fieldset>
);

// Editor de los textos del sitio (H-032): portada, "Sobre nosotros", testimonios y pie de página.
// Guarda solo los textos; la marca y los colores tienen su propio botón. Lo que quede vacío no se muestra en el sitio.
export const SiteTextsSection: React.FC = () => {
  const stored = useBrandStore((s) => s.content);
  const saveContent = useBrandStore((s) => s.saveContent);
  const [content, setContent] = useState<SiteContent>(stored);
  const [paragraphs, setParagraphs] = useState(stored.about.paragraphs.join('\n\n'));
  const [areas, setAreas] = useState(stored.footer.coverageAreas.join(', '));
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const setHero = (field: keyof SiteContent['hero'], value: string) => setContent((c) => ({ ...c, hero: { ...c.hero, [field]: value } }));
  const setAbout = (field: 'eyebrow' | 'title' | 'credential', value: string) => setContent((c) => ({ ...c, about: { ...c.about, [field]: value } }));
  const setTestimonialsText = (field: 'eyebrow' | 'title' | 'subtitle', value: string) =>
    setContent((c) => ({ ...c, testimonials: { ...c.testimonials, [field]: value } }));
  const setFooter = (field: 'description' | 'legalLine', value: string) => setContent((c) => ({ ...c, footer: { ...c.footer, [field]: value } }));

  const setHighlight = (index: number, field: 'title' | 'text', value: string) =>
    setContent((c) => ({ ...c, about: { ...c.about, highlights: c.about.highlights.map((h, i) => (i === index ? { ...h, [field]: value } : h)) } }));
  const addHighlight = () => setContent((c) => ({ ...c, about: { ...c.about, highlights: [...c.about.highlights, { title: '', text: '' }] } }));
  const removeHighlight = (index: number) =>
    setContent((c) => ({ ...c, about: { ...c.about, highlights: c.about.highlights.filter((_, i) => i !== index) } }));

  const setTestimonial = (index: number, changes: Partial<SiteTestimonial>) =>
    setContent((c) => ({
      ...c,
      testimonials: { ...c.testimonials, items: c.testimonials.items.map((t, i) => (i === index ? { ...t, ...changes } : t)) },
    }));
  const addTestimonial = () => setContent((c) => ({ ...c, testimonials: { ...c.testimonials, items: [...c.testimonials.items, { ...EMPTY_TESTIMONIAL }] } }));
  const removeTestimonial = (index: number) =>
    setContent((c) => ({ ...c, testimonials: { ...c.testimonials, items: c.testimonials.items.filter((_, i) => i !== index) } }));

  // Con base de datos la foto va al almacenamiento de la corredora; sin ella no hay dónde guardarla y se pide una dirección.
  const uploadPhoto = async (index: number, file: File) => {
    setMessage(null);
    setUploads((n) => n + 1);
    try {
      const url = await uploadOriginalIfRemote(file);
      if (url) setTestimonial(index, { photo: url });
      else setMessage({ ok: false, text: 'Sin conexión a la base de datos, pega la dirección de la foto.' });
    } catch (err) {
      console.warn('[sitio] No se pudo subir la foto del testimonio:', err);
      setMessage({ ok: false, text: SAVE_ERRORS.foto });
    } finally {
      setUploads((n) => n - 1);
    }
  };

  const uploadHeroPhoto = async (file: File) => {
    setMessage(null);
    setUploads((n) => n + 1);
    try {
      const url = await uploadOriginalIfRemote(file);
      if (url) setHero('imageUrl', url);
      else setMessage({ ok: false, text: 'Sin conexión a la base de datos, pega la dirección de la foto.' });
    } catch (err) {
      console.warn('[sitio] No se pudo subir la foto de portada:', err);
      setMessage({ ok: false, text: SAVE_ERRORS.foto });
    } finally {
      setUploads((n) => n - 1);
    }
  };

  const handleSave = async () => {
    setMessage(null);
    setSaving(true);
    const result = await saveContent({
      ...content,
      about: { ...content.about, paragraphs: toParagraphs(paragraphs) },
      footer: { ...content.footer, coverageAreas: toList(areas) },
      // Las iniciales se calculan del nombre al guardar
      testimonials: { ...content.testimonials, items: content.testimonials.items.map((t) => ({ ...t, initials: '' })) },
    });
    setSaving(false);
    if (result.ok === false) {
      setMessage({ ok: false, text: SAVE_ERRORS[result.error] });
      return;
    }
    // Lo guardado puede venir corregido: testimonios incompletos fuera, fotos con dirección inválida vacías
    const saved = useBrandStore.getState().content;
    setContent(saved);
    setParagraphs(saved.about.paragraphs.join('\n\n'));
    setAreas(saved.footer.coverageAreas.join(', '));
    setMessage({ ok: true, text: 'Textos guardados. El sitio los muestra en un par de minutos.' });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-urbe-primary" /> Textos del sitio
        </h3>
        <p className="text-[11px] text-slate-500">
          Lo que tus clientes leen en tu sitio. Lo que dejes vacío no se muestra. Un testimonio necesita nombre y comentario.
        </p>
      </div>

      <Block title="Portada" help="Lo primero que se ve al entrar.">
        <Field label="Etiqueta sobre el título" value={content.hero.badge} onChange={(v) => setHero('badge', v)} placeholder="Corredora en Viña del Mar" />
        <Field label="Título" value={content.hero.headline} onChange={(v) => setHero('headline', v)} placeholder="Encuentra tu próxima propiedad" />
        <Field label="Parte destacada del título" value={content.hero.headlineHighlight} onChange={(v) => setHero('headlineHighlight', v)} />
        <Field label="Servicios" value={content.hero.services} onChange={(v) => setHero('services', v)} placeholder="Venta y arriendo de propiedades." />
        <Field label="Credencial" value={content.hero.credential} onChange={(v) => setHero('credential', v)} />
        <Field label="Sello de verificación" value={content.hero.verifiedLabel} onChange={(v) => setHero('verifiedLabel', v)} />
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1">
            <Field label="Foto de portada (dirección)" value={content.hero.imageUrl} onChange={(v) => setHero('imageUrl', v)} placeholder="https://… (opcional)" />
          </div>
          <label className="shrink-0 text-[11px] font-bold text-urbe-primary cursor-pointer pb-2">
            Subir foto de portada
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadHeroPhoto(file);
              }}
            />
          </label>
        </div>
        <Field label="Video de portada (dirección, opcional)" value={content.hero.videoUrl} onChange={(v) => setHero('videoUrl', v)} placeholder="https://…/video.mp4" />
        <p className="text-[11px] text-slate-500 -mt-1">
          Sin foto ni video se ve un fondo con los colores de tu marca. El video solo se reproduce en computador y sin sonido; usa uno tuyo o con licencia. En el celular se ve la foto.
        </p>
      </Block>

      <Block title="Sobre nosotros" help="Quiénes son y por qué elegirlos. Separa los párrafos con una línea en blanco.">
        <Field label="Etiqueta" value={content.about.eyebrow} onChange={(v) => setAbout('eyebrow', v)} />
        <Field label="Título de la sección" value={content.about.title} onChange={(v) => setAbout('title', v)} />
        <Field label="Párrafos" value={paragraphs} onChange={setParagraphs} multiline />
        <Field label="Credencial" value={content.about.credential} onChange={(v) => setAbout('credential', v)} />
        <div className="space-y-2">
          <span className="block text-[11px] font-bold text-slate-700">Puntos destacados</span>
          {content.about.highlights.map((h, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 items-start">
              <input aria-label={`Título del punto ${i + 1}`} value={h.title} onChange={(e) => setHighlight(i, 'title', e.target.value)} placeholder="Título" className={`${inputClass} sm:w-1/3`} />
              <input aria-label={`Texto del punto ${i + 1}`} value={h.text} onChange={(e) => setHighlight(i, 'text', e.target.value)} placeholder="Texto" className={inputClass} />
              <button type="button" onClick={() => removeHighlight(i)} aria-label={`Quitar el punto ${i + 1}`} className="p-2 text-slate-400 hover:text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addHighlight} className="text-[11px] font-bold text-urbe-primary flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Agregar punto destacado
          </button>
        </div>
      </Block>

      <Block title="Testimonios" help="Opiniones de clientes. Pide su autorización antes de publicar su nombre y foto.">
        <Field label="Etiqueta" value={content.testimonials.eyebrow} onChange={(v) => setTestimonialsText('eyebrow', v)} />
        <Field label="Título de la sección" value={content.testimonials.title} onChange={(v) => setTestimonialsText('title', v)} />
        <Field label="Bajada" value={content.testimonials.subtitle} onChange={(v) => setTestimonialsText('subtitle', v)} />
        {content.testimonials.items.map((t, i) => (
          <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Testimonio {i + 1}</span>
              <button type="button" onClick={() => removeTestimonial(i)} aria-label={`Quitar el testimonio ${i + 1}`} className="p-1 text-slate-400 hover:text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input aria-label={`Nombre del testimonio ${i + 1}`} value={t.name} onChange={(e) => setTestimonial(i, { name: e.target.value })} placeholder="Nombre" className={inputClass} />
              <input aria-label={`Descripción del testimonio ${i + 1}`} value={t.role} onChange={(e) => setTestimonial(i, { role: e.target.value })} placeholder="Compró en Reñaca" className={inputClass} />
            </div>
            <textarea aria-label={`Comentario del testimonio ${i + 1}`} value={t.quote} onChange={(e) => setTestimonial(i, { quote: e.target.value })} rows={3} placeholder="Comentario" className={inputClass} />
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select
                aria-label={`Estrellas del testimonio ${i + 1}`}
                value={t.stars}
                onChange={(e) => setTestimonial(i, { stars: Number(e.target.value) })}
                className={`${inputClass} sm:w-32`}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{`${n} estrella${n === 1 ? '' : 's'}`}</option>
                ))}
              </select>
              <input aria-label={`Foto del testimonio ${i + 1}`} value={t.photo} onChange={(e) => setTestimonial(i, { photo: e.target.value })} placeholder="Dirección de la foto (opcional)" className={inputClass} />
              <label className="shrink-0 text-[11px] font-bold text-urbe-primary cursor-pointer">
                Subir foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadPhoto(i, file);
                  }}
                />
              </label>
            </div>
          </div>
        ))}
        <button type="button" onClick={addTestimonial} className="text-[11px] font-bold text-urbe-primary flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Agregar testimonio
        </button>
      </Block>

      <Block title="Pie de página" help="Al final de cada página.">
        <Field label="Descripción" value={content.footer.description} onChange={(v) => setFooter('description', v)} multiline />
        <Field label="Zonas donde trabajas (separadas por comas)" value={areas} onChange={setAreas} placeholder="Viña del Mar, Reñaca, Concón" />
        <Field label="Línea legal" value={content.footer.legalLine} onChange={(v) => setFooter('legalLine', v)} />
      </Block>

      {message && (
        <p role="status" className={`text-xs font-semibold ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploads > 0}
          className="px-6 py-2.5 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{saving ? 'Guardando…' : 'Guardar textos'}</span>
        </button>
      </div>
    </div>
  );
};
