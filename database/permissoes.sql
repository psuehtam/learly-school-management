    -- ============================================================
    -- LEARLY — Permissões do Sistema
    -- Organizadas por entidade/módulo
    -- ============================================================

    USE learly_db;

    INSERT INTO permissoes (nome, descricao) VALUES

    -- ============================================================
    -- USUÁRIOS
    -- ============================================================
    ('VISUALIZAR_USUARIO',              'Ver lista e perfil de usuarios'),
    ('CRIAR_USUARIO',                   'Criar novos usuarios no sistema'),
    ('EDITAR_USUARIO',                  'Editar dados de usuarios existentes'),
    ('INATIVAR_USUARIO',                'Inativar/desativar usuarios'),
    ('GERENCIAR_PERMISSOES_USUARIO',    'Atribuir e remover permissoes de usuarios'),

    -- ============================================================
    -- PERFIS
    -- ============================================================
    ('VISUALIZAR_PERFIL',               'Ver lista de perfis'),
    ('CRIAR_PERFIL',                    'Criar novos perfis de acesso'),
    ('EDITAR_PERFIL',                   'Editar perfis existentes'),

    -- ============================================================
    -- ESCOLAS
    -- ============================================================
    ('VISUALIZAR_ESCOLAS',              'Listar todas as escolas do sistema'),
    ('GERENCIAR_ESCOLAS',               'Criar, editar e gerenciar escolas (Super Admin)'),

    -- ============================================================
    -- PRÉ-ALUNOS
    -- ============================================================
    ('VISUALIZAR_PRE_ALUNO',            'Ver lista e detalhes de pre-alunos'),
    ('CRIAR_PRE_ALUNO',                 'Criar ficha de pre-aluno (interessado)'),
    ('EDITAR_PRE_ALUNO',                'Editar dados de pre-alunos'),
    ('CANCELAR_PRE_ALUNO',              'Cancelar ficha de pre-aluno'),

    -- ============================================================
    -- CONTRATOS
    -- ============================================================
    ('VISUALIZAR_CONTRATO',             'Ver contratos gerados'),
    ('GERAR_CONTRATO',                  'Gerar contrato a partir do template'),
    ('VISUALIZAR_TEMPLATE_CONTRATO',    'Ver templates de contrato'),
    ('CRIAR_TEMPLATE_CONTRATO',         'Criar nova versao de template de contrato'),
    ('EDITAR_TEMPLATE_CONTRATO',        'Editar template base de contrato'),
    ('INATIVAR_TEMPLATE_CONTRATO',      'Inativar template de contrato'),
    ('DEVOLVER_MATRICULA_COMERCIAL',    'Devolver pendencia de matricula ao comercial para ajustes'),
    ('REMOVER_ANEXO_MATRICULA',         'Remover anexo da ficha de matricula ou pre-matricula'),

    -- ============================================================
    -- ALUNOS
    -- ============================================================
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

    -- ============================================================
    -- RESPONSÁVEIS
    -- ============================================================
    ('VISUALIZAR_RESPONSAVEL',          'Ver dados de responsaveis'),
    ('CRIAR_RESPONSAVEL',               'Cadastrar novo responsavel'),
    ('EDITAR_RESPONSAVEL',              'Editar dados de responsaveis'),
    ('INATIVAR_RESPONSAVEL',            'Inativar responsavel'),

    -- ============================================================
    -- FILIAÇÕES
    -- ============================================================
    ('CRIAR_FILIACAO',                  'Cadastrar dados de filiacao do aluno'),
    ('EDITAR_FILIACAO',                 'Editar dados de filiacao'),

    -- ============================================================
    -- MATRÍCULAS
    -- ============================================================
    ('VISUALIZAR_MATRICULA',            'Ver matriculas'),
    ('CRIAR_MATRICULA',                 'Matricular aluno em turma'),
    ('EDITAR_MATRICULA',                'Editar dados de matricula'),
    ('CANCELAR_MATRICULA',              'Cancelar matricula'),
    ('APROVAR_MATRICULA',               'Aprovar pre-aluno para matricula'),
    ('REPROVAR_MATRICULA',              'Reprovar matricula de pre-aluno'),
    ('FINALIZAR_MATRICULA',             'Converter pre-aluno em aluno matriculado'),

    -- ============================================================
    -- TURMAS
    -- ============================================================
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

    -- ============================================================
    -- AULAS
    -- ============================================================
    ('VISUALIZAR_AULA',                 'Ver agenda de aulas'),
    ('CRIAR_AULA',                      'Criar aula avulsa'),
    ('EDITAR_AULA',                     'Editar dados da aula'),
    ('CANCELAR_AULA',                   'Cancelar aula'),
    ('REALIZAR_AULA',                   'Marcar aula como realizada'),
    ('REGISTRAR_CONTEUDO_AULA',         'Registrar conteudo dado na aula'),

    -- ============================================================
    -- CHAMADA / PRESENÇA
    -- ============================================================
    ('VISUALIZAR_PRESENCA',             'Ver historico de presenca'),
    ('REALIZAR_CHAMADA',                'Fazer chamada (registrar presenca/falta)'),
    ('EDITAR_PRESENCA',                 'Editar presenca ja lancada'),

    -- ============================================================
    -- HOMEWORK
    -- ============================================================
    ('VISUALIZAR_HOMEWORK',             'Ver notas de homework'),
    ('LANCAR_HOMEWORK',                 'Lancar nota de homework'),
    ('EDITAR_HOMEWORK',                 'Editar nota de homework'),

    -- ============================================================
    -- AVALIAÇÕES
    -- ============================================================
    ('VISUALIZAR_AVALIACAO',            'Ver notas de avaliacoes'),
    ('LANCAR_AVALIACAO',                'Lancar notas de avaliacoes'),
    ('EDITAR_AVALIACAO',                'Editar notas de avaliacoes'),

    -- ============================================================
    -- OCORRÊNCIAS
    -- ============================================================
    ('VISUALIZAR_OCORRENCIA',           'Ver historico de ocorrencias'),
    ('CRIAR_OCORRENCIA_ACADEMICA',      'Registrar ocorrencia academica'),
    ('CRIAR_OCORRENCIA_ADMINISTRATIVA', 'Registrar ocorrencia administrativa'),
    ('EDITAR_OCORRENCIA',               'Editar ocorrencias registradas'),

    -- ============================================================
    -- REPOSIÇÕES
    -- ============================================================
    ('VISUALIZAR_REPOSICAO',            'Ver lista de reposicoes'),
    ('CRIAR_REPOSICAO',                 'Agendar aula de reposicao'),
    ('EDITAR_REPOSICAO',                'Editar reposicao agendada'),
    ('REALIZAR_REPOSICAO',              'Realizar chamada em reposicao'),
    ('CANCELAR_REPOSICAO',              'Cancelar reposicao'),

    -- ============================================================
    -- LIVROS
    -- ============================================================
    ('VISUALIZAR_LIVRO',                'Ver catalogo de livros'),
    ('CRIAR_LIVRO',                     'Cadastrar novo livro/nivel'),
    ('EDITAR_LIVRO',                    'Editar dados de livros'),
    ('INATIVAR_LIVRO',                  'Inativar livro'),

    -- ============================================================
    -- CAPÍTULOS
    -- ============================================================
    ('VISUALIZAR_CAPITULO',             'Ver capitulos de livros'),
    ('CRIAR_CAPITULO',                  'Criar capitulo em livro'),
    ('EDITAR_CAPITULO',                 'Editar capitulo (nome, qtd aulas)'),
    ('INATIVAR_CAPITULO',               'Inativar capitulo'),
    ('VISUALIZAR_PROGRESSO_CAPITULO',   'Ver progresso de capitulos da turma'),
    ('MARCAR_CAPITULO_CONCLUIDO',       'Marcar capitulo como concluido na turma'),

    -- ============================================================
    -- CALENDÁRIO
    -- ============================================================
    ('VISUALIZAR_CALENDARIO',           'Ver calendario geral'),
    ('GERENCIAR_CALENDARIO',            'Marcar feriados, recessos e eventos no calendario'),
    ('EDITAR_EVENTO_CALENDARIO',        'Editar eventos do calendario'),
    ('EXCLUIR_EVENTO_CALENDARIO',       'Remover eventos do calendario'),
    ('VISUALIZAR_AGENDA_GLOBAL',        'Ver agenda global de aulas'),

    -- ============================================================
    -- COMPROMISSOS
    -- ============================================================
    ('VISUALIZAR_COMPROMISSOS',                 'Ver agenda de compromissos'),
    ('CRIAR_COMPROMISSO',                       'Criar compromisso na agenda pessoal'),
    ('EDITAR_COMPROMISSO',                      'Editar compromisso'),
    ('EXCLUIR_COMPROMISSO',                     'Excluir compromisso'),
    ('VISUALIZAR_COMPROMISSOS_OUTROS',          'Ver compromissos de outros usuarios'),
    ('ADICIONAR_PARTICIPANTE_COMPROMISSO',      'Adicionar participantes em compromisso'),
    ('CONFIRMAR_COMPROMISSO',                   'Confirmar presenca em compromisso'),
    ('RECUSAR_COMPROMISSO',                     'Recusar compromisso'),

    -- ============================================================
    -- ARQUIVOS DE TURMA
    -- ============================================================
    ('VISUALIZAR_ARQUIVO_TURMA',        'Ver, baixar ou imprimir arquivo de turma'),
    ('CRIAR_PASTA_ARQUIVO_TURMA',       'Criar pasta de agrupamento sob um livro'),
    ('UPLOAD_ARQUIVO_TURMA',            'Upload de arquivo em pasta de livro'),
    ('EDITAR_PASTA_ARQUIVO_TURMA',      'Renomear ou reordenar pasta de arquivos de turma'),
    ('EDITAR_ARQUIVO_TURMA',            'Substituir arquivo ou alterar nome de exibicao'),
    ('INATIVAR_PASTA_ARQUIVO_TURMA',    'Inativar pasta de arquivos de turma'),
    ('INATIVAR_ARQUIVO_TURMA',          'Inativar arquivo de turma'),

    -- ============================================================
    -- PARCELAS
    -- ============================================================
    ('VISUALIZAR_PARCELA',              'Ver parcelas de alunos'),
    ('CRIAR_PARCELA',                   'Criar nova parcela financeira'),
    ('EDITAR_PARCELA',                  'Editar dados de parcela'),
    ('BAIXA_PARCELA',                   'Dar baixa em parcela (marcar como paga)'),
    ('ESTORNAR_PARCELA',                'Estornar pagamento de parcela'),
    ('INATIVAR_PARCELA',                'Inativar/cancelar parcela'),
    ('GERAR_CARNE_ESCOLAR',             'Gerar carne escolar'),
    ('GERAR_RECIBO',                    'Gerar recibo de pagamento'),
    ('VISUALIZAR_HISTORICO_PARCELA',    'Ver historico de alteracoes de parcelas'),

    -- ============================================================
    -- MOVIMENTAÇÕES FINANCEIRAS
    -- ============================================================
    ('VISUALIZAR_MOVIMENTACAO_FINANCEIRA', 'Ver movimentacoes financeiras'),

    -- ============================================================
    -- CONTAS BANCÁRIAS
    -- ============================================================
    ('VISUALIZAR_CONTA_BANCARIA',       'Ver contas bancarias'),
    ('CRIAR_CONTA_BANCARIA',            'Cadastrar conta bancaria'),
    ('EDITAR_CONTA_BANCARIA',           'Editar conta bancaria'),
    ('INATIVAR_CONTA_BANCARIA',         'Inativar conta bancaria'),

    -- ============================================================
    -- CATEGORIAS FINANCEIRAS
    -- ============================================================
    ('VISUALIZAR_CATEGORIA_FINANCEIRA', 'Ver categorias financeiras'),
    ('CRIAR_CATEGORIA_FINANCEIRA',      'Criar categoria financeira'),
    ('EDITAR_CATEGORIA_FINANCEIRA',     'Editar categoria financeira'),
    ('INATIVAR_CATEGORIA_FINANCEIRA',   'Inativar categoria financeira'),

    -- ============================================================
    -- RELATÓRIOS
    -- ============================================================
    ('VISUALIZAR_RELATORIO_FREQUENCIA',     'Ver relatorio de frequencia'),
    ('VISUALIZAR_RELATORIO_NOTAS',          'Ver relatorio de notas'),
    ('VISUALIZAR_RELATORIO_TURMAS',         'Ver relatorio de turmas'),
    ('VISUALIZAR_RELATORIO_ALUNOS',         'Ver relatorio de alunos'),
    ('VISUALIZAR_RELATORIO_FINANCEIRO',     'Ver relatorios financeiros'),
    ('VISUALIZAR_RELATORIO_INADIMPLENCIA',  'Ver relatorio de inadimplencia'),
    ('VISUALIZAR_RELATORIO_RECEITAS',       'Ver relatorio de receitas'),

    -- ============================================================
    -- DASHBOARDS
    -- ============================================================
    ('VISUALIZAR_DASHBOARD_GERAL',          'Ver dashboard geral do sistema'),
    ('VISUALIZAR_DASHBOARD_FINANCEIRO',     'Ver dashboard financeiro'),
    ('VISUALIZAR_DASHBOARD_ACADEMICO',      'Ver dashboard academico'),

    -- ============================================================
    -- AUDITORIA E LOGS
    -- ============================================================
    ('VISUALIZAR_LOGS_AUDITORIA',       'Ver logs de auditoria do sistema'),
    ('VISUALIZAR_LOGS_USUARIO',         'Ver acoes de um usuario especifico'),
    ('EXPORTAR_LOGS',                   'Exportar logs de auditoria'),

    -- ============================================================
    -- SISTEMA E INTEGRAÇÕES
    -- ============================================================
    ('GERENCIAR_CONFIGURACOES_SISTEMA', 'Alterar configuracoes gerais do sistema'),
    ('GERENCIAR_BACKUP',                'Realizar backup e restore do sistema'),
    ('VISUALIZAR_METRICAS_SISTEMA',     'Ver metricas e performance do sistema'),
    ('IMPORTAR_ALUNOS',                 'Importar alunos em massa'),
    ('EXPORTAR_ALUNOS',                 'Exportar lista de alunos'),
    ('IMPORTAR_FINANCEIRO',             'Importar dados financeiros'),
    ('EXPORTAR_FINANCEIRO',             'Exportar dados financeiros');