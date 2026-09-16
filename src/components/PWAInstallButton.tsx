import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Apple, Monitor, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'floating' | 'button' | 'compact' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'floating',
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, isStandalone, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If already running inside standalone PWA window or already marked installed, completely hide/disappear
  if (isStandalone || isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 5000);
      }
    } else {
      // Fallback for browsers that don't emit beforeinstallprompt (e.g. Firefox, Safari desktop)
      setShowIOSGuide(true);
    }
  };

  // If standard inline variant requested
  if (variant === 'banner') {
    return (
      <div
        id="banner-pwa-install"
        className={`bg-gradient-to-r from-[#1c1c1c] to-[#252525] border border-[#FF530D]/40 rounded-2xl p-3.5 sm:p-4 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FF530D] to-[#FBBF3D] flex items-center justify-center text-white shrink-0 shadow-md">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Instale o Match Point Promove no seu aparelho</span>
              <span className="px-1.5 py-0.2 rounded bg-[#FF530D]/20 text-[#FF530D] text-[9px] font-extrabold uppercase">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Acesso rápido direto da tela inicial no iOS, Android ou Windows sem precisar de loja.
            </p>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#FF530D] hover:bg-[#e04505] text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
        >
          <Download className="h-4 w-4" />
          <span>Instalar Aplicativo</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* FLOATING ACTION BUTTON / PILL WIDGET */}
      <div
        id="floating-pwa-install-container"
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-1.5 animate-fadeIn transition-all ${className}`}
      >
        {isCollapsed ? (
          <button
            id="btn-pwa-floating-minimized"
            onClick={() => setIsCollapsed(false)}
            className="h-12 w-12 rounded-full bg-gradient-to-r from-[#FF530D] to-[#FBBF3D] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-white/20"
            title="Instalar Match Point Promove (PWA)"
          >
            <Download className="h-5 w-5 animate-bounce" />
          </button>
        ) : (
          <div className="flex items-center bg-[#111111]/95 text-white border border-[#FF530D]/50 rounded-2xl shadow-2xl p-1.5 backdrop-blur-md transition-all">
            <button
              id="btn-pwa-floating-install"
              onClick={handleInstallClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#FF530D] to-[#FBBF3D] text-white text-xs font-black shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <div className="h-6 w-6 rounded-lg bg-black/20 flex items-center justify-center">
                <Download className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                  <span>Instalar App</span>
                  <span className="text-[9px] px-1 rounded bg-black/25 font-extrabold uppercase">
                    PWA
                  </span>
                </div>
                <div className="text-[9px] text-white/90 font-medium leading-none">
                  iOS, Android &amp; PC
                </div>
              </div>
            </button>

            {/* Quick minimize / close buttons */}
            <div className="flex flex-col gap-0.5 px-1">
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                title="Fechar aviso de instalação"
                aria-label="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* iOS Safari & General Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#1a1a1a] border border-[#333333] p-5 sm:p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#FF530D] flex items-center justify-center text-white shadow-md">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Como Instalar o Match Point</h3>
                  <p className="text-[10px] sm:text-xs text-slate-400">Aplicativo Web Progressivo (PWA)</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="h-8 w-8 rounded-full bg-[#252525] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-[#FBBF3D] font-bold">
                  <Apple className="h-4 w-4 text-white" />
                  <span>No iPhone ou iPad (Safari):</span>
                </div>
                <ol className="space-y-2.5 bg-[#141414] p-3.5 rounded-2xl border border-[#2a2a2a] list-decimal list-inside text-slate-200">
                  <li className="leading-relaxed">
                    Toque no botão de <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima <span className="text-[#FF530D] font-bold">⎋</span>) na barra do Safari.
                  </li>
                  <li className="leading-relaxed">
                    Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (ícone <span className="text-[#FF530D] font-bold">➕</span>).
                  </li>
                  <li className="leading-relaxed">
                    Confirme tocando em <strong>"Adicionar"</strong> no canto superior direito.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-[#FF530D] font-bold">
                  <Monitor className="h-4 w-4 text-white" />
                  <span>No Android ou Computador (Chrome / Edge):</span>
                </div>
                <ol className="space-y-2.5 bg-[#141414] p-3.5 rounded-2xl border border-[#2a2a2a] list-decimal list-inside text-slate-200">
                  <li className="leading-relaxed">
                    Clique no menu do navegador (três pontos <strong className="text-white">⋮</strong> no canto superior direito).
                  </li>
                  <li className="leading-relaxed">
                    Selecione <strong>"Instalar Match Point Promove"</strong> ou <strong>"Adicionar à tela principal"</strong>.
                  </li>
                  <li className="leading-relaxed">
                    O aplicativo será fixado na área de trabalho ou lista de apps nativos!
                  </li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-xl bg-[#FF530D] text-white text-xs sm:text-sm font-black hover:bg-[#e04505] transition-all cursor-pointer shadow-md active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {installSuccess && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#111111] border border-emerald-500/50 text-white p-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-black text-white">Instalação Iniciada!</div>
            <div className="text-[10px] text-slate-300">O app foi adicionado ao seu dispositivo.</div>
          </div>
        </div>
      )}
    </>
  );
};
