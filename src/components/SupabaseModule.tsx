import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Server,
  Zap,
  Radio,
  FileCode,
  ShieldCheck,
  Layers,
  Sparkles,
  Trash2,
  CheckCheck,
  Key,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Activity
} from 'lucide-react';
import { SupabaseService } from '../services/supabase';
import { TableSyncStatus, SupabaseSyncLog, SupabaseConfig, SupabaseDiagnosticsResult } from '../types';

interface SupabaseModuleProps {
  onDataChanged: () => void;
}

export const SupabaseModule: React.FC<SupabaseModuleProps> = ({ onDataChanged }) => {
  const [tablesStatus, setTablesStatus] = useState<TableSyncStatus[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Config State
  const [config, setConfig] = useState<SupabaseConfig>(() => SupabaseService.getConfig());
  const [showSecretKey, setShowSecretKey] = useState<boolean>(false);
  const [configSaved, setConfigSaved] = useState<boolean>(false);

  // Diagnostics State
  const [diagnostics, setDiagnostics] = useState<SupabaseDiagnosticsResult | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success?: boolean;
    latencyMs?: number;
    status?: SupabaseDiagnosticsResult['overallStatus'];
    message?: string;
  }>({ tested: false });

  const [logs, setLogs] = useState<SupabaseSyncLog[]>(() => SupabaseService.getLogs());
  const [autoSync, setAutoSync] = useState<boolean>(() => SupabaseService.isAutoSyncEnabled());
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'config' | 'sql' | 'logs'>('matrix');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const refreshTableStatus = async () => {
    setIsLoadingTables(true);
    try {
      const results = await SupabaseService.checkAllTables();
      setTablesStatus(results);
      setLogs(SupabaseService.getLogs());
    } catch (err) {
      console.error('Error checking tables:', err);
    } finally {
      setIsLoadingTables(false);
    }
  };

  useEffect(() => {
    refreshTableStatus();
    handleTestConnection(false);
  }, []);

  const handleTestConnection = async (showBanner = true) => {
    setIsTesting(true);
    try {
      const diagResult = await SupabaseService.runDiagnostics(config);
      setDiagnostics(diagResult);

      const isConnected = diagResult.overallStatus === 'connected';
      const isNeedsSql = diagResult.overallStatus === 'needs_sql_setup';
      const isSuccess = isConnected || isNeedsSql;

      setConnectionStatus({
        tested: true,
        success: isSuccess,
        status: diagResult.overallStatus,
        latencyMs: diagResult.ping.latencyMs,
        message: diagResult.summary
      });

      setLogs(SupabaseService.getLogs());

      if (showBanner) {
        if (isConnected) {
          setFeedbackBanner({
            type: 'success',
            title: 'Supabase 100% Conectado',
            message: `Servidor online (${diagResult.ping.latencyMs}ms) e todas as 7 tabelas ativas.`
          });
        } else if (isNeedsSql) {
          setFeedbackBanner({
            type: 'warning',
            title: 'Credenciais Corretas • SQL Pendente',
            message: `${diagResult.schema.tablesFound} de 7 tabelas encontradas. Vá para a aba "Script SQL Supabase DDL" para rodar o script no Supabase.`
          });
        } else if (diagResult.overallStatus === 'project_paused') {
          setFeedbackBanner({
            type: 'error',
            title: 'Projeto Supabase Pausado',
            message: 'O projeto foi pausado por inatividade no tier gratuito. Acesse app.supabase.com e reative o projeto.'
          });
        } else {
          setFeedbackBanner({
            type: 'error',
            title: 'Falha de Conexão com Supabase',
            message: diagResult.summary
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setConnectionStatus({
        tested: true,
        success: false,
        message: msg
      });
      if (showBanner) {
        setFeedbackBanner({
          type: 'error',
          title: 'Erro de Conexão',
          message: msg
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = () => {
    const saved = SupabaseService.saveConfig(config);
    setConfig(saved);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
    setFeedbackBanner({
      type: 'success',
      title: 'Credenciais Atualizadas',
      message: 'As credenciais do Supabase foram salvas com sucesso no sistema.'
    });
    handleTestConnection(true);
    refreshTableStatus();
  };

  const handleResetConfig = () => {
    const reset = SupabaseService.resetConfig();
    setConfig(reset);
    setFeedbackBanner({
      type: 'warning',
      title: 'Credenciais Restauradas',
      message: 'Configurações restauradas para as credenciais padrão do projeto.'
    });
    handleTestConnection(true);
    refreshTableStatus();
  };

  const handlePushAll = async () => {
    setIsPushing(true);
    setFeedbackBanner(null);
    const result = await SupabaseService.pushAllToSupabase();
    setIsPushing(false);
    setLogs(SupabaseService.getLogs());
    await refreshTableStatus();

    if (result.success) {
      setFeedbackBanner({
        type: 'success',
        title: 'Alimentação Supabase Concluída!',
        message: `${result.totalUploaded} registros locais foram inseridos/atualizados com sucesso no Supabase.`
      });
    } else {
      setFeedbackBanner({
        type: 'warning',
        title: 'Sincronização Parcial',
        message: `${result.totalUploaded} registros enviados. Verifique se as tabelas foram criadas no SQL Editor do Supabase.`
      });
    }
  };

  const handlePullAll = async () => {
    setIsPulling(true);
    setFeedbackBanner(null);
    const result = await SupabaseService.pullAllFromSupabase();
    setIsPulling(false);
    setLogs(SupabaseService.getLogs());
    onDataChanged();
    await refreshTableStatus();

    if (result.success) {
      setFeedbackBanner({
        type: 'success',
        title: 'Download Concluído!',
        message: `${result.totalDownloaded} registros foram sincronizados do Supabase para o PDA local.`
      });
    } else {
      setFeedbackBanner({
        type: 'warning',
        title: 'Download Parcial',
        message: `${result.totalDownloaded} registros baixados. Erros: ${result.errors.join(', ')}`
      });
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    SupabaseService.setAutoSyncEnabled(enabled);
    SupabaseService.addLog({
      action: 'auto_sync',
      status: 'success',
      message: `Sincronização automática em segundo plano ${enabled ? 'HABILITADA' : 'DESABILITADA'}.`
    });
    setLogs(SupabaseService.getLogs());
  };

  const handleCopySql = () => {
    const sql = SupabaseService.getSupabaseSQLSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleClearLogs = () => {
    SupabaseService.clearLogs();
    setLogs([]);
  };

  const totalLocalRecords = tablesStatus.reduce((acc, t) => acc + t.localCount, 0);
  const totalRemoteRecords = tablesStatus.reduce((acc, t) => acc + (t.remoteCount || 0), 0);
  const missingTablesCount = tablesStatus.filter((t) => t.status === 'table_missing').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Super Admin Top Banner */}
      <div className="bg-[#111111] rounded-3xl p-5 sm:p-6 text-[#FDF2E7] border border-[#242424] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF530D] via-[#FBBF3D] to-emerald-500" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FF530D]/20 border border-[#FF530D]/40 text-[#FF530D] flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Painel Super Admin
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                Supabase PostgreSQL Cloud
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Database className="h-6 w-6 text-[#FF530D]" />
              Sincronização & Alimentação Automática de Dados no Supabase
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Alimente o esquema SQL do sistema Match Point, realize carga inicial (seed) e mantenha os cadastros de veterinários, check-ins de campo, relatórios sigilosos e réguas D+7/D+14 sincronizados em tempo real.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
            <div className="bg-[#1c1c1c] border border-[#333] px-4 py-2.5 rounded-2xl flex-1 sm:flex-none">
              <div className="text-[10px] uppercase font-bold text-slate-400">Instância Conectada</div>
              <div className="text-xs font-mono font-bold text-[#FBBF3D] truncate max-w-[200px]">
                {config.url ? config.url.replace(/^https?:\/\//, '') : 'Não configurado'}
              </div>
            </div>

            <button
              id="btn-test-supabase-connection"
              onClick={() => handleTestConnection(true)}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#222222] hover:bg-[#333333] text-white border border-[#444] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin text-[#FF530D]' : 'text-slate-300'}`} />
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>
        </div>

        {/* Status Sub-bar */}
        <div className="mt-5 pt-4 border-t border-[#242424] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  connectionStatus.success === true
                    ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse'
                    : connectionStatus.success === false
                    ? 'bg-[#D90000]'
                    : 'bg-amber-400'
                }`}
              />
              <span className="font-semibold text-slate-300">
                Status API:{' '}
                <strong className={connectionStatus.success ? 'text-emerald-400' : 'text-amber-400'}>
                  {connectionStatus.tested
                    ? connectionStatus.success
                      ? connectionStatus.status === 'needs_sql_setup'
                        ? `Conectado (${connectionStatus.latencyMs}ms) • SQL Pendente`
                        : `Conectado (${connectionStatus.latencyMs}ms)`
                      : 'Erro de Comunicação'
                    : 'Verificando...'}
                </strong>
              </span>
            </div>

            <div className="text-slate-400 font-mono text-[11px] hidden sm:block">
              URL: <span className="text-slate-300">{config.url}</span>
            </div>
          </div>

          {/* Auto-Sync Switch */}
          <div className="flex items-center gap-2.5 bg-[#1a1a1a] px-3.5 py-1.5 rounded-xl border border-[#333]">
            <Zap className={`h-4 w-4 ${autoSync ? 'text-[#FF530D]' : 'text-slate-500'}`} />
            <span className="text-xs font-bold text-slate-200">Auto-Sync em Campo:</span>
            <button
              onClick={() => handleToggleAutoSync(!autoSync)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                autoSync ? 'bg-[#FF530D]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  autoSync ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          id="supabase-feedback-banner"
          className={`p-4 rounded-2xl border-2 flex items-start justify-between gap-4 transition-all shadow-md animate-in fade-in ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950'
              : feedbackBanner.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500 text-amber-950'
              : 'bg-[#D90000]/10 border-[#D90000] text-[#111111]'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-1.5 rounded-full shrink-0 ${
                feedbackBanner.type === 'success'
                  ? 'bg-emerald-500 text-white'
                  : feedbackBanner.type === 'warning'
                  ? 'bg-amber-500 text-white'
                  : 'bg-[#D90000] text-white'
              }`}
            >
              {feedbackBanner.type === 'success' ? (
                <Check className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm">{feedbackBanner.title}</h4>
              <p className="text-xs text-slate-700 mt-0.5">{feedbackBanner.message}</p>
            </div>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Operations Control Hub */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8D9C8] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
              <Cloud className="h-5 w-5 text-[#FF530D]" />
              Central de Ações e Alimentação do Supabase
            </h3>
            <p className="text-xs text-slate-500">
              Operações de sincronização em lote entre o PDA local e o banco de dados em nuvem.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-seed-supabase"
              onClick={handlePushAll}
              disabled={isPushing || isPulling}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-[#FF530D] hover:bg-[#e04505] text-white shadow-md shadow-[#FF530D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className={`h-4 w-4 ${isPushing ? 'animate-bounce' : ''}`} />
              {isPushing ? 'Alimentando Supabase...' : 'Alimentar Banco Supabase (Seed & Upload)'}
            </button>

            <button
              id="btn-pull-supabase"
              onClick={handlePullAll}
              disabled={isPushing || isPulling}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#111111] hover:bg-[#222222] text-white shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className={`h-4 w-4 ${isPulling ? 'animate-bounce' : ''}`} />
              {isPulling ? 'Baixando...' : 'Puxar do Supabase (Download)'}
            </button>

            <button
              id="btn-refresh-matrix"
              onClick={refreshTableStatus}
              disabled={isLoadingTables}
              className="p-2.5 rounded-xl text-slate-600 hover:bg-[#FDF2E7] border border-[#E8D9C8] transition-all cursor-pointer"
              title="Recarregar contagem de tabelas"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingTables ? 'animate-spin text-[#FF530D]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Record Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#FDF2E7] p-4 rounded-2xl border border-[#E8D9C8] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Registros Locais no PDA
              </span>
              <div className="text-2xl font-black text-[#111111]">{totalLocalRecords}</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white border border-[#E8D9C8] flex items-center justify-center text-[#FF530D]">
              <Layers className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-[#111111] text-white p-4 rounded-2xl border border-[#242424] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Registros no Supabase Cloud
              </span>
              <div className="text-2xl font-black text-emerald-400">
                {missingTablesCount > 0 && totalRemoteRecords === 0
                  ? 'Aguardando DDL'
                  : totalRemoteRecords}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#222222] border border-[#333] flex items-center justify-center text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E8D9C8] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Tabelas Reconhecidas
              </span>
              <div className="text-2xl font-black text-[#111111]">
                {tablesStatus.length - missingTablesCount} / {tablesStatus.length || 7}
              </div>
            </div>
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                missingTablesCount === 0
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}
            >
              {missingTablesCount === 0 ? (
                <CheckCheck className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
          </div>
        </div>

        {/* Sub-tabs switch */}
        <div className="flex overflow-x-auto gap-2 border-b border-[#E8D9C8] pt-2 pb-2 scrollbar-none">
          <button
            id="subtab-matrix"
            onClick={() => setActiveSubTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'matrix'
                ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
                : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
            }`}
          >
            <Layers className="h-4 w-4" />
            Matriz das 7 Tabelas Supabase
          </button>

          <button
            id="subtab-config"
            onClick={() => setActiveSubTab('config')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'config'
                ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
                : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
            }`}
          >
            <Key className="h-4 w-4" />
            Credenciais & Diagnóstico
          </button>

          <button
            id="subtab-sql"
            onClick={() => setActiveSubTab('sql')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'sql'
                ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
                : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
            }`}
          >
            <FileCode className="h-4 w-4" />
            Script SQL Supabase DDL
          </button>

          <button
            id="subtab-logs"
            onClick={() => setActiveSubTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'logs'
                ? 'bg-[#FF530D] text-white shadow-md shadow-[#FF530D]/25'
                : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
            }`}
          >
            <Server className="h-4 w-4" />
            Histórico & Logs de Sincronização ({logs.length})
          </button>
        </div>

        {/* SUBTAB 1: MATRIX OF TABLES */}
        {activeSubTab === 'matrix' && (
          <div className="space-y-4">
            {missingTablesCount > 0 && (
              <div className="bg-amber-500/10 border-2 border-amber-500/50 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-amber-950">
                      Alimentar o SQL do Sistema no Supabase
                    </h4>
                    <p className="text-xs text-amber-900 mt-0.5">
                      Copie o script SQL nativo na aba <strong>"Script SQL Supabase DDL"</strong> e cole no SQL Editor do seu console Supabase para criar as tabelas com RLS e Triggers em 5 segundos.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('sql')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  Ver Script SQL DDL
                </button>
              </div>
            )}

            <div className="border border-[#E8D9C8] rounded-2xl overflow-x-auto shadow-2xs">
              <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#111111] text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5">Tabela Supabase</th>
                    <th className="p-3.5">Descrição</th>
                    <th className="p-3.5 text-center">Local (PDA)</th>
                    <th className="p-3.5 text-center">Supabase Cloud</th>
                    <th className="p-3.5 text-center">Status de Sincronia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D9C8]">
                  {tablesStatus.map((tbl) => (
                    <tr key={tbl.tableName} className="hover:bg-[#FDF2E7]/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#FF530D]">
                        {tbl.tableName}
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">
                        {tbl.displayName}
                      </td>
                      <td className="p-3.5 text-center font-bold text-[#111111]">
                        {tbl.localCount}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold">
                        {tbl.remoteCount !== null ? (
                          <span className="text-emerald-600 font-bold">{tbl.remoteCount}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Não criada</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {tbl.status === 'synced' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Sincronizado
                          </span>
                        )}
                        {tbl.status === 'pending_push' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <UploadCloud className="h-3.5 w-3.5 text-amber-600" />
                            Pendente de Upload ({tbl.localCount - (tbl.remoteCount || 0)})
                          </span>
                        )}
                        {tbl.status === 'pending_pull' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            <DownloadCloud className="h-3.5 w-3.5 text-sky-600" />
                            Pendente de Download ({(tbl.remoteCount || 0) - tbl.localCount})
                          </span>
                        )}
                        {tbl.status === 'table_missing' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                            Tabela Pendente
                          </span>
                        )}
                        {tbl.status === 'error' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            Erro de Acesso
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB: CONFIG & DIAGNOSTICS */}
        {activeSubTab === 'config' && (
          <div className="space-y-6">
            {/* Credentials Editor */}
            <div className="bg-[#FDF2E7]/40 p-5 rounded-2xl border border-[#E8D9C8] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-[#111111] flex items-center gap-2">
                    <Key className="h-4 w-4 text-[#FF530D]" />
                    Credenciais de Conexão com Supabase
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Configure a URL e as chaves de API da sua instância PostgreSQL Supabase.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetConfig}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-[#E8D9C8] bg-white transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restaurar Padrão
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#FF530D] hover:bg-[#e04505] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {configSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                    {configSaved ? 'Salvo!' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2">
                {/* Supabase URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL (Endpoint)
                  </label>
                  <input
                    type="text"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://bkmfgymvkcaywxdcclfk.supabase.co"
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#E8D9C8] bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#FF530D]"
                  />
                </div>

                {/* Anon Public Key */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Anon Public Key (Cliente Web)
                  </label>
                  <input
                    type="text"
                    value={config.anonKey}
                    onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                    placeholder="eyJhbGciOi..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#E8D9C8] bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#FF530D]"
                  />
                </div>

                {/* Service Role Secret Key */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Service Role Secret Key (Super Admin Full Access)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="text-[11px] font-semibold text-[#FF530D] flex items-center gap-1 cursor-pointer"
                    >
                      {showSecretKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {showSecretKey ? 'Ocultar' : 'Visualizar'}
                    </button>
                  </div>
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={config.serviceRoleKey || ''}
                    onChange={(e) => setConfig({ ...config, serviceRoleKey: e.target.value })}
                    placeholder="eyJhbGciOi..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#E8D9C8] bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#FF530D]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    A chave <code>service_role</code> permite ao Super Admin bypass de RLS para sincronização e carga inicial.
                  </p>
                </div>
              </div>
            </div>

            {/* Deep Diagnostics Panel */}
            <div className="bg-[#111111] p-5 rounded-2xl border border-[#242424] text-white space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-[#FBBF3D] flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#FF530D]" />
                    Diagnóstico Granular de Conectividade (3 Etapas)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Identificação precisa de latência, autenticação JWT e existência das tabelas SQL.
                  </p>
                </div>
                <button
                  onClick={() => handleTestConnection(true)}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF530D] hover:bg-[#e04505] text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Diagnosticando...' : 'Executar Diagnóstico'}
                </button>
              </div>

              {diagnostics ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {/* Step 1: Ping / Network */}
                  <div className="bg-[#1c1c1c] p-3.5 rounded-xl border border-[#333] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-slate-400">
                        1. Conexão HTTP / Ping
                      </span>
                      {diagnostics.ping.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      {diagnostics.ping.status === 'warning' && (
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      )}
                      {diagnostics.ping.status === 'error' && (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-200">
                      {diagnostics.ping.latencyMs ? `${diagnostics.ping.latencyMs}ms de resposta` : 'Offline'}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {diagnostics.ping.message}
                    </p>
                  </div>

                  {/* Step 2: Auth / JWT */}
                  <div className="bg-[#1c1c1c] p-3.5 rounded-xl border border-[#333] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-slate-400">
                        2. Autenticação JWT
                      </span>
                      {diagnostics.auth.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      {diagnostics.auth.status === 'warning' && (
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      )}
                      {diagnostics.auth.status === 'error' && (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-200">
                      {diagnostics.auth.status === 'success' ? 'Credenciais Válidas' : 'Verificação JWT'}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {diagnostics.auth.message}
                    </p>
                  </div>

                  {/* Step 3: Schema / Tables */}
                  <div className="bg-[#1c1c1c] p-3.5 rounded-xl border border-[#333] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-slate-400">
                        3. Tabelas PostgreSQL
                      </span>
                      {diagnostics.schema.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      {diagnostics.schema.status === 'warning' && (
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      )}
                      {diagnostics.schema.status === 'error' && (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-200">
                      {diagnostics.schema.tablesFound} de {diagnostics.schema.totalTables} tabelas
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {diagnostics.schema.message}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#1c1c1c] text-center text-xs text-slate-400">
                  Clique em "Executar Diagnóstico" para testar a comunicação completa com o Supabase.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: SQL SCRIPT GENERATOR & DDL */}
        {activeSubTab === 'sql' && (
          <div className="space-y-4">
            <div className="bg-[#111111] p-4 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#242424]">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-[#FBBF3D] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF530D]" />
                  Script de Alimentação SQL Automatizado para Supabase
                </h4>
                <p className="text-xs text-slate-300">
                  Execute este script no <strong>Supabase Dashboard &gt; SQL Editor</strong> para provisionar todas as 7 tabelas com RLS e triggers.
                </p>
              </div>

              <button
                id="btn-copy-supabase-sql"
                onClick={handleCopySql}
                className="px-4 py-2.5 bg-[#FF530D] hover:bg-[#e04505] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                {copiedSql ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
                {copiedSql ? 'SQL Copiado com Sucesso!' : 'Copiar SQL Completo'}
              </button>
            </div>

            <div className="bg-[#0f0f0f] p-4 rounded-2xl border border-[#262626] font-mono text-xs text-slate-300 overflow-x-auto max-h-[480px] overflow-y-auto leading-relaxed shadow-inner">
              <pre className="text-[12px]">{SupabaseService.getSupabaseSQLSchema()}</pre>
            </div>
          </div>
        )}

        {/* SUBTAB 3: LOGS & HISTORY */}
        {activeSubTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                Histórico de Operações &amp; Auditoria de Sincronia
              </span>
              <button
                onClick={handleClearLogs}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar Logs
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center bg-[#FDF2E7]/40 rounded-2xl border border-[#E8D9C8] text-slate-500 text-xs">
                Nenhum log registrado ainda. Realize uma operação para visualizar o histórico de transferências.
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {logs.map((lg) => (
                  <div
                    key={lg.id}
                    className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                      lg.status === 'success'
                        ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-950'
                        : lg.status === 'warning'
                        ? 'bg-amber-500/5 border-amber-500/30 text-amber-950'
                        : lg.status === 'error'
                        ? 'bg-rose-500/5 border-rose-500/30 text-rose-950'
                        : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {lg.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        {lg.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                        {lg.status === 'error' && <XCircle className="h-4 w-4 text-rose-600" />}
                        {lg.status === 'in_progress' && <RefreshCw className="h-4 w-4 text-[#FF530D] animate-spin" />}
                      </div>
                      <div>
                        <div className="font-bold">{lg.message}</div>
                        {lg.details && (
                          <div className="text-[11px] text-slate-600 font-mono mt-0.5">{lg.details}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(lg.timestamp).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
