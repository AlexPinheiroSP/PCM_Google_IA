

import React, { useContext, useMemo, useState } from 'react';
import { AuthContext, DataContext, NotificationContext } from '../App';
import { Role, CallSource, MaintenanceStatus, User, MaintenanceCall, MaintenanceCallEvent } from '../types';
import { MOCK_EQUIPMENT, MOCK_PLANTS, MOCK_USERS } from '../constants';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';

const formatDuration = (ms: number) => {
  if (ms < 0) ms = 0;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || (days === 0 && hours === 0)) result += `${minutes}m`;
  
  return result.trim() || '0m';
};

const calculateDuration = (start: string, end: string) => {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return formatDuration(diff);
};

const MaintenanceCallsPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { calls, updateCall } = useContext(DataContext);
  const { addNotification } = useContext(NotificationContext);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCallToAssign, setSelectedCallToAssign] = useState<MaintenanceCall | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCallForDetails, setSelectedCallForDetails] = useState<MaintenanceCall | null>(null);


  const filteredData = useMemo(() => {
    // SYSTEM_ADMINISTRATOR sees all data
    if (user?.role === Role.SYSTEM_ADMINISTRATOR) {
        return { calls, equipment: MOCK_EQUIPMENT };
    }

    if (!user?.companyId) return { calls: [], equipment: [] };
    
    const companyPlantIds = MOCK_PLANTS.filter(p => p.companyId === user.companyId).map(p => p.id);
    let companyCalls = calls.filter(c => companyPlantIds.includes(c.plantId));
    const equipment = MOCK_EQUIPMENT.filter(e => companyPlantIds.includes(e.plantId));

    if (user.role === Role.ADMIN_PLANTA && user.plantId) {
        companyCalls = companyCalls.filter(c => c.plantId === user.plantId);
    }
    
    return { calls: companyCalls, equipment };
  }, [user, calls]);

  const techniciansForModal = useMemo(() => {
    if (!user || !selectedCallToAssign) return [];
    
    const allTechnicians = MOCK_USERS.filter(u => u.role === Role.TECNICO_PCM);
    
    const callPlant = MOCK_PLANTS.find(p => p.id === selectedCallToAssign.plantId);
    if (!callPlant) return [];

    // System admin sees techs from the call's company
    if (user.role === Role.SYSTEM_ADMINISTRATOR) {
      return allTechnicians.filter(t => t.companyId === callPlant.companyId);
    }
    
    // Other roles see techs from their own company
    return allTechnicians.filter(t => t.companyId === user.companyId);
  }, [user, selectedCallToAssign]);

  const handleOpenAssignModal = (call: MaintenanceCall) => {
    setSelectedCallToAssign(call);
    setSelectedTechnicianId(''); // Reset selection
    setIsAssignModalOpen(true);
  };
  
  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedCallToAssign(null);
  };
  
  const handleOpenDetailsModal = (call: MaintenanceCall) => {
    setSelectedCallForDetails(call);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedCallForDetails(null);
  };

  const handleConfirmAssignment = () => {
    if (!selectedCallToAssign || !selectedTechnicianId || !user) return;

    const technician = MOCK_USERS.find(u => u.id === parseInt(selectedTechnicianId));
    if (!technician) return;

    const now = new Date().toISOString();
    
    const updatedCall = {
        ...selectedCallToAssign,
        status: MaintenanceStatus.EM_ANDAMENTO,
        responsible: technician,
        assignedAt: now,
        events: [
            ...selectedCallToAssign.events,
            {
                status: MaintenanceStatus.EM_ANDAMENTO,
                timestamp: now,
                userId: user.id,
                notes: `Atribuído para ${technician.name}`
            }
        ]
    };
    
    updateCall(updatedCall);
    addNotification({
        message: `Chamado #${updatedCall.id} atribuído para ${technician.name}.`,
        callId: updatedCall.id,
    });
    handleCloseAssignModal();
  };

  const handleAction = (callId: number, action: 'resolve' | 'approve' | 'reject') => {
    const call = filteredData.calls.find(c => c.id === callId);
    if (!call || !user) return;
    
    let updatedCall = { ...call };
    const now = new Date().toISOString();
    let newStatus: MaintenanceStatus | null = null;
    let notes: string | undefined = undefined;

    switch(action) {
        case 'resolve':
            updatedCall.status = MaintenanceStatus.AGUARDANDO_APROVACAO;
            updatedCall.resolvedAt = now;
            newStatus = MaintenanceStatus.AGUARDANDO_APROVACAO;
            addNotification({
              message: `Chamado #${call.id} finalizado. Aguardando sua aprovação.`,
              callId: call.id,
            });
            break;
        case 'approve':
            updatedCall.status = MaintenanceStatus.ENCERRADO;
            updatedCall.approvedAt = now;
            updatedCall.closedAt = now;
            newStatus = MaintenanceStatus.ENCERRADO;
            break;
        case 'reject':
            updatedCall.status = MaintenanceStatus.EM_ANDAMENTO; // Re-opens for the same tech
            notes = 'Aprovação rejeitada. Retornado para o manutentor.';
            newStatus = MaintenanceStatus.EM_ANDAMENTO;
            break;
    }

    if (newStatus) {
        const newEvent: MaintenanceCallEvent = {
            status: newStatus,
            timestamp: now,
            userId: user.id,
            notes
        };
        updatedCall.events = [...call.events, newEvent];
    }
    updateCall(updatedCall);
  };
  
  const renderActions = (call: MaintenanceCall) => {
    const isTech = user?.role === Role.TECNICO_PCM;
    const isRequester = user?.id === call.requesterId;
    const isAdmin = user?.role === Role.ADMINISTRATOR || user?.role === Role.ADMIN_PLANTA || user?.role === Role.SYSTEM_ADMINISTRATOR;

    switch(call.status) {
        case MaintenanceStatus.ABERTO:
            if(isAdmin) {
              return <button onClick={() => handleOpenAssignModal(call)} className="text-sm font-semibold text-primary-500 hover:text-primary-600">Atribuir</button>;
            }
            break;
        case MaintenanceStatus.EM_ANDAMENTO:
            if(call.responsible?.id === user?.id) {
               return <button onClick={() => handleAction(call.id, 'resolve')} className="text-sm font-semibold text-blue-500 hover:text-blue-600">Finalizar Reparo</button>;
            }
            break;
        case MaintenanceStatus.AGUARDANDO_APROVACAO:
            if(isRequester || isAdmin) {
              return (
                <div className="flex space-x-2">
                   <button onClick={() => handleAction(call.id, 'approve')} className="text-sm font-semibold text-green-500 hover:text-green-600">Aprovar</button>
                   <button onClick={() => handleAction(call.id, 'reject')} className="text-sm font-semibold text-red-500 hover:text-red-600">Rejeitar</button>
                </div>
              );
            }
            break;
        default:
            return <span className="text-xs text-neutral-500">N/A</span>;
    }
    return <span className="text-xs text-neutral-500">N/A</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chamados de Manutenção</h1>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center">
          <i className="fas fa-plus mr-2"></i>
          Novo Chamado
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-neutral-500 dark:text-neutral-400">
            <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400">
              <tr>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Origem</th>
                <th scope="col" className="px-6 py-3">Equipamento</th>
                <th scope="col" className="px-6 py-3">Descrição</th>
                <th scope="col" className="px-6 py-3">Prioridade</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Responsável</th>
                <th scope="col" className="px-6 py-3">Abertura</th>
                <th scope="col" className="px-6 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.calls.map((call) => {
                const equipment = filteredData.equipment.find(e => e.id === call.equipmentId);
                return (
                  <tr key={call.id} className="bg-white border-b dark:bg-neutral-800 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600">
                    <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white">#{call.id}</td>
                    <td className="px-6 py-4 text-center">
                      <span title={`Origem: ${call.source}`}>
                        {call.source === CallSource.AUTOMATICO ? '🤖' : '👤'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{equipment?.name}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{call.description}</td>
                    <td className="px-6 py-4"><PriorityBadge priority={call.priority} /></td>
                    <td className="px-6 py-4"><StatusBadge status={call.status} /></td>
                    <td className="px-6 py-4">{call.responsible?.name || 'Não atribuído'}</td>
                    <td className="px-6 py-4">{new Date(call.openedAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-center space-x-3">
                        {renderActions(call)}
                        <button onClick={() => handleOpenDetailsModal(call)} title="Ver detalhes" className="text-neutral-400 hover:text-primary-500">
                           <i className="fas fa-history"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {isAssignModalOpen && selectedCallToAssign && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300">
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4 transform transition-all duration-300 scale-100">
                    <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-700">
                         <h2 className="text-xl font-bold">Atribuir Chamado #{selectedCallToAssign.id}</h2>
                         <button onClick={handleCloseAssignModal} className="text-2xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">&times;</button>
                    </div>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label htmlFor="technician" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Selecione o Técnico
                            </label>
                            <select
                                id="technician"
                                value={selectedTechnicianId}
                                onChange={(e) => setSelectedTechnicianId(e.target.value)}
                                className="w-full p-2 border rounded-md bg-neutral-50 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="" disabled>-- Selecione um técnico --</option>
                                {techniciansForModal.map(tech => (
                                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCloseAssignModal}
                            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmAssignment}
                            disabled={!selectedTechnicianId}
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed transition-colors"
                        >
                            Atribuir
                        </button>
                    </div>
                </div>
            </div>
        )}
        {isDetailsModalOpen && selectedCallForDetails && (() => {
            const sortedEvents = selectedCallForDetails.events.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            const lastEvent = sortedEvents[sortedEvents.length - 1];
            const isClosed = lastEvent.status === MaintenanceStatus.ENCERRADO || lastEvent.status === MaintenanceStatus.CANCELADO;
            const totalDuration = calculateDuration(
                sortedEvents[0].timestamp,
                isClosed ? lastEvent.timestamp : new Date().toISOString()
            );

            return (
                 <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                            <h2 className="text-xl font-bold">Linha do Tempo - Chamado #{selectedCallForDetails.id}</h2>
                            <button onClick={handleCloseDetailsModal} className="text-2xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">&times;</button>
                        </div>
                        <div className="mt-4 space-y-2 overflow-y-auto pr-2 flex-grow">
                             {sortedEvents.map((event, index) => {
                                const previousEvent = index > 0 ? sortedEvents[index - 1] : null;
                                const userWhoActed = MOCK_USERS.find(u => u.id === event.userId);
                                const duration = previousEvent ? calculateDuration(previousEvent.timestamp, event.timestamp) : null;

                                return (
                                    <div key={index} className="flex space-x-4 relative">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs z-10 ${index === sortedEvents.length - 1 ? 'bg-primary-500' : 'bg-neutral-400'}`}>
                                                <i className="fas fa-check"></i>
                                            </div>
                                            {index < sortedEvents.length - 1 && <div className="absolute top-5 left-[9px] w-0.5 h-full bg-neutral-300 dark:bg-neutral-600"></div>}
                                        </div>
                                        <div className="pb-6 w-full">
                                            <p className="font-bold text-neutral-800 dark:text-neutral-100">{event.status}</p>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                {userWhoActed?.name || 'Sistema'} &bull; {new Date(event.timestamp).toLocaleString('pt-BR')}
                                            </p>
                                            {event.notes && <p className="text-sm mt-1 p-2 bg-neutral-100 dark:bg-neutral-700 rounded-md italic">"{event.notes}"</p>}
                                            {duration && (
                                                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-2">
                                                    <i className="fas fa-hourglass-half mr-1.5"></i>
                                                    Tempo na etapa anterior: {duration}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                            <p className="font-semibold text-neutral-600 dark:text-neutral-300">Tempo Total do Chamado:</p>
                            <p className={`text-2xl font-bold ${isClosed ? 'text-green-500' : 'text-yellow-500'}`}>{totalDuration} {isClosed ? '' : '(em andamento)'}</p>
                        </div>
                    </div>
                </div>
            )
        })()}
    </div>
  );
};

export default MaintenanceCallsPage;