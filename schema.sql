-- ============================================================================
-- SCHEMA SQL INICIAL - SISTEMA DE GESTÃO DE CONTINUIDADE DE NEGÓCIOS (GCN/NRGCN)
-- Compatível com Azure SQL Database, SQL Server, PostgreSQL e MySQL.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: Contratos
-- ----------------------------------------------------------------------------
CREATE TABLE Contratos (
    id_contrato VARCHAR(50) NOT NULL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    valor_faturamento DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
    clausulas_risco TEXT,
    multas TEXT,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Tabela: ProcessosCriticos
-- ----------------------------------------------------------------------------
CREATE TABLE ProcessosCriticos (
    id_processo VARCHAR(50) NOT NULL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    id_contrato VARCHAR(50),
    criticidade VARCHAR(50) NOT NULL CHECK (criticidade IN ('Baixa', 'Média', 'Alta', 'Crítica')),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Processos_Contratos FOREIGN KEY (id_contrato) 
        REFERENCES Contratos(id_contrato) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- Tabela: Incidentes
-- ----------------------------------------------------------------------------
CREATE TABLE Incidentes (
    id_incidente VARCHAR(50) NOT NULL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL,
    local VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    tipo_incidente VARCHAR(100) NOT NULL,
    impacto VARCHAR(50) NOT NULL CHECK (impacto IN ('Baixo', 'Médio', 'Alto', 'Desastroso')),
    id_processo VARCHAR(50),
    medidas_mitigacao TEXT,
    resultado_resposta TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Incidentes_Processos FOREIGN KEY (id_processo) 
        REFERENCES ProcessosCriticos(id_processo) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- Tabela: AnaliseImpactoNegocio (AIN)
-- ----------------------------------------------------------------------------
CREATE TABLE AnaliseImpactoNegocio (
    id_ain VARCHAR(50) NOT NULL PRIMARY KEY,
    id_processo VARCHAR(50) UNIQUE, -- Cada processo crítico possui uma única AIN principal
    probabilidade VARCHAR(50) NOT NULL CHECK (probabilidade IN ('Rara', 'Pouco Provável', 'Provável', 'Muito Provável', 'Quase Certa')),
    impacto_financeiro VARCHAR(50) NOT NULL CHECK (impacto_financeiro IN ('Insignificante', 'Menor', 'Moderado', 'Maior', 'Catastrófico')),
    RTO INT NOT NULL,  -- Recovery Time Objective em minutos
    RPO INT NOT NULL,  -- Recovery Point Objective em minutos
    MTDCN INT NOT NULL, -- Maximum Tolerable Period of Disruption (MTD) em minutos
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_AIN_Processos FOREIGN KEY (id_processo) 
        REFERENCES ProcessosCriticos(id_processo) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Tabela: PlanosContinuidade (PCO)
-- ----------------------------------------------------------------------------
CREATE TABLE PlanosContinuidade (
    id_pco VARCHAR(50) NOT NULL PRIMARY KEY,
    id_processo VARCHAR(50) UNIQUE, -- Um plano PCO por processo crítico
    estrategia_recuperacao TEXT NOT NULL,
    responsabilidades TEXT NOT NULL,
    recursos_necessarios TEXT NOT NULL,
    status_aprovacao VARCHAR(50) DEFAULT 'Pendente' CHECK (status_aprovacao IN ('Pendente', 'Em Revisão', 'Aprovado', 'Rejeitado')),
    versao VARCHAR(20) DEFAULT '1.0.0',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_PCO_Processos FOREIGN KEY (id_processo) 
        REFERENCES ProcessosCriticos(id_processo) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Tabela: PlanosRecuperacaoDesastres (PRD)
-- ----------------------------------------------------------------------------
CREATE TABLE PlanosRecuperacaoDesastres (
    id_prd VARCHAR(50) NOT NULL PRIMARY KEY,
    id_processo VARCHAR(50) UNIQUE, -- Um plano PRD por processo crítico
    procedimentos_restauracao TEXT NOT NULL,
    local_backup VARCHAR(255) NOT NULL,
    frequencia_backup VARCHAR(100) NOT NULL,
    comunicacao_emergencia TEXT NOT NULL,
    status_aprovacao VARCHAR(50) DEFAULT 'Pendente' CHECK (status_aprovacao IN ('Pendente', 'Em Revisão', 'Aprovado', 'Rejeitado')),
    versao VARCHAR(20) DEFAULT '1.0.0',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_PRD_Processos FOREIGN KEY (id_processo) 
        REFERENCES ProcessosCriticos(id_processo) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Tabela: TestesAvaliacoes
-- ----------------------------------------------------------------------------
CREATE TABLE TestesAvaliacoes (
    id_teste VARCHAR(50) NOT NULL PRIMARY KEY,
    id_pco VARCHAR(50),
    id_prd VARCHAR(50),
    data_teste DATE NOT NULL,
    resultado VARCHAR(50) NOT NULL CHECK (resultado IN ('Sucesso', 'Sucesso Parcial', 'Falha')),
    areas_melhoria TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Testes_PCO FOREIGN KEY (id_pco) 
        REFERENCES PlanosContinuidade(id_pco) ON DELETE SET NULL,
    CONSTRAINT FK_Testes_PRD FOREIGN KEY (id_prd) 
        REFERENCES PlanosRecuperacaoDesastres(id_prd) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- Tabela: RevisoesAtualizacoes
-- ----------------------------------------------------------------------------
CREATE TABLE RevisoesAtualizacoes (
    id_revisao VARCHAR(50) NOT NULL PRIMARY KEY,
    id_pco VARCHAR(50),
    id_prd VARCHAR(50),
    data_revisao DATE NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    atualizacao_realizada TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Revisoes_PCO FOREIGN KEY (id_pco) 
        REFERENCES PlanosContinuidade(id_pco) ON DELETE SET NULL,
    CONSTRAINT FK_Revisoes_PRD FOREIGN KEY (id_prd) 
        REFERENCES PlanosRecuperacaoDesastres(id_prd) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- Tabela: GovernancaGCN
-- ----------------------------------------------------------------------------
CREATE TABLE GovernancaGCN (
    id_governanca VARCHAR(50) NOT NULL PRIMARY KEY,
    responsavel VARCHAR(255) NOT NULL,
    comunicacao TEXT NOT NULL,
    treinamento TEXT NOT NULL,
    id_processo VARCHAR(50),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Governanca_Processos FOREIGN KEY (id_processo) 
        REFERENCES ProcessosCriticos(id_processo) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- Tabela: AvaliacaoNRGCN
-- ----------------------------------------------------------------------------
CREATE TABLE AvaliacaoNRGCN (
    id_avaliacao VARCHAR(50) NOT NULL PRIMARY KEY,
    id_processo VARCHAR(50) UNIQUE, -- Uma avaliação NRGCN principal por processo crítico
    nivel_resiliencia DECIMAL(3, 2) NOT NULL DEFAULT 1.00 CHECK (nivel_resiliencia >= 1.00 AND nivel_resiliencia <= 5.00), -- Escala de 1 a 5
    aderencia_ISO22301 DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (aderencia_ISO22301 >= 0.00 AND aderencia_ISO22301 <= 100.00), -- 0 a 100%
    metricas_utilizadas TEXT,
    grafico_resultado TEXT, -- Armazena metadados ou referências do gráfico
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_NRGCN_Processos FOREIGN KEY (id_processo) 
        REFERENCES ProcessosCriticos(id_processo) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Índices para otimização de consultas e chaves estrangeiras
-- ----------------------------------------------------------------------------
CREATE INDEX IX_Processos_Contrato ON ProcessosCriticos(id_contrato);
CREATE INDEX IX_Incidentes_Processo ON Incidentes(id_processo);
CREATE INDEX IX_AIN_Processo ON AnaliseImpactoNegocio(id_processo);
CREATE INDEX IX_PCO_Processo ON PlanosContinuidade(id_processo);
CREATE INDEX IX_PRD_Processo ON PlanosRecuperacaoDesastres(id_processo);
CREATE INDEX IX_Testes_PCO ON TestesAvaliacoes(id_pco);
CREATE INDEX IX_Testes_PRD ON TestesAvaliacoes(id_prd);
CREATE INDEX IX_Revisoes_PCO ON RevisoesAtualizacoes(id_pco);
CREATE INDEX IX_Revisoes_PRD ON RevisoesAtualizacoes(id_prd);
CREATE INDEX IX_Governanca_Processo ON GovernancaGCN(id_processo);
CREATE INDEX IX_NRGCN_Processo ON AvaliacaoNRGCN(id_processo);
