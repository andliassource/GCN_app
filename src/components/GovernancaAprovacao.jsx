import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, User, Calendar, RefreshCw } from 'lucide-react';

export default function GovernancaAprovacao({ db }) {
  const [planosPco, setPlanosPco] = useState(db.planosContinuidade.list());
  const [governanca, setGovernanca] = useState(db.governancaGCN.list());
  const [notification, setNotification] = useState(null);

  // Estados de formulário para Governança do Processo
  const [selectedProcId, setSelectedProcId] = useState('');
  const [govFormData, setGovFormData] = useState({
    responsavel: '',
    comunicacao: '',
    treinamento: ''
  });
  const [showGovForm, setShowGovForm] = useState(false);

  // Alterar Status de Aprovação do Plano PCO (Workflow de aprovação)
  const handleAprovarPlano = (id_processo, status) => {
    const plano = planosPco.find(p => p.id_processo === id_processo);
    if (!plano) return;

    const updated = db.planosContinuidade.save({
      ...plano,
      status_aprovacao: status
    });

    setPlanosPco(db.planosContinuidade.list());
    setNotification({
      type: 'success',
      text: `Status do plano do processo ${id_processo} atualizado para "${status}".`
    });
  };

  const handleGovSubmit = (e) => {
    e.preventDefault();
    if (!selectedProcId || !govFormData.responsavel || !govFormData.comunicacao || !govFormData.treinamento) {
      setNotification({ type: 'error', text: 'Preencha todos os campos da governança.' });
      return;
    }

    db.governancaGCN.save({
      id_processo: selectedProcId,
      ...govFormData
    });

    setGovernanca(db.governancaGCN.list());
    setShowGovForm(false);
    setSelectedProcId('');
    setGovFormData({ responsavel: '', comunicacao: '', treinamento: '' });
    setNotification({ type: 'success', text: 'Responsável e plano de governança vinculados com sucesso!' });
  };

  const getStatusBadge = (status) => {
    if (status === 'Aprovado') return 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
    if (status === 'Pendente') return 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    if (status === 'Em Revisão') return 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
    return 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Resumo da Seção */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">Workflow de Aprovações e Governança GERIC</h3>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-2xl leading-relaxed">
            Módulo de controle do comitê Geric (Gerência de Riscos). Valide as estratégias de continuidade PCO enviadas pelos gerentes de área e aprove para emissão de versionamento em produção. Vincule responsabilidades e políticas de treinamento.
          </p>
        </div>
        <button 
          onClick={() => { setShowGovForm(true); setNotification(null); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
        >
          Delegar Responsabilidade
        </button>
      </div>

      {/* Feedbacks */}
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-500" /> {notification.text}
        </div>
      )}

      {/* Form de Atribuição de Governança */}
      {showGovForm && (
        <form onSubmit={handleGovSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white">Atribuir Governança ao Processo</h3>
            <button type="button" onClick={() => setShowGovForm(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Processo Crítico *</label>
              <select 
                value={selectedProcId} 
                onChange={(e) => setSelectedProcId(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
                required
              >
                <option value="">Selecione o Processo</option>
                {planosPco.map(p => (
                  <option key={p.id_processo} value={p.id_processo}>
                    {p.id_processo} - {p.processo?.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Líder do Processo (Responsável GCN) *</label>
              <input 
                type="text" 
                value={govFormData.responsavel} 
                onChange={(e) => setGovFormData({...govFormData, responsavel: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Ex: Patrícia Lima (Coordenadora de SRE)"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Fluxo de Comunicação de Crise *</label>
              <textarea 
                rows="2"
                value={govFormData.comunicacao} 
                onChange={(e) => setGovFormData({...govFormData, comunicacao: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Descreva as pessoas que devem ser acionadas e canais de emergência..."
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Plano de Treinamento da Equipe *</label>
              <textarea 
                rows="2"
                value={govFormData.treinamento} 
                onChange={(e) => setGovFormData({...govFormData, treinamento: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Descreva o cronograma de simulados práticos ou de mesa para a equipe..."
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setShowGovForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Vincular Governança</button>
          </div>
        </form>
      )}

      {/* Grid: Workflow e Contatos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo (2/3): Tabela de Aprovação do Fluxo PCO */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
            <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Aprovação de Planos PCO (GERIC)</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {planosPco.map((p) => (
              <div key={p.id_pco} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-indigo-500 font-bold uppercase">{p.id_pco}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[10px] text-slate-400">Versão {p.versao}</span>
                  </div>
                  <h4 className="font-bold text-slate-850 dark:text-white text-xs">{p.processo?.nome}</h4>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase mt-1 ${getStatusBadge(p.status_aprovacao)}`}>
                    {p.status_aprovacao}
                  </span>
                </div>

                {/* Ações de Aprovação */}
                <div className="flex items-center gap-2">
                  {p.status_aprovacao !== 'Aprovado' && (
                    <button
                      onClick={() => handleAprovarPlano(p.id_processo, 'Aprovado')}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/50 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                    </button>
                  )}
                  {p.status_aprovacao !== 'Rejeitado' && (
                    <button
                      onClick={() => handleAprovarPlano(p.id_processo, 'Rejeitado')}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/50 dark:text-rose-450 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rejeitar
                    </button>
                  )}
                  {p.status_aprovacao !== 'Em Revisão' && p.status_aprovacao !== 'Aprovado' && (
                    <button
                      onClick={() => handleAprovarPlano(p.id_processo, 'Em Revisão')}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/50 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> Revisar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lado Direito (1/3): Matriz de Responsáveis Governança */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Matriz de Governança GCN</h3>
            </div>
            <div className="p-4 space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {governanca.map(g => (
                <div key={g.id_governanca} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-850/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-indigo-500 font-bold uppercase">{g.id_governanca}</span>
                    <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                      {g.id_processo}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Líder Responsável</p>
                    <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {g.responsavel}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Comunicação e Acionamento</p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed mt-0.5">{g.comunicacao}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Políticas de Treinamento</p>
                    <p className="text-slate-650 dark:text-slate-400 text-[11px] leading-relaxed mt-0.5">{g.treinamento}</p>
                  </div>
                </div>
              ))}

              {governanca.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  Nenhuma responsabilidade delegada ainda.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
