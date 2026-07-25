import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, ShieldAlert, Zap, RefreshCw, CheckCircle2, AlertTriangle,
  Play, Layers, Users, Server, Briefcase, Download, Calendar,
  Trash2, Plus, FileText, Sparkles, Building, Link, Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { pdfService } from '../services/pdfService';

export default function PlanosRecuperacao({ db }) {
  const { usuario, isAdmin } = useAuth();
  const processosGerais = db.processosCriticos.list();
  const [ains] = useState(db.analiseImpactoNegocio.list());
  const [riscos] = useState(db.riscos.list());
  const [todosContratos] = useState(db.contratos.list());
  const configSistema = db.configSistema.get();

  const processos = isAdmin()
    ? processosGerais
    : processosGerais.filter(p => p.id_gerencia === usuario?.id_gerencia);

  const [selectedProcId, setSelectedProcId] = useState(processos[0]?.id_processo || processosGerais[0]?.id_processo || '');
  const [pcoData, setPcoData] = useState(null);
  const [prdData, setPrdData] = useState(null);
  const [editorTab, setEditorTab] = useState('cenarioA');
  const [drStatus, setDrStatus] = useState('normal');
  const [notification, setNotification] = useState(null);
  const [intervenientes, setIntervenientes] = useState([]);
  const [novoInterveniente, setNovoInterveniente] = useState({ nome: '', cargo: '', papel: '', email: '', telefone: '' });
  const [selectedIncidenteId, setSelectedIncidenteId] = useState('');

  // Estados Estruturados de Cenários
  const [scenarioA, setScenarioA] = useState({ pctMinimo: 30, pctCritico: 60, localContingencia: '', protocolo: '' });
  const [ativosContingencia, setAtivosContingencia] = useState([]);
  const [scenarioC, setScenarioC] = useState({ fornecedorPrincipal: '', fornecedorAlternativo: '', contato_fiscal: '', protocolo: '' });
  const [scenarioD, setScenarioD] = useState({ pctDegradado: 30, pctCritico: 60, acaoDegradado: '', acaoCritica: '', substituto: '' });

  useEffect(() => {
    if (!selectedProcId && processos.length > 0) {
      setSelectedProcId(processos[0].id_processo);
    }
  }, [processos]);

  const currentProcess = useMemo(() => (processos.length > 0 ? processos : processosGerais).find(p => p.id_processo === selectedProcId), [processos, processosGerais, selectedProcId]);
  const currentAin = useMemo(() => ains.find(a => a.id_processo === selectedProcId), [ains, selectedProcId]);
  const riscosDoProcesso = useMemo(() => riscos.filter(r => r.id_processo === selectedProcId), [riscos, selectedProcId]);
  const contratoDoProcesso = useMemo(() => {
    if (!currentProcess?.id_contrato) return null;
    return todosContratos.find(c => c.id_contrato === currentProcess.id_contrato) || null;
  }, [currentProcess, todosContratos]);

  useEffect(() => {
    if (!selectedProcId || !currentProcess) return;

    const ativos = currentProcess?.ativos || [];
    const rto = currentAin?.RTO || 60;
    const rpo = currentAin?.RPO || 15;
    const mtdcn = currentAin?.MTDCN || 120;
    const procNome = currentProcess?.nome || 'PROCESSO';
    const gerSigla = currentProcess?.id_gerencia || 'GERÊNCIA';

    const defaultPco = {
      id_processo: selectedProcId,
      estrategia_recuperacao: `Em caso de interrupção operacional detectada no processo ${procNome} (${gerSigla}), a equipe deverá:\n1. Notificar imediatamente os intervenientes do plano dentro dos primeiros 10 minutos.\n2. Acionar o protocolo de contingência específico para o cenário identificado (A/B/C/D).\n3. Restabelecer a operação dentro do RTO Meta de ${rto} minutos conforme BIA/AIN.\n4. Registrar todas as ações no sistema GCN para rastreabilidade (ISO 22301 §10).`,
      responsabilidades: `A gerência executiva de ${gerSigla} é responsável por coordenar a resposta de crise, mobilizar os intervenientes e reportar o status para a GERIC e o Comitê de Crises a cada 15 minutos até a normalização.`,
      recursos_necessarios: `VPN corporativa com MFA ativo, equipamentos homologados de contingência, documentação operacional dos sistemas, contatos do plantão técnico (Getic) e do fiscal do contrato.`,
      cenario_acesso: `Bloqueio predial: 100% da equipe crítica migra para home office via VPN/MFA.\nFalha de HO: Deslocar para unidade de contingência física.\nModo degradado (>${30}% ausência): Acionar substitutos conforme escalonamento.\nModo crítico (>${60}% ausência): Redistribuir tarefas e acionar reforço de outra gerência via Comitê.`,
      cenario_sistemas: ativos.length > 0
        ? ativos.map(a => `Passo: Validar indisponibilidade do ${a.nome} (${a.tipo}). Acionar Getic. Chavear para contingência.`).join('\n')
        : `Passo 1: Identificar sistema(s) afetado(s).\nPasso 2: Notificar Getic pelo canal de plantão.\nPasso 3: Acionar contingência do sistema.\nPasso 4: Confirmar restauração dentro do RTO de ${rto} min.`,
      cenario_fornecedores: contratoDoProcesso
        ? `Fornecedor principal: ${contratoDoProcesso.nome}.\nContato fiscal: [INSERIR CONTATO].\n⚠️ ATENÇÃO — PONTO DE FALHA ÚNICO: Em caso de paralisação, acionar o fornecedor alternativo: [INSERIR ALTERNATIVO].\nRecomendação GERIC: Estratégia Multi-Vendor na próxima licitação.`
        : `Este processo não possui contrato de fornecedor externo vinculado. Verificar dependências de terceiros.`,
      cenario_pessoas: `Modo Degradado (>${30}% ausência): Redistribuir atividades críticas.\nModo Crítico (>${60}% ausência por greve/contágio): Acionar reforço de analistas de outras gerências. Ativar turnos de 12 horas.\nSubstituto de Liderança: [INSERIR NOME DO SUBSTITUTO].`,
      escalonamento_crise: `Se a interrupção ultrapassar ${mtdcn} minutos (MTDCN), escalonar IMEDIATAMENTE para:\n1. Comitê de Crise corporativo (convocação pelo Gemac).\n2. GERIC para monitoramento e apoio metodológico.\n3. Diretoria responsável para decisões estratégicas.\nAta deliberativa e logs tornam-se mandatórios (ISO 22301 §8.4.4).`,
      versao: '1.0.0',
      status_aprovacao: 'Pendente'
    };

    const defaultPrd = {
      id_processo: selectedProcId,
      procedimentos_restauracao: ativos.length > 0
        ? ativos.map((a, i) => `${i + 1}. Restaurar ${a.nome} (${a.tipo}): Validar integridade de logs e snapshots. RPO máximo de ${rpo} minutos.`).join('\n')
        : `1. Validar logs de integridade.\n2. Restaurar snapshots mais recentes (RPO ${rpo} min).\n3. Redirecionar tráfego DNS para ambiente DR.\n4. Confirmar conectividade.`,
      local_backup: `Cloud Storage geo-redundante (região primária + DR)`,
      frequencia_backup: `A cada ${rpo} minutos (snapshots incrementais)`,
      comunicacao_emergencia: `Canal PagerDuty/Teams Plantão SRE. Notificação imediata ao Gerente de Área e à GETIC.`,
      procedimento_war_room: `1. Declarar desastre técnico formalmente (Gerente da Área + GETIC).\n2. Criar War Room corporativa: "War-Room-Crise-${gerSigla}".\n3. Convocar líderes de GETIC, GEAPE e GESEC.\n4. Status técnico a cada 15 minutos até restauração.\n5. Registrar todas as decisões e acionamentos no GCN.`
    };

    const p = db.planosContinuidade.getForProcesso(selectedProcId);
    const r = db.planosRecuperacaoDesastres.getForProcesso(selectedProcId);

    setPcoData(p ? { ...defaultPco, ...p } : defaultPco);
    setPrdData(r ? { ...defaultPrd, ...r } : defaultPrd);

    const existingPco = p || defaultPco;

    setScenarioA({
      pctMinimo: existingPco.pct_minimo || 30,
      pctCritico: existingPco.pct_critico || 60,
      localContingencia: existingPco.local_contingencia || '',
      protocolo: existingPco.cenario_acesso || defaultPco.cenario_acesso
    });

    const ativosInit = (currentProcess?.ativos || []).map(a => ({
      id_ativo: a.id_ativo,
      nome: a.nome,
      tipo: a.tipo,
      linkDR: '',
      procedimento: `1. Validar indisponibilidade do ${a.nome}.\n2. Contatar Getic (plantão técnico).\n3. Chavear para site DR.\n4. Confirmar operação e emitir comunicado.`,
      rtoAtivo: rto,
      rpoAtivo: rpo
    }));

    if (p?.ativos_contingencia_json) {
      try {
        const saved = JSON.parse(p.ativos_contingencia_json);
        const merged = ativosInit.map(a => {
          const savedAtivo = saved.find(s => s.id_ativo === a.id_ativo);
          return savedAtivo ? { ...a, ...savedAtivo } : a;
        });
        setAtivosContingencia(merged);
      } catch { setAtivosContingencia(ativosInit); }
    } else {
      setAtivosContingencia(ativosInit);
    }

    setScenarioC({
      fornecedorPrincipal: contratoDoProcesso?.nome || existingPco.fornecedor_principal || '',
      fornecedorAlternativo: existingPco.fornecedor_alternativo || '',
      contato_fiscal: existingPco.contato_fiscal || '',
      protocolo: existingPco.cenario_fornecedores || defaultPco.cenario_fornecedores
    });

    setScenarioD({
      pctDegradado: existingPco.pct_degradado || 30,
      pctCritico: existingPco.pct_critico_pessoas || 60,
      acaoDegradado: existingPco.acao_degradado || `Redistribuir atividades críticas entre os presentes e reduzir escopo ao mínimo essencial.`,
      acaoCritica: existingPco.acao_critica || `Acionar reforço de analistas de outras gerências. Ativar turnos de 12h. Comunicar Comitê de Crise.`,
      substituto: existingPco.substituto_lideranca || ''
    });

    setDrStatus('normal');
    setNotification(null);
    setIntervenientes(db.intervenientes.listForProcesso(selectedProcId));
  }, [selectedProcId]);

  const renderPlaceholders = (text) => {
    if (!text || !currentProcess) return text || '';
    return text
      .replace(/{{PROCESSO_NOME}}/g, currentProcess.nome)
      .replace(/{{CRITICIDADE}}/g, currentProcess.criticidade)
      .replace(/{{RTO}}/g, currentAin ? `${currentAin.RTO} min` : 'N/A')
      .replace(/{{RPO}}/g, currentAin ? `${currentAin.RPO} min` : 'N/A')
      .replace(/{{MTDCN}}/g, currentAin ? `${currentAin.MTDCN} min` : 'N/A');
  };

  const serializeScenarios = () => {
    const ativosText = ativosContingencia.map((a, i) =>
      `Sistema ${i + 1}: ${a.nome} (${a.tipo})\n  RTO: ${a.rtoAtivo} min | RPO: ${a.rpoAtivo} min\n  Link DR: ${a.linkDR || '[PREENCHER LINK DR]'}\n  Procedimento:\n${a.procedimento}`
    ).join('\n\n');

    const cenario_acesso = `Local de Contingência Física: ${scenarioA.localContingencia || '[INSERIR ENDEREÇO]'}\nModo Degradado (≥${scenarioA.pctMinimo}% ausência): Acionar protocolo de home office.\nModo Crítico (≥${scenarioA.pctCritico}% ausência): Acionar unidade de contingência.\n\n${scenarioA.protocolo}`;
    const cenario_sistemas = ativosContingencia.length > 0 ? ativosText : (pcoData?.cenario_sistemas || '');
    const cenario_fornecedores = `Fornecedor Principal: ${scenarioC.fornecedorPrincipal || '[NÃO CADASTRADO]'}\nContato Fiscal: ${scenarioC.contato_fiscal || '[INSERIR CONTATO]'}\nFornecedor Alternativo: ${scenarioC.fornecedorAlternativo || '[DEFINIR ALTERNATIVO]'}\n\n${scenarioC.protocolo}`;
    const cenario_pessoas = `Modo Degradado (≥${scenarioD.pctDegradado}% ausência):\n${scenarioD.acaoDegradado}\n\nModo Crítico (≥${scenarioD.pctCritico}% ausência):\n${scenarioD.acaoCritica}\n\nSubstituto de Liderança: ${scenarioD.substituto || '[INSERIR NOME]'}`;

    return {
      cenario_acesso, cenario_sistemas, cenario_fornecedores, cenario_pessoas,
      pct_minimo: scenarioA.pctMinimo,
      pct_critico: scenarioA.pctCritico,
      local_contingencia: scenarioA.localContingencia,
      pct_degradado: scenarioD.pctDegradado,
      pct_critico_pessoas: scenarioD.pctCritico,
      acao_degradado: scenarioD.acaoDegradado,
      acao_critica: scenarioD.acaoCritica,
      substituto_lideranca: scenarioD.substituto,
      fornecedor_principal: scenarioC.fornecedorPrincipal,
      fornecedor_alternativo: scenarioC.fornecedorAlternativo,
      contato_fiscal: scenarioC.contato_fiscal,
      ativos_contingencia_json: JSON.stringify(ativosContingencia)
    };
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

    const anosValidade = parseInt(pcoData.periodicidade_anos || 1);
    const dataVigencia = new Date();
    dataVigencia.setFullYear(dataVigencia.getFullYear() + anosValidade);
    const isoVigencia = dataVigencia.toISOString().split('T')[0];
    const serialized = serializeScenarios();

    const updatedPco = db.planosContinuidade.save({
      ...pcoData,
      ...serialized,
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
      atualizacao_realizada: `Atualização dos cenários estruturados e validade. Nova versão: ${updatedPco.versao}. Válido até: ${isoVigencia}.`
    });

    setNotification({ type: 'success', text: `✅ Plano salvo! Versão ${updatedPco.versao} válida até ${new Date(isoVigencia).toLocaleDateString('pt-BR')}.` });
  };

  const handleAddInterveniente = (e) => {
    e.preventDefault();
    if (!novoInterveniente.nome || !novoInterveniente.cargo || !novoInterveniente.papel || !novoInterveniente.telefone) {
      setNotification({ type: 'error', text: 'Preencha todos os campos obrigatórios (*) do interveniente.' });
      return;
    }
    db.intervenientes.create({ id_processo: selectedProcId, ...novoInterveniente });
    setIntervenientes(db.intervenientes.listForProcesso(selectedProcId));
    setNovoInterveniente({ nome: '', cargo: '', papel: '', email: '', telefone: '' });
    setNotification({ type: 'success', text: 'Interveniente cadastrado com sucesso!' });
  };

  const handleDeleteInterveniente = (id) => {
    if (window.confirm('Remover este interveniente do plano?')) {
      db.intervenientes.delete(id);
      setIntervenientes(db.intervenientes.listForProcesso(selectedProcId));
    }
  };

  const handleAcionarPlano = (e) => {
    e.preventDefault();
    if (!pcoData?.id_pco) return;
    const incId = selectedIncidenteId || 'Geral/Sem Incidente Associado';
    db.planosContinuidade.acionar(pcoData.id_pco, incId, usuario?.nome || 'Gestor GCN');
    const ints = db.intervenientes.listForProcesso(selectedProcId);
    ints.forEach(i => {
      db.notificacoes.create({
        tipo: 'acionamento_pco',
        titulo: `🚨 EMERGÊNCIA: PCO ACIONADO — ${currentProcess.nome}`,
        mensagem: `ATENÇÃO ${i.nome.toUpperCase()} (${i.papel}): O Plano de Continuidade ${pcoData.id_pco} foi acionado. Incidente: ${incId}. Inicie as ações descritas para o cenário correspondente.`,
        id_destino: currentProcess.id_gerencia,
        prioridade: 'critica',
        status: 'nao_lida',
        link_acao: 'planos'
      });
    });
    const p = db.planosContinuidade.getForProcesso(selectedProcId);
    setPcoData(p);
    setSelectedIncidenteId('');
    setNotification({ type: 'success', text: `🚨 Plano ${pcoData.id_pco} acionado! Notificações enviadas para ${ints.length} intervenientes.` });
  };

  const exportarPDF = () => {
    const serialized = serializeScenarios();
    const pcoParaPDF = { ...pcoData, ...serialized };
    const interv = db.intervenientes.listForProcesso(selectedProcId);
    const html = pdfService.htmlPCO(pcoParaPDF, currentProcess, currentAin, interv, configSistema, ativosContingencia, scenarioC, scenarioD);
    pdfService.exportar(`PCO — ${currentProcess?.nome}`, html, {
      nome_empresa: configSistema.nome_empresa,
      logo_base64: configSistema.logo_base64,
      confidencialidade: pcoData?.nivel_confidencialidade?.toUpperCase() || 'RESTRITO',
      versao: pcoData?.versao || '1.0.0',
      autor: `GERIC / ${currentProcess?.id_gerencia}`
    });
  };

  const startFailoverSimulation = () => {
    setDrStatus('failing-over');
    setTimeout(() => setDrStatus('failed-over'), 2000);
  };

  const incidentesAbertos = db.incidentes.list().filter(i => i.id_processo === selectedProcId && i.status_incidente === 'aberto');

  const ic = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500";
  const tc = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500 leading-relaxed";
  const lc = "text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1";

  const SuggestBtn = ({ onClick }) => (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-950 px-2 py-0.5 rounded transition-all">
      <Sparkles className="w-3 h-3" /> Sugerir Texto
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Seletor de Processo */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Editor Inteligente de Planos de Continuidade</h3>
            <p className="text-[10px] text-slate-400">PCO (ISO 22301) e PRD (ISO 27031) — Cenários estruturados com dados reais do processo.</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          {currentProcess?.gerencia && (
            <div className="flex flex-col items-end text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Gerência</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentProcess.gerencia.sigla}</span>
            </div>
          )}
          <select
            value={selectedProcId}
            onChange={(e) => setSelectedProcId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-xs font-bold min-w-[280px] focus:outline-indigo-500"
          >
            {(processos.length > 0 ? processos : processosGerais).map(p => (
              <option key={p.id_processo} value={p.id_processo}>{p.id_processo} - {p.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-50/50 border-emerald-500/20 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' :
          notification.type === 'error' ? 'bg-rose-50/50 border-rose-500/20 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400' :
          'bg-indigo-50/50 border-indigo-500/20 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
          {notification.text}
        </div>
      )}

      {pcoData && prdData && currentProcess && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Lado Esquerdo (2/3) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Config Geral do Plano */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> Configuração Geral do Plano
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">v{pcoData.versao}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${pcoData.status_aprovacao === 'Aprovado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{pcoData.status_aprovacao}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className={lc}>Status de Aprovação</label>
                  <select value={pcoData.status_aprovacao || 'Pendente'} onChange={(e) => setPcoData({ ...pcoData, status_aprovacao: e.target.value })} className={ic}>
                    <option value="Pendente">Pendente</option>
                    <option value="Em Revisão">Em Revisão</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Vencido">Vencido</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lc}>Periodicidade de Revisão</label>
                  <select value={pcoData.periodicidade_anos || 1} onChange={(e) => setPcoData({ ...pcoData, periodicidade_anos: parseInt(e.target.value) })} className={ic}>
                    <option value={1}>Anual (ISO 22301)</option>
                    <option value={2}>Bianual</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={lc}>Confidencialidade</label>
                  <select value={pcoData.nivel_confidencialidade || 'restrito'} onChange={(e) => setPcoData({ ...pcoData, nivel_confidencialidade: e.target.value })} className={ic}>
                    <option value="restrito">Restrito</option>
                    <option value="confidencial">Confidencial</option>
                    <option value="secreto">Secreto</option>
                    <option value="publico">Público</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Estratégia Geral */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <label className={lc + " mb-0"}><Zap className="w-3.5 h-3.5 text-indigo-500" /> Estratégia Geral de Recuperação (ISO 22301 §8.4)</label>
                <SuggestBtn onClick={() => setPcoData({ ...pcoData, estrategia_recuperacao: `Em caso de interrupção operacional detectada no processo ${currentProcess.nome} (${currentProcess.id_gerencia}), a equipe deverá:\n1. Notificar imediatamente os intervenientes do plano dentro dos primeiros 10 minutos.\n2. Acionar o protocolo de contingência específico para o cenário identificado (A/B/C/D).\n3. Restabelecer a operação dentro do RTO Meta de ${currentAin?.RTO || 60} minutos conforme BIA/AIN aprovado.\n4. Registrar todas as ações, decisões e comunicados no sistema GCN para rastreabilidade mandatória (ISO 22301 §10).` })} />
              </div>
              <textarea rows="4" value={pcoData.estrategia_recuperacao || ''} onChange={(e) => setPcoData({ ...pcoData, estrategia_recuperacao: e.target.value })} className={tc} placeholder="Descreva a estratégia geral de recuperação..." />
            </div>

            {/* Tabs de Cenários */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl gap-1 text-xs font-bold border border-slate-200 dark:border-slate-800 overflow-x-auto">
              {[
                { id: 'cenarioA', label: 'A — Acesso/HO', color: 'text-blue-500' },
                { id: 'cenarioB', label: 'B — Sistemas/TI', color: 'text-purple-500' },
                { id: 'cenarioC', label: 'C — Fornecedores', color: 'text-orange-500' },
                { id: 'cenarioD', label: 'D — Pessoas', color: 'text-teal-500' },
                { id: 'escalonamento', label: 'Escalonamento', color: 'text-rose-500' },
                { id: 'prd', label: 'PRD (ISO 27031)', color: 'text-indigo-500' },
                { id: 'intervenientes', label: 'Intervenientes', color: 'text-slate-500' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setEditorTab(tab.id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${editorTab === tab.id ? `bg-white dark:bg-slate-900 ${tab.color} shadow-sm` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* CENÁRIO A */}
            {editorTab === 'cenarioA' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-blue-600 dark:text-blue-400 text-[11px] uppercase tracking-wider">Cenário A — Bloqueio de Acesso Predial / Home Office</h4>
                    <p className="text-slate-400 mt-0.5 text-[10px]">Protocolo para indisponibilidade física das instalações ou falha de conectividade domiciliar.</p>
                  </div>
                  <SuggestBtn onClick={() => setScenarioA(prev => ({ ...prev, protocolo: `FASE 1 — BLOQUEIO PREDIAL:\n1. Declarar situação de indisponibilidade ao Gerente e à GERIC em até 15 minutos.\n2. Ativar VPN corporativa com MFA para TODA a equipe crítica (${currentProcess.nome}).\n3. Confirmar conectividade de cada membro via Teams/WhatsApp corporativo.\n\nFASE 2 — FALHA DE HOME OFFICE:\n4. Se algum membro não conectar em 30 min, encaminhá-lo para: ${prev.localContingencia || '[INSERIR ENDEREÇO]'}.\n5. Redistribuir temporariamente suas atividades prioritárias.\n\nFASE 3 — MODO DEGRADADO (≥${prev.pctMinimo}% ausência):\n6. Acionar lista de substitutos (ver Cenário D).\n7. Reduzir escopo ao mínimo operacional essencial.\n\nFASE 4 — MODO CRÍTICO (≥${prev.pctCritico}% ausência):\n8. Escalonar para Comitê de Crise (ver Cenário Escalonamento).` }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className={lc}>% Mínimo Operacional</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="100" value={scenarioA.pctMinimo} onChange={(e) => setScenarioA({ ...scenarioA, pctMinimo: parseInt(e.target.value) || 30 })} className={ic + " font-bold text-amber-600"} />
                      <span className="text-slate-400">%</span>
                    </div>
                    <p className="text-[9px] text-slate-400">Abaixo: modo degradado</p>
                  </div>
                  <div className="space-y-1">
                    <label className={lc}>% Crítico (Greve/Epidemia)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="100" value={scenarioA.pctCritico} onChange={(e) => setScenarioA({ ...scenarioA, pctCritico: parseInt(e.target.value) || 60 })} className={ic + " font-bold text-rose-600"} />
                      <span className="text-slate-400">%</span>
                    </div>
                    <p className="text-[9px] text-slate-400">Acima: acionar Comitê de Crise</p>
                  </div>
                  <div className="space-y-1">
                    <label className={lc}><Building className="w-3 h-3" /> Local de Contingência Física</label>
                    <input type="text" value={scenarioA.localContingencia} onChange={(e) => setScenarioA({ ...scenarioA, localContingencia: e.target.value })} className={ic} placeholder="Endereço da unidade de contingência..." />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={lc}>Protocolo de Resposta (Passo a Passo)</label>
                  <textarea rows="9" value={scenarioA.protocolo} onChange={(e) => setScenarioA({ ...scenarioA, protocolo: e.target.value })} className={tc} placeholder="Descreva o protocolo passo a passo para este cenário..." />
                </div>
              </div>
            )}

            {/* CENÁRIO B */}
            {editorTab === 'cenarioB' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="font-bold text-purple-600 dark:text-purple-400 text-[11px] uppercase tracking-wider">Cenário B — Indisponibilidade de Sistemas e TI</h4>
                  <p className="text-slate-400 mt-0.5 text-[10px]">Procedimentos de failover por sistema vinculado ao processo. RTO/RPO individuais por ativo.</p>
                </div>
                {ativosContingencia.length === 0 ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400">
                    <p className="font-bold">⚠️ Nenhum ativo/sistema vinculado a este processo.</p>
                    <p className="text-[10px] mt-1">Acesse <strong>Processos Críticos</strong> e vincule os sistemas de TI a este processo para habilitar o editor por sistema.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ativosContingencia.map((ativo, idx) => (
                      <div key={ativo.id_ativo} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">{ativo.nome}</p>
                              <p className="text-[10px] text-slate-400">{ativo.tipo} — {ativo.id_ativo}</p>
                            </div>
                          </div>
                          <SuggestBtn onClick={() => {
                            const newAtivos = [...ativosContingencia];
                            newAtivos[idx] = { ...newAtivos[idx], procedimento: `1. Identificar e confirmar indisponibilidade do ${ativo.nome}.\n2. Notificar plantão técnico da GETIC imediatamente (ver Intervenientes).\n3. Verificar link de failover: ${ativo.linkDR || '[INSERIR LINK DR]'}.\n4. Acionar failover automático ou manual conforme configuração do sistema.\n5. Validar funcionamento no ambiente de contingência em até ${ativo.rtoAtivo} minutos (RTO).\n6. Confirmar que a perda de dados não excede ${ativo.rpoAtivo} minutos (RPO).\n7. Emitir comunicado de status para os usuários afetados.\n8. Manter monitoramento até restauração definitiva do ambiente primário.` };
                            setAtivosContingencia(newAtivos);
                          }} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="space-y-0.5 md:col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><Link className="w-3 h-3" /> Link de Contingência / Failover</label>
                            <input type="text" value={ativo.linkDR} onChange={(e) => { const n = [...ativosContingencia]; n[idx] = { ...n[idx], linkDR: e.target.value }; setAtivosContingencia(n); }} className={ic} placeholder="https://dr.sistema.empresa.com ou IP:Porta" />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-amber-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> RTO (min)</label>
                            <input type="number" min="1" value={ativo.rtoAtivo} onChange={(e) => { const n = [...ativosContingencia]; n[idx] = { ...n[idx], rtoAtivo: parseInt(e.target.value) || 60 }; setAtivosContingencia(n); }} className={ic + " font-bold text-amber-600"} />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-blue-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> RPO (min)</label>
                            <input type="number" min="1" value={ativo.rpoAtivo} onChange={(e) => { const n = [...ativosContingencia]; n[idx] = { ...n[idx], rpoAtivo: parseInt(e.target.value) || 15 }; setAtivosContingencia(n); }} className={ic + " font-bold text-blue-600"} />
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Procedimento de Failover (Passo a Passo)</label>
                          <textarea rows="5" value={ativo.procedimento} onChange={(e) => { const n = [...ativosContingencia]; n[idx] = { ...n[idx], procedimento: e.target.value }; setAtivosContingencia(n); }} className={tc} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CENÁRIO C */}
            {editorTab === 'cenarioC' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-orange-600 dark:text-orange-400 text-[11px] uppercase tracking-wider">Cenário C — Fornecedores Críticos e Contingências Contratuais</h4>
                    <p className="text-slate-400 mt-0.5 text-[10px]">Procedimentos para paralisação de fornecedores essenciais ao processo.</p>
                  </div>
                  <SuggestBtn onClick={() => setScenarioC(prev => ({ ...prev, protocolo: `FASE 1 — COMUNICAÇÃO FORMAL:\n1. Notificar o fornecedor principal (${prev.fornecedorPrincipal || '[FORNECEDOR]'}) formalmente e exigir previsão de retorno em até 2 horas.\n2. Contato do Fiscal do Contrato: ${prev.contato_fiscal || '[INSERIR CONTATO]'}.\n3. Registrar a notificação como quebra de SLA no sistema GCN.\n\nFASE 2 — ACIONAMENTO DO FORNECEDOR ALTERNATIVO:\n4. Se o fornecedor principal não apresentar solução em ${currentAin?.RTO || 60} minutos (RTO), acionar: ${prev.fornecedorAlternativo || '[INSERIR FORNECEDOR ALTERNATIVO]'}.\n5. Comunicar a mudança de fornecedor ao gestor do processo e à equipe operacional.\n\nFASE 3 — OPERAÇÃO EM MODO MANUAL/OFFLINE:\n6. Se nenhum fornecedor estiver disponível, ativar procedimentos operacionais offline mapeados na documentação técnica do processo.` }))} />
                </div>

                {contratoDoProcesso && !scenarioC.fornecedorAlternativo && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/30 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-rose-700 dark:text-rose-400">⚠️ Ponto de Falha Único Identificado — Risco Elevado na Matriz</p>
                      <p className="text-[10px] text-rose-600 dark:text-rose-500 mt-1">Este processo depende exclusivamente do fornecedor <strong>{contratoDoProcesso.nome}</strong>. A ausência de um fornecedor alternativo configura um ponto de falha único e eleva o risco operacional. <strong>Recomendação GERIC:</strong> Adotar estratégia Multi-Vendor na próxima licitação.</p>
                    </div>
                  </div>
                )}

                {!contratoDoProcesso && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 text-[10px]">
                    Nenhum contrato de fornecedor externo vinculado a este processo. Verifique o módulo de Contratos e Documentos.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={lc}><Briefcase className="w-3 h-3" /> Fornecedor Principal</label>
                    <input type="text" value={scenarioC.fornecedorPrincipal} onChange={(e) => setScenarioC({ ...scenarioC, fornecedorPrincipal: e.target.value })} className={ic + " font-bold"} placeholder="Nome do fornecedor principal..." />
                    {contratoDoProcesso && <p className="text-[9px] text-emerald-500">✓ Contrato {contratoDoProcesso.id_contrato} • Vigente até {contratoDoProcesso.data_fim}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className={lc}><Briefcase className="w-3 h-3 text-slate-400" /> Fornecedor Alternativo (Multi-Vendor)</label>
                    <input type="text" value={scenarioC.fornecedorAlternativo} onChange={(e) => setScenarioC({ ...scenarioC, fornecedorAlternativo: e.target.value })} className={ic} placeholder="Nome do fornecedor de contingência..." />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className={lc}>Contato do Fiscal do Contrato</label>
                    <input type="text" value={scenarioC.contato_fiscal} onChange={(e) => setScenarioC({ ...scenarioC, contato_fiscal: e.target.value })} className={ic} placeholder="Nome, e-mail e telefone do fiscal do contrato..." />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={lc}>Protocolo de Contingência de Fornecedores</label>
                  <textarea rows="9" value={scenarioC.protocolo} onChange={(e) => setScenarioC({ ...scenarioC, protocolo: e.target.value })} className={tc} placeholder="Descreva o protocolo de substituição e contingência de fornecedores..." />
                </div>
              </div>
            )}

            {/* CENÁRIO D */}
            {editorTab === 'cenarioD' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-teal-600 dark:text-teal-400 text-[11px] uppercase tracking-wider">Cenário D — Absenteísmo e Indisponibilidade de Pessoas</h4>
                    <p className="text-slate-400 mt-0.5 text-[10px]">Protocolo para greve, epidemia, acidente em massa ou ausência crítica da equipe.</p>
                  </div>
                  <SuggestBtn onClick={() => setScenarioD(prev => ({
                    ...prev,
                    acaoDegradado: `1. Identificar quais atividades críticas do ${currentProcess.nome} estão sem cobertura.\n2. Redistribuir tarefas entre os presentes priorizando funções de maior impacto.\n3. Reduzir SLA interno para o mínimo aceitável durante o período de ausência.\n4. Notificar a liderança e o Gestor da Área sobre a situação operacional.`,
                    acaoCritica: `1. Acionar o substituto de liderança: ${prev.substituto || '[INSERIR NOME]'}.\n2. Solicitar reforço de analistas de outras gerências da diretoria via Comitê de Crise.\n3. Ativar turnos de 12 horas (diurno e noturno) para cobrir o mínimo operacional.\n4. Reduzir escopo operacional ao processamento essencial (transações críticas apenas).\n5. Escalonar para Comitê de Crise se a situação se estender por mais de 24 horas.`
                  }))} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className={lc}>% Limiar — Modo Degradado</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="100" value={scenarioD.pctDegradado} onChange={(e) => setScenarioD({ ...scenarioD, pctDegradado: parseInt(e.target.value) || 30 })} className={ic + " font-bold text-amber-600"} />
                      <span className="text-slate-400">%</span>
                    </div>
                    <p className="text-[9px] text-slate-400">Ausência que ativa modo degradado</p>
                  </div>
                  <div className="space-y-1">
                    <label className={lc}>% Limiar — Modo Crítico</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="100" value={scenarioD.pctCritico} onChange={(e) => setScenarioD({ ...scenarioD, pctCritico: parseInt(e.target.value) || 60 })} className={ic + " font-bold text-rose-600"} />
                      <span className="text-slate-400">%</span>
                    </div>
                    <p className="text-[9px] text-slate-400">Acima: acionar Comitê de Crise</p>
                  </div>
                  <div className="space-y-1">
                    <label className={lc}><Users className="w-3 h-3" /> Substituto de Liderança</label>
                    <input type="text" value={scenarioD.substituto} onChange={(e) => setScenarioD({ ...scenarioD, substituto: e.target.value })} className={ic} placeholder="Nome e cargo do substituto..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={lc + " text-amber-500"}>Ações em Modo Degradado (≥{scenarioD.pctDegradado}%)</label>
                    <textarea rows="7" value={scenarioD.acaoDegradado} onChange={(e) => setScenarioD({ ...scenarioD, acaoDegradado: e.target.value })} className={tc + " border-amber-200 dark:border-amber-900/50"} placeholder="Descreva as ações em modo degradado..." />
                  </div>
                  <div className="space-y-1">
                    <label className={lc + " text-rose-500"}>Ações em Modo Crítico (≥{scenarioD.pctCritico}%)</label>
                    <textarea rows="7" value={scenarioD.acaoCritica} onChange={(e) => setScenarioD({ ...scenarioD, acaoCritica: e.target.value })} className={tc + " border-rose-200 dark:border-rose-900/50"} placeholder="Descreva as ações em modo crítico..." />
                  </div>
                </div>
              </div>
            )}

            {/* ESCALONAMENTO */}
            {editorTab === 'escalonamento' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
                <div className="flex items-start justify-between border-b border-rose-100 dark:border-rose-900/30 pb-3">
                  <div>
                    <h4 className="font-bold text-rose-600 dark:text-rose-400 text-[11px] uppercase tracking-wider">Regra de Escalonamento e Acionamento do Comitê de Crise</h4>
                    <p className="text-slate-400 mt-0.5 text-[10px]">Critérios objetivos para escalonamento quando a interrupção ultrapassa o MTDCN.</p>
                  </div>
                  <SuggestBtn onClick={() => setPcoData({ ...pcoData, escalonamento_crise: `Se a interrupção operacional do processo ${currentProcess.nome} ultrapassar ${currentAin?.MTDCN || 120} minutos (MTDCN definido no BIA/AIN), o Gerente da Área DEVE:\n\n1. ESCALONAR IMEDIATAMENTE para o Comitê de Crise corporativo — convocação realizada pela GEMAC.\n2. NOTIFICAR A GERIC para monitoramento, apoio metodológico e acionamento do PGC.\n3. COMUNICAR A DIRETORIA responsável para decisões estratégicas e autorização de gastos emergenciais.\n\nA partir do escalonamento, os seguintes atos tornam-se MANDATÓRIOS (ISO 22301 §8.4.4):\n- Ata deliberativa de cada reunião do Comitê de Crise.\n- Log detalhado de todas as ações e decisões no sistema GCN.\n- Comunicados oficiais periódicos (a cada 30 minutos) para todas as partes interessadas.\n- Relatório de pós-incidente (lições aprendidas) em até 5 dias úteis após o encerramento.` })} />
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-lg">
                  <p className="text-rose-700 dark:text-rose-400 font-bold">MTDCN: {currentAin?.MTDCN || 'N/A'} minutos</p>
                  <p className="text-[9px] text-rose-500 mt-0.5">Tempo máximo de disrupção tolerável antes do acionamento obrigatório do Comitê de Crise.</p>
                </div>
                <textarea rows="12" value={pcoData.escalonamento_crise || ''} onChange={(e) => setPcoData({ ...pcoData, escalonamento_crise: e.target.value })} className={tc + " border-rose-200 dark:border-rose-900/40"} placeholder="Descreva as regras e critérios para escalonamento de crise..." />
              </div>
            )}

            {/* PRD */}
            {editorTab === 'prd' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px] uppercase tracking-wider">PRD — Plano de Recuperação de Desastres de TI (ISO 27031)</h4>
                  <p className="text-slate-400 mt-0.5 text-[10px]">Procedimentos técnicos de backup, failover e War Room para o ambiente de TI.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={lc}>Local de Backup / Snapshots</label>
                    <input type="text" value={prdData.local_backup || ''} onChange={(e) => setPrdData({ ...prdData, local_backup: e.target.value })} className={ic} placeholder="Cloud Storage, DataCenter DR..." />
                  </div>
                  <div className="space-y-1">
                    <label className={lc}>Frequência de Backup</label>
                    <input type="text" value={prdData.frequencia_backup || ''} onChange={(e) => setPrdData({ ...prdData, frequencia_backup: e.target.value })} className={ic} placeholder="A cada 15 minutos (incremental)..." />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className={lc + " mb-0"}>Procedimentos de Restauração de Backups</label>
                    <SuggestBtn onClick={() => setPrdData({ ...prdData, procedimentos_restauracao: ativosContingencia.length > 0 ? ativosContingencia.map((a, i) => `${i + 1}. Restaurar ${a.nome} (${a.tipo}):\n   - Validar integridade dos logs.\n   - Restaurar snapshot mais recente (RPO: ${a.rpoAtivo} min).\n   - Confirmar acesso via: ${a.linkDR || '[LINK DR]'}.\n   - Tempo máximo de RTO: ${a.rtoAtivo} min.`).join('\n\n') : `1. Validar logs de integridade dos sistemas.\n2. Restaurar snapshots automatizados mais recentes (RPO de ${currentAin?.RPO || 15} min).\n3. Redirecionar tráfego DNS para região de contingência ativa.\n4. Validar conectividade fim a fim.\n5. Emitir confirmação de restauração para o Gerente da Área.` })} />
                  </div>
                  <textarea rows="6" value={prdData.procedimentos_restauracao || ''} onChange={(e) => setPrdData({ ...prdData, procedimentos_restauracao: e.target.value })} className={tc} />
                </div>
                <div className="space-y-1">
                  <label className={lc}>Acionamento de Emergência / Canal de Plantão TI</label>
                  <textarea rows="3" value={prdData.comunicacao_emergencia || ''} onChange={(e) => setPrdData({ ...prdData, comunicacao_emergencia: e.target.value })} className={tc} />
                </div>
                <div className="space-y-1 border-t border-indigo-100 dark:border-indigo-900/30 pt-4">
                  <div className="flex justify-between items-center">
                    <label className={lc + " mb-0 text-indigo-500"}>Protocolo de Ativação de War Room (Sala de Situação)</label>
                    <SuggestBtn onClick={() => setPrdData({ ...prdData, procedimento_war_room: `1. Declarar desastre técnico formalmente (Gerente da Área + GETIC em conjunto).\n2. Criar sala de situação corporativa: "War-Room-Crise-${currentProcess?.id_gerencia || 'AREA'}" no Microsoft Teams.\n3. Convocar obrigatoriamente: líder técnico da GETIC, representante de GEAPE e GESEC.\n4. Reuniões de status técnico a cada 15 minutos até a restauração completa.\n5. Documentar em tempo real todas as decisões e acionamentos no GCN.\n6. Emitir comunicados de status a cada 30 minutos para todas as partes interessadas.\n7. Após restauração: manter monitoramento reforçado por 2 horas.\n8. Emitir relatório de pós-incidente em até 5 dias úteis.` })} />
                  </div>
                  <textarea rows="6" value={prdData.procedimento_war_room || ''} onChange={(e) => setPrdData({ ...prdData, procedimento_war_room: e.target.value })} className={tc + " border-indigo-200 dark:border-indigo-900/40"} />
                </div>

                {/* Diagrama DR */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase">Topologia de Failover (DR)</h5>
                    <button onClick={startFailoverSimulation} disabled={drStatus === 'failing-over'} className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all">
                      <Play className="w-3 h-3" /> Simular Failover
                    </button>
                  </div>
                  <div className="h-40 bg-slate-950 rounded-xl relative overflow-hidden flex items-center justify-around p-4 border border-slate-900">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="flex flex-col items-center z-10 text-[9px]">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center text-slate-300 p-1 text-center">
                        <Users className="w-4 h-4" /><span className="mt-0.5">Usuários</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-0.5 w-full bg-slate-700 relative">
                        <div className="absolute top-0 bottom-0 left-0 bg-indigo-500 w-4 rounded animate-pulse" style={{ animationDuration: '1.5s', left: '40%' }} />
                      </div>
                    </div>
                    <div className="flex flex-col items-center z-10 text-[9px]">
                      <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${drStatus === 'normal' ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400' : drStatus === 'failing-over' ? 'bg-amber-950/40 border-amber-500 text-amber-500 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                        <Server className="w-4 h-4" /><span className="mt-1 font-bold">Principal</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-0.5 w-full bg-slate-700 relative">
                        {drStatus === 'failed-over' && <div className="absolute top-0 bottom-0 bg-rose-500 w-4 rounded animate-pulse" style={{ animationDuration: '0.8s', left: '50%' }} />}
                      </div>
                    </div>
                    <div className="flex flex-col items-center z-10 text-[9px]">
                      <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all ${drStatus === 'failed-over' ? 'bg-rose-950/40 border-rose-500 text-rose-400 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                        <RefreshCw className="w-4 h-4" /><span className="mt-1 font-bold">DR Backup</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INTERVENIENTES */}
            {editorTab === 'intervenientes' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-xs">
                <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                    <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">🚨 Painel de Acionamento de Emergência (ISO 22301)</span>
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-500 leading-relaxed">Ao acionar, todos os intervenientes cadastrados receberão notificações críticas.</p>
                  <form onSubmit={handleAcionarPlano} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-rose-600 uppercase">Incidente Gerador *</label>
                      <select value={selectedIncidenteId} onChange={(e) => setSelectedIncidenteId(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-rose-300 rounded-lg px-3 py-2 text-xs focus:outline-rose-500" required>
                        <option value="">Selecione o incidente gerador...</option>
                        <option value="Acionamento Preventivo">Acionamento Geral Preventivo</option>
                        {incidentesAbertos.map(inc => (
                          <option key={inc.id_incidente} value={inc.id_incidente}>{inc.id_incidente} - {inc.descricao?.substring(0, 50)}...</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-lg text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Play className="w-3.5 h-3.5" /> Acionar Plano
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-bold text-teal-650 dark:text-teal-400 uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800 pb-2">Intervenientes Mapeados</h4>
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {intervenientes.map(int => (
                        <div key={int.id_interveniente} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-850 flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 dark:text-slate-250">{int.nome}</p>
                            <p className="text-[10px] text-slate-450">{int.cargo} | <strong>{int.papel}</strong></p>
                            <p className="text-[9px] text-slate-400">{int.email} | {int.telefone}</p>
                          </div>
                          <button type="button" onClick={() => handleDeleteInterveniente(int.id_interveniente)} className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {intervenientes.length === 0 && <p className="text-slate-400 italic text-[11px]">Nenhum interveniente cadastrado. Adicione contatos críticos de failover.</p>}
                    </div>
                  </div>
                  <form onSubmit={handleAddInterveniente} className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-[10px] uppercase">Cadastrar Interveniente de Failover</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5"><label className="text-[9px] text-slate-400 font-bold uppercase">Nome *</label><input type="text" value={novoInterveniente.nome} onChange={(e) => setNovoInterveniente({ ...novoInterveniente, nome: e.target.value })} placeholder="Nome Completo" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs" required /></div>
                      <div className="space-y-0.5"><label className="text-[9px] text-slate-400 font-bold uppercase">Cargo *</label><input type="text" value={novoInterveniente.cargo} onChange={(e) => setNovoInterveniente({ ...novoInterveniente, cargo: e.target.value })} placeholder="Ex: Supervisor TI" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs" required /></div>
                    </div>
                    <div className="space-y-0.5"><label className="text-[9px] text-slate-400 font-bold uppercase">Papel no Plano *</label><input type="text" value={novoInterveniente.papel} onChange={(e) => setNovoInterveniente({ ...novoInterveniente, papel: e.target.value })} placeholder="Ex: Responsável por chaveamento DNS" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs" required /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5"><label className="text-[9px] text-slate-400 font-bold uppercase">E-mail</label><input type="email" value={novoInterveniente.email} onChange={(e) => setNovoInterveniente({ ...novoInterveniente, email: e.target.value })} placeholder="Email corporativo" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs" /></div>
                      <div className="space-y-0.5"><label className="text-[9px] text-slate-400 font-bold uppercase">Telefone *</label><input type="text" value={novoInterveniente.telefone} onChange={(e) => setNovoInterveniente({ ...novoInterveniente, telefone: e.target.value })} placeholder="DDD + Celular" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs" required /></div>
                    </div>
                    <button type="submit" className="w-full bg-teal-650 hover:bg-teal-700 text-white font-bold py-2 rounded text-xs transition-colors">+ Cadastrar Interveniente</button>
                  </form>
                </div>

                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">Histórico de Acionamentos</h4>
                  <div className="space-y-2">
                    {pcoData.acionamentos && pcoData.acionamentos.length > 0 ? pcoData.acionamentos.map((ac, idx) => (
                      <div key={idx} className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-200 dark:border-slate-850 items-center">
                        <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center text-xs">🚨</div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 dark:text-slate-250">Plano Acionado</p>
                          <p className="text-[10px] text-slate-450">Incidente: <strong>{ac.id_incidente}</strong></p>
                          <p className="text-[9px] text-slate-400">Por: {ac.acionado_por} | {new Date(ac.data).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    )) : <p className="text-slate-400 italic text-[11px]">Nenhum acionamento emergencial registrado para este plano.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all">
                💾 Salvar Versão do Plano
              </button>
              <button onClick={exportarPDF} className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3 px-5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
            </div>
          </div>

          {/* Lado Direito (1/3) */}
          <div className="space-y-5 text-xs">

            {/* BIA KPIs */}
            {currentAin && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="font-bold text-slate-800 dark:text-white text-[11px] uppercase tracking-wider mb-3">BIA — Parâmetros do Processo</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50">
                    <p className="text-lg font-black text-amber-600">{currentAin.RTO}</p>
                    <p className="text-[9px] text-amber-500 font-bold uppercase">RTO (min)</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50">
                    <p className="text-lg font-black text-blue-600">{currentAin.RPO}</p>
                    <p className="text-[9px] text-blue-500 font-bold uppercase">RPO (min)</p>
                  </div>
                  <div className="text-center p-2 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200/50">
                    <p className="text-lg font-black text-rose-600">{currentAin.MTDCN}</p>
                    <p className="text-[9px] text-rose-500 font-bold uppercase">MTDCN (min)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Contrato Vinculado */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="font-bold text-slate-800 dark:text-white text-[11px] uppercase tracking-wider mb-2">Contrato / Fornecedor</h4>
              {contratoDoProcesso ? (
                <div className="space-y-1.5">
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">{contratoDoProcesso.nome}</p>
                  <p className="text-[10px] text-slate-500">{contratoDoProcesso.id_contrato} • Vigente até {contratoDoProcesso.data_fim}</p>
                  {contratoDoProcesso.multas && <p className="text-[10px] text-rose-500 font-bold">⚠️ Multas: {contratoDoProcesso.multas.substring(0, 60)}...</p>}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">Nenhum contrato externo vinculado.</p>
              )}
            </div>

            {/* Ativos e Riscos */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-white text-[11px] uppercase tracking-wider">Ativos e Riscos</h4>
              <div className="space-y-2">
                <span className="text-[9px] text-slate-450 font-bold uppercase">Sistemas (TI)</span>
                {currentProcess.ativos && currentProcess.ativos.length > 0 ? (
                  <div className="space-y-1">
                    {currentProcess.ativos.map(a => (
                      <div key={a.id_ativo} className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-200 dark:border-slate-850 flex justify-between items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{a.nome}</span>
                        <span className="text-[9px] bg-purple-50 dark:bg-purple-950 text-purple-600 px-1 rounded font-bold">{a.tipo}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-[10px] text-slate-400 italic">Nenhum ativo vinculado.</p>}
              </div>
              <div className="space-y-2">
                <span className="text-[9px] text-slate-450 font-bold uppercase">Ameaças Mapeadas</span>
                {riscosDoProcesso.length > 0 ? (
                  <div className="space-y-1">
                    {riscosDoProcesso.map(r => (
                      <div key={r.id_risco} className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-200 dark:border-slate-850 flex justify-between items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px]">{r.nome}</span>
                        <span className="text-[9px] bg-rose-50 dark:bg-rose-950 text-rose-500 px-1 rounded font-bold">{r.impacto}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-[10px] text-slate-400 italic">Sem riscos específicos mapeados.</p>}
              </div>
            </div>

            {/* Preview PCO */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-250 dark:border-slate-800/80 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-white text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">Visualização Rápida — PCO</h4>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 font-mono text-[9px] text-slate-700 dark:text-slate-350 leading-relaxed bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-900">
                <div><p className="font-bold text-indigo-500">ESTRATÉGIA:</p><p className="mt-0.5 whitespace-pre-wrap">{renderPlaceholders(pcoData.estrategia_recuperacao)}</p></div>
                <div><p className="font-bold text-blue-500">CENÁRIO A — ACESSO:</p><p className="mt-0.5 whitespace-pre-wrap">{scenarioA.protocolo || pcoData.cenario_acesso}</p></div>
                <div><p className="font-bold text-purple-500">CENÁRIO B — SISTEMAS:</p><p className="mt-0.5">{ativosContingencia.length > 0 ? `${ativosContingencia.length} sistemas mapeados com failover individual.` : pcoData.cenario_sistemas}</p></div>
                <div><p className="font-bold text-orange-500">CENÁRIO C — FORNECEDORES:</p><p className="mt-0.5">{scenarioC.fornecedorPrincipal ? `Principal: ${scenarioC.fornecedorPrincipal} | Alternativo: ${scenarioC.fornecedorAlternativo || 'NÃO DEFINIDO ⚠️'}` : 'Sem fornecedor cadastrado.'}</p></div>
                <div><p className="font-bold text-teal-500">CENÁRIO D — PESSOAS:</p><p className="mt-0.5">{`Degradado ≥${scenarioD.pctDegradado}% | Crítico ≥${scenarioD.pctCritico}% | Substituto: ${scenarioD.substituto || '[NÃO DEFINIDO]'}`}</p></div>
                <div className="border-t border-slate-100 dark:border-slate-850 pt-2"><p className="font-bold text-rose-500">ESCALONAMENTO:</p><p className="mt-0.5 whitespace-pre-wrap">{renderPlaceholders(pcoData.escalonamento_crise)}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
