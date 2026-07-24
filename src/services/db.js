// ============================================================================
// SERVIÇO DE BANCO DE DADOS (MOCK / LOCALSTORAGE) - PORTÁVEL E EXPANDIDO
// ============================================================================

const INITIAL_DATA = {
  db_version: "2.0",
  diretorias: [

    { id_diretoria: "DIR-001", nome: "Diretoria de Tecnologia e Infraestrutura", sigla: "Dites" },
    { id_diretoria: "DIR-002", nome: "Diretoria de Operações e Negócios", sigla: "Diope" },
    { id_diretoria: "DIR-003", nome: "Diretoria Financeira e Administrativa", sigla: "Diafi" }
  ],
  gerencias: [
    // Ligadas à Dites (TIC)
    { id_gerencia: "GER-TIC01", nome: "Gerência Executiva de Infraestrutura de TI", sigla: "Getic", tipo: "TIC", id_diretoria: "DIR-001" },
    { id_gerencia: "GER-TIC02", nome: "Gerência Executiva de Governança de TI", sigla: "Geati", tipo: "TIC", id_diretoria: "DIR-001" },
    { id_gerencia: "GER-TIC03", nome: "Gerência Executiva de Aplicações Corporativas", sigla: "Geape", tipo: "TIC", id_diretoria: "DIR-001" },
    { id_gerencia: "GER-TIC04", nome: "Gerência Executiva de Cibersegurança", sigla: "Gesec", tipo: "TIC", id_diretoria: "DIR-001" },
    // Ligadas à Diope (Negócios e Governança GCN)
    { id_gerencia: "GER-NEG01", nome: "Gerência Executiva de Canais e Backoffice", sigla: "Gecob", tipo: "Negócios", id_diretoria: "DIR-002" },
    { id_gerencia: "GER-NEG02", nome: "Gerência Executiva de Assistência Técnica", sigla: "Gered", tipo: "Negócios", id_diretoria: "DIR-002" },
    { id_gerencia: "GER-GOV01", nome: "Gerência de Gestão de Riscos e GCN", sigla: "Geric", tipo: "Governança", id_diretoria: "DIR-002" },
    { id_gerencia: "GER-GOV02", nome: "Gerência de Governança Corporativa e Crises", sigla: "Geemp", tipo: "Governança", id_diretoria: "DIR-002" },
    { id_gerencia: "GER-GOV03", nome: "Gerência de Marketing e Comunicação", sigla: "Gemac", tipo: "Governança", id_diretoria: "DIR-002" },
    // Ligadas à Diafi (Áreas de Apoio)
    { id_gerencia: "GER-APO01", nome: "Gerência Executiva de Pessoas e Recursos Humanos", sigla: "Gepes", tipo: "Apoio", id_diretoria: "DIR-003" },
    { id_gerencia: "GER-APO02", nome: "Gerência Executiva de Finanças e Tesouraria", sigla: "Gefic", tipo: "Apoio", id_diretoria: "DIR-003" },
    { id_gerencia: "GER-APO03", nome: "Gerência Executiva de Suprimentos e Contratos", sigla: "Gesuc", tipo: "Apoio", id_diretoria: "DIR-003" },
    { id_gerencia: "GER-APO04", nome: "Gerência Executiva de Administração Predial", sigla: "Gesap", tipo: "Apoio", id_diretoria: "DIR-003" }
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
      id_gerencia: "GER-TIC01" // Getic
    },
    {
      id_contrato: "CON-002",
      nome: "Contrato Embratel - Link de Fibra Dedicado",
      valor_faturamento: 120000.00,
      clausulas_risco: "SLA de conectividade de 99.95%.",
      multas: "Abatimento proporcional e multa contratual de R$ 10.000 por hora.",
      data_inicio: "2024-06-01",
      data_fim: "2026-06-01",
      id_gerencia: "GER-TIC01" // Getic
    },
    {
      id_contrato: "CON-003",
      nome: "Contrato Stone Pagamentos - Gateway",
      valor_faturamento: 890000.00,
      clausulas_risco: "Indisponibilidade afeta vendas em tempo real.",
      multas: "Ressarcimento de perdas comprovadas.",
      data_inicio: "2025-03-01",
      data_fim: "2027-03-01",
      id_gerencia: "GER-NEG01" // Gecob
    },
    {
      id_contrato: "CON-ASTEC",
      nome: "Acúmulo de Contratos de Assistência Técnica (Astec - 13 Contratos)",
      valor_faturamento: 780000.00,
      clausulas_risco: "SLAs de atendimento de campo variando entre 8 e 24 horas por região geográfica.",
      multas: "Redução de repasse de 2% por chamado fora do SLA acordado nas capitais.",
      data_inicio: "2025-01-01",
      data_fim: "2028-01-01",
      id_gerencia: "GER-NEG02" // Gered
    }
  ],
  processosCriticos: [
    {
      id_processo: "PROC-001",
      nome: "Processamento de Pagamentos (Checkouts/Gecob)",
      descricao: "Mapeamento das transações do gateway e fluxos de canais digitais.",
      id_contrato: "CON-003",
      criticidade: "Crítica",
      id_gerencia: "GER-NEG01" // Gecob
    },
    {
      id_processo: "PROC-002",
      nome: "Infraestrutura do Portal de Serviços",
      descricao: "Servidores em nuvem sob gestão técnica de infraestrutura da TI.",
      id_contrato: "CON-001",
      criticidade: "Crítica",
      id_gerencia: "GER-TIC01" // Getic
    },
    {
      id_processo: "PROC-003",
      nome: "Atendimento de Canais e Suporte Técnico",
      descricao: "Links e ferramentas de atendimento utilizados para receber chamados.",
      id_contrato: "CON-002",
      criticidade: "Alta",
      id_gerencia: "GER-NEG01" // Gecob
    },
    {
      id_processo: "PROC-004",
      nome: "Gestão e Apoio: Folha de Pagamento Corporativa",
      descricao: "Mapeamento interno da folha mensal de colaboradores. Processo de apoio (Sem contrato).",
      id_contrato: "", // Sem contrato
      criticidade: "Alta",
      id_gerencia: "GER-APO01" // Gepes
    },
    {
      id_processo: "PROC-005",
      nome: "Gestão Predial, Brigada e Evacuação",
      descricao: "Gerenciamento predial e acionamento de brigadas. Apoio à segurança predial (Sem contrato).",
      id_contrato: "", // Sem contrato
      criticidade: "Média",
      id_gerencia: "GER-APO04" // Gesap
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
      id_processo: "PROC-002",
      medidas_mitigacao: "Redirecionamento para a região backup em sa-east-1.",
      resultado_resposta: "Sistemas restabelecidos em 45 minutos."
    }
  ],
  analiseImpactoNegocio: [
    { id_ain: "AIN-001", id_processo: "PROC-001", probabilidade: "Provável", impacto_financeiro: "Catastrófico", RTO: 15, RPO: 5, MTDCN: 60 },
    { id_ain: "AIN-002", id_processo: "PROC-002", probabilidade: "Pouco Provável", impacto_financeiro: "Catastrófico", RTO: 30, RPO: 15, MTDCN: 120 },
    { id_ain: "AIN-003", id_processo: "PROC-003", probabilidade: "Provável", impacto_financeiro: "Moderado", RTO: 120, RPO: 180, MTDCN: 360 },
    { id_ain: "AIN-004", id_processo: "PROC-004", probabilidade: "Pouco Provável", impacto_financeiro: "Moderado", RTO: 1440, RPO: 1440, MTDCN: 2880 },
    { id_ain: "AIN-005", id_processo: "PROC-005", probabilidade: "Provável", impacto_financeiro: "Menor", RTO: 360, RPO: 1440, MTDCN: 720 }
  ],
  planosContinuidade: [
    {
      id_pco: "PCO-001",
      id_processo: "PROC-001",
      estrategia_recuperacao: "Failover automático para gateway adquirente reserva e processamento assíncrono.",
      responsabilidades: "Equipe técnica da Gecob e SRE executam o failover.",
      recursos_necessarios: "API Reserva, instâncias de contingência.",
      
      // Cenários de Crise do PCO
      cenario_acesso: "Garantir trabalho home office imediato de todos os analistas com VPN corporativa ativa. Liberação de auxílio dados móveis emergencial.",
      cenario_sistemas: "Passo 1: Validar falha de checkout. Passo 2: Mudar chave API de contingência. Passo 3: Contatar fiscal de serviço do contrato no telefone (11) 98888-7777 e formalizar e-mail em fiscal.SLA@stone.com.br.",
      cenario_fornecedores: "Se a adquirente Stone falhar integralmente, migrar tráfego em lote para a adquirente Cielo reserva conforme acordo de contingência.",
      cenario_pessoas: "Em caso de surto/falta de 40% dos analistas, acionar plano de horas extras com equipe de BPO parceira.",
      escalonamento_crise: "Se o tempo de indisponibilidade exceder 15 minutos (RTO), o gerente executivo da Gecob deve escalonar o chamado para o Comitê de Crise e Getic para ativação do PRD.",
      
      status_aprovacao: "Aprovado",
      versao: "1.2.0"
    },
    {
      id_pco: "PCO-005",
      id_processo: "PROC-005",
      estrategia_recuperacao: "Direcionamento imediato da brigada predial e isolamento de áreas de risco.",
      responsabilidades: "Gerente Executivo da Gesap aciona o protocolo de segurança predial física.",
      recursos_necessarios: "Equipamentos de segurança, brigadistas e sinalizadores.",
      
      cenario_acesso: "Evacuação total do edifício sede. Transferência das equipes para escritório de contingência em Alphaville ou home office temporário.",
      cenario_sistemas: "Acionamento manual do alarme predial. Disparo de alertas via WhatsApp institucional para os funcionários do prédio.",
      cenario_fornecedores: "Acionar fornecedor de manutenção predial em até 2 horas conforme SLA para restabelecimento elétrico ou hidráulico.",
      cenario_pessoas: "Em caso de incapacidade predial, escalonar equipe de segurança física substituta.",
      escalonamento_crise: "Escalonamento imediato para a Geric e Diretoria Administrativa (Diafi) se houver riscos à integridade física.",
      
      status_aprovacao: "Aprovado",
      versao: "1.0.0"
    }
  ],
  planosRecuperacaoDesastres: [
    {
      id_prd: "PRD-001",
      id_processo: "PROC-001",
      procedimentos_restauracao: "1. Verificar logs. 2. Restaurar snapshot transacional de 5 minutos do S3.",
      local_backup: "AWS S3 Glacier (eu-west-1)",
      frequencia_backup: "A cada 5 minutos",
      comunicacao_emergencia: "Notificar time SRE via PagerDuty e Slack #incidentes-graves.",
      
      // Procedimento de War Room (ISO 27031)
      procedimento_war_room: "1. Identificar falha prolongada. 2. Criar sala Teams 'War-Room-Crise-01'. 3. Convocar líderes de Getic, Gesec, Geape e o fiscal do contrato da AWS. 4. Manter status page operacional a cada 15 minutos."
    },
    {
      id_prd: "PRD-002",
      id_processo: "PROC-002",
      procedimentos_restauracao: "1. Verificar status geral da AWS. 2. Mudar Cloudflare DNS para contingência em Azure VM.",
      local_backup: "Azure Blob Storage (Geo-redundante)",
      frequencia_backup: "A cada 15 minutos",
      comunicacao_emergencia: "Disparo PagerDuty para DevOps.",
      procedimento_war_room: "1. Acionamento de War Room na sala de crises com a presença da governança de TI (Geati). 2. Notificação da Gesec para análise de ameaças de segurança."
    }
  ],
  testesAvaliacoes: [
    { id_teste: "TST-001", id_pco: "PCO-001", id_prd: "PRD-001", data_teste: "2026-03-10", resultado: "Sucesso", areas_melhoria: "O tempo de failover automático foi de 12 minutos (dentro dos 15 minutos de RTO)." }
  ],
  revisoesAtualizacoes: [
    { id_revisao: "REV-001", id_pco: "PCO-001", id_prd: "PRD-001", data_revisao: "2026-04-15", motivo: "Mudança no gateway reserva", atualizacao_realizada: "Substituição do gateway reserva para Pagar.me." }
  ],
  governancaGCN: [
    { id_governanca: "GOV-001", responsavel: "Roberto Carlos (Geric)", comunicacao: "Comitê trimestral de crises", treinamento: "Simulado semestral", id_processo: "PROC-001" }
  ],
  avaliacaoNRGCN: [
    { id_avaliacao: "EVL-001", id_processo: "PROC-001", nivel_resiliencia: 4.80, aderencia_ISO22301: 96.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-001" },
    { id_avaliacao: "EVL-002", id_processo: "PROC-002", nivel_resiliencia: 4.20, aderencia_ISO22301: 84.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-002" },
    { id_avaliacao: "EVL-003", id_processo: "PROC-003", nivel_resiliencia: 3.50, aderencia_ISO22301: 70.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-003" },
    { id_avaliacao: "EVL-004", id_processo: "PROC-004", nivel_resiliencia: 2.10, aderencia_ISO22301: 42.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-004" },
    { id_avaliacao: "EVL-005", id_processo: "PROC-005", nivel_resiliencia: 3.80, aderencia_ISO22301: 76.00, metricas_utilizadas: "{}", grafico_resultado: "radar_PROC-005" }
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
    if (db.db_version !== "2.0") {
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
