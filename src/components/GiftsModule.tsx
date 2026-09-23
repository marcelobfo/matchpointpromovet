import React, { useState, useEffect } from 'react';
import { Gift, GiftLog, Veterinarian, User } from '../types';
import { StorageService } from '../services/storage';
import { 
  Gift as GiftIcon, 
  Plus, 
  Minus, 
  Trash2, 
  History, 
  Package, 
  AlertTriangle, 
  Sparkles, 
  X,
  Search,
  Filter,
  UserCheck,
  MapPin
} from 'lucide-react';

interface GiftsModuleProps {
  vets: Veterinarian[];
  users: User[];
}

export const GiftsModule: React.FC<GiftsModuleProps> = ({ vets, users }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'logs'>('catalog');
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [logs, setLogs] = useState<GiftLog[]>([]);
  
  // Search & Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal States
  const [isAddGiftModalOpen, setIsAddGiftModalOpen] = useState(false);
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  
  // Form States
  const [newGiftForm, setNewGiftForm] = useState({
    name: '',
    description: '',
    stock: 50,
    type: 'institucional' as Gift['type']
  });

  const [distributionForm, setDistributionForm] = useState({
    gift_id: '',
    veterinarian_id: '',
    promoter_id: '',
    quantity: 1,
    notes: ''
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setGifts(StorageService.getGifts());
    setLogs(StorageService.getGiftLogs());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Create Gift
  const handleCreateGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGiftForm.name.trim()) return;

    const currentGifts = StorageService.getGifts();
    const createdGift: Gift = {
      id: `gift-${Date.now()}`,
      name: newGiftForm.name.trim(),
      description: newGiftForm.description.trim() || 'Sem descrição cadastrada.',
      stock: Number(newGiftForm.stock) || 0,
      type: newGiftForm.type
    };

    const updated = [createdGift, ...currentGifts];
    StorageService.saveGifts(updated);
    setGifts(updated);
    setIsAddGiftModalOpen(false);
    setNewGiftForm({ name: '', description: '', stock: 50, type: 'institucional' });
    showToast(`Brinde "${createdGift.name}" criado com sucesso!`);
  };

  // Adjust Stock
  const handleAdjustStock = (id: string, amount: number) => {
    const updated = gifts.map((g) => {
      if (g.id === id) {
        const nextStock = Math.max(0, g.stock + amount);
        return { ...g, stock: nextStock };
      }
      return g;
    });
    StorageService.saveGifts(updated);
    setGifts(updated);
    showToast('Estoque ajustado com sucesso.');
  };

  // Delete Gift
  const handleDeleteGift = (id: string) => {
    const giftName = gifts.find((g) => g.id === id)?.name;
    const updated = gifts.filter((g) => g.id !== id);
    StorageService.saveGifts(updated);
    setGifts(updated);
    showToast(`Brinde "${giftName || id}" removido.`);
  };

  // Deliver/Distribute Gift Manually
  const handleDistributeGift = (e: React.FormEvent) => {
    e.preventDefault();
    const { gift_id, veterinarian_id, promoter_id, quantity, notes } = distributionForm;
    if (!gift_id || !veterinarian_id || !promoter_id) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const selectedGift = gifts.find((g) => g.id === gift_id);
    const selectedVet = vets.find((v) => v.id === veterinarian_id);
    const selectedPromoter = users.find((u) => u.id === promoter_id);

    if (!selectedGift || !selectedVet || !selectedPromoter) return;

    if (selectedGift.stock < quantity) {
      alert(`Quantidade insuficiente em estoque. Disponível: ${selectedGift.stock} unidades.`);
      return;
    }

    StorageService.addGiftLog({
      gift_id,
      gift_name: selectedGift.name,
      veterinarian_id,
      veterinarian_name: selectedVet.full_name,
      promoter_id,
      promoter_name: selectedPromoter.full_name,
      quantity,
      notes: notes.trim() || undefined
    });

    loadData();
    setIsDistributeModalOpen(false);
    setDistributionForm({ gift_id: '', veterinarian_id: '', promoter_id: '', quantity: 1, notes: '' });
    showToast(`Entrega de ${quantity}x "${selectedGift.name}" registrada com sucesso!`);
  };

  // Stats Counters
  const totalGiftsCount = gifts.length;
  const totalDistributedGifts = logs.reduce((sum, item) => sum + item.quantity, 0);
  const criticalStockCount = gifts.filter((g) => g.stock < 10).length;

  // Filter Catalog
  const filteredGifts = gifts.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                          g.description.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesType = typeFilter === 'ALL' || g.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Filter Logs
  const filteredLogs = logs.filter((l) => {
    return l.gift_name.toLowerCase().includes(logSearch.toLowerCase()) || 
           l.veterinarian_name.toLowerCase().includes(logSearch.toLowerCase()) || 
           l.promoter_name.toLowerCase().includes(logSearch.toLowerCase());
  });

  const getTypeName = (type: Gift['type']) => {
    switch (type) {
      case 'fidelidade': return '🌟 Fidelidade';
      case 'institucional': return '🏢 Institucional';
      case 'campanha': return '🔥 Campanha';
      default: return '🎁 Outro';
    }
  };

  const getTypeBadgeColor = (type: Gift['type']) => {
    switch (type) {
      case 'fidelidade': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'institucional': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'campanha': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#111111] text-[#FDF2E7] px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-xl border border-[#E8D9C8] flex items-center gap-2 animate-fadeIn">
          <Sparkles className="h-4 w-4 text-[#FF530D]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Title */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8D9C8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-[#111111] flex items-center gap-2">
            <GiftIcon className="h-6 w-6 text-[#FF530D]" />
            Gerenciamento de Brindes & Mimos 🎁
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Gerencie o estoque de amostras, brindes institucionais e acompanhe a distribuição realizada pelos promotores.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddGiftModalOpen(true)}
            className="px-4 py-2 bg-[#FF530D] hover:bg-[#E04505] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Novo Brinde
          </button>
          <button
            type="button"
            onClick={() => setIsDistributeModalOpen(true)}
            className="px-4 py-2 bg-[#111111] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <UserCheck className="h-4 w-4 text-[#FF530D]" />
            Registrar Entrega
          </button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Brindes */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8D9C8] shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-600 shrink-0">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Catálogo de Brindes</span>
            <div className="text-2xl font-black text-[#111111]">{totalGiftsCount} itens</div>
            <p className="text-[10px] text-slate-500 font-medium">Modelos cadastrados em estoque</p>
          </div>
        </div>

        {/* Total Entregues */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8D9C8] shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600 shrink-0">
            <History className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Mimos Distribuídos</span>
            <div className="text-2xl font-black text-[#111111]">{totalDistributedGifts} unidades</div>
            <p className="text-[10px] text-slate-500 font-medium">Entregas registradas em campo</p>
          </div>
        </div>

        {/* Estoque Crítico */}
        <div className={`p-5 rounded-2xl border shadow-xs flex items-center gap-4 transition-all ${
          criticalStockCount > 0 
            ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
            : 'bg-white border-[#E8D9C8]'
        }`}>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
            criticalStockCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-500'
          }`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estoque Crítico (&lt; 10)</span>
            <div className={`text-2xl font-black ${criticalStockCount > 0 ? 'text-rose-600' : 'text-[#111111]'}`}>
              {criticalStockCount} alertas
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Necessitam reposição imediata</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[#E8D9C8]">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`px-5 py-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-[#FF530D] text-[#FF530D]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="h-4 w-4" />
          Estoque &amp; Catálogo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-5 py-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-[#FF530D] text-[#FF530D]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          Registro de Entregas ({logs.length})
        </button>
      </div>

      {/* TAB CONTENT: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8D9C8] shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Buscar brinde ou descrição..."
                className="w-full pl-9 pr-4 py-2 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors ${
                  typeFilter === 'ALL' ? 'bg-[#111111] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('institucional')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors ${
                  typeFilter === 'institucional' ? 'bg-[#FF530D] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                🏢 Institucional
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('fidelidade')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors ${
                  typeFilter === 'fidelidade' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                🌟 Fidelidade
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('campanha')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors ${
                  typeFilter === 'campanha' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                🔥 Campanha
              </button>
            </div>
          </div>

          {filteredGifts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E8D9C8] space-y-3">
              <Package className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">Nenhum brinde correspondente</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Adicione novos brindes usando o botão "Novo Brinde" no cabeçalho ou refine sua busca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGifts.map((gift) => (
                <div key={gift.id} className="bg-white rounded-2xl border border-[#E8D9C8] p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
                  
                  {/* Stock Critical Indicator Bar */}
                  {gift.stock < 10 && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
                  )}

                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getTypeBadgeColor(gift.type)}`}>
                        {getTypeName(gift.type)}
                      </span>
                      {gift.stock < 10 && (
                        <span className="flex items-center gap-1 text-[10px] text-rose-600 font-extrabold uppercase animate-pulse">
                          <AlertTriangle className="h-3 w-3" /> Estoque Crítico
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-[#111111] text-sm sm:text-base tracking-tight leading-snug">
                      {gift.name}
                    </h3>

                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {gift.description}
                    </p>
                  </div>

                  {/* Stock Action Bar */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Disponível</span>
                      <span className={`text-base font-black ${gift.stock < 10 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {gift.stock} {gift.stock === 1 ? 'unidade' : 'unidades'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(gift.id, -1)}
                        title="Diminuir Estoque"
                        className="h-8 w-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center cursor-pointer active:scale-90 transition-all border border-slate-200"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(gift.id, 1)}
                        title="Aumentar Estoque"
                        className="h-8 w-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center cursor-pointer active:scale-90 transition-all border border-slate-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir o brinde "${gift.name}"?`)) {
                            handleDeleteGift(gift.id);
                          }
                        }}
                        title="Excluir"
                        className="h-8 w-8 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center cursor-pointer active:scale-90 transition-all border border-rose-150"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Search Logs */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8D9C8] shadow-xs flex items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Buscar por brinde, veterinário ou promotor..."
                className="w-full pl-9 pr-4 py-2 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:bg-white focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold hidden sm:block">
              Total de {filteredLogs.length} entregas catalogadas
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E8D9C8] space-y-3">
              <History className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">Nenhuma entrega registrada</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Não há registro de entregas correspondente à busca ou ainda não houve distribuições.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8D9C8] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-[#FDF2E7]/30 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Brinde Entregue</th>
                      <th className="py-3.5 px-4">Veterinário Beneficiado</th>
                      <th className="py-3.5 px-4">Entregue Por (Promotor)</th>
                      <th className="py-3.5 px-4">Data &amp; Hora</th>
                      <th className="py-3.5 px-4">Quant.</th>
                      <th className="py-3.5 px-4">Observações / Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-[#111111] flex items-center gap-2">
                            <span className="p-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                              <GiftIcon className="h-3.5 w-3.5" />
                            </span>
                            {log.gift_name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700 flex items-center gap-1.5 mt-2.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{log.veterinarian_name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">
                          {log.promoter_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {new Date(log.distributed_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-800">
                          {log.quantity}x
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">
                          {log.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD NEW GIFT */}
      {isAddGiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-[#111111] text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-[#FF530D]" />
                Cadastrar Novo Brinde no Estoque
              </h3>
              <button
                type="button"
                onClick={() => setIsAddGiftModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGift} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Brinde *</label>
                <input
                  type="text"
                  required
                  value={newGiftForm.name}
                  onChange={(e) => setNewGiftForm({ ...newGiftForm, name: e.target.value })}
                  placeholder="Ex: Garrafa de Alumínio 500ml"
                  className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tipo / Categoria *</label>
                <select
                  value={newGiftForm.type}
                  onChange={(e) => setNewGiftForm({ ...newGiftForm, type: e.target.value as Gift['type'] })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none cursor-pointer"
                >
                  <option value="institucional">🏢 Institucional (Uso Geral)</option>
                  <option value="fidelidade">🌟 Fidelidade (Para Médicos Indicadores)</option>
                  <option value="campanha">🔥 Campanha (Ações específicas)</option>
                  <option value="outro">🎁 Outro</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Quantidade em Estoque Inicial *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newGiftForm.stock}
                  onChange={(e) => setNewGiftForm({ ...newGiftForm, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Descrição / Finalidade</label>
                <textarea
                  rows={3}
                  value={newGiftForm.description}
                  onChange={(e) => setNewGiftForm({ ...newGiftForm, description: e.target.value })}
                  placeholder="Ex: Entregue para os médicos nas visitas do mês da campanha de cardiologia veterinária."
                  className="w-full p-3.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGiftModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#FF530D] hover:bg-[#E04505] text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cadastrar Brinde
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL DISTRIBUTION */}
      {isDistributeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-[#111111] text-base flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#FF530D]" />
                Registrar Entrega de Brinde
              </h3>
              <button
                type="button"
                onClick={() => setIsDistributeModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDistributeGift} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Selecione o Brinde *</label>
                <select
                  required
                  value={distributionForm.gift_id}
                  onChange={(e) => setDistributionForm({ ...distributionForm, gift_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none cursor-pointer"
                >
                  <option value="">-- Selecione o item --</option>
                  {gifts.map((g) => (
                    <option key={g.id} value={g.id} disabled={g.stock <= 0}>
                      {g.name} (Disponível: {g.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Veterinário Destinatário *</label>
                <select
                  required
                  value={distributionForm.veterinarian_id}
                  onChange={(e) => setDistributionForm({ ...distributionForm, veterinarian_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none cursor-pointer"
                >
                  <option value="">-- Selecione o Médico Veterinário --</option>
                  {vets.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.full_name} ({v.clinic_name || 'Autônomo'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Entregue Por (Promotor de Campo) *</label>
                <select
                  required
                  value={distributionForm.promoter_id}
                  onChange={(e) => setDistributionForm({ ...distributionForm, promoter_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none cursor-pointer"
                >
                  <option value="">-- Selecione o Promotor --</option>
                  {users
                    .filter((u) => u.role === 'promoter' || u.role === 'super_admin')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role === 'super_admin' ? 'Coordenador/Admin' : 'Promotor'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Quantidade *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={distributionForm.quantity}
                  onChange={(e) => setDistributionForm({ ...distributionForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notas / Motivo da Entrega</label>
                <textarea
                  rows={2}
                  value={distributionForm.notes}
                  onChange={(e) => setDistributionForm({ ...distributionForm, notes: e.target.value })}
                  placeholder="Ex: Entrega de boas-vindas à nova campanha de ecocardiografia."
                  className="w-full p-3.5 bg-[#FDF2E7]/40 border border-[#E8D9C8] rounded-xl text-xs sm:text-sm font-semibold text-[#111111] focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDistributeModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#111111] hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  Registrar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
