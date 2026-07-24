-- ============================================================================
-- SCHEMA SQL ATUALIZADO - SISTEMA DE GESTÃO DE CONTINUIDADE DE NEGÓCIOS (GCN/NRGCN)
-- Compatível com Azure SQL Database, SQL Server, PostgreSQL e MySQL.
-- Inclui Hierarquia Organizacional, Riscos, Ativos e 4 Cenários de PCO/PRD.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: Diretorias
-- ----------------------------------------------------------------------------
CREATE TABLE Diretorias (
    id_diretoria VARCHAR(50) NOT NULL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    sigla VARCHAR(20) NOT NULL UNIQUE
);

-- ----------------------------------------------------------------------------
-- Tabela: Gerencias
-- ----------------------------------------------------------------------------
CREATE TABLE Gerencias (
    id_gerencia VARCHAR(50) NOT NULL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    sigla VARCHAR(20) NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Negócios', 'Apoio', 'TIC', 'Governança')),
    id_diretoria VARCHAR(50),
    CONSTRAINT FK_Gerencias_Diretorias FOREIGN KEY (id_diretoria) 
        REFERENCES Diretorias(id_diretoria) ON DELETE SET NULL
);

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
    id_gerencia VARCHAR(50), -- Vínculo da gerência responsável pelos contratos (Ex: Gered)
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Contratos_Gerencias FOREIGN KEY (id_gerencia)
        REFERENCES Gerencias(id_gerencia) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- Tabela: ProcessosCriticos
-- ----------------------------------------------------------------------------
CREATE TABLE ProcessosCriticos (
    id_processo VARCHAR(50) NOT NULL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    id_contrato VARCHAR(50), -- Pode ser nulo para processos de apoio (Ex: Gepes, Gefic)
    criticidade VARCHAR(50) NOT NULL CHECK (criticidade IN ('Baixa', 'Média', 'Alta', 'Crítica')),
    id_gerencia VARCHAR(50), -- Vínculo da gerência responsável (Ex: Gered, Gesap, Getic)
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Processos_Contratos FOREIGN KEY (id_contrato) 
        REFERENCES Contratos(id_contrato) ON DELETE SET NULL,
    CONSTRAINT FK_Processos_Gerencias FOREIGN KEY (id_gerencia)
        REFERENCES Gerencias(id_gerencia) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- Tabela: Riscos
-- ----------------------------------------------------------------------------
CREATE TABLE Riscos (
    id_risco VARCHAR(50) NOT NULL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    probabilidade VARCHAR(50) NOT NULL CHECK (probabilidade IN ('Rara', 'Pouco Provável', 'Provável', 'Muito Provável', 'Quase Certa')),
    impacto VARCHAR(50) NOT NULL CHECK (impacto IN ('Insignificante', 'Menor', 'Moderado', 'Maior', 'Catastrófico')),
    id_processo VARCHAR(50),
    CONSTRAINT FK_Riscos_Processos FOREIGN KEY (id_processo)
        REFERENCES ProcessosCriticos(id_processo) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Tabela: AtivosSistemas
-- ----------------------------------------------------------------------------
CREATE TABLE AtivosSistemas (
    id_ativo VARCHAR(50) NOT NULL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Sistema', 'Link', 'Servidor')),
    criticidade VARCHAR(50) NOT NULL CHECK (criticidade IN ('Baixa', 'Média', 'Alta', 'Crítica'))
);

-- ----------------------------------------------------------------------------
-- Tabela de Associação: ProcessosCriticosAtivos
-- ----------------------------------------------------------------------------
CREATE TABLE ProcessosCriticosAtivos (
    id_processo VARCHAR(50) NOT NULL,
    id_ativo VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_processo, id_ativo),
    CONSTRAINT FK_PCA_Processos FOREIGN KEY (id_processo)
        REFERENCES ProcessosCriticos(id_processo) ON DELETE CASCADE,
    CONSTRAINT FK_PCA_Ativos FOREIGN KEY (id_ativo)
        REFERENCES AtivosSistemas(id_ativo) ON DELETE CASCADE
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
    id_processo VARCHAR(50) UNIQUE,
    probabilidade VARCHAR(50) NOT NULL CHECK (probabilidade IN ('Rara', 'Pouco Provável', 'Provável', 'Muito Provável', 'Quase Certa')),
    impacto_financeiro VARCHAR(50) NOT NULL CHECK (impacto_financeiro IN ('Insignificante', 'Menor', 'Moderado', 'Maior', 'Catastrófico')),
    RTO INT NOT NULL,  -- em minutos
    RPO INT NOT NULL,  -- em minutos
    MTDCN INT NOT NULL, -- em minutos
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_AIN_Processos FOREIGN KEY (id_processo) 
        REFERENCES ProcessosCriticos(id_processo) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Tabela: PlanosContinuidade (PCO) - ISO 22301
-- ----------------------------------------------------------------------------
CREATE TABLE PlanosContinuidade (
    id_pco VARCHAR(50) NOT NULL PRIMARY KEY,
    id_processo VARCHAR(50) UNIQUE,
    estrategia_recuperacao TEXT NOT NULL,
    responsabilidades TEXT NOT NULL,
    recursos_necessarios TEXT NOT NULL,
    
    -- Os 4 cenários de crise obrigatórios
    cenario_acesso TEXT NOT NULL,       -- Bloqueio de acesso predial / home office
    cenario_sistemas TEXT NOT NULL,     -- Queda de sistemas com passo a passo e contatos
    cenario_fornecedores TEXT NOT NULL, -- Falha de fornecedor crítico
    cenario_pessoas TEXT NOT NULL,      -- Redução drástica de pessoal (indisponibilidade)
    escalonamento_crise TEXT NOT NULL,  -- Gatilhos de acionamento para PRD/PGC
    
    status_aprovacao VARCHAR(50) DEFAULT 'Pendente' CHECK (status_aprovacao IN ('Pendente', 'Em Revisão', 'Aprovado', 'Rejeitado')),
    versao VARCHAR(20) DEFAULT '1.0.0',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_PCO_Processos FOREIGN KEY (id_processo) 
        REFERENCES ProcessosCriticos(id_processo) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Tabela: PlanosRecuperacaoDesastres (PRD) - ISO 27031
-- ----------------------------------------------------------------------------
CREATE TABLE PlanosRecuperacaoDesastres (
    id_prd VARCHAR(50) NOT NULL PRIMARY KEY,
    id_processo VARCHAR(50) UNIQUE,
    procedimentos_restauracao TEXT NOT NULL,
    local_backup VARCHAR(255) NOT NULL,
    frequencia_backup VARCHAR(100) NOT NULL,
    comunicacao_emergencia TEXT NOT NULL,
    
    -- Ativação de War Room (Sala de Guerra) conforme ISO 27031
    procedimento_war_room TEXT NOT NULL,
    
    status_aprovacao VARCHAR(50) DEFAULT 'Pendente' CHECK (status_aprovacao IN ('Pendente', 'Em Revisão', 'Aprovado', 'Rejeitado')),
    versao VARCHAR(20) DEFAULT '1.0.0',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_PRD_Processos FOREIGN KEY (id_processo) 
        REFERENCES ProcessosCriticos(id_processo) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Tabela: AtasComiteCrise (Plano de Gestão de Crises - PGC)
-- ----------------------------------------------------------------------------
CREATE TABLE AtasComiteCrise (
    id_ata VARCHAR(50) NOT NULL PRIMARY KEY,
    data_reuniao DATE NOT NULL,
    pauta VARCHAR(255) NOT NULL,
    deliberacoes TEXT NOT NULL,
    participantes TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    id_processo VARCHAR(50) UNIQUE,
    nivel_resiliencia DECIMAL(3, 2) NOT NULL DEFAULT 1.00 CHECK (nivel_resiliencia >= 1.00 AND nivel_resiliencia <= 5.00),
    aderencia_ISO22301 DECIMAL(5, 2) NOT NULL DEFAULT 0.00 CHECK (aderencia_ISO22301 >= 0.00 AND aderencia_ISO22301 <= 100.00),
    metricas_utilizadas TEXT,
    grafico_resultado TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_NRGCN_Processos FOREIGN KEY (id_processo) 
        REFERENCES ProcessosCriticos(id_processo) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Índices para otimização de consultas e chaves estrangeiras
-- ----------------------------------------------------------------------------
CREATE INDEX IX_Gerencias_Diretoria ON Gerencias(id_diretoria);
CREATE INDEX IX_Contratos_Gerencia ON Contratos(id_gerencia);
CREATE INDEX IX_Processos_Gerencia ON ProcessosCriticos(id_gerencia);
CREATE INDEX IX_Riscos_Processo ON Riscos(id_processo);
CREATE INDEX IX_Incidentes_Processo ON Incidentes(id_processo);
CREATE INDEX IX_AIN_Processo ON AnaliseImpactoNegocio(id_processo);
CREATE INDEX IX_PCO_Processo ON PlanosContinuidade(id_processo);
CREATE INDEX IX_PRD_Processo ON PlanosRecuperacaoDesastres(id_processo);
CREATE INDEX IX_Governanca_Processo ON GovernancaGCN(id_processo);
CREATE INDEX IX_NRGCN_Processo ON AvaliacaoNRGCN(id_processo);
