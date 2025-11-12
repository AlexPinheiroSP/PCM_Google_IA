
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext, NotificationContext } from '../../App';
import { MOCK_COMPANIES } from '../../constants';

const Header: React.FC = () => {
  const { user, logout, isOnline } = useContext(AuthContext);
  const { notifications, markAsRead } = useContext(NotificationContext);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  const company = MOCK_COMPANIES.find(c => c.id === user?.companyId);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);
  
  const getRoleDisplayName = (role: string) => {
    const roleMap: {[key: string]: string} = {
      'SYSTEM_ADMINISTRATOR': 'Admin do Sistema',
      'ADMINISTRATOR': 'Administrador',
      'ADMIN_PLANTA': 'Admin da Planta',
      'TECNICO_PCM': 'Técnico PCM',
      'OPERADOR': 'Operador',
      'VISUALIZADOR': 'Visualizador',
    };
    return roleMap[role] || role;
  }

  return (
    <header className="h-16 bg-white dark:bg-neutral-800/50 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 hidden sm:block">Bem-vindo, {user?.name.split(' ')[0]}!</h2>
        {company && (
          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
            <i className="fas fa-building mr-1.5"></i>
            {company.name}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div title={isOnline ? 'Você está online' : 'Você está offline'}>
           {isOnline ? (
                <i className="fas fa-wifi text-green-500"></i>
            ) : (
                <i className="fas fa-wifi-slash text-red-500"></i>
            )}
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
          <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} text-lg text-neutral-600 dark:text-neutral-300`}></i>
        </button>
        
        <div className="relative">
          <button onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors relative">
            <i className="fas fa-bell text-lg text-neutral-600 dark:text-neutral-300"></i>
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                {unreadNotifications}
              </span>
            )}
          </button>
          {notificationDropdownOpen && (
             <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-800 rounded-md shadow-lg z-20 border border-neutral-200 dark:border-neutral-700">
              <div className="p-3 font-semibold border-b border-neutral-200 dark:border-neutral-700">Notificações</div>
              <div className="py-1 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-neutral-500">Nenhuma notificação.</p>
                ) : (
                  notifications.slice().reverse().map(n => (
                    <div key={n.id} onClick={() => markAsRead(n.id)} className={`px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer ${!n.read ? 'font-bold' : ''}`}>
                      <p className="text-sm text-neutral-700 dark:text-neutral-200">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-semibold text-sm">{user?.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{getRoleDisplayName(user?.role || '')}</p>
            </div>
          </button>
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg py-1 z-20 border border-neutral-200 dark:border-neutral-700">
              <a href="#" className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700">Meu Perfil</a>
              <button
                onClick={logout}
                className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;