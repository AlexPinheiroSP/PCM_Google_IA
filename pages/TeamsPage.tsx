import React, { useState, useMemo } from 'react';
import { MOCK_TEAMS } from '../constants';
import { Team } from '../types';

const TeamsPage: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTeams = useMemo(() =>
        teams.filter(team =>
            team.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [teams, searchTerm]);

    const handleOpenModal = (team: Team | null = null) => {
        setEditingTeam(team);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTeam(null);
    };

    const handleSaveTeam = (teamData: { name: string }) => {
        if (editingTeam) {
            setTeams(teams.map(t => t.id === editingTeam.id ? { ...t, ...teamData } : t));
        } else {
            const newTeam: Team = {
                id: Math.max(...teams.map(t => t.id)) + 1,
                name: teamData.name,
            };
            setTeams([...teams, newTeam]);
        }
        handleCloseModal();
    };
    
    const handleConfirmDelete = () => {
        if (!deletingTeam) return;
        setTeams(teams.filter(t => t.id !== deletingTeam.id));
        setDeletingTeam(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gerenciamento de Equipes</h1>
                <button onClick={() => handleOpenModal()} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center">
                    <i className="fas fa-plus mr-2"></i>
                    Nova Equipe
                </button>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
                <input
                    type="text"
                    placeholder="Buscar equipe..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm p-2 mb-4 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-neutral-500 dark:text-neutral-400">
                        <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID</th>
                                <th scope="col" className="px-6 py-3">Nome da Equipe</th>
                                <th scope="col" className="px-6 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTeams.map((team) => (
                                <tr key={team.id} className="bg-white border-b dark:bg-neutral-800 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600">
                                    <td className="px-6 py-4 font-mono">{team.id}</td>
                                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">{team.name}</td>
                                    <td className="px-6 py-4 space-x-4">
                                        <button onClick={() => handleOpenModal(team)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Editar</button>
                                        <button onClick={() => setDeletingTeam(team)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Remover</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isModalOpen && (
                <TeamModal
                    team={editingTeam}
                    onClose={handleCloseModal}
                    onSave={handleSaveTeam}
                />
            )}

            {deletingTeam && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                        <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-700">
                          <h2 className="text-xl font-bold">Confirmar Remoção</h2>
                          <button onClick={() => setDeletingTeam(null)} className="text-2xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">&times;</button>
                        </div>
                        <p className="mt-4 text-neutral-600 dark:text-neutral-300">
                            Tem certeza que deseja remover a equipe <strong>{deletingTeam.name}</strong>? Esta ação não pode ser desfeita.
                        </p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button type="button" onClick={() => setDeletingTeam(null)} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-500">Cancelar</button>
                            <button type="button" onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Remover</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface TeamModalProps {
    team: Team | null;
    onClose: () => void;
    onSave: (data: { name: string }) => void;
}

const TeamModal: React.FC<TeamModalProps> = ({ team, onClose, onSave }) => {
    const [name, setName] = useState(team?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave({ name });
        }
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-700">
                        <h2 className="text-xl font-bold">{team ? 'Editar Equipe' : 'Nova Equipe'}</h2>
                        <button type="button" onClick={onClose} className="text-2xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">&times;</button>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nome da Equipe</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full p-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-500">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeamsPage;