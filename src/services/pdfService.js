// Serviço de Exportação PDF — GCN v4.0
// Usa a API nativa window.print() com estilos CSS para gerar PDFs de alta qualidade
// Para uso com jsPDF: instale jspdf e html2canvas via npm

export const pdfService = {

  // Abre janela de impressão com template corporativo
  exportar: (titulo, conteudoHTML, config = {}) => {
    const { nome_empresa = 'Empresa GCN', logo_base64 = null, confidencialidade = 'RESTRITO', versao = '1.0', autor = 'Geric — Gestão de Riscos e GCN' } = config;
    const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo} — ${nome_empresa}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 10pt;
      color: #1e293b;
      background: #fff;
      line-height: 1.5;
    }
    
    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 20mm 25mm;
      min-height: 297mm;
      position: relative;
    }
    
    /* CABEÇALHO */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 12pt;
      border-bottom: 3pt solid #4f46e5;
      margin-bottom: 16pt;
    }
    .header-left { display: flex; align-items: center; gap: 12pt; }
    .logo-box {
      width: 48pt; height: 48pt;
      background: #4f46e5;
      border-radius: 8pt;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .logo-box img { width: 40pt; height: 40pt; object-fit: contain; border-radius: 6pt; }
    .logo-box-icon { color: white; font-size: 24pt; font-weight: 900; }
    .empresa-nome { font-size: 8pt; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
    .doc-titulo { font-size: 14pt; font-weight: 800; color: #1e293b; margin-top: 2pt; }
    .doc-subtitulo { font-size: 8pt; color: #64748b; margin-top: 2pt; }
    .header-right { text-align: right; font-size: 7.5pt; color: #94a3b8; }
    .conf-badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      border: 1pt solid #fcd34d;
      font-size: 7pt;
      font-weight: 700;
      padding: 2pt 8pt;
      border-radius: 20pt;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .conf-badge.restrito { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .conf-badge.confidencial { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
    .conf-badge.secreto { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
    
    /* META INFOS */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8pt;
      background: #f8fafc;
      border: 1pt solid #e2e8f0;
      border-radius: 6pt;
      padding: 10pt;
      margin-bottom: 16pt;
    }
    .meta-item { }
    .meta-label { font-size: 6.5pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
    .meta-value { font-size: 8.5pt; font-weight: 600; color: #334155; margin-top: 2pt; }
    
    /* CONTEÚDO */
    .section { margin-bottom: 14pt; }
    .section-title {
      font-size: 9pt; font-weight: 800; color: #4f46e5;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding-bottom: 4pt;
      border-bottom: 1pt solid #e2e8f0;
      margin-bottom: 8pt;
    }
    
    p { margin-bottom: 6pt; font-size: 9pt; color: #334155; }
    
    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 8pt; }
    th { background: #f1f5f9; color: #475569; font-weight: 700; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.06em; padding: 6pt 8pt; border: 1pt solid #e2e8f0; text-align: left; }
    td { padding: 5pt 8pt; border: 1pt solid #e2e8f0; color: #334155; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    
    .badge {
      display: inline-block;
      font-size: 7pt; font-weight: 700;
      padding: 1.5pt 6pt; border-radius: 20pt;
      text-transform: uppercase;
    }
    .badge-red { background: #fef2f2; color: #b91c1c; border: 1pt solid #fecaca; }
    .badge-orange { background: #fff7ed; color: #c2410c; border: 1pt solid #fed7aa; }
    .badge-yellow { background: #fefce8; color: #a16207; border: 1pt solid #fef08a; }
    .badge-green { background: #f0fdf4; color: #15803d; border: 1pt solid #bbf7d0; }
    .badge-blue { background: #eff6ff; color: #1d4ed8; border: 1pt solid #bfdbfe; }
    .badge-gray { background: #f8fafc; color: #475569; border: 1pt solid #e2e8f0; }
    
    .highlight-box {
      background: #eff6ff; border: 1pt solid #bfdbfe; border-radius: 6pt;
      padding: 8pt 10pt; margin-bottom: 8pt;
    }
    .highlight-box p { margin: 0; font-size: 8.5pt; color: #1d4ed8; }
    
    .warning-box {
      background: #fff7ed; border: 1pt solid #fed7aa; border-radius: 6pt;
      padding: 8pt 10pt; margin-bottom: 8pt;
    }
    .warning-box p { margin: 0; font-size: 8.5pt; color: #c2410c; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8pt; margin-bottom: 8pt; }
    .kpi-card { background: #f8fafc; border: 1pt solid #e2e8f0; border-radius: 6pt; padding: 8pt; text-align: center; }
    .kpi-value { font-size: 18pt; font-weight: 900; color: #4f46e5; }
    .kpi-label { font-size: 7pt; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 2pt; }
    
    .assinaturas {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16pt;
      margin-top: 24pt;
      padding-top: 12pt;
      border-top: 1pt solid #e2e8f0;
    }
    .assinatura-box {
      border-top: 1pt solid #1e293b;
      padding-top: 6pt;
      text-align: center;
    }
    .assinatura-label { font-size: 7.5pt; color: #64748b; }
    .assinatura-nome { font-size: 8pt; font-weight: 700; color: #1e293b; margin-top: 2pt; }
    .assinatura-cargo { font-size: 7pt; color: #94a3b8; }
    
    /* RODAPÉ */
    .footer {
      position: fixed;
      bottom: 12mm;
      left: 20mm; right: 20mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7pt;
      color: #94a3b8;
      border-top: 1pt solid #e2e8f0;
      padding-top: 6pt;
    }
    
    /* MARCA D'ÁGUA */
    .watermark {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 48pt;
      font-weight: 900;
      color: rgba(79, 70, 229, 0.04);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      pointer-events: none;
      white-space: nowrap;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 0; }
      @page { margin: 20mm; }
    }
  </style>
</head>
<body>
  <div class="watermark">${confidencialidade}</div>
  
  <div class="page">
    <!-- CABEÇALHO -->
    <div class="header">
      <div class="header-left">
        <div class="logo-box">
          ${logo_base64
            ? `<img src="${logo_base64}" alt="Logo" />`
            : `<span class="logo-box-icon">🛡</span>`
          }
        </div>
        <div>
          <div class="empresa-nome">${nome_empresa}</div>
          <div class="doc-titulo">${titulo}</div>
          <div class="doc-subtitulo">Sistema de Gestão de Continuidade de Negócios (GCN)</div>
        </div>
      </div>
      <div class="header-right">
        <div class="conf-badge ${confidencialidade.toLowerCase()}">${confidencialidade}</div>
        <div style="margin-top: 6pt;">Versão: ${versao}</div>
        <div>${dataAtual} ${horaAtual}</div>
      </div>
    </div>
    
    <!-- META -->
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Documento</div>
        <div class="meta-value">${titulo}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Elaborado por</div>
        <div class="meta-value">${autor}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Norma de referência</div>
        <div class="meta-value">ISO 22301:2019 / 27031:2011</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Gerado em</div>
        <div class="meta-value">${dataAtual}</div>
      </div>
    </div>
    
    <!-- CONTEÚDO PRINCIPAL -->
    ${conteudoHTML}
    
    <!-- ASSINATURAS -->
    <div class="assinaturas">
      <div class="assinatura-box">
        <div style="height: 20pt;"></div>
        <div class="assinatura-label">Elaborado por</div>
        <div class="assinatura-nome">Geric — Gestão de Riscos e GCN</div>
      </div>
      <div class="assinatura-box">
        <div style="height: 20pt;"></div>
        <div class="assinatura-label">Aprovado por</div>
        <div class="assinatura-nome">Geemp — Governança Corporativa</div>
      </div>
      <div class="assinatura-box">
        <div style="height: 20pt;"></div>
        <div class="assinatura-label">Ciente</div>
        <div class="assinatura-nome">Diretoria Responsável</div>
      </div>
    </div>
  </div>
  
  <!-- RODAPÉ -->
  <div class="footer">
    <span>Documento GCN — ISO 22301:2019 | Confidencialidade: ${confidencialidade}</span>
    <span>${nome_empresa} | ${dataAtual}</span>
  </div>
  
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
    else { alert('Permita pop-ups para exportar o PDF.'); }
  },

  // Gera HTML do PCO
  htmlPCO: (pco, processo, ain, intervenientes, config) => {
    const cinc = ain ? `RTO: ${ain.RTO} min | RPO: ${ain.RPO} min | MTDCN: ${ain.MTDCN} min` : 'AIN não configurada';
    const intRows = (intervenientes || []).map(i => `<tr><td>${i.nome}</td><td>${i.cargo}</td><td>${i.papel}</td><td>${i.email}</td><td>${i.telefone}</td></tr>`).join('');
    return `
      <div class="section">
        <div class="section-title">1. Identificação do Processo Crítico</div>
        <table>
          <tr><th>Campo</th><th>Valor</th></tr>
          <tr><td>Código do Processo</td><td>${processo?.id_processo || '-'}</td></tr>
          <tr><td>Nome do Processo</td><td><strong>${processo?.nome || '-'}</strong></td></tr>
          <tr><td>Gerência Responsável</td><td>${processo?.id_gerencia || '-'}</td></tr>
          <tr><td>Criticidade</td><td>${processo?.criticidade || '-'}</td></tr>
          <tr><td>Contrato Vinculado</td><td>${processo?.id_contrato || 'Processo de apoio (sem contrato externo)'}</td></tr>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">2. Parâmetros de Continuidade (AIN/BIA)</div>
        <div class="highlight-box"><p>📊 ${cinc}</p></div>
      </div>
      
      <div class="section">
        <div class="section-title">3. Estratégia de Recuperação</div>
        <p>${pco?.estrategia_recuperacao || 'Não definida.'}</p>
      </div>
      
      <div class="section">
        <div class="section-title">4. Cenário A — Acesso/Bloqueio Predial</div>
        <p>${pco?.cenario_acesso || 'Não definido.'}</p>
      </div>
      <div class="section">
        <div class="section-title">5. Cenário B — Indisponibilidade de Sistemas</div>
        <p>${pco?.cenario_sistemas || 'Não definido.'}</p>
      </div>
      <div class="section">
        <div class="section-title">6. Cenário C — Fornecedores Críticos</div>
        <p>${pco?.cenario_fornecedores || 'Não definido.'}</p>
      </div>
      <div class="section">
        <div class="section-title">7. Cenário D — Absenteísmo / Pessoas</div>
        <p>${pco?.cenario_pessoas || 'Não definido.'}</p>
      </div>
      
      <div class="section">
        <div class="section-title">8. Escalonamento de Crise</div>
        <div class="warning-box"><p>⚠️ ${pco?.escalonamento_crise || 'Não definido.'}</p></div>
      </div>
      
      <div class="section">
        <div class="section-title">9. Responsabilidades e Recursos</div>
        <p><strong>Responsabilidades:</strong> ${pco?.responsabilidades || '-'}</p>
        <p><strong>Recursos necessários:</strong> ${pco?.recursos_necessarios || '-'}</p>
      </div>
      
      ${intRows ? `
      <div class="section">
        <div class="section-title">10. Intervenientes do Plano</div>
        <table>
          <tr><th>Nome</th><th>Cargo</th><th>Papel</th><th>E-mail</th><th>Telefone</th></tr>
          ${intRows}
        </table>
      </div>` : ''}
      
      <div class="section">
        <div class="section-title">11. Controle de Versão</div>
        <table>
          <tr><th>Versão</th><th>Status</th><th>Última Revisão</th><th>Próxima Revisão</th><th>Validade</th></tr>
          <tr>
            <td>${pco?.versao || '1.0.0'}</td>
            <td><span class="badge ${pco?.status_aprovacao === 'Aprovado' ? 'badge-green' : 'badge-orange'}">${pco?.status_aprovacao || 'Pendente'}</span></td>
            <td>${pco?.data_ultima_revisao ? new Date(pco.data_ultima_revisao).toLocaleDateString('pt-BR') : 'Nunca'}</td>
            <td>${pco?.data_proxima_revisao ? new Date(pco.data_proxima_revisao).toLocaleDateString('pt-BR') : '-'}</td>
            <td>${pco?.vigente_ate ? new Date(pco.vigente_ate).toLocaleDateString('pt-BR') : '-'}</td>
          </tr>
        </table>
      </div>
    `;
  },

  // HTML do Relatório de Teste
  htmlTeste: (teste, pco, processo) => {
    const cenariosRows = (teste.cenarios_testados || []).map(c => {
      const badge = c.resultado === 'passou' ? 'badge-green' : c.resultado === 'falhou' ? 'badge-red' : 'badge-yellow';
      const nomeCenario = { acesso: 'Acesso/Bloqueio Predial', sistemas: 'Sistemas', fornecedores: 'Fornecedores', pessoas: 'Pessoas/Absenteísmo' }[c.cenario] || c.cenario;
      return `<tr><td>${nomeCenario}</td><td><span class="badge ${badge}">${c.resultado.toUpperCase()}</span></td><td>${c.observacoes || '-'}</td></tr>`;
    }).join('');
    return `
      <div class="section">
        <div class="section-title">1. Identificação do Teste</div>
        <table>
          <tr><th>Campo</th><th>Valor</th></tr>
          <tr><td>ID do Teste</td><td>${teste.id_teste}</td></tr>
          <tr><td>Tipo de Teste</td><td>${teste.tipo_teste === 'simulacao_mesa' ? 'Simulação de Mesa (Tabletop)' : teste.tipo_teste === 'exercicio_campo' ? 'Exercício de Campo' : 'Teste Técnico'}</td></tr>
          <tr><td>Data de Realização</td><td>${new Date(teste.data_teste).toLocaleDateString('pt-BR')}</td></tr>
          <tr><td>Processo Testado</td><td>${processo?.nome || '-'}</td></tr>
          <tr><td>Resultado Geral</td><td>${teste.resultado}</td></tr>
        </table>
      </div>
      ${cenariosRows ? `
      <div class="section">
        <div class="section-title">2. Resultado por Cenário</div>
        <table><tr><th>Cenário</th><th>Resultado</th><th>Observações</th></tr>${cenariosRows}</table>
      </div>` : ''}
      <div class="section">
        <div class="section-title">3. Áreas de Melhoria Identificadas</div>
        <p>${teste.areas_melhoria || 'Nenhuma área de melhoria identificada.'}</p>
      </div>
      ${teste.gerou_plano_acao ? `
      <div class="section">
        <div class="section-title">4. Plano de Ação Gerado</div>
        <div class="warning-box"><p>⚠️ Plano de Ação ${teste.id_plano_acao} criado automaticamente devido a falhas identificadas nos cenários testados.</p></div>
      </div>` : ''}
      <div class="section">
        <div class="section-title">5. Participantes</div>
        <p>${(teste.participantes || []).join(' | ') || 'Não informado.'}</p>
      </div>
    `;
  },

  // HTML do Dashboard executivo
  htmlDashboard: (kpis, nrgcnData) => `
    <div class="section">
      <div class="section-title">Sumário Executivo — Indicadores GCN</div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-value">${kpis.totalProcessos}</div><div class="kpi-label">Processos Críticos</div></div>
        <div class="kpi-card"><div class="kpi-value" style="color:#10b981">${kpis.pcosAprovados}</div><div class="kpi-label">PCOs Aprovados</div></div>
        <div class="kpi-card"><div class="kpi-value" style="color:#f59e0b">${kpis.pcosPendentes}</div><div class="kpi-label">PCOs Pendentes</div></div>
        <div class="kpi-card"><div class="kpi-value" style="color:#ef4444">${kpis.pcosVencidos}</div><div class="kpi-label">PCOs Vencidos</div></div>
        <div class="kpi-card"><div class="kpi-value">${kpis.totalIncidentes}</div><div class="kpi-label">Total de Incidentes</div></div>
        <div class="kpi-card"><div class="kpi-value" style="color:#ef4444">${kpis.incidentesRTOUltrapassado}</div><div class="kpi-label">RTO Ultrapassado</div></div>
        <div class="kpi-card"><div class="kpi-value" style="color:#f59e0b">${kpis.riscosAltos}</div><div class="kpi-label">Riscos Altos/Críticos</div></div>
        <div class="kpi-card"><div class="kpi-value">${kpis.nrgcnScore}</div><div class="kpi-label">NRGCN Score Geral</div></div>
        <div class="kpi-card"><div class="kpi-value" style="color:#10b981">${kpis.aderenciaISO}%</div><div class="kpi-label">Aderência ISO 22301</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">NRGCN por Gerência</div>
      <table>
        <tr><th>Gerência</th><th>NRGCN Score</th><th>Aderência ISO 22301</th></tr>
        ${(nrgcnData || []).map(n => `<tr><td>${n.gerencia}</td><td>${n.nrgcn}</td><td>${n.aderencia}%</td></tr>`).join('')}
      </table>
    </div>
  `,

  // HTML de Visão 360 do Processo Completo
  htmlProcessoCompleto: (processo, ain, pco, prd, ativos, riscos, incidentes, intervenientes, perdas) => {
    const ativosRows = (ativos || []).map(a => `
      <tr>
        <td><strong>${a.id_ativo}</strong></td>
        <td>${a.nome}</td>
        <td>${a.tipo}</td>
        <td><span class="badge ${a.criticidade === 'Critica' || a.criticidade === 'Alta' ? 'badge-red' : 'badge-gray'}">${a.criticidade}</span></td>
        <td>${a.suporte_valido_ate ? new Date(a.suporte_valido_ate).toLocaleDateString('pt-BR') : 'N/A'}</td>
      </tr>
    `).join('');

    const riscosRows = (riscos || []).map(r => {
      const score = (r.impacto_residual * r.probabilidade_residual) || (r.impacto * r.probabilidade) || 0;
      const badge = score >= 15 ? 'badge-red' : score >= 8 ? 'badge-orange' : 'badge-green';
      return `
        <tr>
          <td><strong>${r.id_risco}</strong></td>
          <td>${r.titulo}</td>
          <td>${r.probabilidade} x ${r.impacto}</td>
          <td><span class="badge ${badge}">Score: ${score}</span></td>
          <td>${r.plano_acao_mitigacao || '-'}</td>
        </tr>
      `;
    }).join('');

    const incidentesRows = (incidentes || []).map(i => {
      const rtoColor = i.rto_ultrapassado ? 'badge-red' : 'badge-green';
      const statusBadge = i.status_incidente === 'fechado' ? 'badge-green' : 'badge-orange';
      return `
        <tr>
          <td><strong>${i.id_incidente}</strong></td>
          <td>${i.descricao}</td>
          <td><span class="badge ${statusBadge}">${i.status_incidente}</span></td>
          <td>${i.rto_meta_minutos ? `${i.rto_meta_minutos}m` : '-'}</td>
          <td><span class="badge ${rtoColor}">${i.rto_real_minutos ? `${i.rto_real_minutos}m` : '-'}</span></td>
        </tr>
      `;
    }).join('');

    const intervenientesRows = (intervenientes || []).map(i => `
      <tr>
        <td>${i.nome}</td>
        <td>${i.cargo}</td>
        <td>${i.papel}</td>
        <td>${i.email}</td>
        <td>${i.telefone}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <div class="section-title">1. Dados do Processo Crítico</div>
        <table>
          <tr><th>Campo</th><th>Valor</th></tr>
          <tr><td>Código do Processo</td><td><strong>${processo?.id_processo || '-'}</strong></td></tr>
          <tr><td>Nome do Processo</td><td>${processo?.nome || '-'}</td></tr>
          <tr><td>Descrição operacional</td><td>${processo?.descricao || '-'}</td></tr>
          <tr><td>Gerência Responsável</td><td>${processo?.id_gerencia || '-'}</td></tr>
          <tr><td>Criticidade</td><td><span class="badge ${processo?.criticidade === 'Crítica' || processo?.criticidade === 'Alta' ? 'badge-red' : 'badge-gray'}">${processo?.criticidade || '-'}</span></td></tr>
          <tr><td>Contrato Vinculado</td><td>${processo?.id_contrato || 'Sem contrato externo'}</td></tr>
          <tr><td>SLA Interno (Apoio)</td><td>${processo?.sla_interno || 'N/A'}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">2. Parâmetros de Tempo e Financeiros (AIN/BIA)</div>
        <table>
          <tr><th>Probabilidade</th><th>Impacto Geral</th><th>RTO</th><th>RPO</th><th>MTDCN</th></tr>
          <tr>
            <td>${ain?.probabilidade || '-'}</td>
            <td>${ain?.impacto_financeiro || '-'}</td>
            <td>${ain?.RTO ? `${ain.RTO} min` : '-'}</td>
            <td>${ain?.RPO ? `${ain.RPO} min` : '-'}</td>
            <td><strong style="color:#b91c1c">${ain?.MTDCN ? `${ain.MTDCN} min` : '-'}</strong></td>
          </tr>
        </table>
        
        <div style="margin-top: 8pt;" class="highlight-box">
          <p>
            💰 <strong>Perda Financeira Estimada em Paralisação:</strong> 
            ${perdas?.hasContrato 
              ? `R$ ${perdas.hora.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} / Hora | R$ ${perdas.dia.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} / Dia (Multa Estimada: R$ ${perdas.multaEstimada.toLocaleString('pt-BR')})` 
              : 'Sem perdas financeiras contratuais diretas mapeadas.'}
          </p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">3. Plano de Continuidade Operacional (PCO)</div>
        ${pco ? `
          <table>
            <tr><th>Status de Aprovação</th><th>Versão</th><th>Última Revisão</th></tr>
            <tr>
              <td><span class="badge ${pco.status_aprovacao === 'Aprovado' ? 'badge-green' : 'badge-orange'}">${pco.status_aprovacao}</span></td>
              <td>${pco.versao}</td>
              <td>${pco.data_ultima_revisao ? new Date(pco.data_ultima_revisao).toLocaleDateString('pt-BR') : 'Sem revisão'}</td>
            </tr>
          </table>
          <div style="margin-top: 6pt; font-size: 8.5pt;">
            <p><strong>Estratégia de Recuperação:</strong> ${pco.estrategia_recuperacao || '-'}</p>
            <p style="margin-top:4pt;"><strong>Cenário A (Acesso Predial):</strong> ${pco.cenario_acesso || '-'}</p>
            <p style="margin-top:4pt;"><strong>Cenário B (Sistemas/TI):</strong> ${pco.cenario_sistemas || '-'}</p>
            <p style="margin-top:4pt;"><strong>Cenário C (Fornecedores):</strong> ${pco.cenario_fornecedores || '-'}</p>
            <p style="margin-top:4pt;"><strong>Cenário D (Pessoas):</strong> ${pco.cenario_pessoas || '-'}</p>
            <p style="margin-top:4pt;"><strong>Escalonamento de Crise:</strong> ${pco.escalonamento_crise || '-'}</p>
          </div>
        ` : `<p class="badge badge-gray">Nenhum PCO cadastrado para este processo.</p>`}
      </div>

      <div class="section">
        <div class="section-title">4. Plano de Recuperação de Desastres de TI (PRD - ISO 27031)</div>
        ${prd ? `
          <table>
            <tr><th>Status de Aprovação</th><th>Versão</th><th>Última Revisão</th></tr>
            <tr>
              <td><span class="badge ${prd.status_aprovacao === 'Aprovado' ? 'badge-green' : 'badge-orange'}">${prd.status_aprovacao}</span></td>
              <td>${prd.versao}</td>
              <td>${prd.atualizado_em ? new Date(prd.atualizado_em).toLocaleDateString('pt-BR') : 'Sem atualização'}</td>
            </tr>
          </table>
          <div style="margin-top: 6pt; font-size: 8.5pt;">
            <p><strong>Escopo de TI:</strong> ${prd.escopo_ti || '-'}</p>
            <p style="margin-top:4pt;"><strong>RTO do Site Alternativo:</strong> ${prd.rto_site_alternativo ? `${prd.rto_site_alternativo} min` : '-'}</p>
            <p style="margin-top:4pt;"><strong>Procedimentos de Backup:</strong> ${prd.procedimentos_backup || '-'}</p>
            <p style="margin-top:4pt;"><strong>Plano de Failover/Switchback:</strong> ${prd.plano_failover || '-'}</p>
          </div>
        ` : `<p class="badge badge-gray">Nenhum PRD cadastrado para este processo.</p>`}
      </div>

      ${ativosRows ? `
      <div class="section">
        <div class="section-title">5. Ativos de Tecnologia Vinculados</div>
        <table>
          <tr><th>ID</th><th>Nome do Ativo</th><th>Tipo</th><th>Criticidade</th><th>Vencimento Suporte</th></tr>
          ${ativosRows}
        </table>
      </div>` : ''}

      ${riscosRows ? `
      <div class="section">
        <div class="section-title">6. Matriz de Riscos Dinâmicos</div>
        <table>
          <tr><th>ID</th><th>Título do Risco</th><th>Prob. x Imp.</th><th>Risco Residual</th><th>Mitigacao</th></tr>
          ${riscosRows}
        </table>
      </div>` : ''}

      ${incidentesRows ? `
      <div class="section">
        <div class="section-title">7. Histórico de Incidentes e Tracking de RTO</div>
        <table>
          <tr><th>ID</th><th>Descrição</th><th>Status</th><th>RTO Meta</th><th>RTO Real</th></tr>
          ${incidentesRows}
        </table>
      </div>` : ''}

      ${intervenientesRows ? `
      <div class="section">
        <div class="section-title">8. Intervenientes e Acionamentos de Emergência</div>
        <table>
          <tr><th>Nome</th><th>Cargo</th><th>Papel no Plano</th><th>E-mail</th><th>Telefone</th></tr>
          ${intervenientesRows}
        </table>
      </div>` : ''}
    `;
  }
};
