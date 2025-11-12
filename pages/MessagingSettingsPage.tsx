import React, { useState } from 'react';

const MessagingSettingsPage: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleTestConnection = (service: 'Email' | 'SMS' | 'WhatsApp') => (e: React.MouseEvent) => {
    e.preventDefault();
    setStatus('testing');
    console.log(`Testing ${service} connection...`);
    setTimeout(() => {
        // Simulate a successful connection test
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    }, 1500);
  };

  const getStatusComponent = () => {
      switch(status){
          case 'testing':
              return <span className="text-yellow-400 flex items-center"><i className="fas fa-spinner fa-spin mr-2"></i>Testando...</span>
          case 'success':
              return <span className="text-green-400 flex items-center"><i className="fas fa-check-circle mr-2"></i>Conexão bem-sucedida!</span>
          case 'error':
              return <span className="text-red-400 flex items-center"><i className="fas fa-times-circle mr-2"></i>Falha na conexão</span>
          default:
              return null;
      }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configuração de Mensageria</h1>
        <p className="text-neutral-500 mt-1">Configure os canais de notificação para alertas e relatórios.</p>
      </div>
      
      {/* Email SMTP Settings */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
        <h3 className="text-lg font-semibold mb-4 border-b border-neutral-700 pb-3 flex items-center">
            <i className="fas fa-envelope mr-3 text-primary-400"></i>Configuração de E-mail (SMTP)
        </h3>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300">Servidor SMTP</label>
              <input type="text" placeholder="smtp.example.com" className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300">Porta</label>
              <input type="number" placeholder="587" className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Usuário</label>
            <input type="text" placeholder="seu_email@example.com" className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Senha</label>
            <input type="password" placeholder="••••••••" className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
          </div>
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button onClick={handleTestConnection('Email')} className="bg-transparent border border-primary-500 text-primary-500 px-4 py-2 rounded-lg font-semibold hover:bg-primary-500 hover:text-white transition-colors">Testar</button>
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">Salvar</button>
          </div>
        </form>
      </div>

      {/* SMS Gateway Settings */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
        <h3 className="text-lg font-semibold mb-4 border-b border-neutral-700 pb-3 flex items-center">
             <i className="fas fa-sms mr-3 text-primary-400"></i>Gateway de SMS
        </h3>
        <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300">Provedor</label>
               <select className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md">
                    <option>Twilio</option>
                    <option>Sinch</option>
                    <option>Outro</option>
                </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300">API Key</label>
              <input type="password" placeholder="••••••••" className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
            </div>
             <div className="flex items-center justify-end space-x-4 pt-4">
                <button onClick={handleTestConnection('SMS')} className="bg-transparent border border-primary-500 text-primary-500 px-4 py-2 rounded-lg font-semibold hover:bg-primary-500 hover:text-white transition-colors">Testar</button>
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">Salvar</button>
            </div>
        </form>
      </div>

      {/* WhatsApp Settings */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
        <h3 className="text-lg font-semibold mb-4 border-b border-neutral-700 pb-3 flex items-center">
             <i className="fab fa-whatsapp mr-3 text-green-400"></i>API do WhatsApp Business
        </h3>
         <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300">ID da Conta</label>
              <input type="text" placeholder="ID da sua conta Business" className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300">Token de Acesso</label>
              <input type="password" placeholder="••••••••" className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
            </div>
             <div className="flex items-center justify-end space-x-4 pt-4">
                <button onClick={handleTestConnection('WhatsApp')} className="bg-transparent border border-primary-500 text-primary-500 px-4 py-2 rounded-lg font-semibold hover:bg-primary-500 hover:text-white transition-colors">Testar</button>
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">Salvar</button>
            </div>
        </form>
      </div>

      {status !== 'idle' && (
        <div className="fixed bottom-8 right-8 bg-neutral-900 border border-neutral-700 p-4 rounded-lg shadow-2xl">
            {getStatusComponent()}
        </div>
      )}
    </div>
  );
};

export default MessagingSettingsPage;
