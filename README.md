# 🛡️ GCN Master — Sistema de Gestão de Continuidade de Negócios (v11.0)

> **Conformidade Regulatória Rigorosa:** ABNT NBR ISO 22301:2020 (Gestão de Continuidade de Negócios) & ISO 27031:2011 (Prontidão de TI para Continuidade).

---

## 📌 Visão Geral

O **GCN Master** é uma plataforma corporativa web desenvolvida para orquestrar e automatizar todo o ciclo de vida da Gestão de Continuidade de Negócios e Recuperação de Desastres de TI em organizações de grande porte e órgãos regulados (BACEN, CVM, SUSEP).

A aplicação faz a transição completa da governança tradicional (baseada em planilhas isoladas) para uma **arquitetura orientada a dados com inteligência operacional**, garantindo rastreabilidade mandatória, segregação de funções (RBAC de 1ª e 2ª Linha) e aprovações por alçadas normativas.

---

## 🏛️ Arquitetura Funcional & Módulos

### 1. 🎯 Matriz de Priorização de Negócios (4×4) & Monte Carlo
- **Matriz 4×4 Tridimensional**: Classifica negócios por **Impacto no Negócio (0–100)** vs **Probabilidade/Urgência (0–60)** em 4 quadrantes (Q1 a Q4 - Prioridade Máxima).
- **Métricas de Impacto Financeiro**: Incorpora **Faturamento Anual (30%)**, **Perda Financeira/Hora (25%)**, Criticidade do Processo (20%), Ativo CMDB (15%) e Histórico de Incidentes (10%).
- **Indicadores Gerel (Ciclo de Vida do Negócio)**: Ponderação estratégica de `Crescimento` (+20%), `Maturidade` (1.0x), `Declínio` (0.5x) e `Sunset` (0.3x). Negócios em declínio recebem redução de score para evitar investimentos desnecessários em DR.
- **Simulador Monte Carlo (1.000 iterações)**: Simulação estocástica de perdas anualizadas esperadas com gráfico de histograma e cálculo de percentis **P50, P90 e P95**.
- **Accountability das Três Linhas**: Atribuição clara por processo de quem executa os Testes (1ª Linha), quem Verifica (2ª Linha - GERIC) e quem detém o Accountability executivo.

### 2. 🏢 Painel de Contingências das Áreas de Apoio
- **Gesap (Administração Predial)**: Simulador de Evacuação Predial interativo com cronômetro em tempo real (SLA ABNT NBR 15219 de 15min) + 6 cenários realistas (Incêndio 193, Alagamento, HVAC/CPD, Gerador/UPS, Ameaça de Bomba PM 190, Vazamento de Gás NR-15).
- **Gepes (Pessoas / RH)**: 6 cenários (Greves, Pandemia/Epidemia, Falha na Folha CLT 459, eSocial/DCTFWeb em Risco, Acidente de Trabalho CAT 24h, Perda de Liderança Crítica).
- **Gefic (Financeiro e Tesouraria)**: 6 cenários (Descumprimento Tributário SPED/EFD/DCTF, Bloqueio Judicial BacenJud/SISBAJUD, Falha de ERP/CNAB, Fraude Financeira Lei 7.492/86, Contingência Contábil CPC 25, Crise de Liquidez).
- **Gesuc (Suprimentos e Contratos)**: 5 cenários (Falha de Single Vendor, Fornecedor em Recuperação Judicial, Ruptura de Cadeia Logística, Gap Contratual, Inconformidade LGPD/Compliance ANPD).

### 3. 🚨 Central de Crises & Disparo de Comunicados (Gemac & Geemp)
- **Disparo MNS em Massa**: Segregação estrita para uso exclusivo da Gemac (`comunicacao_crise`) e Geric (`admin_geric`).
- **Atas do Comitê de Crise**: Presididas por Geemp (`gov_corporativa`), Geric e Secretaria Conti.

### 4. 🏢 Estrutura Organizacional & Gestão de Riscos Dinâmicos
- **Segregação de 1ª e 2ª Linha**: Vinculação de processos críticos às gerências executivas proprietárias (1ª linha), sob supervisão e governança da GERIC (2ª linha).
- **Matriz de Riscos Dinâmicos**: Cálculo de Score de Risco Inerente vs. Residual (Probabilidade x Impacto), com tooltips explicativos flutuantes e vinculo direto a planos de ação mitigatórios.

### 5. 📑 Ingestão de Contratos Críticos & Notificação de Ponto Único
- **Gestão Contratual & SLAs**: Vinculação de contratos externos a processos de negócios com controle de datas de vigência e multas.
- **Alerta de Ponto de Falha Único (Single Point of Failure)**: Notificação automática quando um processo crítico depende exclusivamente de um único fornecedor sem contingência cadastrada.

### 6. 📊 Análise de Impacto de Negócio (AIN / BIA)
- **Métricas Chave de Continuidade**: RTO (Recovery Time Objective), RPO (Recovery Point Objective) e MTDCN (Maximum Tolerable Period of Disruption).

### 7. ⚡ Editor Inteligente de Planos PCO & PRD (v5.0)
- Formulários estruturados nos Cenários A (Acesso Predial), B (Sistemas/TI), C (Fornecedores) e D (Absenteísmo/Pessoas).

### 8. ⚖️ Workflow de Aprovação em 4 Alçadas (ISO 22301 §8.4.5)
```
[1ª Linha (Elaborador)] ──► [1ª Alçada — GERIC (2ª Linha)] ──► [2ª Alçada — Geati (TIC)] ──► [3ª Alçada — Gerente Exec] ──► [4ª Alçada — Comitê Conti / Geemp] ──► ✅ VIGENTE
```

---

## 🔐 Matriz de Perfis e Permissões (RBAC)

| Perfil (`role`) | Gerência | Descrição e Atribuições no Sistema |
|---|---|---|
| `admin_geric` | GERIC | **2ª Linha / Admin**. Acesso total, aprovação na 1ª e 4ª alçadas, matriz de riscos e priorização. |
| `gov_corporativa` | Geemp | **Governança Corporativa**. Comitê de crises, deliberação na 4ª alçada Conti e visão corporativa. |
| `comunicacao_crise` | Gemac | **Comunicação de Crises**. Autorização exclusiva para disparo de comunicados MNS em massa. |
| `apoio_predial` | Gesap | **Apoio Predial**. Evacuação predial, brigada, HVAC, geradores e manutenção física. |
| `apoio_pessoas` | Gepes | **Apoio RH**. Absenteísmo, greves, folha CLT 459, eSocial, CAT e sucessão de liderança. |
| `apoio_financeiro` | Gefic | **Apoio Financeiro**. Liberação de verbas, tributos (SPED/EFD/DCTF), BacenJud e liquidez. |
| `apoio_suprimentos` | Gesuc | **Apoio Suprimentos**. Single vendor, contratação emergencial e fornecedores em RJ. |
| `tic_governanca` | Geati | **Governança TIC**. Parecer de ANS/SLA de TI na 2ª alçada e governança de TIC. |
| `tic_executor` | Getic / Gesec / Gesit | **TI Executora**. DRP, ISO 27031, SOC/SIEM, clusters Kubernetes e links WAN. |
| `gestor_area` | Gecob / Gered / etc. | **1ª Linha de Defesa**. Elaboração de PCOs, testes de 1ª linha e dono do processo. |
| `gerente_exec` | Dites / Diope / Diafi | **Diretoria Executiva**. Signature da 3ª alçada e accountability final. |
| `conti` | Comitê Conti | **Secretaria Conti**. Deliberação formal de ata de vigência na 4ª alçada. |
| `visualizador` | Geral | **Auditor / Leitor**. Acesso somente leitura. |

---

## 🛠️ Tecnologias Utilizadas

- **Frontend Core:** React.js + Vite (JavaScript SPA)
- **Gráficos & Visualização:** Recharts (Scatter Plot 4x4, BarChart Monte Carlo)
- **Estilização:** Vanilla CSS3 + Tailwind CSS (suporte a Dark/Light Mode, glassmorphism e animações)
- **Ícones:** Lucide React
- **Persistência de Dados:** `src/services/db.js` (Mock localStorage v11.0, adaptável para Firestore/SQL)
- **Deploy & Hospedagem:** GitHub (`main`) & Firebase Hosting ([https://gcn-projeto.web.app](https://gcn-projeto.web.app))

---

## 🚀 Como Executar o Projeto Localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/andliassource/GCN_app.git

# 2. Entrar na pasta do projeto
cd GCN_app

# 3. Instalar dependências
npm install

# 4. Iniciar servidor local
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`.

---

## 📋 Conformidade Normativa & Mapeamento ISO

| Requisito Normativo | Seção ISO | Implementação no GCN Master |
|---|---|---|
| **Política e Objetivos de Continuidade** | ISO 22301 §5.2 | Governança & Avaliação NRGCN |
| **Análise de Impacto nos Negócios (BIA)** | ISO 22301 §8.2.2 | Módulo 3 — Análise de Impacto (AIN/BIA) |
| **Priorização Estratégica de Negócios** | ISO 22301 §8.2.3 / §8.3 | Matriz 4×4, Monte Carlo, Faturamento & Gerel |
| **Avaliação de Riscos** | ISO 22301 §8.2.3 | Módulo 1 — Estrutura & Riscos Dinâmicos |
| **Estratégias de Continuidade (Áreas de Apoio)** | ISO 22301 §8.3 | Painel de Apoio (Gesap, Gepes, Gefic, Gesuc) |
| **Planos e Procedimentos (PCO/PRD)** | ISO 22301 §8.4 / ISO 27031 | Editor de Planos & Failover por Ativo |
| **Estrutura de Resposta a Incidentes & Crises** | ISO 22301 §8.4.2 | Gestão de Crises & Disparo Gemac MNS |
| **Aprovação & Homologação de Planos** | ISO 22301 §8.4.5 | Workflow em 4 Alçadas (Geric, Geati, Exec, Conti) |
| **Programa de Exercícios e Testes** | ISO 22301 §9.2 | Testes por Cenário & Evacuação Predial |
| **Avaliação do Desempenho e Revisão** | ISO 22301 §9.3 | Revisões & Histórico de Versões |

---

## 📄 Licença e Propriedade

Desenvolvido para Gestão Corporativa de Continuidade de Negócios. Todos os direitos reservados.
