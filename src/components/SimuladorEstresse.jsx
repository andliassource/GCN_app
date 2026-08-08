import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Zap, Play, Square, RefreshCw, AlertTriangle, ShieldAlert, 
  Clock, DollarSign, Activity, CheckCircle2, FileText, ArrowRight,
  TrendingUp, Building2, Flame, Droplets, ShieldCheck, Siren, Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CENARIOS_ESTRESSE = [
  {
    id: 'CEN-001',
    titulo: 'Ataque Ransomware na Nuvem AWS',
    categoria: 'Cibersegurança',
    severidade: 'Catastrófica',
    duracaoPadraoHoras: 4,
    processosAfetados: ['PROC-COB-001', 'PROC-COB-003', 'PROC-ATEND-001'],
    descricao: 'Sequestro cibernético das instâncias de aplicação e bancos de dados transacionais hospedados em nuvem.',
    acoesEmergenciais: [
      'Isolar imediatamente vLANs e VPCs atingidas para impedir contágio lateral.',
      'Acionar fornecedor AWS Enterprise Support para restoring dos snapshots limpos no S3 Glacier.',
      'Ativar réplica de banco de dados em região secundária (sa-east-1).',
      'Notificar ANPD (LGPD) e BACEN sobre a suspeita de vazamento/indisponibilidade.'
    ]
  },
  {
    id: 'CEN-002',
    titulo: 'Apagão Elétrico & Falha de Gerador no Data Center',
    categoria: 'Infraestrutura',
    severidade: 'Crítica',
    duracaoPadraoHoras: 6,
    processosAfetados: ['PROC-COB-001', 'PROC-ASTEC-001', 'PROC-ATEND-001'],
    descricao: 'Corte de energia pela concessionária com falha na partida automática do grupo gerador de emergência.',
    acoesEmergenciais: [
      'Nobreaks (UPS) assumem a carga essencial do Data Center pelo SLA de 30 minutos.',
      'Acionar equipe de manutenção predial de emergência para partida manual do gerador.',
      'Desligar servidores de homologação e staging para preservar carga das baterias.',
      'Transferir tráfego dos canais para o Data Center secundário.'
    ]
  },
  {
    id: 'CEN-003',
    titulo: 'Indisponibilidade do Core Banking (Topaz)',
    categoria: 'Sistemas Core',
    severidade: 'Crítica',
    duracaoPadraoHoras: 3,
    processosAfetados: ['PROC-COB-001', 'PROC-COB-002'],
    descricao: 'Pane no motor de liquidação e cobrança do fornecedor Topaz Solutions impedindo processamento CNAB.',
    acoesEmergenciais: [
      'Acionar SLA de suporte L3 da Topaz Solutions (RTO contratual: 30 minutos).',
      'Ativar fila de contingência offline para acumular requisições de liquidação.',
      'Comunicar bancos parceiros sobre eventual atraso na grade de liquidação do BACEN.',
      'Acionar comitê de crises (Geemp) para acompanhamento da janela de conciliação.'
    ]
  },
  {
    id: 'CEN-004',
    titulo: 'Alagamento no Edifício Sede & Evacuação',
    categoria: 'Predial / Pessoas',
    severidade: 'Alta',
    duracaoPadraoHoras: 12,
    processosAfetados: ['PROC-ASTEC-001', 'PROC-ATEND-001'],
    descricao: 'Inundação no subsolo e térreo do edifício sede comprometendo a operação presencial e equipe de campo.',
    acoesEmergenciais: [
      'Disparar protocolo de evacuação emergencial de andares (SLA: 15 minutos).',
      'Ativar regime 100% home office emergencial para os colaboradores de atendimento.',
      'Acionar seguradora predial e bomba de drenagem emergencial.',
      'Gepes: Fazer contagem de colaboradores e checar integridade física.'
    ]
  }
];

export default function SimuladorEstresse({ db }) {
  const { usuario } = useAuth();

  const processos = useMemo(() => (db.processosCriticos?.list ? db.processosCriticos.list() : []), [db]);
  const contratos = useMemo(() => (db.contratos?.list ? db.contratos.list() : []), [db]);
  const terceiros = useMemo(() => (db.fornecedoresCriticosTPRM?.list ? db.fornecedoresCriticosTPRM.list() : []), [db]);

  const [cenarioSelecionado, setCenarioSelecionado] = useState(CENARIOS_ESTRESSE[0]);
  const [duracaoHoras, setDuracaoHoras] = useState(4);
  const [isSimulando, setIsSimulando] = useState(false);
  const [tempoDecorridoSeg, setTempoDecorridoSeg] = useState(0);

  const timerRef = useRef(null);

  useEffect(() => {
    if (isSimulando) {
      timerRef.current = setInterval(() => {
        setTempoDecorridoSeg(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isSimulando]);

  const handleStartSimulacao = () => {
    setIsSimulando(true);
    setTempoDecorridoSeg(0);
  };

  const handleStopSimulacao = () => {
    setIsSimulando(false);
  };

  const handleResetSimulacao = () => {
    setIsSimulando(false);
    setTempoDecorridoSeg(0);
  };

  // ─── CÁLCULOS DO ESTRESSE EM TEMPO REAL ────────────────────────────────────
  
  // Multiplicador de tempo virtual: 1 segundo real = 1 minuto de desastre simular
  const minutosSimulados = isSimulando 
    ? Math.min(tempoDecorridoSeg * 5, duracaoHoras * 60)
    : duracaoHoras * 60;

  const horasSimuladas = (minutosSimulados / 60).toFixed(1);

  // Processos Atingidos no Cenário
  const processosAtingidos = useMemo(() => {
    return processos.map(p => {
      const isAfetadoDiretamente = cenarioSelecionado.processosAfetados.includes(p.id_processo);
      const rtoMinutos = p.sla_contrato_cliente || 60;
      const mtpdMinutos = (p.mtpd_horas || 12) * 60;

      const rtoEstourado = minutosSimulados > rtoMinutos;
      const mtpdExcedido = minutosSimulados > mtpdMinutos;

      const perdaPorHora = p.perda_hora_estimada || 10000;
      const perdaAcumulada = isAfetadoDiretamente ? (perdaPorHora * (minutosSimulados / 60)) : 0;

      let status = 'Normal';
      if (isAfetadoDiretamente) {
        if (mtpdExcedido) status = '🚨 MTPD Violado (Catastrófico)';
        else if (rtoEstourado) status = '⚠️ RTO Estourado (Em Degradação)';
        else status = '⚡ Paralizado (Em Contingência)';
      }

      return {
        ...p,
        isAfetadoDiretamente,
        status,
        rtoMinutos,
        mtpdMinutos,
        rtoEstourado,
        mtpdExcedido,
        perdaAcumulada
      };
    });
  }, [processos, cenarioSelecionado, minutosSimulados]);

  const totalPerdaFinanceira = useMemo(() => {
    return processosAtingidos.reduce((acc, p) => acc + p.perdaAcumulada, 0);
  }, [processosAtingidos]);

  const countProcessosParalisados = useMemo(() => {
    return processosAtingidos.filter(p => p.isAfetadoDiretamente).length;
  }, [processosAtingidos]);

  const countMtpdViolados = useMemo(() => {
    return processosAtingidos.filter(p => p.mtpdExcedido).length;
  }, [processosAtingidos]);

  // Simulador de Monte Carlo Integrado (1.000 iterações estocásticas)
  const monteCarloResults = useMemo(() => {
    if (!cenarioSelecionado) return null;
    const nSimulacoes = 1000;
    const resultados = [];
    
    const perdaHoraBase = cenarioSelecionado.processosAfetados.reduce((sum, pid) => {
      const proc = processos.find(p => p.id_processo === pid);
      return sum + (proc?.perda_hora_estimada || 12000);
    }, 0);

    for (let i = 0; i < nSimulacoes; i++) {
      const variacao = (Math.random() + Math.random() + Math.random() - 1.5) * 1.2;
      const duracaoSim = Math.max(1, duracaoHoras + variacao);
      const multSeveridade = 0.85 + Math.random() * 0.4;
      const perda = perdaHoraBase * duracaoSim * multSeveridade;
      resultados.push(perda);
    }

    resultados.sort((a, b) => a - b);

    const var95 = resultados[Math.floor(nSimulacoes * 0.95)];
    const var99 = resultados[Math.floor(nSimulacoes * 0.99)];
    const mediaPerda = resultados.reduce((a, b) => a + b, 0) / nSimulacoes;

    return {
      var95: Number(var95.toFixed(0)),
      var99: Number(var99.toFixed(0)),
      mediaPerda: Number(mediaPerda.toFixed(0)),
      minPerda: Number(resultados[0].toFixed(0)),
      maxPerda: Number(resultados[nSimulacoes - 1].toFixed(0))
    };
  }, [cenarioSelecionado, duracaoHoras, processos]);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ═══ HEADER SIMULADOR ═══ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 animate-pulse" /> Simulador de Estresse de Crise & Impacto Cascata (What-If)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-3xl">
            Simulador preditivo para teste de resiliência sob cenários hipotéticos de desastre. 
            Monitore o efeito cascata nos processos de negócio, estouro de RTO/MTPD e perdas financeiras acumuladas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isSimulando ? (
            <button
              onClick={handleStartSimulacao}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> Iniciar Simulação em Tempo Real
            </button>
          ) : (
            <button
              onClick={handleStopSimulacao}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer animate-pulse"
            >
              <Square className="w-4 h-4 fill-white" /> Pausar Simulação
            </button>
          )}

          <button
            onClick={handleResetSimulacao}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer transition-colors"
            title="Reiniciar Simulação"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══ CONTROLES DO SELETOR DE CENÁRIOS E PARÂMETROS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Seleção do Cenário */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">1. Selecione o Cenário de Estresse</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CENARIOS_ESTRESSE.map(cen => {
              const isSelected = cenarioSelecionado.id === cen.id;
              return (
                <button
                  key={cen.id}
                  onClick={() => {
                    setCenarioSelecionado(cen);
                    setDuracaoHoras(cen.duracaoPadraoHoras);
                    handleResetSimulacao();
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400">{cen.categoria}</span>
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                      {cen.severidade}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white mt-1 leading-snug">{cen.titulo}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{cen.descricao}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Parâmetros de Tempo e Velocidade */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">2. Parâmetros da Simulação</h3>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
              <span>Duração Total da Indisponibilidade:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-black">{duracaoHoras} horas</span>
            </label>
            <input
              type="range"
              min="1"
              max="24"
              value={duracaoHoras}
              onChange={(e) => {
                setDuracaoHoras(Number(e.target.value));
                handleResetSimulacao();
              }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
              <span>1 hora</span>
              <span>12 horas</span>
              <span>24 horas</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">Tempo Simulado Decorrido:</span>
              <span className="text-amber-500 font-mono font-black">{horasSimuladas}h ({minutosSimulados} min)</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${Math.min((minutosSimulados / (duracaoHoras * 60)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ═══ CARDS DE IMPACTO CALCULADO EM TEMPO REAL ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-rose-50 dark:bg-rose-950/20 p-5 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 text-xs font-bold uppercase">
            <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Perda Financeira Acumulada</span>
            <span className="text-[9px] font-mono font-bold animate-pulse">R$ Real-Time</span>
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
            R$ {totalPerdaFinanceira.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[10px] text-rose-600 dark:text-rose-400 leading-tight">
            Perda direta total gerada nos {minutosSimulados} minutos de indisponibilidade simulados.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 text-xs font-bold uppercase">
            <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Processos Paralisados</span>
            <span className="text-[9px] font-mono font-bold">Efeito Cascata</span>
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
            {countProcessosParalisados} <span className="text-xs font-medium text-slate-500">de {processos.length} processos</span>
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
            Processos críticos diretamente impactados pelo cenário selecionado.
          </p>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/20 p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/40 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase">
            <span className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> MTPDs Violados (ISO 22301)</span>
            <span className="text-[9px] font-mono font-bold">Violação Absoluta</span>
          </div>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
            {countMtpdViolados} <span className="text-xs font-medium text-slate-500">processos em colapso</span>
          </div>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-tight">
            Processos cujo tempo tolerável máximo de interrupção foi ultrapassado.
          </p>
        </div>

      </div>

      {/* ═══ ANÁLISE DE ESTRESSE DE MONTE CARLO (VALUE AT RISK — VaR 95% & 99%) ═══ */}
      {monteCarloResults && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-indigo-500/30 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="font-extrabold text-sm text-white">Análise Estocástica de Monte Carlo (1.000 Itens de Estresse)</h3>
            </div>
            <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-full font-bold">
              VaR Preditivo (ISO 31000 / ISO 22301)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-955 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Perda Média Simulação</span>
              <div className="text-lg font-black text-white mt-1">
                R$ {monteCarloResults.mediaPerda.toLocaleString('pt-BR')}
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">Expectativa matemática de impacto</p>
            </div>

            <div className="p-3 bg-slate-955 rounded-xl border border-amber-900/40">
              <span className="text-[10px] font-bold text-amber-400 uppercase">VaR 95% (Cenário Adverso)</span>
              <div className="text-lg font-black text-amber-400 mt-1">
                R$ {monteCarloResults.var95.toLocaleString('pt-BR')}
              </div>
              <p className="text-[9px] text-amber-300/80 mt-0.5">95% de probabilidade de não exceder este valor</p>
            </div>

            <div className="p-3 bg-slate-955 rounded-xl border border-rose-900/50">
              <span className="text-[10px] font-bold text-rose-400 uppercase">VaR 99% (Estresse Severo / Tail Risk)</span>
              <div className="text-lg font-black text-rose-400 mt-1">
                R$ {monteCarloResults.var99.toLocaleString('pt-BR')}
              </div>
              <p className="text-[9px] text-rose-300/80 mt-0.5">Perda no pior 1% dos cenários simulados</p>
            </div>

            <div className="p-3 bg-slate-955 rounded-xl border border-indigo-900/40">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">Perda Máxima Absoluta</span>
              <div className="text-lg font-black text-indigo-300 mt-1">
                R$ {monteCarloResults.maxPerda.toLocaleString('pt-BR')}
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">Cenário de choque máximo (24h+)</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TABELA DE EFEITO CASCATA NOS PROCESSOS ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-extrabold text-xs text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" /> Matriz de Efeito Cascata por Processo Crítico
          </h3>
          <span className="text-[10px] text-slate-400 font-bold">{processosAtingidos.length} processos monitorados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <th className="px-4 py-3 text-left font-bold">Processo Crítico</th>
                <th className="px-4 py-3 text-center font-bold">Criticidade</th>
                <th className="px-4 py-3 text-center font-bold">Status na Simulação</th>
                <th className="px-4 py-3 text-center font-bold">RTO Alvo</th>
                <th className="px-4 py-3 text-center font-bold">MTPD Máximo</th>
                <th className="px-4 py-3 text-right font-bold">Perda Acumulada (R$)</th>
              </tr>
            </thead>
            <tbody>
              {processosAtingidos.map((p) => (
                <tr key={p.id_processo} className={`border-b border-slate-100 dark:border-slate-800/50 transition-colors ${
                  p.mtpdExcedido ? 'bg-rose-50/50 dark:bg-rose-950/20' :
                  p.rtoEstourado ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                }`}>
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-slate-800 dark:text-white">{p.nome}</div>
                    <div className="text-[8px] text-slate-400 font-mono">{p.id_processo}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      p.criticidade === 'Crítica' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {p.criticidade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                      p.status.includes('MTPD Violado') ? 'bg-rose-600 text-white animate-pulse' :
                      p.status.includes('RTO Estourado') ? 'bg-amber-500 text-white' :
                      p.status.includes('Paralizado') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                    {p.rtoMinutos} min
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-rose-600 dark:text-rose-400">
                    {p.mtpd_horas}h ({p.mtpdMinutos} min)
                  </td>
                  <td className="px-4 py-3 text-right font-black text-rose-600 dark:text-rose-400">
                    R$ {p.perdaAcumulada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ ACOES EMERGENCIAIS RECOMENDADAS PELO SIMULADOR ═══ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-indigo-200 dark:border-indigo-900/40 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4.5 h-4.5 text-indigo-500" /> Plano de Resposta e Contingência Recomendado para este Cenário
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
          <div className="space-y-2">
            <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 block">Checklist Sequencial de Resposta Imediata:</span>
            <ol className="space-y-2">
              {cenarioSelecionado.acoesEmergenciais.map((acao, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  {acao}
                </li>
              ))}
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-xs text-slate-800 dark:text-white block">Fornecedores Críticos (TPRM) a Acionar:</span>
            <div className="space-y-2 text-[10px]">
              {terceiros.slice(0, 3).map((t) => (
                <div key={t.id_fornecedor} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">{t.nome}</span>
                    <span className="text-slate-400">{t.servico}</span>
                  </div>
                  <span className="font-mono text-indigo-500 font-bold">RTO SLA: {t.rto_contratual_horas}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
