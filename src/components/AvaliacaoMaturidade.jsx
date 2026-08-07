import React, { useState, useEffect } from 'react';
import { ShieldCheck, Award, Info, CheckSquare, Save, Users, Shield, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { pdfService } from '../services/pdfService';

export default function AvaliacaoMaturidade({ db }) {
  const { usuario, isAdmin, isVisualizador } = useAuth();
  
  // Lista geral de processos
  const processosGerais = db.processosCriticos.list();
  
  // Filtrar processos de acordo com o papel do usuário
  const processos = isAdmin()
    ? processosGerais
    : processosGerais.filter(p => p.id_gerencia === usuario?.id_gerencia);

  const [selectedProcId, setSelectedProcId] = useState(processos[0]?.id_processo || '');
  const [notification, setNotification] = useState(null);
  
  // Estado geral carregado do banco
  const [avaliacaoDb, setAvaliacaoDb] = useState(null);

  // 1. Checklist Auto Assessment (Área)
  const checklistAreaItens = [
    { id: 'req_equipe', label: 'A equipe da área conhece as ações de contingência descritas no PCO do processo', pilar: 'Pessoas' },
    { id: 'req_remoto', label: 'A área possui conectividade e equipamentos para trabalho remoto contingencial estabelecido', pilar: 'Estrutura' },
    { id: 'req_rto', label: 'A liderança da área compreende os RTOs metas dos processos críticos descritos no BIA', pilar: 'BIA' },
    { id: 'req_testes', label: 'A área participou ativamente ou foi informada sobre os simulados de teste do plano', pilar: 'Simulados' },
    { id: 'req_contatos', label: 'A lista de contatos de emergência e intervenientes críticos está revisada e atualizada', pilar: 'Comunicação' }
  ];

  // 2. Checklist Avaliação Geric (2ª Linha)
  const checklistGericItens = [
    { id: 'req_politica', label: 'A política corporativa de continuidade está aprovada formalmente pela alta administração', pilar: 'Conformidade' },
    { id: 'req_pco_rev', label: 'O PCO e o PRD deste processo foram formalmente revisados e homologados no ciclo atual', pilar: 'Governança' },
    { id: 'req_simulado', label: 'Os testes de simulado prático ou de mesa obtiveram parecer de eficácia técnica comprovada', pilar: 'Validação' },
    { id: 'req_rto_bia', label: 'O RTO Meta definido no BIA é plenamente atendido pela capacidade técnica de backup (RTO PRD)', pilar: 'Alinhamento' },
    { id: 'req_matriz', label: 'A matriz de escalonamento de riscos está configurada e integrada à gestão de crises corporativa', pilar: 'Riscos' },
    { id: 'req_comite', label: 'A governança de crise corporativa (Comitê de Crise e Atas) tem capacidade de acionamento ativo', pilar: 'Estratégia' }
  ];

  // Checklists locais (estados)
  const [checklistArea, setChecklistArea] = useState({
    req_equipe: false,
    req_remoto: false,
    req_rto: false,
    req_testes: false,
    req_contatos: false
  });

  const [checklistGeric, setChecklistGeric] = useState({
    req_politica: false,
    req_pco_rev: false,
    req_simulado: false,
    req_rto_bia: false,
    req_matriz: false,
    req_comite: false
  });

  const [comentariosGeric, setComentariosGeric] = useState('');

  // Carregar dados de avaliação do processo selecionado
  useEffect(() => {
    if (selectedProcId) {
      const av = db.avaliacaoNRGCN.list().find(a => a.id_processo === selectedProcId);
      setAvaliacaoDb(av || null);

      if (av) {
        // Carrega checklist da Área
        if (av.checklist_area) {
          try { setChecklistArea(JSON.parse(av.checklist_area)); } catch (e) { resetChecklistArea(); }
        } else { resetChecklistArea(); }

        // Carrega checklist da Geric
        if (av.checklist_geric) {
          try { setChecklistGeric(JSON.parse(av.checklist_geric)); } catch (e) { resetChecklistGeric(); }
        } else { resetChecklistGeric(); }

        setComentariosGeric(av.comentarios_geric || '');
      } else {
        resetChecklistArea();
        resetChecklistGeric();
        setComentariosGeric('');
      }
      setNotification(null);
    }
  }, [selectedProcId]);

  const resetChecklistArea = () => {
    setChecklistArea({ req_equipe: false, req_remoto: false, req_rto: false, req_testes: false, req_contatos: false });
  };

  const resetChecklistGeric = () => {
    setChecklistGeric({ req_politica: false, req_pco_rev: false, req_simulado: false, req_rto_bia: false, req_matriz: false, req_comite: false });
  };

  // Handlers para clique
  const handleAreaChange = (id) => {
    if (isAdmin() || isVisualizador()) return; // Admin e visualizador não editam a auto-avaliação da área direta na visão
    setChecklistArea(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGericChange = (id) => {
    if (!isAdmin() || isVisualizador()) return; // Apenas admin_geric edita checklist da segunda linha (e não visualizador)
    setChecklistGeric(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // CÁLCULO DINÂMICO DE MATURIDADE NRGCN CONFRONTADO
  const calcularMaturidade = () => {
    // 1. Área (Auto Assessment)
    const totalArea = checklistAreaItens.length;
    const marcadosArea = Object.values(checklistArea).filter(Boolean).length;
    const aderencaArea = (marcadosArea / totalArea) * 100;
    const notaArea = 1.0 + (marcadosArea / totalArea) * 4.0;

    // 2. Geric (Segunda Linha)
    const totalGeric = checklistGericItens.length;
    const marcadosGeric = Object.values(checklistGeric).filter(Boolean).length;
    const aderencaGeric = (marcadosGeric / totalGeric) * 100;
    const notaGeric = 1.0 + (marcadosGeric / totalGeric) * 4.0;

    // 3. Nota Final Ponderada (40% Área / 60% Geric)
    const notaFinal = (notaArea * 0.4) + (notaGeric * 0.6);
    const aderencaFinal = (aderencaArea * 0.4) + (aderencaGeric * 0.6);

    return {
      aderencaArea: Number(aderencaArea.toFixed(1)),
      notaArea: Number(notaArea.toFixed(2)),
      aderencaGeric: Number(aderencaGeric.toFixed(1)),
      notaGeric: Number(notaGeric.toFixed(2)),
      notaFinal: Number(notaFinal.toFixed(2)),
      aderencaFinal: Number(aderencaFinal.toFixed(1))
    };
  };

  const currentProcess = processosGerais.find(p => p.id_processo === selectedProcId);
  const { aderencaArea, notaArea, aderencaGeric, notaGeric, notaFinal, aderencaFinal } = calcularMaturidade();

  const obterNotasPilares = () => {
    const p1Marcados = (checklistArea.req_equipe ? 1 : 0) + (checklistGeric.req_politica ? 1 : 0);
    const p1Nota = 1.0 + (p1Marcados / 2) * 4.0;

    const p2Marcados = (checklistArea.req_remoto ? 1 : 0) + (checklistGeric.req_rto_bia ? 1 : 0);
    const p2Nota = 1.0 + (p2Marcados / 2) * 4.0;

    const p3Marcados = (checklistArea.req_rto ? 1 : 0) + (checklistGeric.req_pco_rev ? 1 : 0);
    const p3Nota = 1.0 + (p3Marcados / 2) * 4.0;

    const p4Marcados = (checklistArea.req_testes ? 1 : 0) + (checklistGeric.req_simulado ? 1 : 0);
    const p4Nota = 1.0 + (p4Marcados / 2) * 4.0;

    const p5Marcados = (checklistArea.req_contatos ? 1 : 0) + (checklistGeric.req_matriz ? 1 : 0) + (checklistGeric.req_comite ? 1 : 0);
    const p5Nota = 1.0 + (p5Marcados / 3) * 4.0;

    return {
      pessoas: Number(p1Nota.toFixed(1)),
      tecnologia: Number(p2Nota.toFixed(1)),
      alinhamento: Number(p3Nota.toFixed(1)),
      testes: Number(p4Nota.toFixed(1)),
      estrategia: Number(p5Nota.toFixed(1))
    };
  };

  const handleExportarPDF = () => {
    if (!currentProcess) return;
    const pilares = obterNotasPilares();
    const html = pdfService.htmlMaturidade(currentProcess, {
      nota_area: notaArea,
      nota_geric: notaGeric,
      nivel_resiliencia: notaFinal,
      aderencia_ISO22301: aderencaFinal,
      comentarios_geric: comentariosGeric
    }, pilares);
    
    pdfService.exportar(
      html,
      `Laudo_Maturidade_NRGCN_${selectedProcId}`,
      '1.0',
      'Geric - GCN System'
    );
  };

  const handleSave = () => {
    if (!selectedProcId) return;

    // Apenas atualiza ou cria o registro mesclado
    db.avaliacaoNRGCN.save({
      id_processo: selectedProcId,
      nota_area: notaArea,
      nota_geric: notaGeric,
      checklist_area: JSON.stringify(checklistArea),
      checklist_geric: JSON.stringify(checklistGeric),
      comentarios_geric: comentariosGeric,
      nivel_resiliencia: notaFinal,
      aderencia_ISO22301: aderencaFinal,
      grafico_resultado: `radar_${selectedProcId}_maturidade`
    });

    setNotification({
      type: 'success',
      text: isAdmin()
        ? `Avaliação de 2ª Linha (GERIC) salva com sucesso! Nota Final Ponderada recalculada: ${notaFinal}.`
        : `Auto-avaliação da Área salva com sucesso! Sua nota de percepção operacional é: ${notaArea}.`
    });
  };

  const [activeTab, setActiveTab] = useState('radar360'); // 'radar360' | 'processo'

  const listaAvaliacoes = db.avaliacaoNRGCN.list() || [];
  const gapsMaturidade = listaAvaliacoes.map(av => {
    const proc = processosGerais.find(p => p.id_processo === av.id_processo);
    const difNota = Math.abs((av.nota_area || 1) - (av.nota_geric || 1));
    const temGap = difNota >= 1.2;
    return {
      id_processo: av.id_processo,
      nomeProcesso: proc ? proc.nome : av.id_processo,
      siglaGerencia: proc ? proc.id_gerencia : 'N/A',
      notaArea: av.nota_area || 1.0,
      notaGeric: av.nota_geric || 1.0,
      notaFinal: av.nivel_resiliencia || 1.0,
      difNota: Number(difNota.toFixed(1)),
      temGap,
      comentarios: av.comentarios_geric || 'Processo auditado pela GERIC.'
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Navegação por Abas: Radar 360° Corporativo vs Avaliação por Processo */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('radar360')}
          className={`pb-3 text-xs font-extrabold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'radar360'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Award className="w-4 h-4" /> Diagnóstico Radar 360° Corporativo & Gaps de Percepção
        </button>
        <button
          onClick={() => setActiveTab('processo')}
          className={`pb-3 text-xs font-extrabold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'processo'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Checklist de Avaliação por Processo (1ª vs 2ª Linha)
        </button>
      </div>

      {/* ═══ ABA 1: DIAGNÓSTICO RADAR 360° CORPORATIVO & GAPS ═══ */}
      {activeTab === 'radar360' && (
        <div className="space-y-6">
          {/* KPI Bar Corporativa */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Maturidade Média Corporativa</span>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">3.31 / 5.0 pts</div>
              <p className="text-[10px] text-slate-400 mt-1">Score Global NRGCN (ISO 22301)</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Gaps de Percepção Detectados</span>
              <div className="text-xl font-black text-rose-500 mt-1">
                {gapsMaturidade.filter(g => g.temGap).length} Processos
              </div>
              <p className="text-[10px] text-rose-500 font-bold mt-1">Divergência &gt; 1.2 pts entre 1ª e 2ª Linha</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Alinhamento de Governança</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">82.5%</div>
              <p className="text-[10px] text-slate-400 mt-1">Consenso entre Área e GERIC</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Auditoria (3ª Linha Geraud)</span>
              <div className="text-xl font-black text-slate-800 dark:text-white mt-1">100% Auditado</div>
              <p className="text-[10px] text-slate-400 mt-1">Trilha de conformidade mantida</p>
            </div>
          </div>

          {/* Matriz de Diagnóstico de Gaps de Percepção (1ª vs 2ª Linha) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Matriz de Diagnóstico de Gaps de Governança (Percepção 1ª Linha vs Auditoria 2ª Linha)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Identifica processos onde a área operacional superestimou sua resiliência e a GERIC (2ª Linha) atribuiu nota menor por falta de simulados ou PCO não atualizado.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-extrabold text-[10px] uppercase text-slate-400">
                    <th className="p-3">Processo Crítico</th>
                    <th className="p-3 text-center">Nota 1ª Linha (Área)</th>
                    <th className="p-3 text-center">Nota 2ª Linha (GERIC)</th>
                    <th className="p-3 text-center">Nota Final NRGCN</th>
                    <th className="p-3 text-center">Divergência (Gap)</th>
                    <th className="p-3">Diagnóstico & Recomendação</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {gapsMaturidade.map((gap) => (
                    <tr key={gap.id_processo} className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors ${gap.temGap ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''}`}>
                      <td className="p-3">
                        <span className="font-extrabold text-slate-800 dark:text-white block">{gap.nomeProcesso}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{gap.id_processo} • Gerência: {gap.siglaGerencia}</span>
                      </td>
                      <td className="p-3 text-center font-bold text-teal-600 dark:text-teal-400">{gap.notaArea} pts</td>
                      <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{gap.notaGeric} pts</td>
                      <td className="p-3 text-center font-black text-slate-800 dark:text-white">{gap.notaFinal} / 5.0</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          gap.temGap ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {gap.temGap ? `⚠️ Gap de ${gap.difNota} pts` : '✅ Alinhado'}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                        {gap.temGap 
                          ? `Área superestimou a resiliência em ${gap.difNota} pts. A GERIC aplicou nota auditada menor por falta de simulados práticos ou PCO vencido.` 
                          : gap.comentarios}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedProcId(gap.id_processo);
                            setActiveTab('processo');
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                        >
                          Auditar Processo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* ═══ ABA 2: CHECKLIST DE AVALIAÇÃO POR PROCESSO (1ª vs 2ª LINHA) ═══ */}
      {activeTab === 'processo' && (
        <div className="space-y-6">
          {/* Seletor de Processo */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Selecione o Processo para Avaliação</h3>
            <p className="text-[10px] text-slate-400">Verifique os quesitos de maturidade regulatórios sob as visões de 1ª e 2ª Linha.</p>
          </div>
        </div>
        <select
          value={selectedProcId}
          onChange={(e) => setSelectedProcId(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-700 dark:text-slate-355 focus:outline-indigo-500 font-bold min-w-[280px]"
        >
          <option value="">Selecione o processo...</option>
          {processos.map(p => (
            <option key={p.id_processo} value={p.id_processo}>
              {p.id_processo} - {p.nome}
            </option>
          ))}
        </select>
      </div>

      {notification && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 text-xs font-semibold">
          {notification.text}
        </div>
      )}

      {currentProcess && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lado Esquerdo (2/3): Questionários Separados */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. VISÃO DA ÁREA (Auto Assessment - 1ª Linha) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-500" />
                  <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                    Auto Assessment da Área (1ª Linha de Defesa)
                  </h3>
                </div>
                <span className="text-[9px] bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded text-teal-650 dark:text-teal-400 font-bold">
                  Peso: 40%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Esta seção deve ser respondida pelo gestor executivo da área de negócios correspondente para auferir a percepção local de resiliência.
              </p>

              <div className="space-y-3">
                {checklistAreaItens.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleAreaChange(item.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      (!isAdmin() && !isVisualizador()) ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/40' : 'opacity-75'
                    } ${
                      checklistArea[item.id] 
                        ? 'border-teal-500 bg-teal-50/10 dark:bg-teal-950/10' 
                        : 'border-slate-200 dark:border-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        checklistArea[item.id]
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-950'
                      }`}>
                        {checklistArea[item.id] && <CheckSquare className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold text-slate-750 dark:text-slate-300">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-855 text-slate-450 dark:text-slate-500 px-2 py-0.5 rounded font-bold uppercase whitespace-nowrap">
                      {item.pilar}
                    </span>
                  </div>
                ))}
              </div>
              {!isAdmin() && !isVisualizador() && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    className="bg-teal-650 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Salvar Auto-avaliação
                  </button>
                </div>
              )}
            </div>

            {/* 2. VISÃO DA GERIC (Validação Técnica - 2ª Linha de Defesa) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                    Avaliação Técnica da GERIC (2ª Linha de Defesa)
                  </h3>
                </div>
                <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded text-indigo-650 dark:text-indigo-400 font-bold">
                  Peso: 60%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Esta seção é respondida apenas pela equipe da Geric/Riscos de segunda linha, avaliando quesitos de governança formal, conformidade com a ISO 22301 e testes formais.
              </p>

              <div className="space-y-3">
                {checklistGericItens.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleGericChange(item.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      (isAdmin() && !isVisualizador()) ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/40' : 'opacity-75'
                    } ${
                      checklistGeric[item.id] 
                        ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10' 
                        : 'border-slate-200 dark:border-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        checklistGeric[item.id]
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-950'
                      }`}>
                        {checklistGeric[item.id] && <CheckSquare className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold text-slate-750 dark:text-slate-300">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-855 text-slate-450 dark:text-slate-500 px-2 py-0.5 rounded font-bold uppercase whitespace-nowrap">
                      {item.pilar}
                    </span>
                  </div>
                ))}
              </div>

              {/* Parecer Técnico (GERIC) */}
              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-bold text-slate-455 uppercase">Parecer Técnico e Justificativa de Confronto (GERIC)</label>
                <textarea
                  rows="2"
                  value={comentariosGeric}
                  onChange={(e) => setComentariosGeric(e.target.value)}
                  disabled={!isAdmin()}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500 disabled:opacity-60"
                  placeholder={isAdmin() ? "Descreva parecer técnico de segunda linha e justificativas de notas..." : "Parecer reservado à Geric."}
                />
              </div>

              {isAdmin() && !isVisualizador() && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Salvar Avaliação Geric
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Lado Direito (1/3): KPIs NRGCN Confrontados */}
          <div className="space-y-6">
            
            {/* Bloco Geral Nota Ponderada */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-6">
              <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Placar NRGCN Confrontado</h3>

              {/* Rosca de Progresso / Aderência Final */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="60" className="stroke-slate-100 dark:stroke-slate-850" strokeWidth="10" fill="transparent" />
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="60" 
                    className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-500" 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray={376.9}
                    strokeDashoffset={376.9 - (376.9 * (aderencaFinal / 100))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">{aderencaFinal}%</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Aderência Final</span>
                </div>
              </div>

              {/* Placa de Nível Resiliência */}
              <div className="w-full bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-850/60">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Nota Final Ponderada (NRGCN)</p>
                <h4 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{notaFinal} <span className="text-xs font-normal text-slate-450">/ 5.0</span></h4>
                <p className="text-[10px] text-slate-450 mt-2 leading-relaxed">
                  {notaFinal >= 4.5 ? 'Nível 5: Resiliência Otimizada e Validada' :
                   notaFinal >= 3.5 ? 'Nível 4: Resiliência Gerenciada com Testes' :
                   notaFinal >= 2.5 ? 'Nível 3: Planos Definidos e Estruturados' :
                   notaFinal >= 1.5 ? 'Nível 2: Processos Mapeados Inicialmente' :
                   'Nível 1: Vulnerável - Sem Planos de Continuidade'}
                </p>
              </div>

              {/* Painel de Confronto */}
              <div className="w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-[10px]">
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 flex justify-between font-bold text-slate-455 uppercase">
                  <span>Origem da Avaliação</span>
                  <span>Nota</span>
                </div>
                <div className="p-2.5 flex justify-between items-center bg-white dark:bg-slate-900">
                  <span className="flex items-center gap-1 text-slate-650 dark:text-slate-350">
                    <Users className="w-3 h-3 text-teal-500" /> Auto Assessment (Área)
                  </span>
                  <span className="font-extrabold text-teal-650 dark:text-teal-400">{notaArea} / 5.0 ({aderencaArea}%)</span>
                </div>
                <div className="p-2.5 flex justify-between items-center bg-white dark:bg-slate-900">
                  <span className="flex items-center gap-1 text-slate-650 dark:text-slate-350">
                    <Shield className="w-3 h-3 text-indigo-500" /> Validação GERIC (2ª Linha)
                  </span>
                  <span className="font-extrabold text-indigo-650 dark:text-indigo-400">{notaGeric} / 5.0 ({aderencaGeric}%)</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-start gap-1.5 leading-normal text-left pt-2 border-t border-slate-100 dark:border-slate-850 w-full">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  A nota final pondera a auto-avaliação da área (peso 40%) contra a validação técnica da Geric (peso 60%), confrontando a percepção operacional com a eficácia comprovada.
                </span>
              </div>
            </div>

            {/* Bloco Radar e Exportação */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider text-center">Teia de Resiliência (5 Pilares)</h3>
              
              {/* Gráfico de Radar SVG */}
              {(() => {
                const p = obterNotasPilares();
                
                const getRadarPoint = (angleDegrees, value1to5) => {
                  const angleRad = (angleDegrees * Math.PI) / 180;
                  const r = ((value1to5 - 1) / 4) * 60; // Raio máximo ajustado para 60 para caber com as labels
                  const x = 100 + r * Math.cos(angleRad);
                  const y = 100 - r * Math.sin(angleRad);
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                };

                const points = [
                  getRadarPoint(90, p.pessoas),
                  getRadarPoint(162, p.tecnologia),
                  getRadarPoint(234, p.alinhamento),
                  getRadarPoint(306, p.testes),
                  getRadarPoint(18, p.estrategia)
                ].join(' ');

                return (
                  <div className="flex flex-col items-center">
                    <svg className="w-48 h-48" viewBox="0 0 200 200">
                      {/* Teia de grades concêntricas */}
                      <circle cx="100" cy="100" r="15" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="0.5" />
                      <circle cx="100" cy="100" r="30" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="0.5" />
                      <circle cx="100" cy="100" r="45" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="0.5" />
                      <circle cx="100" cy="100" r="60" className="stroke-slate-200 dark:stroke-slate-750 fill-none" strokeWidth="1" />

                      {/* Eixos */}
                      {[90, 162, 234, 306, 18].map(ang => {
                        const rad = (ang * Math.PI) / 180;
                        return (
                          <line 
                            key={ang} 
                            x1="100" y1="100" 
                            x2={(100 + 60 * Math.cos(rad)).toFixed(1)} 
                            y2={(100 - 60 * Math.sin(rad)).toFixed(1)} 
                            className="stroke-slate-200 dark:stroke-slate-800" 
                            strokeWidth="0.75" 
                          />
                        );
                      })}

                      {/* Polígono de Notas */}
                      <polygon 
                        points={points} 
                        className="fill-indigo-500/20 stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-500" 
                        strokeWidth="1.5" 
                      />

                      {/* Pontos de Notas */}
                      {[
                        { a: 90, v: p.pessoas },
                        { a: 162, v: p.tecnologia },
                        { a: 234, v: p.alinhamento },
                        { a: 306, v: p.testes },
                        { a: 18, v: p.estrategia }
                      ].map((pt, idx) => {
                        const rad = (pt.a * Math.PI) / 180;
                        const r = ((pt.v - 1) / 4) * 60;
                        return (
                          <circle 
                            key={idx}
                            cx={(100 + r * Math.cos(rad)).toFixed(1)}
                            cy={(100 - r * Math.sin(rad)).toFixed(1)}
                            r="3.5"
                            className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {/* Rótulos dos Pilares */}
                      <text x="100" y="32" textAnchor="middle" className="text-[7.5px] font-extrabold fill-slate-500 dark:fill-slate-400">Pessoas</text>
                      <text x="32" y="90" textAnchor="end" className="text-[7.5px] font-extrabold fill-slate-500 dark:fill-slate-400">Tecnologia</text>
                      <text x="50" y="172" textAnchor="middle" className="text-[7.5px] font-extrabold fill-slate-500 dark:fill-slate-400">Alinhamento</text>
                      <text x="150" y="172" textAnchor="middle" className="text-[7.5px] font-extrabold fill-slate-500 dark:fill-slate-400">Testes</text>
                      <text x="168" y="90" textAnchor="start" className="text-[7.5px] font-extrabold fill-slate-500 dark:fill-slate-400">Estratégia</text>
                    </svg>
                  </div>
                );
              })()}

              {/* Legendas/Tabela de Notas dos Pilares */}
              {(() => {
                const p = obterNotasPilares();
                return (
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-4 text-[10px]">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                      <span>Pilar de Resiliência</span>
                      <span>Nota</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-lg">
                      <span className="font-semibold text-slate-650 dark:text-slate-350">👥 Pessoas & Cultura</span>
                      <strong className="text-slate-800 dark:text-white">{p.pessoas} / 5.0</strong>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-lg">
                      <span className="font-semibold text-slate-650 dark:text-slate-350">💻 Estrutura & TI</span>
                      <strong className="text-slate-800 dark:text-white">{p.tecnologia} / 5.0</strong>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-lg">
                      <span className="font-semibold text-slate-650 dark:text-slate-350">🎯 BIA & Alinhamento</span>
                      <strong className="text-slate-800 dark:text-white">{p.alinhamento} / 5.0</strong>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-lg">
                      <span className="font-semibold text-slate-650 dark:text-slate-350">🧪 Simulados & Testes</span>
                      <strong className="text-slate-800 dark:text-white">{p.testes} / 5.0</strong>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-lg">
                      <span className="font-semibold text-slate-650 dark:text-slate-350">🛡️ Estratégia & Riscos</span>
                      <strong className="text-slate-800 dark:text-white">{p.estrategia} / 5.0</strong>
                    </div>
                  </div>
                );
              })()}

              {/* Botão de Exportação do Relatório de Maturidade */}
              <button 
                onClick={handleExportarPDF}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-750 transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Exportar Parecer de Maturidade (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

    </div>
  );
}
