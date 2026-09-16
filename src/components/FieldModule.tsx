import React, { useState, useRef } from 'react';
import {
  Search,
  UserCheck,
  UserPlus,
  Stethoscope,
  Building,
  MapPin,
  Phone,
  Instagram,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  ShieldAlert,
  ChevronRight,
  Layers,
  FileText,
  BadgeAlert,
  Navigation,
  Target,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  X,
  Maximize2,
  Lock,
  Plus,
  Cake,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Veterinarian, Tenant, User, FeedbackSentiment, Visit, VisitReport, UserRole } from '../types';
import { NewVetModal } from './NewVetModal';
import { VetProfileDossierModal } from './VetProfileDossierModal';

interface FieldModuleProps {
  vets: Veterinarian[];
  tenants: Tenant[];
  promoters: User[];
  visits?: Visit[];
  reports?: VisitReport[];
  currentUserRole?: UserRole;
  currentUserId: string;
  onSaveVisit: (payload: {
    promoter_id: string;
    veterinarian_id: string;
    visit_date: string;
    general_notes?: string;
    internal_agency_notes?: string;
    location_lat?: number;
    location_lng?: number;
    photos?: string[];
    reports: Array<{
      tenant_id: string;
      observations: string;
      internal_agency_notes?: string;
      sentiment: FeedbackSentiment;
      service_interest?: string;
      critical_action_needed: boolean;
    }>;
  }) => void;
  onAddNewVet: (vet: Omit<Veterinarian, 'id' | 'created_at' | 'updated_at'>) => Veterinarian;
}

export const FieldModule: React.FC<FieldModuleProps> = ({
  vets,
  tenants,
  promoters,
  visits = [],
  reports = [],
  currentUserRole = 'super_admin',
  currentUserId,
  onSaveVisit,
  onAddNewVet
}) => {
  // Mode: 'checkin' | 'directory'
  const [activeModuleMode, setActiveModuleMode] = useState<'checkin' | 'directory'>('checkin');

  // Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(vets[0] || null);
  const [isNewVetModalOpen, setIsNewVetModalOpen] = useState(false);

  // Dossier Modal State
  const [dossierVet, setDossierVet] = useState<Veterinarian | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Strict Promoter Confidentiality: A promoter only sees their own visits and data
  const isPromoterRole = currentUserRole === 'promoter';
  const visibleVisits = isPromoterRole
    ? visits.filter((v) => v.promoter_id === currentUserId)
    : visits;
  const visibleReports = isPromoterRole
    ? reports.filter((r) => {
        const parentVisit = visits.find((v) => v.id === r.visit_id);
        return parentVisit?.promoter_id === currentUserId;
      })
    : reports;

  // Form State
  const [selectedPromoterId, setSelectedPromoterId] = useState(
    currentUserId || (promoters[0]?.id ?? 'user-admin')
  );
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [generalNotes, setGeneralNotes] = useState('');
  
  // Internal Agency Confidential Notes (Match Point & Promoter ONLY)
  const [internalAgencyNotes, setInternalAgencyNotes] = useState('');

  const [isGpsActive, setIsGpsActive] = useState(true);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>({
    lat: -23.565,
    lng: -46.652
  });

  // Attached Visit Photos (Facade, Clinic, Samples, Prescription pads, etc.)
  const [visitPhotos, setVisitPhotos] = useState<string[]>([]);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [activePhotoLightbox, setActivePhotoLightbox] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Selected Tenants represented in this single visit (up to 3)
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>(() => {
    return tenants.map((t) => t.id).slice(0, Math.min(tenants.length, 3));
  });

  // Dedicated reports state keyed by tenant_id
  const [tenantReportsData, setTenantReportsData] = useState<{
    [tenantId: string]: {
      observations: string;
      internal_agency_notes?: string;
      sentiment: FeedbackSentiment;
      service_interest: string;
      critical_action_needed: boolean;
    };
  }>(() => {
    const init: any = {};
    tenants.forEach((t) => {
      init[t.id] = {
        observations: '',
        internal_agency_notes: '',
        sentiment: 'positive',
        service_interest: '',
        critical_action_needed: false
      };
    });
    return init;
  });

  const [formError, setFormError] = useState<string | null>(null);

  const [successBanner, setSuccessBanner] = useState<{
    vetName: string;
    tenantsCount: number;
    tasksCount: number;
    photosCount: number;
  } | null>(null);

  // Helper to process and compress attached photos
  const processPhotoFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800; // Optimal for inspection & fast upload
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setVisitPhotos((prev) => [...prev, compressed]);
        } else {
          setVisitPhotos((prev) => [...prev, result]);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i);
        if (f) processPhotoFile(f);
      }
    }
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhotos(false);
    if (e.dataTransfer.files) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const f = e.dataTransfer.files.item(i);
        if (f) processPhotoFile(f);
      }
    }
  };

  const removePhoto = (index: number) => {
    setVisitPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Filtered Vets for Autocomplete
  const filteredVets =
    searchQuery.trim() === ''
      ? []
      : vets.filter((v) => {
          const query = searchQuery.toLowerCase();
          return (
            v.full_name.toLowerCase().includes(query) ||
            v.crmv.toLowerCase().includes(query) ||
            v.workplace_name.toLowerCase().includes(query) ||
            v.specialty.toLowerCase().includes(query)
          );
        });

  const handleSelectVet = (vet: Veterinarian) => {
    setSelectedVet(vet);
    setSearchQuery('');
  };

  const handleOpenDossier = (vet: Veterinarian) => {
    setDossierVet(vet);
    setIsDossierOpen(true);
  };

  const handleStartCheckinFromDossier = (vet: Veterinarian) => {
    setSelectedVet(vet);
    setIsDossierOpen(false);
    setActiveModuleMode('checkin');
  };

  const handleCreateNewVetSuccess = (newVetData: Omit<Veterinarian, 'id' | 'created_at' | 'updated_at'>) => {
    const created = onAddNewVet(newVetData);
    setSelectedVet(created);
    setSearchQuery('');
  };

  const handleAddTenantFromDropdown = (tenantId: string) => {
    setFormError(null);
    if (!tenantId) return;
    if (selectedTenantIds.includes(tenantId)) return;

    if (selectedTenantIds.length >= 3) {
      setFormError('Limite atingido: Você pode representar no máximo 3 contratantes por visita.');
      return;
    }

    setSelectedTenantIds([...selectedTenantIds, tenantId]);
  };

  const handleRemoveTenantRepresentation = (tenantId: string) => {
    if (selectedTenantIds.length <= 1) {
      setFormError('A visita deve ter ao menos 1 contratante selecionado.');
      return;
    }
    setSelectedTenantIds(selectedTenantIds.filter((id) => id !== tenantId));
  };

  const updateTenantReport = (
    tenantId: string,
    field: 'observations' | 'internal_agency_notes' | 'sentiment' | 'service_interest' | 'critical_action_needed',
    value: any
  ) => {
    setTenantReportsData((prev) => ({
      ...prev,
      [tenantId]: {
        ...(prev[tenantId] || {
          observations: '',
          internal_agency_notes: '',
          sentiment: 'positive',
          service_interest: '',
          critical_action_needed: false
        }),
        [field]: value
      }
    }));
  };

  const handleSubmitVisit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedVet) {
      setFormError('Por favor, selecione um médico-veterinário através da busca ou cadastre um novo para registrar o check-in.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (selectedTenantIds.length === 0) {
      setFormError('Selecione ao menos 1 contratante representado na visita.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate that each represented tenant has observations
    for (const tId of selectedTenantIds) {
      const rep = tenantReportsData[tId];
      if (!rep || !rep.observations.trim()) {
        const tObj = tenants.find((t) => t.id === tId);
        setFormError(
          `Por favor, preencha as observações específicas para o contratante: ${
            tObj?.trade_name || 'Contratante'
          }.`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const reportsToSubmit = selectedTenantIds.map((tId) => ({
      tenant_id: tId,
      observations: tenantReportsData[tId].observations,
      internal_agency_notes: tenantReportsData[tId].internal_agency_notes || internalAgencyNotes,
      sentiment: tenantReportsData[tId].sentiment,
      service_interest: tenantReportsData[tId].service_interest,
      critical_action_needed: tenantReportsData[tId].critical_action_needed
    }));

    onSaveVisit({
      promoter_id: selectedPromoterId,
      veterinarian_id: selectedVet.id,
      visit_date: visitDate,
      general_notes: generalNotes,
      internal_agency_notes: internalAgencyNotes,
      location_lat: gpsCoords?.lat,
      location_lng: gpsCoords?.lng,
      photos: visitPhotos,
      reports: reportsToSubmit
    });

    setSuccessBanner({
      vetName: selectedVet.full_name,
      tenantsCount: selectedTenantIds.length,
      tasksCount: selectedTenantIds.length * 2 + (reportsToSubmit.some((r) => r.critical_action_needed) ? 1 : 0),
      photosCount: visitPhotos.length
    });

    // Reset notes & photos
    setGeneralNotes('');
    setInternalAgencyNotes('');
    setVisitPhotos([]);
    setTenantReportsData((prev) => {
      const reset: any = {};
      Object.keys(prev).forEach((k) => {
        reset[k] = {
          observations: '',
          internal_agency_notes: '',
          sentiment: 'positive',
          service_interest: '',
          critical_action_needed: false
        };
      });
      return reset;
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Context - Match Point Promove Theme */}
      <div className="bg-[#111111] rounded-2xl p-4 sm:p-5 text-[#FDF2E7] shadow-md border border-[#2a2a2a] relative overflow-hidden">
        {/* Subtle orange accent stripe */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF530D] via-[#FBBF3D] to-[#D90000]" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 w-full lg:w-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#FF530D]/20 border border-[#FF530D]/40 text-[#FF530D]">
              <Target className="h-3.5 w-3.5" />
              <span>Módulo de Campo • Match Point</span>
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2 leading-tight">
              Check-in de Campo & Dossiê do Visitado
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Consulte o histórico 360° do médico-veterinário e registre atendimentos com fotos, contratantes e notas sigilosas.
            </p>
          </div>

          {/* Quick GPS Geolocation Status */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 bg-[#1a1a1a] px-3.5 py-2.5 rounded-xl border border-[#303030] shrink-0">
            <div className="flex items-center gap-2.5">
              <Navigation className={`h-4 w-4 shrink-0 ${isGpsActive ? 'text-[#FF530D] animate-pulse' : 'text-slate-400'}`} />
              <div className="text-left">
                <div className="text-[11px] font-bold text-white leading-tight">Geolocalização Ativa</div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">
                  Lat: {gpsCoords?.lat.toFixed(3)}, Lng: {gpsCoords?.lng.toFixed(3)}
                </div>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Sinal GPS Travado" />
          </div>
        </div>

        {/* View Mode Switcher: Form vs Directory (Responsive Stack on Mobile, Flex on Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#2a2a2a]">
          <button
            type="button"
            onClick={() => setActiveModuleMode('checkin')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-center whitespace-nowrap shadow-xs ${
              activeModuleMode === 'checkin'
                ? 'bg-[#FF530D] text-white font-extrabold ring-2 ring-[#FF530D]/50'
                : 'bg-[#181818] text-slate-300 hover:text-white hover:bg-[#222222] border border-[#2e2e2e]'
            }`}
          >
            <Target className="h-4 w-4 shrink-0 text-[#FF530D] group-hover:text-white" />
            <span>⚡ Formulário de Check-in</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModuleMode('directory')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-center whitespace-nowrap shadow-xs ${
              activeModuleMode === 'directory'
                ? 'bg-[#FF530D] text-white font-extrabold ring-2 ring-[#FF530D]/50'
                : 'bg-[#181818] text-slate-300 hover:text-white hover:bg-[#222222] border border-[#2e2e2e]'
            }`}
          >
            <Stethoscope className="h-4 w-4 shrink-0 text-[#FF530D]" />
            <span>📋 Diretório & Dossiês ({vets.length})</span>
          </button>
        </div>
      </div>

      {/* Error Notification Banner */}
      {formError && (
        <div
          id="banner-visit-error"
          className="bg-[#D90000]/10 border-2 border-[#D90000] p-4 rounded-2xl text-[#111111] shadow-md flex items-center justify-between gap-4 transition-all animate-fadeIn"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#D90000] flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-black text-sm text-[#D90000]">
                Atenção no Preenchimento
              </h4>
              <p className="text-xs text-slate-700 font-medium">
                {formError}
              </p>
            </div>
          </div>
          <button
            onClick={() => setFormError(null)}
            className="text-xs font-bold text-[#D90000] hover:underline px-2 py-1 cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {successBanner && (
        <div
          id="banner-visit-success"
          className="bg-[#111111] border-2 border-[#FF530D] p-4 rounded-2xl text-white shadow-lg flex items-center justify-between gap-4 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#FF530D] flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-black text-sm text-white">
                Visita Registrada com Sucesso para {successBanner.vetName}!
              </h4>
              <p className="text-xs text-[#FDF2E7]/80">
                {successBanner.tenantsCount} marcas representadas • {successBanner.tasksCount} tarefas de follow-up geradas
                {successBanner.photosCount > 0 && ` • ${successBanner.photosCount} ${successBanner.photosCount === 1 ? 'foto anexada' : 'fotos anexadas'}`}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs font-bold text-[#FBBF3D] hover:underline px-2 py-1 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: DIRECTORY OF VETERINARIANS & DOSSIER (CLEAN OVERVIEW)              */}
      {/* ========================================================================= */}
      {activeModuleMode === 'directory' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E8D9C8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, CRMV, clínica ou bairro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FDF2E7]/50 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsNewVetModalOpen(true)}
              className="px-4 py-2 bg-[#FF530D] hover:bg-[#e04505] text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span>Cadastrar Novo Veterinário</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vets
              .filter((v) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  v.full_name.toLowerCase().includes(q) ||
                  v.crmv.toLowerCase().includes(q) ||
                  v.workplace_name.toLowerCase().includes(q) ||
                  v.neighborhood.toLowerCase().includes(q) ||
                  v.specialty.toLowerCase().includes(q)
                );
              })
              .map((vet) => {
                const vetVisitsCount = visibleVisits.filter((v) => v.veterinarian_id === vet.id).length;

                return (
                  <div
                    key={vet.id}
                    className="bg-white rounded-2xl p-5 border border-[#E8D9C8] hover:border-[#FF530D] transition-all shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {vet.avatar_url ? (
                            <img src={vet.avatar_url} alt={vet.full_name} className="h-12 w-12 rounded-xl object-cover border border-[#E8D9C8] shrink-0" />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-[#FDF2E7] text-[#FF530D] font-black flex items-center justify-center text-sm shrink-0 border border-[#E8D9C8]">
                              {vet.full_name.substring(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <h4 className="font-extrabold text-sm text-[#111111]">{vet.full_name}</h4>
                            <div className="text-xs text-[#FF530D] font-bold">{vet.crmv} • {vet.specialty}</div>
                          </div>
                        </div>

                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#111111] text-[#FBBF3D] shrink-0">
                          {vet.target_audience_class}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-slate-400" />
                          <span>{vet.workplace_name} ({vet.workplace_type})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{vet.neighborhood}, {vet.city}</span>
                        </div>
                      </div>

                      <div className="bg-[#FDF2E7]/60 p-2 rounded-xl border border-[#E8D9C8] flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>Histórico de Visitas:</span>
                        <span className="text-[#FF530D]">{vetVisitsCount} {vetVisitsCount === 1 ? 'visita' : 'visitas'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenDossier(vet)}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Ver Dossiê</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartCheckinFromDossier(vet)}
                        className="py-2 px-3 bg-[#FF530D] hover:bg-[#e04505] text-white text-xs font-black rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Check-in</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FAST CHECK-IN FORM                                               */}
      {/* ========================================================================= */}
      {activeModuleMode === 'checkin' && (
        <form onSubmit={handleSubmitVisit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Veterinarian Selection & Profile (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Search Box / Smart Lookup */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="input-search-vet" className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                  <Search className="h-4 w-4 text-[#FF530D]" />
                  1. Buscar Médico-Veterinário
                </label>
                <button
                  type="button"
                  id="btn-open-new-vet-modal"
                  onClick={() => setIsNewVetModalOpen(true)}
                  className="text-xs font-bold text-[#FF530D] hover:text-[#D90000] bg-[#FF530D]/10 hover:bg-[#FF530D]/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Novo Cadastro
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="input-search-vet"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite CRMV ou Nome (Ex: CRMV-SP 45890 ou Dra. Camila)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] placeholder-slate-400 focus:ring-2 focus:ring-[#FF530D] focus:bg-white focus:outline-none"
                />

                {/* Autocomplete Dropdown */}
                {filteredVets.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border-2 border-[#E8D9C8] rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {filteredVets.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVet(v)}
                        className="w-full p-3 text-left hover:bg-[#FDF2E7] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div>
                          <div className="font-extrabold text-xs text-[#111111]">
                            {v.full_name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {v.crmv} • {v.specialty} • {v.workplace_name}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF530D]/10 text-[#FF530D]">
                          {v.neighborhood}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Veterinarian Preview Card */}
            {selectedVet && (
              <div className="bg-white rounded-2xl p-5 border-2 border-[#FF530D] shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {selectedVet.avatar_url ? (
                      <img
                        src={selectedVet.avatar_url}
                        alt={selectedVet.full_name}
                        className="h-12 w-12 rounded-full object-cover border-2 border-[#FF530D] shadow-2xs shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-[#FF530D]/15 text-[#FF530D] flex items-center justify-center font-black text-base border border-[#FF530D]/30 shrink-0">
                        {selectedVet.full_name.substring(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-base text-[#111111] leading-tight">
                        {selectedVet.full_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-xs font-black text-[#FF530D] bg-[#FF530D]/10 px-2 py-0.5 rounded border border-[#FF530D]/20">
                          {selectedVet.crmv}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {selectedVet.specialty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenDossier(selectedVet)}
                    className="self-start sm:self-center px-3 py-1.5 bg-[#111111] hover:bg-[#333333] text-[#FBBF3D] text-xs font-black rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0"
                    title="Abrir Dossiê 360°"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Dossiê 360°</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Local de Atendimento</span>
                    <p className="font-semibold text-[#111111] flex items-start gap-1.5 break-words">
                      <Building className="h-3.5 w-3.5 text-[#FF530D] shrink-0 mt-0.5" />
                      <span>{selectedVet.workplace_name}</span>
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bairro / Cidade</span>
                    <p className="font-semibold text-[#111111] flex items-start gap-1.5 break-words">
                      <MapPin className="h-3.5 w-3.5 text-[#FF530D] shrink-0 mt-0.5" />
                      <span>{selectedVet.neighborhood}, {selectedVet.city}</span>
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">WhatsApp Comercial</span>
                    <a
                      href={`https://wa.me/55${selectedVet.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-700 hover:underline flex items-center gap-1.5 break-words"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{selectedVet.whatsapp}</span>
                    </a>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Instagram Perfil</span>
                    <a
                      href={`https://instagram.com/${selectedVet.instagram_handle?.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-rose-700 hover:underline flex items-center gap-1.5 break-words"
                    >
                      <Instagram className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      <span>{selectedVet.instagram_handle || 'Não informado'}</span>
                    </a>
                  </div>
                </div>

                {selectedVet.notes_general && (
                  <div className="bg-[#FDF2E7] p-3 rounded-xl text-xs text-slate-700 border border-[#E8D9C8] leading-relaxed">
                    <strong className="text-[#111111]">Perfil / Hábitos:</strong> {selectedVet.notes_general}
                  </div>
                )}
              </div>
            )}

            {/* Promoter & Logistics metadata */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#FF530D]" />
                Dados da Operação de Campo
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Promotor Responsável</span>
                    {isPromoterRole && (
                      <span className="text-[9px] text-[#FF530D] font-bold">🔒 Sua Sessão</span>
                    )}
                  </label>
                  {isPromoterRole ? (
                    <div className="w-full text-xs font-bold p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {promoters.find((p) => p.id === currentUserId)?.full_name || 'Sua Conta'}
                      </span>
                    </div>
                  ) : (
                    <select
                      value={selectedPromoterId}
                      onChange={(e) => setSelectedPromoterId(e.target.value)}
                      className="w-full text-xs font-semibold p-2 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    >
                      {promoters.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                    Data da Visita
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full text-xs font-semibold p-2 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                  Notas Gerais da Rota (Logística)
                </label>
                <input
                  type="text"
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Ex: Recepção rápida no intervalo de cirurgia"
                  className="w-full text-xs p-2 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                />
              </div>
            </div>

            {/* CONFIDENTIAL INTERNAL MATCH POINT & PROMOTER NOTES */}
            <div className="bg-[#111111] text-[#FDF2E7] rounded-2xl p-5 border border-[#333333] shadow-md space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#FBBF3D]/20 text-[#FBBF3D] flex items-center justify-center font-bold">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Observações Internas Confidenciais
                    </h4>
                    <span className="text-[10px] text-[#FBBF3D] font-bold">
                      Match Point & Promotor ONLY (Invisível aos Contratantes)
                    </span>
                  </div>
                </div>
              </div>

              <textarea
                rows={3}
                value={internalAgencyNotes}
                onChange={(e) => setInternalAgencyNotes(e.target.value)}
                placeholder="Insira anotações confidenciais da agência sobre o perfil, temperamento do médico, concorrentes presentes ou estratégia de comissão/promotoria..."
                className="w-full p-3 bg-[#1a1a1a] border border-[#333333] rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-[#FBBF3D] focus:outline-none font-medium"
              />
              <p className="text-[10px] text-slate-400">
                🔒 <strong>Segurança RLS:</strong> Este campo é 100% blindado contra acesso dos contratantes no portal do cliente.
              </p>
            </div>

            {/* VISIT PHOTOS & EVIDENCE ATTACHMENT SECTION */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                    <Camera className="h-4 w-4 text-[#FF530D]" />
                    Fotos & Evidências da Visita
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Fachada, recepção, consultório, materiais ou amostras entregues
                  </p>
                </div>
                <span className="text-xs font-extrabold text-[#FF530D] bg-[#FF530D]/10 px-2 py-0.5 rounded-full">
                  {visitPhotos.length} {visitPhotos.length === 1 ? 'Foto' : 'Fotos'}
                </span>
              </div>

              {/* Dropzone & Upload Action */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingPhotos(true);
                }}
                onDragLeave={() => setIsDraggingPhotos(false)}
                onDrop={handlePhotoDrop}
                onClick={() => photoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                  isDraggingPhotos
                    ? 'border-[#FF530D] bg-[#FF530D]/10'
                    : 'border-[#E8D9C8] hover:border-[#FF530D] bg-[#FDF2E7]/40 hover:bg-[#FDF2E7]'
                }`}
              >
                <input
                  ref={photoInputRef}
                  id="input-visit-photos-file"
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handlePhotosChange}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#111111]">
                  <Camera className="h-4 w-4 text-[#FF530D]" />
                  <Upload className="h-4 w-4 text-[#FF530D]" />
                  <span>Tirar Foto ou Anexar da Galeria</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Suporta múltiplas imagens (JPG, PNG, WebP) com compressão automática
                </p>
              </div>

              {/* Photos Preview Grid */}
              {visitPhotos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                  {visitPhotos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative group rounded-xl overflow-hidden aspect-square border-2 border-[#E8D9C8] hover:border-[#FF530D] shadow-2xs bg-slate-900"
                    >
                      <img
                        src={photo}
                        alt={`Foto da Visita ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoLightbox(photo);
                          }}
                          className="p-1.5 rounded-full bg-white/90 text-[#111111] hover:bg-white transition-all cursor-pointer"
                          title="Visualizar em tamanho grande"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePhoto(index);
                          }}
                          className="p-1.5 rounded-full bg-[#D90000] text-white hover:bg-red-700 transition-all cursor-pointer"
                          title="Remover foto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Multi-Tenant Representation & Isolated Reports (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Multi-Tenant Selector via Dropdown + Tags (Max 3 limit) */}
            <div className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#FF530D]" />
                    2. Seleção de Contratantes para Representar
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Regra de Negócio: Até <strong>3 marcas não-concorrentes</strong> simultâneas por visita.
                  </p>
                </div>

                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full self-start sm:self-auto ${
                    selectedTenantIds.length === 3
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-[#FF530D]/10 text-[#FF530D]'
                  }`}
                >
                  {selectedTenantIds.length} de 3 Selecionados
                </span>
              </div>

              {/* DROPDOWN SELECTOR FOR CONTRACTORS */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      id="select-add-tenant-representation"
                      onChange={(e) => {
                        handleAddTenantFromDropdown(e.target.value);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="w-full p-2.5 bg-[#FDF2E7]/70 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-bold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="" disabled>
                        Selecione um contratante para adicionar à visita...
                      </option>
                      {tenants.map((t) => {
                        const isAlreadySelected = selectedTenantIds.includes(t.id);
                        return (
                          <option
                            key={t.id}
                            value={t.id}
                            disabled={isAlreadySelected || (selectedTenantIds.length >= 3 && !isAlreadySelected)}
                          >
                            {t.trade_name} ({t.segment}) {isAlreadySelected ? '✓ Já Selecionado' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Selected Contractor Badges with Delete Buttons */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Marcas Ativas nesta Visita:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedTenantIds.map((tenantId) => {
                      const tenant = tenants.find((t) => t.id === tenantId);
                      if (!tenant) return null;

                      return (
                        <div
                          key={tenantId}
                          className="px-3 py-1.5 rounded-xl border flex items-center gap-2 shadow-2xs transition-all bg-white"
                          style={{
                            borderColor: tenant.color_theme || '#FF530D'
                          }}
                        >
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: tenant.color_theme || '#FF530D' }}
                          />
                          <span className="text-xs font-black text-[#111111]">
                            {tenant.trade_name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({tenant.segment})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTenantRepresentation(tenantId)}
                            className="p-0.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ml-1"
                            title="Remover marca desta visita"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Feedback Form per Represented Tenant */}
            <div className="space-y-4">
              {selectedTenantIds.map((tenantId, index) => {
                const tenant = tenants.find((t) => t.id === tenantId);
                const rep = tenantReportsData[tenantId] || {
                  observations: '',
                  internal_agency_notes: '',
                  sentiment: 'positive',
                  service_interest: '',
                  critical_action_needed: false
                };

                return (
                  <div
                    key={tenantId}
                    className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-4 relative overflow-hidden transition-all"
                  >
                    {/* Color Stripe on the Left */}
                    <div
                      className="absolute top-0 left-0 bottom-0 w-2"
                      style={{ backgroundColor: tenant?.color_theme || '#FF530D' }}
                    />

                    {/* Report Header */}
                    <div className="flex items-center justify-between pl-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-[#FF530D]" />
                          Relatório #{index + 1}: {tenant?.trade_name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          ({tenant?.segment})
                        </span>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-[#FF530D] bg-[#FDF2E7] px-2 py-0.5 rounded border border-[#E8D9C8]">
                        RLS ISOLATED
                      </span>
                    </div>

                    {/* Sentiment Pills */}
                    <div className="pl-2 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Receptividade &amp; Sentimento do Médico:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => updateTenantReport(tenantId, 'sentiment', 'positive')}
                          className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                            rep.sentiment === 'positive'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <span>🟢 Positivo / Receptivo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateTenantReport(tenantId, 'sentiment', 'neutral')}
                          className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                            rep.sentiment === 'neutral'
                              ? 'bg-slate-700 text-white border-slate-700 shadow-xs font-black'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span>⚪ Neutro / Em Análise</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateTenantReport(tenantId, 'sentiment', 'complaint')}
                          className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                            rep.sentiment === 'complaint'
                              ? 'bg-[#D90000] text-white border-[#D90000] shadow-xs font-black'
                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span>🔴 Reclamação / Crítico</span>
                        </button>
                      </div>
                    </div>

                    {/* Service Interest Field with Quick Selection Chips */}
                    <div className="pl-2 space-y-2">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Serviço / Exame de Maior Interesse:
                      </label>
                      <input
                        type="text"
                        value={rep.service_interest}
                        onChange={(e) => updateTenantReport(tenantId, 'service_interest', e.target.value)}
                        placeholder="Ex: Tomografia 3D, Ecocardiograma Doppler, Hemograma rápido..."
                        className="w-full text-xs sm:text-sm p-2.5 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:bg-white focus:outline-none font-semibold"
                      />

                      {/* Quick Service Chips from Tenant's Catalogue */}
                      {tenant?.services_offered && tenant.services_offered.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                            Sugestões Rápidas do Catálogo {tenant.trade_name}:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {tenant.services_offered.map((srv, srvIdx) => (
                              <button
                                key={srvIdx}
                                type="button"
                                onClick={() => {
                                  const current = rep.service_interest ? rep.service_interest + ', ' : '';
                                  if (!rep.service_interest.includes(srv)) {
                                    updateTenantReport(tenantId, 'service_interest', current + srv);
                                  }
                                }}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#FDF2E7] hover:text-[#FF530D] text-slate-700 transition-colors border border-slate-200 cursor-pointer text-left"
                                title="Clique para adicionar ao campo de interesse"
                              >
                                + {srv}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Observations (Visible to Tenant) */}
                    <div className="pl-2 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Observações & Feedback Coletado:</span>
                        <span className="text-[10px] text-[#FF530D] font-bold">* Visível para o contratante {tenant?.trade_name}</span>
                      </label>
                      <textarea
                        rows={3}
                        value={rep.observations}
                        onChange={(e) => updateTenantReport(tenantId, 'observations', e.target.value)}
                        placeholder={`Descreva o retorno do Dr(a). ${selectedVet?.full_name || ''} sobre os serviços do ${tenant?.trade_name}...`}
                        className="w-full text-xs sm:text-sm p-2.5 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:bg-white focus:outline-none"
                        required
                      />
                    </div>

                    {/* Critical Action Flag */}
                    <div className="pl-2 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer bg-rose-50/60 p-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={rep.critical_action_needed}
                          onChange={(e) => updateTenantReport(tenantId, 'critical_action_needed', e.target.checked)}
                          className="h-4 w-4 text-[#D90000] rounded focus:ring-[#D90000]"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-[#D90000] flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Marcar como Tratativa Crítica Imediata
                          </span>
                          <p className="text-[10px] text-slate-600">
                            Dispara alerta de urgência no painel do contratante para suporte imediato.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-visit"
                className="w-full py-3.5 px-6 bg-[#FF530D] hover:bg-[#e04505] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-[#FF530D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="h-5 w-5" />
                Finalizar Check-in & Disparar Régua de Follow-up
              </button>
              <p className="text-center text-[11px] text-slate-500 mt-2">
                ⚡ Ao salvar, o sistema agenda automaticamente tarefas em D+7 e D+14 para cada contratante representado.
              </p>
            </div>
          </div>
        </form>
      )}

      {/* Modal for Registering New Veterinarian */}
      <NewVetModal
        isOpen={isNewVetModalOpen}
        onClose={() => setIsNewVetModalOpen(false)}
        onSubmit={handleCreateNewVetSuccess}
      />

      {/* Modal for Complete Veterinarian 360° Profile Dossier */}
      <VetProfileDossierModal
        vet={dossierVet}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        visits={visibleVisits}
        reports={visibleReports}
        tenants={tenants}
        promoters={promoters}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
        onStartCheckin={handleStartCheckinFromDossier}
      />

      {/* Lightbox / Zoom Modal for Visit Photos */}
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
                <span>Foto de Evidência da Visita</span>
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
