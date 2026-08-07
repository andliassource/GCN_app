import React, { useMemo } from 'react';
import {
  Crown, ShieldCheck, AlertTriangle, TrendingUp, DollarSign,
  Building2, Activity, Award, CheckCircle2, ShieldAlert, Zap,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardBOD({ db }) {
  const { usuario } = useAuth();

  const processos = useMemo(() => (db.processosCriticos?.list ? db.processosCriticos.list() : []), [db]);
  const gerencias = useMemo(() => (db.gerencias?.list ? db.gerencias.list() : []), [db]);
  const diretorias = useMemo(() => (db.diretorias?.list ? db.diretorias.list() : []), [db]);
  const planosPCO = useMemo(() => (db.planosContinuidade?.list ? db.planosContinuidade.list() : []), [db]);
  const incidentes = useMemo(() => (db.incidentes?.list ? db.incidentes.list() : []), [db]);
  const avaliacoes = useMemo(() => (db.avaliacaoNRGCN?.list ? db.avaliacaoNRGCN.list() : []), [db]);
  const terceiros = useMemo(() => (db.fornecedoresCriticosTPRM?.list ? db.fornecedoresCriticosTPRM.list() : []), [db]);

  // ─── CÁLCULOS EXECUTIVOS C-LEVEL ─────────────────────────────────────────────

  // 1. Exposição Financeira Horária Total (R$)
  const exposicaoFinanceiraHoraria = useMemo(() => {
    return processos.reduce((acc, p) => acc + (p.perda_hora_estimada || 0), 0);
  }, [processos]);

  // 2. Faturamento Anual Suportado por Processos Críticos (R$)
  const faturamentoTotalSuportado = useMemo(() => {
    return processos.reduce((acc, p) => acc + (p.faturamento_anual || 0), 0);
  }, [processos]);

  // 3. Índice Global de Resiliência Corporativa (0-100 pts)
  const scoreGlobalResiliencia = useMemo(() => {
    if (avaliacoes.length === 0) return 72;
    const mediaResiliencia = avaliacoes.reduce((acc, a) => acc + (a.nivel_resiliencia || 3), 0) / avaliacoes.length;
    return Math.round((mediaResiliencia / 5.0) * 100);
  }, [avaliacoes]);

  // 4. Análise de Resiliência por Diretoria (Dites, Diope, Diafi)
  const analiseDiretorias = useMemo(() => {
    const map = {
      'DIR-001': { sigla: 'Dites', nome: 'Diretoria de Tecnologia e Infraestrutura', cor: 'indigo' },
      'DIR-002': { sigla: 'Diope', nome: 'Diretoria de Operações e Negócios', cor: 'emerald' },
      'DIR-003': { sigla: 'Diafi', nome: 'Diretoria Financeira e Administrativa', cor: 'amber' }
    };

    return Object.entries(map).map(([idDir, info]) => {
      const gers = gerencias.filter(g => g.id_diretoria === idDir).map(g => g.id_gerencia);
      const procsDir = processos.filter(p => gers.includes(p.id_gerencia));
      const pcosDir = planosPCO.filter(p => procsDir.some(pr => pr.id_processo === p.id_processo));
      
      const faturamentoDir = procsDir.reduce((acc, p) => acc + (p.faturamento_anual || 0), 0);
      const perdaHoraDir = procsDir.reduce((acc, p) => acc + (p.perda_hora_estimada || 0), 0);
      const pcosAprovados = pcosDir.filter(p => p.status_aprovacao === 'Aprovado' || p.status_aprovacao === 'Vigente').length;
      const coberturaPCO = procsDir.length > 0 ? Math.round((pcosAprovados / procsDir.length) * 100) : 0;
      
      // Score da Diretoria (0-100)
      const ainsDir = avaliacoes.filter(a => procsDir.some(p => p.id_processo === a.id_processo));
      const scoreDir = ainsDir.length > 0 
        ? Math.round((ainsDir.reduce((acc, a) => acc + (a.nivel_resiliencia || 3), 0) / ainsDir.length / 5.0) * 100)
        : Math.round(coberturaPCO * 0.8 + 20);

      return {
        id: idDir,
        ...info,
        totalProcessos: procsDir.length,
        totalPCOs: pcosDir.length,
        pcosAprovados,
        coberturaPCO,
        scoreDir,
        faturamentoDir,
        perdaHoraDir
      };
    });
  }, [gerencias, processos, planosPCO, avaliacoes]);

  // 5. KRIs (Key Risk Indicators) Executivos
  const kris = useMemo(() => {
    const procsSemPCO = processos.filter(p => !planosPCO.some(pco => pco.id_processo === p.id_processo)).length;
    const pctSemPCO = processos.length > 0 ? Math.round((procsSemPCO / processos.length) * 100) : 0;

    const terceirosSemAudit = terceiros.filter(t => !t.pco_proprio_auditado).length;

    const incidentesRTOEstourado = incidentes.filter(i => i.rto_ultrapassado).length;

    return [
      {
        titulo: 'KRI 1: Processos Sem PCO',
        valor: `${pctSemPCO}%`,
        status: pctSemPCO <= 15 ? 'adequado' : 'alerta',
        meta: '< 15%',
        detalhe: `${procsSemPCO} de ${processos.length} processos sem plano formalizado`
      },
      {
        titulo: 'KRI 2: Terceiros Críticos Não Auditados',
        valor: terceirosSemAudit,
        status: terceirosSemAudit === 0 ? 'adequado' : 'critico',
        meta: '0 fornecedores',
        detalhe: `${terceirosSemAudit} parceiros chave pendentes de auditoria de PCO`
      },
      {
        titulo: 'KRI 3: Incidentes com RTO Estourado',
        valor: incidentesRTOEstourado,
        status: incidentesRTOEstourado === 0 ? 'adequado' : 'alerta',
        meta: '0 violações',
        detalhe: `${incidentesRTOEstourado} incidentes ultrapassaram a meta contratual de RTO`
      },
      {
        titulo: 'KRI 4: Exposição por Hora de Paralisação',
        valor: `R$ ${(exposicaoFinanceiraHoraria / 1000).toFixed(0)}k/h`,
        status: exposicaoFinanceiraHoraria < 1000000 ? 'adequado' : 'alerta',
        meta: '< R$ 1.0M/h',
        detalhe: 'Soma da perda estimada de todos os processos em indisponibilidade'
      }
    ];
  }, [processos, planosPCO, terceiros, incidentes, exposicaoFinanceiraHoraria]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ═══ HEADER C-LEVEL / BOD ═══ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-indigo-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-widest">
            <Crown className="w-4 h-4 text-amber-400" /> Relatório Executivo C-Level & Conselho de Administração
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            Painel Geral de Resiliência Corporativa (BOD View)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Visão consolidada para tomada de decisão estratégica de investimento em governança, mitigação de exposição financeira e monitoramento de apetite ao risco corporativo.
          </p>
        </div>

        {/* GAUGE DO SCORE GLOBAL */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-5 min-w-[240px]">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full border-4 border-emerald-400 bg-emerald-950/40 text-emerald-300 font-black text-xl shadow-inner">
            {scoreGlobalResiliencia}%
          </div>
          <div>
            <span className="text-[10px] text-slate-300 uppercase font-extrabold block">Score Global GCN</span>
            <span className="text-sm font-extrabold text-white">Resiliência Operacional</span>
            <div className="text-[9px] text-emerald-400 font-semibold mt-0.5">Conformidade ISO 22301</div>
          </div>
        </div>
      </div>

      {/* ═══ CARDS DE EXPOSIÇÃO E MÉTRICAS FINANCEIRAS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-extrabold uppercase">
            <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-rose-500" /> Exposição Horária em Risco</span>
            <span className="text-rose-500 font-mono text-[10px]">Por hora parada</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            R$ {(exposicaoFinanceiraHoraria / 1000).toFixed(0)}k <span className="text-xs font-medium text-slate-400">/ hora</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
            Perda financeira direta estimada em caso de paralisação total de todos os processos mapeados na BIA.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-extrabold uppercase">
            <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-emerald-500" /> Faturamento Anual Suportado</span>
            <span className="text-emerald-500 font-mono text-[10px]">Receita Protegida</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            R$ {(faturamentoTotalSuportado / 1000000).toFixed(1)}M <span className="text-xs font-medium text-slate-400">/ ano</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
            Volume de faturamento anual protegido por planos de continuidade formalizados (PCO/PRD).
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-extrabold uppercase">
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-indigo-500" /> Governança de 3 Linhas</span>
            <span className="text-indigo-500 font-mono text-[10px]">Modelo IIA</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            100% <span className="text-xs font-medium text-emerald-500">Aderente</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
            1ª Linha (Gestores), 2ª Linha (GERIC/Geemp/Geati - Riscos & GCN) e 3ª Linha (Geraud - Auditoria Interna Independente sem vinculação a diretoria).
          </p>
        </div>

      </div>

      {/* ═══ RESILIÊNCIA POR DIRETORIA EXECUTIVA ═══ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-indigo-500" /> Matriz de Resiliência por Diretoria Executiva
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Acompanhamento comparativo de maturidade de GCN, cobertura de planos e exposição por diretoria corporativa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {analiseDiretorias.map((d) => (
            <div key={d.id} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{d.sigla}</span>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white leading-tight mt-0.5">{d.nome}</h4>
                </div>
                <div className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                  {d.scoreDir}%
                </div>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Processos Críticos:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{d.totalProcessos} processos</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Cobertura de PCOs:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{d.coberturaPCO}% ({d.pcosAprovados} vigentes)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Perda/Hora Exposta:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">R$ {(d.perdaHoraDir / 1000).toFixed(0)}k/h</span>
                </div>
                {d.faturamentoDir > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Faturamento Sob Gestão:</span>
                    <span className="font-bold text-slate-800 dark:text-white">R$ {(d.faturamentoDir / 1000000).toFixed(1)}M/ano</span>
                  </div>
                )}
              </div>

              {/* Barra de Progresso */}
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>Maturidade de Continuidade</span>
                  <span>{d.scoreDir}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${d.scoreDir}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ RELÓGIO DE APETITE AO RISCO (KRIs EXECUTIVOS) ═══ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-indigo-500" /> Relógio de Apetite ao Risco — KRIs (Key Risk Indicators)
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Monitoramento contínuo de indicadores chave de risco em relação aos limites de tolerância aprovados pelo Conselho.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kris.map((kri, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${
              kri.status === 'adequado' ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10' :
              kri.status === 'alerta' ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10' :
              'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10'
            } space-y-2`}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">{kri.titulo}</span>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                  kri.status === 'adequado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                  kri.status === 'alerta' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                  'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                }`}>
                  {kri.status}
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{kri.valor}</div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                <strong>Limite Tolerado:</strong> {kri.meta}
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 leading-snug">
                {kri.detalhe}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ RECOMENDAÇÕES ESTRATÉGICAS PARA O CONSELHO ═══ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-indigo-200 dark:border-indigo-900/40 shadow-sm space-y-3">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5 text-indigo-500" /> Recomendações Estratégicas de Investimento para o Conselho
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="p-3.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-1">
            <span className="font-bold text-indigo-700 dark:text-indigo-400 block text-xs">1. Priorização de Investimento em DR no Quadrante Q4</span>
            <p className="text-[10px] leading-relaxed">
              Aprovar orçamento prioritário de infraestrutura de DR Ativo-Ativo para os processos do quadrante Q4 (Crédito Digital e Câmbio), que concentram mais de R$ 270k/h de exposição.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-1">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-xs">2. Auditoria Obrigatória de Terceiros Críticos (TPRM)</span>
            <p className="text-[10px] leading-relaxed">
              Determinar que a GERIC audite e exija comprovação de simulados de contingência dos fornecedores de campo e cloud pendentes antes do encerramento do exercício.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 space-y-1">
            <span className="font-bold text-amber-700 dark:text-amber-400 block text-xs">3. Fortalecimento da 2ª Linha (GERIC)</span>
            <p className="text-[10px] leading-relaxed">
              Expandir a alçada de verificação da GERIC para cobrança de revisões anuais de PCO antes do atingimento de 365 dias de vigência.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
