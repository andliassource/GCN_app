import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  AlertOctagon, 
  TrendingDown, 
  BookOpen, 
  Activity, 
  RefreshCw, 
  ShieldCheck, 
  Moon, 
  Sun, 
  LogOut 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, darkMode, setDarkMode, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Painel NRGCN & Resiliência', icon: LayoutDashboard },
    { id: 'contratos', label: '1. Ingestão de Contratos', icon: FileText },
    { id: 'incidentes', label: '2. Base de Incidentes', icon: AlertOctagon },
    { id: 'ain', label: '3. Análise de Impacto (AIN)', icon: TrendingDown },
    { id: 'planos', label: '4. Planos PCO e PRD', icon: BookOpen },
    { id: 'testes', label: '5. Testes e Exercícios', icon: Activity },
    { id: 'revisoes', label: '6. Revisões & Atualizações', icon: RefreshCw },
    { id: 'governanca', label: '7. Governança & Aprovações', icon: ShieldCheck },
    { id: 'avaliacao', label: '8. Avaliação NRGCN', icon: ShieldCheck },
  ];


  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors duration-300">
      {/* Topo / Logo */}
      <div>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            G
          </div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white leading-tight">GCN Master</h1>
            <span className="text-xs text-slate-400 dark:text-slate-500">ISO 22301 & 27031</span>
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600 dark:border-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Roda-pé da Sidebar / Usuário */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {/* Toggle de Dark Mode */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-3">
            {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            Tema {darkMode ? 'Claro' : 'Escuro'}
          </span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
            {darkMode ? 'Dark' : 'Light'}
          </span>
        </button>

        {/* Info do Usuário */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.nome}</p>
            <button 
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-500 transition-colors"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.cargo}</p>
          <p className="text-[9px] text-indigo-500 font-semibold uppercase tracking-wider mt-1">{user?.departamento}</p>
        </div>
      </div>
    </aside>
  );
}
