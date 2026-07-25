import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, User, Calendar, RefreshCw, FileText, Plus, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function GovernancaAprovacao({ db }) {
  const { usuario, isAdmin, isGestor } = useAuth();
  
  // Função para recarregar a lista localmente
  const recarregarPlanos = () => {
    const list = db.planosContinuidade.list();
    return isAdmin()
      ? list
      : list.filter(p => p.processo?.id_gerencia === usuario?.id_gerencia);
  };

  const [planosPco, setPlanosPco] = useState(recarregarPlanos());
  const [governanca, setGovernanca] = useState(db.governancaGCN.list());
  const [notification, setNotification] = useState(null);

  // Estados dos Formulários
  const [showGovForm, setShowGovForm] = useState(false);

  // Form Fields - Governança
  const [selectedProcId, setSelectedProcId] = useState('');
  const [govFormData, setGovFormData] = useState({
    responsavel: '',
    comunicacao: '',
    treinamento: ''
  });

  const handleAprovarPlano = (id_processo, status) => {
    const plano = planosPco.find(p => p.id_processo === id_processo);
    if (!plano) return;

    const updated = db.planosContinuidade.save({
      ...plano,
      status_aprovacao: status
    });

    setPlanosPco(recarregarPlanos());
    setNotification({
      type: 'success',
      text: `Status do plano do processo ${id_processo} atualizado para "${status}".`
    });
  };

  const handleGovSubmit = (e) => {
    e.preventDefault();
    if (!selectedProcId || !govFormData.responsavel) return;

    db.governancaGCN.save({
      id_processo: selectedProcId,
      ...govFormData
    });

    setGovernanca(db.governancaGCN.list());
    setShowGovForm(false);
    setSelectedProcId('');
    setGovFormData({ responsavel: '', comunicacao: '', treinamento: '' });
    setNotification({ type: 'success', text: 'Responsável e política de comunicação vinculados!' });
  };

  const getStatusBadge = (status) => {
    if (status === 'Aprovado') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-250 dark:border-emerald-800/60';
    if (status === 'Aprovado pela Área') return 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-250 dark:border-teal-800/60';
    if (status === 'Pendente') return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-250 dark:border-amber-800/60';
    if (status === 'Em Revisão') return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-350 border-indigo-250 dark:border-indigo-800/60';
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-350 border-rose-250 dark:border-rose-900/60';
  };

  // Filtrar processos disponíveis para atribuição de governança (somente da gerência se gestor)
  const processosGerais = db.processosCriticos.list();
  const processosParaGov = isAdmin()
    ? processosGerais
    : processosGerais.filter(p => p.id_gerencia === usuario?.id_gerencia);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 text-xs font-semibold">
          {notification.text}
        </div>
      )}

      {/* WORKFLOW E APROVAÇÕES PCO */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
          <div>
            <h3 className="font-bold text-slate-850 dark:text-white">Central de Aprovação de Planos GCN</h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-xl leading-relaxed">
              Valide as auto-aprovações de 1ª alçada das áreas e emita as homologações regulatórias finais em conformidade com a ISO 22301.
            </p>
          </div>
          {isAdmin() && (
            <button 
              onClick={() => { setShowGovForm(true); setNotification(null); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              Atribuir Responsável GCN
            </button>
          )}
        </div>

        {/* Form Atribuição */}
        {showGovForm && (
          <form onSubmit={handleGovSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs animate-slide-up">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs">Atribuir Governança ao Processo</h4>
              <button type="button" onClick={() => setShowGovForm(false)} className="text-slate-450 hover:text-slate-650 font-bold">Cancelar</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Processo Crítico *</label>
                <select 
                  value={selectedProcId} 
                  onChange={(e) => setSelectedProcId(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500 font-bold"
                  required
                >
                  <option value="">Selecione o processo...</option>
                  {processosParaGov.map(p => (
                    <option key={p.id_processo} value={p.id_processo}>{p.id_processo} - {p.nome}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Líder Responsável *</label>
                <input 
                  type="text" 
                  value={govFormData.responsavel} 
                  onChange={(e) => setGovFormData({...govFormData, responsavel: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500" 
                  placeholder="Ex: Patrícia Lima (Getic)"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Canal de Comunicação Crítica *</label>
                <input 
                  type="text" 
                  value={govFormData.comunicacao} 
                  onChange={(e) => setGovFormData({...govFormData, comunicacao: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-855 dark:text-slate-200 focus:outline-indigo-500" 
                  placeholder="Ex: PagerDuty / Canal Slack #SRE"
                  required
                />
              </div>
              <div className="space-y-1 md:col-span-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Política de Treinamento da Equipe</label>
                <textarea 
                  rows="2"
                  value={govFormData.treinamento} 
                  onChange={(e) => setGovFormData({...govFormData, treinamento: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowGovForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs cursor-pointer">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs">Vincular Governança</button>
            </div>
          </form>
        )}

        {/* Workflow List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs lg:col-span-2">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
              <h3 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Aprovação por Alçadas (1ª e 2ª Linhas)</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {planosPco.map(p => (
                <div key={p.id_pco} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white">{p.processo?.nome}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Responsável: {p.processo?.gerencia?.sigla} ({p.processo?.gerencia?.tipo})</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase mt-1 ${getStatusBadge(p.status_aprovacao)}`}>
                      {p.status_aprovacao}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* LÓGICA DE ALÇADAS POR PAPEL */}
                    
                    {/* 1. Visão do Gestor da Área */}
                    {usuario?.role === 'gestor_area' && (
                      <>
                        {p.status_aprovacao === 'Pendente' && (
                          <>
                            <button
                              onClick={() => handleAprovarPlano(p.id_processo, 'Aprovado pela Área')}
                              className="bg-teal-55 hover:bg-teal-100 text-teal-650 dark:bg-teal-950/40 dark:text-teal-400 px-2.5 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer border border-teal-200/40"
                            >
                              Aprovar (1ª Alçada)
                            </button>
                            <button
                              onClick={() => handleAprovarPlano(p.id_processo, 'Rejeitado')}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-455 px-2.5 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer border border-rose-200/40"
                            >
                              Rejeitar
                            </button>
                          </>
                        )}
                        {p.status_aprovacao === 'Aprovado pela Área' && (
                          <span className="text-[10px] text-slate-400 italic font-semibold">
                            Aguardando 2ª Alçada (Geric)
                          </span>
                        )}
                        {p.status_aprovacao === 'Aprovado' && (
                          <span className="text-[10px] text-emerald-500 font-bold">
                            ✓ Homologado
                          </span>
                        )}
                      </>
                    )}

                    {/* 2. Visão do Administrador GERIC */}
                    {isAdmin() && (
                      <>
                        {p.status_aprovacao === 'Pendente' && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded italic">
                              Pendente na Área
                            </span>
                            <button
                              onClick={() => handleAprovarPlano(p.id_processo, 'Aprovado pela Área')}
                              className="bg-slate-105 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer"
                              title="Aprovar pela área administrativamente"
                            >
                              Forçar 1ª Alçada
                            </button>
                          </div>
                        )}
                        {p.status_aprovacao === 'Aprovado pela Área' && (
                          <>
                            <button
                              onClick={() => handleAprovarPlano(p.id_processo, 'Aprovado')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              Homologar (2ª Alçada)
                            </button>
                            <button
                              onClick={() => handleAprovarPlano(p.id_processo, 'Rejeitado')}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-455 px-2.5 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer border border-rose-200/40"
                            >
                              Rejeitar
                            </button>
                          </>
                        )}
                        {p.status_aprovacao === 'Aprovado' && (
                          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                            ✓ Homologação Finalizada
                          </span>
                        )}
                      </>
                    )}

                    {/* 3. Visão do Visualizador */}
                    {usuario?.role === 'visualizador' && (
                      <span className="text-[10px] text-slate-450 italic">
                        Apenas Leitura
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {planosPco.length === 0 && (
                <div className="p-6 text-center text-slate-400 italic">
                  Nenhum plano disponível para seu perfil de acesso.
                </div>
              )}
            </div>
          </div>

          {/* Matriz de contatos */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
              <h3 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Matriz de Governança GCN</h3>
            </div>
            <div className="p-4 space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {governanca.map(g => (
                <div key={g.id_governanca} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-850 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-indigo-500 font-bold uppercase">{g.id_governanca}</span>
                    <span className="bg-indigo-55 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                      {g.id_processo}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {g.responsavel}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1"><strong>Treinamento:</strong> {g.treinamento}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
