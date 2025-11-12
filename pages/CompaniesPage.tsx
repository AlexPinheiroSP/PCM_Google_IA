import React, { useState, useContext } from 'react';
import { CompanyContext } from '../App';
import { Company } from '../types';

const CompaniesPage: React.FC = () => {
    const { companies, addCompany } = useContext(CompanyContext);
    const [newCompany, setNewCompany] = useState({
        id: '',
        name: '',
        region: '',
        administrator: '',
        phone: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCompany.name.trim() === '' || newCompany.id.trim() === '') return;

        setIsSubmitting(true);
        // Simulate async operation
        setTimeout(() => {
            const companyToAdd: Company = {
              ...newCompany,
              id: parseInt(newCompany.id, 10),
            };
            addCompany(companyToAdd);
            setNewCompany({ id: '', name: '', region: '', administrator: '', phone: '' });
            setIsSubmitting(false);
        }, 500);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewCompany(prev => ({...prev, [name]: value}));
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Gerenciamento de Empresas</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-lg font-semibold mb-4">Empresas Cadastradas</h3>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm text-left text-neutral-500 dark:text-neutral-400">
                            <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">ID</th>
                                    <th scope="col" className="px-6 py-3">Nome da Empresa</th>
                                    <th scope="col" className="px-6 py-3">Administrador</th>
                                    <th scope="col" className="px-6 py-3">Telefone</th>
                                    <th scope="col" className="px-6 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((company) => (
                                    <tr key={company.id} className="bg-white border-b dark:bg-neutral-800 dark:border-neutral-700">
                                        <td className="px-6 py-4 font-mono text-neutral-500">{company.id}</td>
                                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">{company.name}</td>
                                        <td className="px-6 py-4">{company.administrator}</td>
                                        <td className="px-6 py-4">{company.phone}</td>
                                        <td className="px-6 py-4">
                                            <button className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-lg font-semibold mb-4">Adicionar Nova Empresa</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <InputField label="ID da Empresa" name="id" type="number" value={newCompany.id} onChange={handleChange} placeholder="Ex: 3" required />
                        <InputField label="Nome da Empresa" name="name" value={newCompany.name} onChange={handleChange} placeholder="Ex: Indústria de Plásticos" required />
                        <InputField label="Região" name="region" value={newCompany.region} onChange={handleChange} placeholder="Ex: Sudeste" />
                        <InputField label="Administrador" name="administrator" value={newCompany.administrator} onChange={handleChange} placeholder="Ex: João da Silva" />
                        <InputField label="Telefone" name="phone" value={newCompany.phone} onChange={handleChange} placeholder="(11) 99999-9999" />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-primary-400 disabled:cursor-not-allowed flex items-center justify-center mt-2"
                        >
                            {isSubmitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-plus mr-2"></i>}
                            {isSubmitting ? 'Adicionando...' : 'Adicionar Empresa'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Helper component for form fields
const InputField: React.FC<{ label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, required?: boolean, type?: string }> = ({ label, name, value, onChange, placeholder = '', required = false, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-neutral-300">
            {label}
        </label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md text-white"
        />
    </div>
);


export default CompaniesPage;