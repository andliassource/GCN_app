// Serviço de Notificações — GCN v4.0
// Verifica prazos e gera alertas automáticos para TODOS os destinatários corretos
export const notificationService = {

  // Verifica todos os prazos e gera notificações necessárias
  verificarPrazos: (db) => {
    const hoje = new Date();
    const geradas = [];

    // ─────────────────────────────────────────────
    // 1. PCOs vencendo — alertas em 90, 60 e 30 dias
    // Envia para: gerência dona do processo + cópia para GERIC (GER-GOV01)
    // ─────────────────────────────────────────────
    const pcos = db.planosContinuidade.list();
    pcos.forEach(pco => {
      if (!pco.vigente_ate) return;
      const diff = (new Date(pco.vigente_ate) - hoje) / (1000 * 60 * 60 * 24);
      const limites = [
        { dias: 90, prioridade: 'media' },
        { dias: 60, prioridade: 'alta' },
        { dias: 30, prioridade: diff <= 7 ? 'critica' : 'alta' },
      ];

      for (const limite of limites) {
        if (diff >= 0 && diff <= limite.dias) {
          const chave = `${pco.id_pco}_${limite.dias}d`;
          const jaExiste = db.notificacoes.list().find(
            n => n.tipo === 'plano_vencendo' && n.link_acao === chave
          );
          if (!jaExiste) {
            const titulo = `📅 PCO vencendo em ${Math.round(diff)} dias — ${pco.id_pco}`;
            const mensagem = `O PCO do processo ${pco.id_processo} vence em ${new Date(pco.vigente_ate).toLocaleDateString('pt-BR')}. Inicie o processo de revisão e reaprovação conforme NRGCN.`;
            const gerDona = pco.processo?.id_gerencia || pco.id_gerencia;

            // Notificar gerência dona do processo
            if (gerDona && gerDona !== 'GER-GOV01') {
              db.notificacoes.create({
                tipo: 'plano_vencendo',
                titulo,
                mensagem,
                id_destino: gerDona,
                prioridade: limite.prioridade,
                prazo_acao: pco.vigente_ate,
                link_acao: chave
              });
            }

            // Cópia para GERIC sempre
            db.notificacoes.create({
              tipo: 'plano_vencendo',
              titulo: `[CÓPIA GERIC] ${titulo}`,
              mensagem,
              id_destino: 'GER-GOV01',
              prioridade: limite.prioridade,
              prazo_acao: pco.vigente_ate,
              link_acao: `${chave}_geric`
            });

            geradas.push(`PCO ${pco.id_pco} (${limite.dias}d)`);
          }
          break; // só gera para o limiar mais próximo
        }
      }
    });

    // ─────────────────────────────────────────────
    // 2. PCOs sem revisão há mais de 12 meses (revisão anual obrigatória NRGCN)
    // ─────────────────────────────────────────────
    pcos.forEach(pco => {
      if (!pco.ultima_revisao) return;
      const diffRevisao = (hoje - new Date(pco.ultima_revisao)) / (1000 * 60 * 60 * 24);
      if (diffRevisao >= 365) {
        const chave = `rev_${pco.id_pco}_anual`;
        const jaExiste = db.notificacoes.list().find(n => n.link_acao === chave);
        if (!jaExiste) {
          const gerDona = pco.processo?.id_gerencia || pco.id_gerencia;
          db.notificacoes.create({
            tipo: 'revisao_devida',
            titulo: `📋 Revisão anual obrigatória — ${pco.id_pco}`,
            mensagem: `O PCO ${pco.id_pco} não é revisado há ${Math.round(diffRevisao)} dias (última revisão: ${new Date(pco.ultima_revisao).toLocaleDateString('pt-BR')}). A NRGCN exige revisão anual obrigatória.`,
            id_destino: gerDona || 'GER-GOV01',
            prioridade: diffRevisao >= 730 ? 'critica' : 'alta',
            prazo_acao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            link_acao: chave
          });
          // Cópia para GERIC
          db.notificacoes.create({
            tipo: 'revisao_devida',
            titulo: `[CÓPIA GERIC] Revisão anual obrigatória — ${pco.id_pco}`,
            mensagem: `O PCO ${pco.id_pco} não é revisado há ${Math.round(diffRevisao)} dias. Cobrar revisão da gerência responsável.`,
            id_destino: 'GER-GOV01',
            prioridade: 'media',
            prazo_acao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            link_acao: `${chave}_geric`
          });
          geradas.push(`Revisão anual PCO ${pco.id_pco}`);
        }
      }
    });

    // ─────────────────────────────────────────────
    // 3. Planos de ação em atraso
    // Envia para: gerência responsável + GERIC
    // ─────────────────────────────────────────────
    const planosAcao = db.planosAcao.list();
    planosAcao.forEach(pa => {
      if (pa.status === 'concluido' || !pa.prazo) return;
      const diff = (new Date(pa.prazo) - hoje) / (1000 * 60 * 60 * 24);

      // Alerta de prazo próximo (7 dias)
      if (diff >= 0 && diff <= 7) {
        const chave = `pa_prazo_${pa.id_plano_acao}`;
        const jaExiste = db.notificacoes.list().find(n => n.link_acao === chave);
        if (!jaExiste) {
          db.notificacoes.create({
            tipo: 'plano_acao_prazo',
            titulo: `⏰ Plano de Ação vence em ${Math.round(diff)} dias — ${pa.id_plano_acao}`,
            mensagem: `O plano "${pa.descricao?.substring(0, 80)}" vence em ${new Date(pa.prazo).toLocaleDateString('pt-BR')}. Responsável: ${pa.responsavel}. Status atual: ${pa.status}.`,
            id_destino: pa.id_gerencia || 'GER-GOV01',
            prioridade: diff <= 2 ? 'critica' : 'alta',
            prazo_acao: pa.prazo,
            link_acao: chave
          });
          geradas.push(`PA prazo próximo ${pa.id_plano_acao}`);
        }
      }

      // Alerta de atraso
      if (diff < 0) {
        const chave = `pa_atrasado_${pa.id_plano_acao}`;
        const jaExiste = db.notificacoes.list().find(n => n.link_acao === chave);
        if (!jaExiste) {
          const titulo = `🚨 Plano de Ação ATRASADO — ${pa.id_plano_acao}`;
          const mensagem = `O plano "${pa.descricao?.substring(0, 80)}" está ${Math.abs(Math.round(diff))} dias em atraso. Responsável: ${pa.responsavel}.`;
          db.notificacoes.create({
            tipo: 'plano_acao_atrasado',
            titulo,
            mensagem,
            id_destino: pa.id_gerencia || 'GER-GOV01',
            prioridade: 'critica',
            prazo_acao: pa.prazo,
            link_acao: chave
          });
          // Cópia para GERIC
          if (pa.id_gerencia && pa.id_gerencia !== 'GER-GOV01') {
            db.notificacoes.create({
              tipo: 'plano_acao_atrasado',
              titulo: `[CÓPIA GERIC] ${titulo}`,
              mensagem,
              id_destino: 'GER-GOV01',
              prioridade: 'alta',
              prazo_acao: pa.prazo,
              link_acao: `${chave}_geric`
            });
          }
          geradas.push(`PA atrasado ${pa.id_plano_acao}`);
        }
      }
    });

    // ─────────────────────────────────────────────
    // 4. Ativos com fim de suporte próximo (90 dias)
    // Envia para: GETIC (id_gerencia do ativo) + GERIC
    // ─────────────────────────────────────────────
    const ativos = db.ativosSistemas.list();
    ativos.forEach(a => {
      if (!a.data_fim_suporte) return;
      const diff = (new Date(a.data_fim_suporte) - hoje) / (1000 * 60 * 60 * 24);
      if (diff >= 0 && diff <= 90) {
        const chave = `ativo_suporte_${a.id_ativo}`;
        const jaExiste = db.notificacoes.list().find(n => n.link_acao === chave);
        if (!jaExiste) {
          const titulo = `⚙️ Suporte de ativo encerra em ${Math.round(diff)} dias — ${a.nome}`;
          const mensagem = `O ativo "${a.nome}" (${a.tipo}) tem suporte do fornecedor encerrando em ${new Date(a.data_fim_suporte).toLocaleDateString('pt-BR')}. Planeje renovação ou substituição com antecedência.`;
          db.notificacoes.create({
            tipo: 'ativo_fim_suporte',
            titulo,
            mensagem,
            id_destino: a.id_gerencia || 'GER-TIC01',
            prioridade: diff <= 30 ? 'alta' : 'media',
            prazo_acao: a.data_fim_suporte,
            link_acao: chave
          });
          // Cópia para GERIC se prazo curto
          if (diff <= 30) {
            db.notificacoes.create({
              tipo: 'ativo_fim_suporte',
              titulo: `[CÓPIA GERIC] ${titulo}`,
              mensagem,
              id_destino: 'GER-GOV01',
              prioridade: 'media',
              prazo_acao: a.data_fim_suporte,
              link_acao: `${chave}_geric`
            });
          }
          geradas.push(`Ativo ${a.id_ativo} fim suporte`);
        }
      }
    });

    return geradas;
  },

  // Notifica incidente crítico para GERIC + gerência dona
  notificarIncidenteCritico: (db, incidente) => {
    const gerDona = incidente.id_gerencia;
    const titulo = `🔴 Incidente Crítico Registrado — ${incidente.id_incidente}`;
    const mensagem = `"${incidente.descricao?.substring(0, 120)}" foi classificado como CRÍTICO às ${new Date(incidente.data_hora).toLocaleTimeString('pt-BR')}. RTO de referência: ${incidente.rto_violado ? 'VIOLADO ⚠️' : 'dentro do limite'}.`;

    // Notificar gerência dona
    if (gerDona && gerDona !== 'GER-GOV01') {
      db.notificacoes.create({
        tipo: 'incidente_critico',
        titulo,
        mensagem,
        id_destino: gerDona,
        prioridade: 'critica',
        link_acao: 'incidentes'
      });
    }
    // Notificar GERIC sempre
    db.notificacoes.create({
      tipo: 'incidente_critico',
      titulo,
      mensagem,
      id_destino: 'GER-GOV01',
      prioridade: 'critica',
      link_acao: 'incidentes'
    });
  },

  // Simula envio de email (retorna objeto de preview)
  gerarPreviewEmail: (notificacao, destinatario) => ({
    para: destinatario?.email || 'gestor@empresa.com.br',
    assunto: `[GCN Sistema] ${notificacao.titulo}`,
    corpo: `
Prezado(a) ${destinatario?.nome || 'Gestor(a)'},

${notificacao.mensagem}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prioridade: ${notificacao.prioridade?.toUpperCase()}
Criado em: ${new Date(notificacao.criado_em).toLocaleString('pt-BR')}
${notificacao.prazo_acao ? `Prazo de Ação: ${new Date(notificacao.prazo_acao).toLocaleString('pt-BR')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este é um e-mail automático gerado pelo Sistema GCN/NRGCN.
Alinhado com ISO 22301:2019 | ISO 27031:2011

Equipe de Gestão de Riscos e Continuidade (Geric)
`.trim(),
    html: true
  }),

  // Acionamento de plano: notifica todos os intervenientes + GERIC
  gerarNotificacoesAcionamento: (db, id_pco, id_incidente, acionado_por) => {
    const pco = db.planosContinuidade.list().find(p => p.id_pco === id_pco);
    if (!pco) return [];
    const intervenienteIds = pco.intervenientes || [];
    const todosIntervenientes = db.intervenientes.list();
    const alvos = intervenienteIds.length > 0
      ? todosIntervenientes.filter(i => intervenienteIds.includes(i.id_interveniente))
      : todosIntervenientes.filter(i => i.id_processo === pco.id_processo);

    const geradas = [];
    alvos.forEach(interv => {
      db.notificacoes.create({
        tipo: 'acionamento_plano',
        titulo: `🚨 PLANO ACIONADO — ${id_pco} | Incidente ${id_incidente}`,
        mensagem: `O plano ${id_pco} foi ACIONADO às ${new Date().toLocaleTimeString('pt-BR')} por ${acionado_por}. Incidente vinculado: ${id_incidente}. PAPEL: ${interv.papel.toUpperCase()}. Reportar situação em até 15 minutos.`,
        id_destino: interv.id_gerencia,
        prioridade: 'critica',
        prazo_acao: new Date(Date.now() + 900000).toISOString(), // +15 min
        link_acao: 'planos'
      });
      geradas.push(interv);
    });

    // Notificar a gerência dona do processo (se não for GERIC)
    if (pco.id_gerencia && pco.id_gerencia !== 'GER-GOV01') {
      db.notificacoes.create({
        tipo: 'acionamento_plano',
        titulo: `🚨 SEU PLANO FOI ACIONADO — ${id_pco}`,
        mensagem: `O plano ${id_pco} de responsabilidade da sua gerência foi acionado para o incidente ${id_incidente} por ${acionado_por}. Acompanhe a War Room.`,
        id_destino: pco.id_gerencia,
        prioridade: 'critica',
        prazo_acao: new Date(Date.now() + 1800000).toISOString(),
        link_acao: 'incidentes'
      });
    }

    // Notificar GERIC
    db.notificacoes.create({
      tipo: 'acionamento_plano',
      titulo: `🔴 ACIONAMENTO CONFIRMADO — ${id_pco}`,
      mensagem: `O plano ${id_pco} foi acionado por ${acionado_por} para o incidente ${id_incidente}. ${alvos.length} intervenientes notificados.`,
      id_destino: 'GER-GOV01',
      prioridade: 'critica',
      prazo_acao: new Date(Date.now() + 1800000).toISOString(),
      link_acao: 'planos'
    });

    db.planosContinuidade.acionar(id_pco, id_incidente, acionado_por);
    return geradas;
  }
};
