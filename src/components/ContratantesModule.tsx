import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Award,
  Lock,
  Layers,
  Sparkles,
  Users,
  Eye,
  Check,
  X,
  Palette,
  KeyRound,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { Tenant, User } from '../types';
import { StorageService } from '../services/storage';

interface ContratantesModuleProps {
  tenants: Tenant[];
  users: User[];
  onDataChanged: () => void;
  onSelectTenantContext?: (tenantId: string) => void;
}

const BRAND_COLOR_PRESETS = [
  { name: 'Laranja Match Point', hex: '#FF530D' },
  { name: 'Azul Petróleo / Saúde', hex: '#0284C7' },
  { name: 'Verde Esmeralda Clínico', hex: '#059669' },
  { name: 'Roxo Diagnóstico', hex: '#7C3AED' },
  { name: 'Bordeaux Médico', hex: '#9F1239' },
  { name: 'Dourado / Premium', hex: '#D97706' },
  { name: 'Grafite Corporativo', hex: '#334155' }
];

export const ContratantesModule: React.FC<ContratantesModuleProps> = ({
  tenants,
  users,
  onDataChanged,
  onSelectTenantContext
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Quick User Manager for Tenant
  const [managingUsersTenant, setManagingUsersTenant] = useState<Tenant | null>(null);
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');

  // Form State for Tenant
  const [formData, setFormData] = useState({
    company_name: '',
    trade_name: '',
    cnpj: '',
    segment: '',
    color_theme: '#FF530D',
    phone: '',
    email: '',
    website: '',
    whatsapp_emergencies: '',
    address_street: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    cep: '',
    technical_responsible: '',
    technical_crmv: '',
    operating_hours: 'Segunda a Sexta: 08:00 às 18:00 | Plantão 24h para Urgências',
    description: '',
    differential: '',
    services_offered: [] as string[],
    is_active: true
  });

  const [serviceInput, setServiceInput] = useState('');

  // Optional Create Initial Client User during tenant creation
  const [createInitialUser, setCreateInitialUser] = useState(true);
  const [initialUserForm, setInitialUserForm] = useState({
    full_name: '',
    email: '',
    phone: ''
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleOpenCreate = () => {
    setEditingTenant(null);
    setFormData({
      company_name: '',
      trade_name: '',
      cnpj: '',
      segment: 'Diagnóstico por Imagem e Cardiologia Veterinária',
      color_theme: '#FF530D',
      phone: '',
      email: '',
      website: '',
      whatsapp_emergencies: '',
      address_street: '',
      neighborhood: '',
      city: 'São Paulo',
      state: 'SP',
      cep: '',
      technical_responsible: '',
      technical_crmv: '',
      operating_hours: 'Segunda a Sexta: 07:30 às 20:00 | Sábados: 08:00 às 17:00 | Plantão 24h para Urgências',
      description: '',
      differential: '',
      services_offered: [
        'Tomografia Computadorizada Multislice 3D',
        'Ressonância Magnética Veterinária de Alto Campo',
        'Ecocardiograma com Doppler Contínuo e Pulsátil',
        'Ultrassonografia Abdominal com POCUS Beira-Leito',
        'Radiologia Digital Direta (DR)',
        'Eletrocardiograma Digital e Holter 24h'
      ],
      is_active: true
    });
    setInitialUserForm({
      full_name: '',
      email: '',
      phone: ''
    });
    setCreateInitialUser(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      company_name: tenant.company_name || '',
      trade_name: tenant.trade_name || '',
      cnpj: tenant.cnpj || '',
      segment: tenant.segment || '',
      color_theme: tenant.color_theme || '#FF530D',
      phone: tenant.phone || '',
      email: tenant.email || '',
      website: tenant.website || '',
      whatsapp_emergencies: tenant.whatsapp_emergencies || '',
      address_street: tenant.address_street || '',
      neighborhood: tenant.neighborhood || '',
      city: tenant.city || '',
      state: tenant.state || 'SP',
      cep: tenant.cep || '',
      technical_responsible: tenant.technical_responsible || '',
      technical_crmv: tenant.technical_crmv || '',
      operating_hours: tenant.operating_hours || '',
      description: tenant.description || '',
      differential: tenant.differential || '',
      services_offered: tenant.services_offered || [],
      is_active: tenant.is_active
    });
    setIsModalOpen(true);
  };

  const handleAddServiceTag = () => {
    const trimmed = serviceInput.trim();
    if (trimmed && !formData.services_offered.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        services_offered: [...prev.services_offered, trimmed]
      }));
      setServiceInput('');
    }
  };

  const handleRemoveServiceTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      services_offered: prev.services_offered.filter((s) => s !== tag)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trade_name.trim() || !formData.company_name.trim()) {
      alert('Preencha ao menos o Nome Fantasia e a Razão Social da empresa.');
      return;
    }

    if (editingTenant) {
      StorageService.updateTenant(editingTenant.id, formData);
      showToast(`Contratante "${formData.trade_name}" atualizado com sucesso!`);
    } else {
      const created = StorageService.addTenant(formData);

      // Optionally create direct client user
      if (createInitialUser && initialUserForm.email.trim()) {
        StorageService.addUser({
          tenant_id: created.id,
          full_name: initialUserForm.full_name.trim() || `Gestor (${formData.trade_name})`,
          email: initialUserForm.email.trim().toLowerCase(),
          role: 'tenant_client',
          phone: initialUserForm.phone.trim() || formData.phone || formData.whatsapp_emergencies || '',
          is_active: true
        });
      }

      showToast(`Novo Contratante "${formData.trade_name}" cadastrado com sucesso!`);
    }

    setIsModalOpen(false);
    onDataChanged();
  };

  const handleToggleActive = (tenant: Tenant) => {
    StorageService.updateTenant(tenant.id, { is_active: !tenant.is_active });
    showToast(`Status de ${tenant.trade_name} alterado para ${!tenant.is_active ? 'Ativo' : 'Inativo'}.`);
    onDataChanged();
  };

  const handleDeleteTenant = (id: string) => {
    const t = tenants.find((item) => item.id === id);
    StorageService.deleteTenant(id);
    setDeleteConfirmId(null);
    showToast(`Contratante "${t?.trade_name || id}" excluído com sucesso.`);
    onDataChanged();
  };

  const handleCreateTenantUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingUsersTenant || !newUserEmail.trim() || !newUserFullName.trim()) return;

    StorageService.addUser({
      tenant_id: managingUsersTenant.id,
      full_name: newUserFullName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: 'tenant_client',
      phone: newUserPhone.trim(),
      is_active: true
    });

    setNewUserFullName('');
    setNewUserEmail('');
    setNewUserPhone('');
    showToast(`Novo acesso de usuário criado para ${managingUsersTenant.trade_name}! Senha: sucesso@2027@`);
    onDataChanged();
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    StorageService.deleteUser(userId);
    showToast(`Usuário "${userName}" removido com sucesso.`);
    onDataChanged();
  };

  // Filtered List
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.cnpj && t.cnpj.includes(searchTerm)) ||
      (t.segment && t.segment.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.city && t.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && t.is_active) ||
      (statusFilter === 'INACTIVE' && !t.is_active);

    return matchesSearch && matchesStatus;
  });

  const totalTenants = tenants.length;
  const activeTenantsCount = tenants.filter((t) => t.is_active).length;
  const clientUsersCount = users.filter((u) => u.role === 'tenant_client').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8D9C8] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8D9C8]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF530D]">
              <Lock className="h-4 w-4" />
              <span>Painel Super Admin Master • Match Point Promove</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Gestão & Cadastro de Contratantes Representados
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Cadastre e gerencie as clínicas, hospitais veterinários e centros de diagnóstico atendidos pela promotoria.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-3 bg-[#FF530D] hover:bg-[#E04505] text-white rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer transform active:scale-95"
            >
              <Plus className="h-5 w-5" />
              <span>Novo Contratante</span>
            </button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FDF2E7]/70 p-5 rounded-2xl border border-[#E8D9C8] space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF530D]">
              Empresas Representadas
            </span>
            <div className="text-3xl font-black text-[#111111]">{totalTenants}</div>
            <p className="text-xs text-slate-500">Contratantes cadastrados na base</p>
          </div>

          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Contratantes Ativos
            </span>
            <div className="text-3xl font-black text-emerald-800">{activeTenantsCount}</div>
            <p className="text-xs text-emerald-700 font-medium">Disponíveis no check-in de campo</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Contas de Clientes / Diretores
            </span>
            <div className="text-3xl font-black text-[#111111]">{clientUsersCount}</div>
            <p className="text-xs text-slate-500">Acessos com segregação RLS ativa</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8D9C8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nome Fantasia, Razão Social, CNPJ ou Cidade..."
            className="w-full pl-9 pr-4 py-2 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-600 shrink-0">Status:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-[#111111] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({totalTenants})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            🟢 Ativos ({activeTenantsCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'INACTIVE'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            🔴 Inativos ({totalTenants - activeTenantsCount})
          </button>
        </div>
      </div>

      {/* Tenants Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#FF530D]" />
            <span>Lista de Contratantes Cadastrados ({filteredTenants.length})</span>
          </h3>
        </div>

        {filteredTenants.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E8D9C8] space-y-3">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">Nenhum contratante encontrado</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Nenhuma empresa corresponde aos critérios de pesquisa ou não há contratantes cadastrados.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-[#FF530D] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 mt-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar Primeiro Contratante</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTenants.map((tenant) => {
              const tenantUsers = users.filter((u) => u.tenant_id === tenant.id);

              return (
                <div
                  key={tenant.id}
                  className={`bg-white rounded-3xl p-6 border transition-all hover:shadow-md space-y-5 flex flex-col justify-between ${
                    tenant.is_active ? 'border-[#E8D9C8]' : 'border-slate-300 bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div
                          className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-sm shrink-0"
                          style={{ backgroundColor: tenant.color_theme || '#FF530D' }}
                        >
                          {tenant.trade_name.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-base text-[#111111]">
                              {tenant.trade_name}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                tenant.is_active
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {tenant.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {tenant.company_name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                            <span>CNPJ: {tenant.cnpj || 'Não informado'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Theme color badge */}
                      <div
                        className="h-6 w-6 rounded-full border-2 border-white shadow-xs shrink-0"
                        style={{ backgroundColor: tenant.color_theme || '#FF530D' }}
                        title={`Cor da Marca: ${tenant.color_theme}`}
                      />
                    </div>

                    {/* Segment & Specialty */}
                    <div className="bg-[#FDF2E7]/60 p-3 rounded-2xl border border-[#E8D9C8] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#FF530D] block">
                        Segmento de Atuação
                      </span>
                      <p className="text-xs font-bold text-[#111111]">
                        {tenant.segment || 'Diagnóstico e Especialidades Veterinárias'}
                      </p>
                    </div>

                    {/* Technical & Operational Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-[#FF530D] shrink-0" />
                        <span>
                          <strong>RT:</strong> {tenant.technical_responsible || 'Não informado'}{' '}
                          {tenant.technical_crmv ? `(${tenant.technical_crmv})` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Plantão 24h:</strong> {tenant.whatsapp_emergencies || tenant.phone || 'Não informado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>
                          {tenant.address_street
                            ? `${tenant.address_street}, ${tenant.neighborhood || ''} - ${tenant.city}/${tenant.state}`
                            : 'Endereço não cadastrado'}
                        </span>
                      </div>
                    </div>

                    {/* Services Tags */}
                    {tenant.services_offered && tenant.services_offered.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          Catálogo de Serviços ({tenant.services_offered.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {tenant.services_offered.slice(0, 4).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                            >
                              {s}
                            </span>
                          ))}
                          {tenant.services_offered.length > 4 && (
                            <span className="px-2 py-0.5 rounded-lg bg-[#FDF2E7] text-[#FF530D] text-[11px] font-bold">
                              +{tenant.services_offered.length - 4} serviços
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Associated User Logins */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>Contas de Acesso do Cliente: <strong>{tenantUsers.length}</strong></span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setManagingUsersTenant(tenant)}
                        className="text-xs font-bold text-[#FF530D] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Gerenciar Acessos</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(tenant)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          tenant.is_active
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {tenant.is_active ? 'Desativar' : 'Ativar Contratante'}
                      </button>

                      {onSelectTenantContext && (
                        <button
                          type="button"
                          onClick={() => onSelectTenantContext(tenant.id)}
                          className="px-3 py-1.5 bg-[#FDF2E7] hover:bg-[#E8D9C8] text-[#FF530D] rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Simular visualização deste contratante no Portal RLS"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Ver Portal RLS</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tenant)}
                        className="px-3 py-1.5 bg-[#111111] hover:bg-[#222222] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-[#FF530D]" />
                        <span>Editar</span>
                      </button>

                      {deleteConfirmId === tenant.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                          <button
                            type="button"
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="px-2 py-1 bg-[#D90000] text-white rounded-lg text-xs font-black cursor-pointer hover:bg-red-800"
                          >
                            Confirmar Exclusão
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-1 text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(tenant.id)}
                          className="p-2 text-slate-400 hover:text-[#D90000] hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Excluir contratante"
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CADASTRO / EDIÇÃO COMPLETA DO CONTRATANTE                          */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#E8D9C8] shadow-2xl space-y-6 p-6 sm:p-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8D9C8]">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-xl"
                  style={{ backgroundColor: formData.color_theme || '#FF530D' }}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#111111]">
                    {editingTenant ? `Editar: ${editingTenant.trade_name}` : 'Cadastrar Novo Contratante'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Preencha os dados oficiais, operacionais e de contato da clínica ou laboratório.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Identificação */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#FF530D] flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>1. Identificação Empresarial & Marca</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Nome Fantasia (Exibição) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.trade_name}
                      onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                      placeholder="Ex: Mova Diagnósticos"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Razão Social Completa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Ex: Mova Diagnósticos Veterinários Ltda"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="Ex: 34.892.110/0001-45"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Segmento de Atuação
                    </label>
                    <input
                      type="text"
                      value={formData.segment}
                      onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                      placeholder="Ex: Diagnóstico por Imagem e Cardiologia Veterinária"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Color Theme Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Identidade Visual / Cor da Marca no Sistema
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {BRAND_COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, color_theme: preset.hex })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                          formData.color_theme === preset.hex
                            ? 'border-[#111111] bg-slate-100 shadow-xs ring-2 ring-[#FF530D]'
                            : 'border-[#E8D9C8] bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                    <input
                      type="color"
                      value={formData.color_theme}
                      onChange={(e) => setFormData({ ...formData, color_theme: e.target.value })}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-[#E8D9C8]"
                      title="Personalizar código HEX"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Corpo Técnico e Plantão */}
              <div className="space-y-4 pt-4 border-t border-[#E8D9C8]">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#FF530D] flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>2. Responsabilidade Técnica & Plantão de Urgências</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Responsável Técnico (Nome)
                    </label>
                    <input
                      type="text"
                      value={formData.technical_responsible}
                      onChange={(e) => setFormData({ ...formData, technical_responsible: e.target.value })}
                      placeholder="Ex: Dr. Roberto Almeida"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      CRMV do Responsável Técnico
                    </label>
                    <input
                      type="text"
                      value={formData.technical_crmv}
                      onChange={(e) => setFormData({ ...formData, technical_crmv: e.target.value })}
                      placeholder="Ex: CRMV-SP 18.940"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      WhatsApp VIP para Urgências / Emergências (Plantão 24h)
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp_emergencies}
                      onChange={(e) => setFormData({ ...formData, whatsapp_emergencies: e.target.value })}
                      placeholder="Ex: (11) 98822-4411"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Horários de Atendimento & Plantão
                    </label>
                    <input
                      type="text"
                      value={formData.operating_hours}
                      onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                      placeholder="Ex: Seg a Sex: 07:30 às 20:00 | Sáb: 08:00 às 17:00 | Plantão 24h"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Endereço & Contato Geral */}
              <div className="space-y-4 pt-4 border-t border-[#E8D9C8]">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#FF530D] flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>3. Localização & Contato Institucional</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Endereço / Logradouro
                    </label>
                    <input
                      type="text"
                      value={formData.address_street}
                      onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                      placeholder="Ex: Av. Brigadeiro Luís Antônio, 3421"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Ex: Jardim Paulista"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Ex: São Paulo"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Estado (UF)
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Ex: SP"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      placeholder="Ex: 01401-001"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Telefone Fixo / Central
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ex: (11) 3195-8800"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      E-mail Institucional
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Ex: contato@movadiagnosticos.com.br"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Website / Portal Online
                    </label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="Ex: https://movadiagnosticos.com.br"
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Catálogo de Serviços */}
              <div className="space-y-4 pt-4 border-t border-[#E8D9C8]">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#FF530D] flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span>4. Catálogo de Exames & Serviços Oferecidos</span>
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddServiceTag();
                      }
                    }}
                    placeholder="Adicionar exame ou especialidade (Ex: Ressonância Magnética, Ecocardiograma Doppler, etc.)"
                    className="flex-1 px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddServiceTag}
                    className="px-4 py-2.5 bg-[#111111] text-white rounded-xl text-xs font-bold hover:bg-[#222222] cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.services_offered.map((srv, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white border border-[#E8D9C8] rounded-xl text-xs font-bold text-[#111111] flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{srv}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveServiceTag(srv)}
                        className="text-slate-400 hover:text-[#D90000] cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Section 5: Diferenciais & Apresentação */}
              <div className="space-y-4 pt-4 border-t border-[#E8D9C8]">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#FF530D] flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>5. Descrição Institucional & Diferenciais de Mercado</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Apresentação / Sobre o Centro Diagnóstico
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Centro de referência em diagnóstico por imagem de alta complexidade..."
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Diferenciais Técnicos e Comerciais
                    </label>
                    <textarea
                      rows={2}
                      value={formData.differential}
                      onChange={(e) => setFormData({ ...formData, differential: e.target.value })}
                      placeholder="Ex: Laudos express em até 2 horas, visualizador PACS em nuvem para o clínico solicitante..."
                      className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6 (Only on Create): Create Initial Login */}
              {!editingTenant && (
                <div className="space-y-4 pt-4 border-t border-[#E8D9C8] bg-[#FDF2E7]/40 p-4 rounded-2xl border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#111111] flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#FF530D]" />
                      <span>Criar Acesso de Login Inicial para o Diretor / Gestor</span>
                    </h4>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createInitialUser}
                        onChange={(e) => setCreateInitialUser(e.target.checked)}
                        className="rounded border-[#E8D9C8] text-[#FF530D] focus:ring-[#FF530D]"
                      />
                      <span>Criar login agora</span>
                    </label>
                  </div>

                  {createInitialUser && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Nome do Gestor
                        </label>
                        <input
                          type="text"
                          value={initialUserForm.full_name}
                          onChange={(e) => setInitialUserForm({ ...initialUserForm, full_name: e.target.value })}
                          placeholder="Ex: Dr. Roberto Almeida"
                          className="w-full px-3 py-2 bg-white border border-[#E8D9C8] rounded-xl text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          E-mail de Login
                        </label>
                        <input
                          type="email"
                          value={initialUserForm.email}
                          onChange={(e) => setInitialUserForm({ ...initialUserForm, email: e.target.value })}
                          placeholder="Ex: diretoria@movadiagnosticos.com.br"
                          className="w-full px-3 py-2 bg-white border border-[#E8D9C8] rounded-xl text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Telefone / WhatsApp
                        </label>
                        <input
                          type="text"
                          value={initialUserForm.phone}
                          onChange={(e) => setInitialUserForm({ ...initialUserForm, phone: e.target.value })}
                          placeholder="Ex: (11) 98822-4411"
                          className="w-full px-3 py-2 bg-white border border-[#E8D9C8] rounded-xl text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#E8D9C8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF530D] hover:bg-[#E04505] text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer"
                >
                  {editingTenant ? 'Salvar Alterações' : 'Concluir Cadastro do Contratante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GERENCIAR CONTAS DE ACESSO DO CONTRATANTE                          */}
      {/* ========================================================================= */}
      {managingUsersTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E8D9C8] shadow-2xl space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8D9C8]">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-xl"
                  style={{ backgroundColor: managingUsersTenant.color_theme || '#FF530D' }}
                >
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#111111]">
                    Acessos: {managingUsersTenant.trade_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gerencie os usuários do cliente autorizados a acessar o Portal RLS.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingUsersTenant(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List of current users for this tenant */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Usuários Autorizados no Portal RLS
              </span>

              {users.filter((u) => u.tenant_id === managingUsersTenant.id).length === 0 ? (
                <div className="bg-slate-50 p-4 rounded-2xl text-center text-xs text-slate-500 border border-slate-200">
                  Nenhum usuário cadastrado para este contratante ainda. Crie um novo acesso abaixo.
                </div>
              ) : (
                <div className="space-y-2">
                  {users
                    .filter((u) => u.tenant_id === managingUsersTenant.id)
                    .map((usr) => (
                      <div
                        key={usr.id}
                        className="bg-white p-3.5 rounded-2xl border border-[#E8D9C8] flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#FDF2E7] text-[#FF530D] font-black text-xs flex items-center justify-center border border-[#E8D9C8]">
                            {usr.full_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-xs text-[#111111]">
                              {usr.full_name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {usr.email} {usr.phone ? `• ${usr.phone}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Senha padrão: sucesso@2027@
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(usr.id, usr.full_name)}
                            className="p-1.5 text-slate-400 hover:text-[#D90000] hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Remover acesso"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Create New User Form */}
            <form onSubmit={handleCreateTenantUser} className="space-y-3 pt-4 border-t border-[#E8D9C8] bg-[#FDF2E7]/40 p-4 rounded-2xl border">
              <span className="text-xs font-black uppercase tracking-wider text-[#FF530D] block">
                Criar Novo Acesso para Diretor / Gestor
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                    placeholder="Ex: Dra. Mariana Costa"
                    className="w-full px-3 py-2 bg-white border border-[#E8D9C8] rounded-xl text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    E-mail de Login *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Ex: mariana@movadiagnosticos.com.br"
                    className="w-full px-3 py-2 bg-white border border-[#E8D9C8] rounded-xl text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="Ex: (11) 99182-3344"
                    className="w-full px-3 py-2 bg-white border border-[#E8D9C8] rounded-xl text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF530D] hover:bg-[#E04505] text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Cadastrar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
