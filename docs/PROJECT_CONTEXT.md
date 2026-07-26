# 🧠 MEMÓRIA PERSISTENTE DO PROJETO — GCN APP (ISO 22301 & ISO 27031)

> **Documento de Continuidade para o Agente AI / Desenvolvedor**  
> Última Atualização: 25 de Julho de 2026  
> Repositório: `https://github.com/andliassource/GCN_app.git`  
> Ambiente de Produção: `https://gcn-projeto.web.app` (Firebase Hosting)

---

## 📌 1. Visão Geral e Propósito do Sistema

O **GCN Master** é um sistema corporativo web desenvolvido em React + Vite para automação e gestão de **Continuidade de Negócios (ISO 22301:2020)** e **Prontidão de TI / Recuperação de Desastres (ISO 27031:2011)**.

### Papéis das Linhas de Defesa
- **1ª Linha (Áreas de Negócio/Apoio/TIC):** Elaboram e mantêm os planos operacionais (PCO) e de recuperação de desastres (PRD).
- **2ª Linha (GERIC - Gestão de Riscos e GCN):** Define a metodologia, supervisão, realiza a **Validação Inicial de 2ª Linha** e submete os planos homologados para decisão do Comitê Conti.
- **3ª Linha (Auditoria Interna/Externa):** Consome os relatórios, evidências de simulados e logs de auditoria sem permissão de alteração.

---

## ⚖️ 2. Workflow de Aprovação em 4 Alçadas (Norma ISO 22301 §8.4.5)

O fluxo de aprovação é estritamente sequencial e rastreável. Cada plano transita pelos seguintes estados:

```
[Rascunho / Área] 
       │ (Enviar para GERIC)
       ▼
[1. Pendente GERIC] ──────► Button: "Validar e Encaminhar" (GERIC dá o aval inicial de 2ª Linha)
       │ (GERIC Valida)
       ▼
[2. Pendente TIC] ────────► Button: "Conceder Aval TIC -> Gerente" (Valida redundância, link DR e verificação de ANS)
       │ (TIC Aprova)       * Se não houver ANS no contrato, permite "Registrar Dispensa Formal" com justificativa.
       ▼
[3. Pendente Gerente Exec] ► Button: "Assinar e Enviar ao Comitê" (Assinatura do Gerente Executivo proprietário da unidade)
       │ (Gerente Assina)
       ▼
[4. Pendente Comitê] ─────► Button: "Registrar Vigência (Conti)" (Deliberação e registro de ata no Comitê Conti / Geemp)
       │ (Comitê Delibera)
       ▼
✅ [Vigente] ──────────────► Plano oficial ativo por 12 meses. Libera o download do PDF Corporativo Oficial.
```

*Nota Importante de Nomenclatura:* A GERIC **não aprova** na 1ª alçada; ela realiza a **"Validação Inicial GERIC (2ª Linha)"** para verificar se o plano atende aos requisitos metodológicos antes do envio à TIC.

---

## 🛠️ 3. Principais Módulos e Componentes do Código

| Componente | Arquivo (`src/components/`) | Responsabilidade Principal |
|---|---|---|
| **Workflow de Alçadas** | `GovernancaAprovacao.jsx` | Interface de aprovação por alçadas com Stepper visual por card, modais de parecer obrigatório e log de auditoria retrátil. |
| **Editor Inteligente PCO** | `PlanosRecuperacao.jsx` | Editor com 7 abas, formulários estruturados em 4 cenários (A, B, C, D), tabela de ativos com RTO/RPO por sistema, alertas de Ponto Único de Falha (Multi-Vendor) e botão ✨ *Sugerir Texto*. |
| **Simulados & Testes** | `TestesExercicios.jsx` | Simulador interativo de exercícios de mesa (Tabletop), cadastro de evidências e exportação da **Ata de Simulado em PDF (ISO 22301 §9.2)**. |
| **Serviço de PDF** | `src/services/pdfService.js` | Templates HTML/CSS parametrizados para PCO corporativo (com capa, Seção 0 de assinaturas e marca d'água) e Ata de Simulado. |
| **Notificações em Tempo Real** | `src/services/notificationService.js` | Disparo automático de notificações para a caixa de entrada dos responsáveis em cada transição ou devolução de alçada. |
| **Banco de Dados Mock/LocalStorage** | `src/services/db.js` | Persistência local (atualmente na versão `db_version: "7.0"`), responsável pela normalização automática de status legados e CRUDs. |
| **Contexto de Autenticação / RBAC** | `src/contexts/AuthContext.jsx` | Controle de sessão com perfis: `admin_geric`, `tic`, `gerente_exec`, `gestor_area`, `conti` e `visualizador`. |
| **Menu Lateral & RBAC** | `Sidebar.jsx` | Menu responsivo com filtro de abas por papel (ex: aba de *Configurações do Sistema* visível apenas para `admin_geric`). |

---

## 💾 4. Estrutura do Banco de Dados (`src/services/db.js` v7.0)

A versão atual do banco de dados é a **`7.0`**. Se houver alterações estruturais nas tabelas em sessões futuras, lembre-se de incrementar `db_version` no `db.js`.

### Campos Críticos no Objeto PCO (`planosContinuidade`):
```javascript
{
  id_pco: "PCO-COB-001",
  id_processo: "PROC-COB-001",
  id_gerencia: "GER-NEG01",
  status_aprovacao: "Vigente", // "Pendente GERIC", "Devolvido GERIC", "Pendente TIC", "Pendente Gerente Exec", "Pendente Comitê", "Vigente"
  versao: "2.1.0",
  vigente_ate: "2027-01-01",
  ans_vigente: "CTR-001",
  dispensa_ans: null,
  parecer_geric: "Revisão concluída. ANS vigente confirmado.",
  parecer_tic: "Aval técnico concedido. PRD vinculado e validado.",
  parecer_gerente: "Plano assinado pelo Gerente Executivo da área.",
  parecer_comite: "Deliberação Conti Ata 01/2026 — PCO aprovado por unanimidade.",
  workflow_log: [
    { status: "Pendente GERIC", aprovador: "Marcos Costa (gestor_area)", data: "2026-01-01T09:00:00", parecer: "..." },
    { status: "Pendente TIC", aprovador: "Roberto Carlos (admin_geric)", data: "2026-01-03T10:00:00", parecer: "..." }
  ]
}
```

---

## 🚀 5. Guias Rápidos para o Desenvolvedor / AI na Próxima Sessão

### Como iniciar o ambiente local:
```bash
cd C:\Projetos\GCN_app
npm install
npm run dev
```
Navegador abrirá em `http://localhost:5173`.

### Como fazer o build e deploy para produção (Firebase):
```bash
npm run build
npx firebase-tools deploy --only hosting
```
URL de produção: `https://gcn-projeto.web.app`

### Como versionar no Git:
```bash
git add -A
git commit -m "sua mensagem"
git push
```

---

## ✅ Status Atual do Projeto

- **Workflow 4 Alçadas:** Totalmente implementado, testado e com nomenclaturas ajustadas conforme a regra de 2ª linha.
- **Normalização de Dados:** O `db.js` v7.0 converte automaticamente planos legados para os novos status do workflow.
- **Deploy:** Atualizado e no ar tanto no GitHub quanto no Firebase Hosting.
- **Documentação:** README.md completo na raiz e este documento de memória gravado no cérebro da máquina.
