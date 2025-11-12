
import { GoogleGenAI } from "@google/genai";
import { Equipment } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getPreventiveMaintenanceSuggestion = async (equipment: Equipment): Promise<string> => {
  if (!API_KEY) {
    return Promise.resolve("Serviço de IA não configurado. Por favor, configure a chave de API do Gemini.");
  }

  const failureHistoryText = equipment.failureHistory
    .map(h => `- Em ${new Date(h.date).toLocaleDateString('pt-BR')}: ${h.description} (Inatividade: ${h.downtimeHours} horas)`)
    .join('\n');

  const prompt = `
    Aja como um especialista em Planejamento e Controle de Manutenção (PCM) para uma indústria de plásticos.
    
    Analise o seguinte equipamento e seu histórico de falhas para sugerir um plano de manutenção preventiva detalhado e acionável.
    
    **Dados do Equipamento:**
    - **Nome:** ${equipment.name}
    - **Tipo:** ${equipment.type}
    - **Indicadores Atuais:**
        - Disponibilidade: ${equipment.performance.availability}%
        - MTTR (Tempo Médio para Reparo): ${equipment.performance.mttr} horas
        - MTBF (Tempo Médio Entre Falhas): ${equipment.performance.mtbf} horas
    
    **Histórico de Falhas Recentes:**
    ${failureHistoryText}
    
    **Sua Tarefa:**
    Baseado nesses dados, crie uma sugestão de plano de manutenção preventiva. A resposta deve ser concisa, clara e formatada em markdown. Inclua:
    1.  **Diagnóstico Principal:** Uma breve análise do "ponto fraco" do equipamento com base no histórico.
    2.  **Ações Preventivas Recomendadas:** Uma lista de ações específicas (inspeções, lubrificações, trocas de peças) com a frequência sugerida (diária, semanal, mensal, trimestral).
    3.  **Justificativa:** Explique brevemente por que essas ações são importantes para evitar as falhas recorrentes e melhorar os indicadores de MTBF e disponibilidade.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Ocorreu um erro ao gerar a sugestão. Verifique o console para mais detalhes.";
  }
};