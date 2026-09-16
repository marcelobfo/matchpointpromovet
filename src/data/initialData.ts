import { Tenant, User, Veterinarian, Visit, VisitReport, FollowUpTask, InstagramPostLead } from '../types';

// Complete Demonstration Seed for Represented Contractors
export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-mova',
    company_name: 'Mova Diagnósticos e Especialidades Veterinárias Ltda',
    trade_name: 'Mova Diagnósticos',
    cnpj: '34.892.110/0001-45',
    segment: 'Diagnóstico por Imagem e Cardiologia Veterinária Avançada',
    color_theme: '#FF530D',
    phone: '(11) 3195-8800',
    email: 'contato@movadiagnosticos.com.br',
    website: 'https://movadiagnosticos.com.br',
    whatsapp_emergencies: '(11) 98822-4411',
    address_street: 'Avenida Brigadeiro Luís Antônio, 3421',
    neighborhood: 'Jardim Paulista',
    city: 'São Paulo',
    state: 'SP',
    cep: '01401-001',
    technical_responsible: 'Dr. Roberto Almeida',
    technical_crmv: 'CRMV-SP 18.940',
    operating_hours: 'Segunda a Sexta: 07:30 às 20:00 | Sábados: 08:00 às 17:00 | Plantão 24h para Urgências',
    description: 'Centro de excelência médica e referência em diagnóstico por imagem de alta complexidade e cardiologia veterinária. Equipamentos de última geração com laudos emitidos exclusivamente por médicos-veterinários especialistas.',
    differential: 'Laudos express em até 2 horas para emergências, visualizador PACS em nuvem com acesso direto para o clínico solicitante, centro cirúrgico auxiliar e suporte anestésico dedicado durante exames tomográficos e de ressonância.',
    services_offered: [
      'Tomografia Computadorizada Multislice 3D',
      'Ressonância Magnética Veterinária de Alto Campo',
      'Ecocardiograma com Doppler Contínuo e Pulsátil',
      'Ultrassonografia Abdominal com Doppler e POCUS Beira-Leito',
      'Radiologia Digital Direta (DR) de Alta Resolução',
      'Eletrocardiograma Digital e Holter 24 Horas',
      'Citologia e Biópsia Guiada por Imagem',
      'Pressão Arterial Sistêmica por Doppler Vascular'
    ],
    is_active: true,
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z'
  },
  {
    id: 'tenant-vetlab',
    company_name: 'VetLab Diagnósticos Clínicos e Toxicológicos Veterinários Ltda',
    trade_name: 'VetLab Patologia & Análises',
    cnpj: '45.102.889/0001-32',
    segment: 'Laboratório de Análises Clínicas, Biologia Molecular e Patologia',
    color_theme: '#0284C7',
    phone: '(11) 3288-4100',
    email: 'diretoria@vetlabdiagnosticos.com.br',
    website: 'https://vetlabdiagnosticos.com.br',
    whatsapp_emergencies: '(11) 97711-2299',
    address_street: 'Rua Bela Cintra, 1420',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    state: 'SP',
    cep: '01415-001',
    technical_responsible: 'Dra. Patrícia Fontes',
    technical_crmv: 'CRMV-SP 24.119',
    operating_hours: 'Segunda a Sexta: 07:00 às 21:00 | Sábados: 08:00 às 18:00 | Coleta Domiciliar e Plantão 24h',
    description: 'Laboratório referência em medicina diagnóstica laboratorial, com perfil bioquímico ampliado, PCR em tempo real e laudos emitidos por patologistas clínicos especialistas.',
    differential: 'Resultados de hemograma e bioquímica de urgência em até 45 minutos, plataforma online de consulta para o veterinário, motoboy exclusivo de coleta rápida e painéis genéticos avançados.',
    services_offered: [
      'Hemograma Completo com Morfologia Celular',
      'Perfil Bioquímico Renal e Hepático Expandido',
      'Painel de PCR em Tempo Real (Virologia e Bacteriologia)',
      'Exame Coproparasitológico e Urinálise Tipo 1',
      'Citologia Aspirativa e Biópsia Histopatológica',
      'Endocrinologia (Dosagem Hormonal T4, Cortisol, Insulina)',
      'Microbiologia e Antibiograma Automatizado (VITEK)',
      'Painel de Alergologia e Sorologia Infecciosa'
    ],
    is_active: true,
    created_at: '2026-01-12T00:00:00Z',
    updated_at: '2026-01-12T00:00:00Z'
  },
  {
    id: 'tenant-cardiopet',
    company_name: 'CardioPet Centro de Cardiologia e Hemodinâmica Veterinária Ltda',
    trade_name: 'CardioPet Intervenção',
    cnpj: '28.654.312/0001-90',
    segment: 'Cardiologia Veterinária de Alta Complexidade e Eletrofisiologia',
    color_theme: '#059669',
    phone: '(11) 3450-9900',
    email: 'contato@cardiopetcenter.com.br',
    website: 'https://cardiopetcenter.com.br',
    whatsapp_emergencies: '(11) 98155-4433',
    address_street: 'Alameda dos Maracatins, 950',
    neighborhood: 'Moema',
    city: 'São Paulo',
    state: 'SP',
    cep: '04089-001',
    technical_responsible: 'Dr. Eduardo Vasconcelos',
    technical_crmv: 'CRMV-SP 31.850',
    operating_hours: 'Segunda a Sexta: 08:00 às 20:00 | Sábados: 08:00 às 16:00 | Suporte Cardiológico 24h',
    description: 'Centro especializado em cardiopatias congênitas e adquiridas, arritmias e procedimentos intervencionistas minimamente invasivos em cães e gatos.',
    differential: 'Equipamento de ecocardiografia com speckle tracking 4D, marcapasso temporário e definitivo, telelaudo de ECG em 15 minutos e consultoria direta de prescrição com cardiologistas.',
    services_offered: [
      'Ecocardiograma Transtorácico e Transesofágico 4D',
      'Holter Digital 24h e 48h com Laudo Especializado',
      'Eletrocardiografia de Alta Resolução (ECG Digital)',
      'Mapeamento Eletrofisiológico e Tratamento de Arritmias',
      'Pressão Arterial por Oscilometria de Alta Definição (HDO)',
      'Intervenção e Oclusão de PCA Minimamente Invasiva',
      'Implante de Marcapasso Cardíaco Veterinário',
      'Avaliação Pré-Anestésica e Risco Cirúrgico Cardiológico'
    ],
    is_active: true,
    created_at: '2026-01-14T00:00:00Z',
    updated_at: '2026-01-14T00:00:00Z'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    tenant_id: null,
    full_name: 'Administrador Match Point',
    email: 'admin@matchpoint.com.br',
    role: 'super_admin',
    phone: '(27) 99273-5244',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-promoter-lucas',
    tenant_id: null,
    full_name: 'Lucas Rocha Mendes',
    email: 'lucas.promotor@matchpoint.com.br',
    role: 'promoter',
    phone: '(11) 97123-8844',
    is_active: true,
    created_at: '2026-01-15T00:00:00Z'
  },
  {
    id: 'user-promoter-juliana',
    tenant_id: null,
    full_name: 'Juliana Vasconcelos',
    email: 'juliana.promotora@matchpoint.com.br',
    role: 'promoter',
    phone: '(11) 98341-9922',
    is_active: true,
    created_at: '2026-02-01T00:00:00Z'
  },
  {
    id: 'user-client-mova',
    tenant_id: 'tenant-mova',
    full_name: 'Dr. Roberto Almeida (Diretor Mova)',
    email: 'diretoria@movadiagnosticos.com.br',
    role: 'tenant_client',
    phone: '(11) 98822-4411',
    is_active: true,
    created_at: '2026-01-10T00:00:00Z'
  },
  {
    id: 'user-client-vetlab',
    tenant_id: 'tenant-vetlab',
    full_name: 'Dra. Patrícia Fontes (Diretora VetLab)',
    email: 'diretoria@vetlabdiagnosticos.com.br',
    role: 'tenant_client',
    phone: '(11) 97711-2299',
    is_active: true,
    created_at: '2026-01-12T00:00:00Z'
  },
  {
    id: 'user-client-cardiopet',
    tenant_id: 'tenant-cardiopet',
    full_name: 'Dr. Eduardo Vasconcelos (Diretor CardioPet)',
    email: 'contato@cardiopetcenter.com.br',
    role: 'tenant_client',
    phone: '(11) 98155-4433',
    is_active: true,
    created_at: '2026-01-14T00:00:00Z'
  }
];

export const INITIAL_VETS: Veterinarian[] = [
  {
    id: 'vet-camila-silveira',
    full_name: 'Dra. Camila Albuquerque Silveira',
    crmv: 'CRMV-SP 38.419',
    specialty: 'Clínica Geral, Cardiologia e Cirurgia',
    whatsapp: '(11) 98452-9011',
    instagram_handle: '@dracamila_vet',
    birth_date: '1988-09-24',
    workplace_name: 'Hospital Veterinário PetCare Jardim Paulista',
    workplace_type: 'Hospital 24h',
    address_street: 'Alameda dos Guaiases, 780',
    neighborhood: 'Jardim Paulista',
    city: 'São Paulo',
    state: 'SP',
    target_audience_class: 'Classe A',
    notes_general: 'Atende terças e quintas à tarde (14h às 18h). Foco em ecocardiograma, laudos e suporte cirúrgico de pequenos animais. Muito receptiva a abordagens técnicas e parcerias.',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z'
  },
  {
    id: 'vet-rodrigo-prado',
    full_name: 'Dr. Rodrigo Prado Martins',
    crmv: 'CRMV-SP 42.108',
    specialty: 'Neurologia e Cirurgia de Coluna',
    whatsapp: '(11) 97321-4567',
    instagram_handle: '@dr_rodrigoprado_neurovet',
    birth_date: '1985-04-12',
    workplace_name: 'Clínica e Hospital Veterinário VetLife Moema',
    workplace_type: 'Hospital 24h',
    address_street: 'Avenida Pavão, 520',
    neighborhood: 'Moema',
    city: 'São Paulo',
    state: 'SP',
    target_audience_class: 'Classe A',
    notes_general: 'Referência em traumas espinhais e cirurgias de hérnia de disco. Alto volume de solicitações de Tomografia e Ressonância Magnética.',
    created_at: '2026-01-16T00:00:00Z',
    updated_at: '2026-01-16T00:00:00Z'
  },
  {
    id: 'vet-mariana-costa',
    full_name: 'Dra. Mariana Costa e Silva',
    crmv: 'CRMV-SP 29.870',
    specialty: 'Medicina Felina e Oncologia',
    whatsapp: '(11) 99182-3344',
    instagram_handle: '@dramariana_catcare',
    birth_date: '1990-11-05',
    workplace_name: 'Centro Veterinário CatCare & Oncologia Pacaembu',
    workplace_type: 'Clínica Própria',
    address_street: 'Rua Itápolis, 310',
    neighborhood: 'Pacaembu',
    city: 'São Paulo',
    state: 'SP',
    target_audience_class: 'Classe A',
    notes_general: 'Clínica Cat-Friendly certificada. Exige transporte e coleta de exames com baixo nível de estresse para os felinos.',
    created_at: '2026-01-18T00:00:00Z',
    updated_at: '2026-01-18T00:00:00Z'
  },
  {
    id: 'vet-fernando-becker',
    full_name: 'Dr. Fernando Becker',
    crmv: 'CRMV-SP 31.450',
    specialty: 'Clínica Médica e Terapia Intensiva (UTI)',
    whatsapp: '(11) 96544-7890',
    instagram_handle: '@drfernando_intensivet',
    birth_date: '1982-08-19',
    workplace_name: 'Hospital Veterinário Prime 24 Horas',
    workplace_type: 'Hospital 24h',
    address_street: 'Rua Domingos de Morais, 1840',
    neighborhood: 'Vila Mariana',
    city: 'São Paulo',
    state: 'SP',
    target_audience_class: 'Classe B',
    notes_general: 'Coordenador da UTI móvel e internação de pacientes críticos. Busca laudos ultrassonográficos beira-leito (POCUS).',
    created_at: '2026-01-20T00:00:00Z',
    updated_at: '2026-01-20T00:00:00Z'
  },
  {
    id: 'vet-beatriz-ramos',
    full_name: 'Dra. Beatriz Ramos Toledo',
    crmv: 'CRMV-SP 48.922',
    specialty: 'Ortopedia e Reabilitação Animal',
    whatsapp: '(11) 98765-1122',
    instagram_handle: '@drabeatriz_ortovet',
    birth_date: '1993-02-28',
    workplace_name: 'Instituto de Ortopedia e Fisioterapia Veterinária Alphaville',
    workplace_type: 'Centro Diagnóstico',
    address_street: 'Alameda Rio Negro, 1100',
    neighborhood: 'Alphaville',
    city: 'Barueri',
    state: 'SP',
    target_audience_class: 'Classe A',
    notes_general: 'Atendimento ortopédico com foco em displasia e pós-operatório de TPLO. Necessidade de laudos radiográficos digitais integrados via PACS.',
    created_at: '2026-01-22T00:00:00Z',
    updated_at: '2026-01-22T00:00:00Z'
  }
];

export const INITIAL_VISITS: Visit[] = [
  {
    id: 'visit-mova-001',
    promoter_id: 'user-promoter-lucas',
    veterinarian_id: 'vet-camila-silveira',
    visit_date: '2026-09-10',
    check_in_timestamp: '2026-09-10T14:35:00Z',
    location_lat: -23.5701,
    location_lng: -46.6534,
    workplace_name_snapshot: 'Hospital Veterinário PetCare Jardim Paulista',
    general_notes: 'Visita presencial no intervalo cirúrgico da tarde. Excelente receptividade.',
    photos: [],
    created_at: '2026-09-10T14:35:00Z'
  },
  {
    id: 'visit-mova-002',
    promoter_id: 'user-promoter-lucas',
    veterinarian_id: 'vet-rodrigo-prado',
    visit_date: '2026-09-11',
    check_in_timestamp: '2026-09-11T10:15:00Z',
    location_lat: -23.6012,
    location_lng: -46.6625,
    workplace_name_snapshot: 'Clínica e Hospital Veterinário VetLife Moema',
    general_notes: 'Apresentação técnica focada no protocolo de Tomografia Computadorizada Multislice.',
    photos: [],
    created_at: '2026-09-11T10:15:00Z'
  },
  {
    id: 'visit-mova-003',
    promoter_id: 'user-promoter-lucas',
    veterinarian_id: 'vet-mariana-costa',
    visit_date: '2026-09-12',
    check_in_timestamp: '2026-09-12T16:00:00Z',
    location_lat: -23.5432,
    location_lng: -46.6678,
    workplace_name_snapshot: 'Centro Veterinário CatCare & Oncologia Pacaembu',
    general_notes: 'Apresentação dos laudos de Ultrassonografia Abdominal e citologia guiada por imagem.',
    photos: [],
    created_at: '2026-09-12T16:00:00Z'
  },
  {
    id: 'visit-mova-004',
    promoter_id: 'user-promoter-lucas',
    veterinarian_id: 'vet-fernando-becker',
    visit_date: '2026-09-13',
    check_in_timestamp: '2026-09-13T11:45:00Z',
    location_lat: -23.5891,
    location_lng: -46.6389,
    workplace_name_snapshot: 'Hospital Veterinário Prime 24 Horas',
    general_notes: 'Alinhamento sobre exames de emergência para pacientes em terapia intensiva.',
    photos: [],
    created_at: '2026-09-13T11:45:00Z'
  },
  {
    id: 'visit-mova-005',
    promoter_id: 'user-promoter-lucas',
    veterinarian_id: 'vet-beatriz-ramos',
    visit_date: '2026-09-14',
    check_in_timestamp: '2026-09-14T09:20:00Z',
    location_lat: -23.4988,
    location_lng: -46.8521,
    workplace_name_snapshot: 'Instituto de Ortopedia e Fisioterapia Veterinária Alphaville',
    general_notes: 'Visita técnica sobre protocolos de ressonância e agendamentos no fim de semana.',
    photos: [],
    created_at: '2026-09-14T09:20:00Z'
  },
  {
    id: 'visit-juliana-001',
    promoter_id: 'user-promoter-juliana',
    veterinarian_id: 'vet-camila-silveira',
    visit_date: '2026-09-15',
    check_in_timestamp: '2026-09-15T15:10:00Z',
    location_lat: -23.5701,
    location_lng: -46.6534,
    workplace_name_snapshot: 'Hospital Veterinário PetCare Jardim Paulista',
    general_notes: 'Apresentação institucional CardioPet e VetLab. Dra. Camila confirmou início dos encaminhamentos.',
    photos: [],
    created_at: '2026-09-15T15:10:00Z'
  },
  {
    id: 'visit-juliana-002',
    promoter_id: 'user-promoter-juliana',
    veterinarian_id: 'vet-fernando-becker',
    visit_date: '2026-09-16',
    check_in_timestamp: '2026-09-16T11:00:00Z',
    location_lat: -23.5891,
    location_lng: -46.6389,
    workplace_name_snapshot: 'Hospital Veterinário Prime 24 Horas',
    general_notes: 'Visita de alinhamento com a UTI móvel. Apresentação do serviço de ecocardiograma móvel da CardioPet.',
    photos: [],
    created_at: '2026-09-16T11:00:00Z'
  }
];

export const INITIAL_VISIT_REPORTS: VisitReport[] = [
  {
    id: 'rep-mova-001',
    visit_id: 'visit-mova-001',
    tenant_id: 'tenant-mova',
    observations: 'Dra. Camila elogiou a proposta do Ecocardiograma com laudo express em 2 horas. Solicitou a tabela de convênio e bloco de encaminhamento digital para o hospital.',
    sentiment: 'positive',
    service_interest: 'Ecocardiograma com Doppler e Laudo Express',
    critical_action_needed: false,
    created_at: '2026-09-10T14:35:00Z'
  },
  {
    id: 'rep-mova-002',
    visit_id: 'visit-mova-002',
    tenant_id: 'tenant-mova',
    observations: 'Dr. Rodrigo demonstrou forte interesse no protocolo de Tomografia Computadorizada da Mova para hérnias de disco e reconstrução 3D. Encaminhará 3 a 4 casos por semana.',
    sentiment: 'positive',
    service_interest: 'Tomografia Computadorizada Multislice 3D',
    critical_action_needed: false,
    created_at: '2026-09-11T10:15:00Z'
  },
  {
    id: 'rep-mova-003',
    visit_id: 'visit-mova-003',
    tenant_id: 'tenant-mova',
    observations: 'Dra. Mariana relatou insatisfação com prazos de laudos do antigo prestador. Destacou o diferencial do portal online da Mova e solicitou login de acesso médico para emissão direta.',
    sentiment: 'positive',
    service_interest: 'Ultrassonografia com Doppler e Citologia Guiada',
    critical_action_needed: false,
    created_at: '2026-09-12T16:00:00Z'
  },
  {
    id: 'rep-mova-004',
    visit_id: 'visit-mova-004',
    tenant_id: 'tenant-mova',
    observations: 'Dr. Fernando solicitou visita técnica do médico radiologista da Mova para treinamento rápido da equipe de plantonistas sobre encaminhamento em emergências cardiológicas.',
    sentiment: 'neutral',
    service_interest: 'Treinamento de Plantão e Laudos Beira-Leito (POCUS)',
    critical_action_needed: false,
    created_at: '2026-09-13T11:45:00Z'
  },
  {
    id: 'rep-mova-005',
    visit_id: 'visit-mova-005',
    tenant_id: 'tenant-mova',
    observations: 'Dra. Beatriz apontou que teve dificuldade no último sábado para encaixe de uma Ressonância Magnética de emergência. Necessita de contato direto do coordenador de plantão da Mova.',
    sentiment: 'complaint',
    service_interest: 'Canal Direto de Urgência em Ressonância Magnética',
    critical_action_needed: true,
    created_at: '2026-09-14T09:20:00Z'
  },
  {
    id: 'rep-vetlab-001',
    visit_id: 'visit-mova-001',
    tenant_id: 'tenant-vetlab',
    observations: 'Dra. Camila elogiou a agilidade da coleta de exames do VetLab e a liberação de hemograma em 45 minutos. Solicitou tubos de coleta e formulários de requisição.',
    sentiment: 'positive',
    service_interest: 'Hemograma e Perfil Bioquímico de Urgência',
    critical_action_needed: false,
    created_at: '2026-09-10T14:35:00Z'
  },
  {
    id: 'rep-cardiopet-001',
    visit_id: 'visit-mova-003',
    tenant_id: 'tenant-cardiopet',
    observations: 'Dra. Mariana tem interesse em encaminhar casos de estenose aórtica e arritmias felinas para a equipe de eletrofisiologia da CardioPet.',
    sentiment: 'positive',
    service_interest: 'Mapeamento Eletrofisiológico e Holter 24h Felino',
    critical_action_needed: false,
    created_at: '2026-09-12T16:00:00Z'
  },
  {
    id: 'rep-cardiopet-002',
    visit_id: 'visit-juliana-001',
    tenant_id: 'tenant-cardiopet',
    observations: 'Dra. Camila solicitou tabela de exames cardiológicos da CardioPet e material para prescrição.',
    sentiment: 'positive',
    service_interest: 'Ecocardiograma e Telemedicina Cardiológica',
    critical_action_needed: false,
    created_at: '2026-09-15T15:10:00Z'
  },
  {
    id: 'rep-cardiopet-003',
    visit_id: 'visit-juliana-002',
    tenant_id: 'tenant-cardiopet',
    observations: 'Dr. Fernando aprovou o protocolo de emergência cardiológica da CardioPet para plantão de UTI.',
    sentiment: 'positive',
    service_interest: 'Suporte de UTI e Marcapasso',
    critical_action_needed: false,
    created_at: '2026-09-16T11:00:00Z'
  }
];

export const INITIAL_FOLLOW_UP_TASKS: FollowUpTask[] = [
  {
    id: 'task-mova-001',
    visit_report_id: 'rep-mova-001',
    tenant_id: 'tenant-mova',
    veterinarian_id: 'vet-camila-silveira',
    assigned_to: 'Lucas Rocha Mendes',
    due_date: '2026-09-17',
    action_type: 'first_contact_7d',
    description: 'Contato D+7: Confirmar recebimento do bloco de requisições digitais e tabela de convênio da Mova.',
    status: 'pending',
    created_at: '2026-09-10T14:35:00Z'
  },
  {
    id: 'task-mova-002',
    visit_report_id: 'rep-mova-002',
    tenant_id: 'tenant-mova',
    veterinarian_id: 'vet-rodrigo-prado',
    assigned_to: 'Lucas Rocha Mendes',
    due_date: '2026-09-18',
    action_type: 'first_contact_7d',
    description: 'Contato D+7: Enviar casos clínicos modelo de Tomografia e validar encaminhamento do primeiro paciente.',
    status: 'pending',
    created_at: '2026-09-11T10:15:00Z'
  },
  {
    id: 'task-mova-003',
    visit_report_id: 'rep-mova-005',
    tenant_id: 'tenant-mova',
    veterinarian_id: 'vet-beatriz-ramos',
    assigned_to: 'Diretoria Mova / Lucas',
    due_date: '2026-09-15',
    action_type: 'critical_resolution',
    description: 'TRATATIVA CRÍTICA IMEDIATA: Alinhar canal de WhatsApp VIP com a coordenação de imagem da Mova para agendamentos de fim de semana.',
    status: 'in_progress',
    created_at: '2026-09-14T09:20:00Z'
  },
  {
    id: 'task-vetlab-001',
    visit_report_id: 'rep-vetlab-001',
    tenant_id: 'tenant-vetlab',
    veterinarian_id: 'vet-camila-silveira',
    assigned_to: 'Lucas Rocha Mendes',
    due_date: '2026-09-17',
    action_type: 'first_contact_7d',
    description: 'Contato D+7: Entregar tubos de coleta a vácuo e bloco de requisições de análises clínicas VetLab.',
    status: 'pending',
    created_at: '2026-09-10T14:35:00Z'
  },
  {
    id: 'task-cardiopet-001',
    visit_report_id: 'rep-cardiopet-001',
    tenant_id: 'tenant-cardiopet',
    veterinarian_id: 'vet-mariana-costa',
    assigned_to: 'Lucas Rocha Mendes',
    due_date: '2026-09-19',
    action_type: 'first_contact_7d',
    description: 'Contato D+7: Enviar artigos técnicos da CardioPet sobre arritmias e manejo felino para a Dra. Mariana.',
    status: 'pending',
    created_at: '2026-09-12T16:00:00Z'
  },
  {
    id: 'task-mova-004',
    visit_report_id: 'rep-mova-001',
    tenant_id: 'tenant-mova',
    veterinarian_id: 'vet-camila-silveira',
    assigned_to: 'Lucas Rocha Mendes',
    due_date: '2026-09-24',
    action_type: 'birthday_gift',
    description: 'Ação de Relacionamento: Enviar mimo e mensagem de felicitações pelo aniversário da Dra. Camila Silveira em 24/09.',
    status: 'pending',
    created_at: '2026-09-10T14:35:00Z'
  }
];

export const INITIAL_INSTAGRAM_LEADS: InstagramPostLead[] = [
  {
    id: 'lead-mova-001',
    veterinarian_id: 'vet-camila-silveira',
    instagram_handle: '@dracamila_vet',
    post_title: 'Caso desafiador de sopro cardíaco grau IV em felino idoso',
    post_url: 'https://instagram.com/p/exemplo1',
    opportunity_topic: 'Ecocardiograma com Doppler e Marcador Troponina I Mova',
    status: 'pending',
    created_at: '2026-09-10T14:35:00Z'
  },
  {
    id: 'lead-mova-002',
    veterinarian_id: 'vet-rodrigo-prado',
    instagram_handle: '@dr_rodrigoprado_neurovet',
    post_title: 'Descompressão medular em Dachshund após trauma agudo',
    post_url: 'https://instagram.com/p/exemplo2',
    opportunity_topic: 'Tomografia Computadorizada de Emergência Mova',
    status: 'interacted',
    created_at: '2026-09-11T10:15:00Z'
  }
];



