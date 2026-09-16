import React, { useState } from 'react';
import {
  Code2,
  Database,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Layers,
  ArrowRight,
  GitBranch,
  Key,
  Server,
  FileCode,
  Sparkles,
  Target
} from 'lucide-react';

export const ArchitectureModule: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'er' | 'ddl' | 'rls' | 'triggers' | 'adr'>('er');

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const SQL_DDL_FULL = `-- ============================================================================
-- Match Point Promove - Arquitetura de Banco de Dados PostgreSQL & Multi-Tenant
-- Módulo: Representação Comercial Externa & Inteligência de Campo Veterinária
-- "Precisão para chegar. Estratégia para permanecer."
-- ============================================================================

-- 1. Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMs do Sistema
CREATE TYPE user_role AS ENUM ('super_admin', 'promoter', 'tenant_client');
CREATE TYPE feedback_sentiment AS ENUM ('positive', 'neutral', 'negative', 'complaint');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'canceled');

-- 3. Empresas Contratantes (Tenants - Ex: Instituto Mova, VetLab 24h, FarmaVet)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(150) NOT NULL,
    trade_name VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    segment VARCHAR(100),
    color_theme VARCHAR(20) DEFAULT '#FF530D',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Usuários do Sistema (Promotores Match Point, Admins e Clientes Contratantes)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL para promotores centrais Match Point
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'promoter',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Base Centralizada Master de Profissionais Visitados (Veterinários)
-- Prevenção de retrabalho: cadastro compartilhado com CRMV único e dados de contato
CREATE TABLE veterinarians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(150) NOT NULL,
    crmv VARCHAR(30) UNIQUE,
    specialty VARCHAR(100),
    whatsapp VARCHAR(20) NOT NULL,
    instagram_handle VARCHAR(80),
    birth_date DATE,
    avatar_url TEXT,
    workplace_name VARCHAR(150),
    workplace_type VARCHAR(50), -- Clínica própria, hospital, volante, etc.
    address_street VARCHAR(255),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    target_audience_class VARCHAR(10), -- Classe A, B, C, Misto
    notes_general TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Registro da Visita Física em Campo (Logística & Georreferenciamento Match Point)
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promoter_id UUID NOT NULL REFERENCES users(id),
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id),
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location_lat NUMERIC(10, 7),
    location_lng NUMERIC(10, 7),
    workplace_name_snapshot VARCHAR(150),
    general_promoter_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Relatório Sigiloso por Contratante (FEEDBACK ESPECÍFICO & RLS)
-- Cardinalidade: 1 Visita gera até 3 VisitReports (1 para cada contratante representado)
CREATE TABLE visit_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    observations TEXT NOT NULL,
    sentiment feedback_sentiment NOT NULL DEFAULT 'neutral',
    service_interest VARCHAR(150),
    critical_action_needed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_visit_tenant UNIQUE (visit_id, tenant_id)
);

-- 8. Régua de Automação & Follow-up (CRM D+7, D+14, Aniversários e Reclamações)
CREATE TABLE follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_report_id UUID REFERENCES visit_reports(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    veterinarian_id UUID NOT NULL REFERENCES veterinarians(id),
    action_type VARCHAR(50) NOT NULL, -- 'first_contact_7d', 'second_contact_14d', 'critical_resolution', 'birthday'
    due_date DATE NOT NULL,
    status task_status DEFAULT 'pending',
    notes_completion TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Monitoramento de Redes Sociais e Marcações (Instagram Social Leads)
CREATE TABLE instagram_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    veterinarian_id UUID REFERENCES veterinarians(id) ON DELETE SET NULL,
    instagram_handle VARCHAR(80) NOT NULL,
    post_title VARCHAR(200) NOT NULL,
    opportunity_topic TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'interacted', 'converted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

  const SQL_RLS_POLICIES = `-- ============================================================================
-- Políticas de Segurança em Nível de Linha (PostgreSQL Row-Level Security - RLS)
-- Garante matematicamente que o Tenant 'A' NUNCA acesse feedbacks do Tenant 'B'
-- ============================================================================

-- 1. Habilitar RLS nas tabelas proprietárias
ALTER TABLE visit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_tasks ENABLE ROW LEVEL SECURITY;

-- 2. Política de Leitura para VisitReports
CREATE POLICY tenant_isolation_visit_reports ON visit_reports
    FOR ALL
    TO authenticated
    USING (
        -- Super Admin Match Point acessa tudo
        current_setting('app.current_user_role', true) = 'super_admin'
        -- Promotor de campo Match Point registra e lê suas visitas
        OR current_setting('app.current_user_role', true) = 'promoter'
        -- Contratante acessa ESTRITAMENTE seus próprios feedbacks
        OR tenant_id = current_setting('app.current_tenant_id', true)::UUID
    );

-- 3. Política de Leitura para FollowUpTasks
CREATE POLICY tenant_isolation_follow_up_tasks ON follow_up_tasks
    FOR ALL
    TO authenticated
    USING (
        current_setting('app.current_user_role', true) IN ('super_admin', 'promoter')
        OR tenant_id = current_setting('app.current_tenant_id', true)::UUID
    );`;

  const SQL_TRIGGER_AUTOMATION = `-- ============================================================================
-- Gatilhos Automáticos: Disparo de Régua de Relacionamento (D+7, D+14 e Crítico)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_trigger_generate_follow_up_tasks()
RETURNS TRIGGER AS $$
DECLARE
    v_vet_id UUID;
    v_visit_date DATE;
BEGIN
    -- Obter o ID do veterinário e a data da visita
    SELECT veterinarian_id, visit_date INTO v_vet_id, v_visit_date
    FROM visits
    WHERE id = NEW.visit_id;

    -- 1. Agendar 1º Follow-up (D+7)
    INSERT INTO follow_up_tasks (
        visit_report_id,
        tenant_id,
        veterinarian_id,
        action_type,
        due_date,
        status
    ) VALUES (
        NEW.id,
        NEW.tenant_id,
        v_vet_id,
        'first_contact_7d',
        v_visit_date + INTERVAL '7 days',
        'pending'
    );

    -- 2. Agendar 2º Follow-up (D+14)
    INSERT INTO follow_up_tasks (
        visit_report_id,
        tenant_id,
        veterinarian_id,
        action_type,
        due_date,
        status
    ) VALUES (
        NEW.id,
        NEW.tenant_id,
        v_vet_id,
        'second_contact_14d',
        v_visit_date + INTERVAL '14 days',
        'pending'
    );

    -- 3. Se for classificado como Reclamação ou Alerta Crítico, agendar tratativa IMEDIATA (D+0)
    IF NEW.critical_action_needed = TRUE OR NEW.sentiment = 'complaint' THEN
        INSERT INTO follow_up_tasks (
            visit_report_id,
            tenant_id,
            veterinarian_id,
            action_type,
            due_date,
            status
        ) VALUES (
            NEW.id,
            NEW.tenant_id,
            v_vet_id,
            'critical_resolution',
            CURRENT_DATE,
            'pending'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_visit_report_insert
AFTER INSERT ON visit_reports
FOR EACH ROW
EXECUTE FUNCTION fn_trigger_generate_follow_up_tasks();`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner - Match Point Promove Theme */}
      <div className="bg-[#111111] rounded-2xl p-5 text-[#FDF2E7] border border-[#2a2a2a] shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF530D] via-[#FBBF3D] to-[#D90000]" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF530D]/20 border border-[#FF530D]/40 text-[#FF530D]">
                Especificação Técnica & Arquitetura
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-[#FF530D]" />
                Arquitetura B2B Multi-Tenant & Engenharia de Dados Match Point
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Modelagem relacional PostgreSQL, isolamento estrito via <strong>Row-Level Security (RLS)</strong>, automações por Triggers em banco e documentação técnica.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-[#1c1c1c] text-[#FBBF3D] px-3 py-1.5 rounded-xl border border-[#3e3e3e]">
              PostgreSQL 16 • RLS Enabled
            </span>
          </div>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-[#E8D9C8] pb-2 scrollbar-none">
        <button
          id="subtab-er"
          onClick={() => setActiveSubTab('er')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'er'
              ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
              : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
          }`}
        >
          <Layers className="h-4 w-4" />
          Modelo ERD
        </button>

        <button
          id="subtab-ddl"
          onClick={() => setActiveSubTab('ddl')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'ddl'
              ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
              : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
          }`}
        >
          <Database className="h-4 w-4" />
          Script DDL SQL
        </button>

        <button
          id="subtab-rls"
          onClick={() => setActiveSubTab('rls')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'rls'
              ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
              : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Políticas RLS
        </button>

        <button
          id="subtab-triggers"
          onClick={() => setActiveSubTab('triggers')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'triggers'
              ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
              : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
          }`}
        >
          <Zap className="h-4 w-4" />
          Triggers D+7/D+14
        </button>

        <button
          id="subtab-adr"
          onClick={() => setActiveSubTab('adr')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === 'adr'
              ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
              : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          Decisões ADRs
        </button>
      </div>

      {/* VIEW 1: INTERACTIVE ER DIAGRAM */}
      {activeSubTab === 'er' && (
        <div className="bg-white rounded-2xl p-6 border border-[#E8D9C8] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#111111]">
                Diagrama de Entidades & Desacoplamento de Visitas
              </h3>
              <p className="text-xs text-slate-500">
                A visita física em campo (<code className="text-[#FF530D] font-bold">visits</code>) é desacoplada dos relatórios proprietários (<code className="text-[#FF530D] font-bold">visit_reports</code>) para permitir até 3 marcas sem conflito de concorrência.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Top Row: Master Entities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#111111] text-[#FDF2E7] p-4 rounded-xl border border-[#2a2a2a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#FF530D] uppercase tracking-wider">🏢 Tenants (Contratantes)</span>
                  <span className="text-[10px] bg-[#222222] px-2 py-0.5 rounded text-slate-300">1</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
                  <div>• id: UUID (PK)</div>
                  <div>• company_name: VARCHAR</div>
                  <div>• trade_name: VARCHAR</div>
                  <div>• cnpj: VARCHAR (UNIQUE)</div>
                  <div>• segment: VARCHAR</div>
                </div>
              </div>

              <div className="bg-[#111111] text-[#FDF2E7] p-4 rounded-xl border border-[#2a2a2a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#FBBF3D] uppercase tracking-wider">👤 Users (Promotores/Admins)</span>
                  <span className="text-[10px] bg-[#222222] px-2 py-0.5 rounded text-slate-300">1</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
                  <div>• id: UUID (PK)</div>
                  <div>• tenant_id: UUID (FK null para Match Point)</div>
                  <div>• full_name: VARCHAR</div>
                  <div>• role: ENUM (super_admin, promoter, tenant_client)</div>
                </div>
              </div>

              <div className="bg-[#111111] text-[#FDF2E7] p-4 rounded-xl border border-[#2a2a2a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-sky-400 uppercase tracking-wider">🩺 Veterinarians (Profissionais)</span>
                  <span className="text-[10px] bg-[#222222] px-2 py-0.5 rounded text-slate-300">Master</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
                  <div>• id: UUID (PK)</div>
                  <div>• crmv: VARCHAR (UNIQUE)</div>
                  <div>• full_name: VARCHAR</div>
                  <div>• whatsapp: VARCHAR</div>
                  <div>• target_audience_class: VARCHAR</div>
                </div>
              </div>
            </div>

            {/* Middle Row: The Core Bridge Entity */}
            <div className="flex justify-center py-2">
              <div className="w-full max-w-xl bg-[#111111] text-[#FDF2E7] p-5 rounded-2xl border-2 border-[#FF530D] shadow-md space-y-2 text-center">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#FF530D] uppercase tracking-wider">
                    📍 Visits (Registro Físico da Abordagem em Campo Match Point)
                  </span>
                  <span className="text-[10px] bg-[#222222] px-2 py-0.5 rounded text-[#FBBF3D]">1</span>
                </div>
                <div className="text-xs text-slate-300 font-mono grid grid-cols-2 text-left gap-1 pt-1">
                  <div>• id: UUID (PK)</div>
                  <div>• promoter_id: UUID (FK Users)</div>
                  <div>• veterinarian_id: UUID (FK Vets)</div>
                  <div>• visit_date & check_in_timestamp</div>
                  <div>• location_lat / location_lng (GPS)</div>
                  <div>• general_promoter_notes: TEXT</div>
                </div>
                <p className="text-[11px] text-[#FDF2E7] pt-2 border-t border-[#333333] text-left">
                  ⚡ <strong>Ponto de Desacoplamento Match Point:</strong> O promotor faz 1 check-in na clínica, mas gera até 3 relatórios isolados.
                </p>
              </div>
            </div>

            {/* Bottom Row: Isolated Reports & Follow-up Tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#111111] text-[#FDF2E7] p-4 rounded-xl border-2 border-emerald-500/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    🔒 VisitReports (Feedback Isolado por Contratante)
                  </span>
                  <span className="text-[10px] bg-[#222222] px-2 py-0.5 rounded text-emerald-300">N (RLS)</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
                  <div>• id: UUID (PK)</div>
                  <div>• visit_id: UUID (FK Visits)</div>
                  <div>• tenant_id: UUID (FK Tenants) - <strong>SEGREGADO</strong></div>
                  <div>• observations: TEXT (Sigiloso)</div>
                  <div>• sentiment: ENUM (positive, neutral, negative, complaint)</div>
                  <div>• critical_action_needed: BOOLEAN</div>
                  <div>• <em>CONSTRAINT: UNIQUE(visit_id, tenant_id)</em></div>
                </div>
              </div>

              <div className="bg-[#111111] text-[#FDF2E7] p-4 rounded-xl border-2 border-[#FF530D]/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#FF530D] uppercase tracking-wider">
                    ⏱️ FollowUpTasks (Régua 7d / 14d Automatizada)
                  </span>
                  <span className="text-[10px] bg-[#222222] px-2 py-0.5 rounded text-[#FBBF3D]">N</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
                  <div>• id: UUID (PK)</div>
                  <div>• visit_report_id: UUID (FK VisitReports)</div>
                  <div>• tenant_id: UUID (FK Tenants)</div>
                  <div>• veterinarian_id: UUID (FK Vets)</div>
                  <div>• due_date: DATE (D+7 / D+14 calculado)</div>
                  <div>• action_type: VARCHAR (first_contact_7d, second_contact_14d, critical)</div>
                  <div>• status: ENUM (pending, in_progress, completed, canceled)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DDL SQL PLAYGROUND */}
      {activeSubTab === 'ddl' && (
        <div className="bg-[#111111] rounded-2xl p-5 border border-[#2a2a2a] text-slate-100 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#FF530D]" />
              <span className="text-sm font-bold text-white">Script DDL PostgreSQL (schema.sql)</span>
            </div>

            <button
              id="btn-copy-ddl"
              onClick={() => copyToClipboard(SQL_DDL_FULL, 'ddl')}
              className="text-xs font-bold text-[#FF530D] hover:text-[#ff6b2e] bg-[#1c1c1c] hover:bg-[#2c2c2c] px-3 py-1.5 rounded-lg border border-[#3e3e3e] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSection === 'ddl' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedSection === 'ddl' ? 'Copiado!' : 'Copiar DDL'}
            </button>
          </div>

          <pre className="text-xs font-mono text-[#FDF2E7]/90 overflow-x-auto p-4 bg-[#0a0a0a] rounded-xl border border-[#222222] leading-relaxed max-h-[500px]">
            {SQL_DDL_FULL}
          </pre>
        </div>
      )}

      {/* VIEW 3: RLS POLICIES */}
      {activeSubTab === 'rls' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Garantia de Sigilo Comercial via Row-Level Security (RLS)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              O PostgreSQL executa a validação em nível de kernel do banco. Mesmo que um usuário cliente tente consultar diretamente a tabela <code className="text-[#FF530D] font-bold">visit_reports</code>, o banco intercepta a query e injeta a cláusula de filtro <code className="text-[#FF530D] font-bold">tenant_id = current_tenant_id</code>, tornando matematicamente impossível o vazamento de notas concorrentes.
            </p>

            <div className="bg-[#111111] rounded-xl p-4 border border-[#2a2a2a] text-slate-100 space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FF530D]">Políticas RLS em PostgreSQL</span>
                <button
                  id="btn-copy-rls"
                  onClick={() => copyToClipboard(SQL_RLS_POLICIES, 'rls')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === 'rls' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  Copiar
                </button>
              </div>
              <pre className="text-xs font-mono text-emerald-300 overflow-x-auto p-3 bg-[#0a0a0a] rounded-lg border border-[#222222]">
                {SQL_RLS_POLICIES}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: TRIGGERS & AUTOMATION */}
      {activeSubTab === 'triggers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#FBBF3D]" />
              Gatilhos em Banco de Dados (Database Triggers & Event-Driven Pipeline)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Ao registrar uma observação em <code className="font-bold text-[#FF530D]">visit_reports</code>, a procedure <code className="font-bold text-[#FF530D]">fn_trigger_generate_follow_up_tasks()</code> agenda automaticamente as ações na tabela <code className="font-bold text-[#FF530D]">follow_up_tasks</code>:
              <br />
              • <strong>D+7:</strong> 1º Contato WhatsApp contextualizado com o interesse coletado.
              <br />
              • <strong>D+14:</strong> 2º Contato de manutenção e reforço de parceria.
              <br />
              • <strong>Crítico:</strong> Alerta imediato no mesmo dia se houver reclamação ou insatisfação.
            </p>

            <div className="bg-[#111111] rounded-xl p-4 border border-[#2a2a2a] text-slate-100 space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FBBF3D]">Function & Trigger PL/pgSQL</span>
                <button
                  id="btn-copy-trigger"
                  onClick={() => copyToClipboard(SQL_TRIGGER_AUTOMATION, 'trigger')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === 'trigger' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  Copiar
                </button>
              </div>
              <pre className="text-xs font-mono text-[#FBBF3D] overflow-x-auto p-3 bg-[#0a0a0a] rounded-lg border border-[#222222]">
                {SQL_TRIGGER_AUTOMATION}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: ADRs (Architectural Decision Records) */}
      {activeSubTab === 'adr' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-2">
            <span className="text-[10px] font-black uppercase text-[#FF530D] bg-[#FF530D]/10 px-2 py-0.5 rounded">
              ADR-001
            </span>
            <h4 className="text-sm font-bold text-[#111111]">Desacoplamento Visita vs Relatório</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Decisão:</strong> A entidade <code className="font-bold text-[#FF530D]">Visits</code> representa o fato físico (geolocalização e data na rua), enquanto <code className="font-bold text-[#FF530D]">VisitReports</code> guarda o feedback sigiloso por contratante com cardinalidade 1:N (até 3).
              <br />
              <strong>Benefício:</strong> O promotor Match Point não perde tempo fazendo múltiplos check-ins na mesma clínica.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-2">
            <span className="text-[10px] font-black uppercase text-[#111111] bg-[#FDF2E7] border border-[#E8D9C8] px-2 py-0.5 rounded">
              ADR-002
            </span>
            <h4 className="text-sm font-bold text-[#111111]">Segregação por Row-Level Security</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Decisão:</strong> Utilizar RLS nativo do PostgreSQL em vez de Database-per-tenant.
              <br />
              <strong>Benefício:</strong> Manutenção simplificada de schema único, relatórios agregados para o Super Admin Match Point e garantia inviolável de sigilo para cada cliente contratante.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-2">
            <span className="text-[10px] font-black uppercase text-[#D90000] bg-rose-50 px-2 py-0.5 rounded">
              ADR-003
            </span>
            <h4 className="text-sm font-bold text-[#111111]">Base Centralizada Master com CRMV</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Decisão:</strong> Tabela <code className="font-bold text-[#FF530D]">veterinarians</code> centralizada compartilhada entre promotores com busca inteligente unificada por CRMV.
              <br />
              <strong>Benefício:</strong> Elimina retrabalho de digitação em campo e padroniza o histórico de relacionamento e aniversários.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
