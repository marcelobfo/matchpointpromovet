import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  Cake,
  Instagram,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Filter,
  Plus,
  ArrowRight,
  ShieldAlert,
  Calendar,
  User,
  Building2,
  Target
} from 'lucide-react';
import {
  FollowUpTask,
  Veterinarian,
  Tenant,
  InstagramPostLead,
  TaskStatus,
  VisitReport,
  UserRole
} from '../types';
import { EvolutionApiService } from '../services/evolutionApi';

interface FollowUpModuleProps {
  tasks: FollowUpTask[];
  vets: Veterinarian[];
  tenants: Tenant[];
  reports: VisitReport[];
  instagramLeads: InstagramPostLead[];
  currentUserRole?: UserRole;
  currentUserId?: string;
  currentUserName?: string;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus, notes?: string) => void;
  onAddInstagramLead: (lead: Omit<InstagramPostLead, 'id' | 'created_at'>) => void;
  onUpdateInstagramLeadStatus: (id: string, status: 'pending' | 'interacted' | 'converted') => void;
}

export const FollowUpModule: React.FC<FollowUpModuleProps> = ({
  tasks,
  vets,
  tenants,
  reports,
  instagramLeads,
  currentUserRole = 'super_admin',
  currentUserId,
  currentUserName,
  onUpdateTaskStatus,
  onAddInstagramLead,
  onUpdateInstagramLeadStatus
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'birthdays' | 'instagram' | 'critical'>('pipeline');
  const [tenantFilter, setTenantFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Strict promoter isolation: A promoter ONLY sees tasks assigned to themselves
  const isPromoterRole = currentUserRole === 'promoter';
  const userAllowedTasks = isPromoterRole
    ? tasks.filter((t) => {
        if (!t.assigned_to) return false;
        const assigned = t.assigned_to.toLowerCase();
        const userName = (currentUserName || '').toLowerCase();
        const userId = (currentUserId || '').toLowerCase();
        return (
          (userName && (assigned.includes(userName) || userName.includes(assigned))) ||
          (userId && assigned.includes(userId)) ||
          (userId === 'user-promoter' && assigned.includes('lucas'))
        );
      })
    : tasks;

  // Instagram lead modal
  const [isIgModalOpen, setIsIgModalOpen] = useState(false);
  const [igVetId, setIgVetId] = useState(vets[0]?.id || '');
  const [igPostTitle, setIgPostTitle] = useState('');
  const [igTopic, setIgTopic] = useState('');

  // Resolution modal for critical tasks
  const [resolvingTaskId, setResolvingTaskId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [dispatchingTaskId, setDispatchingTaskId] = useState<string | null>(null);
  const [evoFeedback, setEvoFeedback] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  const vetMap = new Map<string, Veterinarian>(vets.map((v) => [v.id, v]));
  const tenantMap = new Map<string, Tenant>(tenants.map((t) => [t.id, t]));
  const reportMap = new Map<string, VisitReport>(reports.map((r) => [r.id, r]));

  const handleSendEvolutionDirect = async (
    task: FollowUpTask,
    vet: Veterinarian,
    tenant: Tenant,
    text: string
  ) => {
    if (!vet?.whatsapp) return;
    setDispatchingTaskId(task.id);
    const result = await EvolutionApiService.sendTextMessage({
      number: vet.whatsapp,
      text,
      recipientName: vet.full_name
    });
    setDispatchingTaskId(null);

    if (result.success) {
      setEvoFeedback({
        id: task.id,
        success: true,
        msg: 'Mensagem enviada com sucesso via Evolution API!'
      });
      onUpdateTaskStatus(task.id, 'completed', 'Disparo automático via Evolution API WhatsApp.');
    } else {
      setEvoFeedback({
        id: task.id,
        success: false,
        msg: result.error || 'Falha ao transmitir via Evolution API. Verifique a instância no Super Admin.'
      });
    }

    setTimeout(() => setEvoFeedback(null), 5000);
  };

  // Tasks Filtered based on user permission / promoter isolation
  const filteredTasks = userAllowedTasks.filter((t) => {
    if (tenantFilter !== 'ALL' && t.tenant_id !== tenantFilter) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    return true;
  });

  // Critical Tasks
  const criticalTasks = userAllowedTasks.filter((t) => t.action_type === 'critical_resolution');
  const pendingCriticalCount = criticalTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;

  // Birthdays calculation (current month and next month)
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const birthdayVets = vets.filter((v) => {
    if (!v.birth_date) return false;
    const [, month] = v.birth_date.split('-');
    return parseInt(month, 10) === currentMonth || parseInt(month, 10) === (currentMonth % 12) + 1;
  });

  const handleSaveIgLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!igVetId || !igPostTitle) return;

    const vet = vetMap.get(igVetId);
    onAddInstagramLead({
      veterinarian_id: igVetId,
      instagram_handle: vet?.instagram_handle || '@vet.perfil',
      post_title: igPostTitle,
      opportunity_topic: igTopic || 'Engajamento institucional',
      status: 'pending'
    });

    setIsIgModalOpen(false);
    setIgPostTitle('');
    setIgTopic('');
  };

  const handleCompleteTask = (task: FollowUpTask) => {
    if (task.action_type === 'critical_resolution') {
      setResolvingTaskId(task.id);
      setResolutionNotes('');
    } else {
      onUpdateTaskStatus(task.id, 'completed', 'Contato realizado via WhatsApp.');
    }
  };

  const submitResolution = () => {
    if (!resolvingTaskId) return;
    onUpdateTaskStatus(resolvingTaskId, 'completed', resolutionNotes || 'Tratativa finalizada e alinhada com o cliente.');
    setResolvingTaskId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner - Match Point Promove Theme */}
      <div className="bg-[#111111] rounded-2xl p-5 sm:p-6 text-[#FDF2E7] border border-[#2a2a2a] shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF530D] via-[#FBBF3D] to-[#D90000]" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-[#FF530D]/20 border border-[#FF530D]/40 text-[#FF530D]">
                Automação Comercial • Match Point
              </span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2 leading-tight">
              <Target className="h-5 w-5 text-[#FF530D] shrink-0" />
              <span>Régua de Follow-up &amp; Inteligência de Relacionamento</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Automações disparadas a partir das visitas: <strong>1ª Mensagem (+7d)</strong>, <strong>2ª Abordagem (+14d)</strong>, radar de aniversários e tratativas críticas imediatas.
            </p>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2 shrink-0">
            {pendingCriticalCount > 0 && (
              <button
                onClick={() => setActiveSubTab('critical')}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#D90000] text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{pendingCriticalCount} Reclamação(ões) Pendente(s)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8D9C8] pb-2">
        <div className="flex overflow-x-auto gap-2 pb-1 sm:pb-0 scrollbar-none">
          <button
            id="subtab-pipeline"
            onClick={() => setActiveSubTab('pipeline')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'pipeline'
                ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
                : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
            }`}
          >
            <Clock className="h-4 w-4" />
            Régua 7d / 14d ({filteredTasks.length})
          </button>

          <button
            id="subtab-birthdays"
            onClick={() => setActiveSubTab('birthdays')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'birthdays'
                ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
                : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
            }`}
          >
            <Cake className="h-4 w-4 text-[#FBBF3D]" />
            Radar Aniversários ({birthdayVets.length})
          </button>

          <button
            id="subtab-instagram"
            onClick={() => setActiveSubTab('instagram')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'instagram'
                ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
                : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
            }`}
          >
            <Instagram className="h-4 w-4 text-rose-500" />
            Instagram Leads ({instagramLeads.length})
          </button>

          <button
            id="subtab-critical"
            onClick={() => setActiveSubTab('critical')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'critical'
                ? 'bg-[#D90000] text-white shadow-md'
                : 'bg-white text-[#D90000] hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-[#D90000]" />
            Críticos ({criticalTasks.length})
          </button>
        </div>

        {/* Filter controls */}
        {activeSubTab === 'pipeline' && (
          <div className="flex items-center gap-2">
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="text-xs font-bold border border-[#E8D9C8] rounded-xl px-2.5 py-1.5 bg-white text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
            >
              <option value="ALL">Todos os Contratantes</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.trade_name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold border border-[#E8D9C8] rounded-xl px-2.5 py-1.5 bg-white text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="pending">Pendentes</option>
              <option value="completed">Concluídos</option>
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: PIPELINE DE FOLLOW-UP (+7d e +14d) */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => {
              const vet = vetMap.get(task.veterinarian_id);
              const tenant = tenantMap.get(task.tenant_id);
              const report = reportMap.get(task.visit_report_id);
              const isCompleted = task.status === 'completed';
              const is7d = task.action_type === 'first_contact_7d';
              const is14d = task.action_type === 'second_contact_14d';
              const isCrit = task.action_type === 'critical_resolution';

              const whatsappMessage = is7d
                ? `Olá Dr(a). ${vet?.full_name}, sou da equipe da Match Point Promove representando o ${tenant?.trade_name}. Passando para saber se teve oportunidade de avaliar a apresentação sobre ${report?.service_interest || 'nossos serviços veterinários'}. Ficou alguma dúvida técnica?`
                : `Olá Dr(a). ${vet?.full_name}, tudo bem? Sou da equipe da Match Point Promove representando o ${tenant?.trade_name}. Gostaria de reforçar nossa parceria para encaminhamento de pacientes e exames esta semana. Podemos ajudar em algum caso clínico?`;

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-xs ${
                    isCompleted
                      ? 'border-[#E8D9C8] opacity-75 bg-slate-50/50'
                      : isCrit
                      ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20'
                      : is7d
                      ? 'border-[#FF530D]/40 hover:shadow-md'
                      : 'border-[#FBBF3D]/60 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Badge header */}
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-white shadow-2xs"
                        style={{ backgroundColor: tenant?.color_theme || '#FF530D' }}
                      >
                        {tenant?.trade_name}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {is7d && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FF530D]/10 text-[#FF530D]">
                            ⚡ D+7 1º Contato
                          </span>
                        )}
                        {is14d && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FBBF3D]/20 text-[#111111]">
                            🔁 D+14 Manutenção
                          </span>
                        )}
                        {isCrit && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#D90000] text-white">
                            🔴 Crítico
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Vet Info */}
                    <div className="flex items-start gap-3">
                      {vet?.avatar_url ? (
                        <img
                          src={vet.avatar_url}
                          alt={vet.full_name}
                          className="h-10 w-10 rounded-full object-cover border border-[#E8D9C8]"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[#FDF2E7] text-[#FF530D] font-bold text-xs flex items-center justify-center border border-[#E8D9C8]">
                          {vet?.full_name.substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-extrabold text-sm text-[#111111]">
                          {vet?.full_name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {vet?.crmv} • {vet?.workplace_name}
                        </p>
                      </div>
                    </div>

                    {/* Report context preview */}
                    {report && (
                      <div className="bg-[#FDF2E7] p-2.5 rounded-xl text-xs text-slate-700 border border-[#E8D9C8] space-y-0.5">
                        <span className="text-[10px] font-bold uppercase text-[#FF530D] block">
                          Gancho da Visita:
                        </span>
                        <p className="line-clamp-2 text-slate-800 italic">
                          "{report.observations}"
                        </p>
                      </div>
                    )}

                    {/* Due date */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-[#111111]">
                        <Calendar className="h-3.5 w-3.5 text-[#FF530D]" />
                        Vencimento: {new Date(task.due_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                      </span>
                      {isCompleted ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Concluído
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold">Pendente</span>
                      )}
                    </div>
                  </div>

                  {/* Evolution Feedback */}
                  {evoFeedback && evoFeedback.id === task.id && (
                    <div
                      className={`p-2 rounded-xl text-[11px] font-bold ${
                        evoFeedback.success
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {evoFeedback.msg}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-3">
                    {vet?.whatsapp && !isCompleted && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {currentUserRole === 'super_admin' && (
                          <button
                            type="button"
                            disabled={dispatchingTaskId === task.id}
                            onClick={() =>
                              handleSendEvolutionDirect(task, vet, tenant!, whatsappMessage)
                            }
                            className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            title="Disparar via Evolution API diretamente (Match Point Master)"
                          >
                            <Sparkles className={`h-3 w-3 ${dispatchingTaskId === task.id ? 'animate-spin' : ''}`} />
                            <span>{dispatchingTaskId === task.id ? 'Enviando...' : 'Auto-Disparo Evolution'}</span>
                          </button>
                        )}

                        <a
                          href={`https://wa.me/55${vet.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                            whatsappMessage
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Phone className="h-3 w-3 text-emerald-600" />
                          <span>WhatsApp Web</span>
                        </a>
                      </div>
                    )}

                    {!isCompleted ? (
                      <button
                        onClick={() => handleCompleteTask(task)}
                        className="px-3 py-1.5 bg-[#FF530D] hover:bg-[#e04505] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ml-auto cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Marcar Feito</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic ml-auto">
                        {task.notes_completion || 'Concluído'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: RADAR DE ANIVERSARIANTES */}
      {activeSubTab === 'birthdays' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#FBBF3D]/20 text-[#111111] flex items-center justify-center font-bold">
                <Cake className="h-5 w-5 text-[#FF530D]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#111111]">
                  Aniversariantes do Mês (Mês {currentMonth} e Próximo)
                </h3>
                <p className="text-xs text-slate-500">
                  Oportunidade estratégica para estreitamento de laços, envio de brindes Match Point e felicitações personalizadas.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {birthdayVets.map((vet) => {
              const [year, month, day] = (vet.birth_date || '2000-01-01').split('-');
              const isThisMonth = parseInt(month, 10) === currentMonth;

              const birthdayMsg = `Parabéns Dr(a). ${vet.full_name}! 🎂 Em nome da equipe Match Point Promove e nossos parceiros, desejamos muito sucesso, saúde e realizações na sua trajetória veterinária!`;

              return (
                <div
                  key={vet.id}
                  className={`bg-white rounded-2xl p-5 border transition-all space-y-3 shadow-xs ${
                    isThisMonth
                      ? 'border-[#FBBF3D] ring-2 ring-[#FBBF3D]/30 bg-[#FDF2E7]/40'
                      : 'border-[#E8D9C8]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {vet.avatar_url ? (
                        <img
                          src={vet.avatar_url}
                          alt={vet.full_name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-[#FBBF3D]"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-[#FBBF3D]/20 text-[#111111] font-bold text-sm flex items-center justify-center">
                          {vet.full_name.substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-extrabold text-sm text-[#111111]">{vet.full_name}</h4>
                        <p className="text-xs text-[#FF530D] font-bold">{vet.crmv} • {vet.specialty}</p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        isThisMonth ? 'bg-[#FF530D] text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      🎉 {day}/{month}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p className="font-medium text-[#111111]">
                      <Building2 className="h-3.5 w-3.5 inline text-[#FF530D] mr-1" />
                      {vet.workplace_name} ({vet.neighborhood})
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={`https://wa.me/55${vet.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                        birthdayMsg
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Enviar Parabéns WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: INSTAGRAM SOCIAL LEADS */}
      {activeSubTab === 'instagram' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#111111] flex items-center gap-2">
                <Instagram className="h-5 w-5 text-rose-600" />
                Monitoramento & Marcação em Posts de Veterinários
              </h3>
              <p className="text-xs text-slate-500">
                Identificação de postagens clínicas e stories de médicos-veterinários parceiros para engajamento e relacionamento.
              </p>
            </div>

            <button
              onClick={() => setIsIgModalOpen(true)}
              className="px-3.5 py-2 bg-[#FF530D] hover:bg-[#e04505] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar Post de Veterinário</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instagramLeads.map((lead) => {
              const vet = vetMap.get(lead.veterinarian_id);

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-2xl p-5 border border-[#E8D9C8] shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Instagram className="h-3 w-3" />
                        {lead.instagram_handle}
                      </span>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          lead.status === 'converted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lead.status === 'interacted'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {lead.status === 'converted'
                          ? 'Convertido em Visita'
                          : lead.status === 'interacted'
                          ? 'Comentado / Direct'
                          : 'Pendente'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-[#111111]">
                      {lead.post_title}
                    </h4>

                    <div className="bg-[#FDF2E7] p-2.5 rounded-xl text-xs border border-[#E8D9C8] space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-[#FF530D]">
                        Oportunidade Identificada:
                      </span>
                      <p className="text-slate-700">{lead.opportunity_topic}</p>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1">
                      Profissional: <strong>{vet?.full_name}</strong> ({vet?.specialty})
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={`https://instagram.com/${lead.instagram_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Abrir Post</span>
                    </a>

                    {lead.status === 'pending' && (
                      <button
                        onClick={() => onUpdateInstagramLeadStatus(lead.id, 'interacted')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Marcar Interagido
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4: CENTRAL DE ALERTAS CRÍTICOS (RECLAMAÇÕES) */}
      {activeSubTab === 'critical' && (
        <div className="space-y-4">
          <div className="bg-rose-900 text-white rounded-2xl p-5 border border-rose-800 shadow-md">
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-300" />
              Central de Resolução Rápida & Tratativas Críticas
            </h3>
            <p className="text-xs text-rose-100 mt-1 max-w-2xl">
              Feedbacks negativos ou reclamações de laudos/atendimentos acionam este fluxo emergencial para contato resolutivo pela diretoria ou supervisor Match Point.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalTasks.map((task) => {
              const vet = vetMap.get(task.veterinarian_id);
              const tenant = tenantMap.get(task.tenant_id);
              const report = reportMap.get(task.visit_report_id);
              const isResolved = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl p-5 border-2 shadow-xs space-y-3 flex flex-col justify-between ${
                    isResolved ? 'border-emerald-300 bg-emerald-50/20' : 'border-[#D90000] bg-rose-50/20'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-2xs"
                        style={{ backgroundColor: tenant?.color_theme || '#D90000' }}
                      >
                        {tenant?.trade_name}
                      </span>

                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-[#D90000] text-white animate-pulse'
                        }`}
                      >
                        {isResolved ? '✅ Tratativa Concluída' : '⚠️ Pendente de Ação'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm sm:text-base text-[#111111]">
                      Dr(a). {vet?.full_name} ({vet?.workplace_name})
                    </h4>

                    {report && (
                      <div className="bg-white p-3 rounded-xl border border-rose-200 text-xs text-slate-800 space-y-1">
                        <span className="font-bold text-[#D90000] block">Motivo do Alerta / Reclamação:</span>
                        <p className="italic">"{report.observations}"</p>
                      </div>
                    )}

                    {isResolved && task.notes_completion && (
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                        <strong>Tratativa Registrada:</strong> {task.notes_completion}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                    {vet?.whatsapp && (
                      <a
                        href={`https://wa.me/55${vet.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Olá Dr(a). ${vet.full_name}, sou da diretoria da Match Point Promove em conjunto com o ${tenant?.trade_name}. Gostaríamos de conversar sobre seu apontamento recente para resolvermos prontamente.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-[#D90000] hover:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>WhatsApp Emergencial</span>
                      </a>
                    )}

                    {!isResolved && (
                      <button
                        onClick={() => {
                          setResolvingTaskId(task.id);
                          setResolutionNotes('');
                        }}
                        className="px-3 py-1.5 bg-[#111111] hover:bg-black text-white rounded-lg text-xs font-bold transition-colors ml-auto cursor-pointer"
                      >
                        Resolver Alerta
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL FOR CRITICAL TASKS */}
      {resolvingTaskId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-[#E8D9C8] shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Finalizar Tratativa de Reclamação
            </h3>
            <p className="text-xs text-slate-600">
              Descreva a solução acordada com o médico-veterinário e o plano de ação alinhado com o contratante.
            </p>

            <textarea
              rows={4}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Ex: Ligamos para o Dr. Marcelo e alinhamos prioridade no próximo laudo histopatológico..."
              className="w-full text-xs sm:text-sm p-3 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:bg-white focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResolvingTaskId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={submitResolution}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirmar Resolução
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR REGISTERING INSTAGRAM LEAD */}
      {isIgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#E8D9C8] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
                <Instagram className="h-5 w-5 text-rose-600" />
                Registrar Post / Story de Veterinário
              </h3>
              <button
                onClick={() => setIsIgModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIgLead} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Médico-Veterinário
                </label>
                <select
                  value={igVetId}
                  onChange={(e) => setIgVetId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                >
                  {vets.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.full_name} ({v.specialty} - {v.instagram_handle || 'Sem IG'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Título / Tema do Post
                </label>
                <input
                  type="text"
                  value={igPostTitle}
                  onChange={(e) => setIgPostTitle(e.target.value)}
                  placeholder="Ex: Caso de fratura complexa operada no Hospital"
                  className="w-full text-xs p-2.5 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Oportunidade Comercial Identificada
                </label>
                <input
                  type="text"
                  value={igTopic}
                  onChange={(e) => setIgTopic(e.target.value)}
                  placeholder="Ex: Parabenizar e oferecer tomografia computadorizada para os próximos casos"
                  className="w-full text-xs p-2.5 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIgModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF530D] hover:bg-[#e04505] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Salvar Oportunidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
