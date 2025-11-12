

import React, { useContext, useMemo, useState } from 'react';
import { AuthContext, DataContext, NotificationContext } from '../App';
import { Role, CallSource, MaintenanceStatus, User, MaintenanceCall, MaintenanceCallEvent, MaintenancePriority, Equipment } from '../types';
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
  const { calls, updateCall, addCall } = useContext(DataContext);
  const { addNotification } = useContext(NotificationContext);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<MaintenanceCall | null>(null);
  
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState(false);


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
    if (!user || !selectedCall) return [];
    
    const allTechnicians = MOCK_USERS.filter(u => u.role === Role.TECNICO_PCM);
    
    const callPlant = MOCK_PLANTS.find(p => p.id === selectedCall.plantId);
    if (!callPlant) return [];

    // System admin sees techs from the call's company
    if (user.role === Role.SYSTEM_ADMINISTRATOR) {
      return allTechnicians.filter(t => t.companyId === callPlant.companyId);
    }
    
    // Other roles see techs from their own company
    return allTechnicians.filter(t => t.companyId === user.companyId);
  }, [user, selectedCall]);

  const handleOpenAssignModal = (call: MaintenanceCall) => {
    setSelectedCall(call);
    setIsAssignModalOpen(true);
  };
  
  const handleOpenTransferModal = (call: MaintenanceCall) => {
    setSelectedCall(call);
    setIsTransferModalOpen(true);
  };

  const handleOpenDetailsModal = (call: MaintenanceCall) => {
    setSelectedCall(call);
    setIsDetailsModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsAssignModalOpen(false);
    setIsTransferModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedCall(null);
  };
  
  const handleSaveNewCall = (newCallData: Omit<MaintenanceCall, 'id' | 'plantId' | 'status' | 'requesterId' | 'source' | 'openedAt' | 'events'> & { equipmentId: number }) => {
    if (!user) return;
    const now = new Date().toISOString();
    const equipment = MOCK_EQUIPMENT.find(e => e.id === newCallData.equipmentId);
    if (!equipment) return;

    const newCall: Omit<MaintenanceCall, 'id'> = {
        ...newCallData,
        plantId: equipment.plantId,
        status: MaintenanceStatus.ABERTO,
        requesterId: user.id,
        source: CallSource.MANUAL,
        openedAt: now,
        events: [{
            status: MaintenanceStatus.ABERTO,
            timestamp: now,
            userId: user.id,
            notes: 'Chamado aberto manualmente.'
        }]
    };
    addCall(newCall);
    addNotification({
        message: `Novo chamado para ${equipment.name} foi aberto.`,
        callId: 0, // ID will be assigned in App.tsx
    });
    setIsNewCallModalOpen(false);
  };

  const handleConfirmAssignment = (technicianId: string) => {
    if (!selectedCall || !technicianId || !user) return;

    const technician = MOCK_USERS.find(u => u.id === parseInt(technicianId));
    if (!technician) return;

    const now = new Date().toISOString();
    
    const updatedCall = {
        ...selectedCall,
        status: MaintenanceStatus.EM_ANDAMENTO,
        responsible: technician,
        assignedAt: now,
        events: [
            ...selectedCall.events,
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
    handleCloseModals();
  };
  
  const handleConfirmTransfer = (technicianId: string, reason: string) => {
    if (!selectedCall || !technicianId || !reason || !user) return;
    
    const newTechnician = MOCK_USERS.find(u => u.id === parseInt(technicianId));
    if (!newTechnician) return;
    
    const now = new Date().toISOString();
    const oldTechnicianName = selectedCall.responsible?.name || 'N/A';
    
    const updatedCall = {
      ...selectedCall,
      responsible: newTechnician,
      assignedAt: now, // Reset assignment time
      events: [
        ...selectedCall.events,
        {
          status: MaintenanceStatus.EM_ANDAMENTO,
          timestamp: now,
          userId: user.id,
          notes: `Transferido de ${oldTechnicianName} para ${newTechnician.name}. Motivo: ${reason}`
        }
      ]
    };
    
    updateCall(updatedCall);
    addNotification({
        message: `Chamado #${updatedCall.id} foi transferido para ${newTechnician.name}.`,
        callId: updatedCall.id,
    });
    handleCloseModals();
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
               return (
                <div className="flex space-x-2">
                   <button onClick={() => handleAction(call.id, 'resolve')} className="text-sm font-semibold text-blue-500 hover:text-blue-600">Finalizar</button>
                   <button onClick={() => handleOpenTransferModal(call)} className="text-sm font-semibold text-orange-500 hover:text-orange-600">Transferir</button>
                </div>
              );
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
        <button onClick={() => setIsNewCallModalOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center">
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
      {isNewCallModalOpen && (
        <NewCallModal 
            onClose={() => setIsNewCallModalOpen(false)}
            onSave={handleSaveNewCall}
            equipmentList={filteredData.equipment}
        />
      )}
      {isAssignModalOpen && selectedCall && (
            <AssignModal
                call={selectedCall}
                technicians={techniciansForModal}
                onClose={handleCloseModals}
                onConfirm={handleConfirmAssignment}
            />
        )}
      {isTransferModalOpen && selectedCall && (
            <TransferModal
                call={selectedCall}
                technicians={techniciansForModal.filter(t => t.id !== selectedCall.responsible?.id)}
                onClose={handleCloseModals}
                onConfirm={handleConfirmTransfer}
            />
        )}
      {isDetailsModalOpen && selectedCall && (() => {
            const sortedEvents = selectedCall.events.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
                            <h2 className="text-xl font-bold">Linha do Tempo - Chamado #{selectedCall.id}</h2>
                            <button onClick={handleCloseModals} className="text-2xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">&times;</button>
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

// --- Modals ---

const AssignModal: React.FC<{call: MaintenanceCall; technicians: User[]; onClose: () => void; onConfirm: (techId: string) => void;}> = ({ call, technicians, onClose, onConfirm }) => {
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-700">
                    <h2 className="text-xl font-bold">Atribuir Chamado #{call.id}</h2>
                    <button onClick={onClose} className="text-2xl text-neutral-500">&times;</button>
                </div>
                <div className="mt-4">
                    <label htmlFor="technician" className="block text-sm font-medium mb-1">Selecione o Técnico</label>
                    <select id="technician" value={selectedTechnicianId} onChange={(e) => setSelectedTechnicianId(e.target.value)} className="w-full p-2 border rounded-md bg-neutral-50 dark:bg-neutral-700">
                        <option value="" disabled>-- Selecione --</option>
                        {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
                    </select>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 rounded-md">Cancelar</button>
                    <button onClick={() => onConfirm(selectedTechnicianId)} disabled={!selectedTechnicianId} className="px-4 py-2 bg-primary-600 text-white rounded-md disabled:bg-primary-800">Atribuir</button>
                </div>
            </div>
        </div>
    );
};

const TransferModal: React.FC<{call: MaintenanceCall; technicians: User[]; onClose: () => void; onConfirm: (techId: string, reason: string) => void;}> = ({ call, technicians, onClose, onConfirm }) => {
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center pb-3 border-b dark:border-neutral-700">
                    <h2 className="text-xl font-bold">Transferir Chamado #{call.id}</h2>
                    <button onClick={onClose} className="text-2xl text-neutral-500">&times;</button>
                </div>
                <div className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="newTechnician" className="block text-sm font-medium mb-1">Transferir para</label>
                        <select id="newTechnician" value={selectedTechnicianId} onChange={(e) => setSelectedTechnicianId(e.target.value)} className="w-full p-2 border rounded-md bg-neutral-50 dark:bg-neutral-700">
                            <option value="" disabled>-- Selecione --</option>
                            {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="reason" className="block text-sm font-medium mb-1">Motivo da Transferência</label>
                        <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full p-2 border rounded-md bg-neutral-50 dark:bg-neutral-700" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 rounded-md">Cancelar</button>
                    <button onClick={() => onConfirm(selectedTechnicianId, reason)} disabled={!selectedTechnicianId || !reason.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-md disabled:bg-primary-800">Confirmar Transferência</button>
                </div>
            </div>
        </div>
    );
};

const NewCallModal: React.FC<{onClose: () => void; onSave: (data: any) => void; equipmentList: Equipment[];}> = ({ onClose, onSave, equipmentList }) => {
    const [callData, setCallData] = useState({
        equipmentId: '',
        priority: MaintenancePriority.BAIXO,
        description: '',
        problemType: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...callData, equipmentId: parseInt(callData.equipmentId) });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCallData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                 <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-700">
                    <h2 className="text-xl font-bold">Abrir Novo Chamado</h2>
                    <button onClick={onClose} className="text-2xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">&times;</button>
                </div>
                 <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div>
                        <label htmlFor="equipmentId" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Equipamento</label>
                        <select id="equipmentId" name="equipmentId" value={callData.equipmentId} onChange={handleChange} required className="w-full p-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary-500 focus:border-primary-500">
                           <option value="" disabled>Selecione um equipamento</option>
                           {equipmentList.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Prioridade</label>
                        <select id="priority" name="priority" value={callData.priority} onChange={handleChange} className="w-full p-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary-500 focus:border-primary-500">
                            {Object.values(MaintenancePriority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="problemType" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tipo de Problema</label>
                        <input id="problemType" name="problemType" type="text" value={callData.problemType} onChange={handleChange} required placeholder="Ex: Falha Mecânica, Superaquecimento" className="w-full p-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Descrição Detalhada do Problema</label>
                        <textarea id="description" name="description" value={callData.description} onChange={handleChange} rows={4} required className="w-full p-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-500">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Abrir Chamado</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaintenanceCallsPage;