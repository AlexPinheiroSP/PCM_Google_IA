
import React, { useState, useCallback, useContext, useMemo } from 'react';
import { getPreventiveMaintenanceSuggestion } from '../services/geminiService';
import { getOfflinePreventiveMaintenanceSuggestion } from '../services/localAnalysisService';
import { Equipment, Role } from '../types';
import { MOCK_EQUIPMENT, MOCK_PLANTS } from '../constants';
import { AuthContext } from '../App';

type SuggestionSource = 'ia' | 'local' | null;

const AiSuggestionsPage: React.FC = () => {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [source, setSource] = useState<SuggestionSource>(null);
  const { user, isOnline } = useContext(AuthContext);

  const filteredEquipment = useMemo(() => {
    if (user?.role === Role.SYSTEM_ADMINISTRATOR) {
        return MOCK_EQUIPMENT;
    }
    if (!user?.companyId) return [];

    const companyPlantIds = MOCK_PLANTS
      .filter(p => p.companyId === user.companyId)
      .map(p => p.id);

    let equipment = MOCK_EQUIPMENT.filter(e => companyPlantIds.includes(e.plantId));

    if (user.role === Role.ADMIN_PLANTA && user.plantId) {
        equipment = equipment.filter(e => e.plantId === user.plantId);
    }
    
    return equipment;
  }, [user]);

  const handleGenerateSuggestion = useCallback(async () => {
    if (!selectedEquipment) return;
    setIsLoading(true);
    setSuggestion('');
    setSource(null);
    try {
      let result;
      if (isOnline) {
        result = await getPreventiveMaintenanceSuggestion(selectedEquipment);
        setSource('ia');
      } else {
        result = await getOfflinePreventiveMaintenanceSuggestion(selectedEquipment);
        setSource('local');
      }
      setSuggestion(result);
    } catch (error) {
      console.error(error);
      setSuggestion('Ocorreu um erro ao buscar a sugestão.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedEquipment, isOnline]);

  // A simple markdown to HTML converter for demonstration
  const renderMarkdown = (text: string) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\n/g, '<br />'); // Newlines
    return { __html: html };
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sugestões de Manutenção Preventiva com IA</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Selection */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold mb-4">1. Selecione um Equipamento</h2>
          <select
            onChange={(e) => setSelectedEquipment(filteredEquipment.find(eq => eq.id === parseInt(e.target.value)) || null)}
            className="w-full p-2 border rounded-md bg-neutral-50 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">-- Escolha um equipamento --</option>
            {filteredEquipment.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
          {selectedEquipment && (
            <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
              <p><strong>Tipo:</strong> {selectedEquipment.type}</p>
              <p><strong>Linha:</strong> {selectedEquipment.line}</p>
              <p className="mt-2 font-semibold">Histórico de Falhas:</p>
              <ul className="list-disc pl-5 mt-1">
                {selectedEquipment.failureHistory.map((f, i) => (
                  <li key={i}>{f.description}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={handleGenerateSuggestion}
            disabled={!selectedEquipment || isLoading}
            className="mt-6 w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-primary-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-brain mr-2"></i>}
            {isLoading ? 'Analisando...' : 'Gerar Sugestão'}
          </button>
        </div>

        {/* Suggestion Display */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">2. Análise e Plano de Ação</h2>
              {source && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${source === 'ia' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                    {source === 'ia' ? 'Análise por IA (Online)' : 'Análise Local (Offline)'}
                </span>
              )}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-4xl text-primary-500"></i>
                <p className="mt-4">{isOnline ? 'Nossa IA está analisando os dados...' : 'Analisando dados locais...'}</p>
              </div>
            )}
            {!isLoading && !suggestion && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <i className="fas fa-lightbulb text-4xl text-neutral-400"></i>
                <p className="mt-4 text-neutral-500">A sugestão aparecerá aqui após a análise.</p>
              </div>
            )}
            {suggestion && <div dangerouslySetInnerHTML={renderMarkdown(suggestion)} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSuggestionsPage;