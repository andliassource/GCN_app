import React, { useState } from 'react';
import { Plus, Trash2, Calendar, AlertOctagon, ShieldAlert, CheckCircle2, Search, Filter } from 'lucide-react';

export default function BaseIncidentes({ db }) {
  const [incidentes, setIncidentes] = useState(db.incidentes.list());
  const [processos] = useState(db.processosCriticos.list());

  // Estados locais
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterImpacto, setFilterImpacto] = useState('Todos');
  const [notification, setNotification] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    data_hora: '',
    local: '',
    descricao: '',
    tipo_incidente: '',
    impacto: 'Baixo',
    id_processo: '',
    medidas_mitigacao: '',
    resultado_resposta: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.data_hora || !formData.local || !formData.descricao || !formData.tipo_incidente) {
      setNotification({ type: 'error', text: 'Preencha todos os campos obrigatórios (*).' });
      return;
    }

    const novoIncidente = db.incidentes.create(formData);
    setIncidentes(db.incidentes.list());
    setShowForm(false);
    setFormData({
      data_hora: '',
      local: '',
      descricao: '',
      tipo_incidente: '',
      impacto: 'Baixo',
      id_processo: '',
      medidas_mitigacao: '',
      resultado_resposta: ''
    });
    setNotification({ type: 'success', text: `Incidente ${novoIncidente.id_incidente} registrado e correlacionado com sucesso!` });
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
      inc.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.local.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.tipo_incidente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.id_incidente.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterImpacto === 'Todos' || inc.impacto === filterImpacto;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Cabeçalho de Controles (Busca e Filtro) */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex-1 flex flex-col md:flex-row gap-3">
          {/* Caixa de Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar por descrição, local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-indigo-500 w-64"
            />
          </div>
          {/* Seletor de Filtro de Impacto */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterImpacto}
              onChange={(e) => setFilterImpacto(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-indigo-500"
            >
              <option value="Todos">Todos os Impactos</option>
              <option value="Baixo">Impacto Baixo</option>
              <option value="Médio">Impacto Médio</option>
              <option value="Alto">Impacto Alto</option>
              <option value="Desastroso">Impacto Desastroso</option>
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

      {/* Feedbacks */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-50/50 border-emerald-500/20 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' :
          notification.type === 'error' ? 'bg-rose-50/50 border-rose-500/20 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400' :
          'bg-indigo-50/50 border-indigo-500/20 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400'
        }`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-xs font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Formulário de Registro de Incidente */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-indigo-500" /> Registrar Incidente de Continuidade
            </h3>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 font-semibold"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Data e Hora do Incidente *</label>
              <input 
                type="datetime-local" 
                value={formData.data_hora} 
                onChange={(e) => setFormData({...formData, data_hora: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Localização / Sistema *</label>
              <input 
                type="text" 
                value={formData.local} 
                onChange={(e) => setFormData({...formData, local: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Ex: Sala de Servidores 2, Link de Fibra 1, AWS Região us-east-1"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Incidente *</label>
              <input 
                type="text" 
                value={formData.tipo_incidente} 
                onChange={(e) => setFormData({...formData, tipo_incidente: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Ex: Ataque DDoS, Falha Elétrica, Rompimento de Link"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Impacto da Interrupção *</label>
              <select 
                value={formData.impacto} 
                onChange={(e) => setFormData({...formData, impacto: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
              >
                <option value="Baixo">Baixo (Sem interrupção perceptível)</option>
                <option value="Médio">Médio (Perda parcial / Degradação)</option>
                <option value="Alto">Alto (Indisponibilidade de processos críticos)</option>
                <option value="Desastroso">Desastroso (Paralisação geral / Impacto financeiro crítico)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Processo Crítico Correlacionado</label>
              <select 
                value={formData.id_processo} 
                onChange={(e) => setFormData({...formData, id_processo: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-850 dark:text-slate-300 focus:outline-indigo-500"
              >
                <option value="">Nenhum (Incidente Geral)</option>
                {processos.map(p => (
                  <option key={p.id_processo} value={p.id_processo}>
                    {p.id_processo} - {p.nome} ({p.criticidade})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Descrição Detalhada do Incidente *</label>
              <textarea 
                rows="3"
                value={formData.descricao} 
                onChange={(e) => setFormData({...formData, descricao: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Descreva o que ocorreu, data dos sintomas e sistemas interrompidos..."
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Medidas Imediatas de Mitigação Adotadas</label>
              <textarea 
                rows="3"
                value={formData.medidas_mitigacao} 
                onChange={(e) => setFormData({...formData, medidas_mitigacao: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Ex: Ativação de servidores redundantes, rota secundária de telecom..."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Resultado da Resposta e Lições Aprendidas</label>
              <textarea 
                rows="2"
                value={formData.resultado_resposta} 
                onChange={(e) => setFormData({...formData, resultado_resposta: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Ex: Restabelecimento concluído. Lição: Necessário automatizar o failover do DNS."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
            >
              Registrar Incidente
            </button>
          </div>
        </form>
      )}

      {/* Histórico / Grid de Incidentes */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/20">
          <h3 className="font-bold text-slate-800 dark:text-white">Registro Histórico de Incidentes</h3>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-bold uppercase">
            {filteredIncidentes.length} Registros Encontrados
          </span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredIncidentes.map(inc => {
            const hasProcesso = !!inc.processo;
            
            // Definição da cor do crachá de impacto
            const getImpactBadgeColor = (imp) => {
              if (imp === 'Baixo') return 'bg-emerald-55/60 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450';
              if (imp === 'Médio') return 'bg-amber-55/60 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450';
              if (imp === 'Alto') return 'bg-orange-55/60 dark:bg-orange-950/30 text-orange-600 dark:text-orange-450';
              return 'bg-rose-55/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450';
            };

            return (
              <div key={inc.id_incidente} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all flex flex-col md:flex-row gap-6 justify-between items-start">
                
                {/* Lateral: Identificação e Severidade */}
                <div className="space-y-3 md:w-1/4">
                  <div>
                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{inc.id_incidente}</span>
                    <h4 className="font-bold text-slate-800 dark:text-white mt-0.5">{inc.tipo_incidente}</h4>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${getImpactBadgeColor(inc.impacto)}`}>
                    <ShieldAlert className="w-3.5 h-3.5" /> Impacto {inc.impacto}
                  </span>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(inc.data_hora).toLocaleString('pt-BR')}
                  </div>
                </div>

                {/* Centro: Descrição, Mitigação e Processo */}
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Descrição do Incidente</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{inc.descricao}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inc.medidas_mitigacao && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-850/60">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase">Medidas de Mitigação</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{inc.medidas_mitigacao}</p>
                      </div>
                    )}
                    {inc.resultado_resposta && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-850/60">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase">Resultado e Resolução</p>
                        <p className="text-[11px] text-slate-650 dark:text-slate-400 mt-1 leading-relaxed">{inc.resultado_resposta}</p>
                      </div>
                    )}
                  </div>

                  {/* Informação do Processo e Contrato Correlacionados */}
                  {hasProcesso && (
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Processo Crítico:</span>
                      <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold">
                        {inc.processo.id_processo} - {inc.processo.nome}
                      </span>
                      {inc.processo.id_contrato && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Contrato:</span>
                          <span className="bg-purple-50 dark:bg-purple-950/50 text-purple-650 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold">
                            {inc.processo.id_contrato}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Direita: Ações */}
                <div className="flex md:flex-col justify-end items-end h-full">
                  <button 
                    onClick={() => handleDelete(inc.id_incidente)}
                    className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                    title="Excluir log do histórico"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>

              </div>
            );
          })}

          {filteredIncidentes.length === 0 && (
            <div className="p-12 text-center text-slate-450 dark:text-slate-500">
              Nenhum incidente encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
