# Pendências Learly

## Concluído

- (concluído) ajustar filtros de professor na parte de turmas
- (concluído) ajustar data de início da turma (dia da semana + calendário geral)
- (concluído) criar página do admin "configuração do sistema" (min/máx alunos por turma)
- (concluído) criar página do admin "dados da escola" (nome, CNPJ, endereço, logo)

---

## A fazer (ordem recomendada)

### Fase 1 — Correções rápidas

1. ajustar contrato ativo/inativo, pois um tava inativo e tava aparecendo na parte de gerar contrato todos
2. ajustar cor do texto quando for criar modelo de contrato pois está muito claro
3. ajustar na parte de secretaria os botões de matrículas — colocar nessa sequência: **Alunos Enturmados**, **Alunos em Espera**, **Alunos Inativos**, **Todas as Matrículas** (hoje: Em Espera, Canceladas, Todas)

### Fase 2 — Permissões

4. ajustar permissão de compromissos: quem pode criar é secretaria, coordenador e admin; o resto só vê
5. ajustar permissão de agenda global: quem pode ver é somente admin, coordenador e secretaria
6. ajustar permissão de ver páginas de livros: somente admin pode ver e fazer CRUD

### Fase 3 — Bugs acadêmicos

7. ajustar parte de criar turmas e aulas — turma com segunda e quarta gerou aulas só na segunda; quarta só apareceu após adicionar feriado e recalcular
8. ajustar Minha Agenda (`/professor`), pois o calendário está bugado
8.1 ajustar questão de alunos ativos e inativos, pois tem alunos ativos na guia de inativos

### Fase 4 — Responsáveis e contratos (banco + fluxos)

9. ajustar no sistema e no banco pro aluno ter opcional 2 responsáveis
10. ajustar parte do contrato pra ter uma classificação de contrato — ao salvar, deve ser ou **responsável = aluno** ou **aluno com responsável**
11. ajustar na aprovação da secretaria (matricular aluno): poder colocar responsável opcional (até 2)

### Fase 5 — Configurações e fluxo do professor

12. ajustar configurações de métricas de presença — selecionar presença por dia ou por capítulo; separar em cards na página de configurações (Turmas, Métrica de Duração de Aulas, etc.)
13. ajustar questão de presença e conclusão de aula — professor inicia a aula (horário e usuário salvos), dá presença só para capítulos/aulas daquele dia; não pode adiantar aulas futuras
