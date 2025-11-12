export enum Role {
  SYSTEM_ADMINISTRATOR = 'SYSTEM_ADMINISTRATOR',
  ADMINISTRATOR = 'ADMINISTRATOR',
  ADMIN_PLANTA = 'ADMIN_PLANTA',
  TECNICO_PCM = 'TECNICO_PCM',
  OPERADOR = 'OPERADOR',
  VISUALIZADOR = 'VISUALIZADOR',
}

export interface Company {
  id: number;
  name: string;
  region: string;
  administrator: string;
  phone: string;
}

export interface User {
  id: number;
  login: string;
  name: string;
  email: string;
  role: Role;
  companyId?: number;
  plantId?: number; 
  teamId?: number;
  permissions: string[];
}

export interface Plant {
  id: number;
  code: string;
  name: string;
  cnpj: string;
  address: string;
  companyId: number;
}

export interface Team {
    id: number;
    name: string;
}

export enum EquipmentType {
    EXTRUSORA = 'Extrusora',
    REBOBINADEIRA = 'Rebobinadeira',
    IMPRESSORA = 'Impressora',
    CORTE_SOLDA = 'Corte e Solda'
}

export interface Equipment {
  id: number;
  name: string;
  type: EquipmentType;
  plantId: number;
  line: string;
  performance: {
    availability: number;
    mttr: number; // in hours
    mtbf: number; // in hours
  };
  failureHistory: { date: string; description: string; downtimeHours: number }[];
  openedAt?: string; // To track the start of the current/last downtime event
  closedAt?: string; // To track the end of the current/last downtime event
}

export enum MaintenanceStatus {
  ABERTO = 'Aberto',
  EM_ANDAMENTO = 'Em Andamento',
  AGUARDANDO_APROVACAO = 'Aguardando Aprovação',
  RESOLVIDO = 'Resolvido', // This can be deprecated if Encerrado covers it
  ENCERRADO = 'Encerrado',
  CANCELADO = 'Cancelado',
}

export enum MaintenancePriority {
    CRITICO = 'Crítico',
    ALTO = 'Alto',
    MEDIO = 'Médio',
    BAIXO = 'Baixo'
}

export enum CallSource {
    MANUAL = 'Manual',
    AUTOMATICO = 'Automático'
}

export interface MaintenanceCallEvent {
  status: MaintenanceStatus;
  timestamp: string;
  userId: number;
  notes?: string;
}

export interface MaintenanceCall {
  id: number;
  equipmentId: number;
  plantId: number;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  description: string;
  problemType: string; // For dashboard analysis
  requesterId: number; // User who opened the call
  responsible?: User; // Technician assigned
  source: CallSource;
  
  // Timestamps for lifecycle analysis
  openedAt: string;
  assignedAt?: string;
  resolvedAt?: string; // When technician finishes
  approvedAt?: string; // When requester approves
  closedAt?: string; // Final closure

  // New event log for detailed timeline
  events: MaintenanceCallEvent[];
}

export enum AlertMetric {
    VIBRATION = 'Vibração',
    TEMPERATURE = 'Temperatura',
    PRESSURE = 'Pressão',
}

export enum AlertCondition {
    GREATER_THAN = 'Maior que',
    LESS_THAN = 'Menor que',
    EQUAL_TO = 'Igual a',
    NOT_EQUAL_TO = 'Diferente de',
    OUTSIDE_RANGE = 'Fora do intervalo',
}


export interface AlertRule {
    id: number;
    equipmentId: number;
    metric: AlertMetric | string;
    condition: AlertCondition | string;
    threshold: number;
    thresholdUpper?: number;
    description: string;
    isActive: boolean;
}

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  callId: number;
}

export type Page = 'analysis' | 'calls' | 'equipment' | 'users' | 'settings' | 'ai' | 'team-view' | 'alerts' | 'database' | 'messaging' | 'companies' | 'schema' | 'teams' | 'roles' | 'reports' | 'access-control';

export type Permissions = {
  [key in Role]: {
    [key in Page]?: boolean;
  };
};

// Context Types
export interface CompanyContextType {
  companies: Company[];
  addCompany: (company: Company) => void;
}