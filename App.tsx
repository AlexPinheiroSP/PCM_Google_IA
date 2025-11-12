


import React, { useState, useCallback, useMemo, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import AppLayout from './components/layout/AppLayout';
import { User, Notification, MaintenanceCall, Role, Company, CompanyContextType, Permissions, Page } from './types';
import { MOCK_USERS, MOCK_MAINTENANCE_CALLS, MOCK_COMPANIES, DEFAULT_PAGE_PERMISSIONS } from './constants';

// Create a context to provide auth info to the entire app
export const AuthContext = React.createContext<{
  user: User | null;
  logout: () => void;
  isOnline: boolean;
}>({
  user: null,
  logout: () => {},
  isOnline: true,
});

// Create a context for notifications
export const NotificationContext = React.createContext<{
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: number) => void;
}>({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
});

// Create a context for managing maintenance call data globally
export const DataContext = React.createContext<{
  calls: MaintenanceCall[];
  updateCall: (updatedCall: MaintenanceCall) => void;
  addCall: (newCall: Omit<MaintenanceCall, 'id'>) => void;
  isLoading: boolean;
}>({
  calls: [],
  updateCall: () => {},
  addCall: () => {},
  isLoading: true,
});

// Create a context for managing companies
export const CompanyContext = React.createContext<CompanyContextType>({
    companies: [],
    addCompany: () => {},
});

// Create a context for managing page permissions
export const PermissionContext = React.createContext<{
  permissions: Permissions;
  updatePermission: (role: Role, page: Page, value: boolean) => void;
}>({
  permissions: DEFAULT_PAGE_PERMISSIONS,
  updatePermission: () => {},
});


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [calls, setCalls] = useState<MaintenanceCall[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PAGE_PERMISSIONS);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load data from local storage on initial load to support offline mode
    try {
        const localCalls = localStorage.getItem('pcm_maintenance_calls');
        if (localCalls) {
            setCalls(JSON.parse(localCalls));
        } else {
            setCalls(MOCK_MAINTENANCE_CALLS);
            localStorage.setItem('pcm_maintenance_calls', JSON.stringify(MOCK_MAINTENANCE_CALLS));
        }

        const localCompanies = localStorage.getItem('pcm_companies');
        if (localCompanies) {
            setCompanies(JSON.parse(localCompanies));
        } else {
            setCompanies(MOCK_COMPANIES);
            localStorage.setItem('pcm_companies', JSON.stringify(MOCK_COMPANIES));
        }
        
        const localPermissions = localStorage.getItem('pcm_page_permissions');
        if (localPermissions) {
            setPermissions(JSON.parse(localPermissions));
        } else {
            setPermissions(DEFAULT_PAGE_PERMISSIONS);
            localStorage.setItem('pcm_page_permissions', JSON.stringify(DEFAULT_PAGE_PERMISSIONS));
        }

    } catch (error) {
        console.error("Failed to load or parse local data:", error);
        setCalls(MOCK_MAINTENANCE_CALLS); // Fallback to mocks
        setCompanies(MOCK_COMPANIES);
        setPermissions(DEFAULT_PAGE_PERMISSIONS);
    } finally {
        setIsLoadingData(false);
    }

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}, []);


  const handleLogin = useCallback((username: string) => {
    const foundUser = MOCK_USERS.find(u => u.login === username);
    if (foundUser) {
      setUser(foundUser);
    } else {
      console.error("User not found");
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setNotifications([]);
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read'>) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now(), read: false }]);
  }, []);
  
  const markAsRead = useCallback((id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const updateCall = useCallback((updatedCall: MaintenanceCall) => {
    setCalls(prevCalls => {
        const newCalls = prevCalls.map(call => call.id === updatedCall.id ? updatedCall : call);
        try {
            localStorage.setItem('pcm_maintenance_calls', JSON.stringify(newCalls));
        } catch (error) {
            console.error("Failed to save data locally:", error);
        }
        return newCalls;
    });
  }, []);

  const addCall = useCallback((newCallData: Omit<MaintenanceCall, 'id'>) => {
    setCalls(prevCalls => {
        const newCall: MaintenanceCall = {
            ...newCallData,
            id: Date.now(),
        };
        const newCalls = [...prevCalls, newCall];
        try {
            localStorage.setItem('pcm_maintenance_calls', JSON.stringify(newCalls));
        } catch (error) {
            console.error("Failed to save new call locally:", error);
        }
        return newCalls;
    });
}, []);

  const addCompany = useCallback((newCompany: Company) => {
    setCompanies(prev => {
        const newCompanies = [...prev, newCompany];
        try {
            localStorage.setItem('pcm_companies', JSON.stringify(newCompanies));
        } catch (error) {
            console.error("Failed to save companies locally:", error);
        }
        return newCompanies;
    });
  }, []);
  
  const updatePermission = useCallback((role: Role, page: Page, value: boolean) => {
    setPermissions(prev => {
        const newPermissions = {
            ...prev,
            [role]: {
                ...prev[role],
                [page]: value,
            }
        };
        try {
            localStorage.setItem('pcm_page_permissions', JSON.stringify(newPermissions));
        } catch (error) {
            console.error("Failed to save permissions locally:", error);
        }
        return newPermissions;
    });
  }, []);

  const authContextValue = useMemo(() => ({ user, logout: handleLogout, isOnline }), [user, handleLogout, isOnline]);
  const notificationContextValue = useMemo(() => ({ notifications, addNotification, markAsRead }), [notifications, addNotification, markAsRead]);
  const dataContextValue = useMemo(() => ({ calls, updateCall, addCall, isLoading: isLoadingData }), [calls, updateCall, addCall, isLoadingData]);
  const companyContextValue = useMemo(() => ({ companies, addCompany }), [companies, addCompany]);
  const permissionContextValue = useMemo(() => ({ permissions, updatePermission }), [permissions, updatePermission]);

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <NotificationContext.Provider value={notificationContextValue}>
        <DataContext.Provider value={dataContextValue}>
          <CompanyContext.Provider value={companyContextValue}>
            <PermissionContext.Provider value={permissionContextValue}>
              <AppLayout />
            </PermissionContext.Provider>
          </CompanyContext.Provider>
        </DataContext.Provider>
      </NotificationContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;