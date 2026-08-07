import React, { useState, useEffect } from 'react';
import { Activity, Plus, ShieldAlert, Award, Calendar, FileText, CheckCircle2, ChevronRight, User, Download, Paperclip, AlertTriangle } from 'lucide-react';
import { pdfService } from '../services/pdfService';
import { useAuth } from '../contexts/AuthContext';

export default function TestesExercicios({ db }) {
  const { usuario, isAdmin, filterByGerencia, canCreate } = useAuth();
  const [testes, setTestes] = useState(filterByGerencia(db.testesAvaliacoes.list(), ['pco.processo.id_gerencia', 'prd.processo.id_gerencia']));
  const [processos] = useState(filterByGerencia(db.processosCriticos.list()));
  const [planosPco] = useState(filterByGerencia(db.planosContinuidade.list(), 'processo.id_gerencia'));
  const [planosPrd] = useState(filterByGerencia(db.planosRecuperacaoDesastres.list(), 'processo.id_gerencia'));

  const recarregarListas = () => {
    setTestes(filterByGerencia(db.testesAvaliacoes.list(), ['pco.processo.id_gerencia', 'prd.processo.id_gerencia']));
  };

  // Estados locais
  const [showForm, setShowForm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  // Estados do Plano Anual & Calendário de Simulados (ISO 22301 §8.5)
  const [activeSubTab, setActiveSubTab] = useState('calendario'); // 'calendario' | 'historico'
  const [simuladosAnuais, setSimuladosAnuais] = useState(db.calendarioSimuladosAnuais ? db.calendarioSimuladosAnuais.list() : []);
  const [selectedEvidenciaSim, setSelectedEvidenciaSim] = useState(null);
  const [showNovoSimuladoModal, setShowNovoSimuladoModal] = useState(false);
  const [novoSimuladoForm, setNovoSimuladoForm] = useState({
    titulo: '',
    trimestre: 'Q3 2026',
    data_agendada: '',
    id_processo: db.processosCriticos.list()[0]?.id_processo || '',
    tipo: 'Simulação de Mesa (Tabletop)',
    gerencia_responsavel: 'Geric',
    rto_meta_min: 30
  });

  const handleCreateNovoSimuladoAnual = (e) => {
    e.preventDefault();
    if (!novoSimuladoForm.titulo || !novoSimuladoForm.data_agendada) return;
    const created = db.calendarioSimuladosAnuais.create({
      ...novoSimuladoForm,
      status: 'Agendado',
      resultado: 'Aguardando Execução',
      rto_meta_min: Number(novoSimuladoForm.rto_meta_min),
      rto_atingido_min: null,
      evidencias: [],
      parecer_geric: 'Agendado no Plano Anual corporativo.',
      parecer_auditoria: 'Aguardando execução pela 1ª e 2ª Linhas.'
    });
    setSimuladosAnuais(db.calendarioSimuladosAnuais.list());
    setShowNovoSimuladoModal(false);
    setNotification({ type: 'success', text: `Simulado "${created.titulo}" agendado no Plano Anual corporativo!` });
  };
  
  // Estados para o Simulador de Exercício de Mesa (Tabletop)
  const [showTabletop, setShowTabletop] = useState(false);
  const [tabletopStep, setTabletopStep] = useState(1); // 1: Setup, 2: P1, 3: P2, 4: P3, 5: Conclusão
  const [tabletopProcId, setTabletopProcId] = useState(db.processosCriticos.list()[0]?.id_processo || '');
  const [tabletopCenario, setTabletopCenario] = useState('sistemas'); // 'acesso', 'sistemas'
  const [tabletopScore, setTabletopScore] = useState(0);
  const [tabletopAnswers, setTabletopAnswers] = useState({});
  const [tabletopParticipantes, setTabletopParticipantes] = useState('');
  const [planosAcao, setPlanosAcao] = useState(db.planosAcao ? db.planosAcao.list() : []);

  // Estados para o Simulador de Failover / Comutação de DR (ISO 27031 / NIST CSF)
  const [showFailoverSim, setShowFailoverSim] = useState(false);
  const [failoverProcId, setFailoverProcId] = useState(db.processosCriticos.list()[0]?.id_processo || '');
  const [failoverTimer, setFailoverTimer] = useState(0);
  const [failoverActive, setFailoverActive] = useState(false);
  const [failoverStep, setFailoverStep] = useState(1); // 1: Setup, 2: Comutação Ativa, 3: Conclusão
  const [failoverChecklist, setFailoverChecklist] = useState({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false
  });
  const [failoverOperador, setFailoverOperador] = useState('');

  useEffect(() => {
    let interval = null;
    if (failoverActive) {
      interval = setInterval(() => {
        setFailoverTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [failoverActive]);

  // Estado para sugestão de ajuste automático nos planos (Requisito 5)
  const [sugestaoAjuste, setSugestaoAjuste] = useState(null);

  // Form Fields
  const [tipoTeste, setTipoTeste] = useState('simulacao_mesa');
  const [formData, setFormData] = useState({
    data_teste: '',
    resultado: 'Sucesso',
    areas_melhoria: ''
  });

  const [cenariosForm, setCenariosForm] = useState({
    acesso: { resultado: 'passou', observacoes: '' },
    sistemas: { resultado: 'passou', observacoes: '' },
    fornecedores: { resultado: 'passou', observacoes: '' },
    pessoas: { resultado: 'passou', observacoes: '' }
  });

  const [participantesInput, setParticipantesInput] = useState('');
  const [evidenciaForm, setEvidenciaForm] = useState({ nome: '', descricao: '' });
  const [planoAcaoDesc, setPlanoAcaoDesc] = useState('');
  const [planoAcaoPrazo, setPlanoAcaoPrazo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.data_teste || !selectedPlanId) {
      setNotification({ type: 'error', text: 'Preencha todos os campos obrigatórios (*).' });
      return;
    }

    const cenarios_testados = [
      { cenario: 'acesso', resultado: cenariosForm.acesso.resultado, observacoes: cenariosForm.acesso.observacoes },
      { cenario: 'sistemas', resultado: cenariosForm.sistemas.resultado, observacoes: cenariosForm.sistemas.observacoes },
      { cenario: 'fornecedores', resultado: cenariosForm.fornecedores.resultado, observacoes: cenariosForm.fornecedores.observacoes },
      { cenario: 'pessoas', resultado: cenariosForm.pessoas.resultado, observacoes: cenariosForm.pessoas.observacoes }
    ];

    const falhouAlgum = cenarios_testados.some(c => c.resultado === 'falhou');

    if (falhouAlgum && (!planoAcaoDesc || !planoAcaoPrazo)) {
      setNotification({ type: 'error', text: 'Como um ou mais cenários falharam, a descrição e o prazo do Plano de Ação mitigatório são obrigatórios.' });
      return;
    }

    const pco = planosPco.find(p => p.id_processo === selectedPlanId);
    const prd = planosPrd.find(p => p.id_processo === selectedPlanId);

    let gerou_plano_acao = false;
    let id_plano_acao = null;

    if (falhouAlgum && planoAcaoDesc) {
      const pa = db.planosAcao.create({
        descricao: `Mitigação de falha no Teste do Processo ${selectedPlanId}: ${planoAcaoDesc}`,
        prazo: planoAcaoPrazo,
        responsavel: 'Geric / Gestor do Processo',
        status: 'Pendente',
        id_processo: selectedPlanId
      });
      gerou_plano_acao = true;
      id_plano_acao = pa.id_plano_acao;
    }

    const resultadoGeral = falhouAlgum ? 'Falha' : formData.resultado;

    const novoTeste = db.testesAvaliacoes.create({
      id_pco: pco?.id_pco || null,
      id_prd: prd?.id_prd || null,
      id_processo: selectedPlanId,
      tipo_teste: tipoTeste,
      data_teste: formData.data_teste,
      resultado: resultadoGeral,
      areas_melhoria: formData.areas_melhoria,
      cenarios_testados,
      participantes: participantesInput.split(',').map(p => p.trim()).filter(Boolean),
      evidencias: evidenciaForm.nome ? [evidenciaForm] : [],
      gerou_plano_acao,
      id_plano_acao
    });

    recarregarListas();
    setShowForm(false);
    setNotification({ type: 'success', text: `Teste registrado com sucesso! ${gerou_plano_acao ? `Plano de Ação ${id_plano_acao} criado.` : ''}` });

    // AJUSTE AUTOMÁTICO NOS PLANOS (Requisito 5)
    if (resultadoGeral === 'Falha' || resultadoGeral === 'Sucesso Parcial') {
      const processo = processos.find(p => p.id_processo === selectedPlanId);
      const ain = db.analiseImpactoNegocio.getForProcesso(selectedPlanId);
      
      if (processo && ain) {
        setSugestaoAjuste({
          processoId: selectedPlanId,
          processoNome: processo.nome,
          ainOriginal: ain,
          rtoSugerido: ain.RTO + 15,
          rpoSugerido: Math.max(5, Math.round(ain.RPO / 2)),
          motivo: formData.areas_melhoria || 'Falha identificada no teste por cenário.'
        });
      }
    } else {
      setSugestaoAjuste(null);
    }

    // Reset forms
    setFormData({ data_teste: '', resultado: 'Sucesso', areas_melhoria: '' });
    setTipoTeste('simulacao_mesa');
    setCenariosForm({
      acesso: { resultado: 'passou', observacoes: '' },
      sistemas: { resultado: 'passou', observacoes: '' },
      fornecedores: { resultado: 'passou', observacoes: '' },
      pessoas: { resultado: 'passou', observacoes: '' }
    });
    setParticipantesInput('');
    setEvidenciaForm({ nome: '', descricao: '' });
    setPlanoAcaoDesc('');
    setPlanoAcaoPrazo('');
  };

  // Aplicar ajuste sugerido automaticamente no banco
  const aplicarAjusteSugerido = () => {
    if (!sugestaoAjuste) return;

    db.analiseImpactoNegocio.save({
      ...sugestaoAjuste.ainOriginal,
      RTO: sugestaoAjuste.rtoSugerido,
      RPO: sugestaoAjuste.rpoSugerido
    });

    const prd = db.planosRecuperacaoDesastres.getForProcesso(sugestaoAjuste.processoId);
    if (prd) {
      db.planosRecuperacaoDesastres.save({
        ...prd,
        frequencia_backup: `A cada ${sugestaoAjuste.rpoSugerido} minutos`
      });
    }

    setNotification({
      type: 'success',
      text: `Ajuste automático aplicado! Os parâmetros de RTO/RPO do processo "${sugestaoAjuste.processoNome}" foram otimizados no banco.`
    });
    setSugestaoAjuste(null);
  };

  // ── SIMULADOR TABLETOP INTERATIVO (Requisito 5) ────────────────────────────
  const tabletopData = {
    acesso: {
      titulo: 'Acesso / Bloqueio Predial',
      p1: {
        pergunta: 'Central predial acusa princípio de incêndio no 3º andar do Edifício Sede. O PCO prevê evacuação total. Qual a ação imediata do time de continuidade?',
        opcoes: [
          { text: 'A) Iniciar a evacuação imediata das escadas, acionar a brigada de incêndio interna e iniciar o log do evento.', score: 35, feedback: 'Excelente! Ações imediatas de salvaguarda de vidas e registro são prioritárias.' },
          { text: 'B) Aguardar confirmação visual ou ligação da portaria para não causar alarme falso.', score: 0, feedback: 'Risco alto! Em crises prediais, minutos salvam vidas. Nunca retarde a evacuação.' },
          { text: 'C) Desativar a sirene para poder ligar com calma para o gerente de infraestrutura.', score: 5, feedback: 'Ineficaz! Desligar alarmes pode induzir a equipe ao erro e colocar vidas em risco.' }
        ]
      },
      p2: {
        pergunta: 'Durante a descida pelas escadas, a equipe é notificada que 3 colaboradores ficaram travados em um elevador sem ventilação. Qual a decisão técnica?',
        opcoes: [
          { text: 'A) Acionar imediatamente os bombeiros e manter a evacuação principal sem tentar forçar as portas.', score: 35, feedback: 'Correto! Resgate técnico deve ser feito por profissionais enquanto a evacuação prossegue.' },
          { text: 'B) Tentar abrir as portas do elevador usando chaves de fenda do setor técnico.', score: 10, feedback: 'Risco de queda! Abrir elevadores manualmente sem treinamento técnico é perigoso.' },
          { text: 'C) Pausar a evacuação de todos e aguardar no hall até que os colaboradores sejam resgatados.', score: 0, feedback: 'Ação crítica incorreta! Não coloque toda a equipe em perigo por uma falha pontual.' }
        ]
      },
      p3: {
        pergunta: 'A evacuação foi concluída com sucesso. No entanto, uma equipe de jornalistas locais está na portaria filmando e solicitando esclarecimentos. Como proceder?',
        opcoes: [
          { text: 'A) Redirecionar os jornalistas para os contatos oficiais da Gemac e isolar a área segura de evacuação.', score: 30, feedback: 'Correto! Pronunciamentos não autorizados geram pânico e danos à imagem da empresa.' },
          { text: 'B) Dar entrevista explicando detalhadamente o curto-circuito no CPD.', score: 5, feedback: 'Inadequado! A Gemac coordena a comunicação oficial para garantir a consistência das informações.' },
          { text: 'C) Ignorar os jornalistas e mandar toda a equipe ir embora para casa sem orientações.', score: 10, feedback: 'Evite omissão! Mandar equipes embora sem controle dificulta a contagem e verificação de segurança.' }
        ]
      }
    },
    sistemas: {
      titulo: 'Indisponibilidade de Sistemas Críticos',
      p1: {
        pergunta: 'O sistema principal de liquidação financeira parou de responder e a fila de transações está acumulando. Qual a primeira providência da equipe?',
        opcoes: [
          { text: 'A) Validar a falha nos logs de monitoramento e acionar formalmente o failover para o banco de dados secundário.', score: 35, feedback: 'Excelente! Chaveamento para contingência de dados visa restabelecer o RTO.' },
          { text: 'B) Reiniciar o servidor físico repetidas vezes para ver se o serviço volta.', score: 10, feedback: 'Ineficiente! Reinicializações sem diagnóstico podem corromper logs e atrasar o reparo.' },
          { text: 'C) Abrir chamado por e-mail com prioridade baixa e aguardar resposta do fornecedor de cloud.', score: 0, feedback: 'Risco de violação! O RTO é crítico e exige acionamento imediato dos contatos de emergência.' }
        ]
      },
      p2: {
        pergunta: 'O chaveamento automático para o banco secundário falhou por erro de sincronismo de rede. O tempo de RTO limite é de 30 minutos e já se passaram 20 minutos. Decisão?',
        opcoes: [
          { text: 'A) Executar os scripts de failover manual com snapshots consistentes de D-1 e notificar a GERIC do desvio técnico.', score: 35, feedback: 'Excelente! O failover manual é a salvaguarda quando o automatizado falha.' },
          { text: 'B) Insistir no chaveamento automático reiniciando os serviços de cluster.', score: 10, feedback: 'Atraso crítico! Se o cluster automático falhou repetidamente, o manual é a contingência necessária.' },
          { text: 'C) Cancelar o processamento de transações do dia e aguardar o dia seguinte.', score: 0, feedback: 'Prejuízo! Cancelar operações quebra o SLA contratual e acarreta multas pesadas.' }
        ]
      },
      p3: {
        pergunta: 'Os serviços foram reestabelecidos no banco secundário dentro de 26 minutos (dentro do RTO). O que a equipe de continuidade de TI deve fazer agora?',
        opcoes: [
          { text: 'A) Declarar o incidente encerrado, registrar o RTO de 26 min e abrir o log de Lições Aprendidas.', score: 30, feedback: 'Perfeito! O encerramento formal com lições aprendidas garante a melhoria do plano.' },
          { text: 'B) Deixar o sistema rodando na contingência sem monitorar e sem documentar o desvio.', score: 10, feedback: 'Não recomendado! Operar em contingência sem monitoramento ativo é um risco invisível.' },
          { text: 'C) Forçar a volta para o banco principal imediatamente sem diagnosticar a causa da falha.', score: 5, feedback: 'Risco de recidiva! Voltar para a infraestrutura instável sem correção pode reativar a crise.' }
        ]
      }
    }
  };

  const handleSaveTabletopResult = () => {
    const finalScore = tabletopScore;
    const passou = finalScore >= 70;
    const resultado = passou ? 'Sucesso' : 'Falha';

    const pco = planosPco.find(p => p.id_processo === tabletopProcId);
    const prd = planosPrd.find(p => p.id_processo === tabletopProcId);
    
    let id_plano_acao = null;
    let gerou_plano_acao = false;

    if (!passou) {
      const pa = db.planosAcao.create({
        descricao: `Plano de Ação Corretivo — Derivado do Exercício de Mesa Tabletop (Nota: ${finalScore}/100) no processo ${tabletopProcId}. Tratar gaps identificados nas decisões operacionais.`,
        prazo: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
        responsavel: 'Geric / Gestor do Processo',
        status: 'Pendente',
        id_processo: tabletopProcId
      });
      id_plano_acao = pa.id_plano_acao;
      gerou_plano_acao = true;
    }

    db.testesAvaliacoes.create({
      id_pco: pco?.id_pco || null,
      id_prd: prd?.id_prd || null,
      id_processo: tabletopProcId,
      tipo_teste: 'simulacao_mesa',
      data_teste: new Date().toISOString().split('T')[0],
      resultado: resultado,
      areas_melhoria: `Simulação de Mesa Tabletop concluída. Pontuação de prontidão da equipe: ${finalScore}/100. Cenário testado: ${tabletopCenario.toUpperCase()}.`,
      cenarios_testados: [
        { cenario: tabletopCenario, resultado: passou ? 'passou' : 'falhou', observacoes: `Exercício de Mesa Tabletop. Nota obtida: ${finalScore}/100.` }
      ],
      participantes: tabletopParticipantes.split(',').map(p => p.trim()).filter(Boolean),
      evidencias: [{ nome: `Tabletop_Log_${tabletopProcId}.json`, descricao: `Log de escolhas e score final do simulador interactivo (${finalScore} pts).` }],
      gerou_plano_acao,
      id_plano_acao
    });

    if (!passou) {
      const processo = processos.find(p => p.id_processo === tabletopProcId);
      const ain = db.analiseImpactoNegocio.getForProcesso(tabletopProcId);
      if (processo && ain) {
        setSugestaoAjuste({
          processoId: tabletopProcId,
          processoNome: processo.nome,
          ainOriginal: ain,
          rtoSugerido: ain.RTO + 15,
          rpoSugerido: Math.max(5, Math.round(ain.RPO / 2)),
          motivo: `Simulado de Mesa Tabletop falhou (Nota: ${finalScore}/100). Recomendada margem de segurança no RTO.`
        });
      }
    }

    recarregarListas();
    setShowTabletop(false);
    setTabletopStep(1);
    setTabletopScore(0);
    setTabletopAnswers({});
    setTabletopParticipantes('');

    setNotification({
      type: 'success',
      text: `🎮 Exercício Tabletop gravado com sucesso! Prontidão: ${finalScore}%. ${gerou_plano_acao ? `Plano de Ação ${id_plano_acao} criado.` : ''}`
    });
  };

  const handleSaveFailoverResult = () => {
    const proc = processos.find(p => p.id_processo === failoverProcId);
    const pco = planosPco.find(p => p.id_processo === failoverProcId);
    const prd = planosPrd.find(p => p.id_processo === failoverProcId);

    const rtoRealMinutos = Math.ceil(failoverTimer / 60);
    const rtoMetaMinutos = Number(proc?.sla_tic || 30);
    const passou = rtoRealMinutos <= rtoMetaMinutos;

    const novoTeste = db.testesAvaliacoes.create({
      id_pco: pco?.id_pco || null,
      id_prd: prd?.id_prd || null,
      id_processo: failoverProcId,
      tipo_teste: 'simulacao_campo',
      data_teste: new Date().toISOString(),
      resultado: passou ? 'Sucesso' : 'Falha',
      areas_melhoria: `Simulado de Failover de DR (ISO 27031 / NIST). RTO Real obtido: ${Math.floor(failoverTimer / 60)}m ${failoverTimer % 60}s (Meta TIC: ${rtoMetaMinutos} min). Operador: ${failoverOperador || 'Equipe de TI/DRP'}.`,
      acionado_por: failoverOperador || usuario?.nome || 'TI Executor',
      cenarios_testados: [
        { cenario: 'sistemas', resultado: passou ? 'passou' : 'falhou', observacoes: `Failover de site primário para secundário executado em ${Math.floor(failoverTimer / 60)}m ${failoverTimer % 60}s.` }
      ]
    });

    recarregarListas();
    setShowFailoverSim(false);
    setFailoverActive(false);

    // Gerar PDF da Ata
    const interv = db.intervenientes.listForProcesso(failoverProcId);
    const html = pdfService.htmlAtaTeste(novoTeste, proc, pco, interv);
    pdfService.exportar(`Ata de Failover DR — ${novoTeste.id_teste}`, html, {
      nome_empresa: 'GCN System',
      confidencialidade: 'RESTRITO',
      versao: '2026.1',
      autor: 'Geati & Geric — Governança de TIC'
    });

    setNotification({ type: 'success', text: `Simulado de Failover registrado com sucesso! RTO obtido: ${Math.floor(failoverTimer / 60)}m ${failoverTimer % 60}s.` });
  };

  const selectedFailoverProc = processos.find(p => p.id_processo === failoverProcId);
  const selectedFailoverAtivo = db.ativosSistemas.list().find(a => a.id_ativo === selectedFailoverProc?.ativo_cmdb_id);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Informações de Testes */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">Simulações & Exercícios de Emergência</h3>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-2xl leading-relaxed">
            Mantenha a resiliência operacional registrando testes de mesa e simulados práticos de failover de TI. Testes malsucedidos geram recomendações automáticas de ajuste de RTO/RPO e frequência de backups para adequação à ISO 22301.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate() && (
            <>
              <button 
                onClick={() => {
                  setShowFailoverSim(true);
                  setFailoverStep(1);
                  setFailoverTimer(0);
                  setFailoverActive(false);
                  setFailoverChecklist({ step1: false, step2: false, step3: false, step4: false, step5: false });
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
              >
                ⚡ Simulado Failover DR (ISO 27031)
              </button>
              <button 
                onClick={() => { setShowTabletop(true); setTabletopStep(1); setNotification(null); setSugestaoAjuste(null); }}
                className="bg-purple-650 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
              >
                🎮 Iniciar Tabletop Game
              </button>
              <button 
                onClick={() => { setShowForm(true); setNotification(null); setSugestaoAjuste(null); }}
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Registrar Novo Simulado
              </button>
            </>
          )}
        </div>
      </div>

      {/* Feedbacks de Operações */}
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-500" /> {notification.text}
        </div>
      )}

      {/* Sub-Navegação de Abas: Calendário Anual vs Histórico Executado */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveSubTab('calendario')}
          className={`pb-3 text-xs font-extrabold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'calendario'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" /> Plano & Calendário Anual de Exercícios (ISO 22301 §8.5)
        </button>
        <button
          onClick={() => setActiveSubTab('historico')}
          className={`pb-3 text-xs font-extrabold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'historico'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Activity className="w-4 h-4" /> Histórico de Testes Realizados ({testes.length})
        </button>
      </div>

      {/* ═══ ABA 1: PLANO & CALENDÁRIO ANUAL DE SIMULADOS (ISO 22301 §8.5) ═══ */}
      {activeSubTab === 'calendario' && (
        <div className="space-y-6">
          {/* KPI Bar do Plano Anual */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Coordenadas do Plano Anual</span>
              <div className="text-xl font-black text-slate-800 dark:text-white mt-1">4 / 4 Trimestres</div>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">100% de cobertura operacional</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Progresso do Cronograma</span>
              <div className="text-xl font-black text-slate-800 dark:text-white mt-1">50% Executado</div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full w-1/2"></div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Aderência ISO 22301 §8.5</span>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">100% Aderente</div>
              <p className="text-[10px] text-slate-400 mt-1">Exercícios com trilha de evidências</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Auditoria (3ª Linha Geraud)</span>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">Evidências Homologadas</div>
              {canCreate() && (
                <button
                  onClick={() => setShowNovoSimuladoModal(true)}
                  className="mt-2 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Agendar No Plano
                </button>
              )}
            </div>
          </div>

          {/* Cards por Trimestre (Q1, Q2, Q3, Q4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {simuladosAnuais.map((sim) => (
              <div key={sim.id_simulado} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {sim.trimestre}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-1.5 leading-tight">{sim.titulo}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    sim.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    sim.status === 'Agendado' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {sim.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium text-[10px]">Data Agendada:</span>
                    <p className="font-bold text-slate-800 dark:text-white">{new Date(sim.data_agendada).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium text-[10px]">Tipo de Exercício:</span>
                    <p className="font-bold text-slate-800 dark:text-white">{sim.tipo}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium text-[10px]">Gerência Responsável:</span>
                    <p className="font-bold text-slate-800 dark:text-white">{sim.gerencia_responsavel}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium text-[10px]">Resultado RTO:</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      {sim.rto_atingido_min ? `${sim.rto_atingido_min} min (Meta: ${sim.rto_meta_min} min)` : `Meta: ${sim.rto_meta_min} min`}
                    </p>
                  </div>
                </div>

                {/* Evidências & Botão de Trilha */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-500" /> {sim.evidencias?.length || 0} evidência(s) anexa(s)
                  </span>
                  <button
                    onClick={() => setSelectedEvidenciaSim(sim)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold rounded-lg text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Trilha de Evidências & Parecer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal / Card de Sugestão de Ajuste Automático */}
      {sugestaoAjuste && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/35 p-6 rounded-xl space-y-4 animate-bounce-short">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">
                Ajuste Recomendado Detectado para a Resiliência
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-450 mt-1 leading-relaxed">
                Como o teste do processo <strong>"{sugestaoAjuste.processoNome}"</strong> não obteve sucesso ideal, o motor NRGCN sugere otimizar os limites da AIN para aumentar a resiliência e adequar a frequência de backups.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center bg-white dark:bg-slate-900/60 p-4 rounded-lg border border-amber-500/10">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">RTO Atual</p>
              <p className="font-bold text-xs text-slate-600 dark:text-slate-400">{sugestaoAjuste.ainOriginal.RTO} minutos</p>
            </div>
            <div className="text-emerald-500">
              <p className="text-[9px] text-emerald-500 font-bold uppercase">RTO Recomendado</p>
              <p className="font-black text-xs">{sugestaoAjuste.rtoSugerido} minutos</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">RPO Atual</p>
              <p className="font-bold text-xs text-slate-600 dark:text-slate-400">{sugestaoAjuste.ainOriginal.RPO} minutos</p>
            </div>
            <div className="text-emerald-500">
              <p className="text-[9px] text-emerald-500 font-bold uppercase">RPO / Freq. Backup</p>
              <p className="font-black text-xs">{sugestaoAjuste.rpoSugerido} minutos</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSugestaoAjuste(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 text-xs font-semibold rounded-lg"
            >
              Ignorar Recomendação
            </button>
            <button
              onClick={aplicarAjusteSugerido}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Aplicar Ajustes Automáticos
            </button>
          </div>
        </div>
      )}

      {/* Form de Cadastro de Teste */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Registrar Teste por Cenários (ISO 22301)
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Processo Crítico Avaliado *</label>
              <select 
                value={selectedPlanId} 
                onChange={(e) => setSelectedPlanId(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                required
              >
                <option value="">Selecione o Processo</option>
                {processos.map(p => (
                  <option key={p.id_processo} value={p.id_processo}>
                    {p.id_processo} - {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Teste *</label>
              <select 
                value={tipoTeste} 
                onChange={(e) => setTipoTeste(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                required
              >
                <option value="simulacao_mesa">Simulação de Mesa (Tabletop)</option>
                <option value="exercicio_campo">Exercício de Campo</option>
                <option value="teste_tecnico">Teste Técnico / Failover</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Data da Execução *</label>
              <input 
                type="date" 
                value={formData.data_teste} 
                onChange={(e) => setFormData({...formData, data_teste: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Resultado Geral de Referência *</label>
              <select 
                value={formData.resultado} 
                onChange={(e) => setFormData({...formData, resultado: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
              >
                <option value="Sucesso">Sucesso (Dentro dos SLAs do BIA)</option>
                <option value="Sucesso Parcial">Sucesso Parcial</option>
                <option value="Falha">Falha / SLA Estourado</option>
              </select>
            </div>
          </div>

          {/* Checklist dos 4 Cenários do PCO */}
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-850 pt-4">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>📋 Checklist de Teste por Cenário PCO (Obrigatório)</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cenário Acesso */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-250">A - Acesso / Bloqueio Predial</span>
                  <select 
                    value={cenariosForm.acesso.resultado}
                    onChange={(e) => setCenariosForm({ ...cenariosForm, acesso: { ...cenariosForm.acesso, resultado: e.target.value } })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px] font-semibold focus:outline-indigo-500"
                  >
                    <option value="passou">Passou</option>
                    <option value="parcial">Parcial</option>
                    <option value="falhou">Falhou</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={cenariosForm.acesso.observacoes}
                  onChange={(e) => setCenariosForm({ ...cenariosForm, acesso: { ...cenariosForm.acesso, observacoes: e.target.value } })}
                  placeholder="Observações do cenário..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-800 dark:text-white"
                />
              </div>

              {/* Cenário Sistemas */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-250">B - Indisponibilidade de Sistemas</span>
                  <select 
                    value={cenariosForm.sistemas.resultado}
                    onChange={(e) => setCenariosForm({ ...cenariosForm, sistemas: { ...cenariosForm.sistemas, resultado: e.target.value } })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px] font-semibold focus:outline-indigo-500"
                  >
                    <option value="passou">Passou</option>
                    <option value="parcial">Parcial</option>
                    <option value="falhou">Falhou</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={cenariosForm.sistemas.observacoes}
                  onChange={(e) => setCenariosForm({ ...cenariosForm, sistemas: { ...cenariosForm.sistemas, observacoes: e.target.value } })}
                  placeholder="Observações do cenário..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-800 dark:text-white"
                />
              </div>

              {/* Cenário Fornecedores */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-250">C - Fornecedores Críticos</span>
                  <select 
                    value={cenariosForm.fornecedores.resultado}
                    onChange={(e) => setCenariosForm({ ...cenariosForm, fornecedores: { ...cenariosForm.fornecedores, resultado: e.target.value } })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px] font-semibold focus:outline-indigo-500"
                  >
                    <option value="passou">Passou</option>
                    <option value="parcial">Parcial</option>
                    <option value="falhou">Falhou</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={cenariosForm.fornecedores.observacoes}
                  onChange={(e) => setCenariosForm({ ...cenariosForm, fornecedores: { ...cenariosForm.fornecedores, observacoes: e.target.value } })}
                  placeholder="Observações do cenário..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-800 dark:text-white"
                />
              </div>

              {/* Cenário Pessoas */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-250">D - Absenteísmo / Pessoas</span>
                  <select 
                    value={cenariosForm.pessoas.resultado}
                    onChange={(e) => setCenariosForm({ ...cenariosForm, pessoas: { ...cenariosForm.pessoas, resultado: e.target.value } })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px] font-semibold focus:outline-indigo-500"
                  >
                    <option value="passou">Passou</option>
                    <option value="parcial">Parcial</option>
                    <option value="falhou">Falhou</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={cenariosForm.pessoas.observacoes}
                  onChange={(e) => setCenariosForm({ ...cenariosForm, pessoas: { ...cenariosForm.pessoas, observacoes: e.target.value } })}
                  placeholder="Observações do cenário..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Participantes e Evidências */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-850 pt-4 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Lista de Participantes (Nomes separados por vírgula)</label>
              <textarea 
                rows="2"
                value={participantesInput} 
                onChange={(e) => setParticipantesInput(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Ex: Carlos Silva (Geric), Ana Souza (DIAFI), Marcos Reis (Operações)"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase block">Evidência / Registro Documental</label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={evidenciaForm.nome}
                  onChange={(e) => setEvidenciaForm({ ...evidenciaForm, nome: e.target.value })}
                  placeholder="Nome do Arquivo (Ex: ata_simulado.pdf)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                />
                <input 
                  type="text" 
                  value={evidenciaForm.descricao}
                  onChange={(e) => setEvidenciaForm({ ...evidenciaForm, descricao: e.target.value })}
                  placeholder="Descrição (Ex: Lista de assinaturas)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Plano de Ação Condicional se houver falhas */}
          {(cenariosForm.acesso.resultado === 'falhou' || 
            cenariosForm.sistemas.resultado === 'falhou' || 
            cenariosForm.fornecedores.resultado === 'falhou' || 
            cenariosForm.pessoas.resultado === 'falhou') && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">⚠️ Plano de Ação Corretivo Obrigatório (ISO 22301)</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-550 leading-relaxed">
                Como um ou mais cenários falharam no simulado, é necessário registrar um Plano de Ação imediato com descrição das correções e prazo limite.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-rose-600 uppercase">Descrição da Ação Corretiva *</label>
                  <input 
                    type="text" 
                    value={planoAcaoDesc} 
                    onChange={(e) => setPlanoAcaoDesc(e.target.value)} 
                    className="w-full bg-white dark:bg-slate-900 border border-rose-250 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-rose-500" 
                    placeholder="Ex: Contratar link de backup redundante via fibra ótica dedicada..."
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-rose-600 uppercase">Prazo de Resolução *</label>
                  <input 
                    type="date" 
                    value={planoAcaoPrazo} 
                    onChange={(e) => setPlanoAcaoPrazo(e.target.value)} 
                    className="w-full bg-white dark:bg-slate-900 border border-rose-250 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-rose-500" 
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1 md:col-span-3 text-xs">
            <label className="text-xs font-bold text-slate-500 uppercase">Observações Gerais e Áreas de Melhoria</label>
            <textarea 
              rows="2"
              value={formData.areas_melhoria} 
              onChange={(e) => setFormData({...formData, areas_melhoria: e.target.value})} 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
              placeholder="Insira observações gerais do simulado..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Registrar Simulado</button>
          </div>
        </form>
      )}

      {/* Histórico de Testes */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/20">
          <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Histórico de Testes e Simulações</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {testes.map(t => {
            const proc = processos.find(p => p.id_processo === t.id_processo);
            const procNome = proc?.nome || 'Processo Geral';
            const procCrit = proc?.criticidade || 'N/A';
            const pco = planosPco.find(p => p.id_processo === t.id_processo);
            
            const getResultadoColor = (res) => {
              if (res === 'Sucesso') return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/25';
              if (res === 'Sucesso Parcial') return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-500/25';
              return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-500/25';
            };

            const getCenBadge = (res) => {
              if (res === 'passou') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200';
              if (res === 'falhou') return 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 border-rose-200';
              return 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 border-amber-200';
            };

            return (
              <div key={t.id_teste} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 dark:border-slate-850">
                
                {/* Esquerda: Identificador, Data e Tipo */}
                <div className="space-y-1.5 md:w-1/4">
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{t.id_teste}</span>
                  <div className="text-xs text-slate-700 dark:text-slate-350 font-bold flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-450" /> {new Date(t.data_teste).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {t.tipo_teste === 'simulacao_mesa' ? 'Simulação de Mesa (Tabletop)' : 
                     t.tipo_teste === 'exercicio_campo' ? 'Exercício de Campo' : 'Teste Técnico / Failover'}
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border mt-2 ${getResultadoColor(t.resultado)}`}>
                    {t.resultado}
                  </span>
                </div>

                {/* Centro: Processo, Resultados por Cenário, Participantes, Evidências */}
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Processo Evaluated</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{t.id_processo} - {procNome}</p>
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                      Criticidade {procCrit}
                    </span>
                  </div>

                  {/* Resultados Detalhados por Cenário */}
                  {t.cenarios_testados && (
                    <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-150 dark:border-slate-850">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Avaliação Individual por Cenário PCO:</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {t.cenarios_testados.map(c => {
                          const label = { acesso: 'Predial', sistemas: 'Sistemas', fornecedores: 'Fornecedores', pessoas: 'Pessoas' }[c.cenario] || c.cenario;
                          return (
                            <div key={c.cenario} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1">
                              <span className="text-slate-600 dark:text-slate-400 font-medium capitalize">{label}:</span>
                              <span className={`px-1.5 py-0.2 rounded font-black text-[9px] uppercase border ${getCenBadge(c.resultado)}`} title={c.observacoes}>
                                {c.resultado}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Participantes */}
                  {t.participantes && t.participantes.length > 0 && (
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Participantes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.participantes.map((part, pIdx) => (
                          <span key={pIdx} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded flex items-center gap-1 font-semibold border border-slate-200 dark:border-slate-700">
                            <User className="w-2.5 h-2.5 text-slate-450" /> {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidências */}
                  {t.evidencias && t.evidencias.length > 0 && (
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/30 p-2 rounded-lg border border-slate-200 dark:border-slate-800 max-w-xs text-[10px]">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-700 dark:text-slate-350 block truncate">{t.evidencias[0].nome}</span>
                        <span className="text-slate-450 text-[9px]">{t.evidencias[0].descricao || 'Sem descrição'}</span>
                      </div>
                    </div>
                  )}
                  
                  {t.areas_melhoria && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Observações Gerais</span>
                      <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed mt-1">{t.areas_melhoria}</p>
                    </div>
                  )}
                </div>

                {/* Direita: Ações de Plano de Ação e Exportação */}
                <div className="space-y-3 w-full md:w-auto flex flex-col items-end flex-shrink-0">
                  {/* Plano de Ação Gerado */}
                  {t.gerou_plano_acao && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30 text-[10px] w-full md:w-44 text-right space-y-1">
                      <span className="font-bold block uppercase text-[8px]">Plano de Ação Mitigatório</span>
                      <p className="font-semibold truncate">Cód: {t.id_plano_acao}</p>
                      <span className="text-[9px] bg-rose-100 dark:bg-rose-900 px-1.5 py-0.2 rounded font-black">PENDENTE</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const interv = db.intervenientes.listForProcesso(t.id_processo);
                      const html = pdfService.htmlAtaTeste(t, proc, pco, interv);
                      pdfService.exportar(`Ata de Simulado — ${t.id_teste}`, html, {
                        nome_empresa: 'GCN System',
                        confidencialidade: 'RESTRITO',
                        versao: '1.0.0',
                        autor: 'GERIC (2ª Linha)'
                      });
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Exportar Ata (ISO 22301)
                  </button>
                </div>

              </div>
            );
          })}

          {testes.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              Nenhum simulado de emergência registrado até o momento.
            </div>
          )}
        </div>
      </div>
      {/* MODAL: SIMULADOR TABLETOP GAME */}
      {showTabletop && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-250 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-scale-up text-xs text-slate-750 dark:text-slate-350">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎮</span>
                <h3 className="font-extrabold text-slate-850 dark:text-white uppercase tracking-wider text-xs">
                  Tabletop Simulation Runner (ISO 22301 §8.5)
                </h3>
              </div>
              <button 
                onClick={() => setShowTabletop(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <span className="text-base">✕</span>
              </button>
            </div>

            {/* Corpo / Conteúdo do Simulado */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* PASSO 1: CONFIGURAÇÃO INICIAL */}
              {tabletopStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-955 p-4 rounded-xl border border-purple-100 dark:border-purple-900/40 text-purple-855 dark:text-purple-300">
                    <p className="font-bold">Bem-vindo ao Simulador de Exercício de Mesa Tabletop!</p>
                    <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                      O teste de mesa (Tabletop) é uma ferramenta essencial para treinar equipes nas diretrizes de PCO/PRD. Vocês enfrentarão um cenário de desastre simulado onde suas decisões operacionais serão pontuadas de acordo com as melhores práticas de resiliência corporativa.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Processo sob Teste *</label>
                      <select 
                        value={tabletopProcId}
                        onChange={(e) => setTabletopProcId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 font-semibold text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                      >
                        {processos.map(p => (
                          <option key={p.id_processo} value={p.id_processo}>{p.id_processo} - {p.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Cenário de Crise *</label>
                      <select 
                        value={tabletopCenario}
                        onChange={(e) => setTabletopCenario(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 font-semibold text-slate-855 dark:text-slate-200 focus:outline-indigo-500"
                      >
                        <option value="sistemas">Indisponibilidade de Sistemas (TI/PRD)</option>
                        <option value="acesso">Bloqueio / Acesso Predial (PCO)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Participantes Integrantes *</label>
                    <input 
                      type="text"
                      placeholder="Ex: Sandro Lima, Roberta Costa, Bruno Alves"
                      value={tabletopParticipantes}
                      onChange={(e) => setTabletopParticipantes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                      required
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">Separe os nomes por vírgula.</span>
                  </div>

                  <button 
                    onClick={() => {
                      if (!tabletopParticipantes.trim()) {
                        alert('Por favor, informe os participantes do simulado.');
                        return;
                      }
                      setTabletopStep(2);
                      setTabletopScore(0);
                    }}
                    className="w-full bg-purple-650 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-xs text-xs"
                  >
                    🚀 Iniciar Exercício
                  </button>
                </div>
              )}

              {/* PERGUNTA 1, 2, 3 */}
              {[2, 3, 4].includes(tabletopStep) && (() => {
                const questionKey = `p${tabletopStep - 1}`;
                const dataCenario = tabletopData[tabletopCenario];
                if (!dataCenario) return null;
                const questionData = dataCenario[questionKey];
                
                return (
                  <div className="space-y-6">
                    {/* Barra de Progresso do Tabletop */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                      <span>Progresso: Passo {tabletopStep - 1} de 3</span>
                      <span>Score Atual: {tabletopScore} pts</span>
                    </div>
                    <div className="w-full bg-slate-150 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full transition-all" style={{ width: `${((tabletopStep - 1) / 3) * 100}%` }} />
                    </div>

                    {/* Pergunta */}
                    <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                      <span className="text-[9px] text-purple-650 font-black uppercase tracking-wider block mb-1">Cenário: {dataCenario.titulo}</span>
                      <p className="text-xs font-bold leading-relaxed text-slate-850 dark:text-white">
                        {questionData.pergunta}
                      </p>
                    </div>

                    {/* Alternativas */}
                    <div className="space-y-3">
                      {questionData.opcoes.map((opt, oIdx) => {
                        const isSelected = tabletopAnswers[questionKey] === oIdx;
                        return (
                          <div 
                            key={oIdx}
                            onClick={() => {
                              if (tabletopAnswers[questionKey] === undefined) {
                                setTabletopAnswers(prev => ({ ...prev, [questionKey]: oIdx }));
                                setTabletopScore(prev => prev + opt.score);
                              }
                            }}
                            className={`p-4 rounded-xl border text-xs leading-relaxed transition-all ${
                              tabletopAnswers[questionKey] === undefined 
                                ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-purple-300' 
                                : isSelected 
                                ? 'border-purple-500 bg-purple-50/10 dark:bg-purple-950/20' 
                                : 'opacity-60 border-slate-250 dark:border-slate-850'
                            }`}
                          >
                            <p className="font-semibold text-slate-750 dark:text-slate-350">{opt.text}</p>
                            {tabletopAnswers[questionKey] !== undefined && isSelected && (
                              <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-800 dark:text-purple-300 rounded-lg">
                                💡 <strong>Feedback:</strong> {opt.feedback} <span className="font-bold">({opt.score} pontos obtidos)</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Botão de Avanço */}
                    {tabletopAnswers[questionKey] !== undefined && (
                      <button 
                        onClick={() => setTabletopStep(prev => prev + 1)}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
                      >
                        Avançar Cenário ➔
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* PASSO 5: CONCLUSÃO */}
              {tabletopStep === 5 && (
                <div className="space-y-6 text-center animate-fade-in">
                  <div className="bg-purple-50 dark:bg-purple-955 p-6 rounded-xl border border-purple-100 dark:border-purple-900/40 space-y-4">
                    <span className="text-4xl">🏆</span>
                    <div>
                      <h4 className="font-black text-slate-850 dark:text-white text-sm uppercase">Simulação Tabletop Concluída!</h4>
                      <p className="text-[10px] text-slate-450 mt-1">Cenário: {tabletopData[tabletopCenario]?.titulo}</p>
                    </div>

                    {/* Score Central */}
                    <div className="inline-block bg-white dark:bg-slate-950 px-6 py-4 rounded-2xl border border-purple-200 dark:border-purple-800">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Pontuação de Prontidão</span>
                      <strong className="text-3xl font-black text-purple-650 dark:text-purple-400">{tabletopScore} <span className="text-xs font-normal text-slate-450">/ 100</span></strong>
                    </div>

                    {/* Diagnóstico */}
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-350 leading-relaxed max-w-md mx-auto">
                      {tabletopScore >= 90 ? 'Excelente! A equipe tomou as decisões operacionais ideais de resiliência e failover conforme as normas ISO 22301 e 27031.' :
                       tabletopScore >= 70 ? 'Prontidão Aprovada. A equipe demonstrou boa capacidade de contingência, mas há pequenas oportunidades de melhoria documental.' :
                       'Atenção: A equipe tomou decisões não recomendadas que causariam perda do RTO. Recomenda-se treinamento imediato e revisão do PCO.'}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setShowTabletop(false);
                        setTabletopStep(1);
                        setTabletopScore(0);
                        setTabletopAnswers({});
                        setTabletopParticipantes('');
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl cursor-pointer"
                    >
                      Descartar Exercício
                    </button>
                    <button 
                      onClick={handleSaveTabletopResult}
                      className="flex-1 bg-purple-650 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      💾 Gravar como Teste Oficial
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* MODAL: SIMULADOR DE FAILOVER DE DR (ISO 27031 / NIST CSF) */}
      {showFailoverSim && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-rose-500/30 shadow-2xl overflow-hidden flex flex-col animate-scale-up text-xs text-slate-750 dark:text-slate-350">
            
            {/* Header Modal */}
            <div className="p-4 border-b border-rose-500/20 bg-rose-950/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <div>
                  <h3 className="font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider text-xs">
                    Simulador de Failover & Comutação de Site DR (ISO 27031 / NIST CSF)
                  </h3>
                  <p className="text-[10px] text-slate-400">Teste de Comutação Real em Tempo Real de Data Center Primário para Secundário</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowFailoverSim(false); setFailoverActive(false); }}
                className="p-1 rounded-lg hover:bg-rose-900/30 text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="text-base">✕</span>
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* PASSO 1: CONFIGURAÇÃO DO SIMULADO */}
              {failoverStep === 1 && (
                <div className="space-y-5">
                  <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 space-y-2">
                    <p className="font-bold text-sm">🎯 Preparação para a Comutação de DR</p>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Selecione o processo e ativo crítico CMDB para simular a queda de infraestrutura primária e alternância para a réplica de DR. Ao iniciar, o cronômetro de RTO em tempo real começará a contar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Processo Crítico *</label>
                      <select 
                        value={failoverProcId}
                        onChange={(e) => setFailoverProcId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 font-bold text-slate-850 dark:text-slate-200 focus:outline-rose-500"
                      >
                        {processos.map(p => (
                          <option key={p.id_processo} value={p.id_processo}>{p.id_processo} - {p.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Líder / Operador do Failover *</label>
                      <input 
                        type="text"
                        placeholder="Ex: Patrícia Lima (Gestora Getic)"
                        value={failoverOperador}
                        onChange={(e) => setFailoverOperador(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-850 dark:text-slate-200 focus:outline-rose-500 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Resumo do Ativo CMDB */}
                  {selectedFailoverProc && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-200 dark:border-slate-850 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Ativo CMDB</span>
                        <strong className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{selectedFailoverAtivo?.nome || selectedFailoverProc.ativo_cmdb_id || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Criticidade CMDB</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${selectedFailoverAtivo?.criticidade_contrato === 'C0' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>
                          {selectedFailoverAtivo?.criticidade_contrato || 'C0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Estratégia DR</span>
                        <strong className="text-xs text-amber-600 dark:text-amber-400 font-bold">{selectedFailoverProc.estrategia_drp || 'Hot Standby'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">SLA Meta TIC</span>
                        <strong className="text-xs text-emerald-600 dark:text-emerald-400 font-black">{selectedFailoverProc.sla_tic || 15} minutos</strong>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      if (!failoverOperador.trim()) {
                        alert('Informe o operador responsável pelo Failover.');
                        return;
                      }
                      setFailoverStep(2);
                      setFailoverTimer(0);
                      setFailoverActive(true);
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md text-xs flex items-center justify-center gap-2"
                  >
                    ▶️ Iniciar Comutação em Tempo Real (Start Chronometer)
                  </button>
                </div>
              )}

              {/* PASSO 2: EXECUÇÃO DA COMUTAÇÃO COM CRONÔMETRO */}
              {failoverStep === 2 && (
                <div className="space-y-6">
                  
                  {/* DISPLAY CENTRAL DO CRONÔMETRO RTO */}
                  <div className="bg-slate-900 border-2 border-rose-500/50 rounded-2xl p-6 text-center space-y-2 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-rose-500/20 px-2.5 py-1 rounded-full text-rose-400 border border-rose-500/30">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-[9px] font-black uppercase tracking-wider">FAILOVER EM EXECUÇÃO</span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Tempo Decorrido de Downtime (RTO Real)</span>
                    
                    <div className="text-5xl font-black text-rose-400 font-mono tracking-wider">
                      {String(Math.floor(failoverTimer / 60)).padStart(2, '0')}:{String(failoverTimer % 60).padStart(2, '0')}
                    </div>

                    <div className="text-[10px] text-slate-400 flex justify-center gap-4 pt-1">
                      <span>RTO Meta TIC: <strong className="text-emerald-400 font-bold">{selectedFailoverProc?.sla_tic || 15}:00 min</strong></span>
                      <span>SLA Cliente: <strong className="text-sky-400 font-bold">{selectedFailoverProc?.sla_contrato_cliente || 30}:00 min</strong></span>
                    </div>
                  </div>

                  {/* CHECKLIST DE PROCEDIMENTOS DE FAILOVER */}
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-955 p-5 rounded-xl border border-slate-200 dark:border-slate-850">
                    <h4 className="font-extrabold text-slate-850 dark:text-white text-xs uppercase tracking-wider">
                      Checklist Técnico de Comutação (Passo a Passo)
                    </h4>

                    {[
                      { key: 'step1', title: '1. Health Check & Isolamento do Site Primário', desc: 'Isolar tráfego no Data Center Primário (AWS us-east-1) e interromper requisições ativas.' },
                      { key: 'step2', title: '2. Promoção do Banco de Dados Secundário (Read Replica)', desc: 'Promover a réplica do banco de dados DR para o modo Primary de leitura e escrita.' },
                      { key: 'step3', title: '3. Redirecionamento de DNS & CNAME Route 53', desc: 'Alterar apontamento de DNS corporativo para o IP/Endpoint do Data Center Secundário (us-west-2).' },
                      { key: 'step4', title: '4. Testes de Sanidade das APIs (Smoke Test 200 OK)', desc: 'Validar resposta da API transacional no ambiente secundário com requisições sintéticas.' },
                      { key: 'step5', title: '5. Liberação das Operações & Notificação da Crise', desc: 'Confirmar restauração completa dos serviços e notificar Comitê de Crise e GERIC.' },
                    ].map(st => (
                      <label key={st.key} className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        failoverChecklist[st.key] ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}>
                        <input 
                          type="checkbox"
                          checked={failoverChecklist[st.key]}
                          onChange={(e) => setFailoverChecklist({ ...failoverChecklist, [st.key]: e.target.checked })}
                          className="mt-1 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <p className="font-bold text-xs">{st.title}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">{st.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <button 
                    disabled={!Object.values(failoverChecklist).every(Boolean)}
                    onClick={() => {
                      setFailoverActive(false);
                      setFailoverStep(3);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md text-xs"
                  >
                    ⏹️ Finalizar Comutação & Gravar Resultado
                  </button>
                </div>
              )}

              {/* PASSO 3: CONCLUSÃO & DIAGNÓSTICO DO FAILOVER */}
              {failoverStep === 3 && (
                <div className="space-y-6 text-center animate-fade-in">
                  <div className="bg-slate-50 dark:bg-slate-955 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <span className="text-4xl">🏁</span>
                    <div>
                      <h4 className="font-black text-slate-850 dark:text-white text-sm uppercase">Comutação de DR Finalizada!</h4>
                      <p className="text-[10px] text-slate-450 mt-0.5">Processo: {selectedFailoverProc?.nome} • Ativo CMDB: {selectedFailoverAtivo?.nome || selectedFailoverProc?.ativo_cmdb_id}</p>
                    </div>

                    {/* RTO Real vs Meta */}
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">RTO Real Obtido</span>
                        <strong className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                          {String(Math.floor(failoverTimer / 60)).padStart(2, '0')}:{String(failoverTimer % 60).padStart(2, '0')}
                        </strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">RTO Meta TIC</span>
                        <strong className="text-2xl font-black text-slate-700 dark:text-slate-300">
                          {selectedFailoverProc?.sla_tic || 15}:00 min
                        </strong>
                      </div>
                    </div>

                    {/* Status de Aderência ao SLA */}
                    <div className="max-w-md mx-auto">
                      {Math.ceil(failoverTimer / 60) <= Number(selectedFailoverProc?.sla_tic || 15) ? (
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs font-extrabold uppercase">
                          ✅ COMUTAÇÃO DE DR EXECUTADA DENTRO DO SLA DE TIC!
                        </div>
                      ) : (
                        <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-300 dark:border-rose-800 text-xs font-extrabold uppercase">
                          ⚠️ ESTOURO DE RTO DE TIC — GARGALO TÉCNICO REGISTRADO
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setShowFailoverSim(false);
                        setFailoverActive(false);
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveFailoverResult}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-md text-xs"
                    >
                      💾 Gravar Teste & Gerar Ata de Failover (PDF)
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ═══ MODAL: TRILHA DE EVIDÊNCIAS & PARECER DE AUDITORIA ═══ */}
      {selectedEvidenciaSim && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400">
                  {selectedEvidenciaSim.trimestre} • {selectedEvidenciaSim.tipo}
                </span>
                <h3 className="font-extrabold text-base text-slate-800 dark:text-white mt-0.5">
                  {selectedEvidenciaSim.titulo}
                </h3>
              </div>
              <button onClick={() => setSelectedEvidenciaSim(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">✕ Fechar</button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Status & RTO */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 font-medium text-[10px] block">Status do Simulado:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{selectedEvidenciaSim.status} — {selectedEvidenciaSim.resultado}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium text-[10px] block">RTO de Execução:</span>
                  <span className="font-extrabold text-slate-800 dark:text-white">
                    {selectedEvidenciaSim.rto_atingido_min ? `${selectedEvidenciaSim.rto_atingido_min} min` : 'Em Agendamento'} (Meta: {selectedEvidenciaSim.rto_meta_min} min)
                  </span>
                </div>
              </div>

              {/* Lista de Evidências Anexadas */}
              <div className="space-y-2">
                <span className="font-extrabold uppercase text-[10px] text-slate-500 block">📁 Evidências Digitais de Execução</span>
                {selectedEvidenciaSim.evidencias && selectedEvidenciaSim.evidencias.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEvidenciaSim.evidencias.map((ev, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-indigo-500" />
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white">{ev.nome}</p>
                            <p className="text-[10px] text-slate-400">{ev.tipo} • {ev.tamanho}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Verificado OK</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Nenhuma evidência anexa até a realização do exercício.</p>
                )}
              </div>

              {/* Parecer GERIC (2ª Linha) */}
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-850 rounded-xl space-y-1">
                <span className="font-extrabold text-[10px] uppercase text-indigo-700 dark:text-indigo-300 block">
                  🛡️ Parecer da 2ª Linha (GERIC — Gestão de Riscos & GCN)
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">{selectedEvidenciaSim.parecer_geric}</p>
              </div>

              {/* Homologação GERAUD (3ª Linha) */}
              <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-850 rounded-xl space-y-1">
                <span className="font-extrabold text-[10px] uppercase text-emerald-700 dark:text-emerald-300 block">
                  ⚖️ Homologação da 3ª Linha (GERAUD — Auditoria Interna Independente)
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">{selectedEvidenciaSim.parecer_auditoria}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedEvidenciaSim(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Concluir Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: AGENDAR NOVO SIMULADO CORPORATIVO NO PLANO ANUAL ═══ */}
      {showNovoSimuladoModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleCreateNovoSimuladoAnual} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" /> Agendar Exercício no Plano Anual (ISO 22301 §8.5)
              </h3>
              <button type="button" onClick={() => setShowNovoSimuladoModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Título do Simulado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Simulado de Contingência de Câmbio..."
                  value={novoSimuladoForm.titulo}
                  onChange={(e) => setNovoSimuladoForm({ ...novoSimuladoForm, titulo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase text-[10px]">Trimestre *</label>
                  <select
                    value={novoSimuladoForm.trimestre}
                    onChange={(e) => setNovoSimuladoForm({ ...novoSimuladoForm, trimestre: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                  >
                    <option value="Q1 2026">Q1 2026</option>
                    <option value="Q2 2026">Q2 2026</option>
                    <option value="Q3 2026">Q3 2026</option>
                    <option value="Q4 2026">Q4 2026</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase text-[10px]">Data Agendada *</label>
                  <input
                    type="date"
                    required
                    value={novoSimuladoForm.data_agendada}
                    onChange={(e) => setNovoSimuladoForm({ ...novoSimuladoForm, data_agendada: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase text-[10px]">Tipo de Exercício *</label>
                  <select
                    value={novoSimuladoForm.tipo}
                    onChange={(e) => setNovoSimuladoForm({ ...novoSimuladoForm, tipo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                  >
                    <option value="Simulação de Mesa (Tabletop)">Simulação de Mesa (Tabletop)</option>
                    <option value="Exercício Prático de Campo">Exercício Prático de Campo</option>
                    <option value="Teste Técnico de DR / Failover">Teste Técnico de DR / Failover</option>
                    <option value="Simulado Cyber / Red Team">Simulado Cyber / Red Team</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase text-[10px]">Gerência Responsável *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Getic / Gecob"
                    value={novoSimuladoForm.gerencia_responsavel}
                    onChange={(e) => setNovoSimuladoForm({ ...novoSimuladoForm, gerencia_responsavel: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase text-[10px]">Meta de RTO (Minutos) *</label>
                <input
                  type="number"
                  required
                  value={novoSimuladoForm.rto_meta_min}
                  onChange={(e) => setNovoSimuladoForm({ ...novoSimuladoForm, rto_meta_min: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setShowNovoSimuladoModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold text-xs rounded-lg cursor-pointer">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer">Confirmar Agendamento</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
