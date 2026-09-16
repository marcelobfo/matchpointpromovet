import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Smartphone,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Power,
  RotateCcw,
  Sliders,
  FileText,
  Image as ImageIcon,
  Mic,
  MapPin,
  UserPlus,
  BarChart2,
  Smile,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Play,
  Square,
  Trash2,
  Sparkles,
  ShieldCheck,
  Paperclip,
  Clock,
  Search,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import {
  EvolutionApiConfig,
  EvolutionInstanceInfo,
  EvolutionMessageRecord,
  EvolutionMessageType,
  EvolutionMessageTemplate,
  Veterinarian,
  Tenant
} from '../types';
import { EvolutionApiService } from '../services/evolutionApi';

interface EvolutionApiModuleProps {
  vets: Veterinarian[];
  tenants: Tenant[];
}

export const EvolutionApiModule: React.FC<EvolutionApiModuleProps> = ({ vets, tenants }) => {
  // Main Config & Status State
  const [config, setConfig] = useState<EvolutionApiConfig>(() => EvolutionApiService.getConfig());
  const [instanceState, setInstanceState] = useState<{
    status: 'open' | 'close' | 'connecting' | 'created' | 'offline' | 'not_found';
    latencyMs?: number;
    qrcode?: string | null;
    pairingCode?: string | null;
    error?: string;
  }>({ status: 'offline' });

  const [activeTab, setActiveTab] = useState<'sender' | 'templates' | 'settings' | 'history'>('sender');
  const [activeMessageType, setActiveMessageType] = useState<EvolutionMessageType>('text');

  // Loading States
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Recipient Selection
  const [selectedVetId, setSelectedVetId] = useState<string>('');
  const [manualPhone, setManualPhone] = useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || '');

  // Message Fields
  const [messageText, setMessageText] = useState<string>(
    'Olá Dr(a). {{nome_veterinario}}! Tudo bem? Passando para compartilhar novidades e reforçar nosso suporte da {{nome_contratante}}.'
  );
  const [mediaUrl, setMediaUrl] = useState<string>(
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80'
  );
  const [mediaCaption, setMediaCaption] = useState<string>('Catálogo Técnico & Portfólio de Serviços');
  const [mediaType, setMediaType] = useState<'image' | 'document' | 'video'>('image');
  const [mediaFileName, setMediaFileName] = useState<string>('catalogo-servicos.jpg');

  // Audio Recording (PTT) State
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string>('');
  const [audioBase64, setAudioBase64] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Location Fields
  const [locName, setLocName] = useState<string>('Sede Match Point Promove');
  const [locAddress, setLocAddress] = useState<string>('Belo Horizonte, MG');
  const [locLat, setLocLat] = useState<number>(-19.93359);
  const [locLng, setLocLng] = useState<number>(-43.93851);

  // VCard Contact Fields
  const [contactName, setContactName] = useState<string>('Promotor Match Point');
  const [contactPhone, setContactPhone] = useState<string>('+55 (31) 98296-8010');
  const [contactOrg, setContactOrg] = useState<string>('Match Point Promove');

  // Poll Fields
  const [pollName, setPollName] = useState<string>('Qual produto ou exame tem maior demanda na sua clínica?');
  const [pollOptions, setPollOptions] = useState<string[]>([
    'Exames Laboratoriais 24h',
    'Fisioterapia & Reabilitação',
    'Especialidades Cirúrgicas',
    'Medicamentos Especiais'
  ]);

  // Stickers List
  const [selectedSticker, setSelectedSticker] = useState<string>(
    'https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/01_Cuppy_smile.webp'
  );

  // Templates & History
  const [templates, setTemplates] = useState<EvolutionMessageTemplate[]>(() =>
    EvolutionApiService.getTemplates()
  );
  const [history, setHistory] = useState<EvolutionMessageRecord[]>(() =>
    EvolutionApiService.getMessageHistory()
  );

  // Toast / Feedback
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Check initial connection status on mount
  const checkStatus = async () => {
    setIsLoadingStatus(true);
    const result = await EvolutionApiService.getInstanceStatus(config.instanceName, config);
    setInstanceState({
      status: result.state,
      error: result.error
    });
    setIsLoadingStatus(false);
  };

  useEffect(() => {
    checkStatus();
  }, [config.serverUrl, config.instanceName]);

  // Recipient info resolution
  const activeVet = vets.find((v) => v.id === selectedVetId);
  const activeTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];
  const effectivePhone = manualPhone || activeVet?.whatsapp || '';

  // Variable Interpolation Helper
  const interpolate = (text: string): string => {
    let res = text;
    const vetName = activeVet?.full_name || 'Doutor(a)';
    const tenantName = activeTenant?.trade_name || 'Match Point Promove';
    const clinic = activeVet?.workplace_name || 'Clínica Veterinária';
    const city = activeVet?.city || 'sua região';

    res = res.replace(/{{nome_veterinario}}/g, vetName);
    res = res.replace(/{{nome_contratante}}/g, tenantName);
    res = res.replace(/{{clinica}}/g, clinic);
    res = res.replace(/{{cidade}}/g, city);
    res = res.replace(/{{interesse_servico}}/g, 'serviços e diagnósticos');
    return res;
  };

  // Start / Stop Browser Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp4' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
      };

      recorder.start();
      setIsRecordingAudio(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Microfone não autorizado',
        message: 'Permita o acesso ao microfone no navegador para gravar áudios de voz.'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecordingAudio(false);
    }
  };

  // Use Current Geolocation
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocLat(Number(pos.coords.latitude.toFixed(6)));
          setLocLng(Number(pos.coords.longitude.toFixed(6)));
          setLocName(activeVet?.workplace_name || 'Check-in em Campo');
          setLocAddress(`${activeVet?.neighborhood || 'Bairro'}, ${activeVet?.city || 'Cidade'}`);
          setToast({
            type: 'success',
            title: 'Localização Atual Obtida',
            message: `Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`
          });
        },
        () => {
          setToast({
            type: 'warning',
            title: 'GPS não disponível',
            message: 'Utilizando coordenadas padrão.'
          });
        }
      );
    }
  };

  // Connect Instance / QR Code
  const handleConnectInstance = async () => {
    setIsConnecting(true);
    setShowQrModal(true);
    const result = await EvolutionApiService.connectInstance(config.instanceName, config);
    setIsConnecting(false);

    if (result.success && (result.qrcode || result.pairingCode)) {
      setInstanceState((prev) => ({
        ...prev,
        qrcode: result.qrcode,
        pairingCode: result.pairingCode
      }));
    } else {
      setToast({
        type: 'error',
        title: 'Erro ao gerar QR Code',
        message: result.error || 'Verifique se a instância existe e a URL do servidor está correta.'
      });
    }
  };

  // Send Message Action Router
  const handleSendMessage = async () => {
    if (!effectivePhone) {
      setToast({
        type: 'error',
        title: 'Número obrigatório',
        message: 'Selecione um veterinário cadastrado ou digite o número com DDD.'
      });
      return;
    }

    setIsSending(true);
    let success = false;
    let errorMsg = '';
    const recipientName = activeVet?.full_name || 'Destinatário WhatsApp';

    try {
      if (activeMessageType === 'text') {
        const textPayload = interpolate(messageText);
        const res = await EvolutionApiService.sendTextMessage({
          number: effectivePhone,
          text: textPayload,
          recipientName
        });
        success = res.success;
        errorMsg = res.error || '';
      } else if (activeMessageType === 'media') {
        const res = await EvolutionApiService.sendMediaMessage({
          number: effectivePhone,
          media: mediaUrl,
          mediatype: mediaType,
          mimetype: mediaType === 'image' ? 'image/jpeg' : 'application/pdf',
          caption: interpolate(mediaCaption),
          fileName: mediaFileName,
          recipientName
        });
        success = res.success;
        errorMsg = res.error || '';
      } else if (activeMessageType === 'audio') {
        const audioData =
          audioBase64 ||
          'https://actions.google.com/sounds/v1/communication/answering_machine.ogg';
        const res = await EvolutionApiService.sendAudioMessage({
          number: effectivePhone,
          audio: audioData,
          recipientName
        });
        success = res.success;
        errorMsg = res.error || '';
      } else if (activeMessageType === 'sticker') {
        const res = await EvolutionApiService.sendStickerMessage({
          number: effectivePhone,
          sticker: selectedSticker,
          recipientName
        });
        success = res.success;
        errorMsg = res.error || '';
      } else if (activeMessageType === 'location') {
        const res = await EvolutionApiService.sendLocationMessage({
          number: effectivePhone,
          name: locName,
          address: locAddress,
          latitude: locLat,
          longitude: locLng,
          recipientName
        });
        success = res.success;
        errorMsg = res.error || '';
      } else if (activeMessageType === 'contact') {
        const res = await EvolutionApiService.sendContactMessage({
          number: effectivePhone,
          fullName: contactName,
          phoneNumber: contactPhone,
          organization: contactOrg,
          recipientName
        });
        success = res.success;
        errorMsg = res.error || '';
      } else if (activeMessageType === 'poll') {
        const res = await EvolutionApiService.sendPollMessage({
          number: effectivePhone,
          name: pollName,
          options: pollOptions.filter((o) => o.trim().length > 0),
          recipientName
        });
        success = res.success;
        errorMsg = res.error || '';
      }

      setHistory(EvolutionApiService.getMessageHistory());

      if (success) {
        setToast({
          type: 'success',
          title: 'Mensagem Enviada com Sucesso!',
          message: `Disparo do tipo [${activeMessageType.toUpperCase()}] transmitido para ${effectivePhone}.`
        });
      } else {
        setToast({
          type: 'error',
          title: 'Falha no Disparo',
          message: errorMsg || 'Não foi possível enviar a mensagem. Verifique a conexão com a Evolution API.'
        });
      }
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Erro inesperado',
        message: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setIsSending(false);
    }
  };

  // Save Settings
  const handleSaveConfig = () => {
    EvolutionApiService.saveConfig(config);
    setToast({
      type: 'success',
      title: 'Configurações Salvas',
      message: 'Parâmetros da Evolution API atualizados com sucesso.'
    });
    checkStatus();
  };

  // Apply Template
  const handleApplyTemplate = (tpl: EvolutionMessageTemplate) => {
    setActiveMessageType(tpl.type);
    setMessageText(tpl.textTemplate);
    if (tpl.defaultMediaUrl) setMediaUrl(tpl.defaultMediaUrl);
    if (tpl.caption) setMediaCaption(tpl.caption);
    setActiveTab('sender');
    setToast({
      type: 'success',
      title: 'Modelo Carregado',
      message: `Template "${tpl.title}" aplicado no disparador.`
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-[#111111] rounded-3xl p-5 sm:p-6 text-[#FDF2E7] border border-[#242424] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-[#FF530D] to-[#FBBF3D]" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                Evolution API v1.7.4 (WhatsApp Baileys)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FF530D]/20 border border-[#FF530D]/40 text-[#FF530D] flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Disparo Multi-Mídia Super Admin
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Smartphone className="h-6 w-6 text-emerald-400" />
              Central de Mensageria &amp; Disparos WhatsApp
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Dispare mensagens de texto, catálogos em imagem/PDF, áudios naturais de voz (PTT), figurinhas, localizações, cartões de contato e enquetes integradas diretamente aos veterinários e contratantes da Match Point.
            </p>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
            <div className="bg-[#1a1a1a] border border-[#333] px-3.5 py-2 rounded-2xl flex-1 sm:flex-none">
              <div className="text-[10px] uppercase font-bold text-slate-400">Instância Ativa</div>
              <div className="text-xs font-mono font-bold text-emerald-400 truncate max-w-[180px]">
                {config.instanceName}
              </div>
            </div>

            <button
              id="btn-connect-evolution-qr"
              onClick={handleConnectInstance}
              disabled={isConnecting}
              className="px-4 py-2.5 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <QrCode className="h-4 w-4" />
              {isConnecting ? 'Conectando...' : 'Conectar QR Code'}
            </button>

            <button
              id="btn-check-evolution-status"
              onClick={checkStatus}
              disabled={isLoadingStatus}
              className="p-2.5 rounded-2xl bg-[#222222] hover:bg-[#333333] text-white border border-[#444] transition-all cursor-pointer shrink-0"
              title="Atualizar status da instância"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingStatus ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* State Bar */}
        <div className="mt-5 pt-4 border-t border-[#242424] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                instanceState.status === 'open'
                  ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse'
                  : instanceState.status === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-slate-200">
              Status Conexão:{' '}
              <strong
                className={
                  instanceState.status === 'open'
                    ? 'text-emerald-400 uppercase tracking-wider'
                    : 'text-amber-400 uppercase tracking-wider'
                }
              >
                {instanceState.status === 'open'
                  ? 'Online / Conectado'
                  : instanceState.status === 'connecting'
                  ? 'Aguardando Leitura QR Code'
                  : 'Desconectado / Offline'}
              </strong>
            </span>
          </div>

          <div className="text-slate-400 font-mono text-[11px] truncate max-w-sm">
            Endpoint: <span className="text-slate-300">{config.serverUrl || 'Não configurado'}</span>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-start justify-between gap-4 transition-all shadow-md animate-in fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950'
              : toast.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500 text-amber-950'
              : 'bg-rose-500/10 border-rose-500 text-rose-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-1.5 rounded-full shrink-0 ${
                toast.type === 'success'
                  ? 'bg-emerald-500 text-white'
                  : toast.type === 'warning'
                  ? 'bg-amber-500 text-white'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm">{toast.title}</h4>
              <p className="text-xs text-slate-700 mt-0.5">{toast.message}</p>
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#181818] w-full max-w-md rounded-3xl border border-[#333] shadow-2xl p-6 text-white space-y-5 text-center">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Conectar Instância WhatsApp</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="h-8 w-8 rounded-full bg-[#252525] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Abra o WhatsApp no seu smartphone &gt; <strong>Aparelhos conectados</strong> &gt; <strong>Conectar um aparelho</strong> e aponte para o QR Code abaixo:
            </p>

            {instanceState.qrcode ? (
              <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
                <img
                  src={
                    instanceState.qrcode.startsWith('data:image')
                      ? instanceState.qrcode
                      : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                          instanceState.qrcode
                        )}`
                  }
                  alt="QR Code WhatsApp"
                  className="w-56 h-56 object-contain"
                />
              </div>
            ) : (
              <div className="p-8 bg-[#111] rounded-2xl border border-[#333] space-y-2">
                <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin mx-auto" />
                <div className="text-xs text-slate-300">Gerando QR Code da Evolution API...</div>
              </div>
            )}

            {instanceState.pairingCode && (
              <div className="bg-[#242424] p-3 rounded-xl border border-[#333]">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Código de Pareamento</div>
                <div className="text-lg font-mono font-black text-[#FBBF3D] tracking-widest mt-0.5">
                  {instanceState.pairingCode}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={handleConnectInstance}
                className="px-4 py-2 bg-[#252525] hover:bg-[#333] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Recarregar QR Code
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8D9C8] shadow-sm space-y-6">
        <div className="flex overflow-x-auto gap-2 border-b border-[#E8D9C8] pb-3 scrollbar-none">
          <button
            id="tab-evo-sender"
            onClick={() => setActiveTab('sender')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'sender'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
            }`}
          >
            <Send className="h-4 w-4" />
            1. Disparador Multi-Mídia
          </button>

          <button
            id="tab-evo-templates"
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'templates'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            2. Modelos &amp; Régua CRM ({templates.length})
          </button>

          <button
            id="tab-evo-settings"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
            }`}
          >
            <Sliders className="h-4 w-4" />
            3. Configurações da Instância
          </button>

          <button
            id="tab-evo-history"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-white text-[#111111] hover:bg-[#FDF2E7] border border-[#E8D9C8]'
            }`}
          >
            <Clock className="h-4 w-4" />
            4. Histórico de Disparos ({history.length})
          </button>
        </div>

        {/* TAB 1: MULTI-MEDIA DISPATCH STUDIO */}
        {activeTab === 'sender' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Recipient & Mode Picker */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#FDF2E7]/60 p-4 rounded-2xl border border-[#E8D9C8] space-y-3">
                <h4 className="text-xs font-black uppercase text-[#111111] tracking-wider flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-[#FF530D]" />
                  Destinatário do Disparo
                </h4>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600">
                    Selecionar Veterinário Cadastrado:
                  </label>
                  <select
                    id="select-evo-vet"
                    value={selectedVetId}
                    onChange={(e) => {
                      setSelectedVetId(e.target.value);
                      const found = vets.find((v) => v.id === e.target.value);
                      if (found) setManualPhone(found.whatsapp);
                    }}
                    className="w-full p-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs font-semibold text-[#111111] focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Selecionar da Lista ({vets.length} vets) --</option>
                    {vets.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.full_name} • {v.workplace_name || v.city} ({v.whatsapp})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">
                    Ou Digitar Número WhatsApp (com DDD):
                  </label>
                  <input
                    type="tel"
                    id="input-evo-phone"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="Ex: 5531982968010"
                    className="w-full p-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs font-mono font-bold text-[#111111] focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">
                    Contratante Representado (Variáveis):
                  </label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs font-bold text-slate-800"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        🏢 {t.trade_name} ({t.segment})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message Type Selector Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Tipo de Conteúdo para Envio:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveMessageType('text')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeMessageType === 'text'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-[#E8D9C8] text-slate-700'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    Texto Simples
                  </button>

                  <button
                    onClick={() => setActiveMessageType('media')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeMessageType === 'media'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-[#E8D9C8] text-slate-700'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Imagem / PDF
                  </button>

                  <button
                    onClick={() => setActiveMessageType('audio')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeMessageType === 'audio'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-[#E8D9C8] text-slate-700'
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                    Áudio PTT (Voz)
                  </button>

                  <button
                    onClick={() => setActiveMessageType('sticker')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeMessageType === 'sticker'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-[#E8D9C8] text-slate-700'
                    }`}
                  >
                    <Smile className="h-4 w-4" />
                    Figurinha
                  </button>

                  <button
                    onClick={() => setActiveMessageType('location')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeMessageType === 'location'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-[#E8D9C8] text-slate-700'
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    Localização
                  </button>

                  <button
                    onClick={() => setActiveMessageType('contact')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      activeMessageType === 'contact'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-[#E8D9C8] text-slate-700'
                    }`}
                  >
                    <UserPlus className="h-4 w-4" />
                    VCard Contato
                  </button>

                  <button
                    onClick={() => setActiveMessageType('poll')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 col-span-2 transition-all cursor-pointer ${
                      activeMessageType === 'poll'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-[#E8D9C8] text-slate-700'
                    }`}
                  >
                    <BarChart2 className="h-4 w-4" />
                    Enquete Interativa (Poll)
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Dynamic Payload Configuration & Live Preview */}
            <div className="lg:col-span-8 space-y-4">
              {/* 1. TEXT MESSAGE COMPOSER */}
              {activeMessageType === 'text' && (
                <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8D9C8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#111111]">
                      Mensagem de Texto (POST /message/sendText)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Suporta formatação WhatsApp (*negrito*, _itálico_)
                    </span>
                  </div>

                  <textarea
                    id="textarea-evo-text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={6}
                    className="w-full p-3.5 bg-white border border-[#E8D9C8] rounded-xl text-xs font-medium text-[#111111] focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-inner"
                    placeholder="Digite o conteúdo da mensagem..."
                  />

                  {/* Variables Shortcuts */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tags dinâmicas:</span>
                    {['{{nome_veterinario}}', '{{nome_contratante}}', '{{clinica}}', '{{cidade}}'].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setMessageText((prev) => prev + ' ' + tag)}
                          className="px-2 py-1 bg-white hover:bg-[#FDF2E7] border border-[#E8D9C8] text-[#111111] text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          + {tag}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* 2. MEDIA COMPOSER (IMAGE / PDF) */}
              {activeMessageType === 'media' && (
                <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8D9C8] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#111111]">
                      Envio de Mídia / Catálogo (POST /message/sendMedia)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMediaType('image')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                          mediaType === 'image'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-600 border border-[#E8D9C8]'
                        }`}
                      >
                        Imagem
                      </button>
                      <button
                        onClick={() => setMediaType('document')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                          mediaType === 'document'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-600 border border-[#E8D9C8]'
                        }`}
                      >
                        Documento PDF
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">URL do Arquivo ou Imagem:</label>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://exemplo.com/catalogo.pdf ou imagem.jpg"
                      className="w-full p-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs font-mono text-[#111111]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Nome do Arquivo:</label>
                      <input
                        type="text"
                        value={mediaFileName}
                        onChange={(e) => setMediaFileName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs text-[#111111]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Legenda (Caption):</label>
                      <input
                        type="text"
                        value={mediaCaption}
                        onChange={(e) => setMediaCaption(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs text-[#111111]"
                      />
                    </div>
                  </div>

                  {mediaType === 'image' && mediaUrl && (
                    <div className="p-2 bg-white rounded-xl border border-[#E8D9C8] max-w-xs">
                      <img
                        src={mediaUrl}
                        alt="Preview Mídia"
                        className="w-full h-36 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 3. AUDIO RECORDING (PTT / VOICE NOTE) */}
              {activeMessageType === 'audio' && (
                <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8D9C8] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#111111]">
                      Mensagem de Áudio WhatsApp PTT (POST /message/sendWhatsAppAudio)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold">
                      Gravador de Voz em Tempo Real
                    </span>
                  </div>

                  <div className="p-6 bg-white rounded-2xl border border-[#E8D9C8] text-center space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      {!isRecordingAudio ? (
                        <button
                          onClick={startRecording}
                          className="px-6 py-3 bg-[#D90000] hover:bg-[#b00000] text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer text-sm animate-pulse"
                        >
                          <Mic className="h-5 w-5" />
                          Gravar Áudio de Voz
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg cursor-pointer text-sm"
                        >
                          <Square className="h-5 w-5 text-red-500" />
                          Parar Gravação (Concluir)
                        </button>
                      )}
                    </div>

                    {isRecordingAudio && (
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-red-600 animate-pulse">
                        <span className="h-2.5 w-2.5 bg-red-600 rounded-full" />
                        Gravando áudio com qualidade cristalina...
                      </div>
                    )}

                    {recordedAudioUrl && (
                      <div className="pt-3 border-t border-slate-100 flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">Pré-escuta do Áudio:</span>
                        <audio src={recordedAudioUrl} controls className="w-full max-w-sm h-10" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. STICKER COMPOSER */}
              {activeMessageType === 'sticker' && (
                <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8D9C8] space-y-3">
                  <span className="text-xs font-black uppercase text-[#111111] block">
                    Figurinha Oficial (POST /message/sendSticker)
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {[
                      {
                        name: 'Match Point Joinha',
                        url: 'https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/01_Cuppy_smile.webp'
                      },
                      {
                        name: 'Parceria Sucesso',
                        url: 'https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/02_Cuppy_lol.webp'
                      },
                      {
                        name: 'Agradecimento',
                        url: 'https://raw.githubusercontent.com/WhatsApp/stickers/master/Android/app/src/main/assets/1/03_Cuppy_rofl.webp'
                      }
                    ].map((st, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSticker(st.url)}
                        className={`p-3 bg-white rounded-xl border text-center space-y-2 cursor-pointer transition-all ${
                          selectedSticker === st.url
                            ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/50'
                            : 'border-[#E8D9C8] hover:bg-slate-50'
                        }`}
                      >
                        <img src={st.url} alt={st.name} className="w-16 h-16 object-contain mx-auto" />
                        <span className="text-[10px] font-bold text-slate-700 block truncate">{st.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. LOCATION COMPOSER */}
              {activeMessageType === 'location' && (
                <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8D9C8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#111111]">
                      Localização GPS (POST /message/sendLocation)
                    </span>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Usar Meu GPS Atual
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Nome do Local:</label>
                      <input
                        type="text"
                        value={locName}
                        onChange={(e) => setLocName(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E8D9C8] rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Endereço:</label>
                      <input
                        type="text"
                        value={locAddress}
                        onChange={(e) => setLocAddress(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E8D9C8] rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Latitude:</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={locLat}
                        onChange={(e) => setLocLat(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-[#E8D9C8] rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Longitude:</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={locLng}
                        onChange={(e) => setLocLng(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-[#E8D9C8] rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. VCARD CONTACT COMPOSER */}
              {activeMessageType === 'contact' && (
                <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8D9C8] space-y-3">
                  <span className="text-xs font-black uppercase text-[#111111] block">
                    Cartão de Contato VCard (POST /message/sendContact)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Nome Completo:</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E8D9C8] rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Telefone:</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E8D9C8] rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Organização:</label>
                      <input
                        type="text"
                        value={contactOrg}
                        onChange={(e) => setContactOrg(e.target.value)}
                        className="w-full p-2 bg-white border border-[#E8D9C8] rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 7. POLL COMPOSER */}
              {activeMessageType === 'poll' && (
                <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8D9C8] space-y-3">
                  <span className="text-xs font-black uppercase text-[#111111] block">
                    Enquete Interativa (POST /message/sendPoll)
                  </span>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Pergunta da Enquete:</label>
                    <input
                      type="text"
                      value={pollName}
                      onChange={(e) => setPollName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs font-bold text-[#111111]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Opções de Resposta:</label>
                    {pollOptions.map((opt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[idx] = e.target.value;
                          setPollOptions(updated);
                        }}
                        placeholder={`Opção ${idx + 1}`}
                        className="w-full p-2 bg-white border border-[#E8D9C8] rounded-xl text-xs text-slate-800"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* LIVE PREVIEW & SEND TRIGGER */}
              <div className="bg-[#111111] text-white p-5 rounded-2xl border border-[#242424] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4" />
                    Destino: {effectivePhone || 'Nenhum número selecionado'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Tipo: <strong className="text-white uppercase">{activeMessageType}</strong> • Instância:{' '}
                    <span className="text-[#FBBF3D] font-mono">{config.instanceName}</span>
                  </div>
                </div>

                <button
                  id="btn-trigger-evo-send"
                  onClick={handleSendMessage}
                  disabled={isSending || !effectivePhone}
                  className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className={`h-4 w-4 ${isSending ? 'animate-ping' : ''}`} />
                  {isSending ? 'Transmitindo WhatsApp...' : 'Disparar Mensagem Agora'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEMPLATES CRM */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-[#111111]">
                  Modelos de Mensagens Homologados para a Régua CRM
                </h4>
                <p className="text-xs text-slate-500">
                  Templates estratégicos pré-formatados com tags dinâmicas para abordagem comercial e follow-up veterinário.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8D9C8] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF530D]/10 text-[#FF530D] border border-[#FF530D]/20">
                        {tpl.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Tipo: {tpl.type}
                      </span>
                    </div>

                    <h5 className="font-bold text-xs text-[#111111]">{tpl.title}</h5>

                    <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-[#E8D9C8] whitespace-pre-line font-medium leading-relaxed">
                      {tpl.textTemplate}
                    </p>
                  </div>

                  <button
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Carregar no Disparador
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS EVOLUTION API */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-[#111111] text-white p-5 rounded-2xl border border-[#242424] space-y-4">
              <h4 className="text-sm font-black text-[#FBBF3D] flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-400" />
                Parâmetros do Servidor Evolution API
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">URL do Servidor Evolution API:</label>
                  <input
                    type="url"
                    value={config.serverUrl}
                    onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })}
                    placeholder="https://api.evolution-api.com"
                    className="w-full p-2.5 bg-[#1c1c1c] border border-[#333] rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Global API Key (Header apikey):</label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="Sua chave secreta apikey"
                    className="w-full p-2.5 bg-[#1c1c1c] border border-[#333] rounded-xl text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Nome da Instância (instanceName):</label>
                  <input
                    type="text"
                    value={config.instanceName}
                    onChange={(e) => setConfig({ ...config, instanceName: e.target.value })}
                    className="w-full p-2.5 bg-[#1c1c1c] border border-[#333] rounded-xl text-xs text-[#FBBF3D] font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Behavior Switch Matrix (Evolution Settings API) */}
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8D9C8] space-y-4">
              <h4 className="text-xs font-black uppercase text-[#111111]">
                Comportamento Automático da Instância (POST /settings/set)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3.5 bg-white rounded-xl border border-[#E8D9C8] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#111111]">Rejeitar Chamadas de Voz</div>
                    <div className="text-[10px] text-slate-500">rejectCall (Anti-interrupção)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.rejectCall}
                    onChange={(e) => setConfig({ ...config, rejectCall: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#E8D9C8] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#111111]">Ignorar Grupos</div>
                    <div className="text-[10px] text-slate-500">groupsIgnore</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.groupsIgnore}
                    onChange={(e) => setConfig({ ...config, groupsIgnore: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#E8D9C8] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#111111]">Sempre Online</div>
                    <div className="text-[10px] text-slate-500">alwaysOnline</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.alwaysOnline}
                    onChange={(e) => setConfig({ ...config, alwaysOnline: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#E8D9C8] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#111111]">Marcar Lidas</div>
                    <div className="text-[10px] text-slate-500">readMessages</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.readMessages}
                    onChange={(e) => setConfig({ ...config, readMessages: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#E8D9C8] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#111111]">Visualizar Status</div>
                    <div className="text-[10px] text-slate-500">readStatus</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.readStatus}
                    onChange={(e) => setConfig({ ...config, readStatus: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#E8D9C8] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#111111]">Sincronizar Histórico</div>
                    <div className="text-[10px] text-slate-500">syncFullHistory</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.syncFullHistory}
                    onChange={(e) => setConfig({ ...config, syncFullHistory: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700">
                  Mensagem Automática de Chamada Recusada (msgCall):
                </label>
                <input
                  type="text"
                  value={config.msgCall}
                  onChange={(e) => setConfig({ ...config, msgCall: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs text-[#111111]"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700">URL de Webhook (POST /webhook/set):</label>
                <input
                  type="url"
                  value={config.webhookUrl || ''}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  placeholder="https://seu-sistema.com/api/webhook/whatsapp"
                  className="w-full p-2.5 bg-white border border-[#E8D9C8] rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleSaveConfig}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: DISPATCH HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-slate-600">
                Log de Disparos WhatsApp Efetuados
              </h4>
              <button
                onClick={() => {
                  EvolutionApiService.clearHistory();
                  setHistory([]);
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar Histórico
              </button>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-[#E8D9C8] text-slate-500 text-xs">
                Nenhum disparo registrado no histórico até o momento.
              </div>
            ) : (
              <div className="border border-[#E8D9C8] rounded-2xl overflow-x-auto shadow-2xs">
                <table className="w-full min-w-[650px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#111111] text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="p-3">Horário</th>
                      <th className="p-3">Destinatário</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Conteúdo / Resumo</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D9C8]">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-[#FAF7F2]/40">
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {new Date(h.timestamp).toLocaleTimeString('pt-BR')} •{' '}
                          {new Date(h.timestamp).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3 font-bold text-[#111111]">
                          {h.recipientName || 'Veterinário'}
                          <span className="block font-mono text-[10px] text-slate-400">
                            {h.recipientNumber}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 border border-slate-200 text-slate-700">
                            {h.type}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-700 max-w-xs truncate">
                          {h.contentSummary}
                        </td>
                        <td className="p-3 text-center">
                          {h.status === 'SENT' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Enviado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="h-3 w-3 text-rose-600" />
                              Falha
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
