import React, { useState } from 'react';
import { Activity, Plus, ShieldAlert, Award, Calendar, FileText, CheckCircle2, ChevronRight, User, Download, Paperclip, AlertTriangle } from 'lucide-react';
import { pdfService } from '../services/pdfService';

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
  const [tipoTeste, setTipoTeste] = useState('simulacao_mesa');
  const [formData, setFormData] = useState({
    data_teste: '',
    resultado: 'Sucesso',
    areas_melhoria: ''
  });

  const [cenariosForm, setCenariosForm] = useState({
    acesso: { resultado: 'passou', observacoes: '' },
    sistemas: { resultado: 'passou', observacoes: '' },
    fornecedores: { resultado: 'passou', observacoes: '' },
    pessoas: { resultado: 'passou', observacoes: '' }
  });

  const [participantesInput, setParticipantesInput] = useState('');
  const [evidenciaForm, setEvidenciaForm] = useState({ nome: '', descricao: '' });
  const [planoAcaoDesc, setPlanoAcaoDesc] = useState('');
  const [planoAcaoPrazo, setPlanoAcaoPrazo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.data_teste || !selectedPlanId) {
      setNotification({ type: 'error', text: 'Preencha todos os campos obrigatórios (*).' });
      return;
    }

    const cenarios_testados = [
      { cenario: 'acesso', resultado: cenariosForm.acesso.resultado, observacoes: cenariosForm.acesso.observacoes },
      { cenario: 'sistemas', resultado: cenariosForm.sistemas.resultado, observacoes: cenariosForm.sistemas.observacoes },
      { cenario: 'fornecedores', resultado: cenariosForm.fornecedores.resultado, observacoes: cenariosForm.fornecedores.observacoes },
      { cenario: 'pessoas', resultado: cenariosForm.pessoas.resultado, observacoes: cenariosForm.pessoas.observacoes }
    ];

    const falhouAlgum = cenarios_testados.some(c => c.resultado === 'falhou');

    if (falhouAlgum && (!planoAcaoDesc || !planoAcaoPrazo)) {
      setNotification({ type: 'error', text: 'Como um ou mais cenários falharam, a descrição e o prazo do Plano de Ação mitigatório são obrigatórios.' });
      return;
    }

    const pco = planosPco.find(p => p.id_processo === selectedPlanId);
    const prd = planosPrd.find(p => p.id_processo === selectedPlanId);

    let gerou_plano_acao = false;
    let id_plano_acao = null;

    if (falhouAlgum && planoAcaoDesc) {
      const pa = db.planosAcao.create({
        descricao: `Mitigação de falha no Teste do Processo ${selectedPlanId}: ${planoAcaoDesc}`,
        prazo: planoAcaoPrazo,
        responsavel: 'Geric / Gestor do Processo',
        status: 'Pendente',
        id_processo: selectedPlanId
      });
      gerou_plano_acao = true;
      id_plano_acao = pa.id_plano_acao;
    }

    const resultadoGeral = falhouAlgum ? 'Falha' : formData.resultado;

    const novoTeste = db.testesAvaliacoes.create({
      id_pco: pco?.id_pco || null,
      id_prd: prd?.id_prd || null,
      id_processo: selectedPlanId,
      tipo_teste: tipoTeste,
      data_teste: formData.data_teste,
      resultado: resultadoGeral,
      areas_melhoria: formData.areas_melhoria,
      cenarios_testados,
      participantes: participantesInput.split(',').map(p => p.trim()).filter(Boolean),
      evidencias: evidenciaForm.nome ? [evidenciaForm] : [],
      gerou_plano_acao,
      id_plano_acao
    });

    setTestes(db.testesAvaliacoes.list());
    setShowForm(false);
    setNotification({ type: 'success', text: `Teste registrado com sucesso! ${gerou_plano_acao ? `Plano de Ação ${id_plano_acao} criado.` : ''}` });

    // AJUSTE AUTOMÁTICO NOS PLANOS (Requisito 5)
    if (resultadoGeral === 'Falha' || resultadoGeral === 'Sucesso Parcial') {
      const processo = processos.find(p => p.id_processo === selectedPlanId);
      const ain = db.analiseImpactoNegocio.getForProcesso(selectedPlanId);
      
      if (processo && ain) {
        setSugestaoAjuste({
          processoId: selectedPlanId,
          processoNome: processo.nome,
          ainOriginal: ain,
          rtoSugerido: ain.RTO + 15,
          rpoSugerido: Math.max(5, Math.round(ain.RPO / 2)),
          motivo: formData.areas_melhoria || 'Falha identificada no teste por cenário.'
        });
      }
    } else {
      setSugestaoAjuste(null);
    }

    // Reset forms
    setFormData({ data_teste: '', resultado: 'Sucesso', areas_melhoria: '' });
    setTipoTeste('simulacao_mesa');
    setCenariosForm({
      acesso: { resultado: 'passou', observacoes: '' },
      sistemas: { resultado: 'passou', observacoes: '' },
      fornecedores: { resultado: 'passou', observacoes: '' },
      pessoas: { resultado: 'passou', observacoes: '' }
    });
    setParticipantesInput('');
    setEvidenciaForm({ nome: '', descricao: '' });
    setPlanoAcaoDesc('');
    setPlanoAcaoPrazo('');
  };

  // Aplicar ajuste sugerido automaticamente no banco
  const aplicarAjusteSugerido = () => {
    if (!sugestaoAjuste) return;

    db.analiseImpactoNegocio.save({
      ...sugestaoAjuste.ainOriginal,
      RTO: sugestaoAjuste.rtoSugerido,
      RPO: sugestaoAjuste.rpoSugerido
    });

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
              <Activity className="w-5 h-5 text-indigo-500" /> Registrar Teste por Cenários (ISO 22301)
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Processo Crítico Avaliado *</label>
              <select 
                value={selectedPlanId} 
                onChange={(e) => setSelectedPlanId(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
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
              <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Teste *</label>
              <select 
                value={tipoTeste} 
                onChange={(e) => setTipoTeste(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                required
              >
                <option value="simulacao_mesa">Simulação de Mesa (Tabletop)</option>
                <option value="exercicio_campo">Exercício de Campo</option>
                <option value="teste_tecnico">Teste Técnico / Failover</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Data da Execução *</label>
              <input 
                type="date" 
                value={formData.data_teste} 
                onChange={(e) => setFormData({...formData, data_teste: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Resultado Geral de Referência *</label>
              <select 
                value={formData.resultado} 
                onChange={(e) => setFormData({...formData, resultado: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
              >
                <option value="Sucesso">Sucesso (Dentro dos SLAs do BIA)</option>
                <option value="Sucesso Parcial">Sucesso Parcial</option>
                <option value="Falha">Falha / SLA Estourado</option>
              </select>
            </div>
          </div>

          {/* Checklist dos 4 Cenários do PCO */}
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-850 pt-4">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>📋 Checklist de Teste por Cenário PCO (Obrigatório)</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cenário Acesso */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-250">A - Acesso / Bloqueio Predial</span>
                  <select 
                    value={cenariosForm.acesso.resultado}
                    onChange={(e) => setCenariosForm({ ...cenariosForm, acesso: { ...cenariosForm.acesso, resultado: e.target.value } })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px] font-semibold focus:outline-indigo-500"
                  >
                    <option value="passou">Passou</option>
                    <option value="parcial">Parcial</option>
                    <option value="falhou">Falhou</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={cenariosForm.acesso.observacoes}
                  onChange={(e) => setCenariosForm({ ...cenariosForm, acesso: { ...cenariosForm.acesso, observacoes: e.target.value } })}
                  placeholder="Observações do cenário..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-800 dark:text-white"
                />
              </div>

              {/* Cenário Sistemas */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-250">B - Indisponibilidade de Sistemas</span>
                  <select 
                    value={cenariosForm.sistemas.resultado}
                    onChange={(e) => setCenariosForm({ ...cenariosForm, sistemas: { ...cenariosForm.sistemas, resultado: e.target.value } })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px] font-semibold focus:outline-indigo-500"
                  >
                    <option value="passou">Passou</option>
                    <option value="parcial">Parcial</option>
                    <option value="falhou">Falhou</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={cenariosForm.sistemas.observacoes}
                  onChange={(e) => setCenariosForm({ ...cenariosForm, sistemas: { ...cenariosForm.sistemas, observacoes: e.target.value } })}
                  placeholder="Observações do cenário..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-800 dark:text-white"
                />
              </div>

              {/* Cenário Fornecedores */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-250">C - Fornecedores Críticos</span>
                  <select 
                    value={cenariosForm.fornecedores.resultado}
                    onChange={(e) => setCenariosForm({ ...cenariosForm, fornecedores: { ...cenariosForm.fornecedores, resultado: e.target.value } })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px] font-semibold focus:outline-indigo-500"
                  >
                    <option value="passou">Passou</option>
                    <option value="parcial">Parcial</option>
                    <option value="falhou">Falhou</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={cenariosForm.fornecedores.observacoes}
                  onChange={(e) => setCenariosForm({ ...cenariosForm, fornecedores: { ...cenariosForm.fornecedores, observacoes: e.target.value } })}
                  placeholder="Observações do cenário..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-800 dark:text-white"
                />
              </div>

              {/* Cenário Pessoas */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-250">D - Absenteísmo / Pessoas</span>
                  <select 
                    value={cenariosForm.pessoas.resultado}
                    onChange={(e) => setCenariosForm({ ...cenariosForm, pessoas: { ...cenariosForm.pessoas, resultado: e.target.value } })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px] font-semibold focus:outline-indigo-500"
                  >
                    <option value="passou">Passou</option>
                    <option value="parcial">Parcial</option>
                    <option value="falhou">Falhou</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={cenariosForm.pessoas.observacoes}
                  onChange={(e) => setCenariosForm({ ...cenariosForm, pessoas: { ...cenariosForm.pessoas, observacoes: e.target.value } })}
                  placeholder="Observações do cenário..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Participantes e Evidências */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-850 pt-4 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Lista de Participantes (Nomes separados por vírgula)</label>
              <textarea 
                rows="2"
                value={participantesInput} 
                onChange={(e) => setParticipantesInput(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Ex: Carlos Silva (Geric), Ana Souza (DIAFI), Marcos Reis (Operações)"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase block">Evidência / Registro Documental</label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={evidenciaForm.nome}
                  onChange={(e) => setEvidenciaForm({ ...evidenciaForm, nome: e.target.value })}
                  placeholder="Nome do Arquivo (Ex: ata_simulado.pdf)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                />
                <input 
                  type="text" 
                  value={evidenciaForm.descricao}
                  onChange={(e) => setEvidenciaForm({ ...evidenciaForm, descricao: e.target.value })}
                  placeholder="Descrição (Ex: Lista de assinaturas)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Plano de Ação Condicional se houver falhas */}
          {(cenariosForm.acesso.resultado === 'falhou' || 
            cenariosForm.sistemas.resultado === 'falhou' || 
            cenariosForm.fornecedores.resultado === 'falhou' || 
            cenariosForm.pessoas.resultado === 'falhou') && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">⚠️ Plano de Ação Corretivo Obrigatório (ISO 22301)</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-550 leading-relaxed">
                Como um ou mais cenários falharam no simulado, é necessário registrar um Plano de Ação imediato com descrição das correções e prazo limite.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-rose-600 uppercase">Descrição da Ação Corretiva *</label>
                  <input 
                    type="text" 
                    value={planoAcaoDesc} 
                    onChange={(e) => setPlanoAcaoDesc(e.target.value)} 
                    className="w-full bg-white dark:bg-slate-900 border border-rose-250 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-rose-500" 
                    placeholder="Ex: Contratar link de backup redundante via fibra ótica dedicada..."
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-rose-600 uppercase">Prazo de Resolução *</label>
                  <input 
                    type="date" 
                    value={planoAcaoPrazo} 
                    onChange={(e) => setPlanoAcaoPrazo(e.target.value)} 
                    className="w-full bg-white dark:bg-slate-900 border border-rose-250 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-rose-500" 
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1 md:col-span-3 text-xs">
            <label className="text-xs font-bold text-slate-500 uppercase">Observações Gerais e Áreas de Melhoria</label>
            <textarea 
              rows="2"
              value={formData.areas_melhoria} 
              onChange={(e) => setFormData({...formData, areas_melhoria: e.target.value})} 
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
              placeholder="Insira observações gerais do simulado..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Registrar Simulado</button>
          </div>
        </form>
      )}

      {/* Histórico de Testes */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/20">
          <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Histórico de Testes e Simulações</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {testes.map(t => {
            const proc = processos.find(p => p.id_processo === t.id_processo);
            const procNome = proc?.nome || 'Processo Geral';
            const procCrit = proc?.criticidade || 'N/A';
            const pco = planosPco.find(p => p.id_processo === t.id_processo);
            
            const getResultadoColor = (res) => {
              if (res === 'Sucesso') return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/25';
              if (res === 'Sucesso Parcial') return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-500/25';
              return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-500/25';
            };

            const getCenBadge = (res) => {
              if (res === 'passou') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200';
              if (res === 'falhou') return 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 border-rose-200';
              return 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 border-amber-200';
            };

            return (
              <div key={t.id_teste} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 dark:border-slate-850">
                
                {/* Esquerda: Identificador, Data e Tipo */}
                <div className="space-y-1.5 md:w-1/4">
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{t.id_teste}</span>
                  <div className="text-xs text-slate-700 dark:text-slate-350 font-bold flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-450" /> {new Date(t.data_teste).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {t.tipo_teste === 'simulacao_mesa' ? 'Simulação de Mesa (Tabletop)' : 
                     t.tipo_teste === 'exercicio_campo' ? 'Exercício de Campo' : 'Teste Técnico / Failover'}
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border mt-2 ${getResultadoColor(t.resultado)}`}>
                    {t.resultado}
                  </span>
                </div>

                {/* Centro: Processo, Resultados por Cenário, Participantes, Evidências */}
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Processo Evaluated</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{t.id_processo} - {procNome}</p>
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                      Criticidade {procCrit}
                    </span>
                  </div>

                  {/* Resultados Detalhados por Cenário */}
                  {t.cenarios_testados && (
                    <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-150 dark:border-slate-850">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Avaliação Individual por Cenário PCO:</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {t.cenarios_testados.map(c => {
                          const label = { acesso: 'Predial', sistemas: 'Sistemas', fornecedores: 'Fornecedores', pessoas: 'Pessoas' }[c.cenario] || c.cenario;
                          return (
                            <div key={c.cenario} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1">
                              <span className="text-slate-600 dark:text-slate-400 font-medium capitalize">{label}:</span>
                              <span className={`px-1.5 py-0.2 rounded font-black text-[9px] uppercase border ${getCenBadge(c.resultado)}`} title={c.observacoes}>
                                {c.resultado}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Participantes */}
                  {t.participantes && t.participantes.length > 0 && (
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Participantes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.participantes.map((part, pIdx) => (
                          <span key={pIdx} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded flex items-center gap-1 font-semibold border border-slate-200 dark:border-slate-700">
                            <User className="w-2.5 h-2.5 text-slate-450" /> {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidências */}
                  {t.evidencias && t.evidencias.length > 0 && (
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/30 p-2 rounded-lg border border-slate-200 dark:border-slate-800 max-w-xs text-[10px]">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-700 dark:text-slate-350 block truncate">{t.evidencias[0].nome}</span>
                        <span className="text-slate-450 text-[9px]">{t.evidencias[0].descricao || 'Sem descrição'}</span>
                      </div>
                    </div>
                  )}
                  
                  {t.areas_melhoria && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Observações Gerais</span>
                      <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed mt-1">{t.areas_melhoria}</p>
                    </div>
                  )}
                </div>

                {/* Direita: Ações de Plano de Ação e Exportação */}
                <div className="space-y-3 w-full md:w-auto flex flex-col items-end flex-shrink-0">
                  {/* Plano de Ação Gerado */}
                  {t.gerou_plano_acao && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30 text-[10px] w-full md:w-44 text-right space-y-1">
                      <span className="font-bold block uppercase text-[8px]">Plano de Ação Mitigatório</span>
                      <p className="font-semibold truncate">Cód: {t.id_plano_acao}</p>
                      <span className="text-[9px] bg-rose-100 dark:bg-rose-900 px-1.5 py-0.2 rounded font-black">PENDENTE</span>
                    </div>
                  )}

                  <button
                    onClick={() => pdfService.exportar(
                      pdfService.htmlTeste(t, pco, proc), 
                      `Relatório de Simulado - ${t.id_teste}`, 
                      '1.0', 
                      'Geric - GCN System'
                    )}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors w-full md:w-auto shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Exportar PDF
                  </button>
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
