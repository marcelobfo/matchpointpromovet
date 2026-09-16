import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  Stethoscope,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  Target,
  Search,
  ChevronDown,
  UserCheck,
  MapPin,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Tenant, Veterinarian, Visit, VisitReport, FollowUpTask, User, UserRole } from '../types';
import { MatchPointLogo } from './MatchPointLogo';

interface ReportsModuleProps {
  tenants: Tenant[];
  vets: Veterinarian[];
  visits: Visit[];
  reports: VisitReport[];
  tasks: FollowUpTask[];
  users: User[];
  currentTenantId: string | null;
  currentUserRole?: UserRole;
  currentUserId?: string;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  tenants,
  vets,
  visits,
  reports,
  tasks,
  users,
  currentTenantId,
  currentUserRole = 'super_admin',
  currentUserId
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    currentTenantId || tenants[0]?.id || 'tenant-mova'
  );
  const [period, setPeriod] = useState<'current_week' | 'last_15_days' | 'current_month' | 'all'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];
  const vetMap = useMemo(() => new Map<string, Veterinarian>(vets.map((v) => [v.id, v])), [vets]);
  const visitMap = useMemo(() => new Map<string, Visit>(visits.map((v) => [v.id, v])), [visits]);

  // Strictly filter reports for the selected tenant & enforce promoter confidentiality
  const isPromoterRole = currentUserRole === 'promoter';
  const baseTenantReports = useMemo(
    () =>
      reports.filter((r) => {
        if (r.tenant_id !== selectedTenantId) return false;
        if (isPromoterRole && currentUserId) {
          const visit = visitMap.get(r.visit_id);
          return visit?.promoter_id === currentUserId;
        }
        return true;
      }),
    [reports, selectedTenantId, isPromoterRole, currentUserId, visitMap]
  );

  // Compute Metrics on base tenant reports
  const totalVisits = baseTenantReports.length;
  const positiveFeedbacks = baseTenantReports.filter((r) => r.sentiment === 'positive').length;
  const neutralFeedbacks = baseTenantReports.filter((r) => r.sentiment === 'neutral').length;
  const criticalFeedbacks = baseTenantReports.filter(
    (r) => r.critical_action_needed || r.sentiment === 'complaint'
  ).length;
  const positiveRate = totalVisits > 0 ? Math.round((positiveFeedbacks / totalVisits) * 100) : 0;

  // Filtered reports by search & sentiment
  const filteredReports = useMemo(() => {
    return baseTenantReports.filter((rep) => {
      const visit = visitMap.get(rep.visit_id);
      const vet = visit ? vetMap.get(visit.veterinarian_id) : undefined;
      const isCrit = rep.critical_action_needed || rep.sentiment === 'complaint';

      // Sentiment filter
      if (sentimentFilter === 'positive' && rep.sentiment !== 'positive') return false;
      if (sentimentFilter === 'neutral' && rep.sentiment !== 'neutral') return false;
      if (sentimentFilter === 'critical' && !isCrit) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const vetName = (vet?.full_name || '').toLowerCase();
        const crmv = (vet?.crmv || '').toLowerCase();
        const clinic = (vet?.workplace_name || '').toLowerCase();
        const specialty = (vet?.specialty || '').toLowerCase();
        const obs = (rep.observations || '').toLowerCase();
        const interest = (rep.service_interest || '').toLowerCase();

        return (
          vetName.includes(query) ||
          crmv.includes(query) ||
          clinic.includes(query) ||
          specialty.includes(query) ||
          obs.includes(query) ||
          interest.includes(query)
        );
      }

      return true;
    });
  }, [baseTenantReports, sentimentFilter, searchQuery, visitMap, vetMap]);

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCsv = () => {
    const headers = [
      'Data da Visita',
      'CRMV',
      'Nome do Médico',
      'Especialidade',
      'Local de Atendimento',
      'Bairro',
      'Cidade',
      'Público-Alvo',
      'WhatsApp',
      'Sentimento',
      'Interesse em Serviços',
      'Ação Crítica',
      'Observações Sigilosas'
    ];

    const rows = filteredReports.map((rep) => {
      const visit = visitMap.get(rep.visit_id);
      const vet = visit ? vetMap.get(visit.veterinarian_id) : undefined;

      return [
        visit?.visit_date || '',
        vet?.crmv || '',
        `"${(vet?.full_name || '').replace(/"/g, '""')}"`,
        `"${(vet?.specialty || '').replace(/"/g, '""')}"`,
        `"${(vet?.workplace_name || '').replace(/"/g, '""')}"`,
        `"${(vet?.neighborhood || '').replace(/"/g, '""')}"`,
        `"${(vet?.city || '').replace(/"/g, '""')}"`,
        vet?.target_audience_class || '',
        vet?.whatsapp || '',
        rep.sentiment === 'positive'
          ? 'Positivo'
          : rep.sentiment === 'neutral'
          ? 'Neutro'
          : 'Reclamação/Crítico',
        `"${(rep.service_interest || '').replace(/"/g, '""')}"`,
        rep.critical_action_needed ? 'SIM' : 'NÃO',
        `"${rep.observations.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Relatorio_Campo_MatchPoint_${(selectedTenant?.trade_name || 'Geral').replace(/\s+/g, '_')}_${
        new Date().toISOString().split('T')[0]
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Banner - Match Point Promove Theme (Hidden in Print) */}
      <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 text-[#FDF2E7] border border-[#2a2a2a] shadow-md relative overflow-hidden print:hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF530D] via-[#FBBF3D] to-[#D90000]" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 sm:space-y-2 max-w-3xl">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide bg-[#FF530D]/20 border border-[#FF530D]/40 text-[#FF530D]">
                Business Intelligence &amp; Export
              </span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2 leading-tight">
              <Target className="h-5 w-5 text-[#FF530D] shrink-0" />
              <span>Exportação de Relatórios Oficiais &amp; Inteligência de Campo</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Geração de relatórios executivos em <strong>PDF formatado</strong> e planilhas em <strong>Excel (.csv)</strong> customizados por contratante com segregação total de dados.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-export-excel"
              onClick={handleExportCsv}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#FF530D] hover:bg-[#e04505] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Baixar Excel (.csv)</span>
            </button>

            <button
              type="button"
              id="btn-print-pdf"
              onClick={handlePrintPdf}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#1c1c1c] hover:bg-[#2c2c2c] text-[#FDF2E7] border border-[#3e3e3e] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Printer className="h-4 w-4 shrink-0 text-[#FBBF3D]" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector & Filter Controls Bar (Hidden in Print) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8D9C8] shadow-xs space-y-3.5 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Tenant Selector */}
          <div className="space-y-1.5">
            <label htmlFor="select-report-tenant" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#FF530D]" />
              <span>Empresa Contratante:</span>
            </label>
            {currentUserRole !== 'tenant_client' ? (
              <div className="relative">
                <select
                  id="select-report-tenant"
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full appearance-none text-xs sm:text-sm font-bold border border-[#E8D9C8] rounded-xl pl-3 pr-8 py-2 bg-[#FDF2E7]/40 text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none cursor-pointer"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.trade_name} ({t.segment})
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-extrabold px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="truncate">{selectedTenant?.trade_name} ({selectedTenant?.segment})</span>
              </div>
            )}
          </div>

          {/* Period Selector */}
          <div className="space-y-1.5">
            <label htmlFor="select-report-period" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Período de Referência:</span>
            </label>
            <div className="relative">
              <select
                id="select-report-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full appearance-none text-xs sm:text-sm font-semibold border border-[#E8D9C8] rounded-xl pl-3 pr-8 py-2 bg-[#FDF2E7]/40 text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none cursor-pointer"
              >
                <option value="all">Todo o Histórico</option>
                <option value="current_week">Semana Atual (01/Set - 09/Set)</option>
                <option value="last_15_days">Últimos 15 dias</option>
                <option value="current_month">Mês Vigente (Setembro/2026)</option>
              </select>
              <ChevronDown className="h-4 w-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
            <label htmlFor="input-search-reports" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <span>Pesquisa Rápida:</span>
            </label>
            <div className="relative">
              <input
                id="input-search-reports"
                type="text"
                placeholder="Buscar por médico, CRMV, clínica..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm font-medium border border-[#E8D9C8] rounded-xl pl-3 pr-8 py-2 bg-[#FDF2E7]/40 text-[#111111] placeholder:text-slate-400 focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sentiment Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Sentimento:
          </span>
          <button
            type="button"
            onClick={() => setSentimentFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sentimentFilter === 'all'
                ? 'bg-[#111111] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({baseTenantReports.length})
          </button>
          <button
            type="button"
            onClick={() => setSentimentFilter('positive')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              sentimentFilter === 'positive'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            🟢 Positivos ({positiveFeedbacks})
          </button>
          <button
            type="button"
            onClick={() => setSentimentFilter('neutral')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              sentimentFilter === 'neutral'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            ⚪ Neutros ({neutralFeedbacks})
          </button>
          <button
            type="button"
            onClick={() => setSentimentFilter('critical')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              sentimentFilter === 'critical'
                ? 'bg-[#D90000] text-white shadow-2xs'
                : 'bg-rose-50 text-[#D90000] border border-rose-200 hover:bg-rose-100'
            }`}
          >
            🔴 Críticos ({criticalFeedbacks})
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PRINTABLE / VISIBLE OFFICIAL REPORT CARD */}
      {/* ========================================================= */}
      <div
        id="printable-report-card"
        className="bg-white rounded-2xl p-4 sm:p-8 border border-[#E8D9C8] shadow-sm space-y-6 print:p-0 print:border-none print:shadow-none print:m-0"
      >
        {/* Match Point Institutional Header */}
        <div className="border-b-2 border-[#111111] pb-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="shrink-0">
                <MatchPointLogo variant="horizontal" theme="light" size="md" />
              </div>
              <div className="h-10 w-px bg-slate-300 hidden sm:block shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF530D] block truncate">
                  Relatório Oficial de Campo &amp; BI
                </span>
                <h1 className="text-lg sm:text-2xl font-black text-[#111111] tracking-tight truncate">
                  {selectedTenant?.company_name}
                </h1>
                <p className="text-xs text-slate-500 font-medium truncate">
                  CNPJ: {selectedTenant?.cnpj} • {selectedTenant?.segment}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-none border-slate-200 text-left sm:text-right text-xs text-slate-600 space-y-0.5 shrink-0">
              <p className="font-extrabold text-[#111111]">Match Point Promove</p>
              <p className="text-[11px] text-slate-500">📞 (27) 99273-5244 • Vitória/ES</p>
              <p className="text-[11px]">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
              <p className="font-mono text-[11px] text-[#FF530D] font-bold">
                Protocolo: #MP-{selectedTenantId.slice(-4).toUpperCase()}-{new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-[#FF530D]" />
            <span>1. Indicadores Consolidados do Período</span>
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-[#FDF2E7] p-3 sm:p-4 rounded-xl border border-[#E8D9C8] flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Total de Visitas
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#111111] my-1">
                {totalVisits}
              </div>
              <span className="text-[10px] text-slate-500">Médicos impactados</span>
            </div>

            <div className="bg-emerald-50 p-3 sm:p-4 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Índice Receptivo
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 my-1">
                {positiveRate}%
              </div>
              <span className="text-[10px] text-emerald-800 font-medium">
                {positiveFeedbacks} feedbacks positivos
              </span>
            </div>

            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Neutros / Rotina
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#111111] my-1">
                {neutralFeedbacks}
              </div>
              <span className="text-[10px] text-slate-500">Apresentação sem pedidos</span>
            </div>

            <div className="bg-rose-50 p-3 sm:p-4 rounded-xl border border-rose-200 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#D90000] uppercase tracking-wider">
                Alertas Críticos
              </span>
              <div className="text-xl sm:text-2xl font-black text-[#D90000] my-1">
                {criticalFeedbacks}
              </div>
              <span className="text-[10px] text-rose-800 font-medium">Requerem tratativa</span>
            </div>
          </div>
        </div>

        {/* Detailed Visits Section */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4 text-[#FF530D]" />
              <span>2. Detalhamento de Visitas &amp; Observações de Campo</span>
            </h3>
            <span className="self-start sm:self-auto text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Isolamento Row-Level Security Ativo
            </span>
          </div>

          {/* EMPTY STATE */}
          {filteredReports.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-800">
                  Nenhum registro encontrado
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Não foram encontradas visitas para esta representada com os filtros selecionados. Altere o período ou termo de pesquisa.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (Visible on md+ and Always in Print) */}
              <div className="hidden md:block print:block border border-[#E8D9C8] rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#111111] text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="p-3 whitespace-nowrap">Data</th>
                      <th className="p-3">Médico(a) &amp; CRMV</th>
                      <th className="p-3">Local &amp; Endereço</th>
                      <th className="p-3 whitespace-nowrap">Sentimento</th>
                      <th className="p-3">Interesse Específico</th>
                      <th className="p-3">Observações Sigilosas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D9C8] text-slate-800">
                    {filteredReports.map((rep) => {
                      const visit = visitMap.get(rep.visit_id);
                      const vet = visit ? vetMap.get(visit.veterinarian_id) : undefined;
                      const isCrit = rep.critical_action_needed || rep.sentiment === 'complaint';

                      return (
                        <tr
                          key={rep.id}
                          className={`hover:bg-[#FDF2E7]/40 transition-colors ${
                            isCrit ? 'bg-rose-50/70 font-medium' : ''
                          }`}
                        >
                          <td className="p-3 whitespace-nowrap text-slate-600 font-semibold align-top">
                            {visit?.visit_date
                              ? new Date(visit.visit_date + 'T12:00:00Z').toLocaleDateString('pt-BR')
                              : 'Recente'}
                          </td>
                          <td className="p-3 align-top">
                            <div className="font-bold text-[#111111]">{vet?.full_name || 'Médico Veterinário'}</div>
                            <div className="text-[11px] text-[#FF530D] font-bold">{vet?.crmv}</div>
                            <div className="text-[10px] text-slate-500">{vet?.specialty}</div>
                          </td>
                          <td className="p-3 align-top">
                            <div className="font-semibold text-[#111111]">{vet?.workplace_name || 'Clínica'}</div>
                            <div className="text-[10px] text-slate-500">
                              {vet?.neighborhood ? `${vet.neighborhood}, ` : ''}{vet?.city || 'Vitória'}
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap align-top">
                            {rep.sentiment === 'positive' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                🟢 Positivo
                              </span>
                            )}
                            {rep.sentiment === 'neutral' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                ⚪ Neutro
                              </span>
                            )}
                            {isCrit && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D90000] text-white">
                                🔴 Crítico
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-[#111111] align-top">
                            {rep.service_interest || 'Apresentação Geral de Catálogo'}
                          </td>
                          <td className="p-3 text-[11px] leading-relaxed text-slate-700 align-top max-w-sm">
                            {rep.observations || 'Sem observações adicionais registradas.'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD LIST VIEW (Hidden on md+ and Hidden in Print) */}
              <div className="md:hidden print:hidden space-y-3">
                {filteredReports.map((rep) => {
                  const visit = visitMap.get(rep.visit_id);
                  const vet = visit ? vetMap.get(visit.veterinarian_id) : undefined;
                  const isCrit = rep.critical_action_needed || rep.sentiment === 'complaint';

                  return (
                    <div
                      key={rep.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        isCrit
                          ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-200'
                          : 'bg-white border-[#E8D9C8] shadow-2xs'
                      }`}
                    >
                      {/* Card Header: Vet info + Sentiment */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-[#111111] truncate">
                            {vet?.full_name || 'Médico Veterinário'}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-bold text-[#FF530D]">
                              {vet?.crmv}
                            </span>
                            <span className="text-[10px] text-slate-500">•</span>
                            <span className="text-[10px] text-slate-600 truncate">
                              {vet?.specialty}
                            </span>
                          </div>
                        </div>

                        {/* Sentiment badge */}
                        <div className="shrink-0">
                          {rep.sentiment === 'positive' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              🟢 Positivo
                            </span>
                          )}
                          {rep.sentiment === 'neutral' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              ⚪ Neutro
                            </span>
                          )}
                          {isCrit && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D90000] text-white">
                              🔴 Crítico
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Clinic & Date */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#FDF2E7]/40 p-2.5 rounded-lg border border-[#E8D9C8]/60 text-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">Local:</span>
                          <span className="font-semibold truncate block">{vet?.workplace_name || 'Clínica'}</span>
                          <span className="text-[10px] text-slate-500">{vet?.neighborhood || 'Vitória'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">Data:</span>
                          <span className="font-semibold block">
                            {visit?.visit_date
                              ? new Date(visit.visit_date + 'T12:00:00Z').toLocaleDateString('pt-BR')
                              : 'Recente'}
                          </span>
                          <span className="text-[10px] text-[#FF530D] font-bold truncate block">
                            {rep.service_interest || 'Apresentação'}
                          </span>
                        </div>
                      </div>

                      {/* Observations */}
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-slate-400" />
                          Feedback / Observações:
                        </span>
                        <p className="text-slate-800 leading-relaxed text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {rep.observations || 'Nenhuma observação informada.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="border-t border-[#E8D9C8] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] sm:text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#FF530D] shrink-0" />
            <span>
              Documento confidencial gerado pela Match Point Promove para {selectedTenant?.trade_name}.
            </span>
          </div>
          <div className="font-medium shrink-0">Página 1 de 1 • Match Point Promove</div>
        </div>
      </div>
    </div>
  );
};
