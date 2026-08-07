import React, { useState, useMemo } from 'react';
import { 
  Network, Server, ShieldAlert, ShieldCheck, ArrowRight, 
  Building2, Cpu, FileText, AlertTriangle, Layers, Filter, CheckCircle2,
  HardDrive, Database, Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MatrizInterdependencia({ db }) {
  const { usuario } = useAuth();

  const processos = useMemo(() => (db.processosCriticos?.list ? db.processosCriticos.list() : []), [db]);
  const gerencias = useMemo(() => (db.gerencias?.list ? db.gerencias.list() : []), [db]);
  const contratos = useMemo(() => (db.contratos?.list ? db.contratos.list() : []), [db]);
  const terceiros = useMemo(() => (db.fornecedoresCriticosTPRM?.list ? db.fornecedoresCriticosTPRM.list() : []), [db]);
  const planosPCO = useMemo(() => (db.planosContinuidade?.list ? db.planosContinuidade.list() : []), [db]);

  const [filtroGerencia, setFiltroGerencia] = useState('ALL');
  const [apenasSpofs, setApenasSpofs] = useState(false);

  // ─── MAPEAMENTO DE LINHAGEM E DETECÇÃO DE SPOF ─────────────────────────────
  const linhagemCompleta = useMemo(() => {
    return processos.map(proc => {
      const gerencia = gerencias.find(g => g.id_gerencia === proc.id_gerencia);
      const contrato = contratos.find(c => c.id_contrato === proc.id_contrato);
      const plano = planosPCO.find(p => p.id_processo === proc.id_processo);
      const fornecedor = terceiros.find(t => t.contrato_id === proc.id_contrato || t.nome.toLowerCase().includes(proc.nome.toLowerCase()));

      // Critérios para Identificação de SPOF (Single Point of Failure):
      // 1. Processo sem Plano PCO Aprovado/Vigente
      // 2. Não possui DRP/Redundância de TIC
      // 3. Depende de Fornecedor Crítico sem PCO Auditado
      const spofMotivos = [];
      if (!plano || (plano.status_aprovacao !== 'Vigente' && plano.status_aprovacao !== 'Aprovado')) {
        spofMotivos.push('Sem PCO Vigente');
      }
      if (!proc.requer_drp || proc.estrategia_drp?.includes('Manual') || proc.estrategia_drp?.includes('Cold')) {
        spofMotivos.push('DRP Sem Redundância Automática');
      }
      if (fornecedor && !fornecedor.pco_proprio_auditado) {
        spofMotivos.push('Vendor Pendente de Auditoria');
      }

      const isSpof = spofMotivos.length > 0;

      return {
        ...proc,
        gerenciaNome: gerencia?.nome || proc.id_gerencia,
        contratoNome: contrato?.nome || 'Sem Contrato Formal',
        planoStatus: plano?.status_aprovacao || 'Não Cadastrado',
        fornecedorNome: fornecedor?.nome || 'Infraestrutura Própria',
        fornecedorAuditado: fornecedor ? fornecedor.pco_proprio_auditado : true,
        isSpof,
        spofMotivos
      };
    });
  }, [processos, gerencias, contratos, planosPCO, terceiros]);

  const linhagemFiltrada = useMemo(() => {
    return linhagemCompleta.filter(item => {
      if (filtroGerencia !== 'ALL' && item.id_gerencia !== filtroGerencia) return false;
      if (apenasSpofs && !item.isSpof) return false;
      return true;
    });
  }, [linhagemCompleta, filtroGerencia, apenasSpofs]);

  const totalSpofs = useMemo(() => linhagemCompleta.filter(i => i.isSpof).length, [linhagemCompleta]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ═══ HEADER ═══ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-500" /> Matriz de Interdependência & Análise de SPOFs (Linha de Vida E2E)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-3xl">
            Mapeamento da cadeia de valor de ponta a ponta: do Processo de Negócio aos Ativos de TI e Fornecedores Críticos. 
            Identificação de <strong>Single Points of Failure (SPOFs)</strong> para eliminação de gargalos sistêmicos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 px-4 py-2 rounded-xl text-center">
            <span className="text-[9px] font-extrabold uppercase text-rose-600 dark:text-rose-400 block">SPOFs Detectados</span>
            <span className="text-lg font-black text-rose-700 dark:text-rose-300">{totalSpofs} gargalos</span>
          </div>
        </div>
      </div>

      {/* ═══ BARRA DE FILTROS ═══ */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Gerência:</span>
            <select
              value={filtroGerencia}
              onChange={(e) => setFiltroGerencia(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
            >
              <option value="ALL">Todas as Gerências ({gerencias.length})</option>
              {gerencias.map(g => (
                <option key={g.id_gerencia} value={g.id_gerencia}>{g.sigla} - {g.nome}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-bold select-none">
            <input
              type="checkbox"
              checked={apenasSpofs}
              onChange={(e) => setApenasSpofs(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-rose-600 dark:text-rose-400">Exibir Apenas Gargalos / SPOFs (🚨 {totalSpofs})</span>
          </label>
        </div>

        <span className="text-[10px] text-slate-400 font-bold">
          Exibindo {linhagemFiltrada.length} de {linhagemCompleta.length} processos mapeados
        </span>
      </div>

      {/* ═══ CARDS DE LINHAGEM E2E VISUAIS ═══ */}
      <div className="space-y-4">
        {linhagemFiltrada.map((item) => (
          <div
            key={item.id_processo}
            className={`p-5 rounded-2xl border transition-all ${
              item.isSpof
                ? 'border-rose-300 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
            }`}
          >
            {/* Topo do Card: Processo & Alerta SPOF */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-850 pb-3 gap-2">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${item.isSpof ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{item.nome}</h3>
                    <span className="text-[9px] font-mono font-bold text-slate-400">{item.id_processo}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.gerenciaNome}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  item.criticidade === 'Crítica' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                }`}>
                  {item.criticidade}
                </span>

                {item.isSpof ? (
                  <span className="px-3 py-1 rounded-full text-[9px] font-black bg-rose-600 text-white flex items-center gap-1 animate-pulse">
                    <ShieldAlert className="w-3 h-3" /> SPOF DETECTADO ({item.spofMotivos.length})
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Redundância OK
                  </span>
                )}
              </div>
            </div>

            {/* DIAGRAMA DE LINHAGEM E2E (Processo ➔ Ativo ➔ Estratégia ➔ Fornecedor) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 text-[10px]">
              
              {/* Elo 1: Processo de Negócio */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-1 relative">
                <span className="text-[8px] font-extrabold uppercase text-slate-400 block">1ª Linha (Negócio)</span>
                <span className="font-bold text-slate-800 dark:text-white block truncate">{item.nome}</span>
                <div className="text-[9px] text-slate-500">RTO: <strong>{item.sla_contrato_cliente || 60}m</strong> | MTPD: <strong>{item.mtpd_horas || 12}h</strong></div>
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300 dark:text-slate-700">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Elo 2: Ativo de TI / CMDB */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-1 relative">
                <span className="text-[8px] font-extrabold uppercase text-indigo-500 block flex items-center gap-1">
                  <Server className="w-3 h-3" /> Ativo CMDB / TI
                </span>
                <span className="font-bold text-slate-800 dark:text-white block font-mono">{item.ativo_cmdb_id || 'ATV-SYS-DEFAULT'}</span>
                <div className="text-[9px] text-slate-500">SLA TIC: <strong>{item.sla_tic || 15}m</strong></div>
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300 dark:text-slate-700">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Elo 3: Estratégia de DR / PCO */}
              <div className={`p-3 rounded-xl border space-y-1 relative ${
                item.spofMotivos.includes('DRP Sem Redundância Automática') || item.spofMotivos.includes('Sem PCO Vigente')
                  ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
                  : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800'
              }`}>
                <span className="text-[8px] font-extrabold uppercase text-slate-400 block flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Estratégia DR / PCO
                </span>
                <span className="font-bold block truncate">{item.estrategia_drp || 'Hot Standby'}</span>
                <div className="text-[9px]">PCO: <strong className={item.planoStatus === 'Vigente' || item.planoStatus === 'Aprovado' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>{item.planoStatus}</strong></div>
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300 dark:text-slate-700">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Elo 4: Terceiro Crítico (TPRM) */}
              <div className={`p-3 rounded-xl border space-y-1 ${
                !item.fornecedorAuditado
                  ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
                  : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800'
              }`}>
                <span className="text-[8px] font-extrabold uppercase text-slate-400 block flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Vendor / Terceiro (TPRM)
                </span>
                <span className="font-bold block truncate">{item.fornecedorNome}</span>
                <div className="text-[9px]">
                  PCO Vendor: <strong className={item.fornecedorAuditado ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>{item.fornecedorAuditado ? 'Auditado OK' : 'Pendente Auditoria'}</strong>
                </div>
              </div>

            </div>

            {/* Motivos do SPOF (se houver) */}
            {item.isSpof && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-100/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2 text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>Gargalos a Eliminar: {item.spofMotivos.join(' | ')}</span>
              </div>
            )}
          </div>
        ))}

        {linhagemFiltrada.length === 0 && (
          <div className="bg-white dark:bg-slate-900 p-12 text-center text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800">
            Nenhum processo encontrado para os filtros selecionados.
          </div>
        )}
      </div>

    </div>
  );
}
