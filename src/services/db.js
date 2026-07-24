// ============================================================================
// SERVIÇO DE BANCO DE DADOS (MOCK / LOCALSTORAGE) - PORTÁVEL E EXPANDIDO
// ============================================================================

const INITIAL_DATA = {
  db_version: "3.0",
  diretorias: [
    { id_diretoria: "DIR-001", nome: "Diretoria de Tecnologia e Infraestrutura", sigla: "Dites" },
    { id_diretoria: "DIR-002", nome: "Diretoria de Operações e Negócios", sigla: "Diope" },
    { id_diretoria: "DIR-003", nome: "Diretoria Financeira e Administrativa", sigla: "Diafi" }
  ],
  gerencias: [
    // === DITES (TIC) - 4 gerências ===
    { id_gerencia: "GER-TIC01", nome: "Gerência Executiva de Infraestrutura de TI", sigla: "Getic", tipo: "TIC", id_diretoria: "DIR-001",
      observacao: "Responsável pelo PRD de TI (ISO 27031) e ativação de War Room. Governa links, data centers e nuvem." },
    { id_gerencia: "GER-TIC02", nome: "Gerência Executiva de Governança de TI", sigla: "Geati", tipo: "TIC", id_diretoria: "DIR-001",
      observacao: "Conduz a estratégia de TI. Governa planejamento e conformidade de TIC." },
    { id_gerencia: "GER-TIC03", nome: "Gerência Executiva de Aplicações Corporativas", sigla: "Geape", tipo: "TIC", id_diretoria: "DIR-001",
      observacao: "Gerencia sistemas de negócios e ERPs corporativos." },
    { id_gerencia: "GER-TIC04", nome: "Gerência Executiva de Cibersegurança", sigla: "Gesec", tipo: "TIC", id_diretoria: "DIR-001",
      observacao: "Gestão de ameaças cibernéticas, DDoS, ransomware e proteção de dados." },

    // === DIOPE (Negócios) - 9 gerências ===
    { id_gerencia: "GER-NEG01", nome: "Gerência Executiva de Canais e Backoffice", sigla: "Gecob", tipo: "Negócios", id_diretoria: "DIR-002",
      observacao: "Opera os canais digitais, CRBB, cobrança extrajudicial e BBmericas. PCO obrigatório por produto." },
    { id_gerencia: "GER-NEG02", nome: "Gerência Executiva de Assistência Técnica em Campo", sigla: "Gered", tipo: "Negócios", id_diretoria: "DIR-002",
      observacao: "Gerencia 13 contratos de campo com a Astec. SLA de 8h (capitais) e 24h (interior). PCO por contrato." },
    { id_gerencia: "GER-NEG03", nome: "Gerência Executiva de Negócios Digitais", sigla: "Gened", tipo: "Negócios", id_diretoria: "DIR-002",
      observacao: "Gerencia produtos e soluções financeiras digitais." },
    { id_gerencia: "GER-NEG04", nome: "Gerência Executiva de Relacionamento com Clientes", sigla: "Gerec", tipo: "Negócios", id_diretoria: "DIR-002",
      observacao: "Responsável pelo CRM e atendimento pós-venda." },
    { id_gerencia: "GER-NEG05", nome: "Gerência Executiva de Operações e Liquidação", sigla: "Geoliq", tipo: "Negócios", id_diretoria: "DIR-002",
      observacao: "Opera a liquidação financeira e conciliação bancária." },
    { id_gerencia: "GER-NEG06", nome: "Gerência Executiva de Negócios Corporativos", sigla: "Gencorp", tipo: "Negócios", id_diretoria: "DIR-002",
      observacao: "Gerencia contratos empresariais e soluções B2B." },
    { id_gerencia: "GER-GOV01", nome: "Gerência de Gestão de Riscos e GCN (2ª Linha)", sigla: "Geric", tipo: "Governança", id_diretoria: "DIR-002",
      observacao: "Segunda linha de defesa. Gestão de todos os PCOs e PRDs. Coordena com Geemp o Comitê de Crise." },
    { id_gerencia: "GER-GOV02", nome: "Gerência de Governança Corporativa e Crises", sigla: "Geemp", tipo: "Governança", id_diretoria: "DIR-002",
      observacao: "Conduz o Comitê de Crise. Elabora o regimento de crises (PGC). Preside atas." },
    { id_gerencia: "GER-GOV03", nome: "Gerência de Marketing e Comunicação Corporativa", sigla: "Gemac", tipo: "Governança", id_diretoria: "DIR-002",
      observacao: "Coordena comunicação interna e externa em crises. Única autorizada a emitir notas à imprensa." },

    // === DIAFI (Apoio) - 8 gerências ===
    { id_gerencia: "GER-APO01", nome: "Gerência Executiva de Pessoas e Recursos Humanos", sigla: "Gepes", tipo: "Apoio", id_diretoria: "DIR-003",
      observacao: "PCO de apoio: SLA interno de 24h para recrutamento emergencial. Sem contrato externo de faturamento." },
    { id_gerencia: "GER-APO02", nome: "Gerência Executiva de Finanças e Tesouraria", sigla: "Gefic", tipo: "Apoio", id_diretoria: "DIR-003",
      observacao: "PCO de apoio: SLA de 4h para liberação de pagamentos emergenciais em crises. Sem contrato externo." },
    { id_gerencia: "GER-APO03", nome: "Gerência Executiva de Suprimentos e Contratos", sigla: "Gesuc", tipo: "Apoio", id_diretoria: "DIR-003",
      observacao: "Gerencia aquisições de emergência e aciona fornecedores alternativos em contingências." },
    { id_gerencia: "GER-APO04", nome: "Gerência Executiva de Administração Predial e Segurança", sigla: "Gesap", tipo: "Apoio", id_diretoria: "DIR-003",
      observacao: "Brigada de incêndio. Evacução predial. Contingência física e acesso ao edifício sede. SLA de 30min para abertura de incidente predial." },
    { id_gerencia: "GER-APO05", nome: "Gerência Executiva de Compliance e Jurídico", sigla: "Gecoj", tipo: "Apoio", id_diretoria: "DIR-003",
      observacao: "Suporte jurídico em crises. SLA interno de 8h para pareceres legais emergenciais." },
    { id_gerencia: "GER-APO06", nome: "Gerência Executiva de Controladoria e Contabilidade", sigla: "Gecont", tipo: "Apoio", id_diretoria: "DIR-003",
      observacao: "Responsável pela integridade contábil durante contingências e crises financeiras." },
    { id_gerencia: "GER-APO07", nome: "Gerência Executiva de Relações Institucionais", sigla: "Gerin", tipo: "Apoio", id_diretoria: "DIR-003",
      observacao: "Interface com órgãos reguladores durante crises. Notifica BACEN e CVM se necessário." },
    { id_gerencia: "GER-APO08", nome: "Gerência Executiva de Saúde e Bem-Estar Corporativo", sigla: "Gesaude", tipo: "Apoio", id_diretoria: "DIR-003",
      observacao: "SLA de 2h para suporte médico e afastamento emergencial de colaboradores." }
  ],
  ativosSistemas: [
    { id_ativo: "ATV-SYS01", nome: "Core Banking e API Transacional", tipo: "Sistema", criticidade: "Crítica" },
    { id_ativo: "ATV-SYS02", nome: "Portal de Atendimento Zendesk", tipo: "Sistema", criticidade: "Alta" },
    { id_ativo: "ATV-LNK01", nome: "Link de Fibra Embratel Dedicado", tipo: "Link", criticidade: "Alta" },
    { id_ativo: "ATV-SRV01", nome: "Cluster Kubernetes AWS us-east-1", tipo: "Servidor", criticidade: "Crítica" },
    { id_ativo: "ATV-SYS03", nome: "Sistema ERP Financeiro SAP", tipo: "Sistema", criticidade: "Média" },
    { id_ativo: "ATV-SYS04", nome: "Portal Corporativo de Recursos Humanos", tipo: "Sistema", criticidade: "Média" }
  ],
  processosCriticosAtivos: [
    { id_processo: "PROC-001", id_ativo: "ATV-SYS01" },
    { id_processo: "PROC-001", id_ativo: "ATV-SRV01" },
    { id_processo: "PROC-002", id_ativo: "ATV-SRV01" },
    { id_processo: "PROC-003", id_ativo: "ATV-LNK01" },
    { id_processo: "PROC-003", id_ativo: "ATV-SYS02" }
  ],
  riscos: [
    { id_risco: "RISK-001", nome: "Indisponibilidade de Nuvem AWS", descricao: "Perda de instâncias por quedas gerais do data center na AWS us-east-1.", probabilidade: "Pouco Provável", impacto: "Catastrófico", id_processo: "PROC-002" },
    { id_risco: "RISK-002", nome: "Corte físico no Link Embratel", descricao: "Rompimento acidental da fibra na via pública primária.", probabilidade: "Provável", impacto: "Moderado", id_processo: "PROC-003" },
    { id_risco: "RISK-003", nome: "Ataque Cibernético e Ransomware", descricao: "Tentativa de sequestro de dados no core transacional.", probabilidade: "Pouco Provável", impacto: "Catastrófico", id_processo: "PROC-001" },
    { id_risco: "RISK-004", nome: "Greve de Transportes ou Bloqueio Predial", descricao: "Impedimento de acesso físico ao edifício central de administração.", probabilidade: "Provável", impacto: "Moderado", id_processo: "PROC-005" }
  ],
  atasComiteCrise: [
    {
      id_ata: "ATA-2026-001",
      data_reuniao: "2026-04-12",
      pauta: "Acionamento do Comitê de Crise devido a Instabilidade Crítica na AWS",
      deliberacoes: "Determinada a ativação da War Room sob liderança da Getic/Gesec. Aprovada a comunicação de contingência interna e externa pela Gemac. Autorizado o chaveamento para servidores reservas.",
      participantes: "Roberto Carlos (Geric), Patrícia Lima (Getic), Arthur Mendes (Geemp), Vanessa Lopes (Gemac)"
    }
  ],
  contratos: [
    {
      id_contrato: "CON-001",
      nome: "Contrato AWS - Hosting e Infraestrutura Cloud",
      valor_faturamento: 450000.00,
      clausulas_risco: "Resolução em menos de 4 horas para instâncias críticas. Multa em caso de indisponibilidade superior a 99.9%.",
      multas: "Multa de 5% do faturamento mensal por hora de indisponibilidade além do SLA.",
      data_inicio: "2025-01-01",
      data_fim: "2027-12-31",
      id_gerencia: "GER-TIC01"
    },
    {
      id_contrato: "CON-002",
      nome: "Contrato Embratel - Link de Fibra Dedicado",
      valor_faturamento: 120000.00,
      clausulas_risco: "SLA de conectividade de 99.95%.",
      multas: "Abatimento proporcional e multa contratual de R$ 10.000 por hora.",
      data_inicio: "2024-06-01",
      data_fim: "2026-06-01",
      id_gerencia: "GER-TIC01"
    },

    // === Contratos Gecob (por produto) ===
    {
      id_contrato: "CON-GECOB-001",
      nome: "PCO Gecob - Produto CRBB (Canal de Recebimentos BB)",
      valor_faturamento: 3200000.00,
      clausulas_risco: "Indisponibilidade do canal de recebimentos impacta liquidação financeira.",
      multas: "Multa de 0,1% ao dia sobre o volume liquidado por dia de interrupção.",
      data_inicio: "2025-01-01",
      data_fim: "2028-12-31",
      id_gerencia: "GER-NEG01"
    },
    {
      id_contrato: "CON-GECOB-002",
      nome: "PCO Gecob - Produto Cobrança Extrajudicial",
      valor_faturamento: 1800000.00,
      clausulas_risco: "Interrupção afeta indexação de carteiras de cobrança e vencimentos.",
      multas: "Penalidade de R$ 50.000 por evento de indisponibilidade superior a 24h.",
      data_inicio: "2025-03-01",
      data_fim: "2028-03-01",
      id_gerencia: "GER-NEG01"
    },
    {
      id_contrato: "CON-GECOB-003",
      nome: "PCO Gecob - Produto BBmericas (Plataforma Internacional)",
      valor_faturamento: 2500000.00,
      clausulas_risco: "Plataforma de câmbio e remessas internacionais. Interrupção viola regulação Bacen.",
      multas: "Penalidade regulatória e multa contratual proporcional ao volume operado.",
      data_inicio: "2025-06-01",
      data_fim: "2027-06-01",
      id_gerencia: "GER-NEG01"
    },

    // === 13 Contratos Astec / Gered ===
    { id_contrato: "CON-ASTEC-01", nome: "Astec #01 - Assistência Técnica Região Norte (AM/PA)", valor_faturamento: 65000.00, clausulas_risco: "SLA de atendimento de 24h para chamados de campo.", multas: "Redução de 2% do repasse por chamado fora do SLA.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-02", nome: "Astec #02 - Assistência Técnica Região Nordeste (BA/CE)", valor_faturamento: 72000.00, clausulas_risco: "SLA de 24h interior e 8h capitais.", multas: "Redução de 2% do repasse por chamado fora do SLA.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-03", nome: "Astec #03 - Assistência Técnica Região Centro-Oeste (GO/MT)", valor_faturamento: 58000.00, clausulas_risco: "SLA de 24h.", multas: "Redução de 2%.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-04", nome: "Astec #04 - Assistência Técnica SP Capital", valor_faturamento: 95000.00, clausulas_risco: "SLA de 4h para capitais.", multas: "Redução de 3% por chamado fora do SLA.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-05", nome: "Astec #05 - Assistência Técnica SP Interior", valor_faturamento: 63000.00, clausulas_risco: "SLA de 24h interior.", multas: "Redução de 2%.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-06", nome: "Astec #06 - Assistência Técnica RJ e ES", valor_faturamento: 78000.00, clausulas_risco: "SLA de 8h capitais / 24h interior.", multas: "Redução de 2%.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-07", nome: "Astec #07 - Assistência Técnica MG e DF", valor_faturamento: 82000.00, clausulas_risco: "SLA de 8h capitais / 24h interior.", multas: "Redução de 2%.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-08", nome: "Astec #08 - Assistência Técnica Sul (RS/SC/PR)", valor_faturamento: 88000.00, clausulas_risco: "SLA de 8h capitais / 24h interior.", multas: "Redução de 2%.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-09", nome: "Astec #09 - Manutenção Preventiva de ATMs Nacional", valor_faturamento: 110000.00, clausulas_risco: "Manutenção preventiva mensal de cada terminal.", multas: "Redução de 5% do repasse por terminal não visitado no mês.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-10", nome: "Astec #10 - Suporte Técnico On-site TEC-4 Agências Norte", valor_faturamento: 42000.00, clausulas_risco: "SLA de 24h.", multas: "Redução de 2%.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-11", nome: "Astec #11 - Suporte Técnico On-site TEC-4 Agências Nordeste", valor_faturamento: 45000.00, clausulas_risco: "SLA de 24h.", multas: "Redução de 2%.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-12", nome: "Astec #12 - Serviços de Logística e Troca de Peças Nacional", valor_faturamento: 52000.00, clausulas_risco: "Entrega de peças em até 48h.", multas: "Redução de 1% por entrega fora do prazo.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" },
    { id_contrato: "CON-ASTEC-13", nome: "Astec #13 - Instalação e Configuração de Novos ATMs", valor_faturamento: 38000.00, clausulas_risco: "Prazo de instalação de 5 dias úteis.", multas: "Redução de 1% por dia de atraso.", data_inicio: "2025-01-01", data_fim: "2028-01-01", id_gerencia: "GER-NEG02" }
  ],

  processosCriticos: [
    // === Gecob - PCO por Produto ===
    {
      id_processo: "PROC-COB-001",
      nome: "Canal de Recebimentos BB (CRBB)",
      descricao: "Opera o canal de liquidação e recebimento integrado com o Banco do Brasil.",
      id_contrato: "CON-GECOB-001",
      criticidade: "Crítica",
      id_gerencia: "GER-NEG01"
    },
    {
      id_processo: "PROC-COB-002",
      nome: "Cobrança Extrajudicial de Carteiras",
      descricao: "Indexação, gestão de vencimentos e cobrança automatizada de carteiras extrajudiciais.",
      id_contrato: "CON-GECOB-002",
      criticidade: "Alta",
      id_gerencia: "GER-NEG01"
    },
    {
      id_processo: "PROC-COB-003",
      nome: "BBmericas - Plataforma Internacional de Câmbio",
      descricao: "Remessas internacionais e operações de câmbio sujeitas à regulação Bacen.",
      id_contrato: "CON-GECOB-003",
      criticidade: "Crítica",
      id_gerencia: "GER-NEG01"
    },
    // === Gered - Campo e Astec ===
    {
      id_processo: "PROC-GER-001",
      nome: "Assistência Técnica em Campo - Contratos Astec (13 contratos)",
      descricao: "Gestão de atendimentos técnicos de campo com SLA de 8h (capitais) e 24h (interior).",
      id_contrato: "CON-ASTEC-01",
      criticidade: "Alta",
      id_gerencia: "GER-NEG02"
    },
    // === Getic - TI ===
    {
      id_processo: "PROC-TIC-001",
      nome: "Infraestrutura de Nuvem e Data Center",
      descricao: "Servidores e clusters em nuvem AWS sob gestão da Getic. PRD de TI (ISO 27031).",
      id_contrato: "CON-001",
      criticidade: "Crítica",
      id_gerencia: "GER-TIC01"
    },
    {
      id_processo: "PROC-TIC-002",
      nome: "Links de Conectividade WAN e Internet",
      descricao: "Links dedicados Embratel e redundâncias. SLA de 99.95%.",
      id_contrato: "CON-002",
      criticidade: "Alta",
      id_gerencia: "GER-TIC01"
    },
    // === Áreas de Apoio Diafi (sem faturamento externo - SLAs internos) ===
    {
      id_processo: "PROC-APO-001",
      nome: "Folha de Pagamento Corporativa (Gepes)",
      descricao: "[APOIO/DIAFI] Processamento interno de folha. SLA interno: fechamento até dia 25. Sem contrato com cliente externo.",
      id_contrato: "",
      criticidade: "Alta",
      id_gerencia: "GER-APO01",
      sla_interno: "Fechamento da folha até o dia 25 de cada mês. Em crise: processamento emergencial em 48h.",
      tipo_plano: "PCO-APOIO"
    },
    {
      id_processo: "PROC-APO-002",
      nome: "Liberação de Pagamentos Emergenciais (Gefic)",
      descricao: "[APOIO/DIAFI] Liberação de pagamentos urgentes em contingências. SLA interno de 4h. Sem contrato externo.",
      id_contrato: "",
      criticidade: "Alta",
      id_gerencia: "GER-APO02",
      sla_interno: "SLA interno: Liberação de pagamentos em até 4h da solicitação aprovada em crise.",
      tipo_plano: "PCO-APOIO"
    },
    {
      id_processo: "PROC-APO-003",
      nome: "Aquisições e Suprimentos de Emergência (Gesuc)",
      descricao: "[APOIO/DIAFI] Compras emergenciais durante contingências. SLA: aprovação e pedido em 24h. Sem contrato externo.",
      id_contrato: "",
      criticidade: "Média",
      id_gerencia: "GER-APO03",
      sla_interno: "SLA interno: Aprovação e emissão de pedido em até 24h. Entrega conforme fornecedor acionado.",
      tipo_plano: "PCO-APOIO"
    },
    {
      id_processo: "PROC-APO-004",
      nome: "Evacuação Predial e Brigada de Incêndio (Gesap)",
      descricao: "[APOIO/DIAFI] Plano de evacuação de emergência, acionamento da brigada de incêndio e gestão do edifício sede. Sem contrato externo.",
      id_contrato: "",
      criticidade: "Alta",
      id_gerencia: "GER-APO04",
      sla_interno: "SLA Brigada: Tempo de resposta até 5 minutos. Evacuação total concluída em até 15 minutos. Abertura de ocorrência predial: 30 minutos.",
      tipo_plano: "PCO-APOIO"
    }
  ],
  incidentes: [
    {
      id_incidente: "INC-101",
      data_hora: "2026-04-12T14:30:00",
      local: "Data Center AWS",
      descricao: "Indisponibilidade devido a uma instabilidade no provedor de nuvem AWS.",
      tipo_incidente: "Falha de Infraestrutura Nuvem",
      impacto: "Alto",
      id_processo: "PROC-TIC-001",
      medidas_mitigacao: "Redirecionamento para a região backup em sa-east-1.",
      resultado_resposta: "Sistemas restabelecidos em 45 minutos."
    },
    {
      id_incidente: "INC-102",
      data_hora: "2026-02-08T09:15:00",
      local: "Edifício Sede - 3º Andar",
      descricao: "Princípio de incêndio em sala de servidores locais causado por curto-circuito.",
      tipo_incidente: "Incidente Predial / Incêndio",
      impacto: "Alto",
      id_processo: "PROC-APO-004",
      medidas_mitigacao: "Acionamento imediato da brigada de incêndio. Evacuação do 3º e 4º andares. Extinção em 12 minutos.",
      resultado_resposta: "Área liberada em 2 horas. Nenhum ferido. Servidores locais danificados transferidos para nuvem."
    },
    {
      id_incidente: "INC-103",
      data_hora: "2026-05-20T16:45:00",
      local: "Sistema CRBB",
      descricao: "Interrupção no canal de recebimentos BB por atualização não homologada.",
      tipo_incidente: "Falha de Sistema Crítico",
      impacto: "Desastroso",
      id_processo: "PROC-COB-001",
      medidas_mitigacao: "Rollback da versão. Notificação imediata ao fiscal do contrato Gecob.",
      resultado_resposta: "Serviço normalizado em 38 minutos. Acionamento da cláusula de SLA."
    }
  ],
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
  planosContinuidade: [
    {
      id_pco: "PCO-COB-001",
      id_processo: "PROC-COB-001",
      estrategia_recuperacao: "Failover automático para gateway adquirente reserva. Transações pendentes enfileiradas em Redis para reprocessamento.",
      responsabilidades: "SRE da Gecob e equipe de TI (Getic) executam o failover.",
      recursos_necessarios: "Gateway reserva, instâncias EC2 de contingência, Redis.",
      cenario_acesso: "Home office imediato para todos os analistas da Gecob. VPN e tokens MFA obrigatórios ativos.",
      cenario_sistemas: "Passo 1: Detectar falha via alertas PagerDuty. Passo 2: Mudar chave API do gateway. Passo 3: Contatar fiscal CRBB: fiscal.crbb@bb.com.br / (61) 3333-1234. Passo 4: Comunicar cliente via status page.",
      cenario_fornecedores: "Em caso de falha total do CRBB, ativar processamento manual com equipe de backoffice até normalização.",
      cenario_pessoas: "Em caso de falta de 30%+ da equipe, acionar BPO parceiro para reforço de analistas de canais.",
      escalonamento_crise: "Se indisponibilidade exceder 15 min (RTO), o Gerente da Gecob escala para Comitê de Crise e Geric. Ata obrigatória.",
      status_aprovacao: "Aprovado",
      versao: "2.1.0"
    },
    {
      id_pco: "PCO-COB-002",
      id_processo: "PROC-COB-002",
      estrategia_recuperacao: "Suspensão temporária de novos protestos. Processamento manual das carteiras prioritárias.",
      responsabilidades: "Analistas sêniores de cobrança da Gecob gerenciam a fila manual.",
      recursos_necessarios: "Planilhas de contingência, acesso off-line às carteiras.",
      cenario_acesso: "Home office com acesso a planilhas compartilhadas no SharePoint.",
      cenario_sistemas: "Passo 1: Isolar a fila de cobrança. Passo 2: Contatar fiscal: fiscal.cobranca@gecob.com.br. Passo 3: Exportar carteiras ativas para planilha contingência.",
      cenario_fornecedores: "Não há dependência de fornecedor externo crítico. Contingência interna.",
      cenario_pessoas: "Redistribuição da fila entre analistas disponíveis.",
      escalonamento_crise: "Se indisponibilidade exceder 2h, escalar para Gerente da Gecob e Geric.",
      status_aprovacao: "Pendente",
      versao: "1.0.0"
    },
    {
      id_pco: "PCO-COB-003",
      id_processo: "PROC-COB-003",
      estrategia_recuperacao: "Suspensão de novas operações de câmbio. Notificação ao BACEN conforme Circular 3.691.",
      responsabilidades: "Gerente da Gecob notifica BACEN e aciona equipe jurídica (Gecoj).",
      recursos_necessarios: "Canal seguro BACEN, suporte jurídico emergencial Gecoj.",
      cenario_acesso: "Home office com VPN e autenticação dupla. Acesso restrito a analistas certificados BACEN.",
      cenario_sistemas: "Passo 1: Suspender operações. Passo 2: Notificar BACEN via portal regulatório em até 30min. Passo 3: Contatar fiscal regulatório: regulatorio@gecob.com.br.",
      cenario_fornecedores: "Migração temporária para câmbio manual via banco correspondente.",
      cenario_pessoas: "Equipe mínima de 2 analistas certificados BACEN para operação de contingência.",
      escalonamento_crise: "Qualquer interrupção > 30min é crise regulatória. Acionamento imediato de Geemp + Geric + Gerin.",
      status_aprovacao: "Pendente",
      versao: "1.0.0"
    },
    {
      id_pco: "PCO-GER-001",
      id_processo: "PROC-GER-001",
      estrategia_recuperacao: "Redistribuição geográfica dos chamados entre técnicos parceiros de região adjacente.",
      responsabilidades: "Coordenador de campo da Gered gerencia a redistribuição. Fiscal do contrato Astec é notificado.",
      recursos_necessarios: "Lista de técnicos reservas por região, veículo de contingência.",
      cenario_acesso: "Trabalho de campo não depende de escritório central. Técnicos operam remotamente.",
      cenario_sistemas: "Passo 1: Abrir chamado de contingência no sistema. Passo 2: Contatar fiscal Astec regional: fiscal.astec@gered.com.br / 0800-111-2233. Passo 3: Redistribuir chamados.",
      cenario_fornecedores: "Astec é fornecedor único em algumas regiões. Política: Em renovações de licitação, distribuir contratos entre 2+ fornecedores por região.",
      cenario_pessoas: "Em caso de afastamento de técnicos, acionar lista de técnicos reservas cadastrados.",
      escalonamento_crise: "SLA descumprido por > 3 chamados consecutivos = acionamento do Gerente Gered e Gesuc.",
      status_aprovacao: "Aprovado",
      versao: "1.0.0"
    },
    {
      id_pco: "PCO-APO-004",
      id_processo: "PROC-APO-004",
      estrategia_recuperacao: "Evacuação imediata do edifício e ativação da brigada de incêndio. Transferência para escritório secundário ou home office.",
      responsabilidades: "Brigadista líder coordena evacuação. Gerente Gesap aciona CBMERJ e comunica Geric.",
      recursos_necessarios: "Extintores, mangueiras, rotas de fuga sinalizadas, lista de brigadistas ativos.",
      cenario_acesso: "Evacuação obrigatória de todos os andares. Muster point: Estacionamento Bloco B. Home office ativado automaticamente.",
      cenario_sistemas: "Passo 1: Acionar alarme predial. Passo 2: Ligar para Bombeiros (193). Passo 3: Acionar WhatsApp da Brigada. Passo 4: Disparar alerta para todos os colaboradores via sistema corporativo.",
      cenario_fornecedores: "Acionar fornecedor de manutenção predial (SLA 2h) para inspeção e liberação do edifício.",
      cenario_pessoas: "Verificar lista de presença nos muster points. Comunicar Gepes sobre afastamentos médicos de emergência.",
      escalonamento_crise: "Qualquer incidente com vítimas ou dano estrutural = acionamento imediato do Comitê de Crise (Geemp + Geric + Gemac).",
      status_aprovacao: "Aprovado",
      versao: "1.3.0"
    }
  ],

  planosRecuperacaoDesastres: [
    {
      id_prd: "PRD-TIC-001",
      id_processo: "PROC-TIC-001",
      procedimentos_restauracao: "1. Verificar logs CloudWatch. 2. Restaurar snapshot transacional do S3 (RPO = 15 min). 3. Ativar cluster de contingência em sa-east-1.",
      local_backup: "AWS S3 Glacier (sa-east-1 + eu-west-1)",
      frequencia_backup: "A cada 15 minutos",
      comunicacao_emergencia: "Notificar time SRE via PagerDuty e Slack #incidentes-graves. E-mail automático para Getic e Gesec.",
      procedimento_war_room: "1. Identificar falha prolongada (> 30 min). 2. Criar sala Teams 'War-Room-Crise-Infra'. 3. Convocar: Gerente Getic, Gesec, Geape e fiscal AWS. 4. Status page atualizada a cada 15 min. 5. Gemac emite boletim externo a cada 30 min."
    },
    {
      id_prd: "PRD-TIC-002",
      id_processo: "PROC-COB-001",
      procedimentos_restauracao: "1. Verificar logs da API do gateway. 2. Ativar API de contingência. 3. Reprocessar transações enfileiradas no Redis.",
      local_backup: "AWS S3 (us-east-1) - Snapshots de filas Redis",
      frequencia_backup: "A cada 5 minutos",
      comunicacao_emergencia: "Notificar SRE Gecob via PagerDuty. Canal Slack #incidentes-checkout.",
      procedimento_war_room: "1. Falha > 15 min: Criar War Room Teams 'War-Room-CRBB'. 2. Convocar Gecob, Getic e fiscal CRBB. 3. Acionamento de Geemp se SLA contratual ultrapassado."
    }
  ],
  testesAvaliacoes: [
    { id_teste: "TST-001", id_pco: "PCO-COB-001", id_prd: "PRD-TIC-002", data_teste: "2026-03-10", resultado: "Sucesso", areas_melhoria: "Failover do CRBB concluído em 12 min (RTO = 15 min). Melhoria: automatizar notificação ao fiscal." },
    { id_teste: "TST-002", id_pco: "PCO-APO-004", id_prd: null, data_teste: "2026-06-01", resultado: "Sucesso", areas_melhoria: "Simulação de incêndio: evacuação em 13 min. Meta: reduzir para 10 min. Atualizar lista de brigadistas." }
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
    { id_avaliacao: "EVL-001", id_processo: "PROC-COB-001", nivel_resiliencia: 4.80, aderencia_ISO22301: 96.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-COB-001" },
    { id_avaliacao: "EVL-002", id_processo: "PROC-COB-002", nivel_resiliencia: 2.50, aderencia_ISO22301: 50.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-COB-002" },
    { id_avaliacao: "EVL-003", id_processo: "PROC-COB-003", nivel_resiliencia: 3.20, aderencia_ISO22301: 64.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-COB-003" },
    { id_avaliacao: "EVL-004", id_processo: "PROC-GER-001", nivel_resiliencia: 3.00, aderencia_ISO22301: 60.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-GER-001" },
    { id_avaliacao: "EVL-005", id_processo: "PROC-TIC-001", nivel_resiliencia: 4.20, aderencia_ISO22301: 84.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-TIC-001" },
    { id_avaliacao: "EVL-006", id_processo: "PROC-APO-001", nivel_resiliencia: 2.10, aderencia_ISO22301: 42.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-APO-001" },
    { id_avaliacao: "EVL-007", id_processo: "PROC-APO-004", nivel_resiliencia: 3.80, aderencia_ISO22301: 76.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-APO-004" }
  ]
};


const getDB = () => {
  const dbStr = localStorage.getItem("gcn_database");
  if (!dbStr) {
    localStorage.setItem("gcn_database", JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  try {
    const db = JSON.parse(dbStr);
    // Se a versão for diferente de 3.0, reseta os dados para o novo schema
    if (db.db_version !== "3.0") {
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

export const dbService = {
  reset() {
    saveDB(INITIAL_DATA);
    return INITIAL_DATA;
  },

  diretorias: {
    list: () => getDB().diretorias,
    create: (d) => {
      const db = getDB();
      const newD = { ...d, id_diretoria: d.id_diretoria || `DIR-${Date.now().toString().slice(-3)}` };
      db.diretorias.push(newD);
      saveDB(db);
      return newD;
    }
  },

  gerencias: {
    list: () => {
      const db = getDB();
      return db.gerencias.map(g => ({
        ...g,
        diretoria: db.diretorias.find(d => d.id_diretoria === g.id_diretoria)
      }));
    },
    create: (g) => {
      const db = getDB();
      const newG = { ...g, id_gerencia: g.id_gerencia || `GER-${g.sigla.toUpperCase()}` };
      db.gerencias.push(newG);
      saveDB(db);
      return newG;
    }
  },

  ativosSistemas: {
    list: () => getDB().ativosSistemas,
    create: (a) => {
      const db = getDB();
      const newA = { ...a, id_ativo: a.id_ativo || `ATV-${Date.now().toString().slice(-3)}` };
      db.ativosSistemas.push(newA);
      saveDB(db);
      return newA;
    }
  },

  riscos: {
    list: () => {
      const db = getDB();
      return db.riscos.map(r => ({
        ...r,
        processo: db.processosCriticos.find(p => p.id_processo === r.id_processo)
      }));
    },
    create: (r) => {
      const db = getDB();
      const newR = { ...r, id_risco: r.id_risco || `RISK-${Date.now().toString().slice(-3)}` };
      db.riscos.push(newR);
      saveDB(db);
      return newR;
    },
    delete: (id) => {
      const db = getDB();
      db.riscos = db.riscos.filter(r => r.id_risco !== id);
      saveDB(db);
      return true;
    }
  },

  atasComiteCrise: {
    list: () => getDB().atasComiteCrise,
    create: (a) => {
      const db = getDB();
      const newA = { ...a, id_ata: a.id_ata || `ATA-${Date.now().toString().slice(-3)}` };
      db.atasComiteCrise.push(newA);
      saveDB(db);
      return newA;
    }
  },

  contratos: {
    list: () => {
      const db = getDB();
      return db.contratos.map(c => ({
        ...c,
        gerencia: db.gerencias.find(g => g.id_gerencia === c.id_gerencia)
      }));
    },
    create: (c) => {
      const db = getDB();
      const newC = { ...c, id_contrato: c.id_contrato || `CON-${Date.now().toString().slice(-3)}` };
      db.contratos.push(newC);
      saveDB(db);
      return newC;
    },
    delete: (id) => {
      const db = getDB();
      db.contratos = db.contratos.filter(c => c.id_contrato !== id);
      saveDB(db);
      return true;
    }
  },

  processosCriticos: {
    list: () => {
      const db = getDB();
      return db.processosCriticos.map(p => ({
        ...p,
        contrato: db.contratos.find(c => c.id_contrato === p.id_contrato),
        gerencia: db.gerencias.find(g => g.id_gerencia === p.id_gerencia),
        ativos: db.processosCriticosAtivos
          .filter(pca => pca.id_processo === p.id_processo)
          .map(pca => db.ativosSistemas.find(a => a.id_ativo === pca.id_ativo))
          .filter(Boolean)
      }));
    },
    get: (id) => {
      const db = getDB();
      const p = db.processosCriticos.find(x => x.id_processo === id);
      if (!p) return null;
      return {
        ...p,
        contrato: db.contratos.find(c => c.id_contrato === p.id_contrato),
        gerencia: db.gerencias.find(g => g.id_gerencia === p.id_gerencia),
        ativos: db.processosCriticosAtivos
          .filter(pca => pca.id_processo === p.id_processo)
          .map(pca => db.ativosSistemas.find(a => a.id_ativo === pca.id_ativo))
          .filter(Boolean)
      };
    },
    create: (p) => {
      const db = getDB();
      const newP = { ...p, id_processo: p.id_processo || `PROC-${Date.now().toString().slice(-3)}` };
      db.processosCriticos.push(newP);
      
      // Vincula ativos
      if (p.ativosIds && Array.isArray(p.ativosIds)) {
        p.ativosIds.forEach(ativoId => {
          db.processosCriticosAtivos.push({ id_processo: newP.id_processo, id_ativo: ativoId });
        });
      }

      saveDB(db);
      return newP;
    },
    delete: (id) => {
      const db = getDB();
      db.processosCriticos = db.processosCriticos.filter(p => p.id_processo !== id);
      db.processosCriticosAtivos = db.processosCriticosAtivos.filter(p => p.id_processo !== id);
      db.analiseImpactoNegocio = db.analiseImpactoNegocio.filter(a => a.id_processo !== id);
      db.planosContinuidade = db.planosContinuidade.filter(p => p.id_processo !== id);
      db.planosRecuperacaoDesastres = db.planosRecuperacaoDesastres.filter(p => p.id_processo !== id);
      db.avaliacaoNRGCN = db.avaliacaoNRGCN.filter(a => a.id_processo !== id);
      saveDB(db);
      return true;
    }
  },

  incidentes: {
    list: () => {
      const db = getDB();
      return db.incidentes.map(i => ({
        ...i,
        processo: db.processosCriticos.find(p => p.id_processo === i.id_processo)
      }));
    },
    create: (i) => {
      const db = getDB();
      const newI = { ...i, id_incidente: i.id_incidente || `INC-${Date.now().toString().slice(-3)}` };
      db.incidentes.push(newI);
      saveDB(db);
      return newI;
    },
    delete: (id) => {
      const db = getDB();
      db.incidentes = db.incidentes.filter(i => i.id_incidente !== id);
      saveDB(db);
      return true;
    }
  },

  analiseImpactoNegocio: {
    list: () => {
      const db = getDB();
      return db.analiseImpactoNegocio.map(a => ({
        ...a,
        processo: db.processosCriticos.find(p => p.id_processo === a.id_processo)
      }));
    },
    getForProcesso: (id_processo) => {
      const db = getDB();
      return db.analiseImpactoNegocio.find(a => a.id_processo === id_processo) || null;
    },
    save: (ain) => {
      const db = getDB();
      const index = db.analiseImpactoNegocio.findIndex(a => a.id_processo === ain.id_processo);
      if (index !== -1) {
        db.analiseImpactoNegocio[index] = { ...db.analiseImpactoNegocio[index], ...ain };
      } else {
        db.analiseImpactoNegocio.push({
          ...ain,
          id_ain: ain.id_ain || `AIN-${Date.now().toString().slice(-3)}`
        });
      }
      saveDB(db);
      return ain;
    }
  },

  planosContinuidade: {
    list: () => {
      const db = getDB();
      return db.planosContinuidade.map(p => ({
        ...p,
        processo: db.processosCriticos.find(pr => pr.id_processo === p.id_processo)
      }));
    },
    getForProcesso: (id_processo) => {
      const db = getDB();
      return db.planosContinuidade.find(p => p.id_processo === id_processo) || null;
    },
    save: (pco) => {
      const db = getDB();
      const index = db.planosContinuidade.findIndex(p => p.id_processo === pco.id_processo);
      let updatedPco;
      if (index !== -1) {
        updatedPco = { ...db.planosContinuidade[index], ...pco, atualizado_em: new Date().toISOString() };
        db.planosContinuidade[index] = updatedPco;
      } else {
        updatedPco = {
          ...pco,
          id_pco: pco.id_pco || `PCO-${Date.now().toString().slice(-3)}`,
          status_aprovacao: pco.status_aprovacao || "Pendente",
          versao: pco.versao || "1.0.0",
          criado_em: new Date().toISOString()
        };
        db.planosContinuidade.push(updatedPco);
      }
      saveDB(db);
      return updatedPco;
    }
  },

  planosRecuperacaoDesastres: {
    list: () => {
      const db = getDB();
      return db.planosRecuperacaoDesastres.map(p => ({
        ...p,
        processo: db.processosCriticos.find(pr => pr.id_processo === p.id_processo)
      }));
    },
    getForProcesso: (id_processo) => {
      const db = getDB();
      return db.planosRecuperacaoDesastres.find(p => p.id_processo === id_processo) || null;
    },
    save: (prd) => {
      const db = getDB();
      const index = db.planosRecuperacaoDesastres.findIndex(p => p.id_processo === prd.id_processo);
      let updatedPrd;
      if (index !== -1) {
        updatedPrd = { ...db.planosRecuperacaoDesastres[index], ...prd, atualizado_em: new Date().toISOString() };
        db.planosRecuperacaoDesastres[index] = updatedPrd;
      } else {
        updatedPrd = {
          ...prd,
          id_prd: prd.id_prd || `PRD-${Date.now().toString().slice(-3)}`,
          status_aprovacao: prd.status_aprovacao || "Pendente",
          versao: prd.versao || "1.0.0",
          criado_em: new Date().toISOString()
        };
        db.planosRecuperacaoDesastres.push(updatedPrd);
      }
      saveDB(db);
      return updatedPrd;
    }
  },

  testesAvaliacoes: {
    list: () => {
      const db = getDB();
      return db.testesAvaliacoes.map(t => {
        const pco = db.planosContinuidade.find(p => p.id_pco === t.id_pco);
        const prd = db.planosRecuperacaoDesastres.find(p => p.id_prd === t.id_prd);
        return {
          ...t,
          pco: pco ? { ...pco, processo: db.processosCriticos.find(pr => pr.id_processo === pco.id_processo) } : null,
          prd: prd ? { ...prd, processo: db.processosCriticos.find(pr => pr.id_processo === prd.id_processo) } : null
        };
      });
    },
    create: (teste) => {
      const db = getDB();
      const newTeste = { ...teste, id_teste: teste.id_teste || `TST-${Date.now().toString().slice(-3)}` };
      db.testesAvaliacoes.push(newTeste);
      saveDB(db);
      return newTeste;
    }
  },

  revisoesAtualizacoes: {
    list: () => {
      const db = getDB();
      return db.revisoesAtualizacoes.map(r => {
        const pco = db.planosContinuidade.find(p => p.id_pco === r.id_pco);
        const prd = db.planosRecuperacaoDesastres.find(p => p.id_prd === r.id_prd);
        return {
          ...r,
          pco: pco ? { ...pco, processo: db.processosCriticos.find(pr => pr.id_processo === pco.id_processo) } : null,
          prd: prd ? { ...prd, processo: db.processosCriticos.find(pr => pr.id_processo === prd.id_processo) } : null
        };
      });
    },
    create: (revisao) => {
      const db = getDB();
      const newRevisao = { ...revisao, id_revisao: revisao.id_revisao || `REV-${Date.now().toString().slice(-3)}` };
      db.revisoesAtualizacoes.push(newRevisao);
      saveDB(db);
      return newRevisao;
    }
  },

  governancaGCN: {
    list: () => {
      const db = getDB();
      return db.governancaGCN.map(g => ({
        ...g,
        processo: db.processosCriticos.find(p => p.id_processo === g.id_processo)
      }));
    },
    save: (gov) => {
      const db = getDB();
      const index = db.governancaGCN.findIndex(g => g.id_processo === gov.id_processo);
      let updatedGov;
      if (index !== -1) {
        updatedGov = { ...db.governancaGCN[index], ...gov };
        db.governancaGCN[index] = updatedGov;
      } else {
        updatedGov = { ...gov, id_governanca: gov.id_governanca || `GOV-${Date.now().toString().slice(-3)}` };
        db.governancaGCN.push(updatedGov);
      }
      saveDB(db);
      return updatedGov;
    }
  },

  avaliacaoNRGCN: {
    list: () => {
      const db = getDB();
      return db.avaliacaoNRGCN.map(a => ({
        ...a,
        processo: db.processosCriticos.find(p => p.id_processo === a.id_processo)
      }));
    },
    save: (av) => {
      const db = getDB();
      const index = db.avaliacaoNRGCN.findIndex(a => a.id_processo === av.id_processo);
      let updatedAv;
      if (index !== -1) {
        updatedAv = { ...db.avaliacaoNRGCN[index], ...av };
        db.avaliacaoNRGCN[index] = updatedAv;
      } else {
        updatedAv = { ...av, id_avaliacao: av.id_avaliacao || `EVL-${Date.now().toString().slice(-3)}` };
        db.avaliacaoNRGCN.push(updatedAv);
      }
      saveDB(db);
      return updatedAv;
    }
  }
};
