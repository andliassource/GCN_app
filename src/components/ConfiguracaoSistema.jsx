import React, { useState } from 'react';
import { Settings, Upload, Save, Shield, Mail, Clock, CheckCircle } from 'lucide-react';

export default function ConfiguracaoSistema({ db }) {
  const [config, setConfig] = useState(db.configSistema.get());
  const [notif, setNotif] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        setNotif({ type: 'error', text: 'Imagem muito grande. Limite máximo: 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, logo_base64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    db.configSistema.save(config);
    setNotif({ type: 'success', text: 'Configurações do sistema salvas com sucesso!' });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" /> Configurações do Sistema GCN
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Personalize a identidade corporativa, parâmetros de notificação e contatos de governança.
          </p>
        </div>
      </div>

      {notif && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
          notif.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{notif.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* IDENTIDADE CORPORATIVA & LOGO */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-bold text-xs text-indigo-500 uppercase tracking-wider">Identidade Corporativa & Branding</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Nome da Empresa / Organização *</label>
              <input
                type="text"
                value={config.nome_empresa || ''}
                onChange={e => setConfig({ ...config, nome_empresa: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-800 dark:text-white focus:outline-indigo-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Logo Corporativa (para PDFs e Plataforma)</label>
              <div className="flex items-center gap-4">
                {config.logo_base64 ? (
                  <img src={config.logo_base64} alt="Logo Prev" className="h-12 w-24 object-contain border border-slate-200 rounded p-1 bg-slate-50" />
                ) : (
                  <div className="h-12 w-24 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                    Sem Logo
                  </div>
                )}
                <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Enviar Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {config.logo_base64 && (
                  <button type="button" onClick={() => setConfig({ ...config, logo_base64: null })} className="text-xs text-rose-500 hover:underline">
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* GOVERNANÇA E CONTATOS DE NOTIFICAÇÃO */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-bold text-xs text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> E-mails de Governança & Alertas Automaticos
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">E-mail da Geric (2ª Linha) *</label>
              <input
                type="email"
                value={config.email_geric || ''}
                onChange={e => setConfig({ ...config, email_geric: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-800 dark:text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">E-mail da Gemac (Comunicação) *</label>
              <input
                type="email"
                value={config.email_gemac || ''}
                onChange={e => setConfig({ ...config, email_gemac: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-800 dark:text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* PARÂMETROS E PRAZOS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-bold text-xs text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Parâmetros Globais de Revisão e SLA (ISO 22301)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Periodicidade Mandatória de Revisão de PCO (Dias)</label>
              <input
                type="number"
                value={config.periodicidade_revisao_dias || 365}
                onChange={e => setConfig({ ...config, periodicidade_revisao_dias: parseInt(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-800 dark:text-white"
                min="30" max="730"
              />
              <p className="text-[10px] text-slate-400">Recomendado ISO 22301: 365 dias (anual)</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">SLA de Resposta a Notificações Críticas (Horas)</label>
              <input
                type="number"
                value={config.sla_notificacao_horas || 24}
                onChange={e => setConfig({ ...config, sla_notificacao_horas: parseInt(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-800 dark:text-white"
                min="1" max="168"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-sm transition-all">
            <Save className="w-4 h-4" /> Salvar Configurações
          </button>
        </div>

      </form>
    </div>
  );
}
