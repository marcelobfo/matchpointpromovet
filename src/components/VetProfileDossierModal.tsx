import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  Building,
  MapPin,
  Phone,
  Instagram,
  Cake,
  Calendar,
  Send,
  Sparkles,
  Lock,
  Eye,
  Camera,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Plus,
  ExternalLink,
  ShieldCheck,
  Award,
  UserCheck
} from 'lucide-react';
import { Veterinarian, Visit, VisitReport, Tenant, User, UserRole } from '../types';

interface VetProfileDossierModalProps {
  vet: Veterinarian | null;
  isOpen: boolean;
  onClose: () => void;
  visits: Visit[];
  reports: VisitReport[];
  tenants: Tenant[];
  promoters: User[];
  currentUserRole: UserRole;
  currentUserId?: string;
  onStartCheckin: (vet: Veterinarian) => void;
}

export const VetProfileDossierModal: React.FC<VetProfileDossierModalProps> = ({
  vet,
  isOpen,
  onClose,
  visits,
  reports,
  tenants,
  promoters,
  currentUserRole,
  currentUserId,
  onStartCheckin
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'profile' | 'schedule'>('history');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  if (!isOpen || !vet) return null;

  // Strict Promoter Confidentiality: If user is a promoter, only show their OWN visits
  const isPromoterRole = currentUserRole === 'promoter';
  const roleFilteredVisits = isPromoterRole && currentUserId
    ? visits.filter((v) => v.promoter_id === currentUserId)
    : visits;

  // Filter and sort visits for this veterinarian (Chronological: latest first)
  const vetVisits = roleFilteredVisits
    .filter((v) => v.veterinarian_id === vet.id)
    .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());

  // Global last visit across all promoters for this client
  const allGlobalVisitsForVet = visits
    .filter((v) => v.veterinarian_id === vet.id)
    .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  const lastGlobalVisit = allGlobalVisitsForVet[0] || null;
  const lastPromoter = lastGlobalVisit ? promoters.find((p) => p.id === lastGlobalVisit.promoter_id) : null;
  const lastPromoterName = lastPromoter?.full_name || (lastGlobalVisit?.promoter_id === 'user-admin' ? 'Administrador Match Point' : 'Promotor');

  // Check if birthday is today or upcoming
  const getBirthdayStatus = (bDate?: string) => {
    if (!bDate) return null;
    const parts = bDate.split('-');
    if (parts.length < 3) return null;
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const isToday = currentMonth === month && currentDay === day;
    const isThisMonth = currentMonth === month;

    return {
      formatted: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`,
      isToday,
      isThisMonth
    };
  };

  const bday = getBirthdayStatus(vet.birth_date);

  const handleSendBirthdayWhatsApp = () => {
    const cleanPhone = vet.whatsapp.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá Dr(a). ${vet.full_name}! 🎂 Passando em nome da equipe Match Point Promove e nossos centros diagnósticos parceiros para desejar um Feliz Aniversário repleto de saúde, realizações e muito sucesso na sua carreira na Medicina Veterinária! Parabéns pelo seu dia! 🎉🐾`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  const handleScheduleVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDate) return;
    setScheduleSuccess(true);
    setTimeout(() => {
      setScheduleSuccess(false);
      onStartCheckin(vet);
    }, 1200);
  };

  const isInternalUser = currentUserRole === 'super_admin' || currentUserRole === 'promoter';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-[#E8D9C8] shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#111111] text-white p-4 sm:p-6 border-b border-[#2a2a2a] relative shrink-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF530D] via-[#FBBF3D] to-[#D90000]" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {vet.avatar_url ? (
                <img
                  src={vet.avatar_url}
                  alt={vet.full_name}
                  className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl object-cover border-2 border-[#FF530D] shadow-md shrink-0 mt-0.5 sm:mt-0"
                />
              ) : (
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-[#FF530D]/20 text-[#FF530D] border-2 border-[#FF530D]/40 flex items-center justify-center font-black text-xl sm:text-2xl shrink-0 shadow-inner mt-0.5 sm:mt-0">
                  {vet.full_name.substring(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h2 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight break-words">
                    {vet.full_name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-black bg-[#FF530D] text-white shadow-2xs shrink-0">
                    {vet.crmv}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold bg-[#FBBF3D]/20 text-[#FBBF3D] border border-[#FBBF3D]/30 shrink-0">
                    {vet.target_audience_class}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Stethoscope className="h-3.5 w-3.5 text-[#FF530D] shrink-0" />
                    <span className="truncate">{vet.specialty}</span>
                  </div>
                  <span className="hidden sm:inline text-slate-600">•</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building className="h-3.5 w-3.5 text-[#FBBF3D] shrink-0" />
                    <span className="truncate">{vet.workplace_name} ({vet.workplace_type})</span>
                  </div>
                </div>

                {bday && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 ${
                        bday.isToday
                          ? 'bg-rose-500 text-white animate-pulse'
                          : bday.isThisMonth
                          ? 'bg-amber-400 text-[#111111]'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Cake className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Aniversário: {bday.formatted} {bday.isToday ? '🎂 HOJE!' : bday.isThisMonth ? '🎉 Este mês' : ''}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={handleSendBirthdayWhatsApp}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                      title="Enviar Parabéns no WhatsApp Web"
                    >
                      <Send className="h-3 w-3 shrink-0" />
                      <span>Parabenizar no WhatsApp</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onStartCheckin(vet)}
                className="hidden md:flex px-4 py-2 bg-[#FF530D] hover:bg-[#E04505] text-white font-black text-xs rounded-xl items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Novo Check-in</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs with horizontal smooth scroll and no word breaking */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#2a2a2a] overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-[#FF530D] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 bg-white/5'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Histórico de Visitas ({vetVisits.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-[#FF530D] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 bg-white/5'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Dados Cadastrais &amp; Perfil</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'bg-[#FF530D] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 bg-white/5'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Agendar Próxima Visita</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: HISTÓRICO DE VISITAS CRONOLÓGICO */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#FF530D]" />
                    <span>Visitas Médicas Realizadas ({vetVisits.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Histórico completo classificado por ordem cronológica (mais recentes no topo).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onStartCheckin(vet)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#FF530D] hover:bg-[#E04505] text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Check-in</span>
                </button>
              </div>

              {/* Persistent Last Visiting Promoter Banner (Mandatory Display) */}
              {lastGlobalVisit ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-black">
                      <UserCheck className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                        Última Visita Realizada a este Cliente
                      </span>
                      <p className="font-extrabold text-emerald-950 text-sm truncate">
                        Promotor: {lastPromoterName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-lg">
                      Data: {new Date(lastGlobalVisit.visit_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-500 font-medium flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Nenhuma visita registrada anteriormente para este médico-veterinário em território.</span>
                </div>
              )}

              {vetVisits.length === 0 ? (
                <div className="bg-[#FDF2E7]/40 rounded-2xl p-8 text-center border border-[#E8D9C8] space-y-3">
                  <Clock className="h-10 w-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">
                    {isPromoterRole ? 'Você ainda não realizou visitas para este médico' : 'Nenhuma visita registrada ainda'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {isPromoterRole
                      ? (lastGlobalVisit
                          ? `Este médico foi visitado pela última vez por ${lastPromoterName} em ${new Date(lastGlobalVisit.visit_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}. Em respeito à regra de sigilo e isolamento entre promotores, os apontamentos individuais permanecem confidenciais. Inicie seu check-in para construir seu histórico.`
                          : 'Inicie seu atendimento em campo para representar os contratantes e construir seu histórico com este médico-veterinário.')
                      : 'Inicie o primeiro check-in de campo para representar as marcas e gerar o dossiê deste médico-veterinário.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onStartCheckin(vet)}
                    className="px-4 py-2 bg-[#FF530D] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Iniciar Check-in</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {vetVisits.map((visit, vIdx) => {
                    const promoter = promoters.find((p) => p.id === visit.promoter_id);
                    const visitReps = reports.filter((r) => r.visit_id === visit.id);
                    const formattedDate = new Date(visit.visit_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });

                    return (
                      <div
                        key={visit.id}
                        className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-4 relative overflow-hidden"
                      >
                        {/* Orange top accent */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF530D]" />

                        {/* Visit Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="h-7 w-7 rounded-lg bg-[#FDF2E7] text-[#FF530D] font-black text-xs flex items-center justify-center border border-[#E8D9C8]">
                              #{vIdx + 1}
                            </span>
                            <div>
                              <div className="font-extrabold text-sm text-[#111111] capitalize">
                                {formattedDate}
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                Promotor: <strong>{promoter?.full_name || 'Equipe Match Point'}</strong> • Local: {visit.workplace_name_snapshot || vet.workplace_name}
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                            {visitReps.length} {visitReps.length === 1 ? 'Marca Representada' : 'Marcas Representadas'}
                          </span>
                        </div>

                        {/* General Logistics Note if present */}
                        {visit.general_notes && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <strong>Logística de Campo:</strong> {visit.general_notes}
                          </div>
                        )}

                        {/* CONFIDENTIAL INTERNAL MATCH POINT & PROMOTER NOTES */}
                        {isInternalUser && visit.internal_agency_notes && (
                          <div className="bg-[#111111] text-[#FDF2E7] p-3.5 rounded-xl border border-[#333333] space-y-1 shadow-inner">
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-[#FBBF3D] uppercase tracking-wider">
                              <Lock className="h-3.5 w-3.5" />
                              <span>Observações Internas Confidenciais (Match Point & Promotor ONLY)</span>
                            </div>
                            <p className="text-xs text-slate-200 font-medium whitespace-pre-wrap">
                              {visit.internal_agency_notes}
                            </p>
                            <span className="text-[10px] text-slate-400 block pt-0.5">
                              🔒 Protegido: Este conteúdo é estritamente sigiloso e nunca é exibido aos contratantes no Portal RLS.
                            </span>
                          </div>
                        )}

                        {/* Represented Brands & Individual Reports */}
                        <div className="space-y-3">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                            Relatórios por Contratante Representado:
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {visitReps.map((rep) => {
                              const tenant = tenants.find((t) => t.id === rep.tenant_id);

                              return (
                                <div
                                  key={rep.id}
                                  className="bg-[#FDF2E7]/40 p-3.5 rounded-xl border border-[#E8D9C8] space-y-2 relative overflow-hidden"
                                >
                                  <div
                                    className="absolute top-0 left-0 bottom-0 w-1.5"
                                    style={{ backgroundColor: tenant?.color_theme || '#FF530D' }}
                                  />

                                  <div className="flex items-center justify-between pl-1">
                                    <span className="text-xs font-black text-[#111111]">
                                      {tenant?.trade_name || 'Contratante'}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                        rep.sentiment === 'positive'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : rep.sentiment === 'neutral'
                                          ? 'bg-slate-200 text-slate-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {rep.sentiment === 'positive'
                                        ? '🟢 Receptivo'
                                        : rep.sentiment === 'neutral'
                                        ? '⚪ Neutro'
                                        : '🔴 Reclamação'}
                                    </span>
                                  </div>

                                  {rep.service_interest && (
                                    <div className="text-xs pl-1">
                                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Interesse:</span>
                                      <span className="font-semibold text-[#FF530D]">{rep.service_interest}</span>
                                    </div>
                                  )}

                                  <div className="text-xs pl-1 text-slate-700">
                                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Observação do Cliente:</span>
                                    <p className="italic font-medium">"{rep.observations}"</p>
                                  </div>

                                  {/* Internal report notes if any */}
                                  {isInternalUser && rep.internal_agency_notes && rep.internal_agency_notes !== visit.internal_agency_notes && (
                                    <div className="text-[11px] pl-1 pt-1 border-t border-[#E8D9C8] text-amber-800 font-medium">
                                      <span className="font-bold">🔒 Nota Interna Marca:</span> {rep.internal_agency_notes}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Attached Photos */}
                        {visit.photos && visit.photos.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                              <Camera className="h-3.5 w-3.5 text-[#FF530D]" />
                              <span>Fotos & Evidências da Visita ({visit.photos.length}):</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {visit.photos.map((ph, phIdx) => (
                                <button
                                  key={phIdx}
                                  type="button"
                                  onClick={() => setActivePhotoModal(ph)}
                                  className="h-16 w-16 rounded-xl overflow-hidden border-2 border-[#E8D9C8] hover:border-[#FF530D] transition-all cursor-pointer shadow-2xs group relative"
                                >
                                  <img src={ph} alt={`Foto ${phIdx + 1}`} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Eye className="h-4 w-4" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DADOS CADASTRAIS & PERFIL COMPLETO */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Informações Profissionais */}
                <div className="bg-[#FDF2E7]/40 p-5 rounded-2xl border border-[#E8D9C8] space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#FF530D] flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    <span>Dados Médicos & Especialidade</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Nome Completo:</span>
                      <span className="font-extrabold text-[#111111] text-sm">{vet.full_name}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">CRMV Oficial:</span>
                      <span className="font-black text-[#FF530D] bg-white px-2 py-0.5 rounded border border-[#E8D9C8] inline-block">
                        {vet.crmv}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Especialidade / Foco:</span>
                      <span className="font-bold text-slate-800">{vet.specialty}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Perfil de Público / Classe:</span>
                      <span className="font-extrabold text-[#111111] bg-[#FBBF3D]/20 px-2 py-0.5 rounded inline-block">
                        {vet.target_audience_class}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Contatos & Canais Diretos */}
                <div className="bg-[#FDF2E7]/40 p-5 rounded-2xl border border-[#E8D9C8] space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#FF530D] flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>Canais de Contato & Redes</span>
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">WhatsApp Comercial:</span>
                      <a
                        href={`https://wa.me/55${vet.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-black text-emerald-700 hover:underline flex items-center gap-1.5"
                      >
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{vet.whatsapp}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Instagram Perfil:</span>
                      <a
                        href={`https://instagram.com/${vet.instagram_handle?.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-black text-rose-700 hover:underline flex items-center gap-1.5"
                      >
                        <Instagram className="h-3.5 w-3.5 text-rose-600" />
                        <span>{vet.instagram_handle || 'Não cadastrado'}</span>
                        {vet.instagram_handle && <ExternalLink className="h-3 w-3" />}
                      </a>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Data de Aniversário:</span>
                      <span className="font-extrabold text-[#111111] flex items-center gap-1.5">
                        <Cake className="h-3.5 w-3.5 text-[#FF530D]" />
                        <span>{vet.birth_date ? vet.birth_date.split('-').reverse().join('/') : 'Não informada'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Local de Atendimento & Endereço */}
                <div className="bg-[#FDF2E7]/40 p-5 rounded-2xl border border-[#E8D9C8] space-y-3 md:col-span-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#FF530D] flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Endereço & Local de Atendimento Principal</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Estabelecimento:</span>
                      <span className="font-extrabold text-[#111111]">{vet.workplace_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Tipo:</span>
                      <span className="font-bold text-slate-800">{vet.workplace_type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Bairro / Cidade:</span>
                      <span className="font-bold text-slate-800">{vet.neighborhood}, {vet.city} - {vet.state}</span>
                    </div>
                    {vet.address_street && (
                      <div className="sm:col-span-3">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Logradouro:</span>
                        <span className="font-medium text-slate-800">{vet.address_street}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 4: Hábitos & Perfil Geral */}
                {vet.notes_general && (
                  <div className="bg-white p-5 rounded-2xl border border-[#E8D9C8] space-y-2 md:col-span-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#FF530D]" />
                      <span>Observações Gerais & Hábitos de Prescrição</span>
                    </h4>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {vet.notes_general}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AGENDAR PRÓXIMA VISITA */}
          {activeTab === 'schedule' && (
            <div className="bg-[#FDF2E7]/40 p-6 rounded-2xl border border-[#E8D9C8] space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#FF530D] text-white flex items-center justify-center font-black">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#111111]">
                    Agendar Próxima Visita Médica
                  </h3>
                  <p className="text-xs text-slate-500">
                    Programe a próxima abordagem para o Dr(a). {vet.full_name}.
                  </p>
                </div>
              </div>

              {scheduleSuccess ? (
                <div className="bg-emerald-600 text-white p-4 rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Visita agendada com sucesso! Redirecionando para check-in...</span>
                </div>
              ) : (
                <form onSubmit={handleScheduleVisit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Data Prevista para a Visita *
                      </label>
                      <input
                        type="date"
                        required
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Objetivo / Foco da Visita
                      </label>
                      <input
                        type="text"
                        value={scheduleNotes}
                        onChange={(e) => setScheduleNotes(e.target.value)}
                        placeholder="Ex: Apresentar novos laudos e amostras de tomografia..."
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#FF530D] hover:bg-[#E04505] text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Confirmar & Iniciar Check-in</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-[#E8D9C8] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Dossiê 360° • Match Point Promove • RLS & Sigilo de Dados Ativo
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => onStartCheckin(vet)}
              className="px-5 py-2 bg-[#FF530D] hover:bg-[#E04505] text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Iniciar Check-in de Visita</span>
            </button>
          </div>
        </div>
      </div>

      {/* Photo Lightbox in Dossier */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActivePhotoModal(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-[#111111] rounded-2xl overflow-hidden border border-slate-700 p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-1">
              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="p-1 text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img src={activePhotoModal} alt="Evidência" className="max-w-full max-h-[75vh] object-contain rounded-lg mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
};
