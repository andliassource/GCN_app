import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Users, DollarSign, Truck, Play, 
  Check, AlertOctagon, Building2, Flame, Droplets, Wind, Zap,
  AlertTriangle, Clock, FileWarning, HeartPulse, Scale,
  Receipt, Landmark, ShieldCheck, PackageX, Gavel,
  Siren, ThermometerSun, UserX, CalendarClock, BriefcaseMedical
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ─── DADOS REALISTAS DE CENÁRIOS DE CONTINGÊNCIA ────────────────────────────────

const CENARIOS_PREDIAL = [
  { id: 'PRED-001', tipo: 'Incêndio / Princípio de Incêndio', icon: Flame, severidade: 'Crítica', cor: 'rose',
    descricao: 'Incêndio detectado no edifício sede. Acionar brigada de incêndio, evacuar andares afetados, contatar Corpo de Bombeiros (193).',
    protocolo: 'ABNT NBR 15219 / IT-17 CBMSP',
    acoes: ['Acionar alarme de incêndio', 'Evacuar andares pelo protocolo de rotas', 'Chamar Bombeiros (193)', 'Desligar quadro geral de energia', 'Isolar área atingida', 'Verificar vítimas e prestar primeiros socorros'] },
  { id: 'PRED-002', tipo: 'Alagamento / Inundação', icon: Droplets, severidade: 'Alta', cor: 'sky',
    descricao: 'Alagamento por chuvas intensas ou rompimento de tubulação comprometendo áreas operacionais, CPD ou subestação elétrica.',
    protocolo: 'PCO Predial / Plano de Drenagem',
    acoes: ['Desligar energia nas áreas alagadas', 'Acionar bombas de drenagem', 'Proteger equipamentos de TI com lonas', 'Redirecionar colaboradores para andares secos', 'Acionar seguradora para vistoria', 'Documentar danos para laudo pericial'] },
  { id: 'PRED-003', tipo: 'Falha no Ar-Condicionado (HVAC)', icon: ThermometerSun, severidade: 'Alta', cor: 'amber',
    descricao: 'Pane no sistema HVAC central. Temperatura do Data Center excedendo 28°C — risco de desligamento automático de servidores por proteção térmica.',
    protocolo: 'SLA Manutenção HVAC / ASHRAE TC 9.9',
    acoes: ['Acionar manutenção predial de emergência', 'Ativar climatização de contingência portátil no CPD', 'Monitorar temperatura dos racks via SNMP', 'Se >35°C: desligar servidores não-essenciais ordenadamente', 'Notificar Getic sobre risco de indisponibilidade', 'Registrar ocorrência no CMDB'] },
  { id: 'PRED-004', tipo: 'Queda de Energia Elétrica / Falha Gerador', icon: Zap, severidade: 'Crítica', cor: 'rose',
    descricao: 'Interrupção total ou parcial do fornecimento de energia pela concessionária. Grupo gerador não partiu automaticamente ou falhou após acionamento.',
    protocolo: 'PCO Energia / Contrato SLA Concessionária',
    acoes: ['Verificar se nobreak (UPS) do CPD assumiu a carga', 'Acionar partida manual do grupo gerador', 'Contatar concessionária para ETA de restabelecimento', 'Se gerador falhou: acionar empresa de manutenção emergencial', 'Priorizar carga elétrica para Data Center e sistemas críticos', 'Desligar iluminação e elevadores não-essenciais'] },
  { id: 'PRED-005', tipo: 'Ameaça de Bomba / Invasão Predial', icon: Siren, severidade: 'Crítica', cor: 'rose',
    descricao: 'Recebimento de ameaça de bomba por telefone, e-mail ou correspondência, ou tentativa de invasão armada ao edifício.',
    protocolo: 'Protocolo de Segurança Patrimonial / Polícia Militar',
    acoes: ['NÃO desligar a ligação (se por telefone) — anotar tudo', 'Acionar 190 (Polícia Militar) imediatamente', 'Evacuar o prédio pela rota mais distante da ameaça', 'NÃO manusear objetos suspeitos', 'Bloquear acessos ao edifício', 'Registrar boletim de ocorrência e acionar jurídico'] },
  { id: 'PRED-006', tipo: 'Contaminação / Vazamento de Gás', icon: Wind, severidade: 'Alta', cor: 'amber',
    descricao: 'Vazamento de gás (GLP, ar-condicionado R-410A) ou contaminação ambiental detectada por sensores ou funcionários com mal-estar.',
    protocolo: 'NR-15 / PPRA / Defesa Civil',
    acoes: ['Evacuar imediatamente a área afetada', 'NÃO acionar interruptores elétricos na área', 'Abrir janelas para ventilação se seguro', 'Acionar concessionária de gás ou manutenção HVAC', 'Prestar primeiros socorros a colaboradores com sintomas', 'Chamar SAMU (192) se houver intoxicação'] },
];

const CENARIOS_PESSOAS = [
  { id: 'PES-001', tipo: 'Greve de Funcionários / Greve Geral', icon: Users, severidade: 'Crítica', cor: 'rose',
    descricao: 'Movimento grevista interno afetando operações ou greve geral de transporte público impedindo deslocamento dos colaboradores.',
    impacto: 'Paralisação total ou parcial de áreas operacionais críticas, impossibilidade de atendimento ao cliente.',
    acoes: ['Ativar plano de trabalho remoto emergencial para áreas elegíveis', 'Acionar BPO de contingência para atendimento (Gecob)', 'Escalar negociação com sindicato e assessoria jurídica trabalhista', 'Mapear funcionários-chave que conseguem se deslocar', 'Comunicar clientes sobre possível degradação de SLA', 'Registrar ponto e ausências para conformidade eSocial'] },
  { id: 'PES-002', tipo: 'Pandemia / Epidemia (Crise Sanitária)', icon: HeartPulse, severidade: 'Crítica', cor: 'rose',
    descricao: 'Surto epidêmico (gripe, dengue, COVID) com absenteísmo massivo (>30%) comprometendo a capacidade operacional da empresa.',
    impacto: 'Absenteísmo em massa, risco de contágio no ambiente de trabalho, obrigação regulatória de afastamento.',
    acoes: ['Ativar home office compulsório para toda a empresa', 'Suspender viagens corporativas e eventos presenciais', 'Acionar equipe de medicina do trabalho (PCMSO)', 'Distribuir EPIs e estabelecer protocolo sanitário nas áreas presenciais', 'Comunicar à Vigilância Sanitária se necessário', 'Ajustar escalas para garantir operação mínima dos processos críticos', 'Verificar cobertura de seguro saúde e afastamentos INSS'] },
  { id: 'PES-003', tipo: 'Falha no Processamento de Folha de Pagamento', icon: DollarSign, severidade: 'Crítica', cor: 'rose',
    descricao: 'Erro sistêmico ou indisponibilidade do sistema de folha impedindo o processamento e crédito de salários no prazo legal (5º dia útil).',
    impacto: 'Descumprimento da CLT Art. 459, risco de ação trabalhista coletiva, impacto moral e retenção de talentos.',
    acoes: ['Acionar suporte emergencial do fornecedor do sistema de folha', 'Se sistema indisponível: processar folha manualmente via planilha auditada', 'Comunicar colaboradores sobre atraso e previsão de regularização', 'Gerar arquivo bancário CNAB alternativo para crédito emergencial', 'Notificar sindicato sobre o evento e medidas em curso', 'Registrar incidente para análise de causa raiz e prevenção'] },
  { id: 'PES-004', tipo: 'Obrigações eSocial / GFIP / DCTFWeb em Risco', icon: FileWarning, severidade: 'Alta', cor: 'amber',
    descricao: 'Prazo de envio de obrigações acessórias (eSocial, DCTFWeb, RAIS, DIRF) em risco de descumprimento por falha de sistema ou dados inconsistentes.',
    impacto: 'Multas da Receita Federal (R$ 500 a R$ 1.500/mês por obrigação), bloqueio de CND, risco de autuação fiscal.',
    acoes: ['Identificar qual obrigação está em risco e o prazo exato', 'Acionar TI para restaurar acesso ao sistema de folha/eSocial', 'Preparar transmissão manual via portal gov.br se sistema falhar', 'Comunicar contabilidade e compliance fiscal sobre o risco', 'Documentar justificativa técnica para eventual pedido de prorrogação', 'Se multa gerada: avaliar impugnação administrativa'] },
  { id: 'PES-005', tipo: 'Acidente de Trabalho Grave', icon: BriefcaseMedical, severidade: 'Crítica', cor: 'rose',
    descricao: 'Acidente grave com funcionário em horário de trabalho resultando em hospitalização ou óbito. Obrigação de CAT (Comunicação de Acidente de Trabalho) em 24h.',
    impacto: 'Obrigação legal de CAT em 24h (CLT Art. 169), risco de interdição pelo MTE, responsabilidade civil e criminal.',
    acoes: ['Prestar socorro imediato e acionar SAMU (192)', 'Emitir CAT no prazo de 24h via eSocial', 'Preservar o local do acidente para perícia', 'Comunicar CIPA e realizar investigação de causa raiz', 'Acionar seguro de vida e assistência ao colaborador/família', 'Notificar Ministério do Trabalho se acidente fatal'] },
  { id: 'PES-006', tipo: 'Perda de Liderança Crítica (Sucessão)', icon: UserX, severidade: 'Alta', cor: 'amber',
    descricao: 'Afastamento súbito (doença, demissão, falecimento) de líder de área crítica sem substituto formalmente designado.',
    impacto: 'Vácuo de liderança em processos decisórios, perda de conhecimento tácito, paralisia operacional da gerência.',
    acoes: ['Ativar plano de sucessão emergencial da área afetada', 'Designar substituto interino por portaria interna', 'Garantir transferência de acessos e procurações (se aplicável)', 'Comunicar stakeholders internos e externos sobre mudança', 'Agendar repasse de conhecimento com equipe da área', 'Iniciar processo seletivo para reposição definitiva se necessário'] },
];

const CENARIOS_FINANCEIRO = [
  { id: 'FIN-001', tipo: 'Descumprimento de Obrigação Tributária (SPED/EFD/DCTF)', icon: Landmark, severidade: 'Crítica', cor: 'rose',
    descricao: 'Risco iminente de perda do prazo de entrega de obrigações fiscais federais, estaduais ou municipais (SPED Fiscal, EFD-Contribuições, DCTF, GIA).',
    impacto: 'Multas de até 10% sobre o tributo devido, bloqueio de CND (Certidão Negativa de Débitos), impedimento de participar de licitações e obter financiamentos.',
    acoes: ['Identificar obrigação e deadline exatos', 'Acionar TI para restaurar acesso ao ERP/SPED se indisponível', 'Transmitir via contingência offline (PVA) se portal indisponível', 'Comunicar diretoria sobre exposição financeira estimada', 'Documentar causa técnica para eventual defesa administrativa', 'Se multa aplicada: protocolar impugnação no prazo de 30 dias'] },
  { id: 'FIN-002', tipo: 'Bloqueio Judicial / Penhora de Conta', icon: Gavel, severidade: 'Crítica', cor: 'rose',
    descricao: 'Bloqueio judicial de conta corrente da empresa via BacenJud/SISBAJUD afetando o fluxo de caixa e capacidade de pagamento.',
    impacto: 'Impossibilidade de pagar fornecedores, salários e tributos. Risco de efeito cascata com inadimplência generalizada.',
    acoes: ['Acionar jurídico para petição de desbloqueio emergencial', 'Identificar processo judicial originário e valor bloqueado', 'Ativar conta corrente secundária (banco contingência) para operações emergenciais', 'Priorizar pagamentos: salários > tributos > fornecedores críticos', 'Comunicar fornecedores estratégicos sobre atraso temporário', 'Solicitar tutela de urgência para liberação parcial ao juízo'] },
  { id: 'FIN-003', tipo: 'Falha no Sistema de Pagamentos (ERP/Banco)', icon: AlertTriangle, severidade: 'Crítica', cor: 'rose',
    descricao: 'Indisponibilidade do módulo financeiro do ERP ou da plataforma bancária impedindo processamento de pagamentos em lote (CNAB 240/400).',
    impacto: 'Atraso no pagamento de fornecedores, duplicatas protestadas, juros moratórios, risco de corte de serviços essenciais.',
    acoes: ['Acionar suporte L2/L3 do fornecedor de ERP', 'Gerar arquivos CNAB manualmente via ferramenta auxiliar', 'Acessar internet banking para pagamentos manuais emergenciais de maior criticidade', 'Priorizar: folha > tributos > DARFs > duplicatas com protesto', 'Documentar indisponibilidade e SLA de resposta do fornecedor', 'Comunicar áreas solicitantes sobre previsão de regularização'] },
  { id: 'FIN-004', tipo: 'Fraude Financeira / Desvio Detectado', icon: ShieldAlert, severidade: 'Crítica', cor: 'rose',
    descricao: 'Detecção de transação não autorizada, falsificação de documentos fiscais, desvio de recursos ou fraude contábil identificada por auditoria interna ou compliance.',
    impacto: 'Exposição legal, dano reputacional, risco de responsabilização penal dos administradores (Lei 7.492/86).',
    acoes: ['Suspender imediatamente todos os acessos do(s) suspeito(s) ao sistema financeiro', 'Preservar evidências digitais e documentais (chain of custody)', 'Acionar auditoria interna e compliance para investigação sigilosa', 'Comunicar Diretoria e Conselho de Administração', 'Registrar boletim de ocorrência se comprovada a irregularidade', 'Acionar assessoria jurídica penal e cível para medidas cabíveis'] },
  { id: 'FIN-005', tipo: 'Contingência Contábil / Auditoria Emergencial', icon: Receipt, severidade: 'Alta', cor: 'amber',
    descricao: 'Identificação de passivo contingente relevante, restatement contábil ou intimação da CVM/Receita Federal exigindo retificação de demonstrações financeiras.',
    impacto: 'Impacto no balanço patrimonial, risco de going concern, depreciação de rating de crédito, exposição a investidores.',
    acoes: ['Acionar comitê de auditoria e conselho fiscal', 'Quantificar impacto financeiro da contingência (provável, possível, remoto)', 'Contratar auditoria externa independente se necessário', 'Preparar nota explicativa para demonstrações financeiras', 'Comunicar investidores/mercado via fato relevante se companhia aberta', 'Ajustar provisões no balanço conforme CPC 25 (IAS 37)'] },
  { id: 'FIN-006', tipo: 'Crise de Fluxo de Caixa / Liquidez', icon: DollarSign, severidade: 'Alta', cor: 'amber',
    descricao: 'Projeção de fluxo de caixa indicando insuficiência para honrar compromissos nos próximos 30-60 dias. Necessidade de ação emergencial para evitar inadimplência.',
    impacto: 'Inadimplência com fornecedores, protesto de títulos, restrição de crédito, risco de pedido de recuperação judicial por credores.',
    acoes: ['Elaborar fluxo de caixa diário para os próximos 90 dias', 'Negociar antecipação de recebíveis (FIDC, factoring, desconto de duplicatas)', 'Renegociar prazos com fornecedores não-críticos', 'Suspender investimentos e despesas discricionárias', 'Acionar linha de crédito emergencial junto ao banco principal', 'Comunicar diretoria e conselho sobre cenário de estresse de liquidez'] },
];

const CENARIOS_SUPRIMENTOS = [
  { id: 'SUP-001', tipo: 'Falha de Fornecedor Único (Single Vendor)', icon: PackageX, severidade: 'Crítica', cor: 'rose',
    descricao: 'Fornecedor crítico sem backup (single vendor dependency) deixou de entregar serviço ou produto essencial. Ex.: provedor de telecom, cloud, BPO de atendimento.',
    impacto: 'Indisponibilidade do serviço dependente, violação de SLA contratual com clientes, penalidades contratuais.',
    acoes: ['Acionar SLA contratual e notificar fornecedor formalmente (NF extrajudicial)', 'Ativar fornecedor de contingência do catálogo homologado', 'Se não houver contingência: iniciar contratação emergencial (dispensa de licitação por emergência)', 'Comunicar áreas impactadas sobre degradação e ETA', 'Documentar prejuízos para eventual ação de regresso contra fornecedor', 'Revisar cláusula contratual de multa e rescisão'] },
  { id: 'SUP-002', tipo: 'Fornecedor em Recuperação Judicial', icon: Gavel, severidade: 'Alta', cor: 'amber',
    descricao: 'Fornecedor estratégico protocolou pedido de recuperação judicial. Risco de interrupção do serviço e perda de garantias contratuais.',
    impacto: 'Continuidade do serviço ameaçada, créditos da empresa podem ficar sujeitos ao plano de recuperação, riscos jurídicos de responsabilidade subsidiária.',
    acoes: ['Consultar processo no TJSP/TJRJ para avaliar estágio da recuperação', 'Acionar jurídico para habilitar créditos da empresa como credora', 'Iniciar processo de homologação de fornecedor alternativo', 'Negociar com fornecedor garantias adicionais de continuidade', 'Verificar se contratos possuem cláusula de step-in rights', 'Criar plano de transição para novo fornecedor em 30-60 dias'] },
  { id: 'SUP-003', tipo: 'Ruptura de Cadeia de Suprimentos / Logística', icon: Truck, severidade: 'Alta', cor: 'amber',
    descricao: 'Interrupção na cadeia de suprimentos por greve de transportes, bloqueio de rodovias, embargo comercial ou desastre natural afetando entregas.',
    impacto: 'Falta de insumos críticos, atraso em manutenções preventivas, estoque de peças de reposição zerado.',
    acoes: ['Mapear itens críticos com estoque abaixo do ponto de ressuprimento', 'Buscar fornecedores locais alternativos para itens emergenciais', 'Avaliar transporte alternativo (aéreo, marítimo) para itens críticos', 'Negociar com fabricante entrega direta (drop shipping)', 'Comunicar áreas dependentes sobre prazo de reposição estimado', 'Ativar cláusula de força maior em contratos afetados'] },
  { id: 'SUP-004', tipo: 'Contrato Vencido sem Renovação / Gap Contratual', icon: CalendarClock, severidade: 'Alta', cor: 'amber',
    descricao: 'Contrato de serviço essencial expirou sem renovação ou recontratação. Fornecedor operando sem cobertura contratual, sem SLA, sem garantias.',
    impacto: 'Operação descoberta juridicamente, sem SLA exigível, sem penalidades para descumprimento, risco de interrupção a qualquer momento.',
    acoes: ['Formalizar Carta de Intenções para manter serviço durante negociação', 'Acionar área jurídica para elaborar aditivo emergencial', 'Iniciar processo de contratação/renovação com urgência máxima', 'Documentar riscos de operação sem contrato para compliance e auditoria', 'Verificar se há aprovação orçamentária para o novo período', 'Definir plano B caso fornecedor recuse continuidade sem contrato'] },
  { id: 'SUP-005', tipo: 'Descumprimento Regulatório de Fornecedor (LGPD/Compliance)', icon: Scale, severidade: 'Alta', cor: 'amber',
    descricao: 'Fornecedor identificado como não-conforme com LGPD, normas trabalhistas, ambientais ou anticorrupção. Risco de responsabilidade solidária para a empresa.',
    impacto: 'Multa ANPD de até 2% do faturamento, responsabilidade solidária trabalhista, danos reputacionais, bloqueio em due diligence.',
    acoes: ['Notificar fornecedor formalmente exigindo adequação em prazo determinado', 'Suspender compartilhamento de dados pessoais se violação LGPD', 'Acionar DPO e jurídico para avaliação de risco de responsabilidade', 'Iniciar processo de substituição se fornecedor não se adequar', 'Documentar todas as notificações e respostas (due diligence defense)', 'Reportar à ANPD se houver vazamento de dados pessoais confirmado'] },
];

// ─── COMPONENTE DE CARD DE CENÁRIO ──────────────────────────────────────────────
const CardCenario = ({ cenario, onAcionar, acionado }) => {
  const Icon = cenario.icon;
  const cores = {
    rose: { bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-200 dark:border-rose-900/40', icon: 'text-rose-500', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/40', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
    sky: { bg: 'bg-sky-50 dark:bg-sky-950/20', border: 'border-sky-200 dark:border-sky-900/40', icon: 'text-sky-500', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400' },
  };
  const c = cores[cenario.cor] || cores.amber;

  return (
    <div className={`p-5 rounded-xl border ${acionado ? 'ring-2 ring-rose-500/50 border-rose-400 dark:border-rose-700' : `${c.border} bg-white dark:bg-slate-900`} shadow-sm space-y-3 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${c.bg}`}>
            <Icon className={`w-4.5 h-4.5 ${c.icon}`} />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-white leading-tight">{cenario.tipo}</h4>
            <span className="text-[8px] font-mono text-slate-400">{cenario.id}</span>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase whitespace-nowrap ${c.badge} ${acionado ? 'animate-pulse' : ''}`}>
          {acionado ? '🚨 ACIONADO' : cenario.severidade}
        </span>
      </div>

      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{cenario.descricao}</p>

      {cenario.impacto && (
        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-50/50 dark:bg-rose-950/10 p-2 rounded-lg border border-rose-100 dark:border-rose-900/20">
          <strong>Impacto:</strong> {cenario.impacto}
        </div>
      )}

      {cenario.protocolo && (
        <div className="text-[9px] text-indigo-500 font-semibold">
          📋 Norma: {cenario.protocolo}
        </div>
      )}

      {/* Checklist de Ações */}
      <details className="group">
        <summary className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline flex items-center gap-1">
          ▶ Protocolo de Resposta ({cenario.acoes.length} ações)
        </summary>
        <ol className="mt-2 space-y-1.5 pl-1">
          {cenario.acoes.map((acao, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-[8px] flex items-center justify-center mt-0.5">
                {idx + 1}
              </span>
              {acao}
            </li>
          ))}
        </ol>
      </details>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-850 flex justify-end">
        <button
          onClick={() => onAcionar(cenario.id)}
          className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 cursor-pointer transition-all ${
            acionado
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-md'
          }`}
        >
          {acionado ? <><Check className="w-3.5 h-3.5" /> Encerrar Protocolo</> : <><Siren className="w-3.5 h-3.5" /> Acionar Protocolo</>}
        </button>
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────────

export default function PainelApoio({ db }) {
  const { usuario, isAdmin } = useAuth();
  
  const [apoioTab, setApoioTab] = useState(() => {
    if (usuario?.role === 'apoio_predial') return 'gesap';
    if (usuario?.role === 'apoio_pessoas') return 'gepes';
    if (usuario?.role === 'apoio_financeiro') return 'gefic';
    if (usuario?.role === 'apoio_suprimentos') return 'gesuc';
    return 'gesap';
  });

  const [notification, setNotification] = useState(null);
  const [acionados, setAcionados] = useState({});

  // ─── EVACUAÇÃO PREDIAL (cronômetro interativo) ────────────────────────────────
  const [isEvacuando, setIsEvacuando] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [andares, setAndares] = useState([
    { andar: 'Subsolo (Subestação Elétrica & Gerador)', evacuado: false, responsavel: 'Técnico de Plantão' },
    { andar: '1º Andar (Recepção, Atendimento & Canais)', evacuado: false, responsavel: 'Carlos Santos (Brigada Líder)' },
    { andar: '2º Andar (TI, CPD & NOC / Operações)', evacuado: false, responsavel: 'Fernanda Lima (Brigadista)' },
    { andar: '3º Andar (Diretoria, GERIC & Jurídico)', evacuado: false, responsavel: 'Amanda Sousa (Brigadista)' },
    { andar: '4º Andar (RH/Gepes, Financeiro/Gefic & Suprimentos)', evacuado: false, responsavel: 'Ricardo Mello (Brigadista)' },
    { andar: '5º Andar (Terraço & Casa de Máquinas HVAC)', evacuado: false, responsavel: 'Manutenção Predial' },
  ]);
  const [evacConcluida, setEvacConcluida] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isEvacuando) {
      timerRef.current = setInterval(() => setTempoDecorrido(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isEvacuando]);

  const handleStartEvacuacao = () => {
    setIsEvacuando(true);
    setTempoDecorrido(0);
    setEvacConcluida(false);
    setAndares(andares.map(a => ({ ...a, evacuado: false })));
    setNotification({ type: 'info', text: '🚨 Protocolo de Evacuação Predial ACIONADO. Alarme sonoro disparado em todos os andares. Brigadistas posicionados.' });
  };

  const handleToggleAndar = (idx) => {
    const updated = [...andares];
    updated[idx].evacuado = !updated[idx].evacuado;
    setAndares(updated);
    if (updated.every(a => a.evacuado)) {
      setIsEvacuando(false);
      setEvacConcluida(true);
      const min = Math.floor(tempoDecorrido / 60);
      const seg = tempoDecorrido % 60;
      const slaOk = tempoDecorrido <= 900;
      setNotification({
        type: slaOk ? 'success' : 'warning',
        text: slaOk
          ? `✅ Evacuação concluída em ${min}m ${seg}s — DENTRO do SLA regulatório (15 min). ABNT NBR 15219 cumprida.`
          : `⚠️ Evacuação concluída em ${min}m ${seg}s — FORA do SLA regulatório de 15 min! Necessário plano de ação corretiva.`
      });
      db.incidentes.create({
        data_hora: new Date().toISOString(),
        local: "Edifício Sede",
        descricao: `Exercício de evacuação predial. Tempo total: ${min}m ${seg}s. SLA ${slaOk ? 'cumprido' : 'descumprido'}.`,
        tipo_incidente: "Simulado Predial / Brigada",
        impacto: slaOk ? "Baixo" : "Médio",
        id_processo: "PROC-APO-004",
        medidas_mitigacao: "Brigada de incêndio acionada conforme NBR 15219.",
        resultado_resposta: slaOk ? "Evacuação bem-sucedida" : "Evacuação acima do SLA — ação corretiva necessária",
        rto_real_minutos: Math.round(tempoDecorrido / 60),
        rto_meta_minutos: 15,
        rto_ultrapassado: !slaOk,
        status_incidente: "fechado",
        critico: !slaOk
      });
    }
  };

  const formatTempo = (sec) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

  // ─── ACIONAMENTO GENÉRICO DE CENÁRIOS ─────────────────────────────────────────
  const handleAcionarCenario = (id, cenarios) => {
    const cenario = cenarios.find(c => c.id === id);
    const novoEstado = !acionados[id];
    setAcionados({ ...acionados, [id]: novoEstado });
    if (novoEstado && cenario) {
      setNotification({
        type: 'info',
        text: `🚨 Protocolo "${cenario.tipo}" ACIONADO. ${cenario.acoes.length} ações de resposta registradas. Coordenação em andamento.`
      });
      db.incidentes.create({
        data_hora: new Date().toISOString(),
        local: "Empresa (Área de Apoio)",
        descricao: `Cenário acionado: ${cenario.tipo}. ${cenario.descricao}`,
        tipo_incidente: cenario.tipo,
        impacto: cenario.severidade === 'Crítica' ? 'Alto' : 'Médio',
        id_processo: id,
        medidas_mitigacao: cenario.acoes.slice(0, 3).join('; '),
        resultado_resposta: "Em andamento",
        status_incidente: "aberto",
        critico: cenario.severidade === 'Crítica'
      });
    } else {
      setNotification({ type: 'success', text: `✅ Protocolo "${cenario?.tipo}" ENCERRADO com sucesso. Incidente registrado no log.` });
    }
  };

  const fornecedoresTPRM = db.fornecedoresCriticosTPRM ? db.fornecedoresCriticosTPRM.list() : [];

  const tabs = [
    { key: 'gesap', label: '🏢 Gesap (Predial)', role: 'apoio_predial', count: CENARIOS_PREDIAL.length },
    { key: 'gepes', label: '👥 Gepes (Pessoas/RH)', role: 'apoio_pessoas', count: CENARIOS_PESSOAS.length },
    { key: 'gefic', label: '💵 Gefic (Financeiro)', role: 'apoio_financeiro', count: CENARIOS_FINANCEIRO.length },
    { key: 'gesuc', label: '🚚 Gesuc (Suprimentos)', role: 'apoio_suprimentos', count: CENARIOS_SUPRIMENTOS.length },
    { key: 'tprm', label: '🛡️ Terceiros & Fornecedores (TPRM)', role: 'all', count: fornecedoresTPRM.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" /> Painel de Contingências das Áreas de Apoio (GCN)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-4xl">
          Central de acionamento de protocolos de resposta a incidentes operacionais das gerências administrativas. 
          Cada cenário documenta ações concretas, normas regulatórias aplicáveis e fluxos de escalonamento conforme ISO 22301, CLT, legislação tributária e LGPD.
        </p>
      </div>

      {/* NOTIFICAÇÃO */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-semibold animate-slide-up ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' 
          : notification.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
          : 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400'
        }`}>
          <AlertOctagon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="ml-auto text-slate-400 hover:text-slate-600 cursor-pointer text-lg leading-none">×</button>
        </div>
      )}

      {/* ABAS */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-3 sm:gap-6 text-xs font-bold">
        {tabs.map(item => (
          <button
            key={item.key}
            onClick={() => { setApoioTab(item.key); setNotification(null); }}
            className={`pb-3 transition-all relative flex items-center gap-1.5 cursor-pointer ${
              apoioTab === item.key
                ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            {item.label}
            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-bold">{item.count}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          GESAP — PREDIAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {apoioTab === 'gesap' && (
        <div className="space-y-6">
          {/* Simulador de Evacuação */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-850 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-slate-850 dark:text-white text-sm">🔥 Simulador de Evacuação Predial com Cronômetro</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">SLA Regulatório (ABNT NBR 15219): Evacuação total em até <strong>15 minutos</strong></p>
              </div>
              <div className={`text-3xl font-mono font-black px-4 py-1.5 rounded-xl border ${
                isEvacuando ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 animate-pulse' 
                : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30'
              }`}>
                {formatTempo(tempoDecorrido)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {andares.map((a, idx) => (
                <div key={idx} className={`p-3 rounded-lg border flex items-center justify-between gap-2 text-xs transition-all ${
                  a.evacuado
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 dark:text-white truncate">{a.andar}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 truncate">👤 {a.responsavel}</div>
                  </div>
                  <button
                    onClick={() => isEvacuando && handleToggleAndar(idx)}
                    disabled={!isEvacuando}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                      a.evacuado
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40'
                    }`}
                  >
                    {a.evacuado ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> OK</span> : 'Liberar'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              {!isEvacuando ? (
                <button onClick={handleStartEvacuacao}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-8 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform">
                  <Play className="w-4 h-4 fill-white" /> {evacConcluida ? 'Reiniciar Simulado' : 'Disparar Alarme / Iniciar Evacuação'}
                </button>
              ) : (
                <span className="px-6 py-2.5 bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-extrabold rounded-lg animate-pulse text-xs">
                  🚨 EVACUAÇÃO EM ANDAMENTO — Marque cada andar como liberado
                </span>
              )}
            </div>
          </div>

          {/* Cards de Cenários Prediais */}
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4">Cenários de Contingência Predial (Gesap)</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {CENARIOS_PREDIAL.map(c => (
                <CardCenario key={c.id} cenario={c} acionado={!!acionados[c.id]} onAcionar={(id) => handleAcionarCenario(id, CENARIOS_PREDIAL)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          GEPES — PESSOAS / RH
          ═══════════════════════════════════════════════════════════════════════ */}
      {apoioTab === 'gepes' && (
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4">Cenários de Contingência de Pessoas e RH (Gepes)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {CENARIOS_PESSOAS.map(c => (
              <CardCenario key={c.id} cenario={c} acionado={!!acionados[c.id]} onAcionar={(id) => handleAcionarCenario(id, CENARIOS_PESSOAS)} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          GEFIC — FINANCEIRO
          ═══════════════════════════════════════════════════════════════════════ */}
      {apoioTab === 'gefic' && (
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4">Cenários de Contingência Financeira e Tributária (Gefic)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {CENARIOS_FINANCEIRO.map(c => (
              <CardCenario key={c.id} cenario={c} acionado={!!acionados[c.id]} onAcionar={(id) => handleAcionarCenario(id, CENARIOS_FINANCEIRO)} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TPRM — GESTÃO DE RISCOS DE TERCEIROS E FORNECEDORES CRÍTICOS
          ═══════════════════════════════════════════════════════════════════════ */}
      {apoioTab === 'tprm' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-500" /> Gestão de Riscos de Terceiros — TPRM (Third-Party Risk Management)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Conforme exigido pelas normas ISO 22301:2019 e Resolução BACEN nº 4.893, todos os fornecedores críticos da cadeia de valor possuem avaliação de resiliência, auditoria de PCO próprio e monitoramento de SLA contratual.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h4 className="font-bold text-xs text-slate-800 dark:text-white">Matriz de Auditoria de Resiliência de Fornecedores Críticos</h4>
              <span className="text-[10px] text-slate-400 font-bold">{fornecedoresTPRM.length} fornecedores críticos monitorados</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Fornecedor / Vendor</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Serviço Prestado</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-500">Criticidade</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-500">Score Resiliência</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-500">PCO Auditado (GERIC)</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-500">RTO Contratual</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-500">Última Auditoria</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Gestor do Vendor</th>
                  </tr>
                </thead>
                <tbody>
                  {fornecedoresTPRM.map((f) => (
                    <tr key={f.id_fornecedor} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-800 dark:text-white">{f.nome}</div>
                        <div className="text-[8px] text-slate-400 font-mono">{f.id_fornecedor}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">{f.servico}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                          f.criticidade === 'Crítica' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {f.criticidade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-black">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] ${
                          f.score_resiliencia >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {f.score_resiliencia} pts
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {f.pco_proprio_auditado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full font-bold">
                            <ShieldCheck className="w-3 h-3" /> Auditado OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-full font-bold">
                            <ShieldAlert className="w-3 h-3" /> Pendente Auditoria
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-750 dark:text-slate-300">
                        {f.rto_contratual_horas < 1 ? `${f.rto_contratual_horas * 60} min` : `${f.rto_contratual_horas}h`}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 font-medium">
                        {new Date(f.data_ultima_auditoria).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">{f.responsavel_vendor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
