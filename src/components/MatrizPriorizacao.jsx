import React, { useState, useMemo, useCallback } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine, Cell, BarChart, Bar, Legend
} from 'recharts';
import {
  Target, TrendingUp, AlertTriangle, ShieldCheck, Activity,
  Download, Dices, ChevronDown, ChevronUp, Search, ArrowUpDown,
  Clock, RefreshCw, Users, FileCheck, Info
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
// SIMULAÇÃO MONTE CARLO
// ═══════════════════════════════════════════════════════════════════════════════

function rodarMonteCarlo(processos, iteracoes = 1000) {
  const resultados = [];
  for (let i = 0; i < iteracoes; i++) {
    let perdaTotal = 0;
    for (const p of processos) {
      const probIncidente = Math.random();
      const taxaAnual = Math.max(0.05, (p.total_incidentes_12m || 0.5) / 12);
      if (probIncidente < taxaAnual) {
        const rtoBase = p.sla_contrato_cliente || p.rpo_minutos || 240;
        const duracao = rtoBase * (0.5 + Math.random() * 2.0);
        const perdaHora = p.perda_hora_estimada * (0.7 + Math.random() * 0.6);
        perdaTotal += (duracao / 60) * perdaHora;
      }
    }
    resultados.push(Math.round(perdaTotal));
  }
  resultados.sort((a, b) => a - b);
  const buckets = 20;
  const max = resultados[resultados.length - 1] || 1;
  const min = resultados[0] || 0;
  const step = Math.max(1, (max - min) / buckets);
  const hist = [];
  for (let b = 0; b < buckets; b++) {
    const lo = min + b * step;
    const hi = lo + step;
    const count = resultados.filter(v => v >= lo && v < hi).length;
    hist.push({ faixa: `R$ ${(lo / 1000).toFixed(0)}k`, valor: lo, count });
  }
  return {
    hist,
    p50: resultados[Math.floor(iteracoes * 0.50)],
    p90: resultados[Math.floor(iteracoes * 0.90)],
    p95: resultados[Math.floor(iteracoes * 0.95)],
    media: Math.round(resultados.reduce((a, b) => a + b, 0) / iteracoes),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP DO SCATTER
// ═══════════════════════════════════════════════════════════════════════════════

const ScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-4 max-w-xs text-xs space-y-1.5">
      <div className="font-extrabold text-slate-800 dark:text-white text-sm">{d.nome}</div>
      <div className="text-slate-500">{d.area}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
        <span className="text-slate-400">Impacto:</span><span className="font-bold">{d.impacto}</span>
        <span className="text-slate-400">Urgência:</span><span className="font-bold">{d.urgencia}</span>
        <span className="text-slate-400">Quadrante:</span><span className={`font-black ${CORES_QUADRANTE[d.quadrante]?.text}`}>{d.quadrante}</span>
        <span className="text-slate-400">Faturamento:</span><span className="font-bold">R$ {(d.faturamento / 1000).toFixed(0)}k</span>
        <span className="text-slate-400">Perda/Hora:</span><span className="font-bold text-rose-500">R$ {(d.perdaHora / 1000).toFixed(0)}k</span>
        <span className="text-slate-400">Ciclo Vida:</span><span className="font-bold">{CORES_CICLO[d.cicloVida]?.emoji} {d.cicloVida}</span>
        <span className="text-slate-400">RTO:</span><span className="font-bold">{d.rto}</span>
        <span className="text-slate-400">Status:</span><span className="font-bold">{d.statusPlano}</span>
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
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [mcResult, setMcResult] = useState(null);
  const [mcRunning, setMcRunning] = useState(false);

  const processos = (db.processosCriticos?.list ? db.processosCriticos.list() : []) || [];
  const gerencias = (db.gerencias?.list ? db.gerencias.list() : []) || [];

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
      .filter(p => p.faturamento_anual !== undefined) // só processos com dados de priorização
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

  // KPIs
  const kpis = useMemo(() => ({
    total: dados.length,
    q4: dados.filter(d => d.quadrante === 'Q4').length,
    impactoMedio: dados.length > 0 ? Math.round(dados.reduce((s, d) => s + d.impacto, 0) / dados.length) : 0,
    planosAprovados: dados.filter(d => d.statusPlano === 'Plano Aprovado').length,
    altoImpacto: dados.filter(d => d.impacto >= 70).length,
  }), [dados]);

  // Áreas únicas para filtro
  const areasUnicas = useMemo(() => [...new Set(dados.map(d => d.area))].sort(), [dados]);
  const statusUnicos = useMemo(() => [...new Set(dados.map(d => d.statusPlano))].sort(), [dados]);

  // Handle sort
  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  // Monte Carlo
  const handleMonteCarlo = () => {
    setMcRunning(true);
    setTimeout(() => {
      const result = rodarMonteCarlo(processos.filter(p => p.faturamento_anual !== undefined));
      setMcResult(result);
      setMcRunning(false);
    }, 100);
  };

  // Exportar CSV
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
            <Target className="w-5 h-5 text-indigo-500" /> Matriz de Priorização de Negócios
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Dashboard de Gestão e Análise de Impacto · Matriz 4×4 · Simulação Monte Carlo
          </p>
        </div>
        <button onClick={exportarCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm">
          <Download className="w-3.5 h-3.5" /> Exportar Dados
        </button>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total de Negócios', value: kpis.total, sub: 'Na matriz', icon: Activity, cor: 'border-indigo-400' },
          { label: 'Prioridade Máxima', value: kpis.q4, sub: 'Quadrante Q4', icon: AlertTriangle, cor: 'border-red-400' },
          { label: 'Impacto Médio', value: kpis.impactoMedio, sub: 'De 0 a 100', icon: TrendingUp, cor: 'border-amber-400' },
          { label: 'Planos Aprovados', value: kpis.planosAprovados, sub: 'Com plano definido', icon: FileCheck, cor: 'border-emerald-400' },
          { label: 'Alto Impacto', value: kpis.altoImpacto, sub: 'Impacto ≥ 70', icon: ShieldCheck, cor: 'border-violet-400' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 ${kpi.cor} border border-slate-200 dark:border-slate-800 shadow-sm`}>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              <kpi.icon className="w-3.5 h-3.5" /> {kpi.label}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{kpi.value}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ═══ FILTROS ═══ */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" /> Filtros e Busca
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input type="text" placeholder="Buscar processos, áreas ou recursos..."
            value={busca} onChange={e => setBusca(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
          <select value={filtroQuadrante} onChange={e => setFiltroQuadrante(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <option value="all">Todos os quadrantes</option>
            <option value="Q4">Q4 — Prioridade Máxima</option>
            <option value="Q3">Q3 — Alta Prioridade</option>
            <option value="Q2">Q2 — Média Prioridade</option>
            <option value="Q1">Q1 — Baixa Prioridade</option>
          </select>
          <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <option value="all">Todas as áreas</option>
            {areasUnicas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <option value="all">Todos os status</option>
            {statusUnicos.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ═══ SCATTER CHART 4×4 ═══ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="mb-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Matriz de Priorização 4×4</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Negócios distribuídos por Impacto (0-100) vs Probabilidade/Urgência (0-60) — tamanho do ponto proporcional ao faturamento
          </p>
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" dataKey="impacto" domain={[0, 100]} name="Impacto"
              tick={{ fontSize: 10 }} label={{ value: 'Impacto no Negócio', position: 'bottom', offset: 20, style: { fontSize: 11, fontWeight: 700, fill: '#64748b' } }} />
            <YAxis type="number" dataKey="urgencia" domain={[0, 60]} name="Urgência"
              tick={{ fontSize: 10 }} label={{ value: 'Probabilidade / Urgência', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 11, fontWeight: 700, fill: '#64748b' } }} />
            <ReferenceLine x={50} stroke="#cbd5e1" strokeDasharray="6 4" strokeWidth={1.5} />
            <ReferenceLine y={30} stroke="#cbd5e1" strokeDasharray="6 4" strokeWidth={1.5} />
            <RTooltip content={<ScatterTooltip />} />
            <Scatter data={dadosFiltrados} shape="circle">
              {dadosFiltrados.map((d, i) => (
                <Cell key={i} fill={CORES_QUADRANTE[d.quadrante]?.fill || '#94a3b8'}
                  r={Math.max(5, Math.min(16, (d.faturamento / 500000) + 4))}
                  fillOpacity={0.75} stroke={CORES_QUADRANTE[d.quadrante]?.fill} strokeWidth={1.5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        {/* Legenda */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px]">
          {Object.entries(CORES_QUADRANTE).map(([q, c]) => (
            <div key={q} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.fill }} />
              <span className="font-bold text-slate-600 dark:text-slate-400">{q} - {c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ MONTE CARLO ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button onClick={() => setShowMonteCarlo(!showMonteCarlo)}
          className="w-full flex items-center justify-between p-4 text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
          <span className="flex items-center gap-2">
            <Dices className="w-4 h-4 text-violet-500" /> Simulação Monte Carlo — Análise de Risco Financeiro
          </span>
          {showMonteCarlo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showMonteCarlo && (
          <div className="p-6 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Simulação estocástica com 1.000 iterações variando probabilidade de incidente, duração do downtime e perda financeira/hora.
              O resultado mostra a distribuição de perda financeira anualizada esperada e os percentis P50, P90 e P95.
            </p>
            <div className="flex items-center gap-4">
              <button onClick={handleMonteCarlo} disabled={mcRunning}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2">
                {mcRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Dices className="w-3.5 h-3.5" />}
                {mcRunning ? 'Calculando...' : 'Rodar Simulação (1.000 iterações)'}
              </button>
              {mcResult && (
                <div className="flex gap-4 text-[10px]">
                  <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <span className="text-slate-400">P50:</span>{' '}
                    <span className="font-black text-emerald-700 dark:text-emerald-400">R$ {(mcResult.p50 / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/30">
                    <span className="text-slate-400">P90:</span>{' '}
                    <span className="font-black text-amber-700 dark:text-amber-400">R$ {(mcResult.p90 / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-900/30">
                    <span className="text-slate-400">P95:</span>{' '}
                    <span className="font-black text-rose-700 dark:text-rose-400">R$ {(mcResult.p95 / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              )}
            </div>
            {mcResult && (
              <div>
                <h4 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-2">Distribuição de Perda Financeira Anualizada (R$)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={mcResult.hist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="faixa" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 9 }} label={{ value: 'Frequência', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#94a3b8' } }} />
                    <RTooltip formatter={(v) => [`${v} iterações`, 'Frequência']}
                      contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ TABELA DETALHADA ═══ */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Negócios Detalhados</h3>
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
                <th className="px-3 py-2.5 text-center font-bold text-slate-500">Ciclo</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500 cursor-pointer" onClick={() => handleSort('quadrante')}>
                  Quadrante <SortIcon col="quadrante" />
                </th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-500">Resp. Testes</th>
                <th className="px-3 py-2.5 text-left font-bold text-slate-500">Verificador (2ª)</th>
                <th className="px-3 py-2.5 text-center font-bold text-slate-500 cursor-pointer" onClick={() => handleSort('status')}>
                  Status <SortIcon col="status" />
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

      {/* ═══ NOTA GEREL ═══ */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-200 dark:border-indigo-900/30 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-relaxed">
          <strong>Ciclo de Vida — Indicação Gerel:</strong> Processos classificados como <strong>Declínio</strong> ou{' '}
          <strong>Sunset</strong> recebem redução automática no score de impacto (50% e 70% respectivamente), pois a Gerel indica que não devem receber investimentos de DR/continuidade. 
          Passe o mouse sobre qualquer linha da tabela para ver a indicação detalhada da Gerel para aquele negócio.
        </div>
      </div>

    </div>
  );
}
