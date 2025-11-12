import { Equipment } from '../types';

/**
 * Generates a preventive maintenance suggestion based on local statistical analysis of the equipment's data.
 * This serves as an offline fallback for the Gemini AI service.
 * @param equipment The equipment to analyze.
 * @returns A promise that resolves to a markdown-formatted suggestion string.
 */
export const getOfflinePreventiveMaintenanceSuggestion = async (equipment: Equipment): Promise<string> => {
  const suggestions: string[] = [];
  const actions: string[] = [];

  // 1. Analyze Failure History for recurring problems
  const problemCounts: Record<string, number> = {};
  equipment.failureHistory.forEach(h => {
    const description = h.description.toLowerCase();
    if (description.includes('superaquecimento')) problemCounts['Superaquecimento'] = (problemCounts['Superaquecimento'] || 0) + 1;
    else if (description.includes('sensor')) problemCounts['Falha de Sensor'] = (problemCounts['Falha de Sensor'] || 0) + 1;
    else if (description.includes('filtro')) problemCounts['Necessidade de Troca de Filtro'] = (problemCounts['Necessidade de Troca de Filtro'] || 0) + 1;
    else if (description.includes('painel') || description.includes('controle')) problemCounts['Falha de Painel/Controle'] = (problemCounts['Falha de Painel/Controle'] || 0) + 1;
    else problemCounts['Outras Falhas Mecânicas/Elétricas'] = (problemCounts['Outras Falhas Mecânicas/Elétricas'] || 0) + 1;
  });

  const sortedProblems = Object.entries(problemCounts).sort(([, a], [, b]) => b - a);
  const mostCommonProblem = sortedProblems.length > 0 ? sortedProblems[0][0] : null;

  // 2. Create Diagnosis
  if (mostCommonProblem) {
    suggestions.push(`**Diagnóstico Principal:** A análise estatística do histórico indica que a falha mais recorrente é **${mostCommonProblem}**. Este é um ponto de atenção crítico para a manutenção preventiva.`);
  } else {
    suggestions.push(`**Diagnóstico Principal:** O histórico de falhas é limitado. A análise se concentrará nos indicadores de performance.`);
  }

  // 3. Create Recommended Actions based on problems and metrics
  if (mostCommonProblem) {
    if (mostCommonProblem === 'Superaquecimento') {
      actions.push('- **Semanal:** Verificar e limpar sistemas de ventilação e refrigeração.');
      actions.push('- **Mensal:** Inspecionar e testar as resistências de aquecimento e termopares.');
    }
    if (mostCommonProblem === 'Falha de Sensor') {
      actions.push('- **Mensal:** Realizar a calibração de todos os sensores críticos (tensão, pressão, temperatura).');
    }
     if (mostCommonProblem === 'Necessidade de Troca de Filtro') {
      actions.push('- **Ação Imediata:** Verificar e padronizar o intervalo de troca de filtros (óleo, ar).');
    }
  }

  if (equipment.performance.mtbf < 200) {
    actions.push('- **Quinzenal:** Realizar inspeção sensitiva (ruído, vibração, temperatura) e lubrificação geral.');
  }
  if (equipment.performance.mttr > 3) {
    actions.push('- **Ação Imediata:** Criar/revisar procedimentos operacionais padrão (POPs) para os reparos mais comuns e garantir que peças de reposição críticas estejam em estoque.');
  }
  
  if (actions.length === 0) {
    actions.push('- **Mensal:** Realizar inspeção geral e lubrificação conforme manual do fabricante.')
  }

  suggestions.push(`**Ações Preventivas Recomendadas:**\n${actions.join('\n')}`);
  
  // 4. Create Justification
  suggestions.push('**Justificativa:** Estas ações são baseadas nos padrões estatísticos do histórico do equipamento e em seus indicadores de performance. O objetivo é aumentar o tempo médio entre falhas (MTBF) e reduzir o tempo de reparo (MTTR), melhorando a disponibilidade geral.');

  return Promise.resolve(suggestions.join('\n\n'));
};
