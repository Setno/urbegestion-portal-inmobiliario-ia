import React, { useState } from 'react';
import {
  X,
  LayoutDashboard,
  Trash2,
  MessageCircle,
  Calendar,
  Image as ImageIcon,
  Maximize2,
  Download,
  Paperclip,
  Search,
  FileSpreadsheet,
  List,
  Flame,
  CalendarClock
} from 'lucide-react';
import { useLeadStore } from '../stores/useLeadStore';
import { usePropertyStore } from '../../catalogo/stores/usePropertyStore';
import { Lead, LeadStatus } from '../types/lead';
import { buildPropertyFromLead } from '../services/leadToProperty';
import { useCan } from '../../../core/platform/useEntitlementsStore';
import { downloadFile, exportFileName, leadsToCsv } from '../../../core/export/dataExport';
import { displayEmail } from '../services/leadEmail';
import { sourceLabel, attributionLabel } from '../services/leadSource';
import { ActionBadge, NextActionEditor, TodayPanel } from './NextAction';
import { Timeline } from './Timeline';
import { Agenda } from './Agenda';
import { Reports } from './Reports';

export const LeadsTab: React.FC = () => {
  const { leads, updateLeadStatus, addNoteToLead, deleteLead, linkProperty } = useLeadStore();
  const { properties, addProperty } = usePropertyStore();
  const canExportCsv = useCan('crm.export');

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null);

  // Mobile Active Kanban Stage Filter
  const [mobileActiveStage, setMobileActiveStage] = useState<LeadStatus>('nuevo');

  // CRM High-Volume Workflow & Filter State
  const [crmViewMode, setCrmViewMode] = useState<'kanban' | 'table' | 'agenda' | 'reports'>('kanban');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [leadPropertyFilter, setLeadPropertyFilter] = useState('all');
  const [leadPriorityFilter, setLeadPriorityFilter] = useState<'all' | 'today' | 'appointment' | 'attachments'>('all');

  const filteredLeads = leads.filter((lead) => {
    // 1. Search Query
    if (leadSearchQuery.trim()) {
      const q = leadSearchQuery.toLowerCase();
      const matchesSearch = 
        lead.fullName.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        (lead.propertyTitle && lead.propertyTitle.toLowerCase().includes(q)) ||
        lead.notes.some(n => n.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    // 2. Property Filter
    if (leadPropertyFilter !== 'all') {
      if (lead.propertyInterestId !== leadPropertyFilter && (!lead.propertyTitle || !lead.propertyTitle.includes(leadPropertyFilter))) {
        return false;
      }
    }

    // 3. Priority / Alarm Filter
    if (leadPriorityFilter === 'today') {
      const todayStr = new Date().toISOString().slice(0, 10);
      const isToday = lead.createdAt.includes(todayStr) || (lead.appointmentDate && lead.appointmentDate.includes(todayStr));
      if (!isToday) return false;
    } else if (leadPriorityFilter === 'appointment') {
      if (!lead.appointmentDate) return false;
    } else if (leadPriorityFilter === 'attachments') {
      if (!lead.attachments || lead.attachments.length === 0) return false;
    }

    return true;
  });

  // Misma exportaci\u00F3n segura que la de "Mi corredora" (H-053): comillas en cada celda con signos, nada que Excel tome por f\u00F3rmula
  // y el archivo viaja como archivo, no dentro de un enlace donde un "#" lo cortar\u00EDa.
  const handleExportLeadsCsv = () => {
    downloadFile(exportFileName('contactos', 'csv'), leadsToCsv(filteredLeads), 'text/csv');
  };

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
    const updated = useLeadStore.getState().leads.find(l => l.id === leadId);
    if (updated) setSelectedLead(updated);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/80 flex flex-col space-y-4">
        
        <TodayPanel leads={leads} onOpen={setSelectedLead} />

        {/* Header info & Export Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Pipeline de Conversión & Gestión de Leads</h3>
              <span className="text-xs bg-urbe-primary/10 text-urbe-primary px-2.5 py-0.5 rounded-full font-bold">
                {filteredLeads.length} de {leads.length} leads
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Seguimiento con alarmas de vencimiento, filtro por propiedad y exportación rápida.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Switcher: Kanban vs Table */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setCrmViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  crmViewMode === 'kanban' ? 'bg-white text-urbe-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setCrmViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  crmViewMode === 'table' ? 'bg-white text-urbe-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabla Lista</span>
              </button>
              <button
                type="button"
                onClick={() => setCrmViewMode('agenda')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  crmViewMode === 'agenda' ? 'bg-white text-urbe-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>Agenda</span>
              </button>
              <button
                type="button"
                onClick={() => setCrmViewMode('reports')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  crmViewMode === 'reports' ? 'bg-white text-urbe-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>Reportes</span>
              </button>
            </div>

            {/* CSV Export Button */}
            {canExportCsv && (
            <button
              type="button"
              onClick={handleExportLeadsCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              title="Exportar a Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
            )}
          </div>
        </div>

        {/* High-Volume Filter Toolbar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
          {/* Search input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={leadSearchQuery}
              onChange={(e) => setLeadSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, fono, nota o comuna..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 font-medium"
            />
            {leadSearchQuery && (
              <button
                onClick={() => setLeadSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Property Filter Dropdown */}
          <div className="w-full md:w-64">
            <select
              aria-label="Filtrar por propiedad"
              value={leadPropertyFilter}
              onChange={(e) => setLeadPropertyFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="all">🏠 Todas las Propiedades</option>
              {properties.map((p) => (
                <option key={p.id} value={p.title}>
                  {p.title} ({p.commune})
                </option>
              ))}
            </select>
          </div>

          {/* Priority / Alarm Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setLeadPriorityFilter('all')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap border transition-all ${
                leadPriorityFilter === 'all' 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setLeadPriorityFilter('appointment')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap border flex items-center gap-1 transition-all ${
                leadPriorityFilter === 'appointment' 
                  ? 'bg-purple-700 text-white border-purple-700 shadow-sm' 
                  : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Visitas ({leads.filter(l => l.appointmentDate).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLeadPriorityFilter('attachments')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap border flex items-center gap-1 transition-all ${
                leadPriorityFilter === 'attachments' 
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Con Fotos ({leads.filter(l => l.attachments && l.attachments.length > 0).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLeadPriorityFilter('today')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap border flex items-center gap-1 transition-all ${
                leadPriorityFilter === 'today' 
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>De Hoy ({leads.filter(l => l.createdAt.includes(new Date().toISOString().slice(0, 10))).length})</span>
            </button>
          </div>
        </div>

        {/* Vista tabla de alta densidad (para 100 o más leads) */}
        {crmViewMode === 'agenda' && <Agenda leads={leads} onOpen={setSelectedLead} />}

        {crmViewMode === 'reports' && <Reports leads={leads} />}

        {crmViewMode === 'table' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-bold">Cliente / Origen</th>
                    <th className="px-4 py-3 font-bold">Contacto Rápido</th>
                    <th className="px-4 py-3 font-bold">Propiedad de Interés</th>
                    <th className="px-4 py-3 font-bold">Fecha / Alarma</th>
                    <th className="px-4 py-3 font-bold">Estado del Lead</th>
                    <th className="px-4 py-3 font-bold text-right">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        No se encontraron leads con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const hasPhotos = lead.attachments && lead.attachments.length > 0;
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-urbe-primary/10 text-urbe-primary flex items-center justify-center font-black shrink-0">
                                {lead.fullName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{lead.fullName}</span>
                                <span className="text-[10px] text-slate-400">
                                  {lead.source === 'asistente_ia' ? '🤖 Chatbot IA' : lead.source === 'captacion_propietarios' ? '🏡 Propietario' : '📄 Ficha Web'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <a 
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{lead.phone}</span>
                              </a>
                              <span className="text-[11px] text-slate-400 block">{displayEmail(lead.email)}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3 max-w-xs">
                            <span className="font-medium text-slate-800 block truncate" title={lead.propertyTitle}>
                              {lead.propertyTitle || 'Consulta General'}
                            </span>
                            {hasPhotos && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                                <Paperclip className="w-2.5 h-2.5" /> {lead.attachments?.length} fotos adjuntas
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {lead.appointmentDate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[11px]">
                                <Calendar className="w-3 h-3 text-purple-600" />
                                <span>{lead.appointmentDate} {lead.appointmentTime || ''}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">{lead.createdAt}</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <select
                              aria-label={`Etapa de ${lead.fullName}`}
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                              className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-1.5 font-bold text-slate-800 cursor-pointer"
                            >
                              <option value="nuevo">1. Nuevo</option>
                              <option value="contactado">2. Contactado</option>
                              <option value="visita_agendada">3. Visita Agendada</option>
                              <option value="en_negociacion">4. Negociación</option>
                              <option value="cerrado">5. Cerrado / Éxito</option>
                              <option value="descartado">Descartado</option>
                            </select>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedLead(lead)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-urbe-primary hover:text-white text-slate-700 text-xs font-bold transition-all shadow-sm"
                            >
                              Ver Ficha
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Mode 2: Kanban 5 Columns */}
        {crmViewMode === 'kanban' && (
          <>
            {/* Mobile Tab Stages */}
            <div className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto text-[11px] font-bold">
              {kanbanColumns.map((col) => {
                const count = filteredLeads.filter(l => l.status === col.id).length;
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

            {/* Desktop Kanban 5 Columns */}
            <div className="hidden md:grid md:grid-cols-5 gap-3.5 flex-1 min-h-[500px] overflow-x-auto pb-4">
              {kanbanColumns.map((col) => {
                const columnLeads = filteredLeads.filter((l) => l.status === col.id);
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

                          <ActionBadge lead={lead} />

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
                              aria-label={`Etapa de ${lead.fullName}`}
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
          </>
        )}

      </div>

      {/* Lead Detail Drawer / Modal with PHOTO ATTACHMENTS VIEWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-urbe-primary/10 text-urbe-primary">
                  {sourceLabel(selectedLead.source)}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{selectedLead.fullName}</h3>
                <p className="text-[11px] text-slate-500">Registrado el {selectedLead.createdAt}</p>
                <p className="text-[11px] text-slate-500">Llegó por: {attributionLabel(selectedLead.attribution)}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} aria-label="Cerrar la ficha" className="text-slate-400 hover:text-slate-600">
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
                <span className="font-bold text-slate-800">{displayEmail(selectedLead.email)}</span>
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
                  {selectedLead.operationInterest === 'venta_propietario' && (
                    <div className="pt-1.5 text-xs">
                      {selectedLead.convertedPropertyId ? (
                        <span className="font-semibold text-emerald-700">
                          ✓ Ya hay una propiedad en borrador creada desde este contacto (revísala en Propiedades).
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const propertyId = addProperty(buildPropertyFromLead(selectedLead));
                            linkProperty(selectedLead.id, propertyId);
                            setSelectedLead({ ...selectedLead, convertedPropertyId: propertyId });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-700 text-white font-bold hover:bg-cyan-800"
                        >
                          Crear propiedad en borrador
                        </button>
                      )}
                      <p className="mt-1 text-[10px] text-cyan-800">
                        Lo que envió el propietario es una primera impresión. La propiedad nace como borrador y se completa
                        con tus datos y tus fotos antes de publicarla.
                      </p>
                    </div>
                  )}
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

            <NextActionEditor leadId={selectedLead.id} />

            <Timeline leadId={selectedLead.id} />

            {/* Notes Log */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-1.5">Bitácora / Historial de Notas</h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-28 overflow-y-auto space-y-1.5 text-xs text-slate-700">
                {(leads.find((l) => l.id === selectedLead.id)?.notes ?? selectedLead.notes).map((n, i) => (
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
    </>
  );
};
