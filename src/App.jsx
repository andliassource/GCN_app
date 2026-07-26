import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardGeric from './components/DashboardGeric';
import ContratosDocs from './components/ContratosDocs';
import BaseIncidentes from './components/BaseIncidentes';
import AnaliseImpacto from './components/AnaliseImpacto';
import PlanosRecuperacao from './components/PlanosRecuperacao';
import TestesExercicios from './components/TestesExercicios';
import RevisoesAtualizacoes from './components/RevisoesAtualizacoes';
import GovernancaAprovacao from './components/GovernancaAprovacao';
import GestaoCrises from './components/GestaoCrises';
import AvaliacaoMaturidade from './components/AvaliacaoMaturidade';
import OrganizacaoRiscos from './components/OrganizacaoRiscos';
import ConfiguracaoSistema from './components/ConfiguracaoSistema';
import LoginPage from './components/LoginPage';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { dbService } from './services/db';

function MainLayout() {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Bug 1 Fix: ler preferência salva no localStorage; padrão = dark
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('gcn_dark_mode');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  });

  // Monitora Dark Mode no HTML root e persiste no localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try { localStorage.setItem('gcn_dark_mode', String(darkMode)); } catch (e) {}
  }, [darkMode]);

  // Se não estiver logado, exibe a página de login
  if (!usuario) {
    return <LoginPage configSistema={dbService.configSistema.get()} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardGeric db={dbService} />;
      case 'organizacao':
        return <OrganizacaoRiscos db={dbService} />;
      case 'contratos':
        return <ContratosDocs db={dbService} />;
      case 'incidentes':
        return <BaseIncidentes db={dbService} />;
      case 'ain':
        return <AnaliseImpacto db={dbService} />;
      case 'planos':
        return <PlanosRecuperacao db={dbService} />;
      case 'testes':
        return <TestesExercicios db={dbService} />;
      case 'revisoes':
        return <RevisoesAtualizacoes db={dbService} />;
      case 'governanca':
        return <GovernancaAprovacao db={dbService} />;
      case 'crises':
        return <GestaoCrises db={dbService} />;
      case 'avaliacao':
        return <AvaliacaoMaturidade db={dbService} />;
      case 'config':
        return <ConfiguracaoSistema db={dbService} />;
      default:
        return <DashboardGeric db={dbService} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={usuario}
        onLogout={() => { /* handled by AuthContext via useAuth */ }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        <Header 
          activeTab={activeTab} 
          db={dbService} 
          onNavigate={setActiveTab}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider db={dbService}>
      <MainLayout />
    </AuthProvider>
  );
}

