import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldAlert, Zap, RefreshCw, CheckCircle2, Copy, AlertTriangle, ArrowRight, Play } from 'lucide-react';

export default function PlanosRecuperacao({ db }) {
  const [processos] = useState(db.processosCriticos.list());
  const [ains] = useState(db.analiseImpactoNegocio.list());
  
  // Estados de controle
  const [selectedProcId, setSelectedProcId] = useState(processos[0]?.id_processo || '');
  const [pcoData, setPcoData] = useState(null);
  const [prdData, setPrdData] = useState(null);
  
  // Estado para simulação do Failover no Diagrama DR
  const [drStatus, setDrStatus] = useState('normal'); // 'normal', 'failing-over', 'failed-over'
  const [notification, setNotification] = useState(null);

  // Carregar dados quando o processo muda
  useEffect(() => {
    if (selectedProcId) {
      const p = db.planosContinuidade.getForProcesso(selectedProcId);
      const r = db.planosRecuperacaoDesastres.getForProcesso(selectedProcId);
      
      setPcoData(p || {
        id_processo: selectedProcId,
        estrategia_recuperacao: 'Em caso de queda no faturamento do sistema principal, reencaminhar requisições transacionais de {{PROCESSO_NOME}} para o gateway reserva. O tempo máximo tolerável para restauração é de {{MTDCN}} minutos.',
        responsabilidades: 'SRE e Engenharia acionam o script de chaveamento. Geric monitora a vigência de {{RTO}} minutos.',
        recursos_necessarios: 'Infraestrutura secundária ativa, banco com replicação sob SLA de RPO de {{RPO}} minutos.',
        versao: '1.0.0',
        status_aprovacao: 'Pendente'
      });

      setPrdData(r || {
        id_processo: selectedProcId,
        procedimentos_restauracao: '1. Verificar integridade de dados.\n2. Restaurar snapshot com perda máxima aceitável (RPO) de {{RPO}} minutos.\n3. Acionar failover DNS.\n4. Validar o processo {{PROCESSO_NOME}}.',
        local_backup: 'Azure Blob Storage (Criptografado Geo-redundante)',
        frequencia_backup: 'A cada {{RPO}} minutos',
        comunicacao_emergencia: 'Notificação PagerDuty para time DevOps, grupo Crise no Teams.'
      });

      setDrStatus('normal');
      setNotification(null);
    }
  }, [selectedProcId]);

  const currentProcess = processos.find(p => p.id_processo === selectedProcId);
  const currentAin = ains.find(a => a.id_processo === selectedProcId);

  // SUBSTITUIÇÃO DE PLACEHOLDERS (Requisito 4)
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

    // Incremento automático de versão
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
      status_aprovacao: 'Pendente' // resubmete para aprovação
    });

    const updatedPrd = db.planosRecuperacaoDesastres.save({
      ...prdData
    });

    setPcoData(updatedPco);
    setPrdData(updatedPrd);
    
    // Registra na auditoria (Módulo 6/7)
    db.revisoesAtualizacoes.create({
      id_pco: updatedPco.id_pco,
      id_prd: updatedPrd.id_prd,
      data_revisao: new Date().toISOString().split('T')[0],
      motivo: 'Atualização do plano e procedimentos de backup',
      atualizacao_realizada: `Atualização de parâmetros e procedimentos. Nova versão do PCO: ${updatedPco.versao}.`
    });

    setNotification({
      type: 'success',
      text: `Plano atualizado com sucesso para a versão ${updatedPco.versao}! Um log de revisão foi gerado e enviado para auditoria.`
    });
  };

  // Simular Failover DR
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
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Selecione o Processo Crítico</h3>
            <p className="text-[10px] text-slate-400">Edite os planos PCO/PRD e visualize o fluxo de Disaster Recovery.</p>
          </div>
        </div>
        <select
          value={selectedProcId}
          onChange={(e) => setSelectedProcId(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-700 dark:text-slate-350 focus:outline-indigo-500 font-bold min-w-[280px]"
        >
          {processos.map(p => (
            <option key={p.id_processo} value={p.id_processo}>
              {p.id_processo} - {p.nome} ({p.criticidade})
            </option>
          ))}
        </select>
      </div>

      {notification && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {notification.text}
        </div>
      )}

      {/* Editor do Plano com Placeholders Dinâmicos */}
      {pcoData && prdData && currentProcess && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Lado Esquerdo: Editores e Parâmetros */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider text-indigo-650 dark:text-indigo-400">
                  Plano de Continuidade de Operações (PCO)
                </h4>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold">
                  Versão {pcoData.versao} ({pcoData.status_aprovacao})
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Estratégia de Recuperação</label>
                  <textarea
                    rows="3"
                    value={pcoData.estrategia_recuperacao}
                    onChange={(e) => setPcoData({...pcoData, estrategia_recuperacao: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Matriz de Responsabilidade (GCN)</label>
                  <textarea
                    rows="2"
                    value={pcoData.responsabilidades}
                    onChange={(e) => setPcoData({...pcoData, responsabilidades: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Recursos Necessários</label>
                  <textarea
                    rows="2"
                    value={pcoData.recursos_necessarios}
                    onChange={(e) => setPcoData({...pcoData, recursos_necessarios: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider text-purple-650 dark:text-purple-400">
                  Plano de Recuperação de Desastres (PRD)
                </h4>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Procedimentos de Restauração Técnica</label>
                  <textarea
                    rows="3"
                    value={prdData.procedimentos_restauracao}
                    onChange={(e) => setPrdData({...prdData, procedimentos_restauracao: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Local dos Backups</label>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Comunicação em Emergência</label>
                  <textarea
                    rows="2"
                    value={prdData.comunicacao_emergencia}
                    onChange={(e) => setPrdData({...prdData, comunicacao_emergencia: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleSave}
                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                Salvar Planos e Atualizar Versão (Commit de GCN)
              </button>
            </div>
          </div>

          {/* Lado Direito: Preview Formatado (Placeholders Substituídos) + Diagrama DR */}
          <div className="space-y-6">
            
            {/* Visualizador de Placeholders Substituídos */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-xl border border-slate-250 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-850 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                  Visualização em Tempo Real (Documento Gerado)
                </h4>
              </div>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 text-xs text-slate-750 dark:text-slate-350 leading-relaxed font-mono bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-900">
                <div>
                  <p className="text-[10px] font-bold text-indigo-500">ESTRATÉGIA DE RECUPERAÇÃO:</p>
                  <p className="mt-1">{renderPlaceholders(pcoData.estrategia_recuperacao)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-500">RESPONSABILIDADES:</p>
                  <p className="mt-1">{renderPlaceholders(pcoData.responsabilidades)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-500">RECURSOS:</p>
                  <p className="mt-1">{renderPlaceholders(pcoData.recursos_necessarios)}</p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-850 pt-2">
                  <p className="text-[10px] font-bold text-purple-500">PROCEDIMENTOS DE RESTAURAÇÃO TÉCNICA:</p>
                  <p className="mt-1 whitespace-pre-line">{renderPlaceholders(prdData.procedimentos_restauracao)}</p>
                </div>
              </div>
            </div>

            {/* Painel do Diagrama DR (Requisito 4) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                  Diagrama Visual de Disaster Recovery (DR)
                </h4>
                <button
                  onClick={startFailoverSimulation}
                  disabled={drStatus === 'failing-over'}
                  className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Play className="w-3 h-3" /> Simular Failover
                </button>
              </div>

              {/* Grid Canvas do Diagrama DR */}
              <div className="h-44 bg-slate-950 rounded-xl relative overflow-hidden flex items-center justify-around p-4 border border-slate-900">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

                {/* Nó 1: Usuários / Cliente */}
                <div className="flex flex-col items-center z-10">
                  <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                    <span className="text-[10px] font-bold text-center">Usuários</span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">Tráfego</span>
                </div>

                {/* Seta 1 */}
                <div className="flex-1 flex items-center justify-center relative">
                  <div className={`h-0.5 w-full bg-slate-800 relative`}>
                    <div className={`absolute top-1/2 -translate-y-1/2 right-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-slate-800`}></div>
                    {/* Linha animada do tráfego */}
                    <div className="absolute top-0 bottom-0 left-0 bg-indigo-500 w-4 rounded animate-pulse" style={{ animationDuration: '1.5s', left: '30%' }}></div>
                  </div>
                </div>

                {/* Nó 2: Servidor Principal (AWS/Stone) */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-16 h-16 rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${
                    drStatus === 'normal' ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/25' :
                    drStatus === 'failing-over' ? 'bg-amber-950/40 border-amber-500 text-amber-500 animate-pulse' :
                    'bg-slate-950 border-slate-900 text-slate-600'
                  }`}>
                    <Zap className="w-4 h-4" />
                    <span className="text-[8px] font-bold mt-1 uppercase truncate max-w-full">Principal</span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">Ativo</span>
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

                {/* Nó 3: Servidor Contingência (Azure Backup) */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-16 h-16 rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${
                    drStatus === 'failed-over' ? 'bg-rose-950/40 border-rose-500 text-rose-450 ring-2 ring-rose-500/25 animate-pulse' : 'bg-slate-950 border-slate-900 text-slate-600'
                  }`}>
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-[8px] font-bold mt-1 uppercase">DR Azure</span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">
                    {drStatus === 'failed-over' ? 'Conectado (Failover)' : 'Prontidão'}
                  </span>
                </div>

              </div>
              <p className="text-[10px] text-slate-400 text-center leading-normal">
                {drStatus === 'normal' && 'Status: Tráfego redirecionado para a infraestrutura principal.'}
                {drStatus === 'failing-over' && 'Status: Executando scripts de failover do banco de dados e mudando DNS...'}
                {drStatus === 'failed-over' && 'Status: Failover bem-sucedido! Operações rodando em Azure Contingência.'}
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
