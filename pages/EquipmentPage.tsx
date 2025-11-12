
import React, { useContext, useMemo, useState } from 'react';
import { AuthContext } from '../App';
import { Role, Equipment } from '../types';
import { MOCK_EQUIPMENT, MOCK_PLANTS } from '../constants';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const handleOpenModal = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEquipment(null);
  };

  const filteredEquipment = useMemo(() => {
    // SYSTEM_ADMINISTRATOR sees all equipment
    if (user?.role === Role.SYSTEM_ADMINISTRATOR) {
        return MOCK_EQUIPMENT;
    }
      
    if (!user?.companyId) return [];

    // 1. Filter by company
    const companyPlantIds = MOCK_PLANTS
        .filter(p => p.companyId === user.companyId)
        .map(p => p.id);
    
    let equipment = MOCK_EQUIPMENT.filter(e => companyPlantIds.includes(e.plantId));

    // 2. Further filter by plant if user is ADMIN_PLANTA
    if (user.role === Role.ADMIN_PLANTA && user.plantId) {
        equipment = equipment.filter(e => e.plantId === user.plantId);
    }
    
    return equipment;
  }, [user]);
  
  const chartData = useMemo(() => {
    if (!selectedEquipment) return [];
    return selectedEquipment.failureHistory.map(f => ({
        ...f,
        formattedDate: new Date(f.date).toLocaleDateString('pt-BR'),
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedEquipment]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciamento de Equipamentos</h1>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center">
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
                <button onClick={() => handleOpenModal(eq)} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                  Ver Detalhes
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && selectedEquipment && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300">
                <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg shadow-xl p-6 w-full max-w-4xl m-4 transform transition-all duration-300 scale-100 overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-700">
                         <h2 className="text-xl font-bold">Detalhes de: {selectedEquipment.name}</h2>
                         <button onClick={handleCloseModal} className="text-2xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">&times;</button>
                    </div>
                    <div className="mt-4">
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
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default EquipmentPage;
