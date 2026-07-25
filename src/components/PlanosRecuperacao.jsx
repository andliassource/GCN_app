import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldAlert, Zap, RefreshCw, CheckCircle2, AlertTriangle, Play, HelpCircle, Layers, Users, Server, Briefcase, Download, Calendar, Trash2, Plus, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { pdfService } from '../services/pdfService';

export default function PlanosRecuperacao({ db }) {
  const { usuario, isAdmin, isGestor } = useAuth();
  const processosGerais = db.processosCriticos.list();
  const [ains] = useState(db.analiseImpactoNegocio.list());
  const [riscos] = useState(db.riscos.list());
  const configSistema = db.configSistema.get();

  // Filtrar processos pelo papel do usuário logado
  const processos = isAdmin()
    ? processosGerais
    : processosGerais.filter(p => p.id_gerencia === usuario?.id_gerencia);

  // Estados de controle
  const [selectedProcId, setSelectedProcId] = useState(processos[0]?.id_processo || processosGerais[0]?.id_processo || '');
  const [pcoData, setPcoData] = useState(null);
  const [prdData, setPrdData] = useState(null);

  // Garantir que selectedProcId mude se os processos do usuário mudarem
  useEffect(() => {
    if (!selectedProcId && processos.length > 0) {
      setSelectedProcId(processos[0].id_processo);
    }
  }, [processos]);
  
  // Aba ativa interna no editor de planos: 'cenarios', 'tecnico', 'diagrama'
  const [editorTab, setEditorTab] = useState('cenarios');

  // Estado para simulação do Failover no Diagrama DR
  const [drStatus, setDrStatus] = useState('normal'); 
  const [notification, setNotification] = useState(null);
  
  // Estados locais para Intervenientes e Acionamento de Emergência
  const [intervenientes, setIntervenientes] = useState([]);
  const [novoInterveniente, setNovoInterveniente] = useState({ nome: '', cargo: '', papel: '', email: '', telefone: '' });
  const [selectedIncidenteId, setSelectedIncidenteId] = useState('');

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
      setIntervenientes(db.intervenientes.listForProcesso(selectedProcId));
    }
  }, [selectedProcId]);

  const currentProcess = processos.find(p => p.id_processo === selectedProcId);
  const currentAin = ains.find(a => a.id_processo === selectedProcId);
  const riscosDoProcesso = riscos.filter(r => r.id_processo === selectedProcId);
  const incidentesAbertos = db.incidentes.list().filter(i => i.id_processo === selectedProcId && i.status_incidente === 'aberto');

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
      const parts = (v || '1.0.0').split('.').map(Number);
      parts[2] = (parts[2] || 0) + 1;
      if (parts[2] >= 10) { parts[2] = 0; parts[1] += 1; }
      return parts.join('.');
    };

    // Calcular data de validade com base na periodicidade (Anual: 1 ano / Bianual: 2 anos)
    const anosValidade = parseInt(pcoData.periodicidade_anos || 1);
    const dataVigencia = new Date();
    dataVigencia.setFullYear(dataVigencia.getFullYear() + anosValidade);
    const isoVigencia = dataVigencia.toISOString().split('T')[0];

    const updatedPco = db.planosContinuidade.save({
      ...pcoData,
      periodicidade_anos: anosValidade,
      vigente_ate: isoVigencia,
      data_proxima_revisao: isoVigencia,
      data_ultima_revisao: new Date().toISOString().split('T')[0],
      versao: incrementVersion(pcoData.versao || '1.0.0'),
      status_aprovacao: pcoData.status_aprovacao || 'Pendente'
    });

    const updatedPrd = db.planosRecuperacaoDesastres.save({
      ...prdData,
      vigente_ate: isoVigencia,
      data_proxima_revisao: isoVigencia
    });

    setPcoData(updatedPco);
    setPrdData(updatedPrd);
    
    db.revisoesAtualizacoes.create({
      id_pco: updatedPco.id_pco,
      id_prd: updatedPrd.id_prd,
      data_revisao: new Date().toISOString().split('T')[0],
      motivo: `Revisão do PCO/PRD (Periodicidade: ${anosValidade === 1 ? 'Anual' : 'Bianual'})`,
      atualizacao_realizada: `Atualização dos cenários e validade. Nova versão: ${updatedPco.versao}. Válido até: ${isoVigencia}.`
    });

    setNotification({
      type: 'success',
      text: `Plano salvo com sucesso! Validade ${anosValidade === 1 ? 'Anual (1 ano)' : 'Bianual (2 anos)'} até ${new Date(isoVigencia).toLocaleDateString('pt-BR')}. Nova versão: ${updatedPco.versao}.`
    });
  };

  const handleAddInterveniente = (e) => {
    e.preventDefault();
    if (!novoInterveniente.nome || !novoInterveniente.cargo || !novoInterveniente.papel || !novoInterveniente.telefone) {
      setNotification({ type: 'error', text: 'Preencha todos os campos obrigatórios (*) do interveniente.' });
      return;
    }
    db.intervenientes.create({
      id_processo: selectedProcId,
      ...novoInterveniente
    });
    setIntervenientes(db.intervenientes.listForProcesso(selectedProcId));
    setNovoInterveniente({ nome: '', cargo: '', papel: '', email: '', telefone: '' });
    setNotification({ type: 'success', text: 'Interveniente cadastrado com sucesso!' });
  };

  const handleDeleteInterveniente = (id) => {
    if (window.confirm('Remover este interveniente do plano?')) {
      db.intervenientes.delete(id);
      setIntervenientes(db.intervenientes.listForProcesso(selectedProcId));
      setNotification({ type: 'info', text: 'Interveniente removido do plano.' });
    }
  };

  const handleAcionarPlano = (e) => {
    e.preventDefault();
    if (!pcoData?.id_pco) return;

    const incId = selectedIncidenteId || 'Geral/Sem Incidente Associado';
    db.planosContinuidade.acionar(pcoData.id_pco, incId, usuario?.nome || 'Gestor GCN');
    
    // Disparar notificações de emergência
    const ints = db.intervenientes.listForProcesso(selectedProcId);
    ints.forEach(i => {
      db.notificacoes.create({
        tipo: 'acionamento_pco',
        titulo: `🚨 EMERGÊNCIA: PCO ACIONADO — ${currentProcess.nome}`,
        mensagem: `ATENÇÃO ${i.nome.toUpperCase()} (${i.papel}): O Plano de Continuidade ${pcoData.id_pco} foi acionado. Incidente: ${incId}. Por favor, inicie as ações descritas para o cenário correspondente.`,
        id_destino: currentProcess.id_gerencia,
        prioridade: 'critica',
        status: 'nao_lida',
        link_acao: 'planos'
      });
    });

    // Atualizar pcoData recarregando do banco
    const p = db.planosContinuidade.getForProcesso(selectedProcId);
    setPcoData(p);
    setSelectedIncidenteId('');
    
    setNotification({
      type: 'success',
      text: `🚨 Plano ${pcoData.id_pco} acionado com sucesso! Notificações críticas de emergência enviadas para os ${ints.length} intervenientes do plano.`
    });
  };

  const handleApplyTemplate = () => {
    if (!currentProcess) return;
    
    const rtoMeta = currentAin ? `${currentAin.RTO} min` : '15 min';

    // PCO Template
    const pcoTemplate = {
      estrategia_recuperacao: `### Cláusula 1.1 - Estratégia de Failover\nEm caso de interrupção operacional detectada, a equipe deverá acionar os protocolos de contingência em até 10 minutos.\n\n### Cláusula 1.2 - Reestabelecimento Operacional\nO restabelecimento do processo crítico deve cumprir rigorosamente o RTO Meta definido de ${rtoMeta}.`,
      responsabilidades: `A gerência executiva de ${currentProcess.id_gerencia} é responsável por coordenar a resposta de crise, mobilizar os intervenientes e reportar o status para a Geric e o Comitê de Crises.`,
      recursos_necessarios: `Acesso remoto seguro por VPN/MFA, equipamentos computacionais com certificação de segurança corporativa e documentação operacional dos sistemas de contingência.`,
      cenario_acesso: `### Protocolo de Trabalho Remoto Contingencial\nEm caso de indisponibilidade física das instalações da Gerência, os colaboradores deverão iniciar imediatamente o regime de teletrabalho doméstico, utilizando VPN corporativa conforme normativo de segurança.\nSe houver problemas locais de conectividade, a equipe deverá se deslocar para a unidade de contingência física definida pela administração: [INSERIR ENDEREÇO DA CONTINGÊNCIA FÍSICA].`,
      cenario_sistemas: `### Chaveamento para Contingência (DR/Failover)\nIdentificada indisponibilidade total dos sistemas primários por mais de ${rtoMeta} (conforme RTO Meta do BIA), a equipe de TI (Getic) iniciará o protocolo de chaveamento para a nuvem de contingência.\nAs transações pendentes deverão ser salvas em planilhas offline de contingência para posterior reprocessamento manual pós-restauração.`,
      cenario_fornecedores: `### Substituição de Provedores Críticos\nSe o fornecedor principal apresentar falha sem previsão de retorno, o gestor do contrato de canais acionará o provedor de contingência sob contrato de backup: [INSERIR FORNECEDOR ALTERNATIVO].\nA coordenação de suprimentos notificará formalmente o parceiro faltoso sobre a quebra de SLA estabelecida.`,
      cenario_pessoas: `### Matriz de Redundância e Substituição de Lideranças\nEm caso de ausência em massa da equipe (superando 30%), a liderança de contingência operacional será assumida pela escala definida:\n1. Liderança Titular do Processo\n2. Substituto Técnico: [INSERIR NOME DO SUBSTITUTO]\n3. Analista de Contingência Sênior`,
      escalonamento_crise: `Se a indisponibilidade exceder 15 minutos (RTO), o gerente da área escala o incidente imediatamente para o Comitê de Crise e para a Geric. Ata deliberativa e logs de acionamento tornam-se mandatórios.`
    };

    // PRD Template
    const prdTemplate = {
      procedimentos_restauracao: `1. Executar verificação de integridade nos logs de cibersegurança (Gesec).\n2. Restaurar snapshots automatizados mais recentes a partir do bucket de backup da AWS (RPO de 15 min).\n3. Redirecionar o tráfego de DNS corporativo para a região de contingência ativa.\n4. Validar conectividade fim a fim com a rede transacional.`,
      local_backup: `Servidor de backup em Nuvem AWS us-east-1 + Região Secundária em Alta Disponibilidade`,
      frequencia_backup: `A cada 15 minutos (Snapshots incrementais)`,
      comunicacao_emergencia: `Notificar canal de plantão SRE via PagerDuty e Teams. Enviar reporte imediato para o Gerente da área e Gesec.`,
      procedimento_war_room: `1. Declarar desastre técnico.\n2. Criar War Room corporativa 'War-Room-Crise-Tecnologia'.\n3. Convocar líderes de Getic, Geape e Gesec.\n4. Manter reuniões de status técnico a cada 15 minutos até a restauração.`
    };

    setPcoData(prev => ({ ...prev, ...pcoTemplate }));
    setPrdData(prev => ({ ...prev, ...prdTemplate }));
    setNotification({ type: 'success', text: 'Modelo padrão corporativo de cláusulas aplicado com sucesso! Lembre-se de salvar para persistir as alterações.' });
  };

  const exportarPDF = () => {
    const interv = db.intervenientes.listForProcesso(selectedProcId);
    const html = pdfService.htmlPCO(pcoData, currentProcess, currentAin, interv, configSistema);
    pdfService.exportar(`Plano PCO — ${currentProcess?.nome}`, html, {
      nome_empresa: configSistema.nome_empresa,
      logo_base64: configSistema.logo_base64,
      confidencialidade: pcoData?.nivel_confidencialidade?.toUpperCase() || 'RESTRITO',
      versao: pcoData?.versao || '1.0.0',
      autor: `Geric / ${currentProcess?.id_gerencia}`
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
            
            {/* Utilitários do Editor */}
            <div className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-850">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Ações de Facilitação Documental</span>
              </div>
              <button
                onClick={handleApplyTemplate}
                className="bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-650 dark:hover:bg-indigo-750 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                📝 Aplicar Modelo Corporativo Padrão
              </button>
            </div>

            {/* Navegação de Abas do Editor */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg gap-2 text-xs font-bold border border-slate-200 dark:border-slate-850">
              <button
                onClick={() => setEditorTab('cenarios')}
                className={`flex-1 py-2 text-center rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  editorTab === 'cenarios' ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Cenários (PCO)
              </button>
              <button
                onClick={() => setEditorTab('tecnico')}
                className={`flex-1 py-2 text-center rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  editorTab === 'tecnico' ? 'bg-white dark:bg-slate-900 text-purple-655 dark:text-purple-400 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Server className="w-3.5 h-3.5" /> Recuperação (PRD)
              </button>
              <button
                onClick={() => setEditorTab('diagrama')}
                className={`flex-1 py-2 text-center rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  editorTab === 'diagrama' ? 'bg-white dark:bg-slate-900 text-rose-650 dark:text-rose-400 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> Diagrama DR
              </button>
              <button
                onClick={() => setEditorTab('intervenientes')}
                className={`flex-1 py-2 text-center rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  editorTab === 'intervenientes' ? 'bg-white dark:bg-slate-900 text-teal-650 dark:text-teal-450 shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Intervenientes & Acionar
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

            {/* ABA: INTERVENIENTES E ACIONAMENTOS */}
            {editorTab === 'intervenientes' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-xs">
                
                {/* 1. Acionamento de Emergência */}
                <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                    <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">🚨 Painel de Acionamento de Emergência (ISO 22301)</span>
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-500 leading-relaxed font-medium">
                    Atenção: Ao acionar o plano de emergência, todos os intervenientes cadastrados receberão notificações críticas e alertas urgentes na central de notificações e canais integrados.
                  </p>
                  
                  <form onSubmit={handleAcionarPlano} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-rose-600 uppercase">Selecione o Incidente Gerador (Aberto) *</label>
                      <select
                        value={selectedIncidenteId}
                        onChange={(e) => setSelectedIncidenteId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-rose-300 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-rose-500"
                        required
                      >
                        <option value="">Selecione o incidente gerador...</option>
                        <option value="Acionamento Preventivo">Acionamento Geral Preventivo</option>
                        {incidentesAbertos.map(inc => (
                          <option key={inc.id_incidente} value={inc.id_incidente}>
                            {inc.id_incidente} - {inc.descricao.substring(0, 50)}...
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-lg text-xs transition-all uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" /> Acionar Plano
                    </button>
                  </form>
                </div>

                {/* 2. Lista e Cadastro de Intervenientes */}
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-teal-650 dark:text-teal-400 uppercase tracking-wider text-[11px]">
                      Intervenientes Mapeados no Plano
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lista */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {intervenientes.map(int => (
                        <div key={int.id_interveniente} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-850 flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-850 dark:text-slate-250 text-xs">{int.nome}</p>
                            <p className="text-[10px] text-slate-450">{int.cargo} | <strong className="text-slate-500">{int.papel}</strong></p>
                            <p className="text-[9px] text-slate-400">{int.email} | {int.telefone}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteInterveniente(int.id_interveniente)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                            title="Remover Interveniente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {intervenientes.length === 0 && (
                        <p className="text-slate-400 dark:text-slate-550 italic text-[11px]">
                          Nenhum interveniente cadastrado para este plano. Por favor, adicione contatos críticos de failover.
                        </p>
                      )}
                    </div>

                    {/* Form Cadastro */}
                    <form onSubmit={handleAddInterveniente} className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-[10px] uppercase">Cadastrar Interveniente de Failover</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Nome *</label>
                          <input
                            type="text"
                            value={novoInterveniente.nome}
                            onChange={(e) => setNovoInterveniente({...novoInterveniente, nome: e.target.value})}
                            placeholder="Nome Completo"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-850 dark:text-white"
                            required
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Cargo *</label>
                          <input
                            type="text"
                            value={novoInterveniente.cargo}
                            onChange={(e) => setNovoInterveniente({...novoInterveniente, cargo: e.target.value})}
                            placeholder="Ex: Supervisor TI"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-850 dark:text-white"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Papel no Plano *</label>
                        <input
                          type="text"
                          value={novoInterveniente.papel}
                          onChange={(e) => setNovoInterveniente({...novoInterveniente, papel: e.target.value})}
                          placeholder="Ex: Responsável por chaveamento do backup DNS"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-850 dark:text-white"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">E-mail</label>
                          <input
                            type="email"
                            value={novoInterveniente.email}
                            onChange={(e) => setNovoInterveniente({...novoInterveniente, email: e.target.value})}
                            placeholder="Email corporativo"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-850 dark:text-white"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Telefone *</label>
                          <input
                            type="text"
                            value={novoInterveniente.telefone}
                            onChange={(e) => setNovoInterveniente({...novoInterveniente, telefone: e.target.value})}
                            placeholder="DDD + Celular"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-850 dark:text-white"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-teal-650 hover:bg-teal-700 text-white font-bold py-2 rounded text-xs transition-colors cursor-pointer"
                      >
                        + Cadastrar Interveniente
                      </button>
                    </form>
                  </div>
                </div>

                {/* 3. Timeline / Logs de Acionamentos */}
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-855 pt-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                      Histórico e Logs de Acionamentos Anteriores
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    {pcoData.acionamentos && pcoData.acionamentos.length > 0 ? (
                      pcoData.acionamentos.map((ac, acIdx) => (
                        <div key={acIdx} className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-200 dark:border-slate-850 items-center">
                          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold text-xs">
                            🚨
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 dark:text-slate-250">Plano Acionado</p>
                            <p className="text-[10px] text-slate-450">Incidente Associado: <strong className="text-slate-650 dark:text-slate-350">{ac.id_incidente}</strong></p>
                            <p className="text-[9px] text-slate-400">Acionado por: {ac.acionado_por} | {new Date(ac.data).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 dark:text-slate-550 italic text-[11px]">
                        Nenhum acionamento emergencial registrado para este plano.
                      </p>
                    )}
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
