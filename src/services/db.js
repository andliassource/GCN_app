// ============================================================================
// SERVIÇO DE BANCO DE DADOS (MOCK / LOCALSTORAGE) - GCN v4.0
// Portável para Firebase Firestore / Azure Dataverse / SQL Server
// ============================================================================

const INITIAL_DATA = {
  db_version: "17.0",

  // ── CONFIG DO SISTEMA ─────────────────────────────────────────────────────
  configSistema: {
    nome_empresa: "Empresa GCN",
    logo_base64: null,
    cor_primaria: "#4f46e5",
    periodicidade_revisao_dias: 365,
    email_geric: "geric@empresa.com.br",
    email_gemac: "gemac@empresa.com.br",
    sla_notificacao_horas: 24,
    alerta_vencimento_dias: [30, 60, 90]
  },

  // ── USUÁRIOS SIMULADOS (ROLES) ────────────────────────────────────────────
  usuariosSimulados: [
    { id_usuario: "USR-001", nome: "Roberto Carlos", email: "geric@empresa.com.br", id_gerencia: "GER-GOV01", role: "admin_geric", senha: "geric2026" },
    { id_usuario: "USR-002", nome: "Arthur Mendes (Geemp)", email: "geemp@empresa.com.br", id_gerencia: "GER-GOV02", role: "gov_corporativa", senha: "geemp2026" },
    { id_usuario: "USR-003", nome: "Patrícia Lima", email: "getic@empresa.com.br", id_gerencia: "GER-TIC01", role: "tic_executor", senha: "getic2026" },
    { id_usuario: "USR-004", nome: "Vanessa Lopes (Gemac)", email: "gemac@empresa.com.br", id_gerencia: "GER-GOV03", role: "comunicacao_crise", senha: "gemac2026" },
    { id_usuario: "USR-005", nome: "Marcos Costa", email: "gecob@empresa.com.br", id_gerencia: "GER-NEG01", role: "gestor_area", senha: "gecob2026" },
    { id_usuario: "USR-006", nome: "Sandro Lima (Gesap)", email: "gesap@empresa.com.br", id_gerencia: "GER-APO04", role: "apoio_predial", senha: "gesap2026" },
    { id_usuario: "USR-007", nome: "Carla Souza", email: "gered@empresa.com.br", id_gerencia: "GER-NEG02", role: "gestor_area", senha: "gered2026" },
    { id_usuario: "USR-008", nome: "Visitante", email: "visitante@empresa.com.br", id_gerencia: "GER-GOV01", role: "visualizador", senha: "visitante2026" },
    { id_usuario: "USR-009", nome: "Diretora Fernanda Rocha", email: "gerexec@empresa.com.br", id_gerencia: "GER-NEG01", role: "gerente_exec", senha: "gerexec2026" },
    { id_usuario: "USR-010", nome: "Comitê Conti (Secretária)", email: "conti@empresa.com.br", id_gerencia: "GER-GOV02", role: "conti", senha: "conti2026" },
    { id_usuario: "USR-011", nome: "Eduardo Santos", email: "geati@empresa.com.br", id_gerencia: "GER-TIC02", role: "tic_governanca", senha: "geati2026" },
    { id_usuario: "USR-012", nome: "Bruno Mendes", email: "gesit@empresa.com.br", id_gerencia: "GER-TIC05", role: "tic_executor", senha: "gesit2026" },
    { id_usuario: "USR-013", nome: "Diego Ferreira (Gesec)", email: "gesec@empresa.com.br", id_gerencia: "GER-TIC04", role: "tic_executor", senha: "gesec2026" },
    { id_usuario: "USR-014", nome: "Gilberto Ramos", email: "gepin@empresa.com.br", id_gerencia: "GER-NEG07", role: "gestor_area", senha: "gepin2026" },
    { id_usuario: "USR-016", nome: "Ana Ribeiro (Gepes/RH)", email: "gepes@empresa.com.br", id_gerencia: "GER-APO01", role: "apoio_pessoas", senha: "gepes2026" },
    { id_usuario: "USR-017", nome: "Carla Mendes (Gefic/Fin)", email: "gefic@empresa.com.br", id_gerencia: "GER-APO02", role: "apoio_financeiro", senha: "gefic2026" },
    { id_usuario: "USR-018", nome: "Luis Fernandes (Gesuc/Supr)", email: "gesuc@empresa.com.br", id_gerencia: "GER-APO03", role: "apoio_suprimentos", senha: "gesuc2026" },
    { id_usuario: "USR-019", nome: "Carlos Eduardo (Geraud - Auditoria 3ª Linha)", email: "auditoria@empresa.com.br", id_gerencia: "GER-AUD01", role: "auditoria_interna", senha: "auditoria2026" }
  ],

  // ── DIRETORIAS ────────────────────────────────────────────────────────────
  diretorias: [
    { id_diretoria: "DIR-001", nome: "Diretoria de Tecnologia e Infraestrutura", sigla: "Dites" },
    { id_diretoria: "DIR-002", nome: "Diretoria de Operações e Negócios", sigla: "Diope" },
    { id_diretoria: "DIR-003", nome: "Diretoria Financeira e Administrativa", sigla: "Diafi" }
  ],

  // ── GERÊNCIAS ─────────────────────────────────────────────────────────────
  gerencias: [
    { id_gerencia: "GER-TIC01", nome: "Gerência Executiva de Infraestrutura de TI", sigla: "Getic", tipo: "TIC", id_diretoria: "DIR-001", email: "getic@empresa.com.br", telefone: "(11) 98001-0003", observacao: "Responsável pelo PRD de TI (ISO 27031) e ativação de War Room. Governa links, data centers e nuvem." },
    { id_gerencia: "GER-TIC02", nome: "Gerência Executiva de Governança e Operações de TI", sigla: "Geati", tipo: "TIC", id_diretoria: "DIR-001", email: "geati@empresa.com.br", telefone: "(11) 98001-9002", observacao: "Primeira Linha de Defesa (1ª Linha TIC). Conduz o gerenciamento de serviços de TI e operações digitais." },
    { id_gerencia: "GER-TIC03", nome: "Gerência Executiva de Aplicações Corporativas", sigla: "Geape", tipo: "TIC", id_diretoria: "DIR-001", email: "geape@empresa.com.br", telefone: "(11) 98001-9003", observacao: "Gerencia sistemas de negócios e ERPs corporativos." },
    { id_gerencia: "GER-TIC04", nome: "Gerência Executiva de Cibersegurança", sigla: "Gesec", tipo: "TIC", id_diretoria: "DIR-001", email: "gesec@empresa.com.br", telefone: "(11) 98001-0004", observacao: "Gestão de ameaças cibernéticas, DDoS, ransomware e proteção de dados." },
    { id_gerencia: "GER-TIC05", nome: "Gerência Executiva de Sistemas de Informação", sigla: "Gesit", tipo: "TIC", id_diretoria: "DIR-001", email: "gesit@empresa.com.br", telefone: "(11) 98001-9020", observacao: "Gestão de sistemas. Comportamento híbrido: atua em TIC e Negócio." },
    { id_gerencia: "GER-NEG01", nome: "Gerência Executiva de Canais e Backoffice", sigla: "Gecob", tipo: "Negócios", id_diretoria: "DIR-002", email: "gecob@empresa.com.br", telefone: "(11) 98001-0002", observacao: "Opera os canais digitais, CRBB, cobrança extrajudicial e BBmericas. PCO obrigatório por produto." },
    { id_gerencia: "GER-NEG02", nome: "Gerência Executiva de Assistência Técnica em Campo", sigla: "Gered", tipo: "Negócios", id_diretoria: "DIR-002", email: "gered@empresa.com.br", telefone: "(11) 98001-0007", observacao: "Gerencia 13 contratos de campo com a Astec. SLA de 8h (capitais) e 24h (interior). PCO por contrato." },
    { id_gerencia: "GER-NEG03", nome: "Gerência Executiva de Negócios Digitais", sigla: "Gened", tipo: "Negócios", id_diretoria: "DIR-002", email: "gened@empresa.com.br", telefone: "(11) 98001-9004", observacao: "Gerencia produtos e soluções financeiras digitais." },
    { id_gerencia: "GER-NEG04", nome: "Gerência Executiva de Relacionamento com Clientes", sigla: "Gerec", tipo: "Negócios", id_diretoria: "DIR-002", email: "gerec@empresa.com.br", telefone: "(11) 98001-9005", observacao: "Responsável pelo CRM e atendimento pós-venda." },
    { id_gerencia: "GER-NEG05", nome: "Gerência Executiva de Operações e Liquidação", sigla: "Geoliq", tipo: "Negócios", id_diretoria: "DIR-002", email: "geoliq@empresa.com.br", telefone: "(11) 98001-9006", observacao: "Opera a liquidação financeira e conciliação bancária." },
    { id_gerencia: "GER-NEG06", nome: "Gerência Executiva de Negócios Corporativos", sigla: "Gencorp", tipo: "Negócios", id_diretoria: "DIR-002", email: "gencorp@empresa.com.br", telefone: "(11) 98001-9007", observacao: "Gerencia contratos empresariais e soluções B2B." },
    { id_gerencia: "GER-NEG07", nome: "Gerência de Projetos e Inovação", sigla: "Gepin", tipo: "Negócios", id_diretoria: "DIR-002", email: "gepin@empresa.com.br", telefone: "(11) 98001-9021", observacao: "Área de negócio que executa sua própria DR." },
    { id_gerencia: "GER-GOV01", nome: "Gerência de Gestão de Riscos, Compliance e GCN", sigla: "Geric", tipo: "Governança", id_diretoria: "DIR-002", email: "geric@empresa.com.br", telefone: "(11) 98001-0001", observacao: "Segunda Linha de Defesa (2ª Linha). Monitoramento de Riscos, Compliance, Controles Internos e Gestão de Continuidade de Negócios (ISO 22301)." },
    { id_gerencia: "GER-GOV02", nome: "Gerência de Governança Corporativa e Operações", sigla: "Geemp", tipo: "Governança", id_diretoria: "DIR-002", email: "geemp@empresa.com.br", telefone: "(11) 98001-0008", observacao: "Primeira Linha de Defesa (1ª Linha Operacional). Conduz o Comitê de Crise e regimento de crises (PGC)." },
    { id_gerencia: "GER-GOV03", nome: "Gerência de Marketing e Comunicação Corporativa", sigla: "Gemac", tipo: "Governança", id_diretoria: "DIR-002", email: "gemac@empresa.com.br", telefone: "(11) 98001-0005", observacao: "Coordena comunicação interna e externa em crises. Única autorizada a emitir notas à imprensa." },
    { id_gerencia: "GER-AUD01", nome: "Gerência Executiva de Auditoria Interna Independente", sigla: "Geraud", tipo: "Auditoria", id_diretoria: "INDEP", email: "auditoria@empresa.com.br", telefone: "(11) 98001-9999", observacao: "Terceira Linha de Defesa Independente (3ª Linha IIA). Reporte exclusivo e autônomo ao Conselho de Administração (sem subordinação a nenhuma Diretoria Executiva ou Presidência)." },
    { id_gerencia: "GER-APO01", nome: "Gerência Executiva de Pessoas e Recursos Humanos", sigla: "Gepes", tipo: "Apoio", id_diretoria: "DIR-003", email: "gepes@empresa.com.br", telefone: "(11) 98001-9008", observacao: "PCO de apoio: SLA interno de 24h para recrutamento emergencial. Sem contrato externo de faturamento." },
    { id_gerencia: "GER-APO02", nome: "Gerência Executiva de Finanças e Tesouraria", sigla: "Gefic", tipo: "Apoio", id_diretoria: "DIR-003", email: "gefic@empresa.com.br", telefone: "(11) 98001-9009", observacao: "PCO de apoio: SLA de 4h para liberação de pagamentos emergenciais in crises. Sem contrato externo." },
    { id_gerencia: "GER-APO03", nome: "Gerência Executiva de Suprimentos e Contratos", sigla: "Gesuc", tipo: "Apoio", id_diretoria: "DIR-003", email: "gesuc@empresa.com.br", telefone: "(11) 98001-9010", observacao: "Gerencia aquisições de emergência e aciona fornecedores alternativos em contingências." },
    { id_gerencia: "GER-APO04", nome: "Gerência Executiva de Administração Predial e Segurança", sigla: "Gesap", tipo: "Apoio", id_diretoria: "DIR-003", email: "gesap@empresa.com.br", telefone: "(11) 98001-0006", observacao: "Brigada de incêndio. Evacuação predial. SLA de 30min para abertura de incidente predial." },
    { id_gerencia: "GER-APO05", nome: "Gerência Executiva de Compliance e Jurídico", sigla: "Gecoj", tipo: "Apoio", id_diretoria: "DIR-003", email: "gecoj@empresa.com.br", telefone: "(11) 98001-9011", observacao: "Suporte jurídico em crises. SLA interno de 8h para pareceres legais emergenciais." },
    { id_gerencia: "GER-APO06", nome: "Gerência Executiva de Controladoria e Contabilidade", sigla: "Gecont", tipo: "Apoio", id_diretoria: "DIR-003", email: "gecont@empresa.com.br", telefone: "(11) 98001-9012", observacao: "Responsável pela integridade contábil durante contingências." },
    { id_gerencia: "GER-APO07", nome: "Gerência Executiva de Relações Institucionais", sigla: "Gerin", tipo: "Apoio", id_diretoria: "DIR-003", email: "gerin@empresa.com.br", telefone: "(11) 98001-9013", observacao: "Interface com órgãos reguladores durante crises. Notifica BACEN e CVM se necessário." },
    { id_gerencia: "GER-APO08", nome: "Gerência Executiva de Saúde e Bem-Estar Corporativo", sigla: "Gesaude", tipo: "Apoio", id_diretoria: "DIR-003", email: "gesaude@empresa.com.br", telefone: "(11) 98001-9014", observacao: "SLA de 2h para suporte médico e afastamento emergencial de colaboradores." }
  ],

  // ── ATIVOS DE SISTEMAS ────────────────────────────────────────────────────
  ativosSistemas: [
    { id_ativo: "ATV-SYS01", nome: "Core Banking e API Transacional", tipo: "Sistema", criticidade: "Crítica", criticidade_contrato: "C0", id_gerencia: "GER-TIC01", responsavel_tecnico: "Patrícia Lima", fornecedor: "Topaz Solutions", data_aquisicao: "2020-01-01", data_fim_suporte: "2028-12-31", tipo_redundancia: "ativa", rto_proprio_minutos: 15, dados_classificacao: "confidencial", status_ativo: "operacional" },
    { id_ativo: "ATV-SYS02", nome: "Portal de Atendimento Zendesk", tipo: "Sistema", criticidade: "Alta", criticidade_contrato: "C1", id_gerencia: "GER-NEG01", responsavel_tecnico: "Marcos Costa", fornecedor: "Zendesk Inc.", data_aquisicao: "2022-06-01", data_fim_suporte: "2027-06-01", tipo_redundancia: "passiva", rto_proprio_minutos: 60, dados_classificacao: "interno", status_ativo: "operacional" },
    { id_ativo: "ATV-LNK01", nome: "Link de Fibra Embratel Dedicado", tipo: "Link", criticidade: "Alta", criticidade_contrato: "C1", id_gerencia: "GER-TIC01", responsavel_tecnico: "Patrícia Lima", fornecedor: "Embratel", data_aquisicao: "2024-06-01", data_fim_suporte: "2026-06-01", tipo_redundancia: "passiva", rto_proprio_minutos: 120, dados_classificacao: "interno", status_ativo: "operacional" },
    { id_ativo: "ATV-SRV01", nome: "Cluster Kubernetes AWS us-east-1", tipo: "Servidor", criticidade: "Crítica", criticidade_contrato: "C0", id_gerencia: "GER-TIC01", responsavel_tecnico: "Patrícia Lima", fornecedor: "Amazon Web Services", data_aquisicao: "2021-03-01", data_fim_suporte: "2030-12-31", tipo_redundancia: "geografica", rto_proprio_minutos: 30, dados_classificacao: "confidencial", status_ativo: "operacional" },
    { id_ativo: "ATV-SYS03", nome: "Sistema ERP Financeiro SAP", tipo: "Sistema", criticidade: "Média", criticidade_contrato: "C2", id_gerencia: "GER-APO02", responsavel_tecnico: "Carla Mendes", fornecedor: "SAP Brasil", data_aquisicao: "2019-01-01", data_fim_suporte: "2027-12-31", tipo_redundancia: "passiva", rto_proprio_minutos: 240, dados_classificacao: "confidencial", status_ativo: "operacional" },
    { id_ativo: "ATV-SYS04", nome: "Portal Corporativo de Recursos Humanos", tipo: "Sistema", criticidade: "Média", criticidade_contrato: "C3", id_gerencia: "GER-APO01", responsavel_tecnico: "Ana Ribeiro", fornecedor: "TOTVS", data_aquisicao: "2021-09-01", data_fim_suporte: "2025-09-01", tipo_redundancia: "nenhuma", rto_proprio_minutos: 480, dados_classificacao: "interno", status_ativo: "degradado" },
    { id_ativo: "ATV-SEC01", nome: "Firewall FortiGate HA", tipo: "Segurança", criticidade: "Crítica", criticidade_contrato: "C0", id_gerencia: "GER-TIC04", responsavel_tecnico: "Diego Ferreira", fornecedor: "Fortinet", data_aquisicao: "2022-01-01", data_fim_suporte: "2026-01-01", tipo_redundancia: "ativa", rto_proprio_minutos: 5, dados_classificacao: "secreto", status_ativo: "operacional" }
  ],

  processosCriticosAtivos: [
    { id_processo: "PROC-COB-001", id_ativo: "ATV-SYS01" },
    { id_processo: "PROC-COB-001", id_ativo: "ATV-SRV01" },
    { id_processo: "PROC-TIC-001", id_ativo: "ATV-SRV01" },
    { id_processo: "PROC-TIC-001", id_ativo: "ATV-LNK01" },
    { id_processo: "PROC-TIC-002", id_ativo: "ATV-LNK01" },
    { id_processo: "PROC-COB-003", id_ativo: "ATV-SEC01" }
  ],

  // ── RISCOS ────────────────────────────────────────────────────────────────
  riscos: [
    {
      id_risco: "RISK-001", nome: "Indisponibilidade de Nuvem AWS", descricao: "Perda de instâncias por quedas gerais do data center na AWS us-east-1.",
      probabilidade: "Pouco Provável", probabilidade_original: "Pouco Provável", probabilidade_atual: "Pouco Provável",
      impacto: "Catastrófico", id_processo: "PROC-TIC-001",
      score_risco: 8, score_residual: 4,
      risco_residual_prob: "Rara", risco_residual_imp: "Moderado",
      id_plano_acao: null,
      historico_alteracoes: []
    },
    {
      id_risco: "RISK-002", nome: "Corte físico no Link Embratel", descricao: "Rompimento acidental da fibra na via pública primária.",
      probabilidade: "Provável", probabilidade_original: "Provável", probabilidade_atual: "Provável",
      impacto: "Moderado", id_processo: "PROC-TIC-002",
      score_risco: 9, score_residual: 6,
      risco_residual_prob: "Provável", risco_residual_imp: "Menor",
      id_plano_acao: null,
      historico_alteracoes: []
    },
    {
      id_risco: "RISK-003", nome: "Ataque Cibernético e Ransomware", descricao: "Tentativa de sequestro de dados no core transacional.",
      probabilidade: "Provável", probabilidade_original: "Pouco Provável", probabilidade_atual: "Provável",
      impacto: "Catastrófico", id_processo: "PROC-COB-001",
      score_risco: 15, score_residual: 8,
      risco_residual_prob: "Pouco Provável", risco_residual_imp: "Maior",
      id_plano_acao: "PA-001",
      historico_alteracoes: [
        { data: "2026-05-20", motivo: "Incidente INC-103 com RTO ultrapassado elevou probabilidade", de: "Pouco Provável", para: "Provável", usuario: "Roberto Carlos (Geric)" }
      ]
    },
    {
      id_risco: "RISK-004", nome: "Greve de Transportes ou Bloqueio Predial", descricao: "Impedimento de acesso físico ao edifício central de administração.",
      probabilidade: "Provável", probabilidade_original: "Provável", probabilidade_atual: "Provável",
      impacto: "Moderado", id_processo: "PROC-APO-004",
      score_risco: 9, score_residual: 4,
      risco_residual_prob: "Pouco Provável", risco_residual_imp: "Menor",
      id_plano_acao: null,
      historico_alteracoes: []
    },
    {
      id_risco: "RISK-005", nome: "Falha Regulatória BACEN — Plataforma Internacional", descricao: "Interrupção na Plataforma Internacional de Câmbio por mais de 30min viola regulamentação BACEN.",
      probabilidade: "Pouco Provável", probabilidade_original: "Pouco Provável", probabilidade_atual: "Pouco Provável",
      impacto: "Catastrófico", id_processo: "PROC-COB-003",
      score_risco: 8, score_residual: 4,
      risco_residual_prob: "Rara", risco_residual_imp: "Moderado",
      id_plano_acao: null,
      historico_alteracoes: []
    }
  ],

  // ── INTERVENIENTES ────────────────────────────────────────────────────────
  intervenientes: [
    { id_interveniente: "INT-001", nome: "Roberto Carlos", cargo: "Gerente de Riscos e GCN", email: "geric@empresa.com.br", telefone: "(11) 98001-0001", id_gerencia: "GER-GOV01", id_processo: "PROC-COB-001", papel: "aprovador" },
    { id_interveniente: "INT-002", nome: "Marcos Costa", cargo: "Gerente Gecob", email: "gecob@empresa.com.br", telefone: "(11) 98001-0002", id_gerencia: "GER-NEG01", id_processo: "PROC-COB-001", papel: "responsavel" },
    { id_interveniente: "INT-003", nome: "Patrícia Lima", cargo: "Gerente Getic", email: "getic@empresa.com.br", telefone: "(11) 98001-0003", id_gerencia: "GER-TIC01", id_processo: "PROC-COB-001", papel: "executante" },
    { id_interveniente: "INT-004", nome: "Diego Ferreira", cargo: "Analista de Cibersegurança", email: "gesec@empresa.com.br", telefone: "(11) 98001-0004", id_gerencia: "GER-TIC04", id_processo: "PROC-TIC-001", papel: "executante" },
    { id_interveniente: "INT-005", nome: "Vanessa Lopes", cargo: "Gerente de Comunicação", email: "gemac@empresa.com.br", telefone: "(11) 98001-0005", id_gerencia: "GER-GOV03", id_processo: null, papel: "comunicador" },
    { id_interveniente: "INT-006", nome: "Sandro Lima", cargo: "Gerente Predial", email: "gesap@empresa.com.br", telefone: "(11) 98001-0006", id_gerencia: "GER-APO04", id_processo: "PROC-APO-004", papel: "responsavel" },
    { id_interveniente: "INT-007", nome: "Carla Souza", cargo: "Coordenadora de Campo Gered", email: "gered@empresa.com.br", telefone: "(11) 98001-0007", id_gerencia: "GER-NEG02", id_processo: "PROC-GER-001", papel: "responsavel" }
  ],

  // ── ATAS DO COMITÊ DE CRISE ───────────────────────────────────────────────
  atasComiteCrise: [
    { id_ata: "ATA-2026-001", data_reuniao: "2026-04-12", pauta: "Acionamento do Comitê de Crise — Instabilidade Crítica AWS", deliberacoes: "Determinada a ativação da War Room. Aprovada comunicação interna e externa pela Gemac. Autorizado o chaveamento para servidores reservas.", participantes: "Roberto Carlos (Geric), Patrícia Lima (Getic), Arthur Mendes (Geemp), Vanessa Lopes (Gemac)" },
    { id_ata: "ATA-2026-002", data_reuniao: "2026-02-08", pauta: "Análise de Incidente Predial — Princípio de Incêndio 3º Andar", deliberacoes: "Determinada revisão do laudo elétrico. Atualização do PCO-APO-004. Inclusão de inspeção elétrica semestral obrigatória.", participantes: "Arthur Mendes (Geemp), Sandro Lima (Gesap), Roberto Carlos (Geric)" }
  ],

  // ── CONTRATOS ─────────────────────────────────────────────────────────────
  contratos: [
    { id_contrato: "CON-001", nome: "Contrato AWS - Hosting e Infraestrutura Cloud", valor_faturamento: 450000.00, clausulas_risco: "Resolução em menos de 4 horas para instâncias críticas. Multa em caso de indisponibilidade superior a 99.9%.", multas: "Multa de 5% do faturamento mensal por hora de indisponibilidade além do SLA.", data_inicio: "2025-01-01", data_fim: "2027-12-31", id_gerencia: "GER-TIC01" },
    { id_contrato: "CON-002", nome: "Contrato Embratel - Link de Fibra Dedicado", valor_faturamento: 120000.00, clausulas_risco: "SLA de conectividade de 99.95%.", multas: "Abatimento proporcional e multa contratual de R$ 10.000 por hora.", data_inicio: "2024-06-01", data_fim: "2026-06-01", id_gerencia: "GER-TIC01" },
    { id_contrato: "CON-GECOB-001", nome: "PCO Gecob - Produto Canais de Recebimentos", valor_faturamento: 3200000.00, clausulas_risco: "Indisponibilidade do canal de recebimentos impacta liquidação financeira.", multas: "Multa de 0,1% ao dia sobre o volume liquidado por dia de interrupção.", data_inicio: "2025-01-01", data_fim: "2028-12-31", id_gerencia: "GER-NEG01" },
    { id_contrato: "CON-GECOB-002", nome: "PCO Gecob - Produto Cobrança Extrajudicial", valor_faturamento: 1800000.00, clausulas_risco: "Interrupção afeta indexação de carteiras de cobrança e vencimentos.", multas: "Penalidade de R$ 50.000 por evento de indisponibilidade superior a 24h.", data_inicio: "2025-03-01", data_fim: "2028-03-01", id_gerencia: "GER-NEG01" },
    { id_contrato: "CON-GECOB-003", nome: "PCO Gecob - Produto Plataforma Internacional", valor_faturamento: 2500000.00, clausulas_risco: "Plataforma de câmbio e remessas internacionais. Interrupção viola regulação Bacen.", multas: "Penalidade regulatória e multa contratual proporcional ao volume operado.", data_inicio: "2025-06-01", data_fim: "2027-06-01", id_gerencia: "GER-NEG01" },
    { id_contrato: "CON-ASTEC-01", nome: "Astec #01 - Assistência Técnica Região Norte (AM/PA)", valor_faturamento: 65000.00, clausulas_risco: "SLA de atendimento de 24h para chamados de campo.", multas: "Redução de 2% do repasse por chamado fora do SLA.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-02", nome: "Astec #02 - Assistência Técnica Região Nordeste (BA/CE)", valor_faturamento: 72000.00, clausulas_risco: "SLA de 24h interior e 8h capitais.", multas: "Redução de 2% do repasse por chamado fora do SLA.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-03", nome: "Astec #03 - Assistência Técnica Região Centro-Oeste", valor_faturamento: 58000.00, clausulas_risco: "SLA de 24h.", multas: "Redução de 2%.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-04", nome: "Astec #04 - Assistência Técnica SP Capital", valor_faturamento: 95000.00, clausulas_risco: "SLA de 4h para capitais.", multas: "Redução de 3% por chamado fora do SLA.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-09", nome: "Astec #09 - Manutenção Preventiva de ATMs Nacional", valor_faturamento: 110000.00, clausulas_risco: "Manutenção preventiva mensal de cada terminal.", multas: "Redução de 5% do repasse por terminal não visitado.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" }
  ],

  // ── FORNECEDORES CRÍTICOS (TPRM - THIRD PARTY RISK MANAGEMENT) ──────────────
  fornecedoresCriticosTPRM: [
    { id_fornecedor: "FOR-001", nome: "Amazon Web Services (AWS)", servico: "Nuvem e Hosting Transacional", criticidade: "Crítica", pco_proprio_auditado: true, data_ultima_auditoria: "2026-01-15", rto_contratual_horas: 1.0, score_resiliencia: 98, responsavel_vendor: "Patrícia Lima (Getic)", contrato_id: "CON-001" },
    { id_fornecedor: "FOR-002", nome: "Embratel S/A", servico: "Links Dedicados e Fibra Óptica", criticidade: "Alta", pco_proprio_auditado: true, data_ultima_auditoria: "2025-11-20", rto_contratual_horas: 2.0, score_resiliencia: 92, responsavel_vendor: "Patrícia Lima (Getic)", contrato_id: "CON-002" },
    { id_fornecedor: "FOR-003", nome: "Topaz Solutions", servico: "Core Banking e Processamento", criticidade: "Crítica", pco_proprio_auditado: true, data_ultima_auditoria: "2026-03-10", rto_contratual_horas: 0.5, score_resiliencia: 95, responsavel_vendor: "Marcos Costa (Gecob)", contrato_id: "CON-GECOB-001" },
    { id_fornecedor: "FOR-004", nome: "Astec Prestadores de Campo (13 Contratos)", servico: "Manutenção de Terminais em Campo", criticidade: "Média", pco_proprio_auditado: false, data_ultima_auditoria: "2025-05-10", rto_contratual_horas: 24.0, score_resiliencia: 68, responsavel_vendor: "Carla Souza (Gered)", contrato_id: "CON-ASTEC-01" },
    { id_fornecedor: "FOR-005", nome: "Fortinet Brasil", servico: "Segurança de Perímetro e Firewalls", criticidade: "Crítica", pco_proprio_auditado: true, data_ultima_auditoria: "2026-02-01", rto_contratual_horas: 0.25, score_resiliencia: 99, responsavel_vendor: "Diego Ferreira (Gesec)", contrato_id: "" },
    { id_fornecedor: "FOR-006", nome: "Zendesk Inc.", servico: "SaaS Atendimento e SAC", criticidade: "Alta", pco_proprio_auditado: true, data_ultima_auditoria: "2025-10-15", rto_contratual_horas: 4.0, score_resiliencia: 88, responsavel_vendor: "Marcos Costa (Gecob)", contrato_id: "" }
  ],

  // ── PROCESSOS CRÍTICOS (ENRIQUECIDOS p/ PRIORIZAÇÃO E BIA MTPD) ────────────
  processosCriticos: [
    { id_processo: "PROC-COB-001", nome: "Canal de Recebimentos Integrados", descricao: "Opera o canal de liquidação e recebimento integrado com a rede adquirente.", id_contrato: "CON-GECOB-001", criticidade: "Crítica", id_gerencia: "GER-NEG01", requer_drp: true, ativo_cmdb_id: "ATV-SYS01", estrategia_drp: "Hot Standby / Ativo-Ativo", sla_contrato_cliente: 30, sla_tic: 15, status_aprovacao_tic: "Aprovado",
      faturamento_anual: 3200000, perda_hora_estimada: 85000, ciclo_vida: "Maturidade", indicacao_gerel: "Produto consolidado. Responsável por 38% do faturamento Gecob. Investimento em DR prioritário.",
      responsavel_testes: "Marcos Costa (Gecob)", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Diretora Fernanda Rocha",
      total_incidentes_12m: 2, ultimo_teste: "2026-06-15", status_plano: "Plano Aprovado", rpo_minutos: 15, mtpd_horas: 1.0 },
    { id_processo: "PROC-COB-002", nome: "Cobrança Extrajudicial de Carteiras", descricao: "Indexação, gestão de vencimentos e cobrança automatizada de carteiras extrajudiciais.", id_contrato: "CON-GECOB-002", criticidade: "Alta", id_gerencia: "GER-NEG01", requer_drp: false, ativo_cmdb_id: "", estrategia_drp: "Backup & Restore", sla_contrato_cliente: 0, sla_tic: 0, status_aprovacao_tic: "Pendente",
      faturamento_anual: 1800000, perda_hora_estimada: 42000, ciclo_vida: "Maturidade", indicacao_gerel: "Receita estável. Portfolio de carteiras diversificado. Risco moderado.",
      responsavel_testes: "Marcos Costa (Gecob)", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Diretora Fernanda Rocha",
      total_incidentes_12m: 0, ultimo_teste: "2026-03-20", status_plano: "Em Revisão", rpo_minutos: 60, mtpd_horas: 24.0 },
    { id_processo: "PROC-COB-003", nome: "Plataforma Internacional de Câmbio", descricao: "Remessas internacionais e operações de câmbio sujeitas à regulação Bacen.", id_contrato: "CON-GECOB-003", criticidade: "Crítica", id_gerencia: "GER-NEG01", requer_drp: true, ativo_cmdb_id: "ATV-SEC01", estrategia_drp: "Warm Standby", sla_contrato_cliente: 15, sla_tic: 30, status_aprovacao_tic: "Pendente",
      faturamento_anual: 2500000, perda_hora_estimada: 120000, ciclo_vida: "Crescimento", indicacao_gerel: "Negócio em franca expansão. Câmbio digital com +40% de crescimento YoY. Prioridade máxima de investimento.",
      responsavel_testes: "Marcos Costa (Gecob)", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Diretora Fernanda Rocha",
      total_incidentes_12m: 1, ultimo_teste: null, status_plano: "Aguardando Aprovação", rpo_minutos: 5, mtpd_horas: 0.5 },
    { id_processo: "PROC-GER-001", nome: "Assistência Técnica em Campo (Astec)", descricao: "Gestão de atendimentos técnicos de campo com SLA de 8h (capitais) e 24h (interior). 13 contratos regionais.", id_contrato: "CON-ASTEC-01", criticidade: "Alta", id_gerencia: "GER-NEG02", requer_drp: false, ativo_cmdb_id: "", estrategia_drp: "Backup & Restore", sla_contrato_cliente: 0, sla_tic: 0, status_aprovacao_tic: "Pendente",
      faturamento_anual: 750000, perda_hora_estimada: 15000, ciclo_vida: "Declínio", indicacao_gerel: "Modelo de assistência técnica presencial em declínio. Gerel recomenda migração para suporte remoto/IoT. Não investir em DR tradicional.",
      responsavel_testes: "Carla Souza (Gered)", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Diretora Fernanda Rocha",
      total_incidentes_12m: 0, ultimo_teste: "2025-11-10", status_plano: "Em Elaboração", rpo_minutos: 1440, mtpd_horas: 48.0 },
    { id_processo: "PROC-TIC-001", nome: "Infraestrutura de Nuvem e Data Center", descricao: "Servidores e clusters em nuvem AWS sob gestão da Getic. PRD de TI (ISO 27031).", id_contrato: "CON-001", criticidade: "Crítica", id_gerencia: "GER-TIC01", requer_drp: true, ativo_cmdb_id: "ATV-SRV01", estrategia_drp: "DR em Nuvem", sla_contrato_cliente: 60, sla_tic: 30, status_aprovacao_tic: "Aprovado",
      faturamento_anual: 450000, perda_hora_estimada: 95000, ciclo_vida: "Maturidade", indicacao_gerel: "Infraestrutura core. Sem ela, nenhum negócio opera. Investimento permanente obrigatório.",
      responsavel_testes: "Patrícia Lima (Getic)", verificador_geric: "Eduardo Santos (Geati)", gestor_accountability: "Patrícia Lima (Getic)",
      total_incidentes_12m: 1, ultimo_teste: "2026-07-01", status_plano: "Plano Aprovado", rpo_minutos: 5, mtpd_horas: 2.0 },
    { id_processo: "PROC-TIC-002", nome: "Links de Conectividade WAN e Internet", descricao: "Links dedicados Embratel e redundâncias. SLA de 99.95%.", id_contrato: "CON-002", criticidade: "Alta", id_gerencia: "GER-TIC01", requer_drp: true, ativo_cmdb_id: "ATV-LNK01", estrategia_drp: "Warm Standby", sla_contrato_cliente: 120, sla_tic: 120, status_aprovacao_tic: "Aprovado",
      faturamento_anual: 120000, perda_hora_estimada: 65000, ciclo_vida: "Maturidade", indicacao_gerel: "Commodity de conectividade. Redundância contratada. Risco controlado.",
      responsavel_testes: "Patrícia Lima (Getic)", verificador_geric: "Eduardo Santos (Geati)", gestor_accountability: "Patrícia Lima (Getic)",
      total_incidentes_12m: 0, ultimo_teste: "2026-05-12", status_plano: "Plano Aprovado", rpo_minutos: 30, mtpd_horas: 4.0 },
    { id_processo: "PROC-SIT-001", nome: "Plataforma de Integração de APIs (Gesit)", descricao: "Gerencia a integração e comunicação técnica de sistemas legados com canais digitais.", id_contrato: "CON-001", criticidade: "Crítica", id_gerencia: "GER-TIC05", requer_drp: true, ativo_cmdb_id: "ATV-SRV01", estrategia_drp: "Hot Standby / Ativo-Ativo", sla_contrato_cliente: 60, sla_tic: 30, status_aprovacao_tic: "Aprovado",
      faturamento_anual: 0, perda_hora_estimada: 75000, ciclo_vida: "Maturidade", indicacao_gerel: "Camada de integração. Não fatura diretamente mas suporta todos os canais. Criticidade indireta máxima.",
      responsavel_testes: "Bruno Mendes (Gesit)", verificador_geric: "Eduardo Santos (Geati)", gestor_accountability: "Bruno Mendes (Gesit)",
      total_incidentes_12m: 0, ultimo_teste: "2026-04-22", status_plano: "Plano Aprovado", rpo_minutos: 10, mtpd_horas: 1.0 },
    { id_processo: "PROC-PIN-001", nome: "Portal de Inovação Aberta (Gepin)", descricao: "Ambiente de testes e homologação para startups parceiras.", id_contrato: "", criticidade: "Média", id_gerencia: "GER-NEG07", requer_drp: true, ativo_cmdb_id: "ATV-SYS02", estrategia_drp: "Backup & Restore", sla_contrato_cliente: 1440, sla_tic: 240, status_aprovacao_tic: "Pendente",
      faturamento_anual: 180000, perda_hora_estimada: 5000, ciclo_vida: "Crescimento", indicacao_gerel: "Ambiente de inovação em expansão. Alto potencial futuro mas baixo impacto financeiro atual.",
      responsavel_testes: "Gilberto Ramos (Gepin)", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Gilberto Ramos (Gepin)",
      total_incidentes_12m: 0, ultimo_teste: null, status_plano: "Em Elaboração", rpo_minutos: 720, mtpd_horas: 72.0 },
    { id_processo: "PROC-NED-001", nome: "Plataforma de Crédito Digital (Gened)", descricao: "Originação e gestão de crédito digital com motor de decisão automatizado.", id_contrato: "", criticidade: "Crítica", id_gerencia: "GER-NEG03", requer_drp: true, ativo_cmdb_id: "ATV-SYS01", estrategia_drp: "Hot Standby / Ativo-Ativo", sla_contrato_cliente: 30, sla_tic: 15, status_aprovacao_tic: "Pendente",
      faturamento_anual: 4500000, perda_hora_estimada: 150000, ciclo_vida: "Crescimento", indicacao_gerel: "Maior produto digital da empresa. Crescimento de 60% YoY. Prioridade absoluta de investimento.",
      responsavel_testes: "Gestor Gened", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Diretora Fernanda Rocha",
      total_incidentes_12m: 1, ultimo_teste: "2026-07-20", status_plano: "Plano Aprovado", rpo_minutos: 5, mtpd_horas: 0.75 },
    { id_processo: "PROC-REC-001", nome: "CRM e Atendimento Pós-Venda (Gerec)", descricao: "Plataforma de relacionamento com clientes e gestão de SAC multicanal.", id_contrato: "", criticidade: "Alta", id_gerencia: "GER-NEG04", requer_drp: true, ativo_cmdb_id: "ATV-SYS02", estrategia_drp: "Warm Standby", sla_contrato_cliente: 240, sla_tic: 60, status_aprovacao_tic: "Pendente",
      faturamento_anual: 850000, perda_hora_estimada: 22000, ciclo_vida: "Maturidade", indicacao_gerel: "Canal de retenção importante. Estável. Investimento moderado em continuidade.",
      responsavel_testes: "Gestor Gerec", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Diretora Fernanda Rocha",
      total_incidentes_12m: 0, ultimo_teste: "2026-02-10", status_plano: "Em Revisão", rpo_minutos: 60, mtpd_horas: 12.0 },
    { id_processo: "PROC-OLQ-001", nome: "Liquidação Financeira e Conciliação (Geoliq)", descricao: "Processamento da liquidação financeira diária e conciliação bancária de todas as operações.", id_contrato: "", criticidade: "Crítica", id_gerencia: "GER-NEG05", requer_drp: true, ativo_cmdb_id: "ATV-SYS01", estrategia_drp: "Hot Standby / Ativo-Ativo", sla_contrato_cliente: 60, sla_tic: 30, status_aprovacao_tic: "Aprovado",
      faturamento_anual: 2100000, perda_hora_estimada: 110000, ciclo_vida: "Maturidade", indicacao_gerel: "Processo core. Sem liquidação, toda a cadeia de valor para. Investimento obrigatório.",
      responsavel_testes: "Gestor Geoliq", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Diretora Fernanda Rocha",
      total_incidentes_12m: 0, ultimo_teste: "2026-06-05", status_plano: "Plano Aprovado", rpo_minutos: 15, mtpd_horas: 1.5 },
    { id_processo: "PROC-NCP-001", nome: "Soluções B2B Corporativas (Gencorp)", descricao: "Gestão de contratos empresariais e soluções B2B de meios de pagamento.", id_contrato: "", criticidade: "Alta", id_gerencia: "GER-NEG06", requer_drp: true, ativo_cmdb_id: "ATV-SYS01", estrategia_drp: "Warm Standby", sla_contrato_cliente: 120, sla_tic: 60, status_aprovacao_tic: "Pendente",
      faturamento_anual: 1200000, perda_hora_estimada: 35000, ciclo_vida: "Maturidade", indicacao_gerel: "Segmento corporativo sólido. Crescimento estável de 8% ao ano.",
      responsavel_testes: "Gestor Gencorp", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Diretora Fernanda Rocha",
      total_incidentes_12m: 0, ultimo_teste: null, status_plano: "Aguardando Aprovação", rpo_minutos: 30, mtpd_horas: 6.0 },
    { id_processo: "PROC-SEC-001", nome: "Segurança da Informação e SOC (Gesec)", descricao: "Monitoramento 24x7 do SOC, resposta a incidentes de cibersegurança, SIEM e firewall.", id_contrato: "", criticidade: "Crítica", id_gerencia: "GER-TIC04", requer_drp: true, ativo_cmdb_id: "ATV-SEC01", estrategia_drp: "Hot Standby / Ativo-Ativo", sla_contrato_cliente: 15, sla_tic: 5, status_aprovacao_tic: "Aprovado",
      faturamento_anual: 0, perda_hora_estimada: 200000, ciclo_vida: "Crescimento", indicacao_gerel: "Área de proteção. Sem faturamento direto mas perda catastrófica em caso de breach. Investimento contínuo obrigatório.",
      responsavel_testes: "Diego Ferreira (Gesec)", verificador_geric: "Eduardo Santos (Geati)", gestor_accountability: "Patrícia Lima (Getic)",
      total_incidentes_12m: 3, ultimo_teste: "2026-07-28", status_plano: "Plano Aprovado", rpo_minutos: 5, mtpd_horas: 0.5 },
    { id_processo: "PROC-FIN-001", nome: "Gestão Financeira e Tesouraria (Gefic)", descricao: "Tesouraria corporativa, tributos, SPED, EFD, DCTF, fluxo de caixa e pagamentos.", id_contrato: "", criticidade: "Crítica", id_gerencia: "GER-APO02", requer_drp: true, ativo_cmdb_id: "ATV-SYS03", estrategia_drp: "Warm Standby", sla_contrato_cliente: 240, sla_tic: 120, status_aprovacao_tic: "Pendente",
      faturamento_anual: 0, perda_hora_estimada: 90000, ciclo_vida: "Maturidade", indicacao_gerel: "Processo interno crítico. Tributos, SPED e folha exigem continuidade absoluta. Multas regulatórias altíssimas.",
      responsavel_testes: "Carla Mendes (Gefic)", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Carla Mendes (Gefic)",
      total_incidentes_12m: 0, ultimo_teste: null, status_plano: "Em Elaboração", rpo_minutos: 30, mtpd_horas: 8.0,
      sla_interno: "SLA interno: Liberação de pagamentos em até 4h. Obrigações acessórias conforme calendário Receita Federal.", tipo_plano: "PCO-APOIO" },
    { id_processo: "PROC-APO-001", nome: "Folha de Pagamento Corporativa (Gepes)", descricao: "[APOIO/DIAFI] Processamento interno de folha, eSocial, DCTFWeb, RAIS.", id_contrato: "", criticidade: "Alta", id_gerencia: "GER-APO01", sla_interno: "Fechamento da folha até o dia 25 de cada mês. Em crise: processamento emergencial em 48h.", tipo_plano: "PCO-APOIO", requer_drp: false, ativo_cmdb_id: "ATV-SYS04", estrategia_drp: "Backup & Restore", sla_contrato_cliente: 0, sla_tic: 0, status_aprovacao_tic: "Pendente",
      faturamento_anual: 0, perda_hora_estimada: 25000, ciclo_vida: "Maturidade", indicacao_gerel: "Processo interno regulatório. Falha implica multas trabalhistas e eSocial.",
      responsavel_testes: "Ana Ribeiro (Gepes)", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Ana Ribeiro (Gepes)",
      total_incidentes_12m: 0, ultimo_teste: null, status_plano: "Sem Plano", rpo_minutos: 480, mtpd_horas: 48.0 },
    { id_processo: "PROC-APO-003", nome: "Aquisições e Suprimentos de Emergência (Gesuc)", descricao: "[APOIO/DIAFI] Compras emergenciais durante contingências. SLA: aprovação e pedido em 24h.", id_contrato: "", criticidade: "Média", id_gerencia: "GER-APO03", sla_interno: "SLA interno: Aprovação e emissão de pedido em até 24h.", tipo_plano: "PCO-APOIO", requer_drp: false, ativo_cmdb_id: "", estrategia_drp: "Backup & Restore", sla_contrato_cliente: 0, sla_tic: 0, status_aprovacao_tic: "Pendente",
      faturamento_anual: 0, perda_hora_estimada: 8000, ciclo_vida: "Maturidade", indicacao_gerel: "Apoio operacional. Baixa prioridade de DR.",
      responsavel_testes: "Luis Fernandes (Gesuc)", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Luis Fernandes (Gesuc)",
      total_incidentes_12m: 0, ultimo_teste: null, status_plano: "Sem Plano", rpo_minutos: 1440, mtpd_horas: 24.0 },
    { id_processo: "PROC-APO-004", nome: "Evacuação Predial e Brigada de Incêndio (Gesap)", descricao: "[APOIO/DIAFI] Plano de evacuação de emergência, acionamento da brigada de incêndio.", id_contrato: "", criticidade: "Alta", id_gerencia: "GER-APO04", sla_interno: "SLA Brigada: Resposta até 5 minutos. Evacuação total em até 15 minutos.", tipo_plano: "PCO-APOIO", requer_drp: false, ativo_cmdb_id: "", estrategia_drp: "Backup & Restore", sla_contrato_cliente: 0, sla_tic: 0, status_aprovacao_tic: "Pendente",
      faturamento_anual: 0, perda_hora_estimada: 50000, ciclo_vida: "Maturidade", indicacao_gerel: "Segurança de pessoas. Obrigação legal (NR-23, NBR 15219). Prioridade regulatória.",
      responsavel_testes: "Sandro Lima (Gesap)", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Sandro Lima (Gesap)",
      total_incidentes_12m: 1, ultimo_teste: "2026-05-01", status_plano: "Plano Aprovado", rpo_minutos: 0, mtpd_horas: 0.25 },
    { id_processo: "PROC-CPL-001", nome: "Compliance, Jurídico e LGPD (Gecoj)", descricao: "Gestão de conformidade regulatória, LGPD, contratos e pareceres jurídicos.", id_contrato: "", criticidade: "Alta", id_gerencia: "GER-APO05", requer_drp: false, ativo_cmdb_id: "", estrategia_drp: "Backup & Restore", sla_contrato_cliente: 0, sla_tic: 0, status_aprovacao_tic: "Pendente",
      faturamento_anual: 0, perda_hora_estimada: 30000, ciclo_vida: "Maturidade", indicacao_gerel: "Compliance é custo regulatório. Sem faturamento mas exposição jurídica altíssima se falhar.",
      responsavel_testes: "Gestor Gecoj", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Gestor Gecoj",
      total_incidentes_12m: 0, ultimo_teste: null, status_plano: "Sem Plano", rpo_minutos: 720, mtpd_horas: 12.0,
      sla_interno: "SLA interno: 8h para pareceres legais emergenciais.", tipo_plano: "PCO-APOIO" },
    { id_processo: "PROC-ATM-001", nome: "Manutenção Preventiva de ATMs Nacional (Gered)", descricao: "Manutenção preventiva e corretiva da rede de terminais de autoatendimento em todo o Brasil.", id_contrato: "CON-ASTEC-09", criticidade: "Alta", id_gerencia: "GER-NEG02", requer_drp: false, ativo_cmdb_id: "", estrategia_drp: "Backup & Restore", sla_contrato_cliente: 480, sla_tic: 0, status_aprovacao_tic: "Pendente",
      faturamento_anual: 1100000, perda_hora_estimada: 18000, ciclo_vida: "Sunset", indicacao_gerel: "Rede de ATMs em fase de sunset. Migração para canais digitais em andamento. NÃO investir em DR adicional.",
      responsavel_testes: "Carla Souza (Gered)", verificador_geric: "Roberto Carlos (Geric)", gestor_accountability: "Carla Souza (Gered)",
      total_incidentes_12m: 0, ultimo_teste: "2025-09-15", status_plano: "Em Revisão", rpo_minutos: 1440, mtpd_horas: 24.0 }
  ],

  // ── INCIDENTES (v2) ───────────────────────────────────────────────────────
  incidentes: [
    {
      id_incidente: "INC-101", data_hora: "2026-04-12T14:30:00", local: "Data Center AWS", descricao: "Indisponibilidade devido a instabilidade no provedor de nuvem AWS.",
      tipo_incidente: "Falha de Infraestrutura Nuvem", impacto: "Alto", id_processo: "PROC-TIC-001",
      medidas_mitigacao: "Redirecionamento para a região backup em sa-east-1.", resultado_resposta: "Sistemas restabelecidos em 45 minutos.",
      rto_real_minutos: 45, rto_meta_minutos: 30, rto_ultrapassado: true,
      id_pco_acionado: "PCO-TIC-001", id_prd_acionado: "PRD-TIC-001",
      status_incidente: "fechado", critico: true
    },
    {
      id_incidente: "INC-102", data_hora: "2026-02-08T09:15:00", local: "Edifício Sede - 3º Andar", descricao: "Princípio de incêndio em sala de servidores locais causado por curto-circuito.",
      tipo_incidente: "Incidente Predial / Incêndio", impacto: "Alto", id_processo: "PROC-APO-004",
      medidas_mitigacao: "Acionamento imediato da brigada de incêndio. Evacuação do 3º e 4º andares. Extinção em 12 minutos.",
      resultado_resposta: "Área liberada em 2 horas. Nenhum ferido. Servidores locais transferidos para nuvem.",
      rto_real_minutos: 120, rto_meta_minutos: 30, rto_ultrapassado: true,
      id_pco_acionado: "PCO-APO-004", id_prd_acionado: null,
      status_incidente: "fechado", critico: true
    },
    {
      id_incidente: "INC-103", data_hora: "2026-05-20T16:45:00", local: "Sistema de Recebimentos", descricao: "Interrupção no canal de recebimentos integrados por atualização não homologada.",
      tipo_incidente: "Falha de Sistema Crítico", impacto: "Desastroso", id_processo: "PROC-COB-001",
      medidas_mitigacao: "Rollback da versão. Notificação imediata ao fiscal do contrato Gecob.",
      resultado_resposta: "Serviço normalizado em 38 minutos. Acionamento da cláusula de SLA.",
      rto_real_minutos: 38, rto_meta_minutos: 15, rto_ultrapassado: true,
      id_pco_acionado: "PCO-COB-001", id_prd_acionado: "PRD-TIC-002",
      status_incidente: "fechado", critico: true
    }
  ],

  // ── LIÇÕES APRENDIDAS ─────────────────────────────────────────────────────
  licoesAprendidas: [
    { id_licao: "LIC-001", id_incidente: "INC-101", descricao: "O failover automático não foi acionado por falha de configuração do health check.", categoria: "Técnica", recomendacao: "Revisar todos os health checks dos clusters. Testar failover mensalmente.", impacto_no_risco: "elevou_probabilidade", implementada: true, data_implementacao: "2026-04-30" },
    { id_licao: "LIC-002", id_incidente: "INC-102", descricao: "Ausência de inspeção elétrica anual foi fator contribuinte para o princípio de incêndio.", categoria: "Operacional", recomendacao: "Implementar inspeção elétrica semestral obrigatória. Atualizar PCO-APO-004.", impacto_no_risco: "novo_controle", implementada: true, data_implementacao: "2026-03-01" },
    { id_licao: "LIC-003", id_incidente: "INC-103", descricao: "Deploy realizado sem aprovação da gestão de mudanças (ITSM). Processo ITIL não seguido.", categoria: "Processo", recomendacao: "Reforçar CAB (Change Advisory Board) para mudanças em sistemas críticos. Treinamento obrigatório.", impacto_no_risco: "elevou_probabilidade", implementada: false, data_implementacao: null }
  ],

  // ── PLANOS DE AÇÃO ────────────────────────────────────────────────────────
  planosAcao: [
    { id_plano_acao: "PA-001", origem: "incidente", id_origem: "INC-103", descricao: "Implementar processo formal de homologação de mudanças em sistemas críticos. Reativar o CAB semanal com aprovação mandatória para sistemas Críticos.", responsavel: "Patrícia Lima (Getic) + Diego Ferreira (Gesec)", id_gerencia: "GER-TIC01", prazo: "2026-08-31", status: "em_andamento", criado_em: "2026-05-21", id_risco_vinculado: "RISK-003" },
    { id_plano_acao: "PA-002", origem: "incidente", id_origem: "INC-101", descricao: "Revisar e testar configuração de failover automático AWS. Documentar runbook de failover.", responsavel: "Patrícia Lima (Getic)", id_gerencia: "GER-TIC01", prazo: "2026-07-31", status: "concluido", criado_em: "2026-04-13", id_risco_vinculado: "RISK-001" },
    { id_plano_acao: "PA-003", origem: "teste", id_origem: "TST-002", descricao: "Reduzir tempo de evacuação de 13 para 10 minutos. Atualizar lista de brigadistas. Instalar sinalização adicional.", responsavel: "Sandro Lima (Gesap)", id_gerencia: "GER-APO04", prazo: "2026-09-30", status: "aberto", criado_em: "2026-06-01", id_risco_vinculado: "RISK-004" }
  ],

  // ── NOTIFICAÇÕES ──────────────────────────────────────────────────────────
  notificacoes: [
    { id_notificacao: "NOT-001", tipo: "incidente_critico", titulo: "⚠️ Incidente Crítico — RTO Ultrapassado (INC-103)", mensagem: "O incidente INC-103 no processo de Recebimentos ultrapassou o RTO definido de 15 minutos. RTO real: 38 minutos. Plano de ação PA-001 foi criado automaticamente.", id_destino: "GER-GOV01", prioridade: "critica", status: "nao_lida", criado_em: "2026-05-20T17:30:00Z", prazo_acao: "2026-05-21T17:30:00Z", link_acao: "incidentes" },
    { id_notificacao: "NOT-002", tipo: "plano_vencendo", titulo: "📅 Contrato CON-002 vencendo em 60 dias", mensagem: "O contrato Embratel (Link de Fibra Dedicado) vence em 01/06/2026. Acione a Gesuc para renovação.", id_destino: "GER-TIC01", prioridade: "alta", status: "nao_lida", criado_em: "2026-04-01T08:00:00Z", prazo_acao: "2026-05-01T08:00:00Z", link_acao: "contratos" },
    { id_notificacao: "NOT-003", tipo: "plano_acao_prazo", titulo: "⏰ Plano de Ação PA-003 com prazo próximo", mensagem: "O plano de ação PA-003 (Melhoria de Evacuação — Gesap) vence em 30/09/2026. Verificar andamento.", id_destino: "GER-APO04", prioridade: "media", status: "lida", criado_em: "2026-07-01T08:00:00Z", prazo_acao: "2026-09-30T00:00:00Z", link_acao: "organizacao" }
  ],

  // ── ANÁLISE DE IMPACTO NOS NEGÓCIOS ──────────────────────────────────────
  analiseImpactoNegocio: [
    { id_ain: "AIN-001", id_processo: "PROC-COB-001", probabilidade: "Provável", impacto_financeiro: "Catastrófico", RTO: 15, RPO: 5, MTDCN: 60 },
    { id_ain: "AIN-002", id_processo: "PROC-COB-002", probabilidade: "Pouco Provável", impacto_financeiro: "Maior", RTO: 120, RPO: 60, MTDCN: 480 },
    { id_ain: "AIN-003", id_processo: "PROC-COB-003", probabilidade: "Pouco Provável", impacto_financeiro: "Catastrófico", RTO: 30, RPO: 10, MTDCN: 120 },
    { id_ain: "AIN-004", id_processo: "PROC-GER-001", probabilidade: "Provável", impacto_financeiro: "Moderado", RTO: 480, RPO: 1440, MTDCN: 2880 },
    { id_ain: "AIN-005", id_processo: "PROC-TIC-001", probabilidade: "Pouco Provável", impacto_financeiro: "Catastrófico", RTO: 30, RPO: 15, MTDCN: 120 },
    { id_ain: "AIN-006", id_processo: "PROC-TIC-002", probabilidade: "Provável", impacto_financeiro: "Moderado", RTO: 120, RPO: 180, MTDCN: 360 },
    { id_ain: "AIN-007", id_processo: "PROC-APO-001", probabilidade: "Pouco Provável", impacto_financeiro: "Moderado", RTO: 2880, RPO: 2880, MTDCN: 7200 },
    { id_ain: "AIN-008", id_processo: "PROC-APO-002", probabilidade: "Pouco Provável", impacto_financeiro: "Maior", RTO: 240, RPO: 480, MTDCN: 1440 },
    { id_ain: "AIN-009", id_processo: "PROC-APO-003", probabilidade: "Provável", impacto_financeiro: "Menor", RTO: 1440, RPO: 2880, MTDCN: 5760 },
    { id_ain: "AIN-010", id_processo: "PROC-APO-004", probabilidade: "Provável", impacto_financeiro: "Maior", RTO: 30, RPO: 0, MTDCN: 60 }
  ],

  // ── PLANOS DE CONTINUIDADE (PCO) ──────────────────────────────────────────
  planosContinuidade: [
    {
      id_pco: "PCO-COB-001", id_processo: "PROC-COB-001", id_gerencia: "GER-NEG01",
      estrategia_recuperacao: "Failover automático para gateway adquirente reserva. Transações pendentes enfileiradas em Redis para reprocessamento.",
      responsabilidades: "SRE da Gecob e equipe de TI (Getic) executam o failover.",
      recursos_necessarios: "Gateway reserva, instâncias EC2 de contingência, Redis.",
      cenario_acesso: "Home office imediato para todos os analistas da Gecob. VPN e tokens MFA obrigatórios ativos.",
      cenario_sistemas: "Passo 1: Detectar falha via alertas PagerDuty. Passo 2: Mudar chave API do gateway. Passo 3: Contatar fiscal do contrato de canais: fiscal.canais@empresa.com.br / (61) 3333-1234. Passo 4: Comunicar cliente via status page.",
      cenario_fornecedores: "Em caso de falha total do canal de recebimentos, ativar processamento manual com equipe de backoffice até normalização.",
      cenario_pessoas: "Em caso de falta de 30%+ da equipe, acionar BPO parceiro para reforço de analistas de canais.",
      escalonamento_crise: "Se indisponibilidade exceder 15 min (RTO), o Gerente da Gecob escala para Comitê de Crise e Geric. Ata obrigatória.",
      status_aprovacao: "Vigente", versao: "2.1.0",
      data_proxima_revisao: "2027-01-01", data_ultima_revisao: "2026-01-01", ultima_revisao: "2026-01-01",
      vigente_ate: "2027-01-01", nivel_confidencialidade: "restrito",
      intervenientes: ["INT-001", "INT-002", "INT-003"],
      acionamentos: [{ data: "2026-05-20T16:45:00", id_incidente: "INC-103", acionado_por: "Marcos Costa (Gecob)" }],
      workflow_log: [
        { status: "Pendente GERIC", aprovador: "Marcos Costa", data: "2026-01-01T09:00:00", parecer: "Plano enviado para revisão." },
        { status: "Pendente TIC", aprovador: "Roberto Carlos (GERIC)", data: "2026-01-03T10:00:00", parecer: "Revisão concluída. ANS vigente confirmado (CTR-001)." },
        { status: "Pendente Gerente Exec", aprovador: "Patrícia Lima (TIC)", data: "2026-01-05T14:00:00", parecer: "Aval técnico concedido. PRD vinculado e validado." },
        { status: "Pendente Comitê", aprovador: "Diretora Fernanda Rocha", data: "2026-01-08T11:00:00", parecer: "Plano assinado pelo Gerente Executivo da área." },
        { status: "Vigente", aprovador: "Comitê Conti", data: "2026-01-12T16:00:00", parecer: "Deliberação Conti Ata 01/2026 — PCO aprovado por unanimidade. Vigência de 12 meses." }
      ],
      ans_vigente: "CTR-001", dispensa_ans: null,
      parecer_geric: "Revisão concluída. ANS vigente confirmado.",
      parecer_tic: "Aval técnico concedido. PRD vinculado e validado.",
      parecer_gerente: "Plano assinado pelo Gerente Executivo da área.",
      parecer_comite: "Ata 01/2026 — aprovado por unanimidade.",
      id_gerente_exec_aprovador: "USR-009"
    },
    {
      id_pco: "PCO-COB-002", id_processo: "PROC-COB-002", id_gerencia: "GER-NEG01",
      estrategia_recuperacao: "Suspensão temporária de novos protestos. Processamento manual das carteiras prioritárias.",
      responsabilidades: "Analistas sêniores de cobrança da Gecob gerenciam a fila manual.",
      recursos_necessarios: "Planilhas de contingência, acesso off-line às carteiras.",
      cenario_acesso: "Home office com acesso a planilhas compartilhadas no SharePoint.",
      cenario_sistemas: "Passo 1: Isolar a fila de cobrança. Passo 2: Contatar fiscal: fiscal.cobranca@gecob.com.br. Passo 3: Exportar carteiras ativas para planilha contingência.",
      cenario_fornecedores: "Não há dependência de fornecedor externo crítico. Contingência interna.",
      cenario_pessoas: "Redistribuição da fila entre analistas disponíveis.",
      escalonamento_crise: "Se indisponibilidade exceder 2h, escalar para Gerente da Gecob e Geric.",
      status_aprovacao: "Pendente GERIC", versao: "1.0.0",
      data_proxima_revisao: "2027-01-01", data_ultima_revisao: null, ultima_revisao: null,
      vigente_ate: "2027-01-01", nivel_confidencialidade: "restrito",
      intervenientes: ["INT-001", "INT-002"],
      acionamentos: [],
      workflow_log: [{ status: "Pendente GERIC", aprovador: "Marcos Costa", data: new Date().toISOString(), parecer: "Plano enviado para revisão GERIC." }],
      ans_vigente: null, dispensa_ans: null, parecer_geric: null, parecer_tic: null, parecer_gerente: null, parecer_comite: null, id_gerente_exec_aprovador: null
    },
    {
      id_pco: "PCO-APO-004", id_processo: "PROC-APO-004", id_gerencia: "GER-APO04",
      estrategia_recuperacao: "Evacuação imediata do edifício e ativação da brigada de incêndio. Transferência para escritório secundário ou home office.",
      responsabilidades: "Brigadista líder coordena evacuação. Gerente Gesap aciona CBMERJ e comunica Geric.",
      recursos_necessarios: "Extintores, mangueiras, rotas de fuga sinalizadas, lista de brigadistas ativos.",
      cenario_acesso: "Evacuação obrigatória de todos os andares. Muster point: Estacionamento Bloco B.",
      cenario_sistemas: "Passo 1: Acionar alarme predial. Passo 2: Ligar para Bombeiros (193). Passo 3: Acionar WhatsApp da Brigada.",
      cenario_fornecedores: "Acionar fornecedor de manutenção predial (SLA 2h) para inspeção e liberação do edifício.",
      cenario_pessoas: "Verificar lista de presença nos muster points. Comunicar Gepes sobre afastamentos médicos de emergência.",
      escalonamento_crise: "Qualquer incidente com vítimas ou dano estrutural = acionamento imediato do Comitê de Crise.",
      status_aprovacao: "Pendente TIC", versao: "1.3.0",
      data_proxima_revisao: "2027-01-01", data_ultima_revisao: "2026-02-09", ultima_revisao: "2026-02-09",
      vigente_ate: "2027-01-01", nivel_confidencialidade: "restrito",
      intervenientes: ["INT-001", "INT-006"],
      acionamentos: [{ data: "2026-02-08T09:15:00", id_incidente: "INC-102", acionado_por: "Sandro Lima (Gesap)" }],
      workflow_log: [
        { status: "Pendente GERIC", aprovador: "Sandro Lima", data: "2026-02-01T09:00:00", parecer: "Plano enviado para revisão." },
        { status: "Pendente TIC", aprovador: "Roberto Carlos (GERIC)", data: "2026-02-05T10:00:00", parecer: "Revisado. Encaminhado para aval técnico TIC." }
      ],
      ans_vigente: null, dispensa_ans: null, parecer_geric: "Revisado. Encaminhado para aval técnico TIC.", parecer_tic: null, parecer_gerente: null, parecer_comite: null, id_gerente_exec_aprovador: null
    },
    {
      id_pco: "PCO-GER-001", id_processo: "PROC-GER-001", id_gerencia: "GER-NEG02",
      estrategia_recuperacao: "Acionamento do plano de contingência presencial com equipes Astec regionais. Atendimento com SLA estendido.",
      responsabilidades: "Carla Souza (Gered) e coordenadores regionais Astec.",
      recursos_necessarios: "Estoque de peças de reposição e veículos de atendimento.",
      cenario_acesso: "Operação descentralizada em campo.",
      cenario_sistemas: "Passo 1: Registrar chamados manuais no sistema de contingência Astec.",
      cenario_fornecedores: "Acionamento imediato das 13 assistências técnicas cadastradas.",
      cenario_pessoas: "Remanejamento de técnicos de campo de regiões vizinhas.",
      escalonamento_crise: "Escalar para Gerente Gered se SLA de 24h for estourado em mais de 5 chamados simultâneos.",
      status_aprovacao: "Vigente", versao: "1.0.0",
      data_proxima_revisao: "2026-02-01", data_ultima_revisao: "2025-02-01", ultima_revisao: "2025-02-01",
      vigente_ate: "2026-02-01", nivel_confidencialidade: "restrito",
      intervenientes: ["INT-007"], acionamentos: [],
      workflow_log: [
        { status: "Vigente", aprovador: "Comitê Conti", data: "2025-02-01T10:00:00", parecer: "Plano aprovado com vigência de 12 meses." }
      ],
      ans_vigente: "CON-ASTEC-01", dispensa_ans: null, parecer_geric: "Aprovado", parecer_tic: "Aprovado", parecer_gerente: "Aprovado", parecer_comite: "Aprovado", id_gerente_exec_aprovador: "USR-009"
    },
    {
      id_pco: "PCO-PIN-001", id_processo: "PROC-PIN-001", id_gerencia: "GER-NEG07",
      estrategia_recuperacao: "Ambiente de contingência em nuvem secundária para o Portal de Inovação.",
      responsabilidades: "Gilberto Ramos (Gepin).",
      recursos_necessarios: "Servidores em nuvem de teste.",
      cenario_acesso: "Acesso remoto via VPN.",
      cenario_sistemas: "Passo 1: Ativar réplica do portal de inovação.",
      cenario_fornecedores: "Provedor de nuvem secundário.",
      cenario_pessoas: "Equipe de projetos Gepin.",
      escalonamento_crise: "Escalar se fora por mais de 24h.",
      status_aprovacao: "Vigente", versao: "1.1.0",
      data_proxima_revisao: "2026-08-20", data_ultima_revisao: "2025-08-20", ultima_revisao: "2025-08-20",
      vigente_ate: "2026-08-20", nivel_confidencialidade: "interno",
      intervenientes: ["INT-001"], acionamentos: [],
      workflow_log: [
        { status: "Vigente", aprovador: "Comitê Conti", data: "2025-08-20T10:00:00", parecer: "Aprovado por 1 ano." }
      ],
      ans_vigente: null, dispensa_ans: "Ambiente de testes/inovação sem contrato de cliente", parecer_geric: "Aprovado", parecer_tic: "Aprovado", parecer_gerente: "Aprovado", parecer_comite: "Aprovado", id_gerente_exec_aprovador: "USR-014"
    },
    {
      id_pco: "PCO-TIC-001", id_processo: "PROC-TIC-001", id_gerencia: "GER-TIC01",
      estrategia_recuperacao: "Failover automático de clusters AWS us-east-1 para região secundária sa-east-1.",
      responsabilidades: "Patrícia Lima (Getic) e equipe SRE.",
      recursos_necessarios: "Clusters EKS reservas, snapshots S3 Glacier, licenças Fortinet.",
      cenario_acesso: "Acesso remoto via VPN SSL com MFA obrigatório.",
      cenario_sistemas: "Passo 1: Detectar indisponibilidade via PagerDuty. Passo 2: Promover banco secundário RDS. Passo 3: Alterar DNS Route 53.",
      cenario_fornecedores: "Acionar AWS Enterprise Support via chamado Sev-1 (SLA 15min).",
      cenario_pessoas: "Equipe SRE em escala de sobreaviso 24x7.",
      escalonamento_crise: "Indisponibilidade > 30 min escalada para Comitê de Crise.",
      status_aprovacao: "Vigente", versao: "2.1.0",
      data_proxima_revisao: "2027-01-15", data_ultima_revisao: "2026-01-15", ultima_revisao: "2026-01-15",
      vigente_ate: "2027-01-15", nivel_confidencialidade: "restrito",
      intervenientes: ["INT-003", "INT-004"], acionamentos: [],
      workflow_log: [{ status: "Vigente", aprovador: "Comitê Conti", data: "2026-01-15T10:00:00", parecer: "PCO e PRD homologados com vigência de 12 meses." }],
      ans_vigente: "CON-001", dispensa_ans: null, parecer_geric: "Aprovado", parecer_tic: "Aprovado", parecer_gerente: "Aprovado", parecer_comite: "Aprovado", id_gerente_exec_aprovador: "USR-003"
    },
    {
      id_pco: "PCO-TIC-002", id_processo: "PROC-TIC-002", id_gerencia: "GER-TIC01",
      estrategia_recuperacao: "Comutação automática para link de fibra óptica redundante secundário.",
      responsabilidades: "Patrícia Lima (Getic).",
      recursos_necessarios: "Link dedicado secundário, roteadores BGP redundantes.",
      cenario_acesso: "Gestão remota de roteadores.",
      cenario_sistemas: "Passo 1: Comutar BGP para operadora secundária. Passo 2: Notificar Embratel.",
      cenario_fornecedores: "Acionar SLA da Embratel (RTO 2h).",
      cenario_pessoas: "Equipe de redes de sobreaviso.",
      escalonamento_crise: "Escalar se ambos os links caírem.",
      status_aprovacao: "Vigente", versao: "1.5.0",
      data_proxima_revisao: "2027-02-10", data_ultima_revisao: "2026-02-10", ultima_revisao: "2026-02-10",
      vigente_ate: "2027-02-10", nivel_confidencialidade: "restrito",
      intervenientes: ["INT-003"], acionamentos: [],
      workflow_log: [{ status: "Vigente", aprovador: "Comitê Conti", data: "2026-02-10T10:00:00", parecer: "Plano de redundância de link vigente." }],
      ans_vigente: "CON-002", dispensa_ans: null, parecer_geric: "Aprovado", parecer_tic: "Aprovado", parecer_gerente: "Aprovado", parecer_comite: "Aprovado", id_gerente_exec_aprovador: "USR-003"
    },
    {
      id_pco: "PCO-SEC-001", id_processo: "PROC-SEC-001", id_gerencia: "GER-TIC04",
      estrategia_recuperacao: "Isolamento estrito de vLANs comprometidas e ativação do SOC de contingência em nuvem.",
      responsabilidades: "Diego Ferreira (Gesec).",
      recursos_necessarios: "SIEM, Firewalls FortiGate HA, EDR CrowdStrike.",
      cenario_acesso: "War Room remota de Cibersegurança.",
      cenario_sistemas: "Passo 1: Bloquear IPs maliciosos no FortiGate. Passo 2: Isolar máquinas no EDR.",
      cenario_fornecedores: "Acionar suporte Fortinet Sev-1.",
      cenario_pessoas: "Analistas de SOC 24x7.",
      escalonamento_crise: "Ransomware ou vazamento = Notificação ANPD e Comitê de Crise em 15min.",
      status_aprovacao: "Vigente", versao: "2.0.0",
      data_proxima_revisao: "2027-03-01", data_ultima_revisao: "2026-03-01", ultima_revisao: "2026-03-01",
      vigente_ate: "2027-03-01", nivel_confidencialidade: "secreto",
      intervenientes: ["INT-004"], acionamentos: [],
      workflow_log: [{ status: "Vigente", aprovador: "Comitê Conti", data: "2026-03-01T10:00:00", parecer: "PCO de Cibersegurança homologado." }],
      ans_vigente: "CON-SEC-001", dispensa_ans: null, parecer_geric: "Aprovado", parecer_tic: "Aprovado", parecer_gerente: "Aprovado", parecer_comite: "Aprovado", id_gerente_exec_aprovador: "USR-004"
    },
    {
      id_pco: "PCO-SIT-001", id_processo: "PROC-SIT-001", id_gerencia: "GER-TIC05",
      estrategia_recuperacao: "Redirecionamento de rotas do API Gateway para réplicas ativas em nuvem.",
      responsabilidades: "Bruno Mendes (Gesit).",
      recursos_necessarios: "API Gateway Kong/AWS, microserviços redundantes.",
      cenario_acesso: "Acesso administrativo via VPN.",
      cenario_sistemas: "Passo 1: Re-rotear requisições para cluster secundário.",
      cenario_fornecedores: "Acionar fornecedores de sistemas integrados.",
      cenario_pessoas: "Desenvolvedores e SREs de sistemas.",
      escalonamento_crise: "Escalar se lentidão afetar liquidação Gecob.",
      status_aprovacao: "Vigente", versao: "1.2.0",
      data_proxima_revisao: "2027-01-20", data_ultima_revisao: "2026-01-20", ultima_revisao: "2026-01-20",
      vigente_ate: "2027-01-20", nivel_confidencialidade: "restrito",
      intervenientes: ["INT-003"], acionamentos: [],
      workflow_log: [{ status: "Vigente", aprovador: "Comitê Conti", data: "2026-01-20T10:00:00", parecer: "PCO de APIs aprovado." }],
      ans_vigente: "CON-001", dispensa_ans: null, parecer_geric: "Aprovado", parecer_tic: "Aprovado", parecer_gerente: "Aprovado", parecer_comite: "Aprovado", id_gerente_exec_aprovador: "USR-003"
    },
    {
      id_pco: "PCO-NED-001", id_processo: "PROC-NED-001", id_gerencia: "GER-NEG03",
      estrategia_recuperacao: "Comutação do motor de crédito digital para contingência ativa na AWS.",
      responsabilidades: "Gestor Gened.",
      recursos_necessarios: "Motor de crédito em nuvem, réplicas de banco de dados.",
      cenario_acesso: "Home office com acesso seguro.",
      cenario_sistemas: "Passo 1: Chavear esteira de crédito para motor secundário.",
      cenario_fornecedores: "Bureau de crédito (Serasa/Boa Vista).",
      cenario_pessoas: "Equipe de produtos digitais.",
      escalonamento_crise: "Parada > 15min escala para Diretoria de Operações.",
      status_aprovacao: "Vigente", versao: "2.0.0",
      data_proxima_revisao: "2027-04-15", data_ultima_revisao: "2026-04-15", ultima_revisao: "2026-04-15",
      vigente_ate: "2027-04-15", nivel_confidencialidade: "restrito",
      intervenientes: ["INT-002"], acionamentos: [],
      workflow_log: [{ status: "Vigente", aprovador: "Comitê Conti", data: "2026-04-15T10:00:00", parecer: "Plano aprovado." }],
      ans_vigente: "CON-GECOB-001", dispensa_ans: null, parecer_geric: "Aprovado", parecer_tic: "Aprovado", parecer_gerente: "Aprovado", parecer_comite: "Aprovado", id_gerente_exec_aprovador: "USR-009"
    },
    {
      id_pco: "PCO-OLQ-001", id_processo: "PROC-OLQ-001", id_gerencia: "GER-NEG05",
      estrategia_recuperacao: "Processamento de liquidação via fila de contingência off-line e grade BACEN secundária.",
      responsabilidades: "Gestor Geoliq.",
      recursos_necessarios: "Grade de liquidação secundária, planilhas auditadas.",
      cenario_acesso: "Acesso a terminais de conciliação bancária.",
      cenario_sistemas: "Passo 1: Ativar transmissão contingencial CNAB.",
      cenario_fornecedores: "Bancos liquidantes parceiros.",
      cenario_pessoas: "Equipe de liquidação financeira.",
      escalonamento_crise: "Atraso na grade BACEN = notificação regulatória iminente.",
      status_aprovacao: "Vigente", versao: "1.8.0",
      data_proxima_revisao: "2027-05-10", data_ultima_revisao: "2026-05-10", ultima_revisao: "2026-05-10",
      vigente_ate: "2027-05-10", nivel_confidencialidade: "restrito",
      intervenientes: ["INT-002"], acionamentos: [],
      workflow_log: [{ status: "Vigente", aprovador: "Comitê Conti", data: "2026-05-10T10:00:00", parecer: "Plano de liquidação aprovado." }],
      ans_vigente: "CON-GECOB-001", dispensa_ans: null, parecer_geric: "Aprovado", parecer_tic: "Aprovado", parecer_gerente: "Aprovado", parecer_comite: "Aprovado", id_gerente_exec_aprovador: "USR-009"
    },
    {
      id_pco: "PCO-FIN-001", id_processo: "PROC-FIN-001", id_gerencia: "GER-APO02",
      estrategia_recuperacao: "Processamento fiscal e pagamentos emergenciais via contingência offline ERP SAP.",
      responsabilidades: "Carla Mendes (Gefic).",
      recursos_necessarios: "Certificados digitais e tokens bancários de contingência.",
      cenario_acesso: "Acesso remoto com VPN corporativa.",
      cenario_sistemas: "Passo 1: Transmitir obrigações via PVA offline. Passo 2: Liberar lote emergencial.",
      cenario_fornecedores: "SAP Brasil / Bancos parceiros.",
      cenario_pessoas: "Equipe financeira de plantão.",
      escalonamento_crise: "Risco de descumprimento de SPED/tributos = acionamento jurídico em 2h.",
      status_aprovacao: "Vigente", versao: "1.0.0",
      data_proxima_revisao: "2027-02-28", data_ultima_revisao: "2026-02-28", ultima_revisao: "2026-02-28",
      vigente_ate: "2027-02-28", nivel_confidencialidade: "restrito",
      intervenientes: ["INT-001"], acionamentos: [],
      workflow_log: [{ status: "Vigente", aprovador: "Comitê Conti", data: "2026-02-28T10:00:00", parecer: "PCO financeiro aprovado." }],
      ans_vigente: null, dispensa_ans: "Processo interno de apoio financeiro", parecer_geric: "Aprovado", parecer_tic: "Aprovado", parecer_gerente: "Aprovado", parecer_comite: "Aprovado", id_gerente_exec_aprovador: "USR-010"
    }
  ],

  // ── PLANOS DE RECUPERAÇÃO DE DESASTRES (PRD) ──────────────────────────────
  planosRecuperacaoDesastres: [
    {
      id_prd: "PRD-TIC-001", id_processo: "PROC-TIC-001",
      procedimentos_restauracao: "1. Verificar logs CloudWatch. 2. Restaurar snapshot transacional do S3 (RPO = 15 min). 3. Ativar cluster de contingência em sa-east-1.",
      local_backup: "AWS S3 Glacier (sa-east-1 + eu-west-1)", frequencia_backup: "A cada 15 minutos",
      comunicacao_emergencia: "Notificar time SRE via PagerDuty e Slack #incidentes-graves. E-mail automático para Getic e Gesec.",
      procedimento_war_room: "1. Identificar falha prolongada (> 30 min). 2. Criar sala Teams 'War-Room-Crise-Infra'. 3. Convocar: Gerente Getic, Gesec, Geape e fiscal AWS. 4. Status page atualizada a cada 15 min.",
      status_aprovacao: "Aprovado", versao: "1.1.0",
      data_proxima_revisao: "2027-01-01", vigente_ate: "2027-01-01"
    },
    {
      id_prd: "PRD-TIC-002", id_processo: "PROC-COB-001",
      procedimentos_restauracao: "1. Verificar logs da API do gateway. 2. Ativar API de contingência. 3. Reprocessar transações enfileiradas no Redis.",
      local_backup: "AWS S3 (us-east-1) - Snapshots de filas Redis", frequencia_backup: "A cada 5 minutos",
      comunicacao_emergencia: "Notificar SRE Gecob via PagerDuty. Canal Slack #incidentes-checkout.",
      procedimento_war_room: "1. Falha > 15 min: Criar War Room Teams 'War-Room-Canais'. 2. Convocar Gecob, Getic e fiscal de canais. 3. Acionamento de Geemp se SLA contratual ultrapassado.",
      status_aprovacao: "Aprovado", versao: "1.0.0",
      data_proxima_revisao: "2027-01-01", vigente_ate: "2027-01-01"
    }
  ],

  // ── TESTES E AVALIAÇÕES ───────────────────────────────────────────────────
  testesAvaliacoes: [
    {
      id_teste: "TST-001", id_pco: "PCO-COB-001", id_prd: "PRD-TIC-002", data_teste: "2026-03-10",
      tipo_teste: "simulacao_mesa", resultado: "Sucesso",
      areas_melhoria: "Failover do canal de recebimentos concluído em 12 min (RTO = 15 min). Melhoria: automatizar notificação ao fiscal.",
      cenarios_testados: [
        { cenario: "acesso", resultado: "passou", observacoes: "Home office ativado em 5 min." },
        { cenario: "sistemas", resultado: "passou", observacoes: "Failover concluído em 12 min." },
        { cenario: "fornecedores", resultado: "parcial", observacoes: "Contato com fiscal demorou 20 min." },
        { cenario: "pessoas", resultado: "passou", observacoes: "BPO acionado em 15 min." }
      ],
      gerou_plano_acao: false, id_plano_acao: null,
      participantes: ["Marcos Costa (Gecob)", "Patrícia Lima (Getic)", "Roberto Carlos (Geric)"],
      proxima_revisao_data: "2026-09-10"
    },
    {
      id_teste: "TST-002", id_pco: "PCO-APO-004", id_prd: null, data_teste: "2026-06-01",
      tipo_teste: "exercicio_campo", resultado: "Parcial",
      areas_melhoria: "Simulação de incêndio: evacuação em 13 min. Meta: reduzir para 10 min. Atualizar lista de brigadistas.",
      cenarios_testados: [
        { cenario: "acesso", resultado: "falhou", observacoes: "Evacuação levou 13 min (meta: 10 min)." },
        { cenario: "sistemas", resultado: "passou", observacoes: "Alarme disparado em 30 segundos." },
        { cenario: "fornecedores", resultado: "passou", observacoes: "Fornecedor de manutenção acionado em 1h." },
        { cenario: "pessoas", resultado: "parcial", observacoes: "3 colaboradores não encontrados no muster point." }
      ],
      gerou_plano_acao: true, id_plano_acao: "PA-003",
      participantes: ["Sandro Lima (Gesap)", "Arthur Mendes (Geemp)", "Roberto Carlos (Geric)"],
      proxima_revisao_data: "2026-12-01"
    }
  ],

  revisoesAtualizacoes: [
    { id_revisao: "REV-001", id_pco: "PCO-COB-001", id_prd: "PRD-TIC-002", data_revisao: "2026-04-15", motivo: "Mudança no gateway reserva", atualizacao_realizada: "Substituição do gateway reserva para Pagar.me." },
    { id_revisao: "REV-002", id_pco: "PCO-APO-004", id_prd: null, data_revisao: "2026-02-09", motivo: "Incidente de incêndio real", atualizacao_realizada: "Atualização do plano após incidente INC-102. Inclusão de procedimento de inspeção elétrica anual." }
  ],

  governancaGCN: [
    { id_governanca: "GOV-001", responsavel: "Roberto Carlos (Geric)", comunicacao: "Comitê trimestral de crises", treinamento: "Simulado semestral obrigatório", id_processo: "PROC-COB-001" },
    { id_governanca: "GOV-002", responsavel: "Sandro Lima (Gesap)", comunicacao: "Reunião mensal com brigada", treinamento: "Treinamento semestral de brigada certificado CBMERJ", id_processo: "PROC-APO-004" },
    { id_governanca: "GOV-003", responsavel: "Patrícia Souza (Getic)", comunicacao: "Reunião semanal de operações TI", treinamento: "Simulado de DR trimestral", id_processo: "PROC-TIC-001" }
  ],

  avaliacaoNRGCN: [
    { id_avaliacao: "EVL-001", id_processo: "PROC-COB-001", nivel_resiliencia: 4.60, aderencia_ISO22301: 90.0, nota_area: 4.50, nota_geric: 4.70, checklist_area: "{\"req_equipe\":true,\"req_remoto\":true,\"req_rto\":true,\"req_testes\":true,\"req_contatos\":true}", checklist_geric: "{\"req_politica\":true,\"req_pco_rev\":true,\"req_simulado\":true,\"req_rto_bia\":true,\"req_matriz\":true,\"req_comite\":true}", comentarios_geric: "Processo com alta governança e eficácia de failover validada.", grafico_resultado: "radar_PROC-COB-001" },
    { id_avaliacao: "EVL-002", id_processo: "PROC-COB-002", nivel_resiliencia: 2.10, aderencia_ISO22301: 27.5, nota_area: 2.50, nota_geric: 1.80, checklist_area: "{\"req_equipe\":true,\"req_remoto\":false,\"req_rto\":true,\"req_testes\":false,\"req_contatos\":false}", checklist_geric: "{\"req_politica\":true,\"req_pco_rev\":false,\"req_simulado\":false,\"req_rto_bia\":false,\"req_matriz\":false,\"req_comite\":false}", comentarios_geric: "Necessita de revisão urgente do PCO e simulação operacional.", grafico_resultado: "radar_PROC-COB-002" },
    { id_avaliacao: "EVL-003", id_processo: "PROC-COB-003", nivel_resiliencia: 3.40, aderencia_ISO22301: 60.0, nota_area: 4.00, nota_geric: 3.00, checklist_area: "{\"req_equipe\":true,\"req_remoto\":true,\"req_rto\":true,\"req_testes\":true,\"req_contatos\":false}", checklist_geric: "{\"req_politica\":true,\"req_pco_rev\":true,\"req_simulado\":false,\"req_rto_bia\":true,\"req_matriz\":false,\"req_comite\":false}", comentarios_geric: "Aguardando testes formais de contingência de câmbio.", grafico_resultado: "radar_PROC-COB-003" },
    { id_avaliacao: "EVL-004", id_processo: "PROC-GER-001", nivel_resiliencia: 3.00, aderencia_ISO22301: 50.0, nota_area: 3.00, nota_geric: 3.00, checklist_area: "{}", checklist_geric: "{}", comentarios_geric: "Inicializado.", grafico_resultado: "radar_PROC-GER-001" },
    { id_avaliacao: "EVL-005", id_processo: "PROC-TIC-001", nivel_resiliencia: 4.20, aderencia_ISO22301: 80.0, nota_area: 4.00, nota_geric: 4.30, checklist_area: "{}", checklist_geric: "{}", comentarios_geric: "Aprovado no simulado prático.", grafico_resultado: "radar_PROC-TIC-001" },
    { id_avaliacao: "EVL-006", id_processo: "PROC-APO-001", nivel_resiliencia: 2.10, aderencia_ISO22301: 27.5, nota_area: 2.00, nota_geric: 2.20, checklist_area: "{}", checklist_geric: "{}", comentarios_geric: "Plano de apoio pendente de treinamento.", grafico_resultado: "radar_PROC-APO-001" },
    { id_avaliacao: "EVL-007", id_processo: "PROC-APO-004", nivel_resiliencia: 3.80, aderencia_ISO22301: 70.0, nota_area: 4.00, nota_geric: 3.70, checklist_area: "{}", checklist_geric: "{}", comentarios_geric: "Concluído o teste predial de evacuação.", grafico_resultado: "radar_PROC-APO-004" }
  ],

  // ── PLANO ANUAL DE EXERCÍCIOS E SIMULADOS (ISO 22301 §8.5) ───────────────
  calendarioSimuladosAnuais: [
    {
      id_simulado: "SIM-2026-Q1",
      titulo: "Simulado de Mesa Tabletop — Canais Digitais e Cobrança",
      trimestre: "Q1 2026",
      data_agendada: "2026-02-15",
      id_processo: "PROC-COB-001",
      tipo: "Simulação de Mesa (Tabletop)",
      gerencia_responsavel: "Gecob / Geric",
      status: "Concluído",
      resultado: "Sucesso (Score 95/100)",
      rto_meta_min: 15,
      rto_atingido_min: 14,
      evidencias: [
        { nome: "Ata_Tabletop_Q1_2026.pdf", tipo: "Ata de Exercício", tamanho: "1.2 MB", data: "2026-02-15" },
        { nome: "Log_Failover_Gateways_Pagarme.txt", tipo: "Log Técnico", tamanho: "450 KB", data: "2026-02-15" }
      ],
      parecer_geric: "Exercício concluído com alto nível de prontidão da 1ª Linha. RTO atingido dentro do SLA.",
      parecer_auditoria: "Evidências checadas e homologadas pela 3ª Linha (Geraud)."
    },
    {
      id_simulado: "SIM-2026-Q2",
      titulo: "Simulado de Evacuação Predial e Brigada de Incêndio",
      trimestre: "Q2 2026",
      data_agendada: "2026-05-20",
      id_processo: "PROC-APO-004",
      tipo: "Exercício Prático de Campo",
      gerencia_responsavel: "Gesap / CBMERJ",
      status: "Concluído",
      resultado: "Sucesso Parcial",
      rto_meta_min: 30,
      rto_atingido_min: 28,
      evidencias: [
        { nome: "Laudo_CBMERJ_Simulado_Evacuacao.pdf", tipo: "Relatório Oficial", tamanho: "3.8 MB", data: "2026-05-20" },
        { nome: "Lista_Presenca_Muster_Point.xlsx", tipo: "Controle de Pessoas", tamanho: "210 KB", data: "2026-05-20" }
      ],
      parecer_geric: "Evacuação concluída em 28 minutos. Plano de ação PA-003 aberto para ajuste de rotas no 3º andar.",
      parecer_auditoria: "Plano mitigatório PA-003 sob acompanhamento da 3ª Linha."
    },
    {
      id_simulado: "SIM-2026-Q3",
      titulo: "Simulado de Failover DR de TI & Banco de Dados (AWS us-east-1)",
      trimestre: "Q3 2026",
      data_agendada: "2026-08-15",
      id_processo: "PROC-TIC-001",
      tipo: "Teste Técnico de DR / Failover",
      gerencia_responsavel: "Getic / Geati",
      status: "Agendado",
      resultado: "Aguardando Execução",
      rto_meta_min: 30,
      rto_atingido_min: null,
      evidencias: [],
      parecer_geric: "Script de testes aprovado pela GERIC. War room agendada na sala 402.",
      parecer_auditoria: "Auditoria Interna agendada para acompanhamento in loco."
    },
    {
      id_simulado: "SIM-2026-Q4",
      titulo: "Simulado de Cibersegurança & Resposta a Ransomware",
      trimestre: "Q4 2026",
      data_agendada: "2026-11-10",
      id_processo: "PROC-TIC-002",
      tipo: "Simulado Cyber / Red Team",
      gerencia_responsavel: "Gesec / SOC",
      status: "Planejado",
      resultado: "Aguardando Q4",
      rto_meta_min: 60,
      rto_atingido_min: null,
      evidencias: [],
      parecer_geric: "Escopo em definição pela equipe de Cibersegurança.",
      parecer_auditoria: "Pendente de alinhamento prévio."
    }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getDB = () => {
  const dbStr = localStorage.getItem("gcn_database");
  if (!dbStr) {
    localStorage.setItem("gcn_database", JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  try {
    const db = JSON.parse(dbStr);
    if (db.db_version !== INITIAL_DATA.db_version) {
      localStorage.setItem("gcn_database", JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    return db;
  } catch (e) {
    localStorage.setItem("gcn_database", JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
};

const saveDB = (data) => {
  localStorage.setItem("gcn_database", JSON.stringify(data));
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVIÇO EXPORTADO
// ─────────────────────────────────────────────────────────────────────────────
export const dbService = {
  reset() { saveDB(INITIAL_DATA); return INITIAL_DATA; },

  // CONFIG
  configSistema: {
    get: () => getDB().configSistema || INITIAL_DATA.configSistema,
    save: (cfg) => {
      const db = getDB();
      db.configSistema = { ...db.configSistema, ...cfg };
      saveDB(db);
      return db.configSistema;
    }
  },

  // USUÁRIOS
  usuarios: {
    list: () => getDB().usuariosSimulados || [],
    getById: (id) => (getDB().usuariosSimulados || []).find(u => u.id_usuario === id) || null,
    autenticar: (email, senha) => {
      const u = (getDB().usuariosSimulados || []).find(u => u.email === email && u.senha === senha);
      return u || null;
    }
  },

  // DIRETORIAS
  diretorias: {
    list: () => getDB().diretorias,
    create: (d) => {
      const db = getDB();
      const newD = { ...d, id_diretoria: d.id_diretoria || `DIR-${Date.now().toString().slice(-4)}` };
      db.diretorias.push(newD); saveDB(db); return newD;
    }
  },

  // GERÊNCIAS
  gerencias: {
    list: () => {
      const db = getDB();
      return db.gerencias.map(g => ({ ...g, diretoria: db.diretorias.find(d => d.id_diretoria === g.id_diretoria) }));
    },
    create: (g) => {
      const db = getDB();
      const newG = { ...g, id_gerencia: g.id_gerencia || `GER-${g.sigla.toUpperCase()}` };
      db.gerencias.push(newG); saveDB(db); return newG;
    }
  },

  // ATIVOS
  ativosSistemas: {
    list: () => getDB().ativosSistemas || [],
    create: (a) => {
      const db = getDB();
      const newA = { ...a, id_ativo: a.id_ativo || `ATV-${Date.now().toString().slice(-4)}` };
      if (!db.ativosSistemas) db.ativosSistemas = [];
      db.ativosSistemas.push(newA); saveDB(db); return newA;
    },
    update: (id, data) => {
      const db = getDB();
      const idx = db.ativosSistemas.findIndex(a => a.id_ativo === id);
      if (idx !== -1) { db.ativosSistemas[idx] = { ...db.ativosSistemas[idx], ...data }; saveDB(db); }
      return db.ativosSistemas[idx];
    },
    delete: (id) => {
      const db = getDB();
      db.ativosSistemas = db.ativosSistemas.filter(a => a.id_ativo !== id);
      saveDB(db); return true;
    }
  },

  // RISCOS
  riscos: {
    list: () => {
      const db = getDB();
      return (db.riscos || []).map(r => ({ ...r, processo: db.processosCriticos.find(p => p.id_processo === r.id_processo) }));
    },
    create: (r) => {
      const db = getDB();
      const newR = { ...r, id_risco: `RISK-${Date.now().toString().slice(-4)}`, historico_alteracoes: [], probabilidade_original: r.probabilidade, probabilidade_atual: r.probabilidade };
      db.riscos.push(newR); saveDB(db); return newR;
    },
    update: (id, data) => {
      const db = getDB();
      const idx = db.riscos.findIndex(r => r.id_risco === id);
      if (idx !== -1) { db.riscos[idx] = { ...db.riscos[idx], ...data }; saveDB(db); }
      return db.riscos[idx];
    },
    elevarProbabilidade: (id_risco, motivo, usuario) => {
      const db = getDB();
      const idx = db.riscos.findIndex(r => r.id_risco === id_risco);
      if (idx === -1) return null;
      const niveis = ['Rara', 'Pouco Provável', 'Provável', 'Muito Provável', 'Quase Certa'];
      const probAtual = db.riscos[idx].probabilidade_atual || db.riscos[idx].probabilidade;
      const nivelAtual = niveis.indexOf(probAtual);
      const novaNivel = Math.min(nivelAtual + 1, 4);
      const novaProb = niveis[novaNivel];
      const alteracao = { data: new Date().toISOString(), motivo, de: probAtual, para: novaProb, usuario };
      db.riscos[idx].probabilidade_atual = novaProb;
      db.riscos[idx].probabilidade = novaProb;
      if (!db.riscos[idx].historico_alteracoes) db.riscos[idx].historico_alteracoes = [];
      db.riscos[idx].historico_alteracoes.push(alteracao);
      saveDB(db); return db.riscos[idx];
    },
    delete: (id) => {
      const db = getDB(); db.riscos = db.riscos.filter(r => r.id_risco !== id); saveDB(db); return true;
    }
  },

  // INTERVENIENTES
  intervenientes: {
    list: () => getDB().intervenientes || [],
    listForProcesso: (id_processo) => (getDB().intervenientes || []).filter(i => i.id_processo === id_processo || i.id_processo === null),
    create: (i) => {
      const db = getDB();
      const newI = { ...i, id_interveniente: `INT-${Date.now().toString().slice(-4)}` };
      if (!db.intervenientes) db.intervenientes = [];
      db.intervenientes.push(newI); saveDB(db); return newI;
    },
    delete: (id) => {
      const db = getDB();
      db.intervenientes = (db.intervenientes || []).filter(i => i.id_interveniente !== id);
      saveDB(db); return true;
    }
  },

  // ATAS
  atasComiteCrise: {
    list: () => getDB().atasComiteCrise || [],
    create: (a) => {
      const db = getDB();
      const newA = { ...a, id_ata: `ATA-${Date.now().toString().slice(-4)}` };
      if (!db.atasComiteCrise) db.atasComiteCrise = [];
      db.atasComiteCrise.push(newA); saveDB(db); return newA;
    }
  },

  // CONTRATOS
  contratos: {
    list: () => {
      const db = getDB();
      return db.contratos.map(c => ({ ...c, gerencia: db.gerencias.find(g => g.id_gerencia === c.id_gerencia) }));
    },
    create: (c) => {
      const db = getDB();
      const newC = { ...c, id_contrato: `CON-${Date.now().toString().slice(-4)}` };
      db.contratos.push(newC); saveDB(db); return newC;
    },
    delete: (id) => {
      const db = getDB();
      db.contratos = db.contratos.filter(c => c.id_contrato !== id);
      if (db.processosCriticos) {
        db.processosCriticos.forEach(p => {
          if (p.id_contrato === id) p.id_contrato = null;
        });
      }
      saveDB(db);
      return true;
    }
  },

  // PROCESSOS CRÍTICOS
  processosCriticos: {
    list: () => {
      const db = getDB();
      return db.processosCriticos.map(p => ({
        ...p,
        contrato: db.contratos.find(c => c.id_contrato === p.id_contrato),
        gerencia: db.gerencias.find(g => g.id_gerencia === p.id_gerencia),
        ativos: (db.processosCriticosAtivos || []).filter(pca => pca.id_processo === p.id_processo)
          .map(pca => db.ativosSistemas.find(a => a.id_ativo === pca.id_ativo)).filter(Boolean)
      }));
    },
    get: (id) => {
      const db = getDB(); const p = db.processosCriticos.find(x => x.id_processo === id);
      if (!p) return null;
      return { ...p, contrato: db.contratos.find(c => c.id_contrato === p.id_contrato), gerencia: db.gerencias.find(g => g.id_gerencia === p.id_gerencia) };
    },
    create: (p) => {
      const db = getDB();
      const newP = { ...p, id_processo: `PROC-${Date.now().toString().slice(-4)}` };
      db.processosCriticos.push(newP);
      if (p.ativosIds && Array.isArray(p.ativosIds)) {
        p.ativosIds.forEach(ativoId => { if (!db.processosCriticosAtivos) db.processosCriticosAtivos = []; db.processosCriticosAtivos.push({ id_processo: newP.id_processo, id_ativo: ativoId }); });
      }
      saveDB(db); return newP;
    },
    update: (id, data) => {
      const db = getDB();
      const idx = (db.processosCriticos || []).findIndex(p => p.id_processo === id);
      if (idx !== -1) {
        db.processosCriticos[idx] = { ...db.processosCriticos[idx], ...data };
        saveDB(db);
      }
      return (db.processosCriticos || [])[idx];
    },
    delete: (id) => {
      const db = getDB();
      db.processosCriticos = db.processosCriticos.filter(p => p.id_processo !== id);
      db.processosCriticosAtivos = (db.processosCriticosAtivos || []).filter(p => p.id_processo !== id);
      db.analiseImpactoNegocio = db.analiseImpactoNegocio.filter(a => a.id_processo !== id);
      db.planosContinuidade = db.planosContinuidade.filter(p => p.id_processo !== id);
      db.planosRecuperacaoDesastres = db.planosRecuperacaoDesastres.filter(p => p.id_processo !== id);
      db.avaliacaoNRGCN = db.avaliacaoNRGCN.filter(a => a.id_processo !== id);
      saveDB(db); return true;
    }
  },

  // INCIDENTES
  incidentes: {
    list: () => {
      const db = getDB();
      return (db.incidentes || []).map(i => ({
        ...i,
        processo: db.processosCriticos.find(p => p.id_processo === i.id_processo),
        pco: i.id_pco_acionado ? db.planosContinuidade.find(p => p.id_pco === i.id_pco_acionado) : null
      }));
    },
    create: (i) => {
      const db = getDB();
      const ain = db.analiseImpactoNegocio.find(a => a.id_processo === i.id_processo);
      const rto_meta = ain ? ain.RTO : null;
      const rto_real = i.rto_real_minutos ? parseInt(i.rto_real_minutos) : null;
      const rto_ultrapassado = rto_real && rto_meta ? rto_real > rto_meta : false;
      const critico = i.impacto === 'Desastroso' || rto_ultrapassado;
      const newI = { ...i, id_incidente: `INC-${Date.now().toString().slice(-4)}`, rto_meta_minutos: rto_meta, rto_ultrapassado, critico, status_incidente: i.status_incidente || 'aberto', criado_em: new Date().toISOString() };
      if (!db.incidentes) db.incidentes = [];
      db.incidentes.push(newI);
      saveDB(db);
      // Gerar notificação automática se crítico
      if (critico) {
        const not = { id_notificacao: `NOT-${Date.now().toString().slice(-5)}`, tipo: 'incidente_critico', titulo: `⚠️ Incidente Crítico — ${newI.id_incidente}`, mensagem: `Incidente crítico registrado no processo ${i.id_processo}. ${rto_ultrapassado ? `RTO ultrapassado: ${rto_real} min (meta: ${rto_meta} min).` : 'Impacto Desastroso detectado.'} Ação imediata necessária.`, id_destino: 'GER-GOV01', prioridade: 'critica', status: 'nao_lida', criado_em: new Date().toISOString(), prazo_acao: new Date(Date.now() + 3600000).toISOString(), link_acao: 'incidentes' };
        if (!db.notificacoes) db.notificacoes = [];
        db.notificacoes.push(not);
        saveDB(db);
      }
      return newI;
    },
    update: (id, data) => {
      const db = getDB();
      const idx = (db.incidentes || []).findIndex(i => i.id_incidente === id);
      if (idx !== -1) { db.incidentes[idx] = { ...db.incidentes[idx], ...data }; saveDB(db); }
      return (db.incidentes || [])[idx];
    },
    delete: (id) => {
      const db = getDB(); db.incidentes = (db.incidentes || []).filter(i => i.id_incidente !== id); saveDB(db); return true;
    }
  },

  // LIÇÕES APRENDIDAS
  licoesAprendidas: {
    list: () => {
      const db = getDB();
      return (db.licoesAprendidas || []).map(l => ({ ...l, incidente: (db.incidentes || []).find(i => i.id_incidente === l.id_incidente) }));
    },
    listForIncidente: (id) => (getDB().licoesAprendidas || []).filter(l => l.id_incidente === id),
    create: (l) => {
      const db = getDB();
      const newL = { ...l, id_licao: `LIC-${Date.now().toString().slice(-4)}`, criado_em: new Date().toISOString() };
      if (!db.licoesAprendidas) db.licoesAprendidas = [];
      db.licoesAprendidas.push(newL); saveDB(db); return newL;
    },
    update: (id, data) => {
      const db = getDB();
      const idx = (db.licoesAprendidas || []).findIndex(l => l.id_licao === id);
      if (idx !== -1) { db.licoesAprendidas[idx] = { ...db.licoesAprendidas[idx], ...data }; saveDB(db); }
      return (db.licoesAprendidas || [])[idx];
    }
  },

  // PLANOS DE AÇÃO
  planosAcao: {
    list: () => getDB().planosAcao || [],
    create: (pa) => {
      const db = getDB();
      const newPA = { ...pa, id_plano_acao: `PA-${Date.now().toString().slice(-4)}`, criado_em: new Date().toISOString(), status: pa.status || 'aberto' };
      if (!db.planosAcao) db.planosAcao = [];
      db.planosAcao.push(newPA); saveDB(db); return newPA;
    },
    update: (id, data) => {
      const db = getDB();
      const idx = (db.planosAcao || []).findIndex(p => p.id_plano_acao === id);
      if (idx !== -1) { db.planosAcao[idx] = { ...db.planosAcao[idx], ...data }; saveDB(db); }
      return (db.planosAcao || [])[idx];
    },
    delete: (id) => {
      const db = getDB(); db.planosAcao = (db.planosAcao || []).filter(p => p.id_plano_acao !== id); saveDB(db); return true;
    }
  },

  // NOTIFICAÇÕES
  notificacoes: {
    list: (id_gerencia) => {
      const db = getDB();
      const notifs = db.notificacoes || [];
      return id_gerencia ? notifs.filter(n => n.id_destino === id_gerencia || n.id_destino === 'ALL') : notifs;
    },
    countNaoLidas: (id_gerencia) => {
      const db = getDB();
      return (db.notificacoes || []).filter(n => n.status === 'nao_lida' && (n.id_destino === id_gerencia || n.id_destino === 'ALL')).length;
    },
    marcarLida: (id) => {
      const db = getDB();
      const idx = (db.notificacoes || []).findIndex(n => n.id_notificacao === id);
      if (idx !== -1) { db.notificacoes[idx].status = 'lida'; saveDB(db); }
    },
    marcarTodasLidas: (id_gerencia) => {
      const db = getDB();
      (db.notificacoes || []).forEach(n => {
        if (n.id_destino === id_gerencia || n.id_destino === 'ALL') n.status = 'lida';
      });
      saveDB(db);
    },
    create: (n) => {
      const db = getDB();
      const newN = { ...n, id_notificacao: `NOT-${Date.now().toString().slice(-5)}`, criado_em: new Date().toISOString(), status: 'nao_lida' };
      if (!db.notificacoes) db.notificacoes = [];
      db.notificacoes.push(newN); saveDB(db); return newN;
    },
    delete: (id) => {
      const db = getDB(); db.notificacoes = (db.notificacoes || []).filter(n => n.id_notificacao !== id); saveDB(db); return true;
    }
  },

  // AIN
  analiseImpactoNegocio: {
    list: () => {
      const db = getDB();
      return db.analiseImpactoNegocio.map(a => ({ ...a, processo: db.processosCriticos.find(p => p.id_processo === a.id_processo) }));
    },
    getForProcesso: (id) => (getDB().analiseImpactoNegocio || []).find(a => a.id_processo === id) || null,
    save: (ain) => {
      const db = getDB();
      const idx = db.analiseImpactoNegocio.findIndex(a => a.id_processo === ain.id_processo);
      if (idx !== -1) { db.analiseImpactoNegocio[idx] = { ...db.analiseImpactoNegocio[idx], ...ain }; }
      else { db.analiseImpactoNegocio.push({ ...ain, id_ain: `AIN-${Date.now().toString().slice(-4)}` }); }
      saveDB(db); return ain;
    }
  },

  // PCO
  planosContinuidade: {
    list: () => {
      const db = getDB();
      return (db.planosContinuidade || []).map(p => {
        let st = p.status_aprovacao;
        if (st === 'Aprovado') st = 'Vigente';
        if (st === 'Pendente' || st === 'Em Revisão' || st === 'Aprovado pela Área') st = 'Pendente GERIC';
        return {
          ...p,
          status_aprovacao: st,
          processo: db.processosCriticos.find(pr => pr.id_processo === p.id_processo)
        };
      });
    },
    getForProcesso: (id) => {
      const p = (getDB().planosContinuidade || []).find(p => p.id_processo === id);
      if (!p) return null;
      let st = p.status_aprovacao;
      if (st === 'Aprovado') st = 'Vigente';
      if (st === 'Pendente' || st === 'Em Revisão' || st === 'Aprovado pela Área') st = 'Pendente GERIC';
      return { ...p, status_aprovacao: st };
    },
    save: (pco) => {
      const db = getDB();
      const idx = db.planosContinuidade.findIndex(p => p.id_processo === pco.id_processo);
      let updatedPco;
      if (idx !== -1) { updatedPco = { ...db.planosContinuidade[idx], ...pco, atualizado_em: new Date().toISOString() }; db.planosContinuidade[idx] = updatedPco; }
      else {
        updatedPco = { ...pco, id_pco: `PCO-${Date.now().toString().slice(-4)}`, status_aprovacao: 'Rascunho', versao: '1.0.0', criado_em: new Date().toISOString(), intervenientes: [], acionamentos: [], workflow_log: [], ans_vigente: null, dispensa_ans: null, parecer_geric: null, parecer_tic: null, parecer_gerente: null, parecer_comite: null, id_gerente_exec_aprovador: null };
        db.planosContinuidade.push(updatedPco);
      }
      saveDB(db); return updatedPco;
    },
    // Registra uma transição no workflow de aprovação do PCO
    transitarWorkflow: (id_pco, novoStatus, aprovador, parecer, camposExtras) => {
      const db = getDB();
      const idx = db.planosContinuidade.findIndex(p => p.id_pco === id_pco);
      if (idx === -1) return null;
      const entrada = { status: novoStatus, aprovador, data: new Date().toISOString(), parecer: parecer || '' };
      if (!db.planosContinuidade[idx].workflow_log) db.planosContinuidade[idx].workflow_log = [];
      db.planosContinuidade[idx].workflow_log.push(entrada);
      db.planosContinuidade[idx].status_aprovacao = novoStatus;
      db.planosContinuidade[idx].atualizado_em = new Date().toISOString();
      if (camposExtras) Object.assign(db.planosContinuidade[idx], camposExtras);
      // Se tornando vigente, registrar data
      if (novoStatus === 'Vigente') {
        const hoje = new Date();
        const anoProximo = new Date(hoje); anoProximo.setFullYear(anoProximo.getFullYear() + 1);
        db.planosContinuidade[idx].data_ultima_revisao = hoje.toISOString().split('T')[0];
        db.planosContinuidade[idx].data_proxima_revisao = anoProximo.toISOString().split('T')[0];
        db.planosContinuidade[idx].vigente_ate = anoProximo.toISOString().split('T')[0];
      }
      saveDB(db);
      return db.planosContinuidade[idx];
    },
    acionar: (id_pco, id_incidente, acionado_por) => {
      const db = getDB();
      const idx = db.planosContinuidade.findIndex(p => p.id_pco === id_pco);
      if (idx !== -1) {
        if (!db.planosContinuidade[idx].acionamentos) db.planosContinuidade[idx].acionamentos = [];
        db.planosContinuidade[idx].acionamentos.push({ data: new Date().toISOString(), id_incidente, acionado_por });
        saveDB(db);
      }
    }
  },

  fornecedoresCriticosTPRM: {
    list: () => getDB().fornecedoresCriticosTPRM || [],
  },

  // PRD
  planosRecuperacaoDesastres: {
    list: () => {
      const db = getDB();
      return db.planosRecuperacaoDesastres.map(p => ({ ...p, processo: db.processosCriticos.find(pr => pr.id_processo === p.id_processo) }));
    },
    getForProcesso: (id) => (getDB().planosRecuperacaoDesastres || []).find(p => p.id_processo === id) || null,
    save: (prd) => {
      const db = getDB();
      const idx = db.planosRecuperacaoDesastres.findIndex(p => p.id_processo === prd.id_processo);
      let updatedPrd;
      if (idx !== -1) { updatedPrd = { ...db.planosRecuperacaoDesastres[idx], ...prd, atualizado_em: new Date().toISOString() }; db.planosRecuperacaoDesastres[idx] = updatedPrd; }
      else { updatedPrd = { ...prd, id_prd: `PRD-${Date.now().toString().slice(-4)}`, status_aprovacao: 'Pendente', versao: '1.0.0', criado_em: new Date().toISOString() }; db.planosRecuperacaoDesastres.push(updatedPrd); }
      saveDB(db); return updatedPrd;
    }
  },

  // TESTES
  testesAvaliacoes: {
    list: () => {
      const db = getDB();
      return (db.testesAvaliacoes || []).map(t => {
        const pco = db.planosContinuidade.find(p => p.id_pco === t.id_pco);
        const prd = db.planosRecuperacaoDesastres.find(p => p.id_prd === t.id_prd);
        return { ...t, pco: pco ? { ...pco, processo: db.processosCriticos.find(pr => pr.id_processo === pco.id_processo) } : null, prd: prd ? { ...prd, processo: db.processosCriticos.find(pr => pr.id_processo === prd.id_processo) } : null };
      });
    },
    create: (t) => {
      const db = getDB();
      const newT = { ...t, id_teste: `TST-${Date.now().toString().slice(-4)}`, criado_em: new Date().toISOString() };
      if (!db.testesAvaliacoes) db.testesAvaliacoes = [];
      db.testesAvaliacoes.push(newT);
      // Se gerou plano de ação
      if (t.gerou_plano_acao && t.descricao_plano_acao) {
        const pa = { id_plano_acao: `PA-${Date.now().toString().slice(-4)}`, origem: 'teste', id_origem: newT.id_teste, descricao: t.descricao_plano_acao, responsavel: t.responsavel_plano || 'A definir', id_gerencia: t.id_gerencia || 'GER-GOV01', prazo: t.prazo_plano, status: 'aberto', criado_em: new Date().toISOString() };
        if (!db.planosAcao) db.planosAcao = [];
        db.planosAcao.push(pa);
        newT.id_plano_acao = pa.id_plano_acao;
      }
      saveDB(db); return newT;
    }
  },

  revisoesAtualizacoes: {
    list: () => {
      const db = getDB();
      return (db.revisoesAtualizacoes || []).map(r => {
        const pco = db.planosContinuidade.find(p => p.id_pco === r.id_pco);
        return { ...r, pco: pco ? { ...pco, processo: db.processosCriticos.find(pr => pr.id_processo === pco.id_processo) } : null };
      });
    },
    create: (r) => {
      const db = getDB();
      const newR = { ...r, id_revisao: `REV-${Date.now().toString().slice(-4)}` };
      if (!db.revisoesAtualizacoes) db.revisoesAtualizacoes = [];
      db.revisoesAtualizacoes.push(newR); saveDB(db); return newR;
    }
  },

  governancaGCN: {
    list: () => {
      const db = getDB();
      return (db.governancaGCN || []).map(g => ({ ...g, processo: db.processosCriticos.find(p => p.id_processo === g.id_processo) }));
    },
    save: (gov) => {
      const db = getDB();
      const idx = (db.governancaGCN || []).findIndex(g => g.id_processo === gov.id_processo);
      let updatedGov;
      if (idx !== -1) { updatedGov = { ...db.governancaGCN[idx], ...gov }; db.governancaGCN[idx] = updatedGov; }
      else { updatedGov = { ...gov, id_governanca: `GOV-${Date.now().toString().slice(-4)}` }; if (!db.governancaGCN) db.governancaGCN = []; db.governancaGCN.push(updatedGov); }
      saveDB(db); return updatedGov;
    }
  },

  avaliacaoNRGCN: {
    list: () => {
      const db = getDB();
      return (db.avaliacaoNRGCN || []).map(a => ({ ...a, processo: db.processosCriticos.find(p => p.id_processo === a.id_processo) }));
    },
    save: (av) => {
      const db = getDB();
      const idx = (db.avaliacaoNRGCN || []).findIndex(a => a.id_processo === av.id_processo);
      let updatedAv;
      if (idx !== -1) { updatedAv = { ...db.avaliacaoNRGCN[idx], ...av }; db.avaliacaoNRGCN[idx] = updatedAv; }
      else { updatedAv = { ...av, id_avaliacao: `EVL-${Date.now().toString().slice(-4)}` }; if (!db.avaliacaoNRGCN) db.avaliacaoNRGCN = []; db.avaliacaoNRGCN.push(updatedAv); }
      saveDB(db); return updatedAv;
    }
  },

  // ANALYTICS para Dashboard Geric
  analytics: {
    getKPIs: (idGerencia = null) => {
      const db = getDB();
      const hoje = new Date();
      let processos = db.processosCriticos || [];
      if (idGerencia) {
        processos = processos.filter(p => p.id_gerencia === idGerencia);
      }
      const processosIds = processos.map(p => p.id_processo);

      const planosPCO = (db.planosContinuidade || []).filter(p => processosIds.includes(p.id_processo));
      const planosRD = (db.planosRecuperacaoDesastres || []).filter(p => processosIds.includes(p.id_processo));
      const incidentes = (db.incidentes || []).filter(p => processosIds.includes(p.id_processo));
      const riscos = (db.riscos || []).filter(p => processosIds.includes(p.id_processo));
      const testes = (db.testesAvaliacoes || []).filter(t => planosPCO.some(pco => pco.id_pco === t.id_pco));
      const planosAcao = (db.planosAcao || []).filter(pa => incidentes.some(inc => inc.id_incidente === pa.id_incidente) || testes.some(t => t.id_plano_acao === pa.id_plano_acao));
      const avaliacoes = (db.avaliacaoNRGCN || []).filter(a => processosIds.includes(a.id_processo));
      const ain = (db.analiseImpactoNegocio || []).filter(a => processosIds.includes(a.id_processo));

      // Processos sem PCO
      const processosSemPCO = processos.filter(p => !planosPCO.find(pco => pco.id_processo === p.id_processo));

      // PCOs Vencidos / Vencendo
      const pcosVencidos = planosPCO.filter(p => p.vigente_ate && new Date(p.vigente_ate) < hoje);
      const pcosVencendo30 = planosPCO.filter(p => {
        if (!p.vigente_ate) return false;
        const diff = (new Date(p.vigente_ate) - hoje) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
      });
      const pcosVencendo60 = planosPCO.filter(p => {
        if (!p.vigente_ate) return false;
        const diff = (new Date(p.vigente_ate) - hoje) / (1000 * 60 * 60 * 24);
        return diff > 30 && diff <= 60;
      });

      // Incidentes
      const incidentesCriticos = incidentes.filter(i => i.critico);
      const incidentesRTOUltrapassado = incidentes.filter(i => i.rto_ultrapassado);
      const incidentesAbertos = incidentes.filter(i => i.status_incidente === 'aberto' || i.status_incidente === 'em_investigacao');

      // Riscos
      const PROB_SCORE = { 'Rara': 1, 'Pouco Provável': 2, 'Provável': 3, 'Muito Provável': 4, 'Quase Certa': 5 };
      const IMP_SCORE = { 'Insignificante': 1, 'Menor': 2, 'Moderado': 3, 'Maior': 4, 'Catastrófico': 5 };
      const riscosAltos = riscos.filter(r => {
        const s = (PROB_SCORE[r.probabilidade_atual || r.probabilidade] || 3) * (IMP_SCORE[r.impacto] || 3);
        return s >= 10;
      });

      // Testes
      const testesComFalha = testes.filter(t => t.resultado === 'Parcial' || (t.cenarios_testados || []).some(c => c.resultado === 'falhou'));
      const testesPendentes = processos.filter(p => !testes.find(t => t.id_pco === planosPCO.find(pco => pco.id_processo === p.id_processo)?.id_pco));

      // Planos de ação em atraso
      const planosAcaoAtrasados = planosAcao.filter(pa => pa.status !== 'concluido' && pa.prazo && new Date(pa.prazo) < hoje);

      // NRGCN Score geral
      const nrgcnScore = avaliacoes.length > 0
        ? (avaliacoes.reduce((acc, a) => acc + Number(a.nivel_resiliencia || 0), 0) / avaliacoes.length).toFixed(2)
        : 0;
      const aderenciaISO = avaliacoes.length > 0
        ? (avaliacoes.reduce((acc, a) => acc + Number(a.aderencia_ISO22301 || 0), 0) / avaliacoes.length).toFixed(1)
        : 0;

      // Processos sem AIN
      const processosSemAIN = processos.filter(p => !ain.find(a => a.id_processo === p.id_processo));

      return {
        totalProcessos: processos.length,
        processosSemPCO: processosSemPCO.length,
        processosSemAIN: processosSemAIN.length,
        totalPCO: planosPCO.length,
        pcosAprovados: planosPCO.filter(p => p.status_aprovacao === 'Aprovado' || p.status_aprovacao === 'Vigente').length,
        pcosPendentes: planosPCO.filter(p => p.status_aprovacao && (p.status_aprovacao.startsWith('Pendente') || p.status_aprovacao === 'Em Elaboração')).length,
        pcosVencidos: pcosVencidos.length,
        pcosVencendo30: pcosVencendo30.length,
        pcosVencendo60: pcosVencendo60.length,
        totalPRD: planosRD.length,
        totalIncidentes: incidentes.length,
        incidentesCriticos: incidentesCriticos.length,
        incidentesRTOUltrapassado: incidentesRTOUltrapassado.length,
        incidentesAbertos: incidentesAbertos.length,
        totalRiscos: riscos.length,
        riscosAltos: riscosAltos.length,
        totalTestes: testes.length,
        testesComFalha: testesComFalha.length,
        testesPendentes: testesPendentes.length,
        planosAcaoAbertos: planosAcao.filter(p => p.status === 'aberto').length,
        planosAcaoAtrasados: planosAcaoAtrasados.length,
        nrgcnScore: parseFloat(nrgcnScore),
        aderenciaISO: parseFloat(aderenciaISO),
        coberturaPCO: processos.length > 0 ? Math.round((planosPCO.length / processos.length) * 100) : 0
      };
    },

    // NRGCN por gerência para gráfico de barras
    getNRGCNporGerencia: (idGerencia = null) => {
      const db = getDB();
      const avaliacoes = db.avaliacaoNRGCN || [];
      const processos = db.processosCriticos || [];
      const gerencias = db.gerencias || [];
      const resultado = {};
      avaliacoes.forEach(av => {
        const proc = processos.find(p => p.id_processo === av.id_processo);
        if (proc && proc.id_gerencia) {
          if (idGerencia && proc.id_gerencia !== idGerencia) return;
          const ger = gerencias.find(g => g.id_gerencia === proc.id_gerencia);
          const sigla = ger ? ger.sigla : proc.id_gerencia;
          if (!resultado[sigla]) resultado[sigla] = { soma: 0, count: 0, aderencia: 0 };
          resultado[sigla].soma += Number(av.nivel_resiliencia || 0);
          resultado[sigla].aderencia += Number(av.aderencia_ISO22301 || 0);
          resultado[sigla].count++;
        }
      });
      return Object.entries(resultado).map(([sigla, v]) => ({
        gerencia: sigla,
        nrgcn: v.count > 0 ? parseFloat((v.soma / v.count).toFixed(2)) : 0,
        aderencia: v.count > 0 ? parseFloat((v.aderencia / v.count).toFixed(1)) : 0
      }));
    },

    // Evolução de incidentes (últimos 6 meses)
    getEvolucaoIncidentes: (idGerencia = null) => {
      const db = getDB();
      let incidentes = db.incidentes || [];
      const processos = db.processosCriticos || [];
      if (idGerencia) {
        const procIds = processos.filter(p => p.id_gerencia === idGerencia).map(p => p.id_processo);
        incidentes = incidentes.filter(inc => procIds.includes(inc.id_processo));
      }
      const meses = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const total = incidentes.filter(inc => inc.data_hora && inc.data_hora.startsWith(mes)).length;
        const criticos = incidentes.filter(inc => inc.data_hora && inc.data_hora.startsWith(mes) && inc.critico).length;
        meses.push({ mes: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), total, criticos });
      }
      return meses;
    }
  },

  calendarioSimuladosAnuais: {
    list: () => {
      const db = getDB();
      return db.calendarioSimuladosAnuais || [];
    },
    create: (sim) => {
      const db = getDB();
      if (!db.calendarioSimuladosAnuais) db.calendarioSimuladosAnuais = [];
      const newSim = { ...sim, id_simulado: `SIM-${Date.now().toString().slice(-4)}`, evidencias: sim.evidencias || [] };
      db.calendarioSimuladosAnuais.push(newSim);
      saveDB(db);
      return newSim;
    },
    update: (id, updates) => {
      const db = getDB();
      const idx = (db.calendarioSimuladosAnuais || []).findIndex(s => s.id_simulado === id);
      if (idx !== -1) {
        db.calendarioSimuladosAnuais[idx] = { ...db.calendarioSimuladosAnuais[idx], ...updates };
        saveDB(db);
        return db.calendarioSimuladosAnuais[idx];
      }
      return null;
    }
  }
};
