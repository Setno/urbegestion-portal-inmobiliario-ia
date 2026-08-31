import React, { useState, useRef } from 'react';
import { 
  X, 
  LayoutDashboard, 
  Building, 
  Users, 
  BarChart3, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Phone, 
  MessageCircle,
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  TrendingUp, 
  UploadCloud, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Eye, 
  Maximize2, 
  Download, 
  Star, 
  Check, 
  Paperclip, 
  ExternalLink,
  Zap,
  Globe,
  Share2,
  RefreshCw,
  Clock,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useLeadStore } from '../../stores/useLeadStore';
import { usePropertyStore } from '../../stores/usePropertyStore';
import { agencyConfig } from '../../config/agencyConfig';
import { REGION_METROPOLITANA_ZONES } from '../../data/chileanLocations';
import { Lead, LeadStatus } from '../../types/lead';
import { Property, PropertyType, OperationType, PropertyStatus } from '../../types/property';
import { webhookService } from '../../services/webhookService';
import { getAiConfig, saveAiConfig, AiProviderType } from '../../services/aiService';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { leads, updateLeadStatus, addNoteToLead, deleteLead } = useLeadStore();
  const { properties, addProperty, updateProperty, deleteProperty } = usePropertyStore();

  const [activeTab, setActiveTab] = useState<'crm' | 'properties' | 'analytics' | 'settings'>('crm');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null);

  // Mobile Active Kanban Stage Filter
  const [mobileActiveStage, setMobileActiveStage] = useState<LeadStatus>('nuevo');

  // Property Form Modal State
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [propTitle, setPropTitle] = useState('');
  const [propOperation, setPropOperation] = useState<OperationType>('venta');
  const [propType, setPropType] = useState<PropertyType>('departamento');
  const [propPriceUf, setPropPriceUf] = useState(12000);
  const [propCommune, setPropCommune] = useState('Las Condes');
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

  // Custom UF State
  const [currentUf, setCurrentUf] = useState(agencyConfig.market.ufValueClp);

  // Integration Settings State (GoHighLevel & Cal.com)
  const [ghlWebhookUrl, setGhlWebhookUrl] = useState(() => webhookService.getWebhookConfig().ghlWebhookUrl);
  const [calComUrl, setCalComUrl] = useState(() => webhookService.getWebhookConfig().calComUrl);
  const [isTestingGhl, setIsTestingGhl] = useState(false);
  const [ghlTestResult, setGhlTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // AI Assistant Engine State
  const [aiProvider, setAiProvider] = useState<AiProviderType>(() => getAiConfig().provider);
  const [aiApiKey, setAiApiKey] = useState(() => getAiConfig().apiKey || '');
  const [aiModelName, setAiModelName] = useState(() => getAiConfig().modelName || 'gpt-4o-mini');
  const [aiSystemPrompt, setAiSystemPrompt] = useState(() => getAiConfig().systemPrompt || '');
  const [showAiKey, setShowAiKey] = useState(false);

  if (!isOpen) return null;

  // Kanban Columns Definition
  const kanbanColumns: { id: LeadStatus; title: string; shortTitle: string; color: string; bg: string }[] = [
    { id: 'nuevo', title: 'Nuevos Prospectos', shortTitle: 'Nuevos', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    { id: 'contactado', title: 'En Calificación', shortTitle: 'Contactados', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    { id: 'visita_agendada', title: 'Visita Agendada', shortTitle: 'Visitas', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    { id: 'en_negociacion', title: 'En Negociación', shortTitle: 'Negociación', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
    { id: 'cerrado', title: 'Cierre Ganado', shortTitle: 'Cerrados', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  ];

  const handleAddNote = (leadId: string) => {
    if (!newNote.trim()) return;
    addNoteToLead(leadId, newNote);
    setNewNote('');
    const updated = leads.find(l => l.id === leadId);
    if (updated) setSelectedLead(updated);
  };

  // Media files handler from PC (Images / Videos)
  const handlePropertyMediaFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        if (isVideo) {
          setPropVideoUrl(url);
        } else {
          setPropImages((prev) => [...prev, url]);
        }
      };
      reader.readAsDataURL(file);
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

  const handleOpenNewProperty = () => {
    setEditingPropId(null);
    setPropTitle('');
    setPropOperation('venta');
    setPropType('departamento');
    setPropPriceUf(12000);
    setPropCommune('Las Condes');
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
    setPropPriceUf(p.priceUf);
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
    if (!propTitle || !propAddress) return;

    const finalImages = propImages.length > 0 
      ? propImages 
      : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200'];

    if (editingPropId) {
      updateProperty(editingPropId, {
        title: propTitle,
        operation: propOperation,
        propertyType: propType,
        priceUf: propPriceUf,
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
      });
    } else {
      addProperty({
        title: propTitle,
        operation: propOperation,
        propertyType: propType,
        priceUf: propPriceUf,
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
      });
    }

    setIsPropertyModalOpen(false);
    setEditingPropId(null);
  };

  const handleSaveIntegrations = () => {
    webhookService.saveWebhookConfig({
      ghlWebhookUrl,
      calComUrl,
      isEnabled: true,
    });
    saveAiConfig({
      provider: aiProvider,
      apiKey: aiApiKey,
      modelName: aiModelName,
      systemPrompt: aiSystemPrompt,
    });
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleTestGHL = async () => {
    setIsTestingGhl(true);
    setGhlTestResult(null);
    const res = await webhookService.testConnection(ghlWebhookUrl);
    setGhlTestResult(res);
    setIsTestingGhl(false);
  };

  // Analytics Data
  const leadSourceData = [
    { name: 'Asistente IA Concierge', value: leads.filter(l => l.source === 'asistente_ia').length, color: '#164e63' },
    { name: 'Ficha de Propiedad', value: leads.filter(l => l.source === 'ficha_propiedad').length, color: '#c59b27' },
    { name: 'Captación Propietarios', value: leads.filter(l => l.source === 'captacion_propietarios').length, color: '#059669' },
  ];

  const propertyTypeStats = [
    { name: 'Deptos', count: properties.filter(p => p.propertyType === 'departamento').length },
    { name: 'Casas', count: properties.filter(p => p.propertyType === 'casa').length },
    { name: 'Agrícolas', count: properties.filter(p => p.propertyType === 'parcela_agricola').length },
    { name: 'Oficinas', count: properties.filter(p => p.propertyType === 'oficina_comercial').length },
  ];

  const mobileFilteredLeads = leads.filter(l => l.status === mobileActiveStage);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      
      <div className="bg-white w-full max-w-7xl h-full sm:h-[92vh] sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Admin Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-urbe-accent/20 text-urbe-accent flex items-center justify-center font-bold">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
                Panel Auto-Gestión & CRM
                <span className="text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  En Vivo
                </span>
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {agencyConfig.brandName} • {agencyConfig.brokerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sessionStorage.removeItem('urbe_admin_authenticated');
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="Cerrar sesión de Administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              aria-label="Cerrar CRM"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center gap-1.5 overflow-x-auto shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'crm' ? 'bg-urbe-primary text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Leads CRM ({leads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'properties' ? 'bg-urbe-primary text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Propiedades ({properties.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'analytics' ? 'bg-urbe-primary text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Métricas</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'settings' ? 'bg-urbe-primary text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-urbe-accent" />
            <span>Integraciones & Ajustes</span>
          </button>
        </div>

        {/* Tab 1: CRM Pipeline Kanban */}
        {activeTab === 'crm' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/80 flex flex-col">
            
            {/* Header info */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Pipeline de Conversión</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Administra prospectos, propietarios y antecedentes adjuntos.</p>
              </div>
              <span className="text-[11px] sm:text-xs bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-slate-700 font-black">
                {leads.length} Leads
              </span>
            </div>

            {/* Mobile Tab Stages */}
            <div className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto text-[11px] font-bold">
              {kanbanColumns.map((col) => {
                const count = leads.filter(l => l.status === col.id).length;
                return (
                  <button
                    key={col.id}
                    onClick={() => setMobileActiveStage(col.id)}
                    className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap border flex items-center gap-1.5 transition-all ${
                      mobileActiveStage === col.id 
                        ? `${col.bg} font-black ${col.color} ring-2 ring-urbe-primary/20 shadow-sm`
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{col.shortTitle}</span>
                    <span className="px-1.5 py-0.2 bg-black/10 rounded-full text-[10px]">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile List View */}
            <div className="flex md:hidden flex-col gap-2.5 overflow-y-auto">
              {mobileFilteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <h4 className="font-bold text-slate-900">{lead.fullName}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">{lead.createdAt}</p>
                    </div>
                    {lead.attachments && lead.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        <Paperclip className="w-3 h-3" /> {lead.attachments.length} fotos
                      </span>
                    )}
                  </div>

                  <p className="text-slate-700 font-medium truncate">
                    🎯 {lead.propertyTitle || 'Consulta General'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>📞 {lead.phone}</span>
                    {lead.appointmentDate && (
                      <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                        📅 {lead.appointmentDate}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Kanban 5 Columns */}
            <div className="hidden md:grid md:grid-cols-5 gap-3.5 flex-1 min-h-[500px] overflow-x-auto pb-4">
              {kanbanColumns.map((col) => {
                const columnLeads = leads.filter((l) => l.status === col.id);
                return (
                  <div
                    key={col.id}
                    className="flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden min-w-[210px]"
                  >
                    <div className={`p-3 border-b ${col.bg} flex items-center justify-between`}>
                      <span className={`font-bold text-xs ${col.color}`}>{col.title}</span>
                      <span className="text-xs font-black bg-white/80 px-2 py-0.5 rounded-full text-slate-700">
                        {columnLeads.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
                      {columnLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-urbe-primary cursor-pointer transition-all space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-slate-900">{lead.fullName}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">{lead.createdAt}</span>
                          </div>

                          <p className="text-slate-600 font-medium truncate">
                            🎯 {lead.propertyTitle || 'Consulta General'}
                          </p>

                          {lead.attachments && lead.attachments.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 w-fit">
                              <Paperclip className="w-3 h-3" />
                              <span>{lead.attachments.length} archivo(s) / fotos</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <span>📞 {lead.phone}</span>
                            {lead.appointmentDate && (
                              <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                                📅 {lead.appointmentDate}
                              </span>
                            )}
                          </div>

                          <div className="pt-2 flex items-center gap-1">
                            <select
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-1 font-semibold text-slate-700 cursor-pointer"
                            >
                              <option value="nuevo">1. Nuevo</option>
                              <option value="contactado">2. Contactado</option>
                              <option value="visita_agendada">3. Visita Agendada</option>
                              <option value="en_negociacion">4. Negociación</option>
                              <option value="cerrado">5. Cerrado / Éxito</option>
                              <option value="descartado">Descartado</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Tab 2: Property Manager CRUD */}
        {activeTab === 'properties' && (
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
                <span>Publicar Nueva Propiedad</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between group">
                  <div>
                    <div className="relative aspect-video bg-slate-950 overflow-hidden">
                      <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
                        {p.priceUf} UF
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
        )}

        {/* Tab 3: Analytics */}
        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">Métricas de Captación</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mb-4">Rendimiento en tiempo real de prospectos y catálogo.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-4">Origen de Prospectos</h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leadSourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {leadSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-4">Distribución de Propiedades</h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={propertyTypeStats}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#164e63" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Integrations (GHL & Cal.com) + Market Settings & UF */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                Ajustes & Conectores de Integración
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Conecta la plataforma en tiempo real con tu CRM externo (GoHighLevel / Zapier) y tu calendario de citas (Cal.com / Calendly).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Integration 1: GoHighLevel Webhook */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-orange-100 text-orange-600 font-bold">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">GoHighLevel / Webhook Sync</h4>
                        <span className="text-[10px] text-slate-400 font-medium">Inbound Leads & Automation Trigger</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Webhook Activo
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cada vez que un prospecto solicite una tasación, suba fotos de su casa o consulte por una propiedad, se enviará el contacto con sus etiquetas y campos personalizados en tiempo real a GoHighLevel.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL del Webhook de GoHighLevel (o Zapier / Make)
                    </label>
                    <input
                      type="url"
                      placeholder="https://services.leadconnectorhq.com/hooks/..."
                      value={ghlWebhookUrl}
                      onChange={(e) => setGhlWebhookUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  {ghlTestResult && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                      ghlTestResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {ghlTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                      <span>{ghlTestResult.message}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleTestGHL}
                    disabled={isTestingGhl || !ghlWebhookUrl}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingGhl ? 'animate-spin' : ''}`} />
                    <span>{isTestingGhl ? 'Enviando Prueba...' : 'Probar Envío a GHL'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveIntegrations}
                    className="px-4 py-2 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold shadow transition-colors"
                  >
                    {saveSuccessMsg ? '¡Guardado!' : 'Guardar Conexión'}
                  </button>
                </div>
              </div>

              {/* Integration 2: Cal.com / Calendly */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-100 text-purple-700 font-bold">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Cal.com / Agendamiento Online</h4>
                        <span className="text-[10px] text-slate-400 font-medium">Google Calendar & Outlook Sync</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      Sincronización 24/7
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Permite que los compradores agenden visitas presenciales o reuniones virtuales en tiempo real según la disponibilidad de tu agenda, sin cruce de horarios.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL del Evento en Cal.com / Calendly
                    </label>
                    <input
                      type="url"
                      placeholder="https://cal.com/urbegestion/visita-propiedad"
                      value={calComUrl}
                      onChange={(e) => setCalComUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={calComUrl || 'https://cal.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver Calendario</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleSaveIntegrations}
                    className="px-4 py-2 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold shadow transition-colors"
                  >
                    {saveSuccessMsg ? '¡Guardado!' : 'Guardar Enlace'}
                  </button>
                </div>
              </div>

            </div>

            {/* Integration 3: AI Assistant LLM Gateway & Custom Prompt */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700 font-bold">
                    <Sparkles className="w-5 h-5 text-urbe-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Motor del Asistente Virtual IA</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Selección de Modelo, API Key & Reglas del Bot</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 w-fit">
                  {aiProvider === 'local_rules' ? '⚡ Motor Local (0 Costo)' : `🤖 LLM Activo: ${aiProvider.toUpperCase()}`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Proveedor de Inteligencia Artificial
                  </label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="local_rules">⚡ Motor Local Experto (Gratis, Ilimitado, Ultrarrápido - Ideal Demo)</option>
                    <option value="openai">🟢 OpenAI (GPT-4o / GPT-4o-mini)</option>
                    <option value="deepseek">🔵 DeepSeek V3 (Ultracosteable y Potente)</option>
                    <option value="openrouter">🟣 OpenRouter (Claude 3.5 Haiku, Gemini Flash, etc.)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Modelo Específico (Ej: gpt-4o-mini, deepseek-chat)
                  </label>
                  <input
                    type="text"
                    value={aiModelName}
                    onChange={(e) => setAiModelName(e.target.value)}
                    placeholder="gpt-4o-mini"
                    disabled={aiProvider === 'local_rules'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              {aiProvider !== 'local_rules' && (
                <div className="space-y-1 text-xs">
                  <label className="block font-bold text-slate-700">
                    API Key del Proveedor ({aiProvider.toUpperCase()})
                  </label>
                  <div className="relative">
                    <input
                      type={showAiKey ? 'text' : 'password'}
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder={`sk-... (Clave de ${aiProvider})`}
                      className="w-full px-3 py-2 pr-20 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAiKey(!showAiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2 py-1 bg-white border border-slate-200 rounded-lg"
                    >
                      {showAiKey ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Tu API Key se almacena localmente de forma segura en tu navegador y nunca se expone en código fuente.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prompt del Sistema / Reglas de Negocio del Agente
                </label>
                <textarea
                  rows={3}
                  value={aiSystemPrompt}
                  onChange={(e) => setAiSystemPrompt(e.target.value)}
                  placeholder="Instrucciones para el tono de voz, calificación de clientes..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveIntegrations}
                  className="px-5 py-2.5 rounded-xl bg-urbe-primary hover:bg-urbe-primaryDark text-white text-xs font-bold shadow transition-colors"
                >
                  {saveSuccessMsg ? '¡Configuración IA Guardada!' : 'Guardar Ajustes de IA'}
                </button>
              </div>
            </div>

            {/* Financial Parameters */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 space-y-4 max-w-xl">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-urbe-primary" />
                Parámetros Financieros Globales
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Valor Actual de la UF ($ CLP)
                </label>
                <input
                  type="number"
                  value={currentUf}
                  onChange={(e) => {
                    setCurrentUf(Number(e.target.value));
                    agencyConfig.market.ufValueClp = Number(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-urbe-primary"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Actualiza en vivo todos los precios calculados en pesos chilenos y simulaciones de crédito en todo el portal.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>

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
                  <label className="block font-bold text-slate-700 mb-1">Precio en UF *</label>
                  <input
                    type="number"
                    required
                    value={propPriceUf}
                    onChange={(e) => setPropPriceUf(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Comuna (Región Metropolitana)</label>
                  <select
                    value={propCommune}
                    onChange={(e) => setPropCommune(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {REGION_METROPOLITANA_ZONES.map(zone => (
                      <optgroup key={zone.groupName} label={zone.groupName}>
                        {zone.communes.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                    ))}
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

      {/* Lead Detail Drawer / Modal with PHOTO ATTACHMENTS VIEWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-urbe-primary/10 text-urbe-primary">
                  {selectedLead.source.toUpperCase()}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{selectedLead.fullName}</h3>
                <p className="text-[11px] text-slate-500">Registrado el {selectedLead.createdAt}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-medium">Teléfono / WhatsApp:</span>
                <a href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="font-bold text-emerald-700 flex items-center gap-1 hover:underline">
                  📞 {selectedLead.phone}
                </a>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-medium">Correo:</span>
                <span className="font-bold text-slate-800">{selectedLead.email}</span>
              </div>
              {selectedLead.propertySpecs && (
                <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-900 space-y-1">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-cyan-800">
                    Detalles del Inmueble (Captación):
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                    <span className="px-2 py-0.5 bg-white rounded-md border border-cyan-200">
                      Operación: {selectedLead.propertySpecs.operation?.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 bg-white rounded-md border border-cyan-200">
                      Tipo: {selectedLead.propertySpecs.propertyType}
                    </span>
                    <span className="px-2 py-0.5 bg-white rounded-md border border-cyan-200">
                      Comuna: {selectedLead.propertySpecs.commune}
                    </span>
                    <span className="px-2 py-0.5 bg-white rounded-md border border-cyan-200">
                      {selectedLead.propertySpecs.areaM2} m² • {selectedLead.propertySpecs.bedrooms} Dorms
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* PHOTOGRAPHIC ANTECEDENTS ATTACHED BY THE OWNER / PROSPECT */}
            {selectedLead.attachments && selectedLead.attachments.length > 0 ? (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Fotografías y Antecedentes Adjuntos ({selectedLead.attachments.length})</span>
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-500">Haz clic para ampliar</span>
                </div>

                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                  {selectedLead.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewAttachment(att)}
                      className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-950 cursor-pointer group hover:border-urbe-primary transition-all"
                    >
                      <img src={att} alt={`Adjunto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-400 text-center">
                Sin archivos fotográficos adjuntos en este registro.
              </div>
            )}

            {/* Notes Log */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-1.5">Bitácora / Historial de Notas</h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-28 overflow-y-auto space-y-1.5 text-xs text-slate-700">
                {selectedLead.notes.map((n, i) => (
                  <p key={i} className="border-b border-slate-100 pb-1 last:border-none">
                    • {n}
                  </p>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Añadir nota de seguimiento..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote(selectedLead.id)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  onClick={() => handleAddNote(selectedLead.id)}
                  className="px-3 py-1.5 bg-urbe-primary text-white rounded-xl text-xs font-bold"
                >
                  Añadir
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={() => {
                  deleteLead(selectedLead.id);
                  setSelectedLead(null);
                }}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar Lead
              </button>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX FOR LEAD ATTACHMENTS */}
      {previewAttachment && (
        <div 
          onClick={() => setPreviewAttachment(null)}
          className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewAttachment(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewAttachment}
              alt="Antecedente ampliado"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={previewAttachment}
                download="antecedente-propiedad.jpg"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Imagen
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
