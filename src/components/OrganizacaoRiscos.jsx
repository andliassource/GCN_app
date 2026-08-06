import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Trash2, Network, Shield, AlertTriangle, Layers, Laptop, Radio, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function OrganizacaoRiscos({ db }) {
  const { usuario, isAdmin, filterByGerencia, canCreate, canEdit } = useAuth();
  const [diretorias] = useState(db.diretorias.list());
  const [gerencias, setGerencias] = useState(filterByGerencia(db.gerencias.list()));
  const [ativos, setAtivos] = useState(filterByGerencia(db.ativosSistemas.list()));
  const [riscos, setRiscos] = useState(filterByGerencia(db.riscos.list(), 'processo.id_gerencia'));
  const [processos] = useState(filterByGerencia(db.processosCriticos.list()));
  const [planosAcao] = useState(filterByGerencia(db.planosAcao ? db.planosAcao.list() : []));

  const recarregarListas = () => {
    setGerencias(filterByGerencia(db.gerencias.list()));
    setAtivos(filterByGerencia(db.ativosSistemas.list()));
    setRiscos(filterByGerencia(db.riscos.list(), 'processo.id_gerencia'));
  };

  // Estados locais de controle de abas internas
  const [subTab, setSubTab] = useState('estrutura');

  // Estados para Cibersegurança e Proteção de Dados (Gesec)
  const [cyberFiltroClassificacao, setCyberFiltroClassificacao] = useState('todos');
  const [cyberFiltroCriticidade, setCyberFiltroCriticidade] = useState('todos');
  const [cyberSimuladorAtivoId, setCyberSimuladorAtivoId] = useState('');

  // Estados para Análise Quantitativa de Risco (ALE / SLE / Monte Carlo)
  const [quantProcId, setQuantProcId] = useState(processos[0]?.id_processo || '');
  const [quantAmeaca, setQuantAmeaca] = useState('ransomware');
  const [quantEf, setQuantEf] = useState(0.40);
  const [quantAro, setQuantAro] = useState(0.5);
  const [quantMitigacaoEficiencia, setQuantMitigacaoEficiencia] = useState(0.80);
  const [quantCustoDrp, setQuantCustoDrp] = useState(150000);
  const [monteCarloResults, setMonteCarloResults] = useState(null);

  // Estado para o Visualizador BIA Tree (Linhagem de Dependências)
  const [selectedBiaProcId, setSelectedBiaProcId] = useState(processos[0]?.id_processo || '');
  
  // Efeito para manter os seletores sincronizados com os processos disponíveis para o perfil logado
  useEffect(() => {
    if (processos.length > 0) {
      if (!selectedBiaProcId || !processos.some(p => p.id_processo === selectedBiaProcId)) {
        setSelectedBiaProcId(processos[0].id_processo);
      }
      if (!quantProcId || !processos.some(p => p.id_processo === quantProcId)) {
        setQuantProcId(processos[0].id_processo);
      }
    }
  }, [processos, selectedBiaProcId, quantProcId]);

  // Derivadas do processo selecionado no BIA Tree
  const selectedBiaProc = processos.find(p => p.id_processo === selectedBiaProcId);
  const biaContrato = selectedBiaProc ? db.contratos.list().find(c => c.id_contrato === selectedBiaProc.id_contrato_cliente || c.id_contrato === selectedBiaProc.id_contrato) : null;
  const biaAtivos = selectedBiaProc ? ativos.filter(a => a.id_gerencia === selectedBiaProc.id_gerencia) : [];
  const biaRiscos = selectedBiaProc ? riscos.filter(r => r.id_processo === selectedBiaProc.id_processo) : [];
  
  const biaAtivoCMDB = selectedBiaProc?.ativo_cmdb_id 
    ? db.ativosSistemas.list().find(a => a.id_ativo === selectedBiaProc.ativo_cmdb_id) 
    : null;
  const biaPco = selectedBiaProc 
    ? db.planosContinuidade.list().find(p => p.id_processo === selectedBiaProc.id_processo || p.processo?.id_processo === selectedBiaProc.id_processo) 
    : null;
  const biaAin = selectedBiaProc 
    ? (db.analiseImpacto?.list ? db.analiseImpacto.list().find(a => a.id_processo === selectedBiaProc.id_processo) : null)
    : null;

  const biaGargaloSLA = selectedBiaProc?.requer_drp && Number(selectedBiaProc.sla_tic) > Number(selectedBiaProc.sla_contrato_cliente);
  const biaPerdaHora = (biaContrato?.valor_faturamento || 0) * (selectedBiaProc?.criticidade === 'Crítica' ? 0.05 : selectedBiaProc?.criticidade === 'Alta' ? 0.02 : 0.005);

  const rodarSimulacaoMonteCarlo = () => {
    const proc = processos.find(p => p.id_processo === quantProcId);
    const contrato = db.contratos.list().find(c => c.id_contrato === proc?.id_contrato_cliente);
    
    const assetValue = (contrato?.valor_faturamento || 5000000);
    const sleNominal = assetValue * quantEf;
    const aleNominalSemDRP = sleNominal * quantAro;
    const aleNominalComDRP = aleNominalSemDRP * (1 - quantMitigacaoEficiencia);
    const economiaAnual = aleNominalSemDRP - aleNominalComDRP;
    const rosi = ((economiaAnual - quantCustoDrp) / (quantCustoDrp || 1)) * 100;

    const N = 1000;
    const perdasSemDRP = [];
    const perdasComDRP = [];

    for (let i = 0; i < N; i++) {
      const randAro = Math.max(0, quantAro + (Math.random() - 0.5) * quantAro * 0.6);
      const randEf = Math.min(1.0, Math.max(0.05, quantEf + (Math.random() - 0.5) * quantEf * 0.4));
      const randMit = Math.min(0.99, Math.max(0.2, quantMitigacaoEficiencia + (Math.random() - 0.5) * 0.2));

      const lossSem = assetValue * randEf * randAro;
      const lossCom = lossSem * (1 - randMit);

      perdasSemDRP.push(lossSem);
      perdasComDRP.push(lossCom);
    }

    perdasSemDRP.sort((a, b) => a - b);
    perdasComDRP.sort((a, b) => a - b);

    const getPercentile = (arr, p) => arr[Math.floor(arr.length * p)];

    setMonteCarloResults({
      assetValue,
      sleNominal,
      aleNominalSemDRP,
      aleNominalComDRP,
      economiaAnual,
      rosi,
      semDRP: {
        media: perdasSemDRP.reduce((a, b) => a + b, 0) / N,
        p50: getPercentile(perdasSemDRP, 0.50),
        p90: getPercentile(perdasSemDRP, 0.90),
        p95: getPercentile(perdasSemDRP, 0.95),
        p99: getPercentile(perdasSemDRP, 0.99)
      },
      comDRP: {
        media: perdasComDRP.reduce((a, b) => a + b, 0) / N,
        p50: getPercentile(perdasComDRP, 0.50),
        p90: getPercentile(perdasComDRP, 0.90),
        p95: getPercentile(perdasComDRP, 0.95),
        p99: getPercentile(perdasComDRP, 0.99)
      }
    });
  };

  // Estados dos formulários
  const [showGerenciaForm, setShowGerenciaForm] = useState(false);
  const [showRiscoForm, setShowRiscoForm] = useState(false);
  const [showAtivoForm, setShowAtivoForm] = useState(false);
  
  const [notification, setNotification] = useState(null);
  // Bug 2 Fix: estado para tooltip da matriz de riscos
  const [hoverRisco, setHoverRisco] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

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
    recarregarListas();
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

    recarregarListas();
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
    recarregarListas();
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
        
        recarregarListas();
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
      recarregarListas();
      setNotification({ type: 'info', text: 'Risco removido da análise.' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Subnavegação Interna */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold flex-wrap">
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
          Riscos Operacionais
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
        <button 
          onClick={() => setSubTab('ciberseg')}
          className={`pb-3 transition-all flex items-center gap-1.5 ${subTab === 'ciberseg' ? 'border-b-2 border-rose-600 dark:border-rose-400 text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
        >
          🔒 Proteção de Dados & Cibersegurança (Gesec)
        </button>
        <button 
          onClick={() => setSubTab('quantitativo')}
          className={`pb-3 transition-all flex items-center gap-1.5 ${subTab === 'quantitativo' ? 'border-b-2 border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
        >
          📊 Risco Quantitativo (Monte Carlo / ALE)
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
            {isAdmin() && (
              <button 
                onClick={() => { setShowGerenciaForm(true); setNotification(null); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Cadastrar Gerência (GeXXX)
              </button>
            )}
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
            {canCreate() && (
              <button 
                onClick={() => { setShowRiscoForm(true); setNotification(null); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Cadastrar Risco Operacional
              </button>
            )}
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

          {/* Tooltip flutuante da Matriz de Riscos */}
          {hoverRisco && (
            <div
              className="fixed z-[9999] pointer-events-none"
              style={{ left: hoverPos.x + 16, top: hoverPos.y - 10 }}
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 w-72 text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">{hoverRisco.id_risco}</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-white mb-1.5">{hoverRisco.nome}</p>
                {hoverRisco.descricao && <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">{hoverRisco.descricao}</p>}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-rose-50 dark:bg-rose-950/40 rounded-lg p-2">
                    <p className="text-[9px] font-bold text-rose-500 uppercase mb-1">Risco Inerente</p>
                    <p className="text-slate-700 dark:text-slate-300">Prob: <strong>{hoverRisco.probabilidade}</strong></p>
                    <p className="text-slate-700 dark:text-slate-300">Imp: <strong>{hoverRisco.impacto}</strong></p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-lg p-2">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase mb-1">Risco Residual</p>
                    <p className="text-slate-700 dark:text-slate-300">Prob: <strong>{hoverRisco.risco_residual_prob || 'Rara'}</strong></p>
                    <p className="text-slate-700 dark:text-slate-300">Imp: <strong>{hoverRisco.risco_residual_imp || 'Insignificante'}</strong></p>
                  </div>
                </div>
                {hoverRisco.id_plano_acao && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] text-slate-400">Plano de Ação: <strong className="text-emerald-600 dark:text-emerald-400">{hoverRisco.id_plano_acao}</strong></p>
                  </div>
                )}
              </div>
            </div>
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
                    <tr
                      key={r.id_risco}
                      className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-colors cursor-default"
                      onMouseEnter={(e) => { setHoverRisco(r); setHoverPos({ x: e.clientX, y: e.clientY }); }}
                      onMouseMove={(e) => setHoverPos({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoverRisco(null)}
                    >
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
                      {canEdit(r.processo?.id_gerencia) && (
                        <button 
                          onClick={() => handleDeleteRisco(r.id_risco)}
                          className="text-slate-450 hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/25 transition-all"
                          title="Deletar risco"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
            {canCreate() && (
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
            )}
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
              <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4 min-w-[1100px] py-4">
                
                {/* 1. NÓ DO PROCESSO CRÍTICO */}
                <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-l-4 border-l-indigo-600 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded font-black uppercase">1. Processo BIA</span>
                    <h4 className="font-extrabold text-slate-850 dark:text-white text-xs mt-1 truncate" title={selectedBiaProc.nome}>{selectedBiaProc.nome}</h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed line-clamp-2">{selectedBiaProc.descricao || 'Sem descrição cadastrada.'}</p>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-2 text-[9.5px] text-slate-500 space-y-1">
                    <div>Código: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedBiaProc.id_processo}</span></div>
                    <div>Criticidade BIA: <span className={`font-black ${selectedBiaProc.criticidade === 'Crítica' ? 'text-rose-500' : selectedBiaProc.criticidade === 'Alta' ? 'text-orange-500' : 'text-slate-550'}`}>{selectedBiaProc.criticidade}</span></div>
                    <div>Gerência: <span className="font-bold">{selectedBiaProc.id_gerencia}</span></div>
                  </div>
                </div>

                {/* SETA 1 */}
                <div className="flex items-center justify-center text-slate-350 dark:text-slate-650 font-black text-lg select-none">➔</div>

                {/* 2. NÓ DO CONTRATO & PERDAS */}
                <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-l-4 border-l-teal-500 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <span className="text-[8px] bg-teal-50 dark:bg-teal-950/40 text-teal-650 dark:text-teal-400 px-2 py-0.5 rounded font-black uppercase">2. Contrato & Perdas</span>
                    {biaContrato ? (
                      <>
                        <h4 className="font-extrabold text-slate-850 dark:text-white text-xs mt-1 truncate" title={biaContrato.nome}>{biaContrato.nome}</h4>
                        <p className="text-[9.5px] text-teal-600 dark:text-teal-400 font-bold">R$ {biaContrato.valor_faturamento?.toLocaleString('pt-BR')} / ano</p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-bold text-slate-400 text-xs mt-1">Apoio Interno</h4>
                        <p className="text-[9.5px] text-slate-400 italic">Sem contrato direto de cliente.</p>
                      </>
                    )}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-2 text-[9.5px] text-slate-500 space-y-1">
                    <div>Perda Est./Hora: <strong className="text-rose-600 dark:text-rose-400">R$ {biaPerdaHora.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong></div>
                    <div>Perda Est./Dia: <strong className="text-rose-600 dark:text-rose-400">R$ {(biaPerdaHora * 24).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong></div>
                  </div>
                </div>

                {/* SETA 2 */}
                <div className="flex items-center justify-center text-slate-350 dark:text-slate-650 font-black text-lg select-none">➔</div>

                {/* 3. NÓ DE ATIVO CMDB */}
                <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-l-4 border-l-purple-500 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <span className="text-[8px] bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 px-2 py-0.5 rounded font-black uppercase">3. Ativo CMDB (TI)</span>
                    {biaAtivoCMDB ? (
                      <>
                        <h4 className="font-extrabold text-slate-850 dark:text-white text-xs mt-1 truncate" title={biaAtivoCMDB.nome}>{biaAtivoCMDB.nome}</h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                            biaAtivoCMDB.criticidade_contrato === 'C0' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                            biaAtivoCMDB.criticidade_contrato === 'C1' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            Crit. Contrato: {biaAtivoCMDB.criticidade_contrato || 'C3'}
                          </span>
                          <span className="text-[8px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded font-bold uppercase">
                            {biaAtivoCMDB.tipo}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="font-bold text-slate-400 text-xs mt-1">Sem Ativo Vinculado</h4>
                        <p className="text-[9.5px] text-slate-400 italic">Processo não exige DRP de TI.</p>
                      </>
                    )}
                  </div>
                  {biaAtivoCMDB && (
                    <div className="border-t border-slate-100 dark:border-slate-850 pt-2 text-[9.5px] text-slate-500 space-y-0.5">
                      <div>Redundância: <span className="font-bold">{biaAtivoCMDB.tipo_redundancia}</span></div>
                      <div>Status: <span className="font-bold text-emerald-600">{biaAtivoCMDB.status_ativo}</span></div>
                    </div>
                  )}
                </div>

                {/* SETA 3 */}
                <div className="flex items-center justify-center text-slate-350 dark:text-slate-650 font-black text-lg select-none">➔</div>

                {/* 4. NÓ DE ESTRATÉGIA DE DR & SLAS */}
                <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-l-4 border-l-amber-500 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <span className="text-[8px] bg-amber-50 dark:bg-amber-950/40 text-amber-655 dark:text-amber-450 px-2 py-0.5 rounded font-black uppercase">4. Estratégia DR & SLAs</span>
                    {selectedBiaProc.requer_drp ? (
                      <>
                        <h4 className="font-extrabold text-slate-850 dark:text-white text-xs mt-1 truncate" title={selectedBiaProc.estrategia_drp}>
                          {selectedBiaProc.estrategia_drp || 'Não informada'}
                        </h4>
                        <div className="space-y-0.5 text-[9.5px] text-slate-500">
                          <div>SLA Contrato: <strong className="text-slate-700 dark:text-slate-300">{selectedBiaProc.sla_contrato_cliente} min</strong></div>
                          <div>SLA TIC: <strong className={biaGargaloSLA ? 'text-rose-500 font-black animate-pulse' : 'text-emerald-600 font-bold'}>{selectedBiaProc.sla_tic} min</strong></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="font-bold text-slate-400 text-xs mt-1">Dispensa DRP</h4>
                        <p className="text-[9.5px] text-slate-400 italic">Não exige infraestrutura de contingência.</p>
                      </>
                    )}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-2 text-[9.5px]">
                    {selectedBiaProc.requer_drp && biaGargaloSLA ? (
                      <span className="text-[8.5px] bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-black uppercase animate-pulse inline-block">
                        ⚠️ Gargalo de SLA Detectado
                      </span>
                    ) : selectedBiaProc.requer_drp ? (
                      <span className="text-[8.5px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-black uppercase inline-block">
                        ✅ SLA TIC Compatível
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </div>
                </div>

                {/* SETA 4 */}
                <div className="flex items-center justify-center text-slate-350 dark:text-slate-650 font-black text-lg select-none">➔</div>

                {/* 5. NÓ DE PLANO PCO/PRD & WORKFLOW */}
                <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-l-4 border-l-emerald-500 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 px-2 py-0.5 rounded font-black uppercase">5. Plano PCO/PRD & Status</span>
                    {biaPco ? (
                      <>
                        <h4 className="font-extrabold text-slate-850 dark:text-white text-xs mt-1">{biaPco.id_pco} (v{biaPco.versao})</h4>
                        <span className={`inline-block px-2 py-0.5 rounded text-[8.5px] font-black uppercase ${
                          biaPco.status_aprovacao === 'Vigente' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200' :
                          'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200'
                        }`}>
                          {biaPco.status_aprovacao}
                        </span>
                      </>
                    ) : (
                      <>
                        <h4 className="font-bold text-slate-400 text-xs mt-1">Plano Pendente</h4>
                        <p className="text-[9.5px] text-slate-400 italic">PCO/PRD ainda não elaborado.</p>
                      </>
                    )}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-850 pt-2 text-[9.5px] text-slate-500">
                    {biaPco?.parecer_tic ? (
                      <div className="truncate text-indigo-600 dark:text-indigo-400 font-semibold" title={biaPco.parecer_tic}>
                        Aval TIC: {biaPco.parecer_tic.substring(0, 30)}...
                      </div>
                    ) : (
                      <div>Parecer TIC: <span className="text-slate-400 italic">Aguardando</span></div>
                    )}
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

      {/* SUB-ABA 5: PROTEÇÃO DE DADOS & CIBERSEGURANÇA (GESEC / ISO 27001 & LGPD) */}
      {subTab === 'ciberseg' && (() => {
        const todosAtivosCyber = db.ativosSistemas.list();
        
        // Filtros
        const ativosFiltrados = todosAtivosCyber.filter(a => {
          const matchClass = cyberFiltroClassificacao === 'todos' || 
            (cyberFiltroClassificacao === 'confidencial' && (a.criticidade_contrato === 'C0' || a.id_ativo === 'ATV-SYS01' || a.id_ativo === 'ATV-SYS03')) ||
            (cyberFiltroClassificacao === 'restrito' && a.criticidade_contrato === 'C1') ||
            (cyberFiltroClassificacao === 'interno' && (a.criticidade_contrato === 'C2' || a.criticidade_contrato === 'C3'));
          
          const matchCrit = cyberFiltroCriticidade === 'todos' || a.criticidade_contrato === cyberFiltroCriticidade;
          return matchClass && matchCrit;
        });

        // KPIs
        const totalConfidenciais = todosAtivosCyber.filter(a => a.criticidade_contrato === 'C0' || a.id_ativo === 'ATV-SYS01' || a.id_ativo === 'ATV-SYS03').length;
        const totalC0C1 = todosAtivosCyber.filter(a => a.criticidade_contrato === 'C0' || a.criticidade_contrato === 'C1').length;
        const totalRedundancia = todosAtivosCyber.filter(a => a.tipo_redundancia === 'geografica' || a.tipo_redundancia === 'ativa' || a.criticidade_contrato === 'C0').length;
        const scoreLGPD = Math.round((totalRedundancia / (todosAtivosCyber.length || 1)) * 100);

        const ativoSimulacao = todosAtivosCyber.find(a => a.id_ativo === cyberSimuladorAtivoId);
        const processoSimulacao = ativoSimulacao ? db.processosCriticos.list().find(p => p.ativo_cmdb_id === ativoSimulacao.id_ativo) : null;
        const contratoSimulacao = processoSimulacao ? db.contratos.list().find(c => c.id_contrato === processoSimulacao.id_contrato_cliente) : null;

        // Cálculo de Risco LGPD (Multa 2% faturamento até R$ 50M)
        const multaLGPD = contratoSimulacao ? Math.min(50000000, (contratoSimulacao.valor_faturamento || 10000000) * 0.02) : 200000;

        return (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header da Aba Gesec */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                    Gesec — Cibersegurança & Privacidade
                  </span>
                  <span className="text-slate-400 text-xs">• Responsável: Diego Ferreira</span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  🔒 Painel de Proteção de Dados LGPD & Resiliência Cibernética (ISO 27001)
                </h3>
                <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                  Monitoramento contínuo de ativos CMDB com dados confidenciais/pessoais, redundância geográfica, criptografia de backup e mitigação de vazamentos em conformidade com a LGPD (Lei 13.709/2018), ISO 27001 (SGSI), ISO 27031:2023 e NIST CSF.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap text-[10px] font-bold">
                <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">ISO 27001</span>
                <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">ISO 27031</span>
                <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">NIST CSF</span>
                <span className="bg-rose-950/60 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg">LGPD</span>
              </div>
            </div>

            {/* Cards KPI Gesec */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ativos Confidenciais (LGPD)</span>
                <div className="flex justify-between items-baseline">
                  <strong className="text-2xl font-black text-rose-600 dark:text-rose-400">{totalConfidenciais}</strong>
                  <span className="text-[10px] font-bold text-slate-400">Dados Pessoais / PI</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Sistemas com tratamento de dados sensíveis</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ativos C0 / C1 CMDB</span>
                <div className="flex justify-between items-baseline">
                  <strong className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalC0C1}</strong>
                  <span className="text-[10px] font-bold text-slate-400">Alta Criticidade</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Exigem criptografia & backup imutável</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Redundância Geográfica</span>
                <div className="flex justify-between items-baseline">
                  <strong className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalRedundancia}</strong>
                  <span className="text-[10px] font-bold text-slate-400">Multi-Region</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Protegidos contra falha de Data Center</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Índice Conformidade LGPD</span>
                <div className="flex justify-between items-baseline">
                  <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{scoreLGPD}%</strong>
                  <span className="text-[10px] font-bold text-emerald-500">Adequado</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Controles de criptografia & privacidade</p>
              </div>
            </div>

            {/* Filtros de Inventário Cyber */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Filtrar por:</span>
                
                <select 
                  value={cyberFiltroClassificacao}
                  onChange={(e) => setCyberFiltroClassificacao(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-rose-500"
                >
                  <option value="todos">Todas as Classificações LGPD</option>
                  <option value="confidencial">Confidencial (Dados Pessoais / PII)</option>
                  <option value="restrito">Restrito (Dados Negócio)</option>
                  <option value="interno">Uso Interno</option>
                </select>

                <select 
                  value={cyberFiltroCriticidade}
                  onChange={(e) => setCyberFiltroCriticidade(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-rose-500"
                >
                  <option value="todos">Todas as Criticidades CMDB</option>
                  <option value="C0">C0 - Crítico Máximo</option>
                  <option value="C1">C1 - Alta Criticidade</option>
                  <option value="C2">C2 - Média Criticidade</option>
                  <option value="C3">C3 - Baixa Criticidade</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-400 font-medium">Exibindo {ativosFiltrados.length} de {todosAtivosCyber.length} ativos CMDB</span>
            </div>

            {/* Tabela de Ativos e Governança de Proteção de Dados */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 flex justify-between items-center">
                <h4 className="font-extrabold text-slate-850 dark:text-white text-xs uppercase tracking-wider">
                  Matriz de Ativos CMDB & Controles de Segurança (Gesec)
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">ISO 27001 Controls & LGPD §46</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-850 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Ativo CMDB & Gerência</th>
                      <th className="p-3.5">Criticidade CMDB</th>
                      <th className="p-3.5">Classificação LGPD</th>
                      <th className="p-3.5">Controles de Segurança Cibernética</th>
                      <th className="p-3.5 text-center">Conformidade ISO 27001</th>
                      <th className="p-3.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {ativosFiltrados.map((atv) => {
                      const isConfidencial = atv.criticidade_contrato === 'C0' || atv.id_ativo === 'ATV-SYS01' || atv.id_ativo === 'ATV-SYS03';
                      const isC0C1 = atv.criticidade_contrato === 'C0' || atv.criticidade_contrato === 'C1';

                      return (
                        <tr key={atv.id_ativo} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                          
                          {/* Nome e Gerência */}
                          <td className="p-3.5">
                            <strong className="text-slate-900 dark:text-white block font-bold">{atv.nome}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">{atv.id_ativo} • {atv.tipo}</span>
                          </td>

                          {/* Criticidade CMDB */}
                          <td className="p-3.5">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                              atv.criticidade_contrato === 'C0' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                              atv.criticidade_contrato === 'C1' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {atv.criticidade_contrato || 'C0'}
                            </span>
                          </td>

                          {/* Classificação LGPD */}
                          <td className="p-3.5">
                            {isConfidencial ? (
                              <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-rose-300 dark:border-rose-800">
                                🔒 CONFIDENCIAL / DADOS PESSOAIS
                              </span>
                            ) : isC0C1 ? (
                              <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-amber-300 dark:border-amber-800">
                                🔑 RESTRITO (DADOS NEGÓCIO)
                              </span>
                            ) : (
                              <span className="bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                                📁 USO INTERNO
                              </span>
                            )}
                          </td>

                          {/* Controles de Cibersegurança */}
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1 text-[9px]">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                                🔒 AES-256 (Repouso)
                              </span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                                🌐 TLS 1.3 (Trânsito)
                              </span>
                              {isC0C1 && (
                                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                                  🛡️ Backup Imutável
                                </span>
                              )}
                              {atv.tipo_redundancia && (
                                <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                                  Multi-Region ({atv.tipo_redundancia})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status ISO 27001 */}
                          <td className="p-3.5 text-center">
                            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold text-[9px] px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                              ✅ CONFORME ISO 27001
                            </span>
                          </td>

                          {/* Ação */}
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setCyberSimuladorAtivoId(atv.id_ativo)}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-colors shadow-2xs"
                            >
                              🚨 Simular Vazamento LGPD
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL / CARD DE SIMULAÇÃO DE VAZAMENTO DE DADOS & IMPACTO REGULATÓRIO */}
            {ativoSimulacao && (
              <div className="bg-slate-900 border-2 border-rose-500/50 p-6 rounded-2xl text-white space-y-4 shadow-2xl animate-scale-up">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚨</span>
                    <div>
                      <h4 className="font-black text-rose-400 text-sm uppercase">
                        Diagnóstico de Impacto por Vazamento de Dados (LGPD §52)
                      </h4>
                      <p className="text-[11px] text-slate-400">Ativo CMDB: <strong>{ativoSimulacao.nome}</strong> ({ativoSimulacao.id_ativo})</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCyberSimuladorAtivoId('')}
                    className="text-slate-400 hover:text-white font-bold text-xs"
                  >
                    ✕ Fechar Diagnóstico
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Risco de Multa LGPD Estima</span>
                    <strong className="text-xl font-black text-rose-400 mt-1 block">
                      R$ {multaLGPD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-1">Até 2% do faturamento (Lei 13.709 §52)</span>
                  </div>

                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Classificação da Informação</span>
                    <strong className="text-sm font-bold text-amber-300 mt-1 block uppercase">
                      CONFIDENCIAL / DADOS DE CLIENTES
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-1">Exige notificação imediata à ANPD em 48h</span>
                  </div>

                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Status da Criptografia & Contingência</span>
                    <strong className="text-sm font-bold text-emerald-400 mt-1 block">
                      AES-256 OK • BACKUP IMUTÁVEL OK
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-1">Mitigador atenuante perante autoridade reguladora</span>
                  </div>
                </div>

                <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-2 text-xs">
                  <h5 className="font-bold text-rose-300 uppercase text-[11px]">Plano de Resposta a Incidentes Cibernéticos (NIST CSF Respond):</h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    <li><strong>Contenção Imediata:</strong> Isolar credenciais e revogar tokens de acesso à API em menos de 15 minutos.</li>
                    <li><strong>Notificação ANPD & DPO:</strong> Emitir comunicado formal ao encarregado de dados (DPO) e à autoridade em até 48h.</li>
                    <li><strong>Restauração por Backup Imutável:</strong> Acionar réplica geograficamente isolada e validar hash de integridade SHA-256.</li>
                  </ul>
                </div>
              </div>
            )}

          </div>
        );
      })()}

      {/* SUB-ABA 6: ANÁLISE QUANTITATIVA DE RISCO FINANCEIRO (MONTE CARLO / ALE / SLE) */}
      {subTab === 'quantitativo' && (() => {
        const procSelecionado = processos.find(p => p.id_processo === quantProcId);
        const contratoProc = procSelecionado ? db.contratos.list().find(c => c.id_contrato === procSelecionado.id_contrato_cliente) : null;
        const assetValueCalc = contratoProc?.valor_faturamento || 5000000;
        const sleCalc = assetValueCalc * quantEf;
        const aleCalcSemDRP = sleCalc * quantAro;
        const aleCalcComDRP = aleCalcSemDRP * (1 - quantMitigacaoEficiencia);
        const economiaCalc = aleCalcSemDRP - aleCalcComDRP;
        const rosiCalc = ((economiaCalc - quantCustoDrp) / (quantCustoDrp || 1)) * 100;

        return (
          <div className="space-y-6 animate-fade-in text-xs">
            
            {/* Header da Aba Quantitativa */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                    Modelagem Quantitativa FAIR / ISO 27005
                  </span>
                  <span className="text-slate-400 text-xs">• 1.000 Iterações Estocásticas</span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  📊 Simulador de Análise Quantitativa de Risco Financeiro (ALE / SLE / ROSI)
                </h3>
                <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                  Calcule a expectativa de perdas financeiras anuais (ALE), exposição por único incidente (SLE) e a justificativa econômica do investimento em DRP/PCO (ROSI) através de simulações de Monte Carlo.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap text-[10px] font-bold">
                <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">FAIR Framework</span>
                <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">ISO 27005</span>
                <span className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg">Monte Carlo 1.000x</span>
              </div>
            </div>

            {/* Painel de Controles da Simulação */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h4 className="font-extrabold text-slate-850 dark:text-white text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                1. Parâmetros de Entrada & Ameaça
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Seletor de Processo */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Processo sob Análise *</label>
                  <select 
                    value={quantProcId}
                    onChange={(e) => setQuantProcId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 font-bold text-slate-850 dark:text-slate-200 focus:outline-emerald-500"
                  >
                    {processos.map(p => (
                      <option key={p.id_processo} value={p.id_processo}>{p.id_processo} - {p.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Preset de Ameaça */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Preset de Ameaça de Risco</label>
                  <select 
                    value={quantAmeaca}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuantAmeaca(val);
                      if (val === 'ransomware') { setQuantEf(0.45); setQuantAro(0.5); }
                      else if (val === 'outage_dc') { setQuantEf(0.30); setQuantAro(0.2); }
                      else if (val === 'vendor_failure') { setQuantEf(0.25); setQuantAro(0.3); }
                      else if (val === 'sinistro') { setQuantEf(0.70); setQuantAro(0.05); }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 font-semibold text-slate-850 dark:text-slate-200 focus:outline-emerald-500"
                  >
                    <option value="ransomware">🛡️ Ransomware / Ciberataque (EF 45%, ARO 0.5/ano)</option>
                    <option value="outage_dc">⚡ Queda Data Center / Nuvem (EF 30%, ARO 0.2/ano)</option>
                    <option value="vendor_failure">🏢 Falha de Fornecedor Crítico (EF 25%, ARO 0.3/ano)</option>
                    <option value="sinistro">🔥 Sinistro Físico / Incêndio (EF 70%, ARO 0.05/ano)</option>
                  </select>
                </div>

                {/* Fator de Exposição (EF) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Fator de Exposição (EF: {(quantEf * 100).toFixed(0)}%)</label>
                  <input 
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={quantEf}
                    onChange={(e) => setQuantEf(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer mt-2"
                  />
                  <span className="text-[9px] text-slate-400 block">% do valor do ativo perdido por evento</span>
                </div>

                {/* Frequência Anual (ARO) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Frequência Anual de Ocorrência (ARO)</label>
                  <input 
                    type="number"
                    step="0.05"
                    min="0.01"
                    max="5.0"
                    value={quantAro}
                    onChange={(e) => setQuantAro(parseFloat(e.target.value) || 0.1)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 font-bold text-slate-850 dark:text-slate-200"
                  />
                  <span className="text-[9px] text-slate-400 block">Ex: 0.5 = 1 ocorrência a cada 2 anos</span>
                </div>

                {/* Eficiência da Mitigação DRP */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Eficiência Mitigatória do DRP ({(quantMitigacaoEficiencia * 100).toFixed(0)}%)</label>
                  <input 
                    type="range"
                    min="0.10"
                    max="0.99"
                    step="0.05"
                    value={quantMitigacaoEficiencia}
                    onChange={(e) => setQuantMitigacaoEficiencia(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer mt-2"
                  />
                  <span className="text-[9px] text-slate-400 block">% do dano financeiro absorvido pela contingência</span>
                </div>

                {/* Custo Anual da Contingência */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Custo Anual do DRP / PCO (R$)</label>
                  <input 
                    type="number"
                    step="10000"
                    value={quantCustoDrp}
                    onChange={(e) => setQuantCustoDrp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 font-bold text-slate-850 dark:text-slate-200"
                  />
                  <span className="text-[9px] text-slate-400 block">Orçamento anual de infraestrutura de DR</span>
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={rodarSimulacaoMonteCarlo}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-xl transition-all shadow-md text-xs flex items-center gap-2 cursor-pointer"
                >
                  🎲 Executar 1.000 Simulações de Monte Carlo
                </button>
              </div>
            </div>

            {/* Painel de Resultados Nominal FAIR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Valor do Ativo em Risco (AV)</span>
                <strong className="text-xl font-black text-slate-900 dark:text-white block">
                  R$ {assetValueCalc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <span className="text-[9px] text-slate-400 block">Faturamento anual do contrato</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Single Loss Expectancy (SLE)</span>
                <strong className="text-xl font-black text-rose-600 dark:text-rose-400 block">
                  R$ {sleCalc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <span className="text-[9px] text-slate-400 block">Perda financeira por evento único (AV x EF)</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ALE Sem DRP (Anual Esperado)</span>
                <strong className="text-xl font-black text-amber-600 dark:text-amber-400 block">
                  R$ {aleCalcSemDRP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <span className="text-[9px] text-slate-400 block">Perda anual projetada sem contingência</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Retorno do Investimento (ROSI)</span>
                <strong className={`text-xl font-black block ${rosiCalc >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {rosiCalc.toFixed(1)}% ROSI
                </strong>
                <span className="text-[9px] text-slate-400 block">Justificativa financeira do DRP</span>
              </div>
            </div>

            {/* RESULTADOS DA SIMULAÇÃO DE MONTE CARLO (1.000 ITERAÇÕES) */}
            {monteCarloResults && (
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-6 shadow-2xl animate-scale-up">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎲</span>
                    <div>
                      <h4 className="font-black text-emerald-400 text-sm uppercase">
                        Distribuição Estocástica de Monte Carlo (1.000 Iterações)
                      </h4>
                      <p className="text-[10px] text-slate-400">Processo: <strong>{procSelecionado?.nome}</strong> • Ameaça: <strong>{quantAmeaca.toUpperCase()}</strong></p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                    Economia Estimada: R$ {monteCarloResults.economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800 text-[10px] font-black uppercase text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="p-3">Cenário de Confiança</th>
                        <th className="p-3">Sem Contingência DRP (Perda R$)</th>
                        <th className="p-3">Com Contingência DRP (Perda R$)</th>
                        <th className="p-3 text-right">Redução do Risco (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs">
                      <tr className="hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-200">Média Estocástica (Expected Loss)</td>
                        <td className="p-3 text-amber-400 font-bold">R$ {monteCarloResults.semDRP.media.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-emerald-400 font-bold">R$ {monteCarloResults.comDRP.media.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right font-black text-emerald-400">-{(quantMitigacaoEficiencia * 100).toFixed(0)}%</td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-200">P50 (Cenário Provável / Mediana)</td>
                        <td className="p-3 font-semibold">R$ {monteCarloResults.semDRP.p50.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 font-semibold text-emerald-300">R$ {monteCarloResults.comDRP.p50.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-emerald-400">-{(quantMitigacaoEficiencia * 100).toFixed(0)}%</td>
                      </tr>
                      <tr className="hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-200">P90 (Cenário Severo)</td>
                        <td className="p-3 font-semibold text-orange-400">R$ {monteCarloResults.semDRP.p90.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 font-semibold text-emerald-300">R$ {monteCarloResults.comDRP.p90.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-emerald-400">-{(quantMitigacaoEficiencia * 100).toFixed(0)}%</td>
                      </tr>
                      <tr className="hover:bg-slate-800/50 bg-rose-950/20">
                        <td className="p-3 font-bold text-rose-400">P95 — Value at Risk (VaR 95%)</td>
                        <td className="p-3 font-black text-rose-400">R$ {monteCarloResults.semDRP.p95.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 font-black text-emerald-400">R$ {monteCarloResults.comDRP.p95.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right font-black text-emerald-400">-{(quantMitigacaoEficiencia * 100).toFixed(0)}%</td>
                      </tr>
                      <tr className="hover:bg-slate-800/50 bg-rose-950/40">
                        <td className="p-3 font-bold text-rose-300">P99 — Catástrofe Extrema (Tail Risk)</td>
                        <td className="p-3 font-black text-rose-300">R$ {monteCarloResults.semDRP.p99.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 font-black text-emerald-300">R$ {monteCarloResults.comDRP.p99.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right font-black text-emerald-400">-{(quantMitigacaoEficiencia * 100).toFixed(0)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1 text-slate-300 text-[11px]">
                  <h5 className="font-bold text-emerald-400 uppercase text-[11px]">Conclusão de Governança Quantitativa:</h5>
                  <p>
                    Com um orçamento anual de <strong>R$ {quantCustoDrp.toLocaleString('pt-BR')}</strong> no DRP/PCO, a organização reduz o <strong>Value at Risk (P95)</strong> de R$ {monteCarloResults.semDRP.p95.toLocaleString('pt-BR')} para R$ {monteCarloResults.comDRP.p95.toLocaleString('pt-BR')}, gerando um <strong>ROSI de {monteCarloResults.rosi.toFixed(1)}%</strong>. O investimento é plenamente justificável perante a diretoria executiva e conselho de administração.
                  </p>
                </div>
              </div>
            )}

          </div>
        );
      })()}

    </div>
  );
}
