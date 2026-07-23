import React, { useState } from 'react';
import { Upload, Plus, Trash2, Calendar, FileText, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContratosDocs({ db }) {
  const [contratos, setContratos] = useState(db.contratos.list());
  const [processos] = useState(db.processosCriticos.list());

  // Estados do formulário e upload
  const [isUploading, setIsUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    nome: '',
    valor_faturamento: '',
    clausulas_risco: '',
    multas: '',
    data_inicio: '',
    data_fim: ''
  });

  const [notification, setNotification] = useState(null);

  // Simula a extração de inteligência artificial de contratos fictícios
  const simularExtracaoIA = (fileName) => {
    setIsUploading(true);
    setNotification(null);

    // Mocks de dados de contratos com base no nome do arquivo
    setTimeout(() => {
      let mockExtracted = {
        nome: "Contrato de Prestação de Serviços de TI - " + fileName.replace(/\.[^/.]+$/, ""),
        valor_faturamento: 320000.00,
        clausulas_risco: "Garantia de atendimento (SLA) para incidentes de nível 1 em até 2 horas. Risco operacional por vazamento de dados de clientes.",
        multas: "Multa penal rescisória de 10% do valor restante do contrato. Indenização civil de até R$ 50.000 por incidente cibernético.",
        data_inicio: "2026-01-15",
        data_fim: "2028-01-15"
      };

      setFormData(mockExtracted);
      setIsUploading(false);
      setShowForm(true);
      setNotification({
        type: 'success',
        text: 'Documento analisado com sucesso via OCR/IA! Valide as informações extraídas abaixo.'
      });
    }, 2500);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simularExtracaoIA(e.dataTransfer.files[0].name);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      simularExtracaoIA(e.target.files[0].name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.valor_faturamento || !formData.data_inicio || !formData.data_fim) {
      setNotification({ type: 'error', text: 'Preencha todos os campos obrigatórios (*).' });
      return;
    }

    const novoContrato = db.contratos.create({
      ...formData,
      valor_faturamento: parseFloat(formData.valor_faturamento)
    });

    setContratos(db.contratos.list());
    setShowForm(false);
    setFormData({
      nome: '',
      valor_faturamento: '',
      clausulas_risco: '',
      multas: '',
      data_inicio: '',
      data_fim: ''
    });
    setNotification({ type: 'success', text: `Contrato ${novoContrato.id_contrato} cadastrado e integrado com sucesso!` });
  };

  const handleDelete = (id) => {
    if (window.confirm(`Deseja realmente excluir o contrato ${id}? Os processos vinculados serão atualizados.`)) {
      db.contratos.delete(id);
      setContratos(db.contratos.list());
      setNotification({ type: 'info', text: 'Contrato removido com sucesso.' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upload & Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Drag and Drop Upload Card */}
        <div className="lg:col-span-2">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`h-56 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20' 
                : 'border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500'
            }`}
          >
            {isUploading ? (
              <div className="space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Processando documento com IA...</h4>
                  <p className="text-xs text-slate-400 mt-1">Extraindo cláusulas, multas, vigência e valores por OCR...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500 dark:text-slate-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Ingestão Automática de Contratos</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Arraste o arquivo em PDF/DOCX aqui ou{' '}
                    <label className="text-indigo-500 hover:text-indigo-600 font-semibold cursor-pointer underline">
                      procure no computador
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileInput} className="hidden" />
                    </label>
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-950/40 px-2 py-0.5 rounded">
                  ISO 27031 Compliant
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Informações Auxiliares */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              OCR e IA Connect
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              O motor de IA analisa contratos para identificar automaticamente contingências financeiras e de conformidade. Ele preenche automaticamente o formulário de cadastro estruturado.
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 mt-4 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Extração de Cláusulas de Risco
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mapeamento de Multas e SLAs
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Vinculação com Processos Críticos
              </li>
            </ul>
          </div>
          <button 
            onClick={() => { setShowForm(true); setNotification(null); }}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Cadastrar Contrato Manualmente
          </button>
        </div>
      </div>

      {/* Notificações / Feedbacks */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-50/50 border-emerald-500/20 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' :
          notification.type === 'error' ? 'bg-rose-50/50 border-rose-500/20 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400' :
          'bg-indigo-50/50 border-indigo-500/20 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          <span className="text-xs font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Formulário de Cadastro / Validação de OCR */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white">Formulário de Validação de Contrato</h3>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 font-semibold"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Nome do Contrato *</label>
              <input 
                type="text" 
                value={formData.nome} 
                onChange={(e) => setFormData({...formData, nome: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Ex: Contrato de Backup em Nuvem Azure"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Faturamento Mensal Estimado (R$) *</label>
              <input 
                type="number" 
                value={formData.valor_faturamento} 
                onChange={(e) => setFormData({...formData, valor_faturamento: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Ex: 150000"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Vigência (Início / Fim) *</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={formData.data_inicio} 
                  onChange={(e) => setFormData({...formData, data_inicio: e.target.value})} 
                  className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                  required
                />
                <input 
                  type="date" 
                  value={formData.data_fim} 
                  onChange={(e) => setFormData({...formData, data_fim: e.target.value})} 
                  className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Cláusulas de Risco Identificadas</label>
              <textarea 
                rows="3"
                value={formData.clausulas_risco} 
                onChange={(e) => setFormData({...formData, clauses_risco: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Insira as cláusulas de risco ou SLAs acordados"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Regras de Multas / Penalidades</label>
              <textarea 
                rows="3"
                value={formData.multas} 
                onChange={(e) => setFormData({...formData, multas: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-indigo-500" 
                placeholder="Insira as regras de cálculo de multas de SLA"
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
              Salvar Contrato
            </button>
          </div>
        </form>
      )}

      {/* Tabela de Contratos Cadastrados */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white">Base de Contratos Cadastrados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-3.5">Código / Nome</th>
                <th className="px-6 py-3.5">Faturamento Mensal</th>
                <th className="px-6 py-3.5">Vigência</th>
                <th className="px-6 py-3.5">Cláusulas de Risco & Multas</th>
                <th className="px-6 py-3.5">Processos Relacionados</th>
                <th className="px-6 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {contratos.map((c) => {
                const procsRelacionados = processos.filter(p => p.id_contrato === c.id_contrato);
                return (
                  <tr key={c.id_contrato} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-indigo-600 dark:text-indigo-400">{c.id_contrato}</div>
                      <div className="text-slate-700 dark:text-slate-355 font-medium max-w-xs truncate" title={c.nome}>
                        {c.nome}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      R$ {c.valor_faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {c.data_inicio}</div>
                      <div className="text-[10px] text-slate-400">até {c.data_fim}</div>
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <p className="font-bold text-[10px] text-slate-400 uppercase">Riscos:</p>
                      <p className="text-slate-650 dark:text-slate-400 truncate text-[11px]" title={c.clausulas_risco}>
                        {c.clausulas_risco || 'Sem restrições mapeadas'}
                      </p>
                      <p className="font-bold text-[10px] text-slate-400 uppercase mt-1">Multas:</p>
                      <p className="text-rose-600 dark:text-rose-400 truncate text-[11px]" title={c.multas}>
                        {c.multas || 'Sem multas previstas'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {procsRelacionados.length > 0 ? (
                        <div className="space-y-1">
                          {procsRelacionados.map(p => (
                            <span key={p.id_processo} className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold">
                              {p.id_processo}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-[10px]">Sem processos vinculados</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDelete(c.id_contrato)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Excluir contrato"
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

    </div>
  );
}
