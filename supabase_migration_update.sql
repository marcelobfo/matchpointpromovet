-- ============================================================================
-- SCRIPT DE ATUALIZAÇÃO SQL (MIGRAÇÃO) - MATCH POINT PROMOVE
-- Atualizações:
-- 1. Isolamento Rigoroso de Sessão e Sigilo Comercial entre Promotores (RLS)
-- 2. Trigger de Follow-up com Atribuição Automática ao Promotor Responsável
-- 3. View Otimizada: Última Visita e Promotor Responsável por Veterinário
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VIEW: Última Visita e Promotor Responsável por Médico-Veterinário
-- ----------------------------------------------------------------------------
-- Esta View permite que qualquer promotor consulte em campo quem visitou cada
-- médico por último e em qual data, SEM expor os relatórios, notas de agência
-- confidenciais ou feedbacks comerciais de outros promotores ou marcas.

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

-- Conceder permissão de leitura
GRANT SELECT ON public.v_veterinarians_with_last_visit TO authenticated, anon;


-- ----------------------------------------------------------------------------
-- 2. GATILHO (TRIGGER): Geração da Régua com Atribuição ao Promotor da Visita
-- ----------------------------------------------------------------------------
-- Quando um relatório de visita é inserido, o trigger busca quem fez a visita
-- (promoter_id) e grava 'assigned_to = promoter_id'. Assim, as tarefas de
-- D+7 e D+14 pertencem exclusivamente ao promotor da visita (ex: Fernanda Diniz
-- não recebe tarefas de Lucas ou Juliana).

CREATE OR REPLACE FUNCTION public.fn_trigger_generate_follow_up_tasks()
RETURNS TRIGGER AS $$
DECLARE
    v_vet_id TEXT;
    v_visit_date DATE;
    v_promoter_id TEXT;
BEGIN
    -- Captura dados da visita física realizada
    SELECT veterinarian_id, visit_date::DATE, promoter_id 
    INTO v_vet_id, v_visit_date, v_promoter_id
    FROM public.visits
    WHERE id = NEW.visit_id;

    -- 1. Agendar 1º Follow-up (D+7) para o promotor responsável
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

    -- 2. Agendar 2º Follow-up (D+14) para o mesmo promotor
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

    -- 3. Tratativa Imediata (D+0) para Reclamações ou Alertas Críticos
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

-- Recriar trigger
DROP TRIGGER IF EXISTS trg_after_visit_report_insert ON public.visit_reports;
CREATE TRIGGER trg_after_visit_report_insert
AFTER INSERT ON public.visit_reports
FOR EACH ROW
EXECUTE FUNCTION public.fn_trigger_generate_follow_up_tasks();


-- ----------------------------------------------------------------------------
-- 3. POLÍTICAS DE ROW-LEVEL SECURITY (RLS) - ISOLAMENTO ENTRE PROMOTORES
-- ----------------------------------------------------------------------------

-- Habilitar RLS nas tabelas operacionais
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;

-- 3.1 Política para Visits:
-- Promotor só pode ler e registrar suas próprias visitas.
-- Super Admin tem acesso global irrestrito.
DROP POLICY IF EXISTS "Promoters see only their own visits" ON public.visits;
CREATE POLICY "Promoters see only their own visits"
ON public.visits
FOR ALL
TO authenticated
USING (
    promoter_id = auth.uid()::TEXT
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::TEXT AND role = 'super_admin')
);

-- 3.2 Política para VisitReports:
-- Promotores veem apenas os relatórios gerados por suas próprias visitas.
-- Contratantes (Tenants) veem apenas relatórios da sua marca (tenant_id).
-- Super Admin vê tudo.
DROP POLICY IF EXISTS "Promoters see only their own reports" ON public.visit_reports;
CREATE POLICY "Promoters see only their own reports"
ON public.visit_reports
FOR ALL
TO authenticated
USING (
    -- Super Admin Match Point
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::TEXT AND role = 'super_admin')
    -- Promotor que realizou a visita
    OR EXISTS (
        SELECT 1 FROM public.visits 
        WHERE public.visits.id = public.visit_reports.visit_id 
        AND public.visits.promoter_id = auth.uid()::TEXT
    )
    -- Cliente Contratante (Tenant)
    OR tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()::TEXT)
);

-- 3.3 Política para FollowUpTasks:
-- Promotores veem apenas as tarefas atribuídas a eles.
-- Contratantes (Tenants) veem tarefas da sua marca.
-- Super Admin vê tudo.
DROP POLICY IF EXISTS "Promoters see only their own tasks" ON public.follow_up_tasks;
CREATE POLICY "Promoters see only their own tasks"
ON public.follow_up_tasks
FOR ALL
TO authenticated
USING (
    -- Super Admin
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::TEXT AND role = 'super_admin')
    -- Promotor atribuído
    OR assigned_to = auth.uid()::TEXT
    OR assigned_to = (SELECT full_name FROM public.users WHERE id = auth.uid()::TEXT)
    -- Contratante
    OR tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()::TEXT)
);
