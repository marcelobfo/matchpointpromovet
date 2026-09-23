import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Lock,
  X,
  PenTool,
  Type,
  AlertTriangle,
  Download,
  ExternalLink,
  RefreshCw,
  Send
} from 'lucide-react';
import { Tenant } from '../types';
import { StorageService } from '../services/storage';

interface ZapSignSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  onSigned: () => void;
}

export const ZapSignSignatureModal: React.FC<ZapSignSignatureModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSigned
}) => {
  const [signerName, setSignerName] = useState(tenant.technical_responsible || '');
  const [signerCpf, setSignerCpf] = useState('');
  const [signerEmail, setSignerEmail] = useState(tenant.email || '');
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState(tenant.technical_responsible || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'view' | 'sign' | 'success'>('view');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('view');
      setHasDrawn(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'sign' && signatureType === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      canvas.style.width = `${canvas.offsetWidth}px`;
      canvas.style.height = `${canvas.offsetHeight}px`;

      const context = canvas.getContext('2d');
      if (context) {
        context.scale(2, 2);
        context.lineCap = 'round';
        context.strokeStyle = '#0284C7'; // ZapSign Sky Blue ink color
        context.lineWidth = 2.5;
        contextRef.current = context;
      }
    }
  }, [step, signatureType]);

  if (!isOpen) return null;

  // Drawing Handlers for Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!contextRef.current || !canvasRef.current) return;
    
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;

    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!contextRef.current || !canvasRef.current) return;
    contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
  };

  const handleConfirmSignature = () => {
    if (signatureType === 'draw' && !hasDrawn) {
      alert('Por favor, desenhe sua assinatura no campo indicado.');
      return;
    }
    if (signatureType === 'type' && !typedSignature.trim()) {
      alert('Por favor, digite seu nome completo para a assinatura.');
      return;
    }
    if (!signerName.trim() || !signerEmail.trim()) {
      alert('Preencha os campos obrigatórios (Nome e E-mail).');
      return;
    }

    setIsSubmitting(true);

    // Simulate ZapSign api signing and Webhook call
    setTimeout(() => {
      const updatedTenant = StorageService.updateTenant(tenant.id, {
        contract_status: 'signed',
        contract_signed_at: new Date().toISOString(),
        contract_pdf_url: `https://sandbox.api.zapsign.com.br/v1/docs/${tenant.contract_token}/signed_complete.pdf`
      });

      setIsSubmitting(false);
      setStep('success');
      
      if (onSigned) {
        onSigned();
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F8FAFC] w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh] max-h-[800px] animate-scaleIn">
        
        {/* Left Side: Document Preview Panel */}
        <div className="flex-1 bg-slate-100 p-4 sm:p-6 flex flex-col justify-between border-r border-slate-200 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-sky-100 text-sky-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-sky-200">
                ZapSign Sandbox Simulator
              </span>
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-emerald-600" />
                <span>Criptografia SSL de 256 bits</span>
              </span>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs max-h-[50vh] md:max-h-[60vh] overflow-y-auto select-none relative font-serif text-slate-800 leading-relaxed text-xs">
              <div className="absolute top-3 right-3 text-[10px] uppercase font-mono text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-sm bg-slate-50">
                Minuta Digital
              </div>
              <div className="whitespace-pre-line text-slate-700">
                {tenant.contract_text || 'Gerando contrato...'}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-4 text-center font-semibold">
            Este documento está hospedado de forma segura nos servidores homologados da ZapSign.
          </p>
        </div>

        {/* Right Side: ZapSign Signature Portal */}
        <div className="w-full md:w-[380px] bg-white p-6 flex flex-col justify-between overflow-y-auto relative border-t md:border-t-0 border-slate-200">
          
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                ZS
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base leading-none">ZapSign</h3>
                <span className="text-[10px] text-slate-400 font-bold">Assinatura Eletrônica Simplificada</span>
              </div>
            </div>
          </div>

          {step === 'view' && (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h4 className="font-black text-slate-800 text-sm">
                  Pronto para assinar!
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Para prosseguir com a assinatura digital eletrônica deste contrato, confirme seus dados e avance para a assinatura.
                </p>

                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-xs">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Empresa Contratante</span>
                    <span className="text-slate-700 font-extrabold">{tenant.trade_name}</span>
                  </div>
                  <div className="text-xs border-t border-slate-200/60 pt-2">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Razão Social</span>
                    <span className="text-slate-600 font-semibold">{tenant.company_name}</span>
                  </div>
                  <div className="text-xs border-t border-slate-200/60 pt-2">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">CNPJ</span>
                    <span className="text-slate-600 font-mono font-bold">{tenant.cnpj || 'Não cadastrado'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('sign')}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-sky-500/10 active:scale-95"
              >
                <span>Prosseguir para Assinatura</span>
                <PenTool className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 'sign' && (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <h4 className="font-black text-slate-800 text-sm">
                  Dados do Signatário
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={signerName}
                      onChange={(e) => {
                        setSignerName(e.target.value);
                        setTypedSignature(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15"
                      placeholder="Nome do representante legal"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      required
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15"
                      placeholder="representante@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      CPF (Opcional)
                    </label>
                    <input
                      type="text"
                      value={signerCpf}
                      onChange={(e) => setSignerCpf(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                {/* Signature Tab Selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                    <button
                      type="button"
                      onClick={() => setSignatureType('draw')}
                      className={`pb-1 text-[11px] font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                        signatureType === 'draw'
                          ? 'border-sky-500 text-sky-600'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <PenTool className="h-3 w-3" />
                      <span>Desenhar Rubrica</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureType('type')}
                      className={`pb-1 text-[11px] font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                        signatureType === 'type'
                          ? 'border-sky-500 text-sky-600'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Type className="h-3 w-3" />
                      <span>Digitar Rubrica</span>
                    </button>
                  </div>

                  {signatureType === 'draw' ? (
                    <div className="space-y-1.5">
                      <div className="relative border-2 border-dashed border-sky-200 rounded-2xl overflow-hidden bg-slate-50 h-32 cursor-crosshair">
                        <canvas
                          ref={canvasRef}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="absolute inset-0 w-full h-full block touch-none"
                        />
                        {!hasDrawn && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none select-none text-[10px] font-bold">
                            <PenTool className="h-4 w-4 mb-1 text-slate-300" />
                            <span>Assine ou desenhe aqui</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase cursor-pointer"
                        >
                          Limpar Tela
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        className="w-full px-3 py-3 border-2 border-sky-100 rounded-xl bg-sky-50/20 text-center font-serif italic text-sm text-sky-700 font-bold focus:outline-hidden"
                        placeholder="Iniciais ou Nome Completo"
                      />
                      <span className="text-[9px] text-slate-400 block text-center font-bold">
                        A ZapSign gerará uma assinatura tipográfica com fé pública.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmSignature}
                  className={`w-full py-3 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-500/10 cursor-pointer ${
                    isSubmitting ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-600 active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Processando Assinatura...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Assinar Contrato Digital</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('view')}
                  className="w-full py-1 text-slate-400 hover:text-slate-600 text-center font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Voltar para o Contrato
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-4 text-center py-6">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-200 animate-bounce">
                  <CheckCircle2 className="h-10 w-10" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-black text-emerald-950 text-base leading-tight">
                    Documento Assinado!
                  </h4>
                  <p className="text-xs text-emerald-700 font-semibold leading-relaxed">
                    Assinatura eletrônica realizada com total validade jurídica nos termos da MP 2.200-2/2001.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-left">
                  <div className="text-[10px] text-slate-600 font-semibold space-y-1">
                    <div>
                      <strong>IP de Origem:</strong> <span className="font-mono">177.34.120.91</span>
                    </div>
                    <div>
                      <strong>Assinado por:</strong> {signerName}
                    </div>
                    <div>
                      <strong>Token do Doc:</strong> <span className="font-mono text-[9px] bg-slate-200 px-1 rounded-xs">{tenant.contract_token}</span>
                    </div>
                    <div>
                      <strong>Hash do Certificado:</strong> <span className="font-mono text-[9px] block truncate">SHA256: 8f2b3e4d5c6b7a8f...</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Webhook Notice */}
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-left text-[10px] text-amber-800 leading-relaxed font-medium">
                  <span className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                    <Send className="h-3 w-3" />
                    <span>Webhook Simulado Enviado!</span>
                  </span>
                  <span>O simulador disparou um payload do tipo <code>doc_signed</code> atualizando o sistema de imediato.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>Concluir e Voltar ao CRM</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
