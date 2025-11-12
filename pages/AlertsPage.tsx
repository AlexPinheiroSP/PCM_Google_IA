

import React, { useMemo, useContext, useState } from 'react';
import { MOCK_ALERT_RULES, MOCK_EQUIPMENT, MOCK_PLANTS } from '../constants';
import { AlertRule, Role, AlertMetric, AlertCondition, Equipment } from '../types';
import { AuthContext } from '../App';


const AlertsPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [rules, setRules] = useState(MOCK_ALERT_RULES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredData = useMemo(() => {
    if (user?.role === Role.SYSTEM_ADMINISTRATOR) {
        return { rules, equipment: MOCK_EQUIPMENT };
    }

    if (!user?.companyId) return { rules: [], equipment: [] };

    const companyPlantIds = MOCK_PLANTS
      .filter(p => p.companyId === user.companyId)
      .map(p => p.id);

    const equipment = MOCK_EQUIPMENT.filter(e => companyPlantIds.includes(e.plantId));
    const equipmentIds = equipment.map(e => e.id);

    const companyRules = rules.filter(rule => equipmentIds.includes(rule.equipmentId));
    
    return { rules: companyRules, equipment };
  }, [user, rules]);

  const handleAddRule = (newRuleData: Omit<AlertRule, 'id'>) => {
    const newRule: AlertRule = {
        ...newRuleData,
        id: Date.now(),
    };
    setRules(prev => [...prev, newRule]);
    setIsModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Regras de Alerta Automático</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center">
          <i className="fas fa-plus mr-2"></i>
          Nova Regra
        </button>
      </div>
       <p className="text-neutral-600 dark:text-neutral-400">
        Configure regras para criar chamados de manutenção automaticamente quando os sensores dos equipamentos atingirem valores críticos.
      </p>

      <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-neutral-500 dark:text-neutral-400">
            <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-400">
              <tr>
                <th scope="col" className="px-6 py-3">Equipamento</th>
                <th scope="col" className="px-6 py-3">Métrica</th>
                <th scope="col" className="px-6 py-3">Condição</th>
                <th scope="col" className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.rules.map((rule: AlertRule) => {
                const equipment = filteredData.equipment.find(e => e.id === rule.equipmentId);
                return (
                  <tr key={rule.id} className="bg-white border-b dark:bg-neutral-800 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600">
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">{equipment?.name}</td>
                    <td className="px-6 py-4">{rule.metric}</td>
                    <td className="px-6 py-4">{`${rule.condition} ${rule.threshold}`}</td>
                    <td className="px-6 py-4 space-x-4">
                      <button className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Editar</button>
                      <button className="font-medium text-red-600 dark:text-red-500 hover:underline">Desativar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
       {isModalOpen && (
        <NewAlertRuleModal 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleAddRule} 
            equipmentList={filteredData.equipment}
        />
      )}
    </div>
  );
};

// --- Modal Component ---

interface NewAlertRuleModalProps {
    onClose: () => void;
    onSave: (rule: Omit<AlertRule, 'id'>) => void;
    equipmentList: Equipment[];
}

const NewAlertRuleModal: React.FC<NewAlertRuleModalProps> = ({ onClose, onSave, equipmentList }) => {
    const [newRule, setNewRule] = useState({
        equipmentId: '',
        metric: AlertMetric.TEMPERATURE,
        condition: AlertCondition.GREATER_THAN,
        threshold: 0,
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...newRule,
            equipmentId: parseInt(newRule.equipmentId, 10),
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const processedValue = name === 'threshold' ? parseFloat(value) : value;
        setNewRule(prev => ({ ...prev, [name]: processedValue }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                 <div className="flex justify-between items-center pb-3 border-b border-neutral-700">
                    <h2 className="text-xl font-bold">Criar Nova Regra de Alerta</h2>
                    <button onClick={onClose} className="text-2xl text-neutral-500 hover:text-neutral-200">&times;</button>
                </div>
                 <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <SelectField label="Equipamento" name="equipmentId" value={newRule.equipmentId} onChange={handleChange} required>
                       <option value="" disabled>Selecione um equipamento</option>
                       {equipmentList.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                    </SelectField>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField label="Métrica" name="metric" value={newRule.metric} onChange={handleChange}>
                            {Object.values(AlertMetric).map(m => <option key={m} value={m}>{m}</option>)}
                        </SelectField>
                         <SelectField label="Condição" name="condition" value={newRule.condition} onChange={handleChange}>
                            {Object.values(AlertCondition).map(c => <option key={c} value={c}>{c}</option>)}
                        </SelectField>
                    </div>

                    <InputField label="Valor Limite (Threshold)" name="threshold" type="number" value={newRule.threshold.toString()} onChange={handleChange} required />
                    
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-neutral-300 mb-1">Descrição (Opcional)</label>
                        <textarea id="description" name="description" value={newRule.description} onChange={handleChange} rows={3} placeholder="Ex: Abrir chamado crítico se temp. > 240°C" className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md" />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-600 text-neutral-200 rounded-md hover:bg-neutral-500">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Salvar Regra</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Helper components for form fields
const InputField: React.FC<{ label: string, name: string, value: string, onChange: any, type?: string, required?: boolean }> = ({ label, name, value, onChange, type = 'text', required = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-neutral-300 mb-1">{label}</label>
        <input id={name} name={name} type={type} value={value} onChange={onChange} required={required} className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md" step="any" />
    </div>
);

const SelectField: React.FC<{ label: string, name: string, value: any, onChange: any, children: React.ReactNode, required?: boolean }> = ({ label, name, value, onChange, children, required = false }) => (
     <div>
        <label htmlFor={name} className="block text-sm font-medium text-neutral-300 mb-1">{label}</label>
        <select id={name} name={name} value={value || ''} onChange={onChange} required={required} className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md">
            {children}
        </select>
    </div>
);

export default AlertsPage;