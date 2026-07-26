import React from 'react';
import { Shield, AlertTriangle, User, LogOut, Menu } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ activeTab, db, onNavigate, onToggleMobileMenu }) {
  const { usuario, logout, nomeGerenciaContexto } = useAuth();

  const avaliacoes = db.avaliacaoNRGCN?.list ? db.avaliacaoNRGCN.list() : [];
  const incidentes = db.incidentes?.list ? db.incidentes.list() : [];

  const mediaMaturidade = avaliacoes.length > 0
    ? (avaliacoes.reduce((acc, curr) => acc + Number(curr.nivel_resiliencia || 0), 0) / avaliacoes.length).toFixed(2)
    : "0.00";

  const incidentesAtivos = incidentes.length;

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Painel Executivo — Gestão GCN (Geric)';
      case 'organizacao': return 'Estrutura Organizacional e Análise de Riscos';
      case 'contratos': return 'Ingestão e Análise de Contratos';
      case 'incidentes': return 'Base de Incidentes & Lições Aprendidas';
      case 'ain': return 'Análise de Impacto nos Negócios (AIN/BIA)';
      case 'planos': return 'Planos de Continuidade (PCO) & Recuperação (PRD)';
      case 'testes': return 'Execução de Testes e Exercícios por Cenário';
      case 'revisoes': return 'Histórico de Revisões e Versionamento';
      case 'governanca': return 'Aprovações, Governança & Comitê de Crises';
      case 'avaliacao': return 'Avaliação de Maturidade NRGCN';
      case 'config': return 'Configurações do Sistema GCN';
      default: return 'Sistema de GCN';
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin_geric') return { text: 'Admin Geric', cls: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
    if (role === 'gestor_area') return { text: 'Gestor da Área', cls: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    return { text: 'Visualizador', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
  };

  const badge = getRoleBadge(usuario?.role);

  return (
    <header className="min-h-16 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 relative transition-colors duration-300">
      <div className="flex items-center gap-3">
        {/* Botão de Menu para Mobile */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[200px] sm:max-w-none">
            {getTitle()}
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
            Status: <span className="text-emerald-500 font-semibold">Resiliência Operacional Ativa</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* KPI: Maturidade NRGCN */}
        <div className="hidden lg:flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
          <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <div>
            <p className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider leading-none">Maturidade NRGCN</p>
            <p className="text-xs font-black text-indigo-900 dark:text-indigo-200">{mediaMaturidade} <span className="text-[9px] font-normal text-indigo-400">/ 5.0</span></p>
          </div>
        </div>

        {/* KPI: Incidentes */}
        <div className="hidden lg:flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <div>
            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-wider leading-none">Incidentes</p>
            <p className="text-xs font-black text-rose-900 dark:text-rose-200">{incidentesAtivos} <span className="text-[9px] font-normal text-rose-400">registros</span></p>
          </div>
        </div>

        {/* Central de Notificações */}
        <NotificationCenter db={db} onNavigate={onNavigate} />

        {/* Usuário Logado + Perfil */}
        {usuario && (
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
              {usuario.nome.charAt(0)}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{usuario.nome}</div>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${badge.cls}`}>{badge.text}</span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.2 rounded font-bold">{nomeGerenciaContexto()}</span>
              </div>
            </div>
            <button onClick={logout} title="Sair do sistema" className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}


