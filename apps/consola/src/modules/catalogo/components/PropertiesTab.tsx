import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  UploadCloud,
  Video
} from 'lucide-react';
import { usePropertyStore } from '../stores/usePropertyStore';
import { IMAGE_GUIDE, uploadIfRemote } from '../services/imageStorage';
import { useAuthStore } from '../../../core/auth/useAuthStore';
import {
  PUBLICATION_LABEL,
  SALE_STATUS_LABEL,
  actorFor,
  isOnOffer,
  availableActions,
  statusAfterEdit,
  statusForNew,
} from '../services/publicationWorkflow';
import type { PropertyStatus, PublicationStatus } from '../types/property';
import { useMarket } from '../../../core/market/useMarketStore';
import { isInServiceAreas } from '../services/propertyFilters';
import { NumberInput } from '../../../core/ui/NumberInput';
import { useT, capitalize } from '../../../core/i18n/i18n';
import { formatMoney } from '@portal/dinero';
import { priceOf } from '../services/propertyPrice';
import { hasRoom, limitOf } from '@portal/plataforma/contract';
import { useEntitlementsStore } from '../../../core/platform/useEntitlementsStore';
import { Property, PropertyType, OperationType } from '../types/property';
import { PortalPublishControl } from './PortalPublishControl';
import { usePortalListings } from '../hooks/usePortalListings';

const STATUS_STYLE: Record<PublicationStatus, string> = {
  borrador: 'bg-slate-100 text-slate-600',
  en_revision: 'bg-amber-100 text-amber-700',
  publicada: 'bg-emerald-100 text-emerald-700',
  rechazada: 'bg-rose-100 text-rose-700',
};

export const PropertiesTab: React.FC = () => {
  const { properties, addProperty, updateProperty, deleteProperty, submitForReview, approveProperty, rejectProperty } =
    usePropertyStore();
  // Sin Supabase no hay roles ni flujo de aprobación: todo se publica directo, como antes.
  const role = useAuthStore((s) => s.membership?.role ?? null);
  const mode = useAuthStore((s) => s.membership?.publicationMode);
  const actor = actorFor(role, mode);
  const portals = usePortalListings();
  const view = useMarket();
  const { pack, zones, localities } = view;
  const { t } = useT();
  const entitlements = useEntitlementsStore((s) => s.entitlements);
  const [planMessage, setPlanMessage] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Property Form Modal State
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [propTitle, setPropTitle] = useState('');
  const [propOperation, setPropOperation] = useState<OperationType>('venta');
  const [propType, setPropType] = useState<PropertyType>('departamento');
  const [propPrice, setPropPrice] = useState<number | ''>('');
  const [propCurrency, setPropCurrency] = useState(pack.defaultCurrency);
  const [propCommune, setPropCommune] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propBedrooms, setPropBedrooms] = useState(3);
  const [propBathrooms, setPropBathrooms] = useState(2);
  const [propBuiltM2, setPropBuiltM2] = useState(120);
  const [propTotalM2, setPropTotalM2] = useState(140);
  const [propParking, setPropParking] = useState(2);
  const [propDescription, setPropDescription] = useState('');
  
  // Media State for Properties (Images & Videos from PC or URL)
  const [propImages, setPropImages] = useState<string[]>([]);
  const [propVideoUrl, setPropVideoUrl] = useState<string>('');
  const [propUrlInput, setPropUrlInput] = useState('');
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const propertyFileInputRef = useRef<HTMLInputElement>(null);

  // Media files handler from PC (Images / Videos) with 15MB limit
  const handlePropertyMediaFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const MAX_PROPERTY_MEDIA_SIZE = 15 * 1024 * 1024; // 15 MB
    const MAX_PROP_IMAGES = 15;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_PROPERTY_MEDIA_SIZE) {
        alert(`El archivo "${file.name}" supera el tamaño máximo permitido de 15 MB.`);
        return;
      }

      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isVideo && !isImage) {
        alert(`Formato no soportado para "${file.name}". Solo imágenes o videos.`);
        return;
      }

      const addImage = (url: string) =>
        setPropImages((prev) => {
          if (prev.length >= MAX_PROP_IMAGES) return prev;
          return [...prev, url];
        });

      const readAsDataUrl = () => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          if (isVideo) setPropVideoUrl(url);
          else addImage(url);
        };
        reader.readAsDataURL(file);
      };

      // Con Supabase las fotos se suben a Storage; si falla o no hay Supabase, queda la imagen local como hasta hoy.
      if (isImage) {
        uploadIfRemote(file)
          .then((url) => (url ? addImage(url) : readAsDataUrl()))
          .catch((err) => {
            console.warn('[PropertiesTab] No se pudo subir la foto a Storage, se guarda local:', err);
            readAsDataUrl();
          });
      } else {
        readAsDataUrl();
      }
    });
  };

  const handleAddImageUrl = () => {
    if (!propUrlInput.trim()) return;
    setPropImages((prev) => [...prev, propUrlInput.trim()]);
    setPropUrlInput('');
  };

  const handleSetPrimaryImage = (index: number) => {
    setPropImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
  };

  const handleRemovePropertyImage = (index: number) => {
    setPropImages((prev) => prev.filter((_, i) => i !== index));
  };

  // El plan limita cuántas propiedades pueden estar publicadas a la vez (limit.properties_published).
  const roomToPublish = (): boolean => {
    const published = properties.filter((p) => (p.publicationStatus ?? 'publicada') === 'publicada').length;
    if (hasRoom(entitlements, 'limit.properties_published', published)) {
      setPlanMessage(null);
      return true;
    }
    setPlanMessage(t('plan.limit.properties', { max: limitOf(entitlements, 'limit.properties_published') ?? 0 }));
    return false;
  };

  const handleOpenNewProperty = () => {
    // Quien propone solo crea borradores, que no cuentan; quien publica necesita cupo.
    if (actor !== 'proponente' && !roomToPublish()) return;
    setEditingPropId(null);
    setPropTitle('');
    setPropOperation('venta');
    setPropType('departamento');
    setPropPrice('');
    setPropCurrency(pack.defaultCurrency);
    setPropCommune('');
    setPropAddress('');
    setPropBedrooms(3);
    setPropBathrooms(2);
    setPropBuiltM2(120);
    setPropTotalM2(140);
    setPropParking(2);
    setPropImages([]);
    setPropVideoUrl('');
    setPropUrlInput('');
    setPropDescription('');
    setIsPropertyModalOpen(true);
  };

  const handleEditProperty = (p: Property) => {
    setEditingPropId(p.id);
    setPropTitle(p.title);
    setPropOperation(p.operation);
    setPropType(p.propertyType);
    setPropPrice(p.priceAmount);
    setPropCurrency(p.priceCurrency);
    setPropCommune(p.commune);
    setPropAddress(p.address);
    setPropBedrooms(p.bedrooms);
    setPropBathrooms(p.bathrooms);
    setPropBuiltM2(p.builtAreaM2);
    setPropTotalM2(p.totalAreaM2);
    setPropParking(p.parkingSpots);
    setPropImages(p.images && p.images.length > 0 ? p.images : []);
    setPropVideoUrl(p.videoUrl || '');
    setPropUrlInput('');
    setPropDescription(p.description);
    setIsPropertyModalOpen(true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle || !propAddress || !propCommune || propPrice === '') return;

    const finalImages = propImages.length > 0 
      ? propImages 
      : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200'];

    if (editingPropId) {
      updateProperty(editingPropId, {
        title: propTitle,
        operation: propOperation,
        propertyType: propType,
        priceAmount: propPrice,
        priceCurrency: propCurrency,
        commune: propCommune,
        address: propAddress,
        bedrooms: propBedrooms,
        bathrooms: propBathrooms,
        builtAreaM2: propBuiltM2,
        totalAreaM2: propTotalM2,
        parkingSpots: propParking,
        images: finalImages,
        videoUrl: propVideoUrl || undefined,
        description: propDescription,
        publicationStatus: statusAfterEdit(
          actor,
          properties.find((x) => x.id === editingPropId)?.publicationStatus ?? 'publicada',
        ),
      });
    } else {
      addProperty({
        title: propTitle,
        operation: propOperation,
        propertyType: propType,
        priceAmount: propPrice,
        priceCurrency: propCurrency,
        commune: propCommune,
        address: propAddress,
        bedrooms: propBedrooms,
        bathrooms: propBathrooms,
        builtAreaM2: propBuiltM2,
        totalAreaM2: propTotalM2,
        parkingSpots: propParking,
        storageUnits: 1,
        featured: true,
        status: 'disponible',
        images: finalImages,
        videoUrl: propVideoUrl || undefined,
        description: propDescription,
        features: ['Termopanel', 'Seguridad 24/7', 'Estacionamiento'],
        publicationStatus: statusForNew(actor),
      });
    }

    setIsPropertyModalOpen(false);
    setEditingPropId(null);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Gestor de Propiedades</h3>
            <p className="text-[11px] sm:text-xs text-slate-500">Agrega inmuebles con fotos/videos desde tu PC o URLs, edita precios en UF y administra su disponibilidad.</p>
          </div>

          <button
            onClick={handleOpenNewProperty}
            className="px-4 py-2 bg-urbe-primary hover:bg-urbe-primaryDark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>{actor === 'proponente' ? 'Crear borrador' : 'Publicar Nueva Propiedad'}</span>
          </button>
        </div>

        {planMessage && (
          <p role="alert" className="mb-4 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
            {planMessage}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between group">
              <div>
                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
                    {formatMoney(priceOf(p), pack)}
                  </div>
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    {p.images.length > 1 && (
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                        {p.images.length} fotos
                      </span>
                    )}
                    {p.videoUrl && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[10px] font-bold flex items-center gap-0.5">
                        <Video className="w-2.5 h-2.5" /> Video
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-urbe-primary uppercase">{p.operation}</span>
                    <span>{p.commune}</span>
                  </div>
                  {role && (
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLE[p.publicationStatus ?? 'publicada']}`}
                    >
                      {PUBLICATION_LABEL[p.publicationStatus ?? 'publicada']}
                    </span>
                  )}
                  {!isInServiceAreas(p, view, pack) && (
                    <span className="inline-block ml-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">
                      {t('properties.outsideAreas')}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    {/* El agente que propone no lo cambia: la base devolvería la propiedad a revisión (H-048). */}
                    <select
                      value={p.status ?? 'disponible'}
                      onChange={(e) => {
                        const status = e.target.value as PropertyStatus;
                        // Vendida o arrendada saca la propiedad del sitio al tiro: se confirma antes
                        if (!isOnOffer({ status }) && !window.confirm(`¿Marcar "${p.title}" como ${SALE_STATUS_LABEL[status].toLowerCase()}? Dejará de mostrarse en el sitio.`)) return;
                        updateProperty(p.id, { status });
                      }}
                      disabled={actor === 'proponente'}
                      aria-label={`Estado comercial de ${p.title}`}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 disabled:opacity-60"
                    >
                      {(Object.keys(SALE_STATUS_LABEL) as PropertyStatus[]).map((s) => (
                        <option key={s} value={s}>{SALE_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    {!isOnOffer(p) && <span className="text-[10px] font-semibold text-slate-500">No se muestra en el sitio</span>}
                  </div>
                  <PortalPublishControl property={p} listing={portals.listings[p.id]} connected={portals.connected} onChanged={() => void portals.reload()} />
                  {p.publicationStatus === 'rechazada' && p.rejectionReason && (
                    <p className="text-[11px] text-rose-600 font-semibold">Motivo del rechazo: {p.rejectionReason}</p>
                  )}
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{p.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{p.description}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleEditProperty(p)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                {availableActions(actor, p.publicationStatus ?? 'publicada').map((action) => (
                  <button
                    key={action}
                    onClick={() => {
                      if (action === 'enviar') submitForReview(p.id);
                      else if (action === 'aprobar') {
                        if (roomToPublish()) approveProperty(p.id);
                      }
                      else setRejectingId(p.id);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-sm ${
                      action === 'rechazar'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-urbe-primary text-white'
                    }`}
                  >
                    {action === 'enviar' ? 'Enviar a revisión' : action === 'aprobar' ? 'Aprobar y publicar' : 'Rechazar'}
                  </button>
                ))}
                <button
                  onClick={() => deleteProperty(p.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Eliminar Propiedad"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {rejectingId && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Rechazar publicación</h3>
            <p className="text-[11px] text-slate-500">El agente verá este motivo para corregir y volver a enviarla.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Ej: faltan fotos del living y el valor no coincide con la ficha."
              aria-label="Motivo del rechazo"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                disabled={!rejectReason.trim()}
                onClick={() => {
                  rejectProperty(rejectingId, rejectReason);
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Creation / Edit Modal with DRAG & DROP PC MEDIA UPLOADER */}
      {isPropertyModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {editingPropId ? 'Editar Propiedad' : 'Publicar Nueva Propiedad'}
                </h3>
                <p className="text-[11px] text-slate-500">Carga fotos y videos directamente desde tu computador.</p>
              </div>
              <button onClick={() => setIsPropertyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de la Propiedad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Penthouse Dúplex con Terraza en Vitacura"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-urbe-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operación</label>
                  <select
                    value={propOperation}
                    onChange={(e) => setPropOperation(e.target.value as OperationType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="venta">Venta</option>
                    <option value="arriendo">Arriendo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Propiedad</label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value as PropertyType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="departamento">Departamento</option>
                    <option value="casa">Casa</option>
                    <option value="parcela_agricola">Parcela Agrícola</option>
                    <option value="oficina_comercial">Oficina Comercial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio *</label>
                  <div className="flex gap-1.5">
                    <NumberInput
                      required
                      aria-label="Monto del precio"
                      placeholder="Ej: 12.000"
                      value={propPrice}
                      locale={pack.locale}
                      onChange={setPropPrice}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                    <select
                      aria-label="Moneda del precio"
                      value={propCurrency}
                      onChange={(e) => setPropCurrency(e.target.value)}
                      className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      {pack.currencies.map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{capitalize(t('market.locality'))}</label>
                  <select
                    value={propCommune}
                    required
                    onChange={(e) => setPropCommune(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="" disabled>
                      {t('market.selectLocality')}
                    </option>
                    {zones.map((zone) => (
                      <optgroup key={zone.groupName} label={zone.groupName}>
                        {zone.localities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                    ))}
                    {/* Una propiedad guardada antes de acotar las zonas conserva su comuna al editarla */}
                    {propCommune && !localities.includes(propCommune) && (
                      <option value={propCommune}>{propCommune}</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección / Sector *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. Nueva Costanera / Alonso de Córdova"
                  value={propAddress}
                  onChange={(e) => setPropAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dorm.</label>
                  <input
                    type="number"
                    value={propBedrooms}
                    onChange={(e) => setPropBedrooms(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Baños</label>
                  <input
                    type="number"
                    value={propBathrooms}
                    onChange={(e) => setPropBathrooms(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">M² Const.</label>
                  <input
                    type="number"
                    value={propBuiltM2}
                    onChange={(e) => setPropBuiltM2(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estac.</label>
                  <input
                    type="number"
                    value={propParking}
                    onChange={(e) => setPropParking(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* MEDIA UPLOADER SECTION (DRAG & DROP PC IMAGES / VIDEOS) */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    📸 Cargar Imágenes y Video desde tu PC
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {propImages.length} imagen(es) agregadas
                  </span>
                </div>

                {/* Drag and drop box */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingMedia(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingMedia(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingMedia(false);
                    handlePropertyMediaFiles(e.dataTransfer.files);
                  }}
                  onClick={() => propertyFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isDraggingMedia 
                      ? 'border-urbe-primary bg-urbe-primary/10' 
                      : 'border-slate-300 hover:border-urbe-primary bg-white'
                  }`}
                >
                  <input
                    ref={propertyFileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => handlePropertyMediaFiles(e.target.files)}
                  />
                  <UploadCloud className="w-7 h-7 text-urbe-primary mx-auto mb-1" />
                  <p className="font-bold text-slate-800 text-xs">
                    Arrastra imágenes o videos aquí, o haz clic para buscar en tu PC
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Formatos JPG, PNG, WEBP, MP4, MOV (Múltiple selección permitida)
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{IMAGE_GUIDE}</p>
                </div>

                {/* Alternativa: Pegar URL Web */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="O pegar URL web de imagen (https://...)"
                    value={propUrlInput}
                    onChange={(e) => setPropUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Agregar URL
                  </button>
                </div>

                {/* Uploaded Images Thumbnails Grid */}
                {propImages.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-slate-600 mb-1.5">
                      Galería de la propiedad (La primera es la portada):
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                      {propImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-950">
                          <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {idx === 0 ? (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black shadow">
                              Portada
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 hover:bg-emerald-600 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Hacer Portada"
                            >
                              Hacer Portada
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemovePropertyImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uploaded Video Indicator */}
                {propVideoUrl && (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-rose-600" />
                      <span className="font-bold">Video cargado para recorrido virtual</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPropVideoUrl('')}
                      className="text-rose-600 hover:underline font-bold text-[11px]"
                    >
                      Quitar Video
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={propDescription}
                  onChange={(e) => setPropDescription(e.target.value)}
                  placeholder="Detalles sobre orientación, comodidades..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPropertyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-urbe-primary text-white font-bold shadow hover:bg-urbe-primaryDark transition-colors"
                >
                  {editingPropId ? 'Guardar Cambios' : 'Crear Propiedad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
