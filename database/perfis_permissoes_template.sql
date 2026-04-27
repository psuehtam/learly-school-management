-- ============================================================
-- LEARLY — Templates de perfil e permissões (tenant)
-- Espelha PermissoesPadraoPorPerfil em EscolasService.cs ao criar escola.
-- Coordenador: sem permissões de gestão de usuários.
--
-- Sem conflito com insert.sql: aqui são perfis_template e
-- perfil_permissoes_template (globais). insert.sql preenche perfis e
-- perfil_permissoes por escola (ex.: ESCOLA01), com regras de demo que podem
-- ser mais amplas que este template — são propósitos diferentes.
--
-- ORDEM: após permissoes.sql (tabela permissoes populada).
-- Em instalação completa: db.sql → permissoes.sql → este arquivo → insert.sql
-- ============================================================

USE learly_db;

CREATE TABLE IF NOT EXISTS perfis_template (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    UNIQUE (nome)
);

CREATE TABLE IF NOT EXISTS perfil_permissoes_template (
    perfil_template_id INT NOT NULL,
    permissao_id       INT NOT NULL,
    PRIMARY KEY (perfil_template_id, permissao_id),
    FOREIGN KEY (perfil_template_id) REFERENCES perfis_template(id),
    FOREIGN KEY (permissao_id) REFERENCES permissoes(id)
);

-- Perfis padrão (mesma ordem conceitual que PerfisPadrao no C#)
INSERT INTO perfis_template (nome)
SELECT v.nome
FROM (
    SELECT 'Administrador' AS nome UNION ALL
    SELECT 'Professor'              UNION ALL
    SELECT 'Comercial'              UNION ALL
    SELECT 'Secretaria'             UNION ALL
    SELECT 'Financeiro'             UNION ALL
    SELECT 'Coordenador'
) AS v
WHERE NOT EXISTS (SELECT 1 FROM perfis_template pt WHERE pt.nome = v.nome);

-- Administrador (GERENCIAR_ESCOLAS fica fora — removido em runtime no C#)
INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome IN (
    'CRIAR_USUARIO', 'VISUALIZAR_USUARIO', 'EDITAR_USUARIO', 'INATIVAR_USUARIO',
    'GERENCIAR_PERMISSOES_USUARIO', 'VISUALIZAR_TURMA', 'VISUALIZAR_AULA',
    'VISUALIZAR_MATRICULA', 'VISUALIZAR_PRE_ALUNO', 'VISUALIZAR_PARCELA',
    'VISUALIZAR_ALUNO', 'VISUALIZAR_REPOSICAO', 'VISUALIZAR_LIVRO',
    'VISUALIZAR_CALENDARIO', 'VISUALIZAR_DASHBOARD_GERAL', 'VISUALIZAR_AGENDA_GLOBAL'
)
WHERE pt.nome = 'Administrador'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes_template ppt
    WHERE ppt.perfil_template_id = pt.id AND ppt.permissao_id = p.id
  );

INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome IN (
    'VISUALIZAR_AULA', 'VISUALIZAR_TURMA', 'VISUALIZAR_CALENDARIO', 'VISUALIZAR_COMPROMISSOS'
)
WHERE pt.nome = 'Professor'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes_template ppt
    WHERE ppt.perfil_template_id = pt.id AND ppt.permissao_id = p.id
  );

INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome IN (
    'VISUALIZAR_PRE_ALUNO', 'CRIAR_PRE_ALUNO', 'VISUALIZAR_COMPROMISSOS', 'CRIAR_COMPROMISSO'
)
WHERE pt.nome = 'Comercial'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes_template ppt
    WHERE ppt.perfil_template_id = pt.id AND ppt.permissao_id = p.id
  );

INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome IN (
    'VISUALIZAR_MATRICULA', 'CRIAR_MATRICULA', 'VISUALIZAR_ALUNO', 'VISUALIZAR_COMPROMISSOS'
)
WHERE pt.nome = 'Secretaria'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes_template ppt
    WHERE ppt.perfil_template_id = pt.id AND ppt.permissao_id = p.id
  );

INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome IN (
    'VISUALIZAR_PARCELA', 'VISUALIZAR_MOVIMENTACAO_FINANCEIRA', 'VISUALIZAR_COMPROMISSOS'
)
WHERE pt.nome = 'Financeiro'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes_template ppt
    WHERE ppt.perfil_template_id = pt.id AND ppt.permissao_id = p.id
  );

-- Coordenador: sem CRIAR/EDITAR/VISUALIZAR/INATIVAR_USUARIO nem GERENCIAR_PERMISSOES_USUARIO
INSERT INTO perfil_permissoes_template (perfil_template_id, permissao_id)
SELECT pt.id, p.id
FROM perfis_template pt
JOIN permissoes p ON p.nome IN (
    'VISUALIZAR_TURMA', 'VISUALIZAR_AULA', 'VISUALIZAR_REPOSICAO',
    'VISUALIZAR_DASHBOARD_GERAL', 'VISUALIZAR_COMPROMISSOS'
)
WHERE pt.nome = 'Coordenador'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes_template ppt
    WHERE ppt.perfil_template_id = pt.id AND ppt.permissao_id = p.id
  );
