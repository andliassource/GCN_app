import React, { useState } from 'react';
import { Settings, Upload, Save, Shield, Mail, Clock, CheckCircle, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ConfiguracaoSistema({ db }) {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState(db.configSistema.get());
  const [gerencias, setGerencias] = useState(db.gerencias.list());
  const [notif, setNotif] = useState(null);

  const handleLogoUpload = (e) => {
    if (!isAdmin()) return;
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

  const handleGerenciaChange = (id, field, value) => {
    setGerencias(prev => prev.map(g => g.id_gerencia === id ? { ...g, [field]: value } : g));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin()) {
      setNotif({ type: 'error', text: 'Permissão negada. Apenas administradores podem salvar.' });
      return;
    }
    db.configSistema.save(config);
    // Salva as configurações de email e telefone de cada gerência
    gerencias.forEach(g => {
      db.gerencias.update(g.id_gerencia, { email: g.email || '', telefone: g.telefone || '' });
    });
    setNotif({ type: 'success', text: 'Configurações globais e contatos das gerências salvos com sucesso!' });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" /> Configurações do Sistema GCN
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Personalize a identidade corporativa, parâmetros globais de revisão e os canais de contatos das gerências.
          </p>
        </div>
      </div>

      {!isAdmin() && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-955/20 text-rose-800 dark:text-rose-400 text-xs font-semibold">
          ⚠️ Modo Leitura — Apenas membros da GERIC/Administradores podem alterar os parâmetros globais e os contatos de notificações das áreas.
        </div>
      )}

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
                disabled={!isAdmin()}
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
                {isAdmin() && (
                  <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Enviar Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}
                {config.logo_base64 && isAdmin() && (
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
            <Mail className="w-4 h-4" /> E-mails de Governança & Alertas Automáticos (Geric)
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
                disabled={!isAdmin()}
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
                disabled={!isAdmin()}
              />
            </div>
          </div>
        </div>

        {/* CANAIS DE NOTIFICAÇÃO E CONTATOS POR ÁREA */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="font-bold text-xs text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> Canais de Notificação e Contatos por Área / Gerência
          </h4>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
            Configure abaixo os destinatários padrão para as notificações de prazos de PCO, vencimento de contratos, incidentes de mesa e acionamentos automáticos enviados pela Geric.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-250 dark:border-slate-800 text-slate-400 font-bold uppercase text-[9px]">
                  <th className="py-2.5 px-3">Gerência (Sigla)</th>
                  <th className="py-2.5 px-3">E-mail para Alertas</th>
                  <th className="py-2.5 px-3">Telefone p/ Escalonamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {gerencias.map(g => (
                  <tr key={g.id_gerencia} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-250">
                      {g.sigla} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">({g.nome})</span>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="email"
                        value={g.email || ''}
                        onChange={e => handleGerenciaChange(g.id_gerencia, 'email', e.target.value)}
                        placeholder="email@empresa.com.br"
                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1 text-xs text-slate-750 dark:text-slate-300 focus:outline-indigo-500"
                        disabled={!isAdmin()}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={g.telefone || ''}
                        onChange={e => handleGerenciaChange(g.id_gerencia, 'telefone', e.target.value)}
                        placeholder="(61) 98888-8888"
                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1 text-xs text-slate-750 dark:text-slate-300 focus:outline-indigo-500"
                        disabled={!isAdmin()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                disabled={!isAdmin()}
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
                disabled={!isAdmin()}
              />
            </div>
          </div>
        </div>

        {isAdmin() && (
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-sm transition-all">
              <Save className="w-4 h-4" /> Salvar Configurações
            </button>
          </div>
        )}

      </form>
    </div>
  );
}
