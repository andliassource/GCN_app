import React, { useState } from 'react';
import { Users, Plus, Calendar, MessageSquare, AlertTriangle, Users2, ShieldAlert, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function GestaoCrises({ db }) {
  const { usuario, isAdmin } = useAuth();
  const [atas, setAtas] = useState(db.atasComiteCrise.list());
  const [showAtaForm, setShowAtaForm] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Controle de abas internas: 'atas', 'comunicacao'
  const [crisisTab, setCrisisTab] = useState('atas');

  // Form Fields - Ata
  const [ataForm, setAtaForm] = useState({
    data_reuniao: '',
    pauta: '',
    deliberacoes: '',
    participantes: ''
  });

  const handleAtaSubmit = (e) => {
    e.preventDefault();
    if (!ataForm.data_reuniao || !ataForm.pauta || !ataForm.deliberacoes) return;

    db.atasComiteCrise.create(ataForm);
    setAtas(db.atasComiteCrise.list());
    setShowAtaForm(false);
    setAtaForm({ data_reuniao: '', pauta: '', deliberacoes: '', participantes: '' });
    setNotification({ type: 'success', text: 'Ata do Comitê de Crise registrada e arquivada com sucesso!' });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Subnavegação de Abas do Comitê de Crise */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button 
          onClick={() => setCrisisTab('atas')}
          className={`pb-3 transition-all ${crisisTab === 'atas' ? 'border-b-2 border-indigo-650 dark:border-indigo-400 text-indigo-650 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Atas do Comitê de Crise (Geemp)
        </button>
        <button 
          onClick={() => setCrisisTab('comunicacao')}
          className={`pb-3 transition-all ${crisisTab === 'comunicacao' ? 'border-b-2 border-indigo-650 dark:border-indigo-400 text-indigo-650 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          Comunicação de Crise (Gemac)
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 text-xs font-semibold">
          {notification.text}
        </div>
      )}

      {/* ABA: ATAS DO COMITÊ DE CRISE */}
      {crisisTab === 'atas' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
            <div>
              <h3 className="font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <Users2 className="w-5 h-5 text-indigo-500" />
                Atas e Regimento do Comitê de Crises
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-xl leading-relaxed">
                As reuniões deliberativas em caso de acionamento do Plano de Gestão de Crise (PGC) geram atas obrigatórias para formalizar as decisões e salvaguardas contratuais.
              </p>
            </div>
            {isAdmin() && (
              <button 
                onClick={() => { setShowAtaForm(true); setNotification(null); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Registrar Ata do Comitê
              </button>
            )}
          </div>

          {/* Form de Ata */}
          {showAtaForm && (
            <form onSubmit={handleAtaSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs animate-slide-up">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Nova Ata Deliberativa do Comitê</h4>
                <button type="button" onClick={() => setShowAtaForm(false)} className="text-slate-450 hover:text-slate-655 font-semibold cursor-pointer">Cancelar</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Data da Reunião *</label>
                  <input 
                    type="date"
                    value={ataForm.data_reuniao}
                    onChange={(e) => setAtaForm({...ataForm, data_reuniao: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pauta Principal *</label>
                  <input 
                    type="text"
                    value={ataForm.pauta}
                    onChange={(e) => setAtaForm({...ataForm, pauta: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                    placeholder="Ex: Acionamento do plano PGC para o incidente de corte do link principal"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Deliberações Tomadas *</label>
                <textarea 
                  rows="3"
                  value={ataForm.deliberacoes}
                  onChange={(e) => setAtaForm({...ataForm, deliberacoes: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                  placeholder="Descreva as decisões estratégicas tomadas pelo Comitê e aprovações de desvio."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Participantes Integrantes *</label>
                <input 
                  type="text"
                  value={ataForm.participantes}
                  onChange={(e) => setAtaForm({...ataForm, participantes: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 focus:outline-indigo-500"
                  placeholder="Ex: Roberto Carlos (Geric), Patrícia Lima (Getic), Arthur Mendes (Geemp)"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowAtaForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-medium rounded-lg text-xs cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-650 hover:bg-indigo-755 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs">Registrar Ata</button>
              </div>
            </form>
          )}

          {/* Histórico de Atas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {atas.map(ata => (
              <div key={ata.id_ata} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold text-indigo-500 uppercase">{ata.id_ata}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ata.data_reuniao}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-850 dark:text-white text-xs leading-normal">{ata.pauta}</h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-200 dark:border-slate-850 text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
                    <strong>Deliberações:</strong> {ata.deliberacoes}
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-850 pt-2 text-[10px] text-slate-400">
                  <strong>Participantes:</strong> {ata.participantes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: COMUNICAÇÃO DE CRISE */}
      {crisisTab === 'comunicacao' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs text-slate-700 dark:text-slate-350">
          <div className="border-b border-slate-150 dark:border-slate-800 pb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-855 dark:text-white text-sm">Plano de Comunicação de Crises (Gemac)</h3>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">
            A Gemac (Gerência de Marketing e Comunicação) coordena todos os canais de informação externa e interna em cenários de acionamento do Plano de Gestão de Crise (PGC). É vedado o pronunciamento de funcionários sem validação da Gemac.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-slate-850 space-y-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-500" />
                <h4 className="font-extrabold text-indigo-650 dark:text-indigo-400 uppercase text-[10px] tracking-wider">Protocolo de Comunicação Interna</h4>
              </div>
              <p className="leading-relaxed">
                <strong>Destinatários:</strong> Colaboradores, Fiscais de Contratos e Terceirizados.<br/>
                <strong>Canais:</strong> Notificações push via aplicativo corporativo, e-mail institucional interno e WhatsApp Business do comitê.<br/>
                <strong>Prazo de Disparo:</strong> Até 30 minutos após a ata de acionamento do PGC.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-slate-850 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-500" />
                <h4 className="font-extrabold text-purple-650 dark:text-purple-400 uppercase text-[10px] tracking-wider">Protocolo de Comunicação Externa</h4>
              </div>
              <p className="leading-relaxed">
                <strong>Destinatários:</strong> Clientes, Acionistas e Imprensa.<br/>
                <strong>Canais:</strong> Atualização da Status Page pública da empresa, envio de boletins via e-mail e notas à imprensa especializada.<br/>
                <strong>Prazo de Disparo:</strong> Em até 60 minutos após confirmação da indisponibilidade que exceda o RTO do checkout.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
