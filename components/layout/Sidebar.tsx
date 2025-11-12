import React, { useContext } from 'react';
import { AuthContext, PermissionContext } from '../../App';
import { Role, Page } from '../../types';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: Page) => void;
}

const NavLink: React.FC<{
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary-600 text-white'
        : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
    }`}
  >
    <i className={`fas ${icon} w-6 text-center`}></i>
    <span className="ml-4 font-medium">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const { user } = useContext(AuthContext);
  const { permissions } = useContext(PermissionContext);

  if (!user) return null;

  const userPermissions = permissions[user.role] || {};

  const navItems: { page: Page; icon: string; label: string; section?: string }[] = [
    { page: 'analysis', icon: 'fa-chart-pie', label: 'Análises' },
    { page: 'reports', icon: 'fa-file-alt', label: 'Relatórios' },
    { page: 'calls', icon: 'fa-wrench', label: 'Chamados' },
    { page: 'team-view', icon: 'fa-users-cog', label: 'Visão da Equipe' },
    { page: 'equipment', icon: 'fa-robot', label: 'Equipamentos' },
    { page: 'ai', icon: 'fa-brain', label: 'Sugestões IA' },
    { page: 'users', icon: 'fa-users', label: 'Usuários', section: 'Admin' },
    { page: 'teams', icon: 'fa-user-friends', label: 'Equipes', section: 'Admin' },
    { page: 'roles', icon: 'fa-id-card', label: 'Perfis de Acesso', section: 'Admin' },
    { page: 'companies', icon: 'fa-building', label: 'Empresas', section: 'Admin' },
    { page: 'alerts', icon: 'fa-bell', label: 'Alertas', section: 'Admin' },
    { page: 'settings', icon: 'fa-sliders-h', label: 'Parâmetros', section: 'Sistema' },
    { page: 'access-control', icon: 'fa-user-shield', label: 'Controle de Acesso', section: 'Sistema' },
    { page: 'messaging', icon: 'fa-comments', label: 'Mensageria', section: 'Sistema' },
    { page: 'database', icon: 'fa-database', label: 'Conexão BD', section: 'Sistema' },
    { page: 'schema', icon: 'fa-file-code', label: 'Schema do Banco', section: 'Sistema' },
  ];

  const renderNavLinks = (section?: string) => {
    return navItems
      .filter(item => item.section === section && userPermissions[item.page])
      .map(item => (
        <NavLink
          key={item.page}
          icon={item.icon}
          label={item.label}
          isActive={currentPage === item.page}
          onClick={() => setCurrentPage(item.page)}
        />
      ));
  };

  const adminLinks = renderNavLinks('Admin');
  const systemLinks = renderNavLinks('Sistema');

  return (
    <div className="w-64 bg-neutral-900 dark:bg-neutral-800 flex-shrink-0 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-neutral-700">
        <i className="fas fa-cogs text-primary-400 text-2xl"></i>
        <h1 className="text-xl font-bold text-white ml-3">PCM Industrial</h1>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        {renderNavLinks(undefined)}
        
        {adminLinks.length > 0 && (
          <>
            <div className="my-4 border-t border-neutral-700"></div>
            {adminLinks}
          </>
        )}
        
        {systemLinks.length > 0 && (
          <>
             <div className="my-4 border-t border-neutral-700"></div>
             <h3 className="px-3 text-xs font-semibold uppercase text-neutral-500 tracking-wider">Sistema</h3>
             {systemLinks}
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;