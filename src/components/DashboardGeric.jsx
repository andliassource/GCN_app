import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, TrendingUp, Clock, FileText,
  CheckCircle, XCircle, AlertCircle, Activity, BarChart2,
  Users, Zap, Target, ChevronRight, RefreshCw, Download,
  Calendar, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { pdfService } from '../services/pdfService';
import { useAuth } from '../contexts/AuthContext';

// ─── MINI GRÁFICO DE BARRA ────────────────────────────────────────────────────
const MiniBar = ({ value, max, color = '#4f46e5', label }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between items-center text-[10px]">
        <span className="text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{label}</span>
        <span className="font-bold text-slate-700 dark:text-slate-300">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

// ─── GAUGE CIRCULAR ───────────────────────────────────────────────────────────
const Gauge = ({ value, max = 100, label, size = 80, color = '#4f46e5' }) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  const dash = pct * circ * 0.75;
  const gap = circ * 0.25;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div className="text-center -mt-12">
        <div className="text-2xl font-black" style={{ color }}>{value}</div>
        <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
      </div>
    </div>
  );
};

// ─── CARD KPI ─────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, icon: Icon, color, trend, onClick, alert }) => {
  const COLORS = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400',
    purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400',
    slate: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400',
  };
  return (
    <div
      onClick={onClick}
      className={`relative border rounded-xl p-4 ${COLORS[color] || COLORS.slate} ${onClick ? 'cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]' : ''} ${alert ? 'ring-2 ring-rose-400/50 dark:ring-rose-600/40' : ''}`}
    >
      {alert && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${COLORS[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold ${trend > 0 ? 'text-rose-500' : trend < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : trend < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</div>
      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 leading-tight">{label}</div>
      {sub && <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">{sub}</div>}
    </div>
  );
};

// ─── CÁLCULO DE SCORE DE PRIORIDADE GCN (0-100 pts) ───────────────────────────
const calcularPriorityScore = (proc, ativo) => {
  let score = 0;
  
  // 1. Criticidade do Processo (Max 40 pts)
  if (proc.criticidade === 'Crítica') score += 40;
  else if (proc.criticidade === 'Alta') score += 25;
  else if (proc.criticidade === 'Média') score += 10;
  
  // 2. RTO Contratual do Cliente (Max 30 pts)
  if (proc.requer_drp && proc.sla_contrato_cliente > 0) {
    const rto = Number(proc.sla_contrato_cliente);
    if (rto <= 30) score += 30;
    else if (rto <= 240) score += 20;
    else if (rto <= 1440) score += 10;
    else score += 5;
  } else {
    score += 5; // Valor mínimo de suporte
  }
  
  // 3. Gargalo de SLA de TIC (Max 20 pts)
  const gargalo = proc.requer_drp && Number(proc.sla_tic) > Number(proc.sla_contrato_cliente);
  if (gargalo) score += 20;
  
  // 4. Criticidade do Ativo Vinculado (Max 10 pts)
  if (ativo) {
    if (ativo.criticidade_contrato === 'C0') score += 10;
    else if (ativo.criticidade_contrato === 'C1') score += 5;
  }
  
  return score;
};

// ─── MATRIZ DE RISCO ─────────────────────────────────────────────────────────
const MatrizRisco = ({ riscos }) => {
  const PROB = ['Rara', 'Pouco Provável', 'Provável', 'Muito Provável', 'Quase Certa'];
  const IMP = ['Insignificante', 'Menor', 'Moderado', 'Maior', 'Catastrófico'];
  const CORES = [
    ['#d1fae5', '#d1fae5', '#fef9c3', '#fef9c3', '#fed7aa'],
    ['#d1fae5', '#fef9c3', '#fef9c3', '#fed7aa', '#fecaca'],
    ['#fef9c3', '#fef9c3', '#fed7aa', '#fecaca', '#fecaca'],
    ['#fef9c3', '#fed7aa', '#fecaca', '#fecaca', '#fee2e2'],
    ['#fed7aa', '#fecaca', '#fecaca', '#fee2e2', '#fee2e2'],
  ];

  const [hoverCelula, setHoverCelula] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const contarNaCelula = (probIdx, impIdx) => {
    const PROB_SCORE = { 'Rara': 0, 'Pouco Provável': 1, 'Provável': 2, 'Muito Provável': 3, 'Quase Certa': 4 };
    const IMP_SCORE = { 'Insignificante': 0, 'Menor': 1, 'Moderado': 2, 'Maior': 3, 'Catastrófico': 4 };
    return riscos.filter(r =>
      PROB_SCORE[r.probabilidade_atual || r.probabilidade] === probIdx &&
      IMP_SCORE[r.impacto] === impIdx
    );
  };
  return (
    <div className="overflow-auto relative">
      <div className="text-[9px] text-slate-400 dark:text-slate-500 mb-2 font-semibold uppercase">Passe o mouse sobre as células preenchidas para ver as ameaças</div>
      <div className="min-w-[320px]">
        {/* Eixo X */}
        <div className="flex mb-1 ml-14">
          {IMP.map((imp, i) => (
            <div key={i} className="flex-1 text-center text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-tight px-0.5">{imp.split(' ')[0]}</div>
          ))}
        </div>
        {PROB.slice().reverse().map((prob, rowRev) => {
          const row = 4 - rowRev;
          return (
            <div key={prob} className="flex items-center mb-0.5">
              <div className="w-14 text-[8px] text-slate-400 dark:text-slate-500 font-bold text-right pr-2 leading-tight uppercase">{prob.split(' ')[0]}</div>
              {IMP.map((imp, col) => {
                const riscosCelula = contarNaCelula(row, col);
                return (
                  <div key={col} className="flex-1 h-9 mx-0.5 rounded flex items-center justify-center font-black text-xs cursor-default hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: CORES[row][col], color: '#1e293b' }}
                    onMouseEnter={(e) => {
                      if (riscosCelula.length > 0) {
                        setHoverCelula(riscosCelula);
                        setHoverPos({ x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseMove={(e) => {
                      setHoverPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoverCelula(null)}
                  >
                    {riscosCelula.length > 0 ? (
                      <span className="flex items-center justify-center w-5 h-5 bg-white/70 rounded-full text-slate-800 text-[10px] font-black shadow-sm">{riscosCelula.length}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="flex justify-end mt-2 gap-3 text-[8px] font-semibold">
          {[['#d1fae5', 'Baixo'], ['#fef9c3', 'Médio'], ['#fed7aa', 'Alto'], ['#fecaca', 'Crítico']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: c }} />
              <span className="text-slate-400 dark:text-slate-500">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TOOLTIP FLUTUANTE CUSTOMIZADO PARA A MATRIZ DE RISCO */}
      {hoverCelula && (
        <div 
          className="fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xl space-y-3 pointer-events-none text-left max-w-sm"
          style={{ left: hoverPos.x + 15, top: hoverPos.y - 15 }}
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h5 className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-wider">Ameaças nesta Célula ({hoverCelula.length})</h5>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {hoverCelula.map((r, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-slate-400 font-mono">{r.id_risco}</span>
                  <span className={`px-1.5 py-0.2 rounded font-black uppercase text-[8px] ${
                    r.score_risco >= 15 ? 'bg-rose-100 text-rose-600' :
                    r.score_risco >= 9 ? 'bg-orange-100 text-orange-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    Score: {r.score_risco}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight">{r.nome}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">{r.descricao}</p>
                {r.processo && (
                  <p className="text-[9px] text-indigo-500 font-semibold">⚙️ {r.processo.nome} ({r.processo.id_gerencia})</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PRINCIPAL ────────────────────────────────────────────────────────────────
export default function DashboardGeric({ db }) {
  const { usuario, isAdmin } = useAuth();
  const [refreshAt, setRefreshAt] = useState(Date.now());
  const [alertTab, setAlertTab] = useState('planos');

  const idGerencia = isAdmin() ? null : usuario?.id_gerencia;

  const kpis = useMemo(() => db.analytics.getKPIs(idGerencia), [refreshAt, idGerencia]);
  const nrgcnPorGerencia = useMemo(() => db.analytics.getNRGCNporGerencia(idGerencia), [refreshAt, idGerencia]);
  const evolucaoIncidentes = useMemo(() => db.analytics.getEvolucaoIncidentes(idGerencia), [refreshAt, idGerencia]);

  // --- ESTADOS E CÁLCULOS DO DASHBOARD DE IMPACTOS ---
  const [buscaImpacto, setBuscaImpacto] = useState('');
  const [gerenciaFiltroImpacto, setGerenciaFiltroImpacto] = useState('todas');
  const [ordenacaoImpacto, setOrdenacaoImpacto] = useState('priority_desc');

  const todosProcessos = useMemo(() => db.processosCriticos.list(), [refreshAt]);
  const processos = useMemo(() => {
    return idGerencia ? todosProcessos.filter(p => p.id_gerencia === idGerencia) : todosProcessos;
  }, [todosProcessos, idGerencia]);

  const todosAtivos = useMemo(() => db.ativosSistemas.list(), [refreshAt]);

  const calcularPerdasProcesso = (proc) => {
    if (!proc.id_contrato) return { hora: 0, dia: 0, hasContrato: false, faturamento: 0 };
    const contr = db.contratos.list().find(c => c.id_contrato === proc.id_contrato);
    if (!contr) return { hora: 0, dia: 0, hasContrato: false, faturamento: 0 };
    
    // Perda estimada com base no faturamento e criticidade do processo
    const faturamento = contr.valor_faturamento || 0;
    const perdasPorHora = proc.criticidade === 'Crítica' ? 0.05 : proc.criticidade === 'Alta' ? 0.02 : 0.005;
    const hora = faturamento * perdasPorHora;
    const dia = hora * 24;
    return { hora, dia, hasContrato: true, faturamento };
  };

  const processosComGargaloSLA = useMemo(() => {
    return processos.filter(p => p.requer_drp && Number(p.sla_tic) > Number(p.sla_contrato_cliente));
  }, [processos]);

  const totalPerdaHora = useMemo(() => {
    return processos.reduce((sum, p) => sum + calcularPerdasProcesso(p).hora, 0);
  }, [processos]);

  const processosAtivosC0C1 = useMemo(() => {
    return processos.filter(p => {
      if (!p.requer_drp || !p.ativo_cmdb_id) return false;
      const at = todosAtivos.find(a => a.id_ativo === p.ativo_cmdb_id);
      return at?.criticidade_contrato === 'C0' || at?.criticidade_contrato === 'C1';
    });
  }, [processos, todosAtivos]);

  const gerenciasUnicas = useMemo(() => {
    const gerSet = new Set(todosProcessos.map(p => p.id_gerencia));
    return Array.from(gerSet).filter(Boolean);
  }, [todosProcessos]);

  const processosOrdenados = useMemo(() => {
    let lista = [...processos];
    
    // Filtro de gerência
    if (gerenciaFiltroImpacto !== 'todas') {
      lista = lista.filter(p => p.id_gerencia === gerenciaFiltroImpacto);
    }
    
    // Busca textual
    if (buscaImpacto) {
      lista = lista.filter(p => 
        p.nome.toLowerCase().includes(buscaImpacto.toLowerCase()) ||
        p.id_processo.toLowerCase().includes(buscaImpacto.toLowerCase())
      );
    }
    
    // Ordenação
    lista.sort((a, b) => {
      const perdasA = calcularPerdasProcesso(a);
      const perdasB = calcularPerdasProcesso(b);
      const ativoA = todosAtivos.find(at => at.id_ativo === a.ativo_cmdb_id);
      const ativoB = todosAtivos.find(at => at.id_ativo === b.ativo_cmdb_id);
      
      if (ordenacaoImpacto === 'priority_desc') {
        const scoreA = calcularPriorityScore(a, ativoA);
        const scoreB = calcularPriorityScore(b, ativoB);
        return scoreB - scoreA;
      }
      if (ordenacaoImpacto === 'perda_hora_desc') {
        return perdasB.hora - perdasA.hora;
      }
      if (ordenacaoImpacto === 'faturamento_desc') {
        return perdasB.faturamento - perdasA.faturamento;
      }
      if (ordenacaoImpacto === 'sla_cliente_asc') {
        const slaA = a.requer_drp ? (a.sla_contrato_cliente || 999999) : 999999;
        const slaB = b.requer_drp ? (b.sla_contrato_cliente || 999999) : 999999;
        return slaA - slaB;
      }
      if (ordenacaoImpacto === 'gargalo_first') {
        const gargaloA = a.requer_drp && Number(a.sla_tic) > Number(a.sla_contrato_cliente) ? 1 : 0;
        const gargaloB = b.requer_drp && Number(b.sla_tic) > Number(b.sla_contrato_cliente) ? 1 : 0;
        return gargaloB - gargaloA;
      }
      return 0;
    });
    
    return lista;
  }, [processos, buscaImpacto, gerenciaFiltroImpacto, ordenacaoImpacto, todosAtivos]);
  
  // Listas locais filtradas por papel
  const todosRiscos = useMemo(() => db.riscos.list(), [refreshAt]);
  const riscos = useMemo(() => {
    return idGerencia ? todosRiscos.filter(r => r.processo?.id_gerencia === idGerencia) : todosRiscos;
  }, [todosRiscos, idGerencia]);

  const todosPlanosCO = useMemo(() => db.planosContinuidade.list(), [refreshAt]);
  const planosCO = useMemo(() => {
    return idGerencia ? todosPlanosCO.filter(p => p.processo?.id_gerencia === idGerencia) : todosPlanosCO;
  }, [todosPlanosCO, idGerencia]);

  const todosPlanosAcao = useMemo(() => db.planosAcao.list(), [refreshAt]);
  const planosAcao = useMemo(() => {
    return idGerencia ? todosPlanosAcao.filter(pa => pa.processo?.id_gerencia === idGerencia) : todosPlanosAcao;
  }, [todosPlanosAcao, idGerencia]);

  const todosIncidentes = useMemo(() => db.incidentes.list(), [refreshAt]);
  const incidentes = useMemo(() => {
    return idGerencia ? todosIncidentes.filter(i => i.processo?.id_gerencia === idGerencia) : todosIncidentes;
  }, [todosIncidentes, idGerencia]);

  const config = useMemo(() => db.configSistema.get(), []);

  const hoje = new Date();
  const pcosVencendo = planosCO.filter(p => {
    if (!p.vigente_ate) return false;
    const diff = (new Date(p.vigente_ate) - hoje) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 90;
  }).sort((a, b) => new Date(a.vigente_ate) - new Date(b.vigente_ate));

  const planosAcaoAbertos = planosAcao.filter(p => p.status !== 'concluido');
  const incidentesAbertos = incidentes.filter(i => i.status_incidente === 'aberto' || i.status_incidente === 'em_investigacao');

  // Score geral colorido
  const nrgcnColor = kpis.nrgcnScore >= 4 ? '#10b981' : kpis.nrgcnScore >= 3 ? '#f59e0b' : '#ef4444';
  const isoColor = kpis.aderenciaISO >= 80 ? '#10b981' : kpis.aderenciaISO >= 60 ? '#f59e0b' : '#ef4444';

  const PROB_SCORE = { 'Rara': 1, 'Pouco Provável': 2, 'Provável': 3, 'Muito Provável': 4, 'Quase Certa': 5 };
  const IMP_SCORE = { 'Insignificante': 1, 'Menor': 2, 'Moderado': 3, 'Maior': 4, 'Catastrófico': 5 };

  const exportarDashboard = () => {
    const html = pdfService.htmlDashboard(kpis, nrgcnPorGerencia);
    pdfService.exportar('Dashboard Executivo GCN — Visão Geric', html, {
      nome_empresa: config.nome_empresa,
      logo_base64: config.logo_base64,
      confidencialidade: 'RESTRITO',
      versao: '4.0',
      autor: 'Geric — Gestão de Riscos e GCN'
    });
  };

  const exportarRelatorioTIC = () => {
    const processosAll = db.processosCriticos.list();
    const ativosAll = db.ativosSistemas.list();
    const contratosAll = db.contratos.list();
    const planosAll = db.planosContinuidade.list();

    const html = pdfService.htmlRelatorioResilienciaTIC(processosAll, ativosAll, contratosAll, planosAll, config);
    pdfService.exportar('Relatório Executivo de Resiliência de TIC — Geati / Geric', html, {
      nome_empresa: config.nome_empresa,
      logo_base64: config.logo_base64,
      confidencialidade: 'RESTRITO',
      versao: '2026.1',
      autor: 'Geati & Geric — Governança de TIC e Riscos'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Painel Executivo — Gestão GCN</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visão em tempo real · {new Date().toLocaleString('pt-BR')} · ISO 22301:2019 / ISO 27031:2023 / NIST CSF
          </p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <button onClick={() => setRefreshAt(Date.now())} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
          <button onClick={exportarRelatorioTIC} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors px-3 py-2 rounded-lg shadow-sm">
            <FileText className="w-3.5 h-3.5" /> Relatório TIC (PDF)
          </button>
          <button onClick={exportarDashboard} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-3 py-2 rounded-lg shadow-sm">
            <Download className="w-3.5 h-3.5" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* LINHA 1: GAUGES + KPIs PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPICard label="Processos Críticos" value={kpis.totalProcessos} sub={`${kpis.processosSemPCO} sem PCO`} icon={Activity} color="indigo" alert={kpis.processosSemPCO > 0} />
        <KPICard label="PCOs Aprovados" value={kpis.pcosAprovados} sub={`${kpis.coberturaPCO}% cobertura`} icon={CheckCircle} color="emerald" />
        <KPICard label="PCOs Pendentes" value={kpis.pcosPendentes} sub="aguardando aprovação" icon={Clock} color="amber" alert={kpis.pcosPendentes > 0} />
        <KPICard label="PCOs Vencidos" value={kpis.pcosVencidos} sub="exigem renovação" icon={XCircle} color="rose" alert={kpis.pcosVencidos > 0} />
        <KPICard label="Incidentes Totais" value={kpis.totalIncidentes} sub={`${kpis.incidentesAbertos} abertos`} icon={AlertTriangle} color="amber" />
        <KPICard label="RTO Ultrapassado" value={kpis.incidentesRTOUltrapassado} sub="violações de SLA" icon={Zap} color="rose" alert={kpis.incidentesRTOUltrapassado > 0} />
        <KPICard label="Riscos Altos/Críticos" value={kpis.riscosAltos} sub={`de ${kpis.totalRiscos} mapeados`} icon={ShieldCheck} color="purple" alert={kpis.riscosAltos > 2} />
        <KPICard label="Planos de Ação" value={kpis.planosAcaoAbertos} sub={`${kpis.planosAcaoAtrasados} atrasados`} icon={Target} color={kpis.planosAcaoAtrasados > 0 ? 'rose' : 'slate'} alert={kpis.planosAcaoAtrasados > 0} />
      </div>

      {/* LINHA 2: GAUGES + EVOLUÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Gauges de Score */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Indicadores Gerais</span>
          <div className="flex gap-8 items-center mt-2">
            <div className="text-center">
              <Gauge value={kpis.nrgcnScore} max={5} label="NRGCN" size={90} color={nrgcnColor} />
              <p className="text-[9px] text-slate-400 mt-2">Nível de Resiliência</p>
            </div>
            <div className="text-center">
              <Gauge value={kpis.aderenciaISO} max={100} label="ISO 22301" size={90} color={isoColor} />
              <p className="text-[9px] text-slate-400 mt-2">Aderência à Norma (%)</p>
            </div>
            <div className="text-center">
              <Gauge value={kpis.coberturaPCO} max={100} label="Cobertura" size={90} color="#4f46e5" />
              <p className="text-[9px] text-slate-400 mt-2">Cobertura PCO (%)</p>
            </div>
          </div>
        </div>

        {/* Evolução Incidentes */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-indigo-500" /> Evolução de Incidentes
            </span>
            <span className="text-[9px] text-slate-400">Últimos 6 meses</span>
          </div>
          {evolucaoIncidentes.length > 0 && (
            <div className="flex items-end gap-2 h-28">
              {evolucaoIncidentes.map((m, i) => {
                const maxTotal = Math.max(...evolucaoIncidentes.map(e => e.total), 1);
                const hTotal = (m.total / maxTotal) * 88;
                const hCrit = (m.criticos / maxTotal) * 88;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex flex-col items-center gap-0.5 relative" style={{ height: '88px' }}>
                      <div className="flex-1" />
                      <div className="w-full rounded-t-sm" style={{ height: hTotal, backgroundColor: '#c7d2fe', transition: 'height 0.5s ease', minHeight: m.total > 0 ? 2 : 0 }} />
                      {m.criticos > 0 && (
                        <div className="w-full rounded-t-sm absolute bottom-0 left-0" style={{ height: hCrit, backgroundColor: '#ef4444' }} />
                      )}
                    </div>
                    <span className="text-[8px] text-slate-400 text-center leading-tight">{m.mes}</span>
                    <span className="text-[8px] font-bold text-slate-600 dark:text-slate-400">{m.total}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex gap-3 mt-2 text-[9px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-200 inline-block" />Total</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-500 inline-block" />Críticos</span>
          </div>
        </div>

        {/* NRGCN por Gerência */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">NRGCN por Gerência</span>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {nrgcnPorGerencia.sort((a, b) => b.nrgcn - a.nrgcn).map((n, i) => (
              <MiniBar
                key={i}
                label={n.gerencia}
                value={n.nrgcn}
                max={5}
                color={n.nrgcn >= 4 ? '#10b981' : n.nrgcn >= 3 ? '#f59e0b' : '#ef4444'}
              />
            ))}
            {nrgcnPorGerencia.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Nenhuma avaliação NRGCN registrada.</p>
            )}
          </div>
        </div>
      </div>

      {/* LINHA 3: MATRIZ DE RISCO + ALERTAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Matriz de Risco */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-500" /> Matriz de Riscos 5×5
            </span>
            <span className="text-[9px] text-slate-400">{riscos.length} riscos mapeados</span>
          </div>
          <MatrizRisco riscos={riscos} />
        </div>

        {/* Painel de Alertas e Prazos */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Alertas e Prazos Críticos</span>
          </div>

          {/* Sub-abas */}
          <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 mb-3 text-xs font-semibold">
            {[['planos', 'PCOs/PRDs', pcosVencendo.length], ['acoes', 'Planos de Ação', planosAcaoAbertos.length], ['incidentes', 'Incidentes', incidentesAbertos.length]].map(([key, lbl, cnt]) => (
              <button key={key} onClick={() => setAlertTab(key)}
                className={`pb-2 flex items-center gap-1 transition-all ${alertTab === key ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}>
                {lbl}
                {cnt > 0 && <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[9px] font-black rounded-full">{cnt}</span>}
              </button>
            ))}
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-48">
            {alertTab === 'planos' && (pcosVencendo.length > 0 ? pcosVencendo.map(pco => {
              const diff = Math.round((new Date(pco.vigente_ate) - hoje) / (1000 * 60 * 60 * 24));
              const style = diff <= 7
                ? { card: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30', icon: 'text-rose-500', badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400' }
                : diff <= 30
                ? { card: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30', icon: 'text-amber-500', badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400' }
                : { card: 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30', icon: 'text-indigo-500', badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400' };

              return (
                <div key={pco.id_pco} className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs ${style.card}`}>
                  <Calendar className={`w-4 h-4 ${style.icon} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{pco.id_pco}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Vence em {diff} dias · {new Date(pco.vigente_ate).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${style.badge}`}>
                    {diff <= 7 ? 'CRÍTICO' : diff <= 30 ? '30 DIAS' : '60 DIAS'}
                  </span>
                </div>
              );
            }) : <p className="text-xs text-slate-400 text-center py-6">✅ Nenhum plano vencendo nos próximos 90 dias.</p>)}

            {alertTab === 'acoes' && (planosAcaoAbertos.length > 0 ? planosAcaoAbertos.map(pa => {
              const atrasado = pa.prazo && new Date(pa.prazo) < hoje;
              return (
                <div key={pa.id_plano_acao} className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs ${atrasado ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30' : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'}`}>
                  <Target className={`w-4 h-4 ${atrasado ? 'text-rose-500' : 'text-amber-500'} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{pa.id_plano_acao}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{pa.descricao?.substring(0, 70)}...</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{pa.responsavel}</div>
                  </div>
                  {atrasado && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 flex-shrink-0">ATRASADO</span>}
                </div>
              );
            }) : <p className="text-xs text-slate-400 text-center py-6">✅ Nenhum plano de ação aberto.</p>)}

            {alertTab === 'incidentes' && (incidentesAbertos.length > 0 ? incidentesAbertos.map(inc => (
              <div key={inc.id_incidente} className="flex items-center gap-3 p-2.5 rounded-lg border text-xs bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{inc.id_incidente}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{inc.descricao?.substring(0, 60)}...</div>
                  <div className="text-[9px] text-slate-400">{inc.data_hora ? new Date(inc.data_hora).toLocaleString('pt-BR') : '-'}</div>
                </div>
                {inc.rto_ultrapassado && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 flex-shrink-0">RTO EXCEDIDO</span>}
              </div>
            )) : <p className="text-xs text-slate-400 text-center py-6">✅ Nenhum incidente aberto.</p>)}
          </div>
        </div>
      </div>

      {/* SEÇÃO ESPECIAL: DASHBOARD DE IMPACTOS E PRIORIZAÇÃO DE PROCESSOS CRÍTICOS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
              <Zap className="w-5 h-5 text-indigo-500" /> Matriz de Priorização & Dashboard de Impacto Técnico-Financeiro
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-3xl">
              Análise em tempo real de impactos financeiros e técnicos. Priorização baseada em criticidade de ativos do CMDB, gargalo de SLAs corporativos e perda financeira estimada por disrupção (BIA).
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-[10px]">
            <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 px-3 py-2 rounded-lg font-bold">
              Total Risco/Hora: R$ {totalPerdaHora.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 px-3 py-2 rounded-lg font-bold">
              Gargalos de SLA: {processosComGargaloSLA.length} processos
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 px-3 py-2 rounded-lg font-bold">
              Ativos C0/C1: {processosAtivosC0C1.length} mapeados
            </div>
          </div>
        </div>

        {/* Filtros e Buscas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Pesquisar Processo</label>
            <input 
              type="text"
              value={buscaImpacto}
              onChange={e => setBuscaImpacto(e.target.value)}
              placeholder="Digite o nome ou ID..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Gerência Responsável</label>
            <select
              value={gerenciaFiltroImpacto}
              onChange={e => setGerenciaFiltroImpacto(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
            >
              <option value="todas">Todas as Gerências</option>
              {gerenciasUnicas.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Ordenar Lista por</label>
            <select
              value={ordenacaoImpacto}
              onChange={e => setOrdenacaoImpacto(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
            >
              <option value="priority_desc">Maior Score de Prioridade GCN (Fila Crítica)</option>
              <option value="perda_hora_desc">Maior Perda Financeira / Hora</option>
              <option value="faturamento_desc">Maior Faturamento Contrato</option>
              <option value="sla_cliente_asc">Menor SLA Contrato Cliente (Crítico)</option>
              <option value="gargalo_first">Processos em Gargalo Primeiro</option>
            </select>
          </div>
        </div>

        {/* Tabela de Priorização */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="px-5 py-3">Código / Processo</th>
                <th className="px-5 py-3">Contrato / Faturamento</th>
                <th className="px-5 py-3">Ativo CMDB / Criticidade</th>
                <th className="px-5 py-3 text-center">Métricas de SLA</th>
                <th className="px-5 py-3 text-right">Perda / Hora</th>
                <th className="px-5 py-3 text-right">Perda / Dia</th>
                <th className="px-5 py-3 text-center">Prioridade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {processosOrdenados.map(p => {
                const perdas = calcularPerdasProcesso(p);
                const ativo = todosAtivos.find(a => a.id_ativo === p.ativo_cmdb_id);
                const gargalo = p.requer_drp && Number(p.sla_tic) > Number(p.sla_contrato_cliente);
                
                // Calcular score numérico
                const scorePrioridade = calcularPriorityScore(p, ativo);
                
                // Determina Prioridade Sugerida
                let prioridade = 'Média';
                let prioridadeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800';
                
                if (scorePrioridade >= 80) {
                  prioridade = 'URGÊNCIA MÁXIMA';
                  prioridadeClass = 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 font-black animate-pulse';
                } else if (scorePrioridade >= 50) {
                  prioridade = 'URGÊNCIA ALTA';
                  prioridadeClass = 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30 font-bold';
                }

                return (
                  <tr key={p.id_processo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-indigo-650 dark:text-indigo-400">{p.id_processo}</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={p.nome}>{p.nome}</div>
                      <span className="text-[9px] text-emerald-500 font-semibold uppercase">{p.id_gerencia}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.id_contrato ? (
                        <div>
                          <div className="font-semibold text-slate-700 dark:text-slate-350">{p.id_contrato}</div>
                          <div className="text-[10px] text-slate-400">R$ {perdas.faturamento.toLocaleString('pt-BR')}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Apoio Interno</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.requer_drp && p.ativo_cmdb_id ? (
                        <div>
                          <div className="font-semibold text-slate-750 dark:text-slate-350 truncate max-w-[150px]" title={ativo?.nome}>{ativo?.nome || p.ativo_cmdb_id}</div>
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                            ativo?.criticidade_contrato === 'C0' ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-450 border border-rose-200 dark:border-rose-900/30' :
                            ativo?.criticidade_contrato === 'C1' ? 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-450 border border-orange-250 dark:border-orange-900/30' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200'
                          }`}>
                            {ativo?.criticidade_contrato || 'C3'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Sem DRP Técnico</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      {p.requer_drp ? (
                        <div className="inline-flex flex-col gap-0.5">
                          <span className="text-[10px] text-slate-500">Contrato: <strong className="text-slate-700 dark:text-slate-300">{p.sla_contrato_cliente}m</strong></span>
                          <span className="text-[10px] text-slate-500">TIC: <strong className={gargalo ? 'text-rose-500 font-bold' : 'text-emerald-500'}>{p.sla_tic}m</strong></span>
                          {gargalo && (
                            <span className="text-[8px] bg-rose-50 dark:bg-rose-950 text-rose-500 px-1 py-0.2 rounded border border-rose-200 dark:border-rose-900/40 uppercase font-black tracking-wide animate-pulse">
                              ⚠️ Gargalo
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold">
                      {perdas.hasContrato ? (
                        <span className="text-rose-600 dark:text-rose-400">R$ {perdas.hora.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                      ) : (
                        <span className="text-slate-450 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold">
                      {perdas.hasContrato ? (
                        <span className="text-rose-600 dark:text-rose-400">R$ {perdas.dia.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                      ) : (
                        <span className="text-slate-450 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">{scorePrioridade} <span className="text-[8px] text-slate-400 font-normal">pts</span></div>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[7px] font-black uppercase mt-1 ${prioridadeClass}`}>
                        {prioridade}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {processosOrdenados.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-slate-400 py-8 italic">
                    Nenhum processo correspondente aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LINHA 4: STATUS DOS PLANOS + RISCOS CRÍTICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Status dos PCOs */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" /> Status dos Planos PCO/PRD
            </span>
            <div className="flex gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Aprovado ({kpis.pcosAprovados})</span>
              <span className="flex items-center gap-1 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Pendente ({kpis.pcosPendentes})</span>
              <span className="flex items-center gap-1 text-rose-600"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Vencido ({kpis.pcosVencidos})</span>
            </div>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-60 overflow-y-auto">
            {planosCO.map(pco => {
              const vencido = pco.vigente_ate && new Date(pco.vigente_ate) < hoje;
              const proc = pco.processo;
              return (
                <div key={pco.id_pco} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{proc?.nome || pco.id_processo}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{pco.id_pco} · v{pco.versao} · Revisão: {pco.data_proxima_revisao ? new Date(pco.data_proxima_revisao).toLocaleDateString('pt-BR') : 'N/D'}</div>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                    vencido ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400' :
                    pco.status_aprovacao === 'Aprovado' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' :
                    'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                  }`}>
                    {vencido ? 'VENCIDO' : pco.status_aprovacao?.toUpperCase()}
                  </span>
                </div>
              );
            })}
            {planosCO.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Nenhum PCO cadastrado.</p>}
          </div>
        </div>

        {/* Riscos Críticos */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" /> Riscos por Score (Prob × Impacto)
            </span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-60 overflow-y-auto">
            {riscos
              .map(r => ({ ...r, score: (PROB_SCORE[r.probabilidade_atual || r.probabilidade] || 1) * (IMP_SCORE[r.impacto] || 1) }))
              .sort((a, b) => b.score - a.score)
              .map(risco => {
                const badgeCls = risco.score >= 15
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                  : risco.score >= 10
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400';
                return (
                  <div key={risco.id_risco} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${badgeCls} flex-shrink-0`}>
                      {risco.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{risco.nome}</div>
                      <div className="text-[10px] text-slate-400">{risco.probabilidade_atual || risco.probabilidade} × {risco.impacto}</div>
                    </div>
                    {risco.id_plano_acao && (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex-shrink-0">Com PA</span>
                    )}
                  </div>
                );
              })}
            {riscos.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Nenhum risco mapeado.</p>}
          </div>
        </div>
      </div>

      {/* LINHA 5: COBERTURAS POR GERÊNCIA */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center gap-1.5 mb-4">
          <Users className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Cobertura e NRGCN por Gerência</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {nrgcnPorGerencia.map((n, i) => {
            const cor = n.nrgcn >= 4 ? '#10b981' : n.nrgcn >= 3 ? '#f59e0b' : '#ef4444';
            return (
              <div key={i} className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800">
                <div className="text-lg font-black" style={{ color: cor }}>{n.nrgcn}</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{n.gerencia}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{n.aderencia}% ISO</div>
                <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(n.nrgcn / 5) * 100}%`, backgroundColor: cor }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
