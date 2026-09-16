export type UserRole = 'super_admin' | 'promoter' | 'tenant_client';

export type FeedbackSentiment = 'positive' | 'neutral' | 'negative' | 'complaint';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'canceled';

export interface Tenant {
  id: string;
  company_name: string;
  trade_name: string;
  cnpj?: string;
  segment: string;
  color_theme: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  whatsapp_emergencies?: string;
  address_street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  technical_responsible?: string;
  technical_crmv?: string;
  description?: string;
  differential?: string;
  services_offered?: string[];
  operating_hours?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string | null; // null for MedPoint staff/promoter
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Veterinarian {
  id: string;
  full_name: string;
  crmv: string; // e.g., CRMV-SP 45.192
  specialty: string;
  whatsapp: string;
  instagram_handle?: string;
  birth_date?: string; // YYYY-MM-DD
  avatar_url?: string;
  workplace_name: string;
  workplace_type: 'Clínica Própria' | 'Hospital 24h' | 'Centro Diagnóstico' | 'Volante / Autônomo' | 'Consultório';
  address_street?: string;
  neighborhood: string;
  city: string;
  state: string;
  target_audience_class: 'Classe A' | 'Classe B' | 'Classe C' | 'Misto';
  notes_general?: string;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  promoter_id: string;
  veterinarian_id: string;
  visit_date: string; // YYYY-MM-DD
  check_in_timestamp: string;
  location_lat?: number;
  location_lng?: number;
  workplace_name_snapshot?: string;
  general_notes?: string;
  internal_agency_notes?: string; // SENSITIVE: Confidencial Match Point & Promotor (NUNCA visível aos Contratantes / RLS)
  photos?: string[]; // Attached images (facade, clinic, materials delivered, prescription, etc.)
  created_at: string;
}

export interface VisitReport {
  id: string;
  visit_id: string;
  tenant_id: string;
  observations: string; // Relatório compartilhado com o Contratante no Portal RLS
  internal_agency_notes?: string; // Notas confidenciais exclusivas da Match Point e Promotor
  sentiment: FeedbackSentiment;
  service_interest?: string;
  critical_action_needed: boolean;
  created_at: string;
}

export interface FollowUpTask {
  id: string;
  visit_report_id: string;
  tenant_id: string;
  veterinarian_id: string;
  assigned_to?: string;
  due_date: string; // YYYY-MM-DD
  action_type: 'first_contact_7d' | 'second_contact_14d' | 'birthday_gift' | 'critical_resolution' | 'instagram_interaction';
  description: string;
  status: TaskStatus;
  completed_at?: string;
  notes_completion?: string;
  created_at: string;
}

export interface InstagramPostLead {
  id: string;
  veterinarian_id: string;
  instagram_handle: string;
  post_title: string;
  post_url?: string;
  opportunity_topic: string;
  status: 'pending' | 'interacted' | 'converted';
  created_at: string;
}

export type SupabaseSyncAction = 'push_all' | 'pull_all' | 'sync_table' | 'auto_sync' | 'test_connection' | 'seed_schema';

export interface SupabaseSyncLog {
  id: string;
  timestamp: string;
  action: SupabaseSyncAction;
  status: 'success' | 'warning' | 'error' | 'in_progress';
  table?: string;
  recordsCount?: number;
  message: string;
  details?: string;
}

export interface TableSyncStatus {
  tableName: string;
  displayName: string;
  localCount: number;
  remoteCount: number | null;
  status: 'synced' | 'pending_push' | 'pending_pull' | 'error' | 'not_checked' | 'table_missing';
  lastSyncedAt?: string;
  error?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface SupabaseDiagnosticsResult {
  ping: {
    status: 'success' | 'error' | 'warning';
    latencyMs: number;
    message: string;
  };
  auth: {
    status: 'success' | 'error' | 'warning';
    message: string;
  };
  schema: {
    status: 'success' | 'error' | 'warning';
    tablesFound: number;
    totalTables: number;
    missingTables: string[];
    message: string;
  };
  overallStatus: 'connected' | 'needs_sql_setup' | 'invalid_credentials' | 'project_paused' | 'network_error';
  summary: string;
}

// Evolution API (WhatsApp Messaging & Instance Control) Types
export interface EvolutionApiConfig {
  serverUrl: string;
  apiKey: string;
  instanceName: string;
  rejectCall: boolean;
  msgCall: string;
  groupsIgnore: boolean;
  alwaysOnline: boolean;
  readMessages: boolean;
  readStatus: boolean;
  syncFullHistory: boolean;
  webhookUrl?: string;
  webhookEnabled?: boolean;
}

export interface EvolutionInstanceInfo {
  instanceName: string;
  instanceId?: string;
  status: 'open' | 'close' | 'connecting' | 'created' | 'offline' | 'not_found';
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string | null;
  profileStatus?: string;
  qrcode?: string | null;
  pairingCode?: string | null;
  serverUrl?: string;
}

export type EvolutionMessageType =
  | 'text'
  | 'media'
  | 'audio'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'reaction'
  | 'poll'
  | 'buttons'
  | 'list';

export interface EvolutionMessageRecord {
  id: string;
  timestamp: string;
  type: EvolutionMessageType;
  recipientNumber: string;
  recipientName?: string;
  contentSummary: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'ERROR';
  rawResponse?: unknown;
  errorMessage?: string;
}

export interface EvolutionMessageTemplate {
  id: string;
  title: string;
  category: 'follow_up_7d' | 'follow_up_14d' | 'birthday' | 'critical' | 'catalog' | 'custom';
  type: EvolutionMessageType;
  textTemplate: string;
  defaultMediaUrl?: string;
  caption?: string;
}
