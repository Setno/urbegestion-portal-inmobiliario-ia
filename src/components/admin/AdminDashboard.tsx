import React, { useState } from 'react';
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
  TrendingUp
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
  const [propImage, setPropImage] = useState('');
  const [propDescription, setPropDescription] = useState('');

  // Custom UF State
  const [currentUf, setCurrentUf] = useState(agencyConfig.market.ufValueClp);

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

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle || !propAddress) return;

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
        images: propImage ? [propImage] : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200'],
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
        images: propImage ? [propImage] : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200'],
        description: propDescription,
        features: ['Termopanel', 'Seguridad 24/7', 'Estacionamiento'],
      });
    }

    setIsPropertyModalOpen(false);
    setEditingPropId(null);
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
    setPropImage(p.images[0] || '');
    setPropDescription(p.description);
    setIsPropertyModalOpen(true);
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

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            aria-label="Cerrar CRM"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Global Navigation Tabs (Fully Responsive) */}
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
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustes UF</span>
          </button>
        </div>

        {/* Tab 1: CRM Pipeline Kanban */}
        {activeTab === 'crm' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/80 flex flex-col">
            
            {/* Header info */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Pipeline de Conversión</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Administra prospectos y cambia su estado de cierre.</p>
              </div>
              <span className="text-[11px] sm:text-xs bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-slate-700 font-black">
                {leads.length} Leads
              </span>
            </div>

            {/* MOBILE ONLY: Stage Pill Switcher */}
            <div className="md:hidden flex gap-1.5 overflow-x-auto pb-2 mb-3 shrink-0">
              {kanbanColumns.map((col) => {
                const count = leads.filter(l => l.status === col.id).length;
                const isActive = mobileActiveStage === col.id;

                return (
                  <button
                    key={col.id}
                    onClick={() => setMobileActiveStage(col.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                      isActive
                        ? 'bg-urbe-primary text-white border-urbe-primary shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>{col.shortTitle}</span>
                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                      isActive ? 'bg-white text-urbe-primary' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* MOBILE ONLY: Vertical Cards List for Active Stage */}
            <div className="md:hidden flex-1 overflow-y-auto space-y-2.5">
              {mobileFilteredLeads.length > 0 ? (
                mobileFilteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {lead.source.replace('_', ' ').toUpperCase()}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{lead.fullName}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{lead.createdAt}</span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      🎯 {lead.propertyTitle || 'Consulta General'}
                    </p>

                    {lead.appointmentDate && (
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-900 text-xs font-bold flex items-center gap-1.5 border border-purple-100">
                        <Calendar className="w-3.5 h-3.5 text-purple-700" />
                        <span>Visita: {lead.appointmentDate} ({lead.appointmentTime || '11:00'})</span>
                      </div>
                    )}

                    {/* Quick Direct Actions on Mobile */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <a
                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200"
                      >
                        <Phone className="w-3.5 h-3.5 text-urbe-primary" />
                        <span>Llamar</span>
                      </a>
                    </div>

                    {/* Stage selector dropdown */}
                    <div className="pt-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mover de Etapa:</label>
                      <select
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                      >
                        <option value="nuevo">1. Nuevo Prospecto</option>
                        <option value="contactado">2. En Contacto / Calificación</option>
                        <option value="visita_agendada">3. Visita Agendada</option>
                        <option value="en_negociacion">4. En Negociación / Oferta</option>
                        <option value="cerrado">5. Cierre Exitoso / Ganado</option>
                        <option value="descartado">Descartado</option>
                      </select>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 text-slate-400 text-xs">
                  No hay prospectos en la etapa <strong>"{mobileActiveStage}"</strong> actualmente.
                </div>
              )}
            </div>

            {/* DESKTOP ONLY: 5 Columns Full Kanban Layout */}
            <div className="hidden md:grid grid-cols-5 gap-4 h-[calc(100%-48px)]">
              {kanbanColumns.map((col) => {
                const columnLeads = leads.filter(l => l.status === col.id);

                return (
                  <div
                    key={col.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
                  >
                    <div className={`p-3.5 border-b font-bold text-xs flex items-center justify-between ${col.bg}`}>
                      <span className={col.color}>{col.title}</span>
                      <span className="w-5 h-5 rounded-full bg-white text-slate-800 text-[11px] font-black flex items-center justify-center shadow-sm">
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
                <p className="text-[11px] sm:text-xs text-slate-500">Agrega inmuebles, edita precios en UF y administra su disponibilidad.</p>
              </div>

              <button
                onClick={() => {
                  setEditingPropId(null);
                  setPropTitle('');
                  setPropAddress('');
                  setPropDescription('');
                  setIsPropertyModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-urbe-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow hover:bg-urbe-primaryDark transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Propiedad</span>
              </button>
            </div>

            {/* Responsive Card Layout on Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {properties.map((p) => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={p.images[0]} alt="" className="w-14 h-12 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        p.operation === 'venta' ? 'bg-cyan-100 text-cyan-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.operation}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs truncate mt-0.5">{p.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">{p.commune}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-semibold text-slate-700">
                    <span className="font-black text-slate-900 text-sm">{p.priceUf.toLocaleString('es-CL')} UF</span>
                    <span>{p.builtAreaM2 > 0 ? `${p.builtAreaM2} m²` : `${p.totalAreaM2} m²`}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <select
                      value={p.status}
                      onChange={(e) => updateProperty(p.id, { status: e.target.value as PropertyStatus })}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="reservada">Reservada</option>
                      <option value="vendida">Vendida</option>
                      <option value="arrendada">Arrendada</option>
                    </select>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEditProperty(p)}
                        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProperty(p.id)}
                        className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Tab 3: Analytics */}
        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Métricas & Rendimiento</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Distribución de leads generados y catálogo disponible.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Channel Distribution Chart */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Leads por Canal de Captura
                </h4>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadSourceData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label
                      >
                        {leadSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 text-[11px] font-semibold">
                  {leadSourceData.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Inventory Breakdown */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Inventario por Tipología
                </h4>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={propertyTypeStats}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#164e63" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Market Settings & UF */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 max-w-2xl">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">Configuración de Valores</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mb-4 sm:mb-6">Modifica parámetros financieros globales.</p>

            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
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
                  Actualiza en vivo todos los precios calculados en pesos chilenos a través del portal.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Property Creation / Edit Modal */}
      {isPropertyModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {editingPropId ? 'Editar Propiedad' : 'Publicar Nueva Propiedad'}
              </h3>
              <button onClick={() => setIsPropertyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de la Propiedad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Penthouse Dúplex con Terraza en Vitacura"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Imagen Principal</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={propImage}
                  onChange={(e) => setPropImage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
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
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-urbe-primary text-white font-bold shadow"
                >
                  {editingPropId ? 'Guardar Cambios' : 'Crear Propiedad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
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
              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500 font-medium">Teléfono / WhatsApp:</span>
                <a href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="font-bold text-emerald-700 flex items-center gap-1">
                  📞 {selectedLead.phone}
                </a>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500 font-medium">Correo:</span>
                <span className="font-bold text-slate-800">{selectedLead.email}</span>
              </div>
              {selectedLead.appointmentDate && (
                <div className="flex justify-between p-2 rounded-lg bg-purple-50 text-purple-900">
                  <span className="font-medium">Cita Agendada:</span>
                  <span className="font-black">{selectedLead.appointmentDate} ({selectedLead.appointmentTime || '11:00'})</span>
                </div>
              )}
            </div>

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
                Eliminar
              </button>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
