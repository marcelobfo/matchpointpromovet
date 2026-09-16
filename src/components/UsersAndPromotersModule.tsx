import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Briefcase,
  Building2,
  Phone,
  Mail,
  Key,
  Edit3,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Send,
  Printer,
  Download,
  Award,
  TrendingUp,
  Clock,
  MapPin,
  Stethoscope,
  ChevronDown,
  Eye,
  EyeOff,
  Sparkles,
  BarChart3,
  PieChart,
  Calendar,
  Layers,
  MessageSquare,
  Copy,
  ExternalLink,
  Lock,
  RefreshCw
} from 'lucide-react';
import { User, UserRole, Tenant, Veterinarian, Visit, VisitReport, FollowUpTask } from '../types';
import { StorageService } from '../services/storage';
import { MatchPointLogo } from './MatchPointLogo';

interface UsersAndPromotersModuleProps {
  users: User[];
  tenants: Tenant[];
  vets: Veterinarian[];
  visits: Visit[];
  reports: VisitReport[];
  tasks: FollowUpTask[];
  currentUserId: string;
  onDataChanged: () => void;
}

export const UsersAndPromotersModule: React.FC<UsersAndPromotersModuleProps> = ({
  users,
  tenants,
  vets,
  visits,
  reports,
  tasks,
  currentUserId,
  onDataChanged
}) => {
  // Navigation tabs inside module
  const [activeTab, setActiveTab] = useState<'users_list' | 'promoter_performance' | 'team_ranking'>('users_list');

  // Search and filters for Users List
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State: Create / Edit User
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'promoter' as UserRole,
    tenant_id: '' as string,
    phone: '',
    password: '',
    is_active: true
  });
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal State: Reset Password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Modal State: Delete Confirmation
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);

  // Performance Report State
  const promotersList = useMemo(() => {
    return users.filter((u) => u.role === 'promoter' || u.role === 'super_admin');
  }, [users]);

  const [selectedPromoterId, setSelectedPromoterId] = useState<string>(() => {
    return promotersList[0]?.id || 'user-promoter-lucas';
  });

  const [performancePeriod, setPerformancePeriod] = useState<'all' | 'current_month' | 'last_15_days' | 'current_week'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'critical'>('all');
  const [performanceSearchQuery, setPerformanceSearchQuery] = useState('');

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Maps for quick lookup
  const tenantMap = useMemo(() => new Map<string, Tenant>(tenants.map((t) => [t.id, t])), [tenants]);
  const vetMap = useMemo(() => new Map<string, Veterinarian>(vets.map((v) => [v.id, v])), [vets]);
  const userMap = useMemo(() => new Map<string, User>(users.map((u) => [u.id, u])), [users]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === 'ACTIVE' && !u.is_active) return false;
      if (statusFilter === 'INACTIVE' && u.is_active) return false;

      // Search term
      if (userSearchTerm.trim()) {
        const query = userSearchTerm.toLowerCase();
        const tenant = u.tenant_id ? tenantMap.get(u.tenant_id) : undefined;
        const tenantName = tenant ? tenant.trade_name.toLowerCase() : '';
        const name = u.full_name.toLowerCase();
        const email = u.email.toLowerCase();
        const phone = (u.phone || '').toLowerCase();

        return name.includes(query) || email.includes(query) || phone.includes(query) || tenantName.includes(query);
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, userSearchTerm, tenantMap]);

  // Open Modal to Create User
  const handleOpenCreateModal = (defaultRole: UserRole = 'promoter') => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      email: '',
      role: defaultRole,
      tenant_id: defaultRole === 'tenant_client' ? (tenants[0]?.id || '') : '',
      phone: '',
      password: 'sucesso@2027@',
      is_active: true
    });
    setShowPasswordInModal(false);
    setFormError(null);
    setIsUserModalOpen(true);
  };

  // Open Modal to Edit User
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    const existingPass = StorageService.getUserPassword(user.email);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id || '',
      phone: user.phone || '',
      password: existingPass,
      is_active: user.is_active
    });
    setShowPasswordInModal(false);
    setFormError(null);
    setIsUserModalOpen(true);
  };

  // Generate a strong random temporary password
  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: `MP@${res}` }));
  };

  // Save User (Create or Update)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.full_name.trim()) {
      setFormError('Por favor, informe o nome completo do usuário.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Por favor, informe um e-mail válido para acesso.');
      return;
    }

    const emailTrimmed = formData.email.trim().toLowerCase();

    // Check duplicate email
    const duplicate = users.find(
      (u) => u.email.toLowerCase() === emailTrimmed && (!editingUser || u.id !== editingUser.id)
    );
    if (duplicate) {
      setFormError(`O e-mail "${formData.email}" já está sendo utilizado por outro usuário cadastrado.`);
      return;
    }

    if (formData.role === 'tenant_client' && !formData.tenant_id) {
      setFormError('Para o perfil "Cliente Contratante", é obrigatório vincular a respectiva empresa.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setFormError('A senha de acesso deve ter pelo menos 6 caracteres.');
      return;
    }

    const finalTenantId = formData.role === 'tenant_client' ? formData.tenant_id : null;

    if (editingUser) {
      // Update existing
      StorageService.updateUser(
        editingUser.id,
        {
          full_name: formData.full_name.trim(),
          email: emailTrimmed,
          role: formData.role,
          tenant_id: finalTenantId,
          phone: formData.phone.trim(),
          is_active: formData.is_active
        },
        formData.password
      );
      showToast(`Usuário "${formData.full_name}" atualizado com sucesso!`);
    } else {
      // Create new
      StorageService.addUser(
        {
          full_name: formData.full_name.trim(),
          email: emailTrimmed,
          role: formData.role,
          tenant_id: finalTenantId,
          phone: formData.phone.trim(),
          is_active: formData.is_active
        },
        formData.password
      );
      showToast(`Novo usuário "${formData.full_name}" cadastrado com sucesso!`);
    }

    setIsUserModalOpen(false);
    onDataChanged();
  };

  // Toggle active / inactive status
  const handleToggleStatus = (user: User) => {
    if (user.id === currentUserId) {
      showToast('Você não pode desativar o seu próprio usuário logado.', 'error');
      return;
    }
    const updated = StorageService.toggleUserStatus(user.id);
    if (updated) {
      showToast(
        `Usuário "${user.full_name}" ${updated.is_active ? 'reativado' : 'desativado'} com sucesso.`,
        updated.is_active ? 'success' : 'info'
      );
      onDataChanged();
    }
  };

  // Open reset password modal
  const handleOpenPasswordModal = (user: User) => {
    setPasswordTargetUser(user);
    setNewPasswordValue('sucesso@2027@');
    setShowNewPassword(false);
    setIsPasswordModalOpen(true);
  };

  // Save reset password
  const handleSavePasswordReset = () => {
    if (!passwordTargetUser) return;
    if (!newPasswordValue || newPasswordValue.length < 6) {
      showToast('A nova senha deve possuir no mínimo 6 caracteres.', 'error');
      return;
    }
    StorageService.setUserPassword(passwordTargetUser.email, newPasswordValue);
    showToast(`Senha do usuário "${passwordTargetUser.full_name}" redefinida com sucesso!`);
    setIsPasswordModalOpen(false);
  };

  // Confirm and Execute Delete User
  const handleDeleteUser = () => {
    if (!deleteConfirmUser) return;
    if (deleteConfirmUser.id === currentUserId) {
      showToast('Não é permitido excluir o usuário que está atualmente logado.', 'error');
      setDeleteConfirmUser(null);
      return;
    }

    StorageService.deleteUser(deleteConfirmUser.id);
    showToast(`Usuário "${deleteConfirmUser.full_name}" removido com sucesso.`);
    setDeleteConfirmUser(null);
    onDataChanged();
  };

  // Send WhatsApp Onboarding Access Message
  const handleSendWhatsAppCredentials = (user: User) => {
    const rawPhone = (user.phone || '').replace(/\D/g, '');
    if (!rawPhone || rawPhone.length < 10) {
      showToast(`O usuário ${user.full_name} não possui um número de WhatsApp válido cadastrado.`, 'error');
      return;
    }

    const pass = StorageService.getUserPassword(user.email);
    const roleLabel =
      user.role === 'promoter'
        ? 'Promotor de Campo & Inteligência Comercial'
        : user.role === 'tenant_client'
        ? `Portal do Cliente (${user.tenant_id ? tenantMap.get(user.tenant_id)?.trade_name : 'Contratante'})`
        : 'Administrador Master Match Point';

    const loginUrl = window.location.origin;

    const message = `Olá *${user.full_name}*! 👋\n\nSeu acesso à plataforma oficial *Match Point Promove* foi liberado com sucesso.\n\n👤 *Perfil:* ${roleLabel}\n📧 *Login (E-mail):* ${user.email}\n🔑 *Senha Inicial:* ${pass}\n🌐 *Acesse em:* ${loginUrl}\n\n_Por segurança, recomendamos alterar sua senha após o primeiro acesso._\n\nEquipe Match Point Promove.`;

    const cleanNumber = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Copy Login Credentials
  const handleCopyCredentials = (user: User) => {
    const pass = StorageService.getUserPassword(user.email);
    const text = `Credenciais Match Point Promove:\nUsuário: ${user.email}\nSenha: ${pass}\nLink: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    showToast('Credenciais de acesso copiadas para a área de transferência!');
  };

  // =========================================================================
  // PROMOTER PERFORMANCE & ANALYTICS COMPUTATIONS
  // =========================================================================
  const selectedPromoter = useMemo(() => {
    return users.find((u) => u.id === selectedPromoterId) || promotersList[0] || users[0];
  }, [users, selectedPromoterId, promotersList]);

  // All visits by selected promoter
  const promoterVisits = useMemo(() => {
    return visits.filter((v) => v.promoter_id === selectedPromoter?.id);
  }, [visits, selectedPromoter]);

  // Filtered promoter visits by period
  const filteredPromoterVisits = useMemo(() => {
    const now = new Date();
    return promoterVisits.filter((v) => {
      if (performancePeriod === 'all') return true;
      if (!v.visit_date) return true;

      const visitDate = new Date(v.visit_date + 'T12:00:00Z');
      const diffTime = Math.abs(now.getTime() - visitDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (performancePeriod === 'current_week') {
        return diffDays <= 7;
      }
      if (performancePeriod === 'last_15_days') {
        return diffDays <= 15;
      }
      if (performancePeriod === 'current_month') {
        return (
          visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [promoterVisits, performancePeriod]);

  // Visit IDs for this promoter
  const promoterVisitIds = useMemo(() => {
    return new Set(filteredPromoterVisits.map((v) => v.id));
  }, [filteredPromoterVisits]);

  // Reports associated with this promoter's visits
  const promoterReports = useMemo(() => {
    return reports.filter((r) => promoterVisitIds.has(r.visit_id));
  }, [reports, promoterVisitIds]);

  // Detailed metrics for the selected promoter
  const totalVisitsCount = filteredPromoterVisits.length;
  const uniqueVetsCount = new Set(filteredPromoterVisits.map((v) => v.veterinarian_id)).size;

  const positiveReportsCount = promoterReports.filter((r) => r.sentiment === 'positive').length;
  const neutralReportsCount = promoterReports.filter((r) => r.sentiment === 'neutral').length;
  const criticalReportsCount = promoterReports.filter(
    (r) => r.critical_action_needed || r.sentiment === 'complaint'
  ).length;
  const totalReportsCount = promoterReports.length;

  const positiveRate = totalReportsCount > 0 ? Math.round((positiveReportsCount / totalReportsCount) * 100) : 0;
  const criticalRate = totalReportsCount > 0 ? Math.round((criticalReportsCount / totalReportsCount) * 100) : 0;

  // Follow-up tasks assigned to this promoter
  const promoterTasks = useMemo(() => {
    const promoterName = selectedPromoter?.full_name?.toLowerCase() || '';
    return tasks.filter((t) => {
      const assigned = (t.assigned_to || '').toLowerCase();
      return assigned.includes(promoterName) || assigned.includes(selectedPromoter?.id || '');
    });
  }, [tasks, selectedPromoter]);

  const completedTasksCount = promoterTasks.filter((t) => t.status === 'completed').length;
  const pendingTasksCount = promoterTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const taskCompletionRate =
    promoterTasks.length > 0 ? Math.round((completedTasksCount / promoterTasks.length) * 100) : 100;

  // Breakdown by Represented Tenant (Brands covered by promoter)
  const brandBreakdown = useMemo(() => {
    const counts: Record<string, { tenant: Tenant; count: number; positive: number; critical: number }> = {};
    tenants.forEach((t) => {
      counts[t.id] = { tenant: t, count: 0, positive: 0, critical: 0 };
    });

    promoterReports.forEach((rep) => {
      if (counts[rep.tenant_id]) {
        counts[rep.tenant_id].count += 1;
        if (rep.sentiment === 'positive') counts[rep.tenant_id].positive += 1;
        if (rep.critical_action_needed || rep.sentiment === 'complaint') counts[rep.tenant_id].critical += 1;
      }
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [tenants, promoterReports]);

  // Breakdown by Vet Specialty
  const specialtyBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPromoterVisits.forEach((v) => {
      const vet = vetMap.get(v.veterinarian_id);
      const spec = vet?.specialty || 'Clínica Geral';
      counts[spec] = (counts[spec] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredPromoterVisits, vetMap]);

  // Filtered detailed visits table for promoter report
  const filteredDetailedReports = useMemo(() => {
    return promoterReports.filter((rep) => {
      const visit = visits.find((v) => v.id === rep.visit_id);
      const vet = visit ? vetMap.get(visit.veterinarian_id) : undefined;
      const isCrit = rep.critical_action_needed || rep.sentiment === 'complaint';

      if (sentimentFilter === 'positive' && rep.sentiment !== 'positive') return false;
      if (sentimentFilter === 'neutral' && rep.sentiment !== 'neutral') return false;
      if (sentimentFilter === 'critical' && !isCrit) return false;

      if (performanceSearchQuery.trim()) {
        const q = performanceSearchQuery.toLowerCase();
        const vetName = (vet?.full_name || '').toLowerCase();
        const crmv = (vet?.crmv || '').toLowerCase();
        const clinic = (vet?.workplace_name || '').toLowerCase();
        const obs = (rep.observations || '').toLowerCase();
        const interest = (rep.service_interest || '').toLowerCase();

        return (
          vetName.includes(q) ||
          crmv.includes(q) ||
          clinic.includes(q) ||
          obs.includes(q) ||
          interest.includes(q)
        );
      }
      return true;
    });
  }, [promoterReports, sentimentFilter, performanceSearchQuery, visits, vetMap]);

  // Export Promoter Report to Excel / CSV
  const handleExportPromoterCsv = () => {
    const headers = [
      'Promotor Responsável',
      'Data da Visita',
      'CRMV',
      'Médico Veterinário',
      'Especialidade',
      'Local / Clínica',
      'Bairro',
      'Cidade',
      'Empresa Representada',
      'Sentimento do Feedback',
      'Interesse em Serviços',
      'Ação Crítica Demandada',
      'Observações Registradas'
    ];

    const rows = filteredDetailedReports.map((rep) => {
      const visit = visits.find((v) => v.id === rep.visit_id);
      const vet = visit ? vetMap.get(visit.veterinarian_id) : undefined;
      const tenant = tenantMap.get(rep.tenant_id);

      return [
        `"${(selectedPromoter?.full_name || '').replace(/"/g, '""')}"`,
        visit?.visit_date || '',
        vet?.crmv || '',
        `"${(vet?.full_name || '').replace(/"/g, '""')}"`,
        `"${(vet?.specialty || '').replace(/"/g, '""')}"`,
        `"${(vet?.workplace_name || '').replace(/"/g, '""')}"`,
        `"${(vet?.neighborhood || '').replace(/"/g, '""')}"`,
        `"${(vet?.city || '').replace(/"/g, '""')}"`,
        `"${(tenant?.trade_name || '').replace(/"/g, '""')}"`,
        rep.sentiment === 'positive' ? 'Positivo' : rep.sentiment === 'neutral' ? 'Neutro' : 'Crítico/Reclamação',
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
      `Aproveitamento_Promotor_${(selectedPromoter?.full_name || 'Promotor').replace(/\s+/g, '_')}_${
        new Date().toISOString().split('T')[0]
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha de desempenho exportada com sucesso!');
  };

  const handlePrintPromoterReport = () => {
    window.print();
  };

  // =========================================================================
  // TEAM RANKING & COMPARATIVE TABLE
  // =========================================================================
  const teamRankingData = useMemo(() => {
    return promotersList.map((promoter) => {
      const pVisits = visits.filter((v) => v.promoter_id === promoter.id);
      const vIds = new Set(pVisits.map((v) => v.id));
      const pReports = reports.filter((r) => vIds.has(r.visit_id));
      const pUniqueVets = new Set(pVisits.map((v) => v.veterinarian_id)).size;

      const pPositives = pReports.filter((r) => r.sentiment === 'positive').length;
      const pCriticals = pReports.filter((r) => r.critical_action_needed || r.sentiment === 'complaint').length;
      const pPosRate = pReports.length > 0 ? Math.round((pPositives / pReports.length) * 100) : 0;

      const promoterName = promoter.full_name.toLowerCase();
      const pTasks = tasks.filter((t) => (t.assigned_to || '').toLowerCase().includes(promoterName));
      const pCompletedTasks = pTasks.filter((t) => t.status === 'completed').length;

      // Last activity date
      const lastVisit = [...pVisits].sort((a, b) => (b.visit_date || '').localeCompare(a.visit_date || ''))[0];

      return {
        promoter,
        totalVisits: pVisits.length,
        uniqueVets: pUniqueVets,
        totalReports: pReports.length,
        positiveRate: pPosRate,
        positivesCount: pPositives,
        criticalsCount: pCriticals,
        tasksCompleted: pCompletedTasks,
        totalTasks: pTasks.length,
        lastVisitDate: lastVisit?.visit_date || null
      };
    }).sort((a, b) => b.totalVisits - a.totalVisits);
  }, [promotersList, visits, reports, tasks]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all animate-bounce ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : toastMessage.type === 'info'
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-[#D90000] shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner (Hidden in Print) */}
      <div className="bg-[#111111] rounded-2xl p-4 sm:p-6 text-[#FDF2E7] border border-[#2a2a2a] shadow-md relative overflow-hidden print:hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF530D] via-[#FBBF3D] to-[#D90000]" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 sm:space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide bg-[#FF530D]/20 border border-[#FF530D]/40 text-[#FF530D]">
                Módulo Super Admin Exclusivo
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide bg-slate-800 border border-slate-700 text-slate-300">
                Match Point Promove
              </span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2 leading-tight">
              <Users className="h-6 w-6 text-[#FF530D] shrink-0" />
              <span>Gestão de Usuários &amp; Aproveitamento de Promotores</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Painel central para o Super Administrador criar e gerenciar credenciais de <strong>Promotores de Campo</strong>, <strong>Clientes Contratantes</strong> e acompanhar a <strong>performance individual de visitas e conversão</strong>.
            </p>
          </div>

          {/* Quick Create Action */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-create-promoter-top"
              onClick={() => handleOpenCreateModal('promoter')}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#FF530D] hover:bg-[#e04505] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <UserPlus className="h-4 w-4 shrink-0" />
              <span>Cadastrar Promotor / Usuário</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('users_list')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'users_list'
                ? 'bg-[#FF530D] text-white shadow-xs'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>1. Gestão de Usuários ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promoter_performance')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'promoter_performance'
                ? 'bg-[#FF530D] text-white shadow-xs'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4 text-[#FBBF3D]" />
            <span>2. Aproveitamento Individual do Promotor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team_ranking')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'team_ranking'
                ? 'bg-[#FF530D] text-white shadow-xs'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Award className="h-4 w-4 text-emerald-400" />
            <span>3. Ranking &amp; Comparativo da Equipe</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GESTÃO & CADASTRO DE USUÁRIOS */}
      {/* ========================================================================= */}
      {activeTab === 'users_list' && (
        <div className="space-y-4 print:hidden">
          {/* Filters & Actions Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8D9C8] shadow-xs space-y-3.5">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, e-mail, telefone ou empresa..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium border border-[#E8D9C8] rounded-xl pl-9 pr-8 py-2 bg-[#FDF2E7]/40 text-[#111111] placeholder:text-slate-400 focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                />
                {userSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setUserSearchTerm('')}
                    className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Add Dropdown / Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="btn-add-promoter-primary"
                  onClick={() => handleOpenCreateModal('promoter')}
                  className="px-3.5 py-2 bg-[#FF530D] hover:bg-[#e04505] text-white text-xs sm:text-sm font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>+ Novo Promotor / Corretor</span>
                </button>

                <button
                  type="button"
                  id="btn-add-tenant-client"
                  onClick={() => handleOpenCreateModal('tenant_client')}
                  className="px-3.5 py-2 bg-[#111111] hover:bg-slate-800 text-[#FDF2E7] text-xs sm:text-sm font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="h-4 w-4 text-[#FBBF3D]" />
                  <span>+ Usuário Contratante</span>
                </button>
              </div>
            </div>

            {/* Role & Status Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Perfil:
                </span>
                <button
                  type="button"
                  onClick={() => setRoleFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    roleFilter === 'ALL'
                      ? 'bg-[#111111] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('promoter')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    roleFilter === 'promoter'
                      ? 'bg-[#FF530D] text-white shadow-2xs'
                      : 'bg-[#FF530D]/10 text-[#FF530D] hover:bg-[#FF530D]/20'
                  }`}
                >
                  💼 Promotores ({users.filter((u) => u.role === 'promoter').length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('tenant_client')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    roleFilter === 'tenant_client'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  🏢 Clientes Contratantes ({users.filter((u) => u.role === 'tenant_client').length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('super_admin')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    roleFilter === 'super_admin'
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🛡️ Super Admins ({users.filter((u) => u.role === 'super_admin').length})
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs font-bold border border-[#E8D9C8] rounded-lg px-2 py-1 bg-[#FDF2E7]/40 text-[#111111] focus:ring-1 focus:ring-[#FF530D] focus:outline-none"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="ACTIVE">Apenas Ativos</option>
                  <option value="INACTIVE">Apenas Inativos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users List Cards / Table */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8D9C8] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#111111] flex items-center gap-2">
                  <span>Base Geral de Usuários do Sistema</span>
                  <span className="text-xs bg-[#FF530D]/10 text-[#FF530D] px-2 py-0.5 rounded-full font-black">
                    {filteredUsers.length} cadastrados
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Cadastre novos corretores/propagandistas para liberar o app mobile de visitas e acompanhe as credenciais.
                </p>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block border border-[#E8D9C8] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#111111] text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3">Usuário &amp; Contato</th>
                    <th className="p-3">Perfil de Acesso</th>
                    <th className="p-3">Empresa Vinculada</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Visitas Registradas</th>
                    <th className="p-3 text-right">Ações Administrativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D9C8] text-slate-800">
                  {filteredUsers.map((user) => {
                    const tenant = user.tenant_id ? tenantMap.get(user.tenant_id) : null;
                    const userVisitsCount = visits.filter((v) => v.promoter_id === user.id).length;
                    const isCurrent = user.id === currentUserId;

                    return (
                      <tr key={user.id} className="hover:bg-[#FDF2E7]/40 transition-colors">
                        <td className="p-3 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-black text-xs shrink-0">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-[#111111] flex items-center gap-1.5">
                                <span>{user.full_name}</span>
                                {isCurrent && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">
                                    VOCÊ
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Phone className="h-2.5 w-2.5 text-slate-400" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3 align-middle">
                          {user.role === 'super_admin' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-800 text-slate-200 border border-slate-700">
                              🛡️ Super Admin Master
                            </span>
                          )}
                          {user.role === 'promoter' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-[#FF530D]/15 text-[#FF530D] border border-[#FF530D]/30">
                              💼 Promotor / Corretor
                            </span>
                          )}
                          {user.role === 'tenant_client' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              🏢 Cliente Contratante
                            </span>
                          )}
                        </td>

                        <td className="p-3 align-middle">
                          {tenant ? (
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-[#FF530D] shrink-0" />
                              <span className="truncate max-w-[160px]">{tenant.trade_name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Match Point Geral</span>
                          )}
                        </td>

                        <td className="p-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-all ${
                              user.is_active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title="Clique para alternar status ativo/inativo"
                          >
                            {user.is_active ? '🟢 Ativo' : '⚪ Inativo'}
                          </button>
                        </td>

                        <td className="p-3 text-center align-middle font-black text-sm text-[#111111]">
                          {user.role === 'promoter' || user.role === 'super_admin' ? (
                            <span className="inline-block px-2 py-0.5 bg-[#FDF2E7] border border-[#E8D9C8] rounded-md text-xs">
                              {userVisitsCount} visitas
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        <td className="p-3 text-right align-middle">
                          <div className="flex items-center justify-end gap-1">
                            {/* Send WhatsApp Access */}
                            {user.phone && (
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppCredentials(user)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Enviar credenciais via WhatsApp"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* View Performance (if promoter) */}
                            {(user.role === 'promoter' || user.role === 'super_admin') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPromoterId(user.id);
                                  setActiveTab('promoter_performance');
                                }}
                                className="p-1.5 text-[#FF530D] hover:bg-[#FF530D]/10 rounded-lg transition-colors cursor-pointer"
                                title="Ver Dossiê de Aproveitamento do Promotor"
                              >
                                <BarChart3 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Copy credentials */}
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(user)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Copiar dados de acesso"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>

                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => handleOpenPasswordModal(user)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Redefinir Senha do Usuário"
                            >
                              <Key className="h-3.5 w-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(user)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar Usuário"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete (if not current user) */}
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmUser(user)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir Usuário"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="lg:hidden space-y-3">
              {filteredUsers.map((user) => {
                const tenant = user.tenant_id ? tenantMap.get(user.tenant_id) : null;
                const userVisitsCount = visits.filter((v) => v.promoter_id === user.id).length;
                const isCurrent = user.id === currentUserId;

                return (
                  <div
                    key={user.id}
                    className="p-4 rounded-xl border border-[#E8D9C8] bg-white shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full bg-[#111111] text-white flex items-center justify-center font-black text-sm shrink-0">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-[#111111] flex items-center gap-1.5">
                            <span>{user.full_name}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">
                                VOCÊ
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-500">{user.email}</p>
                          {user.phone && <p className="text-[11px] text-slate-600">📱 {user.phone}</p>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer ${
                          user.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {user.is_active ? '🟢 Ativo' : '⚪ Inativo'}
                      </button>
                    </div>

                    {/* Role & Tenant info */}
                    <div className="flex flex-wrap items-center gap-2 text-xs bg-[#FDF2E7]/40 p-2.5 rounded-lg border border-[#E8D9C8]/60">
                      {user.role === 'super_admin' && (
                        <span className="text-[10px] font-extrabold bg-slate-800 text-slate-200 px-2 py-0.5 rounded">
                          🛡️ Super Admin
                        </span>
                      )}
                      {user.role === 'promoter' && (
                        <span className="text-[10px] font-extrabold bg-[#FF530D]/15 text-[#FF530D] px-2 py-0.5 rounded">
                          💼 Promotor ({userVisitsCount} visitas)
                        </span>
                      )}
                      {user.role === 'tenant_client' && (
                        <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                          🏢 Contratante: {tenant?.trade_name || 'Geral'}
                        </span>
                      )}
                    </div>

                    {/* Action buttons on mobile */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-1">
                      {(user.role === 'promoter' || user.role === 'super_admin') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPromoterId(user.id);
                            setActiveTab('promoter_performance');
                          }}
                          className="px-2.5 py-1.5 bg-[#FF530D]/10 hover:bg-[#FF530D]/20 text-[#FF530D] rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                          <span>Aproveitamento</span>
                        </button>
                      )}

                      <div className="flex items-center gap-1 ml-auto">
                        {user.phone && (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppCredentials(user)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="WhatsApp"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenPasswordModal(user)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="Senha"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmUser(user)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RELATÓRIO DE APROVEITAMENTO INDIVIDUAL DE CADA PROMOTOR */}
      {/* ========================================================================= */}
      {activeTab === 'promoter_performance' && (
        <div className="space-y-5">
          {/* Controls Bar: Promoter Selector & Period (Hidden in Print) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8D9C8] shadow-xs space-y-3.5 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Promoter Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-[#FF530D]" />
                  <span>Promotor / Corretor de Campo:</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedPromoterId}
                    onChange={(e) => setSelectedPromoterId(e.target.value)}
                    className="w-full appearance-none text-xs sm:text-sm font-bold border border-[#E8D9C8] rounded-xl pl-3 pr-8 py-2.5 bg-[#FDF2E7]/40 text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none cursor-pointer"
                  >
                    {promotersList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.role === 'super_admin' ? 'Super Admin' : 'Promotor'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Period Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Período de Análise:</span>
                </label>
                <div className="relative">
                  <select
                    value={performancePeriod}
                    onChange={(e) => setPerformancePeriod(e.target.value as any)}
                    className="w-full appearance-none text-xs sm:text-sm font-semibold border border-[#E8D9C8] rounded-xl pl-3 pr-8 py-2.5 bg-[#FDF2E7]/40 text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todo o Histórico</option>
                    <option value="current_month">Mês Vigente (Setembro/2026)</option>
                    <option value="last_15_days">Últimos 15 dias</option>
                    <option value="current_week">Semana Atual (Últimos 7 dias)</option>
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Actions: Export PDF & Excel */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportPromoterCsv}
                    className="flex-1 px-3 py-2.5 bg-[#FF530D] hover:bg-[#e04505] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    <span>Baixar Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintPromoterReport}
                    className="flex-1 px-3 py-2.5 bg-[#111111] hover:bg-slate-800 text-[#FDF2E7] text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Printer className="h-4 w-4 shrink-0 text-[#FBBF3D]" />
                    <span>Imprimir PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PRINTABLE DOSSIER CARD */}
          {/* ========================================================= */}
          <div
            id="printable-promoter-dossier"
            className="bg-white rounded-2xl p-4 sm:p-8 border border-[#E8D9C8] shadow-sm space-y-6 print:p-0 print:border-none print:shadow-none print:m-0"
          >
            {/* Header: Institutional + Promoter Info */}
            <div className="border-b-2 border-[#111111] pb-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="shrink-0">
                    <MatchPointLogo variant="horizontal" theme="light" size="md" />
                  </div>
                  <div className="h-10 w-px bg-slate-300 hidden sm:block shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF530D] block">
                      Relatório de Aproveitamento &amp; Performance Individual
                    </span>
                    <h1 className="text-lg sm:text-2xl font-black text-[#111111] tracking-tight">
                      {selectedPromoter?.full_name}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      E-mail: {selectedPromoter?.email} • Tel: {selectedPromoter?.phone || 'Não informado'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-none border-slate-200 text-left sm:text-right text-xs text-slate-600 space-y-0.5 shrink-0">
                  <p className="font-extrabold text-[#111111]">Auditoria Super Admin Master</p>
                  <p className="text-[11px] text-slate-500">Período: {performancePeriod === 'all' ? 'Histórico Completo' : performancePeriod}</p>
                  <p className="text-[11px]">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                  <p className="font-mono text-[11px] text-[#FF530D] font-bold">
                    Protocolo: #PROMOTER-{selectedPromoter?.id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 1: KEY PERFORMANCE INDICATORS (KPIs) */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#FF530D]" />
                <span>1. Indicadores de Produtividade &amp; Conversão</span>
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {/* Visits count */}
                <div className="bg-[#FDF2E7] p-3 sm:p-4 rounded-xl border border-[#E8D9C8] flex flex-col justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Total de Visitas
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[#111111] my-1">
                    {totalVisitsCount}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {uniqueVetsCount} médicos únicos visitados
                  </span>
                </div>

                {/* Receptive Rate */}
                <div className="bg-emerald-50 p-3 sm:p-4 rounded-xl border border-emerald-200 flex flex-col justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Taxa Receptiva
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 my-1">
                    {positiveRate}%
                  </div>
                  <span className="text-[10px] text-emerald-800 font-medium">
                    {positiveReportsCount} feedbacks positivos
                  </span>
                </div>

                {/* Follow-up adherence */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200 flex flex-col justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                    Régua de Follow-up
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-blue-700 my-1">
                    {taskCompletionRate}%
                  </div>
                  <span className="text-[10px] text-blue-800 font-medium">
                    {completedTasksCount} de {promoterTasks.length} tarefas D+7/D+14
                  </span>
                </div>

                {/* Critical alerts */}
                <div className="bg-rose-50 p-3 sm:p-4 rounded-xl border border-rose-200 flex flex-col justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#D90000] uppercase tracking-wider">
                    Alertas Críticos
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[#D90000] my-1">
                    {criticalReportsCount}
                  </div>
                  <span className="text-[10px] text-rose-800 font-medium">
                    {neutralReportsCount} neutros / rotina
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: BRAND REPRESENTATION & SPECIALTY COVERAGE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Brands covered */}
              <div className="p-4 rounded-xl border border-[#E8D9C8] bg-slate-50/70 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[#FF530D]" />
                  <span>Cobertura por Empresa Representada</span>
                </h4>
                <div className="space-y-2">
                  {brandBreakdown.map(({ tenant, count, positive, critical }) => (
                    <div key={tenant.id} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#111111]">{tenant.trade_name}</span>
                        <span className="font-black text-[#FF530D]">{count} apresentações</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Receptividade: <strong className="text-emerald-700">{positive} positivos</strong></span>
                        {critical > 0 && (
                          <span className="text-[#D90000] font-bold">{critical} tratativas</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialties covered */}
              <div className="p-4 rounded-xl border border-[#E8D9C8] bg-slate-50/70 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-[#FF530D]" />
                  <span>Especialidades Médicas Impactadas</span>
                </h4>
                <div className="space-y-2">
                  {specialtyBreakdown.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Nenhuma visita registrada no período.</p>
                  ) : (
                    specialtyBreakdown.slice(0, 5).map(([spec, count]) => (
                      <div key={spec} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#111111] truncate max-w-[200px]">{spec}</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-extrabold text-[11px]">
                          {count} {count === 1 ? 'visita' : 'visitas'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: DETAILED VISITS TABLE & FIELD LOG */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#FF530D]" />
                  <span>3. Histórico Detalhado de Visitas de Campo do Promotor</span>
                </h3>

                {/* Filter chips (Hidden in Print) */}
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    type="button"
                    onClick={() => setSentimentFilter('all')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      sentimentFilter === 'all' ? 'bg-[#111111] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Todos ({promoterReports.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSentimentFilter('positive')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      sentimentFilter === 'positive' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    Positivos ({positiveReportsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSentimentFilter('critical')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      sentimentFilter === 'critical' ? 'bg-[#D90000] text-white' : 'bg-rose-50 text-[#D90000]'
                    }`}
                  >
                    Críticos ({criticalReportsCount})
                  </button>
                </div>
              </div>

              {filteredDetailedReports.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                  Nenhuma visita registrada para este promotor no período selecionado.
                </div>
              ) : (
                <div className="border border-[#E8D9C8] rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#111111] text-white font-bold text-[11px] uppercase tracking-wider">
                        <th className="p-3 whitespace-nowrap">Data</th>
                        <th className="p-3">Médico(a) &amp; CRMV</th>
                        <th className="p-3">Local &amp; Bairro</th>
                        <th className="p-3">Empresa Abordada</th>
                        <th className="p-3 text-center whitespace-nowrap">Sentimento</th>
                        <th className="p-3">Feedback &amp; Observações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8D9C8] text-slate-800">
                      {filteredDetailedReports.map((rep) => {
                        const visit = visits.find((v) => v.id === rep.visit_id);
                        const vet = visit ? vetMap.get(visit.veterinarian_id) : undefined;
                        const tenant = tenantMap.get(rep.tenant_id);
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
                            <td className="p-3 align-top">
                              <span className="font-extrabold text-[#111111] block">{tenant?.trade_name}</span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                                {rep.service_interest || 'Apresentação'}
                              </span>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap align-top">
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
                            <td className="p-3 text-[11px] leading-relaxed text-slate-700 align-top max-w-sm">
                              {rep.observations || 'Sem observações adicionais.'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Disclaimer */}
            <div className="border-t border-[#E8D9C8] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] sm:text-[11px] text-slate-500 gap-2">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[#FF530D] shrink-0" />
                <span>
                  Relatório interno sigiloso para avaliação da diretoria Match Point Promove.
                </span>
              </div>
              <div className="font-medium shrink-0">Página 1 de 1 • Match Point Master</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RANKING & COMPARATIVO DA EQUIPE DE PROMOTORES */}
      {/* ========================================================================= */}
      {activeTab === 'team_ranking' && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8D9C8] shadow-sm space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#111111] flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-600" />
                <span>Quadro Comparativo de Desempenho da Equipe</span>
              </h3>
              <p className="text-xs text-slate-500">
                Comparativo de produtividade, volume de visitas, índice de receptividade e cumprimento de follow-ups entre promotores.
              </p>
            </div>
          </div>

          <div className="border border-[#E8D9C8] rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#111111] text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-3 text-center w-12">Posição</th>
                  <th className="p-3">Promotor / Corretor</th>
                  <th className="p-3 text-center">Visitas Realizadas</th>
                  <th className="p-3 text-center">Vets Únicos</th>
                  <th className="p-3 text-center">Receptividade (%)</th>
                  <th className="p-3 text-center">Alertas Críticos</th>
                  <th className="p-3 text-center">Follow-ups Feitos</th>
                  <th className="p-3 text-center">Última Atividade</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8D9C8] text-slate-800">
                {teamRankingData.map((item, idx) => (
                  <tr key={item.promoter.id} className="hover:bg-[#FDF2E7]/40 transition-colors">
                    <td className="p-3 text-center align-middle font-black text-sm">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </td>
                    <td className="p-3 align-middle">
                      <div className="font-extrabold text-[#111111]">{item.promoter.full_name}</div>
                      <div className="text-[11px] text-slate-500">{item.promoter.email}</div>
                    </td>
                    <td className="p-3 text-center align-middle font-black text-sm text-[#FF530D]">
                      {item.totalVisits}
                    </td>
                    <td className="p-3 text-center align-middle font-bold text-slate-800">
                      {item.uniqueVets}
                    </td>
                    <td className="p-3 text-center align-middle font-extrabold text-emerald-700">
                      {item.positiveRate}%
                    </td>
                    <td className="p-3 text-center align-middle font-bold text-[#D90000]">
                      {item.criticalsCount}
                    </td>
                    <td className="p-3 text-center align-middle text-slate-700">
                      <strong>{item.tasksCompleted}</strong> / {item.totalTasks}
                    </td>
                    <td className="p-3 text-center align-middle text-slate-500 text-[11px]">
                      {item.lastVisitDate
                        ? new Date(item.lastVisitDate + 'T12:00:00Z').toLocaleDateString('pt-BR')
                        : 'Sem visitas'}
                    </td>
                    <td className="p-3 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPromoterId(item.promoter.id);
                          setActiveTab('promoter_performance');
                        }}
                        className="px-3 py-1.5 bg-[#FF530D] hover:bg-[#e04505] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Ver Dossiê
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR USUÁRIO (PROMOTOR, CLIENTE OU ADMIN) */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-[#E8D9C8] shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#FF530D]/10 text-[#FF530D] flex items-center justify-center">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h3 className="text-base font-black text-[#111111]">
                  {editingUser ? 'Editar Dados do Usuário' : 'Cadastrar Novo Usuário / Promotor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-[#D90000] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              {/* Profile / Role Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Perfil de Acesso (Função):</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, role: 'promoter', tenant_id: '' }))}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      formData.role === 'promoter'
                        ? 'bg-[#FF530D]/10 border-[#FF530D] text-[#FF530D] ring-1 ring-[#FF530D]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-xs">💼 Promotor</div>
                    <div className="text-[10px] text-slate-500">Equipe de Campo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        role: 'tenant_client',
                        tenant_id: p.tenant_id || tenants[0]?.id || ''
                      }))
                    }
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      formData.role === 'tenant_client'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-xs">🏢 Contratante</div>
                    <div className="text-[10px] text-slate-500">Portal RLS B2B</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, role: 'super_admin', tenant_id: '' }))}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      formData.role === 'super_admin'
                        ? 'bg-slate-900 border-slate-900 text-white ring-1 ring-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-xs">🛡️ Super Admin</div>
                    <div className="text-[10px] text-slate-400">Match Point Master</div>
                  </button>
                </div>
              </div>

              {/* Tenant vinculation (if tenant_client) */}
              {formData.role === 'tenant_client' && (
                <div className="space-y-1 bg-amber-50/80 p-3 rounded-xl border border-amber-200">
                  <label className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-amber-700" />
                    <span>Empresa Contratante Vinculada (RLS):</span>
                  </label>
                  <select
                    value={formData.tenant_id}
                    onChange={(e) => setFormData((p) => ({ ...p, tenant_id: e.target.value }))}
                    className="w-full text-xs font-bold border border-amber-300 rounded-lg p-2 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  >
                    <option value="">Selecione a empresa...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.trade_name} ({t.segment})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nome Completo:</label>
                <input
                  type="text"
                  placeholder="Ex: Lucas Rocha Mendes"
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                  className="w-full text-xs sm:text-sm font-medium border border-[#E8D9C8] rounded-xl p-2.5 bg-[#FDF2E7]/40 text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  required
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">E-mail de Acesso (Login):</label>
                  <input
                    type="email"
                    placeholder="promotor@matchpoint.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="w-full text-xs sm:text-sm font-medium border border-[#E8D9C8] rounded-xl p-2.5 bg-[#FDF2E7]/40 text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">WhatsApp / Celular:</label>
                  <input
                    type="text"
                    placeholder="(11) 97123-8844"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full text-xs sm:text-sm font-medium border border-[#E8D9C8] rounded-xl p-2.5 bg-[#FDF2E7]/40 text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    {editingUser ? 'Senha do Usuário:' : 'Definir Senha Inicial de Acesso:'}
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] text-[#FF530D] hover:underline font-bold"
                  >
                    Gerar senha aleatória
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordInModal ? 'text' : 'password'}
                    placeholder="Mínimo de 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    className="w-full text-xs sm:text-sm font-medium border border-[#E8D9C8] rounded-xl pl-3 pr-10 py-2.5 bg-[#FDF2E7]/40 text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordInModal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Padrão do sistema: <code className="font-bold text-slate-700">sucesso@2027@</code>
                </p>
              </div>

              {/* Status Switch */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Status da Conta:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                    className="rounded text-[#FF530D] focus:ring-[#FF530D] h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {formData.is_active ? 'Conta Ativa' : 'Conta Inativa (Bloqueada)'}
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#FF530D] hover:bg-[#e04505] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {editingUser ? 'Salvar Alterações' : 'Criar e Liberar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REDEFINIR SENHA RÁPIDA */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && passwordTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#E8D9C8] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-black text-[#111111]">Redefinir Senha de Acesso</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p>
                Usuário: <strong>{passwordTargetUser.full_name}</strong>
              </p>
              <p className="text-[11px] text-slate-600">E-mail: {passwordTargetUser.email}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nova Senha:</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium border border-[#E8D9C8] rounded-xl pl-3 pr-10 py-2.5 bg-[#FDF2E7]/40 text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  placeholder="Nova senha..."
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePasswordReset}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Atualizar Senha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR EXCLUSÃO DE USUÁRIO */}
      {/* ========================================================================= */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-rose-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#D90000]">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="text-base font-black">Confirmar Exclusão</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja remover o usuário <strong>{deleteConfirmUser.full_name}</strong> ({deleteConfirmUser.email})? Esta ação não pode ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-[#D90000] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
