import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, User, Calendar,
  RefreshCw, FileText, ChevronRight, Clock, MessageSquare, Info,
  Building2, Cpu, Users, Award, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';

// ── Constantes de Workflow ───────────────────────────────────────────────────
const ALCADAS = [
  { key: 'geric',   label: 'Validação GERIC (2ª Linha)', icon: ShieldCheck,   pendente: 'Pendente GERIC',        devolvido: 'Devolvido GERIC',    roles: ['admin_geric'] },
  { key: 'tic',     label: 'Aval TIC / ANS',             icon: Cpu,           pendente: 'Pendente TIC',           devolvido: 'Devolvido TIC',      roles: ['tic', 'admin_geric'] },
  { key: 'gerente', label: 'Assinatura Gerente Exec',   icon: User,          pendente: 'Pendente Gerente Exec',  devolvido: 'Devolvido Gerente',  roles: ['gerente_exec', 'admin_geric'] },
  { key: 'comite',  label: 'Deliberação Comitê Conti',   icon: Award,         pendente: 'Pendente Comitê',        devolvido: 'Reprovado Comitê',   roles: ['conti', 'admin_geric'] },
];

const STATUS_ORDER = {
  'Rascunho': -1,
  'Pendente GERIC': 0,
  'Devolvido GERIC': 0,
  'Pendente TIC': 1,
  'Devolvido TIC': 1,
  'Pendente Gerente Exec': 2,
  'Devolvido Gerente': 2,
  'Pendente Comitê': 3,
  'Reprovado Comitê': 3,
  'Vigente': 4,
};

const STATUS_COLOR = (s) => {
  if (s === 'Vigente') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
  if (s?.startsWith('Pendente')) return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
  if (s?.startsWith('Devolvido') || s?.startsWith('Reprovado')) return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700';
};

// ── Modal de Parecer ─────────────────────────────────────────────────────────
function ModalParecer({ titulo, placeholder, onConfirm, onCancel, obrigatorio = true, extraFields }) {
  const [parecer, setParecer] = useState('');
  const [extras, setExtras] = useState({});
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg animate-scale-in">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{titulo}</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          {extraFields?.map(f => (
            <div key={f.key} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">{f.label} {f.required ? '*' : ''}</label>
              {f.type === 'select' ? (
                <select
                  value={extras[f.key] || ''}
                  onChange={e => setExtras({ ...extras, [f.key]: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
                >
                  <option value="">Selecione...</option>
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  value={extras[f.key] || ''}
                  onChange={e => setExtras({ ...extras, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
                />
              )}
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Parecer / Observação {obrigatorio ? '*' : '(opcional)'}</label>
            <textarea
              rows={4}
              value={parecer}
              onChange={e => setParecer(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-indigo-500 resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => {
              if (obrigatorio && !parecer.trim()) return;
              onConfirm(parecer.trim(), extras);
            }}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stepper Visual ─────────────────────────────────────────────────────────
function WorkflowStepper({ status }) {
  const currentStep = STATUS_ORDER[status] ?? -1;
  const steps = ['GERIC', 'TIC/ANS', 'Ger. Exec', 'Comitê', 'Vigente'];
  const isVigente = status === 'Vigente';
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((s, i) => {
        const done = isVigente || i < currentStep;
        const active = !isVigente && i === currentStep;
        const devolvido = active && (status?.startsWith('Devolvido') || status?.startsWith('Reprovado'));
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all
                ${isVigente ? 'bg-emerald-500 text-white' :
                  done ? 'bg-emerald-500 text-white' :
                  devolvido ? 'bg-rose-500 text-white' :
                  active ? 'bg-amber-500 text-white' :
                  'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                {done ? '✓' : devolvido ? '↩' : i + 1}
              </div>
              <span className={`text-[8px] font-bold mt-1 whitespace-nowrap ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 rounded transition-all ${done || isVigente ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-800'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Card de Plano ─────────────────────────────────────────────────────────
function PlanCard({ plano, db, usuario, onRefresh }) {
  const [showLog, setShowLog] = useState(false);
  const [modal, setModal] = useState(null);

  const role = usuario?.role;
  const status = plano.status_aprovacao;
  const log = plano.workflow_log || [];

  const contratos = db.contratos?.list() || [];
  const contratoVinculado = contratos.find(c => c.id_contrato === plano.processo?.id_contrato);
  const ansVigente = plano.ans_vigente || (contratoVinculado?.id_contrato);
  const dispensaAns = plano.dispensa_ans;

  const podeAgir = (allowedRoles) => allowedRoles.includes(role);

  const executarTransicao = (novoStatus, parecer, camposExtras) => {
    const aprovNome = `${usuario.nome} (${role})`;
    db.planosContinuidade.transitarWorkflow(plano.id_pco, novoStatus, aprovNome, parecer, camposExtras);
    const planoAtualizado = db.planosContinuidade.list().find(p => p.id_pco === plano.id_pco);
    if (planoAtualizado) {
      try { notificationService.notificarTransicaoWorkflow(db, planoAtualizado, novoStatus, parecer, aprovNome); } catch (_) {}
    }
    setModal(null);
    onRefresh();
  };

  const abrirModal = (tipo, titulo, placeholder, proxStatus, camposExtras) => {
    setModal({ tipo, titulo, placeholder, proxStatus, camposExtras });
  };

  const renderAcoes = () => {
    if ((role === 'gestor_area' || role === 'tic' || role === 'gerente_exec') && (plano.id_gerencia === usuario?.id_gerencia || plano.processo?.id_gerencia === usuario?.id_gerencia)) {
      if (status === 'Rascunho' || status === 'Devolvido GERIC' || status === 'Devolvido TIC' || status === 'Devolvido Gerente' || status === 'Reprovado Comitê') {
        return (
          <button
            onClick={() => abrirModal('enviar', 'Enviar Plano para Revisão GERIC', 'Descreva brevemente o que foi ajustado nesta versão (opcional)...', 'Pendente GERIC')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <ChevronRight className="w-3 h-3" /> Enviar para GERIC
          </button>
        );
      }
    }

    if (podeAgir(['admin_geric'])) {
      if (status === 'Pendente GERIC' || (status === 'Rascunho' && role === 'admin_geric')) {
        return (
          <div className="flex gap-2">
            <button
              onClick={() => abrirModal('aprovar', 'Validação Inicial — GERIC (2ª Linha)', 'Descreva o parecer de validação técnica/metodológica da GERIC...', 'Pendente TIC')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" /> Validar e Encaminhar
            </button>
            <button
              onClick={() => abrirModal('devolver', 'Devolver com Parecer (GERIC)', 'Descreva o motivo da devolução e os ajustes necessários...', 'Devolvido GERIC')}
              className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <XCircle className="w-3 h-3" /> Devolver
            </button>
          </div>
        );
      }

      if (status === 'Pendente Comitê' && role === 'admin_geric') {
        return (
          <div className="flex gap-2">
            <button
              onClick={() => abrirModal('vigente', 'Registrar Deliberação — Comitê Conti VIGENTE', 'Informe o nº da ata e a deliberação do Comitê Conti...', 'Vigente')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <Award className="w-3 h-3" /> Registrar Vigência (Conti)
            </button>
            <button
              onClick={() => abrirModal('reprovar', 'Registrar Reprovação — Comitê Conti', 'Descreva o motivo da reprovação pelo Comitê...', 'Reprovado Comitê')}
              className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <XCircle className="w-3 h-3" /> Reprovar (Conti)
            </button>
          </div>
        );
      }
    }

    if (podeAgir(['tic', 'admin_geric']) && status === 'Pendente TIC') {
      const semAns = !ansVigente && !dispensaAns;
      return (
        <div className="flex flex-col gap-2">
          {semAns && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-2.5 text-[10px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-300">ANS não encontrado</p>
                <p className="text-amber-600 dark:text-amber-400 mt-0.5">Nenhum ANS vigente localizado para este processo. Selecione uma ação abaixo antes de prosseguir.</p>
              </div>
            </div>
          )}
          {ansVigente && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg px-2.5 py-1.5 text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">ANS vigente: {ansVigente}</span>
            </div>
          )}
          {dispensaAns && (
            <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 rounded-lg px-2.5 py-1.5 text-[10px]">
              <Info className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
              <span className="text-sky-700 dark:text-sky-400 font-bold">Dispensa registrada: {dispensaAns}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => abrirModal('aval_tic', 'Aval TIC — Aprovar e encaminhar ao Gerente Executivo', 'Descreva o aval técnico da TIC (PRD, redundância, ANS verificado)...', 'Pendente Gerente Exec',
                semAns ? [{ key: 'ans_vinculado', label: 'Informe o nº do ANS/Contrato verificado', type: 'text', placeholder: 'Ex: CTR-001 ou SEM-ANS-FORMAL', required: false }] : null
              )}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" /> Conceder Aval TIC → Gerente
            </button>
            {semAns && (
              <button
                onClick={() => abrirModal('dispensar_ans', 'Registrar Dispensa Formal de ANS', 'Descreva o motivo da dispensa formal do ANS para este processo...', null,
                  [{ key: 'motivo_dispensa', label: 'Motivo da Dispensa', type: 'text', placeholder: 'Ex: Processo interno sem contrato externo de faturamento', required: true }]
                )}
                className="bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/40 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
              >
                <FileText className="w-3 h-3" /> Registrar Dispensa Formal
              </button>
            )}
            <button
              onClick={() => abrirModal('devolver_tic', 'Devolver com Parecer (TIC)', 'Descreva o motivo da devolução pela TIC...', 'Devolvido TIC')}
              className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <XCircle className="w-3 h-3" /> Devolver
            </button>
          </div>
        </div>
      );
    }

    if (podeAgir(['gerente_exec', 'admin_geric']) && status === 'Pendente Gerente Exec') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => abrirModal('assinar', 'Assinar Plano — Gerente Executivo', 'Registre a assinatura e observações do Gerente Executivo da área...', 'Pendente Comitê')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" /> Assinar e Enviar ao Comitê
          </button>
          <button
            onClick={() => abrirModal('devolver_ger', 'Devolver com Parecer (Gerente Exec)', 'Descreva o motivo da devolução...', 'Devolvido Gerente')}
            className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
          >
            <XCircle className="w-3 h-3" /> Devolver
          </button>
        </div>
      );
    }

    if (podeAgir(['conti']) && status === 'Pendente Comitê') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => abrirModal('vigente_conti', 'Registrar Deliberação FAVORÁVEL — Comitê Conti', 'Informe o nº da ata e a deliberação do Comitê Conti...', 'Vigente')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
          >
            <Award className="w-3 h-3" /> Deliberar VIGENTE
          </button>
          <button
            onClick={() => abrirModal('reprovar_conti', 'Registrar Reprovação — Comitê Conti', 'Descreva o motivo da reprovação pelo Comitê...', 'Reprovado Comitê')}
            className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
          >
            <XCircle className="w-3 h-3" /> Reprovar
          </button>
        </div>
      );
    }

    if (status === 'Vigente') {
      return <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Plano Vigente — Ativo</span>;
    }

    return <span className="text-[10px] text-slate-400 italic">Aguardando sua alçada...</span>;
  };

  const handleModalConfirm = (parecer, extras) => {
    if (!modal) return;

    if (modal.tipo === 'dispensar_ans') {
      const motivo = extras?.motivo_dispensa || parecer;
      db.planosContinuidade.transitarWorkflow(plano.id_pco, status, `${usuario.nome} (TIC)`, `Dispensa de ANS registrada: ${motivo}`, { dispensa_ans: motivo });
      setModal(null);
      onRefresh();
      return;
    }

    const camposExtras = {};
    if (modal.proxStatus === 'Pendente TIC' || modal.proxStatus === 'Pendente Gerente Exec') {
      if (extras?.ans_vinculado) camposExtras.ans_vigente = extras.ans_vinculado;
      camposExtras.parecer_geric = parecer;
    }
    if (modal.proxStatus === 'Pendente Gerente Exec') {
      camposExtras.parecer_tic = parecer;
    }
    if (modal.proxStatus === 'Pendente Comitê') {
      camposExtras.parecer_gerente = parecer;
    }
    if (modal.proxStatus === 'Vigente' || modal.proxStatus === 'Reprovado Comitê') {
      camposExtras.parecer_comite = parecer;
    }
    if (extras?.id_gerente_exec) camposExtras.id_gerente_exec_aprovador = extras.id_gerente_exec;

    executarTransicao(modal.proxStatus, parecer, camposExtras);
  };

  return (
    <>
      {modal && (
        <ModalParecer
          titulo={modal.titulo}
          placeholder={modal.placeholder}
          onConfirm={handleModalConfirm}
          onCancel={() => setModal(null)}
          obrigatorio={modal.tipo !== 'enviar'}
          extraFields={modal.camposExtras}
        />
      )}

      <div className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm transition-all hover:shadow-md
        ${status === 'Vigente' ? 'border-emerald-200 dark:border-emerald-800/40' :
          status?.startsWith('Devolvido') || status?.startsWith('Reprovado') ? 'border-rose-200 dark:border-rose-800/40' :
          'border-slate-200 dark:border-slate-800'}`}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{plano.id_pco}</span>
                <span className={`inline-block px-2 py-0.5 rounded border text-[9px] font-black uppercase ${STATUS_COLOR(status)}`}>{status}</span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-semibold">v{plano.versao}</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1 truncate">{plano.processo?.nome || plano.id_processo}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{plano.processo?.id_gerencia || plano.id_gerencia} • {plano.processo?.criticidade || 'Normal'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {renderAcoes()}
            </div>
          </div>

          {/* Stepper */}
          <WorkflowStepper status={status} />
        </div>

        {/* Pareceres por alçada já concluídas */}
        {(plano.parecer_geric || plano.parecer_tic || plano.parecer_gerente || plano.parecer_comite) && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'GERIC', valor: plano.parecer_geric },
              { label: 'TIC', valor: plano.parecer_tic },
              { label: 'Ger. Exec', valor: plano.parecer_gerente },
              { label: 'Comitê', valor: plano.parecer_comite },
            ].map(p => p.valor && (
              <div key={p.label} className="space-y-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase">{p.label}</span>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2" title={p.valor}>{p.valor}</p>
              </div>
            ))}
          </div>
        )}

        {/* Log de auditoria */}
        {log.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowLog(!showLog)}
              className="w-full px-5 py-2.5 text-left flex items-center justify-between text-[10px] text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
            >
              <span className="font-semibold flex items-center gap-1.5"><Clock className="w-3 h-3" /> Log de Auditoria ({log.length} evento{log.length > 1 ? 's' : ''})</span>
              {showLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showLog && (
              <div className="px-5 pb-4 space-y-2">
                {[...log].reverse().map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 text-[10px]">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border ${STATUS_COLOR(entry.status)}`}>{entry.status}</span>
                        <span className="text-slate-500 font-semibold">{entry.aprovador}</span>
                        <span className="text-slate-400">{new Date(entry.data).toLocaleString('pt-BR')}</span>
                      </div>
                      {entry.parecer && <p className="text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{entry.parecer}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Componente Principal ─────────────────────────────────────────────────────
export default function GovernancaAprovacao({ db }) {
  const { usuario, isAdmin } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [showGovForm, setShowGovForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedProcId, setSelectedProcId] = useState('');
  const [govFormData, setGovFormData] = useState({ responsavel: '', comunicacao: '', treinamento: '' });

  const onRefresh = () => {
    setRefresh(r => r + 1);
    setNotification({ type: 'success', text: 'Workflow atualizado com sucesso!' });
    setTimeout(() => setNotification(null), 4000);
  };

  const todosPlanos = db.planosContinuidade.list();
  const planosFiltrados = useMemo(() => {
    let lista = isAdmin()
      ? todosPlanos
      : todosPlanos.filter(p => p.id_gerencia === usuario?.id_gerencia || p.processo?.id_gerencia === usuario?.id_gerencia);

    if (busca) lista = lista.filter(p =>
      (p.id_pco + ' ' + (p.processo?.nome || '') + ' ' + p.status_aprovacao).toLowerCase().includes(busca.toLowerCase())
    );

    if (filtroStatus !== 'todos') {
      if (filtroStatus === 'vigente') lista = lista.filter(p => p.status_aprovacao === 'Vigente');
      else if (filtroStatus === 'pendente') lista = lista.filter(p => p.status_aprovacao?.startsWith('Pendente'));
      else if (filtroStatus === 'devolvido') lista = lista.filter(p => p.status_aprovacao?.startsWith('Devolvido') || p.status_aprovacao?.startsWith('Reprovado'));
    }

    return lista.sort((a, b) => (STATUS_ORDER[b.status_aprovacao] ?? -1) - (STATUS_ORDER[a.status_aprovacao] ?? -1));
  }, [refresh, busca, filtroStatus, usuario]);

  const governanca = db.governancaGCN.list();
  const processosParaGov = isAdmin()
    ? db.processosCriticos.list()
    : db.processosCriticos.list().filter(p => p.id_gerencia === usuario?.id_gerencia);

  const kpis = {
    vigente: todosPlanos.filter(p => p.status_aprovacao === 'Vigente').length,
    pendente: todosPlanos.filter(p => p.status_aprovacao?.startsWith('Pendente')).length,
    devolvido: todosPlanos.filter(p => p.status_aprovacao?.startsWith('Devolvido') || p.status_aprovacao?.startsWith('Reprovado')).length,
    total: todosPlanos.length,
  };

  const handleGovSubmit = (e) => {
    e.preventDefault();
    if (!selectedProcId || !govFormData.responsavel) return;
    db.governancaGCN.save({ id_processo: selectedProcId, ...govFormData });
    setShowGovForm(false);
    setSelectedProcId('');
    setGovFormData({ responsavel: '', comunicacao: '', treinamento: '' });
    onRefresh();
  };

  const ic = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-indigo-500";

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Notificação */}
      {notification && (
        <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {notification.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Central de Aprovação de Planos GCN — Workflow em 4 Alçadas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Fluxo: <strong>Área (Elaboração)</strong> → <strong>GERIC (2ª Linha - Validação)</strong> → <strong>TIC/ANS (Aval Técnico)</strong> → <strong>Gerente Executivo (Assinatura)</strong> → <strong>Comitê Conti (Homologação)</strong> → <span className="text-emerald-600 font-bold">Vigente</span> (ISO 22301 §8.4.5)
          </p>
        </div>
        {isAdmin() && (
          <button onClick={() => setShowGovForm(!showGovForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap cursor-pointer">
            Atribuir Responsável GCN
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Vigentes', val: kpis.vigente, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Em Aprovação', val: kpis.pendente, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Devolvidos', val: kpis.devolvido, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
          { label: 'Total de Planos', val: kpis.total, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4 border border-transparent`}>
            <p className={`text-2xl font-black ${k.color}`}>{k.val}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar plano..."
            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-indigo-500"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-indigo-500"
        >
          <option value="todos">Todos os status</option>
          <option value="vigente">✅ Vigentes</option>
          <option value="pendente">⏳ Em aprovação</option>
          <option value="devolvido">↩️ Devolvidos/Reprovados</option>
        </select>
      </div>

      {/* Form Atribuição Governança */}
      {showGovForm && (
        <form onSubmit={handleGovSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs animate-slide-up">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <h4 className="font-bold text-slate-800 dark:text-white text-xs">Atribuir Governança ao Processo</h4>
            <button type="button" onClick={() => setShowGovForm(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">Cancelar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Processo Crítico *</label>
              <select value={selectedProcId} onChange={e => setSelectedProcId(e.target.value)} className={ic} required>
                <option value="">Selecione...</option>
                {processosParaGov.map(p => <option key={p.id_processo} value={p.id_processo}>{p.id_processo} - {p.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Líder Responsável *</label>
              <input type="text" value={govFormData.responsavel} onChange={e => setGovFormData({ ...govFormData, responsavel: e.target.value })} className={ic} placeholder="Ex: Patrícia Lima (Getic)" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Canal de Comunicação Crítica</label>
              <input type="text" value={govFormData.comunicacao} onChange={e => setGovFormData({ ...govFormData, comunicacao: e.target.value })} className={ic} placeholder="Ex: PagerDuty / Slack #SRE" />
            </div>
            <div className="space-y-1 md:col-span-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Política de Treinamento</label>
              <textarea rows={2} value={govFormData.treinamento} onChange={e => setGovFormData({ ...govFormData, treinamento: e.target.value })} className={ic} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setShowGovForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs cursor-pointer">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm">Vincular Governança</button>
          </div>
        </form>
      )}

      {/* Lista de Planos */}
      <div className="space-y-4">
        {planosFiltrados.map(p => (
          <PlanCard key={p.id_pco} plano={p} db={db} usuario={usuario} onRefresh={onRefresh} />
        ))}
        {planosFiltrados.length === 0 && (
          <div className="p-10 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Nenhum plano encontrado para os filtros selecionados</p>
          </div>
        )}
      </div>

      {/* Matriz de Governança */}
      {governanca.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
            <h3 className="font-bold text-slate-850 dark:text-white text-xs uppercase tracking-wider">Matriz de Governança GCN</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {governanca.map(g => (
              <div key={g.id_governanca} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200 dark:border-slate-850 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-indigo-500 font-bold uppercase">{g.id_governanca}</span>
                  <span className="bg-indigo-55 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[9px] font-bold">{g.id_processo}</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><User className="w-3 h-3 text-slate-400" /> {g.responsavel}</p>
                {g.comunicacao && <p className="text-[10px] text-slate-500 dark:text-slate-400"><strong>Canal:</strong> {g.comunicacao}</p>}
                {g.treinamento && <p className="text-[10px] text-slate-500 dark:text-slate-400"><strong>Treinamento:</strong> {g.treinamento}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

