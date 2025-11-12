

import React from 'react';
// FIX: The 'Page' type is exported from '../types', not '../components/layout/AppLayout'.
import { Page } from '../types';

interface SettingsPageProps {
  setCurrentPage: (page: Page) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ setCurrentPage }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Parâmetros do Sistema</h1>
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
        <p className="text-neutral-600 dark:text-neutral-300">
          Esta área é restrita para administradores do sistema. Aqui você pode configurar regras dinâmicas,
          integrações, parâmetros de notificação e outras configurações globais da aplicação.
        </p>
        <div className="mt-6 border-t border-neutral-200 dark:border-neutral-700 pt-6">
            <h3 className="text-lg font-semibold">Configurações de Regras Inteligentes</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Exemplo: "Se equipamento X tiver 3 paradas críticas em 7 dias → enviar alerta e abrir chamado automático"</p>
            <div className="mt-4">
                <button 
                    onClick={() => setCurrentPage('alerts')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                    Gerenciar Regras
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;