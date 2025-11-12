
import React, { useContext, useMemo } from 'react';
import { AuthContext } from '../App';
import { MOCK_MAINTENANCE_CALLS, MOCK_EQUIPMENT, MOCK_TEAMS, MOCK_PLANTS } from '../constants';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { MaintenanceCall, Role } from '../types';

const TeamViewPage: React.FC = () => {
  const { user } = useContext(AuthContext);

  const filteredData = useMemo(() => {
    // This view doesn't make sense for a system admin without a team, but we handle it.
    if (user?.role === Role.SYSTEM_ADMINISTRATOR && !user.teamId) {
      return { teamCalls: [], equipment: MOCK_EQUIPMENT };
    }

    if (!user?.companyId || !user.teamId) {
      return { teamCalls: [], equipment: [] };
    }

    const companyPlantIds = MOCK_PLANTS
      .filter(p => p.companyId === user.companyId)
      .map(p => p.id);

    const companyCalls = MOCK_MAINTENANCE_CALLS.filter(c => companyPlantIds.includes(c.plantId));
    
    // Filter by responsible user's team ID. Note: responsible is optional.
    const teamCalls = companyCalls.filter(call => call.responsible?.teamId === user.teamId);
    
    const equipment = MOCK_EQUIPMENT.filter(e => companyPlantIds.includes(e.plantId));
    
    return { teamCalls, equipment };

  }, [user]);
  
  const teamName = useMemo(() => {
    if (!user || !user.teamId) return 'Visitante';
    return MOCK_TEAMS.find(t => t.id === user.teamId)?.name || 'Desconhecida';
  }, [user]);

  const renderCallList = (calls: MaintenanceCall[], equipmentList: typeof MOCK_EQUIPMENT) => {
    if (calls.length === 0) {
      return <p className="text-neutral-500 dark:text-neutral-400">Nenhum chamado encontrado para esta equipe.</p>
    }
    return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-neutral-500 dark:text-neutral-400">
            <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400">
              <tr>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Equipamento</th>
                <th scope="col" className="px-6 py-3">Descrição</th>
                <th scope="col" className="px-6 py-3">Prioridade</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => {
                const equipment = equipmentList.find(e => e.id === call.equipmentId);
                return (
                  <tr key={call.id} className="bg-white border-b dark:bg-neutral-800 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600">
                    <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">#{call.id}</td>
                    <td className="px-6 py-4">{equipment?.name}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{call.description}</td>
                    <td className="px-6 py-4"><PriorityBadge priority={call.priority} /></td>
                    <td className="px-6 py-4"><StatusBadge status={call.status} /></td>
                    <td className="px-6 py-4">{call.responsible?.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Visão da Equipe: <span className="text-primary-500">{teamName}</span></h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Acompanhe aqui todos os chamados de manutenção que estão sob a responsabilidade da sua equipe.
      </p>

      <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
        {user?.teamId ? renderCallList(filteredData.teamCalls, filteredData.equipment) : <p className="text-orange-500">Você não está associado a nenhuma equipe para visualizar os chamados.</p>}
      </div>
    </div>
  );
};

export default TeamViewPage;