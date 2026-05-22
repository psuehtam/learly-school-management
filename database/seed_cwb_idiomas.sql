-- ============================================================
-- SEED — CWB IDIOMAS
-- ============================================================
-- Execute APÓS o setup.sql (banco já criado e populado).
--
--   mysql -u root -p learly_db < database/seed_cwb_idiomas.sql
--
-- Credencial do administrador criado:
--   Código da escola : CWBIDIOMAS
--   E-mail           : cwb.adm@gmail.com
--   Senha            : Matheus1loko
-- ============================================================

USE learly_db;

-- ------------------------------------------------------------
-- 1. Escola
-- ------------------------------------------------------------
INSERT INTO escolas (codigo_escola, nome_fantasia, razao_social, cnpj, status)
VALUES ('CWBIDIOMAS', 'CWB IDIOMAS', 'CWB IDIOMAS', '55370516000110', 'Ativo');

-- ------------------------------------------------------------
-- 2. Perfis padrão (espelha PerfisPadrao do EscolasService.cs)
-- ------------------------------------------------------------
INSERT INTO perfis (escola_id, nome, descricao, status)
SELECT id, 'Administrador', 'Administrador da escola', 'Ativo' FROM escolas WHERE codigo_escola = 'CWBIDIOMAS'
UNION ALL
SELECT id, 'Professor',     'Professor',                'Ativo' FROM escolas WHERE codigo_escola = 'CWBIDIOMAS'
UNION ALL
SELECT id, 'Comercial',     'Equipe comercial',         'Ativo' FROM escolas WHERE codigo_escola = 'CWBIDIOMAS'
UNION ALL
SELECT id, 'Secretaria',    'Secretaria',               'Ativo' FROM escolas WHERE codigo_escola = 'CWBIDIOMAS'
UNION ALL
SELECT id, 'Financeiro',    'Financeiro',               'Ativo' FROM escolas WHERE codigo_escola = 'CWBIDIOMAS'
UNION ALL
SELECT id, 'Coordenador',   'Coordenacao pedagogica',   'Ativo' FROM escolas WHERE codigo_escola = 'CWBIDIOMAS';

-- ------------------------------------------------------------
-- 3. Permissões por perfil (baseadas nos templates)
--    Usa os mesmos critérios do perfil_permissoes_template.
-- ------------------------------------------------------------

-- Administrador — todas as permissões exceto as globais de super-admin
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT pf.id, pm.id
FROM perfis pf
JOIN escolas e ON e.id = pf.escola_id AND e.codigo_escola = 'CWBIDIOMAS' AND pf.nome = 'Administrador'
JOIN permissoes pm ON pm.nome NOT IN ('GERENCIAR_ESCOLAS','VISUALIZAR_ESCOLAS');

-- Professor
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT pf.id, pm.id
FROM perfis pf
JOIN escolas e ON e.id = pf.escola_id AND e.codigo_escola = 'CWBIDIOMAS' AND pf.nome = 'Professor'
JOIN permissoes pm ON pm.nome IN (
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
);

-- Comercial
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT pf.id, pm.id
FROM perfis pf
JOIN escolas e ON e.id = pf.escola_id AND e.codigo_escola = 'CWBIDIOMAS' AND pf.nome = 'Comercial'
JOIN permissoes pm ON pm.nome IN (
  'VISUALIZAR_DASHBOARD_GERAL',
  'VISUALIZAR_PRE_ALUNO','CRIAR_PRE_ALUNO','EDITAR_PRE_ALUNO','CANCELAR_PRE_ALUNO',
  'VISUALIZAR_CONTRATO','GERAR_CONTRATO',
  'VISUALIZAR_TEMPLATE_CONTRATO',
  'VISUALIZAR_RESPONSAVEL',
  'CRIAR_COMPROMISSO','VISUALIZAR_COMPROMISSOS','EDITAR_COMPROMISSO','EXCLUIR_COMPROMISSO',
  'CONFIRMAR_COMPROMISSO','RECUSAR_COMPROMISSO'
);

-- Secretaria
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT pf.id, pm.id
FROM perfis pf
JOIN escolas e ON e.id = pf.escola_id AND e.codigo_escola = 'CWBIDIOMAS' AND pf.nome = 'Secretaria'
JOIN permissoes pm ON pm.nome IN (
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
  'CONFIRMAR_COMPROMISSO','RECUSAR_COMPROMISSO','ADICIONAR_PARTICIPANTE_COMPROMISSO'
);

-- Financeiro
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT pf.id, pm.id
FROM perfis pf
JOIN escolas e ON e.id = pf.escola_id AND e.codigo_escola = 'CWBIDIOMAS' AND pf.nome = 'Financeiro'
JOIN permissoes pm ON pm.nome IN (
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
);

-- Coordenador
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT pf.id, pm.id
FROM perfis pf
JOIN escolas e ON e.id = pf.escola_id AND e.codigo_escola = 'CWBIDIOMAS' AND pf.nome = 'Coordenador'
JOIN permissoes pm ON pm.nome IN (
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
  'VISUALIZAR_RELATORIO_TURMAS','VISUALIZAR_RELATORIO_ALUNOS','EXPORTAR_ALUNOS',
  'CRIAR_COMPROMISSO','VISUALIZAR_COMPROMISSOS','EDITAR_COMPROMISSO','EXCLUIR_COMPROMISSO',
  'VISUALIZAR_COMPROMISSOS_OUTROS','ADICIONAR_PARTICIPANTE_COMPROMISSO',
  'CONFIRMAR_COMPROMISSO','RECUSAR_COMPROMISSO'
);

-- ------------------------------------------------------------
-- 4. Usuário administrador
-- Senha: Matheus1loko (hash BCrypt — gerado externamente)
-- O backend aceita a senha em texto puro e faz hash no 1º login.
-- ------------------------------------------------------------
INSERT INTO usuarios (escola_id, nome_completo, email, senha, perfil_id, status)
SELECT
  e.id,
  'Matheus',
  'cwb.adm@gmail.com',
  'Matheus1loko',
  pf.id,
  'Ativo'
FROM escolas e
JOIN perfis pf ON pf.escola_id = e.id AND pf.nome = 'Administrador'
WHERE e.codigo_escola = 'CWBIDIOMAS';

-- ============================================================
-- Pronto. Para acessar:
--   Código da escola : CWBIDIOMAS
--   E-mail           : cwb.adm@gmail.com
--   Senha            : Matheus1loko
-- ============================================================
