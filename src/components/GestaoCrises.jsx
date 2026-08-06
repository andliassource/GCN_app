import React, { useState } from 'react';
import { Users, Plus, Calendar, MessageSquare, AlertTriangle, Users2, ShieldAlert, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function GestaoCrises({ db }) {
  const { usuario, isAdmin } = useAuth();
  const [atas, setAtas] = useState(db.atasComiteCrise.list());
  const [showAtaForm, setShowAtaForm] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Controle de abas internas: 'atas', 'comunicacao'
  const [crisisTab, setCrisisTab] = useState('atas');

  // Form Fields - Ata
  const [ataForm, setAtaForm] = useState({
    data_reuniao: '',
    pauta: '',
    deliberacoes: '',
    participantes: ''
  });

  const handleAtaSubmit = (e) => {
    e.preventDefault();
    if (!ataForm.data_reuniao || !ataForm.pauta || !ataForm.deliberacoes) return;

    db.atasComiteCrise.create(ataForm);
    setAtas(db.atasComiteCrise.list());
    setShowAtaForm(false);
    setAtaForm({ data_reuniao: '', pauta: '', deliberacoes: '', participantes: '' });
    setNotification({ type: 'success', text: 'Ata do Comitê de Crise registrada e arquivada com sucesso!' });
  };

  // Estados para disparo de alertas de crise
  const [comunicados, setComunicados] = useState(
    (db.notificacoes?.list() || []).filter(n => n.origem === 'comite_crise')
  );
  const [comunicadoForm, setComunicadoForm] = useState({
    titulo: '',
    mensagem: '',
    destino: 'ALL',
    severidade: 'Alerta Crítico',
    canal: 'app_email'
  });

  const handleDispararAlerta = (e) => {
    e.preventDefault();
    if (!comunicadoForm.titulo || !comunicadoForm.mensagem) {
      setNotification({ type: 'error', text: 'Preencha o título e as instruções do comunicado!' });
      return;
    }

    const novoAlerta = db.notificacoes.create({
      titulo: `📢 [${comunicadoForm.severidade.toUpperCase()}] ${comunicadoForm.titulo}`,
      mensagem: comunicadoForm.mensagem,
      tipo: comunicadoForm.severidade === 'Evacuação / Desastre' || comunicadoForm.severidade === 'Alerta Crítico' ? 'critico' : 'alerta',
      id_destino: comunicadoForm.destino,
      origem: 'comite_crise',
      canal: comunicadoForm.canal
    });

    // Enviar notificação de sucesso e atualizar lista local
    setComunicados((db.notificacoes.list() || []).filter(n => n.origem === 'comite_crise'));
    setComunicadoForm({ titulo: '', mensagem: '', destino: 'ALL', severidade: 'Alerta Crítico', canal: 'app_email' });
    setNotification({ 
      type: 'success', 
      text: `Alerta disparado com sucesso! Destinatários: ${comunicadoForm.destino === 'ALL' ? 'Todas as áreas (Geral)' : comunicadoForm.destino}. Notificações registradas.` 
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Subnavegação de Abas do Comitê de Crise */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button 
          onClick={() => setCrisisTab('atas')}
          className={`pb-3 transition-all ${crisisTab === 'atas' ? 'border-b-2 border-indigo-650 dark:border-indigo-400 text-indigo-650 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Atas do Comitê de Crise (Geemp)
        </button>
        <button 
          onClick={() => setCrisisTab('comunicacao')}
          className={`pb-3 transition-all ${crisisTab === 'comunicacao' ? 'border-b-2 border-indigo-650 dark:border-indigo-400 text-indigo-650 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Painel de Acionamento & Comunicação (Gemac)
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <AlertTriangle className="w-4 h-4 text-indigo-500" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* ABA: ATAS DO COMITÊ DE CRISE */}
      {crisisTab === 'atas' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
            <div>
              <h3 className="font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <Users2 className="w-5 h-5 text-indigo-500" />
                Atas e Regimento do Comitê de Crises
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-xl leading-relaxed">
                As reuniões deliberativas em caso de acionamento do Plano de Gestão de Crise (PGC) geram atas obrigatórias para formalizar as decisões e salvaguardas contratuais.
              </p>
            </div>
            {(isAdmin() || usuario?.role === 'conti') && (
              <button 
                onClick={() => { setShowAtaForm(true); setNotification(null); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Registrar Ata do Comitê
              </button>
            )}
          </div>

          {/* Form de Ata */}
          {showAtaForm && (
            <form onSubmit={handleAtaSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs animate-slide-up">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Nova Ata Deliberativa do Comitê</h4>
                <button type="button" onClick={() => setShowAtaForm(false)} className="text-slate-450 hover:text-slate-655 font-semibold cursor-pointer">Cancelar</button>
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
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                    placeholder="Ex: Acionamento do plano PGC para o incidente de corte do link principal"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Deliberações Tomadas *</label>
                <textarea 
                  rows="3"
                  value={ataForm.deliberacoes}
                  onChange={(e) => setAtaForm({...ataForm, deliberacoes: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                  placeholder="Descreva as decisões estratégicas tomadas pelo Comitê e aprovações de desvio."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Participantes Integrantes *</label>
                <input 
                  type="text"
                  value={ataForm.participantes}
                  onChange={(e) => setAtaForm({...ataForm, participantes: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                  placeholder="Ex: Roberto Carlos (Geric), Patrícia Lima (Getic), Arthur Mendes (Geemp)"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowAtaForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-650 hover:bg-indigo-755 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs">Registrar Ata</button>
              </div>
            </form>
          )}

          {/* Histórico de Atas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {atas.map(ata => (
              <div key={ata.id_ata} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold text-indigo-500 uppercase">{ata.id_ata}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ata.data_reuniao}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-855 dark:text-white text-xs leading-normal">{ata.pauta}</h4>
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

      {/* ABA: COMUNICAÇÃO DE CRISE */}
      {crisisTab === 'comunicacao' && (
        <div className="space-y-6 text-xs">
          
          {/* Alerta de Protocolo da Gemac */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-150 dark:border-slate-800 pb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-855 dark:text-white text-sm">Plano de Comunicação de Crises (Gemac / ISO 22301 §8.4.3)</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-550 dark:text-slate-450">
              A Gemac coordena todos os canais de informação externa e interna em cenários de acionamento do Plano de Gestão de Crise (PGC). Em crises graves, o disparo de comunicados em massa é executado a partir do painel de acionamento abaixo para mitigar ruídos de informação e focar na contingência.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form de Disparo em Massa */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  📢 Disparar Comunicado de Emergência / Crise (Gemac MNS)
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">ISO 22301 §8.4.3 Communication</span>
              </div>

              {/* Botões de Templates Pré-Formatados de Incidentes */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-200 dark:border-slate-850">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Templates Rápidos de Incidentes (Gemac):</span>
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button"
                    onClick={() => setComunicadoForm({
                      titulo: 'Ataque Cibernético DDoS / Degradação de APIs',
                      mensagem: 'Identificamos uma volumetria atípica de requisições maliciosas afetando as APIs transacionais. A equipe de Cibersegurança (Gesec) ativou a mitigação de mitigação de DDoS. Serviços estão operando em regime de alta latência.',
                      destino: 'ALL',
                      severidade: 'Alerta Crítico',
                      canal: 'all_channels'
                    })}
                    className="bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    🛡️ DDoS / Ciberataque
                  </button>

                  <button 
                    type="button"
                    onClick={() => setComunicadoForm({
                      titulo: 'Queda de Data Center / Comutação de Site DR',
                      mensagem: 'Devido à indisponibilidade de infraestrutura no Data Center Primário, a equipe de TI (Getic) iniciou a comutação para o Data Center Secundário (Site DR). O tempo estimado para plena recuperação é de até 15 minutos.',
                      destino: 'ALL',
                      severidade: 'Evacuação / Desastre',
                      canal: 'all_channels'
                    })}
                    className="bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    ⚡ Queda Data Center / DR
                  </button>

                  <button 
                    type="button"
                    onClick={() => setComunicadoForm({
                      titulo: 'Indisponibilidade Predial Emergencial / Home Office Mandatório',
                      mensagem: 'Orientamos todos os colaboradores das gerências afetadas a atuarem em regime de trabalho remoto emergencial a partir deste momento devido a sinistro físico nas dependências do edifício sede.',
                      destino: 'ALL',
                      severidade: 'Evacuação / Desastre',
                      canal: 'app_email'
                    })}
                    className="bg-indigo-100 dark:bg-indigo-950/80 hover:bg-indigo-200 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    🏢 Sinistro Predial / Home Office
                  </button>

                  <button 
                    type="button"
                    onClick={() => setComunicadoForm({
                      titulo: 'Instabilidade em Links de Conectividade',
                      mensagem: 'Informamos oscilação na operadora de conectividade principal. A equipe de infraestrutura ativou o link redundante secundário. É possível haver lentidão momentânea no acesso às aplicações.',
                      destino: 'ALL',
                      severidade: 'Informativo Geral',
                      canal: 'app_email'
                    })}
                    className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    📡 Falha de Telecom / Link
                  </button>
                </div>
              </div>

              {(isAdmin() || usuario?.role === 'comunicacao_crise') ? (
                <form onSubmit={handleDispararAlerta} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Severidade / Nível do Disparo</label>
                      <select 
                        value={comunicadoForm.severidade}
                        onChange={e => setComunicadoForm({...comunicadoForm, severidade: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
                      >
                        <option value="Informativo Geral">Informativo Geral</option>
                        <option value="Alerta Crítico">Alerta Crítico (Severidade Média)</option>
                        <option value="Evacuação / Desastre">🚨 Evacuação / Desastre (Severidade Alta)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Gerência Destinatária (Foco)</label>
                      <select 
                        value={comunicadoForm.destino}
                        onChange={e => setComunicadoForm({...comunicadoForm, destino: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
                      >
                        <option value="ALL">Todas as Áreas (Empresa Geral)</option>
                        {db.gerencias.list().map(g => (
                          <option key={g.id_gerencia} value={g.id_gerencia}>{g.sigla} - {g.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Assunto / Título do Comunicado *</label>
                    <input 
                      type="text"
                      value={comunicadoForm.titulo}
                      onChange={e => setComunicadoForm({...comunicadoForm, titulo: e.target.value})}
                      placeholder="Ex: Evasão Predial do Bloco A ou Falha Geral do Sistema de Pagamentos"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-300 focus:outline-indigo-500 font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Instruções de Contingência e Detalhes *</label>
                    <textarea 
                      rows="4"
                      value={comunicadoForm.mensagem}
                      onChange={e => setComunicadoForm({...comunicadoForm, mensagem: e.target.value})}
                      placeholder="Descreva as ações imediatas que os colaboradores ou a gerência destino devem tomar. Ex: favor realizar home office emergencial e aguardar normalização."
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Canais de Transmissão Simulados</label>
                    <select 
                      value={comunicadoForm.canal}
                      onChange={e => setComunicadoForm({...comunicadoForm, canal: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-300"
                    >
                      <option value="app_email">Notificação Push no App GCN + E-mail Corporativo</option>
                      <option value="sms_emergency">🚨 SMS de Emergência (Mass Broadcast)</option>
                      <option value="all_channels">Todos os Canais Simultaneamente (App, E-mail, SMS, Status Page)</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="px-6 py-2.5 bg-rose-650 hover:bg-rose-700 text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                      <Send className="w-3.5 h-3.5" /> Disparar em Massa (MNS)
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-955 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-450 font-semibold">
                  Modo Leitura — Apenas a equipe de Comunicação (Gemac) ou Governança (Geric/Geemp) possuem permissão para realizar disparos em massa.
                </div>
              )}
            </div>

            {/* Histórico de Disparos de Crise */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider mb-3">
                  📜 Histórico de Disparos Recentes
                </h4>
                
                {comunicados.length === 0 ? (
                  <p className="text-[11px] text-slate-450 italic">Nenhum comunicado de emergência disparado no ciclo atual.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {comunicados.map(c => (
                      <div key={c.id_notificacao} className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-lg space-y-1.5 hover:border-slate-350 transition-colors">
                        <div className="flex justify-between items-center text-[8px] font-bold">
                          <span className="text-rose-500 uppercase">{c.id_notificacao}</span>
                          <span className="text-slate-400 font-normal">{new Date(c.data_hora).toLocaleString('pt-BR')}</span>
                        </div>
                        <h5 className="font-extrabold text-[10px] text-slate-800 dark:text-white leading-normal">{c.titulo}</h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-450 line-clamp-2 leading-relaxed">{c.mensagem}</p>
                        <div className="flex items-center justify-between text-[8px] text-indigo-500 font-semibold pt-1 border-t border-slate-200 dark:border-slate-850">
                          <span>Destino: {c.id_destino === 'ALL' ? 'Todos (Geral)' : c.id_destino}</span>
                          <span className="text-slate-400 capitalize">via {c.canal?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Protocolos rápidos da Gemac */}
              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-2 text-[11px] text-slate-450">
                <div className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Prazos de Protocolo Gemac:</div>
                <p>• <strong>Interno:</strong> Até 30 min via App corporativo.</p>
                <p>• <strong>Externo:</strong> Até 60 min via Status Page pública.</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
