import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ContratosDocs from './components/ContratosDocs';
import BaseIncidentes from './components/BaseIncidentes';
import AnaliseImpacto from './components/AnaliseImpacto';
import PlanosRecuperacao from './components/PlanosRecuperacao';
import TestesExercicios from './components/TestesExercicios';
import RevisoesAtualizacoes from './components/RevisoesAtualizacoes';
import GovernancaAprovacao from './components/GovernancaAprovacao';
import AvaliacaoMaturidade from './components/AvaliacaoMaturidade';
import OrganizacaoRiscos from './components/OrganizacaoRiscos';


import { dbService } from './services/db';
import { authService } from './services/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState(null);

  // Inicializa o banco e a sessão
  useEffect(() => {
    // Inicializa os dados padrão no LocalStorage na primeira execução
    dbService.contratos.list(); 
    
    // Obtém sessão ativa (mock)
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Monitora o Dark Mode e aplica no elemento raiz (HTML)
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  const handleLogin = async (email, password) => {
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
    } catch (e) {
      alert(e.message);
    }
  };

  // Se não estiver logado (neste mock, o authService já inicia logado por padrão para facilidade do usuário, mas se ele sair, mostra esta tela)
  if (!user) {
    return <LoginView onLogin={handleLogin} darkMode={darkMode} setDarkMode={setDarkMode} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 text-slate-900 dark:text-slate-100">
      
      {/* Barra de Navegação Lateral (Sidebar) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        user={user} 
        onLogout={handleLogout}
      />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Cabeçalho do Painel */}
        <Header activeTab={activeTab} user={user} db={dbService} />
        
        {/* Conteúdo da Aba Ativa */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <Dashboard db={dbService} setActiveTab={setActiveTab} />}
          {activeTab === 'organizacao' && <OrganizacaoRiscos db={dbService} />}
          {activeTab === 'contratos' && <ContratosDocs db={dbService} />}

          {activeTab === 'incidentes' && <BaseIncidentes db={dbService} />}
          {activeTab === 'ain' && <AnaliseImpacto db={dbService} />}
          {activeTab === 'planos' && <PlanosRecuperacao db={dbService} />}
          {activeTab === 'testes' && <TestesExercicios db={dbService} />}
          {activeTab === 'revisoes' && <RevisoesAtualizacoes db={dbService} />}
          {activeTab === 'governanca' && <GovernancaAprovacao db={dbService} />}
          {activeTab === 'avaliacao' && <AvaliacaoMaturidade db={dbService} />}
        </main>

      </div>

    </div>
  );
}

// Tela de Login Mockada para o Fluxo
function LoginView({ onLogin, darkMode, setDarkMode }) {
  const [email, setEmail] = useState('geric.compliance@empresa.com');
  const [password, setPassword] = useState('admin123');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-slate-55 dark:bg-slate-950 transition-colors duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-8 space-y-6">
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              G
            </div>
            <div>
              <h2 className="text-md font-bold text-slate-800 dark:text-white">GCN Master</h2>
              <p className="text-[10px] text-slate-400">Portal de Gestão & Resiliência</p>
            </div>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="space-y-1 text-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-white">Entrar na Aplicação</h3>
          <p className="text-xs text-slate-400">Qualquer credencial de login é aceita neste ambiente de demonstração.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail Corporativo</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Senha de Acesso</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-indigo-500" 
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-xs transition-colors shadow-sm mt-4 uppercase tracking-wider"
          >
            Acessar Painel GCN
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 text-center leading-normal">
          Para testar outros papéis corporativos (SRE, Direção, etc.), faça login alterando o e-mail no formulário.
        </div>

      </div>
    </div>
  );
}
