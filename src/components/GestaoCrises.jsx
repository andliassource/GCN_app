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

  // Estados para disparo de alertas de crise (MNS — Mass Notification System)
  const [comunicados, setComunicados] = useState(
    (db.notificacoes?.list() || []).filter(n => n.origem === 'comite_crise')
  );
  const [mnsUltimoDisparo, setMnsUltimoDisparo] = useState(null);
  const [comunicadoForm, setComunicadoForm] = useState({
    titulo: '',
    mensagem: '',
    destino: 'ALL',
    severidade: 'Alerta Crítico',
    canal: 'all_channels'
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

    const mnsData = {
      id: novoAlerta.id_notificacao,
      titulo: comunicadoForm.titulo,
      severidade: comunicadoForm.severidade,
      canal: comunicadoForm.canal,
      totalDestinatarios: comunicadoForm.destino === 'ALL' ? 1240 : 185,
      taxaEntrega: 99.8,
      taxaLeitura: 91.2,
      taxaSeguranca: 98.4,
      dataHora: new Date().toLocaleTimeString('pt-BR'),
      respostasAck: [
        { usuario: "Roberto Carlos (Geric)", status: "Lido & Confirmado", tempo: "5s atrás", acao: "War Room Ativada (2ª Linha)" },
        { usuario: "Patrícia Lima (Getic)", status: "Lido & Confirmado", tempo: "12s atrás", acao: "Failover DR Iniciado (1ª Linha)" },
        { usuario: "Marcos Costa (Gecob)", status: "Lido & Confirmado", tempo: "28s atrás", acao: "Fila de Atendimento Pausada" },
        { usuario: "Sandro Lima (Gesap)", status: "Lido & Confirmado", tempo: "45s atrás", acao: "Brigada de Incêndio Alerta" }
      ]
    };

    setMnsUltimoDisparo(mnsData);
    setComunicados((db.notificacoes.list() || []).filter(n => n.origem === 'comite_crise'));
    setComunicadoForm({ titulo: '', mensagem: '', destino: 'ALL', severidade: 'Alerta Crítico', canal: 'all_channels' });
    setNotification({ 
      type: 'success', 
      text: `🚀 BROADCAST MNS DISPARADO COM SUCESSO! 1.240 mensagens transmitidas por Push, E-mail, SMS e WhatsApp.` 
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
        <button 
          onClick={() => setCrisisTab('playbooks')}
          className={`pb-3 transition-all ${crisisTab === 'playbooks' ? 'border-b-2 border-indigo-650 dark:border-indigo-400 text-indigo-650 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          🚨 Playbooks de Resposta Imediata (0-15min / 1h / 4h)
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

          {/* Painel MNS — Métricas de Disparo e Leitura (ACK) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Público Coberto MNS</span>
              <div className="text-xl font-black text-slate-800 dark:text-white mt-1">1.240 Pessoas</div>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">Push, E-mail, SMS & WhatsApp</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Taxa de Entrega (Delivery Rate)</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">99.8%</div>
              <p className="text-[10px] text-slate-400 mt-1">Multicanal em contingência</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Confirmação de Leitura (ACK)</span>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {mnsUltimoDisparo ? `${mnsUltimoDisparo.taxaLeitura}%` : '91.2%'}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Leitura confirmada em até 5min</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Status da Equipe (Muster Point)</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {mnsUltimoDisparo ? `${mnsUltimoDisparo.taxaSeguranca}% OK` : '98.4% OK'}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Equipe em local seguro / remoto</p>
            </div>
          </div>

          {/* Painel MNS do Último Disparo com respostas de confirmação ACK */}
          {mnsUltimoDisparo && (
            <div className="bg-slate-900 text-white p-5 rounded-xl border border-indigo-500/40 shadow-xl space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-mono text-xs font-black uppercase text-rose-400">
                    TRANSMISSÃO MNS EM TEMPO REAL — {mnsUltimoDisparo.id}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{mnsUltimoDisparo.dataHora}</span>
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-white">{mnsUltimoDisparo.titulo}</h4>
                <p className="text-[11px] text-slate-300">
                  Transmitido para {mnsUltimoDisparo.totalDestinatarios} destinatários via <strong>{mnsUltimoDisparo.canal?.replace('_', ' ')}</strong>.
                </p>
              </div>

              {/* Trilha de Respostas de Confirmação dos Líderes */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[9px] font-extrabold uppercase text-indigo-400 block tracking-wider">
                  💬 Confirmações de Leitura & Ação Imediata (ACK Log):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  {mnsUltimoDisparo.respostasAck.map((ack, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                      <div>
                        <strong className="text-white block">{ack.usuario}</strong>
                        <span className="text-[10px] text-emerald-400">{ack.acao}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {ack.tempo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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

      {/* ABA: PLAYBOOKS DE RESPOSTA IMEDIATA */}
      {crisisTab === 'playbooks' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-500" /> Playbooks de Resposta Imediata a Crises (ISO 22301 / NIST)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">
              Guia operacional dinâmico para tomada de decisão nos primeiros minutos e horas da eclosão de um desastre. 
              Dividido em 3 fases temporais: <strong>Fase 1 (0-15 min) — Segurança & Contenção</strong>, <strong>Fase 2 (15-60 min) — Acionamento & Gemac</strong> e <strong>Fase 3 (1-4h) — Failover & Reguladores</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Playbook 1: Ransomware */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/40 px-2 py-0.5 rounded-full uppercase">Cibersegurança / SOC</span>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-1">Ataque Ransomware / Invasão Crítica</h4>
                </div>
                <span className="text-xs font-mono font-bold text-rose-500">RTO: 15 min</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <span className="font-bold text-rose-700 dark:text-rose-400 block mb-0.5">⏱ 0 a 15 Minutos (Fase 1 - Isolamento):</span>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1 text-[10px]">
                    <li>Gesec: Isolar vLANs atingidas e cortar links WAN/VPN.</li>
                    <li>NÃO reiniciar servidores infectados (preservar memória RAM para forense).</li>
                    <li>Disparar alerta vermelho no Slack #incidentes-ciber.</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">⏱ 15 a 60 Minutos (Fase 2 - Contenção & Gemac):</span>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1 text-[10px]">
                    <li>Convocação emergencial do Comitê de Crise Geemp via MNS.</li>
                    <li>Gemac: Preparar nota interna de esclarecimento para colaboradores.</li>
                    <li>Verificar integridade dos backups offline no S3 Glacier.</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-0.5">⏱ 1 a 4 Horas (Fase 3 - Restauração & Notificação Legal):</span>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1 text-[10px]">
                    <li>Iniciar restore dos backups limpos em ambiente isolado.</li>
                    <li>Gecoj/DPO: Avaliar necessidade de notificação à ANPD em até 3 dias.</li>
                    <li>Gerin: Notificar BACEN caso o incidente afete transações financeiras.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Playbook 2: Blackout AWS */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/40 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full uppercase">Infraestrutura TIC</span>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-1">Indisponibilidade Total de Data Center / Cloud</h4>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-500">RTO: 30 min</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-0.5">⏱ 0 a 15 Minutos (Fase 1 - Diagnóstico):</span>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1 text-[10px]">
                    <li>Getic: Confirmar se a falha afeta a região us-east-1 inteira via AWS Health.</li>
                    <li>Abrir War Room virtual no Teams 'War-Room-Infra'.</li>
                    <li>Acionar suporte de emergência Enterprise AWS.</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">⏱ 15 a 60 Minutos (Fase 2 - Failover Ativo):</span>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1 text-[10px]">
                    <li>Executar Script de Chaveamento DNS Route53 para região reserva (sa-east-1).</li>
                    <li>Validar se a réplica do banco de dados assumiu como Master.</li>
                    <li>Gemac: Atualizar Status Page pública para clientes e parceiros.</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">⏱ 1 a 4 Horas (Fase 3 - Validação & Normalização):</span>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1 text-[10px]">
                    <li>Testar integridade de transações enfileiradas.</li>
                    <li>Validar conciliação financeira Geoliq.</li>
                    <li>Elaborar Relatório RSO (Relatório Semestral de Operações de Contingência).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Playbook 3: Evacuação Predial */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-full uppercase">Gesap / Predial</span>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-1">Desastre Predial / Evacuação Emergencial</h4>
                </div>
                <span className="text-xs font-mono font-bold text-amber-500">SLA: 15 min</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">⏱ 0 a 15 Minutos (Fase 1 - Vidas em Primeiro Lugar):</span>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1 text-[10px]">
                    <li>Disparar alarme geral e evacuar andares via rotas de fuga.</li>
                    <li>Acionar Corpo de Bombeiros (193) e SAMU (192).</li>
                    <li>Brigadistas contam pessoas no Ponto de Encontro Externa (Muster Point).</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-0.5">⏱ 15 a 60 Minutos (Fase 2 - Continuidade Operacional):</span>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1 text-[10px]">
                    <li>Ativar home office automático para 100% dos colaboradores.</li>
                    <li>Gesap: Isolar a área predial afetada e desligar disjuntores.</li>
                    <li>Gepes: Checar se há colaboradores feridos ou hospitalizados.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Playbook 4: Crise de Liquidez */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase">Gefic / Tesouraria</span>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-1">Crise de Liquidez / Estresse de Caixa</h4>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">SLA: 4h</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">⏱ 0 a 60 Minutos (Fase 1 - Bloqueio Preservativo):</span>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1 text-[10px]">
                    <li>Suspender todos os pagamentos não-essenciais e CAPEX.</li>
                    <li>Preservar saldo para Folha de Pagamento (Gepes) e tributos.</li>
                    <li>Reunir Gefic com CFO para projeção de caixa diário.</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-0.5">⏱ 1 a 4 Horas (Fase 2 - Injeção de Liquidez):</span>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1 text-[10px]">
                    <li>Acionar linha de crédito emergencial homologada.</li>
                    <li>Antecipar recebíveis de cartão de crédito.</li>
                    <li>Acionar conselho de administração se necessidade &gt; R$ 10MM.</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
