-- ============================================================
-- LEARLY — Script de Inserção de Dados
-- Versão: 1.0
--
-- ORDEM DE EXECUÇÃO:
--   1. db.sql                          → cria o schema (tabelas e índices)
--   2. permissoes.sql                  → insere todas as permissões do sistema
--   3. perfis_permissoes_template.sql  → templates globais perfil/permissão (novas escolas)
--   4. insert.sql                      → este arquivo (Super Admin + seed de testes)
--
-- CREDENCIAIS DE ACESSO (testes):
--   Super Admin  → email: admin          | senha: admin  | escola: SYSTEM
--   Admin        → email: ana.admin@learly.com | senha: 123456 | escola: ESCOLA01
--   Coordenador  → email: roberto.coord@learly.com
--   Professor A  → email: camila.prof@learly.com
--   Professor B  → email: diego.prof@learly.com
--   Secretaria   → email: fernanda.sec@learly.com
--   Comercial    → email: lucas.com@learly.com
-- ============================================================

USE learly_db;

-- ============================================================
-- BLOCO 1 — SUPER ADMIN
-- Escola técnica SYSTEM + perfil Super Admin + usuário admin/admin
-- JWT sem tenant (isSuperAdmin = true, sem codigoEscola).
-- Para login de escola normal, codigoEscola é obrigatório.
-- ============================================================

-- Garante permissões de escola (sem aviso de duplicata)
INSERT INTO permissoes (nome, descricao)
SELECT 'GERENCIAR_ESCOLAS', 'Criar, editar e gerenciar escolas (Super Admin)'
WHERE NOT EXISTS (SELECT 1 FROM permissoes WHERE nome = 'GERENCIAR_ESCOLAS');

INSERT INTO permissoes (nome, descricao)
SELECT 'VISUALIZAR_ESCOLAS', 'Listar todas as escolas do sistema'
WHERE NOT EXISTS (SELECT 1 FROM permissoes WHERE nome = 'VISUALIZAR_ESCOLAS');

-- Escola reservada para operação global
INSERT INTO escolas (codigo_escola, nome_fantasia, razao_social, cnpj, status)
SELECT 'SYSTEM', 'Learly — Administração Global', 'Learly Sistema', NULL, 'Ativo'
WHERE NOT EXISTS (SELECT 1 FROM escolas WHERE codigo_escola = 'SYSTEM');

-- Perfil Super Admin (dentro da escola SYSTEM)
INSERT INTO perfis (escola_id, nome, descricao, status)
SELECT e.id, 'Super Admin', 'Acesso global — gestão de escolas', 'Ativo'
FROM escolas e
WHERE e.codigo_escola = 'SYSTEM'
  AND NOT EXISTS (
    SELECT 1 FROM perfis p WHERE p.escola_id = e.id AND p.nome = 'Super Admin'
  );

-- Permissões do perfil Super Admin
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN escolas e   ON e.id = p.escola_id AND e.codigo_escola = 'SYSTEM'
JOIN permissoes perm ON perm.nome IN ('GERENCIAR_ESCOLAS', 'VISUALIZAR_ESCOLAS')
WHERE p.nome = 'Super Admin'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes pp
    WHERE pp.perfil_id = p.id AND pp.permissao_id = perm.id
  );

-- Usuário admin (senha plain — backend faz hash no 1º login)
INSERT INTO usuarios (escola_id, nome_completo, email, senha, perfil_id, status)
SELECT
  e.id,
  'Super Administrador',
  'admin',
  'admin',
  (SELECT p.id FROM perfis p WHERE p.escola_id = e.id AND p.nome = 'Super Admin' LIMIT 1),
  'Ativo'
FROM escolas e
WHERE e.codigo_escola = 'SYSTEM'
  AND NOT EXISTS (
    SELECT 1 FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'admin'
  );

-- ============================================================
-- BLOCO 2 — ESCOLA DE TESTE (ESCOLA01)
-- ============================================================

INSERT INTO escolas (codigo_escola, nome_fantasia, razao_social, cnpj, status) VALUES
('ESCOLA01', 'Learly English School', 'Learly Escola de Idiomas Ltda', '12.345.678/0001-99', 'Ativo');

-- ============================================================
-- BLOCO 3 — PERFIS DA ESCOLA01
-- ============================================================

INSERT INTO perfis (escola_id, nome, descricao, status)
SELECT e.id, 'Administrador', 'Acesso total à escola', 'Ativo'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO perfis (escola_id, nome, descricao, status)
SELECT e.id, 'Coordenador', 'Gestão pedagógica e operacional', 'Ativo'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO perfis (escola_id, nome, descricao, status)
SELECT e.id, 'Professor', 'Acesso a turmas e aulas próprias', 'Ativo'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO perfis (escola_id, nome, descricao, status)
SELECT e.id, 'Secretaria', 'Cadastros e matrículas', 'Ativo'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO perfis (escola_id, nome, descricao, status)
SELECT e.id, 'Comercial', 'Pré-alunos e contratos', 'Ativo'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 4 — PERMISSÕES DOS PERFIS (ESCOLA01)
-- Grava em perfis / perfil_permissoes (dados do tenant), não em perfis_template.
-- Os templates globais (perfis_permissoes_template.sql) espelham o padrão de NOVAS
-- escolas (EscolasService); este bloco usa conjuntos maiores ou distintos só para
-- testes e cenários do seed (ex.: Admin com todas as permissoes, Coordenador amplo).
-- ============================================================

-- Administrador: todas as permissões do sistema
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN escolas e ON e.id = p.escola_id AND e.codigo_escola = 'ESCOLA01'
CROSS JOIN permissoes perm
WHERE p.nome = 'Administrador'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes pp WHERE pp.perfil_id = p.id AND pp.permissao_id = perm.id
  );

-- Professor: aulas, chamada, homework, avaliações, reposições e arquivos (somente visualização)
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN escolas e ON e.id = p.escola_id AND e.codigo_escola = 'ESCOLA01'
JOIN permissoes perm ON perm.nome IN (
  'VISUALIZAR_AULA', 'REALIZAR_AULA', 'REGISTRAR_CONTEUDO_AULA',
  'REALIZAR_CHAMADA', 'VISUALIZAR_PRESENCA', 'EDITAR_PRESENCA',
  'LANCAR_HOMEWORK', 'VISUALIZAR_HOMEWORK', 'EDITAR_HOMEWORK',
  'LANCAR_AVALIACAO', 'VISUALIZAR_AVALIACAO', 'EDITAR_AVALIACAO',
  'CRIAR_OCORRENCIA_ACADEMICA', 'VISUALIZAR_OCORRENCIA',
  'VISUALIZAR_REPOSICAO', 'CRIAR_REPOSICAO', 'REALIZAR_REPOSICAO',
  'VISUALIZAR_TURMA', 'VISUALIZAR_ALUNO', 'VISUALIZAR_MATRICULA',
  'VISUALIZAR_ARQUIVO_TURMA', 'VISUALIZAR_CALENDARIO',
  'CRIAR_COMPROMISSO', 'VISUALIZAR_COMPROMISSOS', 'EDITAR_COMPROMISSO', 'EXCLUIR_COMPROMISSO',
  'CONFIRMAR_COMPROMISSO', 'RECUSAR_COMPROMISSO', 'ADICIONAR_PARTICIPANTE_COMPROMISSO',
  'VISUALIZAR_CAPITULO', 'MARCAR_CAPITULO_CONCLUIDO', 'VISUALIZAR_PROGRESSO_CAPITULO'
)
WHERE p.nome = 'Professor'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes pp WHERE pp.perfil_id = p.id AND pp.permissao_id = perm.id
  );

-- Coordenador: tudo exceto configurações avançadas de sistema e financeiro restrito
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN escolas e ON e.id = p.escola_id AND e.codigo_escola = 'ESCOLA01'
JOIN permissoes perm ON perm.nome NOT IN (
  'GERENCIAR_ESCOLAS', 'GERENCIAR_BACKUP', 'GERENCIAR_CONFIGURACOES_SISTEMA',
  'IMPORTAR_FINANCEIRO', 'EXPORTAR_FINANCEIRO', 'ESTORNAR_PARCELA'
)
WHERE p.nome = 'Coordenador'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes pp WHERE pp.perfil_id = p.id AND pp.permissao_id = perm.id
  );

-- Secretaria: alunos, responsáveis, matrículas, turmas (visualização), financeiro básico e calendário
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN escolas e ON e.id = p.escola_id AND e.codigo_escola = 'ESCOLA01'
JOIN permissoes perm ON perm.nome IN (
  'CRIAR_ALUNO', 'VISUALIZAR_ALUNO', 'EDITAR_ALUNO', 'INATIVAR_ALUNO', 'TRANCAR_ALUNO', 'VISUALIZAR_HISTORICO_ALUNO',
  'CRIAR_RESPONSAVEL', 'VISUALIZAR_RESPONSAVEL', 'EDITAR_RESPONSAVEL', 'INATIVAR_RESPONSAVEL',
  'CRIAR_FILIACAO', 'EDITAR_FILIACAO',
  'CRIAR_MATRICULA', 'VISUALIZAR_MATRICULA', 'EDITAR_MATRICULA', 'CANCELAR_MATRICULA',
  'VISUALIZAR_TURMA',
  'VISUALIZAR_PRESENCA', 'JUSTIFICAR_FALTA_ALUNO',
  'VISUALIZAR_CALENDARIO',
  'CRIAR_COMPROMISSO', 'VISUALIZAR_COMPROMISSOS', 'EDITAR_COMPROMISSO', 'EXCLUIR_COMPROMISSO',
  'VISUALIZAR_PARCELA', 'BAIXA_PARCELA', 'GERAR_RECIBO', 'GERAR_CARNE_ESCOLAR',
  'ANEXAR_DOCUMENTO_ALUNO', 'INATIVAR_DOCUMENTO_ALUNO'
)
WHERE p.nome = 'Secretaria'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes pp WHERE pp.perfil_id = p.id AND pp.permissao_id = perm.id
  );

-- Comercial: pré-alunos, contratos, responsáveis (visualização/criação) e compromissos
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN escolas e ON e.id = p.escola_id AND e.codigo_escola = 'ESCOLA01'
JOIN permissoes perm ON perm.nome IN (
  'CRIAR_PRE_ALUNO', 'VISUALIZAR_PRE_ALUNO', 'EDITAR_PRE_ALUNO', 'CANCELAR_PRE_ALUNO',
  'GERAR_CONTRATO', 'VISUALIZAR_CONTRATO', 'VISUALIZAR_TEMPLATE_CONTRATO',
  'APROVAR_MATRICULA', 'REPROVAR_MATRICULA', 'FINALIZAR_MATRICULA',
  'CRIAR_RESPONSAVEL', 'VISUALIZAR_RESPONSAVEL', 'EDITAR_RESPONSAVEL',
  'CRIAR_COMPROMISSO', 'VISUALIZAR_COMPROMISSOS', 'EDITAR_COMPROMISSO', 'EXCLUIR_COMPROMISSO',
  'VISUALIZAR_LIVRO'
)
WHERE p.nome = 'Comercial'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes pp WHERE pp.perfil_id = p.id AND pp.permissao_id = perm.id
  );

-- ============================================================
-- BLOCO 5 — USUÁRIOS DA ESCOLA01
-- Senha: 123456 (plain — backend faz hash no deploy)
-- ============================================================

INSERT INTO usuarios (escola_id, nome_completo, email, senha, perfil_id, status)
SELECT e.id, 'Ana Paula Ferreira', 'ana.admin@learly.com', '123456', p.id, 'Ativo'
FROM escolas e
JOIN perfis p ON p.escola_id = e.id AND p.nome = 'Administrador'
WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO usuarios (escola_id, nome_completo, email, senha, perfil_id, status)
SELECT e.id, 'Roberto Souza', 'roberto.coord@learly.com', '123456', p.id, 'Ativo'
FROM escolas e
JOIN perfis p ON p.escola_id = e.id AND p.nome = 'Coordenador'
WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO usuarios (escola_id, nome_completo, email, senha, perfil_id, status)
SELECT e.id, 'Camila Torres', 'camila.prof@learly.com', '123456', p.id, 'Ativo'
FROM escolas e
JOIN perfis p ON p.escola_id = e.id AND p.nome = 'Professor'
WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO usuarios (escola_id, nome_completo, email, senha, perfil_id, status)
SELECT e.id, 'Diego Martins', 'diego.prof@learly.com', '123456', p.id, 'Ativo'
FROM escolas e
JOIN perfis p ON p.escola_id = e.id AND p.nome = 'Professor'
WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO usuarios (escola_id, nome_completo, email, senha, perfil_id, status)
SELECT e.id, 'Fernanda Lima', 'fernanda.sec@learly.com', '123456', p.id, 'Ativo'
FROM escolas e
JOIN perfis p ON p.escola_id = e.id AND p.nome = 'Secretaria'
WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO usuarios (escola_id, nome_completo, email, senha, perfil_id, status)
SELECT e.id, 'Lucas Carvalho', 'lucas.com@learly.com', '123456', p.id, 'Ativo'
FROM escolas e
JOIN perfis p ON p.escola_id = e.id AND p.nome = 'Comercial'
WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 6 — LIVROS E CAPÍTULOS
-- 4 livros · 10 capítulos no total
-- ============================================================

INSERT INTO livros (escola_id, nome, status)
SELECT e.id, 'Starter',        'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO livros (escola_id, nome, status)
SELECT e.id, 'Basic 1',        'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO livros (escola_id, nome, status)
SELECT e.id, 'Basic 2',        'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO livros (escola_id, nome, status)
SELECT e.id, 'Intermediate 1', 'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- Capítulos — Starter (3 capítulos · 4 aulas cada)
INSERT INTO capitulos (escola_id, livro_id, nome, qtd_aulas_previstas, status)
SELECT e.id, l.id, 'Chapter 1 — Hello World',     4, 'Ativo'
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Starter' WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO capitulos (escola_id, livro_id, nome, qtd_aulas_previstas, status)
SELECT e.id, l.id, 'Chapter 2 — Family & Friends', 4, 'Ativo'
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Starter' WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO capitulos (escola_id, livro_id, nome, qtd_aulas_previstas, status)
SELECT e.id, l.id, 'Chapter 3 — Colors & Numbers', 4, 'Ativo'
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Starter' WHERE e.codigo_escola = 'ESCOLA01';

-- Capítulos — Basic 1 (3 capítulos · 5 aulas cada)
INSERT INTO capitulos (escola_id, livro_id, nome, qtd_aulas_previstas, status)
SELECT e.id, l.id, 'Chapter 1 — Daily Routines', 5, 'Ativo'
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Basic 1' WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO capitulos (escola_id, livro_id, nome, qtd_aulas_previstas, status)
SELECT e.id, l.id, 'Chapter 2 — Food & Drinks',   5, 'Ativo'
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Basic 1' WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO capitulos (escola_id, livro_id, nome, qtd_aulas_previstas, status)
SELECT e.id, l.id, 'Chapter 3 — At the Store',    5, 'Ativo'
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Basic 1' WHERE e.codigo_escola = 'ESCOLA01';

-- Capítulos — Basic 2 (2 capítulos · 5 aulas cada)
INSERT INTO capitulos (escola_id, livro_id, nome, qtd_aulas_previstas, status)
SELECT e.id, l.id, 'Chapter 1 — Travel & Transport', 5, 'Ativo'
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Basic 2' WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO capitulos (escola_id, livro_id, nome, qtd_aulas_previstas, status)
SELECT e.id, l.id, 'Chapter 2 — Health & Body',      5, 'Ativo'
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Basic 2' WHERE e.codigo_escola = 'ESCOLA01';

-- Capítulos — Intermediate 1 (2 capítulos · 6 aulas cada)
INSERT INTO capitulos (escola_id, livro_id, nome, qtd_aulas_previstas, status)
SELECT e.id, l.id, 'Chapter 1 — Work & Career',       6, 'Ativo'
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Intermediate 1' WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO capitulos (escola_id, livro_id, nome, qtd_aulas_previstas, status)
SELECT e.id, l.id, 'Chapter 2 — Technology & Society', 6, 'Ativo'
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Intermediate 1' WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 7 — RESPONSÁVEIS (15)
-- ============================================================

INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-01', 'Carlos',    'Pereira',    'Pai', 'Masculino', 'Casado',        '1975-03-12', 'Superior Completo',    'São Paulo',      'SP', '01310-100', 'Avenida', 'Paulista',          '1000',   'Bela Vista',      'São Paulo',      'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-02', 'Mariana',   'Costa',      'Mae', 'Feminino',  'Casado',        '1980-07-22', 'Pos-Graduacao',        'Campinas',       'SP', '13010-050', 'Rua',     'Barão de Jaguara',  '200',    'Centro',          'Campinas',       'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-03', 'José',      'Almeida',    'Pai', 'Masculino', 'Divorciado',    '1972-11-05', 'Medio Completo',       'Santos',         'SP', '11010-100', 'Rua',     'XV de Novembro',    '50',     'Centro',          'Santos',         'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-04', 'Patrícia',  'Rodrigues',  'Mae', 'Feminino',  'Solteiro',      '1985-02-14', 'Superior Completo',    'São Paulo',      'SP', '04040-001', 'Rua',     'das Flores',        '321',    'Vila Mariana',    'São Paulo',      'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-05', 'Ricardo',   'Nascimento', 'Pai', 'Masculino', 'Casado',        '1978-09-30', 'Superior Completo',    'Ribeirão Preto', 'SP', '14010-000', 'Avenida', 'Brasil',            '750',    'Centro',          'Ribeirão Preto', 'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-06', 'Juliana',   'Barbosa',    'Mae', 'Feminino',  'Casado',        '1982-06-18', 'Pos-Graduacao',        'Belo Horizonte', 'MG', '30130-110', 'Avenida', 'Afonso Pena',       '1500',   'Centro',          'Belo Horizonte', 'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-07', 'Fernando',  'Gomes',      'Pai', 'Masculino', 'Casado',        '1976-04-25', 'Superior Completo',    'Curitiba',       'PR', '80010-010', 'Rua',     'XV de Novembro',    '900',    'Centro',          'Curitiba',       'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-08', 'Sônia',     'Teixeira',   'Mae', 'Feminino',  'Viuvo',         '1968-12-03', 'Medio Completo',       'Porto Alegre',   'RS', '90010-150', 'Rua',     'dos Andradas',      '120',    'Centro Histórico','Porto Alegre',   'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-09', 'Marcelo',   'Oliveira',   'Pai', 'Masculino', 'Uniao Estavel', '1981-08-17', 'Superior Incompleto',  'Fortaleza',      'CE', '60110-001', 'Avenida', 'Beira Mar',         '2200',   'Meireles',        'Fortaleza',      'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-10', 'Adriana',   'Moreira',    'Mae', 'Feminino',  'Solteiro',      '1990-01-28', 'Superior Completo',    'Salvador',       'BA', '40020-010', 'Avenida', 'Sete de Setembro',  '600',    'Mercês',          'Salvador',       'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-11', 'Paulo',     'Santana',    'Pai', 'Masculino', 'Casado',        '1974-05-10', 'Fundamental Completo', 'Manaus',         'AM', '69010-060', 'Avenida', 'Eduardo Ribeiro',   '400',    'Centro',          'Manaus',         'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-12', 'Cristiane', 'Figueiredo', 'Mae', 'Feminino',  'Casado',        '1983-10-08', 'Pos-Graduacao',        'Recife',         'PE', '50010-010', 'Avenida', 'Dantas Barreto',    '700',    'Santo Antônio',   'Recife',         'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-13', 'Thiago',    'Araújo',     'Pai', 'Masculino', 'Casado',        '1979-07-14', 'Superior Completo',    'Brasília',       'DF', '70040-010', 'Rua',     'SQS 308 Bloco G',   'Ap 302', 'Asa Sul',         'Brasília',       'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-14', 'Vanessa',   'Pinto',      'Mae', 'Feminino',  'Divorciado',    '1987-03-21', 'Superior Completo',    'Goiânia',        'GO', '74010-010', 'Avenida', 'Goiás',             '800',    'Centro',          'Goiânia',        'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO responsaveis (escola_id, tipo_pessoa, cpf_cnpj, nome, sobrenome, grau_parentesco, sexo, estado_civil, data_nascimento, escolaridade, naturalidade_cidade, naturalidade_estado, cep, tipo_logradouro, logradouro, numero, bairro, municipio, status)
SELECT e.id, 'Fisica', '111.222.333-15', 'Eduardo',   'Cunha',      'Pai', 'Masculino', 'Casado',        '1977-11-30', 'Medio Completo',       'Florianópolis',  'SC', '88010-002', 'Rua',     'Felipe Schmidt',    '150',    'Centro',          'Florianópolis',  'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 8 — ALUNOS (15)
-- Cada aluno vinculado ao responsável de mesmo índice (01→15)
-- ============================================================

INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Pedro',     'Pereira',    'Masculino', '2010-04-15', '2024-02-01', 'RE-0001', 'São Paulo',      'SP', '201.111.001-01', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-01' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Sofia',     'Costa',      'Feminino',  '2011-09-20', '2024-02-01', 'RE-0002', 'Campinas',       'SP', '201.111.002-02', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-02' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Gabriel',   'Almeida',    'Masculino', '2009-01-08', '2024-02-01', 'RE-0003', 'Santos',         'SP', '201.111.003-03', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-03' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Isabella',  'Rodrigues',  'Feminino',  '2012-06-30', '2024-03-01', 'RE-0004', 'São Paulo',      'SP', '201.111.004-04', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-04' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Matheus',   'Nascimento', 'Masculino', '2008-11-12', '2024-03-01', 'RE-0005', 'Ribeirão Preto', 'SP', '201.111.005-05', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-05' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Beatriz',   'Barbosa',    'Feminino',  '2010-02-25', '2024-03-01', 'RE-0006', 'Belo Horizonte', 'MG', '201.111.006-06', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-06' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Lucas',     'Gomes',      'Masculino', '2013-08-05', '2024-04-01', 'RE-0007', 'Curitiba',       'PR', '201.111.007-07', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-07' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Valentina', 'Teixeira',   'Feminino',  '2011-05-18', '2024-04-01', 'RE-0008', 'Porto Alegre',   'RS', '201.111.008-08', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-08' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Gustavo',   'Oliveira',   'Masculino', '2007-10-22', '2024-04-01', 'RE-0009', 'Fortaleza',      'CE', '201.111.009-09', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-09' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Larissa',   'Moreira',    'Feminino',  '2009-03-14', '2024-05-01', 'RE-0010', 'Salvador',       'BA', '201.111.010-10', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-10' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Rafael',    'Santana',    'Masculino', '2012-12-01', '2024-05-01', 'RE-0011', 'Manaus',         'AM', '201.111.011-11', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-11' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Letícia',   'Figueiredo', 'Feminino',  '2010-07-09', '2024-05-01', 'RE-0012', 'Recife',         'PE', '201.111.012-12', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-12' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Bruno',     'Araújo',     'Masculino', '2008-04-27', '2024-06-01', 'RE-0013', 'Brasília',       'DF', '201.111.013-13', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-13' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Amanda',    'Pinto',      'Feminino',  '2011-01-16', '2024-06-01', 'RE-0014', 'Goiânia',        'GO', '201.111.014-14', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-14' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO alunos (escola_id, responsavel_id, e_proprio_responsavel, nome, sobrenome, sexo, data_nascimento, data_ingresso, registro_escolar, naturalidade_cidade, naturalidade_estado, cpf, status)
SELECT e.id, r.id, FALSE, 'Caio',      'Cunha',      'Masculino', '2013-09-03', '2024-06-01', 'RE-0015', 'Florianópolis',  'SC', '201.111.015-15', 'Ativo' FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-15' WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 9 — CONTATOS DE TELEFONE (5 responsáveis)
-- ============================================================

INSERT INTO contatos_telefone (escola_id, entidade, entidade_id, tipo, numero, principal)
SELECT e.id, 'responsavel', r.id, 'Celular', '(11) 99101-0001', TRUE FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-01' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO contatos_telefone (escola_id, entidade, entidade_id, tipo, numero, principal)
SELECT e.id, 'responsavel', r.id, 'Celular', '(19) 99102-0002', TRUE FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-02' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO contatos_telefone (escola_id, entidade, entidade_id, tipo, numero, principal)
SELECT e.id, 'responsavel', r.id, 'Celular', '(13) 99103-0003', TRUE FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-03' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO contatos_telefone (escola_id, entidade, entidade_id, tipo, numero, principal)
SELECT e.id, 'responsavel', r.id, 'Celular', '(11) 99104-0004', TRUE FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-04' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO contatos_telefone (escola_id, entidade, entidade_id, tipo, numero, principal)
SELECT e.id, 'responsavel', r.id, 'Celular', '(16) 99105-0005', TRUE FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-05' WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 10 — TURMAS (4)
-- Camila: Turmas A e B  |  Diego: Turmas C e D
-- ============================================================

INSERT INTO turmas (escola_id, professor_id, livro_id, nome, sala, horario, data_inicio, data_termino_prevista, status)
SELECT e.id,
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'camila.prof@learly.com' LIMIT 1),
  (SELECT l.id FROM livros l WHERE l.escola_id = e.id AND l.nome = 'Starter'       LIMIT 1),
  'Starter — Turma A', 'Sala 01', '08:00:00', '2024-02-05', '2024-12-20', 'Em Andamento'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO turmas (escola_id, professor_id, livro_id, nome, sala, horario, data_inicio, data_termino_prevista, status)
SELECT e.id,
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'camila.prof@learly.com' LIMIT 1),
  (SELECT l.id FROM livros l WHERE l.escola_id = e.id AND l.nome = 'Basic 1'       LIMIT 1),
  'Basic 1 — Turma B', 'Sala 02', '10:00:00', '2024-03-04', '2024-12-20', 'Em Andamento'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO turmas (escola_id, professor_id, livro_id, nome, sala, horario, data_inicio, data_termino_prevista, status)
SELECT e.id,
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'diego.prof@learly.com'  LIMIT 1),
  (SELECT l.id FROM livros l WHERE l.escola_id = e.id AND l.nome = 'Basic 2'       LIMIT 1),
  'Basic 2 — Turma C', 'Sala 03', '14:00:00', '2024-04-01', '2024-12-20', 'Em Andamento'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO turmas (escola_id, professor_id, livro_id, nome, sala, horario, data_inicio, data_termino_prevista, status)
SELECT e.id,
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'diego.prof@learly.com'  LIMIT 1),
  (SELECT l.id FROM livros l WHERE l.escola_id = e.id AND l.nome = 'Intermediate 1' LIMIT 1),
  'Intermediate 1 — Turma D', 'Sala 04', '19:00:00', '2024-05-06', '2024-12-20', 'Em Andamento'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 11 — DIAS DA SEMANA DAS TURMAS
-- Turma A: Seg(2) + Qua(4)  |  Turma B: Ter(3) + Qui(5)
-- Turma C: Seg(2) + Qui(5)  |  Turma D: Qua(4) + Sex(6)
-- ============================================================

INSERT INTO turmas_dias_semana (escola_id, turma_id, dia_semana) SELECT e.id, t.id, 2 FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A'       WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO turmas_dias_semana (escola_id, turma_id, dia_semana) SELECT e.id, t.id, 4 FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A'       WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO turmas_dias_semana (escola_id, turma_id, dia_semana) SELECT e.id, t.id, 3 FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B'       WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO turmas_dias_semana (escola_id, turma_id, dia_semana) SELECT e.id, t.id, 5 FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B'       WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO turmas_dias_semana (escola_id, turma_id, dia_semana) SELECT e.id, t.id, 2 FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C'       WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO turmas_dias_semana (escola_id, turma_id, dia_semana) SELECT e.id, t.id, 5 FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C'       WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO turmas_dias_semana (escola_id, turma_id, dia_semana) SELECT e.id, t.id, 4 FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO turmas_dias_semana (escola_id, turma_id, dia_semana) SELECT e.id, t.id, 6 FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D' WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 12 — MATRÍCULAS (15 alunos distribuídos em 4 turmas)
-- Turma A (Starter):      Pedro, Sofia, Gabriel, Isabella, Matheus
-- Turma B (Basic 1):      Beatriz, Lucas, Valentina, Gustavo
-- Turma C (Basic 2):      Larissa, Rafael, Letícia
-- Turma D (Intermediate): Bruno, Amanda, Caio
-- ============================================================

-- Turma A
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-02-05', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.001-01' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-02-05', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.002-02' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-02-05', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.003-03' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-03-01', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.004-04' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-03-01', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.005-05' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A' WHERE e.codigo_escola = 'ESCOLA01';

-- Turma B
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-03-04', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.006-06' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-03-04', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.007-07' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-03-04', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.008-08' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-04-01', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.009-09' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B' WHERE e.codigo_escola = 'ESCOLA01';

-- Turma C
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-04-01', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.010-10' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-05-01', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.011-11' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-05-01', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.012-12' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C' WHERE e.codigo_escola = 'ESCOLA01';

-- Turma D
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-06-01', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.013-13' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-06-01', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.014-14' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO matriculas (escola_id, aluno_id, turma_id, data_matricula, status) SELECT e.id, a.id, t.id, '2024-06-01', 'Ativo' FROM escolas e JOIN alunos a ON a.escola_id = e.id AND a.cpf = '201.111.015-15' JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D' WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 13 — PROGRESSO DOS CAPÍTULOS NAS TURMAS
-- ============================================================

-- Turma A: Ch.1 concluído | Ch.2 em andamento
INSERT INTO turmas_capitulos_progresso (escola_id, turma_id, capitulo_id, concluido, data_conclusao)
SELECT e.id, t.id, c.id, TRUE, '2024-03-28' FROM escolas e
JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A'
JOIN capitulos c ON c.escola_id = e.id AND c.nome = 'Chapter 1 — Hello World'
WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO turmas_capitulos_progresso (escola_id, turma_id, capitulo_id, concluido, data_conclusao)
SELECT e.id, t.id, c.id, FALSE, NULL FROM escolas e
JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A'
JOIN capitulos c ON c.escola_id = e.id AND c.nome = 'Chapter 2 — Family & Friends'
WHERE e.codigo_escola = 'ESCOLA01';

-- Turma B: Ch.1 concluído | Ch.2 em andamento
INSERT INTO turmas_capitulos_progresso (escola_id, turma_id, capitulo_id, concluido, data_conclusao)
SELECT e.id, t.id, c.id, TRUE, '2024-04-26' FROM escolas e
JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B'
JOIN capitulos c ON c.escola_id = e.id AND c.nome = 'Chapter 1 — Daily Routines'
WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO turmas_capitulos_progresso (escola_id, turma_id, capitulo_id, concluido, data_conclusao)
SELECT e.id, t.id, c.id, FALSE, NULL FROM escolas e
JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B'
JOIN capitulos c ON c.escola_id = e.id AND c.nome = 'Chapter 2 — Food & Drinks'
WHERE e.codigo_escola = 'ESCOLA01';

-- Turma C: Ch.1 em andamento
INSERT INTO turmas_capitulos_progresso (escola_id, turma_id, capitulo_id, concluido, data_conclusao)
SELECT e.id, t.id, c.id, FALSE, NULL FROM escolas e
JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C'
JOIN capitulos c ON c.escola_id = e.id AND c.nome = 'Chapter 1 — Travel & Transport'
WHERE e.codigo_escola = 'ESCOLA01';

-- Turma D: Ch.1 em andamento
INSERT INTO turmas_capitulos_progresso (escola_id, turma_id, capitulo_id, concluido, data_conclusao)
SELECT e.id, t.id, c.id, FALSE, NULL FROM escolas e
JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D'
JOIN capitulos c ON c.escola_id = e.id AND c.nome = 'Chapter 1 — Work & Career'
WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 14 — AULAS (24 total · 6 por turma · 5 realizadas + 1 agendada)
-- ============================================================

-- Turma A — Starter (professor: Camila)
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Hello World'      LIMIT 1), t.professor_id, 1, '2024-02-05', '08:00:00', '09:00:00', 'Greetings and introductions',          'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Hello World'      LIMIT 1), t.professor_id, 2, '2024-02-07', '08:00:00', '09:00:00', 'Alphabet and phonics',                 'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 2 — Family & Friends'  LIMIT 1), t.professor_id, 3, '2024-02-12', '08:00:00', '09:00:00', 'Family vocabulary',                    'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 2 — Family & Friends'  LIMIT 1), t.professor_id, 4, '2024-02-14', '08:00:00', '09:00:00', 'Possessive adjectives',                'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 2 — Family & Friends'  LIMIT 1), t.professor_id, 5, '2024-02-19', '08:00:00', '09:00:00', 'Describing people',                    'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 2 — Family & Friends'  LIMIT 1), t.professor_id, 6, '2024-02-21', '08:00:00', '09:00:00', NULL,                                   'Normal', 'Agendada'  FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Starter — Turma A' WHERE e.codigo_escola = 'ESCOLA01';

-- Turma B — Basic 1 (professor: Camila)
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Daily Routines'   LIMIT 1), t.professor_id, 1, '2024-03-05', '10:00:00', '11:00:00', 'Present Simple — affirmative',         'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Daily Routines'   LIMIT 1), t.professor_id, 2, '2024-03-07', '10:00:00', '11:00:00', 'Present Simple — negative & questions','Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 2 — Food & Drinks'    LIMIT 1), t.professor_id, 3, '2024-03-12', '10:00:00', '11:00:00', 'Countable and uncountable nouns',      'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 2 — Food & Drinks'    LIMIT 1), t.professor_id, 4, '2024-03-14', '10:00:00', '11:00:00', 'Some / any / a lot of',                'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 2 — Food & Drinks'    LIMIT 1), t.professor_id, 5, '2024-03-19', '10:00:00', '11:00:00', 'At the restaurant dialogue',           'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 2 — Food & Drinks'    LIMIT 1), t.professor_id, 6, '2024-03-21', '10:00:00', '11:00:00', NULL,                                   'Normal', 'Agendada'  FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B' WHERE e.codigo_escola = 'ESCOLA01';

-- Turma C — Basic 2 (professor: Diego)
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Travel & Transport' LIMIT 1), t.professor_id, 1, '2024-04-01', '14:00:00', '15:00:00', 'Past Simple — regular verbs',          'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Travel & Transport' LIMIT 1), t.professor_id, 2, '2024-04-04', '14:00:00', '15:00:00', 'Past Simple — irregular verbs',        'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Travel & Transport' LIMIT 1), t.professor_id, 3, '2024-04-08', '14:00:00', '15:00:00', 'Transport vocabulary',                 'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Travel & Transport' LIMIT 1), t.professor_id, 4, '2024-04-11', '14:00:00', '15:00:00', 'Asking for directions',                'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Travel & Transport' LIMIT 1), t.professor_id, 5, '2024-04-15', '14:00:00', '15:00:00', 'Review and dialogue practice',         'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Travel & Transport' LIMIT 1), t.professor_id, 6, '2024-04-18', '14:00:00', '15:00:00', NULL,                                   'Normal', 'Agendada'  FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Basic 2 — Turma C' WHERE e.codigo_escola = 'ESCOLA01';

-- Turma D — Intermediate 1 (professor: Diego)
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Work & Career'    LIMIT 1), t.professor_id, 1, '2024-05-06', '19:00:00', '20:00:00', 'Present Perfect — introduction',       'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Work & Career'    LIMIT 1), t.professor_id, 2, '2024-05-08', '19:00:00', '20:00:00', 'CV and job application vocabulary',    'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Work & Career'    LIMIT 1), t.professor_id, 3, '2024-05-13', '19:00:00', '20:00:00', 'Job interview roleplay',               'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Work & Career'    LIMIT 1), t.professor_id, 4, '2024-05-15', '19:00:00', '20:00:00', 'Workplace emails and memos',           'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Work & Career'    LIMIT 1), t.professor_id, 5, '2024-05-20', '19:00:00', '20:00:00', 'Meetings and presentations',           'Normal', 'Realizada' FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D' WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO aulas (escola_id, turma_id, capitulo_id, professor_id, numero_aula, data_aula, horario_inicio, horario_fim, conteudo_dado, tipo_aula, status)
SELECT e.id, t.id, (SELECT c.id FROM capitulos c WHERE c.escola_id = e.id AND c.nome = 'Chapter 1 — Work & Career'    LIMIT 1), t.professor_id, 6, '2024-05-22', '19:00:00', '20:00:00', NULL,                                   'Normal', 'Agendada'  FROM escolas e JOIN turmas t ON t.escola_id = e.id AND t.nome = 'Intermediate 1 — Turma D' WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 15 — PRESENÇAS
-- P = presente | F = falta | FJ = falta justificada
-- Faltas simuladas: Gabriel(A·aula3·F), Matheus(A·aula4·FJ),
--                  Lucas(B·aula2·F), Gustavo(B·aula5·FJ),
--                  Rafael(C·aula3·F), Caio(D·aula2·F), Bruno(D·aula4·FJ)
-- ============================================================

INSERT INTO presencas (escola_id, aula_id, aluno_id, status_presenca)
SELECT e.id, au.id, a.id,
  CASE
    WHEN a.cpf = '201.111.003-03' AND au.numero_aula = 3 THEN 'F'
    WHEN a.cpf = '201.111.005-05' AND au.numero_aula = 4 THEN 'FJ'
    ELSE 'P'
  END
FROM escolas e
JOIN turmas t      ON t.escola_id  = e.id AND t.nome = 'Starter — Turma A'
JOIN aulas au      ON au.turma_id  = t.id AND au.status = 'Realizada'
JOIN matriculas m  ON m.turma_id   = t.id AND m.escola_id = e.id
JOIN alunos a      ON a.id = m.aluno_id
WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO presencas (escola_id, aula_id, aluno_id, status_presenca)
SELECT e.id, au.id, a.id,
  CASE
    WHEN a.cpf = '201.111.007-07' AND au.numero_aula = 2 THEN 'F'
    WHEN a.cpf = '201.111.009-09' AND au.numero_aula = 5 THEN 'FJ'
    ELSE 'P'
  END
FROM escolas e
JOIN turmas t      ON t.escola_id  = e.id AND t.nome = 'Basic 1 — Turma B'
JOIN aulas au      ON au.turma_id  = t.id AND au.status = 'Realizada'
JOIN matriculas m  ON m.turma_id   = t.id AND m.escola_id = e.id
JOIN alunos a      ON a.id = m.aluno_id
WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO presencas (escola_id, aula_id, aluno_id, status_presenca)
SELECT e.id, au.id, a.id,
  CASE
    WHEN a.cpf = '201.111.011-11' AND au.numero_aula = 3 THEN 'F'
    ELSE 'P'
  END
FROM escolas e
JOIN turmas t      ON t.escola_id  = e.id AND t.nome = 'Basic 2 — Turma C'
JOIN aulas au      ON au.turma_id  = t.id AND au.status = 'Realizada'
JOIN matriculas m  ON m.turma_id   = t.id AND m.escola_id = e.id
JOIN alunos a      ON a.id = m.aluno_id
WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO presencas (escola_id, aula_id, aluno_id, status_presenca)
SELECT e.id, au.id, a.id,
  CASE
    WHEN a.cpf = '201.111.015-15' AND au.numero_aula = 2 THEN 'F'
    WHEN a.cpf = '201.111.013-13' AND au.numero_aula = 4 THEN 'FJ'
    ELSE 'P'
  END
FROM escolas e
JOIN turmas t      ON t.escola_id  = e.id AND t.nome = 'Intermediate 1 — Turma D'
JOIN aulas au      ON au.turma_id  = t.id AND au.status = 'Realizada'
JOIN matriculas m  ON m.turma_id   = t.id AND m.escola_id = e.id
JOIN alunos a      ON a.id = m.aluno_id
WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 16 — HOMEWORKS (notas aleatórias entre 7.00 e 10.00)
-- ============================================================

INSERT INTO homeworks (escola_id, aula_id, aluno_id, nota)
SELECT e.id, au.id, a.id, ROUND(7.0 + (RAND() * 3.0), 2)
FROM escolas e
JOIN turmas t     ON t.escola_id = e.id
JOIN aulas au     ON au.turma_id = t.id AND au.status = 'Realizada'
JOIN matriculas m ON m.turma_id  = t.id AND m.escola_id = e.id
JOIN alunos a     ON a.id = m.aluno_id
WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 17 — AVALIAÇÕES (Speaking · Listening · Writing · Class Participation)
-- Notas aleatórias entre 6.00 e 10.00
-- ============================================================

INSERT INTO avaliacoes (escola_id, turma_id, aluno_id, tipo_avaliacao, nota)
SELECT e.id, m.turma_id, m.aluno_id, tipo, ROUND(6.0 + (RAND() * 4.0), 2)
FROM escolas e
JOIN matriculas m ON m.escola_id = e.id
JOIN (
  SELECT 'Speaking'          AS tipo UNION ALL
  SELECT 'Listening'                 UNION ALL
  SELECT 'Writing'                   UNION ALL
  SELECT 'Class Participation'
) tipos
WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 18 — OCORRÊNCIAS (1 acadêmica · 1 administrativa)
-- ============================================================

-- Acadêmica: Gabriel (Turma A · Aula 3) — dificuldade de pronúncia
INSERT INTO ocorrencias (escola_id, aluno_id, aula_id, tipo, data_ocorrencia, hora_ocorrencia, descricao, usuario_id)
SELECT e.id,
  (SELECT a.id  FROM alunos a  WHERE a.escola_id  = e.id AND a.cpf   = '201.111.003-03' LIMIT 1),
  (SELECT au.id FROM aulas au  JOIN turmas t ON t.id = au.turma_id WHERE t.escola_id = e.id AND t.nome = 'Starter — Turma A' AND au.numero_aula = 3 LIMIT 1),
  'Academica', '2024-02-12', '08:30:00',
  'Aluno apresentou dificuldade com pronúncia na atividade oral. Requer atenção adicional nas próximas aulas.',
  (SELECT u.id  FROM usuarios u WHERE u.escola_id  = e.id AND u.email = 'camila.prof@learly.com' LIMIT 1)
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- Administrativa: Lucas (Turma B) — inadimplência de março
INSERT INTO ocorrencias (escola_id, aluno_id, aula_id, tipo, data_ocorrencia, hora_ocorrencia, descricao, resolucao, usuario_id)
SELECT e.id,
  (SELECT a.id FROM alunos a WHERE a.escola_id = e.id AND a.cpf = '201.111.007-07' LIMIT 1),
  NULL,
  'Administrativa', '2024-03-14', '10:15:00',
  'Responsável não realizou pagamento da mensalidade de março.',
  'Responsável contatado por telefone. Pagamento prometido para o dia 20/03.',
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'fernanda.sec@learly.com' LIMIT 1)
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 19 — REPOSIÇÕES (2)
-- ============================================================

-- Gabriel: falta aula 3 — Turma A (agendada)
INSERT INTO reposicoes (escola_id, aluno_id, professor_id, aula_id, data_reposicao, horario_inicio, horario_fim, quantidade_horas, status, observacoes, criado_por_usuario_id)
SELECT e.id,
  (SELECT a.id  FROM alunos a   WHERE a.escola_id  = e.id AND a.cpf   = '201.111.003-03' LIMIT 1),
  (SELECT u.id  FROM usuarios u WHERE u.escola_id  = e.id AND u.email = 'camila.prof@learly.com'  LIMIT 1),
  (SELECT au.id FROM aulas au   JOIN turmas t ON t.id = au.turma_id WHERE t.escola_id = e.id AND t.nome = 'Starter — Turma A' AND au.numero_aula = 3 LIMIT 1),
  '2024-02-17', '09:00:00', '10:00:00', 1.00, 'Agendada',
  'Reposição da falta na aula 3 — Family vocabulary',
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'fernanda.sec@learly.com' LIMIT 1)
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- Lucas: falta aula 2 — Turma B (realizada com bom desempenho)
INSERT INTO reposicoes (escola_id, aluno_id, professor_id, aula_id, data_reposicao, horario_inicio, horario_fim, quantidade_horas, status, observacoes, criado_por_usuario_id)
SELECT e.id,
  (SELECT a.id  FROM alunos a   WHERE a.escola_id  = e.id AND a.cpf   = '201.111.007-07' LIMIT 1),
  (SELECT u.id  FROM usuarios u WHERE u.escola_id  = e.id AND u.email = 'camila.prof@learly.com'  LIMIT 1),
  (SELECT au.id FROM aulas au   JOIN turmas t ON t.id = au.turma_id WHERE t.escola_id = e.id AND t.nome = 'Basic 1 — Turma B' AND au.numero_aula = 2 LIMIT 1),
  '2024-03-16', '11:00:00', '12:00:00', 1.00, 'Realizada',
  'Reposição da falta na aula 2 — Present Simple neg/questions. Aluno demonstrou bom desempenho.',
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'fernanda.sec@learly.com' LIMIT 1)
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 20 — CALENDÁRIO GERAL (feriados e eventos 2024)
-- ============================================================

INSERT INTO calendario_geral (escola_id, data_evento, tipo_evento, descricao, suspende_aula, usuario_id)
SELECT e.id, '2024-02-13', 'FERIADO',  'Carnaval — Terça-feira Gorda',                     TRUE,  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'ana.admin@learly.com' LIMIT 1) FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO calendario_geral (escola_id, data_evento, tipo_evento, descricao, suspende_aula, usuario_id)
SELECT e.id, '2024-03-29', 'FERIADO',  'Sexta-feira Santa',                                 TRUE,  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'ana.admin@learly.com' LIMIT 1) FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO calendario_geral (escola_id, data_evento, tipo_evento, descricao, suspende_aula, usuario_id)
SELECT e.id, '2024-04-21', 'FERIADO',  'Tiradentes',                                        TRUE,  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'ana.admin@learly.com' LIMIT 1) FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO calendario_geral (escola_id, data_evento, tipo_evento, descricao, suspende_aula, usuario_id)
SELECT e.id, '2024-07-08', 'RECESSO',  'Recesso de julho — semana 1',                       TRUE,  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'ana.admin@learly.com' LIMIT 1) FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO calendario_geral (escola_id, data_evento, tipo_evento, descricao, suspende_aula, usuario_id)
SELECT e.id, '2024-12-20', 'SEM AULA', 'Último dia letivo — confraternização de encerramento', FALSE, (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'ana.admin@learly.com' LIMIT 1) FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 21 — ARQUIVOS DE TURMAS (pastas + arquivos por livro)
-- ============================================================

-- Pastas
INSERT INTO arquivos_turma_pastas (escola_id, livro_id, parent_id, nome, ordem, status, usuario_criacao_id)
SELECT e.id, l.id, NULL, 'Material de Apoio', 1, 'Ativo', (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'roberto.coord@learly.com' LIMIT 1)
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Starter'  WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO arquivos_turma_pastas (escola_id, livro_id, parent_id, nome, ordem, status, usuario_criacao_id)
SELECT e.id, l.id, NULL, 'Atividades Extras', 2, 'Ativo', (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'roberto.coord@learly.com' LIMIT 1)
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Starter'  WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO arquivos_turma_pastas (escola_id, livro_id, parent_id, nome, ordem, status, usuario_criacao_id)
SELECT e.id, l.id, NULL, 'Material de Apoio', 1, 'Ativo', (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'roberto.coord@learly.com' LIMIT 1)
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Basic 1' WHERE e.codigo_escola = 'ESCOLA01';

-- Arquivos
INSERT INTO arquivos_turma (escola_id, livro_id, pasta_id, nome_exibicao, tipo_arquivo, url_storage, status, usuario_upload_id)
SELECT e.id, l.id,
  (SELECT p.id FROM arquivos_turma_pastas p WHERE p.escola_id = e.id AND p.livro_id = l.id AND p.nome = 'Material de Apoio' LIMIT 1),
  'Starter — Guia do Professor Ch.1', 'PDF', 'https://storage.learly.io/starter/guia-professor-ch1.pdf', 'Ativo',
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'roberto.coord@learly.com' LIMIT 1)
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Starter' WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO arquivos_turma (escola_id, livro_id, pasta_id, nome_exibicao, tipo_arquivo, url_storage, status, usuario_upload_id)
SELECT e.id, l.id,
  (SELECT p.id FROM arquivos_turma_pastas p WHERE p.escola_id = e.id AND p.livro_id = l.id AND p.nome = 'Atividades Extras' LIMIT 1),
  'Starter — Flashcards Ch.1 e Ch.2', 'PDF', 'https://storage.learly.io/starter/flashcards-ch1-ch2.pdf', 'Ativo',
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'roberto.coord@learly.com' LIMIT 1)
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Starter' WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO arquivos_turma (escola_id, livro_id, pasta_id, nome_exibicao, tipo_arquivo, url_storage, status, usuario_upload_id)
SELECT e.id, l.id,
  (SELECT p.id FROM arquivos_turma_pastas p WHERE p.escola_id = e.id AND p.livro_id = l.id AND p.nome = 'Material de Apoio' LIMIT 1),
  'Basic 1 — Listening Scripts Ch.1', 'DOCX', 'https://storage.learly.io/basic1/listening-scripts-ch1.docx', 'Ativo',
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'camila.prof@learly.com' LIMIT 1)
FROM escolas e JOIN livros l ON l.escola_id = e.id AND l.nome = 'Basic 1' WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 22 — COMPROMISSOS E PARTICIPANTES (3 compromissos)
-- ============================================================

INSERT INTO compromissos (escola_id, usuario_id, titulo, descricao, data_inicio, data_fim, local, tipo, prioridade, status, lembrete_minutos, cor)
SELECT e.id, (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'roberto.coord@learly.com' LIMIT 1),
  'Reunião Pedagógica — Março', 'Revisão do desempenho das turmas e planejamento do trimestre',
  '2024-03-25 09:00:00', '2024-03-25 11:00:00', 'Sala de Reuniões', 'Reuniao', 'Alta', 'Concluido', 30, '#4F46E5'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO compromissos (escola_id, usuario_id, titulo, descricao, data_inicio, data_fim, local, tipo, prioridade, status, lembrete_minutos, cor)
SELECT e.id, (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'ana.admin@learly.com' LIMIT 1),
  'Entrega de Relatórios Financeiros', 'Fechamento do mês de abril — parcelas e movimentações',
  '2024-04-30 17:00:00', '2024-04-30 18:00:00', NULL, 'Tarefa', 'Alta', 'Pendente', 60, '#DC2626'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO compromissos (escola_id, usuario_id, titulo, descricao, data_inicio, data_fim, local, tipo, prioridade, status, lembrete_minutos, cor)
SELECT e.id, (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'lucas.com@learly.com' LIMIT 1),
  'Visita de Prospect — Família Silva', 'Família interessada no curso Starter para filho de 9 anos',
  '2024-04-05 15:00:00', '2024-04-05 16:00:00', 'Recepção', 'Reuniao', 'Media', 'Concluido', 15, '#16A34A'
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- Participantes da Reunião Pedagógica
INSERT INTO compromissos_participantes (compromisso_id, usuario_id, confirmacao)
SELECT c.id, (SELECT u.id FROM usuarios u WHERE u.escola_id = c.escola_id AND u.email = 'camila.prof@learly.com' LIMIT 1), 'Confirmado'
FROM compromissos c JOIN escolas e ON e.id = c.escola_id
WHERE e.codigo_escola = 'ESCOLA01' AND c.titulo = 'Reunião Pedagógica — Março';

INSERT INTO compromissos_participantes (compromisso_id, usuario_id, confirmacao)
SELECT c.id, (SELECT u.id FROM usuarios u WHERE u.escola_id = c.escola_id AND u.email = 'diego.prof@learly.com'  LIMIT 1), 'Confirmado'
FROM compromissos c JOIN escolas e ON e.id = c.escola_id
WHERE e.codigo_escola = 'ESCOLA01' AND c.titulo = 'Reunião Pedagógica — Março';

-- ============================================================
-- BLOCO 23 — MÓDULO COMERCIAL (2 pré-alunos + 1 template de contrato)
-- ============================================================

-- Template de contrato (versão 1 — ativa)
INSERT INTO contratos_templates (escola_id, versao, template, ativo, criado_por_usuario_id)
SELECT e.id, 1,
  'CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS\n\nContratante: {{responsavel_nome}} {{responsavel_sobrenome}}, CPF {{responsavel_cpf}}\nAluno: {{aluno_nome}} {{aluno_sobrenome}}\nLivro/Nível: {{livro_nome}}\nMensalidade: R$ {{valor_mensalidade}}\nForma de pagamento: {{forma_pagamento}}\nInício das aulas: {{data_inicio_prevista}}\n\nAs partes acima identificadas acordam as condições descritas neste instrumento...',
  TRUE,
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'ana.admin@learly.com' LIMIT 1)
FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- Pré-aluno 1: Henrique Mendes — em negociação (Starter · Semestral)
INSERT INTO pre_alunos (escola_id, responsavel_id, nome, sobrenome, data_nascimento, telefone, livro_interesse_id, tipo_contrato, valor_mensalidade, forma_pagamento, material_opcao, valor_material, data_inicio_prevista, observacoes_comerciais, status, criado_por_usuario_id)
SELECT e.id, r.id,
  'Henrique', 'Mendes', '2011-03-15', '(11) 98765-4321',
  (SELECT l.id FROM livros l WHERE l.escola_id = e.id AND l.nome = 'Starter'  LIMIT 1),
  'Semestral', 350.00, 'Boleto', 'Parcelado', 120.00, '2024-07-01',
  'Família já tem outro filho matriculado em outra escola de inglês. Interesse em migrar caso gostarem.',
  'Em negociacao',
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'lucas.com@learly.com' LIMIT 1)
FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-01'
WHERE e.codigo_escola = 'ESCOLA01';

-- Pré-aluno 2: Isabela Fernandes — aprovada (Basic 1 · Anual)
INSERT INTO pre_alunos (escola_id, responsavel_id, nome, sobrenome, data_nascimento, telefone, livro_interesse_id, tipo_contrato, valor_mensalidade, forma_pagamento, material_opcao, valor_material, data_inicio_prevista, observacoes_comerciais, status, criado_por_usuario_id)
SELECT e.id, r.id,
  'Isabela', 'Fernandes', '2009-08-22', '(21) 99887-6543',
  (SELECT l.id FROM livros l WHERE l.escola_id = e.id AND l.nome = 'Basic 1' LIMIT 1),
  'Anual', 320.00, 'Cartão de Crédito', 'A vista', 200.00, '2024-08-05',
  'Aluna com experiência prévia em inglês. Fez teste de nivelamento e foi indicada para Basic 1.',
  'Aprovado',
  (SELECT u.id FROM usuarios u WHERE u.escola_id = e.id AND u.email = 'lucas.com@learly.com' LIMIT 1)
FROM escolas e JOIN responsaveis r ON r.escola_id = e.id AND r.cpf_cnpj = '111.222.333-04'
WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 24 — FINANCEIRO: CONTAS BANCÁRIAS E CATEGORIAS
-- ============================================================

INSERT INTO contas_bancarias (escola_id, nome, saldo_inicial, status)
SELECT e.id, 'Conta Corrente — Banco do Brasil', 5000.00, 'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO contas_bancarias (escola_id, nome, saldo_inicial, status)
SELECT e.id, 'Conta Caixa — Recebimentos',       1500.00, 'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

INSERT INTO categorias_financeiras (escola_id, nome, tipo, descricao, status)
SELECT e.id, 'Mensalidade',     'Parcela', 'Mensalidade regular do aluno',                'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO categorias_financeiras (escola_id, nome, tipo, descricao, status)
SELECT e.id, 'Material Didático', 'Parcela', 'Cobrança de material didático',             'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO categorias_financeiras (escola_id, nome, tipo, descricao, status)
SELECT e.id, 'Matrícula',       'Credito', 'Taxa de matrícula',                           'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO categorias_financeiras (escola_id, nome, tipo, descricao, status)
SELECT e.id, 'Salários',        'Debito',  'Pagamento de salários de professores e staff', 'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';
INSERT INTO categorias_financeiras (escola_id, nome, tipo, descricao, status)
SELECT e.id, 'Aluguel',         'Debito',  'Aluguel das instalações da escola',           'Ativo' FROM escolas e WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 25 — PARCELAS (fev–jun · todas as matrículas)
-- Fev-Mar-Abr = Pago | Mai = Vencido | Jun = Pendente
-- ============================================================

INSERT INTO parcelas (escola_id, matricula_id, turma_id, responsavel_id, categoria_id, conta_destino_id, mes_competencia, data_vencimento, data_pagamento, valor_original, percentual_desconto, valor_com_desconto, valor_pago, forma_pagamento, status)
SELECT
  e.id,
  m.id,
  m.turma_id,
  a.responsavel_id,
  (SELECT cf.id FROM categorias_financeiras cf WHERE cf.escola_id = e.id AND cf.nome = 'Mensalidade'              LIMIT 1),
  (SELECT cb.id FROM contas_bancarias      cb WHERE cb.escola_id = e.id AND cb.nome = 'Conta Caixa — Recebimentos' LIMIT 1),
  comp.mes,
  comp.venc,
  CASE WHEN comp.mes IN ('2024-02','2024-03','2024-04') THEN DATE_ADD(comp.venc, INTERVAL 2 DAY) ELSE NULL END,
  320.00, 0.00, 320.00,
  CASE WHEN comp.mes IN ('2024-02','2024-03','2024-04') THEN 320.00 ELSE NULL END,
  CASE WHEN comp.mes IN ('2024-02','2024-03','2024-04') THEN 'Boleto' ELSE NULL END,
  CASE
    WHEN comp.mes IN ('2024-02','2024-03','2024-04') THEN 'Pago'
    WHEN comp.mes  = '2024-05'                       THEN 'Vencido'
    ELSE 'Pendente'
  END
FROM escolas e
JOIN matriculas m ON m.escola_id = e.id
JOIN alunos a     ON a.id = m.aluno_id
JOIN (
  SELECT '2024-02' AS mes, '2024-02-10' AS venc UNION ALL
  SELECT '2024-03',        '2024-03-10'         UNION ALL
  SELECT '2024-04',        '2024-04-10'         UNION ALL
  SELECT '2024-05',        '2024-05-10'         UNION ALL
  SELECT '2024-06',        '2024-06-10'
) comp
WHERE e.codigo_escola = 'ESCOLA01';

-- ============================================================
-- BLOCO 26 — MOVIMENTAÇÕES FINANCEIRAS (baixas das parcelas pagas)
-- ============================================================

INSERT INTO movimentacoes_financeiras (escola_id, conta_id, categoria_id, parcela_id, tipo, valor, data_movimentacao, forma_pagamento, descricao)
SELECT
  p.escola_id,
  p.conta_destino_id,
  p.categoria_id,
  p.id,
  'Entrada',
  p.valor_pago,
  p.data_pagamento,
  p.forma_pagamento,
  CONCAT('Mensalidade ', p.mes_competencia, ' — Matrícula #', p.matricula_id)
FROM parcelas p
WHERE p.escola_id = (SELECT e.id FROM escolas e WHERE e.codigo_escola = 'ESCOLA01')
  AND p.status = 'Pago';

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
-- Resumo do seed (ESCOLA01):
--   Perfis:        5  (Administrador, Coordenador, Professor, Secretaria, Comercial)
--   Usuários:      6  (1 por perfil + 1 professor extra)
--   Livros:        4  | Capítulos: 10
--   Responsáveis: 15  | Alunos: 15
--   Turmas:        4  | Matrículas: 15
--   Aulas:        24  (6/turma · 5 realizadas + 1 agendada)
--   Presenças:    ~95 (com faltas e FJs simuladas)
--   Homeworks:    ~95 notas · Avaliações: 60 notas
--   Ocorrências:   2  | Reposições: 2
--   Calendário:    5  eventos
--   Pré-alunos:    2  | Template de contrato: 1
--   Parcelas:     75  (15 alunos × 5 meses)
--   Movimentações: 45 (parcelas pagas de fev–abr)
-- ============================================================