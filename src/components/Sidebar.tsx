import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Building2,
  CalendarCheck,
  FileSpreadsheet,
  Code2,
  Database,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  AlertTriangle,
  Cake,
  ShieldCheck,
  UserCheck,
  Check,
  SlidersHorizontal,
  Lock,
  Wifi,
  WifiOff,
  BookOpen,
  Users,
  BarChart3
} from 'lucide-react';
import { Tenant, User, UserRole } from '../types';
import { MatchPointLogo } from './MatchPointLogo';

interface SidebarProps {
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
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

interface NavItem {
  id: string;
  label: string;
  fullLabel: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeColor?: string;
  allowedRoles: UserRole[];
  category: 'field' | 'management' | 'admin';
}

export const Sidebar: React.FC<SidebarProps> = ({
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
  onLogout,
  isCollapsed,
  setIsCollapsed
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);

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

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ensure user cannot stay on a forbidden tab when switching roles
  useEffect(() => {
    const isSuperAdmin = currentUser.role === 'super_admin';
    const isPromoter = currentUser.role === 'promoter';
    const isTenantClient = currentUser.role === 'tenant_client';

    if (isTenantClient && activeTab !== 'tenant-portal' && activeTab !== 'reports' && activeTab !== 'manual') {
      setActiveTab('tenant-portal');
    } else if (isPromoter && (activeTab === 'evolution' || activeTab === 'supabase' || activeTab === 'architecture')) {
      setActiveTab('field');
    }
  }, [currentUser.role, activeTab, setActiveTab]);

  // Master Navigation Items with strict Role-Based Access Control (RBAC)
  const navItems: NavItem[] = [
    {
      id: 'field',
      label: 'Campo',
      fullLabel: 'Módulo de Campo',
      sublabel: 'Check-in & Multi-Marcas',
      icon: Smartphone,
      allowedRoles: ['super_admin', 'promoter'],
      category: 'field'
    },
    {
      id: 'follow-up',
      label: 'Follow-up',
      fullLabel: 'Régua de Follow-up',
      sublabel: '7d / 14d & Relacionamento',
      icon: CalendarCheck,
      badge: criticalAlertsCount > 0 ? criticalAlertsCount : null,
      badgeColor: 'bg-[#D90000]',
      allowedRoles: ['super_admin', 'promoter'],
      category: 'field'
    },
    {
      id: 'tenant-portal',
      label: 'Portal RLS',
      fullLabel: 'Painel do Contratante',
      sublabel: 'Segregação RLS & Feedbacks',
      icon: Building2,
      allowedRoles: ['super_admin', 'promoter', 'tenant_client'],
      category: 'management'
    },
    {
      id: 'reports',
      label: 'Relatórios',
      fullLabel: 'Exportação & Relatórios',
      sublabel: 'PDF Oficial & Excel .csv',
      icon: FileSpreadsheet,
      allowedRoles: ['super_admin', 'promoter', 'tenant_client'],
      category: 'management'
    },
    {
      id: 'manual',
      label: 'Manual de Uso',
      fullLabel: 'Manual & Apresentação',
      sublabel: 'Guia Passo a Passo & Slides',
      icon: BookOpen,
      allowedRoles: ['super_admin', 'promoter', 'tenant_client'],
      category: 'management'
    },
    // SENSITIVE ADMIN ONLY MODULES (Match Point Gestor Master)
    {
      id: 'usuarios',
      label: 'Usuários & Promotores',
      fullLabel: 'Gestão de Usuários & Promotores',
      sublabel: 'Cadastro & Aproveitamento Individual',
      icon: Users,
      badge: 'Super Admin',
      badgeColor: 'bg-[#FF530D]',
      allowedRoles: ['super_admin'],
      category: 'admin'
    },
    {
      id: 'contratantes',
      label: 'Contratantes',
      fullLabel: 'Cadastro de Contratantes',
      sublabel: 'Empresas & Contas Representadas',
      icon: Building2,
      badge: 'Super Admin',
      badgeColor: 'bg-[#FF530D]',
      allowedRoles: ['super_admin'],
      category: 'admin'
    },
    {
      id: 'evolution',
      label: 'WhatsApp',
      fullLabel: 'Mensageria WhatsApp',
      sublabel: 'Evolution API (Match Point)',
      icon: Smartphone,
      badge: 'Match Point',
      badgeColor: 'bg-[#FF530D]',
      allowedRoles: ['super_admin'],
      category: 'admin'
    },
    {
      id: 'supabase',
      label: 'Supabase',
      fullLabel: 'Banco Supabase',
      sublabel: 'Alimentação SQL & Sync',
      icon: Database,
      badge: 'Admin',
      badgeColor: 'bg-[#2563EB]',
      allowedRoles: ['super_admin'],
      category: 'admin'
    },
    {
      id: 'architecture',
      label: 'Docs & DDL',
      fullLabel: 'Arquitetura & DDL',
      sublabel: 'Especificação & Triggers',
      icon: Code2,
      allowedRoles: ['super_admin'],
      category: 'admin'
    }
  ];

  // Filter navigation items by active user role
  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(currentUser.role)
  );

  const categories = [
    { key: 'field', label: 'Operação de Campo' },
    { key: 'management', label: 'Gestão & Inteligência' },
    { key: 'admin', label: 'Super Admin • Match Point' }
  ].filter((cat) => visibleNavItems.some((item) => item.category === cat.key));

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  const getRoleDisplay = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', sub: 'Match Point Master', badge: 'bg-[#FF530D]/20 text-[#FF530D] border-[#FF530D]/40' };
      case 'promoter':
        return { label: 'Promotor', sub: 'Equipe de Campo', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'tenant_client':
        return { label: 'Contratante', sub: activeTenant?.trade_name || 'Cliente B2B', badge: 'bg-[#FBBF3D]/20 text-[#FBBF3D] border-[#FBBF3D]/40' };
    }
  };

  const roleInfo = getRoleDisplay(currentUser.role);

  return (
    <>
      {/* MOBILE TOP BAR (Fixed on Mobile & Small screens) */}
      <header className="md:hidden sticky top-0 z-40 bg-[#111111] text-[#FDF2E7] border-b border-[#242424] shadow-md px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            id="btn-mobile-menu-toggle"
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-xl bg-[#1c1c1c] text-white hover:bg-[#282828] active:scale-95 border border-[#333333] transition-colors cursor-pointer"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="h-5 w-5 text-[#FF530D]" />
          </button>
          <div className="flex items-center gap-2">
            <MatchPointLogo variant="symbol" theme="dark" size="sm" />
            <div>
              <span className="text-xs font-black tracking-wider text-white block leading-none">
                MATCH POINT
              </span>
              <span className="text-[9px] font-bold text-[#FBBF3D] block leading-tight">
                PROMOVE B2B
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {criticalAlertsCount > 0 && currentUser.role !== 'tenant_client' && (
            <button
              onClick={() => setActiveTab('follow-up')}
              className="p-1.5 rounded-lg bg-[#D90000]/20 border border-[#D90000]/40 text-[#FF530D] text-xs font-black flex items-center gap-1"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-[#D90000] animate-bounce" />
              <span>{criticalAlertsCount}</span>
            </button>
          )}

          <button
            id="btn-mobile-context-switch"
            onClick={() => setIsContextModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#1c1c1c] active:bg-[#282828] border border-[#333333] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#FDF2E7] cursor-pointer"
            title="Alternar Usuário e Testar Isolamento RLS"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF530D]" />
            <span className="text-[11px] font-medium max-w-[95px] truncate">
              {currentUser.full_name.split(' ')[0]} ({roleInfo.label})
            </span>
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-[#D90000]/15 hover:bg-[#D90000]/30 text-[#FF530D] border border-[#D90000]/30 transition-colors cursor-pointer"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER BACKDROP */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs transition-opacity animate-fadeIn"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER (Desktop Fixed Left Rail + Mobile Slide-out Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#111111] text-[#FDF2E7] border-r border-[#242424] flex flex-col transition-all duration-300 ease-in-out shadow-2xl ${
          // Mobile state
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full'
        } md:translate-x-0 ${
          // Desktop collapsed vs expanded
          isCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* SIDEBAR HEADER */}
        <div className="h-16 px-3.5 flex items-center justify-between border-b border-[#242424] shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <MatchPointLogo
              variant="symbol"
              theme="dark"
              size="sm"
              className="shrink-0"
            />
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="text-sm font-black tracking-widest text-white block leading-none truncate">
                  MATCH POINT
                </span>
                <span className="text-[10px] font-bold text-[#FBBF3D] block tracking-wider leading-tight truncate">
                  PROMOVE • CRM
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button */}
          <div className="hidden md:flex items-center">
            <button
              id="btn-sidebar-collapse-toggle"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-slate-300 hover:text-white border border-[#333333] transition-colors cursor-pointer"
              title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral para ampliar espaço'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-[#FF530D]" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-slate-400" />
              )}
            </button>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg bg-[#1a1a1a] text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ACTIVE ROLE BANNER (Expanded mode only) */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-3.5 py-3 border-b border-[#1f1f1f] bg-[#161616]/60">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${roleInfo.badge}`}>
                    {roleInfo.label}
                  </span>
                  <span className="truncate text-slate-300 font-medium">{currentUser.full_name}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {currentUser.role === 'tenant_client'
                    ? `Contratante: ${activeTenant?.trade_name || 'Isolamento RLS'}`
                    : currentUser.email}
                </div>
              </div>

                <button
                  id="btn-sidebar-quick-context"
                  onClick={() => setIsContextModalOpen(true)}
                  className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#2a2a2a] text-[#FBBF3D] border border-[#333333] shrink-0"
                  title="Alternar Perfil / Testar Isolamento RLS"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* If Tenant RLS filter is active */}
            {currentTenantId && currentUser.role !== 'tenant_client' && (
              <div className="mt-2 text-[10px] bg-[#FBBF3D]/10 text-[#FBBF3D] px-2 py-1 rounded border border-[#FBBF3D]/20 flex items-center justify-between">
                <span className="truncate font-semibold">RLS: {activeTenant?.trade_name}</span>
                <button
                  onClick={() => onSelectTenant(null)}
                  className="text-slate-400 hover:text-white text-[9px] ml-1 font-bold underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>
        )}

        {/* NAVIGATION ITEMS LIST */}
        <nav className="flex-1 px-2.5 py-4 space-y-4 overflow-y-auto scrollbar-none">
          {categories.map((category) => {
            const items = visibleNavItems.filter((i) => i.category === category.key);
            if (items.length === 0) return null;

            return (
              <div key={category.key} className="space-y-1">
                {/* Category Header (Only when expanded) */}
                {(!isCollapsed || isMobileOpen) && (
                  <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {category.label}
                  </div>
                )}

                {/* Items in Category */}
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <div key={item.id} className="relative group">
                        <button
                          id={`sidebar-tab-${item.id}`}
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-[#FF530D] text-white shadow-lg shadow-[#FF530D]/20'
                              : 'text-slate-300 hover:text-white hover:bg-[#1f1f1f]'
                          } ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''}`}
                        >
                          <div className="relative shrink-0 flex items-center justify-center">
                            <Icon
                              className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                                isActive ? 'text-white stroke-[2.5]' : 'text-[#FF530D]'
                              }`}
                            />
                            {/* Mini Badge dot on collapsed mode */}
                            {isCollapsed && !isMobileOpen && item.badge && (
                              <span
                                className={`absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-black text-white rounded-full ${
                                  item.badgeColor || 'bg-[#D90000]'
                                }`}
                              >
                                {typeof item.badge === 'number' ? item.badge : '!'}
                              </span>
                            )}
                          </div>

                          {/* Full labels when expanded */}
                          {(!isCollapsed || isMobileOpen) && (
                            <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                              <div className="min-w-0">
                                <span className="block truncate font-bold text-xs leading-tight">
                                  {item.fullLabel}
                                </span>
                                <span
                                  className={`block truncate text-[10px] font-normal leading-tight ${
                                    isActive ? 'text-white/80' : 'text-slate-400'
                                  }`}
                                >
                                  {item.sublabel}
                                </span>
                              </div>

                              {item.badge && (
                                <span
                                  className={`ml-1.5 px-1.5 py-0.5 text-[9px] font-black text-white rounded-md shrink-0 uppercase tracking-tight ${
                                    item.badgeColor || 'bg-[#D90000]'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </button>

                        {/* HOVER TOOLTIP FOR COLLAPSED DESKTOP MODE */}
                        {isCollapsed && !isMobileOpen && (
                          <div className="hidden md:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 bg-[#161616] text-white border border-[#333333] shadow-2xl rounded-xl p-2.5 flex-col whitespace-nowrap min-w-[170px] pointer-events-none animate-fadeIn">
                            <div className="text-xs font-bold flex items-center justify-between gap-2">
                              <span>{item.fullLabel}</span>
                              {item.badge && (
                                <span
                                  className={`px-1.5 py-0.2 text-[9px] font-black text-white rounded ${
                                    item.badgeColor || 'bg-[#D90000]'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                              {item.sublabel}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER & SYSTEM STATUS */}
        <div className="p-3 border-t border-[#242424] bg-[#141414] space-y-2.5 shrink-0">
          {/* Collapse Toggle shortcut text on expanded mode */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-semibold text-[10px]">Online (PWA)</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-amber-400 font-semibold text-[10px]">Offline</span>
                  </>
                )}
              </div>

              {birthdaysCount > 0 && currentUser.role !== 'tenant_client' && (
                <button
                  onClick={() => handleTabClick('follow-up')}
                  className="flex items-center gap-1 text-[#FBBF3D] hover:underline text-[10px] font-bold"
                  title="Veterinários aniversariantes do mês"
                >
                  <Cake className="h-3.5 w-3.5" />
                  <span>{birthdaysCount} Niver</span>
                </button>
              )}
            </div>
          )}

          {/* Logout button */}
          <button
            id="btn-sidebar-logout"
            onClick={onLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#D90000]/10 hover:bg-[#D90000]/25 text-[#FF530D] hover:text-white border border-[#D90000]/30 transition-all font-bold text-xs cursor-pointer ${
              isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''
            }`}
            title="Desconectar da plataforma Match Point"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Desconectar</span>}
          </button>
        </div>
      </aside>

      {/* CONTEXT SWITCHER MODAL (Perfil & RLS) - SENSITIVE CONTROLS RESTRICTED TO SUPER ADMIN */}
      {isContextModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-3xl border border-[#333333] shadow-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[#FF530D]" />
                <h3 className="text-base font-bold text-white">Alternar Perfil & RLS</h3>
              </div>
              <button
                onClick={() => setIsContextModalOpen(false)}
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
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {users.map((u) => {
                  const isSelected = u.id === currentUserId;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u.id);
                        setIsContextModalOpen(false);
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
                          {u.role === 'super_admin'
                            ? 'Super Admin (Acesso Completo)'
                            : u.role === 'promoter'
                            ? (u.id === 'user-promoter-fernanda' ? 'Promotora • 0 Visitas (Teste de Isolamento RLS)' : 'Promotor Match Point')
                            : 'Cliente Contratante (Isolamento RLS)'}
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-[#FF530D] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tenant Filter (RLS Isolation) - Only available for super_admin & promoters */}
            {currentUser.role !== 'tenant_client' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#FBBF3D] uppercase tracking-wider">
                  Contratante para Isolamento RLS
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  <button
                    onClick={() => {
                      onSelectTenant(null);
                      setIsContextModalOpen(false);
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
                          setIsContextModalOpen(false);
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
                        {isSelected && <Check className="h-4 w-4 text-[#FBBF3D]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsContextModalOpen(false)}
              className="w-full py-3 bg-[#FF530D] hover:bg-[#e04505] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
