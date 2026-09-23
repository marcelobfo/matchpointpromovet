import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { Sidebar } from './components/Sidebar';
import { FieldModule } from './components/FieldModule';
import { TenantPortal } from './components/TenantPortal';
import { FollowUpModule } from './components/FollowUpModule';
import { ReportsModule } from './components/ReportsModule';
import { ArchitectureModule } from './components/ArchitectureModule';
import { SupabaseModule } from './components/SupabaseModule';
import { EvolutionApiModule } from './components/EvolutionApiModule';
import { ContratantesModule } from './components/ContratantesModule';
import { UsersAndPromotersModule } from './components/UsersAndPromotersModule';
import { BirthdayNotificationBanner } from './components/BirthdayNotificationBanner';
import { VetProfileDossierModal } from './components/VetProfileDossierModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AuthScreen } from './components/AuthScreen';
import { UserManualModule } from './components/UserManualModule';
import { VisitationMapModule } from './components/VisitationMapModule';
import { GiftsModule } from './components/GiftsModule';
import {
  Tenant,
  User,
  Veterinarian,
  Visit,
  VisitReport,
  FollowUpTask,
  InstagramPostLead,
  FeedbackSentiment,
  TaskStatus
} from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    StorageService.isAuthenticated()
  );
  const [activeTab, setActiveTab] = useState<string>('field');
  const [globalDossierVet, setGlobalDossierVet] = useState<Veterinarian | null>(null);
  const [isGlobalDossierOpen, setIsGlobalDossierOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('matchpoint_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Persist sidebar collapsed preference
  const handleToggleCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsed((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem('matchpoint_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Application Data State
  const [tenants, setTenants] = useState<Tenant[]>(() => StorageService.getTenants());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [vets, setVets] = useState<Veterinarian[]>(() => StorageService.getVeterinarians());
  const [visits, setVisits] = useState<Visit[]>(() => StorageService.getVisits());
  const [reports, setReports] = useState<VisitReport[]>(() => StorageService.getVisitReports());
  const [tasks, setTasks] = useState<FollowUpTask[]>(() => StorageService.getFollowUpTasks());
  const [instagramLeads, setInstagramLeads] = useState<InstagramPostLead[]>(() => StorageService.getInstagramLeads());

  // Session State
  const [currentUserId, setCurrentUserId] = useState<string>(() => StorageService.getCurrentUserId());
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(() => StorageService.getCurrentTenantId());
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Load Initial State
  const reloadData = () => {
    setTenants(StorageService.getTenants());
    setUsers(StorageService.getUsers());
    setVets(StorageService.getVeterinarians());
    setVisits(StorageService.getVisits());
    setReports(StorageService.getVisitReports());
    setTasks(StorageService.getFollowUpTasks());
    setInstagramLeads(StorageService.getInstagramLeads());
    setCurrentUserId(StorageService.getCurrentUserId());
    setCurrentTenantId(StorageService.getCurrentTenantId());
    setIsAuthenticated(StorageService.isAuthenticated());
  };

  useEffect(() => {
    reloadData();

    // Online / Offline network listener for PWA
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || {
    id: currentUserId,
    full_name: 'Usuário Match Point',
    role: 'super_admin',
    email: 'admin@matchpoint.com.br',
    tenant_id: null,
    is_active: true,
    created_at: new Date().toISOString()
  };

  const currentTenant = tenants.find((t) => t.id === currentTenantId);

  // Enforce role-based tab security
  useEffect(() => {
    if (currentUser.role === 'tenant_client') {
      if (activeTab !== 'tenant-portal' && activeTab !== 'reports' && activeTab !== 'manual') {
        setActiveTab('tenant-portal');
      }
    } else if (currentUser.role === 'promoter') {
      if (activeTab === 'evolution' || activeTab === 'supabase' || activeTab === 'architecture') {
        setActiveTab('field');
      }
    }
  }, [currentUser.role, activeTab]);

  // Authentication Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUserId(user.id);
    setCurrentTenantId(user.tenant_id);
    setIsAuthenticated(true);
    reloadData();
  };

  const handleLogout = () => {
    StorageService.logout();
    setIsAuthenticated(false);
  };

  // User & Tenant Handlers
  const handleSelectUser = (userId: string) => {
    setCurrentUserId(userId);
    StorageService.setCurrentUserId(userId);
    const user = users.find((u) => u.id === userId);
    if (user) {
      if (user.role === 'tenant_client' && user.tenant_id) {
        setCurrentTenantId(user.tenant_id);
        StorageService.setCurrentTenantId(user.tenant_id);
      } else if (user.role === 'super_admin' || user.role === 'promoter') {
        // preserve or set
      }
    }
  };

  const handleSelectTenant = (tenantId: string | null) => {
    setCurrentTenantId(tenantId);
    StorageService.setCurrentTenantId(tenantId);
  };

  const handleAddNewVet = (newVetData: Omit<Veterinarian, 'id' | 'created_at' | 'updated_at'>): Veterinarian => {
    const created = StorageService.addVeterinarian(newVetData);
    setVets(StorageService.getVeterinarians());
    return created;
  };

  const handleSaveVisit = (payload: {
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
  }) => {
    StorageService.createVisitWithReports(payload);
    reloadData();
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus, notes?: string) => {
    StorageService.updateTaskStatus(taskId, status, notes);
    reloadData();
  };

  const handleAddInstagramLead = (lead: Omit<InstagramPostLead, 'id' | 'created_at'>) => {
    StorageService.addInstagramLead(lead);
    reloadData();
  };

  const handleUpdateInstagramLeadStatus = (id: string, status: 'pending' | 'interacted' | 'converted') => {
    StorageService.updateInstagramLeadStatus(id, status);
    reloadData();
  };

  // Calculations for Badges
  const criticalAlertsCount = tasks.filter(
    (t) => (t.action_type === 'critical_resolution' || t.status === 'pending') && t.action_type === 'critical_resolution'
  ).length;

  const currentMonth = new Date().getMonth() + 1;
  const birthdaysCount = vets.filter((v) => {
    if (!v.birth_date) return false;
    const [, month] = v.birth_date.split('-');
    return parseInt(month, 10) === currentMonth;
  }).length;

  const promoterUsers = users.filter((u) => u.role === 'promoter' || u.role === 'super_admin');

  // IF NOT AUTHENTICATED: RENDER LOGIN & RECOVERY SCREEN
  if (!isAuthenticated) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // AUTHENTICATED DASHBOARD WITH RESPONSIVE COLLAPSIBLE SIDEBAR
  return (
    <div className="min-h-screen bg-[#FDF2E7]/40 text-[#111111] flex flex-col md:flex-row font-sans selection:bg-[#FF530D] selection:text-white">
      {/* Collapsible Left Sidebar & Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tenants={tenants}
        users={users}
        currentUserId={currentUserId}
        onSelectUser={handleSelectUser}
        currentTenantId={currentTenantId}
        onSelectTenant={handleSelectTenant}
        criticalAlertsCount={criticalAlertsCount}
        birthdaysCount={birthdaysCount}
        isOnline={isOnline}
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={handleToggleCollapsed}
      />

      {/* Main Content Area - dynamically adjusted to left margin when sidebar expands/collapses */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        <main className="flex-1 pb-16 md:pb-10 pt-4 px-4 sm:px-6 lg:px-8">
          {/* Top Birthday Alert Notification Bar with Instant WhatsApp Greeting Action */}
          <BirthdayNotificationBanner
            vets={vets}
            currentTenant={currentTenant}
            currentUserRole={currentUser.role}
            onOpenVetProfile={(v) => {
              setGlobalDossierVet(v);
              setIsGlobalDossierOpen(true);
            }}
          />

          {activeTab === 'field' && (currentUser.role === 'super_admin' || currentUser.role === 'promoter') && (
            <FieldModule
              vets={vets}
              tenants={tenants}
              promoters={promoterUsers}
              visits={visits}
              reports={reports}
              currentUserRole={currentUser.role}
              currentUserId={currentUserId}
              onSaveVisit={handleSaveVisit}
              onAddNewVet={handleAddNewVet}
            />
          )}

          {activeTab === 'map' && (currentUser.role === 'super_admin' || currentUser.role === 'promoter') && (
            <VisitationMapModule
              visits={visits}
              vets={vets}
              tenants={tenants}
              promoters={promoterUsers}
            />
          )}

          {activeTab === 'tenant-portal' && (
            <TenantPortal
              tenants={tenants}
              currentTenantId={currentTenantId}
              onSelectTenant={handleSelectTenant}
              vets={vets}
              visits={visits}
              reports={reports}
              tasks={tasks}
              currentUserRole={currentUser.role}
              onTenantUpdated={reloadData}
            />
          )}

          {activeTab === 'follow-up' && (currentUser.role === 'super_admin' || currentUser.role === 'promoter') && (
            <FollowUpModule
              tasks={tasks}
              vets={vets}
              tenants={tenants}
              reports={reports}
              instagramLeads={instagramLeads}
              currentUserRole={currentUser.role}
              currentUserId={currentUser.id}
              currentUserName={currentUser.full_name}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onAddInstagramLead={handleAddInstagramLead}
              onUpdateInstagramLeadStatus={handleUpdateInstagramLeadStatus}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsModule
              tenants={tenants}
              vets={vets}
              visits={visits}
              reports={reports}
              tasks={tasks}
              users={users}
              currentTenantId={currentTenantId}
              currentUserRole={currentUser.role}
              currentUserId={currentUser.id}
            />
          )}

          {activeTab === 'manual' && (
            <UserManualModule currentUserRole={currentUser.role} />
          )}

          {activeTab === 'gifts' && (currentUser.role === 'super_admin' || currentUser.role === 'promoter') && (
            <GiftsModule vets={vets} users={users} />
          )}

          {/* SENSITIVE MODULES: ONLY SUPER ADMIN (MATCH POINT GESTOR MASTER) */}
          {(activeTab === 'usuarios' || activeTab === 'promoter-analytics') && currentUser.role === 'super_admin' && (
            <UsersAndPromotersModule
              users={users}
              tenants={tenants}
              vets={vets}
              visits={visits}
              reports={reports}
              tasks={tasks}
              currentUserId={currentUserId}
              onDataChanged={reloadData}
            />
          )}

          {activeTab === 'contratantes' && currentUser.role === 'super_admin' && (
            <ContratantesModule
              tenants={tenants}
              users={users}
              onDataChanged={reloadData}
              onSelectTenantContext={(tId) => {
                handleSelectTenant(tId);
                setActiveTab('tenant-portal');
              }}
            />
          )}

          {activeTab === 'evolution' && currentUser.role === 'super_admin' && (
            <EvolutionApiModule vets={vets} tenants={tenants} />
          )}

          {activeTab === 'supabase' && currentUser.role === 'super_admin' && (
            <SupabaseModule onDataChanged={reloadData} />
          )}

          {activeTab === 'architecture' && currentUser.role === 'super_admin' && (
            <ArchitectureModule />
          )}
        </main>

        {/* Global Vet Profile Dossier Modal */}
        <VetProfileDossierModal
          vet={globalDossierVet}
          isOpen={isGlobalDossierOpen}
          onClose={() => setIsGlobalDossierOpen(false)}
          visits={visits}
          reports={reports}
          tenants={tenants}
          promoters={promoterUsers}
          currentUserRole={currentUser.role}
          currentUserId={currentUser.id}
          onStartCheckin={(v) => {
            setIsGlobalDossierOpen(false);
            setActiveTab('field');
          }}
        />

        {/* Footer */}
        <footer className="border-t border-[#E8D9C8] bg-white py-3.5 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-bold text-[#111111]">
              Match Point Promove • Inteligência de Campo B2B & Representação Comercial
            </span>
            <span className="text-slate-400">
              Isolamento Row-Level Security (RLS) & Painel Super Admin Protegido
            </span>
          </div>
        </footer>
        {/* Global Offline Indicator for PWA */}
        <OfflineIndicator />
        {/* Floating PWA Install Action Icon - Disappears when installed/standalone */}
        <PWAInstallButton variant="floating" />
      </div>
    </div>
  );
}

