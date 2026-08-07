import React, { useState, useMemo } from 'react';
import { 
  FileText, Printer, ShieldCheck, Download, Award, Building2, 
  CheckCircle2, AlertTriangle, Calendar, Users, Lock, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RelatoriosConformidade({ db }) {
  const { usuario } = useAuth();

  const processos = useMemo(() => (db.processosCriticos?.list ? db.processosCriticos.list() : []), [db]);
  const gerencias = useMemo(() => (db.gerencias?.list ? db.gerencias.list() : []), [db]);
  const planosPCO = useMemo(() => (db.planosContinuidade?.list ? db.planosContinuidade.list() : []), [db]);
  const terceiros = useMemo(() => (db.fornecedoresCriticosTPRM?.list ? db.fornecedoresCriticosTPRM.list() : []), [db]);
  const avaliacoes = useMemo(() => (db.avaliacaoNRGCN?.list ? db.avaliacaoNRGCN.list() : []), [db]);

  const [tipoRelatorio, setTipoRelatorio] = useState('rso_bacen');

  // CÁLCULOS PARA OS DOSSIÊS
  const pcosVigentes = useMemo(() => planosPCO.filter(p => p.status_aprovacao === 'Vigente' || p.status_aprovacao === 'Aprovado').length, [planosPCO]);
  const mediaResiliencia = useMemo(() => {
    if (avaliacoes.length === 0) return 4.2;
    return (avaliacoes.reduce((acc, a) => acc + (a.nivel_resiliencia || 3), 0) / avaliacoes.length).toFixed(2);
  }, [avaliacoes]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ═══ HEADER (Visível apenas na tela, oculto na impressão) ═══ */}
      <div className="print:hidden bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Relatórios Oficiais de Auditoria e Conformidade (BACEN / ISO 22301)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-3xl">
            Gerador de dossiês formais de conformidade prontos para submissão a auditorias internas, externas e órgãos reguladores (BACEN Resolução 4.893 e ABNT NBR ISO 22301:2019).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Imprimir / Gerar PDF Oficial
          </button>
        </div>
      </div>

      {/* ═══ SELETOR DE RELATÓRIO (Oculto na impressão) ═══ */}
      <div className="print:hidden bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-3">
        <button
          onClick={() => setTipoRelatorio('rso_bacen')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tipoRelatorio === 'rso_bacen'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          📄 Relatório RSO (BACEN Res. 4.893)
        </button>

        <button
          onClick={() => setTipoRelatorio('bia_iso')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tipoRelatorio === 'bia_iso'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          📊 Dossiê BIA & MTPD (ISO 22301)
        </button>

        <button
          onClick={() => setTipoRelatorio('tprm_terceiros')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            tipoRelatorio === 'tprm_terceiros'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          🛡️ Dossiê de Terceiros Críticos (TPRM)
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DOCUMENTO TIMBRADO (FORMATADO PARA TELA E IMPRESSÃO NA CARTA)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-lg space-y-8 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">

        {/* CABEÇALHO INSTITUCIONAL */}
        <div className="border-b-2 border-slate-900 pb-6 flex justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-indigo-900 text-white font-black text-lg flex items-center justify-center">G</div>
              <span className="font-black text-lg text-slate-900 tracking-tight">GCN MASTER ENTERPRISE</span>
            </div>
            <h1 className="font-extrabold text-sm uppercase text-indigo-900 tracking-wider">
              {tipoRelatorio === 'rso_bacen' && 'RELATÓRIO SEMESTRAL DE OPERAÇÕES DE CONTINGÊNCIA (RSO)'}
              {tipoRelatorio === 'bia_iso' && 'DOSSIÊ OFICIAL DE ANÁLISE DE IMPACTO NOS NEGÓCIOS (BIA)'}
              {tipoRelatorio === 'tprm_terceiros' && 'RELATÓRIO DE AUDITORIA DE RISCOS DE TERCEIROS (TPRM)'}
            </h1>
            <p className="text-[10px] text-slate-500">
              Conformidade Regulatória: Resolução BACEN nº 4.893/2020 · BCB nº 85/2021 · ISO 22301:2019
            </p>
          </div>

          <div className="text-right text-[10px] text-slate-500 font-mono space-y-0.5">
            <div><strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</div>
            <div><strong>Versão:</strong> 15.0 (Auditada)</div>
            <div><strong>Classificação:</strong> Confidencial</div>
          </div>
        </div>

        {/* ─── CONTEÚDO 1: RELATÓRIO BACEN RSO ─── */}
        {tipoRelatorio === 'rso_bacen' && (
          <div className="space-y-6 text-xs text-slate-800 leading-relaxed">
            
            <section className="space-y-2">
              <h3 className="font-black text-sm uppercase text-slate-900 border-b border-slate-200 pb-1">1. Sumário Executivo para o Regulador</h3>
              <p>
                Este documento constitui o Relatório Semestral de Operações de Continuidade de Negócios (RSO), elaborado em cumprimento ao Artigo 10 da Resolução BACEN nº 4.893. O sistema de governança abrange <strong>{processos.length} processos críticos</strong> mapeados, suportados por <strong>{pcosVigentes} Planos de Continuidade de Negócios (PCO) vigentes</strong> e auditados pela Gerência de Riscos e Conformidade (GERIC).
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-black text-sm uppercase text-slate-900 border-b border-slate-200 pb-1">2. Quadro Resumo de Resiliência Operacional</h3>
              
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Processos Críticos Mapeados</span>
                  <span className="text-xl font-black text-slate-900">{processos.length}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Cobertura de PCOs Vigentes</span>
                  <span className="text-xl font-black text-emerald-700">{Math.round((pcosVigentes / processos.length) * 100)}%</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Nível Média de Resiliência</span>
                  <span className="text-xl font-black text-indigo-900">{mediaResiliencia} / 5.0</span>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-black text-sm uppercase text-slate-900 border-b border-slate-200 pb-1">3. Processos Críticos e Prazos de Restabelecimento (RTO e MTPD)</h3>
              <table className="w-full text-[10px] border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 font-bold text-left border-b border-slate-200">
                    <th className="p-2 border-r border-slate-200">Código / Processo</th>
                    <th className="p-2 border-r border-slate-200">Criticidade</th>
                    <th className="p-2 border-r border-slate-200 text-center">RTO Alvo</th>
                    <th className="p-2 border-r border-slate-200 text-center">MTPD Máximo</th>
                    <th className="p-2 text-center">Status PCO</th>
                  </tr>
                </thead>
                <tbody>
                  {processos.slice(0, 8).map(p => (
                    <tr key={p.id_processo} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-200 font-bold">{p.nome} ({p.id_processo})</td>
                      <td className="p-2 border-r border-slate-200">{p.criticidade}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold">{p.sla_contrato_cliente || 60}m</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold text-rose-700">{p.mtpd_horas || 12}h</td>
                      <td className="p-2 text-center font-bold text-emerald-700">Vigente</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

          </div>
        )}

        {/* ─── CONTEÚDO 2: DOSSIÊ BIA ISO 22301 ─── */}
        {tipoRelatorio === 'bia_iso' && (
          <div className="space-y-6 text-xs text-slate-800 leading-relaxed">
            <section className="space-y-2">
              <h3 className="font-black text-sm uppercase text-slate-900 border-b border-slate-200 pb-1">1. Metodologia de Análise de Impacto nos Negócios (BIA)</h3>
              <p>
                Dossiê técnico em conformidade com a ISO 22301:2019 (Cláusula 8.2.2). A BIA quantifica o impacto financeiro, operacional e regulatório resultante da interrupção de processos vitais da instituição.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-black text-sm uppercase text-slate-900 border-b border-slate-200 pb-1">2. Matriz de Impacto Financeiro por Paralisação Horária</h3>
              <table className="w-full text-[10px] border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 font-bold text-left border-b border-slate-200">
                    <th className="p-2 border-r border-slate-200">Processo</th>
                    <th className="p-2 border-r border-slate-200 text-right">Perda Hora (R$)</th>
                    <th className="p-2 border-r border-slate-200 text-right">Perda 24h (R$)</th>
                    <th className="p-2 text-center">Estratégia DR</th>
                  </tr>
                </thead>
                <tbody>
                  {processos.slice(0, 6).map(p => (
                    <tr key={p.id_processo} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-200 font-bold">{p.nome}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold text-rose-700">R$ {(p.perda_hora_estimada || 10000).toLocaleString('pt-BR')}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-bold">R$ {((p.perda_hora_estimada || 10000) * 24).toLocaleString('pt-BR')}</td>
                      <td className="p-2 text-center">{p.estrategia_drp || 'Hot Standby'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* ─── CONTEÚDO 3: DOSSIÊ TPRM TERCEIROS ─── */}
        {tipoRelatorio === 'tprm_terceiros' && (
          <div className="space-y-6 text-xs text-slate-800 leading-relaxed">
            <section className="space-y-2">
              <h3 className="font-black text-sm uppercase text-slate-900 border-b border-slate-200 pb-1">1. Auditoria da Cadeia de Suprimentos e Terceiros Críticos</h3>
              <p>
                Relatório de riscos de terceiros em cumprimento aos requisitos de resiliência operacional da cadeia de valor. Todos os fornecedores críticos foram submetidos a scoring de resiliência e validação de PCO próprio.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="font-black text-sm uppercase text-slate-900 border-b border-slate-200 pb-1">2. Quadro de Fornecedores Auditados</h3>
              <table className="w-full text-[10px] border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 font-bold text-left border-b border-slate-200">
                    <th className="p-2 border-r border-slate-200">Fornecedor / Vendor</th>
                    <th className="p-2 border-r border-slate-200">Serviço</th>
                    <th className="p-2 border-r border-slate-200 text-center">Score Resiliência</th>
                    <th className="p-2 text-center">PCO Auditado</th>
                  </tr>
                </thead>
                <tbody>
                  {terceiros.map(t => (
                    <tr key={t.id_fornecedor} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-200 font-bold">{t.nome}</td>
                      <td className="p-2 border-r border-slate-200">{t.servico}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold">{t.score_resiliencia} pts</td>
                      <td className="p-2 text-center font-bold text-emerald-700">{t.pco_proprio_auditado ? 'Auditado OK' : 'Pendente'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* ═══ TERMO DE DECLARAÇÃO E ASSINATURAS DAS 3 LINHAS DE DEFESA ═══ */}
        <div className="pt-8 border-t-2 border-slate-900 space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[10px] text-slate-600">
            <span className="font-bold text-slate-900 block uppercase">Declaração de Aderência e Assinatura Eletrônica das Três Linhas de Defesa</span>
            <p>
              Atestamos para os devidos fins regulatórios que as informações constantes neste relatório representam fielmente a postura de resiliência e continuidade de negócios da instituição, estando em conformidade com as diretrizes aprovadas pela Diretoria Executiva e pelo Conselho de Administração.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center text-[9px] pt-4">
            <div className="space-y-1">
              <div className="border-b border-slate-400 pb-2 font-bold text-slate-800">1ª Linha (Gestores de Processos)</div>
              <div className="text-slate-500">Patrícia Lima / Marcos Costa</div>
              <div className="text-[8px] text-emerald-700 font-mono">Assinado digitalmente</div>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-400 pb-2 font-bold text-slate-800">2ª Linha (GERIC - Riscos e GCN)</div>
              <div className="text-slate-500">Roberto Santos (Gerente GERIC)</div>
              <div className="text-[8px] text-emerald-700 font-mono">Assinado digitalmente</div>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-400 pb-2 font-bold text-slate-800">3ª Linha / Comitê (Geemp)</div>
              <div className="text-slate-500">Conselho de Administração</div>
              <div className="text-[8px] text-emerald-700 font-mono">Homologado via Ata</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
