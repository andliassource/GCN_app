import React, { useState } from 'react';
import { Bell, Shield, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function Header({ activeTab, user, db }) {
  const [showNotifications, setShowNotifications] = useState(false);

  // Calcula estatísticas rápidas
  const processos = db.processosCriticos.list();
  const avaliacoes = db.avaliacaoNRGCN.list();
  const incidentes = db.incidentes.list();

  const mediaMaturidade = avaliacoes.length > 0
    ? (avaliacoes.reduce((acc, curr) => acc + Number(curr.nivel_resiliencia), 0) / avaliacoes.length).toFixed(2)
    : "0.00";

  const incidentesAtivos = incidentes.length;

  const notifications = [
    {
      id: 1,
      type: 'warning',
      text: 'O Plano PCO do processo "Hospedagem e Infraestrutura" está aguardando revisão semestral.',
      time: 'Há 2 horas'
    },
    {
      id: 2,
      type: 'info',
      text: 'Novo incidente registrado associado ao processo "Processamento de Pagamentos".',
      time: 'Há 5 horas'
    },
    {
      id: 3,
      type: 'success',
      text: 'O teste prático "Simulado de Failover de Checkout" foi aprovado pela GERIC.',
      time: 'Ontem'
    }
  ];

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Gestão de Resiliência NRGCN';
      case 'organizacao': return 'Estrutura Organizacional e Análise de Riscos (Geric)';
      case 'contratos': return 'Ingestão e Análise de Contratos';

      case 'incidentes': return 'Registro e Histórico de Incidentes';
      case 'ain': return 'Análise de Impacto nos Negócios (AIN)';
      case 'planos': return 'Planos de Continuidade (PCO) & Recuperação (PRD)';
      case 'testes': return 'Execução de Testes e Exercícios';
      case 'revisoes': return 'Histórico de Revisões e Versionamento';
      case 'governanca': return 'Aprovações, Governança & Auditoria';
      case 'avaliacao': return 'Avaliação de Maturidade NRGCN';
      default: return 'Sistema de GCN';

    }
  };

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 relative transition-colors duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{getTitle()}</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Status operacional: <span className="text-emerald-500 dark:text-emerald-400 font-semibold">Resiliência Estável</span>
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* KPI: Nível NRGCN Global */}
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 px-3.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
          <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider leading-none">Maturidade NRGCN</p>
            <p className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200">{mediaMaturidade} <span className="text-xs font-normal text-indigo-500">/ 5.0</span></p>
          </div>
        </div>

        {/* KPI: Incidentes Ativos */}
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 px-3.5 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30">
          <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
          <div>
            <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase tracking-wider leading-none">Histórico Incidentes</p>
            <p className="text-sm font-extrabold text-rose-900 dark:text-rose-200">{incidentesAtivos} <span className="text-xs font-normal text-rose-500">registros</span></p>
          </div>
        </div>

        {/* Notificações Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </button>

          {/* Menu Dropdown de Notificações */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800 dark:text-white">Notificações</span>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">3 Pendentes</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex gap-3">
                    <div className="mt-0.5">
                      {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {n.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                      {n.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">{n.text}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
