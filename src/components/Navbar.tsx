import React, { useState } from 'react';
import {
  Building2,
  CalendarCheck,
  FileSpreadsheet,
  Code2,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Cake,
  Smartphone,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
  X,
  Check,
  Database,
  Cloud
} from 'lucide-react';
import { Tenant, User } from '../types';
import { MatchPointLogo } from './MatchPointLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tenants: Tenant[];
  users: User[];
  currentUserId: string;
  onSelectUser: (userId: string) => void;
  currentTenantId: string | null;
  onSelectTenant: (tenantId: string | null) => void;
  criticalAlertsCount: number;
  birthdaysCount: number;
  isOnline: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  tenants,
  users,
  currentUserId,
  onSelectUser,
  currentTenantId,
  onSelectTenant,
  criticalAlertsCount,
  birthdaysCount,
  isOnline,
  onLogout
}) => {
  const [isMobileContextOpen, setIsMobileContextOpen] = useState(false);
  const fallbackUser: User = {
    id: currentUserId || 'user-admin',
    full_name: 'Administrador Match Point',
    role: 'super_admin',
    email: 'admin@matchpoint.com.br',
    tenant_id: null,
    is_active: true,
    created_at: new Date().toISOString()
  };
  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || fallbackUser;
  const activeTenant = tenants.find((t) => t.id === currentTenantId);

  const tabs = [
    {
      id: 'field',
      label: 'Campo',
      fullLabel: 'Módulo de Campo',
      sublabel: 'Check-in & Multi-Marcas',
      icon: Smartphone,
      badge: null
    },
    {
      id: 'tenant-portal',
      label: 'Portal',
      fullLabel: 'Painel do Contratante',
      sublabel: 'Segregação RLS & Feedbacks',
      icon: Building2,
      badge: null
    },
    {
      id: 'follow-up',
      label: 'Follow-up',
      fullLabel: 'Régua de Follow-up',
      sublabel: '7d / 14d & Relacionamento',
      icon: CalendarCheck,
      badge: criticalAlertsCount > 0 ? criticalAlertsCount : null
    },
    {
      id: 'reports',
      label: 'Relatórios',
      fullLabel: 'Exportação & Relatórios',
      sublabel: 'PDF Oficial & Excel .csv',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      id: 'architecture',
      label: 'Docs',
      fullLabel: 'Especificação & Arquitetura',
      sublabel: 'DDL, RLS & Triggers',
      icon: Code2,
      badge: null
    },
    ...(currentUser.role === 'super_admin'
      ? [
          {
            id: 'evolution',
            label: 'WhatsApp',
            fullLabel: 'Mensageria WhatsApp (Evolution API)',
            sublabel: 'Texto, Mídia, Áudio & Régua',
            icon: Smartphone,
            badge: 'Evolution'
          },
          {
            id: 'supabase',
            label: 'Supabase',
            fullLabel: 'Banco Supabase',
            sublabel: 'Alimentação SQL & Sync',
            icon: Database,
            badge: 'Cloud'
          }
        ]
      : [])
  ];

  return (
    <>
      {/* Top Bar with Brand & Quick Actions */}
      <header className="sticky top-0 z-40 bg-[#111111] text-[#FDF2E7] border-b border-[#242424] shadow-md select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 sm:py-2.5 gap-2">
            {/* Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
              <MatchPointLogo variant="horizontal" theme="dark" size="sm" />
              <div className="hidden xl:block h-6 w-px bg-slate-800 shrink-0" />
              <span className="hidden xl:inline text-[11px] font-medium text-[#FBBF3D]/80 tracking-wide truncate">
                Precisão para chegar. Estratégia para permanecer.
              </span>
            </div>

            {/* Mobile / Tablet Action Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Critical Alert Badge (Mobile + Desktop) */}
              {criticalAlertsCount > 0 && (
                <button
                  id="btn-nav-critical-alert"
                  onClick={() => setActiveTab('follow-up')}
                  className="flex items-center gap-1 bg-[#D90000]/20 hover:bg-[#D90000]/30 text-[#FF530D] border border-[#D90000]/40 px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="Alertas críticos pendentes"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-[#D90000] animate-bounce" />
                  <span className="hidden xs:inline text-[11px]">{criticalAlertsCount} Alerta</span>
                  <span className="xs:hidden text-[11px] font-black">{criticalAlertsCount}</span>
                </button>
              )}

              {/* Birthday Radar (Desktop only) */}
              {birthdaysCount > 0 && (
                <button
                  id="btn-nav-birthday"
                  onClick={() => setActiveTab('follow-up')}
                  className="hidden md:flex items-center gap-1 bg-[#FBBF3D]/15 hover:bg-[#FBBF3D]/25 text-[#FBBF3D] border border-[#FBBF3D]/30 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  title="Veterinários aniversariantes do mês"
                >
                  <Cake className="h-3.5 w-3.5 text-[#FBBF3D]" />
                  <span className="text-[11px]">{birthdaysCount} Niver</span>
                </button>
              )}

              {/* Mobile Quick Switcher Trigger (Opens Bottom Sheet / Modal) */}
              <button
                id="btn-open-mobile-context"
                onClick={() => setIsMobileContextOpen(true)}
                className="flex md:hidden items-center gap-1.5 bg-[#1c1c1c] active:bg-[#282828] border border-[#333333] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#FDF2E7] cursor-pointer"
                aria-label="Alternar Perfil e RLS"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF530D]" />
                <span className="text-[11px] font-medium max-w-[90px] truncate">
                  {currentUser.role === 'super_admin' ? 'Admin' : currentUser.role === 'promoter' ? 'Promotor' : 'Cliente'}
                </span>
                {currentTenantId && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FBBF3D]" />
                )}
              </button>

              {/* Desktop User Context Switcher */}
              <div className="hidden md:flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1.5 rounded-lg border border-[#303030]">
                <UserCheck className="h-3.5 w-3.5 text-[#FF530D] shrink-0" />
                <select
                  id="select-user-context"
                  value={currentUserId}
                  onChange={(e) => onSelectUser(e.target.value)}
                  className="bg-transparent text-xs text-[#FDF2E7] font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate"
                  aria-label="Perfil de Usuário Ativo"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#1a1a1a] text-white">
                      {u.full_name} ({u.role === 'super_admin' ? 'Admin' : u.role === 'promoter' ? 'Promotor' : 'Cliente'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Desktop Tenant Filter Context Switcher (Simulação RLS) */}
              <div className="hidden md:flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1.5 rounded-lg border border-[#303030]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#FBBF3D] shrink-0" />
                <select
                  id="select-tenant-context"
                  value={currentTenantId || 'ALL'}
                  onChange={(e) => onSelectTenant(e.target.value === 'ALL' ? null : e.target.value)}
                  className="bg-transparent text-xs text-[#FDF2E7] font-semibold focus:outline-none cursor-pointer max-w-[160px] truncate"
                  aria-label="Contratante Ativo para Isolamento"
                >
                  <option value="ALL" className="bg-[#1a1a1a] text-white">
                    🌐 Visão Master (Geral)
                  </option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#1a1a1a] text-white">
                      🏢 {t.trade_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Online Indicator Status */}
              <div className="flex items-center gap-1 bg-[#1a1a1a] px-2 py-1.5 rounded-lg border border-[#2e2e2e]">
                <span className={`h-2 w-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="hidden sm:inline text-[10px] text-slate-300 font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Logout Action Button */}
              <button
                id="btn-navbar-logout"
                onClick={onLogout}
                className="flex items-center gap-1 bg-[#D90000]/15 hover:bg-[#D90000]/30 active:scale-95 text-[#FF530D] hover:text-white border border-[#D90000]/30 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                title="Desconectar da plataforma Match Point"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden xs:inline text-[11px]">Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:block bg-[#161616] border-t border-[#242424] overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 sm:space-x-2 py-1.5 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/20'
                        : 'text-[#FDF2E7]/80 hover:text-white hover:bg-[#252525]'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-[#FF530D]'
                      }`}
                    />
                    <div className="flex flex-col text-left">
                      <span className="leading-tight">{tab.fullLabel}</span>
                      <span
                        className={`text-[10px] font-normal leading-tight ${
                          isActive ? 'text-white/80' : 'text-[#FDF2E7]/50'
                        }`}
                      >
                        {tab.sublabel}
                      </span>
                    </div>

                    {tab.badge && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black bg-[#D90000] text-white rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* MOBILE / PDA BOTTOM TAB BAR (Thumb-friendly Navigation) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-md border-t border-[#2a2a2a] pb-safe shadow-2xl">
        <div className={`grid ${tabs.length === 6 ? 'grid-cols-6' : 'grid-cols-5'} h-14 items-center px-0.5`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`mobile-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center h-full relative cursor-pointer transition-all ${
                  isActive ? 'text-[#FF530D]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Active Indicator Top Bar */}
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 bg-[#FF530D] rounded-full shadow-[0_0_8px_#FF530D]" />
                )}

                <div className="relative">
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-black bg-[#D90000] text-white rounded-full leading-none">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] font-bold mt-0.5 leading-tight tracking-tight ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE CONTEXT SELECTOR SHEET (User & RLS Switcher) */}
      {isMobileContextOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#1a1a1a] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#333333] shadow-2xl p-5 space-y-5 pb-safe animate-slideUp">
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[#FF530D]" />
                <h3 className="text-base font-bold text-white">Configurações de Acesso</h3>
              </div>
              <button
                onClick={() => setIsMobileContextOpen(false)}
                className="h-8 w-8 rounded-full bg-[#252525] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* User Profile Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#FBBF3D] uppercase tracking-wider">
                Perfil de Usuário Ativo
              </label>
              <div className="space-y-1.5">
                {users.map((u) => {
                  const isSelected = u.id === currentUserId;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u.id);
                        setIsMobileContextOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF530D]/15 border-[#FF530D] text-white'
                          : 'bg-[#141414] border-[#2a2a2a] text-slate-300 hover:bg-[#202020]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{u.full_name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {u.role === 'super_admin' ? 'Super Admin' : u.role === 'promoter' ? 'Promotor Match Point' : 'Cliente Contratante'}
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-[#FF530D] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tenant Filter (RLS Isolation) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#FBBF3D] uppercase tracking-wider">
                Contratante para Isolamento RLS
              </label>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    onSelectTenant(null);
                    setIsMobileContextOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    currentTenantId === null
                      ? 'bg-[#FBBF3D]/15 border-[#FBBF3D] text-white'
                      : 'bg-[#141414] border-[#2a2a2a] text-slate-300 hover:bg-[#202020]'
                  }`}
                >
                  <span className="text-xs font-semibold">🌐 Visão Master (Todos os Contratantes)</span>
                  {currentTenantId === null && <Check className="h-4 w-4 text-[#FBBF3D]" />}
                </button>

                {tenants.map((t) => {
                  const isSelected = t.id === currentTenantId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectTenant(t.id);
                        setIsMobileContextOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FBBF3D]/15 border-[#FBBF3D] text-white'
                          : 'bg-[#141414] border-[#2a2a2a] text-slate-300 hover:bg-[#202020]'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-semibold truncate block">🏢 {t.trade_name}</span>
                        <span className="text-[10px] text-slate-400 truncate block">{t.segment}</span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-[#FBBF3D] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setIsMobileContextOpen(false)}
              className="w-full py-3 bg-[#FF530D] hover:bg-[#e04505] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
            >
              Concluído
            </button>
          </div>
        </div>
      )}
    </>
  );
};
