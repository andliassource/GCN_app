import React, { useState } from 'react';
import { Plus, Trash2, ShieldAlert, Award, ArrowRight, DollarSign, Calculator, Eye, HelpCircle } from 'lucide-react';

export default function AnaliseImpacto({ db }) {
  const [processos, setProcessos] = useState(db.processosCriticos.list());
  const [ains, setAins] = useState(db.analiseImpactoNegocio.list());
  const [contratos] = useState(db.contratos.list());

  // Estados locais
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [showAinForm, setShowAinForm] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form Fields - Processo Crítico
  const [procFormData, setProcFormData] = useState({
    nome: '',
    descricao: '',
    id_contrato: '',
    criticidade: 'Baixa'
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
    if (!procFormData.nome || !procFormData.criticidade) {
      setNotification({ type: 'error', text: 'Preencha todos os campos obrigatórios (*).' });
      return;
    }

    const novoProc = db.processosCriticos.create(procFormData);
    setProcessos(db.processosCriticos.list());
    setShowProcessForm(false);
    setProcFormData({ nome: '', descricao: '', id_contrato: '', criticidade: 'Baixa' });
    setNotification({ type: 'success', text: `Processo Crítico ${novoProc.id_processo} mapeado com sucesso! Agora configure sua AIN.` });
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

    setAins(db.analiseImpactoNegocio.list());
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
      setProcessos(db.processosCriticos.list());
      setAins(db.analiseImpactoNegocio.list());
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
            <button 
              onClick={() => { setShowProcessForm(true); setShowAinForm(false); setNotification(null); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Cadastrar Processo Crítico
            </button>
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
              <label className="text-xs font-bold text-slate-500 uppercase">Contrato Vinculado (SLA/Faturamento)</label>
              <select 
                value={procFormData.id_contrato} 
                onChange={(e) => setProcFormData({...procFormData, id_contrato: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
              >
                <option value="">Nenhum Contrato Associado</option>
                {contratos.map(c => (
                  <option key={c.id_contrato} value={c.id_contrato}>
                    {c.id_contrato} - {c.nome} (R$ {c.valor_faturamento.toLocaleString('pt-BR')})
                  </option>
                ))}
              </select>
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
                      {proc.id_contrato && (
                        <div className="text-[9px] text-indigo-500 font-semibold mt-1 uppercase">
                          SLA Vinculado: {proc.id_contrato}
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
                          onClick={() => handleOpenAinForm(proc)}
                          className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-1.5 rounded text-[10px] flex items-center gap-1 transition-all"
                        >
                          Configurar BIA
                        </button>
                        <button
                          onClick={() => handleDeleteProcess(proc.id_processo)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Deletar processo crítico"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

    </div>
  );
}
