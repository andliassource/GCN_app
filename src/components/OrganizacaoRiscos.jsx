import React, { useState } from 'react';
import { ShieldAlert, Plus, Trash2, Network, Shield, AlertTriangle, Layers, Laptop, Radio, Database } from 'lucide-react';

export default function OrganizacaoRiscos({ db }) {
  const [diretorias] = useState(db.diretorias.list());
  const [gerencias, setGerencias] = useState(db.gerencias.list());
  const [ativos, setAtivos] = useState(db.ativosSistemas.list());
  const [riscos, setRiscos] = useState(db.riscos.list());
  const [processos] = useState(db.processosCriticos.list());

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
    id_processo: ''
  });

  // Form Fields - Ativo/Sistema
  const [ativoForm, setAtivoForm] = useState({
    nome: '',
    tipo: 'Sistema',
    criticidade: 'Média'
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

    db.riscos.create(riscoForm);
    setRiscos(db.riscos.list());
    setShowRiscoForm(false);
    setRiscoForm({ nome: '', descricao: '', probabilidade: 'Provável', impacto: 'Moderado', id_processo: '' });
    setNotification({ type: 'success', text: `Risco cadastrado e mapeado no processo!` });
  };

  // Submissão de Ativo
  const handleAtivoSubmit = (e) => {
    e.preventDefault();
    if (!ativoForm.nome) return;

    db.ativosSistemas.create(ativoForm);
    setAtivos(db.ativosSistemas.list());
    setShowAtivoForm(false);
    setAtivoForm({ nome: '', tipo: 'Sistema', criticidade: 'Média' });
    setNotification({ type: 'success', text: `Ativo de tecnologia cadastrado!` });
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
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Novo Cadastro de Risco / Ameaça</h4>
                <button type="button" onClick={() => setShowRiscoForm(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Probabilidade *</label>
                    <select 
                      value={riscoForm.probabilidade} 
                      onChange={(e) => setRiscoForm({...riscoForm, probabilidade: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                    >
                      <option value="Rara">Rara</option>
                      <option value="Pouco Provável">Pouco Provável</option>
                      <option value="Provável">Provável</option>
                      <option value="Muito Provável">Muito Provável</option>
                      <option value="Quase Certa">Quase Certa</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Impacto *</label>
                    <select 
                      value={riscoForm.impacto} 
                      onChange={(e) => setRiscoForm({...riscoForm, impacto: e.target.value})} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-350 focus:outline-indigo-500"
                    >
                      <option value="Insignificante">Insignificante</option>
                      <option value="Menor">Menor</option>
                      <option value="Moderado">Moderado</option>
                      <option value="Maior">Maior</option>
                      <option value="Catastrófico">Catastrófico</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1 md:col-span-3">
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
                  <th className="px-6 py-3 text-center">Probabilidade / Impacto</th>
                  <th className="px-6 py-3">Processo Vinculado</th>
                  <th className="px-6 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {riscos.map(r => (
                  <tr key={r.id_risco} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[10px] text-indigo-500 font-bold uppercase">{r.id_risco}</span>
                      <p className="font-bold text-slate-800 dark:text-white mt-0.5">{r.nome}</p>
                    </td>
                    <td className="px-6 py-4 max-w-sm text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {r.descricao || 'Sem descrição cadastrada'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
                        {r.probabilidade} x {r.impacto}
                      </span>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: ATIVOS E SISTEMAS */}
      {subTab === 'ativos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-850 dark:text-white">Inventário de Ativos de Tecnologia e Links</h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-xl leading-relaxed">
                Mapeamento de ativos críticos como Links de Telecom (Embratel), Bancos de Dados e servidores em nuvem. Os ativos devem estar associados aos processos na AIN.
              </p>
            </div>
            <button 
              onClick={() => { setShowAtivoForm(true); setNotification(null); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Cadastrar Ativo
            </button>
          </div>

          {/* Form Ativo */}
          {showAtivoForm && (
            <form onSubmit={handleAtivoSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Novo Cadastro de Ativo de Tecnologia</h4>
                <button type="button" onClick={() => setShowAtivoForm(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
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
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowAtivoForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Salvar Ativo</button>
              </div>
            </form>
          )}

          {/* Grid de Ativos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              return (
                <div key={at.id_ativo} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-850">
                      {getIcon(at.tipo)}
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{at.id_ativo} ({at.tipo})</span>
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs mt-0.5">{at.nome}</h4>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border ${getCritColor(at.criticidade)}`}>
                    {at.criticidade}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
