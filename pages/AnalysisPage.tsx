import React, { useState, useContext, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { AuthContext, DataContext } from '../App';
import { Role, MaintenanceStatus, MaintenancePriority, Equipment, MaintenanceCall, User } from '../types';
import { MOCK_EQUIPMENT, MOCK_PLANTS, MOCK_USERS } from '../constants';
import { StatusBadge } from '../components/ui/Badge';

type DashboardView = 'overview' | 'downtime' | 'process' | 'team' | 'financial' | 'reliability' | 'strategy' | 'maintainer';

const hoursBetween = (d1: string, d2: string) => {
    if (!d1 || !d2) return 0;
    return Math.abs(new Date(d1).getTime() - new Date(d2).getTime()) / (1000 * 60 * 60);
};

// --- Reusable Components ---
const KpiCard: React.FC<{ title: string; value: string; icon: string; iconColor: string; subtitle?: string }> = ({ title, value, icon, iconColor, subtitle }) => (
    <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 flex items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconColor} bg-opacity-20 mr-4 shrink-0`}>
            <i className={`fas ${icon} text-xl ${iconColor}`}></i>
        </div>
        <div>
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
        </div>
    </div>
);

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold mb-4">{title}</h3>
        {children}
    </div>
);

// --- Dashboard Views ---
const OverviewDashboard: React.FC<{ data: any }> = ({ data }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Chamados Abertos" value={data.openCallsCount.toString()} icon="fa-wrench" iconColor="text-blue-500" />
            <KpiCard title="Chamados Críticos" value={data.criticalCallsCount.toString()} icon="fa-triangle-exclamation" iconColor="text-red-500" />
            <KpiCard title="SLA Atingido (%)" value={`${data.slaMetPercent.toFixed(1)}%`} icon="fa-check-circle" iconColor="text-green-500" />
            <KpiCard title="Tempo Médio de Resposta" value={data.avgAssignment} icon="fa-clock" iconColor="text-yellow-500" />
        </div>
        <ChartContainer title="Maiores Problemas (Causa Raiz)">
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.problemTypes} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.2)" />
                    <XAxis type="number" stroke="currentColor"/>
                    <YAxis type="category" dataKey="name" width={100} stroke="currentColor" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30,30,30,0.8)', border: 'none' }}/>
                    <Bar dataKey="value" name="Chamados" fill="#3b82f6" barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    </div>
);

const DowntimeDashboard: React.FC<{ data: any }> = ({ data }) => (
    <ChartContainer title="Downtime por Equipamento (Horas)">
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.downtimeByEquipmentChart} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.2)" />
                <XAxis type="number" stroke="currentColor"/>
                <YAxis type="category" dataKey="name" width={120} stroke="currentColor" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(30,30,30,0.8)', border: 'none' }}/>
                <Bar dataKey="hours" name="Downtime" fill="#ef4444" barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    </ChartContainer>
);

const FinancialDashboard: React.FC<{ data: any }> = ({ data }) => (
     <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KpiCard title="Downtime Total" value={`${data.totalDowntime.toFixed(1)}h`} icon="fa-clock" iconColor="text-red-500" />
            <KpiCard title="Custo de Parada (Est.)" value={`R$ ${data.downtimeCost.toLocaleString('pt-BR')}`} icon="fa-dollar-sign" iconColor="text-yellow-500" subtitle="*Custo/hora estimado: R$1.500" />
        </div>
        <ChartContainer title="Custo de Downtime por Equipamento">
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.costByEquipment} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.2)" />
                    <XAxis type="number" stroke="currentColor" tickFormatter={(value) => `R$${(Number(value)/1000)}k`}/>
                    <YAxis type="category" dataKey="name" width={120} stroke="currentColor" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30,30,30,0.8)', border: 'none' }} formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}/>
                    <Bar dataKey="cost" name="Custo de Parada" fill="#f59e0b" barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    </div>
);

const ReliabilityDashboard: React.FC<{ data: any }> = ({ data }) => (
    <ChartContainer title="Análise de Confiabilidade (MTBF vs MTTR)">
         <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.reliabilityData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)"/>
                <XAxis dataKey="name" stroke="currentColor"/>
                <YAxis stroke="currentColor"/>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(30,30,30,0.8)', border: 'none' }} />
                <Legend />
                <Bar dataKey="mtbf" name="MTBF (horas)" fill="#22c55e" />
                <Bar dataKey="mttr" name="MTTR (horas)" fill="#f97316" />
            </BarChart>
        </ResponsiveContainer>
    </ChartContainer>
);

const StrategyDashboard: React.FC<{ data: any }> = ({ data }) => {
    const COLORS = ['#10b981', '#f43f5e']; // Green for Preventive, Red for Corrective
    return (
        <ChartContainer title="Estratégia de Manutenção: Preventiva vs. Corretiva">
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data.strategyData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        // FIX: The 'percent' prop from recharts Pie can be undefined or unknown.
                        // A type check ensures it's a number before calling toFixed().
                        label={({ name, percent }) => `${name}: ${((typeof percent === 'number' ? percent : 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.strategyData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30,30,30,0.8)', border: 'none' }} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    )
};

const ProcessDashboard: React.FC<{ data: any, equipment: any[] }> = ({ data, equipment }) => (
    <div className="space-y-6">
        <ChartContainer title="Gargalos no Processo (Tempo Médio por Etapa)">
            <div className="flex justify-around items-center p-4 flex-wrap gap-4">
              <div className="text-center">
                <p className="text-xs text-neutral-500">Abertura → Atribuição</p>
                <p className="text-3xl font-bold text-yellow-500">{data.avgAssignTime.toFixed(1)}h</p>
              </div>
              <i className="fas fa-arrow-right text-neutral-400 text-2xl hidden md:block"></i>
               <div className="text-center">
                <p className="text-xs text-neutral-500">Atribuição → Reparo</p>
                <p className="text-3xl font-bold text-blue-500">{data.avgResolveTime.toFixed(1)}h</p>
              </div>
              <i className="fas fa-arrow-right text-neutral-400 text-2xl hidden md:block"></i>
              <div className="text-center">
                <p className="text-xs text-neutral-500">Reparo → Encerramento</p>
                <p className="text-3xl font-bold text-green-500">{data.avgApproveTime.toFixed(1)}h</p>
              </div>
            </div>
        </ChartContainer>
        {data.staleCalls.length > 0 && (
             <ChartContainer title="Chamados que Exigem Atenção">
                 <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Equipamento</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Tempo no Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.staleCalls.map((c: MaintenanceCall & { timeInStatus: number }) => {
                                const eq = equipment.find(e => e.id === c.equipmentId);
                                return (
                                    <tr key={c.id} className="border-b dark:border-neutral-700">
                                        <td className="px-4 py-2 font-bold">#{c.id}</td>
                                        <td className="px-4 py-2">{eq?.name}</td>
                                        <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                                        <td className="px-4 py-2 font-semibold text-red-500">{`${c.timeInStatus.toFixed(0)}h`}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
             </ChartContainer>
        )}
    </div>
);

const TeamDashboard: React.FC<{ data: any }> = ({ data }) => (
    <ChartContainer title="Performance por Mantenedor">
        <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400 sticky top-0">
                    <tr>
                        <th className="px-4 py-2">Mantenedor</th>
                        <th className="px-4 py-2 text-center">Chamados Atendidos</th>
                        <th className="px-4 py-2 text-center">Tempo Médio Reparo</th>
                    </tr>
                </thead>
                <tbody>
                    {data.maintainerPerf.map((m: any) => (
                        <tr key={m.name} className="border-b dark:border-neutral-700">
                            <td className="px-4 py-2 font-medium">{m.name}</td>
                            <td className="px-4 py-2 text-center font-bold text-lg">{m.count}</td>
                            <td className="px-4 py-2 text-center font-semibold">{m.avgTime}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </ChartContainer>
);

const MaintainerDashboard: React.FC<{ calls: MaintenanceCall[], equipment: Equipment[], user: User | null }> = ({ calls, equipment, user }) => {
    const [selectedMaintainerId, setSelectedMaintainerId] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const companyMaintainers = useMemo(() => {
        return MOCK_USERS.filter(u => u.role === Role.TECNICO_PCM && (!user?.companyId || u.companyId === user.companyId));
    }, [user]);

    const filteredCalls = useMemo(() => {
        return calls.filter(call => {
            if (!call.responsible || call.responsible.id !== parseInt(selectedMaintainerId)) {
                return false;
            }
            const callDate = new Date(call.openedAt);
            if (startDate && new Date(startDate) > callDate) {
                return false;
            }
            if (endDate && new Date(endDate) < callDate) {
                return false;
            }
            return true;
        });
    }, [selectedMaintainerId, startDate, endDate, calls]);
    
    const kpiData = useMemo(() => {
        const totalCalls = filteredCalls.length;
        const totalHours = filteredCalls.reduce((acc, call) => acc + hoursBetween(call.assignedAt || '', call.resolvedAt || ''), 0);
        const uniqueEquipment = new Set(filteredCalls.map(c => c.equipmentId)).size;
        
        return { totalCalls, totalHours, uniqueEquipment };
    }, [filteredCalls]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
                <h3 className="font-semibold mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium">Mantenedor</label>
                        <select value={selectedMaintainerId} onChange={e => setSelectedMaintainerId(e.target.value)} className="w-full p-2 mt-1 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md">
                            <option value="">Selecione</option>
                            {companyMaintainers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Data Início</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 mt-1 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Data Fim</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 mt-1 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md"/>
                    </div>
                </div>
            </div>
            
            {selectedMaintainerId && (
                <>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KpiCard title="Total de Ordens" value={kpiData.totalCalls.toString()} icon="fa-list-check" iconColor="text-blue-500" />
                    <KpiCard title="Total de Horas" value={`${kpiData.totalHours.toFixed(1)}h`} icon="fa-stopwatch" iconColor="text-green-500" />
                    <KpiCard title="Equipamentos Atendidos" value={kpiData.uniqueEquipment.toString()} icon="fa-robot" iconColor="text-purple-500" />
                 </div>
                 <ChartContainer title="Ordens Executadas no Período">
                     <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm text-left">
                           <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400 sticky top-0">
                               <tr>
                                   <th className="px-4 py-2">ID</th>
                                   <th className="px-4 py-2">Equipamento</th>
                                   <th className="px-4 py-2">Descrição</th>
                                   <th className="px-4 py-2">Data Abertura</th>
                                   <th className="px-4 py-2">Horas Gastas</th>
                               </tr>
                           </thead>
                           <tbody>
                               {filteredCalls.map(call => {
                                   const eq = equipment.find(e => e.id === call.equipmentId);
                                   return (
                                       <tr key={call.id} className="border-b dark:border-neutral-700">
                                           <td className="px-4 py-2 font-bold">#{call.id}</td>
                                           <td className="px-4 py-2">{eq?.name}</td>
                                           <td className="px-4 py-2 truncate max-w-sm">{call.description}</td>
                                           <td className="px-4 py-2">{new Date(call.openedAt).toLocaleDateString('pt-BR')}</td>
                                           <td className="px-4 py-2 font-semibold">{hoursBetween(call.assignedAt || '', call.resolvedAt || '').toFixed(1)}h</td>
                                       </tr>
                                   )
                               })}
                           </tbody>
                        </table>
                     </div>
                 </ChartContainer>
                </>
            )}

        </div>
    );
};


// --- Main Page Component ---
const AnalysisPage: React.FC = () => {
    const [currentView, setCurrentView] = useState<DashboardView>('overview');
    const { user } = useContext(AuthContext);
    const { calls } = useContext(DataContext);

    const filteredData = useMemo(() => {
        if (!user) return { equipment: [], calls: [] };

        if (user.role === Role.SYSTEM_ADMINISTRATOR) {
            return { equipment: MOCK_EQUIPMENT, calls };
        }
        
        if (!user.companyId) return { equipment: [], calls: [] };

        const companyPlantIds = MOCK_PLANTS.filter(p => p.companyId === user.companyId).map(p => p.id);
        const equipment = MOCK_EQUIPMENT.filter(e => companyPlantIds.includes(e.plantId));
        const companyCalls = calls.filter(c => companyPlantIds.includes(c.plantId));
        return { equipment, calls: companyCalls };
    }, [user, calls]);
    
    const analytics = useMemo(() => {
        // --- Overview ---
        const openCallsCount = filteredData.calls.filter(c => c.status === MaintenanceStatus.ABERTO || c.status === MaintenanceStatus.EM_ANDAMENTO).length;
        const criticalCallsCount = filteredData.calls.filter(c => c.priority === MaintenancePriority.CRITICO).length;
        const resolvedCalls = filteredData.calls.filter(c => c.resolvedAt);
        const slaMetCount = resolvedCalls.filter(c => hoursBetween(c.openedAt, c.resolvedAt!) <= 24).length;
        const slaMetPercent = resolvedCalls.length > 0 ? (slaMetCount / resolvedCalls.length) * 100 : 100;

        // --- Downtime / Financial ---
        const DOWNTIME_COST_PER_HOUR = 1500;
        const callsWithDowntime = filteredData.calls.filter(c => c.resolvedAt);
        const totalDowntime = callsWithDowntime.reduce((acc, call) => acc + hoursBetween(call.openedAt, call.resolvedAt!), 0);
        const downtimeByEquipment = callsWithDowntime.reduce<Record<string, number>>((acc, call) => {
            const eq = filteredData.equipment.find(e => e.id === call.equipmentId);
            const eqName = eq?.name || 'Desconhecido';
            acc[eqName] = (acc[eqName] || 0) + hoursBetween(call.openedAt, call.resolvedAt!);
            return acc;
        }, {});
        const downtimeByEquipmentChart = Object.entries(downtimeByEquipment).map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(1)) })).sort((a, b) => b.hours - a.hours);
        const downtimeCost = totalDowntime * DOWNTIME_COST_PER_HOUR;
        const costByEquipment = downtimeByEquipmentChart.map(item => ({ name: item.name, cost: item.hours * DOWNTIME_COST_PER_HOUR }));

        // --- Reliability ---
        const reliabilityData = filteredData.equipment.map(eq => ({
            name: eq.name,
            mtbf: eq.performance.mtbf,
            mttr: eq.performance.mttr,
        })).sort((a,b) => a.mtbf - b.mtbf);

        // --- Strategy ---
        const preventiveCount = filteredData.calls.filter(c => c.problemType === 'Manutenção Preventiva').length;
        const correctiveCount = filteredData.calls.length - preventiveCount;
        const strategyData = [
            { name: 'Preventiva', value: preventiveCount },
            { name: 'Corretiva', value: correctiveCount },
        ];
        
        // --- Process ---
        let totalAssign = 0, totalRepair = 0, totalApproval = 0;
        const completedCalls = filteredData.calls.filter(c => c.openedAt && c.assignedAt && c.resolvedAt && c.closedAt);
        if (completedCalls.length > 0) {
            completedCalls.forEach(c => {
                totalAssign += hoursBetween(c.openedAt, c.assignedAt!);
                totalRepair += hoursBetween(c.assignedAt!, c.resolvedAt!);
                totalApproval += hoursBetween(c.resolvedAt!, c.closedAt!);
            });
        }
        const toHours = (total: number, count: number) => count > 0 ? `${(total / count).toFixed(1)}h` : 'N/A';
        const avgAssignment = toHours(totalAssign, completedCalls.length);
        const avgAssignTime = completedCalls.length > 0 ? totalAssign / completedCalls.length : 0;
        const avgResolveTime = completedCalls.length > 0 ? totalRepair / completedCalls.length : 0;
        const avgApproveTime = completedCalls.length > 0 ? totalApproval / completedCalls.length : 0;
        const staleCalls = filteredData.calls.filter(call => {
            if (call.status === MaintenanceStatus.ABERTO && hoursBetween(call.openedAt, new Date().toISOString()) > 24) return true;
            if (call.status === MaintenanceStatus.EM_ANDAMENTO && call.assignedAt && hoursBetween(call.assignedAt, new Date().toISOString()) > 72) return true;
            if (call.status === MaintenanceStatus.AGUARDANDO_APROVACAO && call.resolvedAt && hoursBetween(call.resolvedAt, new Date().toISOString()) > 48) return true;
            return false;
        }).map(c => {
             let timeInStatus = 0;
             if (c.status === MaintenanceStatus.ABERTO) timeInStatus = hoursBetween(c.openedAt, new Date().toISOString());
             else if (c.status === MaintenanceStatus.EM_ANDAMENTO && c.assignedAt) timeInStatus = hoursBetween(c.assignedAt, new Date().toISOString());
             else if (c.status === MaintenanceStatus.AGUARDANDO_APROVACAO && c.resolvedAt) timeInStatus = hoursBetween(c.resolvedAt, new Date().toISOString());
             return {...c, timeInStatus};
        });

        // --- Team ---
        // FIX: By explicitly typing the accumulator for the reduce function, we ensure
        // TypeScript correctly infers the type of `maintainerStats`. This resolves all subsequent
        // cascading type errors related to spreading an unknown type, accessing its properties,
        // and performing arithmetic operations.
        const maintainerStats = filteredData.calls.reduce<Record<number, {name: string, count: number, totalTime: number}>>((acc, call) => {
            if (!call.responsible || !call.resolvedAt || !call.assignedAt) return acc;
            const techId = call.responsible.id;
            if (!acc[techId]) {
                acc[techId] = { name: call.responsible.name, count: 0, totalTime: 0 };
            }
            acc[techId].count++;
            acc[techId].totalTime += hoursBetween(call.assignedAt, call.resolvedAt);
            return acc;
        }, {});
        const maintainerPerf = Object.values(maintainerStats).map(m => ({...m, avgTime: m.count > 0 ? `${(m.totalTime/m.count).toFixed(1)}h` : 'N/A' })).sort((a,b) => b.count - a.count);

        // --- Shared ---
        const problemCounts = filteredData.calls.reduce<Record<string, number>>((acc, call) => {
            acc[call.problemType] = (acc[call.problemType] || 0) + 1;
            return acc;
        }, {});
        const problemTypes = Object.entries(problemCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
        
        return {
            overview: { openCallsCount, criticalCallsCount, slaMetPercent, avgAssignment, problemTypes },
            downtime: { downtimeByEquipmentChart },
            financial: { totalDowntime, downtimeCost, costByEquipment },
            reliability: { reliabilityData },
            strategy: { strategyData },
            process: { avgAssignTime, avgResolveTime, avgApproveTime, staleCalls },
            team: { maintainerPerf }
        };
    }, [filteredData]);

    const renderView = () => {
        switch(currentView) {
            case 'overview': return <OverviewDashboard data={analytics.overview} />;
            case 'downtime': return <DowntimeDashboard data={analytics.downtime} />;
            case 'financial': return <FinancialDashboard data={analytics.financial} />;
            case 'reliability': return <ReliabilityDashboard data={analytics.reliability} />;
            case 'strategy': return <StrategyDashboard data={analytics.strategy} />;
            case 'process': return <ProcessDashboard data={analytics.process} equipment={filteredData.equipment} />;
            case 'team': return <TeamDashboard data={analytics.team} />;
            case 'maintainer': return <MaintainerDashboard calls={filteredData.calls} equipment={filteredData.equipment} user={user} />;
            default: return null;
        }
    }

    const NavButton: React.FC<{ view: DashboardView; icon: string; label: string }> = ({ view, icon, label }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`flex items-center w-full p-3 text-left rounded-lg transition-colors ${currentView === view ? 'bg-primary-600 text-white' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
        >
            <i className={`fas ${icon} w-6 text-center`}></i>
            <span className="ml-3 font-medium">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            <aside className="lg:w-64 flex-shrink-0">
                <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 space-y-2">
                    <h2 className="text-lg font-bold px-3 pb-2">Dashboards</h2>
                    <NavButton view="overview" icon="fa-tachometer-alt" label="Visão Geral" />
                    <NavButton view="financial" icon="fa-dollar-sign" label="Análise Financeira" />
                    <NavButton view="reliability" icon="fa-shield-alt" label="Confiabilidade" />
                    <NavButton view="strategy" icon="fa-chess-board" label="Estratégia" />
                     <div className="my-2 border-t border-neutral-200 dark:border-neutral-700"></div>
                    <NavButton view="downtime" icon="fa-clock" label="Downtime" />
                    <NavButton view="process" icon="fa-project-diagram" label="Processo" />
                    <NavButton view="team" icon="fa-users-cog" label="Equipe" />
                    <NavButton view="maintainer" icon="fa-user-gear" label="Desempenho Individual" />
                </div>
            </aside>
            <main className="flex-1 min-w-0">
                {renderView()}
            </main>
        </div>
    );
};

export default AnalysisPage;