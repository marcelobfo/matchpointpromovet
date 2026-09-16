import React, { useState } from 'react';
import { Cake, Send, X, Bell, ChevronRight, Gift, Sparkles } from 'lucide-react';
import { Veterinarian, Tenant, UserRole } from '../types';

interface BirthdayNotificationBannerProps {
  vets: Veterinarian[];
  currentTenant?: Tenant | null;
  currentUserRole: UserRole;
  onOpenVetProfile?: (vet: Veterinarian) => void;
}

export const BirthdayNotificationBanner: React.FC<BirthdayNotificationBannerProps> = ({
  vets,
  currentTenant,
  currentUserRole,
  onOpenVetProfile
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Compute birthdays
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const birthdayVets = vets.filter((v) => {
    if (!v.birth_date) return false;
    const parts = v.birth_date.split('-');
    if (parts.length < 3) return false;
    const month = parseInt(parts[1], 10);
    return month === currentMonth;
  });

  const todayBdayVets = birthdayVets.filter((v) => {
    const parts = v.birth_date!.split('-');
    const day = parseInt(parts[2], 10);
    return day === currentDay;
  });

  if (isDismissed || birthdayVets.length === 0) return null;

  const senderName = currentTenant
    ? currentTenant.trade_name
    : 'Match Point Promove';

  const handleSendGreeting = (vet: Veterinarian) => {
    const cleanPhone = vet.whatsapp.replace(/\D/g, '');
    const greetingText = `Olá Dr(a). ${vet.full_name}! 🎂\n\nAqui é da equipe ${senderName}.\nPassando para desejar um Feliz Aniversário repleto de muita saúde, realizações e sucesso contínuo na sua jornada na Medicina Veterinária! 🎉🐾\n\nParabéns pelo seu dia! 🎈`;
    const encoded = encodeURIComponent(greetingText);
    window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="bg-[#111111] border-2 border-[#FBBF3D] text-white rounded-2xl p-4 shadow-xl mb-6 relative overflow-hidden transition-all animate-fadeIn">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FBBF3D] via-[#FF530D] to-[#D90000]" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#FBBF3D] text-[#111111] flex items-center justify-center font-black shrink-0 shadow-md mt-0.5 sm:mt-0">
            <Cake className="h-5 w-5 animate-bounce" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FBBF3D] text-[#111111]">
                Alerta de Relacionamento
              </span>
              <h4 className="font-extrabold text-sm sm:text-base text-white flex flex-wrap items-center gap-1.5 leading-tight">
                <span>Aniversariantes do Mês ({birthdayVets.length})</span>
                {todayBdayVets.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    🎂 {todayBdayVets.length} Aniversariando HOJE!
                  </span>
                )}
              </h4>
            </div>
            <p className="text-xs text-[#FDF2E7]/80 leading-relaxed">
              Fortaleça o vínculo médico enviando os parabéns oficiais pelo <strong>WhatsApp Web</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-[#2a2a2a] pt-2.5 sm:pt-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3.5 py-1.5 bg-[#FF530D] hover:bg-[#e04505] text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>{isExpanded ? 'Recolher' : 'Ver Aniversariantes & Parabenizar'}</span>
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar notificação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded Birthday List */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-fadeIn">
          {birthdayVets.map((vet) => {
            const parts = vet.birth_date!.split('-');
            const day = parts[2];
            const isToday = parseInt(day, 10) === currentDay;

            return (
              <div
                key={vet.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                  isToday
                    ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500'
                    : 'bg-[#1a1a1a] border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-white">{vet.full_name}</span>
                      {isToday && (
                        <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded">
                          HOJE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#FBBF3D] font-bold">{vet.crmv} • {vet.specialty}</div>
                    <div className="text-[10px] text-slate-400">{vet.workplace_name} ({vet.neighborhood})</div>
                  </div>

                  <span className="text-xs font-black text-[#FBBF3D] bg-black/40 px-2 py-0.5 rounded-lg border border-slate-700 shrink-0">
                    Dia {day}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleSendGreeting(vet)}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Send className="h-3 w-3" />
                    <span>WhatsApp Web</span>
                  </button>

                  {onOpenVetProfile && (
                    <button
                      type="button"
                      onClick={() => onOpenVetProfile(vet)}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Dossiê
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
