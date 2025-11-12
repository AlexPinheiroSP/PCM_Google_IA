import React, { useState, useContext, useMemo } from 'react';
import { AuthContext, DataContext } from '../App';
// FIX: Import MOCK_TEAMS to be used in the technician report generation.
import { MOCK_EQUIPMENT, MOCK_PLANTS, MOCK_USERS, MOCK_TEAMS } from '../constants';
import { Role, Equipment, MaintenanceCall, User } from '../types';
import { exportToCsv } from '../utils/export';

type ReportType = 'calls' | 'equipment' | 'technicians';

const ReportsPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const { calls } = useContext(DataContext);

    const [reportType, setReportType] = useState<ReportType>('calls');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [plantId, setPlantId] = useState('');
    const [generatedReport, setGeneratedReport] = useState<any[] | null>(null);

    const { userPlants, userEquipment, userTechnicians } = useMemo(() => {
        if (!user) return { userPlants: [], userEquipment: [], userTechnicians: [] };
        
        let companyPlantIds = MOCK_PLANTS.map(p => p.id);
        if(user.role !== Role.SYSTEM_ADMINISTRATOR && user.companyId) {
            companyPlantIds = MOCK_PLANTS.filter(p => p.companyId === user.companyId).map(p => p.id);
        }

        const userPlants = MOCK_PLANTS.filter(p => companyPlantIds.includes(p.id));
        const userEquipment = MOCK_EQUIPMENT.filter(e => companyPlantIds.includes(e.plantId));
        const userTechnicians = MOCK_USERS.filter(u => u.role === Role.TECNICO_PCM && (!user.companyId || u.companyId === user.companyId));
        
        return { userPlants, userEquipment, userTechnicians };
    }, [user]);

    const handleGenerateReport = () => {
        let filteredCalls = calls.filter(call => {
            const callDate = new Date(call.openedAt);
            if (startDate && new Date(startDate) > callDate) return false;
            if (endDate && new Date(endDate) < callDate) return false;
            if (plantId && call.plantId !== parseInt(plantId)) return false;
            return true;
        });

        let reportData = [];

        switch (reportType) {
            case 'calls':
                reportData = filteredCalls.map(call => ({
                    ID: call.id,
                    Equipamento: userEquipment.find(e => e.id === call.equipmentId)?.name || 'N/A',
                    Planta: userPlants.find(p => p.id === call.plantId)?.name || 'N/A',
                    Descrição: call.description,
                    Prioridade: call.priority,
                    Status: call.status,
                    Responsável: call.responsible?.name || 'Não Atribuído',
                    Abertura: new Date(call.openedAt).toLocaleString('pt-BR'),
                    Fechamento: call.closedAt ? new Date(call.closedAt).toLocaleString('pt-BR') : 'Em Aberto',
                }));
                break;
            case 'equipment':
                const equipmentStats = filteredCalls.reduce((acc, call) => {
                    if (!acc[call.equipmentId]) {
                        acc[call.equipmentId] = { count: 0, downtime: 0 };
                    }
                    acc[call.equipmentId].count++;
                    if(call.resolvedAt) {
                        acc[call.equipmentId].downtime += Math.abs(new Date(call.resolvedAt).getTime() - new Date(call.openedAt).getTime()) / 3600000;
                    }
                    return acc;
                }, {} as Record<number, { count: number; downtime: number }>);
                
                reportData = userEquipment.map(eq => ({
                    Equipamento: eq.name,
                    Tipo: eq.type,
                    Planta: userPlants.find(p => p.id === eq.plantId)?.name,
                    'Nº de Chamados': equipmentStats[eq.id]?.count || 0,
                    'Downtime (h)': (equipmentStats[eq.id]?.downtime || 0).toFixed(2),
                    'Disponibilidade (%)': eq.performance.availability,
                    'MTBF (h)': eq.performance.mtbf,
                    'MTTR (h)': eq.performance.mttr,
                }));
                break;
            case 'technicians':
                 const techStats = filteredCalls.reduce((acc, call) => {
                    if (!call.responsible) return acc;
                    const techId = call.responsible.id;
                    if (!acc[techId]) {
                        acc[techId] = { count: 0, resolveTime: 0 };
                    }
                    acc[techId].count++;
                    if (call.assignedAt && call.resolvedAt) {
                        acc[techId].resolveTime += Math.abs(new Date(call.resolvedAt).getTime() - new Date(call.assignedAt).getTime()) / 3600000;
                    }
                    return acc;
                }, {} as Record<number, { count: number; resolveTime: number }>);
                
                reportData = userTechnicians.map(tech => ({
                    Técnico: tech.name,
                    Equipe: MOCK_TEAMS.find(t => t.id === tech.teamId)?.name || 'N/A',
                    'Chamados Concluídos': techStats[tech.id]?.count || 0,
                    'Tempo Médio de Reparo (h)': techStats[tech.id] && techStats[tech.id].count > 0 ? (techStats[tech.id].resolveTime / techStats[tech.id].count).toFixed(2) : '0.00',
                }));
                break;
        }
        setGeneratedReport(reportData);
    };

    const handleExport = () => {
        if (!generatedReport) return;
        const timestamp = new Date().toISOString().slice(0, 10);
        exportToCsv(generatedReport, `relatorio_${reportType}_${timestamp}`);
    };
    
    const renderReportTable = () => {
        if (!generatedReport) {
            return <div className="text-center py-10 text-neutral-500">Selecione os filtros e gere um relatório para visualizar os dados.</div>;
        }
        if (generatedReport.length === 0) {
            return <div className="text-center py-10 text-neutral-500">Nenhum dado encontrado para os filtros selecionados.</div>;
        }
        const headers = Object.keys(generatedReport[0]);
        return (
             <div className="overflow-x-auto max-h-[calc(100vh-400px)]">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400 sticky top-0">
                        <tr>
                            {headers.map(h => <th key={h} className="px-4 py-2">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {generatedReport.map((row, index) => (
                            <tr key={index} className="border-b dark:border-neutral-700">
                                {headers.map(header => <td key={header} className="px-4 py-2">{row[header]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Relatórios Inteligentes</h1>

            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-md border dark:border-neutral-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label className="text-sm font-medium">Tipo de Relatório</label>
                        <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="w-full p-2 mt-1 bg-neutral-50 dark:bg-neutral-700 border dark:border-neutral-600 rounded-md">
                            <option value="calls">Chamados Consolidados</option>
                            <option value="equipment">Desempenho de Equipamentos</option>
                            <option value="technicians">Desempenho de Técnicos</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Data Início</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 mt-1 bg-neutral-50 dark:bg-neutral-700 border dark:border-neutral-600 rounded-md"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Data Fim</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 mt-1 bg-neutral-50 dark:bg-neutral-700 border dark:border-neutral-600 rounded-md"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Planta</label>
                         <select value={plantId} onChange={e => setPlantId(e.target.value)} className="w-full p-2 mt-1 bg-neutral-50 dark:bg-neutral-700 border dark:border-neutral-600 rounded-md">
                            <option value="">Todas as Plantas</option>
                            {userPlants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleGenerateReport} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors h-10">Gerar</button>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-md border dark:border-neutral-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Resultado do Relatório</h3>
                    <button onClick={handleExport} disabled={!generatedReport || generatedReport.length === 0} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-green-800 disabled:cursor-not-allowed flex items-center gap-2">
                        <i className="fas fa-file-csv"></i>
                        Exportar
                    </button>
                </div>
                {renderReportTable()}
            </div>
        </div>
    );
};

export default ReportsPage;