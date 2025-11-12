

import React, { useContext, useMemo, useState } from 'react';
import { AuthContext, DataContext } from '../App';
import { Role, Equipment, EquipmentType, Plant } from '../types';
import { MOCK_EQUIPMENT, MOCK_PLANTS, MOCK_USERS } from '../constants';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { StatusBadge } from '../components/ui/Badge';

// Reusable component from AnalysisPage to keep changes minimal
const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold mb-4">{title}</h3>
        {children}
    </div>
);

// Custom Tooltip for the chart to show full details
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-neutral-800 text-white p-3 rounded-md border border-neutral-600 shadow-lg">
                <p className="font-bold">{`Data: ${label}`}</p>
                <p>{`Downtime: ${payload[0].value} horas`}</p>
                <p className="max-w-xs whitespace-normal text-neutral-300">{`Descrição: ${payload[0].payload.description}`}</p>
            </div>
        );
    }
    return null;
};


const EquipmentPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { calls } = useContext(DataContext);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(MOCK_EQUIPMENT);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewEquipmentModalOpen, setIsNewEquipmentModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');


  const handleOpenDetailsModal = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedEquipment(null);
    setStartDateFilter('');
    setEndDateFilter('');
  };
  
  const handleSaveEquipment = (newEquipmentData: Omit<Equipment, 'id' | 'failureHistory'>) => {
    const newEquipment: Equipment = {
        ...newEquipmentData,
        id: Math.max(...equipmentList.map(e => e.id)) + 1,
        failureHistory: [],
    };
    setEquipmentList(prev => [...prev, newEquipment]);
    setIsNewEquipmentModalOpen(false);
  };

  const { filteredEquipment, userPlants } = useMemo(() => {
    let userPlants: Plant[] = [];
    if (user?.role === Role.SYSTEM_ADMINISTRATOR) {
        return { filteredEquipment: equipmentList, userPlants: MOCK_PLANTS };
    }
      
    if (!user?.companyId) return { filteredEquipment: [], userPlants: [] };

    const companyPlants = MOCK_PLANTS.filter(p => p.companyId === user.companyId);
    userPlants = companyPlants;
    const companyPlantIds = companyPlants.map(p => p.id);
    
    let equipment = equipmentList.filter(e => companyPlantIds.includes(e.plantId));

    if (user.role === Role.ADMIN_PLANTA && user.plantId) {
        equipment = equipment.filter(e => e.plantId === user.plantId);
        userPlants = MOCK_PLANTS.filter(p => p.id === user.plantId);
    }
    
    return { filteredEquipment: equipment, userPlants };
  }, [user, equipmentList]);
  
  const chartData = useMemo(() => {
    if (!selectedEquipment) return [];
    return selectedEquipment.failureHistory.map(f => ({
        ...f,
        formattedDate: new Date(f.date).toLocaleDateString('pt-BR'),
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedEquipment]);

  const filteredCallHistory = useMemo(() => {
    if (!selectedEquipment) return [];
    let history = calls.filter(call => call.equipmentId === selectedEquipment.id);

    if (startDateFilter) {
        history = history.filter(call => new Date(call.openedAt) >= new Date(startDateFilter));
    }
    if (endDateFilter) {
        history = history.filter(call => new Date(call.openedAt) <= new Date(endDateFilter));
    }
    
    return history.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [selectedEquipment, calls, startDateFilter, endDateFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciamento de Equipamentos</h1>
        <button onClick={() => setIsNewEquipmentModalOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center">
          <i className="fas fa-plus mr-2"></i>
          Novo Equipamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((eq) => {
          const plant = MOCK_PLANTS.find(p => p.id === eq.plantId);
          return (
            <div key={eq.id} className="bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{eq.name}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{eq.type} - {plant?.name}</p>
                  </div>
                  <span className="text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">{eq.line}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Disponib.</p>
                    <p className="font-bold text-green-500">{eq.performance.availability.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">MTBF</p>
                    <p className="font-bold">{eq.performance.mtbf}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">MTTR</p>
                    <p className="font-bold text-orange-500">{eq.performance.mttr.toFixed(1)}h</p>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-700/50 px-6 py-3">
                <button onClick={() => handleOpenDetailsModal(eq)} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                  Ver Detalhes
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isNewEquipmentModalOpen && (
        <NewEquipmentModal 
            onClose={() => setIsNewEquipmentModalOpen(false)}
            onSave={handleSaveEquipment}
            plantList={userPlants}
        />
      )}

      {isDetailsModalOpen && selectedEquipment && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300">
                <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg shadow-xl p-6 w-full max-w-4xl m-4 transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                         <h2 className="text-xl font-bold">Detalhes de: {selectedEquipment.name}</h2>
                         <button onClick={handleCloseDetailsModal} className="text-2xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">&times;</button>
                    </div>
                    <div className="mt-4 space-y-6 overflow-y-auto">
                        <ChartContainer title="Histórico de Falhas e Downtime">
                           {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.2)" />
                                        <XAxis type="number" stroke="currentColor" label={{ value: 'Horas de Downtime', position: 'insideBottom', offset: -5 }}/>
                                        <YAxis type="category" dataKey="formattedDate" width={80} stroke="currentColor" />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128,128,128,0.1)' }}/>
                                        <Bar dataKey="downtimeHours" name="Downtime (h)" fill="#ef4444" barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                           ) : (
                                <div className="flex flex-col items-center justify-center h-48">
                                    <i className="fas fa-info-circle text-3xl text-neutral-400"></i>
                                    <p className="text-center text-neutral-500 mt-4">Nenhum histórico de falha registrado para este equipamento.</p>
                                </div>
                           )}
                        </ChartContainer>

                        <ChartContainer title="Histórico de Chamados de Manutenção">
                             <div className="flex space-x-4 mb-4">
                                <div>
                                    <label className="text-sm">De:</label>
                                    <input type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} className="w-full p-2 mt-1 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md"/>
                                </div>
                                 <div>
                                    <label className="text-sm">Até:</label>
                                    <input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} className="w-full p-2 mt-1 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md"/>
                                </div>
                             </div>
                             <div className="overflow-x-auto max-h-72">
                                <table className="w-full text-sm">
                                     <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400 sticky top-0">
                                         <tr>
                                            <th className="px-4 py-2">Data</th>
                                            <th className="px-4 py-2">Descrição</th>
                                            <th className="px-4 py-2">Status</th>
                                            <th className="px-4 py-2">Responsável</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {filteredCallHistory.length > 0 ? filteredCallHistory.map(call => (
                                             <tr key={call.id} className="border-b dark:border-neutral-700">
                                                 <td className="px-4 py-2">{new Date(call.openedAt).toLocaleDateString('pt-BR')}</td>
                                                 <td className="px-4 py-2 truncate max-w-sm">{call.description}</td>
                                                 <td className="px-4 py-2"><StatusBadge status={call.status} /></td>
                                                 <td className="px-4 py-2">{call.responsible?.name || 'N/A'}</td>
                                             </tr>
                                         )) : (
                                            <tr>
                                                <td colSpan={4} className="text-center py-4 text-neutral-500">Nenhum chamado encontrado para os filtros selecionados.</td>
                                            </tr>
                                         )}
                                     </tbody>
                                </table>
                             </div>
                        </ChartContainer>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

// --- New Equipment Modal ---
interface NewEquipmentModalProps {
    onClose: () => void;
    onSave: (data: Omit<Equipment, 'id' | 'failureHistory'>) => void;
    plantList: Plant[];
}

const NewEquipmentModal: React.FC<NewEquipmentModalProps> = ({ onClose, onSave, plantList }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: EquipmentType.EXTRUSORA,
        plantId: '',
        line: '',
        availability: '99',
        mttr: '1',
        mtbf: '500'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: formData.name,
            type: formData.type,
            plantId: parseInt(formData.plantId, 10),
            line: formData.line,
            performance: {
                availability: parseFloat(formData.availability),
                mttr: parseFloat(formData.mttr),
                mtbf: parseFloat(formData.mtbf)
            }
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                <form onSubmit={handleSubmit}>
                     <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-700">
                        <h2 className="text-xl font-bold">Adicionar Novo Equipamento</h2>
                        <button type="button" onClick={onClose} className="text-2xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">&times;</button>
                    </div>
                    <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <InputField label="Nome do Equipamento" name="name" value={formData.name} onChange={handleChange} required />
                        <SelectField label="Tipo" name="type" value={formData.type} onChange={handleChange}>
                            {Object.values(EquipmentType).map(t => <option key={t} value={t}>{t}</option>)}
                        </SelectField>
                        <SelectField label="Planta" name="plantId" value={formData.plantId} onChange={handleChange} required>
                            <option value="" disabled>Selecione uma planta</option>
                            {plantList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </SelectField>
                        <InputField label="Linha de Produção" name="line" value={formData.line} onChange={handleChange} />
                        <h3 className="text-md font-semibold pt-2 border-t dark:border-neutral-600">Indicadores de Performance</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <InputField label="Disponibilidade (%)" name="availability" type="number" value={formData.availability} onChange={handleChange} />
                            <InputField label="MTTR (h)" name="mttr" type="number" value={formData.mttr} onChange={handleChange} />
                            <InputField label="MTBF (h)" name="mtbf" type="number" value={formData.mtbf} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-500">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Salvar Equipamento</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const InputField: React.FC<{ label: string, name: string, value: string, onChange: any, type?: string, required?: boolean }> = ({ label, name, value, onChange, type = 'text', required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{label}</label>
        <input id={name} name={name} type={type} value={value} onChange={onChange} required={required} className="w-full p-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary-500 focus:border-primary-500" step="any" />
    </div>
);

const SelectField: React.FC<{ label: string, name: string, value: any, onChange: any, children: React.ReactNode, required?: boolean }> = ({ label, name, value, onChange, children, required = false }) => (
     <div>
        <label htmlFor={name} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{label}</label>
        <select id={name} name={name} value={value || ''} onChange={onChange} required={required} className="w-full p-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-primary-500 focus:border-primary-500">
            {children}
        </select>
    </div>
);

export default EquipmentPage;