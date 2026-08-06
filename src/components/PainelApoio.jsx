import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Users, DollarSign, Truck, Play, Square, 
  Check, AlertOctagon, ArrowRight, Clock, Award, Building2 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PainelApoio({ db }) {
  const { usuario, isAdmin } = useAuth();
  
  // Abas internas: 'gesap', 'gepes', 'gefic', 'gesuc'
  const [apoioTab, setApoioTab] = useState(() => {
    if (usuario?.role === 'apoio_predial') return 'gesap';
    if (usuario?.role === 'apoio_pessoas') return 'gepes';
    if (usuario?.role === 'apoio_financeiro') return 'gefic';
    if (usuario?.role === 'apoio_suprimentos') return 'gesuc';
    return 'gesap';
  });

  const [notification, setNotification] = useState(null);

  // ─── 🏢 GESAP: SIMULADOR DE EVACUAÇÃO PREDIAL ────────────────────────────────
  const [isEvacuando, setIsEvacuando] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [andares, setAndares] = useState([
    { andar: '1º Andar (Canais & Atendimento)', evacuado: false, responsavel: 'Carlos Santos (Brigada)' },
    { andar: '2º Andar (TI & Operações)', evacuado: false, responsavel: 'Fernanda Lima (Brigada)' },
    { andar: '3º Andar (Diretoria & GERIC)', evacuado: false, responsavel: 'Amanda Sousa (Brigada)' },
    { andar: '4º Andar (RH & Financeiro)', evacuado: false, responsavel: 'Ricardo Mello (Brigada)' },
  ]);
  const [evacConcluida, setEvacConcluida] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isEvacuando) {
      timerRef.current = setInterval(() => {
        setTempoDecorrido(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isEvacuando]);

  const handleStartEvacuacao = () => {
    setIsEvacuando(true);
    setTempoDecorrido(0);
    setEvacConcluida(false);
    setAndares(andares.map(a => ({ ...a, evacuado: false })));
    setNotification({ type: 'info', text: '🚨 Protocolo de Evacuação Predial iniciado! Alarme sonoro disparado nos 4 andares.' });
  };

  const handleToggleAndar = (idx) => {
    const updated = [...andares];
    updated[idx].evacuado = !updated[idx].evacuado;
    setAndares(updated);

    // Se todos evacuados, conclui automaticamente
    if (updated.every(a => a.evacuado)) {
      setIsEvacuando(false);
      setEvacConcluida(true);
      setNotification({ 
        type: 'success', 
        text: `✅ Evacuação predial concluída com sucesso! Tempo total: ${Math.floor(tempoDecorrido / 60)}m ${tempoDecorrido % 60}s. Protocolo ABNT NBR 15219 cumprido.` 
      });
      
      // Registrar no log de incidentes como simulado
      db.incidentes.create({
        data_hora: new Date().toISOString(),
        local: "Edifício Sede (Simulado Predial)",
        descricao: `Exercício prático de evacuação predial coordenada pela Gesap. Evacuação total concluída em ${Math.floor(tempoDecorrido / 60)}m ${tempoDecorrido % 60}s.`,
        tipo_incidente: "Simulado Predial / Brigada",
        impacto: "Baixo",
        id_processo: "PROC-APO-004",
        medidas_mitigacao: "Exercício concluído com brigada de incêndio.",
        resultado_resposta: "Evacuação bem-sucedida dentro do SLA regulatório.",
        rto_real_minutos: Math.round(tempoDecorrido / 60),
        rto_meta_minutos: 15,
        rto_ultrapassado: tempoDecorrido > 900,
        status_incidente: "fechado",
        critico: false
      });
    }
  };

  const formatTempo = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── 👥 GEPES: ABSENTEÍSMO E SUBISTITUTOS DE LIDERANÇA ─────────────────────────
  const [lideranças, setLideranças] = useState([
    { id: 'LID-001', area: 'Diretoria Executiva', cargo: 'Gerente Executivo Gecob', titular: 'Fernanda Rocha', substituto: 'Marcos Costa', status: 'Disponível' },
    { id: 'LID-002', area: 'Infraestrutura de TI', cargo: 'Gerente Executivo SRE', titular: 'Patrícia Lima', substituto: 'Eduardo Santos', status: 'Disponível' },
    { id: 'LID-003', area: 'Administração Predial', cargo: 'Gerente Executivo Gesap', titular: 'Sandro Lima', substituto: 'Carlos Brigadista', status: 'Disponível' },
    { id: 'LID-004', area: 'Financeiro', cargo: 'Gerente Executivo Gefic', titular: 'Carla Mendes', substituto: 'Roberto Carlos', status: 'Disponível' }
  ]);

  const handleToggleLider = (id) => {
    setLideranças(lideranças.map(l => {
      if (l.id === id) {
        const novoStatus = l.status === 'Disponível' ? 'INDISPONÍVEL / AFASTADO' : 'Disponível';
        if (novoStatus === 'INDISPONÍVEL / AFASTADO') {
          setNotification({ 
            type: 'info', 
            text: `⚠️ Alerta Gepes: ${l.titular} marcado como indisponível. Liderança assumida imediatamente pelo substituto: ${l.substituto}.` 
          });
        }
        return { ...l, status: novoStatus };
      }
      return l;
    }));
  };

  // ─── 💵 GEFIC: LIBERAÇÃO DE RECURSOS EM CRISE ────────────────────────────────
  const [pagamentos, setPagamentos] = useState([
    { id: 'PAG-001', solicitante: 'Getic (TI)', valor: 85000.00, finalidade: 'Ativação emergencial de link de fibra de contingência', status: 'Pendente', data: '2026-08-06' },
    { id: 'PAG-002', solicitante: 'Gesap (Predial)', valor: 25000.00, finalidade: 'Contratação emergencial de engenheiro civil para laudo estrutural', status: 'Pendente', data: '2026-08-06' },
    { id: 'PAG-003', solicitante: 'Gecob (Canais)', valor: 150000.00, finalidade: 'Pagamento antecipado de BPO de contingência de atendimento', status: 'Aprovado', data: '2026-08-05' }
  ]);

  const handleAprovarPagamento = (id) => {
    setPagamentos(pagamentos.map(p => {
      if (p.id === id) {
        setNotification({ 
          type: 'success', 
          text: `✅ Pagamento ${p.id} no valor de R$ ${p.valor.toLocaleString('pt-BR')} liberado emergencialmente pelo Financeiro (Gefic). SLA cumprido.` 
        });
        return { ...p, status: 'Aprovado' };
      }
      return p;
    }));
  };

  // ─── 🚚 GESUC: CONTINGÊNCIA DE FORNECEDORES (MULTI-VENDOR) ──────────────────────
  const [fornecedores, setFornecedores] = useState([
    { id: 'FORN-001', servico: 'Conectividade WAN (Link)', principal: 'Embratel (CTR-002)', contingencia: 'Claro Telecom (CTR-ALT-002)', acionado: false },
    { id: 'FORN-002', servico: 'Hospedagem Cloud', principal: 'AWS us-east-1 (CTR-001)', contingencia: 'Google Cloud sa-east-1', acionado: false },
    { id: 'FORN-003', servico: 'Atendimento Canais', principal: 'Contax BPO', contingencia: 'Algar Tech BPO', acionado: false }
  ]);

  const handleAcionarFornecedor = (id) => {
    setFornecedores(fornecedores.map(f => {
      if (f.id === id) {
        const novoEstado = !f.acionado;
        if (novoEstado) {
          setNotification({ 
            type: 'info', 
            text: `🚚 Suprimentos acionou o fornecedor de contingência: ${f.contingencia} para suprir falha de ${f.principal}.` 
          });
        }
        return { ...f, acionado: novoEstado };
      }
      return f;
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER INFORMATIVO */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" /> Painel de Áreas de Apoio à Continuidade (GCN Apoio)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Módulos de acionamento emergencial e planos das gerências administrativas de apoio à resiliência operacional (ISO 22301 & ABNT NBR 15219).
        </p>
      </div>

      {/* NOTIFICAÇÃO DO PAINEL */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold animate-slide-up ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450' : 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400'
        }`}>
          <AlertOctagon className="w-4 h-4 text-indigo-500" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* NAVEGAÇÃO DE ABAS INTERNAS */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-4 sm:gap-8 text-xs font-bold">
        {[
          { key: 'gesap', label: '🏢 Gesap (Predial)', role: 'apoio_predial' },
          { key: 'gepes', label: '👥 Gepes (Pessoas/RH)', role: 'apoio_pessoas' },
          { key: 'gefic', label: '💵 Gefic (Financeiro)', role: 'apoio_financeiro' },
          { key: 'gesuc', label: '🚚 Gesuc (Suprimentos)', role: 'apoio_suprimentos' },
        ].map(item => {
          const isAcessivel = isAdmin || usuario?.role === item.role || usuario?.role === 'visualizador';
          const isAtivo = apoioTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { setApoioTab(item.key); setNotification(null); }}
              className={`pb-3 transition-all relative flex items-center gap-1.5 ${
                isAtivo 
                  ? 'border-b-2 border-indigo-650 dark:border-indigo-400 text-indigo-650 dark:text-indigo-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              } ${!isAcessivel ? 'opacity-50' : ''}`}
            >
              {item.label}
              {!isAcessivel && <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded border font-normal">Restrito</span>}
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          ABA: GESAP (PREDIAL)
          ─────────────────────────────────────────────────────────────────────── */}
      {apoioTab === 'gesap' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-6 text-xs">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm">Simulador de Evacuação Predial e Brigada (Gesap)</h3>
            <p className="text-xs text-slate-400 mt-0.5">SLA Regulatório de Evacuação Total: 15 minutos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Painel do Cronômetro */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-850 flex flex-col items-center justify-center space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempo de Evacuação</span>
              <div className="text-4xl font-mono font-black text-indigo-600 dark:text-indigo-400 animate-pulse">
                {formatTempo(tempoDecorrido)}
              </div>
              
              {!isEvacuando && !evacConcluida ? (
                <button
                  onClick={handleStartEvacuacao}
                  className="bg-rose-650 hover:bg-rose-700 text-white font-extrabold px-6 py-2.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-transform cursor-pointer hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-white" /> Disparar Alarme / Iniciar Evacuação
                </button>
              ) : isEvacuando ? (
                <div className="flex gap-2">
                  <span className="px-4 py-2 bg-rose-100 text-rose-700 font-bold rounded-lg animate-pulse">
                    🚨 EVACUANDO PRÉDIO
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleStartEvacuacao}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  Reiniciar Simulado
                </button>
              )}
            </div>

            {/* Checklist dos Andares */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-bold text-slate-850 dark:text-white">Status dos Andares do Edifício Central:</h4>
              <div className="space-y-2">
                {andares.map((a, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                    a.evacuado 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div>
                      <div className="font-bold">{a.andar}</div>
                      <div className="text-[10px] text-slate-450 mt-0.5">Brigadista: {a.responsavel}</div>
                    </div>
                    <button
                      onClick={() => isEvacuando && handleToggleAndar(idx)}
                      disabled={!isEvacuando}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        a.evacuado 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50'
                      }`}
                    >
                      {a.evacuado ? <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Evacuado</span> : 'Marcar Liberado'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ABA: GEPES (RH)
          ─────────────────────────────────────────────────────────────────────── */}
      {apoioTab === 'gepes' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-6 text-xs">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm">Escala de Absenteísmo e Substitutos de Liderança (Gepes)</h3>
            <p className="text-xs text-slate-450 mt-0.5">Defina indisponibilidade e valide substitutos em tempo real em Modo Degradado.</p>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-955/40 text-[9px] font-black text-slate-455 uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-3">Área / Gerência</th>
                  <th className="px-5 py-3">Cargo Crítico</th>
                  <th className="px-5 py-3">Líder Titular</th>
                  <th className="px-5 py-3">Substituto Estatutário</th>
                  <th className="px-5 py-3 text-center">Status Liderança</th>
                  <th className="px-5 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lideranças.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="px-5 py-3.5 font-bold text-indigo-650 dark:text-indigo-400">{l.area}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-350">{l.cargo}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">{l.titular}</td>
                    <td className="px-5 py-3.5 text-slate-650 dark:text-slate-400 font-semibold">{l.substituto}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black ${
                        l.status === 'Disponível'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-955/40 dark:text-emerald-450'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-955/40 dark:text-rose-455 border border-rose-250 animate-pulse'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleLider(l.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          l.status === 'Disponível'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {l.status === 'Disponível' ? 'Afastar Líder' : 'Restabelecer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ABA: GEFIC (FINANCEIRO)
          ─────────────────────────────────────────────────────────────────────── */}
      {apoioTab === 'gefic' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-6 text-xs">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm">Liberação de Recursos e Verbas Emergenciais (Gefic)</h3>
            <p className="text-xs text-slate-450 mt-0.5">SLA de liberação rápida de pagamentos para contingência: 4 horas</p>
          </div>

          <div className="space-y-4">
            {pagamentos.map(p => (
              <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-indigo-500 font-bold">{p.id}</span>
                    <span className="text-[10px] text-slate-400">Solicitado em: {p.data}</span>
                  </div>
                  <h4 className="font-bold text-slate-850 dark:text-white text-xs leading-normal">
                    Solicitante: <strong className="text-indigo-650 dark:text-indigo-400 font-black">{p.solicitante}</strong> · Finalidade: {p.finalidade}
                  </h4>
                  <div className="text-xs font-extrabold text-rose-600 dark:text-rose-455">
                    Valor: R$ {p.valor.toLocaleString('pt-BR')}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${
                    p.status === 'Aprovado'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-955/40 dark:text-amber-450 animate-pulse'
                  }`}>
                    {p.status.toUpperCase()}
                  </span>
                  
                  {p.status === 'Pendente' && (
                    <button
                      onClick={() => handleAprovarPagamento(p.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-lg text-[10px] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Liberar Verba
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ABA: GESUC (SUPRIMENTOS)
          ─────────────────────────────────────────────────────────────────────── */}
      {apoioTab === 'gesuc' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-6 text-xs">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm">Contingência de Fornecedores & Acionamentos de Backup (Gesuc)</h3>
            <p className="text-xs text-slate-450 mt-0.5">Gestão de Multi-Vendor e acionamento de parceiros contratuais secundários.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fornecedores.map(f => (
              <div key={f.id} className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4 shadow-2xs flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-800 transition-colors">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold text-indigo-500 uppercase">{f.id}</span>
                    <span className="text-[10px] font-bold text-slate-450 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border">{f.servico}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-xs">{f.servico}</h4>
                  
                  <div className="space-y-1.5 p-3 bg-white dark:bg-slate-900 rounded border border-slate-150 dark:border-slate-850 text-[11px] leading-relaxed">
                    <div className="text-slate-500">Fornecedor Principal: <strong className="text-slate-800 dark:text-slate-250 font-bold">{f.principal}</strong></div>
                    <div className="text-indigo-500 font-semibold flex items-center gap-1">Fornecedor Contingência: <strong className="font-bold">{f.contingencia}</strong></div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-850 pt-3">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                    f.acionado 
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-455 animate-pulse' 
                      : 'bg-slate-150 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {f.acionado ? '🚨 CONTINGÊNCIA ATIVA' : 'STANDBY'}
                  </span>
                  
                  <button
                    onClick={() => handleAcionarFornecedor(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                      f.acionado 
                        ? 'bg-slate-150 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    {f.acionado ? 'Desativar' : 'Acionar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
