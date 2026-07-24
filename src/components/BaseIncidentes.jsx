import React, { useState } from 'react';
import { Plus, Trash2, Calendar, AlertOctagon, ShieldAlert, CheckCircle2, Search, Filter, Clock, Zap, BookOpen, Target, ChevronRight } from 'lucide-react';

export default function BaseIncidentes({ db }) {
  const [incidentes, setIncidentes] = useState(db.incidentes.list());
  const [processos] = useState(db.processosCriticos.list());
  const [planosPCO] = useState(db.planosContinuidade.list());
  const [licoes, setLicoes] = useState(db.licoesAprendidas.list());
  const [planosAcao, setPlanosAcao] = useState(db.planosAcao.list());

  // Abas do Módulo
  const [tab, setTab] = useState('incidentes'); // 'incidentes', 'licoes', 'acoes'

  // Estados locais
  const [showForm, setShowForm] = useState(false);
  const [showLicaoForm, setShowLicaoForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterImpacto, setFilterImpacto] = useState('Todos');
  const [notification, setNotification] = useState(null);

  // Form Fields Incidente
  const [formData, setFormData] = useState({
    data_hora: '',
    local: '',
    descricao: '',
    tipo_incidente: '',
    impacto: 'Baixo',
    id_processo: '',
    rto_real_minutos: '',
    id_pco_acionado: '',
    medidas_mitigacao: '',
    resultado_resposta: ''
  });

  // Form Fields Lição Aprendida
  const [licaoData, setLicaoData] = useState({
    id_incidente: '',
    descricao: '',
    categoria: 'Técnica',
    recomendacao: '',
    impacto_no_risco: 'elevou_probabilidade'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.data_hora || !formData.local || !formData.descricao || !formData.tipo_incidente || !formData.id_processo) {
      setNotification({ type: 'error', text: 'Preencha todos os campos obrigatórios (*). Processo é obrigatório.' });
      return;
    }

    const novoIncidente = db.incidentes.create(formData);

    // Se o RTO foi ultrapassado ou o impacto for Desastroso, gera um Plano de Ação automaticamente
    if (novoIncidente.rto_ultrapassado || novoIncidente.impacto === 'Desastroso') {
      const proc = processos.find(p => p.id_processo === formData.id_processo);
      const pa = db.planosAcao.create({
        origem: 'incidente',
        id_origem: novoIncidente.id_incidente,
        descricao: `Plano de Ação Automático — Tratar causa raiz do incidente ${novoIncidente.id_incidente} (${proc?.nome}). RTO Real: ${novoIncidente.rto_real_minutos} min (Meta: ${novoIncidente.rto_meta_minutos || 'N/A'} min).`,
        responsavel: proc?.gerencia?.nome || 'Gestor do Processo',
        id_gerencia: proc?.id_gerencia || 'GER-GOV01',
        prazo: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: 'aberto'
      });
      setPlanosAcao(db.planosAcao.list());
      setNotification({
        type: 'error',
        text: `⚠️ ATENÇÃO: Incidente ${novoIncidente.id_incidente} registrado com RTO ULTRAPASSADO! Plano de Ação ${pa.id_plano_acao} criado automaticamente.`
      });
    } else {
      setNotification({ type: 'success', text: `Incidente ${novoIncidente.id_incidente} registrado com sucesso!` });
    }

    setIncidentes(db.incidentes.list());
    setShowForm(false);
    setFormData({
      data_hora: '', local: '', descricao: '', tipo_incidente: '', impacto: 'Baixo',
      id_processo: '', rto_real_minutos: '', id_pco_acionado: '', medidas_mitigacao: '', resultado_resposta: ''
    });
  };

  const handleLicaoSubmit = (e) => {
    e.preventDefault();
    if (!licaoData.id_incidente || !licaoData.descricao || !licaoData.recomendacao) return;

    db.licoesAprendidas.create(licaoData);
    setLicoes(db.licoesAprendidas.list());
    setShowLicaoForm(false);
    setLicaoData({ id_incidente: '', descricao: '', categoria: 'Técnica', recomendacao: '', impacto_no_risco: 'elevou_probabilidade' });
    setNotification({ type: 'success', text: 'Lição aprendida vinculada ao incidente com sucesso!' });
  };

  const handleDelete = (id) => {
    if (window.confirm(`Deseja realmente excluir o log de incidente ${id}?`)) {
      db.incidentes.delete(id);
      setIncidentes(db.incidentes.list());
      setNotification({ type: 'info', text: 'Incidente excluído do histórico.' });
    }
  };

  // Filtragem e busca
  const filteredIncidentes = incidentes.filter(inc => {
    const matchesSearch =
      inc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.local?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.tipo_incidente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.id_incidente?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterImpacto === 'Todos' || inc.impacto === filterImpacto;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Sub-navegação interna */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button onClick={() => setTab('incidentes')} className={`pb-3 transition-all ${tab === 'incidentes' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'}`}>
          Base de Incidentes & RTO ({incidentes.length})
        </button>
        <button onClick={() => setTab('licoes')} className={`pb-3 transition-all ${tab === 'licoes' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'}`}>
          Lições Aprendidas ({licoes.length})
        </button>
        <button onClick={() => setTab('acoes')} className={`pb-3 transition-all ${tab === 'acoes' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'}`}>
          Planos de Ação Derivados ({planosAcao.length})
        </button>
      </div>

      {/* Feedbacks */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' :
          notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400' :
          'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400'
        }`}>
          <AlertOctagon className="w-5 h-5 flex-shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* ABA 1: BASE DE INCIDENTES */}
      {tab === 'incidentes' && (
        <div className="space-y-6">

          {/* Barra de Busca e Botão */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex-1 flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-indigo-500 w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterImpacto}
                  onChange={(e) => setFilterImpacto(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-indigo-500"
                >
                  <option value="Todos">Todos os Impactos</option>
                  <option value="Baixo">Baixo</option>
                  <option value="Médio">Médio</option>
                  <option value="Alto">Alto</option>
                  <option value="Desastroso">Desastroso</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => { setShowForm(true); setNotification(null); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Registrar Incidente
            </button>
          </div>

          {/* Form Incidente */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-500" /> Registrar Incidente Operacional
                </h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancelar</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Processo Afetado *</label>
                  <select
                    value={formData.id_processo}
                    onChange={(e) => setFormData({ ...formData, id_processo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
                    required
                  >
                    <option value="">Selecione o Processo Afetado...</option>
                    {processos.map(p => (
                      <option key={p.id_processo} value={p.id_processo}>{p.id_processo} - {p.nome} ({p.id_gerencia})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Data e Hora *</label>
                  <input
                    type="datetime-local"
                    value={formData.data_hora}
                    onChange={(e) => setFormData({ ...formData, data_hora: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Local do Incidente *</label>
                  <input
                    type="text"
                    value={formData.local}
                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                    placeholder="Ex: Data Center AWS, Sede 3º Andar"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Incidente *</label>
                  <input
                    type="text"
                    value={formData.tipo_incidente}
                    onChange={(e) => setFormData({ ...formData, tipo_incidente: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                    placeholder="Ex: Falha Nuvem, Incêndio, Indisponibilidade API"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Impacto Classificado *</label>
                  <select
                    value={formData.impacto}
                    onChange={(e) => setFormData({ ...formData, impacto: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-300"
                  >
                    <option value="Baixo">Baixo</option>
                    <option value="Médio">Médio</option>
                    <option value="Alto">Alto</option>
                    <option value="Desastroso">Desastroso (Gera PA Automático)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> RTO Real Decorrido (Minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.rto_real_minutos}
                    onChange={(e) => setFormData({ ...formData, rto_real_minutos: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                    placeholder="Ex: 45 (se > meta, sinaliza violação)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Plano PCO Acionado</label>
                  <select
                    value={formData.id_pco_acionado}
                    onChange={(e) => setFormData({ ...formData, id_pco_acionado: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-300"
                  >
                    <option value="">Nenhum PCO Acionado</option>
                    {planosPCO.map(p => (
                      <option key={p.id_pco} value={p.id_pco}>{p.id_pco} - {p.id_processo}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Descrição Detalhada do Evento *</label>
                  <textarea
                    rows="2"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                    placeholder="Descreva a causa raiz primária e a sequência de eventos..."
                    required
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="text-xs font-bold text-slate-500 uppercase">Medidas de Mitigação e Resposta Aplicadas</label>
                  <textarea
                    rows="2"
                    value={formData.medidas_mitigacao}
                    onChange={(e) => setFormData({ ...formData, medidas_mitigacao: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                    placeholder="Ações emergenciais executadas pela equipe..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors">Salvar e Registrar</button>
              </div>
            </form>
          )}

          {/* Cards de Incidentes */}
          <div className="space-y-4">
            {filteredIncidentes.map(inc => {
              const proc = inc.processo;
              const rtoMeta = inc.rto_meta_minutos;
              const rtoReal = inc.rto_real_minutos;
              const ultrapassado = inc.rto_ultrapassado;

              return (
                <div key={inc.id_incidente} className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm space-y-4 transition-all ${ultrapassado ? 'border-rose-300 dark:border-rose-800/60 bg-rose-50/10' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${ultrapassado ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' : 'bg-amber-100 dark:bg-amber-950 text-amber-600'}`}>
                        <AlertOctagon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">{inc.id_incidente}</span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">· {inc.tipo_incidente}</span>
                          {ultrapassado && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">
                              🚨 RTO ULTRAPASSADO ({rtoReal} min vs Meta {rtoMeta} min)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>📍 {inc.local}</span>
                          <span>📅 {inc.data_hora ? new Date(inc.data_hora).toLocaleString('pt-BR') : '-'}</span>
                          {proc && <span className="text-indigo-500 font-semibold">⚙️ {proc.nome} ({proc.id_gerencia})</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        inc.impacto === 'Desastroso' ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 border border-rose-200' :
                        inc.impacto === 'Alto' ? 'bg-orange-100 dark:bg-orange-950 text-orange-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Impacto: {inc.impacto}
                      </span>
                      <button onClick={() => handleDelete(inc.id_incidente)} className="text-slate-400 hover:text-rose-500 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-850 leading-relaxed">
                    {inc.descricao}
                  </p>

                  {/* Resposta e PCO */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {inc.medidas_mitigacao && (
                      <div className="bg-slate-50 dark:bg-slate-950/30 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Mitigação Executada</span>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">{inc.medidas_mitigacao}</p>
                      </div>
                    )}
                    {rtoReal && (
                      <div className={`p-2.5 rounded-lg border ${ultrapassado ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200' : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200'}`}>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Métricas RTO (Tempo Real vs Meta AIN)</span>
                        <p className="text-xs font-bold mt-0.5" style={{ color: ultrapassado ? '#ef4444' : '#10b981' }}>
                          Real: {rtoReal} min | Meta: {rtoMeta || 'N/A'} min
                        </p>
                      </div>
                    )}
                    {inc.id_pco_acionado && (
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/40">
                        <span className="text-[9px] font-bold text-indigo-500 uppercase">Plano Continuidade Acionado</span>
                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">⚡ {inc.id_pco_acionado}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: LIÇÕES APRENDIDAS */}
      {tab === 'licoes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Repositório de Lições Aprendidas (Post-Mortem)</h3>
              <p className="text-xs text-slate-400 mt-0.5">ISO 22301 §10.1 — Melhoria contínua derivada da resposta a incidentes.</p>
            </div>
            <button onClick={() => setShowLicaoForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Registrar Lição Aprendida
            </button>
          </div>

          {showLicaoForm && (
            <form onSubmit={handleLicaoSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="font-bold text-xs uppercase text-indigo-500">Nova Lição Aprendida</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Incidente de Origem *</label>
                  <select
                    value={licaoData.id_incidente}
                    onChange={(e) => setLicaoData({ ...licaoData, id_incidente: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                    required
                  >
                    <option value="">Selecione o Incidente...</option>
                    {incidentes.map(i => (
                      <option key={i.id_incidente} value={i.id_incidente}>{i.id_incidente} - {i.tipo_incidente}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                  <select
                    value={licaoData.categoria}
                    onChange={(e) => setLicaoData({ ...licaoData, categoria: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                  >
                    <option value="Técnica">Técnica</option>
                    <option value="Operacional">Operacional</option>
                    <option value="Processo">Processo</option>
                    <option value="Pessoas">Pessoas / Treinamento</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">O que falhou / Aprendizado *</label>
                  <textarea
                    rows="2"
                    value={licaoData.descricao}
                    onChange={(e) => setLicaoData({ ...licaoData, descricao: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                    placeholder="Descreva o que não funcionou conforme esperado..."
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Recomendação / Mudança de Processo *</label>
                  <textarea
                    rows="2"
                    value={licaoData.recomendacao}
                    onChange={(e) => setLicaoData({ ...licaoData, recomendacao: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white"
                    placeholder="Descreva a ação recomendada para evitar recorrência..."
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLicaoForm(false)} className="px-3 py-1.5 bg-slate-100 text-xs rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded">Salvar Lição</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {licoes.map(l => (
              <div key={l.id_licao} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">{l.id_licao} · Origem: {l.id_incidente}</span>
                  <span className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-bold uppercase">{l.categoria}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300"><strong>Aprendizado:</strong> {l.descricao}</p>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">💡 Recomendação: </span>
                  <span className="text-emerald-900 dark:text-emerald-200">{l.recomendacao}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: PLANOS DE AÇÃO */}
      {tab === 'acoes' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Planos de Ação (Ações Corretivas ISO 22301 §10.2)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Criados automaticamente a partir de RTOs ultrapassados, falhas em testes ou cadastrados manualmente.</p>
          </div>

          <div className="space-y-3">
            {planosAcao.map(pa => {
              const atrasado = pa.prazo && new Date(pa.prazo) < new Date() && pa.status !== 'concluido';
              return (
                <div key={pa.id_plano_acao} className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm space-y-2 ${atrasado ? 'border-rose-300 dark:border-rose-800' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-500" />
                      <span className="font-bold text-xs text-slate-800 dark:text-white">{pa.id_plano_acao}</span>
                      <span className="text-[10px] text-slate-400">Origem: {pa.origem?.toUpperCase()} ({pa.id_origem})</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${pa.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' : atrasado ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {atrasado ? 'ATRASADO' : pa.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{pa.descricao}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Responsável: <strong>{pa.responsavel}</strong> ({pa.id_gerencia})</span>
                    <span>Prazo: <strong className={atrasado ? 'text-rose-500 font-bold' : ''}>{pa.prazo ? new Date(pa.prazo).toLocaleDateString('pt-BR') : 'N/D'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
