import React, { useState, useMemo, useCallback } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine, Cell, BarChart, Bar
} from 'recharts';
import {
  Target, TrendingUp, AlertTriangle, ShieldCheck, Activity,
  Download, Dices, ChevronDown, ChevronUp, Search, ArrowUpDown,
  FileCheck, Info, CheckCircle2, ShieldAlert, Edit3, PlusCircle, Trash2, Database
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// FÓRMULAS DE PRIORIZAÇÃO ESTRATÉGICA GCN
// ═══════════════════════════════════════════════════════════════════════════════

const MULTIPLICADORES_CICLO = {
  'Crescimento': 1.2,
  'Maturidade': 1.0,
  'Declínio': 0.5,
  'Sunset': 0.3,
};

const CORES_CICLO = {
  'Crescimento': { emoji: '🟢', cor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40' },
  'Maturidade': { emoji: '🔵', cor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/40' },
  'Declínio': { emoji: '🟡', cor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40' },
  'Sunset': { emoji: '🔴', cor: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/40' },
};

const CORES_STATUS = {
  'Plano Aprovado': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  'Aguardando Aprovação': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  'Em Revisão': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  'Em Elaboração': 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  'Sem Plano': 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
};

const CORES_QUADRANTE = {
  Q1: { bg: 'bg-slate-100/50 dark:bg-slate-800/30', text: 'text-slate-500', badge: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400', label: 'Baixa Prioridade', fill: '#94a3b8' },
  Q2: { bg: 'bg-amber-50/50 dark:bg-amber-950/10', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', label: 'Média Prioridade', fill: '#f59e0b' },
  Q3: { bg: 'bg-rose-50/50 dark:bg-rose-950/10', text: 'text-rose-600', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400', label: 'Alta Prioridade', fill: '#f43f5e' },
  Q4: { bg: 'bg-red-50/50 dark:bg-red-950/10', text: 'text-red-600', badge: 'bg-red-200 text-red-800 dark:bg-red-950/50 dark:text-red-400', label: 'Prioridade Máxima', fill: '#dc2626' },
};

function calcularImpacto(proc, maxFat, maxPerda, maxInc) {
  const fatNorm = maxFat > 0 ? (proc.faturamento_anual / maxFat) * 100 : 0;
  const perdaNorm = maxPerda > 0 ? (proc.perda_hora_estimada / maxPerda) * 100 : 0;
  const critScore = proc.criticidade === 'Crítica' ? 100 : proc.criticidade === 'Alta' ? 70 : 30;
  const ativoScore = proc.ativo_cmdb_id ? (
    proc.ativo_cmdb_id.startsWith('ATV-SYS01') || proc.ativo_cmdb_id.startsWith('ATV-SEC') ? 100 :
    proc.ativo_cmdb_id.startsWith('ATV-SRV') ? 85 :
    proc.ativo_cmdb_id.startsWith('ATV-LNK') ? 60 : 40
  ) : 10;
  const incNorm = maxInc > 0 ? (proc.total_incidentes_12m / maxInc) * 100 : 0;

  const raw = (fatNorm * 0.30) + (perdaNorm * 0.25) + (critScore * 0.20) + (ativoScore * 0.15) + (incNorm * 0.10);
  const mult = MULTIPLICADORES_CICLO[proc.ciclo_vida] || 1.0;
  return Math.min(100, Math.round(raw * mult));
}

function calcularUrgencia(proc) {
  let rtoScore = 0;
  const rto = proc.sla_contrato_cliente || proc.rpo_minutos || 1440;
  if (rto <= 15) rtoScore = 100;
  else if (rto <= 60) rtoScore = 80;
  else if (rto <= 240) rtoScore = 55;
  else if (rto <= 1440) rtoScore = 30;
  else rtoScore = 10;

  const gargaloScore = (proc.requer_drp && Number(proc.sla_tic) > Number(proc.sla_contrato_cliente) && proc.sla_contrato_cliente > 0) ? 100 : 0;
  const freqScore = proc.total_incidentes_12m >= 3 ? 100 : proc.total_incidentes_12m >= 1 ? 60 : 10;
  const slaPressao = (proc.sla_contrato_cliente > 0 && proc.sla_contrato_cliente <= 60) ? 100 : (proc.sla_contrato_cliente <= 240 ? 50 : 10);
  const semPlano = (!proc.status_plano || proc.status_plano === 'Sem Plano') ? 100 : (proc.status_plano === 'Em Elaboração' ? 60 : 0);

  const raw = (rtoScore * 0.30) + (gargaloScore * 0.25) + (freqScore * 0.20) + (slaPressao * 0.15) + (semPlano * 0.10);
  return Math.min(60, Math.round(raw * 0.60));
}

function getQuadrante(impacto, urgencia) {
  if (impacto >= 50 && urgencia >= 30) return 'Q4';
  if (impacto >= 50 && urgencia < 30) return 'Q3';
  if (impacto < 50 && urgencia >= 30) return 'Q2';
  return 'Q1';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULAÇÃO MONTE CARLO LÓGICA E EXPLICADA
// ═══════════════════════════════════════════════════════════════════════════════

function rodarMonteCarlo(processos, iteracoes = 1000) {
  const resultados = [];
  let comIncidenteCount = 0;

  for (let i = 0; i < iteracoes; i++) {
    let perdaTotal = 0;
    for (const p of processos) {
      const probIncidente = Math.random();
      // Taxa anual baseada em histórico real de incidentes
      const taxaAnual = Math.max(0.08, ((p.total_incidentes_12m || 0) + 0.3) / 12);
      if (probIncidente < taxaAnual) {
        const rtoBase = p.sla_contrato_cliente || p.rpo_minutos || 240;
        // Duração oscila entre 50% e 250% do RTO
        const duracao = rtoBase * (0.5 + Math.random() * 2.0);
        // Perda oscila entre 80% e 140% do valor de hora parada
        const perdaHora = p.perda_hora_estimada * (0.8 + Math.random() * 0.6);
        perdaTotal += (duracao / 60) * perdaHora;
      }
    }
    const val = Math.round(perdaTotal);
    resultados.push(val);
    if (val > 0) comIncidenteCount++;
  }

  resultados.sort((a, b) => a - b);

  // Filtrar APENAS perdas efetivas (> 0) para compor a distribuição de severidade no gráfico
  const perdasEfetivas = resultados.filter(v => v > 0);
  const min = perdasEfetivas.length > 0 ? perdasEfetivas[0] : 10000;
  const max = perdasEfetivas.length > 0 ? perdasEfetivas[perdasEfetivas.length - 1] : 500000;
  const buckets = 10;
  const step = Math.max(5000, Math.round((max - min) / buckets));

  const hist = [];
  for (let b = 0; b < buckets; b++) {
    const lo = min + b * step;
    const hi = lo + step;
    const count = perdasEfetivas.filter(v => v >= lo && (b === buckets - 1 ? v <= hi : v < hi)).length;
    hist.push({
      faixaLabel: `R$ ${(lo / 1000).toFixed(0)}k - ${(hi / 1000).toFixed(0)}k`,
      faixaCurta: `R$ ${(lo / 1000).toFixed(0)}k`,
      valor: lo,
      count
    });
  }

  return {
    hist,
    semIncidenteCount: iteracoes - comIncidenteCount,
    comIncidenteCount,
    taxaOcorrencia: Math.round((comIncidenteCount / iteracoes) * 100),
    p50: resultados[Math.floor(iteracoes * 0.50)],
    p90: resultados[Math.floor(iteracoes * 0.90)],
    p95: resultados[Math.floor(iteracoes * 0.95)],
    mediaComIncidente: perdasEfetivas.length > 0
      ? Math.round(perdasEfetivas.reduce((a, b) => a + b, 0) / perdasEfetivas.length)
      : 0
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP DO SCATTER
// ═══════════════════════════════════════════════════════════════════════════════

const ScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-4 max-w-xs text-xs space-y-1.5 z-50">
      <div className="font-extrabold text-slate-800 dark:text-white text-sm">{d.nome}</div>
      <div className="text-slate-500 font-bold">{d.area}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
        <span className="text-slate-400">Impacto:</span><span className="font-bold">{d.impacto} / 100</span>
        <span className="text-slate-400">Urgência:</span><span className="font-bold">{d.urgencia} / 60</span>
        <span className="text-slate-400">Quadrante:</span><span className={`font-black ${CORES_QUADRANTE[d.quadrante]?.text}`}>{d.quadrante} - {CORES_QUADRANTE[d.quadrante]?.label}</span>
        <span className="text-slate-400">Faturamento:</span><span className="font-bold">R$ {(d.faturamento / 1000).toFixed(0)}k/ano</span>
        <span className="text-slate-400">Perda/Hora:</span><span className="font-bold text-rose-500">R$ {(d.perdaHora / 1000).toFixed(0)}k/h</span>
        <span className="text-slate-400">Ciclo Vida:</span><span className="font-bold">{CORES_CICLO[d.cicloVida]?.emoji} {d.cicloVida}</span>
        <span className="text-slate-400">RTO:</span><span className="font-bold">{d.rto}</span>
        <span className="text-slate-400">Status Plano:</span><span className="font-bold">{d.statusPlano}</span>
      </div>
      {d.indicacaoGerel && (
        <div className="text-[10px] text-indigo-500 dark:text-indigo-400 italic pt-1 border-t border-slate-100 dark:border-slate-800">
          📋 Gerel: {d.indicacaoGerel}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function MatrizPriorizacao({ db }) {
  const [filtroQuadrante, setFiltroQuadrante] = useState('all');
  const [filtroArea, setFiltroArea] = useState('all');
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [busca, setBusca] = useState('');
  const [sortCol, setSortCol] = useState('impacto');
  const [sortDir, setSortDir] = useState('desc');
  const [showMonteCarlo, setShowMonteCarlo] = useState(true);
  const [mcResult, setMcResult] = useState(null);
  const [mcRunning, setMcRunning] = useState(false);
  const [showCrudInfo, setShowCrudInfo] = useState(false);

  const processos = (db.processosCriticos?.list ? db.processosCriticos.list() : []) || [];
  const gerencias = (db.gerencias?.list ? db.gerencias.list() : []) || [];
  const planosPCO = (db.planosContinuidade?.list ? db.planosContinuidade.list() : []) || [];

  const getGerencia = useCallback((id) => gerencias.find(g => g.id_gerencia === id), [gerencias]);

  const formatRTO = (min) => {
    if (!min || min === 0) return '—';
    if (min < 60) return `${min}min`;
    if (min < 1440) return `${Math.round(min / 60)}h`;
    return `${Math.round(min / 1440)}d`;
  };

  // Calcular scores para todos os processos
  const dados = useMemo(() => {
    const maxFat = Math.max(...processos.map(p => p.faturamento_anual || 0), 1);
    const maxPerda = Math.max(...processos.map(p => p.perda_hora_estimada || 0), 1);
    const maxInc = Math.max(...processos.map(p => p.total_incidentes_12m || 0), 1);

    return processos
      .filter(p => p.faturamento_anual !== undefined)
      .map(p => {
        const ger = getGerencia(p.id_gerencia);
        const impacto = calcularImpacto(p, maxFat, maxPerda, maxInc);
        const urgencia = calcularUrgencia(p);
        const quadrante = getQuadrante(impacto, urgencia);
        return {
          id: p.id_processo,
          nome: p.nome,
          area: ger?.sigla || p.id_gerencia,
          areaTipo: ger?.tipo || '',
          impacto,
          urgencia,
          quadrante,
          rto: formatRTO(p.sla_contrato_cliente || p.rpo_minutos),
          rpo: formatRTO(p.rpo_minutos),
          faturamento: p.faturamento_anual || 0,
          perdaHora: p.perda_hora_estimada || 0,
          cicloVida: p.ciclo_vida || 'Maturidade',
          indicacaoGerel: p.indicacao_gerel || '',
          criticidade: p.criticidade,
          statusPlano: p.status_plano || 'Sem Plano',
          responsavelTestes: p.responsavel_testes || '—',
          verificadorGeric: p.verificador_geric || '—',
          gestorAccountability: p.gestor_accountability || '—',
          totalIncidentes: p.total_incidentes_12m || 0,
          ultimoTeste: p.ultimo_teste,
          estrategiaDRP: p.estrategia_drp,
          requerDRP: p.requer_drp,
        };
      });
  }, [processos, getGerencia]);

  // Filtrar dados
  const dadosFiltrados = useMemo(() => {
    return dados.filter(d => {
      if (filtroQuadrante !== 'all' && d.quadrante !== filtroQuadrante) return false;
      if (filtroArea !== 'all' && d.area !== filtroArea) return false;
      if (filtroStatus !== 'all' && d.statusPlano !== filtroStatus) return false;
      if (busca) {
        const q = busca.toLowerCase();
        if (!d.nome.toLowerCase().includes(q) && !d.area.toLowerCase().includes(q) && !d.responsavelTestes.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [dados, filtroQuadrante, filtroArea, filtroStatus, busca]);

  // Ordenar tabela
  const dadosOrdenados = useMemo(() => {
    return [...dadosFiltrados].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'nome') return dir * a.nome.localeCompare(b.nome);
      if (sortCol === 'area') return dir * a.area.localeCompare(b.area);
      if (sortCol === 'impacto') return dir * (a.impacto - b.impacto);
      if (sortCol === 'urgencia') return dir * (a.urgencia - b.urgencia);
      if (sortCol === 'faturamento') return dir * (a.faturamento - b.faturamento);
      if (sortCol === 'perdaHora') return dir * (a.perdaHora - b.perdaHora);
      if (sortCol === 'quadrante') return dir * a.quadrante.localeCompare(b.quadrante);
      if (sortCol === 'status') return dir * a.statusPlano.localeCompare(b.statusPlano);
      return 0;
    });
  }, [dadosFiltrados, sortCol, sortDir]);

  // KPIs com cálculo de Planos Vencidos Real
  const kpis = useMemo(() => {
    const hoje = new Date();
    const pcosVencidosCount = planosPCO.filter(p => p.vigente_ate && new Date(p.vigente_ate) < hoje).length;
    const pcosVencendoCount = planosPCO.filter(p => {
      if (!p.vigente_ate) return false;
      const diff = (new Date(p.vigente_ate) - hoje) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    }).length;

    return {
      total: dados.length,
      q4: dados.filter(d => d.quadrante === 'Q4').length,
      impactoMedio: dados.length > 0 ? Math.round(dados.reduce((s, d) => s + d.impacto, 0) / dados.length) : 0,
      planosAprovados: dados.filter(d => d.statusPlano === 'Plano Aprovado').length,
      altoImpacto: dados.filter(d => d.impacto >= 70).length,
      planosVencidos: pcosVencidosCount,
      planosVencendo30: pcosVencendoCount,
    };
  }, [dados, planosPCO]);

  const areasUnicas = useMemo(() => [...new Set(dados.map(d => d.area))].sort(), [dados]);
  const statusUnicos = useMemo(() => [...new Set(dados.map(d => d.statusPlano))].sort(), [dados]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const handleMonteCarlo = () => {
    setMcRunning(true);
    setTimeout(() => {
      const result = rodarMonteCarlo(processos.filter(p => p.faturamento_anual !== undefined));
      setMcResult(result);
      setMcRunning(false);
    }, 120);
  };

  const exportarCSV = () => {
    const headers = ['#', 'Processo', 'Área', 'Tipo', 'Impacto', 'Urgência', 'Quadrante', 'RTO', 'RPO', 'Faturamento Anual (R$)', 'Perda/Hora (R$)', 'Ciclo Vida', 'Criticidade', 'Estratégia DR', 'Status Plano', 'Resp. Testes', 'Verificador (2ª Linha)', 'Gestor Accountability', 'Incidentes 12m', 'Último Teste', 'Indicação Gerel'];
    const rows = dadosOrdenados.map((d, i) => [
      i + 1, d.nome, d.area, d.areaTipo, d.impacto, d.urgencia, d.quadrante, d.rto, d.rpo,
      d.faturamento, d.perdaHora, d.cicloVida, d.criticidade, d.estrategiaDRP,
      d.statusPlano, d.responsavelTestes, d.verificadorGeric, d.gestorAccountability,
      d.totalIncidentes, d.ultimoTeste || 'Nunca', d.indicacaoGerel
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'matriz_priorizacao_gcn.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }) => (
    <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortCol === col ? 'text-indigo-500' : 'text-slate-300'}`} />
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" /> Matriz de Priorização de Negócios (4×4)
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Decisão de Investimento em Continuidade · Faturamento & Perda/Hora Real · Ciclo de Vida Gerel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCrudInfo(!showCrudInfo)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold transition-all cursor-pointer">
            <Database className="w-3.5 h-3.5" /> CRUD & Persistência
          </button>
          <button onClick={exportarCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm">
            <Download className="w-3.5 h-3.5" /> Exportar Dados (CSV)
          </button>
        </div>
      </div>

      {/* ═══ CAIXA DE ESCLARECIMENTO CRUD E DADOS ═══ */}
      {showCrudInfo && (
        <div className="bg-indigo-900 text-white p-5 rounded-xl shadow-lg space-y-3 animate-slide-down text-xs">
          <div className="flex justify-between items-center border-b border-indigo-800 pb-2">
            <h4 className="font-black text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> Como funcionam os Dados e o CRUD no GCN Master?
            </h4>
            <button onClick={() => setShowCrudInfo(false)} className="text-indigo-300 hover:text-white font-bold">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] leading-relaxed">
            <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-800">
              <strong className="text-emerald-400 flex items-center gap-1 mb-1">
                <PlusCircle className="w-3.5 h-3.5" /> Os dados são reais?
              </strong>
              Sim! Todos os dados são baseados nas operações reais das gerências corporativas da empresa (Gecob, Gered, Getic, Gefic, Gesap, Gesuc). Estão armazenados no banco local <strong>v12.0</strong> em <code>localStorage</code>.
            </div>
            <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-800">
              <strong className="text-amber-300 flex items-center gap-1 mb-1">
                <Edit3 className="w-3.5 h-3.5" /> Onde posso testar o CRUD?
              </strong>
              Você pode Criar, Editar e Excluir registros em todas as abas: <strong>PCO/PRD</strong> (Aba 4), <strong>Contratos</strong> (Aba 1), <strong>Incidentes</strong> (Aba 2) e <strong>Riscos</strong> (Aba Estrutura). Toda alteração recalcula esta matriz dinamicamente.
            </div>
            <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-800">
              <strong className="text-indigo-300 flex items-center gap-1 mb-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Planos Vencidos
              </strong>
              Atualmente existem <strong>{kpis.planosVencidos} plano vencido</strong> e <strong>{kpis.planosVencendo30} plano a vencer em 30 dias</strong> no banco de dados para simular auditoria regulatória real.
            </div>
          </div>
        </div>
      )}

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total Negócios', value: kpis.total, sub: 'Na matriz 4×4', icon: Activity, cor: 'border-indigo-500' },
          { label: 'Prioridade Máxima', value: kpis.q4, sub: 'Quadrante Q4', icon: AlertTriangle, cor: 'border-red-500' },
          { label: 'Impacto Médio', value: kpis.impactoMedio, sub: 'Score 0-100', icon: TrendingUp, cor: 'border-amber-500' },
          { label: 'Planos Aprovados', value: kpis.planosAprovados, sub: 'Vigência com ata', icon: FileCheck, cor: 'border-emerald-500' },
          { label: 'Planos Vencidos', value: kpis.planosVencidos, sub: 'Exigem revisão', icon: ShieldAlert, cor: 'border-rose-600', destaque: true },
          { label: 'Vencendo 30d', value: kpis.planosVencendo30, sub: 'Alerta GERIC', icon: Clock, cor: 'border-amber-600' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-white dark:bg-slate-900 p-3.5 rounded-xl border-l-4 ${kpi.cor} border border-slate-200 dark:border-slate-800 shadow-sm ${kpi.destaque ? 'ring-2 ring-rose-500/20' : ''}`}>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 truncate">
              <kpi.icon className="w-3.5 h-3.5 flex-shrink-0" /> {kpi.label}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{kpi.value}</div>
            <div className="text-[9px] text-slate-400 mt-0.5 truncate">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ═══ FILTROS E BUSCA ═══ */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-indigo-500" /> Filtros Dinâmicos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input type="text" placeholder="Buscar por processo, área ou responsável..."
            value={busca} onChange={e => setBusca(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
          <select value={filtroQuadrante} onChange={e => setFiltroQuadrante(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
            <option value="all">Todos os quadrantes</option>
            <option value="Q4">Q4 — Prioridade Máxima (Vermelho)</option>
            <option value="Q3">Q3 — Alta Prioridade (Rosa)</option>
            <option value="Q2">Q2 — Média Prioridade (Amarelo)</option>
            <option value="Q1">Q1 — Baixa Prioridade (Cinza)</option>
          </select>
          <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
            <option value="all">Todas as áreas</option>
            {areasUnicas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
            <option value="all">Todos os status</option>
            {statusUnicos.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ═══ SCATTER CHART 4×4 COM BANNERS DE QUADRANTE ═══ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Matriz 4×4 — Cruzamento de Impacto Financeiro vs Urgência</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Eixo X: Impacto no Negócio (0-100) · Eixo Y: Probabilidade/Urgência (0-60) · O tamanho de cada ponto reflete o faturamento do processo.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-md">Q4 = Foco de Investimento em DR</span>
          </div>
        </div>

        {/* Overlay explicativo dos 4 Quadrantes */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-[9px] font-bold">
          <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 flex justify-between">
            <span>↖️ Q2: Média Prioridade (Urgência Operacional / Baixo Impacto R$)</span>
            <span>Urgência ≥ 30</span>
          </div>
          <div className="p-2 rounded-lg bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-400 flex justify-between font-black">
            <span>↗️ Q4: PRIORIDADE MÁXIMA (Alto Impacto R$ + Alta Urgência)</span>
            <span>Impacto ≥ 50 & Urgência ≥ 30</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex justify-between">
            <span>↙️ Q1: Baixa Prioridade (Processos estáveis / Baixo impacto R$)</span>
            <span>Impacto &lt; 50</span>
          </div>
          <div className="p-2 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 flex justify-between">
            <span>↘️ Q3: Alta Prioridade (Alto Impacto R$ / Urgência Controlada)</span>
            <span>Impacto ≥ 50</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" dataKey="impacto" domain={[0, 100]} name="Impacto"
              tick={{ fontSize: 10 }} label={{ value: 'Impacto no Negócio (Faturamento + Perda/Hora + Criticidade)', position: 'bottom', offset: 20, style: { fontSize: 11, fontWeight: 700, fill: '#64748b' } }} />
            <YAxis type="number" dataKey="urgencia" domain={[0, 60]} name="Urgência"
              tick={{ fontSize: 10 }} label={{ value: 'Probabilidade / Urgência Operacional', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 11, fontWeight: 700, fill: '#64748b' } }} />
            <ReferenceLine x={50} stroke="#dc2626" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: 'Linha de Alto Impacto (50 pts)', position: 'top', fill: '#dc2626', fontSize: 9 }} />
            <ReferenceLine y={30} stroke="#dc2626" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: 'Linha de Alta Urgência (30 pts)', position: 'right', fill: '#dc2626', fontSize: 9 }} />
            <RTooltip content={<ScatterTooltip />} />
            <Scatter data={dadosFiltrados} shape="circle">
              {dadosFiltrados.map((d, i) => (
                <Cell key={i} fill={CORES_QUADRANTE[d.quadrante]?.fill || '#94a3b8'}
                  r={Math.max(6, Math.min(18, (d.faturamento / 450000) + 5))}
                  fillOpacity={0.8} stroke={CORES_QUADRANTE[d.quadrante]?.fill} strokeWidth={2} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legenda dos Quadrantes */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px]">
          {Object.entries(CORES_QUADRANTE).map(([q, c]) => (
            <div key={q} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.fill }} />
              <span className="font-bold text-slate-700 dark:text-slate-300">{q} - {c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SIMULAÇÃO MONTE CARLO REFATORADA E DIDÁTICA ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button onClick={() => setShowMonteCarlo(!showMonteCarlo)}
          className="w-full flex items-center justify-between p-4 text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
          <span className="flex items-center gap-2">
            <Dices className="w-4.5 h-4.5 text-violet-500" /> Simulação Monte Carlo — Distribuição de Perda Financeira quando Ocorre Incidente
          </span>
          {showMonteCarlo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMonteCarlo && (
          <div className="p-6 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-violet-50/50 dark:bg-violet-950/15 p-3 rounded-xl border border-violet-100 dark:border-violet-900/30">
              <strong>Entenda esta Simulação:</strong> O algoritmo executa <strong>1.000 iterações estocásticas no ano</strong>. 
              Em cada iteração, varia-se a ocorrência de incidentes (baseada no histórico da empresa), o tempo de indisponibilidade (50% a 250% do RTO) e o custo real/hora. 
              <strong>O gráfico abaixo filtra apenas os cenários em que ocorreu parada operacional</strong> para mostrar a severidade das perdas financeiras.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={handleMonteCarlo} disabled={mcRunning}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2">
                {mcRunning ? <Activity className="w-4 h-4 animate-spin" /> : <Dices className="w-4 h-4" />}
                {mcRunning ? 'Simulando 1.000 cenários...' : 'Rodar Simulação Monte Carlo'}
              </button>

              {mcResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] flex-1">
                  <div className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <span className="text-slate-400 block text-[9px]">Taxa de Ocorrência:</span>
                    <span className="font-black text-indigo-700 dark:text-indigo-400 text-xs">{mcResult.taxaOcorrencia}% dos cenários</span>
                  </div>
                  <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <span className="text-slate-400 block text-[9px]">Perda Mediana (P50):</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-400 text-xs">R$ {(mcResult.p50 / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="text-slate-400 block text-[9px]">Cenário Severo (P90):</span>
                    <span className="font-black text-amber-700 dark:text-amber-400 text-xs">R$ {(mcResult.p90 / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="px-3 py-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-800">
                    <span className="text-slate-400 block text-[9px]">Cenário Extremo (P95):</span>
                    <span className="font-black text-rose-700 dark:text-rose-400 text-xs">R$ {(mcResult.p95 / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              )}
            </div>

            {mcResult && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">
                    Distribuição da Frequência de Prejuízos (Apenas nos {mcResult.comIncidenteCount} Cenários com Incidente)
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    {mcResult.semIncidenteCount} cenários ({(100 - mcResult.taxaOcorrencia)}%) terminaram com R$ 0 de perda (operação 100% estável)
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={mcResult.hist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="faixaCurta" tick={{ fontSize: 9 }} label={{ value: 'Faixa de Prejuízo Financeiro (R$)', position: 'bottom', offset: 15, style: { fontSize: 10, fill: '#64748b' } }} />
                    <YAxis tick={{ fontSize: 9 }} label={{ value: 'Freq. (Nº de Simulações)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }} />
                    <RTooltip
                      formatter={(v) => [`${v} simulações`, 'Frequência']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.faixaLabel || label}
                      contentStyle={{ fontSize: 11, borderRadius: 8, fontWeight: 700 }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ TABELA DETALHADA DE NEGÓCIOS ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Negócios Detalhados & Accountability</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Visão consolidada com responsáveis de 1ª linha, verificadores GERIC (2ª linha) e gestor executivo</p>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">{dadosFiltrados.length} de {dados.length} negócios</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-2.5 text-left font-bold text-slate-500">#</th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-500 cursor-pointer" onClick={() => handleSort('nome')}>
                  Nome do Negócio <SortIcon col="nome" />
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-500 cursor-pointer" onClick={() => handleSort('area')}>
                  Área <SortIcon col="area" />
                </th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500 cursor-pointer" onClick={() => handleSort('impacto')}>
                  Impacto <SortIcon col="impacto" />
                </th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500 cursor-pointer" onClick={() => handleSort('urgencia')}>
                  Urgência <SortIcon col="urgencia" />
                </th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500">⏱ RTO</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500">🔄 RPO</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500 cursor-pointer" onClick={() => handleSort('faturamento')}>
                  Faturamento <SortIcon col="faturamento" />
                </th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500 cursor-pointer" onClick={() => handleSort('perdaHora')}>
                  Perda/Hora <SortIcon col="perdaHora" />
                </th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500">Ciclo (Gerel)</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500 cursor-pointer" onClick={() => handleSort('quadrante')}>
                  Quadrante <SortIcon col="quadrante" />
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-500">Resp. Testes (1ª)</th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-500">Verificador (2ª)</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500 cursor-pointer" onClick={() => handleSort('status')}>
                  Status Plano <SortIcon col="status" />
                </th>
              </tr>
            </thead>
            <tbody>
              {dadosOrdenados.map((d, i) => (
                <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group" title={d.indicacaoGerel}>
                  <td className="px-3 py-2.5 text-slate-400 font-bold">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-extrabold text-slate-800 dark:text-white leading-tight max-w-[200px]">{d.nome}</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">{d.estrategiaDRP}{d.requerDRP ? ' · DRP' : ''}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{d.area}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-black ${
                      d.impacto >= 70 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                      d.impacto >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>{d.impacto}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-black ${
                      d.urgencia >= 40 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                      d.urgencia >= 25 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}>{d.urgencia}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-600 dark:text-slate-400">{d.rto}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-600 dark:text-slate-400">{d.rpo}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-700 dark:text-slate-300">
                    {d.faturamento > 0 ? `R$ ${(d.faturamento / 1000).toFixed(0)}k` : <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-rose-600 dark:text-rose-400">
                    R$ {(d.perdaHora / 1000).toFixed(0)}k
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black ${CORES_CICLO[d.cicloVida]?.bg || ''} ${CORES_CICLO[d.cicloVida]?.cor || ''}`}>
                      {CORES_CICLO[d.cicloVida]?.emoji} {d.cicloVida}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black ${CORES_QUADRANTE[d.quadrante]?.badge}`}>
                      {d.quadrante}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 max-w-[120px] truncate">{d.responsavelTestes}</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 max-w-[120px] truncate">{d.verificadorGeric}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black whitespace-nowrap ${CORES_STATUS[d.statusPlano] || 'bg-slate-100 text-slate-500'}`}>
                      {d.statusPlano}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
