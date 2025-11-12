

import React, { useContext, useMemo, useState } from 'react';
import { MOCK_USERS, MOCK_PLANTS, MOCK_TEAMS, MOCK_COMPANIES } from '../constants';
import { Role, User } from '../types';
import { AuthContext } from '../App';

// FIX: Moved getRoleDisplayName to module scope to be accessible by both UsersPage and NewUserModal components.
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

const UsersPage: React.FC = () => {
    const { user: currentUser } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // In a real app, this would be managed by a global state/context
    const [users, setUsers] = useState(MOCK_USERS);

    const filteredUsers = useMemo(() => {
        if (!currentUser) return [];

        if (currentUser.role === Role.SYSTEM_ADMINISTRATOR) {
            return users;
        }

        if (!currentUser.companyId) return [];
        
        return users.filter(user => user.companyId === currentUser.companyId);
    }, [currentUser, users]);
    
    const handleAddNewUser = (newUser: Omit<User, 'id' | 'permissions'>) => {
        // NOTE: This is a mock implementation. In a real app, this would call an API.
        const userToAdd: User = {
            ...newUser,
            id: Date.now(),
            permissions: [], // Default permissions based on role would be set by backend
        };
        setUsers(prev => [...prev, userToAdd]);
        setIsModalOpen(false);
    }
      
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center">
          <i className="fas fa-plus mr-2"></i>
          Novo Usuário
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-neutral-500 dark:text-neutral-400">
            <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400">
              <tr>
                <th scope="col" className="px-6 py-3">Nome</th>
                <th scope="col" className="px-6 py-3">Email</th>
                {currentUser?.role === Role.SYSTEM_ADMINISTRATOR && <th scope="col" className="px-6 py-3">Empresa</th>}
                <th scope="col" className="px-6 py-3">Perfil</th>
                <th scope="col" className="px-6 py-3">Equipe</th>
                <th scope="col" className="px-6 py-3">Planta</th>
                <th scope="col" className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const plant = MOCK_PLANTS.find(p => p.id === user.plantId);
                const team = MOCK_TEAMS.find(t => t.id === user.teamId);
                const company = MOCK_COMPANIES.find(c => c.id === user.companyId);
                return (
                  <tr key={user.id} className="bg-white border-b dark:bg-neutral-800 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600">
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    {currentUser?.role === Role.SYSTEM_ADMINISTRATOR && <td className="px-6 py-4">{company?.name || 'N/A'}</td>}
                    <td className="px-6 py-4">{getRoleDisplayName(user.role)}</td>
                    <td className="px-6 py-4">{team?.name || 'N/A'}</td>
                    <td className="px-6 py-4">{user.role === Role.ADMINISTRATOR ? 'Todas' : (plant?.name || 'N/A')}</td>
                    <td className="px-6 py-4 space-x-4">
                      <button className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Editar</button>
                      <button className="font-medium text-red-600 dark:text-red-500 hover:underline">Remover</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
       {isModalOpen && <NewUserModal currentUser={currentUser} onClose={() => setIsModalOpen(false)} onSave={handleAddNewUser} />}
    </div>
  );
};

// Modal Component
interface NewUserModalProps {
    currentUser: User | null;
    onClose: () => void;
    onSave: (user: Omit<User, 'id' | 'permissions'>) => void;
}

const NewUserModal: React.FC<NewUserModalProps> = ({ currentUser, onClose, onSave }) => {
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        login: '',
        role: Role.OPERADOR,
        companyId: currentUser?.role !== Role.SYSTEM_ADMINISTRATOR ? currentUser?.companyId : undefined,
        plantId: undefined,
        teamId: undefined,
    });
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(newUser);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Convert value to number if it's a numeric field from a select
        const isNumericField = ['companyId', 'plantId', 'teamId'].includes(name);
        const processedValue = isNumericField && value ? parseInt(value) : value;
        setNewUser(prev => ({ ...prev, [name]: processedValue }));
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-700">
                    <h2 className="text-xl font-bold">Adicionar Novo Usuário</h2>
                    <button onClick={onClose} className="text-2xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <InputField label="Nome Completo" name="name" value={newUser.name} onChange={handleChange} required />
                    <InputField label="Email" name="email" type="email" value={newUser.email} onChange={handleChange} required />
                    <InputField label="Login" name="login" value={newUser.login} onChange={handleChange} required />
                     {currentUser?.role === Role.SYSTEM_ADMINISTRATOR && (
                        <SelectField label="Empresa" name="companyId" value={newUser.companyId} onChange={handleChange}>
                           <option value="">Selecione a Empresa</option>
                           {MOCK_COMPANIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </SelectField>
                    )}
                    <SelectField label="Perfil de Acesso" name="role" value={newUser.role} onChange={handleChange}>
                        {Object.values(Role).map(role => <option key={role} value={role}>{getRoleDisplayName(role)}</option>)}
                    </SelectField>
                     <SelectField label="Equipe" name="teamId" value={newUser.teamId} onChange={handleChange}>
                           <option value="">Nenhuma equipe</option>
                           {MOCK_TEAMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </SelectField>
                    <SelectField label="Planta" name="plantId" value={newUser.plantId} onChange={handleChange}>
                           <option value="">Nenhuma planta específica</option>
                           {MOCK_PLANTS.filter(p => !newUser.companyId || p.companyId === newUser.companyId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </SelectField>
                    
                     <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-500">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Helper components for form fields
const InputField: React.FC<{ label: string, name: string, value: string, onChange: any, type?: string, required?: boolean }> = ({ label, name, value, onChange, type = 'text', required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{label}</label>
        <input id={name} name={name} type={type} value={value} onChange={onChange} required={required} className="w-full p-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary-500 focus:border-primary-500" />
    </div>
);

const SelectField: React.FC<{ label: string, name: string, value: any, onChange: any, children: React.ReactNode }> = ({ label, name, value, onChange, children }) => (
     <div>
        <label htmlFor={name} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{label}</label>
        <select id={name} name={name} value={value || ''} onChange={onChange} className="w-full p-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary-500 focus:border-primary-500">
            {children}
        </select>
    </div>
);


export default UsersPage;
