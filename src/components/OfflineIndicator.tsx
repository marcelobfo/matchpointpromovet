import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-badge"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#111111] to-[#222222] border border-amber-500/50 px-3.5 py-2 text-xs font-bold text-amber-300 shadow-2xl animate-fadeIn"
    >
      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
      <WifiOff className="h-3.5 w-3.5 text-amber-400" />
      <span>Modo Offline — Dados em cache ativos</span>
    </div>
  );
};
