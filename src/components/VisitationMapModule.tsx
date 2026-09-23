import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  TrendingUp,
  SlidersHorizontal,
  Flame,
  Snowflake,
  Search,
  PlusCircle,
  Building,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Visit, Veterinarian, Tenant, User as PromoterUser } from '../types';
import { StorageService } from '../services/storage';

declare global {
  interface Window {
    google: any;
    initGoogleMapsCallback: any;
  }
}

// Coordinates for Brazilian state capitals and major hubs to position default visits nicely
const BRAZIL_HUBS = [
  { name: 'São Paulo - Zona Sul', lat: -23.595, lng: -46.685 },
  { name: 'São Paulo - Zona Norte', lat: -23.515, lng: -46.625 },
  { name: 'Campinas - SP', lat: -22.905, lng: -47.060 },
  { name: 'Rio de Janeiro - Barra', lat: -23.001, lng: -43.344 },
  { name: 'Rio de Janeiro - Botafogo', lat: -22.951, lng: -43.184 },
  { name: 'Belo Horizonte - Centro', lat: -19.921, lng: -43.937 },
  { name: 'Brasília - Asa Sul', lat: -15.801, lng: -47.891 },
  { name: 'Curitiba - Batel', lat: -25.442, lng: -49.289 },
  { name: 'Porto Alegre - Moinhos', lat: -30.026, lng: -51.204 },
  { name: 'Salvador - Pituba', lat: -12.998, lng: -38.468 },
  { name: 'Recife - Boa Viagem', lat: -8.118, lng: -34.898 },
  { name: 'Fortaleza - Meireles', lat: -3.726, lng: -38.498 }
];

const formatSafeDate = (dateStr: string | undefined): string => {
  if (!dateStr) return new Date().toLocaleDateString('pt-BR');
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // Try fallback with suffix
      const dFallback = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00Z');
      if (!isNaN(dFallback.getTime())) {
        return dFallback.toLocaleDateString('pt-BR');
      }
      return new Date().toLocaleDateString('pt-BR');
    }
    return d.toLocaleDateString('pt-BR');
  } catch {
    return new Date().toLocaleDateString('pt-BR');
  }
};

interface VisitationMapModuleProps {
  visits: Visit[];
  vets: Veterinarian[];
  tenants: Tenant[];
  promoters: PromoterUser[];
}

export const VisitationMapModule: React.FC<VisitationMapModuleProps> = ({
  visits,
  vets,
  tenants,
  promoters
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [heatmapInstance, setHeatmapInstance] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  // Filters state
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedPromoterId, setSelectedPromoterId] = useState<string>('ALL');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7' | '30' | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Simulation form states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simCityIndex, setSimCityIndex] = useState(0);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Script loading
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    const scriptId = 'google-maps-script';

    const tryInit = () => {
      if (window.google && window.google.maps && mapRef.current) {
        return initializeMap();
      }
      return false;
    };

    if (tryInit()) return;

    window.initGoogleMapsCallback = () => {
      tryInit();
    };

    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    const checkInterval = setInterval(() => {
      if (tryInit()) {
        clearInterval(checkInterval);
      }
    }, 500);

    return () => {
      clearInterval(checkInterval);
    };
  }, []);

  // Sync map center and display whenever active filters or data changed
  useEffect(() => {
    if (mapInstance) {
      updateMapData();
    }
  }, [mapInstance, visits, vets, showHeatmap, selectedPromoterId, selectedTenantId, selectedTimeframe, searchTerm]);

  const initializeMap = () => {
    try {
      if (!mapRef.current) return false;
      if (!window.google || !window.google.maps) return false;

      // Center of Brazil
      const defaultCenter = { lat: -15.7801, lng: -47.9292 };

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 4,
        styles: [
          {
            "elementType": "geometry",
            "stylers": [{ "color": "#f5f5f5" }]
          },
          {
            "elementType": "labels.icon",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#616161" }]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#f5f5f5" }]
          },
          {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#bdbdbd" }]
          },
          {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{ "color": "#eeeeee" }]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#757575" }]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#ffffff" }]
          },
          {
            "featureType": "road.arterial",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#757575" }]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{ "color": "#dadada" }]
          },
          {
            "featureType": "road.highway",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#616161" }]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#c9c9c9" }]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#9e9e9e" }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });

      setMapInstance(map);
      return true;
    } catch (err) {
      console.warn("Google Maps failed to initialize:", err);
      return false;
    }
  };

  const updateMapData = () => {
    if (!mapInstance) return;

    try {
      // 1. Filter the visits based on criteria
      const filteredVisits = visits.filter((v) => {
        // Promoter filter
        if (selectedPromoterId !== 'ALL' && v.promoter_id !== selectedPromoterId) {
          return false;
        }

        // Tenant/Clinica filter
        if (selectedTenantId !== 'ALL') {
          const matchingReports = v.reports || [];
          const hasTenantReport = matchingReports.some(r => r.tenant_id === selectedTenantId);
          if (!hasTenantReport) return false;
        }

        // Timeframe filter
        if (selectedTimeframe !== 'ALL') {
          const visitDate = new Date(v.visit_date);
          if (isNaN(visitDate.getTime())) {
            return false;
          }
          const diffTime = Math.abs(new Date().getTime() - visitDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > parseInt(selectedTimeframe, 10)) {
            return false;
          }
        }

        // Search term
        if (searchTerm) {
          const vet = vets.find((vet) => vet.id === v.veterinarian_id);
          const vetName = vet?.full_name?.toLowerCase() || '';
          const clinicName = vet?.workplace_name?.toLowerCase() || '';
          const neighborhood = vet?.neighborhood?.toLowerCase() || '';
          const term = searchTerm.toLowerCase();
          if (!vetName.includes(term) && !clinicName.includes(term) && !neighborhood.includes(term)) {
            return false;
          }
        }

        return true;
      });

      // 2. Clear old markers
      markers.forEach((m) => m.setMap(null));
      setMarkers([]);

      // 3. Setup Heatmap coordinates
      const heatmapPoints: any[] = [];
      const newMarkers: any[] = [];

      filteredVisits.forEach((v) => {
        const vet = vets.find((vet) => vet.id === v.veterinarian_id);
        if (!vet) return;

        // Resolve latitude/longitude: use stored georeference or assign a mock coordinates relative to hub to preserve exact map pin
        let lat = v.location_lat || vet.location_lat;
        let lng = v.location_lng || vet.location_lng;

        if (!lat || !lng) {
          // Fallback georeference to make sure it renders beautifully
          const stateHash = (vet.full_name || '').charCodeAt(0) % BRAZIL_HUBS.length;
          const hub = BRAZIL_HUBS[stateHash];
          // Jitter slightly to avoid overlap
          const jitterLat = (Math.random() - 0.5) * 0.08;
          const jitterLng = (Math.random() - 0.5) * 0.08;
          lat = hub.lat + jitterLat;
          lng = hub.lng + jitterLng;

          // Save georeference back for consistency
          v.location_lat = lat;
          v.location_lng = lng;
        }

        const point = new window.google.maps.LatLng(lat, lng);
        heatmapPoints.push(point);

        // Create interactive Map Pin
        const promoter = promoters.find((p) => p.id === v.promoter_id);
        const promoterName = promoter?.full_name || 'Promotor de Campo';

        const markerColor = v.reports?.some(r => r.critical_action_needed) ? '#D90000' : '#FF530D';

        const pinIcon = {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: markerColor,
          fillOpacity: 0.95,
          strokeColor: '#FFFFFF',
          strokeWeight: 1.5,
          scale: 1.5,
          anchor: new window.google.maps.Point(12, 24)
        };

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: showHeatmap ? null : mapInstance, // hide markers if only heatmap is requested, or show both
          icon: pinIcon,
          title: vet.workplace_name || vet.full_name
        });

        // Info Window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: sans-serif; padding: 10px; min-width: 220px; max-width: 280px; color: #111111;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <span style="background-color: ${markerColor}; width: 8px; height: 8px; border-radius: 50%;"></span>
                <strong style="font-size: 13px; color: #111111;">${vet.workplace_name || 'Clínica Veterinária'}</strong>
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #FF530D; margin-bottom: 4px;">
                Dr(a). ${vet.full_name} (${vet.specialty || 'Clínico Geral'})
              </div>
              <p style="font-size: 11px; color: #64748B; margin: 0 0 6px 0;">
                📍 Bairro: ${vet.neighborhood || '—'} | ${vet.city || '—'}-${vet.state || 'SP'}
              </p>
              <div style="border-top: 1px solid #E2E8F0; padding-top: 6px; font-size: 11px; color: #334155;">
                <div style="margin-bottom: 3px;"><strong>Promotor:</strong> ${promoterName}</div>
                <div style="margin-bottom: 3px;"><strong>Data:</strong> ${formatSafeDate(v.visit_date)}</div>
                <div><strong>Notas:</strong> ${v.general_notes || 'Sem observações adicionais.'}</div>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
        });

        newMarkers.push(marker);
      });

      setMarkers(newMarkers);

      // 4. Update Heatmap layer
      if (heatmapInstance) {
        heatmapInstance.setMap(null);
      }

      if (showHeatmap && heatmapPoints.length > 0 && window.google.maps.visualization) {
        const heatmap = new window.google.maps.visualization.HeatmapLayer({
          data: heatmapPoints,
          map: mapInstance,
          radius: 35,
          opacity: 0.85,
          gradient: [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 127, 255, 1)',
            'rgba(0, 63, 255, 1)',
            'rgba(0, 0, 255, 1)',
            'rgba(0, 75, 255, 1)',
            'rgba(0, 150, 255, 1)',
            'rgba(0, 225, 255, 1)',
            'rgba(0, 255, 150, 1)',
            'rgba(0, 255, 0, 1)',
            'rgba(125, 255, 0, 1)',
            'rgba(255, 255, 0, 1)',
            'rgba(255, 125, 0, 1)',
            'rgba(255, 0, 0, 1)'
          ]
        });
        setHeatmapInstance(heatmap);
      }
    } catch (err) {
      console.warn("Failed to update Google Maps data layers:", err);
    }
  };

  // Trigger simulated field checkin inside another region of Brazil to dynamically warm up the map
  const handleSimulateCheckin = () => {
    setIsSimulating(true);

    const targetHub = BRAZIL_HUBS[simCityIndex];
    const nextIndex = (simCityIndex + 1) % BRAZIL_HUBS.length;
    setSimCityIndex(nextIndex);

    // Generate simulated veterinarian inside the target hub
    const randomSurName = ['Silva', 'Santos', 'Oliveira', 'Pereira', 'Lima', 'Rodrigues'][Math.floor(Math.random() * 6)];
    const randomFirstName = ['Mariana', 'Thiago', 'Carla', 'Lucas', 'Juliana', 'Felipe'][Math.floor(Math.random() * 6)];
    const mockVetName = `Dr(a). ${randomFirstName} ${randomSurName}`;
    const mockClinicName = `Hospital Veterinário ${targetHub.name.split(' - ')[0]}`;

    const newVetData: Omit<Veterinarian, 'id' | 'created_at' | 'updated_at'> = {
      full_name: mockVetName,
      crmv: `CRMV-SP ${Math.floor(10000 + Math.random() * 90000)}`,
      specialty: ['Cardiologia', 'Dermatologia', 'Ortopedia', 'Imagem'][Math.floor(Math.random() * 4)],
      whatsapp: '(11) 98888-7777',
      birth_date: '1988-08-15',
      workplace_name: mockClinicName,
      workplace_type: 'Clínica Própria',
      address_street: 'Rua Principal, 100',
      neighborhood: 'Bairro Nobre',
      city: targetHub.name.includes(' - ') ? targetHub.name.split(' - ')[0] : targetHub.name,
      state: targetHub.name.includes('SP') ? 'SP' : (targetHub.name.includes('Rio') ? 'RJ' : 'MG'),
      target_audience_class: 'Classe A',
      notes_general: 'Simulação de georreferência automática',
      location_lat: targetHub.lat + (Math.random() - 0.5) * 0.05,
      location_lng: targetHub.lng + (Math.random() - 0.5) * 0.05
    };

    // Store the vet
    const createdVet = StorageService.addVeterinarian(newVetData);

    // Generate random check-in visit
    const activePromoter = promoters[0] || { id: 'user-promoter' };
    const mockVisitPayload = {
      promoter_id: activePromoter.id,
      veterinarian_id: createdVet.id,
      visit_date: new Date().toISOString(),
      general_notes: `Visita presencial georreferenciada via GPS em ${targetHub.name}. Alta receptividade.`,
      location_lat: newVetData.location_lat,
      location_lng: newVetData.location_lng,
      reports: tenants.slice(0, 2).map((t) => ({
        tenant_id: t.id,
        observations: `Apresentação dos laudos técnicos da ${t.trade_name}. Clínico demonstrou forte interesse nos diferenciais.`,
        sentiment: 'POSITIVE' as const,
        critical_action_needed: false
      }))
    };

    StorageService.createVisitWithReports(mockVisitPayload);

    // Show success notice
    setSuccessToast(`Visita simulada e georreferenciada com sucesso em ${targetHub.name}!`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);

    setIsSimulating(false);
  };

  // Stat calculations
  const totalCoveredVets = vets.length;
  const totalVisitsCount = visits.length;
  const uniqueCities = Array.from(new Set(vets.map((v) => v.city).filter(Boolean))).length;
  const uniqueStates = Array.from(new Set(vets.map((v) => v.state).filter(Boolean))).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#FF530D] text-white px-5 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-2.5 animate-bounce text-xs sm:text-sm">
          <TrendingUp className="h-4 w-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header and KPI Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8D9C8] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8D9C8] pb-6">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF530D] flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>Inteligência Geográfica • Match Point Promove</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Mapa de Visitação Nacional
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Acompanhe a densidade das visitas técnicas (regiões quentes e frias) e clique nos alfinetes para ver os relatórios de campo.
            </p>
          </div>

          <button
            type="button"
            disabled={isSimulating}
            onClick={handleSimulateCheckin}
            className="w-full sm:w-auto px-5 py-3 bg-[#111111] hover:bg-[#222222] text-white hover:text-[#FF530D] rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <PlusCircle className="h-4.5 w-4.5 text-[#FF530D]" />
            <span>{isSimulating ? 'Georreferenciando...' : 'Simular Visita Nacional'}</span>
          </button>
        </div>

        {/* Dynamic National Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FDF2E7]/70 p-4 rounded-2xl border border-[#E8D9C8] space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FF530D] block">Visitas em Campo</span>
            <div className="text-2xl font-black text-[#111111]">{totalVisitsCount}</div>
            <p className="text-[10px] text-slate-500 font-semibold">Total georreferenciado</p>
          </div>

          <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 block">Médicos Veterinários</span>
            <div className="text-2xl font-black text-sky-800">{totalCoveredVets}</div>
            <p className="text-[10px] text-sky-600 font-semibold">Na base de relacionamento</p>
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">Cidades Atendidas</span>
            <div className="text-2xl font-black text-emerald-800">{uniqueCities || 1}</div>
            <p className="text-[10px] text-emerald-600 font-semibold">Territórios mapeados</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 block">Estados Cobertos</span>
            <div className="text-2xl font-black text-purple-800">{uniqueStates || 1} UF</div>
            <p className="text-[10px] text-purple-600 font-semibold">Alcance nacional da marca</p>
          </div>
        </div>
      </div>

      {/* Main Interactive Map & Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Filter Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-[#E8D9C8] shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <SlidersHorizontal className="h-4.5 w-4.5 text-[#FF530D]" />
            <h4 className="font-black text-slate-800 text-sm sm:text-base">Filtros Geográficos</h4>
          </div>

          <div className="space-y-4">
            {/* Visualizer Mode Toggle */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Modo de Visualização</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowHeatmap(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    showHeatmap
                      ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Flame className="h-4 w-4" />
                  <span>Mapa de Calor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHeatmap(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    !showHeatmap
                      ? 'bg-[#111111] text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span>Pins de Visitas</span>
                </button>
              </div>
            </div>

            {/* Live Search */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Buscar Médico ou Clínica</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: Zona Sul, Dr. Lucas..."
                  className="w-full pl-9 pr-4 py-2 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#FF530D]/20"
                />
              </div>
            </div>

            {/* Promoter filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Filtrar por Promotor</label>
              <select
                value={selectedPromoterId}
                onChange={(e) => setSelectedPromoterId(e.target.value)}
                className="w-full p-2.5 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#FF530D]/20 cursor-pointer text-slate-800"
              >
                <option value="ALL">Todos os Promotores ({promoters.length})</option>
                {promoters.map((p) => (
                  <option key={p.id} value={p.id}>👤 {p.full_name}</option>
                ))}
              </select>
            </div>

            {/* Tenant/Clinica filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Filtrar por Marca / Representada</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full p-2.5 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#FF530D]/20 cursor-pointer text-slate-800"
              >
                <option value="ALL">Todas as Representadas ({tenants.length})</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>🏢 {t.trade_name}</option>
                ))}
              </select>
            </div>

            {/* Timeframe filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Período da Visita</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="w-full p-2.5 bg-[#FDF2E7]/60 border border-[#E8D9C8] rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#FF530D]/20 cursor-pointer text-slate-800"
              >
                <option value="ALL">Todo o Histórico</option>
                <option value="7">Últimos 7 Dias</option>
                <option value="30">Últimos 30 Dias</option>
              </select>
            </div>
          </div>

          {/* Color Legend */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Legenda de Temperatura</span>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="h-3.5 w-3.5 rounded bg-red-500 inline-block" />
                  <span>Região Quente (Alta Densidade)</span>
                </span>
                <span className="font-mono text-[10px] text-red-600 font-extrabold">&gt; 15 visitas</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="h-3.5 w-3.5 rounded bg-yellow-400 inline-block" />
                  <span>Região Morna (Média Densidade)</span>
                </span>
                <span className="font-mono text-[10px] text-yellow-600 font-extrabold">5-15 visitas</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="h-3.5 w-3.5 rounded bg-blue-500 inline-block" />
                  <span>Região Fria (Baixa Densidade)</span>
                </span>
                <span className="font-mono text-[10px] text-blue-600 font-extrabold">&lt; 5 visitas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Map Display Container */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E8D9C8] shadow-xs overflow-hidden flex flex-col min-h-[550px] relative">
          {/* Map wrapper */}
          <div ref={mapRef} className="w-full flex-1" style={{ minHeight: '500px' }} />

          {/* Inline alert/info */}
          <div className="p-3 bg-[#FDF2E7]/60 border-t border-[#E8D9C8] text-[10px] font-semibold text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-[#FF530D]" />
              <span>Chave Google Maps ativada com sucesso • Visualização 100% dinâmica.</span>
            </span>
            <span className="text-slate-400 uppercase text-[9px] font-bold">Match Point Promove • GPS Coords</span>
          </div>
        </div>
      </div>
    </div>
  );
};
