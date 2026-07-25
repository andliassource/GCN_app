import React, { useState } from 'react';
import { ShieldAlert, Plus, Trash2, Network, Shield, AlertTriangle, Layers, Laptop, Radio, Database, RefreshCw } from 'lucide-react';

export default function OrganizacaoRiscos({ db }) {
  const [diretorias] = useState(db.diretorias.list());
  const [gerencias, setGerencias] = useState(db.gerencias.list());
  const [ativos, setAtivos] = useState(db.ativosSistemas.list());
  const [riscos, setRiscos] = useState(db.riscos.list());
  const [processos] = useState(db.processosCriticos.list());
  const [planosAcao] = useState(db.planosAcao ? db.planosAcao.list() : []);

  // Estado para o Visualizador BIA Tree
  const [selectedBiaProcId, setSelectedBiaProcId] = useState(db.processosCriticos.list()[0]?.id_processo || '');
  const selectedBiaProc = processos.find(p => p.id_processo === selectedBiaProcId);
  const biaContrato = selectedBiaProc ? db.contratos.list().find(c => c.id_contrato === selectedBiaProc.id_contrato) : null;
  const biaAtivos = selectedBiaProc ? ativos.filter(a => a.id_gerencia === selectedBiaProc.id_gerencia) : [];
  const biaRiscos = selectedBiaProc ? riscos.filter(r => r.id_processo === selectedBiaProc.id_processo) : [];

  // Estados locais de controle de abas internas
  const [subTab, setSubTab] = useState('estrutura'); // 'estrutura', 'riscos', 'ativos'

  // Estados dos formulários
  const [showGerenciaForm, setShowGerenciaForm] = useState(false);
  const [showRiscoForm, setShowRiscoForm] = useState(false);
  const [showAtivoForm, setShowAtivoForm] = useState(false);
  
  const [notification, setNotification] = useState(null);

  // Form Fields - Gerência
  const [gerenciaForm, setGerenciaForm] = useState({
    nome: '',
    sigla: '',
    tipo: 'Negócios',
    id_diretoria: 'DIR-001'
  });

  // Form Fields - Risco
  const [riscoForm, setRiscoForm] = useState({
    nome: '',
    descricao: '',
    probabilidade: 'Provável',
    impacto: 'Moderado',
    id_processo: '',
    risco_residual_prob: 'Pouco Provável',
    risco_residual_imp: 'Menor',
    id_plano_acao: ''
  });

  // Form Fields - Ativo/Sistema
  const [ativoForm, setAtivoForm] = useState({
    nome: '',
    tipo: 'Sistema',
    criticidade: 'Média',
    id_gerencia: 'GER-TIC01',
    responsavel_tecnico: '',
    fornecedor: '',
    data_aquisicao: '',
    data_fim_suporte: '',
    tipo_redundancia: 'nenhuma',
    rto_proprio_minutos: 60,
    dados_classificacao: 'interno',
    status_ativo: 'operacional'
  });

  // Submissão do cadastro de Gerência
  const handleGerenciaSubmit = (e) => {
    e.preventDefault();
    if (!gerenciaForm.nome || !gerenciaForm.sigla) return;
    
    db.gerencias.create(gerenciaForm);
    setGerencias(db.gerencias.list());
    setShowGerenciaForm(false);
    setGerenciaForm({ nome: '', sigla: '', tipo: 'Negócios', id_diretoria: 'DIR-001' });
    setNotification({ type: 'success', text: `Gerência ${gerenciaForm.sigla} cadastrada com sucesso!` });
  };

  // Submissão do cadastro de Risco
  const handleRiscoSubmit = (e) => {
    e.preventDefault();
    if (!riscoForm.nome || !riscoForm.id_processo) return;

    const PROB_SCORE = { 'Rara': 1, 'Pouco Provável': 2, 'Provável': 3, 'Muito Provável': 4, 'Quase Certa': 5 };
    const IMP_SCORE = { 'Insignificante': 1, 'Menor': 2, 'Moderado': 3, 'Maior': 4, 'Catastrófico': 5 };

    const score_risco = (PROB_SCORE[riscoForm.probabilidade] || 3) * (IMP_SCORE[riscoForm.impacto] || 3);
    const score_residual = (PROB_SCORE[riscoForm.risco_residual_prob || 'Rara'] || 1) * (IMP_SCORE[riscoForm.risco_residual_imp || 'Insignificante'] || 1);

    db.riscos.create({
      ...riscoForm,
      score_risco,
      score_residual
    });

    setRiscos(db.riscos.list());
    setShowRiscoForm(false);
    setRiscoForm({
      nome: '',
      descricao: '',
      probabilidade: 'Provável',
      impacto: 'Moderado',
      id_processo: '',
      risco_residual_prob: 'Pouco Provável',
      risco_residual_imp: 'Menor',
      id_plano_acao: ''
    });
    setNotification({ type: 'success', text: `Risco cadastrado e mapeado com sucesso!` });
  };

  // Submissão de Ativo
  const handleAtivoSubmit = (e) => {
    e.preventDefault();
    if (!ativoForm.nome) return;

    db.ativosSistemas.create(ativoForm);
    setAtivos(db.ativosSistemas.list());
    setShowAtivoForm(false);
    setAtivoForm({
      nome: '',
      tipo: 'Sistema',
      criticidade: 'Média',
      id_gerencia: 'GER-TIC01',
      responsavel_tecnico: '',
      fornecedor: '',
      data_aquisicao: '',
      data_fim_suporte: '',
      tipo_redundancia: 'nenhuma',
      rto_proprio_minutos: 60,
      dados_classificacao: 'interno',
      status_ativo: 'operacional'
    });
    setNotification({ type: 'success', text: `Ativo de tecnologia cadastrado!` });
  };

  // Importação de ativos em lote
  const handleImportarAtivos = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let novosAtivos = [];
        if (file.name.endsWith('.json')) {
          novosAtivos = JSON.parse(text);
          if (!Array.isArray(novosAtivos)) novosAtivos = [novosAtivos];
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n');
          if (lines.length < 2) throw new Error('CSV vazio ou inválido');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const obj = {};
            headers.forEach((h, idx) => {
              obj[h] = values[idx] || '';
            });
            novosAtivos.push(obj);
          }
        } else {
          throw new Error('Extensão de arquivo não suportada. Use .json ou .csv');
        }
        
        let count = 0;
        novosAtivos.forEach(at => {
          if (at.nome) {
            db.ativosSistemas.create({
              nome: at.nome,
              tipo: at.tipo || 'Sistema',
              criticidade: at.criticidade || 'Média',
              id_gerencia: at.id_gerencia || 'GER-TIC01',
              responsavel_tecnico: at.responsavel_tecnico || '',
              fornecedor: at.fornecedor || '',
              data_aquisicao: at.data_aquisicao || '',
              data_fim_suporte: at.data_fim_suporte || '',
              tipo_redundancia: at.tipo_redundancia || 'nenhuma',
              rto_proprio_minutos: at.rto_proprio_minutos ? parseInt(at.rto_proprio_minutos) : 60,
              dados_classificacao: at.dados_classificacao || 'interno',
              status_ativo: at.status_ativo || 'operacional'
            });
            count++;
          }
        });
        
        setAtivos(db.ativosSistemas.list());
        setNotification({ type: 'success', text: `${count} ativos importados com sucesso em lote!` });
      } catch (err) {
        setNotification({ type: 'error', text: `Erro ao processar importação: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteRisco = (id) => {
    if (window.confirm('Excluir este risco mapeado?')) {
      db.riscos.delete(id);
      setRiscos(db.riscos.list());
      setNotification({ type: 'info', text: 'Risco removido da análise.' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Subnavegação Interna */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button 
          onClick={() => setSubTab('estrutura')}
          className={`pb-3 transition-all ${subTab === 'estrutura' ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Estrutura Organizacional
        </button>
        <button 
          onClick={() => setSubTab('riscos')}
          className={`pb-3 transition-all ${subTab === 'riscos' ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Riscos Operacionais (Geric)
        </button>
        <button 
          onClick={() => setSubTab('ativos')}
          className={`pb-3 transition-all ${subTab === 'ativos' ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Ativos & Sistemas Críticos
        </button>
        <button 
          onClick={() => setSubTab('dependencias')}
          className={`pb-3 transition-all ${subTab === 'dependencias' ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Visualizador BIA Tree
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 text-xs font-semibold">
          {notification.text}
        </div>
      )}

      {/* ABA 1: ESTRUTURA ORGANIZACIONAL */}
      {subTab === 'estrutura' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-850 dark:text-white">Estrutura de Diretorias e Gerências Executivas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-xl leading-relaxed">
                Mapeamento das 3 diretorias e suas respectivas gerências executivas. Os processos e contratos são herdados e acumulados diretamente na governança de cada gerência.
              </p>
            </div>
            <button 
              onClick={() => { setShowGerenciaForm(true); setNotification(null); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Cadastrar Gerência (GeXXX)
            </button>
          </div>

          {/* Form Gerência */}
          {showGerenciaForm && (
            <form onSubmit={handleGerenciaSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Novo Cadastro de Gerência Executiva</h4>
                <button type="button" onClick={() => setShowGerenciaForm(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome da Gerência *</label>
                  <input 
                    type="text" 
                    value={gerenciaForm.nome} 
                    onChange={(e) => setGerenciaForm({...gerenciaForm, nome: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                    placeholder="Ex: Gerência de Canais e Backoffice"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Sigla (Começa com Ge) *</label>
                  <input 
                    type="text" 
                    value={gerenciaForm.sigla} 
                    onChange={(e) => setGerenciaForm({...gerenciaForm, sigla: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                    placeholder="Ex: Gecob"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Área *</label>
                  <select 
                    value={gerenciaForm.tipo} 
                    onChange={(e) => setGerenciaForm({...gerenciaForm, tipo: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                  >
                    <option value="Negócios">Negócios (PCO/PRD)</option>
                    <option value="Apoio">Apoio (Diafi/PCO Apoio)</option>
                    <option value="TIC">Tecnologia (Dites/PRD/ISO 27031)</option>
                    <option value="Governança">Governança (Geric/Geemp)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Diretoria Vinculada *</label>
                  <select 
                    value={gerenciaForm.id_diretoria} 
                    onChange={(e) => setGerenciaForm({...gerenciaForm, id_diretoria: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                  >
                    {diretorias.map(d => (
                      <option key={d.id_diretoria} value={d.id_diretoria}>{d.sigla} - {d.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowGerenciaForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Salvar Gerência</button>
              </div>
            </form>
          )}

          {/* Árvore / Organograma da Estrutura */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {diretorias.map((dir) => {
              const gerenciasDaDir = gerencias.filter(g => g.id_diretoria === dir.id_diretoria);
              
              return (
                <div key={dir.id_diretoria} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">{dir.id_diretoria}</span>
                    <h4 className="font-extrabold text-slate-850 dark:text-white text-sm mt-0.5">{dir.sigla}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">{dir.nome}</p>
                  </div>
                  <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto pr-1 flex-1">
                    {gerenciasDaDir.map((g) => {
                      const procsDaGer = processos.filter(p => p.id_gerencia === g.id_gerencia);
                      
                      const getTipoColor = (t) => {
                        if (t === 'Negócios') return 'bg-indigo-50/50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400';
                        if (t === 'TIC') return 'bg-purple-50/50 dark:bg-purple-950 text-purple-650 dark:text-purple-400';
                        if (t === 'Apoio') return 'bg-amber-50/50 dark:bg-amber-950/30 text-amber-650 dark:text-amber-400';
                        return 'bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400';
                      };

                      return (
                        <div key={g.id_gerencia} className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850/60 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-xs text-slate-800 dark:text-slate-200">{g.sigla}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${getTipoColor(g.tipo)}`}>
                              {g.tipo}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{g.nome}</p>
                          {g.observacao && (
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 italic leading-tight border-l-2 border-indigo-300 dark:border-indigo-700 pl-2 mt-1">
                              {g.observacao}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-850 text-[10px] text-slate-400">
                            <span>Processos críticos:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{procsDaGer.length}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: RISCOS OPERACIONAIS */}
      {subTab === 'riscos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-850 dark:text-white">Matriz de Cadastro de Riscos e Ameaças</h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-xl leading-relaxed">
                Identificação e registro de ameaças (DDoS, Incêndio, Indisponibilidade predial) que afetam os processos da empresa. Vincule riscos a processos para embasamento dos cenários de PCO.
              </p>
            </div>
            <button 
              onClick={() => { setShowRiscoForm(true); setNotification(null); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Cadastrar Risco Operacional
            </button>
          </div>

          {/* Form Risco */}
          {showRiscoForm && (
            <form onSubmit={handleRiscoSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Novo Cadastro de Risco / Ameaça (Geric)</h4>
                <button type="button" onClick={() => setShowRiscoForm(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
              </div>
              
              <div className="space-y-4 text-xs">
                {/* Informações Gerais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome do Risco *</label>
                    <input 
                      type="text" 
                      value={riscoForm.nome} 
                      onChange={(e) => setRiscoForm({...riscoForm, nome: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                      placeholder="Ex: Queda Geral de Link WAN"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Processo Crítico Afetado *</label>
                    <select 
                      value={riscoForm.id_processo} 
                      onChange={(e) => setRiscoForm({...riscoForm, id_processo: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                      required
                    >
                      <option value="">Selecione o Processo</option>
                      {processos.map(p => (
                        <option key={p.id_processo} value={p.id_processo}>{p.id_processo} - {p.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Plano de Ação Associado</label>
                    <select 
                      value={riscoForm.id_plano_acao} 
                      onChange={(e) => setRiscoForm({...riscoForm, id_plano_acao: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                    >
                      <option value="">Nenhum</option>
                      {planosAcao.map(pa => (
                        <option key={pa.id_plano_acao} value={pa.id_plano_acao}>{pa.id_plano_acao} - {pa.descricao.substring(0, 50)}...</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Score Original vs. Score Residual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  {/* Risco Inerente / Original */}
                  <div className="space-y-3">
                    <h5 className="font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider">1. Risco Inerente (Original)</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Probabilidade *</label>
                        <select 
                          value={riscoForm.probabilidade} 
                          onChange={(e) => setRiscoForm({...riscoForm, probabilidade: e.target.value})} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                        >
                          <option value="Rara">Rara</option>
                          <option value="Pouco Provável">Pouco Provável</option>
                          <option value="Provável">Provável</option>
                          <option value="Muito Provável">Muito Provável</option>
                          <option value="Quase Certa">Quase Certa</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Impacto *</label>
                        <select 
                          value={riscoForm.impacto} 
                          onChange={(e) => setRiscoForm({...riscoForm, impacto: e.target.value})} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                        >
                          <option value="Insignificante">Insignificante</option>
                          <option value="Menor">Menor</option>
                          <option value="Moderado">Moderado</option>
                          <option value="Maior">Maior</option>
                          <option value="Catastrófico">Catastrófico</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Risco Residual (Mitigado) */}
                  <div className="space-y-3">
                    <h5 className="font-bold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider">2. Risco Residual (Pós Controles)</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Probabilidade Residual *</label>
                        <select 
                          value={riscoForm.risco_residual_prob} 
                          onChange={(e) => setRiscoForm({...riscoForm, risco_residual_prob: e.target.value})} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                        >
                          <option value="Rara">Rara</option>
                          <option value="Pouco Provável">Pouco Provável</option>
                          <option value="Provável">Provável</option>
                          <option value="Muito Provável">Muito Provável</option>
                          <option value="Quase Certa">Quase Certa</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Impacto Residual *</label>
                        <select 
                          value={riscoForm.risco_residual_imp} 
                          onChange={(e) => setRiscoForm({...riscoForm, risco_residual_imp: e.target.value})} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                        >
                          <option value="Insignificante">Insignificante</option>
                          <option value="Menor">Menor</option>
                          <option value="Moderado">Moderado</option>
                          <option value="Maior">Maior</option>
                          <option value="Catastrófico">Catastrófico</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Descrição da Ameaça</label>
                  <textarea 
                    rows="2"
                    value={riscoForm.descricao} 
                    onChange={(e) => setRiscoForm({...riscoForm, descricao: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                    placeholder="Descreva as condições específicas de acionamento do risco..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowRiscoForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Salvar Risco</button>
              </div>
            </form>
          )}

          {/* Tabela de Riscos */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
              <h3 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Inventário de Riscos Corporativos</h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-3">Código / Nome</th>
                  <th className="px-6 py-3">Descrição da Ameaça</th>
                  <th className="px-6 py-3 text-center">Score Inerente</th>
                  <th className="px-6 py-3 text-center">Score Residual</th>
                  <th className="px-6 py-3">Controle / Plano de Ação</th>
                  <th className="px-6 py-3">Processo Vinculado</th>
                  <th className="px-6 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {riscos.map(r => {
                  const PROB_SCORE = { 'Rara': 1, 'Pouco Provável': 2, 'Provável': 3, 'Muito Provável': 4, 'Quase Certa': 5 };
                  const IMP_SCORE = { 'Insignificante': 1, 'Menor': 2, 'Moderado': 3, 'Maior': 4, 'Catastrófico': 5 };
                  
                  const scoreInerente = (PROB_SCORE[r.probabilidade] || 3) * (IMP_SCORE[r.impacto] || 3);
                  const scoreResidual = (PROB_SCORE[r.risco_residual_prob || 'Rara'] || 1) * (IMP_SCORE[r.risco_residual_imp || 'Insignificante'] || 1);

                  const getScoreBadge = (sc) => {
                    if (sc >= 15) return 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400';
                    if (sc >= 10) return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400';
                    return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400';
                  };

                  return (
                    <tr key={r.id_risco} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[10px] text-indigo-500 font-bold uppercase">{r.id_risco}</span>
                        <p className="font-bold text-slate-800 dark:text-white mt-0.5">{r.nome}</p>
                      </td>
                      <td className="px-6 py-4 max-w-sm text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                        {r.descricao || 'Sem descrição cadastrada'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${getScoreBadge(scoreInerente)}`}>
                            {scoreInerente}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">{r.probabilidade} x {r.impacto}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${getScoreBadge(scoreResidual)}`}>
                            {scoreResidual}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">{r.risco_residual_prob || 'Rara'} x {r.risco_residual_imp || 'Insignificante'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {r.id_plano_acao ? (
                          <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-750 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 px-2 py-0.5 rounded text-[10px] font-bold">
                            PA: {r.id_plano_acao}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic text-[10px]">Sem PA associado</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {r.processo ? (
                          <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold">
                            {r.processo.id_processo} - {r.processo.nome}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Processo Geral</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDeleteRisco(r.id_risco)}
                          className="text-slate-450 hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/25 transition-all"
                          title="Deletar risco"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: ATIVOS E SISTEMAS */}
      {subTab === 'ativos' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
            <div>
              <h3 className="font-bold text-slate-850 dark:text-white">Inventário de Ativos de Tecnologia e Links</h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-xl leading-relaxed">
                Mapeamento de ativos críticos como Links de Telecom (Embratel), Bancos de Dados e servidores em nuvem. Os ativos devem estar associados aos processos na AIN.
              </p>
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors border border-slate-200 dark:border-slate-700">
                📥 Importar Lote (JSON/CSV)
                <input 
                  type="file" 
                  accept=".csv,.json" 
                  onChange={handleImportarAtivos} 
                  className="hidden" 
                />
              </label>
              <button 
                onClick={() => {
                  const templateJSON = JSON.stringify([{
                    nome: "Banco de Dados Produção",
                    tipo: "Sistema",
                    criticidade: "Crítica",
                    responsavel_tecnico: "admin@empresa.com",
                    fornecedor: "Oracle Inc.",
                    data_aquisicao: "2024-01-10",
                    data_fim_suporte: "2027-12-31",
                    tipo_redundancia: "geografica",
                    rto_proprio_minutos: 30,
                    dados_classificacao: "confidencial",
                    status_ativo: "operacional"
                  }], null, 2);
                  const blob = new Blob([templateJSON], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "template_ativos.json";
                  a.click();
                }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold px-3 py-2 rounded-lg text-xs transition-colors border border-slate-200 dark:border-slate-700"
                title="Download Template JSON"
              >
                📋 Template JSON
              </button>
              <button 
                onClick={() => { setShowAtivoForm(true); setNotification(null); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Cadastrar Ativo
              </button>
            </div>
          </div>

          {/* Form Ativo */}
          {showAtivoForm && (
            <form onSubmit={handleAtivoSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Novo Cadastro de Ativo de Tecnologia</h4>
                <button type="button" onClick={() => setShowAtivoForm(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome do Ativo *</label>
                  <input 
                    type="text" 
                    value={ativoForm.nome} 
                    onChange={(e) => setAtivoForm({...ativoForm, nome: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                    placeholder="Ex: Cluster Redis Cache Contingência"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo do Ativo *</label>
                  <select 
                    value={ativoForm.tipo} 
                    onChange={(e) => setAtivoForm({...ativoForm, tipo: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                  >
                    <option value="Sistema">Sistema (Software/API)</option>
                    <option value="Link">Link (Telecom/Redes)</option>
                    <option value="Servidor">Servidor (Nuvem/Hardware)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Criticidade *</label>
                  <select 
                    value={ativoForm.criticidade} 
                    onChange={(e) => setAtivoForm({...ativoForm, criticidade: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Gerência Vinculada *</label>
                  <select 
                    value={ativoForm.id_gerencia} 
                    onChange={(e) => setAtivoForm({...ativoForm, id_gerencia: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                    required
                  >
                    {gerencias.map(g => (
                      <option key={g.id_gerencia} value={g.id_gerencia}>{g.sigla} - {g.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Responsável Técnico</label>
                  <input 
                    type="email" 
                    value={ativoForm.responsavel_tecnico} 
                    onChange={(e) => setAtivoForm({...ativoForm, responsavel_tecnico: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                    placeholder="Ex: responsavel@empresa.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Fornecedor / Fabricante</label>
                  <input 
                    type="text" 
                    value={ativoForm.fornecedor} 
                    onChange={(e) => setAtivoForm({...ativoForm, fornecedor: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                    placeholder="Ex: AWS, Embratel, Oracle"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Data de Aquisição</label>
                  <input 
                    type="date" 
                    value={ativoForm.data_aquisicao} 
                    onChange={(e) => setAtivoForm({...ativoForm, data_aquisicao: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Fim do Suporte / Garantia</label>
                  <input 
                    type="date" 
                    value={ativoForm.data_fim_suporte} 
                    onChange={(e) => setAtivoForm({...ativoForm, data_fim_suporte: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Redundância</label>
                  <select 
                    value={ativoForm.tipo_redundancia} 
                    onChange={(e) => setAtivoForm({...ativoForm, tipo_redundancia: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                  >
                    <option value="nenhuma">Nenhuma</option>
                    <option value="passiva">Passiva (Cold/Warm Standby)</option>
                    <option value="ativa">Ativa (Hot Standby/Load Balance)</option>
                    <option value="geografica">Geográfica (Multi-região)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">RTO Próprio (Minutos)</label>
                  <input 
                    type="number" 
                    value={ativoForm.rto_proprio_minutos} 
                    onChange={(e) => setAtivoForm({...ativoForm, rto_proprio_minutos: parseInt(e.target.value) || 0})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                    min="1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Classificação dos Dados</label>
                  <select 
                    value={ativoForm.dados_classificacao} 
                    onChange={(e) => setAtivoForm({...ativoForm, dados_classificacao: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                  >
                    <option value="publico">Público</option>
                    <option value="interno">Uso Interno</option>
                    <option value="confidencial">Confidencial</option>
                    <option value="secreto">Secreto</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status Operacional *</label>
                  <select 
                    value={ativoForm.status_ativo} 
                    onChange={(e) => setAtivoForm({...ativoForm, status_ativo: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                    required
                  >
                    <option value="operacional">Operacional</option>
                    <option value="degradado">Degradado</option>
                    <option value="inoperante">Inoperante / Fora do Ar</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowAtivoForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Salvar Ativo</button>
              </div>
            </form>
          )}

          {/* Grid de Ativos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ativos.map((at) => {
              const getIcon = (tipo) => {
                if (tipo === 'Sistema') return <Database className="w-5 h-5 text-indigo-500" />;
                if (tipo === 'Link') return <Radio className="w-5 h-5 text-purple-500" />;
                return <Laptop className="w-5 h-5 text-amber-500" />;
              };

              const getCritColor = (crit) => {
                if (crit === 'Crítica') return 'text-rose-500 bg-rose-50 dark:bg-rose-955/20 border-rose-500/20';
                if (crit === 'Alta') return 'text-orange-500 bg-orange-50 dark:bg-orange-955/20 border-orange-500/20';
                return 'text-slate-600 bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800';
              };

              const getStatusColor = (status) => {
                if (status === 'operacional') return 'bg-emerald-500';
                if (status === 'degradado') return 'bg-amber-500';
                return 'bg-rose-500';
              };

              // Verificação de expiração de suporte em menos de 90 dias
              const hoje = new Date();
              const diasFaltando = at.data_fim_suporte ? Math.round((new Date(at.data_fim_suporte) - hoje) / (1000 * 60 * 60 * 24)) : null;
              const alertaSuporte = diasFaltando !== null && diasFaltando <= 90;

              // Processos vinculados (mapeamento N:M)
              const procsVinculados = processos.filter(p => p.ativos && p.ativos.some(a => a.id_ativo === at.id_ativo));

              return (
                <div key={at.id_ativo} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
                  {/* Status Semáforo Top Right */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-850">
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(at.status_ativo)}`} />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 capitalize">{at.status_ativo || 'operacional'}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-850 flex-shrink-0">
                      {getIcon(at.tipo)}
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{at.id_ativo} ({at.tipo})</span>
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs mt-0.5">{at.nome}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[8px] px-1.5 py-0.2 rounded font-black uppercase border ${getCritColor(at.criticidade)}`}>
                          {at.criticidade}
                        </span>
                        {at.tipo_redundancia && at.tipo_redundancia !== 'nenhuma' && (
                          <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 px-1.5 py-0.2 rounded font-bold uppercase border border-indigo-100 dark:border-indigo-900/35">
                            🔁 {at.tipo_redundancia}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes do Ativo */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-3">
                    <div>
                      <span className="font-bold text-slate-400 dark:text-slate-500 block text-[8px] uppercase">Responsável Técnico</span>
                      <span className="truncate block font-semibold text-slate-700 dark:text-slate-350">{at.responsavel_tecnico || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 dark:text-slate-500 block text-[8px] uppercase">Fornecedor</span>
                      <span className="truncate block font-semibold text-slate-700 dark:text-slate-350">{at.fornecedor || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 dark:text-slate-500 block text-[8px] uppercase">RTO de TI</span>
                      <span className="block font-semibold text-slate-700 dark:text-slate-350">{at.rto_proprio_minutos || 60} min</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 dark:text-slate-500 block text-[8px] uppercase">Dados</span>
                      <span className="block font-semibold text-slate-700 dark:text-slate-350 uppercase">{at.dados_classificacao || 'interno'}</span>
                    </div>
                  </div>

                  {/* Alerta de Expiração de Suporte */}
                  {at.data_fim_suporte && (
                    <div className={`p-2 rounded text-[9px] flex items-center justify-between font-medium ${
                      alertaSuporte 
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border border-rose-200 dark:border-rose-900/35' 
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-450 dark:text-slate-500'
                    }`}>
                      <span>Suporte até: {new Date(at.data_fim_suporte).toLocaleDateString('pt-BR')}</span>
                      {alertaSuporte && (
                        <span className="font-bold uppercase tracking-wider animate-pulse text-[8px]">
                          ⚠️ Expira em {diasFaltando} dias!
                        </span>
                      )}
                    </div>
                  )}

                  {/* Processos Críticos Vinculados */}
                  {procsVinculados.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5">
                      <span className="font-bold text-slate-400 dark:text-slate-500 text-[8px] uppercase block mb-1">Processos Vinculados AIN:</span>
                      <div className="flex flex-wrap gap-1">
                        {procsVinculados.map(p => (
                          <span key={p.id_processo} className="text-[8px] bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-450 border border-slate-100 dark:border-slate-800 px-1.5 py-0.2 rounded font-semibold">
                            {p.nome.substring(0, 20)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 4: VISUALIZADOR BIA TREE (DEPENDÊNCIAS CRÍTICAS) */}
      {subTab === 'dependencias' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-slate-850 dark:text-white">Visualizador BIA Tree — Linhagem de Dependências</h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-xl leading-relaxed">
              Selecione um processo crítico para rastrear graficamente suas dependências de contratos, ativos de tecnologia, riscos e planos de resiliência.
            </p>
            
            {/* Seletor de Processo */}
            <div className="mt-4 max-w-xs">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Processo Crítico</label>
              <select 
                value={selectedBiaProcId} 
                onChange={(e) => setSelectedBiaProcId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500 font-bold"
              >
                <option value="">Selecione o processo...</option>
                {processos.map(p => (
                  <option key={p.id_processo} value={p.id_processo}>{p.id_processo} - {p.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Render da Árvore de Dependências */}
          {selectedBiaProc ? (
            <div className="overflow-x-auto p-6 bg-slate-100/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200 dark:border-slate-850 min-w-full">
              <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6 min-w-[900px] py-4">
                
                {/* 1. NÓ DO PROCESSO CRÍTICO */}
                <div className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-l-4 border-l-indigo-650 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded font-black uppercase">Processo</span>
                    <h4 className="font-extrabold text-slate-850 dark:text-white text-xs mt-1">{selectedBiaProc.nome}</h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed line-clamp-3">{selectedBiaProc.descricao}</p>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5 text-[9.5px] text-slate-500 space-y-1">
                    <div>Criticidade: <span className={`font-bold ${selectedBiaProc.criticidade === 'Crítica' || selectedBiaProc.criticidade === 'Alta' ? 'text-rose-500' : 'text-slate-550'}`}>{selectedBiaProc.criticidade}</span></div>
                    <div>Dono: <span className="font-bold">{selectedBiaProc.id_gerencia}</span></div>
                  </div>
                </div>

                {/* SETA 1 */}
                <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 font-black text-lg select-none">➔</div>

                {/* 2. NÓ DO CONTRATO */}
                <div className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-l-4 border-l-teal-500 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <span className="text-[8px] bg-teal-50 dark:bg-teal-950/40 text-teal-650 dark:text-teal-400 px-2 py-0.5 rounded font-black uppercase">Contrato Vinculado</span>
                    {biaContrato ? (
                      <>
                        <h4 className="font-extrabold text-slate-850 dark:text-white text-xs mt-1">{biaContrato.nome}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed"><strong>SLA:</strong> {biaContrato.clausulas_risco}</p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-bold text-slate-400 text-xs mt-1">Sem Contrato Externo</h4>
                        <p className="text-[10px] text-slate-400 mt-1 italic">Processo de apoio interno ou contingenciado por recursos próprios.</p>
                      </>
                    )}
                  </div>
                  {biaContrato && (
                    <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5 text-[9.5px] text-slate-500 space-y-1">
                      <div>Código: <span className="font-bold">{biaContrato.id_contrato}</span></div>
                      <div>Valor: <span className="font-bold text-teal-600">R$ {biaContrato.valor_faturamento.toLocaleString('pt-BR')}</span></div>
                    </div>
                  )}
                </div>

                {/* SETA 2 */}
                <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 font-black text-lg select-none">➔</div>

                {/* 3. NÓ DE ATIVOS DE TI */}
                <div className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-l-4 border-l-purple-500 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <span className="text-[8px] bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 px-2 py-0.5 rounded font-black uppercase">Ativos & Infraestrutura</span>
                    <div className="mt-2 space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {biaAtivos.map(at => (
                        <div key={at.id_ativo} className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 px-2 py-1 rounded text-[9px] border border-slate-150 dark:border-slate-850">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate w-32" title={at.nome}>{at.nome}</span>
                          <span className={`px-1.5 rounded text-[8px] font-bold uppercase ${at.criticidade === 'Critica' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-650'}`}>{at.criticidade}</span>
                        </div>
                      ))}
                      {biaAtivos.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">Nenhum ativo de TI mapeado no BIA.</span>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5 text-[9.5px] text-slate-500">
                    Total de Sistemas: <span className="font-bold text-purple-600">{biaAtivos.length}</span>
                  </div>
                </div>

                {/* SETA 3 */}
                <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 font-black text-lg select-none">➔</div>

                {/* 4. NÓ DE RISCOS & CONTROLE RESIDUAL */}
                <div className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-l-4 border-l-amber-500 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <span className="text-[8px] bg-amber-50 dark:bg-amber-950/40 text-amber-655 dark:text-amber-450 px-2 py-0.5 rounded font-black uppercase">Riscos Associados</span>
                    <div className="mt-2 space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {biaRiscos.map(r => {
                        const score = (r.impacto_residual * r.probabilidade_residual) || (r.impacto * r.probabilidade) || 0;
                        const badgeColor = score >= 12 ? 'text-rose-600 bg-rose-50 border-rose-200/50' : score >= 8 ? 'text-orange-600 bg-orange-50 border-orange-200/50' : 'text-emerald-600 bg-emerald-50 border-emerald-200/50';
                        return (
                          <div key={r.id_risco} className="p-1 bg-slate-50 dark:bg-slate-955 rounded text-[9px] border border-slate-150 dark:border-slate-850 flex justify-between items-center">
                            <span className="font-bold text-slate-700 dark:text-slate-350 truncate w-32" title={r.titulo}>{r.titulo}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black border ${badgeColor}`}>Score: {score}</span>
                          </div>
                        );
                      })}
                      {biaRiscos.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">Sem riscos operacionais vinculados.</span>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-2.5 text-[9.5px] text-slate-500">
                    Riscos Mapeados: <span className="font-bold text-amber-600">{biaRiscos.length}</span>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl italic shadow-2xs">
              Selecione um processo crítico acima para carregar o visualizador.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
