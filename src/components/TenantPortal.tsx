import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Stethoscope,
  MapPin,
  Calendar,
  Search,
  Filter,
  Phone,
  Instagram,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Lock,
  Target,
  Camera,
  X,
  Globe,
  Mail,
  Clock,
  Award,
  Edit3,
  Save,
  FileText,
  Check,
  Activity,
  Layers,
  Cake,
  Send
} from 'lucide-react';
import { Tenant, Veterinarian, Visit, VisitReport, FollowUpTask, FeedbackSentiment, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface TenantPortalProps {
  tenants: Tenant[];
  currentTenantId: string | null;
  onSelectTenant: (tenantId: string | null) => void;
  vets: Veterinarian[];
  visits: Visit[];
  reports: VisitReport[];
  tasks: FollowUpTask[];
  currentUserRole?: UserRole;
  onTenantUpdated?: () => void;
}

export const TenantPortal: React.FC<TenantPortalProps> = ({
  tenants,
  currentTenantId,
  onSelectTenant,
  vets,
  visits,
  reports,
  tasks,
  currentUserRole = 'super_admin',
  onTenantUpdated
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'profile' | 'birthdays'>('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('ALL');
  const [activePhotoLightbox, setActivePhotoLightbox] = useState<string | null>(null);
  const [customGreetingModalVet, setCustomGreetingModalVet] = useState<Veterinarian | null>(null);
  const [customGreetingText, setCustomGreetingText] = useState('');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  // If no specific tenant is selected, pick the first one by default for demonstration of RLS
  const activeTenantId = currentTenantId || tenants[0]?.id || 'tenant-mova';
  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  // Local state for editing profile
  const [editForm, setEditForm] = useState({
    company_name: activeTenant?.company_name || '',
    trade_name: activeTenant?.trade_name || '',
    cnpj: activeTenant?.cnpj || '',
    segment: activeTenant?.segment || '',
    phone: activeTenant?.phone || '',
    email: activeTenant?.email || '',
    website: activeTenant?.website || '',
    whatsapp_emergencies: activeTenant?.whatsapp_emergencies || '',
    address_street: activeTenant?.address_street || '',
    neighborhood: activeTenant?.neighborhood || '',
    city: activeTenant?.city || '',
    state: activeTenant?.state || '',
    cep: activeTenant?.cep || '',
    technical_responsible: activeTenant?.technical_responsible || '',
    technical_crmv: activeTenant?.technical_crmv || '',
    operating_hours: activeTenant?.operating_hours || '',
    description: activeTenant?.description || '',
    differential: activeTenant?.differential || ''
  });

  const handleStartEdit = () => {
    setEditForm({
      company_name: activeTenant?.company_name || '',
      trade_name: activeTenant?.trade_name || '',
      cnpj: activeTenant?.cnpj || '',
      segment: activeTenant?.segment || '',
      phone: activeTenant?.phone || '',
      email: activeTenant?.email || '',
      website: activeTenant?.website || '',
      whatsapp_emergencies: activeTenant?.whatsapp_emergencies || '',
      address_street: activeTenant?.address_street || '',
      neighborhood: activeTenant?.neighborhood || '',
      city: activeTenant?.city || '',
      state: activeTenant?.state || '',
      cep: activeTenant?.cep || '',
      technical_responsible: activeTenant?.technical_responsible || '',
      technical_crmv: activeTenant?.technical_crmv || '',
      operating_hours: activeTenant?.operating_hours || '',
      description: activeTenant?.description || '',
      differential: activeTenant?.differential || ''
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    StorageService.updateTenant(activeTenant.id, editForm);
    setIsEditingProfile(false);
    setProfileSuccessMsg(true);
    setTimeout(() => setProfileSuccessMsg(false), 4000);
    if (onTenantUpdated) {
      onTenantUpdated();
    }
  };

  // STRICT ROW-LEVEL SECURITY (RLS) FILTERING
  const tenantReports = reports.filter((r) => r.tenant_id === activeTenantId);
  const tenantVisitMap = new Map<string, Visit>(visits.map((v) => [v.id, v]));
  const vetMap = new Map<string, Veterinarian>(vets.map((v) => [v.id, v]));

  // Aggregate Metrics for this Tenant
  const totalReports = tenantReports.length;
  const positiveCount = tenantReports.filter((r) => r.sentiment === 'positive').length;
  const neutralCount = tenantReports.filter((r) => r.sentiment === 'neutral').length;
  const complaintCount = tenantReports.filter(
    (r) => r.sentiment === 'complaint' || r.critical_action_needed
  ).length;
  const positiveRatio = totalReports > 0 ? Math.round((positiveCount / totalReports) * 100) : 0;

  // Filtered List
  const filteredReports = tenantReports.filter((rep) => {
    const visit = tenantVisitMap.get(rep.visit_id);
    const vet = visit ? vetMap.get(visit.veterinarian_id) : undefined;
    if (!vet) return false;

    if (sentimentFilter !== 'ALL' && rep.sentiment !== sentimentFilter) return false;

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchName = vet.full_name.toLowerCase().includes(q);
      const matchCrmv = vet.crmv.toLowerCase().includes(q);
      const matchWorkplace = vet.workplace_name.toLowerCase().includes(q);
      const matchObs = rep.observations.toLowerCase().includes(q);
      const matchService = (rep.service_interest || '').toLowerCase().includes(q);
      return matchName || matchCrmv || matchWorkplace || matchObs || matchService;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Tenant Header & RLS Security Notice */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8D9C8] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-sm shrink-0 mt-0.5 sm:mt-0"
              style={{ backgroundColor: activeTenant?.color_theme || '#FF530D' }}
            >
              {activeTenant?.trade_name.substring(0, 1)}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-[#111111] tracking-tight break-words">
                  {activeTenant?.company_name}
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#FDF2E7] text-[#111111] rounded-full border border-[#E8D9C8] shrink-0 whitespace-nowrap">
                  CNPJ: {activeTenant?.cnpj || 'N/D'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Segmento: <strong className="text-[#111111]">{activeTenant?.segment}</strong> • Promotoria Match Point Promove
              </p>
            </div>
          </div>

          {/* Tenant Switcher within view (Only accessible for Super Admin & Match Point Promoters) */}
          {currentUserRole !== 'tenant_client' ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-[#FDF2E7] p-2 sm:p-2.5 rounded-xl border border-[#E8D9C8] shrink-0">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Alternar Contratante:</span>
              <select
                id="select-tenant-portal-switch"
                value={activeTenantId}
                onChange={(e) => onSelectTenant(e.target.value)}
                className="bg-white text-xs font-bold text-[#111111] border border-[#E8D9C8] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF530D] cursor-pointer w-full sm:w-auto max-w-full sm:max-w-xs truncate"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.trade_name} ({t.segment})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-2 rounded-xl border border-emerald-200 text-xs font-bold shrink-0">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Ambiente Protegido: {activeTenant?.trade_name}</span>
            </div>
          )}
        </div>

        {/* Confidentiality RLS Banner */}
        <div className="bg-[#111111] text-[#FDF2E7] p-3.5 rounded-xl border border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-start sm:items-center gap-2">
            <Lock className="h-4 w-4 text-[#FBBF3D] shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-relaxed">
              <strong>Segregação Row-Level Security (RLS) Ativa:</strong> Exibindo exclusivamente dados do <strong>{activeTenant?.trade_name}</strong>.
            </span>
          </div>
          <span className="inline-block text-[10px] font-mono text-[#FF530D] uppercase font-bold shrink-0">
            tenant_id: {activeTenantId}
          </span>
        </div>

        {/* Sub-Navigation Tabs: Relatórios de Campo vs Perfil Institucional */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 border-t border-[#E8D9C8] overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSubTab('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'reports'
                ? 'bg-[#FF530D] text-white shadow-sm'
                : 'bg-[#FDF2E7] text-slate-700 hover:bg-[#E8D9C8]/70'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Feedbacks &amp; Visitas ({totalReports})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'profile'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'bg-[#FDF2E7] text-slate-700 hover:bg-[#E8D9C8]/70'
            }`}
          >
            <Building2 className="h-4 w-4 text-[#FF530D]" />
            <span>Perfil &amp; Ficha ({activeTenant?.trade_name})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('birthdays')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'birthdays'
                ? 'bg-[#FBBF3D] text-[#111111] shadow-sm'
                : 'bg-[#FDF2E7] text-slate-700 hover:bg-[#E8D9C8]/70'
            }`}
          >
            <Cake className="h-4 w-4 text-[#FF530D]" />
            <span>Aniversariantes WhatsApp</span>
          </button>
        </div>
      </div>

      {profileSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Perfil da {activeTenant?.trade_name} atualizado com sucesso e sincronizado no banco de dados!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: RELATÓRIOS E FEEDBACKS DE CAMPO                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Visits for this brand */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8D9C8] shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Abordagens Realizadas
              </span>
              <div className="text-3xl font-black text-[#111111]">{totalReports}</div>
              <p className="text-xs text-slate-500">Visitas exclusivas a veterinários</p>
            </div>

            {/* Positive Sentiment */}
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Receptividade Positiva
              </span>
              <div className="text-3xl font-black text-emerald-800">
                {positiveCount} <span className="text-sm font-bold text-emerald-700">({positiveRatio}%)</span>
              </div>
              <p className="text-xs text-emerald-800 font-medium">Interesse imediato em encaminhamento</p>
            </div>

            {/* In Evaluation / Neutral */}
            <div className="bg-[#FDF2E7] p-5 rounded-2xl border border-[#E8D9C8] shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Em Análise / Neutro
              </span>
              <div className="text-3xl font-black text-[#111111]">{neutralCount}</div>
              <p className="text-xs text-slate-600">Aguardando lâmina ou contato D+7</p>
            </div>

            {/* Critical Alerts */}
            <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D90000]">
                Alertas Críticos
              </span>
              <div className="text-3xl font-black text-[#D90000]">{complaintCount}</div>
              <p className="text-xs text-rose-800 font-medium">Reclamações ou pendências comerciais</p>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8D9C8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="input-tenant-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por CRMV, Nome, Clínica ou Feedback..."
                className="w-full pl-9 pr-4 py-2 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Sentiment Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-xs font-bold text-slate-600 shrink-0">Filtrar Sentimento:</span>

              <button
                type="button"
                onClick={() => setSentimentFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                  sentimentFilter === 'ALL'
                    ? 'bg-[#111111] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todos ({totalReports})
              </button>

              <button
                type="button"
                onClick={() => setSentimentFilter('positive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                  sentimentFilter === 'positive'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                🟢 Positivos ({positiveCount})
              </button>

              <button
                type="button"
                onClick={() => setSentimentFilter('neutral')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                  sentimentFilter === 'neutral'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ⚪ Neutros ({neutralCount})
              </button>

              <button
                type="button"
                onClick={() => setSentimentFilter('complaint')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                  sentimentFilter === 'complaint'
                    ? 'bg-[#D90000] text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                🔴 Críticos ({complaintCount})
              </button>
            </div>
          </div>

          {/* FEEDBACKS LIST - EXCLUSIVE TO THIS TENANT */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#FF530D]" />
                Relatórios e Observações de Campo ({filteredReports.length})
              </h3>
              <span className="text-xs text-slate-500">
                Atualizado em tempo real pelos promotores de campo
              </span>
            </div>

            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-[#E8D9C8] space-y-2">
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-700">Nenhum feedback encontrado</h4>
                <p className="text-xs text-slate-500">
                  Não há registros correspondentes aos filtros selecionados para este contratante.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReports.map((rep) => {
                  const visit = tenantVisitMap.get(rep.visit_id);
                  const vet = visit ? vetMap.get(visit.veterinarian_id) : undefined;
                  const isComplaint = rep.sentiment === 'complaint' || rep.critical_action_needed;

                  return (
                    <div
                      key={rep.id}
                      className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md space-y-4 flex flex-col justify-between ${
                        isComplaint ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20' : 'border-[#E8D9C8]'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Vet Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {vet?.avatar_url ? (
                              <img
                                src={vet.avatar_url}
                                alt={vet.full_name}
                                className="h-11 w-11 rounded-full object-cover border border-[#E8D9C8]"
                              />
                            ) : (
                              <div className="h-11 w-11 rounded-full bg-[#FDF2E7] text-[#FF530D] font-black text-sm flex items-center justify-center border border-[#E8D9C8]">
                                {vet?.full_name.substring(0, 2)}
                              </div>
                            )}
                            <div>
                              <h4 className="font-extrabold text-sm text-[#111111]">
                                {vet?.full_name}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-[#FF530D]">
                                  {vet?.crmv}
                                </span>
                                <span className="text-[10px] bg-[#111111] text-[#FBBF3D] font-bold px-1.5 py-0.5 rounded">
                                  {vet?.target_audience_class}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Sentiment Badge */}
                          <div>
                            {rep.sentiment === 'positive' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                🟢 Positivo
                              </span>
                            )}
                            {rep.sentiment === 'neutral' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                                ⚪ Em Análise
                              </span>
                            )}
                            {isComplaint && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#D90000] text-white flex items-center gap-1">
                                🔴 Alerta Crítico
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Workplace & Location */}
                        <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                          <div className="flex items-center gap-1 font-medium text-[#111111]">
                            <Building2 className="h-3.5 w-3.5 text-[#FF530D]" />
                            <span>{vet?.workplace_name} ({vet?.neighborhood}, {vet?.city})</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                            <span>Especialidade: {vet?.specialty}</span>
                          </div>
                        </div>

                        {/* Service Interest */}
                        {rep.service_interest && (
                          <div className="bg-[#FDF2E7] p-2.5 rounded-xl border border-[#E8D9C8]">
                            <span className="text-[10px] font-bold uppercase text-[#FF530D] block">
                              Interesse Específico Manifestado:
                            </span>
                            <p className="text-xs font-bold text-[#111111]">
                              {rep.service_interest}
                            </p>
                          </div>
                        )}

                        {/* Observations */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500">
                            Observação Sigilosa Coletada em Campo:
                          </span>
                          <p className="text-xs text-slate-800 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                            "{rep.observations}"
                          </p>
                        </div>

                        {/* Attached Visit Photos & Evidence (if present) */}
                        {visit?.photos && visit.photos.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-500">
                              <span className="flex items-center gap-1 text-[#FF530D]">
                                <Camera className="h-3.5 w-3.5" />
                                Evidências Anexadas da Visita ({visit.photos.length}):
                              </span>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto py-1">
                              {visit.photos.map((photo, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => setActivePhotoLightbox(photo)}
                                  className="relative h-14 w-14 rounded-xl overflow-hidden border-2 border-[#E8D9C8] hover:border-[#FF530D] shrink-0 transition-transform hover:scale-105 cursor-pointer shadow-2xs group"
                                >
                                  <img
                                    src={photo}
                                    alt={`Evidência ${pIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="h-4 w-4 text-white" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer & Direct Contact Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            Visita: {visit?.visit_date ? new Date(visit.visit_date + 'T12:00:00Z').toLocaleDateString('pt-BR') : 'Hoje'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {vet?.whatsapp && (
                            <a
                              href={`https://wa.me/55${vet.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Olá Dr(a). ${vet.full_name}, sou da equipe do ${activeTenant.trade_name}. Gostaria de dar continuidade à conversa com nosso promotor de campo sobre ${rep.service_interest || 'nossos serviços'}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Phone className="h-3 w-3" />
                              <span>WhatsApp Direto</span>
                            </a>
                          )}

                          {vet?.instagram_handle && (
                            <a
                              href={`https://instagram.com/${vet.instagram_handle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                              title="Instagram"
                            >
                              <Instagram className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PERFIL INSTITUCIONAL & FICHA CADASTRAL COMPLETA                */}
      {/* ========================================================================= */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Profile Card Header */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8D9C8] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8D9C8]">
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-md shrink-0 mt-0.5 sm:mt-0"
                  style={{ backgroundColor: activeTenant?.color_theme || '#FF530D' }}
                >
                  {activeTenant?.trade_name.substring(0, 1)}
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight break-words">
                      {activeTenant?.trade_name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 whitespace-nowrap">
                      Representada Ativa
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {activeTenant?.company_name}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="w-full sm:w-auto px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Edit3 className="h-4 w-4 text-[#FF530D]" />
                    <span>Editar Ficha Cadastral</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancelar Edição</span>
                  </button>
                )}
              </div>
            </div>

            {/* If Not Editing: Read Only View */}
            {!isEditingProfile ? (
              <div className="space-y-6">
                {/* Highlights Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Responsibility */}
                  <div className="bg-[#FDF2E7]/70 p-4 rounded-2xl border border-[#E8D9C8] space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#FF530D] uppercase tracking-wider">
                      <Award className="h-4 w-4" />
                      <span>Responsabilidade Técnica</span>
                    </div>
                    <div className="text-base font-extrabold text-[#111111]">
                      {activeTenant?.technical_responsible || 'Dr. Roberto Almeida'}
                    </div>
                    <div className="text-xs text-slate-600 font-semibold">
                      {activeTenant?.technical_crmv || 'CRMV-SP 18.940'}
                    </div>
                  </div>

                  {/* Operational Hours */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <Clock className="h-4 w-4 text-[#FF530D]" />
                      <span>Horários & Plantão</span>
                    </div>
                    <div className="text-xs font-bold text-[#111111] leading-relaxed">
                      {activeTenant?.operating_hours || 'Seg a Sex: 07:30 às 20:00 | Sáb: 08:00 às 17:00 | Plantão 24h Urgências'}
                    </div>
                  </div>

                  {/* Direct Plantão & Emergencies */}
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      <span>WhatsApp Urgências 24h</span>
                    </div>
                    <div className="text-base font-black text-emerald-800">
                      {activeTenant?.whatsapp_emergencies || '(11) 98822-4411'}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      Canal VIP direto com coordenador de imagem
                    </div>
                  </div>
                </div>

                {/* About & Differentials Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#FF530D]" />
                      <span>Sobre o Centro Diagnóstico</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-[#FDF2E7]/40 p-4 rounded-2xl border border-[#E8D9C8]">
                      {activeTenant?.description ||
                        'Centro de excelência médica e referência em diagnóstico por imagem de alta complexidade e cardiologia veterinária. Equipamentos de última geração com laudos emitidos exclusivamente por médicos-veterinários especialistas.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-600" />
                      <span>Diferenciais Técnicos de Mercado</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
                      {activeTenant?.differential ||
                        'Laudos express em até 2 horas para emergências, visualizador PACS em nuvem com acesso direto para o clínico solicitante, centro cirúrgico auxiliar e suporte anestésico dedicado durante exames tomográficos e de ressonância.'}
                    </p>
                  </div>
                </div>

                {/* Catalog of Exams & Services */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#FF530D]" />
                    <span>Catálogo de Serviços & Especialidades Diagnósticas</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {(activeTenant?.services_offered || [
                      'Tomografia Computadorizada Multislice 3D',
                      'Ressonância Magnética de Alto Campo',
                      'Ecocardiograma com Doppler Contínuo e Pulsátil',
                      'Ultrassonografia Abdominal com POCUS Beira-Leito',
                      'Radiologia Digital Direta (DR) de Alta Resolução',
                      'Eletrocardiograma Digital e Holter 24 Horas',
                      'Citologia e Biópsia Guiada por Imagem',
                      'Pressão Arterial Sistêmica por Doppler Vascular'
                    ]).map((srv, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-[#E8D9C8] flex items-start gap-2 text-xs font-bold text-[#111111] shadow-2xs hover:border-[#FF530D] transition-colors"
                      >
                        <Check className="h-4 w-4 text-[#FF530D] shrink-0 mt-0.5" />
                        <span>{srv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full Registration & Location Details */}
                <div className="bg-[#111111] text-[#FDF2E7] p-6 rounded-2xl border border-[#333333] space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#FBBF3D] flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Dados Cadastrais, Endereço & Contato Oficial</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Razão Social:</span>
                      <strong className="text-white">{activeTenant?.company_name}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">CNPJ / Registro:</span>
                      <strong className="text-white">{activeTenant?.cnpj || '34.892.110/0001-45'}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Telefone Central:</span>
                      <strong className="text-white">{activeTenant?.phone || '(11) 3195-8800'}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">E-mail Corporativo:</span>
                      <strong className="text-white">{activeTenant?.email || 'contato@movadiagnosticos.com.br'}</strong>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Endereço da Unidade Principal:</span>
                      <strong className="text-white">
                        {activeTenant?.address_street || 'Av. Brigadeiro Luís Antônio, 3421'}, {activeTenant?.neighborhood || 'Jardim Paulista'}, {activeTenant?.city || 'São Paulo'} - {activeTenant?.state || 'SP'} (CEP: {activeTenant?.cep || '01401-001'})
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Website Oficial:</span>
                      <a
                        href={activeTenant?.website || 'https://movadiagnosticos.com.br'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FF530D] hover:underline flex items-center gap-1 font-bold"
                      >
                        <Globe className="h-3 w-3" />
                        <span>movadiagnosticos.com.br</span>
                      </a>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Gestão Promotoria:</span>
                      <strong className="text-white">Match Point Promove</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Editable Form */
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nome Fantasia:</label>
                    <input
                      type="text"
                      value={editForm.trade_name}
                      onChange={(e) => setEditForm({ ...editForm, trade_name: e.target.value })}
                      required
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Razão Social:</label>
                    <input
                      type="text"
                      value={editForm.company_name}
                      onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                      required
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">CNPJ:</label>
                    <input
                      type="text"
                      value={editForm.cnpj}
                      onChange={(e) => setEditForm({ ...editForm, cnpj: e.target.value })}
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Segmento:</label>
                    <input
                      type="text"
                      value={editForm.segment}
                      onChange={(e) => setEditForm({ ...editForm, segment: e.target.value })}
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Telefone Central:</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">WhatsApp Urgências 24h:</label>
                    <input
                      type="text"
                      value={editForm.whatsapp_emergencies}
                      onChange={(e) => setEditForm({ ...editForm, whatsapp_emergencies: e.target.value })}
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">E-mail Corporativo:</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Website Oficial:</label>
                    <input
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Responsável Técnico:</label>
                    <input
                      type="text"
                      value={editForm.technical_responsible}
                      onChange={(e) => setEditForm({ ...editForm, technical_responsible: e.target.value })}
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">CRMV do Responsável:</label>
                    <input
                      type="text"
                      value={editForm.technical_crmv}
                      onChange={(e) => setEditForm({ ...editForm, technical_crmv: e.target.value })}
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Endereço (Rua e Número):</label>
                    <input
                      type="text"
                      value={editForm.address_street}
                      onChange={(e) => setEditForm({ ...editForm, address_street: e.target.value })}
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Bairro, Cidade e Estado:</label>
                    <input
                      type="text"
                      value={`${editForm.neighborhood}, ${editForm.city} - ${editForm.state}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(',');
                        setEditForm({
                          ...editForm,
                          neighborhood: parts[0] || editForm.neighborhood,
                          city: parts[1]?.split('-')[0]?.trim() || editForm.city,
                          state: parts[1]?.split('-')[1]?.trim() || editForm.state
                        });
                      }}
                      className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Horário de Funcionamento & Plantão:</label>
                  <input
                    type="text"
                    value={editForm.operating_hours}
                    onChange={(e) => setEditForm({ ...editForm, operating_hours: e.target.value })}
                    className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-bold text-[#111111] text-xs focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Descrição / Missão Institucional:</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Diferenciais Técnicos e Comerciais:</label>
                  <textarea
                    rows={3}
                    value={editForm.differential}
                    onChange={(e) => setEditForm({ ...editForm, differential: e.target.value })}
                    className="w-full p-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8D9C8]">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FF530D] hover:bg-[#e04505] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: ANIVERSARIANTES & PARABÉNS WHATSAPP DO CONTRATANTE             */}
      {/* ========================================================================= */}
      {activeSubTab === 'birthdays' && (() => {
        const currentMonthNum = new Date().getMonth() + 1;
        const currentDayNum = new Date().getDate();

        // Find veterinarians that have birthdays this month
        const monthlyBdayVets = vets.filter((v) => {
          if (!v.birth_date) return false;
          const parts = v.birth_date.split('-');
          return parts.length >= 3 && parseInt(parts[1], 10) === currentMonthNum;
        }).sort((a, b) => {
          const dayA = parseInt(a.birth_date!.split('-')[2], 10);
          const dayB = parseInt(b.birth_date!.split('-')[2], 10);
          return dayA - dayB;
        });

        // Filter by search query if any
        const displayedBdayVets = monthlyBdayVets.filter((v) => {
          if (!searchTerm.trim()) return true;
          const q = searchTerm.toLowerCase();
          return (
            v.full_name.toLowerCase().includes(q) ||
            v.crmv.toLowerCase().includes(q) ||
            v.workplace_name.toLowerCase().includes(q) ||
            v.specialty.toLowerCase().includes(q)
          );
        });

        const openGreetingModal = (vet: Veterinarian) => {
          setCustomGreetingModalVet(vet);
          setCustomGreetingText(
            `Olá Dr(a). ${vet.full_name}! 🎂\n\nNós da equipe ${activeTenant?.trade_name || 'Match Point'} estamos passando para te desejar um Feliz Aniversário muito especial! Que este novo ciclo venha repleto de saúde, grandes conquistas e muito sucesso na sua dedicação à Medicina Veterinária! 🎉🐾\n\nUm grande abraço de toda a nossa equipe!`
          );
        };

        const triggerSendWhatsApp = (vet: Veterinarian, text: string) => {
          const cleanPhone = vet.whatsapp.replace(/\D/g, '');
          const encoded = encodeURIComponent(text);
          window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
          setCustomGreetingModalVet(null);
        };

        return (
          <div className="space-y-6">
            {/* Header / Info Box */}
            <div className="bg-[#111111] text-white p-6 rounded-2xl border border-[#333333] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FBBF3D] via-[#FF530D] to-[#D90000]" />
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-[#FBBF3D] text-[#111111] flex items-center justify-center font-black shrink-0 shadow-sm">
                  <Cake className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Parabéns aos Aniversariantes ({activeTenant?.trade_name})
                  </h3>
                  <p className="text-xs text-[#FDF2E7]/80">
                    Envie felicitações personalizadas via <strong>WhatsApp Web</strong> diretamente em nome da sua empresa para estreitar os laços médicos.
                  </p>
                </div>
              </div>

              <div className="bg-[#1a1a1a] px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-[#FBBF3D] shrink-0 self-start md:self-auto">
                Mês Atual: {new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()} ({monthlyBdayVets.length} aniversariantes)
              </div>
            </div>

            {/* Search filter for birthdays */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8D9C8] flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar aniversariante por nome, CRMV, clínica ou especialidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-slate-400 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Birthday Cards Grid */}
            {displayedBdayVets.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#E8D9C8] space-y-2">
                <Cake className="h-10 w-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Nenhum aniversariante encontrado</h4>
                <p className="text-xs text-slate-400">Não há médicos veterinários cadastrados fazendo aniversário com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedBdayVets.map((vet) => {
                  const parts = vet.birth_date!.split('-');
                  const day = parseInt(parts[2], 10);
                  const isToday = day === currentDayNum;

                  return (
                    <div
                      key={vet.id}
                      className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 shadow-xs relative overflow-hidden ${
                        isToday
                          ? 'border-rose-400 ring-2 ring-rose-400/50 bg-rose-50/20'
                          : 'border-[#E8D9C8] hover:border-[#FF530D]'
                      }`}
                    >
                      {isToday && (
                        <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-black px-3 py-0.5 rounded-bl-xl shadow-xs animate-pulse">
                          🎂 HOJE!
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          {vet.avatar_url ? (
                            <img src={vet.avatar_url} alt={vet.full_name} className="h-12 w-12 rounded-xl object-cover border border-[#E8D9C8] shrink-0" />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-[#FDF2E7] text-[#FF530D] font-black flex items-center justify-center text-base shrink-0 border border-[#E8D9C8]">
                              {vet.full_name.substring(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <h4 className="font-extrabold text-sm text-[#111111] leading-snug">
                              {vet.full_name}
                            </h4>
                            <div className="text-xs text-[#FF530D] font-bold">
                              {vet.crmv} • {vet.specialty}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {vet.workplace_name} ({vet.neighborhood})
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#FDF2E7]/60 p-2.5 rounded-xl border border-[#E8D9C8] flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium flex items-center gap-1.5">
                            <Cake className="h-3.5 w-3.5 text-[#FF530D]" />
                            <span>Data de Aniversário:</span>
                          </span>
                          <span className="font-black text-[#111111]">
                            Dia {day.toString().padStart(2, '0')}/{currentMonthNum.toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openGreetingModal(vet)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Enviar Parabéns (WhatsApp Web)</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom WhatsApp Greeting Modal */}
            {customGreetingModalVet && (
              <div
                className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
                onClick={() => setCustomGreetingModalVet(null)}
              >
                <div
                  className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E8D9C8] shadow-2xl space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Send className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-[#111111]">
                          Mensagem de Aniversário via WhatsApp Web
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Destinatário: <strong>Dr(a). {customGreetingModalVet.full_name}</strong> ({customGreetingModalVet.whatsapp})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomGreetingModalVet(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Texto da Mensagem (Você pode editar antes de enviar):
                    </label>
                    <textarea
                      rows={6}
                      value={customGreetingText}
                      onChange={(e) => setCustomGreetingText(e.target.value)}
                      className="w-full p-3 bg-[#FDF2E7]/30 border border-[#E8D9C8] rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500">
                      💡 Ao clicar em "Abrir no WhatsApp Web", uma nova janela segura será aberta com o texto pronto para disparo.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCustomGreetingModalVet(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerSendWhatsApp(customGreetingModalVet, customGreetingText)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Abrir no WhatsApp Web</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Lightbox / Zoom Modal for Visit Photos in Tenant Portal */}
      {activePhotoLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActivePhotoLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-[#111111] rounded-2xl overflow-hidden border border-[#333333] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 bg-[#1a1a1a] border-b border-[#2a2a2a] text-white">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Camera className="h-4 w-4 text-[#FF530D]" />
                <span>Foto de Evidência da Visita em Campo</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoLightbox(null)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black overflow-auto">
              <img
                src={activePhotoLightbox}
                alt="Evidência da Visita em Tamanho Real"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
