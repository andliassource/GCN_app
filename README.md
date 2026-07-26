# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

# 🛡️ GCN Master — Sistema de Gestão de Continuidade de Negócios

> **Conformidade Regulatória Rigorosa:** ABNT NBR ISO 22301:2020 (Gestão de Continuidade de Negócios) & ISO 27031:2011 (Prontidão de TI para Continuidade).

---

## 📌 Visão Geral

O **GCN Master** é uma plataforma corporativa web desenvolvida para orquestrar e automatizar todo o ciclo de vida da Gestão de Continuidade de Negócios e Recuperação de Desastres de TI em organizações de grande porte e órgãos regulados (BACEN, CVM, SUSEP).

A aplicação faz a transição completa da governança tradicional (baseada em planilhas isoladas) para uma **arquitetura orientada a dados com inteligência operacional**, garantindo rastreabilidade mandatória, segregação de funções (RBAC de 1ª e 2ª Linha) e aprovações por alçadas normativas.

---

## 🏛️ Arquitetura Funcional & Módulos

### 1. 🏢 Estrutura Organizacional & Gestão de Riscos Dinâmicos
- **Segregação de 1ª e 2ª Linha:** Vinculação de processos críticos às gerências executivas proprietárias (1ª linha), sob supervisão e governança da GERIC (2ª linha).
- **Matriz de Riscos Dinâmicos:** Cálculo de Score de Risco Inerente vs. Residual (Probabilidade x Impacto), com tooltips explicativos flutuantes e vinculo direto a planos de ação mitigatórios.

### 2. 📑 Ingestão de Contratos Críticos & Notificação de Ponto Único
- **Gestão Contratual & SLAs:** Vinculação de contratos externos a processos de negócios com controle de datas de vigência e multas.
- **Alerta de Ponto de Falha Único (Single Point of Failure):** Notificação automática quando um processo crítico depende exclusivamente de um único fornecedor sem contingência cadastrada (Multi-Vendor).
- **Controle de Notificações Multi-Destinatário:** Alertas visuais e e-mails automáticos para gestores das áreas e fiscais GERIC em prazos de vencimento de 90, 60 e 30 dias.

### 3. 📊 Análise de Impacto de Negócio (AIN / BIA)
- **Métricas Chave de Continuidade:**
  - **RTO (Recovery Time Objective):** Tempo máximo tolerável para restabelecimento da operação.
  - **RPO (Recovery Point Objective):** Limite máximo aceitável de perda de dados.
  - **MTDCN (Maximum Tolerable Period of Disruption):** Tempo máximo antes de ocorrerem danos irreparáveis ou sanções regulatórias.
- **Gráficos Comparativos:** Visualização da curva de impacto financeiro e operacional acumulado ao longo do tempo.

### 4. ⚡ Editor Inteligente de Planos PCO & PRD (v5.0)
- **Formulários Estruturados em 4 Cenários Normativos:**
  - **Cenário A (Acesso Predial / Home Office):** Limiares de % mínimo operacional, % crítico e unidade de contingência física.
  - **Cenário B (Sistemas & TI):** Tabela dinâmica por ativo de TI com RTO/RPO individual por sistema, link de contingência (DR) e rito de restauração.
  - **Cenário C (Fornecedores Críticos):** Fornecedor principal vs. alternativo, contato do fiscal e rito de contingência contratual.
  - **Cenário D (Absenteísmo & Pessoas):** Limiares de ausência (Modo Degradado vs. Modo Crítico) e indicação do substituto de liderança.
- **Botão ✨ Sugerir Texto:** Inteligência baseada em templates dinâmicos que injetam o nome do processo, SLAs, ativos e fornecedores reais em cláusulas padronizadas ISO.

### 5. ⚖️ Workflow de Aprovação em 4 Alçadas (ISO 22301 §8.4.5)
O sistema exige tramitação estruturada de aprovações com parecer obrigatório e notificações em cada etapa:

```
[Área (1ª Linha)] 
       │ (Enviar)
       ▼
[1ª Alçada — GERIC] ──(Aprovar)──► [2ª Alçada — TIC / ANS] ──(Aprovar)──► [3ª Alçada — Gerente Exec] ──(Assinar)──► [4ª Alçada — Comitê Conti] ──► ✅ VIGENTE
       │                                  │                                      │                                      │
  (Devolver)                         (Devolver)                             (Devolver)                             (Reprovar)
       └──────────────────────────────────┴──────────────────────────────────────┴──────────────────────────────────────┘
```

- **Verificação de ANS pela TIC:** Na 2ª alçada, a TIC deve confirmar a vigência do ANS/SLA do processo ou registrar uma **Dispensa Formal Justificável**.
- **Log de Auditoria:** Rastro histórico por plano contendo timestamps, aprovadores, alçadas e pareceres na íntegra.

### 6. 🧪 Testes por Cenário & Exercícios de Mesa (ISO 22301 §9.2)
- **Simulador de Mesa (Tabletop Simulator):** Roteiros interativos com pontuação dinâmica por decisão.
- **Geração de Ata de Simulado em PDF:** Emissão da ata oficial de teste vinculando automaticamente os intervenientes do PCO, resultados por cenário e lições aprendidas.

### 7. 📄 Exportação de PDFs Corporativos Oficiais
- **PCO Corporativo:** Capa oficial, resumo executivo, tabela de ativos com failover, e **Quadro de Homologação (Seção 0)** com os pareceres e selos das 4 alçadas.
- **Proteção Regulatória:** Download oficial bloqueado para planos que ainda não atingiram o status `Vigente`, com emissão de cópia de rascunho mediante aviso.

---

## 🔐 Matriz de Perfis e Permissões (RBAC)

| Perfil (`role`) | Descrição | Permissões no Sistema |
|---|---|---|
| `admin_geric` | Administrador / Riscos & GCN (2ª Linha) | Acesso total a todos os módulos, aprovação de 1ª Alçada GERIC, aprovação pelo Comitê Conti, edição de configurações globais e matriz de riscos. |
| `tic` | Infraestrutura & Governança de TI | Acesso aos processos da TIC, concessão de Aval Técnico (2ª Alçada TIC), verificação de ANS e cadastro de PRDs de TI (ISO 27031). |
| `gerente_exec` | Gerente Executivo da Área | Visão dos processos da gerência, assinatura do plano (3ª Alçada) e acompanhamento de planos de ação. |
| `gestor_area` | Gestor de Processo (1ª Linha) | Edição de PCOs da sua gerência, envio de planos para revisão GERIC, visualização de notificações e simulados. |
| `conti` | Secretária / Membro do Comitê Conti | Registro de deliberações de atas do Comitê Conti (4ª Alçada) para concessão de status Vigente. |
| `visualizador` | Auditor / Leitor | Acesso de leitura aos dashboards e relatórios sem permissão de alteração. |

---

## 🛠️ Tecnologias Utilizadas

- **Frontend Core:** React.js + Vite (JavaScript SPA)
- **Estilização:** Vanilla CSS3 + Tailwind CSS (tokens de design, suporte nativo a Dark/Light Mode, glassmorphism e animações)
- **Ícones:** Lucide React
- **Persistência de Dados:** Camada de serviço portável (`src/services/db.js` com suporte a `localStorage` e adaptável para Firebase Firestore / Azure Dataverse / SQL Server)
- **Serviço de PDF:** Gerador HTML2PDF embutido (`pdfService.js`) com templates corporativos parametrizados
- **Deploy & Hospedagem:** GitHub (Código Fonte) & Firebase Hosting (Produção Web)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js:** v18.0.0 ou superior
- **npm:** v9.0.0 ou superior

### Passo a Passo

```bash
# 1. Clonar o repositório
git clone https://github.com/andliassource/GCN_app.git

# 2. Entrar na pasta do projeto
cd GCN_app

# 3. Instalar as dependências
npm install

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível no navegador em `http://localhost:5173`.

### Build e Deploy

```bash
# Gerar o bundle de produção
npm run build

# Fazer o deploy no Firebase Hosting (exige firebase-tools autenticado)
npx firebase-tools deploy --only hosting
```

---

## 📋 Conformidade Normativa & Mapeamento ISO

| Requisito Normativo | Seção ISO | Implementação no GCN Master |
|---|---|---|
| **Política e Objetivos de Continuidade** | ISO 22301 §5.2 | Módulo de Governança & Avaliação NRGCN |
| **Análise de Impacto nos Negócios (BIA)** | ISO 22301 §8.2.2 | Módulo 3 — Análise de Impacto (AIN/BIA) |
| **Avaliação de Riscos** | ISO 22301 §8.2.3 | Módulo 1 — Estrutura & Riscos Dinâmicos |
| **Estratégias de Continuidade** | ISO 22301 §8.3 | Módulo 4 — PCO v5.0 (Cenários A, B, C, D) |
| **Planos e Procedimentos (PCO/PRD)** | ISO 22301 §8.4 / ISO 27031 | Módulo 4 — Editor de Planos & Failover por Ativo |
| **Estrutura de Resposta a Incidentes & Crises** | ISO 22301 §8.4.2 | Módulo 8 — Gestão de Crises & Incidentes |
| **Aprovação & Homologação de Planos** | ISO 22301 §8.4.5 | Módulo 7 — Workflow em 4 Alçadas |
| **Programa de Exercícios e Testes** | ISO 22301 §9.2 | Módulo 5 — Testes por Cenário & Ata PDF |
| **Avaliação do Desempenho e Revisão** | ISO 22301 §9.3 | Módulo 6 — Revisões & Histórico de Versões |

---

## 📄 Licença e Propriedade

Desenvolvido para Gestão Corporativa de Continuidade de Negócios. Todos os direitos reservados.
