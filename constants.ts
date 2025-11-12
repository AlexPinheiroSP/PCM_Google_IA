import { Plant, User, Role, Equipment, EquipmentType, MaintenanceCall, MaintenanceStatus, MaintenancePriority, Team, CallSource, AlertRule, AlertMetric, AlertCondition, Company, MaintenanceCallEvent, Permissions } from './types';

export const MOCK_COMPANIES: Company[] = [
    { id: 1, name: 'Plásticos do Brasil S.A.', region: 'Sudeste', administrator: 'Carlos Pereira', phone: '(11) 98765-4321' },
    { id: 2, name: 'Polímeros Avançados Ltda.', region: 'Sul', administrator: 'Mariana Oliveira', phone: '(41) 91234-5678' },
];

export const MOCK_PLANTS: Plant[] = [
  // Empresa 1
  { id: 1, companyId: 1, code: `PLT-001`, name: `Planta A (SP)`, cnpj: `11.111.111/0001-01`, address: `Rua Industrial 1, São Paulo, SP` },
  { id: 2, companyId: 1, code: `PLT-002`, name: `Planta B (RJ)`, cnpj: `22.222.222/0001-02`, address: `Av. Principal 2, Rio de Janeiro, RJ` },
  // Empresa 2
  { id: 3, companyId: 2, code: `POLI-001`, name: `Unidade Curitiba`, cnpj: `33.333.333/0001-03`, address: `Rua Inovação 3, Curitiba, PR` },
  { id: 4, companyId: 2, code: `POLI-002`, name: `Unidade Manaus`, cnpj: `44.444.444/0001-04`, address: `Distrito Industrial 4, Manaus, AM` },
];

export const MOCK_TEAMS: Team[] = [
    { id: 1, name: 'Mecânica' },
    { id: 2, name: 'Elétrica' },
    { id: 3, name: 'Hidráulica' },
];

export const MOCK_USERS: User[] = [
  // Super Admin
  { id: 100, login: 'sysadmin', name: 'Admin do Sistema', email: 'sysadmin@pcm.com', role: Role.SYSTEM_ADMINISTRATOR, permissions: ['*'] },
  // Empresa 1
  { id: 1, companyId: 1, login: 'admin', name: 'Admin Geral (Empresa 1)', email: 'admin@ind1.com', role: Role.ADMINISTRATOR, permissions: ['read', 'write'] },
  { id: 2, companyId: 1, plantId: 1, login: 'admin.planta1', name: 'Admin Planta A', email: 'admin.planta1@ind1.com', role: Role.ADMIN_PLANTA, permissions: ['read', 'write'] },
  { id: 3, companyId: 1, teamId: 1, login: 'tecnico1', name: 'João Silva', email: 'joao.silva@ind1.com', role: Role.TECNICO_PCM, permissions: ['read', 'write_calls'] },
  { id: 4, companyId: 1, plantId: 1, login: 'operador1', name: 'Maria Souza', email: 'maria.souza@ind1.com', role: Role.OPERADOR, permissions: ['read', 'create_call'] },
  // Empresa 2
  { id: 5, companyId: 2, login: 'admin2', name: 'Admin Geral (Empresa 2)', email: 'admin@ind2.com', role: Role.ADMINISTRATOR, permissions: ['read', 'write'] },
  { id: 6, companyId: 2, teamId: 2, login: 'tecnico2', name: 'Ana Costa', email: 'ana.costa@ind2.com', role: Role.TECNICO_PCM, permissions: ['read', 'write_calls'] },
  { id: 7, companyId: 2, plantId: 3, login: 'operador2', name: 'Pedro Lima', email: 'pedro.lima@ind2.com', role: Role.OPERADOR, permissions: ['read', 'create_call'] },
];

export const MOCK_EQUIPMENT: Equipment[] = [
    { id: 1, plantId: 1, name: 'Extrusora Alpha', type: EquipmentType.EXTRUSORA, line: 'Linha 1', performance: { availability: 95.5, mttr: 2.5, mtbf: 250 }, failureHistory: [{ date: '2024-07-10', description: 'Superaquecimento do canhão', downtimeHours: 4 }, { date: '2024-06-25', description: 'Falha no sensor de pressão', downtimeHours: 2 }] },
    { id: 2, plantId: 1, name: 'Rebobinadeira Beta', type: EquipmentType.REBOBINADEIRA, line: 'Linha 1', performance: { availability: 98.2, mttr: 1.2, mtbf: 500 }, failureHistory: [{ date: '2024-07-05', description: 'Desalinhamento do rolo', downtimeHours: 1.5 }] },
    { id: 3, plantId: 2, name: 'Impressora Gamma', type: EquipmentType.IMPRESSORA, line: 'Linha A', performance: { availability: 92.0, mttr: 4.0, mtbf: 180 }, failureHistory: [{ date: '2024-07-12', description: 'Falha no sistema de secagem', downtimeHours: 6 }, { date: '2024-07-01', description: 'Painel de controle inoperante', downtimeHours: 8 }] },
    { id: 4, plantId: 3, name: 'Corte/Solda Delta', type: EquipmentType.CORTE_SOLDA, line: 'CS-01', performance: { availability: 99.1, mttr: 0.8, mtbf: 800 }, failureHistory: [] },
    { id: 5, plantId: 4, name: 'Extrusora Epsilon', type: EquipmentType.EXTRUSORA, line: 'Linha 2', performance: { availability: 96.3, mttr: 2.1, mtbf: 320 }, failureHistory: [{ date: '2024-07-15', description: 'Necessidade de troca de filtro de massa', downtimeHours: 2 }] },
];

export const MOCK_MAINTENANCE_CALLS: MaintenanceCall[] = [
    { 
        id: 1, 
        equipmentId: 1, 
        plantId: 1, 
        status: MaintenanceStatus.EM_ANDAMENTO, 
        priority: MaintenancePriority.CRITICO,
        description: '[AUTO] Temperatura do canhão da Extrusora Alpha excedeu 240°C.',
        problemType: 'Superaquecimento',
        requesterId: 1, // Auto-gerado, mas atribuído a um responsável
        responsible: MOCK_USERS.find(u => u.id === 3),
        source: CallSource.AUTOMATICO,
        openedAt: '2024-07-19T08:00:00Z',
        assignedAt: '2024-07-19T08:15:00Z',
        events: [
            { status: MaintenanceStatus.ABERTO, timestamp: '2024-07-19T08:00:00Z', userId: 100, notes: 'Chamado aberto automaticamente por regra de alerta.' },
            { status: MaintenanceStatus.EM_ANDAMENTO, timestamp: '2024-07-19T08:15:00Z', userId: 2, notes: 'Atribuído para João Silva' }
        ]
    },
    { 
        id: 2, 
        equipmentId: 3, 
        plantId: 2, 
        status: MaintenanceStatus.ABERTO, 
        priority: MaintenancePriority.ALTO,
        description: 'Impressora com falha no sistema de secagem de tinta, material está saindo manchado.',
        problemType: 'Falha Elétrica',
        requesterId: 4,
        source: CallSource.MANUAL,
        openedAt: '2024-07-18T09:15:00Z',
        events: [
            { status: MaintenanceStatus.ABERTO, timestamp: '2024-07-18T09:15:00Z', userId: 4 }
        ]
    },
    { 
        id: 3, 
        equipmentId: 2, 
        plantId: 1, 
        status: MaintenanceStatus.AGUARDANDO_APROVACAO, 
        priority: MaintenancePriority.MEDIO,
        description: 'Sensor de tensão da rebobinadeira parece descalibrado, causando variação na qualidade do rolo.',
        problemType: 'Calibração',
        requesterId: 4,
        responsible: MOCK_USERS.find(u => u.id === 3),
        source: CallSource.MANUAL,
        openedAt: '2024-07-17T10:00:00Z',
        assignedAt: '2024-07-17T10:30:00Z',
        resolvedAt: '2024-07-17T14:00:00Z',
        events: [
            { status: MaintenanceStatus.ABERTO, timestamp: '2024-07-17T10:00:00Z', userId: 4 },
            { status: MaintenanceStatus.EM_ANDAMENTO, timestamp: '2024-07-17T10:30:00Z', userId: 2 },
            { status: MaintenanceStatus.AGUARDANDO_APROVACAO, timestamp: '2024-07-17T14:00:00Z', userId: 3, notes: 'Sensor calibrado e testado.' }
        ]
    },
    { 
        id: 4, 
        equipmentId: 1, 
        plantId: 1, 
        status: MaintenanceStatus.ENCERRADO, 
        priority: MaintenancePriority.BAIXO,
        description: 'Troca preventiva do filtro de óleo do sistema hidráulico conforme plano de manutenção.',
        problemType: 'Manutenção Preventiva',
        requesterId: 2,
        responsible: MOCK_USERS.find(u => u.id === 3),
        source: CallSource.MANUAL,
        openedAt: '2024-07-16T14:00:00Z',
        assignedAt: '2024-07-16T14:10:00Z',
        resolvedAt: '2024-07-16T15:00:00Z',
        approvedAt: '2024-07-16T15:05:00Z',
        closedAt: '2024-07-16T15:05:00Z',
        events: [
            { status: MaintenanceStatus.ABERTO, timestamp: '2024-07-16T14:00:00Z', userId: 2 },
            { status: MaintenanceStatus.EM_ANDAMENTO, timestamp: '2024-07-16T14:10:00Z', userId: 2 },
            { status: MaintenanceStatus.AGUARDANDO_APROVACAO, timestamp: '2024-07-16T15:00:00Z', userId: 3 },
            { status: MaintenanceStatus.ENCERRADO, timestamp: '2024-07-16T15:05:00Z', userId: 2, notes: 'Serviço concluído e aprovado.' }
        ]
    },
    { 
        id: 5, 
        equipmentId: 4, 
        plantId: 3, 
        status: MaintenanceStatus.ABERTO, 
        priority: MaintenancePriority.MEDIO,
        description: 'Ruído incomum e agudo vindo da esteira de saída da máquina de corte e solda.',
        problemType: 'Falha Mecânica',
        requesterId: 7,
        source: CallSource.MANUAL,
        openedAt: '2024-07-19T11:00:00Z',
        events: [
            { status: MaintenanceStatus.ABERTO, timestamp: '2024-07-19T11:00:00Z', userId: 7 }
        ]
    },
    { 
        id: 6, 
        equipmentId: 5, 
        plantId: 4, 
        status: MaintenanceStatus.ENCERRADO, 
        priority: MaintenancePriority.BAIXO,
        description: 'Troca de filtro de ar programada no sistema de ventilação do motor principal.',
        problemType: 'Manutenção Preventiva',
        requesterId: 5,
        responsible: MOCK_USERS.find(u => u.id === 6),
        source: CallSource.MANUAL,
        openedAt: '2024-07-15T14:00:00Z',
        assignedAt: '2024-07-15T14:05:00Z',
        resolvedAt: '2024-07-15T14:30:00Z',
        approvedAt: '2024-07-15T14:32:00Z',
        closedAt: '2024-07-15T14:32:00Z',
        events: [
            { status: MaintenanceStatus.ABERTO, timestamp: '2024-07-15T14:00:00Z', userId: 5 },
            { status: MaintenanceStatus.EM_ANDAMENTO, timestamp: '2024-07-15T14:05:00Z', userId: 5 },
            { status: MaintenanceStatus.AGUARDANDO_APROVACAO, timestamp: '2024-07-15T14:30:00Z', userId: 6 },
            { status: MaintenanceStatus.ENCERRADO, timestamp: '2024-07-15T14:32:00Z', userId: 5 }
        ]
    },
];

export const MOCK_ALERT_RULES: AlertRule[] = [
    { id: 1, equipmentId: 1, metric: AlertMetric.TEMPERATURE, condition: AlertCondition.GREATER_THAN, threshold: 240, description: 'Abrir chamado crítico se temp. do canhão da Extrusora Alpha > 240°C', isActive: true },
    { id: 2, equipmentId: 1, metric: AlertMetric.VIBRATION, condition: AlertCondition.GREATER_THAN, threshold: 10, description: 'Abrir chamado médio se vibração da Extrusora Alpha > 10 mm/s', isActive: true },
    { id: 3, equipmentId: 3, metric: AlertMetric.PRESSURE, condition: AlertCondition.LESS_THAN, threshold: 5, description: 'Alerta se pressão de tinta da Impressora Gamma < 5 bar', isActive: true },
    { id: 4, equipmentId: 5, metric: AlertMetric.VIBRATION, condition: AlertCondition.GREATER_THAN, threshold: 8, description: 'Abrir chamado médio se vibração da Extrusora Epsilon > 8 mm/s', isActive: true },
];

export const DEFAULT_PAGE_PERMISSIONS: Permissions = {
    [Role.SYSTEM_ADMINISTRATOR]: {
        'analysis': true, 'calls': true, 'equipment': true, 'users': true, 'settings': true, 'ai': true,
        'team-view': true, 'alerts': true, 'database': true, 'messaging': true, 'companies': true,
        'schema': true, 'teams': true, 'roles': true, 'reports': true, 'access-control': true,
    },
    [Role.ADMINISTRATOR]: {
        'analysis': true, 'calls': true, 'equipment': true, 'users': true, 'ai': true,
        'team-view': true, 'alerts': true, 'teams': true, 'roles': true, 'reports': true,
    },
    [Role.ADMIN_PLANTA]: {
        'analysis': true, 'calls': true, 'equipment': true, 'users': true, 'ai': true,
        'team-view': true, 'alerts': true, 'teams': true, 'roles': true, 'reports': true,
    },
    [Role.TECNICO_PCM]: {
        'calls': true, 'equipment': true, 'ai': true, 'team-view': true,
    },
    [Role.OPERADOR]: {
        'calls': true, 'equipment': true,
    },
    [Role.VISUALIZADOR]: {
        'analysis': true, 'calls': true, 'equipment': true,
    },
};