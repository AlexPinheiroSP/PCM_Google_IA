import React, { useContext } from 'react';
import { AuthContext, PermissionContext } from '../App';
import { Role, Page } from '../types';

const getRoleDisplayName = (role: Role) => ({
    [Role.SYSTEM_ADMINISTRATOR]: 'Admin do Sistema',
    [Role.ADMINISTRATOR]: 'Administrador',
    [Role.ADMIN_PLANTA]: 'Admin da Planta',
    [Role.TECNICO_PCM]: 'Técnico PCM',
    [Role.OPERADOR]: 'Operador',
    [Role.VISUALIZADOR]: 'Visualizador',
}[role] || role);

const getPageDisplayName = (page: Page) => ({
    'analysis': 'Análises',
    'reports': 'Relatórios',
    'calls': 'Chamados',
    'equipment': 'Equipamentos',
    'users': 'Usuários',
    'settings': 'Parâmetros do Sistema',
    'ai': 'Sugestões IA',
    'team-view': 'Visão da Equipe',
    'alerts': 'Regras de Alerta',
    'database': 'Conexão BD',
    'messaging': 'Mensageria',
    'companies': 'Empresas',
    'schema': 'Schema do Banco',
    'teams': 'Equipes',
    'roles': 'Perfis de Acesso',
    'access-control': 'Controle de Acesso',
}[page] || page);

const ALL_PAGES: Page[] = [
    'analysis', 'reports', 'calls', 'equipment', 'users', 'settings', 'ai', 'team-view',
    'alerts', 'database', 'messaging', 'companies', 'schema', 'teams', 'roles', 'access-control'
];

const AccessControlPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { permissions, updatePermission } = useContext(PermissionContext);

    if (user?.role !== Role.SYSTEM_ADMINISTRATOR) {
        return (
            <div className="text-center text-red-500">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Acesso negado. Apenas administradores do sistema podem visualizar esta página.
            </div>
        );
    }

    const handlePermissionChange = (role: Role, page: Page, isChecked: boolean) => {
        updatePermission(role, page, isChecked);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Controle de Acesso por Perfil</h1>
                <p className="text-neutral-500 mt-1">
                    Marque as caixas para conceder acesso a uma página para um determinado perfil de usuário. As alterações são salvas automaticamente.
                </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm text-left">
                        <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400">
                            <tr>
                                <th scope="col" className="px-6 py-3 sticky left-0 bg-neutral-50 dark:bg-neutral-700">Página</th>
                                {Object.values(Role).map(role => (
                                    <th key={role} scope="col" className="px-6 py-3 text-center">{getRoleDisplayName(role)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {ALL_PAGES.map(page => (
                                <tr key={page} className="hover:bg-neutral-50 dark:hover:bg-neutral-600/50">
                                    <td className="px-6 py-4 font-medium sticky left-0 bg-white dark:bg-neutral-800">{getPageDisplayName(page)}</td>
                                    {Object.values(Role).map(role => (
                                        <td key={role} className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded text-primary-600 bg-neutral-200 dark:bg-neutral-600 border-neutral-300 dark:border-neutral-500 focus:ring-primary-500"
                                                checked={!!permissions[role]?.[page]}
                                                onChange={(e) => handlePermissionChange(role, page, e.target.checked)}
                                                disabled={role === Role.SYSTEM_ADMINISTRATOR}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccessControlPage;
