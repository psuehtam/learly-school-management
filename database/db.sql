SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================
-- LEARLY — Script do Banco de Dados MySQL (v4.0 COMPLETO)
-- ============================================================

CREATE DATABASE IF NOT EXISTS learly_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE learly_db;

-- ============================================================
-- MULTI-TENANT
-- ============================================================

CREATE TABLE escolas (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    codigo_escola    VARCHAR(50) UNIQUE NOT NULL,
    nome_fantasia    VARCHAR(150) NOT NULL,
    razao_social     VARCHAR(150),
    cnpj             VARCHAR(20) UNIQUE,
    status           ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao     DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Super Admin: não exige tabela separada. Opções usuais — (1) Escola reservada (ex.: codigo_escola = 'SYSTEM')
-- com perfil "Super Admin" e usuários apenas nessa escola; (2) evoluir modelo com usuarios.escola_id NULL
-- e/ou coluna is_super_admin TINYINT(1). A tabela escolas já centraliza tenants; permissão GERENCIAR_ESCOLAS.

-- ============================================================
-- PERMISSÕES (Policy-Based Authorization)
-- ============================================================

CREATE TABLE permissoes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    descricao   TEXT,
    UNIQUE (nome)
);

CREATE TABLE perfis (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    escola_id        INT NOT NULL,
    nome             VARCHAR(50) NOT NULL,
    descricao        TEXT,
    status           ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao     DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    UNIQUE (escola_id, nome)
);

CREATE TABLE perfil_permissoes (
    perfil_id    INT NOT NULL,
    permissao_id INT NOT NULL,
    PRIMARY KEY (perfil_id, permissao_id),
    FOREIGN KEY (perfil_id) REFERENCES perfis(id),
    FOREIGN KEY (permissao_id) REFERENCES permissoes(id)
);

-- Templates globais de perfil (nomes padrão ao criar escola) e vínculos com permissoes.
CREATE TABLE perfis_template (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    UNIQUE (nome)
);

CREATE TABLE perfil_permissoes_template (
    perfil_template_id INT NOT NULL,
    permissao_id       INT NOT NULL,
    PRIMARY KEY (perfil_template_id, permissao_id),
    FOREIGN KEY (perfil_template_id) REFERENCES perfis_template(id),
    FOREIGN KEY (permissao_id) REFERENCES permissoes(id)
);

CREATE TABLE usuarios (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    escola_id        INT NOT NULL,
    nome_completo    VARCHAR(150) NOT NULL,
    email            VARCHAR(150) NOT NULL,
    senha            VARCHAR(255) NOT NULL,
    perfil_id        INT NOT NULL,
    status           ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao     DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (perfil_id) REFERENCES perfis(id),
    UNIQUE (escola_id, email)
);

CREATE TABLE usuario_permissoes (
    usuario_id               INT NOT NULL,
    permissao_id             INT NOT NULL,
    concedido_por_usuario_id INT,
    data_concessao           DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, permissao_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (permissao_id) REFERENCES permissoes(id),
    FOREIGN KEY (concedido_por_usuario_id) REFERENCES usuarios(id)
);

-- ============================================================
-- CURRÍCULO
-- ============================================================

CREATE TABLE livros (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    escola_id        INT NOT NULL,
    nome             VARCHAR(150) NOT NULL,
    status           ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao     DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id)
);

CREATE TABLE capitulos (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    escola_id           INT NOT NULL,
    livro_id            INT NOT NULL,
    nome                VARCHAR(100) NOT NULL,
    qtd_aulas_previstas INT NOT NULL,
    status              ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao        DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (livro_id) REFERENCES livros(id)
);

-- ============================================================
-- PESSOAS
-- ============================================================

CREATE TABLE responsaveis (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    escola_id            INT NOT NULL,
    tipo_pessoa          ENUM('Fisica', 'Juridica') NOT NULL,
    cpf_cnpj             VARCHAR(20) NOT NULL,
    nome                 VARCHAR(100) NOT NULL,
    sobrenome            VARCHAR(100) NOT NULL,
    grau_parentesco      ENUM('Pai', 'Mae', 'Avo Paterno', 'Avo Materno', 'Tio', 'Tia', 'Irmao', 'Irma', 'Conjuge', 'Outro'),
    sexo                 ENUM('Masculino', 'Feminino', 'Outro'),
    estado_civil         ENUM('Solteiro', 'Casado', 'Divorciado', 'Viuvo', 'Uniao Estavel'),
    data_nascimento      DATE,
    escolaridade         ENUM('Fundamental Incompleto', 'Fundamental Completo', 'Medio Incompleto', 'Medio Completo', 'Superior Incompleto', 'Superior Completo', 'Pos-Graduacao'),
    cor_raca             ENUM('Branca', 'Preta', 'Parda', 'Amarela', 'Indigena', 'Nao Declarado'),
    observacoes          TEXT,
    nacionalidade        VARCHAR(50),
    data_entrada_pais    DATE,
    naturalidade_cidade  VARCHAR(100),
    naturalidade_estado  CHAR(2),
    rg_numero            VARCHAR(50),
    rg_expedicao         DATE,
    rg_orgao             VARCHAR(20),
    cep                  VARCHAR(10),
    tipo_logradouro      ENUM('Rua', 'Avenida', 'Travessa', 'Alameda', 'Estrada', 'Rodovia', 'Outro'),
    logradouro           VARCHAR(150),
    numero               VARCHAR(20),
    complemento          VARCHAR(100),
    bairro               VARCHAR(100),
    municipio            VARCHAR(100),
    status               ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao         DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    UNIQUE (escola_id, cpf_cnpj)
);

CREATE TABLE contatos_telefone (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    escola_id   INT NOT NULL,
    entidade    ENUM('aluno', 'responsavel') NOT NULL,
    entidade_id INT NOT NULL,
    tipo        ENUM('Celular', 'Residencial', 'Comercial') NOT NULL,
    numero      VARCHAR(20) NOT NULL,
    principal   BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (escola_id) REFERENCES escolas(id)
);

CREATE TABLE alunos (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    escola_id             INT NOT NULL,
    responsavel_id        INT NOT NULL,
    e_proprio_responsavel BOOLEAN DEFAULT FALSE,
    nome                  VARCHAR(100) NOT NULL,
    sobrenome             VARCHAR(100) NOT NULL,
    sexo                  ENUM('Masculino', 'Feminino', 'Outro') NOT NULL,
    cor_raca              ENUM('Branca', 'Preta', 'Parda', 'Amarela', 'Indigena', 'Nao Declarado'),
    estado_civil          ENUM('Solteiro', 'Casado', 'Divorciado', 'Viuvo', 'Uniao Estavel'),
    data_nascimento       DATE NOT NULL,
    data_ingresso         DATE NOT NULL,
    profissao             VARCHAR(100),
    registro_escolar      VARCHAR(50),
    nacionalidade         VARCHAR(50),
    data_entrada_pais     DATE,
    naturalidade_cidade   VARCHAR(100),
    naturalidade_estado   CHAR(2),
    rg_numero             VARCHAR(50),
    rg_expedicao          DATE,
    rg_orgao              VARCHAR(20),
    cpf                   VARCHAR(20),
    cep                   VARCHAR(10),
    tipo_logradouro       ENUM('Rua', 'Avenida', 'Travessa', 'Alameda', 'Estrada', 'Rodovia', 'Outro'),
    logradouro            VARCHAR(150),
    numero                VARCHAR(20),
    complemento           VARCHAR(100),
    bairro                VARCHAR(100),
    municipio             VARCHAR(100),
    status                ENUM('Ativo', 'Inativo', 'Trancado') DEFAULT 'Ativo',
    data_criacao          DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id),
    UNIQUE (escola_id, cpf)
);

CREATE TABLE filiacoes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    escola_id       INT NOT NULL,
    aluno_id        INT NOT NULL,
    tipo            ENUM('Pai', 'Mae', 'Padrasto', 'Madrasta', 'Responsavel Legal', 'Outro'),
    nome            VARCHAR(150),
    data_nascimento DATE,
    naturalidade    VARCHAR(100),
    estado_civil    ENUM('Solteiro', 'Casado', 'Divorciado', 'Viuvo', 'Uniao Estavel'),
    grau_instrucao  ENUM('Fundamental Incompleto', 'Fundamental Completo', 'Medio Incompleto', 'Medio Completo', 'Superior Incompleto', 'Superior Completo', 'Pos-Graduacao'),
    email           VARCHAR(150),
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id)
);

-- ============================================================
-- MÓDULO COMERCIAL - PRÉ-ALUNOS E CONTRATOS
-- ============================================================

CREATE TABLE pre_alunos (
    id                       INT AUTO_INCREMENT PRIMARY KEY,
    escola_id                INT NOT NULL,
    responsavel_id           INT NOT NULL,
    nome                     VARCHAR(100) NOT NULL,
    sobrenome                VARCHAR(100) NOT NULL,
    data_nascimento          DATE NOT NULL,
    telefone                 VARCHAR(20),
    livro_interesse_id       INT NOT NULL,
    tipo_contrato            VARCHAR(50) NOT NULL,
    valor_mensalidade        DECIMAL(10,2) NOT NULL,
    forma_pagamento          VARCHAR(50) NOT NULL,
    material_opcao           ENUM('A vista', 'Parcelado') NOT NULL,
    valor_material           DECIMAL(10,2),
    data_inicio_prevista     DATE NOT NULL,
    observacoes_comerciais   TEXT,
    status                   ENUM('Em negociacao', 'Aguardando aprovacao', 'Aprovado', 'Matriculado', 'Cancelado') DEFAULT 'Em negociacao',
    aluno_id                 INT,
    criado_por_usuario_id    INT NOT NULL,
    data_criacao             DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id),
    FOREIGN KEY (livro_interesse_id) REFERENCES livros(id),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE contratos_templates (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    escola_id               INT NOT NULL,
    versao                  INT NOT NULL,
    template                LONGTEXT NOT NULL,
    ativo                   BOOLEAN DEFAULT FALSE,
    criado_por_usuario_id   INT NOT NULL,
    data_criacao            DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios(id),
    UNIQUE (escola_id, versao)
);

CREATE TABLE contratos_gerados (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    escola_id             INT NOT NULL,
    pre_aluno_id          INT NOT NULL,
    template_id           INT NOT NULL,
    conteudo_gerado       LONGTEXT NOT NULL,
    gerado_por_usuario_id INT NOT NULL,
    data_geracao          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (pre_aluno_id) REFERENCES pre_alunos(id),
    FOREIGN KEY (template_id) REFERENCES contratos_templates(id),
    FOREIGN KEY (gerado_por_usuario_id) REFERENCES usuarios(id)
);

-- ============================================================
-- TURMAS E MATRÍCULAS
-- ============================================================

CREATE TABLE turmas (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    escola_id             INT NOT NULL,
    professor_id          INT NOT NULL,
    livro_id              INT NOT NULL,
    nome                  VARCHAR(150) NOT NULL,
    sala                  VARCHAR(50),
    horario               TIME,
    data_inicio           DATE,
    data_termino_prevista DATE,
    observacoes           TEXT,
    status                ENUM('Em Espera', 'Em Andamento', 'Concluida', 'Cancelada', 'Inativa') DEFAULT 'Em Espera',
    data_criacao          DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (professor_id) REFERENCES usuarios(id),
    FOREIGN KEY (livro_id) REFERENCES livros(id)
);

CREATE TABLE turmas_dias_semana (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    escola_id  INT NOT NULL,
    turma_id   INT NOT NULL,
    dia_semana TINYINT NOT NULL,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    UNIQUE (turma_id, dia_semana)
);

CREATE TABLE turmas_capitulos_progresso (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    escola_id       INT NOT NULL,
    turma_id        INT NOT NULL,
    capitulo_id     INT NOT NULL,
    concluido       BOOLEAN DEFAULT FALSE,
    data_conclusao  DATE,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (capitulo_id) REFERENCES capitulos(id),
    UNIQUE (turma_id, capitulo_id)
);

CREATE TABLE matriculas (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    escola_id        INT NOT NULL,
    aluno_id         INT NOT NULL,
    turma_id         INT NOT NULL,
    data_matricula   DATE NOT NULL,
    status           ENUM('Ativo', 'Concluido', 'Trancado', 'Cancelado') DEFAULT 'Ativo',
    data_criacao     DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    UNIQUE (escola_id, aluno_id, turma_id)
);

-- ============================================================
-- AULAS E CHAMADA
-- ============================================================

CREATE TABLE aulas (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    escola_id      INT NOT NULL,
    turma_id       INT NOT NULL,
    capitulo_id    INT,
    professor_id   INT NOT NULL,
    numero_aula    INT NOT NULL,
    data_aula      DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim    TIME NOT NULL,
    conteudo_dado  VARCHAR(200),
    tipo_aula      ENUM('Normal', 'Reposicao') NOT NULL DEFAULT 'Normal',
    status         ENUM('Agendada', 'Realizada', 'Cancelada') DEFAULT 'Agendada',
    data_criacao   DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (capitulo_id) REFERENCES capitulos(id),
    FOREIGN KEY (professor_id) REFERENCES usuarios(id)
);

CREATE TABLE presencas (
    id                        INT AUTO_INCREMENT PRIMARY KEY,
    escola_id                 INT NOT NULL,
    aula_id                   INT NOT NULL,
    aluno_id                  INT NOT NULL,
    status_presenca           ENUM('P', 'F', 'FJ', 'R') NOT NULL,
    reposicao_de_presenca_id  INT,
    data_criacao              DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (aula_id) REFERENCES aulas(id),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    FOREIGN KEY (reposicao_de_presenca_id) REFERENCES presencas(id),
    UNIQUE (aula_id, aluno_id)
);

CREATE TABLE homeworks (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    escola_id        INT NOT NULL,
    aula_id          INT NOT NULL,
    aluno_id         INT NOT NULL,
    nota             DECIMAL(4,2),
    data_criacao     DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (aula_id) REFERENCES aulas(id),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    UNIQUE (aula_id, aluno_id)
);

CREATE TABLE avaliacoes (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    escola_id        INT NOT NULL,
    turma_id         INT NOT NULL,
    aluno_id         INT NOT NULL,
    tipo_avaliacao   ENUM('Speaking', 'Listening', 'Writing', 'Class Participation', 'Avaliacao Final') NOT NULL,
    nota             DECIMAL(4,2) NOT NULL,
    data_criacao     DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    UNIQUE (turma_id, aluno_id, tipo_avaliacao)
);

CREATE TABLE ocorrencias (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    escola_id        INT NOT NULL,
    aluno_id         INT NOT NULL,
    aula_id          INT,
    tipo             ENUM('Academica', 'Administrativa') NOT NULL,
    data_ocorrencia  DATE NOT NULL,
    hora_ocorrencia  TIME NOT NULL,
    descricao        TEXT NOT NULL,
    resolucao        TEXT,
    usuario_id       INT NOT NULL,
    data_criacao     DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    FOREIGN KEY (aula_id) REFERENCES aulas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ============================================================
-- CALENDÁRIO
-- ============================================================

CREATE TABLE calendario_geral (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    escola_id     INT NOT NULL,
    data_evento   DATE NOT NULL,
    tipo_evento   ENUM('AULA', 'SEM AULA', 'FERIADO', 'RECESSO') NOT NULL DEFAULT 'AULA',
    descricao     VARCHAR(255),
    suspende_aula BOOLEAN DEFAULT FALSE,
    usuario_id    INT NOT NULL,
    data_criacao  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    UNIQUE (escola_id, data_evento)
);

-- ============================================================
-- ARQUIVOS DE TURMAS (6.6) — materiais por livro (acordeão)
-- Hierarquia: Livro (livros) > Pastas expansíveis > Arquivos.
-- Lista de livros na navegação espelha o módulo de Livros (ativos).
-- Arquivo físico no storage; aqui só metadados + url_storage.
-- Biblioteca física (acervo/empréstimos) não faz parte do modelo.
-- ============================================================

CREATE TABLE arquivos_turma_pastas (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    escola_id            INT NOT NULL,
    livro_id             INT NOT NULL,
    parent_id            INT NULL,
    nome                 VARCHAR(150) NOT NULL,
    ordem                INT NOT NULL DEFAULT 0,
    status               ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    usuario_criacao_id   INT NOT NULL,
    data_criacao         DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (livro_id) REFERENCES livros(id),
    FOREIGN KEY (parent_id) REFERENCES arquivos_turma_pastas(id),
    FOREIGN KEY (usuario_criacao_id) REFERENCES usuarios(id)
);

CREATE TABLE arquivos_turma (
    id                            INT AUTO_INCREMENT PRIMARY KEY,
    escola_id                     INT NOT NULL,
    livro_id                      INT NOT NULL,
    pasta_id                      INT NULL,
    nome_exibicao                 VARCHAR(255) NOT NULL,
    tipo_arquivo                  ENUM('PDF', 'DOC', 'DOCX') NOT NULL,
    url_storage                   VARCHAR(500) NOT NULL,
    status                        ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    usuario_upload_id             INT NOT NULL,
    usuario_ultima_alteracao_id   INT NULL,
    data_upload                   DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (livro_id) REFERENCES livros(id),
    FOREIGN KEY (pasta_id) REFERENCES arquivos_turma_pastas(id),
    FOREIGN KEY (usuario_upload_id) REFERENCES usuarios(id),
    FOREIGN KEY (usuario_ultima_alteracao_id) REFERENCES usuarios(id)
);

-- ============================================================
-- MÓDULO DE COMPROMISSOS/AGENDA
-- ============================================================

CREATE TABLE compromissos (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    escola_id        INT NOT NULL,
    usuario_id       INT NOT NULL,
    titulo           VARCHAR(255) NOT NULL,
    descricao        TEXT,
    data_inicio      DATETIME NOT NULL,
    data_fim         DATETIME NOT NULL,
    local            VARCHAR(255),
    tipo             ENUM('Reuniao', 'Evento', 'Tarefa', 'Outro') DEFAULT 'Outro',
    prioridade       ENUM('Alta', 'Media', 'Baixa') DEFAULT 'Media',
    status           ENUM('Pendente', 'Em andamento', 'Concluido', 'Cancelado') DEFAULT 'Pendente',
    lembrete_minutos INT,
    cor              VARCHAR(7),
    data_criacao     DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE compromissos_participantes (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    compromisso_id INT NOT NULL,
    usuario_id     INT NOT NULL,
    confirmacao    ENUM('Pendente', 'Confirmado', 'Recusado') DEFAULT 'Pendente',
    FOREIGN KEY (compromisso_id) REFERENCES compromissos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    UNIQUE (compromisso_id, usuario_id)
);

-- ============================================================
-- REPOSIÇÕES
-- ============================================================

CREATE TABLE reposicoes (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    escola_id             INT NOT NULL,
    aluno_id              INT NOT NULL,
    professor_id          INT NOT NULL,
    aula_id               INT NOT NULL,
    data_reposicao        DATE NOT NULL,
    horario_inicio        TIME NOT NULL,
    horario_fim           TIME NOT NULL,
    quantidade_horas      DECIMAL(4,2) NOT NULL,
    status                ENUM('Agendada', 'Realizada', 'Cancelada') DEFAULT 'Agendada',
    observacoes           TEXT,
    criado_por_usuario_id INT NOT NULL,
    data_criacao          DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id)             REFERENCES escolas(id),
    FOREIGN KEY (aluno_id)              REFERENCES alunos(id),
    FOREIGN KEY (professor_id)          REFERENCES usuarios(id),
    FOREIGN KEY (aula_id)               REFERENCES aulas(id),
    FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios(id)
);

-- ============================================================
-- FINANCEIRO
-- ============================================================

CREATE TABLE contas_bancarias (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    escola_id     INT NOT NULL,
    nome          VARCHAR(100) NOT NULL,
    saldo_inicial DECIMAL(10,2) DEFAULT 0.00,
    status        ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    FOREIGN KEY (escola_id) REFERENCES escolas(id)
);

CREATE TABLE categorias_financeiras (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    escola_id    INT NOT NULL,
    nome         VARCHAR(100) NOT NULL,
    tipo         ENUM('Credito', 'Debito', 'Parcela') NOT NULL,
    descricao    TEXT,
    status       ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id),
    UNIQUE (escola_id, nome, tipo)
);

CREATE TABLE parcelas (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    escola_id               INT NOT NULL,
    matricula_id            INT NOT NULL,
    turma_id                INT NOT NULL,
    responsavel_id          INT NOT NULL,
    categoria_id            INT NOT NULL,
    conta_destino_id        INT,
    mes_competencia         VARCHAR(7) NOT NULL,
    data_vencimento         DATE NOT NULL,
    data_pagamento          DATE,
    valor_original          DECIMAL(10,2) NOT NULL,
    percentual_desconto     DECIMAL(5,2) DEFAULT 0.00,
    valor_com_desconto      DECIMAL(10,2) NOT NULL,
    valor_pago              DECIMAL(10,2),
    forma_pagamento         VARCHAR(50),
    status                  ENUM('Pendente', 'Pago', 'Vencido', 'Estornado') DEFAULT 'Pendente',
    data_criacao            DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_ultima_modificacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id)        REFERENCES escolas(id),
    FOREIGN KEY (matricula_id)     REFERENCES matriculas(id),
    FOREIGN KEY (turma_id)         REFERENCES turmas(id),
    FOREIGN KEY (responsavel_id)   REFERENCES responsaveis(id),
    FOREIGN KEY (categoria_id)     REFERENCES categorias_financeiras(id),
    FOREIGN KEY (conta_destino_id) REFERENCES contas_bancarias(id)
);

CREATE TABLE parcelas_historico (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    parcela_id     INT NOT NULL,
    usuario_id     INT NOT NULL,
    campo_alterado VARCHAR(50) NOT NULL,
    valor_anterior VARCHAR(255),
    valor_novo     VARCHAR(255),
    motivo         TEXT,
    data_hora      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parcela_id) REFERENCES parcelas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE movimentacoes_financeiras (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    escola_id         INT NOT NULL,
    conta_id          INT NOT NULL,
    categoria_id      INT NOT NULL,
    parcela_id        INT,
    tipo              ENUM('Entrada', 'Saida', 'Estorno', 'Transferencia') NOT NULL,
    valor             DECIMAL(10,2) NOT NULL,
    data_movimentacao DATE NOT NULL,
    forma_pagamento   VARCHAR(50),
    descricao         VARCHAR(255),
    FOREIGN KEY (escola_id)    REFERENCES escolas(id),
    FOREIGN KEY (conta_id)     REFERENCES contas_bancarias(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias_financeiras(id),
    FOREIGN KEY (parcela_id)   REFERENCES parcelas(id)
);

-- ============================================================
-- AUDITORIA
-- ============================================================

CREATE TABLE logs_auditoria (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    escola_id        INT,
    usuario_id       INT,
    usuario_nome     VARCHAR(150),         
    tabela_afetada   VARCHAR(50) NOT NULL,
    registro_id      VARCHAR(50) NOT NULL, 
    acao             VARCHAR(30) NOT NULL,
    descricao        TEXT,
    dados_anteriores JSON,
    dados_novos      JSON,
    data_hora        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (escola_id) REFERENCES escolas(id)
);

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================

-- Turmas do professor (tela principal do professor)
CREATE INDEX idx_turmas_professor       ON turmas(escola_id, professor_id, status);

-- Aulas de uma turma ordenadas por data
CREATE INDEX idx_aulas_turma_data       ON aulas(turma_id, data_aula);
CREATE INDEX idx_aulas_escola_data      ON aulas(escola_id, data_aula, status);
CREATE INDEX idx_aulas_tipo             ON aulas(escola_id, tipo_aula, data_aula);

-- Chamada: presença por aula
CREATE INDEX idx_presencas_aula         ON presencas(aula_id, aluno_id);

-- Frequência: faltas por aluno
CREATE INDEX idx_presencas_aluno        ON presencas(aluno_id, status_presenca);

-- Financeiro: parcelas por status e vencimento
CREATE INDEX idx_parcelas_vencimento    ON parcelas(escola_id, status, data_vencimento);

-- Alunos de uma turma
CREATE INDEX idx_matriculas_turma       ON matriculas(turma_id, status);

-- Logs por usuário e data
CREATE INDEX idx_logs_data              ON logs_auditoria(escola_id, usuario_id, data_hora);
CREATE INDEX idx_logs_tabela            ON logs_auditoria(escola_id, tabela_afetada, data_hora);
CREATE INDEX idx_logs_registro          ON logs_auditoria(tabela_afetada, registro_id);

-- Busca de alunos por escola
CREATE INDEX idx_alunos_escola          ON alunos(escola_id, status);

CREATE INDEX idx_turmas_dias_semana     ON turmas_dias_semana(turma_id, dia_semana);
CREATE INDEX idx_capitulos_progresso    ON turmas_capitulos_progresso(turma_id, concluido);

-- Reposições
CREATE INDEX idx_reposicoes_escola_data  ON reposicoes(escola_id, data_reposicao, status);
CREATE INDEX idx_reposicoes_professor    ON reposicoes(escola_id, professor_id, data_reposicao);
CREATE INDEX idx_reposicoes_aluno        ON reposicoes(escola_id, aluno_id, status);

-- Pré-alunos (Módulo Comercial)
CREATE INDEX idx_pre_alunos_escola_status ON pre_alunos(escola_id, status);
CREATE INDEX idx_pre_alunos_responsavel   ON pre_alunos(escola_id, responsavel_id);

-- Contratos
CREATE INDEX idx_contratos_templates_ativo ON contratos_templates(escola_id, ativo);
CREATE INDEX idx_contratos_gerados_pre_aluno ON contratos_gerados(pre_aluno_id);

-- Arquivos de turmas (navegação por livro / pasta)
CREATE INDEX idx_arquivos_turma_pastas_livro ON arquivos_turma_pastas(escola_id, livro_id, parent_id, status);
CREATE INDEX idx_arquivos_turma_livro        ON arquivos_turma(escola_id, livro_id, pasta_id, status);

-- Compromissos
CREATE INDEX idx_compromissos_usuario ON compromissos(escola_id, usuario_id, data_inicio);
CREATE INDEX idx_compromissos_data ON compromissos(escola_id, data_inicio, data_fim);
