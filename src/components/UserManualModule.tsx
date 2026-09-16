import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Presentation,
  Printer,
  Download,
  Search,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Smartphone,
  Building2,
  Users,
  Calendar,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Eye,
  Send,
  Lock,
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  Cake,
  Sparkles,
  WifiOff,
  Database,
  Cpu,
  HelpCircle,
  Maximize2,
  Minimize2,
  FileText
} from 'lucide-react';
import { UserRole } from '../types';

interface UserManualModuleProps {
  currentUserRole: UserRole;
}

export const UserManualModule: React.FC<UserManualModuleProps> = ({ currentUserRole }) => {
  const [viewMode, setViewMode] = useState<'document' | 'presentation'>('document');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'promoter' | 'tenant' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChapter, setActiveChapter] = useState<string>('cap-1');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard navigation for presentation slides
  useEffect(() => {
    if (viewMode !== 'presentation') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, isFullscreen]);

  const handlePrint = () => {
    window.print();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Presentation Slides Data
  const slides = [
    {
      id: 1,
      tag: 'Apresentação Geral',
      title: 'Manual de Uso & Treinamento da Plataforma',
      subtitle: 'Match Point Promove • Inteligência de Campo B2B & Representação Multi-Marcas',
      bullets: [
        'Plataforma PWA Offline-First para promotores de campo e propagandistas veterinários.',
        'Isolamento completo de dados por Row-Level Security (RLS) para clientes contratantes.',
        'Régua de relacionamento automatizada com disparos via WhatsApp (+7d, +14d, Aniversários).',
        'Exportação executiva de relatórios oficiais em PDF e planilhas em Excel .csv.'
      ],
      roleBadge: 'Todos os Usuários',
      accentColor: '#FF530D',
      icon: Layers
    },
    {
      id: 2,
      tag: 'Arquitetura & Segurança',
      title: 'Arquitetura Multi-Tenant & Segregação RLS',
      subtitle: 'Como a Match Point garante 100% de confidencialidade entre empresas concorrentes',
      bullets: [
        'Multi-Tenant Seguro: Múltiplos contratantes utilizam a mesma equipe de campo sem vazamento de dados.',
        'Row-Level Security (RLS): Cada cliente só enxerga médicos visitados com seus próprios produtos/serviços.',
        'Visita Multi-Marcas: O promotor realiza 1 único check-in físico e gera relatórios separados por contratante.',
        'Auditoria & Rastreabilidade: Histórico detalhado de datas, sentimentos e promotores responsáveis.'
      ],
      roleBadge: 'Segurança & Compliance',
      accentColor: '#111111',
      icon: ShieldCheck
    },
    {
      id: 3,
      tag: 'Perfil Promotor de Campo',
      title: 'Módulo de Campo: Check-in & Dossiê 360°',
      subtitle: 'Fluxo ágil para o promotor durante visitas clínicas presenciais',
      bullets: [
        'Localização Rápida: Busca de médicos veterinários por Nome, CRMV, Bairro ou Clínica.',
        'Check-in Simultâneo: Seleção das marcas abordadas e anotações específicas por representada.',
        'Sentimento do Médico: Classificação imediata em Positivo, Neutro ou Reclamação Crítica.',
        'Dossiê 360°: Consulta instantânea do histórico anterior de visitas e agendamento de retorno.'
      ],
      roleBadge: 'Perfil Promotor',
      accentColor: '#10B981',
      icon: Smartphone
    },
    {
      id: 4,
      tag: 'Perfil Promotor de Campo',
      title: 'Régua de Follow-up & Relacionamento',
      subtitle: 'Automação inteligente para manter a lembrança da marca aquecida',
      bullets: [
        'Follow-up 1ª Abordagem (+7 dias): Mensagem técnica de reforço com 1 clique no WhatsApp.',
        'Follow-up 2ª Abordagem (+14 dias): Mensagem de consolidação e oferta de suporte.',
        'Radar de Aniversariantes: Identificação automática de aniversários no mês e felicitações personalizadas.',
        'Tratativas Críticas Imediatas: Alertas destacados para resolução de feedbacks negativos.'
      ],
      roleBadge: 'Perfil Promotor',
      accentColor: '#FBBF3D',
      icon: Calendar
    },
    {
      id: 5,
      tag: 'Perfil Cliente Contratante',
      title: 'Portal do Contratante (Visão RLS)',
      subtitle: 'Transparência total dos resultados da equipe de campo em tempo real',
      bullets: [
        'Dashboard Exclusivo: Volume de visitas recebidas, sentimento médio e médicos impactados.',
        'Feedbacks Detalhados: Acesso às anotações técnicas e percepções dos veterinários sobre seu catálogo.',
        'Filtros Inteligentes: Pesquise por período, sentimento ou médico específico.',
        'Ficha Cadastral da Empresa: Atualização de dados da representação e contatos comerciais.'
      ],
      roleBadge: 'Perfil Contratante',
      accentColor: '#2563EB',
      icon: Building2
    },
    {
      id: 6,
      tag: 'Perfil Cliente Contratante & Gestão',
      title: 'Exportação de Relatórios Oficiais & BI',
      subtitle: 'Geração de documentos em PDF para reuniões e Excel para análise interna',
      bullets: [
        'Relatório Executivo em PDF: Documento formal diagramado pronto para impressão e auditoria.',
        'Planilha Excel (.csv): Base de dados completa para importação em PowerBI ou CRM corporativo.',
        'Resumo de Sentimentos: Gráfico consolidado com percentual de aprovação de campo.',
        'Exportação Personalizada: Filtro por data e contratante antes de gerar o download.'
      ],
      roleBadge: 'Gestão & Contratante',
      accentColor: '#FF530D',
      icon: FileSpreadsheet
    },
    {
      id: 7,
      tag: 'Perfil Super Admin',
      title: 'Painel do Gestor Master (Match Point)',
      subtitle: 'Controle de contratantes, mensageria e infraestrutura de banco de dados',
      bullets: [
        'Gestão de Contratantes: Cadastro de empresas representadas, logotipos e temas de cor.',
        'WhatsApp Evolution API: Configuração e monitoramento da instância de mensageria da Match Point.',
        'Banco Supabase: Ferramenta de sincronização de dados e scripts DDL / SQL para contingência.',
        'Alternância de Contexto: Capacidade de auditar o portal sob a perspectiva de qualquer contratante.'
      ],
      roleBadge: 'Super Admin',
      accentColor: '#D90000',
      icon: Cpu
    },
    {
      id: 8,
      tag: 'Instalação & PWA',
      title: 'Instalação PWA & Suporte Offline',
      subtitle: 'Utilize o aplicativo no smartphone Android, iPhone iOS ou computador',
      bullets: [
        'Android (Chrome): Clique no botão "Instalar App" ou em "Adicionar à Tela Principal".',
        'iOS (Safari): Toque em Compartilhar ➔ "Adicionar à Tela de Início".',
        'Modo Offline Total: Realize check-ins mesmo em clínicas sem sinal; a sincronização é automática ao reconectar.',
        'Acesso Rápido: Ícone direto na tela inicial sem necessidade de passar pelas lojas de aplicativos.'
      ],
      roleBadge: 'Guia de Instalação',
      accentColor: '#10B981',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner - Match Point User Manual */}
      <div className="bg-[#111111] rounded-2xl p-5 sm:p-6 text-[#FDF2E7] border border-[#2a2a2a] shadow-md relative overflow-hidden print:hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF530D] via-[#FBBF3D] to-[#D90000]" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-[#FF530D]/20 border border-[#FF530D]/40 text-[#FF530D]">
                Documentação Oficial • Match Point Promove
              </span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2 leading-tight">
              <BookOpen className="h-5 w-5 text-[#FF530D] shrink-0" />
              <span>Manual de Uso, Treinamento &amp; Apresentação</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Guia completo passo a passo separado por perfil de usuário (<strong>Promotor de Campo</strong>, <strong>Cliente Contratante</strong> e <strong>Super Admin</strong>) com mockups visuais, fluxos e exportação para PDF e Apresentação de Slides.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 shrink-0">
            {/* Mode Switcher */}
            <div className="flex items-center bg-[#222222] p-1 rounded-xl border border-[#333333]">
              <button
                type="button"
                onClick={() => setViewMode('document')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'document'
                    ? 'bg-[#FF530D] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Manual (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('presentation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'presentation'
                    ? 'bg-[#FF530D] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Presentation className="h-3.5 w-3.5" />
                <span>Slides (PPT)</span>
              </button>
            </div>

            {/* Print / Export PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-[#FDF2E7] hover:bg-white text-[#111111] text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Imprimir ou Salvar em PDF"
            >
              <Printer className="h-4 w-4 text-[#FF530D]" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: PRESENTATION SLIDES (PPT INTERATIVO) */}
      {/* ========================================================= */}
      {viewMode === 'presentation' && (
        <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0F0F0F] p-4 sm:p-8 flex flex-col justify-between overflow-y-auto' : ''}`}>
          {/* Slide Deck Controller Bar */}
          <div className="bg-white rounded-2xl p-4 border border-[#E8D9C8] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#111111] text-[#FDF2E7] rounded-lg text-xs font-black">
                Slide {currentSlideIndex + 1} de {slides.length}
              </span>
              <span className="text-xs font-bold text-slate-600 hidden sm:inline">
                {slides[currentSlideIndex].tag}
              </span>
            </div>

            {/* Slide Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentSlideIndex === 0}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => Math.min(prev + 1, slides.length - 1))}
                disabled={currentSlideIndex === slides.length - 1}
                className="px-3.5 py-1.5 bg-[#FF530D] hover:bg-[#e04505] disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <span>Próximo</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer ml-2"
                title={isFullscreen ? 'Sair da tela cheia' : 'Apresentar em tela cheia'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Active Presentation Slide Display */}
          {(() => {
            const slide = slides[currentSlideIndex];
            const SlideIcon = slide.icon;
            return (
              <div
                className={`bg-[#111111] text-white rounded-3xl p-6 sm:p-10 border border-[#2A2A2A] shadow-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                  isFullscreen ? 'min-h-[75vh]' : 'min-h-[480px]'
                }`}
              >
                <div
                  className="absolute top-0 left-0 w-full h-2"
                  style={{ backgroundColor: slide.accentColor }}
                />

                {/* Slide Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 text-white border border-white/20">
                        {slide.tag}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF530D]/20 text-[#FF530D] border border-[#FF530D]/40">
                        {slide.roleBadge}
                      </span>
                    </div>

                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                      style={{ backgroundColor: slide.accentColor }}
                    >
                      <SlideIcon className="h-6 w-6" />
                    </div>
                  </div>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                    {slide.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                    {slide.subtitle}
                  </p>
                </div>

                {/* Slide Bullets */}
                <div className="my-6 space-y-3 sm:space-y-4">
                  {slide.bullets.map((bullet, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3.5 bg-white/5 p-3.5 sm:p-4 rounded-2xl border border-white/10 hover:border-[#FF530D]/40 transition-colors"
                    >
                      <div className="h-6 w-6 rounded-full bg-[#FF530D] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-xs">
                        {idx + 1}
                      </div>
                      <p className="text-xs sm:text-sm md:text-base text-slate-200 font-medium leading-relaxed">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Slide Footer */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <strong className="text-white">Match Point Promove</strong> • Sistema Oficial de Treinamento
                  </div>
                  <span>Use as setas ⬅️ ➡️ do teclado para navegar</span>
                </div>
              </div>
            );
          })()}

          {/* Slide Thumbnails Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  currentSlideIndex === idx
                    ? 'bg-[#111111] text-white border-[#FF530D] ring-2 ring-[#FF530D]/50 shadow-sm'
                    : 'bg-white text-slate-700 border-[#E8D9C8] hover:bg-[#FDF2E7]'
                }`}
              >
                <div className="text-[10px] font-black uppercase text-[#FF530D] mb-1">
                  Slide {idx + 1}
                </div>
                <div className="text-xs font-extrabold line-clamp-2 leading-snug">
                  {s.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: COMPLETE USER MANUAL (LIVRO / APOSTILA FORMATO PDF) */}
      {/* ========================================================= */}
      {viewMode === 'document' && (
        <div className="space-y-6">
          {/* Interactive Navigation & Role Filter Bar (Hidden when printing) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8D9C8] shadow-xs space-y-4 print:hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Role Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-bold text-slate-700 shrink-0">Filtrar por Perfil:</span>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                    selectedRoleFilter === 'all'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Todos os Perfis
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('promoter')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                    selectedRoleFilter === 'promoter'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Promotor de Campo
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('tenant')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                    selectedRoleFilter === 'tenant'
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  Cliente Contratante (RLS)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('admin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                    selectedRoleFilter === 'admin'
                      ? 'bg-[#D90000] text-white shadow-xs'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  Super Admin
                </button>
              </div>

              {/* Quick Search Input */}
              <div className="relative min-w-[240px]">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar tópico no manual..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#FDF2E7] border border-[#E8D9C8] rounded-xl text-xs font-semibold text-[#111111] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF530D]"
                />
              </div>
            </div>

            {/* Quick Jump Chapter Links */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                Sumário Rápido:
              </span>
              {[
                { id: 'cap-1', label: 'Cap. 1: Visão & RLS' },
                { id: 'cap-2', label: 'Cap. 2: Promotor de Campo' },
                { id: 'cap-3', label: 'Cap. 3: Cliente Contratante' },
                { id: 'cap-4', label: 'Cap. 4: Super Admin' },
                { id: 'cap-5', label: 'Cap. 5: Instalação PWA' },
                { id: 'cap-6', label: 'Cap. 6: Dúvidas & Boas Práticas' }
              ].map((c) => (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 hover:bg-[#FDF2E7] text-slate-700 hover:text-[#FF530D] border border-slate-200 shrink-0 transition-colors whitespace-nowrap"
                >
                  {c.label}
                </a>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* PRINTABLE DOCUMENT BODY (APOSTILA OFICIAL) */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8D9C8] shadow-sm space-y-12 text-[#111111] print:p-0 print:border-none print:shadow-none">
            
            {/* DOCUMENT COVER / CABEÇALHO OFICIAL */}
            <div className="border-b-2 border-[#111111] pb-8 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-[#111111] text-[#FF530D] flex items-center justify-center font-black text-2xl shadow-md">
                    MP
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#111111]">
                      MANUAL OFICIAL DE USO &amp; OPERAÇÃO
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-[#FF530D] uppercase tracking-wider">
                      Match Point Promove • Plataforma Multi-Tenant B2B
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="px-3 py-1 bg-[#111111] text-white rounded-lg text-xs font-black">
                    Versão 2.4 - Produção
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Documentação &amp; Capacitação
                  </p>
                </div>
              </div>

              <div className="bg-[#FDF2E7] p-4 rounded-2xl border border-[#E8D9C8] text-xs leading-relaxed text-slate-700">
                <strong>Propósito deste Manual:</strong> Este guia detalha a operação completa da plataforma Match Point Promove, capacitando Promotores de Campo para o registro ágil de visitas multi-marcas, orientando Clientes Contratantes no acompanhamento de relatórios com isolamento Row-Level Security (RLS) e instruindo Administradores na parametrização do ecossistema.
              </div>
            </div>

            {/* ===================================================== */}
            {/* CAPÍTULO 1: VISÃO GERAL & ARQUITETURA MULTI-TENANT */}
            {/* ===================================================== */}
            {(selectedRoleFilter === 'all' || selectedRoleFilter === 'admin') && (
              <section id="cap-1" className="space-y-6 pt-4">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <div className="h-9 w-9 rounded-xl bg-[#111111] text-[#FBBF3D] flex items-center justify-center font-black text-sm shrink-0">
                    01
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                      Capítulo 1: Visão Geral e Arquitetura Multi-Tenant
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Conceito de representação compartilhada com sigilo absoluto entre empresas
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p>
                    A <strong>Match Point Promove</strong> é uma central de inteligência de campo e representação comercial que permite que uma equipe especializada de promotores divulgue simultaneamente múltiplos laboratórios e empresas veterinárias.
                  </p>

                  {/* Security Architecture Demonstration Box */}
                  <div className="bg-[#111111] text-[#FDF2E7] p-5 sm:p-6 rounded-2xl border border-[#333333] space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#FF530D]" />
                      <h3 className="text-sm sm:text-base font-black text-white">
                        Como funciona o Row-Level Security (RLS) na prática?
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1.5">
                        <span className="font-extrabold text-[#FF530D] block uppercase text-[11px]">
                          1. Campo (Promotor)
                        </span>
                        <p className="text-slate-300">
                          Visita o veterinário presencialmente e apresenta os produtos de múltiplos contratantes em uma única abordagem.
                        </p>
                      </div>

                      <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1.5">
                        <span className="font-extrabold text-[#FBBF3D] block uppercase text-[11px]">
                          2. Divisão Automática
                        </span>
                        <p className="text-slate-300">
                          O sistema fragmenta os apontamentos em relatórios separados, vinculando cada feedback ao seu respectivo <code className="text-[#FBBF3D] font-mono">tenant_id</code>.
                        </p>
                      </div>

                      <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1.5">
                        <span className="font-extrabold text-emerald-400 block uppercase text-[11px]">
                          3. Painel do Cliente
                        </span>
                        <p className="text-slate-300">
                          O contratante acessa seu portal e enxerga <strong>única e exclusivamente</strong> os dados de sua própria marca.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ===================================================== */}
            {/* CAPÍTULO 2: MANUAL DO PROMOTOR DE CAMPO */}
            {/* ===================================================== */}
            {(selectedRoleFilter === 'all' || selectedRoleFilter === 'promoter') && (
              <section id="cap-2" className="space-y-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                    02
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                      Capítulo 2: Manual do Promotor de Campo (Field Promoter)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Passo a passo operacional para execução e registro de visitas clínicas
                    </p>
                  </div>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  
                  {/* Step 2.1: Localização do Médico */}
                  <div className="space-y-3">
                    <h3 className="text-sm sm:text-base font-black text-[#111111] flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#111111] text-white text-xs flex items-center justify-center font-bold">1</span>
                      Pesquisa e Seleção do Médico Veterinário
                    </h3>
                    <p>
                      No <strong>Módulo de Campo</strong>, o promotor pode localizar rapidamente o profissional pelo nome, CRMV, bairro ou clínica onde atua.
                    </p>

                    {/* UI Mockup Demonstrativo: Card de Veterinário */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        📸 Demonstração Visual: Cartão de Informações do Veterinário
                      </span>
                      <div className="bg-white rounded-2xl p-4 border-2 border-[#FF530D] shadow-xs space-y-3 max-w-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#FF530D]/15 text-[#FF530D] flex items-center justify-center font-black text-sm">
                              CA
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-[#111111]">Dra. Camila Albuquerque</h4>
                              <span className="text-[11px] font-bold text-[#FF530D] bg-[#FF530D]/10 px-2 py-0.5 rounded">
                                CRMV-SP 38.419
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-[#111111] text-[#FBBF3D] text-[11px] font-black rounded-lg">
                            Dossiê 360°
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 text-slate-600">
                          <div>📍 <strong>Clínica:</strong> Hospital PetCare</div>
                          <div>🏙️ <strong>Bairro:</strong> Jardim Paulista</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2.2: Check-in Multi-Marcas */}
                  <div className="space-y-3">
                    <h3 className="text-sm sm:text-base font-black text-[#111111] flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#111111] text-white text-xs flex items-center justify-center font-bold">2</span>
                      Execução do Check-in Simultâneo Multi-Marcas
                    </h3>
                    <p>
                      Ao iniciar o formulário de visita:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 pl-2">
                      <li>Marque as <strong>Empresas/Contratantes</strong> cujos catálogos foram apresentados no encontro.</li>
                      <li>Defina o <strong>Sentimento / Receptividade</strong> para cada empresa:
                        <ul className="list-disc list-inside pl-5 mt-1 text-slate-600">
                          <li><strong className="text-emerald-700">Positivo:</strong> Demonstrou alto interesse, solicitou amostras ou já prescreve.</li>
                          <li><strong className="text-slate-700">Neutro:</strong> Recebeu o material, visita de rotina sem pedidos imediatos.</li>
                          <li><strong className="text-rose-700">Reclamação Crítica:</strong> Relatou problema técnico, atraso ou insatisfação (Gera alerta imediato!).</li>
                        </ul>
                      </li>
                      <li>Insira as <strong>Anotações e Feedbacks</strong> técnicos recolhidos.</li>
                      <li>Clique em <strong>"Salvar e Concluir Check-in"</strong>.</li>
                    </ol>
                  </div>

                  {/* Step 2.3: Régua de Follow-up */}
                  <div className="space-y-3">
                    <h3 className="text-sm sm:text-base font-black text-[#111111] flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[#111111] text-white text-xs flex items-center justify-center font-bold">3</span>
                      Régua de Follow-up (+7d e +14d) e Radar de Aniversariantes
                    </h3>
                    <p>
                      Após a visita, o sistema agenda automaticamente tarefas na <strong>Régua de Follow-up</strong>:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#FDF2E7] p-3.5 rounded-xl border border-[#E8D9C8]">
                        <h4 className="font-extrabold text-xs text-[#111111] mb-1">📅 1ª Abordagem (+7 Dias)</h4>
                        <p className="text-xs text-slate-600">
                          Mensagem de agradecimento pela recepção e envio de lâminas técnicas no WhatsApp.
                        </p>
                      </div>
                      <div className="bg-[#FDF2E7] p-3.5 rounded-xl border border-[#E8D9C8]">
                        <h4 className="font-extrabold text-xs text-[#111111] mb-1">📅 2ª Abordagem (+14 Dias)</h4>
                        <p className="text-xs text-slate-600">
                          Contato para esclarecer dúvidas de aplicação clínica e agendamento de retorno.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </section>
            )}

            {/* ===================================================== */}
            {/* CAPÍTULO 3: MANUAL DO CLIENTE CONTRATANTE */}
            {/* ===================================================== */}
            {(selectedRoleFilter === 'all' || selectedRoleFilter === 'tenant') && (
              <section id="cap-3" className="space-y-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <div className="h-9 w-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-black text-sm shrink-0">
                    03
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                      Capítulo 3: Manual do Cliente Contratante (Laboratório / Representada)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Como auditar resultados, analisar feedbacks e exportar relatórios gerenciais
                    </p>
                  </div>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p>
                    O <strong>Portal do Contratante</strong> é o canal transparente onde o cliente acompanha em tempo real o trabalho realizado pela Match Point Promove.
                  </p>

                  {/* UI Mockup Demonstrativo: Portal do Contratante */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      📸 Demonstração Visual: Indicadores de Desempenho e Feedbacks RLS
                    </span>
                    <div className="bg-white rounded-2xl p-4 border border-[#E8D9C8] space-y-3 max-w-xl">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#111111]">VetLab Diagnósticos</h4>
                          <span className="text-[10px] text-slate-500">Isolamento Row-Level Security Ativo</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full">
                          Representada Ativa
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-[#FDF2E7] p-2 rounded-xl">
                          <span className="text-slate-600 block text-[10px]">Visitas</span>
                          <strong className="text-sm font-black text-[#111111]">24</strong>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-xl text-emerald-800">
                          <span className="block text-[10px]">Positivos</span>
                          <strong className="text-sm font-black">92%</strong>
                        </div>
                        <div className="bg-slate-100 p-2 rounded-xl text-slate-700">
                          <span className="block text-[10px]">Médicos</span>
                          <strong className="text-sm font-black">18</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm sm:text-base font-black text-[#111111]">
                      Como Exportar Relatórios Oficiais:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 pl-2 text-slate-700">
                      <li><strong>Baixar Excel (.csv):</strong> Clique no botão <em>"Baixar Excel (.csv)"</em> no módulo de Relatórios para obter a planilha tabular compatível com Excel, Google Sheets e Power BI.</li>
                      <li><strong>Imprimir / Salvar em PDF:</strong> Clique em <em>"Imprimir / Salvar PDF"</em> para gerar um documento formatado com logotipo e resumo de sentimentos pronto para reuniões de diretoria.</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* ===================================================== */}
            {/* CAPÍTULO 4: MANUAL DO GESTOR MASTER (SUPER ADMIN) */}
            {/* ===================================================== */}
            {(selectedRoleFilter === 'all' || selectedRoleFilter === 'admin') && (
              <section id="cap-4" className="space-y-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <div className="h-9 w-9 rounded-xl bg-[#D90000] text-white flex items-center justify-center font-black text-sm shrink-0">
                    04
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                      Capítulo 4: Manual do Gestor Master (Super Admin Match Point)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Configurações do sistema, gestão de empresas e integração com Evolution API
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p>
                    O <strong>Super Admin</strong> possui privilégios totais sobre a plataforma:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <h4 className="font-black text-xs text-[#111111]">🏢 Cadastro de Contratantes</h4>
                      <p className="text-xs text-slate-600">
                        Inclusão de novas empresas, definição de CNPJ, segmento, cor de identificação e usuários autorizados.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <h4 className="font-black text-xs text-[#111111]">📱 WhatsApp Evolution API</h4>
                      <p className="text-xs text-slate-600">
                        Gestão da instância oficial da Match Point para disparos automatizados da régua de relacionamento.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <h4 className="font-black text-xs text-[#111111]">🗄️ Supabase &amp; Banco SQL</h4>
                      <p className="text-xs text-slate-600">
                        Visualização e exportação dos scripts DDL, triggers de isolamento e ferramentas de backup.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <h4 className="font-black text-xs text-[#111111]">🔄 Alternância de Contexto</h4>
                      <p className="text-xs text-slate-600">
                        Capacidade de auditar o sistema sob a visão de qualquer cliente contratante instantaneamente.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ===================================================== */}
            {/* CAPÍTULO 5: GUIA DE INSTALAÇÃO PWA */}
            {/* ===================================================== */}
            <section id="cap-5" className="space-y-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <div className="h-9 w-9 rounded-xl bg-[#111111] text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                  05
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                    Capítulo 5: Instalação PWA e Uso Offline em Campo
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Como transformar a aplicação em aplicativo nativo no Android, iPhone e Computador
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                {/* Android Installation */}
                <div className="bg-[#FDF2E7] p-4 rounded-2xl border border-[#E8D9C8] space-y-2">
                  <h4 className="font-black text-sm text-[#111111] flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-[#FF530D]" />
                    Android (Chrome)
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 text-xs">
                    <li>Abra o link no Google Chrome.</li>
                    <li>Toque no ícone flutuante <strong>"Instalar App"</strong> no canto inferior.</li>
                    <li>Confirme em <em>"Adicionar à Tela Inicial"</em>.</li>
                  </ol>
                </div>

                {/* iOS Installation */}
                <div className="bg-[#FDF2E7] p-4 rounded-2xl border border-[#E8D9C8] space-y-2">
                  <h4 className="font-black text-sm text-[#111111] flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-[#2563EB]" />
                    iPhone / iPad (Safari)
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 text-xs">
                    <li>Abra o link no navegador <strong>Safari</strong>.</li>
                    <li>Toque no botão de <strong>Compartilhar</strong> (ícone do quadrado com seta para cima).</li>
                    <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                  </ol>
                </div>

                {/* Offline Behavior */}
                <div className="bg-[#FDF2E7] p-4 rounded-2xl border border-[#E8D9C8] space-y-2">
                  <h4 className="font-black text-sm text-[#111111] flex items-center gap-1.5">
                    <WifiOff className="h-4 w-4 text-emerald-600" />
                    Funcionamento Offline
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Em locais sem internet, o aplicativo continua operando normalmente com armazenamento local seguro no navegador. Ao restabelecer a conexão, os dados são sincronizados automaticamente.
                  </p>
                </div>
              </div>
            </section>

            {/* ===================================================== */}
            {/* CAPÍTULO 6: FAQ & BOAS PRÁTICAS */}
            {/* ===================================================== */}
            <section id="cap-6" className="space-y-6 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <div className="h-9 w-9 rounded-xl bg-[#FBBF3D] text-[#111111] flex items-center justify-center font-black text-sm shrink-0">
                  06
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                    Capítulo 6: Perguntas Frequentes &amp; Boas Práticas
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Recomendações para obter a máxima performance comercial em campo
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <strong className="text-[#111111] font-bold block">
                    ❓ O que fazer ao receber uma reclamação técnica de um produto?
                  </strong>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Marque imediatamente o sentimento como <strong>"Reclamação Crítica"</strong> e descreva com clareza o lote ou problema relatado pelo veterinário. O sistema alertará o contratante em destaque vermelho para que a área técnica tome as providências.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <strong className="text-[#111111] font-bold block">
                    ❓ Com que frequência devo realizar a régua de follow-up?
                  </strong>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Acompanhe diariamente a aba <strong>Régua de Follow-up</strong> para enviar os contatos de 7 e 14 dias aos médicos pendentes. A consistência nos lembretes aumenta a taxa de prescrição em mais de 65%.
                  </p>
                </div>
              </div>
            </section>

            {/* DOCUMENT FOOTER */}
            <div className="border-t-2 border-[#111111] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                <strong>Match Point Promove</strong> • Todos os direitos reservados.
              </div>
              <div className="text-slate-400">
                Impresso via Match Point Web Application
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
