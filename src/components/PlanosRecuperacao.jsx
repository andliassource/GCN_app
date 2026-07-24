import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldAlert, Zap, RefreshCw, CheckCircle2, AlertTriangle, Play, HelpCircle, Layers, Users, Server, Briefcase } from 'lucide-react';

export default function PlanosRecuperacao({ db }) {
  const [processos] = useState(db.processosCriticos.list());
  const [ains] = useState(db.analiseImpactoNegocio.list());
  const [riscos] = useState(db.riscos.list());
  
  // Estados de controle
  const [selectedProcId, setSelectedProcId] = useState(processos[0]?.id_processo || '');
  const [pcoData, setPcoData] = useState(null);
  const [prdData, setPrdData] = useState(null);
  
  // Aba ativa interna no editor de planos: 'cenarios', 'tecnico', 'diagrama'
  const [editorTab, setEditorTab] = useState('cenarios');

  // Estado para simulação do Failover no Diagrama DR
  const [drStatus, setDrStatus] = useState('normal'); 
  const [notification, setNotification] = useState(null);

  // Carregar dados quando o processo muda
  useEffect(() => {
    if (selectedProcId) {
      const p = db.planosContinuidade.getForProcesso(selectedProcId);
      const r = db.planosRecuperacaoDesastres.getForProcesso(selectedProcId);
      
      const defaultPco = {
        id_processo: selectedProcId,
        estrategia_recuperacao: 'Em caso de interrupção operacional de {{PROCESSO_NOME}}, desviar os fluxos para as contingências mapeadas sob SLA de {{RTO}}.',
        responsabilidades: 'Gerente Executivo da Gerência responsável gerencia o failover. SRE de plantão realiza ações técnicas.',
        recursos_necessarios: 'Nuvem redundante, geradores locais e acessos VPN ativos.',
        
        // Novos Cenários Obrigatórios (Requisito 3)
        cenario_acesso: 'Bloqueio predial: Direcionar 100% da equipe crítica para home office imediato. Garantir acessos VPN e tokens MFA ativos. \nHome Office: Em caso de falha de energia generalizada na residência, direcionar o funcionário para a filial de contingência secundária.',
        cenario_sistemas: 'Passo 1: Validar queda. \nPasso 2: Entrar em contato com o fiscal de serviço do contrato no telefone (11) 97777-6666 e formalizar notificação em fiscal.SLA@provedor.com.br. \nPasso 3: Mudar tráfego local.',
        cenario_fornecedores: 'Em caso de paralisação do fornecedor crítico de hospedagem, acionar a contingência do contrato no fornecedor secundário. Recomendação Geric: Em futuras licitações, distribuir lote de contratos (Multi-Vendor) para evitar monopólio.',
        cenario_pessoas: 'Se houver ausência de mais de 30% da equipe por greve ou contágio, acionar turnos de 12 horas e remanejamento temporário de analistas de outras gerências da diretoria.',
        escalonamento_crise: 'Se a interrupção ultrapassar {{MTDCN}} minutos, escalonar imediatamente para o Comitê de Crise e Gerência de Comunicação (Gemac) para acionamento do PGC (Plano de Gestão de Crise).',
        
        versao: '1.0.0',
        status_aprovacao: 'Pendente'
      };

      const defaultPrd = {
        id_processo: selectedProcId,
        procedimentos_restauracao: '1. Validar logs. 2. Restaurar snapshot com perda máxima (RPO) de {{RPO}}.',
        local_backup: 'Azure Blob Storage (Criptografado Geo-redundante)',
        frequencia_backup: 'A cada {{RPO}} minutos',
        comunicacao_emergencia: 'Notificação PagerDuty para DevOps, Canal Slack #incidentes-ops.',
        
        // Novo Campo de War Room (ISO 27031)
        procedimento_war_room: '1. Declarar desastre técnico. \n2. Criar War Room Teams "War-Room-Crise-Tecnologia". \n3. Convocar líderes de Getic, Geape e Gesec. \n4. Manter reuniões de status técnico a cada 15 minutos até a restauração.'
      };

      setPcoData(p ? { ...defaultPco, ...p } : defaultPco);
      setPrdData(r ? { ...defaultPrd, ...r } : defaultPrd);
      
      setDrStatus('normal');
      setNotification(null);
    }
  }, [selectedProcId]);

  const currentProcess = processos.find(p => p.id_processo === selectedProcId);
  const currentAin = ains.find(a => a.id_processo === selectedProcId);
  const riscosDoProcesso = riscos.filter(r => r.id_processo === selectedProcId);

  // Substituição de Placeholders
  const renderPlaceholders = (text) => {
    if (!text || !currentProcess) return '';
    return text
      .replace(/{{PROCESSO_NOME}}/g, currentProcess.nome)
      .replace(/{{CRITICIDADE}}/g, currentProcess.criticidade)
      .replace(/{{RTO}}/g, currentAin ? `${currentAin.RTO} min` : 'N/A')
      .replace(/{{RPO}}/g, currentAin ? `${currentAin.RPO} min` : 'N/A')
      .replace(/{{MTDCN}}/g, currentAin ? `${currentAin.MTDCN} min` : 'N/A');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedProcId) return;

    const incrementVersion = (v) => {
      const parts = v.split('.').map(Number);
      parts[2] += 1;
      if (parts[2] >= 10) {
        parts[2] = 0;
        parts[1] += 1;
      }
      return parts.join('.');
    };

    const updatedPco = db.planosContinuidade.save({
      ...pcoData,
      versao: incrementVersion(pcoData.versao || '1.0.0'),
      status_aprovacao: 'Pendente'
    });

    const updatedPrd = db.planosRecuperacaoDesastres.save({
      ...prdData
    });

    setPcoData(updatedPco);
    setPrdData(updatedPrd);
    
    db.revisoesAtualizacoes.create({
      id_pco: updatedPco.id_pco,
      id_prd: updatedPrd.id_prd,
      data_revisao: new Date().toISOString().split('T')[0],
      motivo: 'Revisão e detalhamento dos cenários obrigatórios e War Room',
      atualizacao_realizada: `Atualização de cenários de contingência. Nova versão do PCO: ${updatedPco.versao}.`
    });

    setNotification({
      type: 'success',
      text: `Plano atualizado para a versão ${updatedPco.versao}! Um log de revisão foi enviado para auditoria.`
    });
  };

  const startFailoverSimulation = () => {
    setDrStatus('failing-over');
    setTimeout(() => {
      setDrStatus('failed-over');
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Seletor de Processo */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Editor Geral de Planos de Continuidade</h3>
            <p className="text-[10px] text-slate-400">PCO (ISO 22301) e PRD (ISO 27031) estruturados por Gerências.</p>
          </div>
        </div>
        <div className="flex gap-4">
          {currentProcess?.gerencia && (
            <div className="flex flex-col items-end text-xs justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Líder GCN Responsável</span>
              <span className="font-bold text-indigo-650 dark:text-indigo-400">
                {currentProcess.gerencia.sigla} ({currentProcess.gerencia.tipo})
              </span>
            </div>
          )}
          <select
            value={selectedProcId}
            onChange={(e) => setSelectedProcId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-700 dark:text-slate-355 focus:outline-indigo-500 font-bold min-w-[280px]"
          >
            {processos.map(p => (
              <option key={p.id_processo} value={p.id_processo}>
                {p.id_processo} - {p.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 text-xs font-semibold">
          {notification.text}
        </div>
      )}

      {pcoData && prdData && currentProcess && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lado Esquerdo (2/3): Editores Organizados por Abas */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Navegação de Abas do Editor */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg gap-2 text-xs font-bold border border-slate-200 dark:border-slate-850">
              <button
                onClick={() => setEditorTab('cenarios')}
                className={`flex-1 py-2 text-center rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  editorTab === 'cenarios' ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Cenários Obrigatórios (PCO)
              </button>
              <button
                onClick={() => setEditorTab('tecnico')}
                className={`flex-1 py-2 text-center rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  editorTab === 'tecnico' ? 'bg-white dark:bg-slate-900 text-purple-655 dark:text-purple-400 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Server className="w-3.5 h-3.5" /> Recuperação Técnica (PRD)
              </button>
              <button
                onClick={() => setEditorTab('diagrama')}
                className={`flex-1 py-2 text-center rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  editorTab === 'diagrama' ? 'bg-white dark:bg-slate-900 text-rose-650 dark:text-rose-400 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> Diagrama DR & Failover
              </button>
            </div>

            {/* ABA: CENÁRIOS OBRIGATÓRIOS DO PCO */}
            {editorTab === 'cenarios' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
                  <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
                    Editor de Cenários de Crise (ISO 22301)
                  </h4>
                  <span className="text-[9px] bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-400 font-mono">
                    Versão {pcoData.versao}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      Cenário 1: Bloqueio de Acesso Predial / Home Office *
                    </label>
                    <textarea
                      rows="3"
                      value={pcoData.cenario_acesso}
                      onChange={(e) => setPcoData({...pcoData, cenario_acesso: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Cenário 2: Indisponibilidade de Sistemas e Passo a Passo de Acionamento *
                    </label>
                    <textarea
                      rows="3"
                      value={pcoData.cenario_sistemas}
                      onChange={(e) => setPcoData({...pcoData, cenario_sistemas: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Cenário 3: Fornecedores Críticos e Contingências Contratuais *
                    </label>
                    <textarea
                      rows="3"
                      value={pcoData.cenario_fornecedores}
                      onChange={(e) => setPcoData({...pcoData, cenario_fornecedores: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Cenário 4: Indisponibilidade de Pessoas (Falta de Pessoal) *
                    </label>
                    <textarea
                      rows="2"
                      value={pcoData.cenario_pessoas}
                      onChange={(e) => setPcoData({...pcoData, cenario_pessoas: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 border-t border-slate-100 dark:border-slate-850 pt-3">
                    <label className="text-[10px] font-bold text-rose-500 uppercase">
                      Regra de Escalonamento e Acionamento do Comitê de Crise *
                    </label>
                    <textarea
                      rows="2"
                      value={pcoData.escalonamento_crise}
                      onChange={(e) => setPcoData({...pcoData, escalonamento_crise: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-rose-500/30 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA: RECUPERAÇÃO TÉCNICA (PRD) */}
            {editorTab === 'tecnico' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-purple-650 dark:text-purple-400 uppercase tracking-wider text-[11px]">
                    Editor de Recuperação de Desastres e War Room (ISO 27031)
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Procedimentos de Restauração de Backups</label>
                    <textarea
                      rows="3"
                      value={prdData.procedimentos_restauracao}
                      onChange={(e) => setPrdData({...prdData, procedimentos_restauracao: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Local dos Snapshots</label>
                      <input
                        type="text"
                        value={prdData.local_backup}
                        onChange={(e) => setPrdData({...prdData, local_backup: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Frequência dos Backups</label>
                      <input
                        type="text"
                        value={prdData.frequencia_backup}
                        onChange={(e) => setPrdData({...prdData, frequencia_backup: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Acionamento de Emergência TI</label>
                    <textarea
                      rows="2"
                      value={prdData.comunicacao_emergencia}
                      onChange={(e) => setPrdData({...prdData, comunicacao_emergencia: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 border-t border-slate-100 dark:border-slate-850 pt-3">
                    <label className="text-[10px] font-bold text-purple-500 uppercase">
                      Protocolo de Ativação de War Room (Sala de Guerra) *
                    </label>
                    <textarea
                      rows="3"
                      value={prdData.procedimento_war_room}
                      onChange={(e) => setPrdData({...prdData, procedimento_war_room: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA: DIAGRAMA DR */}
            {editorTab === 'diagrama' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                    Topologia de Failover e Contingência
                  </h4>
                  <button
                    onClick={startFailoverSimulation}
                    disabled={drStatus === 'failing-over'}
                    className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Play className="w-3 h-3" /> Testar Chaveamento
                  </button>
                </div>

                <div className="h-48 bg-slate-950 rounded-xl relative overflow-hidden flex items-center justify-around p-4 border border-slate-900">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

                  {/* Usuários */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                      <span className="text-[9px] font-bold text-center">Usuários</span>
                    </div>
                  </div>

                  {/* Seta 1 */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-0.5 w-full bg-slate-800 relative">
                      <div className="absolute top-1/2 -translate-y-1/2 right-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-slate-800"></div>
                      <div className="absolute top-0 bottom-0 left-0 bg-indigo-500 w-4 rounded animate-pulse" style={{ animationDuration: '1.5s', left: '30%' }}></div>
                    </div>
                  </div>

                  {/* Ativo Principal */}
                  <div className="flex flex-col items-center z-10">
                    <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${
                      drStatus === 'normal' ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400' :
                      drStatus === 'failing-over' ? 'bg-amber-950/40 border-amber-500 text-amber-500 animate-pulse' :
                      'bg-slate-950 border-slate-900 text-slate-600'
                    }`}>
                      <Zap className="w-4 h-4" />
                      <span className="text-[8px] font-bold mt-1 uppercase">Principal</span>
                    </div>
                  </div>

                  {/* Seta 2 */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-0.5 w-full bg-slate-800 relative">
                      <div className="absolute top-1/2 -translate-y-1/2 right-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-slate-800"></div>
                      {drStatus === 'failed-over' && (
                        <div className="absolute top-0 bottom-0 left-0 bg-rose-500 w-4 rounded animate-pulse" style={{ animationDuration: '1.5s', left: '60%' }}></div>
                      )}
                    </div>
                  </div>

                  {/* Ativo Contingência */}
                  <div className="flex flex-col items-center z-10">
                    <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${
                      drStatus === 'failed-over' ? 'bg-rose-950/40 border-rose-500 text-rose-450 animate-pulse' : 'bg-slate-950 border-slate-900 text-slate-600'
                    }`}>
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-[8px] font-bold mt-1 uppercase">Backup DR</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              Salvar Versão do Plano
            </button>
          </div>

          {/* Lado Direito (1/3): Preview com Placeholders Substituídos + Riscos + Ativos */}
          <div className="space-y-6 text-xs">
            
            {/* Ativos e Riscos Vinculados */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                  Mapeamento de Riscos e Ativos
                </h4>
              </div>
              
              {/* Riscos */}
              <div className="space-y-2">
                <span className="text-[9px] text-slate-450 font-bold uppercase">Ameaças Identificadas (Geric)</span>
                {riscosDoProcesso.length > 0 ? (
                  <div className="space-y-1.5">
                    {riscosDoProcesso.map(r => (
                      <div key={r.id_risco} className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-200 dark:border-slate-850 flex justify-between items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{r.nome}</span>
                        <span className="text-[9px] bg-rose-50 dark:bg-rose-950 text-rose-500 px-1 rounded font-bold">
                          {r.impacto}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Sem riscos específicos mapeados.</p>
                )}
              </div>

              {/* Ativos */}
              <div className="space-y-2">
                <span className="text-[9px] text-slate-450 font-bold uppercase">Ativos e Sistemas (TI)</span>
                {currentProcess.ativos && currentProcess.ativos.length > 0 ? (
                  <div className="space-y-1.5">
                    {currentProcess.ativos.map(a => (
                      <div key={a.id_ativo} className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-200 dark:border-slate-850 flex justify-between items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{a.nome}</span>
                        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-500 px-1 rounded font-bold">
                          {a.tipo}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Nenhum ativo associado ao processo.</p>
                )}
              </div>
            </div>

            {/* Documento Gerado em tempo real */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-250 dark:border-slate-800/80 space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-850 pb-2">
                <h4 className="font-bold text-slate-800 dark:text-white text-[11px] uppercase tracking-wider">
                  Visualização do PCO (ISO 22301)
                </h4>
              </div>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 text-slate-750 dark:text-slate-350 leading-relaxed font-mono bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-900">
                <div>
                  <p className="text-[9px] font-bold text-indigo-500">ESTRATÉGIA:</p>
                  <p className="mt-1">{renderPlaceholders(pcoData.estrategia_recuperacao)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-indigo-500">CENÁRIO 1 - BLOQUEIO DE ACESSO:</p>
                  <p className="mt-1">{renderPlaceholders(pcoData.cenario_acesso)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-indigo-500">CENÁRIO 2 - INDISPONIBILIDADE SISTEMAS:</p>
                  <p className="mt-1">{renderPlaceholders(pcoData.cenario_sistemas)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-indigo-500">CENÁRIO 3 - FORNECEDORES:</p>
                  <p className="mt-1">{renderPlaceholders(pcoData.cenario_fornecedores)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-indigo-500">CENÁRIO 4 - PESSOAS:</p>
                  <p className="mt-1">{renderPlaceholders(pcoData.cenario_pessoas)}</p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-850 pt-2">
                  <p className="text-[9px] font-bold text-rose-500">ESCALONAMENTO DE CRISE:</p>
                  <p className="mt-1">{renderPlaceholders(pcoData.escalonamento_crise)}</p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-850 pt-2">
                  <p className="text-[9px] font-bold text-purple-500">WAR ROOM DE TECNOLOGIA (PRD - ISO 27031):</p>
                  <p className="mt-1">{renderPlaceholders(prdData.procedimento_war_room)}</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
