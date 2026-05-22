-- LEARLY - SETUP BANCO DE DADOS
-- Executar: mysql -u root -p < database/setup.sql
-- Obs.: instalação limpa (drop + setup.sql).

CREATE DATABASE IF NOT EXISTS learly_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE learly_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- TABELAS INDEPENDENTES (sem FK de negócio)
-- ============================================================

-- ------------------------------------------------------------
-- escolas
-- Cada tenant é uma linha aqui. A linha SYSTEM é reservada
-- para o superadmin global.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escolas (
  id               INT          NOT NULL AUTO_INCREMENT,
  codigo_escola    VARCHAR(50)  NOT NULL,
  nome_fantasia    VARCHAR(150) NOT NULL,
  razao_social     VARCHAR(150)          DEFAULT NULL,
  cnpj             VARCHAR(20)           DEFAULT NULL,
  status           ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  data_criacao     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_codigo_escola (codigo_escola),
  UNIQUE KEY uk_cnpj         (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- permissoes
-- Catálogo global de permissões; não pertence a nenhum tenant.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissoes (
  id      INT          NOT NULL AUTO_INCREMENT,
  nome    VARCHAR(100) NOT NULL,
  descricao TEXT                 DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permissao_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- perfis_template
-- Nomes de perfil que servem de molde ao criar nova escola.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfis_template (
  id   INT         NOT NULL AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_perfis_template_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- responsaveis
-- Pais/responsáveis financeiros dos alunos.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS responsaveis (
  id                   INT         NOT NULL AUTO_INCREMENT,
  escola_id            INT         NOT NULL,
  tipo_pessoa          ENUM('Fisica','Juridica') NOT NULL,
  cpf_cnpj             VARCHAR(20) NOT NULL,
  nome                 VARCHAR(100) NOT NULL,
  sobrenome            VARCHAR(100) NOT NULL,
  grau_parentesco      ENUM('Pai','Mae','Avo Paterno','Avo Materno','Tio','Tia','Irmao','Irma','Conjuge','Outro') DEFAULT NULL,
  sexo                 ENUM('Masculino','Feminino','Outro') DEFAULT NULL,
  estado_civil         ENUM('Solteiro','Casado','Divorciado','Viuvo','Uniao Estavel') DEFAULT NULL,
  data_nascimento      DATE        DEFAULT NULL,
  escolaridade         ENUM('Fundamental Incompleto','Fundamental Completo','Medio Incompleto','Medio Completo','Superior Incompleto','Superior Completo','Pos-Graduacao') DEFAULT NULL,
  cor_raca             ENUM('Branca','Preta','Parda','Amarela','Indigena','Nao Declarado') DEFAULT NULL,
  observacoes          TEXT        DEFAULT NULL,
  nacionalidade        VARCHAR(50) DEFAULT NULL,
  data_entrada_pais    DATE        DEFAULT NULL,
  naturalidade_cidade  VARCHAR(100) DEFAULT NULL,
  naturalidade_estado  CHAR(2)     DEFAULT NULL,
  rg_numero            VARCHAR(50) DEFAULT NULL,
  rg_expedicao         DATE        DEFAULT NULL,
  rg_orgao             VARCHAR(20) DEFAULT NULL,
  cep                  VARCHAR(10) DEFAULT NULL,
  tipo_logradouro      ENUM('Rua','Avenida','Travessa','Alameda','Estrada','Rodovia','Outro') DEFAULT NULL,
  logradouro           VARCHAR(150) DEFAULT NULL,
  numero               VARCHAR(20) DEFAULT NULL,
  complemento          VARCHAR(100) DEFAULT NULL,
  bairro               VARCHAR(100) DEFAULT NULL,
  municipio            VARCHAR(100) DEFAULT NULL,
  status               ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  data_criacao         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_responsavel_escola_cpf (escola_id, cpf_cnpj),
  CONSTRAINT fk_responsaveis_escola FOREIGN KEY (escola_id) REFERENCES escolas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- pre_responsaveis
-- Responsáveis em negociação no funil comercial (ainda não oficiais).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pre_responsaveis (
  id                        INT         NOT NULL AUTO_INCREMENT,
  escola_id                 INT         NOT NULL,
  tipo_pessoa               ENUM('Fisica','Juridica') NOT NULL,
  cpf_cnpj                  VARCHAR(20) NOT NULL,
  nome                      VARCHAR(100) NOT NULL,
  sobrenome                 VARCHAR(100) NOT NULL,
  telefone                  VARCHAR(20)  DEFAULT NULL,
  grau_parentesco           ENUM('Pai','Mae','Avo Paterno','Avo Materno','Tio','Tia','Irmao','Irma','Conjuge','Outro') DEFAULT NULL,
  sexo                      ENUM('Masculino','Feminino','Outro') DEFAULT NULL,
  estado_civil              ENUM('Solteiro','Casado','Divorciado','Viuvo','Uniao Estavel') DEFAULT NULL,
  data_nascimento           DATE         DEFAULT NULL,
  cor_raca                  ENUM('Branca','Preta','Parda','Amarela','Indigena','Nao Declarado') DEFAULT NULL,
  nacionalidade             VARCHAR(50)  DEFAULT NULL,
  naturalidade_cidade       VARCHAR(100) DEFAULT NULL,
  naturalidade_estado       CHAR(2)      DEFAULT NULL,
  rg_numero                 VARCHAR(50)  DEFAULT NULL,
  rg_expedicao              DATE         DEFAULT NULL,
  rg_orgao                  VARCHAR(20)  DEFAULT NULL,
  cep                       VARCHAR(10)  DEFAULT NULL,
  tipo_logradouro           ENUM('Rua','Avenida','Travessa','Alameda','Estrada','Rodovia','Outro') DEFAULT NULL,
  logradouro                VARCHAR(150) DEFAULT NULL,
  numero                    VARCHAR(20)  DEFAULT NULL,
  complemento               VARCHAR(100) DEFAULT NULL,
  bairro                    VARCHAR(100) DEFAULT NULL,
  municipio                 VARCHAR(100) DEFAULT NULL,
  responsavel_convertido_id INT          DEFAULT NULL,
  status                    ENUM('Em negociacao','Aguardando aprovacao','Aprovado','Recusado','Cancelado','Convertido') NOT NULL DEFAULT 'Em negociacao',
  data_criacao              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pre_resp_escola_cpf (escola_id, cpf_cnpj),
  KEY idx_pre_resp_status    (escola_id, status),
  KEY idx_pre_resp_conv      (responsavel_convertido_id),
  CONSTRAINT fk_pre_resp_escola FOREIGN KEY (escola_id) REFERENCES escolas (id),
  CONSTRAINT fk_pre_resp_conv   FOREIGN KEY (responsavel_convertido_id) REFERENCES responsaveis (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELAS DE AUTENTICAÇÃO / PERFIS / USUÁRIOS
-- ============================================================

-- ------------------------------------------------------------
-- perfis
-- Cada escola tem seus próprios perfis de acesso.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfis (
  id               INT         NOT NULL AUTO_INCREMENT,
  escola_id        INT         NOT NULL,
  nome             VARCHAR(50) NOT NULL,
  descricao        TEXT        DEFAULT NULL,
  status           ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  data_criacao     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_perfil_escola_nome (escola_id, nome),
  CONSTRAINT fk_perfis_escola FOREIGN KEY (escola_id) REFERENCES escolas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id               INT          NOT NULL AUTO_INCREMENT,
  escola_id        INT          NOT NULL,
  nome_completo    VARCHAR(150) NOT NULL,
  email            VARCHAR(150) NOT NULL,
  senha            VARCHAR(255) NOT NULL,
  perfil_id        INT          NOT NULL,
  status           ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  data_criacao     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuario_escola_email (escola_id, email),
  KEY idx_usuarios_perfil (perfil_id),
  CONSTRAINT fk_usuarios_escola FOREIGN KEY (escola_id)  REFERENCES escolas (id),
  CONSTRAINT fk_usuarios_perfil FOREIGN KEY (perfil_id)  REFERENCES perfis  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- perfil_permissoes
-- Vínculo entre perfis de uma escola e permissões.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfil_permissoes (
  perfil_id    INT NOT NULL,
  permissao_id INT NOT NULL,
  PRIMARY KEY (perfil_id, permissao_id),
  KEY idx_pp_permissao (permissao_id),
  CONSTRAINT fk_pp_perfil    FOREIGN KEY (perfil_id)    REFERENCES perfis     (id),
  CONSTRAINT fk_pp_permissao FOREIGN KEY (permissao_id) REFERENCES permissoes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- perfil_permissoes_template
-- Molde global de permissões por nome de perfil.
-- Usado pelo backend ao criar nova escola.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfil_permissoes_template (
  perfil_template_id INT NOT NULL,
  permissao_id       INT NOT NULL,
  PRIMARY KEY (perfil_template_id, permissao_id),
  KEY idx_ppt_permissao (permissao_id),
  CONSTRAINT fk_ppt_perfil    FOREIGN KEY (perfil_template_id) REFERENCES perfis_template (id),
  CONSTRAINT fk_ppt_permissao FOREIGN KEY (permissao_id)       REFERENCES permissoes      (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- usuario_permissoes
-- Permissões adicionais concedidas individualmente ao usuário.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario_permissoes (
  usuario_id              INT NOT NULL,
  permissao_id            INT NOT NULL,
  concedido_por_usuario_id INT DEFAULT NULL,
  data_concessao          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, permissao_id),
  KEY idx_up_permissao (permissao_id),
  KEY idx_up_concedido (concedido_por_usuario_id),
  CONSTRAINT fk_up_usuario    FOREIGN KEY (usuario_id)               REFERENCES usuarios  (id),
  CONSTRAINT fk_up_permissao  FOREIGN KEY (permissao_id)             REFERENCES permissoes (id),
  CONSTRAINT fk_up_concedido  FOREIGN KEY (concedido_por_usuario_id) REFERENCES usuarios  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MÓDULO ACADÊMICO
-- ============================================================

-- ------------------------------------------------------------
-- livros
-- Catálogo de níveis/livros por escola.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS livros (
  id               INT          NOT NULL AUTO_INCREMENT,
  escola_id        INT          NOT NULL,
  nome             VARCHAR(150) NOT NULL,
  status           ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  data_criacao     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_livros_escola (escola_id, status),
  CONSTRAINT fk_livros_escola FOREIGN KEY (escola_id) REFERENCES escolas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- capitulos
-- Capítulos de um livro com quantidade de aulas previstas.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS capitulos (
  id                  INT          NOT NULL AUTO_INCREMENT,
  escola_id           INT          NOT NULL,
  livro_id            INT          NOT NULL,
  nome                VARCHAR(100) NOT NULL,
  qtd_aulas_previstas INT          NOT NULL,
  status              ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  data_criacao        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_capitulos_escola (escola_id),
  KEY idx_capitulos_livro  (livro_id),
  CONSTRAINT fk_capitulos_escola FOREIGN KEY (escola_id) REFERENCES escolas (id),
  CONSTRAINT fk_capitulos_livro  FOREIGN KEY (livro_id)  REFERENCES livros  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- turmas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turmas (
  id                     INT          NOT NULL AUTO_INCREMENT,
  escola_id              INT          NOT NULL,
  professor_id           INT          NOT NULL,
  livro_id               INT          NOT NULL,
  nome                   VARCHAR(150) NOT NULL,
  sala                   VARCHAR(50)  DEFAULT NULL,
  horario                TIME         DEFAULT NULL,
  horario_fim            TIME         DEFAULT NULL,
  data_inicio            DATE         DEFAULT NULL,
  data_termino_prevista  DATE         DEFAULT NULL,
  observacoes            TEXT         DEFAULT NULL,
  status                 ENUM('Em Espera','Em Andamento','Concluida','Cancelada','Inativa') NOT NULL DEFAULT 'Em Espera',
  data_criacao           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_turmas_professor (escola_id, professor_id, status),
  KEY idx_turmas_livro     (livro_id),
  CONSTRAINT fk_turmas_escola    FOREIGN KEY (escola_id)   REFERENCES escolas  (id),
  CONSTRAINT fk_turmas_professor FOREIGN KEY (professor_id) REFERENCES usuarios (id),
  CONSTRAINT fk_turmas_livro     FOREIGN KEY (livro_id)    REFERENCES livros   (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- turmas_dias_semana
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turmas_dias_semana (
  id         INT     NOT NULL AUTO_INCREMENT,
  escola_id  INT     NOT NULL,
  turma_id   INT     NOT NULL,
  dia_semana TINYINT NOT NULL COMMENT '0=Domingo ... 6=Sabado',
  PRIMARY KEY (id),
  UNIQUE KEY uk_turma_dia (turma_id, dia_semana),
  KEY idx_tds_escola (escola_id),
  KEY idx_tds_turma  (turma_id, dia_semana),
  CONSTRAINT fk_tds_escola FOREIGN KEY (escola_id) REFERENCES escolas (id),
  CONSTRAINT fk_tds_turma  FOREIGN KEY (turma_id)  REFERENCES turmas  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- alunos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alunos (
  id                   INT          NOT NULL AUTO_INCREMENT,
  escola_id            INT          NOT NULL,
  responsavel_id       INT          NOT NULL,
  e_proprio_responsavel TINYINT  NOT NULL DEFAULT 0,
  nome                 VARCHAR(100) NOT NULL,
  sobrenome            VARCHAR(100) NOT NULL,
  sexo                 ENUM('Masculino','Feminino','Outro') NOT NULL,
  cor_raca             ENUM('Branca','Preta','Parda','Amarela','Indigena','Nao Declarado') DEFAULT NULL,
  estado_civil         ENUM('Solteiro','Casado','Divorciado','Viuvo','Uniao Estavel') DEFAULT NULL,
  data_nascimento      DATE         NOT NULL,
  data_ingresso        DATE         NOT NULL,
  profissao            VARCHAR(100) DEFAULT NULL,
  registro_escolar     VARCHAR(50)  DEFAULT NULL,
  nacionalidade        VARCHAR(50)  DEFAULT NULL,
  data_entrada_pais    DATE         DEFAULT NULL,
  naturalidade_cidade  VARCHAR(100) DEFAULT NULL,
  naturalidade_estado  CHAR(2)      DEFAULT NULL,
  rg_numero            VARCHAR(50)  DEFAULT NULL,
  rg_expedicao         DATE         DEFAULT NULL,
  rg_orgao             VARCHAR(20)  DEFAULT NULL,
  cpf                  VARCHAR(20)  DEFAULT NULL,
  cep                  VARCHAR(10)  DEFAULT NULL,
  tipo_logradouro      ENUM('Rua','Avenida','Travessa','Alameda','Estrada','Rodovia','Outro') DEFAULT NULL,
  logradouro           VARCHAR(150) DEFAULT NULL,
  numero               VARCHAR(20)  DEFAULT NULL,
  complemento          VARCHAR(100) DEFAULT NULL,
  bairro               VARCHAR(100) DEFAULT NULL,
  municipio            VARCHAR(100) DEFAULT NULL,
  status               ENUM('Ativo','Inativo','Trancado') NOT NULL DEFAULT 'Ativo',
  data_criacao         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_aluno_escola_cpf (escola_id, cpf),
  KEY idx_alunos_escola      (escola_id, status),
  KEY idx_alunos_responsavel (responsavel_id),
  CONSTRAINT fk_alunos_escola       FOREIGN KEY (escola_id)      REFERENCES escolas      (id),
  CONSTRAINT fk_alunos_responsavel  FOREIGN KEY (responsavel_id) REFERENCES responsaveis (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- filiacoes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS filiacoes (
  id              INT          NOT NULL AUTO_INCREMENT,
  escola_id       INT          NOT NULL,
  aluno_id        INT          NOT NULL,
  tipo            ENUM('Pai','Mae','Padrasto','Madrasta','Responsavel Legal','Outro') DEFAULT NULL,
  nome            VARCHAR(150) DEFAULT NULL,
  data_nascimento DATE         DEFAULT NULL,
  naturalidade    VARCHAR(100) DEFAULT NULL,
  estado_civil    ENUM('Solteiro','Casado','Divorciado','Viuvo','Uniao Estavel') DEFAULT NULL,
  grau_instrucao  ENUM('Fundamental Incompleto','Fundamental Completo','Medio Incompleto','Medio Completo','Superior Incompleto','Superior Completo','Pos-Graduacao') DEFAULT NULL,
  email           VARCHAR(150) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_filiacoes_escola (escola_id),
  KEY idx_filiacoes_aluno  (aluno_id),
  CONSTRAINT fk_filiacoes_escola FOREIGN KEY (escola_id) REFERENCES escolas (id),
  CONSTRAINT fk_filiacoes_aluno  FOREIGN KEY (aluno_id)  REFERENCES alunos  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- contatos_telefone
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contatos_telefone (
  id          INT         NOT NULL AUTO_INCREMENT,
  escola_id   INT         NOT NULL,
  entidade    ENUM('aluno','responsavel') NOT NULL,
  entidade_id INT         NOT NULL,
  tipo        ENUM('Celular','Residencial','Comercial') NOT NULL,
  numero      VARCHAR(20) NOT NULL,
  principal   TINYINT  NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_ct_escola (escola_id),
  CONSTRAINT fk_contatos_telefone_escola FOREIGN KEY (escola_id) REFERENCES escolas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- matriculas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matriculas (
  id              INT  NOT NULL AUTO_INCREMENT,
  escola_id       INT  NOT NULL,
  aluno_id        INT  NOT NULL,
  turma_id        INT  DEFAULT NULL,
  data_matricula  DATE NOT NULL,
  status          ENUM('Ativo','Concluido','Trancado','Cancelado','Em Espera') NOT NULL DEFAULT 'Ativo',
  data_criacao     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_matricula_escola_aluno_turma (escola_id, aluno_id, turma_id),
  KEY idx_matriculas_aluno  (aluno_id),
  KEY idx_matriculas_turma  (turma_id, status),
  CONSTRAINT fk_matriculas_escola FOREIGN KEY (escola_id) REFERENCES escolas  (id),
  CONSTRAINT fk_matriculas_aluno  FOREIGN KEY (aluno_id)  REFERENCES alunos   (id),
  CONSTRAINT fk_matriculas_turma  FOREIGN KEY (turma_id)  REFERENCES turmas   (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- aulas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aulas (
  id               INT         NOT NULL AUTO_INCREMENT,
  escola_id        INT         NOT NULL,
  turma_id         INT         NOT NULL,
  capitulo_id      INT         DEFAULT NULL,
  professor_id     INT         NOT NULL,
  numero_aula      INT         NOT NULL,
  data_aula        DATE        NOT NULL,
  horario_inicio   TIME        NOT NULL,
  horario_fim      TIME        NOT NULL,
  conteudo_dado    VARCHAR(200) DEFAULT NULL,
  tipo_aula        ENUM('Normal','Reposicao') NOT NULL DEFAULT 'Normal',
  status           ENUM('Agendada','Realizada','Cancelada') NOT NULL DEFAULT 'Agendada',
  data_criacao     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_aulas_turma_data   (turma_id, data_aula),
  KEY idx_aulas_escola_data  (escola_id, data_aula, status),
  KEY idx_aulas_tipo         (escola_id, tipo_aula, data_aula),
  KEY idx_aulas_capitulo     (capitulo_id),
  KEY idx_aulas_professor    (professor_id),
  CONSTRAINT fk_aulas_escola    FOREIGN KEY (escola_id)    REFERENCES escolas   (id),
  CONSTRAINT fk_aulas_turma     FOREIGN KEY (turma_id)     REFERENCES turmas    (id),
  CONSTRAINT fk_aulas_capitulo  FOREIGN KEY (capitulo_id)  REFERENCES capitulos (id),
  CONSTRAINT fk_aulas_professor FOREIGN KEY (professor_id) REFERENCES usuarios  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- presencas
-- P=Presente F=Falta FJ=Falta Justificada R=Reposicao
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presencas (
  id                        INT NOT NULL AUTO_INCREMENT,
  escola_id                 INT NOT NULL,
  aula_id                   INT NOT NULL,
  aluno_id                  INT NOT NULL,
  status_presenca           ENUM('P','F','FJ','R') NOT NULL,
  reposicao_de_presenca_id  INT DEFAULT NULL,
  data_criacao              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_presenca_aula_aluno (aula_id, aluno_id),
  KEY idx_presencas_escola  (escola_id),
  KEY idx_presencas_aula    (aula_id, aluno_id),
  KEY idx_presencas_aluno   (aluno_id, status_presenca),
  KEY idx_presencas_repos   (reposicao_de_presenca_id),
  CONSTRAINT fk_presencas_escola  FOREIGN KEY (escola_id)                REFERENCES escolas  (id),
  CONSTRAINT fk_presencas_aula    FOREIGN KEY (aula_id)                  REFERENCES aulas    (id),
  CONSTRAINT fk_presencas_aluno   FOREIGN KEY (aluno_id)                 REFERENCES alunos   (id),
  CONSTRAINT fk_presencas_repos   FOREIGN KEY (reposicao_de_presenca_id) REFERENCES presencas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- reposicoes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reposicoes (
  id                     INT          NOT NULL AUTO_INCREMENT,
  escola_id              INT          NOT NULL,
  aluno_id               INT          NOT NULL,
  professor_id           INT          NOT NULL,
  aula_id                INT          NOT NULL,
  data_reposicao         DATE         NOT NULL,
  horario_inicio         TIME         NOT NULL,
  horario_fim            TIME         NOT NULL,
  quantidade_horas       DECIMAL(4,2) NOT NULL,
  status                 ENUM('Agendada','Realizada','Cancelada') NOT NULL DEFAULT 'Agendada',
  observacoes            TEXT         DEFAULT NULL,
  criado_por_usuario_id  INT          NOT NULL,
  data_criacao           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_repos_escola_data    (escola_id, data_reposicao, status),
  KEY idx_repos_professor      (escola_id, professor_id, data_reposicao),
  KEY idx_repos_aluno          (escola_id, aluno_id, status),
  KEY idx_repos_aula           (aula_id),
  KEY idx_repos_criado         (criado_por_usuario_id),
  CONSTRAINT fk_repos_escola   FOREIGN KEY (escola_id)             REFERENCES escolas  (id),
  CONSTRAINT fk_repos_aluno    FOREIGN KEY (aluno_id)              REFERENCES alunos   (id),
  CONSTRAINT fk_repos_prof     FOREIGN KEY (professor_id)          REFERENCES usuarios (id),
  CONSTRAINT fk_repos_aula     FOREIGN KEY (aula_id)               REFERENCES aulas    (id),
  CONSTRAINT fk_repos_criado   FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- avaliacoes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS avaliacoes (
  id               INT            NOT NULL AUTO_INCREMENT,
  escola_id        INT            NOT NULL,
  turma_id         INT            NOT NULL,
  aluno_id         INT            NOT NULL,
  tipo_avaliacao   ENUM('Speaking','Listening','Writing','Class Participation','Avaliacao Final') NOT NULL,
  nota             DECIMAL(4,2)   NOT NULL,
  data_criacao     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_avaliacao_turma_aluno_tipo (turma_id, aluno_id, tipo_avaliacao),
  KEY idx_avaliacoes_escola (escola_id),
  KEY idx_avaliacoes_aluno  (aluno_id),
  CONSTRAINT fk_avaliacoes_escola FOREIGN KEY (escola_id) REFERENCES escolas (id),
  CONSTRAINT fk_avaliacoes_turma  FOREIGN KEY (turma_id)  REFERENCES turmas  (id),
  CONSTRAINT fk_avaliacoes_aluno  FOREIGN KEY (aluno_id)  REFERENCES alunos  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- homeworks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS homeworks (
  id               INT          NOT NULL AUTO_INCREMENT,
  escola_id        INT          NOT NULL,
  aula_id          INT          NOT NULL,
  aluno_id         INT          NOT NULL,
  nota             DECIMAL(4,2) DEFAULT NULL,
  data_criacao     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_homework_aula_aluno (aula_id, aluno_id),
  KEY idx_homeworks_escola (escola_id),
  KEY idx_homeworks_aluno  (aluno_id),
  CONSTRAINT fk_homeworks_escola FOREIGN KEY (escola_id) REFERENCES escolas (id),
  CONSTRAINT fk_homeworks_aula   FOREIGN KEY (aula_id)   REFERENCES aulas   (id),
  CONSTRAINT fk_homeworks_aluno  FOREIGN KEY (aluno_id)  REFERENCES alunos  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ocorrencias
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ocorrencias (
  id               INT  NOT NULL AUTO_INCREMENT,
  escola_id        INT  NOT NULL,
  aluno_id         INT  NOT NULL,
  aula_id          INT  DEFAULT NULL,
  tipo             ENUM('Academica','Administrativa') NOT NULL,
  data_ocorrencia  DATE NOT NULL,
  hora_ocorrencia  TIME NOT NULL,
  descricao        TEXT NOT NULL,
  resolucao        TEXT DEFAULT NULL,
  usuario_id       INT  NOT NULL,
  data_criacao     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ocorrencias_escola  (escola_id),
  KEY idx_ocorrencias_aluno   (aluno_id),
  KEY idx_ocorrencias_aula    (aula_id),
  KEY idx_ocorrencias_usuario (usuario_id),
  CONSTRAINT fk_ocorrencias_escola  FOREIGN KEY (escola_id)  REFERENCES escolas  (id),
  CONSTRAINT fk_ocorrencias_aluno   FOREIGN KEY (aluno_id)   REFERENCES alunos   (id),
  CONSTRAINT fk_ocorrencias_aula    FOREIGN KEY (aula_id)    REFERENCES aulas    (id),
  CONSTRAINT fk_ocorrencias_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- turmas_capitulos_progresso
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turmas_capitulos_progresso (
  id             INT  NOT NULL AUTO_INCREMENT,
  escola_id      INT  NOT NULL,
  turma_id       INT  NOT NULL,
  capitulo_id    INT  NOT NULL,
  concluido      TINYINT NOT NULL DEFAULT 0,
  data_conclusao DATE DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tcp_turma_capitulo (turma_id, capitulo_id),
  KEY idx_tcp_escola    (escola_id),
  KEY idx_tcp_capitulo  (capitulo_id),
  KEY idx_tcp_progresso (turma_id, concluido),
  CONSTRAINT fk_tcp_escola   FOREIGN KEY (escola_id)   REFERENCES escolas   (id),
  CONSTRAINT fk_tcp_turma    FOREIGN KEY (turma_id)    REFERENCES turmas    (id),
  CONSTRAINT fk_tcp_capitulo FOREIGN KEY (capitulo_id) REFERENCES capitulos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MÓDULO PRÉ-ALUNOS / COMERCIAL
-- ============================================================

-- ------------------------------------------------------------
-- pre_alunos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pre_alunos (
  id                         INT            NOT NULL AUTO_INCREMENT,
  escola_id                  INT            NOT NULL,
  pre_responsavel_id         INT            NOT NULL,
  responsavel_id             INT            DEFAULT NULL,
  nome                       VARCHAR(100)   NOT NULL,
  sobrenome                  VARCHAR(100)   NOT NULL,
  data_nascimento            DATE           NOT NULL,
  telefone                   VARCHAR(20)    DEFAULT NULL,
  livro_interesse_id         INT            NOT NULL,
  tipo_contrato              VARCHAR(120)   NOT NULL,
  valor_mensalidade          DECIMAL(10,2)  NOT NULL,
  forma_pagamento            VARCHAR(50)    DEFAULT NULL,
  valor_matricula            DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  forma_pagamento_matricula  VARCHAR(50)    DEFAULT NULL,
  valor_material             DECIMAL(10,2)  DEFAULT NULL,
  origem_captacao            VARCHAR(80)    NOT NULL DEFAULT 'Outro',
  usa_transporte_van         TINYINT     NOT NULL DEFAULT 0,
  transporte_cep             VARCHAR(9)     DEFAULT NULL,
  transporte_logradouro      VARCHAR(200)   DEFAULT NULL,
  transporte_numero          VARCHAR(20)    DEFAULT NULL,
  transporte_complemento     VARCHAR(120)   DEFAULT NULL,
  transporte_bairro          VARCHAR(100)   DEFAULT NULL,
  transporte_cidade          VARCHAR(100)   DEFAULT NULL,
  transporte_uf              CHAR(2)        DEFAULT NULL,
  observacoes_comerciais     TEXT           DEFAULT NULL,
  e_proprio_responsavel      TINYINT     NOT NULL DEFAULT 0,
  aluno_cpf                  VARCHAR(14)    DEFAULT NULL,
  status                     ENUM('Em negociacao','Aguardando aprovacao','Aprovado','Matriculado','Cancelado') NOT NULL DEFAULT 'Em negociacao',
  aluno_id                   INT            DEFAULT NULL,
  criado_por_usuario_id      INT            NOT NULL,
  data_criacao               DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pa_escola_status   (escola_id, status),
  KEY idx_pa_pre_resp        (escola_id, pre_responsavel_id),
  KEY idx_pa_responsavel     (escola_id, responsavel_id),
  KEY idx_pa_livro           (livro_interesse_id),
  KEY idx_pa_aluno           (aluno_id),
  KEY idx_pa_criado          (criado_por_usuario_id),
  CONSTRAINT fk_pa_escola   FOREIGN KEY (escola_id)             REFERENCES escolas      (id),
  CONSTRAINT fk_pa_pre_resp FOREIGN KEY (pre_responsavel_id)    REFERENCES pre_responsaveis (id),
  CONSTRAINT fk_pa_resp     FOREIGN KEY (responsavel_id)        REFERENCES responsaveis (id),
  CONSTRAINT fk_pa_livro    FOREIGN KEY (livro_interesse_id)    REFERENCES livros       (id),
  CONSTRAINT fk_pa_aluno    FOREIGN KEY (aluno_id)              REFERENCES alunos       (id),
  CONSTRAINT fk_pa_criado   FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios     (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- pre_aluno_documentos
-- Anexos do fluxo comercial → secretaria (tipos extensíveis via tipo_codigo).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pre_aluno_documentos (
  id                      INT            NOT NULL AUTO_INCREMENT,
  escola_id               INT            NOT NULL,
  pre_aluno_id            INT            NOT NULL,
  tipo_codigo             VARCHAR(50)    NOT NULL,
  nome_exibicao           VARCHAR(120)   NOT NULL,
  nome_arquivo_original   VARCHAR(255)   NOT NULL,
  caminho_relativo        VARCHAR(500)   NOT NULL,
  content_type            VARCHAR(100)   DEFAULT NULL,
  tamanho_bytes           BIGINT         NOT NULL,
  enviado_por_usuario_id  INT            NOT NULL,
  data_upload             DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pad_pre_tipo (pre_aluno_id, tipo_codigo),
  KEY idx_pad_escola_pre    (escola_id, pre_aluno_id),
  CONSTRAINT fk_pad_escola  FOREIGN KEY (escola_id)               REFERENCES escolas     (id),
  CONSTRAINT fk_pad_pre     FOREIGN KEY (pre_aluno_id)            REFERENCES pre_alunos  (id) ON DELETE CASCADE,
  CONSTRAINT fk_pad_usuario FOREIGN KEY (enviado_por_usuario_id)  REFERENCES usuarios    (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MÓDULO CALENDÁRIO / COMPROMISSOS
-- ============================================================

-- ------------------------------------------------------------
-- calendario_geral
-- Feriados, recessos e dias sem aula por escola.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendario_geral (
  id           INT         NOT NULL AUTO_INCREMENT,
  escola_id    INT         NOT NULL,
  data_evento  DATE        NOT NULL,
  tipo_evento  ENUM('AULA','SEM AULA','FERIADO','RECESSO') NOT NULL DEFAULT 'AULA',
  descricao    VARCHAR(255) DEFAULT NULL,
  suspende_aula TINYINT NOT NULL DEFAULT 0,
  usuario_id   INT         NOT NULL,
  data_criacao DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_calendario_escola_data (escola_id, data_evento),
  KEY idx_calendario_usuario (usuario_id),
  CONSTRAINT fk_calendario_escola  FOREIGN KEY (escola_id)  REFERENCES escolas  (id),
  CONSTRAINT fk_calendario_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- compromissos
-- Reunioes, eventos e tarefas com horário definido.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compromissos (
  id               INT          NOT NULL AUTO_INCREMENT,
  escola_id        INT          NOT NULL,
  usuario_id       INT          NOT NULL,
  titulo           VARCHAR(255) NOT NULL,
  descricao        TEXT         DEFAULT NULL,
  data_inicio      DATETIME     NOT NULL,
  data_fim         DATETIME     NOT NULL,
  local            VARCHAR(255) DEFAULT NULL,
  tipo             ENUM('Reuniao','Evento','Tarefa','Outro') NOT NULL DEFAULT 'Outro',
  prioridade       ENUM('Alta','Media','Baixa') NOT NULL DEFAULT 'Media',
  status           ENUM('Pendente','Em andamento','Concluido','Cancelado') NOT NULL DEFAULT 'Pendente',
  lembrete_minutos INT          DEFAULT NULL,
  cor              VARCHAR(7)   DEFAULT NULL,
  data_criacao     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_compromissos_usuario (escola_id, usuario_id, data_inicio),
  KEY idx_compromissos_data    (escola_id, data_inicio, data_fim),
  CONSTRAINT fk_compromissos_escola  FOREIGN KEY (escola_id)  REFERENCES escolas  (id),
  CONSTRAINT fk_compromissos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- compromissos_participantes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compromissos_participantes (
  id             INT NOT NULL AUTO_INCREMENT,
  compromisso_id INT NOT NULL,
  usuario_id     INT NOT NULL,
  confirmacao    ENUM('Pendente','Confirmado','Recusado') NOT NULL DEFAULT 'Pendente',
  PRIMARY KEY (id),
  UNIQUE KEY uk_cp_compromisso_usuario (compromisso_id, usuario_id),
  KEY idx_cp_usuario (usuario_id),
  CONSTRAINT fk_cp_compromisso FOREIGN KEY (compromisso_id) REFERENCES compromissos (id),
  CONSTRAINT fk_cp_usuario     FOREIGN KEY (usuario_id)     REFERENCES usuarios     (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- escolas_horarios_funcionamento
-- Configuração semanal de abertura por escola.
-- Necessária para a regra de compromissos em dias de funcionamento.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escolas_horarios_funcionamento (
  id                 INT     NOT NULL AUTO_INCREMENT,
  escola_id          INT     NOT NULL,
  dia_semana         TINYINT NOT NULL COMMENT '0=Domingo ... 6=Sabado',
  aberto             TINYINT NOT NULL DEFAULT 1,
  horario_abertura   TIME    DEFAULT NULL,
  horario_fechamento TIME    DEFAULT NULL,
  data_criacao       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ehf_escola_dia (escola_id, dia_semana),
  KEY idx_ehf_escola_aberto (escola_id, aberto),
  CONSTRAINT fk_ehf_escola FOREIGN KEY (escola_id) REFERENCES escolas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MÓDULO FINANCEIRO
-- ============================================================

-- ------------------------------------------------------------
-- contas_bancarias
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contas_bancarias (
  id            INT            NOT NULL AUTO_INCREMENT,
  escola_id     INT            NOT NULL,
  nome          VARCHAR(100)   NOT NULL,
  saldo_inicial DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  status        ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  PRIMARY KEY (id),
  KEY idx_cb_escola (escola_id),
  CONSTRAINT fk_cb_escola FOREIGN KEY (escola_id) REFERENCES escolas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- categorias_financeiras
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id           INT          NOT NULL AUTO_INCREMENT,
  escola_id    INT          NOT NULL,
  nome         VARCHAR(100) NOT NULL,
  tipo         ENUM('Credito','Debito','Parcela') NOT NULL,
  descricao    TEXT         DEFAULT NULL,
  status       ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  data_criacao DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cf_escola_nome_tipo (escola_id, nome, tipo),
  CONSTRAINT fk_cf_escola FOREIGN KEY (escola_id) REFERENCES escolas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- parcelas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parcelas (
  id                    INT           NOT NULL AUTO_INCREMENT,
  escola_id             INT           NOT NULL,
  matricula_id          INT           NOT NULL,
  turma_id              INT           NOT NULL,
  responsavel_id        INT           NOT NULL,
  categoria_id          INT           NOT NULL,
  conta_destino_id      INT           DEFAULT NULL,
  mes_competencia       VARCHAR(7)    NOT NULL,
  data_vencimento       DATE          NOT NULL,
  data_pagamento        DATE          DEFAULT NULL,
  valor_original        DECIMAL(10,2) NOT NULL,
  percentual_desconto   DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  valor_com_desconto    DECIMAL(10,2) NOT NULL,
  valor_pago            DECIMAL(10,2) DEFAULT NULL,
  forma_pagamento       VARCHAR(50)   DEFAULT NULL,
  status                ENUM('Pendente','Pago','Vencido','Estornado') NOT NULL DEFAULT 'Pendente',
  data_criacao          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_ultima_modificacao DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_parcelas_vencimento (escola_id, status, data_vencimento),
  KEY idx_parcelas_matricula  (matricula_id),
  KEY idx_parcelas_turma      (turma_id),
  KEY idx_parcelas_resp       (responsavel_id),
  KEY idx_parcelas_categoria  (categoria_id),
  KEY idx_parcelas_conta      (conta_destino_id),
  CONSTRAINT fk_parcelas_escola    FOREIGN KEY (escola_id)        REFERENCES escolas                 (id),
  CONSTRAINT fk_parcelas_matricula FOREIGN KEY (matricula_id)     REFERENCES matriculas              (id),
  CONSTRAINT fk_parcelas_turma     FOREIGN KEY (turma_id)         REFERENCES turmas                  (id),
  CONSTRAINT fk_parcelas_resp      FOREIGN KEY (responsavel_id)   REFERENCES responsaveis            (id),
  CONSTRAINT fk_parcelas_cat       FOREIGN KEY (categoria_id)     REFERENCES categorias_financeiras  (id),
  CONSTRAINT fk_parcelas_conta     FOREIGN KEY (conta_destino_id) REFERENCES contas_bancarias        (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- parcelas_historico
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parcelas_historico (
  id              INT          NOT NULL AUTO_INCREMENT,
  parcela_id      INT          NOT NULL,
  usuario_id      INT          NOT NULL,
  campo_alterado  VARCHAR(50)  NOT NULL,
  valor_anterior  VARCHAR(255) DEFAULT NULL,
  valor_novo      VARCHAR(255) DEFAULT NULL,
  motivo          TEXT         DEFAULT NULL,
  data_hora       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ph_parcela  (parcela_id),
  KEY idx_ph_usuario  (usuario_id),
  CONSTRAINT fk_ph_parcela  FOREIGN KEY (parcela_id) REFERENCES parcelas  (id),
  CONSTRAINT fk_ph_usuario  FOREIGN KEY (usuario_id) REFERENCES usuarios  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- movimentacoes_financeiras
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimentacoes_financeiras (
  id                  INT           NOT NULL AUTO_INCREMENT,
  escola_id           INT           NOT NULL,
  conta_id            INT           NOT NULL,
  categoria_id        INT           NOT NULL,
  parcela_id          INT           DEFAULT NULL,
  tipo                ENUM('Entrada','Saida','Estorno','Transferencia') NOT NULL,
  valor               DECIMAL(10,2) NOT NULL,
  data_movimentacao   DATE          NOT NULL,
  forma_pagamento     VARCHAR(50)   DEFAULT NULL,
  descricao           VARCHAR(255)  DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_mf_escola    (escola_id),
  KEY idx_mf_conta     (conta_id),
  KEY idx_mf_categoria (categoria_id),
  KEY idx_mf_parcela   (parcela_id),
  CONSTRAINT fk_mf_escola    FOREIGN KEY (escola_id)    REFERENCES escolas                (id),
  CONSTRAINT fk_mf_conta     FOREIGN KEY (conta_id)     REFERENCES contas_bancarias       (id),
  CONSTRAINT fk_mf_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_financeiras (id),
  CONSTRAINT fk_mf_parcela   FOREIGN KEY (parcela_id)   REFERENCES parcelas               (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MÓDULO CONTRATOS
-- ============================================================

-- ------------------------------------------------------------
-- contratos_templates
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contratos_templates (
  id                    INT          NOT NULL AUTO_INCREMENT,
  escola_id             INT          NOT NULL,
  nome                  VARCHAR(200) NOT NULL,
  conteudo_html         LONGTEXT     NOT NULL,
  versao                INT          NOT NULL,
  ativo                 TINYINT      NOT NULL DEFAULT 0,
  criado_por_usuario_id INT          NOT NULL,
  data_criacao          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ct_escola_versao (escola_id, versao),
  KEY idx_ct_criado (criado_por_usuario_id),
  KEY idx_ct_ativo  (escola_id, ativo),
  CONSTRAINT fk_contratos_tpl_escola  FOREIGN KEY (escola_id)             REFERENCES escolas  (id),
  CONSTRAINT fk_contratos_tpl_criado FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- contratos_gerados
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contratos_gerados (
  id                       INT      NOT NULL AUTO_INCREMENT,
  escola_id                INT      NOT NULL,
  pre_aluno_id             INT      NOT NULL,
  template_id              INT      NOT NULL,
  conteudo_gerado_html     LONGTEXT NOT NULL,
  gerado_por_usuario_id    INT      NOT NULL,
  data_geracao             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cg_escola     (escola_id),
  KEY idx_cg_pre_aluno  (pre_aluno_id),
  KEY idx_cg_template   (template_id),
  KEY idx_cg_gerado     (gerado_por_usuario_id),
  CONSTRAINT fk_cg_escola   FOREIGN KEY (escola_id)             REFERENCES escolas             (id),
  CONSTRAINT fk_cg_pre_aluno FOREIGN KEY (pre_aluno_id)         REFERENCES pre_alunos          (id),
  CONSTRAINT fk_cg_template FOREIGN KEY (template_id)           REFERENCES contratos_templates (id),
  CONSTRAINT fk_cg_gerado   FOREIGN KEY (gerado_por_usuario_id) REFERENCES usuarios            (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MÓDULO ARQUIVOS DE TURMA
-- ============================================================

-- ------------------------------------------------------------
-- arquivos_turma_pastas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arquivos_turma_pastas (
  id                    INT          NOT NULL AUTO_INCREMENT,
  escola_id             INT          NOT NULL,
  livro_id              INT          NOT NULL,
  parent_id             INT          DEFAULT NULL,
  nome                  VARCHAR(150) NOT NULL,
  ordem                 INT          NOT NULL DEFAULT 0,
  status                ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  usuario_criacao_id    INT          NOT NULL,
  data_criacao          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_atp_livro   (livro_id),
  KEY idx_atp_parent  (parent_id),
  KEY idx_atp_usuario (usuario_criacao_id),
  KEY idx_atp_escola  (escola_id, livro_id, parent_id, status),
  CONSTRAINT fk_atp_escola  FOREIGN KEY (escola_id)         REFERENCES escolas              (id),
  CONSTRAINT fk_atp_livro   FOREIGN KEY (livro_id)          REFERENCES livros               (id),
  CONSTRAINT fk_atp_parent  FOREIGN KEY (parent_id)         REFERENCES arquivos_turma_pastas (id),
  CONSTRAINT fk_atp_usuario FOREIGN KEY (usuario_criacao_id) REFERENCES usuarios             (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- arquivos_turma
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arquivos_turma (
  id                            INT          NOT NULL AUTO_INCREMENT,
  escola_id                     INT          NOT NULL,
  livro_id                      INT          NOT NULL,
  pasta_id                      INT          DEFAULT NULL,
  nome_exibicao                 VARCHAR(255) NOT NULL,
  tipo_arquivo                  ENUM('PDF','DOC','DOCX') NOT NULL,
  url_storage                   VARCHAR(500) NOT NULL,
  status                        ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  usuario_upload_id             INT          NOT NULL,
  usuario_ultima_alteracao_id   INT          DEFAULT NULL,
  data_upload                   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_at_livro    (livro_id),
  KEY idx_at_pasta    (pasta_id),
  KEY idx_at_upload   (usuario_upload_id),
  KEY idx_at_alterado (usuario_ultima_alteracao_id),
  KEY idx_at_escola   (escola_id, livro_id, pasta_id, status),
  CONSTRAINT fk_at_escola   FOREIGN KEY (escola_id)                   REFERENCES escolas              (id),
  CONSTRAINT fk_at_livro    FOREIGN KEY (livro_id)                    REFERENCES livros               (id),
  CONSTRAINT fk_at_pasta    FOREIGN KEY (pasta_id)                    REFERENCES arquivos_turma_pastas (id),
  CONSTRAINT fk_at_upload   FOREIGN KEY (usuario_upload_id)           REFERENCES usuarios             (id),
  CONSTRAINT fk_at_alterado FOREIGN KEY (usuario_ultima_alteracao_id) REFERENCES usuarios             (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MÓDULO AUDITORIA
-- ============================================================

-- ------------------------------------------------------------
-- logs_auditoria
-- FK para escolas é opcional (ações globais não têm escola).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id               INT          NOT NULL AUTO_INCREMENT,
  escola_id        INT          DEFAULT NULL,
  usuario_id       INT          DEFAULT NULL,
  usuario_nome     VARCHAR(150) DEFAULT NULL,
  tabela_afetada   VARCHAR(50)  NOT NULL,
  registro_id      VARCHAR(50)  NOT NULL,
  acao             VARCHAR(30)  NOT NULL,
  descricao        TEXT         DEFAULT NULL,
  dados_anteriores JSON         DEFAULT NULL,
  dados_novos      JSON         DEFAULT NULL,
  data_hora        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_logs_data     (escola_id, usuario_id, data_hora),
  KEY idx_logs_tabela   (escola_id, tabela_afetada, data_hora),
  KEY idx_logs_registro (tabela_afetada, registro_id),
  CONSTRAINT fk_logs_escola FOREIGN KEY (escola_id) REFERENCES escolas (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DADOS OBRIGATÓRIOS — PERMISSÕES
-- Todo o catálogo de permissões do sistema.
-- ============================================================

INSERT INTO permissoes (nome, descricao) VALUES
-- Usuários
('VISUALIZAR_USUARIO',              'Ver lista e perfil de usuarios'),
('CRIAR_USUARIO',                   'Criar novos usuarios no sistema'),
('EDITAR_USUARIO',                  'Editar dados de usuarios existentes'),
('INATIVAR_USUARIO',                'Inativar/desativar usuarios'),
('GERENCIAR_PERMISSOES_USUARIO',    'Atribuir e remover permissoes de usuarios'),
-- Perfis
('VISUALIZAR_PERFIL',               'Ver lista de perfis'),
('CRIAR_PERFIL',                    'Criar novos perfis de acesso'),
('EDITAR_PERFIL',                   'Editar perfis existentes'),
-- Escolas
('VISUALIZAR_ESCOLAS',              'Listar todas as escolas do sistema'),
('GERENCIAR_ESCOLAS',               'Criar, editar e gerenciar escolas (Super Admin)'),
-- Pré-alunos
('VISUALIZAR_PRE_ALUNO',            'Ver lista e detalhes de pre-alunos'),
('CRIAR_PRE_ALUNO',                 'Criar ficha de pre-aluno (interessado)'),
('EDITAR_PRE_ALUNO',                'Editar dados de pre-alunos'),
('CANCELAR_PRE_ALUNO',              'Cancelar ficha de pre-aluno'),
-- Contratos
('VISUALIZAR_CONTRATO',             'Ver contratos gerados'),
('GERAR_CONTRATO',                  'Gerar contrato a partir do template'),
('VISUALIZAR_TEMPLATE_CONTRATO',    'Ver templates de contrato'),
('CRIAR_TEMPLATE_CONTRATO',         'Criar nova versao de template de contrato'),
('EDITAR_TEMPLATE_CONTRATO',        'Editar template base de contrato'),
('INATIVAR_TEMPLATE_CONTRATO',      'Inativar template de contrato'),
('DEVOLVER_MATRICULA_COMERCIAL',    'Devolver pendencia de matricula ao comercial para ajustes'),
('REMOVER_ANEXO_MATRICULA',         'Remover anexo da ficha de matricula ou pre-matricula'),
-- Alunos
('VISUALIZAR_ALUNO',                'Ver perfil e dados do aluno'),
('CRIAR_ALUNO',                     'Cadastrar novo aluno'),
('EDITAR_ALUNO',                    'Editar dados cadastrais do aluno'),
('INATIVAR_ALUNO',                  'Inativar aluno'),
('TRANCAR_ALUNO',                   'Trancar matricula do aluno'),
('VISUALIZAR_HISTORICO_ALUNO',      'Ver historico completo do aluno'),
('ANEXAR_DOCUMENTO_ALUNO',          'Anexar documento a ficha do aluno'),
('INATIVAR_DOCUMENTO_ALUNO',        'Inativar documento na ficha'),
('EXCLUIR_DOCUMENTO_ALUNO',         'Excluir documento da ficha'),
('JUSTIFICAR_FALTA_ALUNO',          'Registrar justificativa de falta do aluno'),
-- Responsáveis
('VISUALIZAR_RESPONSAVEL',          'Ver dados de responsaveis'),
('CRIAR_RESPONSAVEL',               'Cadastrar novo responsavel'),
('EDITAR_RESPONSAVEL',              'Editar dados de responsaveis'),
('INATIVAR_RESPONSAVEL',            'Inativar responsavel'),
-- Filiações
('CRIAR_FILIACAO',                  'Cadastrar dados de filiacao do aluno'),
('EDITAR_FILIACAO',                 'Editar dados de filiacao'),
-- Matrículas
('VISUALIZAR_MATRICULA',            'Ver matriculas'),
('CRIAR_MATRICULA',                 'Matricular aluno em turma'),
('EDITAR_MATRICULA',                'Editar dados de matricula'),
('CANCELAR_MATRICULA',              'Cancelar matricula'),
('APROVAR_MATRICULA',               'Aprovar pre-aluno para matricula'),
('REPROVAR_MATRICULA',              'Reprovar matricula de pre-aluno'),
('FINALIZAR_MATRICULA',             'Converter pre-aluno em aluno matriculado'),
-- Turmas
('VISUALIZAR_TURMA',                'Ver lista e detalhes de turmas'),
('CRIAR_TURMA',                     'Criar novas turmas'),
('EDITAR_TURMA',                    'Editar dados de turmas'),
('AGENDAR_TURMA',                   'Definir dia, horario e gerar aulas da turma'),
('EDITAR_DIAS_TURMA',               'Alterar dias da semana da turma'),
('CONCLUIR_TURMA',                  'Marcar turma como concluida'),
('INATIVAR_TURMA',                  'Inativar turma'),
('CANCELAR_TURMA',                  'Cancelar turma'),
('VINCULAR_ALUNO_TURMA',            'Vincular aluno em turma'),
('DESVINCULAR_ALUNO_TURMA',         'Desvincular aluno de turma'),
('REMANEJAR_ALUNO',                 'Transferir aluno de turma'),
-- Aulas
('VISUALIZAR_AULA',                 'Ver agenda de aulas'),
('CRIAR_AULA',                      'Criar aula avulsa'),
('EDITAR_AULA',                     'Editar dados da aula'),
('CANCELAR_AULA',                   'Cancelar aula'),
('REALIZAR_AULA',                   'Marcar aula como realizada'),
('REGISTRAR_CONTEUDO_AULA',         'Registrar conteudo dado na aula'),
-- Chamada
('VISUALIZAR_PRESENCA',             'Ver historico de presenca'),
('REALIZAR_CHAMADA',                'Fazer chamada (registrar presenca/falta)'),
('EDITAR_PRESENCA',                 'Editar presenca ja lancada'),
-- Homework
('VISUALIZAR_HOMEWORK',             'Ver notas de homework'),
('LANCAR_HOMEWORK',                 'Lancar nota de homework'),
('EDITAR_HOMEWORK',                 'Editar nota de homework'),
-- Avaliações
('VISUALIZAR_AVALIACAO',            'Ver notas de avaliacoes'),
('LANCAR_AVALIACAO',                'Lancar notas de avaliacoes'),
('EDITAR_AVALIACAO',                'Editar notas de avaliacoes'),
-- Ocorrências
('VISUALIZAR_OCORRENCIA',           'Ver historico de ocorrencias'),
('CRIAR_OCORRENCIA_ACADEMICA',      'Registrar ocorrencia academica'),
('CRIAR_OCORRENCIA_ADMINISTRATIVA', 'Registrar ocorrencia administrativa'),
('EDITAR_OCORRENCIA',               'Editar ocorrencias registradas'),
-- Reposições
('VISUALIZAR_REPOSICAO',            'Ver lista de reposicoes'),
('CRIAR_REPOSICAO',                 'Agendar aula de reposicao'),
('EDITAR_REPOSICAO',                'Editar reposicao agendada'),
('REALIZAR_REPOSICAO',              'Realizar chamada em reposicao'),
('CANCELAR_REPOSICAO',              'Cancelar reposicao'),
-- Livros
('VISUALIZAR_LIVRO',                'Ver catalogo de livros'),
('CRIAR_LIVRO',                     'Cadastrar novo livro/nivel'),
('EDITAR_LIVRO',                    'Editar dados de livros'),
('INATIVAR_LIVRO',                  'Inativar livro'),
-- Capítulos
('VISUALIZAR_CAPITULO',             'Ver capitulos de livros'),
('CRIAR_CAPITULO',                  'Criar capitulo em livro'),
('EDITAR_CAPITULO',                 'Editar capitulo (nome, qtd aulas)'),
('INATIVAR_CAPITULO',               'Inativar capitulo'),
('VISUALIZAR_PROGRESSO_CAPITULO',   'Ver progresso de capitulos da turma'),
('MARCAR_CAPITULO_CONCLUIDO',       'Marcar capitulo como concluido na turma'),
-- Calendário
('VISUALIZAR_CALENDARIO',           'Ver calendario geral'),
('GERENCIAR_CALENDARIO',            'Marcar feriados, recessos e eventos no calendario'),
('EDITAR_EVENTO_CALENDARIO',        'Editar eventos do calendario'),
('EXCLUIR_EVENTO_CALENDARIO',       'Remover eventos do calendario'),
('VISUALIZAR_AGENDA_GLOBAL',        'Ver agenda global de aulas'),
-- Compromissos
('VISUALIZAR_COMPROMISSOS',                'Ver agenda de compromissos'),
('CRIAR_COMPROMISSO',                      'Criar compromisso na agenda pessoal'),
('EDITAR_COMPROMISSO',                     'Editar compromisso'),
('EXCLUIR_COMPROMISSO',                    'Excluir compromisso'),
('VISUALIZAR_COMPROMISSOS_OUTROS',         'Ver compromissos de outros usuarios'),
('ADICIONAR_PARTICIPANTE_COMPROMISSO',     'Adicionar participantes em compromisso'),
('CONFIRMAR_COMPROMISSO',                  'Confirmar presenca em compromisso'),
('RECUSAR_COMPROMISSO',                    'Recusar compromisso'),
-- Arquivos de turma
('VISUALIZAR_ARQUIVO_TURMA',        'Ver, baixar ou imprimir arquivo de turma'),
('CRIAR_PASTA_ARQUIVO_TURMA',       'Criar pasta de agrupamento sob um livro'),
('UPLOAD_ARQUIVO_TURMA',            'Upload de arquivo em pasta de livro'),
('EDITAR_PASTA_ARQUIVO_TURMA',      'Renomear ou reordenar pasta de arquivos de turma'),
('EDITAR_ARQUIVO_TURMA',            'Substituir arquivo ou alterar nome de exibicao'),
('INATIVAR_PASTA_ARQUIVO_TURMA',    'Inativar pasta de arquivos de turma'),
('INATIVAR_ARQUIVO_TURMA',          'Inativar arquivo de turma'),
-- Parcelas
('VISUALIZAR_PARCELA',              'Ver parcelas de alunos'),
('CRIAR_PARCELA',                   'Criar nova parcela financeira'),
('EDITAR_PARCELA',                  'Editar dados de parcela'),
('BAIXA_PARCELA',                   'Dar baixa em parcela (marcar como paga)'),
('ESTORNAR_PARCELA',                'Estornar pagamento de parcela'),
('INATIVAR_PARCELA',                'Inativar/cancelar parcela'),
('GERAR_CARNE_ESCOLAR',             'Gerar carne escolar'),
('GERAR_RECIBO',                    'Gerar recibo de pagamento'),
('VISUALIZAR_HISTORICO_PARCELA',    'Ver historico de alteracoes de parcelas'),
-- Movimentações financeiras
('VISUALIZAR_MOVIMENTACAO_FINANCEIRA', 'Ver movimentacoes financeiras'),
-- Contas bancárias
('VISUALIZAR_CONTA_BANCARIA',       'Ver contas bancarias'),
('CRIAR_CONTA_BANCARIA',            'Cadastrar conta bancaria'),
('EDITAR_CONTA_BANCARIA',           'Editar conta bancaria'),
('INATIVAR_CONTA_BANCARIA',         'Inativar conta bancaria'),
-- Categorias financeiras
('VISUALIZAR_CATEGORIA_FINANCEIRA', 'Ver categorias financeiras'),
('CRIAR_CATEGORIA_FINANCEIRA',      'Criar categoria financeira'),
('EDITAR_CATEGORIA_FINANCEIRA',     'Editar categoria financeira'),
('INATIVAR_CATEGORIA_FINANCEIRA',   'Inativar categoria financeira'),
-- Relatórios
('VISUALIZAR_RELATORIO_FREQUENCIA',    'Ver relatorio de frequencia'),
('VISUALIZAR_RELATORIO_NOTAS',         'Ver relatorio de notas'),
('VISUALIZAR_RELATORIO_TURMAS',        'Ver relatorio de turmas'),
('VISUALIZAR_RELATORIO_ALUNOS',        'Ver relatorio de alunos'),
('VISUALIZAR_RELATORIO_FINANCEIRO',    'Ver relatorios financeiros'),
('VISUALIZAR_RELATORIO_INADIMPLENCIA', 'Ver relatorio de inadimplencia'),
('VISUALIZAR_RELATORIO_RECEITAS',      'Ver relatorio de receitas'),
-- Dashboards
('VISUALIZAR_DASHBOARD_GERAL',         'Ver dashboard geral do sistema'),
('VISUALIZAR_DASHBOARD_FINANCEIRO',    'Ver dashboard financeiro'),
('VISUALIZAR_DASHBOARD_ACADEMICO',     'Ver dashboard academico'),
-- Auditoria
('VISUALIZAR_LOGS_AUDITORIA',       'Ver logs de auditoria do sistema'),
('VISUALIZAR_LOGS_USUARIO',         'Ver acoes de um usuario especifico'),
('EXPORTAR_LOGS',                   'Exportar logs de auditoria'),
-- Sistema
('GERENCIAR_CONFIGURACOES_SISTEMA', 'Alterar configuracoes gerais do sistema'),
('GERENCIAR_BACKUP',                'Realizar backup e restore do sistema'),
('VISUALIZAR_METRICAS_SISTEMA',     'Ver metricas e performance do sistema'),
('IMPORTAR_ALUNOS',                 'Importar alunos em massa'),
('EXPORTAR_ALUNOS',                 'Exportar lista de alunos'),
('IMPORTAR_FINANCEIRO',             'Importar dados financeiros'),
('EXPORTAR_FINANCEIRO',             'Exportar dados financeiros');

-- ============================================================
-- DADOS OBRIGATORIOS - TEMPLATES DE PERFIL
-- ============================================================

INSERT INTO perfis_template (nome) VALUES
  ('Administrador'),
  ('Professor'),
  ('Comercial'),
  ('Secretaria'),
  ('Financeiro'),
  ('Coordenador');

-- ============================================================
-- VINCULOS: perfis_template x permissoes
-- ============================================================

-- Administrador
INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome NOT IN ('GERENCIAR_ESCOLAS','VISUALIZAR_ESCOLAS')
WHERE pt.nome = 'Administrador';

-- Professor
INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome IN (
  'VISUALIZAR_DASHBOARD_GERAL','VISUALIZAR_DASHBOARD_ACADEMICO',
  'VISUALIZAR_TURMA','VISUALIZAR_AULA','VISUALIZAR_AGENDA_GLOBAL',
  'REALIZAR_CHAMADA','VISUALIZAR_PRESENCA','EDITAR_PRESENCA',
  'REGISTRAR_CONTEUDO_AULA','REALIZAR_AULA',
  'LANCAR_HOMEWORK','VISUALIZAR_HOMEWORK','EDITAR_HOMEWORK',
  'LANCAR_AVALIACAO','VISUALIZAR_AVALIACAO','EDITAR_AVALIACAO',
  'CRIAR_OCORRENCIA_ACADEMICA','VISUALIZAR_OCORRENCIA',
  'VISUALIZAR_REPOSICAO','CRIAR_REPOSICAO','EDITAR_REPOSICAO','REALIZAR_REPOSICAO','CANCELAR_REPOSICAO',
  'VISUALIZAR_ALUNO','VISUALIZAR_HISTORICO_ALUNO',
  'VISUALIZAR_LIVRO','VISUALIZAR_CAPITULO','VISUALIZAR_PROGRESSO_CAPITULO','MARCAR_CAPITULO_CONCLUIDO',
  'VISUALIZAR_ARQUIVO_TURMA',
  'VISUALIZAR_CALENDARIO',
  'CRIAR_COMPROMISSO','VISUALIZAR_COMPROMISSOS','EDITAR_COMPROMISSO','EXCLUIR_COMPROMISSO',
  'CONFIRMAR_COMPROMISSO','RECUSAR_COMPROMISSO'
)
WHERE pt.nome = 'Professor';

-- Comercial
INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome IN (
  'VISUALIZAR_DASHBOARD_GERAL',
  'VISUALIZAR_PRE_ALUNO','CRIAR_PRE_ALUNO','EDITAR_PRE_ALUNO','CANCELAR_PRE_ALUNO',
  'VISUALIZAR_CONTRATO','GERAR_CONTRATO',
  'VISUALIZAR_TEMPLATE_CONTRATO',
  'VISUALIZAR_RESPONSAVEL',
  'CRIAR_COMPROMISSO','VISUALIZAR_COMPROMISSOS','EDITAR_COMPROMISSO','EXCLUIR_COMPROMISSO',
  'CONFIRMAR_COMPROMISSO','RECUSAR_COMPROMISSO'
)
WHERE pt.nome = 'Comercial';

-- Secretaria
INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome IN (
  'VISUALIZAR_DASHBOARD_GERAL',
  'VISUALIZAR_PRE_ALUNO',
  'VISUALIZAR_MATRICULA','CRIAR_MATRICULA','EDITAR_MATRICULA','CANCELAR_MATRICULA',
  'APROVAR_MATRICULA','REPROVAR_MATRICULA','FINALIZAR_MATRICULA',
  'DEVOLVER_MATRICULA_COMERCIAL','REMOVER_ANEXO_MATRICULA',
  'VISUALIZAR_ALUNO','CRIAR_ALUNO','EDITAR_ALUNO','INATIVAR_ALUNO','TRANCAR_ALUNO',
  'VISUALIZAR_HISTORICO_ALUNO','ANEXAR_DOCUMENTO_ALUNO','JUSTIFICAR_FALTA_ALUNO',
  'VISUALIZAR_RESPONSAVEL','CRIAR_RESPONSAVEL','EDITAR_RESPONSAVEL',
  'CRIAR_FILIACAO','EDITAR_FILIACAO',
  'VISUALIZAR_TURMA','VINCULAR_ALUNO_TURMA','DESVINCULAR_ALUNO_TURMA',
  'VISUALIZAR_RELATORIO_ALUNOS',
  'VISUALIZAR_CALENDARIO',
  'CRIAR_COMPROMISSO','VISUALIZAR_COMPROMISSOS','EDITAR_COMPROMISSO','EXCLUIR_COMPROMISSO',
  'CONFIRMAR_COMPROMISSO','RECUSAR_COMPROMISSO',
  'ADICIONAR_PARTICIPANTE_COMPROMISSO'
)
WHERE pt.nome = 'Secretaria';

-- Financeiro
INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome IN (
  'VISUALIZAR_DASHBOARD_GERAL','VISUALIZAR_DASHBOARD_FINANCEIRO',
  'VISUALIZAR_ALUNO','VISUALIZAR_RESPONSAVEL',
  'VISUALIZAR_MATRICULA',
  'VISUALIZAR_PARCELA','CRIAR_PARCELA','EDITAR_PARCELA',
  'BAIXA_PARCELA','ESTORNAR_PARCELA','INATIVAR_PARCELA',
  'GERAR_CARNE_ESCOLAR','GERAR_RECIBO','VISUALIZAR_HISTORICO_PARCELA',
  'VISUALIZAR_MOVIMENTACAO_FINANCEIRA',
  'VISUALIZAR_CONTA_BANCARIA','CRIAR_CONTA_BANCARIA','EDITAR_CONTA_BANCARIA','INATIVAR_CONTA_BANCARIA',
  'VISUALIZAR_CATEGORIA_FINANCEIRA','CRIAR_CATEGORIA_FINANCEIRA',
  'EDITAR_CATEGORIA_FINANCEIRA','INATIVAR_CATEGORIA_FINANCEIRA',
  'VISUALIZAR_RELATORIO_FINANCEIRO','VISUALIZAR_RELATORIO_INADIMPLENCIA','VISUALIZAR_RELATORIO_RECEITAS',
  'EXPORTAR_FINANCEIRO','IMPORTAR_FINANCEIRO',
  'CRIAR_COMPROMISSO','VISUALIZAR_COMPROMISSOS','EDITAR_COMPROMISSO','EXCLUIR_COMPROMISSO',
  'CONFIRMAR_COMPROMISSO','RECUSAR_COMPROMISSO'
)
WHERE pt.nome = 'Financeiro';

-- Coordenador
INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome IN (
  'VISUALIZAR_DASHBOARD_GERAL','VISUALIZAR_DASHBOARD_ACADEMICO',
  'VISUALIZAR_TURMA','CRIAR_TURMA','EDITAR_TURMA','AGENDAR_TURMA','EDITAR_DIAS_TURMA',
  'CONCLUIR_TURMA','INATIVAR_TURMA','CANCELAR_TURMA',
  'VINCULAR_ALUNO_TURMA','DESVINCULAR_ALUNO_TURMA','REMANEJAR_ALUNO',
  'VISUALIZAR_AULA','CRIAR_AULA','EDITAR_AULA','CANCELAR_AULA','REALIZAR_AULA',
  'REGISTRAR_CONTEUDO_AULA','VISUALIZAR_AGENDA_GLOBAL',
  'REALIZAR_CHAMADA','VISUALIZAR_PRESENCA','EDITAR_PRESENCA','JUSTIFICAR_FALTA_ALUNO',
  'LANCAR_HOMEWORK','VISUALIZAR_HOMEWORK','EDITAR_HOMEWORK',
  'LANCAR_AVALIACAO','VISUALIZAR_AVALIACAO','EDITAR_AVALIACAO',
  'CRIAR_OCORRENCIA_ACADEMICA','CRIAR_OCORRENCIA_ADMINISTRATIVA','VISUALIZAR_OCORRENCIA','EDITAR_OCORRENCIA',
  'VISUALIZAR_REPOSICAO','CRIAR_REPOSICAO','EDITAR_REPOSICAO','REALIZAR_REPOSICAO','CANCELAR_REPOSICAO',
  'VISUALIZAR_ALUNO','VISUALIZAR_HISTORICO_ALUNO',
  'VISUALIZAR_LIVRO','CRIAR_LIVRO','EDITAR_LIVRO','INATIVAR_LIVRO',
  'VISUALIZAR_CAPITULO','CRIAR_CAPITULO','EDITAR_CAPITULO','INATIVAR_CAPITULO',
  'VISUALIZAR_PROGRESSO_CAPITULO','MARCAR_CAPITULO_CONCLUIDO',
  'VISUALIZAR_ARQUIVO_TURMA','CRIAR_PASTA_ARQUIVO_TURMA','EDITAR_PASTA_ARQUIVO_TURMA',
  'INATIVAR_PASTA_ARQUIVO_TURMA','UPLOAD_ARQUIVO_TURMA','EDITAR_ARQUIVO_TURMA','INATIVAR_ARQUIVO_TURMA',
  'VISUALIZAR_CALENDARIO','GERENCIAR_CALENDARIO','EDITAR_EVENTO_CALENDARIO','EXCLUIR_EVENTO_CALENDARIO',
  'VISUALIZAR_RELATORIO_FREQUENCIA','VISUALIZAR_RELATORIO_NOTAS',
  'VISUALIZAR_RELATORIO_TURMAS','VISUALIZAR_RELATORIO_ALUNOS',
  'EXPORTAR_ALUNOS',
  'CRIAR_COMPROMISSO','VISUALIZAR_COMPROMISSOS','EDITAR_COMPROMISSO','EXCLUIR_COMPROMISSO',
  'VISUALIZAR_COMPROMISSOS_OUTROS','ADICIONAR_PARTICIPANTE_COMPROMISSO',
  'CONFIRMAR_COMPROMISSO','RECUSAR_COMPROMISSO'
)
WHERE pt.nome = 'Coordenador';

-- ============================================================
-- DADOS OBRIGATORIOS - ESCOLA SYSTEM + SUPERADMIN
-- ============================================================

INSERT INTO escolas (codigo_escola, nome_fantasia, razao_social, status)
VALUES ('SYSTEM', 'Learly - Administracao Global', 'Learly Sistema', 'Ativo');

INSERT INTO perfis (escola_id, nome, descricao, status)
SELECT id, 'Super Admin', 'Acesso global do sistema', 'Ativo'
FROM escolas
WHERE codigo_escola = 'SYSTEM';

INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN escolas e ON e.id = p.escola_id AND e.codigo_escola = 'SYSTEM'
JOIN permissoes perm ON perm.nome IN ('GERENCIAR_ESCOLAS','VISUALIZAR_ESCOLAS')
WHERE p.nome = 'Super Admin';

-- Usuario bootstrap
INSERT INTO usuarios (escola_id, nome_completo, email, senha, perfil_id, status)
SELECT
  e.id,
  'Super Administrador',
  'admin',
  'admin',
  p.id,
  'Ativo'
FROM escolas e
JOIN perfis p ON p.escola_id = e.id AND p.nome = 'Super Admin'
WHERE e.codigo_escola = 'SYSTEM';

-- ============================================================
-- MIGRACOES EF
-- ============================================================

CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
  `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
  `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
  CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`) VALUES
  ('20260422234757_InitialCleanArchitecture',              '10.0.0'),
  ('20260424012952_PerfisPermissoesTemplate',              '10.0.0'),
  ('20260504121858_MatriculasTurmaOpcionalStatusEmEspera', '10.0.0'),
  ('20260514000000_ContratosModule',                       '10.0.0'),
  ('20260516120000_ContratosAlignColumns',                 '10.0.0'),
  ('20260521120000_PreAlunoDocumentosModule',              '10.0.0'),
  ('20260521140000_PreResponsaveisModule',                 '10.0.0');

-- FIM DO SETUP
