import {
  EvolutionApiConfig,
  EvolutionInstanceInfo,
  EvolutionMessageRecord,
  EvolutionMessageType,
  EvolutionMessageTemplate
} from '../types';

const STORAGE_KEYS = {
  CONFIG: 'vetcrm_evolution_api_config_v1',
  MESSAGES: 'vetcrm_evolution_messages_history_v1',
  TEMPLATES: 'vetcrm_evolution_templates_v1'
};

const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env || {};

const DEFAULT_CONFIG: EvolutionApiConfig = {
  serverUrl: metaEnv.VITE_EVOLUTION_API_URL || 'https://api.evolution-api.com',
  apiKey: metaEnv.VITE_EVOLUTION_API_KEY || '',
  instanceName: metaEnv.VITE_EVOLUTION_INSTANCE_NAME || 'matchpoint-promove',
  rejectCall: true,
  msgCall: 'Chamadas não são atendidas por este canal automatizado Match Point. Por favor, envie uma mensagem de texto ou WhatsApp.',
  groupsIgnore: true,
  alwaysOnline: true,
  readMessages: true,
  readStatus: true,
  syncFullHistory: false,
  webhookUrl: '',
  webhookEnabled: false
};

export const DEFAULT_TEMPLATES: EvolutionMessageTemplate[] = [
  {
    id: 'tpl-followup-7d',
    title: '1º Follow-up D+7 (Apresentação & Reforço)',
    category: 'follow_up_7d',
    type: 'text',
    textTemplate:
      'Olá Dr(a). {{nome_veterinario}}! Aqui é da equipe Match Point Promove representando {{nome_contratante}}.\n\nPassando para saber se teve a oportunidade de avaliar o material sobre {{interesse_servico}} apresentado na nossa última visita à {{clinica}}? Estamos à disposição para tirar qualquer dúvida!'
  },
  {
    id: 'tpl-followup-14d',
    title: '2º Follow-up D+14 (Manutenção & Parceria)',
    category: 'follow_up_14d',
    type: 'text',
    textTemplate:
      'Olá Dr(a). {{nome_veterinario}}, tudo bem? Gostaríamos de reforçar nosso suporte da {{nome_contratante}} para seus atendimentos em {{cidade}}.\n\nCaso precise de amostras, tabela de exames diagnósticos ou condições especiais de parceria, conte conosco!'
  },
  {
    id: 'tpl-aniversario',
    title: 'Felicitações de Aniversário Dr(a)',
    category: 'birthday',
    type: 'text',
    textTemplate:
      '🎉 Parabéns, Dr(a). {{nome_veterinario}}! Toda a equipe Match Point Promove e nossos parceiros veterinários desejam um feliz aniversário, com muito sucesso e realizações na sua carreira médica!'
  },
  {
    id: 'tpl-critico',
    title: 'Tratativa Prioritária / Resolução Imediata',
    category: 'critical',
    type: 'text',
    textTemplate:
      'Olá Dr(a). {{nome_veterinario}}, recebemos a sua pontuação a respeito de {{nome_contratante}} durante a visita. Queremos assegurar que sua solicitação já foi encaminhada com prioridade máxima para a diretoria técnica. Entraremos em contato para apresentar a solução.'
  },
  {
    id: 'tpl-catalogo-pdf',
    title: 'Catálogo Oficial & Tabela de Exames (PDF / Imagem)',
    category: 'catalog',
    type: 'media',
    textTemplate:
      'Segue anexo o catálogo técnico e a tabela atualizada de procedimentos e medicamentos de {{nome_contratante}} para a sua clínica {{clinica}}.',
    defaultMediaUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    caption: 'Guia Técnico de Serviços & Exames Match Point'
  }
];

function getLocal<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('EvolutionApi Storage error:', err);
  }
}

export const EvolutionApiService = {
  // Config Management
  getConfig: (): EvolutionApiConfig => getLocal<EvolutionApiConfig>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG),

  saveConfig: (cfg: Partial<EvolutionApiConfig>): EvolutionApiConfig => {
    const current = EvolutionApiService.getConfig();
    const updated = { ...current, ...cfg };
    setLocal(STORAGE_KEYS.CONFIG, updated);
    return updated;
  },

  // Templates
  getTemplates: (): EvolutionMessageTemplate[] =>
    getLocal<EvolutionMessageTemplate[]>(STORAGE_KEYS.TEMPLATES, DEFAULT_TEMPLATES),

  saveTemplate: (template: EvolutionMessageTemplate): void => {
    const list = EvolutionApiService.getTemplates();
    const idx = list.findIndex((t) => t.id === template.id);
    if (idx >= 0) list[idx] = template;
    else list.push(template);
    setLocal(STORAGE_KEYS.TEMPLATES, list);
  },

  deleteTemplate: (id: string): void => {
    const list = EvolutionApiService.getTemplates().filter((t) => t.id !== id);
    setLocal(STORAGE_KEYS.TEMPLATES, list);
  },

  // Message History
  getMessageHistory: (): EvolutionMessageRecord[] =>
    getLocal<EvolutionMessageRecord[]>(STORAGE_KEYS.MESSAGES, []),

  addMessageRecord: (
    rec: Omit<EvolutionMessageRecord, 'id' | 'timestamp'>
  ): EvolutionMessageRecord => {
    const history = EvolutionApiService.getMessageHistory();
    const newRec: EvolutionMessageRecord = {
      ...rec,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString()
    };
    history.unshift(newRec);
    setLocal(STORAGE_KEYS.MESSAGES, history.slice(0, 200));
    return newRec;
  },

  clearHistory: (): void => {
    setLocal(STORAGE_KEYS.MESSAGES, []);
  },

  // Sanitize phone number (Ensure digits only, add 55 if missing)
  formatPhoneNumber: (phone: string): string => {
    let clean = phone.replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean;
    }
    return clean;
  },

  // Helper Headers
  getHeaders: (cfg?: EvolutionApiConfig): HeadersInit => {
    const config = cfg || EvolutionApiService.getConfig();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (config.apiKey) {
      headers['apikey'] = config.apiKey.trim();
    }
    return headers;
  },

  // Clean Server URL
  getCleanUrl: (cfg?: EvolutionApiConfig): string => {
    const config = cfg || EvolutionApiService.getConfig();
    let url = (config.serverUrl || '').trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    return url;
  },

  // 1. Get Evolution API Server Info (GET /)
  getServerInfo: async (cfg?: EvolutionApiConfig): Promise<{
    success: boolean;
    status?: number;
    version?: string;
    message?: string;
    latencyMs?: number;
    error?: string;
  }> => {
    const start = performance.now();
    const cleanUrl = EvolutionApiService.getCleanUrl(cfg);

    if (!cleanUrl) {
      return { success: false, error: 'URL do servidor Evolution API não informada.' };
    }

    try {
      const response = await fetch(`${cleanUrl}/`, {
        method: 'GET',
        headers: EvolutionApiService.getHeaders(cfg)
      });
      const latencyMs = Math.round(performance.now() - start);

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          latencyMs,
          error: `Servidor retornou status HTTP ${response.status} (${response.statusText})`
        };
      }

      const data = await response.json();
      return {
        success: true,
        status: data.status || response.status,
        version: data.version || '1.7.4',
        message: data.message || 'Evolution API online',
        latencyMs
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: false,
        latencyMs,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  },

  // 2. Fetch Instance State (GET /instance/connectionState/{instance} or /instance/fetchInstances)
  getInstanceStatus: async (
    instanceName?: string,
    cfg?: EvolutionApiConfig
  ): Promise<{
    success: boolean;
    state: 'open' | 'close' | 'connecting' | 'created' | 'offline' | 'not_found';
    instanceInfo?: EvolutionInstanceInfo;
    error?: string;
  }> => {
    const config = cfg || EvolutionApiService.getConfig();
    const inst = instanceName || config.instanceName;
    const cleanUrl = EvolutionApiService.getCleanUrl(config);

    if (!cleanUrl || !inst) {
      return { success: false, state: 'offline', error: 'Configuração incompleta' };
    }

    try {
      const res = await fetch(`${cleanUrl}/instance/connectionState/${inst}`, {
        method: 'GET',
        headers: EvolutionApiService.getHeaders(config)
      });

      if (res.status === 404) {
        return {
          success: false,
          state: 'not_found',
          error: `Instância "${inst}" não existe no servidor.`
        };
      }

      if (!res.ok) {
        return {
          success: false,
          state: 'offline',
          error: `HTTP ${res.status}: ${res.statusText}`
        };
      }

      const data = await res.json();
      const rawState = data?.instance?.state || data?.state || 'close';

      return {
        success: true,
        state: rawState === 'open' ? 'open' : rawState === 'connecting' ? 'connecting' : 'close',
        instanceInfo: {
          instanceName: inst,
          status: rawState
        }
      };
    } catch (err) {
      return {
        success: false,
        state: 'offline',
        error: err instanceof Error ? err.message : String(err)
      };
    }
  },

  // 3. Connect Instance (Get QR Code / Pairing Code)
  connectInstance: async (
    instanceName?: string,
    cfg?: EvolutionApiConfig
  ): Promise<{
    success: boolean;
    qrcode?: string | null;
    pairingCode?: string | null;
    count?: number;
    error?: string;
  }> => {
    const config = cfg || EvolutionApiService.getConfig();
    const inst = instanceName || config.instanceName;
    const cleanUrl = EvolutionApiService.getCleanUrl(config);

    try {
      const res = await fetch(`${cleanUrl}/instance/connect/${inst}`, {
        method: 'GET',
        headers: EvolutionApiService.getHeaders(config)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errJson?.response?.message?.[0] || `HTTP ${res.status}: ${res.statusText}`
        };
      }

      const data = await res.json();
      return {
        success: true,
        qrcode: data.code || data.qrcode || data.base64 || null,
        pairingCode: data.pairingCode || null,
        count: data.count || 1
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  },

  // 4. Create Instance (POST /instance/create)
  createInstance: async (
    instanceName?: string,
    cfg?: EvolutionApiConfig
  ): Promise<{
    success: boolean;
    instanceId?: string;
    qrcode?: string | null;
    error?: string;
  }> => {
    const config = cfg || EvolutionApiService.getConfig();
    const inst = instanceName || config.instanceName;
    const cleanUrl = EvolutionApiService.getCleanUrl(config);

    const payload = {
      instanceName: inst,
      token: config.apiKey || undefined,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      rejectCall: config.rejectCall,
      msgCall: config.msgCall,
      groupsIgnore: config.groupsIgnore,
      alwaysOnline: config.alwaysOnline,
      readMessages: config.readMessages,
      readStatus: config.readStatus,
      syncFullHistory: config.syncFullHistory,
      ...(config.webhookUrl
        ? {
            webhook: {
              url: config.webhookUrl,
              byEvents: true,
              base64: true,
              events: ['APPLICATION_STARTUP', 'MESSAGES_UPSERT', 'CONNECTION_UPDATE']
            }
          }
        : {})
    };

    try {
      const res = await fetch(`${cleanUrl}/instance/create`, {
        method: 'POST',
        headers: EvolutionApiService.getHeaders(config),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data?.response?.message?.[0] || data?.message || `HTTP ${res.status}`
        };
      }

      return {
        success: true,
        instanceId: data?.instance?.instanceId,
        qrcode: data?.qrcode?.base64 || data?.qrcode?.code || null
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  },

  // 5. Restart Instance (PUT /instance/restart/{instance})
  restartInstance: async (
    instanceName?: string,
    cfg?: EvolutionApiConfig
  ): Promise<{ success: boolean; error?: string }> => {
    const config = cfg || EvolutionApiService.getConfig();
    const inst = instanceName || config.instanceName;
    const cleanUrl = EvolutionApiService.getCleanUrl(config);

    try {
      const res = await fetch(`${cleanUrl}/instance/restart/${inst}`, {
        method: 'PUT',
        headers: EvolutionApiService.getHeaders(config)
      });
      return { success: res.ok };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  // 6. Logout Instance (DELETE /instance/logout/{instance})
  logoutInstance: async (
    instanceName?: string,
    cfg?: EvolutionApiConfig
  ): Promise<{ success: boolean; error?: string }> => {
    const config = cfg || EvolutionApiService.getConfig();
    const inst = instanceName || config.instanceName;
    const cleanUrl = EvolutionApiService.getCleanUrl(config);

    try {
      const res = await fetch(`${cleanUrl}/instance/logout/${inst}`, {
        method: 'DELETE',
        headers: EvolutionApiService.getHeaders(config)
      });
      return { success: res.ok };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  // 7. Check if phone numbers are on WhatsApp (POST /chat/whatsappNumbers/{instance})
  checkWhatsAppNumber: async (
    number: string,
    instanceName?: string,
    cfg?: EvolutionApiConfig
  ): Promise<{
    exists: boolean;
    jid?: string;
    number?: string;
    error?: string;
  }> => {
    const config = cfg || EvolutionApiService.getConfig();
    const inst = instanceName || config.instanceName;
    const cleanUrl = EvolutionApiService.getCleanUrl(config);
    const cleanNumber = EvolutionApiService.formatPhoneNumber(number);

    try {
      const res = await fetch(`${cleanUrl}/chat/whatsappNumbers/${inst}`, {
        method: 'POST',
        headers: EvolutionApiService.getHeaders(config),
        body: JSON.stringify({ numbers: [cleanNumber] })
      });

      if (!res.ok) return { exists: false, error: `HTTP ${res.status}` };
      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : data;
      return {
        exists: Boolean(first?.exists),
        jid: first?.jid,
        number: first?.number || cleanNumber
      };
    } catch (err) {
      return { exists: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  // ==========================================
  // MESSAGE SENDING API METHODS (Evolution API)
  // ==========================================

  // A. Send Plain Text (POST /message/sendText/{instance})
  sendTextMessage: async (params: {
    number: string;
    text: string;
    recipientName?: string;
    delay?: number;
    linkPreview?: boolean;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const config = EvolutionApiService.getConfig();
    const cleanUrl = EvolutionApiService.getCleanUrl(config);
    const formattedNumber = EvolutionApiService.formatPhoneNumber(params.number);

    const payload = {
      number: formattedNumber,
      text: params.text,
      delay: params.delay || 1200,
      linkPreview: params.linkPreview !== undefined ? params.linkPreview : true
    };

    try {
      const res = await fetch(`${cleanUrl}/message/sendText/${config.instanceName}`, {
        method: 'POST',
        headers: EvolutionApiService.getHeaders(config),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      const isSuccess = res.ok;
      const messageId = data?.key?.id || `msg-${Date.now()}`;

      EvolutionApiService.addMessageRecord({
        type: 'text',
        recipientNumber: formattedNumber,
        recipientName: params.recipientName,
        contentSummary: params.text.length > 80 ? params.text.substring(0, 80) + '...' : params.text,
        status: isSuccess ? 'SENT' : 'ERROR',
        rawResponse: data,
        errorMessage: isSuccess ? undefined : data?.message || `HTTP ${res.status}`
      });

      return {
        success: isSuccess,
        messageId,
        error: isSuccess ? undefined : data?.message || `HTTP ${res.status}`
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      EvolutionApiService.addMessageRecord({
        type: 'text',
        recipientNumber: formattedNumber,
        recipientName: params.recipientName,
        contentSummary: params.text,
        status: 'ERROR',
        errorMessage: errMsg
      });
      return { success: false, error: errMsg };
    }
  },

  // B. Send Media: Images / PDF Catalog / Documents (POST /message/sendMedia/{instance})
  sendMediaMessage: async (params: {
    number: string;
    media: string; // URL or base64
    mediatype: 'image' | 'document' | 'video';
    mimetype: string;
    caption?: string;
    fileName?: string;
    recipientName?: string;
    delay?: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const config = EvolutionApiService.getConfig();
    const cleanUrl = EvolutionApiService.getCleanUrl(config);
    const formattedNumber = EvolutionApiService.formatPhoneNumber(params.number);

    const payload = {
      number: formattedNumber,
      mediatype: params.mediatype,
      mimetype: params.mimetype,
      caption: params.caption || '',
      media: params.media,
      fileName: params.fileName || (params.mediatype === 'image' ? 'imagem.jpg' : 'catalogo.pdf'),
      delay: params.delay || 1500
    };

    try {
      const res = await fetch(`${cleanUrl}/message/sendMedia/${config.instanceName}`, {
        method: 'POST',
        headers: EvolutionApiService.getHeaders(config),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      const isSuccess = res.ok;
      const messageId = data?.key?.id || `media-${Date.now()}`;

      EvolutionApiService.addMessageRecord({
        type: 'media',
        recipientNumber: formattedNumber,
        recipientName: params.recipientName,
        contentSummary: `[${params.mediatype.toUpperCase()}] ${params.caption || params.fileName || 'Arquivo enviado'}`,
        status: isSuccess ? 'SENT' : 'ERROR',
        rawResponse: data,
        errorMessage: isSuccess ? undefined : data?.message || `HTTP ${res.status}`
      });

      return {
        success: isSuccess,
        messageId,
        error: isSuccess ? undefined : data?.message || `HTTP ${res.status}`
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      EvolutionApiService.addMessageRecord({
        type: 'media',
        recipientNumber: formattedNumber,
        recipientName: params.recipientName,
        contentSummary: `[${params.mediatype.toUpperCase()}] Falha no envio`,
        status: 'ERROR',
        errorMessage: errMsg
      });
      return { success: false, error: errMsg };
    }
  },

  // C. Send WhatsApp Audio (PTT / Voice note) (POST /message/sendWhatsAppAudio/{instance})
  sendAudioMessage: async (params: {
    number: string;
    audio: string; // URL or base64 audio/mp3, audio/ogg, audio/mp4
    recipientName?: string;
    delay?: number;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const config = EvolutionApiService.getConfig();
    const cleanUrl = EvolutionApiService.getCleanUrl(config);
    const formattedNumber = EvolutionApiService.formatPhoneNumber(params.number);

    const payload = {
      number: formattedNumber,
      audio: params.audio,
      delay: params.delay || 1200
    };

    try {
      const res = await fetch(`${cleanUrl}/message/sendWhatsAppAudio/${config.instanceName}`, {
        method: 'POST',
        headers: EvolutionApiService.getHeaders(config),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      const isSuccess = res.ok;

      EvolutionApiService.addMessageRecord({
        type: 'audio',
        recipientNumber: formattedNumber,
        recipientName: params.recipientName,
        contentSummary: '🎙️ Mensagem de Áudio WhatsApp (PTT gravado)',
        status: isSuccess ? 'SENT' : 'ERROR',
        rawResponse: data,
        errorMessage: isSuccess ? undefined : data?.message || `HTTP ${res.status}`
      });

      return {
        success: isSuccess,
        messageId: data?.key?.id,
        error: isSuccess ? undefined : data?.message || `HTTP ${res.status}`
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg };
    }
  },

  // D. Send Sticker (POST /message/sendSticker/{instance})
  sendStickerMessage: async (params: {
    number: string;
    sticker: string; // URL or base64 webp
    recipientName?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const config = EvolutionApiService.getConfig();
    const cleanUrl = EvolutionApiService.getCleanUrl(config);
    const formattedNumber = EvolutionApiService.formatPhoneNumber(params.number);

    try {
      const res = await fetch(`${cleanUrl}/message/sendSticker/${config.instanceName}`, {
        method: 'POST',
        headers: EvolutionApiService.getHeaders(config),
        body: JSON.stringify({ number: formattedNumber, sticker: params.sticker })
      });
      const data = await res.json().catch(() => ({}));
      const isSuccess = res.ok;

      EvolutionApiService.addMessageRecord({
        type: 'sticker',
        recipientNumber: formattedNumber,
        recipientName: params.recipientName,
        contentSummary: '🏷️ Figurinha / Sticker Oficial Match Point',
        status: isSuccess ? 'SENT' : 'ERROR',
        rawResponse: data
      });

      return { success: isSuccess, error: isSuccess ? undefined : data?.message };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  // E. Send Location (POST /message/sendLocation/{instance})
  sendLocationMessage: async (params: {
    number: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    recipientName?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const config = EvolutionApiService.getConfig();
    const cleanUrl = EvolutionApiService.getCleanUrl(config);
    const formattedNumber = EvolutionApiService.formatPhoneNumber(params.number);

    const payload = {
      number: formattedNumber,
      name: params.name,
      address: params.address,
      latitude: params.latitude,
      longitude: params.longitude
    };

    try {
      const res = await fetch(`${cleanUrl}/message/sendLocation/${config.instanceName}`, {
        method: 'POST',
        headers: EvolutionApiService.getHeaders(config),
        body: JSON.stringify(payload)
      });
      const isSuccess = res.ok;

      EvolutionApiService.addMessageRecord({
        type: 'location',
        recipientNumber: formattedNumber,
        recipientName: params.recipientName,
        contentSummary: `📍 Localização: ${params.name} (${params.address})`,
        status: isSuccess ? 'SENT' : 'ERROR'
      });

      return { success: isSuccess };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  // F. Send VCard Contact (POST /message/sendContact/{instance})
  sendContactMessage: async (params: {
    number: string;
    fullName: string;
    phoneNumber: string;
    organization?: string;
    email?: string;
    url?: string;
    recipientName?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const config = EvolutionApiService.getConfig();
    const cleanUrl = EvolutionApiService.getCleanUrl(config);
    const formattedNumber = EvolutionApiService.formatPhoneNumber(params.number);

    const payload = {
      number: formattedNumber,
      contact: [
        {
          fullName: params.fullName,
          wuid: EvolutionApiService.formatPhoneNumber(params.phoneNumber),
          phoneNumber: params.phoneNumber,
          organization: params.organization || 'Match Point Promove',
          email: params.email || '',
          url: params.url || 'https://matchpoint.com.br'
        }
      ]
    };

    try {
      const res = await fetch(`${cleanUrl}/message/sendContact/${config.instanceName}`, {
        method: 'POST',
        headers: EvolutionApiService.getHeaders(config),
        body: JSON.stringify(payload)
      });
      const isSuccess = res.ok;

      EvolutionApiService.addMessageRecord({
        type: 'contact',
        recipientNumber: formattedNumber,
        recipientName: params.recipientName,
        contentSummary: `👤 Cartão de Contato: ${params.fullName} (${params.phoneNumber})`,
        status: isSuccess ? 'SENT' : 'ERROR'
      });

      return { success: isSuccess };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  // G. Send Poll (POST /message/sendPoll/{instance})
  sendPollMessage: async (params: {
    number: string;
    name: string;
    options: string[];
    selectableCount?: number;
    recipientName?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const config = EvolutionApiService.getConfig();
    const cleanUrl = EvolutionApiService.getCleanUrl(config);
    const formattedNumber = EvolutionApiService.formatPhoneNumber(params.number);

    const payload = {
      number: formattedNumber,
      name: params.name,
      selectableCount: params.selectableCount || 1,
      values: params.options
    };

    try {
      const res = await fetch(`${cleanUrl}/message/sendPoll/${config.instanceName}`, {
        method: 'POST',
        headers: EvolutionApiService.getHeaders(config),
        body: JSON.stringify(payload)
      });
      const isSuccess = res.ok;

      EvolutionApiService.addMessageRecord({
        type: 'poll',
        recipientNumber: formattedNumber,
        recipientName: params.recipientName,
        contentSummary: `📊 Enquete: "${params.name}" (${params.options.length} opções)`,
        status: isSuccess ? 'SENT' : 'ERROR'
      });

      return { success: isSuccess };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  // H. Send Reaction (POST /message/sendReaction/{instance})
  sendReactionMessage: async (params: {
    remoteJid: string;
    messageId: string;
    reaction: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const config = EvolutionApiService.getConfig();
    const cleanUrl = EvolutionApiService.getCleanUrl(config);

    const payload = {
      key: {
        remoteJid: params.remoteJid,
        fromMe: true,
        id: params.messageId
      },
      reaction: params.reaction
    };

    try {
      const res = await fetch(`${cleanUrl}/message/sendReaction/${config.instanceName}`, {
        method: 'POST',
        headers: EvolutionApiService.getHeaders(config),
        body: JSON.stringify(payload)
      });
      return { success: res.ok };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
};
