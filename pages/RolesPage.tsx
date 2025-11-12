import React from 'react';
import { Role } from '../types';

const getRoleDisplayName = (role: Role) => {
    const roleMap: {[key in Role]: string} = {
      [Role.SYSTEM_ADMINISTRATOR]: 'Admin do Sistema',
      [Role.ADMINISTRATOR]: 'Administrador',
      [Role.ADMIN_PLANTA]: 'Admin da Planta',
      [Role.TECNICO_PCM]: 'Técnico PCM',
      [Role.OPERADOR]: 'Operador',
      [Role.VISUALIZADOR]: 'Visualizador',
    };
    return roleMap[role] || role;
};

const roleDescriptions: {[key in Role]: { description: string; permissions: string[] }} = {
    [Role.SYSTEM_ADMINISTRATOR]: {
        description: "Controla toda a aplicação, incluindo a criação de empresas e configurações globais. Possui acesso irrestrito a todos os dados e funcionalidades.",
        permissions: ["Gerenciar empresas", "Gerenciar configurações do sistema", "Visualizar todos os dados de todas as empresas", "Acesso a todos os dashboards e relatórios"]
    },
    [Role.ADMINISTRATOR]: {
        description: "Gerencia todos os dados e usuários de sua própria empresa. Pode criar usuários, plantas, equipamentos e configurar regras de alerta.",
        permissions: ["Gerenciar usuários da empresa", "Gerenciar plantas e equipamentos", "Configurar regras de alerta", "Acesso completo aos dashboards da empresa"]
    },
    [Role.ADMIN_PLANTA]: {
        description: "Gerencia os dados de uma planta específica. Tem permissões de administrador, mas restritas à sua planta designada.",
        permissions: ["Gerenciar usuários da sua planta", "Gerenciar equipamentos da sua planta", "Atribuir chamados de manutenção", "Aprovar finalização de chamados"]
    },
    [Role.TECNICO_PCM]: {
        description: "O profissional de manutenção. Atende aos chamados, executa os reparos e atualiza o status das ordens de serviço.",
        permissions: ["Visualizar chamados atribuídos", "Atualizar status do chamado (Em andamento, Aguardando Aprovação)", "Visualizar detalhes de equipamentos"]
    },
    [Role.OPERADOR]: {
        description: "Usuário que opera os equipamentos. Pode abrir novos chamados de manutenção quando identifica um problema.",
        permissions: ["Abrir novos chamados de manutenção", "Visualizar o status dos chamados que abriu", "Visualizar dados básicos dos equipamentos"]
    },
    [Role.VISUALIZADOR]: {
        description: "Perfil de apenas leitura. Pode visualizar dashboards, relatórios e o status dos chamados, mas não pode realizar nenhuma alteração.",
        permissions: ["Acesso somente leitura a dashboards", "Visualizar chamados e equipamentos", "Não pode criar ou editar dados"]
    }
};

const RolesPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Perfis de Acesso</h1>
                <p className="text-neutral-500 mt-1">Entenda as permissões e responsabilidades de cada perfil de usuário no sistema.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(Role).map(role => {
                    const { description, permissions } = roleDescriptions[role];
                    return (
                        <div key={role} className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 flex flex-col">
                            <h3 className="text-lg font-bold text-primary-500 dark:text-primary-400">{getRoleDisplayName(role)}</h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 flex-grow">{description}</p>
                            <div className="mt-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                                <h4 className="font-semibold text-sm mb-2">Principais Permissões:</h4>
                                <ul className="space-y-1">
                                    {permissions.map((perm, index) => (
                                        <li key={index} className="flex items-start">
                                            <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                                            <span className="text-sm text-neutral-700 dark:text-neutral-300">{perm}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RolesPage;
