import React, { useState } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Shield, ShieldAlert, Award, FileSpreadsheet, Eye } from 'lucide-react';

export default function Dashboard({ db, setActiveTab }) {
  const processos = db.processosCriticos.list();
  const incidentes = db.incidentes.list();
  const ains = db.analiseImpactoNegocio.list();
  const avaliacoes = db.avaliacaoNRGCN.list();
  const planosPCO = db.planosContinuidade.list();
  const testes = db.testesAvaliacoes.list();

  // Estados locais para interatividade do Heatmap
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState(null);

  // Mapeamentos para a Matriz de Riscos (Heatmap)
  const probabilidadeNiveis = ['Rara', 'Pouco Provável', 'Provável', 'Muito Provável', 'Quase Certa'];
  const impactoNiveis = ['Insignificante', 'Menor', 'Moderado', 'Maior', 'Catastrófico'];

  // Processa dados para o gráfico de Radar (Maturidade Geral da ISO 22301)
  // Baseado na aderência real calculada dos processos
  const dimensoesMapeadas = [
    { subject: 'Identificação & Escopo', A: 0 },
    { subject: 'Análise de Impacto (AIN)', A: 0 },
    { subject: 'Planos PCO/PRD', A: 0 },
    { subject: 'Testes & Exercícios', A: 0 },
    { subject: 'Governança & Melhoria', A: 0 }
  ];

  // Cálculo fictício de maturidade com base no andamento dos módulos
  if (processos.length > 0) {
    dimensoesMapeadas[0].A = Math.min(100, 40 + processos.length * 15); // Mapeamento
    dimensoesMapeadas[1].A = Math.min(100, (ains.length / processos.length) * 100); // AINs cadastradas
    dimensoesMapeadas[2].A = Math.min(100, (planosPCO.length / processos.length) * 100); // Planos PCO
    dimensoesMapeadas[3].A = Math.min(100, testes.length > 0 ? 80 : 20); // Testes realizados
    dimensoesMapeadas[4].A = Math.min(100, (avaliacoes.length / processos.length) * 100); // Avaliações completas
  } else {
    dimensoesMapeadas.forEach(d => d.A = 20);
  }

  // Estatísticas NRGCN Global
  const mediaResiliencia = avaliacoes.length > 0
    ? (avaliacoes.reduce((acc, curr) => acc + Number(curr.nivel_resiliencia), 0) / avaliacoes.length).toFixed(2)
    : "1.00";

  const percentualAderencia = avaliacoes.length > 0
    ? (avaliacoes.reduce((acc, curr) => acc + Number(curr.aderence_ISO22301), 0) / avaliacoes.length).toFixed(0)
    : "0";

  const resilienciaData = [
    { name: 'Aderência', value: Number(percentualAderencia) },
    { name: 'Restante', value: 100 - Number(percentualAderencia) }
  ];
  
  const RADIAN = Math.PI / 180;
  const COLORS = ['#4f46e5', '#e2e8f0'];
  const COLORS_DARK = ['#6366f1', '#1e293b'];

  // Agrupar processos no Heatmap
  const getProcessosInHeatmapCell = (prob, imp) => {
    return ains.filter(ain => ain.probabilidade === prob && ain.impacto_financeiro === imp)
      .map(ain => processes.find(p => p.id_processo === ain.id_processo))
      .filter(Boolean);
  };

  // Cores de Risco do Heatmap
  const getHeatmapColor = (probIdx, impIdx) => {
    const score = (probIdx + 1) * (impIdx + 1);
    if (score <= 4) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20';
    if (score <= 9) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20';
    if (score <= 16) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20';
    return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/35 hover:bg-rose-500/30';
  };

  const getHeatmapBadge = (probIdx, impIdx) => {
    const score = (probIdx + 1) * (impIdx + 1);
    if (score <= 4) return 'Baixo';
    if (score <= 9) return 'Médio';
    if (score <= 16) return 'Alto';
    return 'Crítico';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Grid de Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Processos Críticos</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{processos.length}</h3>
            <button onClick={() => setActiveTab('ain')} className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold mt-2 flex items-center gap-1">
              Ver processos <Eye className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Maturidade ISO 22301</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{percentualAderencia}%</h3>
            <p className="text-xs text-slate-400 mt-2">Grau de conformidade auditado</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Planos Aprovados</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
              {planosPCO.filter(p => p.status_aprovacao === 'Aprovado').length} / {processos.length}
            </h3>
            <button onClick={() => setActiveTab('governanca')} className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold mt-2 flex items-center gap-1">
              Aprovações pendentes <Eye className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Últimos Testes</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
              {testes.filter(t => t.resultado === 'Sucesso').length} <span className="text-xs text-slate-400 font-normal">com Sucesso</span>
            </h3>
            <button onClick={() => setActiveTab('testes')} className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold mt-2 flex items-center gap-1">
              Histórico de simulados <Eye className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid de Gráficos de Resiliência */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Card: Nível de Resiliência NRGCN */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 w-full mb-4 text-left">Índice Global de Resiliência NRGCN</h3>
          <div className="relative w-full h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resilienciaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  startAngle={180}
                  endAngle={0}
                  paddingAngle={0}
                  dataKey="value"
                >
                  <Cell fill="#4f46e5" />
                  <Cell fill="rgba(148, 163, 184, 0.15)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-12 flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{mediaResiliencia}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Escala 1 - 5</span>
              <span className="mt-2 text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-bold">
                {percentualAderencia}% Aderente ISO 22301
              </span>
            </div>
          </div>
          <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
            Baseado no questionário de maturidade da norma e conformidade dos planos PCO/PRD.
          </div>
        </div>

        {/* Card: Gráfico Radar ISO 22301 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Aderência aos Pilares ISO 22301 & 27031</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" radius="70%" data={dimensoesMapeadas}>
                <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.2} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar
                  name="Maturidade"
                  dataKey="A"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.15}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Seção: Matriz de Riscos (Heatmap) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Matriz de Riscos dos Processos (Heatmap)</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Cruzamento de Probabilidade de Incidente com Impacto Financeiro da AIN. Clique em um card para detalhar.
            </p>
          </div>
          {selectedHeatmapCell && (
            <button 
              onClick={() => setSelectedHeatmapCell(null)}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30"
            >
              Limpar Filtro da Matriz
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* O Heatmap Interativo */}
          <div className="lg:col-span-2 overflow-x-auto">
            <div className="min-w-[500px] grid grid-cols-6 gap-2">
              
              {/* Canto Vazio */}
              <div className="h-10 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">Probabilidade</div>
              
              {/* Headers de Impacto (Colunas) */}
              {impactoNiveis.map((imp) => (
                <div key={imp} className="h-10 flex items-center justify-center text-[10px] font-bold text-slate-400 text-center uppercase leading-none">
                  {imp}
                </div>
              ))}

              {/* Linhas (Probabilidades) */}
              {probabilidadeNiveis.slice().reverse().map((prob, pIdxReal) => {
                const pIdx = 4 - pIdxReal; // Inverte para probabilidade maior no topo
                return (
                  <React.Fragment key={prob}>
                    {/* Header de Probabilidade (Linha) */}
                    <div className="flex items-center justify-end pr-2 text-[10px] font-bold text-slate-400 text-right uppercase leading-none">
                      {prob}
                    </div>

                    {/* Células da Matriz */}
                    {impactoNiveis.map((imp, iIdx) => {
                      const procs = getProcessosInHeatmapCell(prob, imp);
                      const isSelected = selectedHeatmapCell?.prob === prob && selectedHeatmapCell?.imp === imp;
                      const hasProcessos = procs.length > 0;

                      return (
                        <button
                          key={imp}
                          onClick={() => hasProcessos ? setSelectedHeatmapCell({ prob, imp, processos: procs }) : null}
                          disabled={!hasProcessos}
                          className={`h-16 rounded-lg border flex flex-col items-center justify-center relative p-1 transition-all ${getHeatmapColor(pIdx, iIdx)} ${
                            hasProcessos ? 'cursor-pointer hover:scale-[1.03] shadow-sm' : 'opacity-20 cursor-not-allowed'
                          } ${isSelected ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 scale-[1.03]' : ''}`}
                        >
                          <span className="text-[10px] font-bold opacity-60">
                            {getHeatmapBadge(pIdx, iIdx)}
                          </span>
                          {hasProcessos && (
                            <span className="w-5 h-5 rounded-full bg-slate-900/10 dark:bg-white/10 flex items-center justify-center text-xs font-black mt-1">
                              {procs.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Lateral: Detalhes do Filtro do Heatmap */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
            {selectedHeatmapCell ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filtro Ativo</span>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                    Probabilidade: <span className="text-indigo-600 dark:text-indigo-400">{selectedHeatmapCell.prob}</span>
                  </h4>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    Impacto: <span className="text-indigo-600 dark:text-indigo-400">{selectedHeatmapCell.imp}</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Processos Afetados ({selectedHeatmapCell.processos.length})</span>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {selectedHeatmapCell.processos.map(proc => {
                      const ainInfo = ains.find(a => a.id_processo === proc.id_processo);
                      return (
                        <div key={proc.id_processo} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg shadow-2xs">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{proc.nome}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[9px] bg-rose-50 dark:bg-rose-950 text-rose-500 px-1.5 py-0.5 rounded font-bold">
                              RTO: {ainInfo?.RTO}m
                            </span>
                            <span className="text-[9px] bg-amber-50 dark:bg-amber-950 text-amber-500 px-1.5 py-0.5 rounded font-bold">
                              RPO: {ainInfo?.RPO}m
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <Shield className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nenhum filtro da matriz selecionado</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                  Clique nas células coloridas da matriz de risco para visualizar a lista detalhada de processos críticos afetados por aquela severidade.
                </p>
              </div>
            )}

            {/* Rodapé informativo */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 leading-normal mt-4">
              A matriz de riscos utiliza uma pontuação de risco clássica onde Risco = Probabilidade x Impacto.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
