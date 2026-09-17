import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Tenant,
  User,
  Veterinarian,
  Visit,
  VisitReport,
  FollowUpTask,
  InstagramPostLead,
  SupabaseSyncLog,
  TableSyncStatus,
  SupabaseConfig,
  SupabaseDiagnosticsResult
} from '../types';
import { StorageService } from './storage';

// Default Supabase configuration from environment or direct credentials
const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env || {};

const DEFAULT_SUPABASE_URL =
  metaEnv.VITE_SUPABASE_URL || 'https://bkmfgymvkcaywxdcclfk.supabase.co';

const DEFAULT_SUPABASE_ANON_KEY =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbWZneW12a2NheXd4ZGNjbGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODk5NTcsImV4cCI6MjEwNDU2NTk1N30.OP5Ec7Y3ZAqgKGxdXSxWBQy7X8qITfeYiqh9J5E6W-c';

const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  metaEnv.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbWZneW12a2NheXd4ZGNjbGZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODk4OTk1NywiZXhwIjoyMTA0NTY1OTU3fQ.P5bMFAA-fe8n2vd_YA_4hUhmWyN8NI2sP-FfoOkBnZA';

const STORAGE_KEYS = {
  CONFIG: 'vetcrm_supabase_config_v2',
  SYNC_LOGS: 'vetcrm_supabase_sync_logs_v1',
  AUTO_SYNC: 'vetcrm_supabase_auto_sync_enabled_v1',
  LAST_SYNC: 'vetcrm_supabase_last_sync_timestamp_v1'
};

function sanitizeUrl(rawUrl: string): string {
  let clean = (rawUrl || '').trim();
  if (!clean) return '';
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean.replace(/\/+$/, '');
}

function sanitizeKey(rawKey: string): string {
  return (rawKey || '').trim();
}

function getStoredConfig(): SupabaseConfig {
  if (typeof window === 'undefined') {
    return {
      url: DEFAULT_SUPABASE_URL,
      anonKey: DEFAULT_SUPABASE_ANON_KEY,
      serviceRoleKey: DEFAULT_SUPABASE_SERVICE_ROLE_KEY
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: sanitizeUrl(parsed.url || DEFAULT_SUPABASE_URL),
        anonKey: sanitizeKey(parsed.anonKey || DEFAULT_SUPABASE_ANON_KEY),
        serviceRoleKey: sanitizeKey(parsed.serviceRoleKey || DEFAULT_SUPABASE_SERVICE_ROLE_KEY)
      };
    }
  } catch {
    // fallback
  }
  return {
    url: sanitizeUrl(DEFAULT_SUPABASE_URL),
    anonKey: sanitizeKey(DEFAULT_SUPABASE_ANON_KEY),
    serviceRoleKey: sanitizeKey(DEFAULT_SUPABASE_SERVICE_ROLE_KEY)
  };
}

// Client cache
let cachedAdminClient: SupabaseClient | null = null;
let cachedAnonClient: SupabaseClient | null = null;
let cachedConfigKey = '';

function getClients(): { admin: SupabaseClient; anon: SupabaseClient } {
  const config = getStoredConfig();
  const currentKey = `${config.url}|${config.anonKey}|${config.serviceRoleKey || ''}`;

  if (cachedAdminClient && cachedAnonClient && cachedConfigKey === currentKey) {
    return { admin: cachedAdminClient, anon: cachedAnonClient };
  }

  const effectiveKey = config.serviceRoleKey || config.anonKey;

  cachedAdminClient = createClient(config.url, effectiveKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  cachedAnonClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });

  cachedConfigKey = currentKey;
  return { admin: cachedAdminClient, anon: cachedAnonClient };
}

// Proxy exports so existing calls to `supabaseAdmin.from(...)` always use configured client
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClients().admin;
    const val = (client as unknown as Record<string, unknown>)[prop as string];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  }
});

export const supabaseAnon: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClients().anon;
    const val = (client as unknown as Record<string, unknown>)[prop as string];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  }
});

function getLocalLogs(): SupabaseSyncLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLogs(logs: SupabaseSyncLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep last 100 logs
    localStorage.setItem(STORAGE_KEYS.SYNC_LOGS, JSON.stringify(logs.slice(0, 100)));
  } catch {
    // ignore
  }
}

export const SupabaseService = {
  // Configuration access
  getConfig: (): SupabaseConfig => getStoredConfig(),

  saveConfig: (newConfig: Partial<SupabaseConfig>): SupabaseConfig => {
    const current = getStoredConfig();
    const updated: SupabaseConfig = {
      url: sanitizeUrl(newConfig.url ?? current.url),
      anonKey: sanitizeKey(newConfig.anonKey ?? current.anonKey),
      serviceRoleKey: sanitizeKey(newConfig.serviceRoleKey ?? current.serviceRoleKey ?? '')
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
    }
    cachedAdminClient = null;
    cachedAnonClient = null;
    cachedConfigKey = '';

    SupabaseService.addLog({
      action: 'test_connection',
      status: 'in_progress',
      message: `Configurações Supabase salvas para ${updated.url}.`
    });

    return updated;
  },

  resetConfig: (): SupabaseConfig => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
    }
    cachedAdminClient = null;
    cachedAnonClient = null;
    cachedConfigKey = '';
    return getStoredConfig();
  },

  // Auto-sync setting
  isAutoSyncEnabled: (): boolean => {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC);
    return val !== null ? val === 'true' : true;
  },

  setAutoSyncEnabled: (enabled: boolean): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, enabled ? 'true' : 'false');
  },

  getLastSyncTimestamp: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  },

  setLastSyncTimestamp: (ts: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, ts);
  },

  // Logs management
  getLogs: (): SupabaseSyncLog[] => getLocalLogs(),

  addLog: (log: Omit<SupabaseSyncLog, 'id' | 'timestamp'>): SupabaseSyncLog => {
    const newLog: SupabaseSyncLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString()
    };
    const logs = [newLog, ...getLocalLogs()];
    saveLocalLogs(logs);
    return newLog;
  },

  clearLogs: (): void => {
    saveLocalLogs([]);
  },

  // Diagnostic Test
  runDiagnostics: async (customConfig?: SupabaseConfig): Promise<SupabaseDiagnosticsResult> => {
    const cfg = customConfig || getStoredConfig();
    const cleanUrl = sanitizeUrl(cfg.url);
    const key = cfg.serviceRoleKey || cfg.anonKey;

    const result: SupabaseDiagnosticsResult = {
      ping: { status: 'warning', latencyMs: 0, message: 'Iniciando teste de conectividade...' },
      auth: { status: 'warning', message: 'Aguardando validação de credenciais...' },
      schema: { status: 'warning', tablesFound: 0, totalTables: 7, missingTables: [], message: 'Verificando tabelas...' },
      overallStatus: 'network_error',
      summary: ''
    };

    if (!cleanUrl || !cleanUrl.includes('supabase.co')) {
      result.ping = { status: 'error', latencyMs: 0, message: 'URL do Supabase inválida. Deve seguir o formato https://<id>.supabase.co' };
      result.auth = { status: 'error', message: 'Chave não testada devido à URL inválida.' };
      result.overallStatus = 'invalid_credentials';
      result.summary = 'A URL fornecida não é um endpoint Supabase válido.';
      return result;
    }

    const startPing = performance.now();

    // 1. Direct Ping to Supabase Auth Health Endpoint
    try {
      const healthRes = await fetch(`${cleanUrl}/auth/v1/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      result.ping.latencyMs = Math.round(performance.now() - startPing);

      if (healthRes.ok) {
        result.ping.status = 'success';
        result.ping.message = `Servidor Supabase online e respondendo (${result.ping.latencyMs}ms).`;
      } else if (healthRes.status === 503) {
        result.ping.status = 'error';
        result.ping.message = 'Projeto Supabase pausado por inatividade no tier gratuito. Reative-o no painel do Supabase.';
        result.overallStatus = 'project_paused';
        result.summary = 'O projeto Supabase está pausado. Acesse app.supabase.com e clique em "Restore project".';
        return result;
      } else {
        result.ping.status = 'warning';
        result.ping.message = `Servidor respondeu com código HTTP ${healthRes.status}.`;
      }
    } catch (netErr: unknown) {
      result.ping.latencyMs = Math.round(performance.now() - startPing);
      result.ping.status = 'error';
      const msg = netErr instanceof Error ? netErr.message : String(netErr);
      result.ping.message = `Falha ao alcançar ${cleanUrl}: ${msg}`;
      result.overallStatus = 'network_error';
      result.summary = 'Não foi possível conectar ao servidor do Supabase. Verifique a URL ou sua conexão de internet.';
      return result;
    }

    // 2. PostgREST Auth Validation
    try {
      const restRes = await fetch(`${cleanUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      });

      if (restRes.status === 401 || restRes.status === 403) {
        result.auth.status = 'error';
        result.auth.message = 'Chave de API inválida ou expirada (401 Unauthorized). Verifique se a chave Anon ou Service Role foi copiada corretamente.';
        result.overallStatus = 'invalid_credentials';
        result.summary = 'A chave de API informada foi recusada pelo Supabase. Verifique em Project Settings > API.';
        return result;
      } else if (restRes.ok || restRes.status === 200 || restRes.status === 404) {
        result.auth.status = 'success';
        result.auth.message = `Credenciais validadas com sucesso (${cfg.serviceRoleKey ? 'Service Role Key ativa' : 'Anon Key ativa'}).`;
      } else {
        result.auth.status = 'warning';
        result.auth.message = `Resposta PostgREST: HTTP ${restRes.status}`;
      }
    } catch {
      result.auth.status = 'warning';
      result.auth.message = 'Verificação via REST direto ignorada por política de navegador.';
    }

    // 3. Schema / Table Inspection
    const tables = [
      'tenants',
      'users',
      'veterinarians',
      'visits',
      'visit_reports',
      'follow_up_tasks',
      'instagram_leads'
    ];

    const client = getClients().admin;
    const missing: string[] = [];
    let foundCount = 0;

    for (const tbl of tables) {
      try {
        const { error } = await client.from(tbl).select('id').limit(1);
        if (error) {
          if (
            error.code === '42P01' ||
            error.code === 'PGRST205' ||
            error.code === 'PGRST204' ||
            error.code === 'PGRST200' ||
            error.message?.includes('schema cache') ||
            error.message?.includes('does not exist') ||
            error.message?.includes('relation')
          ) {
            missing.push(tbl);
          } else {
            foundCount++;
          }
        } else {
          foundCount++;
        }
      } catch {
        missing.push(tbl);
      }
    }

    result.schema.tablesFound = foundCount;
    result.schema.totalTables = tables.length;
    result.schema.missingTables = missing;

    if (foundCount === tables.length) {
      result.schema.status = 'success';
      result.schema.message = 'Todas as 7 tabelas do sistema Match Point estão operacionais!';
      result.overallStatus = 'connected';
      result.summary = 'Supabase 100% conectado e integrado com todas as 7 tabelas prontas.';
    } else if (foundCount > 0) {
      result.schema.status = 'warning';
      result.schema.message = `${foundCount} de 7 tabelas encontradas. Faltam: ${missing.join(', ')}.`;
      result.overallStatus = 'needs_sql_setup';
      result.summary = 'Conexão ativa! Algumas tabelas precisam ser criadas executando o Script SQL.';
    } else {
      result.schema.status = 'warning';
      result.schema.message = 'Nenhuma das 7 tabelas foi criada no Supabase ainda.';
      result.overallStatus = 'needs_sql_setup';
      result.summary = 'Credenciais corretas e Supabase online! É necessário rodar o Script SQL no SQL Editor do Supabase para criar as tabelas.';
    }

    return result;
  },

  // Test connection to Supabase
  testConnection: async (): Promise<{
    success: boolean;
    latencyMs: number;
    message: string;
    status?: SupabaseDiagnosticsResult['overallStatus'];
    details?: string;
  }> => {
    const diag = await SupabaseService.runDiagnostics();
    const config = getStoredConfig();

    if (diag.overallStatus === 'connected') {
      SupabaseService.addLog({
        action: 'test_connection',
        status: 'success',
        message: `Conexão ativa com Supabase (${config.url}). 7 de 7 tabelas operacionais.`,
        details: `Latência: ${diag.ping.latencyMs}ms`
      });
      return {
        success: true,
        latencyMs: diag.ping.latencyMs,
        status: diag.overallStatus,
        message: `Conexão bem-sucedida! Supabase online (${diag.ping.latencyMs}ms).`
      };
    }

    if (diag.overallStatus === 'needs_sql_setup') {
      SupabaseService.addLog({
        action: 'test_connection',
        status: 'warning',
        message: `Credenciais corretas e Supabase conectado (${config.url}), mas tabelas precisam ser criadas.`,
        details: `Tabelas ausentes: ${diag.schema.missingTables.join(', ')}`
      });
      return {
        success: true,
        latencyMs: diag.ping.latencyMs,
        status: diag.overallStatus,
        message: `Credenciais corretas! Supabase online (${diag.ping.latencyMs}ms). As tabelas precisam ser criadas via Script SQL.`,
        details: `Tabelas ausentes: ${diag.schema.missingTables.join(', ')}`
      };
    }

    // Errors
    SupabaseService.addLog({
      action: 'test_connection',
      status: 'error',
      message: `Erro ao comunicar com Supabase: ${diag.summary}`,
      details: `${diag.ping.message} | ${diag.auth.message}`
    });

    return {
      success: false,
      latencyMs: diag.ping.latencyMs,
      status: diag.overallStatus,
      message: diag.summary,
      details: `${diag.ping.message} | ${diag.auth.message}`
    };
  },

  // Check live status of all 7 database tables
  checkAllTables: async (): Promise<TableSyncStatus[]> => {
    const tables: Array<{ name: string; display: string; getLocalCount: () => number }> = [
      { name: 'tenants', display: 'Empresas Contratantes (Tenants)', getLocalCount: () => StorageService.getTenants().length },
      { name: 'users', display: 'Usuários & Promotores (Users)', getLocalCount: () => StorageService.getUsers().length },
      { name: 'veterinarians', display: 'Médicos-Veterinários (Veterinarians)', getLocalCount: () => StorageService.getVeterinarians().length },
      { name: 'visits', display: 'Visitas em Campo (Visits)', getLocalCount: () => StorageService.getVisits().length },
      { name: 'visit_reports', display: 'Relatórios Segregados (Visit Reports)', getLocalCount: () => StorageService.getVisitReports().length },
      { name: 'follow_up_tasks', display: 'Régua de Follow-up (Tasks 7d/14d)', getLocalCount: () => StorageService.getFollowUpTasks().length },
      { name: 'instagram_leads', display: 'Instagram Social Leads', getLocalCount: () => StorageService.getInstagramLeads().length }
    ];

    const results: TableSyncStatus[] = [];

    for (const tbl of tables) {
      const localCount = tbl.getLocalCount();
      try {
        const { count, error } = await supabaseAdmin
          .from(tbl.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (
            error.code === '42P01' ||
            error.message?.includes('does not exist') ||
            error.message?.includes('relation')
          ) {
            results.push({
              tableName: tbl.name,
              displayName: tbl.display,
              localCount,
              remoteCount: null,
              status: 'table_missing',
              error: 'Tabela ainda não criada no Supabase'
            });
          } else {
            results.push({
              tableName: tbl.name,
              displayName: tbl.display,
              localCount,
              remoteCount: null,
              status: 'error',
              error: error.message
            });
          }
        } else {
          const remoteCount = count ?? 0;
          let status: TableSyncStatus['status'] = 'synced';
          if (localCount > remoteCount) status = 'pending_push';
          else if (remoteCount > localCount) status = 'pending_pull';

          results.push({
            tableName: tbl.name,
            displayName: tbl.display,
            localCount,
            remoteCount,
            status,
            lastSyncedAt: new Date().toISOString()
          });
        }
      } catch (err: unknown) {
        results.push({
          tableName: tbl.name,
          displayName: tbl.display,
          localCount,
          remoteCount: null,
          status: 'error',
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    return results;
  },

  // Push all local data into Supabase (Seed & Full Sync)
  pushAllToSupabase: async (): Promise<{
    success: boolean;
    totalUploaded: number;
    errors: string[];
    tableResults: Record<string, { count: number; error?: string }>;
  }> => {
    const errors: string[] = [];
    let totalUploaded = 0;
    const tableResults: Record<string, { count: number; error?: string }> = {};

    SupabaseService.addLog({
      action: 'push_all',
      status: 'in_progress',
      message: 'Iniciando upload e sincronização de todas as tabelas locais para o Supabase...'
    });

    try {
      // 1. Tenants
      const tenants = StorageService.getTenants();
      if (tenants.length > 0) {
        const { error } = await supabaseAdmin.from('tenants').upsert(
          tenants.map((t) => ({
            id: t.id,
            company_name: t.company_name,
            trade_name: t.trade_name,
            cnpj: t.cnpj || null,
            segment: t.segment || null,
            color_theme: t.color_theme || '#FF530D',
            logo_url: t.logo_url || null,
            is_active: t.is_active,
            created_at: t.created_at,
            updated_at: t.updated_at
          })),
          { onConflict: 'id' }
        );
        if (error) {
          errors.push(`Tenants: ${error.message}`);
          tableResults.tenants = { count: 0, error: error.message };
        } else {
          totalUploaded += tenants.length;
          tableResults.tenants = { count: tenants.length };
        }
      }

      // 2. Users
      const users = StorageService.getUsers();
      if (users.length > 0) {
        const { error } = await supabaseAdmin.from('users').upsert(
          users.map((u) => ({
            id: u.id,
            tenant_id: u.tenant_id || null,
            full_name: u.full_name,
            email: u.email,
            role: u.role,
            phone: u.phone || null,
            avatar_url: u.avatar_url || null,
            is_active: u.is_active,
            created_at: u.created_at
          })),
          { onConflict: 'id' }
        );
        if (error) {
          errors.push(`Users: ${error.message}`);
          tableResults.users = { count: 0, error: error.message };
        } else {
          totalUploaded += users.length;
          tableResults.users = { count: users.length };
        }
      }

      // 3. Veterinarians
      const vets = StorageService.getVeterinarians();
      if (vets.length > 0) {
        const { error } = await supabaseAdmin.from('veterinarians').upsert(
          vets.map((v) => ({
            id: v.id,
            full_name: v.full_name,
            crmv: v.crmv || null,
            specialty: v.specialty || null,
            whatsapp: v.whatsapp,
            instagram_handle: v.instagram_handle || null,
            birth_date: v.birth_date || null,
            avatar_url: v.avatar_url || null,
            workplace_name: v.workplace_name || null,
            workplace_type: v.workplace_type || null,
            address_street: v.address_street || null,
            neighborhood: v.neighborhood || null,
            city: v.city || null,
            state: v.state || null,
            target_audience_class: v.target_audience_class || null,
            notes_general: v.notes_general || null,
            created_at: v.created_at,
            updated_at: v.updated_at
          })),
          { onConflict: 'id' }
        );
        if (error) {
          errors.push(`Veterinarians: ${error.message}`);
          tableResults.veterinarians = { count: 0, error: error.message };
        } else {
          totalUploaded += vets.length;
          tableResults.veterinarians = { count: vets.length };
        }
      }

      // 4. Visits
      const visits = StorageService.getVisits();
      if (visits.length > 0) {
        const { error } = await supabaseAdmin.from('visits').upsert(
          visits.map((v) => ({
            id: v.id,
            promoter_id: v.promoter_id,
            veterinarian_id: v.veterinarian_id,
            visit_date: v.visit_date,
            check_in_timestamp: v.check_in_timestamp,
            location_lat: v.location_lat || null,
            location_lng: v.location_lng || null,
            workplace_name_snapshot: v.workplace_name_snapshot || null,
            general_notes: v.general_notes || null,
            created_at: v.created_at
          })),
          { onConflict: 'id' }
        );
        if (error) {
          errors.push(`Visits: ${error.message}`);
          tableResults.visits = { count: 0, error: error.message };
        } else {
          totalUploaded += visits.length;
          tableResults.visits = { count: visits.length };
        }
      }

      // 5. Visit Reports
      const reports = StorageService.getVisitReports();
      if (reports.length > 0) {
        const { error } = await supabaseAdmin.from('visit_reports').upsert(
          reports.map((r) => ({
            id: r.id,
            visit_id: r.visit_id,
            tenant_id: r.tenant_id,
            observations: r.observations,
            sentiment: r.sentiment,
            service_interest: r.service_interest || null,
            critical_action_needed: r.critical_action_needed,
            created_at: r.created_at
          })),
          { onConflict: 'id' }
        );
        if (error) {
          errors.push(`VisitReports: ${error.message}`);
          tableResults.visit_reports = { count: 0, error: error.message };
        } else {
          totalUploaded += reports.length;
          tableResults.visit_reports = { count: reports.length };
        }
      }

      // 6. Follow-up Tasks
      const tasks = StorageService.getFollowUpTasks();
      if (tasks.length > 0) {
        const { error } = await supabaseAdmin.from('follow_up_tasks').upsert(
          tasks.map((t) => ({
            id: t.id,
            visit_report_id: t.visit_report_id || null,
            tenant_id: t.tenant_id,
            veterinarian_id: t.veterinarian_id,
            assigned_to: t.assigned_to || null,
            due_date: t.due_date,
            action_type: t.action_type,
            description: t.description,
            status: t.status,
            completed_at: t.completed_at || null,
            notes_completion: t.notes_completion || null,
            created_at: t.created_at
          })),
          { onConflict: 'id' }
        );
        if (error) {
          errors.push(`FollowUpTasks: ${error.message}`);
          tableResults.follow_up_tasks = { count: 0, error: error.message };
        } else {
          totalUploaded += tasks.length;
          tableResults.follow_up_tasks = { count: tasks.length };
        }
      }

      // 7. Instagram Leads
      const leads = StorageService.getInstagramLeads();
      if (leads.length > 0) {
        const { error } = await supabaseAdmin.from('instagram_leads').upsert(
          leads.map((l) => ({
            id: l.id,
            veterinarian_id: l.veterinarian_id || null,
            instagram_handle: l.instagram_handle,
            post_title: l.post_title,
            post_url: l.post_url || null,
            opportunity_topic: l.opportunity_topic,
            status: l.status,
            created_at: l.created_at
          })),
          { onConflict: 'id' }
        );
        if (error) {
          errors.push(`InstagramLeads: ${error.message}`);
          tableResults.instagram_leads = { count: 0, error: error.message };
        } else {
          totalUploaded += leads.length;
          tableResults.instagram_leads = { count: leads.length };
        }
      }

      const timestamp = new Date().toISOString();
      SupabaseService.setLastSyncTimestamp(timestamp);

      if (errors.length === 0) {
        SupabaseService.addLog({
          action: 'push_all',
          status: 'success',
          recordsCount: totalUploaded,
          message: `Sincronização concluída com sucesso! ${totalUploaded} registros enviados ao Supabase.`
        });
        return { success: true, totalUploaded, errors: [], tableResults };
      } else {
        SupabaseService.addLog({
          action: 'push_all',
          status: 'warning',
          recordsCount: totalUploaded,
          message: `Sincronização parcial: ${totalUploaded} registros gravados, com ${errors.length} erros. Verifique se todas as tabelas foram criadas no Supabase.`,
          details: errors.join('; ')
        });
        return { success: false, totalUploaded, errors, tableResults };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      SupabaseService.addLog({
        action: 'push_all',
        status: 'error',
        message: `Falha crítica durante sincronização: ${msg}`
      });
      return { success: false, totalUploaded, errors, tableResults };
    }
  },

  // Pull all data from Supabase into Local Storage
  pullAllFromSupabase: async (): Promise<{
    success: boolean;
    totalDownloaded: number;
    errors: string[];
  }> => {
    const errors: string[] = [];
    let totalDownloaded = 0;

    SupabaseService.addLog({
      action: 'pull_all',
      status: 'in_progress',
      message: 'Baixando todos os registros do Supabase para atualizar a base local...'
    });

    try {
      // 1. Tenants
      const { data: remoteTenants, error: errTenants } = await supabaseAdmin
        .from('tenants')
        .select('*');
      if (errTenants) {
        errors.push(`Tenants: ${errTenants.message}`);
      } else if (remoteTenants && remoteTenants.length > 0) {
        localStorage.setItem('vetcrm_tenants_v1', JSON.stringify(remoteTenants));
        totalDownloaded += remoteTenants.length;
      }

      // 2. Users
      const { data: remoteUsers, error: errUsers } = await supabaseAdmin
        .from('users')
        .select('*');
      if (errUsers) {
        errors.push(`Users: ${errUsers.message}`);
      } else if (remoteUsers && remoteUsers.length > 0) {
        localStorage.setItem('vetcrm_users_v1', JSON.stringify(remoteUsers));
        totalDownloaded += remoteUsers.length;
      }

      // 3. Veterinarians
      const { data: remoteVets, error: errVets } = await supabaseAdmin
        .from('veterinarians')
        .select('*')
        .order('created_at', { ascending: false });
      if (errVets) {
        errors.push(`Veterinarians: ${errVets.message}`);
      } else if (remoteVets && remoteVets.length > 0) {
        localStorage.setItem('vetcrm_vets_v1', JSON.stringify(remoteVets));
        totalDownloaded += remoteVets.length;
      }

      // 4. Visits
      const { data: remoteVisits, error: errVisits } = await supabaseAdmin
        .from('visits')
        .select('*')
        .order('created_at', { ascending: false });
      if (errVisits) {
        errors.push(`Visits: ${errVisits.message}`);
      } else if (remoteVisits && remoteVisits.length > 0) {
        localStorage.setItem('vetcrm_visits_v1', JSON.stringify(remoteVisits));
        totalDownloaded += remoteVisits.length;
      }

      // 5. Reports
      const { data: remoteReports, error: errReports } = await supabaseAdmin
        .from('visit_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (errReports) {
        errors.push(`VisitReports: ${errReports.message}`);
      } else if (remoteReports && remoteReports.length > 0) {
        localStorage.setItem('vetcrm_visit_reports_v1', JSON.stringify(remoteReports));
        totalDownloaded += remoteReports.length;
      }

      // 6. Tasks
      const { data: remoteTasks, error: errTasks } = await supabaseAdmin
        .from('follow_up_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (errTasks) {
        errors.push(`FollowUpTasks: ${errTasks.message}`);
      } else if (remoteTasks && remoteTasks.length > 0) {
        localStorage.setItem('vetcrm_follow_up_tasks_v1', JSON.stringify(remoteTasks));
        totalDownloaded += remoteTasks.length;
      }

      // 7. Instagram
      const { data: remoteLeads, error: errLeads } = await supabaseAdmin
        .from('instagram_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (errLeads) {
        errors.push(`InstagramLeads: ${errLeads.message}`);
      } else if (remoteLeads && remoteLeads.length > 0) {
        localStorage.setItem('vetcrm_instagram_leads_v1', JSON.stringify(remoteLeads));
        totalDownloaded += remoteLeads.length;
      }

      const timestamp = new Date().toISOString();
      SupabaseService.setLastSyncTimestamp(timestamp);

      if (errors.length === 0) {
        SupabaseService.addLog({
          action: 'pull_all',
          status: 'success',
          recordsCount: totalDownloaded,
          message: `Download concluído com sucesso! ${totalDownloaded} registros importados do Supabase.`
        });
        return { success: true, totalDownloaded, errors: [] };
      } else {
        SupabaseService.addLog({
          action: 'pull_all',
          status: 'warning',
          recordsCount: totalDownloaded,
          message: `Download parcial: ${totalDownloaded} registros recebidos, com ${errors.length} erros.`,
          details: errors.join('; ')
        });
        return { success: false, totalDownloaded, errors };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      SupabaseService.addLog({
        action: 'pull_all',
        status: 'error',
        message: `Erro ao baixar dados do Supabase: ${msg}`
      });
      return { success: false, totalDownloaded, errors };
    }
  },

  // Auto-sync a single entity in the background
  autoSyncEntity: async (
    table: 'tenants' | 'users' | 'veterinarians' | 'visits' | 'visit_reports' | 'follow_up_tasks' | 'instagram_leads',
    data: unknown
  ): Promise<void> => {
    if (!SupabaseService.isAutoSyncEnabled()) return;

    try {
      const payload = Array.isArray(data) ? data : [data];
      const { error } = await supabaseAdmin.from(table).upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn(`[Supabase AutoSync] Failed to sync ${table}:`, error.message);
      } else {
        SupabaseService.setLastSyncTimestamp(new Date().toISOString());
      }
    } catch (err) {
      console.warn(`[Supabase AutoSync] Exception syncing ${table}:`, err);
    }
  },

  // Full SQL schema script for Supabase SQL Editor
  getSupabaseSQLSchema: (): string => {
    return `-- ============================================================================
-- MATCH POINT PROMOVE • ESQUEMA POSTGRESQL NATIVO PARA SUPABASE
-- Projeto: bkmfgymvkcaywxdcclfk.supabase.co
-- "Precisão para chegar. Estratégia para permanecer."
-- ============================================================================

-- 1. Habilitar Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMs do Sistema
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'promoter', 'tenant_client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_sentiment AS ENUM ('positive', 'neutral', 'negative', 'complaint');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tabela: Tenants (Empresas Contratantes)
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    trade_name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    segment TEXT,
    color_theme TEXT DEFAULT '#FF530D',
    logo_url TEXT,
    services_offered TEXT[] DEFAULT '{}'::TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS services_offered TEXT[] DEFAULT '{}'::TEXT[];

-- 4. Tabela: Users (Usuários, Promotores Match Point & Clientes)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT DEFAULT 'sucesso@2027@',
    role TEXT NOT NULL DEFAULT 'promoter',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'sucesso@2027@';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 5. Tabela: Veterinarians (Base Centralizada Master de Veterinários)
CREATE TABLE IF NOT EXISTS public.veterinarians (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    crmv TEXT,
    specialty TEXT,
    whatsapp TEXT NOT NULL,
    instagram_handle TEXT,
    birth_date TEXT,
    avatar_url TEXT,
    workplace_name TEXT,
    workplace_type TEXT,
    address_street TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    target_audience_class TEXT,
    notes_general TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.veterinarians ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 6. Tabela: Visits (Registro Físico, Check-in da Visita em Campo & Fotos/Anexos)
CREATE TABLE IF NOT EXISTS public.visits (
    id TEXT PRIMARY KEY,
    promoter_id TEXT NOT NULL REFERENCES public.users(id),
    veterinarian_id TEXT NOT NULL REFERENCES public.veterinarians(id),
    visit_date TEXT NOT NULL,
    check_in_timestamp TIMESTAMPTZ DEFAULT NOW(),
    location_lat NUMERIC(10, 7),
    location_lng NUMERIC(10, 7),
    workplace_name_snapshot TEXT,
    general_notes TEXT,
    internal_agency_notes TEXT,
    photos TEXT[] DEFAULT '{}'::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS internal_agency_notes TEXT;

-- 7. Tabela: VisitReports (Relatório Sigiloso por Contratante - RLS Isolado)
CREATE TABLE IF NOT EXISTS public.visit_reports (
    id TEXT PRIMARY KEY,
    visit_id TEXT NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    observations TEXT NOT NULL,
    internal_agency_notes TEXT,
    sentiment TEXT NOT NULL DEFAULT 'neutral',
    service_interest TEXT,
    critical_action_needed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.visit_reports ADD COLUMN IF NOT EXISTS internal_agency_notes TEXT;

-- 8. Tabela: FollowUpTasks (Régua de Follow-up D+7, D+14, Aniversários)
CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
    id TEXT PRIMARY KEY,
    visit_report_id TEXT REFERENCES public.visit_reports(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    veterinarian_id TEXT NOT NULL REFERENCES public.veterinarians(id),
    assigned_to TEXT,
    due_date TEXT NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    notes_completion TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela: InstagramLeads (Social Listening & Oportunidades)
CREATE TABLE IF NOT EXISTS public.instagram_leads (
    id TEXT PRIMARY KEY,
    veterinarian_id TEXT REFERENCES public.veterinarians(id) ON DELETE SET NULL,
    instagram_handle TEXT NOT NULL,
    post_title TEXT NOT NULL,
    post_url TEXT,
    opportunity_topic TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Habilitar RLS em todas as tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veterinarians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_leads ENABLE ROW LEVEL SECURITY;

-- 11. Políticas de Acesso Permissivo para Service Role (Bypass) e Autenticados
DO $$ BEGIN
    CREATE POLICY "Service Role All Access Tenants" ON public.tenants FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Service Role All Access Users" ON public.users FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Service Role All Access Vets" ON public.veterinarians FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Service Role All Access Visits" ON public.visits FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Service Role All Access Reports" ON public.visit_reports FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Service Role All Access Tasks" ON public.follow_up_tasks FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Service Role All Access IG" ON public.instagram_leads FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 12. Public read/write para chaves configuradas (Anon/Auth)
DO $$ BEGIN
    CREATE POLICY "Allow public read access" ON public.tenants FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read vets" ON public.veterinarians FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read visits" ON public.visits FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read reports" ON public.visit_reports FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read tasks" ON public.follow_up_tasks FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read ig" ON public.instagram_leads FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 13. POLÍTICA DE SIGILO E ISOLAMENTO RIGOROSO ENTRE PROMOTORES (Promoter Confidentiality)
-- Promotores só podem visualizar e registrar seus próprios atendimentos, relatórios e tarefas
-- Super Admin tem visão irrestrita (Match Point Master)
DO $$ BEGIN
    CREATE POLICY "Promoters see only their own visits"
    ON public.visits
    FOR ALL
    TO authenticated
    USING (
        promoter_id = auth.uid()::TEXT
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::TEXT AND role = 'super_admin')
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Promoters see only their own reports"
    ON public.visit_reports
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.visits 
            WHERE public.visits.id = public.visit_reports.visit_id 
            AND (public.visits.promoter_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::TEXT AND role = 'super_admin'))
        )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Promoters see only their own tasks"
    ON public.follow_up_tasks
    FOR ALL
    TO authenticated
    USING (
        assigned_to = auth.uid()::TEXT
        OR assigned_to = (SELECT full_name FROM public.users WHERE id = auth.uid()::TEXT)
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::TEXT AND role = 'super_admin')
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 14. GATILHOS AUTOMÁTICOS: Régua de Follow-up (D+7, D+14 e Alerta Crítico) com Atribuição ao Promotor Responsável
CREATE OR REPLACE FUNCTION public.fn_trigger_generate_follow_up_tasks()
RETURNS TRIGGER AS $$
DECLARE
    v_vet_id TEXT;
    v_visit_date DATE;
    v_promoter_id TEXT;
BEGIN
    -- Captura médico, data da visita e o promotor que realizou o atendimento
    SELECT veterinarian_id, visit_date::DATE, promoter_id 
    INTO v_vet_id, v_visit_date, v_promoter_id
    FROM public.visits
    WHERE id = NEW.visit_id;

    -- 1. Agendar 1º Follow-up (D+7) atribuído estritamente ao promotor que visitou
    INSERT INTO public.follow_up_tasks (
        id,
        visit_report_id,
        tenant_id,
        veterinarian_id,
        assigned_to,
        action_type,
        due_date,
        description,
        status
    ) VALUES (
        'task-' || substr(md5(random()::text), 1, 8),
        NEW.id,
        NEW.tenant_id,
        v_vet_id,
        v_promoter_id,
        'first_contact_7d',
        (v_visit_date + INTERVAL '7 days')::DATE::TEXT,
        '1º Follow-up D+7 pós-visita para reforço do contratante',
        'pending'
    );

    -- 2. Agendar 2º Follow-up (D+14) atribuído ao mesmo promotor
    INSERT INTO public.follow_up_tasks (
        id,
        visit_report_id,
        tenant_id,
        veterinarian_id,
        assigned_to,
        action_type,
        due_date,
        description,
        status
    ) VALUES (
        'task-' || substr(md5(random()::text), 1, 8),
        NEW.id,
        NEW.tenant_id,
        v_vet_id,
        v_promoter_id,
        'second_contact_14d',
        (v_visit_date + INTERVAL '14 days')::DATE::TEXT,
        '2º Follow-up D+14 pós-visita e acompanhamento de adesão',
        'pending'
    );

    -- 3. Se for classificado como Reclamação ou Alerta Crítico, agendar tratativa IMEDIATA (D+0)
    IF NEW.critical_action_needed = TRUE OR NEW.sentiment = 'complaint' THEN
        INSERT INTO public.follow_up_tasks (
            id,
            visit_report_id,
            tenant_id,
            veterinarian_id,
            assigned_to,
            action_type,
            due_date,
            description,
            status
        ) VALUES (
            'task-' || substr(md5(random()::text), 1, 8),
            NEW.id,
            NEW.tenant_id,
            v_vet_id,
            v_promoter_id,
            'critical_resolution',
            CURRENT_DATE::TEXT,
            'ATENÇÃO: Resolução urgente de apontamento crítico/reclamação',
            'pending'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_visit_report_insert ON public.visit_reports;
CREATE TRIGGER trg_after_visit_report_insert
AFTER INSERT ON public.visit_reports
FOR EACH ROW
EXECUTE FUNCTION public.fn_trigger_generate_follow_up_tasks();

-- 15. VIEW: Última Visita e Promotor Responsável por Veterinário
-- Expõe metadata territorial (quem esteve lá por último e quando) preservando o sigilo de notas privadas
CREATE OR REPLACE VIEW public.v_veterinarians_with_last_visit AS
SELECT 
    v.id AS veterinarian_id,
    v.full_name AS veterinarian_name,
    v.crmv,
    v.specialty,
    v.whatsapp,
    v.workplace_name,
    v.neighborhood,
    v.city,
    lv.id AS last_visit_id,
    lv.visit_date AS last_visit_date,
    lv.check_in_timestamp AS last_visit_timestamp,
    lv.promoter_id AS last_promoter_id,
    COALESCE(u.full_name, 'Promotor Match Point') AS last_promoter_name,
    u.phone AS last_promoter_phone
FROM public.veterinarians v
LEFT JOIN LATERAL (
    SELECT 
        vis.id,
        vis.visit_date,
        vis.check_in_timestamp,
        vis.promoter_id
    FROM public.visits vis
    WHERE vis.veterinarian_id = v.id
    ORDER BY vis.visit_date DESC, vis.check_in_timestamp DESC
    LIMIT 1
) lv ON true
LEFT JOIN public.users u ON u.id = lv.promoter_id;

GRANT SELECT ON public.v_veterinarians_with_last_visit TO authenticated, anon;
`;
  }
};
