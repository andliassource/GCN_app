import React, { useState } from 'react';
import { Activity, Plus, ShieldAlert, Award, Calendar, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

export default function TestesExercicios({ db }) {
  const [testes, setTestes] = useState(db.testesAvaliacoes.list());
  const [processos] = useState(db.processosCriticos.list());
  const [planosPco] = useState(db.planosContinuidade.list());
  const [planosPrd] = useState(db.planosRecuperacaoDesastres.list());

  // Estados locais
  const [showForm, setShowForm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [notification, setNotification] = useState(null);
  
  // Estado para sugestão de ajuste automático nos planos (Requisito 5)
  const [sugestaoAjuste, setSugestaoAjuste] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    data_teste: '',
    resultado: 'Sucesso',
    areas_melhoria: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.data_teste || !formData.resultado || !selectedPlanId) {
      setNotification({ type: 'error', text: 'Preencha todos os campos obrigatórios (*).' });
      return;
    }

    const pco = planosPco.find(p => p.id_processo === selectedPlanId);
    const prd = planosPrd.find(p => p.id_processo === selectedPlanId);

    const novoTeste = db.testesAvaliacoes.create({
      id_pco: pco?.id_pco || null,
      id_prd: prd?.id_prd || null,
      data_teste: formData.data_teste,
      resultado: formData.resultado,
      areas_melhoria: formData.areas_melhoria
    });

    setTestes(db.testesAvaliacoes.list());
    setShowForm(false);
    setNotification({ type: 'success', text: `Teste registrado com sucesso!` });

    // AJUSTE AUTOMÁTICO NOS PLANOS (Requisito 5)
    // Se o resultado do teste foi Falha ou Sucesso Parcial, sugerimos um ajuste de parâmetros
    if (formData.resultado === 'Falha' || formData.resultado === 'Sucesso Parcial') {
      const processo = processos.find(p => p.id_processo === selectedPlanId);
      const ain = db.analiseImpactoNegocio.getForProcesso(selectedPlanId);
      
      if (processo && ain) {
        // Propõe aumentar o RTO ou a frequência dos backups
        setSugestaoAjuste({
          processoId: selectedPlanId,
          processoNome: processo.nome,
          ainOriginal: ain,
          rtoSugerido: ain.RTO + 15, // sugere acrescer tempo para se tornar realista
          rpoSugerido: Math.max(5, Math.round(ain.RPO / 2)), // sugere diminuir RPO (fazer backups mais frequentes)
          motivo: formData.areas_melhoria
        });
      }
    } else {
      setSugestaoAjuste(null);
    }

    setFormData({ data_teste: '', resultado: 'Sucesso', areas_melhoria: '' });
  };

  // Aplicar ajuste sugerido automaticamente no banco
  const aplicarAjusteSugerido = () => {
    if (!sugestaoAjuste) return;

    db.analiseImpactoNegocio.save({
      ...sugestaoAjuste.ainOriginal,
      RTO: sugestaoAjuste.rtoSugerido,
      RPO: sugestaoAjuste.rpoSugerido
    });

    // Atualiza também os procedimentos de backup no PRD correspondente
    const prd = db.planosRecuperacaoDesastres.getForProcesso(sugestaoAjuste.processoId);
    if (prd) {
      db.planosRecuperacaoDesastres.save({
        ...prd,
        frequencia_backup: `A cada ${sugestaoAjuste.rpoSugerido} minutos`
      });
    }

    setNotification({
      type: 'success',
      text: `Ajuste automático aplicado! Os parâmetros de RTO/RPO do processo "${sugestaoAjuste.processoNome}" foram otimizados no banco.`
    });
    setSugestaoAjuste(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Informações de Testes */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">Simulações & Exercícios de Emergência</h3>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-2xl leading-relaxed">
            Mantenha a resiliência operacional registrando testes de mesa e simulados práticos de failover de TI. Testes malsucedidos geram recomendações automáticas de ajuste de RTO/RPO e frequência de backups para adequação à ISO 22301.
          </p>
        </div>
        <button 
          onClick={() => { setShowForm(true); setNotification(null); setSugestaoAjuste(null); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Registrar Novo Simulado
        </button>
      </div>

      {/* Feedbacks de Operações */}
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-500" /> {notification.text}
        </div>
      )}

      {/* Modal / Card de Sugestão de Ajuste Automático */}
      {sugestaoAjuste && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/35 p-6 rounded-xl space-y-4 animate-bounce-short">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">
                Ajuste Recomendado Detectado para a Resiliência
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-450 mt-1 leading-relaxed">
                Como o teste do processo <strong>"{sugestaoAjuste.processoNome}"</strong> não obteve sucesso ideal, o motor NRGCN sugere otimizar os limites da AIN para aumentar a resiliência e adequar a frequência de backups.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center bg-white dark:bg-slate-900/60 p-4 rounded-lg border border-amber-500/10">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">RTO Atual</p>
              <p className="font-bold text-xs text-slate-600 dark:text-slate-400">{sugestaoAjuste.ainOriginal.RTO} minutos</p>
            </div>
            <div className="text-emerald-500">
              <p className="text-[9px] text-emerald-500 font-bold uppercase">RTO Recomendado</p>
              <p className="font-black text-xs">{sugestaoAjuste.rtoSugerido} minutos</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">RPO Atual</p>
              <p className="font-bold text-xs text-slate-600 dark:text-slate-400">{sugestaoAjuste.ainOriginal.RPO} minutos</p>
            </div>
            <div className="text-emerald-500">
              <p className="text-[9px] text-emerald-500 font-bold uppercase">RPO / Freq. Backup</p>
              <p className="font-black text-xs">{sugestaoAjuste.rpoSugerido} minutos</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSugestaoAjuste(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 text-xs font-semibold rounded-lg"
            >
              Ignorar Recomendação
            </button>
            <button
              onClick={aplicarAjusteSugerido}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Aplicar Ajustes Automáticos
            </button>
          </div>
        </div>
      )}

      {/* Form de Cadastro de Teste */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Registrar Teste de Contingência
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Processo Crítico Avaliado *</label>
              <select 
                value={selectedPlanId} 
                onChange={(e) => setSelectedPlanId(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
                required
              >
                <option value="">Selecione o Processo</option>
                {processos.map(p => (
                  <option key={p.id_processo} value={p.id_processo}>
                    {p.id_processo} - {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Data da Execução *</label>
              <input 
                type="date" 
                value={formData.data_teste} 
                onChange={(e) => setFormData({...formData, data_teste: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Resultado Obtido *</label>
              <select 
                value={formData.resultado} 
                onChange={(e) => setFormData({...formData, resultado: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
              >
                <option value="Sucesso">Sucesso (Dentro dos SLAs do BIA)</option>
                <option value="Sucesso Parcial">Sucesso Parcial (Atraso nos limites ou falhas de comunicação)</option>
                <option value="Falha">Falha (Procedimento falhou ou excedeu MTDCN)</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-bold text-slate-500 uppercase">Observações e Áreas de Melhoria *</label>
              <textarea 
                rows="3"
                value={formData.areas_melhoria} 
                onChange={(e) => setFormData({...formData, areas_melhoria: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Insira as observações sobre a execução dos backups, tempo de failover observado e desvios identificados..."
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Registrar Simulado</button>
          </div>
        </form>
      )}

      {/* Histórico de Testes */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white">Histórico de Testes e Simulações</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {testes.map(t => {
            const procNome = t.pco?.processo?.nome || t.prd?.processo?.nome || 'Processo Geral';
            const procCrit = t.pco?.processo?.criticidade || t.prd?.processo?.criticidade || 'N/A';
            
            const getResultadoColor = (res) => {
              if (res === 'Sucesso') return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
              if (res === 'Sucesso Parcial') return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20';
              return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20';
            };

            return (
              <div key={t.id_teste} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all flex flex-col md:flex-row justify-between items-start gap-4">
                
                {/* Esquerda: Identificador e Data */}
                <div className="space-y-1 md:w-1/4">
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{t.id_teste}</span>
                  <div className="text-xs text-slate-700 dark:text-slate-350 font-bold flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" /> {t.data_teste}
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase mt-2 ${getResultadoColor(t.resultado)}`}>
                    {t.resultado}
                  </span>
                </div>

                {/* Centro: Processo e Áreas de Melhoria */}
                <div className="flex-1 space-y-2">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Processo Avaliado</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{procNome}</p>
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                      Criticidade {procCrit}
                    </span>
                  </div>
                  
                  <div className="pt-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Relatório de Melhorias / Observações</span>
                    <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed mt-1">{t.areas_melhoria}</p>
                  </div>
                </div>

              </div>
            );
          })}

          {testes.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              Nenhum simulado de emergência registrado até o momento.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
