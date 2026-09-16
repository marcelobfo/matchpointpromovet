import React, { useState, useRef } from 'react';
import {
  X,
  UserPlus,
  Stethoscope,
  Phone,
  Instagram,
  MapPin,
  Building,
  Calendar,
  Star,
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Check
} from 'lucide-react';
import { Veterinarian } from '../types';

interface NewVetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (vet: Omit<Veterinarian, 'id' | 'created_at' | 'updated_at'>) => void;
  onSubmit?: (vet: Omit<Veterinarian, 'id' | 'created_at' | 'updated_at'>) => void;
  initialQuery?: string;
}

export const NewVetModal: React.FC<NewVetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSubmit,
  initialQuery = ''
}) => {
  const isCrmvLike = /crmv|\d{4,6}/i.test(initialQuery);

  const [fullName, setFullName] = useState(isCrmvLike ? '' : initialQuery);
  const [crmv, setCrmv] = useState(isCrmvLike ? initialQuery.toUpperCase() : '');
  const [specialty, setSpecialty] = useState('Clínica Geral & Cirurgia');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [workplaceName, setWorkplaceName] = useState('');
  const [workplaceType, setWorkplaceType] = useState<Veterinarian['workplace_type']>('Clínica Própria');
  const [addressStreet, setAddressStreet] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [targetClass, setTargetClass] = useState<Veterinarian['target_audience_class']>('Classe A');
  const [notesGeneral, setNotesGeneral] = useState('');

  if (!isOpen) return null;

  // Process image file to base64 with compression
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      // Compress using canvas to avoid large base64 strings
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressed);
        } else {
          setAvatarUrl(result);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !whatsapp) return;

    const payload: Omit<Veterinarian, 'id' | 'created_at' | 'updated_at'> = {
      full_name: fullName,
      crmv: crmv || `CRMV-${state} ${Math.floor(10000 + Math.random() * 90000)}`,
      specialty,
      whatsapp,
      instagram_handle: instagramHandle.startsWith('@') ? instagramHandle : instagramHandle ? `@${instagramHandle}` : undefined,
      birth_date: birthDate || undefined,
      avatar_url: avatarUrl || undefined,
      workplace_name: workplaceName || 'Clínica Veterinária',
      workplace_type: workplaceType,
      address_street: addressStreet || undefined,
      neighborhood: neighborhood || 'Bairro Central',
      city: city || 'São Paulo',
      state: state || 'SP',
      target_audience_class: targetClass,
      notes_general: notesGeneral || undefined
    };

    if (onSave) {
      onSave(payload);
    } else if (onSubmit) {
      onSubmit(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-0 sm:my-8 overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[95vh] flex flex-col pb-safe">
        {/* Header */}
        <div className="bg-[#111111] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between text-white border-b border-[#242424] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FF530D]/20 text-[#FF530D] rounded-lg border border-[#FF530D]/30 shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">Novo Cadastro de Médico-Veterinário</h3>
              <p className="text-[11px] text-[#FBBF3D]/80 truncate">Base Centralizada Master • Match Point Promove</p>
            </div>
          </div>
          <button
            id="btn-close-new-vet-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* PHOTO / AVATAR ATTACHMENT SECTION */}
          <div className="bg-[#FDF2E7]/70 border border-[#E8D9C8] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-[#FF530D]" />
                Foto do Médico-Veterinário (Opcional)
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-[11px] font-bold text-[#D90000] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover Foto
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Image Preview or Placeholder */}
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <div className="relative group">
                    <img
                      src={avatarUrl}
                      alt="Avatar do Veterinário"
                      className="h-20 w-20 rounded-2xl object-cover border-2 border-[#FF530D] shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold cursor-pointer"
                    >
                      Alterar
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 w-20 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#FF530D] bg-white flex flex-col items-center justify-center text-slate-400 hover:text-[#FF530D] transition-colors cursor-pointer"
                  >
                    <ImageIcon className="h-7 w-7 mb-0.5" />
                    <span className="text-[9px] font-bold">Sem Foto</span>
                  </div>
                )}
              </div>

              {/* Upload Zone & Link */}
              <div className="flex-1 w-full space-y-2">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-[#FF530D] bg-[#FF530D]/10'
                      : 'border-slate-300 hover:border-[#FF530D] bg-white'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    id="input-vet-avatar-file"
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-700 font-semibold">
                    <Upload className="h-4 w-4 text-[#FF530D]" />
                    <span>Clique ou arraste uma foto aqui</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Formatos JPG, PNG ou WebP (Câmera ou Galeria do Celular)
                  </p>
                </div>

                {/* Direct URL input fallback */}
                <div className="flex items-center gap-2">
                  <input
                    id="input-vet-avatar-url"
                    type="url"
                    placeholder="Ou cole o link direto da imagem (URL)..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Identification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nome Completo do Profissional *
              </label>
              <div className="relative">
                <input
                  id="input-vet-name"
                  type="text"
                  required
                  placeholder="Ex: Dra. Juliana Fernandes"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                CRMV (com Estado)
              </label>
              <input
                id="input-vet-crmv"
                type="text"
                placeholder="Ex: CRMV-SP 45.192"
                value={crmv}
                onChange={(e) => setCrmv(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* Specialty & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Especialidade Principal
              </label>
              <select
                id="select-vet-specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none bg-white"
              >
                <option value="Clínica Geral & Cirurgia">Clínica Geral & Cirurgia</option>
                <option value="Ortopedia & Traumatologia">Ortopedia & Traumatologia</option>
                <option value="Cardiologia Veterinária">Cardiologia Veterinária</option>
                <option value="Dermatologia & Alergologia">Dermatologia & Alergologia</option>
                <option value="Oncologia & Quimioterapia">Oncologia & Quimioterapia</option>
                <option value="Neurologia Felina e Canina">Neurologia Felina e Canina</option>
                <option value="Nefrologia & Urologia">Nefrologia & Urologia</option>
                <option value="Oftalmologia Veterinária">Oftalmologia Veterinária</option>
                <option value="Medicina de Felinos">Medicina de Felinos</option>
                <option value="Diagnóstico por Imagem">Diagnóstico por Imagem</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp de Contato *
              </label>
              <div className="relative">
                <input
                  id="input-vet-whatsapp"
                  type="text"
                  required
                  placeholder="(11) 98888-7777"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Instagram (@perfil)
              </label>
              <input
                id="input-vet-instagram"
                type="text"
                placeholder="@dr.exemplo.vet"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
              />
            </div>
          </div>

          {/* Workplace & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Local de Atendimento Principal
              </label>
              <input
                id="input-vet-workplace"
                type="text"
                placeholder="Ex: Hospital Veterinário Anália Franco 24h"
                value={workplaceName}
                onChange={(e) => setWorkplaceName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Estabelecimento
              </label>
              <select
                id="select-vet-workplace-type"
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value as Veterinarian['workplace_type'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none bg-white"
              >
                <option value="Clínica Própria">Clínica Própria</option>
                <option value="Hospital 24h">Hospital 24h</option>
                <option value="Centro Diagnóstico">Centro Diagnóstico</option>
                <option value="Consultório">Consultório</option>
                <option value="Volante / Autônomo">Volante / Autônomo</option>
              </select>
            </div>
          </div>

          {/* Address & Neighborhood */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Endereço / Logradouro
              </label>
              <input
                id="input-vet-street"
                type="text"
                placeholder="Rua, Avenida, Número..."
                value={addressStreet}
                onChange={(e) => setAddressStreet(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bairro
              </label>
              <input
                id="input-vet-neighborhood"
                type="text"
                placeholder="Ex: Jardins / Moema"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cidade / UF
              </label>
              <div className="flex gap-1.5">
                <input
                  id="input-vet-city"
                  type="text"
                  placeholder="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-3/4 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
                />
                <input
                  id="input-vet-state"
                  type="text"
                  maxLength={2}
                  placeholder="UF"
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  className="w-1/4 px-2 py-2 text-sm text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Birthday & Target Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Data de Aniversário (Régua de Relacionamento)
              </label>
              <input
                id="input-vet-birthday"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Padrão / Classe do Público-Alvo
              </label>
              <select
                id="select-vet-target-class"
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value as Veterinarian['target_audience_class'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none bg-white"
              >
                <option value="Classe A">Classe A (Alto Padrão / Exigência Máxima)</option>
                <option value="Classe B">Classe B (Padrão Médio-Alto)</option>
                <option value="Classe C">Classe C (Popular / Alto Volume)</option>
                <option value="Misto">Misto</option>
              </select>
            </div>
          </div>

          {/* General background notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observações Gerais do Profissional
            </label>
            <textarea
              id="input-vet-general-notes"
              rows={2}
              placeholder="Ex: Prefere atendimento no período da manhã, exige laudos rápidos, prescreve medicamentos manipulados líquidos..."
              value={notesGeneral}
              onChange={(e) => setNotesGeneral(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF530D] focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <button
              id="btn-cancel-new-vet"
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              id="btn-save-new-vet"
              type="submit"
              className="py-3 px-5 text-sm font-bold bg-[#FF530D] hover:bg-[#e04505] text-white rounded-xl shadow-md shadow-[#FF530D]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Salvar & Selecionar para Visita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
