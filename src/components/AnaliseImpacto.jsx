import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShieldAlert, Award, ArrowRight, DollarSign, Calculator, Eye, HelpCircle, X, Download, CheckCircle2 } from 'lucide-react';
import { pdfService } from '../services/pdfService';
import { useAuth } from '../contexts/AuthContext';

export default function AnaliseImpacto({ db }) {
  const { usuario, isAdmin, filterByGerencia, canCreate, canEdit } = useAuth();
  const [processos, setProcessos] = useState(filterByGerencia(db.processosCriticos.list()));
  const [ains, setAins] = useState(filterByGerencia(db.analiseImpactoNegocio.list(), 'processo.id_gerencia'));
  const [contratos] = useState(db.contratos.list());
  const [gerencias] = useState(db.gerencias?.list ? db.gerencias.list() : (JSON.parse(localStorage.getItem('gcn_database') || '{}').gerencias || []));
  const [ativos] = useState(db.ativosSistemas.list());

  const recarregarListas = () => {
    setProcessos(filterByGerencia(db.processosCriticos.list()));
    setAins(filterByGerencia(db.analiseImpactoNegocio.list(), 'processo.id_gerencia'));
  };


  // Estados locais
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [showAinForm, setShowAinForm] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState(null);
  const [selectedProcessoDrawer, setSelectedProcessoDrawer] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form Fields - Processo Crítico
  const [procFormData, setProcFormData] = useState({
    nome: '',
    descricao: '',
    id_contrato: '',
    id_gerencia: '',
    tipo_plano: '',
    sla_interno: '',
    criticidade: 'Baixa',
    requer_drp: false,
    ativo_cmdb_id: '',
    estrategia_drp: 'Backup & Restore',
    sla_contrato_cliente: '',
    sla_tic: '',
    status_aprovacao_tic: 'Pendente'
  });

  // Form Fields - AIN
  const [ainFormData, setAinFormData] = useState({
    probabilidade: 'Rara',
    impacto_financeiro: 'Insignificante',
    RTO: 60, // padrão em minutos
    RPO: 30, // padrão em minutos
    MTDCN: 120 // padrão em minutos
  });

  // Salvar novo processo crítico
  const handleProcSubmit = (e) => {
    e.preventDefault();
    if (!procFormData.nome || !procFormData.criticidade || !procFormData.id_gerencia) {
      setNotification({ type: 'error', text: 'Preencha todos os campos obrigatórios (*). Gerência responsável é obrigatória.' });
      return;
    }

    const novoProc = db.processosCriticos.create({
      ...procFormData,
      sla_contrato_cliente: procFormData.sla_contrato_cliente ? parseInt(procFormData.sla_contrato_cliente) : 0,
      sla_tic: procFormData.sla_tic ? parseInt(procFormData.sla_tic) : 0
    });
    recarregarListas();
    setShowProcessForm(false);
    setProcFormData({ 
      nome: '', 
      descricao: '', 
      id_contrato: '', 
      id_gerencia: isAdmin() ? '' : (usuario?.id_gerencia || ''), 
      tipo_plano: '', 
      sla_interno: '', 
      criticidade: 'Baixa',
      requer_drp: false,
      ativo_cmdb_id: '',
      estrategia_drp: 'Backup & Restore',
      sla_contrato_cliente: '',
      sla_tic: '',
      status_aprovacao_tic: 'Pendente'
    });
    setNotification({ type: 'success', text: `Processo Crítico ${novoProc.id_processo} mapeado com sucesso! Gerência: ${procFormData.id_gerencia}. Agora configure sua AIN.` });
  };

  // Salvar/Editar AIN
  const handleAinSubmit = (e) => {
    e.preventDefault();
    if (!selectedProcesso) return;

    db.analiseImpactoNegocio.save({
      id_processo: selectedProcesso.id_processo,
      ...ainFormData,
      RTO: parseInt(ainFormData.RTO),
      RPO: parseInt(ainFormData.RPO),
      MTDCN: parseInt(ainFormData.MTDCN)
    });

    recarregarListas();
    setShowAinForm(false);
    setSelectedProcesso(null);
    setNotification({ type: 'success', text: `Análise de Impacto (AIN) configurada para o processo ${selectedProcesso.id_processo}.` });
  };

  const handleOpenAinForm = (proc) => {
    setSelectedProcesso(proc);
    const ainExistente = ains.find(a => a.id_processo === proc.id_processo);
    if (ainExistente) {
      setAinFormData({
        probabilidade: ainExistente.probabilidade,
        impacto_financeiro: ainExistente.impacto_financeiro,
        RTO: ainExistente.RTO,
        RPO: ainExistente.RPO,
        MTDCN: ainExistente.MTDCN
      });
    } else {
      setAinFormData({
        probabilidade: 'Provável',
        impacto_financeiro: 'Moderado',
        RTO: 60,
        RPO: 30,
        MTDCN: 120
      });
    }
    setShowAinForm(true);
  };

  const handleDeleteProcess = (id) => {
    if (window.confirm(`Deseja deletar o processo crítico ${id}? Todos os planos, AINs e avaliações associadas serão excluídos permanentemente.`)) {
      db.processosCriticos.delete(id);
      recarregarListas();
      setNotification({ type: 'info', text: 'Processo e dependências deletados.' });
    }
  };

  // CÁLCULO DE PERDAS FINANCEIRAS (Módulo 3)
  // Perda por hora/dia baseada no faturamento mensal do contrato e penalidades estimadas
  const calcularPerdas = (proc) => {
    const contrato = contratos.find(c => c.id_contrato === proc.id_contrato);
    if (!contrato) return { hora: 0, dia: 0, multaEstimada: 0, hasContrato: false };

    const faturamentoMensal = contrato.valor_faturamento || 0;
    const faturamentoDiario = faturamentoMensal / 30;
    const faturamentoHorario = faturamentoDiario / 24;

    // Simulação de multa baseada nas cláusulas de penalidade
    // Se houver palavra 'multa' ou similar, adicionamos uma estimativa contratual fictícia de 5% do faturamento mensal
    const temMultaSLA = contrato.multas && contrato.multas.toLowerCase().includes('multa');
    const multaEstimada = temMultaSLA ? (faturamentoMensal * 0.05) : 0;

    // Perda horária = faturamento horário parado + (multa proporcional diária / 24)
    const perdaHora = faturamentoHorario + (multaEstimada / 30 / 24);
    const perdaDia = faturamentoDiario + multaEstimada;

    return {
      hora: perdaHora,
      dia: perdaDia,
      multaEstimada: multaEstimada,
      hasContrato: true
    };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Cards Superiores / Info AIN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Metodologia</span>
            <h3 className="font-bold text-slate-850 dark:text-white mt-1">Análise de Impacto (AIN)</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-2 leading-relaxed">
              O BIA (Business Impact Analysis) identifica os limites temporais de indisponibilidade aceitáveis para cada processo crítico:
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <p><strong>RTO:</strong> Tempo limite de recuperação dos sistemas.</p>
              <p><strong>RPO:</strong> Ponto limite de perda de dados (backups).</p>
              <p><strong>MTDCN:</strong> Limite máximo tolerável de interrupção total.</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between md:col-span-2">
          <div>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Mapeamento Integrado</span>
            <h3 className="font-bold text-slate-850 dark:text-white mt-1">Integração Financeira de SLA</h3>
            <p className="text-xs text-slate-450 dark:text-slate-550 mt-2 leading-relaxed">
              O cálculo de perdas financeiras por hora/dia é executado automaticamente cruzando os processos críticos com o faturamento mensal dos respectivos contratos ativos vinculados e estimando multas contratuais.
            </p>
          </div>
          <div className="flex gap-4 mt-4">
            {canCreate() && (
              <button 
                onClick={() => { 
                  setShowProcessForm(true); 
                  setShowAinForm(false); 
                  setNotification(null); 
                  if (!isAdmin()) {
                    setProcFormData(prev => ({ ...prev, id_gerencia: usuario?.id_gerencia || '' }));
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Cadastrar Processo Crítico
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedbacks */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-50/50 border-emerald-500/20 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' :
          notification.type === 'error' ? 'bg-rose-50/50 border-rose-500/20 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400' :
          'bg-indigo-50/50 border-indigo-500/20 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400'
        }`}>
          <ShieldAlert className="w-5 h-5 text-indigo-500" />
          <span className="text-xs font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Form de Cadastro de Processo */}
      {showProcessForm && (
        <form onSubmit={handleProcSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white">Cadastrar Processo Crítico de Negócio</h3>
            <button type="button" onClick={() => setShowProcessForm(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nome do Processo *</label>
              <input 
                type="text" 
                value={procFormData.nome} 
                onChange={(e) => setProcFormData({...procFormData, nome: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Ex: Conciliação de Recebíveis"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Criticidade Inicial *</label>
              <select 
                value={procFormData.criticidade} 
                onChange={(e) => setProcFormData({...procFormData, criticidade: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Gerência Responsável *</label>
              <select 
                value={procFormData.id_gerencia} 
                onChange={(e) => setProcFormData({...procFormData, id_gerencia: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
                required
                disabled={!isAdmin()}
              >
                <option value="">Selecione a Gerência Responsável...</option>
                {gerencias.map(g => (
                  <option key={g.id_gerencia} value={g.id_gerencia}>
                    {g.sigla} - {g.nome} ({g.tipo})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Plano</label>
              <select 
                value={procFormData.tipo_plano} 
                onChange={(e) => setProcFormData({...procFormData, tipo_plano: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
              >
                <option value="">PCO de Negócios (padrão)</option>
                <option value="PCO-APOIO">PCO de Apoio (Diafi - SLA Interno)</option>
                <option value="PCO-TIC">PCO de TI/PRD (ISO 27031)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Contrato Vinculado (SLA/Faturamento)</label>
              <select 
                value={procFormData.id_contrato} 
                onChange={(e) => setProcFormData({...procFormData, id_contrato: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
              >
                <option value="">Nenhum Contrato (Processo de Apoio Interno)</option>
                {contratos.map(c => (
                  <option key={c.id_contrato} value={c.id_contrato}>
                    {c.id_contrato} - {c.nome} (R$ {c.valor_faturamento.toLocaleString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>
            {(procFormData.tipo_plano === 'PCO-APOIO') && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">SLA Interno (Apoio/Diafi)</label>
                <input 
                  type="text" 
                  value={procFormData.sla_interno} 
                  onChange={(e) => setProcFormData({...procFormData, sla_interno: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                  placeholder="Ex: SLA interno de 4h para aprovação de pagamentos emergenciais"
                />
              </div>
            )}

            {/* Parâmetros de Recuperação de Desastres (DRP) */}
            <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase">Recuperação de Desastres (DRP / PRD de TI)</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Defina se este processo requer plano de recuperação de desastres e mapeamento de infraestrutura.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={procFormData.requer_drp} 
                    onChange={(e) => setProcFormData({ ...procFormData, requer_drp: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-250 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2 text-xs font-semibold text-slate-600 dark:text-slate-450">{procFormData.requer_drp ? 'Requer DRP' : 'Apenas PCO'}</span>
                </label>
              </div>

              {procFormData.requer_drp && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-850/60 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      Ativo CMDB Vinculado *
                    </label>
                    <select
                      value={procFormData.ativo_cmdb_id}
                      onChange={(e) => setProcFormData({ ...procFormData, ativo_cmdb_id: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
                      required
                    >
                      <option value="">Selecione o Ativo...</option>
                      {ativos.map(a => (
                        <option key={a.id_ativo} value={a.id_ativo}>
                          {a.nome} ({a.tipo} - {a.criticidade_contrato || 'Sem Criticidade'})
                        </option>
                      ))}
                    </select>
                    {procFormData.ativo_cmdb_id && (
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[9px] text-slate-400">Classificação:</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                          ativos.find(a => a.id_ativo === procFormData.ativo_cmdb_id)?.criticidade_contrato === 'C0' ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30' :
                          ativos.find(a => a.id_ativo === procFormData.ativo_cmdb_id)?.criticidade_contrato === 'C1' ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}>
                          {ativos.find(a => a.id_ativo === procFormData.ativo_cmdb_id)?.criticidade_contrato || 'Sem Classificação'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Estratégia de DR *</label>
                    <select
                      value={procFormData.estrategia_drp}
                      onChange={(e) => setProcFormData({ ...procFormData, estrategia_drp: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
                    >
                      <option value="Backup & Restore">Backup & Restore</option>
                      <option value="Pilot Light">Pilot Light</option>
                      <option value="Warm Standby">Warm Standby</option>
                      <option value="Hot Standby / Ativo-Ativo">Hot Standby / Ativo-Ativo</option>
                      <option value="Site Alternativo">Site Alternativo</option>
                      <option value="DR em Nuvem">DR em Nuvem</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">SLA Cliente (minutos) *</label>
                    <input
                      type="number"
                      value={procFormData.sla_contrato_cliente}
                      onChange={(e) => setProcFormData({ ...procFormData, sla_contrato_cliente: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                      placeholder="Ex: 60"
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">SLA TIC (minutos) *</label>
                    <input
                      type="number"
                      value={procFormData.sla_tic}
                      onChange={(e) => setProcFormData({ ...procFormData, sla_tic: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                      placeholder="Ex: 30"
                      min="1"
                      required
                    />
                  </div>

                  {/* Alerta de Incompatibilidade de SLAs */}
                  {procFormData.sla_tic && procFormData.sla_contrato_cliente && Number(procFormData.sla_tic) > Number(procFormData.sla_contrato_cliente) && (
                    <div className="md:col-span-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-lg flex items-start gap-2.5 animate-pulse">
                      <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase">Incompatibilidade de SLA (Gargalo de TIC)</span>
                        <p className="text-[9px] text-rose-500 leading-snug">
                          Atenção: A infraestrutura de TIC leva mais tempo para recuperar ({procFormData.sla_tic} min) do que o acordado em contrato com o cliente final ({procFormData.sla_contrato_cliente} min). Risco regulatório e financeiro!
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {procFormData.sla_tic && procFormData.sla_contrato_cliente && Number(procFormData.sla_tic) <= Number(procFormData.sla_contrato_cliente) && (
                    <div className="md:col-span-4 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">SLA Compatível</span>
                        <p className="text-[9px] text-emerald-500 leading-snug">
                          Alinhamento perfeito: A TIC consegue recuperar o ativo ({procFormData.sla_tic} min) antes do limite acordado com o cliente ({procFormData.sla_contrato_cliente} min).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Descrição das Atividades do Processo</label>
              <textarea 
                rows="3"
                value={procFormData.descricao} 
                onChange={(e) => setProcFormData({...procFormData, descricao: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Descreva o fluxo operacional do processo..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setShowProcessForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Salvar Processo</button>
          </div>
        </form>
      )}

      {/* Form de Configuração de AIN */}
      {showAinForm && selectedProcesso && (
        <form onSubmit={handleAinSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-500" /> 
                Análise de Impacto (AIN) do Processo: {selectedProcesso.nome}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Código Identificador: {selectedProcesso.id_processo}</p>
            </div>
            <button type="button" onClick={() => { setShowAinForm(false); setSelectedProcesso(null); }} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Probabilidade de Incidente *</label>
              <select 
                value={ainFormData.probabilidade} 
                onChange={(e) => setAinFormData({...ainFormData, probabilidade: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
              >
                <option value="Rara">Rara</option>
                <option value="Pouco Provável">Pouco Provável</option>
                <option value="Provável">Provável</option>
                <option value="Muito Provável">Muito Provável</option>
                <option value="Quase Certa">Quase Certa</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Impacto Financeiro / Operacional *</label>
              <select 
                value={ainFormData.impacto_financeiro} 
                onChange={(e) => setAinFormData({...ainFormData, impacto_financeiro: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
              >
                <option value="Insignificante">Insignificante</option>
                <option value="Menor">Menor</option>
                <option value="Moderado">Moderado</option>
                <option value="Maior">Maior</option>
                <option value="Catastrófico">Catastrófico</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                RTO (Limiar de Recuperação) *
                <span className="text-[10px] text-slate-400 font-normal">(minutos)</span>
              </label>
              <input 
                type="number" 
                value={ainFormData.RTO} 
                onChange={(e) => setAinFormData({...ainFormData, RTO: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                min="1"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                RPO (Perda Máxima de Dados) *
                <span className="text-[10px] text-slate-400 font-normal">(minutos)</span>
              </label>
              <input 
                type="number" 
                value={ainFormData.RPO} 
                onChange={(e) => setAinFormData({...ainFormData, RPO: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                min="1"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                MTDCN (Interrupção Máxima) *
                <span className="text-[10px] text-slate-400 font-normal">(minutos)</span>
              </label>
              <input 
                type="number" 
                value={ainFormData.MTDCN} 
                onChange={(e) => setAinFormData({...ainFormData, MTDCN: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => { setShowAinForm(false); setSelectedProcesso(null); }} 
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors"
            >
              Salvar Parâmetros AIN
            </button>
          </div>
        </form>
      )}

      {/* Lista de Processos e Cálculos de Perdas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white">Inventário de Processos Críticos e BIA (AIN)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-3.5">Código / Processo</th>
                <th className="px-6 py-3.5">Criticidade</th>
                <th className="px-6 py-3.5">Métricas de Tempo (BIA)</th>
                <th className="px-6 py-3.5 text-center">Perda Financeira por Hora</th>
                <th className="px-6 py-3.5 text-center">Perda Financeira por Dia</th>
                <th className="px-6 py-3.5 text-center">Controle / Configuração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {processos.map((proc) => {
                const ain = ains.find(a => a.id_processo === proc.id_processo);
                const perdas = calcularPerdas(proc);

                const getCriticidadeBadge = (crit) => {
                  if (crit === 'Crítica') return 'bg-rose-50 dark:bg-rose-950 text-rose-500 border border-rose-100 dark:border-rose-900/30';
                  if (crit === 'Alta') return 'bg-orange-50 dark:bg-orange-950 text-orange-500 border border-orange-100 dark:border-orange-900/30';
                  if (crit === 'Média') return 'bg-amber-50 dark:bg-amber-950 text-amber-500 border border-amber-100 dark:border-amber-900/30';
                  return 'bg-slate-50 dark:bg-slate-950 text-slate-550 border border-slate-100 dark:border-slate-900/30';
                };

                return (
                  <tr key={proc.id_processo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-indigo-650 dark:text-indigo-400">{proc.id_processo}</div>
                      <div className="text-slate-800 dark:text-slate-200 font-bold truncate">{proc.nome}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5" title={proc.descricao}>
                        {proc.descricao || 'Sem descrição mapeada'}
                      </div>
                      {proc.id_contrato ? (
                        <div className="text-[9px] text-indigo-500 font-semibold mt-1 uppercase">
                          SLA Contrato: {proc.id_contrato}
                        </div>
                      ) : proc.sla_interno ? (
                        <div className="text-[9px] text-amber-500 font-semibold mt-1">
                          ⚡ SLA Interno (Apoio): {proc.sla_interno.substring(0, 60)}...
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-400 mt-1">Processo interno sem contrato externo</div>
                      )}
                      {proc.id_gerencia && (
                        <div className="text-[9px] text-emerald-500 font-semibold mt-0.5 uppercase">
                          Gerência: {proc.id_gerencia}
                        </div>
                      )}
                      {proc.requer_drp ? (
                        <div className="mt-1.5 p-1.5 rounded bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-[9px] space-y-0.5 max-w-xs">
                          <div className="font-bold text-slate-500 dark:text-slate-400 flex justify-between">
                            <span>🛡️ DRP Ativo CMDB:</span>
                            <span className="text-slate-700 dark:text-slate-350">{proc.ativo_cmdb_id || 'Não Definido'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Estratégia:</span>
                            <span className="font-semibold text-slate-750 dark:text-slate-300">{proc.estrategia_drp}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">SLA Contrato:</span>
                            <span className="font-semibold text-slate-750 dark:text-slate-300">{proc.sla_contrato_cliente}m</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">SLA TIC:</span>
                            <span className={`font-bold ${proc.sla_tic > proc.sla_contrato_cliente ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                              {proc.sla_tic}m {proc.sla_tic > proc.sla_contrato_cliente ? '⚠️ Gargalo' : '✓ OK'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-450 dark:text-slate-550 mt-1.5 italic">
                          📋 Apenas PCO (Sem DR de TIC)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getCriticidadeBadge(proc.criticidade)}`}>
                        {proc.criticidade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ain ? (
                        <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded border border-slate-200 dark:border-slate-850 max-w-[200px]">
                          <div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">RTO</p>
                            <p className="font-black text-[11px] text-slate-700 dark:text-slate-350">{ain.RTO}m</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">RPO</p>
                            <p className="font-black text-[11px] text-slate-700 dark:text-slate-350">{ain.RPO}m</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">MTD</p>
                            <p className="font-black text-[11px] text-rose-500">{ain.MTDCN}m</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-[10px] italic">BIA Não Configurado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-750 dark:text-slate-300">
                      {perdas.hasContrato ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          R$ {perdas.hora.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">R$ 0,00 (Sem Contrato)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-750 dark:text-slate-300">
                      {perdas.hasContrato ? (
                        <span>
                          R$ {perdas.dia.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">R$ 0,00 (Sem Contrato)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedProcessoDrawer(proc)}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold px-2.5 py-1.5 rounded text-[10px] flex items-center gap-1 transition-all"
                          title="Visão 360° do Processo"
                        >
                          <Eye className="w-3.5 h-3.5" /> 360°
                        </button>
                        {canEdit(proc.id_gerencia) ? (
                          <button
                            onClick={() => handleOpenAinForm(proc)}
                            className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-1.5 rounded text-[10px] flex items-center gap-1 transition-all"
                          >
                            Configurar BIA
                          </button>
                        ) : (
                          <button
                            disabled
                            className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold px-2.5 py-1.5 rounded text-[10px] flex items-center gap-1 opacity-50 cursor-not-allowed"
                            title="Apenas gestores desta gerência podem configurar"
                          >
                            Configurar BIA
                          </button>
                        )}
                        {canEdit(proc.id_gerencia) && (
                          <button
                            onClick={() => { handleDeleteProcess(proc.id_processo); recarregarListas(); }}
                            className="text-slate-450 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            title="Deletar processo crítico"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {processos.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
                    Nenhum processo crítico mapeado. Clique em "Cadastrar Processo Crítico" para iniciar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer de Contexto Lateral - Visão 360° */}
      {selectedProcessoDrawer && (() => {
        const proc = selectedProcessoDrawer;
        const ain = ains.find(a => a.id_processo === proc.id_processo);
        const perdas = calcularPerdas(proc);
        
        // Planos
        const pco = db.planosContinuidade.list().find(p => p.id_processo === proc.id_processo);
        const prd = db.planosRecuperacaoDesastres.list().find(p => p.id_processo === proc.id_processo);
        
        // Riscos
        const riscos = db.riscos.list().filter(r => r.id_processo === proc.id_processo);
        
        // Incidentes
        const incidentes = db.incidentes.list().filter(i => i.id_processo === proc.id_processo);
        
        // Intervenientes
        const intervenientes = db.intervenientes.listForProcesso(proc.id_processo);
        
        return (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <div 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedProcessoDrawer(null)}
            />
            
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 animate-slide-in">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
                <div>
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Visão 360° do Processo</span>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mt-0.5">{proc.nome}</h3>
                  <span className="text-[9px] text-slate-400 font-mono block mt-1">{proc.id_processo}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => pdfService.exportar(
                      `Relatório de Visão 360 - ${proc.id_processo}`,
                      pdfService.htmlProcessoCompleto(proc, ain, pco, prd, proc.ativos, riscos, incidentes, intervenientes, perdas),
                      { confidencialidade: 'RESTRITO', versao: '1.0' }
                    )}
                    className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
                    title="Exportar PDF Completo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectedProcessoDrawer(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs divide-y divide-slate-150 dark:divide-slate-800">
                {/* 1. Detalhes Gerais */}
                <div className="space-y-3 pb-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>📋 Informações do Processo</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Criticidade</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{proc.criticidade}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Gerência</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{proc.id_gerencia}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Contrato / SLA</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{proc.id_contrato || 'Processo de apoio interno'}</p>
                    </div>
                    {proc.descricao && (
                      <div className="col-span-2 border-t border-slate-150 dark:border-slate-800 pt-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Descrição Operacional</span>
                        <p className="text-[11px] text-slate-650 dark:text-slate-400 leading-relaxed mt-1">{proc.descricao}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Parâmetros BIA */}
                <div className="space-y-3 pt-6 pb-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>📊 Parâmetros AIN / BIA</span>
                  </h4>
                  {ain ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-150 dark:border-slate-850">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">RTO Meta</span>
                          <span className="font-black text-slate-800 dark:text-white text-sm">{ain.RTO}m</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-150 dark:border-slate-850">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">RPO Meta</span>
                          <span className="font-black text-slate-800 dark:text-white text-sm">{ain.RPO}m</span>
                        </div>
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                          <span className="text-[8px] text-rose-450 font-bold uppercase block">MTDCN</span>
                          <span className="font-black text-rose-600 dark:text-rose-400 text-sm">{ain.MTDCN}m</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-150 dark:border-slate-850 text-[11px] space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-450">Probabilidade do Risco:</span>
                          <span className="font-bold text-slate-855 dark:text-slate-300">{ain.probabilidade}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450">Impacto Geral:</span>
                          <span className="font-bold text-slate-855 dark:text-slate-300">{ain.impacto_financeiro}</span>
                        </div>
                        {perdas.hasContrato && (
                          <div className="border-t border-slate-150 dark:border-slate-850 pt-2 text-rose-600 dark:text-rose-400 font-semibold space-y-1">
                            <div className="flex justify-between">
                              <span>Perda por Hora Parado:</span>
                              <span>R$ {perdas.hora.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Perda por Dia Parado:</span>
                              <span>R$ {perdas.dia.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-150 dark:border-slate-850 text-center text-slate-450 italic">
                      AIN (BIA) não configurada para este processo.
                    </div>
                  )}
                </div>

                {/* 3. PCO e PRD */}
                <div className="space-y-4 pt-6 pb-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                    🛡️ Planos de Continuidade e TI
                  </h4>
                  
                  <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[11px] text-slate-800 dark:text-slate-300">PCO (Plano de Negócio)</span>
                      {pco ? (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${pco.status_aprovacao === 'Aprovado' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                          {pco.status_aprovacao}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-semibold">Não Cadastrado</span>
                      )}
                    </div>
                    {pco && (
                      <div className="text-[10px] text-slate-500 space-y-1 pt-1 border-t border-slate-150 dark:border-slate-850">
                        <p><strong>Versão:</strong> {pco.versao}</p>
                        <p className="truncate"><strong>Estratégia:</strong> {pco.estrategia_recuperacao}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-150 dark:border-slate-850 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[11px] text-slate-800 dark:text-slate-300">PRD (Recuperação de Desastres)</span>
                      {prd ? (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${prd.status_aprovacao === 'Aprovado' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                          {prd.status_aprovacao}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-semibold">Não Cadastrado</span>
                      )}
                    </div>
                    {prd && (
                      <div className="text-[10px] text-slate-500 space-y-1 pt-1 border-t border-slate-150 dark:border-slate-850">
                        <p><strong>Versão:</strong> {prd.versao}</p>
                        <p className="truncate"><strong>Escopo TI:</strong> {prd.escopo_ti}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Ativos */}
                <div className="space-y-3 pt-6 pb-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                    ⚙️ Ativos de TI Relacionados
                  </h4>
                  {proc.ativos && proc.ativos.length > 0 ? (
                    <div className="space-y-2">
                      {proc.ativos.map(a => (
                        <div key={a.id_ativo} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-lg">
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-350">{a.nome}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">{a.tipo} | ID: {a.id_ativo}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${a.criticidade === 'Critica' || a.criticidade === 'Alta' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 border border-rose-100' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200'}`}>
                            {a.criticidade}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl text-center text-slate-450 italic border border-slate-150 dark:border-slate-850">
                      Nenhum ativo tecnológico vinculado a este processo.
                    </div>
                  )}
                </div>

                {/* 5. Riscos Dinâmicos */}
                <div className="space-y-3 pt-6 pb-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                    ⚡ Matriz de Riscos Dinâmicos
                  </h4>
                  {riscos && riscos.length > 0 ? (
                    <div className="space-y-2">
                      {riscos.map(r => {
                        const score = (r.impacto_residual * r.probabilidade_residual) || (r.impacto * r.probabilidade) || 0;
                        const scoreColor = score >= 15 ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' : score >= 8 ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
                        return (
                          <div key={r.id_risco} className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-700 dark:text-slate-350">{r.titulo}</span>
                              <span className={`px-2 py-0.5 rounded font-black text-[9px] ${scoreColor}`}>Score: {score}</span>
                            </div>
                            <p className="text-[10px] text-slate-450 truncate">{r.descricao}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl text-center text-slate-450 italic border border-slate-150 dark:border-slate-850">
                      Nenhum risco dinâmico identificado para este processo.
                    </div>
                  )}
                </div>

                {/* 6. Incidentes e Tracking RTO */}
                <div className="space-y-3 pt-6 pb-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                    🚨 Histórico de Incidentes / RTO
                  </h4>
                  {incidentes && incidentes.length > 0 ? (
                    <div className="space-y-2">
                      {incidentes.map(i => {
                        const rtoColor = i.rto_ultrapassado ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
                        const statusBadge = i.status_incidente === 'fechado' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-850';
                        return (
                          <div key={i.id_incidente} className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-700 dark:text-slate-350">{i.id_incidente}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${statusBadge}`}>{i.status_incidente}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{i.descricao}</p>
                            <div className="flex justify-between text-[10px] pt-1.5 border-t border-slate-150 dark:border-slate-850">
                              <span className="text-slate-450">RTO Meta: {i.rto_meta_minutos}m</span>
                              <span className={`px-1.5 py-0.2 rounded font-extrabold ${rtoColor}`}>RTO Real: {i.rto_real_minutos}m</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl text-center text-slate-450 italic border border-slate-150 dark:border-slate-850">
                      Nenhum incidente registrado para este processo.
                    </div>
                  )}
                </div>

                {/* 7. Intervenientes */}
                <div className="space-y-3 pt-6 pb-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                    👥 Intervenientes e Contatos de Emergência
                  </h4>
                  {intervenientes && intervenientes.length > 0 ? (
                    <div className="space-y-2">
                      {intervenientes.map((int, iIdx) => (
                        <div key={iIdx} className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl flex items-start justify-between">
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-350">{int.nome}</p>
                            <span className="text-[9px] text-slate-400 block mt-0.5">{int.cargo} | {int.papel}</span>
                          </div>
                          <div className="text-[10px] text-right text-slate-500">
                            <p>{int.email}</p>
                            <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{int.telefone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl text-center text-slate-450 italic border border-slate-150 dark:border-slate-850">
                      Nenhum interveniente vinculado a este processo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
