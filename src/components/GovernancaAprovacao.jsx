import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, User, Calendar, RefreshCw, FileText, Plus, Users, MessageSquare } from 'lucide-react';

export default function GovernancaAprovacao({ db }) {
  const [planosPco, setPlanosPco] = useState(db.planosContinuidade.list());
  const [governanca, setGovernanca] = useState(db.governancaGCN.list());
  const [atas, setAtas] = useState(db.atasComiteCrise.list());
  
  const [notification, setNotification] = useState(null);

  // Controle de abas internas: 'workflow', 'atas', 'comunicacao'
  const [govTab, setGovTab] = useState('workflow');

  // Estados dos Formulários
  const [showAtaForm, setShowAtaForm] = useState(false);
  const [showGovForm, setShowGovForm] = useState(false);

  // Form Fields - Ata
  const [ataForm, setAtaForm] = useState({
    data_reuniao: '',
    pauta: '',
    deliberacoes: '',
    participantes: ''
  });

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

    setPlanosPco(db.planosContinuidade.list());
    setNotification({
      type: 'success',
      text: `Status do plano do processo ${id_processo} atualizado para "${status}".`
    });
  };

  const handleAtaSubmit = (e) => {
    e.preventDefault();
    if (!ataForm.data_reuniao || !ataForm.pauta || !ataForm.deliberacoes) return;

    db.atasComiteCrise.create(ataForm);
    setAtas(db.atasComiteCrise.list());
    setShowAtaForm(false);
    setAtaForm({ data_reuniao: '', pauta: '', deliberacoes: '', participantes: '' });
    setNotification({ type: 'success', text: 'Ata do Comitê de Crise registrada e arquivada com sucesso!' });
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
    if (status === 'Aprovado') return 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30';
    if (status === 'Pendente') return 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30';
    if (status === 'Em Revisão') return 'bg-indigo-50 text-indigo-650 border border-indigo-105 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
    return 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Subnavegação de Abas da Governança */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button 
          onClick={() => setGovTab('workflow')}
          className={`pb-3 transition-all ${govTab === 'workflow' ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Aprovações GERIC & Responsabilidades
        </button>
        <button 
          onClick={() => setGovTab('atas')}
          className={`pb-3 transition-all ${govTab === 'atas' ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Atas do Comitê de Crise (Geemp)
        </button>
        <button 
          onClick={() => setGovTab('comunicacao')}
          className={`pb-3 transition-all ${govTab === 'comunicacao' ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Comunicação de Crise (Gemac)
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 text-xs font-semibold">
          {notification.text}
        </div>
      )}

      {/* ABA 1: WORKFLOW E APROVAÇÕES PCO */}
      {govTab === 'workflow' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-850 dark:text-white">Central de Aprovação de Planos PCO</h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-xl leading-relaxed">
                Valide os 4 cenários críticos preenchidos pelos gerentes e emita os status de auditoria em produção conforme a ISO 22301.
              </p>
            </div>
            <button 
              onClick={() => { setShowGovForm(true); setNotification(null); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
            >
              Atribuir Responsável GCN
            </button>
          </div>

          {/* Form Atribuição */}
          {showGovForm && (
            <form onSubmit={handleGovSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs">Atribuir Governança ao Processo</h4>
                <button type="button" onClick={() => setShowGovForm(false)} className="text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Processo Crítico *</label>
                  <select 
                    value={selectedProcId} 
                    onChange={(e) => setSelectedProcId(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Líder do Processo (Responsável GCN) *</label>
                  <input 
                    type="text" 
                    value={govFormData.responsavel} 
                    onChange={(e) => setGovFormData({...govFormData, responsavel: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500" 
                    placeholder="Ex: Patrícia Lima (Getic)"
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Política de Treinamento da Equipe</label>
                  <textarea 
                    rows="2"
                    value={govFormData.treinamento} 
                    onChange={(e) => setGovFormData({...govFormData, treinamento: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowGovForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Vincular Governança</button>
              </div>
            </form>
          )}

          {/* Workflow List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm lg:col-span-2">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
                <h3 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Aprovação de Planos PCO (GERIC)</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {planosPco.map(p => (
                  <div key={p.id_pco} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 dark:text-white">{p.processo?.nome}</h4>
                      <p className="text-[10px] text-slate-400">Responsável: {p.processo?.gerencia?.sigla} (Tipo: {p.processo?.gerencia?.tipo})</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase mt-1 ${getStatusBadge(p.status_aprovacao)}`}>
                        {p.status_aprovacao}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.status_aprovacao !== 'Aprovado' && (
                        <button
                          onClick={() => handleAprovarPlano(p.id_processo, 'Aprovado')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/25 dark:text-emerald-400 px-2.5 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          Aprovar
                        </button>
                      )}
                      {p.status_aprovacao !== 'Rejeitado' && (
                        <button
                          onClick={() => handleAprovarPlano(p.id_processo, 'Rejeitado')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/25 dark:text-rose-450 px-2.5 py-1.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          Rejeitar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Matriz de contatos */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
                <h3 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Matriz de Governança GCN</h3>
              </div>
              <div className="p-4 space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {governanca.map(g => (
                  <div key={g.id_governanca} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-850 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-indigo-500 font-bold uppercase">{g.id_governanca}</span>
                      <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
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
      )}

      {/* ABA 2: ATAS DO COMITÊ DE CRISE (Geemp) */}
      {govTab === 'atas' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Atas e Regimento do Comitê de Crises (Geemp & Geric)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-xl leading-relaxed">
                As reuniões deliberativas em caso de acionamento do Plano de Gestão de Crise (PGC) geram atas obrigatórias para formalizar as decisões e salvaguardas contratuais.
              </p>
            </div>
            <button 
              onClick={() => { setShowAtaForm(true); setNotification(null); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Registrar Ata do Comitê
            </button>
          </div>

          {/* Form de Ata */}
          {showAtaForm && (
            <form onSubmit={handleAtaSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Nova Ata Deliberativa do Comitê</h4>
                <button type="button" onClick={() => setShowAtaForm(false)} className="text-slate-450 hover:text-slate-650 font-semibold">Cancelar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Data da Reunião *</label>
                  <input 
                    type="date"
                    value={ataForm.data_reuniao}
                    onChange={(e) => setAtaForm({...ataForm, data_reuniao: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pauta Principal *</label>
                  <input 
                    type="text"
                    value={ataForm.pauta}
                    onChange={(e) => setAtaForm({...ataForm, pauta: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                    placeholder="Ex: Acionamento do plano PGC para o incidente de corte do link"
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Deliberações e Ações Aprovadas *</label>
                  <textarea 
                    rows="3"
                    value={ataForm.deliberacoes}
                    onChange={(e) => setAtaForm({...ataForm, deliberacoes: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                    placeholder="Descreva as medidas de contingência aprovadas pelo comitê..."
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Participantes (Gestores Presentes)</label>
                  <input 
                    type="text"
                    value={ataForm.participantes}
                    onChange={(e) => setAtaForm({...ataForm, participantes: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                    placeholder="Ex: Roberto Carlos (Geric), Patrícia Lima (Getic)"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowAtaForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Registrar Ata</button>
              </div>
            </form>
          )}

          {/* Histórico de Atas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {atas.map(ata => (
              <div key={ata.id_ata} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold text-indigo-500 uppercase">{ata.id_ata}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ata.data_reuniao}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-850 dark:text-white text-xs leading-normal">{ata.pauta}</h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-200 dark:border-slate-850 text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
                    <strong>Deliberações:</strong> {ata.deliberacoes}
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-850 pt-2 text-[10px] text-slate-400">
                  <strong>Participantes:</strong> {ata.participantes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: COMUNICAÇÃO DE CRISE (Gemac) */}
      {govTab === 'comunicacao' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs text-slate-700 dark:text-slate-350">
          <div className="border-b border-slate-150 dark:border-slate-800 pb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-850 dark:text-white text-sm">Plano de Comunicação de Crises (Gemac)</h3>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">
            A Gemac (Gerência de Marketing e Comunicação) coordena todos os canais de informação externa e interna em cenários de acionamento do Plano de Gestão de Crise (PGC). É vedado o pronunciamento de funcionários sem validação da Gemac.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-slate-850 space-y-3">
              <h4 className="font-extrabold text-indigo-650 dark:text-indigo-400 uppercase text-[10px] tracking-wider">Protocolo de Comunicação Interna</h4>
              <p className="leading-relaxed">
                <strong>Destinatários:</strong> Colaboradores, Fiscais de Contratos e Terceirizados.<br/>
                <strong>Canais:</strong> Notificações push via aplicativo corporativo, e-mail institucional interno e WhatsApp Business do comitê.<br/>
                <strong>Prazo de Disparo:</strong> Até 30 minutos após a ata de acionamento do PGC.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-slate-850 space-y-3">
              <h4 className="font-extrabold text-purple-650 dark:text-purple-400 uppercase text-[10px] tracking-wider">Protocolo de Comunicação Externa</h4>
              <p className="leading-relaxed">
                <strong>Destinatários:</strong> Clientes, Acionistas e Imprensa.<br/>
                <strong>Canais:</strong> Atualização da Status Page pública da empresa, envio de boletins via e-mail e notas à imprensa especializada.<br/>
                <strong>Prazo de Disparo:</strong> Em até 60 minutos após confirmação da indisponibilidade que exceda o RTO do checkout.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
