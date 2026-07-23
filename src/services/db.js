// ============================================================================
// SERVIÇO DE BANCO DE DADOS (MOCK / LOCALSTORAGE) - PORTÁVEL PARA FIREBASE & SQL
// ============================================================================

// Dados iniciais realistas para o sistema de GCN/NRGCN
const INITIAL_DATA = {
  contratos: [
    {
      id_contrato: "CON-001",
      nome: "Contrato Amazon Web Services (AWS) - Hosting e Infraestrutura Cloud",
      valor_faturamento: 450000.00,
      clausulas_risco: "Resolução em menos de 4 horas para instâncias críticas. Multa em caso de indisponibilidade superior a 99.9%.",
      multas: "Multa de 5% do faturamento mensal por hora de indisponibilidade além do SLA.",
      data_inicio: "2025-01-01",
      data_fim: "2027-12-31"
    },
    {
      id_contrato: "CON-002",
      nome: "Contrato Embratel - Link de Fibra Óptica Dedicado (Principal)",
      valor_faturamento: 120000.00,
      clausulas_risco: "SLA de conectividade de 99.95%. Penalidade por interrupção completa sem aviso prévio.",
      multas: "Abatimento proporcional e multa contratual de R$ 10.000 por hora de queda contínua.",
      data_inicio: "2024-06-01",
      data_fim: "2026-06-01"
    },
    {
      id_contrato: "CON-003",
      nome: "Contrato Stone Pagamentos - Gateway de Cobrança e Checkout",
      valor_faturamento: 890000.00,
      clausulas_risco: "Indisponibilidade do checkout afeta vendas diretas. Risco alto de perdas financeiras em tempo real.",
      multas: "Ressarcimento de perdas comprovadas e cancelamento de taxa de adesão temporária.",
      data_inicio: "2025-03-01",
      data_fim: "2027-03-01"
    }
  ],
  processosCriticos: [
    {
      id_processo: "PROC-001",
      nome: "Processamento de Pagamentos e Checkout",
      descricao: "Processamento de transações no gateway de pagamento e fluxo de fechamento de carrinho no e-commerce.",
      id_contrato: "CON-003",
      criticidade: "Crítica"
    },
    {
      id_processo: "PROC-002",
      nome: "Hospedagem e Infraestrutura do Portal de Serviços",
      descricao: "Servidores cloud e banco de dados que suportam toda a aplicação visível ao cliente.",
      id_contrato: "CON-001",
      criticidade: "Crítica"
    },
    {
      id_processo: "PROC-003",
      nome: "Comunicação Interna e Atendimento ao Cliente",
      descricao: "Links de internet e telefonia utilizados pelo suporte técnico e atendimento para atendimento de chamados.",
      id_contrato: "CON-002",
      criticidade: "Alta"
    },
    {
      id_processo: "PROC-004",
      nome: "Faturamento e Cobrança Mensal",
      descricao: "Processamento de notas fiscais e envio de boletos automáticos aos assinantes.",
      id_contrato: "CON-003",
      criticidade: "Média"
    }
  ],
  incidentes: [
    {
      id_incidente: "INC-101",
      data_hora: "2026-04-12T14:30:00",
      local: "Data Center AWS - Região us-east-1",
      descricao: "Indisponibilidade de API de checkout devido a uma instabilidade no provedor de nuvem AWS.",
      tipo_incidente: "Falha de Infraestrutura Nuvem",
      impacto: "Alto",
      id_processo: "PROC-002",
      medidas_mitigacao: "Redirecionamento de tráfego para a região backup em sa-east-1.",
      resultado_resposta: "Sistemas restabelecidos em 45 minutos. Perda financeira calculada dentro do planejado."
    },
    {
      id_incidente: "INC-102",
      data_hora: "2026-06-05T09:15:00",
      local: "Escritório Central - Link Embratel",
      descricao: "Rompimento de fibra óptica na rua de acesso ao escritório central, causando queda do link dedicado.",
      tipo_incidente: "Corte de Fibra Óptica / Telecom",
      impacto: "Médio",
      id_processo: "PROC-003",
      medidas_mitigacao: "Ativação automática do link de contingência de rádio (Vivo). Redirecionamento da equipe de suporte para home office.",
      resultado_resposta: "Apenas 5 minutos de instabilidade para alternar os links. A operação continuou sem prejuízos."
    }
  ],
  analiseImpactoNegocio: [
    {
      id_ain: "AIN-001",
      id_processo: "PROC-001",
      probabilidade: "Provável",
      impacto_financeiro: "Catastrófico",
      RTO: 15, // minutos (Tempo Objetivo de Recuperação)
      RPO: 5,  // minutos (Ponto Objetivo de Recuperação - perda máxima de dados)
      MTDCN: 60 // minutos (Período Máximo Tolerável de Interrupção)
    },
    {
      id_ain: "AIN-002",
      id_processo: "PROC-002",
      probabilidade: "Pouco Provável",
      impacto_financeiro: "Catastrófico",
      RTO: 30,
      RPO: 15,
      MTDCN: 120
    },
    {
      id_ain: "AIN-003",
      id_processo: "PROC-003",
      probabilidade: "Provável",
      impacto_financeiro: "Moderado",
      RTO: 120,
      RPO: 180,
      MTDCN: 360
    },
    {
      id_ain: "AIN-004",
      id_processo: "PROC-004",
      probabilidade: "Pouco Provável",
      impacto_financeiro: "Menor",
      RTO: 1440, // 24 horas
      RPO: 1440,
      MTDCN: 2880
    }
  ],
  planosContinuidade: [
    {
      id_pco: "PCO-001",
      id_processo: "PROC-001",
      estrategia_recuperacao: "Acionamento de gateway alternativo offline com processamento assíncrono. Redirecionar fluxos de venda para sistema de contingência local.",
      responsabilidades: "Equipe de Engenharia de Software realiza o failover. Gerente de Negócios aprova o comunicado aos clientes.",
      recursos_necessarios: "Servidores secundários ativos, chaves de API redundantes, saldo de garantia na adquirente reserva.",
      status_aprovacao: "Aprovado",
      versao: "1.2.0"
    },
    {
      id_pco: "PCO-002",
      id_processo: "PROC-002",
      estrategia_recuperacao: "Failover automático Multi-Região via Route 53. Balanceamento de carga distribuído.",
      responsabilidades: "SRE/DevOps de plantão monitora as métricas e valida a replicação do banco de dados.",
      recursos_necessarios: "Replicação síncrona do Banco de Dados Aurora Global Database, certificados SSL duplicados.",
      status_aprovacao: "Em Revisão",
      versao: "1.0.1"
    },
    {
      id_pco: "PCO-003",
      id_processo: "PROC-003",
      estrategia_recuperacao: "Transferência das filas de chamados para equipe externa de BPO contratada de prontidão.",
      responsabilidades: "Coordenação de Suporte Técnico realiza a chamada de emergência para a equipe parceira.",
      recursos_necessarios: "Contas de usuário e logins criados previamente na plataforma Zendesk para a equipe parceira.",
      status_aprovacao: "Aprovado",
      versao: "2.0.0"
    }
  ],
  planosRecuperacaoDesastres: [
    {
      id_prd: "PRD-001",
      id_processo: "PROC-001",
      procedimentos_restauracao: "1. Validar integridade dos logs de transações.\n2. Lançar script de conciliação automática.\n3. Restaurar banco de dados transacional do snapshot das últimas 5 horas caso haja corrupção de dados.\n4. Processar transações represadas.",
      local_backup: "AWS S3 Glaciar - Região eu-west-1 (Criptografado)",
      frequencia_backup: "A cada 5 minutos",
      comunicacao_emergencia: "Grupo de WhatsApp 'Crise-Checkout', Canal Slack #incidentes-graves, e-mail para Diretoria Executiva."
    },
    {
      id_prd: "PRD-002",
      id_processo: "PROC-002",
      procedimentos_restauracao: "1. Verificar status da AWS.\n2. Apontar DNS Cloudflare para IP de contingência Azure VM.\n3. Rodar script de consistência do banco de dados.\n4. Ativar servidores de aplicação na nuvem Azure.",
      local_backup: "Azure Blob Storage (Geo-redundante)",
      frequencia_backup: "A cada 15 minutos (Replicação de logs de transação)",
      comunicacao_emergencia: "Notificação PagerDuty para time SRE, Canal Slack #incidentes-ops."
    }
  ],
  testesAvaliacoes: [
    {
      id_teste: "TST-001",
      id_pco: "PCO-001",
      id_prd: "PRD-001",
      data_teste: "2026-03-10",
      resultado: "Sucesso",
      areas_melhoria: "O tempo de failover automático foi de 12 minutos (dentro dos 15 minutos de RTO), mas a notificação inicial por e-mail demorou 6 minutos para disparar. Melhorar o sistema de triggers."
    },
    {
      id_teste: "TST-002",
      id_pco: "PCO-002",
      id_prd: "PRD-002",
      data_teste: "2026-05-20",
      resultado: "Sucesso Parcial",
      areas_melhoria: "A infraestrutura em Azure subiu perfeitamente. No entanto, o banco de dados estava dessincronizado por cerca de 22 minutos (meta de RPO era 15 minutos). Ajustar a frequência de sincronização de logs para 10 minutos."
    }
  ],
  revisoesAtualizacoes: [
    {
      id_revisao: "REV-001",
      id_pco: "PCO-001",
      id_prd: "PRD-001",
      data_revisao: "2026-04-15",
      motivo: "Mudança no provedor de pagamento reserva",
      atualizacao_realizada: "Substituição das chaves de API da Adyen pelas da Pagar.me no plano de failover e nos testes de recuperação."
    },
    {
      id_revisao: "REV-002",
      id_pco: "PCO-003",
      id_prd: null,
      data_revisao: "2026-06-10",
      motivo: "Revisão semestral obrigatória da ISO 22301",
      atualizacao_realizada: "Revisão dos números de telefone de contato do link de contingência e lista de gerentes de plantão."
    }
  ],
  governancaGCN: [
    {
      id_governanca: "GOV-001",
      responsavel: "Roberto Carlos (Diretor de Riscos e Compliance / Geric)",
      comunicacao: "Reuniões trimestrais do Comitê de Crise e GCN. Relatórios executivos compartilhados via Teams.",
      treinamento: "Treinamento teórico de incêndio e desastre cibernético anual. Exercício prático (simulado) semestral com todos os gerentes.",
      id_processo: "PROC-001"
    },
    {
      id_governanca: "GOV-002",
      responsavel: "Patrícia Lima (Coordenadora de SRE / Infraestrutura)",
      comunicacao: "Canais dedicados de emergência no Slack e PagerDuty. Status Page público atualizado em tempo real.",
      treinamento: "Simulado de Failover de Infraestrutura e restauração de backups a cada 4 meses.",
      id_processo: "PROC-002"
    }
  ],
  avaliacaoNRGCN: [
    {
      id_avaliacao: "EVL-001",
      id_processo: "PROC-001",
      nivel_resiliencia: 4.80, // Escala 1.00 a 5.00
      aderencia_ISO22301: 96.00, // 0.00 a 100.00%
      metricas_utilizadas: "Mapeamento completo, RTO/RPO menores que 15 min, testes práticos com sucesso comprovado nos últimos 6 meses, auditoria interna concluída.",
      grafico_resultado: "radar_checkout_maturidade"
    },
    {
      id_avaliacao: "EVL-002",
      id_processo: "PROC-002",
      nivel_resiliencia: 4.20,
      aderencia_ISO22301: 84.00,
      metricas_utilizadas: "Redundância ativa multi-região configurada, RTO de 30 min alcançado parcialmente em testes, dependência de infraestrutura externa.",
      grafico_resultado: "radar_hosting_maturidade"
    },
    {
      id_avaliacao: "EVL-003",
      id_processo: "PROC-003",
      nivel_resiliencia: 3.50,
      aderencia_ISO22301: 70.00,
      metricas_utilizadas: "Plano estruturado de comunicação e contingência de link de rede, porém sem testes práticos automatizados na filial nos últimos 12 meses.",
      grafico_resultado: "radar_comunicacao_maturidade"
    },
    {
      id_avaliacao: "EVL-004",
      id_processo: "PROC-004",
      nivel_resiliencia: 2.10,
      aderencia_ISO22301: 42.00,
      metricas_utilizadas: "Mapeamento rudimentar, sem plano formalizado de contingência (PCO), dependência exclusiva do sistema de e-commerce e faturamento principal.",
      grafico_resultado: "radar_faturamento_maturidade"
    }
  ]
};

// Carrega ou inicializa a base de dados
const getDB = () => {
  const dbStr = localStorage.getItem("gcn_database");
  if (!dbStr) {
    localStorage.setItem("gcn_database", JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  return JSON.parse(dbStr);
};

const saveDB = (data) => {
  localStorage.setItem("gcn_database", JSON.stringify(data));
};

// Funções utilitárias de serviço
export const dbService = {
  // Resetar banco para o estado padrão
  reset() {
    saveDB(INITIAL_DATA);
    return INITIAL_DATA;
  },

  contratos: {
    list: () => getDB().contratos,
    get: (id) => getDB().contratos.find(c => c.id_contrato === id),
    create: (contrato) => {
      const db = getDB();
      const newContract = {
        ...contrato,
        id_contrato: contrato.id_contrato || `CON-${Date.now().toString().slice(-3)}`
      };
      db.contratos.push(newContract);
      saveDB(db);
      return newContract;
    },
    update: (id, data) => {
      const db = getDB();
      const index = db.contratos.findIndex(c => c.id_contrato === id);
      if (index !== -1) {
        db.contratos[index] = { ...db.contratos[index], ...data };
        saveDB(db);
        return db.contratos[index];
      }
      return null;
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
      // Retorna populado com informações do contrato associado
      return db.processosCriticos.map(p => ({
        ...p,
        contrato: db.contratos.find(c => c.id_contrato === p.id_contrato)
      }));
    },
    get: (id) => {
      const db = getDB();
      const p = db.processosCriticos.find(p => p.id_processo === id);
      if (p) {
        return {
          ...p,
          contrato: db.contratos.find(c => c.id_contrato === p.id_contrato)
        };
      }
      return null;
    },
    create: (processo) => {
      const db = getDB();
      const newProcess = {
        ...processo,
        id_processo: processo.id_processo || `PROC-${Date.now().toString().slice(-3)}`
      };
      db.processosCriticos.push(newProcess);
      saveDB(db);
      return newProcess;
    },
    update: (id, data) => {
      const db = getDB();
      const index = db.processosCriticos.findIndex(p => p.id_processo === id);
      if (index !== -1) {
        db.processosCriticos[index] = { ...db.processosCriticos[index], ...data };
        saveDB(db);
        return db.processosCriticos[index];
      }
      return null;
    },
    delete: (id) => {
      const db = getDB();
      db.processosCriticos = db.processosCriticos.filter(p => p.id_processo !== id);
      // Limpa dependências em cascata (conforme o schema SQL ON DELETE CASCADE/SET NULL)
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
    create: (incidente) => {
      const db = getDB();
      const newIncidente = {
        ...incidente,
        id_incidente: incidente.id_incidente || `INC-${Date.now().toString().slice(-3)}`
      };
      db.incidentes.push(newIncidente);
      saveDB(db);
      return newIncidente;
    },
    update: (id, data) => {
      const db = getDB();
      const index = db.incidentes.findIndex(i => i.id_incidente === id);
      if (index !== -1) {
        db.incidentes[index] = { ...db.incidentes[index], ...data };
        saveDB(db);
        return db.incidentes[index];
      }
      return null;
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
      const newTeste = {
        ...teste,
        id_teste: teste.id_teste || `TST-${Date.now().toString().slice(-3)}`
      };
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
      const newRevisao = {
        ...revisao,
        id_revisao: revisao.id_revisao || `REV-${Date.now().toString().slice(-3)}`
      };
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
    save: (governanca) => {
      const db = getDB();
      const index = db.governancaGCN.findIndex(g => g.id_processo === governanca.id_processo);
      let updatedGov;
      if (index !== -1) {
        updatedGov = { ...db.governancaGCN[index], ...governanca };
        db.governancaGCN[index] = updatedGov;
      } else {
        updatedGov = {
          ...governanca,
          id_governanca: governanca.id_governanca || `GOV-${Date.now().toString().slice(-3)}`
        };
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
    save: (avaliacao) => {
      const db = getDB();
      const index = db.avaliacaoNRGCN.findIndex(a => a.id_processo === avaliacao.id_processo);
      let updatedEvl;
      if (index !== -1) {
        updatedEvl = { ...db.avaliacaoNRGCN[index], ...avaliacao };
        db.avaliacaoNRGCN[index] = updatedEvl;
      } else {
        updatedEvl = {
          ...avaliacao,
          id_avaliacao: avaliacao.id_avaliacao || `EVL-${Date.now().toString().slice(-3)}`
        };
        db.avaliacaoNRGCN.push(updatedEvl);
      }
      saveDB(db);
      return updatedEvl;
    }
  }
};
