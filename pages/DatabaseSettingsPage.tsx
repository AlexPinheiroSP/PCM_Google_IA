import React, { useState } from 'react';

const DatabaseSettingsPage: React.FC = () => {
  const [server, setServer] = useState('localhost');
  const [database, setDatabase] = useState('PCM_Industrial_DB');
  const [user, setUser] = useState('pcm_user');
  const [password, setPassword] = useState('');
  const [port, setPort] = useState(1433);
  const [status, setStatus] = useState<'disconnected' | 'testing' | 'connected' | 'error'>('disconnected');
  
  const handleTestConnection = (e: React.MouseEvent) => {
    e.preventDefault();
    setStatus('testing');
    setTimeout(() => {
        if(password === 'super-secret-password'){
            setStatus('connected');
        } else {
            setStatus('error');
        }
    }, 1500);
  }

  const getStatusComponent = () => {
      switch(status){
          case 'testing':
              return <span className="text-yellow-400 flex items-center"><i className="fas fa-spinner fa-spin mr-2"></i>Testando...</span>
          case 'connected':
              return <span className="text-green-400 flex items-center"><i className="fas fa-check-circle mr-2"></i>Conectado com sucesso</span>
          case 'error':
              return <span className="text-red-400 flex items-center"><i className="fas fa-times-circle mr-2"></i>Falha na conexão</span>
          default:
              return <span className="text-neutral-400 flex items-center"><i className="fas fa-power-off mr-2"></i>Desconectado</span>
      }
  }


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuração do Banco de Dados (SQL Server)</h1>
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 max-w-2xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-700">
            <h3 className="text-lg font-semibold">Status da Conexão</h3>
            <div>{getStatusComponent()}</div>
        </div>
        <form className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-neutral-300">Servidor</label>
                <input type="text" value={server} onChange={e => setServer(e.target.value)} className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-300">Nome do Banco</label>
                <input type="text" value={database} onChange={e => setDatabase(e.target.value)} className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-300">Usuário</label>
                <input type="text" value={user} onChange={e => setUser(e.target.value)} className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-neutral-300">Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-300">Porta</label>
                <input type="number" value={port} onChange={e => setPort(Number(e.target.value))} className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md"/>
            </div>
            <div className="flex items-center justify-end space-x-4 pt-4">
                <button onClick={handleTestConnection} className="bg-transparent border border-primary-500 text-primary-500 px-4 py-2 rounded-lg font-semibold hover:bg-primary-500 hover:text-white transition-colors">
                    Testar Conexão
                </button>
                 <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                    Salvar
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default DatabaseSettingsPage;
