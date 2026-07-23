import React, { useState, useEffect } from 'react';
import { ShieldCheck, Award, Info, CheckSquare, Save } from 'lucide-react';

export default function AvaliacaoMaturidade({ db }) {
  const [processos] = useState(db.processosCriticos.list());
  const [avaliacoes, setAvaliacoes] = useState(db.avaliacaoNRGCN.list());
  
  // Estado local
  const [selectedProcId, setSelectedProcId] = useState(processos[0]?.id_processo || '');
  const [notification, setNotification] = useState(null);

  // Requisitos ISO 22301 mapeados para Checklist de conformidade
  const requisitosISO = [
    { id: 'req_politica', label: 'Política de Continuidade de Negócios aprovada pela Diretoria', pilar: 'Escopo' },
    { id: 'req_bia', label: 'BIA (Análise de Impacto) documentada com RTO e RPO validados', pilar: 'AIN' },
    { id: 'req_pco', label: 'Plano PCO cadastrado e aprovado pelo comitê GERIC', pilar: 'Planos' },
    { id: 'req_prd', label: 'Plano PRD de infraestrutura técnica e backup ativo em contingência', pilar: 'Planos' },
    { id: 'req_testes', label: 'Simulado prático de failover concluído com sucesso nos últimos 12 meses', pilar: 'Testes' },
    { id: 'req_revisao', label: 'Revisão e versionamento do plano atualizados no último semestre', pilar: 'Melhoria' },
    { id: 'req_governanca', label: 'Responsável e equipe de crise treinados e vinculados ao processo', pilar: 'Governança' }
  ];

  // Checklist marcado
  const [checklist, setChecklist] = useState({
    req_politica: false,
    req_bia: false,
    req_pco: false,
    req_prd: false,
    req_testes: false,
    req_revisao: false,
    req_governanca: false
  });

  // Carregar dados de avaliação do processo selecionado
  useEffect(() => {
    if (selectedProcId) {
      const av = db.avaliacaoNRGCN.list().find(a => a.id_processo === selectedProcId);
      if (av && av.metricas_utilizadas) {
        try {
          const checkedReqs = JSON.parse(av.metricas_utilizadas);
          setChecklist(checkedReqs);
        } catch (e) {
          resetChecklist();
        }
      } else {
        // Inicializa vazio ou de acordo com andamento real no banco
        const pco = db.planosContinuidade.getForProcesso(selectedProcId);
        const prd = db.planosRecuperacaoDesastres.getForProcesso(selectedProcId);
        const ain = db.analiseImpactoNegocio.getForProcesso(selectedProcId);
        const gov = db.governancaGCN.list().find(g => g.id_processo === selectedProcId);
        const testes = db.testesAvaliacoes.list().filter(t => t.pco?.id_processo === selectedProcId || t.prd?.id_processo === selectedProcId);

        setChecklist({
          req_politica: true, // assume escopo mapeado
          req_bia: !!ain,
          req_pco: pco?.status_aprovacao === 'Aprovado',
          req_prd: !!prd,
          req_testes: testes.some(t => t.resultado === 'Sucesso'),
          req_revisao: testes.length > 0,
          req_governanca: !!gov
        });
      }
      setNotification(null);
    }
  }, [selectedProcId]);

  const resetChecklist = () => {
    setChecklist({
      req_politica: false,
      req_bia: false,
      req_pco: false,
      req_prd: false,
      req_testes: false,
      req_revisao: false,
      req_governanca: false
    });
  };

  const handleCheckboxChange = (reqId) => {
    setChecklist(prev => ({
      ...prev,
      [reqId]: !prev[reqId]
    }));
  };

  // CÁLCULO DE MATURIDADE NRGCN DINÂMICO
  const calcularMaturidade = () => {
    const totalReqs = requisitosISO.length;
    const checkedCount = Object.values(checklist).filter(Boolean).length;
    
    // Percentual de aderência
    const aderenca = (checkedCount / totalReqs) * 100;
    
    // Escala de resiliência de 1.0 a 5.0
    // 0 marcados = 1.0, todos marcados = 5.0
    const resiliencia = 1.0 + (checkedCount / totalReqs) * 4.0;

    return {
      aderenca: Number(aderenca.toFixed(1)),
      resiliencia: Number(resiliencia.toFixed(2))
    };
  };

  const currentProcess = processos.find(p => p.id_processo === selectedProcId);
  const { aderenca, resiliencia } = calcularMaturidade();

  const handleSave = () => {
    if (!selectedProcId) return;

    db.avaliacaoNRGCN.save({
      id_processo: selectedProcId,
      nivel_resiliencia: resiliencia,
      aderencia_ISO22301: aderenca,
      metricas_utilizadas: JSON.stringify(checklist),
      grafico_resultado: `radar_${selectedProcId}_maturidade`
    });

    setAvaliacoes(db.avaliacaoNRGCN.list());
    setNotification({
      type: 'success',
      text: `Avaliação NRGCN do processo ${selectedProcId} salva! Resiliência atualizada para ${resiliencia} e aderência para ${aderenca}% no Dashboard.`
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Seletor de Processo */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Selecione o Processo para Avaliação</h3>
            <p className="text-[10px] text-slate-400">Verifique os quesitos de maturidade regulatórios da ISO 22301.</p>
          </div>
        </div>
        <select
          value={selectedProcId}
          onChange={(e) => setSelectedProcId(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-700 dark:text-slate-350 focus:outline-indigo-500 font-bold min-w-[280px]"
        >
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
          
          {/* Lado Esquerdo (2/3): Questionário / Requisitos */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Lista de Verificação de Maturidade ISO 22301</h3>
              <span className="text-[10px] text-slate-400 font-bold">Processo: {selectedProcId}</span>
            </div>

            <div className="space-y-4">
              {requisitosISO.map((req) => (
                <div 
                  key={req.id} 
                  onClick={() => handleCheckboxChange(req.id)}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-950/40 ${
                    checklist[req.id] 
                      ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                      checklist[req.id]
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-950'
                    }`}>
                      {checklist[req.id] && <CheckSquare className="w-4 h-4" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-750 dark:text-slate-300">
                      {req.label}
                    </span>
                  </div>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-500 px-2 py-0.5 rounded font-bold uppercase whitespace-nowrap">
                    Pilar: {req.pilar}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-855">
              <button
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" /> Salvar Avaliação de Maturidade
              </button>
            </div>
          </div>

          {/* Lado Direito (1/3): KPIs NRGCN Calculados */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-6">
              <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Mapeamento NRGCN do Processo</h3>

              {/* Rosca de Progresso / Aderência */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG circular simples */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="60" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="10" fill="transparent" />
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="60" 
                    className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-500" 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray={376.9}
                    strokeDashoffset={376.9 - (376.9 * (aderenca / 100))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">{aderenca}%</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Aderência</span>
                </div>
              </div>

              {/* Placa de Nível Resiliência */}
              <div className="w-full bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-850/60">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Nível de Resiliência Estimado</p>
                <h4 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{resiliencia} <span className="text-xs font-normal text-slate-450">/ 5.0</span></h4>
                <p className="text-[10px] text-slate-450 mt-2">
                  {resiliencia >= 4.5 ? 'Nível 5: Resiliência Otimizada e Auditada' :
                   resiliencia >= 3.5 ? 'Nível 4: Resiliência Gerenciada com Testes' :
                   resiliencia >= 2.5 ? 'Nível 3: Planos Definidos e Estruturados' :
                   resiliencia >= 1.5 ? 'Nível 2: Processos Mapeados Inicialmente' :
                   'Nível 1: Vulnerável - Sem Planos de Contingência'}
                </p>
              </div>

              <div className="text-[10px] text-slate-400 flex items-start gap-1.5 leading-normal text-left">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  O cálculo do nível de resiliência e aderência é executado em tempo real. Salvar a avaliação consolidará os dados nos dashboards executivos da área.
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
