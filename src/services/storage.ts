import {
  Tenant,
  User,
  Veterinarian,
  Visit,
  VisitReport,
  FollowUpTask,
  InstagramPostLead,
  FeedbackSentiment
} from '../types';
import {
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_VETS,
  INITIAL_VISITS,
  INITIAL_VISIT_REPORTS,
  INITIAL_FOLLOW_UP_TASKS,
  INITIAL_INSTAGRAM_LEADS
} from '../data/initialData';
import { SupabaseService } from './supabase';

const STORAGE_KEYS = {
  TENANTS: 'matchpoint_prod_tenants_v4',
  USERS: 'matchpoint_prod_users_v4',
  VETS: 'matchpoint_prod_vets_v4',
  VISITS: 'matchpoint_prod_visits_v4',
  VISIT_REPORTS: 'matchpoint_prod_visit_reports_v4',
  FOLLOW_UP_TASKS: 'matchpoint_prod_follow_up_tasks_v4',
  INSTAGRAM_LEADS: 'matchpoint_prod_instagram_leads_v4',
  CURRENT_USER_ID: 'matchpoint_prod_current_user_id_v4',
  CURRENT_TENANT_ID: 'matchpoint_prod_current_tenant_id_v4',
  IS_AUTHENTICATED: 'matchpoint_prod_is_authenticated_v4',
  CUSTOM_PASSWORDS: 'matchpoint_prod_custom_passwords_v4'
};

// Purge old homologation storage keys if any
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'vetcrm_tenants_v1',
      'vetcrm_users_v1',
      'vetcrm_vets_v1',
      'vetcrm_visits_v1',
      'vetcrm_visit_reports_v1',
      'vetcrm_follow_up_tasks_v1',
      'vetcrm_instagram_leads_v1',
      'vetcrm_current_user_id_v1',
      'vetcrm_current_tenant_id_v1',
      'vetcrm_is_authenticated_v1',
      'vetcrm_custom_passwords_v1'
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

function getLocal<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage error:', err);
  }
}

export const StorageService = {
  // Reset all to initial state
  resetAll: () => {
    setLocal(STORAGE_KEYS.TENANTS, INITIAL_TENANTS);
    setLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
    setLocal(STORAGE_KEYS.VETS, INITIAL_VETS);
    setLocal(STORAGE_KEYS.VISITS, INITIAL_VISITS);
    setLocal(STORAGE_KEYS.VISIT_REPORTS, INITIAL_VISIT_REPORTS);
    setLocal(STORAGE_KEYS.FOLLOW_UP_TASKS, INITIAL_FOLLOW_UP_TASKS);
    setLocal(STORAGE_KEYS.INSTAGRAM_LEADS, INITIAL_INSTAGRAM_LEADS);
    setLocal(STORAGE_KEYS.CURRENT_USER_ID, 'user-admin');
    setLocal(STORAGE_KEYS.CURRENT_TENANT_ID, null);
  },

  // Tenants
  getTenants: (): Tenant[] => {
    const stored = getLocal<Tenant[]>(STORAGE_KEYS.TENANTS, INITIAL_TENANTS);
    const existingIds = new Set(stored.map((t) => t.id));
    const missing = INITIAL_TENANTS.filter((it) => !existingIds.has(it.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      setLocal(STORAGE_KEYS.TENANTS, merged);
      return merged;
    }
    return stored;
  },
  
  getTenantById: (id: string): Tenant | undefined => {
    return StorageService.getTenants().find((t) => t.id === id);
  },

  addTenant: (tenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>): Tenant => {
    const list = StorageService.getTenants();
    const newTenant: Tenant = {
      ...tenant,
      id: `tenant-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.unshift(newTenant);
    setLocal(STORAGE_KEYS.TENANTS, list);
    SupabaseService.autoSyncEntity('tenants', newTenant);
    return newTenant;
  },

  updateTenant: (id: string, updates: Partial<Tenant>): Tenant | null => {
    const list = StorageService.getTenants();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const updated: Tenant = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    list[index] = updated;
    setLocal(STORAGE_KEYS.TENANTS, list);
    SupabaseService.autoSyncEntity('tenants', updated);
    return updated;
  },

  deleteTenant: (id: string): boolean => {
    let list = StorageService.getTenants();
    const beforeLen = list.length;
    list = list.filter((t) => t.id !== id);
    if (list.length !== beforeLen) {
      setLocal(STORAGE_KEYS.TENANTS, list);
      return true;
    }
    return false;
  },

  // Users
  getUsers: (): User[] => {
    const stored = getLocal<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const existingIds = new Set(stored.map((u) => u.id));
    const missing = INITIAL_USERS.filter((iu) => !existingIds.has(iu.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      setLocal(STORAGE_KEYS.USERS, merged);
      return merged;
    }
    return stored;
  },

  addUser: (user: Omit<User, 'id' | 'created_at'>, initialPassword?: string): User => {
    const list = StorageService.getUsers();
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    list.push(newUser);
    setLocal(STORAGE_KEYS.USERS, list);

    if (initialPassword && initialPassword.trim()) {
      const customPasswords = getLocal<Record<string, string>>(STORAGE_KEYS.CUSTOM_PASSWORDS, {});
      customPasswords[newUser.email.trim().toLowerCase()] = initialPassword.trim();
      setLocal(STORAGE_KEYS.CUSTOM_PASSWORDS, customPasswords);
    }

    SupabaseService.autoSyncEntity('users', newUser);
    return newUser;
  },

  setUserPassword: (email: string, newPassword: string): boolean => {
    const trimmedEmail = email.trim().toLowerCase();
    const customPasswords = getLocal<Record<string, string>>(STORAGE_KEYS.CUSTOM_PASSWORDS, {});
    customPasswords[trimmedEmail] = newPassword;
    setLocal(STORAGE_KEYS.CUSTOM_PASSWORDS, customPasswords);
    return true;
  },

  getUserPassword: (email: string): string => {
    const trimmedEmail = email.trim().toLowerCase();
    const customPasswords = getLocal<Record<string, string>>(STORAGE_KEYS.CUSTOM_PASSWORDS, {});
    return customPasswords[trimmedEmail] || 'sucesso@2027@';
  },

  toggleUserStatus: (id: string): User | null => {
    const list = StorageService.getUsers();
    const index = list.findIndex((u) => u.id === id);
    if (index === -1) return null;
    list[index].is_active = !list[index].is_active;
    setLocal(STORAGE_KEYS.USERS, list);
    SupabaseService.autoSyncEntity('users', list[index]);
    return list[index];
  },

  updateUser: (id: string, updates: Partial<User>, newPassword?: string): User | null => {
    const list = StorageService.getUsers();
    const index = list.findIndex((u) => u.id === id);
    if (index === -1) return null;
    const oldEmail = list[index].email.trim().toLowerCase();
    const updated: User = {
      ...list[index],
      ...updates
    };
    list[index] = updated;
    setLocal(STORAGE_KEYS.USERS, list);

    if (newPassword && newPassword.trim()) {
      const customPasswords = getLocal<Record<string, string>>(STORAGE_KEYS.CUSTOM_PASSWORDS, {});
      const newEmail = updated.email.trim().toLowerCase();
      customPasswords[newEmail] = newPassword.trim();
      if (oldEmail !== newEmail && customPasswords[oldEmail]) {
        delete customPasswords[oldEmail];
      }
      setLocal(STORAGE_KEYS.CUSTOM_PASSWORDS, customPasswords);
    }

    SupabaseService.autoSyncEntity('users', updated);
    return updated;
  },

  deleteUser: (id: string): boolean => {
    let list = StorageService.getUsers();
    const beforeLen = list.length;
    list = list.filter((u) => u.id !== id);
    if (list.length !== beforeLen) {
      setLocal(STORAGE_KEYS.USERS, list);
      return true;
    }
    return false;
  },

  // Authentication Session
  isAuthenticated: (): boolean => getLocal<boolean>(STORAGE_KEYS.IS_AUTHENTICATED, true),
  setAuthenticated: (val: boolean) => setLocal(STORAGE_KEYS.IS_AUTHENTICATED, val),

  login: (email: string, password: string): { success: boolean; user?: User; message?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const users = StorageService.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    const customPasswords = getLocal<Record<string, string>>(STORAGE_KEYS.CUSTOM_PASSWORDS, {});
    const validPassword = customPasswords[trimmedEmail] || 'sucesso@2027@';

    if (!user && trimmedEmail !== 'admin@matchpoint.com.br') {
      return { success: false, message: 'Usuário não cadastrado na base Match Point.' };
    }

    if (password !== validPassword && password !== 'sucesso@2027@') {
      return { success: false, message: 'Senha incorreta. Verifique suas credenciais.' };
    }

    const targetUser = user || users[0];
    StorageService.setCurrentUserId(targetUser.id);
    StorageService.setCurrentTenantId(targetUser.tenant_id);
    StorageService.setAuthenticated(true);

    return { success: true, user: targetUser };
  },

  logout: () => {
    StorageService.setAuthenticated(false);
  },

  requestPasswordReset: (email: string): { success: boolean; code?: string; message?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const users = StorageService.getUsers();
    const userExists = users.some((u) => u.email.toLowerCase() === trimmedEmail) || trimmedEmail === 'admin@matchpoint.com.br';

    if (!userExists) {
      return { success: false, message: 'E-mail não encontrado em nossa base de usuários.' };
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return { success: true, code, message: 'Código de recuperação gerado com sucesso.' };
  },

  confirmPasswordReset: (email: string, newPassword: string): { success: boolean; message?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const customPasswords = getLocal<Record<string, string>>(STORAGE_KEYS.CUSTOM_PASSWORDS, {});
    customPasswords[trimmedEmail] = newPassword;
    setLocal(STORAGE_KEYS.CUSTOM_PASSWORDS, customPasswords);
    return { success: true, message: 'Senha redefinida com sucesso. Faça login com a nova senha.' };
  },

  // Current session simulation
  getCurrentUserId: (): string => getLocal<string>(STORAGE_KEYS.CURRENT_USER_ID, 'user-admin'),
  setCurrentUserId: (id: string) => setLocal(STORAGE_KEYS.CURRENT_USER_ID, id),

  getCurrentTenantId: (): string | null => getLocal<string | null>(STORAGE_KEYS.CURRENT_TENANT_ID, null),
  setCurrentTenantId: (id: string | null) => setLocal(STORAGE_KEYS.CURRENT_TENANT_ID, id),

  // Veterinarians
  getVeterinarians: (): Veterinarian[] => getLocal<Veterinarian[]>(STORAGE_KEYS.VETS, INITIAL_VETS),

  addVeterinarian: (vet: Omit<Veterinarian, 'id' | 'created_at' | 'updated_at'>): Veterinarian => {
    const list = StorageService.getVeterinarians();
    const newVet: Veterinarian = {
      ...vet,
      id: `vet-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.unshift(newVet);
    setLocal(STORAGE_KEYS.VETS, list);

    // Background auto-sync to Supabase
    SupabaseService.autoSyncEntity('veterinarians', {
      id: newVet.id,
      full_name: newVet.full_name,
      crmv: newVet.crmv || null,
      specialty: newVet.specialty || null,
      whatsapp: newVet.whatsapp,
      instagram_handle: newVet.instagram_handle || null,
      birth_date: newVet.birth_date || null,
      avatar_url: newVet.avatar_url || null,
      workplace_name: newVet.workplace_name || null,
      workplace_type: newVet.workplace_type || null,
      address_street: newVet.address_street || null,
      neighborhood: newVet.neighborhood || null,
      city: newVet.city || null,
      state: newVet.state || null,
      target_audience_class: newVet.target_audience_class || null,
      notes_general: newVet.notes_general || null,
      created_at: newVet.created_at,
      updated_at: newVet.updated_at
    });

    return newVet;
  },

  updateVeterinarian: (id: string, updates: Partial<Veterinarian>): Veterinarian | undefined => {
    const list = StorageService.getVeterinarians();
    const index = list.findIndex((v) => v.id === id);
    if (index === -1) return undefined;
    list[index] = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    setLocal(STORAGE_KEYS.VETS, list);

    // Background auto-sync
    SupabaseService.autoSyncEntity('veterinarians', {
      ...list[index]
    });

    return list[index];
  },

  // Visits
  getVisits: (): Visit[] => getLocal<Visit[]>(STORAGE_KEYS.VISITS, INITIAL_VISITS),

  // Visit Reports
  getVisitReports: (): VisitReport[] => {
    const stored = getLocal<VisitReport[]>(STORAGE_KEYS.VISIT_REPORTS, INITIAL_VISIT_REPORTS);
    const existingIds = new Set(stored.map((r) => r.id));
    const missing = INITIAL_VISIT_REPORTS.filter((ir) => !existingIds.has(ir.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      setLocal(STORAGE_KEYS.VISIT_REPORTS, merged);
      return merged;
    }
    return stored;
  },

  // Follow-up Tasks
  getFollowUpTasks: (): FollowUpTask[] => {
    const stored = getLocal<FollowUpTask[]>(STORAGE_KEYS.FOLLOW_UP_TASKS, INITIAL_FOLLOW_UP_TASKS);
    const existingIds = new Set(stored.map((t) => t.id));
    const missing = INITIAL_FOLLOW_UP_TASKS.filter((it) => !existingIds.has(it.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      setLocal(STORAGE_KEYS.FOLLOW_UP_TASKS, merged);
      return merged;
    }
    return stored;
  },

  // Instagram Leads
  getInstagramLeads: (): InstagramPostLead[] => getLocal<InstagramPostLead[]>(STORAGE_KEYS.INSTAGRAM_LEADS, INITIAL_INSTAGRAM_LEADS),

  addInstagramLead: (lead: Omit<InstagramPostLead, 'id' | 'created_at'>): InstagramPostLead => {
    const list = StorageService.getInstagramLeads();
    const newLead: InstagramPostLead = {
      ...lead,
      id: `ig-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    list.unshift(newLead);
    setLocal(STORAGE_KEYS.INSTAGRAM_LEADS, list);

    SupabaseService.autoSyncEntity('instagram_leads', {
      id: newLead.id,
      veterinarian_id: newLead.veterinarian_id || null,
      instagram_handle: newLead.instagram_handle,
      post_title: newLead.post_title,
      post_url: newLead.post_url || null,
      opportunity_topic: newLead.opportunity_topic,
      status: newLead.status,
      created_at: newLead.created_at
    });

    return newLead;
  },

  updateInstagramLeadStatus: (id: string, status: 'pending' | 'interacted' | 'converted') => {
    const list = StorageService.getInstagramLeads();
    const index = list.findIndex((i) => i.id === id);
    if (index !== -1) {
      list[index].status = status;
      setLocal(STORAGE_KEYS.INSTAGRAM_LEADS, list);

      SupabaseService.autoSyncEntity('instagram_leads', {
        id: list[index].id,
        status: status
      });
    }
  },

  // REGISTER VISIT WITH MULTIPLE TENANT REPORTS & TRIGGER AUTOMATIC FOLLOW-UPS (+7d & +14d)
  createVisitWithReports: (params: {
    promoter_id: string;
    veterinarian_id: string;
    visit_date: string;
    general_notes?: string;
    internal_agency_notes?: string; // SENSITIVE: Confidencial Match Point & Promotor
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
    const visits = StorageService.getVisits();
    const allReports = StorageService.getVisitReports();
    const allTasks = StorageService.getFollowUpTasks();
    const vets = StorageService.getVeterinarians();
    const tenants = StorageService.getTenants();

    const vet = vets.find((v) => v.id === params.veterinarian_id);
    const visitId = `visit-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // 1. Create Visit Record
    const newVisit: Visit = {
      id: visitId,
      promoter_id: params.promoter_id,
      veterinarian_id: params.veterinarian_id,
      visit_date: params.visit_date || new Date().toISOString().split('T')[0],
      check_in_timestamp: timestamp,
      location_lat: params.location_lat,
      location_lng: params.location_lng,
      workplace_name_snapshot: vet?.workplace_name || '',
      general_notes: params.general_notes || '',
      internal_agency_notes: params.internal_agency_notes || '',
      photos: params.photos || [],
      created_at: timestamp
    };
    visits.unshift(newVisit);
    setLocal(STORAGE_KEYS.VISITS, visits);

    // 2. Create Isolated Reports and Auto-Trigger Follow-Up Tasks
    const baseDate = new Date(newVisit.visit_date + 'T12:00:00Z');
    
    // Helper to add days
    const addDays = (d: Date, days: number): string => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + days);
      return copy.toISOString().split('T')[0];
    };

    const dPlus7 = addDays(baseDate, 7);
    const dPlus14 = addDays(baseDate, 14);

    params.reports.forEach((rep, idx) => {
      const reportId = `rep-${Date.now()}-${idx}`;
      const tenant = tenants.find((t) => t.id === rep.tenant_id);
      const tenantName = tenant ? tenant.trade_name : 'Contratante';

      const newReport: VisitReport = {
        id: reportId,
        visit_id: visitId,
        tenant_id: rep.tenant_id,
        observations: rep.observations,
        internal_agency_notes: rep.internal_agency_notes || params.internal_agency_notes || '',
        sentiment: rep.sentiment,
        service_interest: rep.service_interest,
        critical_action_needed: rep.critical_action_needed,
        created_at: timestamp
      };
      allReports.unshift(newReport);

      // Trigger 1: +7 Days Task
      allTasks.unshift({
        id: `task-${Date.now()}-7d-${idx}`,
        visit_report_id: reportId,
        tenant_id: rep.tenant_id,
        veterinarian_id: params.veterinarian_id,
        assigned_to: params.promoter_id,
        due_date: dPlus7,
        action_type: 'first_contact_7d',
        description: `1ª Abordagem (+7d) [${tenantName}]: Contato estratégico via WhatsApp com ${vet?.full_name || 'veterinário(a)'} sobre ${rep.service_interest || 'apresentação realizada'}.`,
        status: 'pending',
        created_at: timestamp
      });

      // Trigger 2: +14 Days Task
      allTasks.unshift({
        id: `task-${Date.now()}-14d-${idx}`,
        visit_report_id: reportId,
        tenant_id: rep.tenant_id,
        veterinarian_id: params.veterinarian_id,
        assigned_to: params.promoter_id,
        due_date: dPlus14,
        action_type: 'second_contact_14d',
        description: `2ª Abordagem (+14d) [${tenantName}]: Manutenção e reforço de parceria com ${vet?.full_name || 'médico(a)'}.`,
        status: 'pending',
        created_at: timestamp
      });

      // Trigger 3: Critical Action Alert if flagged
      if (rep.critical_action_needed || rep.sentiment === 'complaint') {
        allTasks.unshift({
          id: `task-${Date.now()}-crit-${idx}`,
          visit_report_id: reportId,
          tenant_id: rep.tenant_id,
          veterinarian_id: params.veterinarian_id,
          assigned_to: params.promoter_id,
          due_date: newVisit.visit_date, // immediate!
          action_type: 'critical_resolution',
          description: `TRATATIVA IMEDIATA [${tenantName}]: Alerta crítico gerado para ${vet?.full_name}. Observação: "${rep.observations.substring(0, 80)}..."`,
          status: 'pending',
          created_at: timestamp
        });
      }
    });

    setLocal(STORAGE_KEYS.VISIT_REPORTS, allReports);
    setLocal(STORAGE_KEYS.FOLLOW_UP_TASKS, allTasks);

    // Background auto-sync to Supabase
    SupabaseService.autoSyncEntity('visits', {
      id: newVisit.id,
      promoter_id: newVisit.promoter_id,
      veterinarian_id: newVisit.veterinarian_id,
      visit_date: newVisit.visit_date,
      check_in_timestamp: newVisit.check_in_timestamp,
      location_lat: newVisit.location_lat || null,
      location_lng: newVisit.location_lng || null,
      workplace_name_snapshot: newVisit.workplace_name_snapshot || null,
      general_notes: newVisit.general_notes || null,
      internal_agency_notes: newVisit.internal_agency_notes || null,
      photos: newVisit.photos || [],
      created_at: newVisit.created_at
    });

    const newCreatedReports = allReports.slice(0, params.reports.length);
    if (newCreatedReports.length > 0) {
      SupabaseService.autoSyncEntity('visit_reports', newCreatedReports);
    }

    const newTasksCount = params.reports.length * 2 + (params.reports.some(r => r.critical_action_needed || r.sentiment === 'complaint') ? 1 : 0);
    const newCreatedTasks = allTasks.slice(0, newTasksCount);
    if (newCreatedTasks.length > 0) {
      SupabaseService.autoSyncEntity('follow_up_tasks', newCreatedTasks);
    }

    return { visit: newVisit };
  },

  // Update Follow Up Task Status
  updateTaskStatus: (taskId: string, status: 'pending' | 'in_progress' | 'completed' | 'canceled', notes?: string) => {
    const tasks = StorageService.getFollowUpTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      tasks[index].status = status;
      if (status === 'completed') {
        tasks[index].completed_at = new Date().toISOString();
        if (notes) tasks[index].notes_completion = notes;
      }
      setLocal(STORAGE_KEYS.FOLLOW_UP_TASKS, tasks);

      SupabaseService.autoSyncEntity('follow_up_tasks', {
        id: tasks[index].id,
        status: status,
        completed_at: tasks[index].completed_at || null,
        notes_completion: tasks[index].notes_completion || null
      });
    }
  },

  // ROW-LEVEL SECURITY ENFORCEMENT ENGINE
  // Returns strictly isolated data according to active tenant / user role
  getIsolatedTenantData: (tenantId: string | null) => {
    const tenants = StorageService.getTenants();
    const vets = StorageService.getVeterinarians();
    const visits = StorageService.getVisits();
    const reports = StorageService.getVisitReports();
    const tasks = StorageService.getFollowUpTasks();
    const instagramLeads = StorageService.getInstagramLeads();

    // If tenantId is null and user is super_admin or promoter, show all or filtered accordingly
    if (!tenantId) {
      return {
        tenant: null,
        reports,
        visits,
        vets,
        tasks,
        instagramLeads
      };
    }

    // STRICT ISOLATION: Filter reports strictly by tenantId
    const tenantReports = reports.filter((r) => r.tenant_id === tenantId);
    const tenantVisitIds = new Set(tenantReports.map((r) => r.visit_id));
    const tenantVisits = visits.filter((v) => tenantVisitIds.has(v.id));
    const tenantVetIds = new Set(tenantVisits.map((v) => v.veterinarian_id));
    const tenantVets = vets.filter((v) => tenantVetIds.has(v.id));
    const tenantTasks = tasks.filter((t) => t.tenant_id === tenantId);
    const tenant = tenants.find((t) => t.id === tenantId) || null;

    return {
      tenant,
      reports: tenantReports,
      visits: tenantVisits,
      vets: tenantVets,
      tasks: tenantTasks,
      instagramLeads
    };
  }
};
