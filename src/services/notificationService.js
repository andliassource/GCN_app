// Serviço de Notificações — GCN v4.0
// Verifica prazos e gera alertas automáticos
export const notificationService = {

  // Verifica todos os prazos e gera notificações necessárias
  verificarPrazos: (db) => {
    const hoje = new Date();
    const geradas = [];

    // 1. PCOs vencendo
    const pcos = db.planosContinuidade.list();
    pcos.forEach(pco => {
      if (!pco.vigente_ate) return;
      const diff = (new Date(pco.vigente_ate) - hoje) / (1000 * 60 * 60 * 24);
      if (diff >= 0 && diff <= 30) {
        const jaExiste = db.notificacoes.list().find(
          n => n.tipo === 'plano_vencendo' && n.link_acao === pco.id_pco
        );
        if (!jaExiste) {
          db.notificacoes.create({
            tipo: 'plano_vencendo',
            titulo: `📅 PCO vencendo em ${Math.round(diff)} dias — ${pco.id_pco}`,
            mensagem: `O PCO do processo ${pco.id_processo} vence em ${new Date(pco.vigente_ate).toLocaleDateString('pt-BR')}. Inicie o processo de revisão e reaprovação.`,
            id_destino: pco.processo?.id_gerencia || 'GER-GOV01',
            prioridade: diff <= 7 ? 'critica' : diff <= 15 ? 'alta' : 'media',
            prazo_acao: pco.vigente_ate,
            link_acao: pco.id_pco
          });
          geradas.push(`PCO ${pco.id_pco}`);
        }
      }
    });

    // 2. Planos de ação em atraso
    const planosAcao = db.planosAcao.list();
    planosAcao.forEach(pa => {
      if (pa.status === 'concluido' || !pa.prazo) return;
      const diff = (new Date(pa.prazo) - hoje) / (1000 * 60 * 60 * 24);
      if (diff < 0) {
        const jaExiste = db.notificacoes.list().find(
          n => n.tipo === 'plano_acao_atrasado' && n.link_acao === pa.id_plano_acao
        );
        if (!jaExiste) {
          db.notificacoes.create({
            tipo: 'plano_acao_atrasado',
            titulo: `🚨 Plano de Ação ATRASADO — ${pa.id_plano_acao}`,
            mensagem: `O plano de ação "${pa.descricao?.substring(0, 80)}..." está ${Math.abs(Math.round(diff))} dias em atraso. Responsável: ${pa.responsavel}.`,
            id_destino: pa.id_gerencia || 'GER-GOV01',
            prioridade: 'critica',
            prazo_acao: pa.prazo,
            link_acao: pa.id_plano_acao
          });
          geradas.push(`PA ${pa.id_plano_acao}`);
        }
      }
    });

    // 3. Ativos com data de fim de suporte próxima (90 dias)
    const ativos = db.ativosSistemas.list();
    ativos.forEach(a => {
      if (!a.data_fim_suporte) return;
      const diff = (new Date(a.data_fim_suporte) - hoje) / (1000 * 60 * 60 * 24);
      if (diff >= 0 && diff <= 90) {
        const jaExiste = db.notificacoes.list().find(
          n => n.tipo === 'ativo_fim_suporte' && n.link_acao === a.id_ativo
        );
        if (!jaExiste) {
          db.notificacoes.create({
            tipo: 'ativo_fim_suporte',
            titulo: `⚙️ Ativo "${a.nome}" com suporte encerrando em ${Math.round(diff)} dias`,
            mensagem: `O ativo "${a.nome}" (${a.tipo}) tem suporte do fornecedor encerrando em ${new Date(a.data_fim_suporte).toLocaleDateString('pt-BR')}. Planeje renovação ou substituição.`,
            id_destino: a.id_gerencia || 'GER-TIC01',
            prioridade: diff <= 30 ? 'alta' : 'media',
            prazo_acao: a.data_fim_suporte,
            link_acao: a.id_ativo
          });
          geradas.push(`Ativo ${a.id_ativo}`);
        }
      }
    });

    return geradas;
  },

  // Simula envio de email (retorna objeto de preview)
  gerarPreviewEmail: (notificacao, destinatario) => ({
    para: destinatario?.email || 'gestor@empresa.com.br',
    assunto: `[GCN Sistema] ${notificacao.titulo}`,
    corpo: `
Prezado(a) ${destinatario?.nome || 'Gestor(a)'},

${notificacao.mensagem}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prioridade: ${notificacao.prioridade.toUpperCase()}
Criado em: ${new Date(notificacao.criado_em).toLocaleString('pt-BR')}
${notificacao.prazo_acao ? `Prazo de Ação: ${new Date(notificacao.prazo_acao).toLocaleString('pt-BR')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este é um e-mail automático gerado pelo Sistema GCN/NRGCN.
Alinhado com ISO 22301:2019 | ISO 27031:2011

Equipe de Gestão de Riscos e Continuidade (Geric)
`.trim(),
    html: true
  }),

  // Acionamento de plano: notifica todos os intervenientes
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

    // Notificar também a Geric
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
