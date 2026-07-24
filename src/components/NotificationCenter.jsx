import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Mail, AlertTriangle, Clock, Zap, Calendar, Shield, ChevronRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';

const TIPO_ICON = {
  incidente_critico: { icon: AlertTriangle, cor: 'rose' },
  plano_vencendo: { icon: Calendar, cor: 'amber' },
  plano_acao_atrasado: { icon: Clock, cor: 'rose' },
  plano_acao_prazo: { icon: Clock, cor: 'amber' },
  acionamento_plano: { icon: Zap, cor: 'rose' },
  ativo_fim_suporte: { icon: Shield, cor: 'amber' },
  revisao_devida: { icon: Calendar, cor: 'indigo' },
  default: { icon: Bell, cor: 'slate' }
};

const COR_BG = {
  rose: 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
  amber: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  indigo: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
};

const PRIORIDADE_LABEL = {
  critica: { text: 'Crítica', cls: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400' },
  alta: { text: 'Alta', cls: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400' },
  media: { text: 'Média', cls: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400' },
};

// Modal de Preview de Email
function EmailPreviewModal({ notif, onClose, db }) {
  const interv = db.intervenientes.list().find(i => i.id_gerencia === notif.id_destino);
  const preview = notificationService.gerarPreviewEmail(notif, interv || { nome: 'Gestor(a)', email: 'gestor@empresa.com.br' });
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Preview de E-mail</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 text-xs">
          <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 space-y-2">
            <div><span className="font-bold text-slate-500">Para:</span> <span className="text-slate-700 dark:text-slate-300">{preview.para}</span></div>
            <div><span className="font-bold text-slate-500">Assunto:</span> <span className="text-slate-700 dark:text-slate-300">{preview.assunto}</span></div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3">
            <pre className="whitespace-pre-wrap text-[10px] text-slate-600 dark:text-slate-400 font-mono leading-relaxed">{preview.corpo}</pre>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">Fechar</button>
          <button className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1">
            <Mail className="w-3.5 h-3.5" /> Simular Envio
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter({ db, onNavigate }) {
  const { usuario } = useAuth();
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [emailPreview, setEmailPreview] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const drawerRef = useRef(null);

  const recarregar = () => {
    const todas = db.notificacoes.list(usuario?.id_gerencia);
    setNotifs(todas.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em)));
    setNaoLidas(db.notificacoes.countNaoLidas(usuario?.id_gerencia));
  };

  useEffect(() => {
    recarregar();
    // Verificar prazos ao abrir o app
    try { notificationService.verificarPrazos(db); } catch (e) { /* silencioso */ }
    const interval = setInterval(recarregar, 30000); // atualiza a cada 30s
    return () => clearInterval(interval);
  }, [usuario]);

  useEffect(() => {
    if (open) recarregar();
  }, [open]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClick = (e) => { if (drawerRef.current && !drawerRef.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const marcarLida = (id) => { db.notificacoes.marcarLida(id); recarregar(); };
  const marcarTodas = () => { db.notificacoes.marcarTodasLidas(usuario?.id_gerencia); recarregar(); };
  const deletar = (id) => { db.notificacoes.delete(id); recarregar(); };

  const notifsFiltradas = notifs.filter(n => {
    if (filtro === 'nao_lidas') return n.status === 'nao_lida';
    if (filtro === 'criticas') return n.prioridade === 'critica';
    return true;
  });

  const tempoRelativo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min} min atrás`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    return `${Math.floor(hrs / 24)}d atrás`;
  };

  return (
    <div className="relative">
      {/* SINO */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
      >
        <Bell className="w-5 h-5" />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-black text-white animate-pulse">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* DRAWER */}
      {open && (
        <div
          ref={drawerRef}
          className="absolute right-0 top-10 w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
          style={{ maxHeight: '80vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              <span className="font-bold text-sm text-slate-800 dark:text-white">Notificações</span>
              {naoLidas > 0 && (
                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[9px] font-black rounded-full">{naoLidas} novas</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {naoLidas > 0 && (
                <button onClick={marcarTodas} className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Marcar todas lidas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 ml-1"><X className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
            {[['todas', 'Todas'], ['nao_lidas', 'Não lidas'], ['criticas', 'Críticas']].map(([k, l]) => (
              <button key={k} onClick={() => setFiltro(k)}
                className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all ${filtro === k ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
            {notifsFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Nenhuma notificação</p>
              </div>
            ) : notifsFiltradas.map(notif => {
              const tipoConfig = TIPO_ICON[notif.tipo] || TIPO_ICON.default;
              const Icon = tipoConfig.icon;
              const priorLabel = PRIORIDADE_LABEL[notif.prioridade] || PRIORIDADE_LABEL.media;
              return (
                <div key={notif.id_notificacao}
                  className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors ${notif.status === 'nao_lida' ? 'border-l-2 border-l-indigo-500' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${COR_BG[tipoConfig.cor]}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">{notif.titulo}</p>
                        {notif.status === 'nao_lida' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{notif.mensagem}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${priorLabel.cls}`}>{priorLabel.text}</span>
                        <span className="text-[9px] text-slate-400">{tempoRelativo(notif.criado_em)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-8">
                    {notif.status === 'nao_lida' && (
                      <button onClick={() => marcarLida(notif.id_notificacao)} className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-semibold">
                        <Check className="w-3 h-3" /> Lida
                      </button>
                    )}
                    <button onClick={() => setEmailPreview(notif)} className="text-[9px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-0.5 font-semibold">
                      <Mail className="w-3 h-3" /> Email
                    </button>
                    {notif.link_acao && onNavigate && (
                      <button onClick={() => { onNavigate(notif.link_acao); setOpen(false); }} className="text-[9px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-0.5 font-semibold">
                        <ExternalLink className="w-3 h-3" /> Ver
                      </button>
                    )}
                    <button onClick={() => deletar(notif.id_notificacao)} className="text-[9px] text-slate-400 hover:text-rose-500 flex items-center gap-0.5 font-semibold ml-auto">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Preview de Email */}
      {emailPreview && <EmailPreviewModal notif={emailPreview} onClose={() => setEmailPreview(null)} db={db} />}
    </div>
  );
}
