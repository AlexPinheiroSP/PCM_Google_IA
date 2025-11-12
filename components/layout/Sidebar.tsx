import React, { useContext } from 'react';
import { AuthContext } from '../../App';
import { Role } from '../../types';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: 'analysis' | 'calls' | 'equipment' | 'users' | 'settings' | 'ai' | 'team-view' | 'alerts' | 'database' | 'messaging' | 'companies' | 'schema') => void;
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
  
  const canViewAdminFeatures = user?.role === Role.ADMINISTRATOR || user?.role === Role.ADMIN_PLANTA || user?.role === Role.SYSTEM_ADMINISTRATOR;
  const canViewSystemSettings = user?.role === Role.SYSTEM_ADMINISTRATOR;

  return (
    <div className="w-64 bg-neutral-900 dark:bg-neutral-800 flex-shrink-0 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-neutral-700">
        <i className="fas fa-cogs text-primary-400 text-2xl"></i>
        <h1 className="text-xl font-bold text-white ml-3">PCM Industrial</h1>
      </div>
      <nav className="flex-1 p-4">
        {canViewAdminFeatures && (
            <NavLink
              icon="fa-chart-pie"
              label="Análises"
              isActive={currentPage === 'analysis'}
              onClick={() => setCurrentPage('analysis')}
            />
        )}
        <NavLink
          icon="fa-wrench"
          label="Chamados"
          isActive={currentPage === 'calls'}
          onClick={() => setCurrentPage('calls')}
        />
        <NavLink
          icon="fa-users-cog"
          label="Visão da Equipe"
          isActive={currentPage === 'team-view'}
          onClick={() => setCurrentPage('team-view')}
        />
        <NavLink
          icon="fa-robot"
          label="Equipamentos"
          isActive={currentPage === 'equipment'}
          onClick={() => setCurrentPage('equipment')}
        />
        <NavLink
          icon="fa-brain"
          label="Sugestões IA"
          isActive={currentPage === 'ai'}
          onClick={() => setCurrentPage('ai')}
        />
        {canViewAdminFeatures && (
          <>
            <div className="my-4 border-t border-neutral-700"></div>
            <NavLink
              icon="fa-users"
              label="Usuários"
              isActive={currentPage === 'users'}
              onClick={() => setCurrentPage('users')}
            />
             {canViewSystemSettings && (
                 <NavLink
                  icon="fa-building"
                  label="Empresas"
                  isActive={currentPage === 'companies'}
                  onClick={() => setCurrentPage('companies')}
                />
            )}
            <NavLink
              icon="fa-bell"
              label="Alertas"
              isActive={currentPage === 'alerts'}
              onClick={() => setCurrentPage('alerts')}
            />
          </>
        )}
        {canViewSystemSettings && (
          <>
             <div className="my-4 border-t border-neutral-700"></div>
             <h3 className="px-3 text-xs font-semibold uppercase text-neutral-500 tracking-wider">Sistema</h3>
             <NavLink
              icon="fa-sliders-h"
              label="Parâmetros"
              isActive={currentPage === 'settings'}
              onClick={() => setCurrentPage('settings')}
            />
            <NavLink
              icon="fa-comments"
              label="Mensageria"
              isActive={currentPage === 'messaging'}
              onClick={() => setCurrentPage('messaging')}
            />
            <NavLink
              icon="fa-database"
              label="Conexão BD"
              isActive={currentPage === 'database'}
              onClick={() => setCurrentPage('database')}
            />
             <NavLink
              icon="fa-file-code"
              label="Schema do Banco"
              isActive={currentPage === 'schema'}
              onClick={() => setCurrentPage('schema')}
            />
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;