# Regras do Learly (devs + IA)

Documento curto e obrigatório. Vale para humanos e para a IA (Cursor).
Se algo aqui conflitar com um pedido pontual, **pergunte antes de quebrar a regra**.

---

## 1. Fluxos que NÃO podem quebrar

### 1.1 Criação de aluno
- Aluno só pode nascer pelo fluxo: **pré-aluno (comercial) -> aprovação da secretaria -> aluno + matrícula `Em Espera`**.
- **NÃO** recriar criação direta de aluno (`POST /api/alunos`) nem a permissão `CRIAR_ALUNO`. Isso foi removido de propósito.
- A aprovação usa a permissão `APROVAR_MATRICULA`, **não** `CRIAR_ALUNO`.
- O serviço interno `AlunosService.CriarAlunoAsync` **deve continuar existindo** — a aprovação de pré-aluno depende dele. Nunca apagar.

### 1.2 Funil comercial -> secretaria
- Status do pré-aluno: `Em negociacao` -> `Aguardando aprovacao` -> `Matriculado` (ou `Cancelado`).
- Edição de pré-aluno só é permitida em `Em negociacao` (inclui o caso "devolvido pela secretaria").
- Recusa da secretaria volta o status para `Em negociacao` e grava o motivo em `observacoes_comerciais`.

### 1.3 Matrícula
- Aprovação gera matrícula em `Em Espera`.
- Enturmar muda para `Ativo` (usa `EDITAR_MATRICULA`).

---

## 2. Multi-escola (multi-tenant) — crítico

- Toda query, service e endpoint **deve filtrar pela escola do usuário logado** (`escolaId` / `codigoEscola` do JWT).
- **Nunca** retornar dados sem aplicar o filtro de escola. Risco de vazamento entre escolas.
- A escola **não vai na URL**; vem do token. Ex.: `GET /api/livros/{id}` só retorna se o livro for da escola do usuário.
- Super admin é a escola `SYSTEM`; rotas de escola e de super admin são separadas.

---

## 3. Datas e horários

- Carimbos e textos exibidos ao usuário usam **horário de Brasília** (`America/Sao_Paulo`), não UTC.
- No backend, usar o helper `DataHoraBrasil` para gerar carimbos visíveis.

---

## 4. Onde mexer ao criar/alterar permissões

Permissão nova precisa ser adicionada em TODOS estes lugares (senão fica inconsistente):

1. `database/setup.sql` — catálogo de permissões + template do perfil
2. `database/seed_cwb_idiomas.sql` — se aplicável ao seed da escola piloto
3. `backend/Learly.API/Configuration/SecurityConfig.cs` — registro da policy
4. `frontend/types/permissao.ts` — união de tipos
5. `frontend/components/super-admin/GerenciarTemplates.tsx` — catálogo visível
6. `frontend/lib/menu-config.tsx` — se a permissão controla um item de menu

---

## 5. Arquitetura — como construir

### Backend (.NET, Clean Architecture)
- Camadas: `Domain` -> `Application` -> `Infrastructure` -> `API` (+ `Worker`).
- Controller fino: só recebe request, chama o service e devolve resultado.
- Regra de negócio vai no **Service**; acesso a dados no **Repository**.
- Erros de negócio: `DomainException` (vira 400) ou os result types (`*Resultado` / `*Falha`). Evitar `throw` genérico.

### Frontend (Next.js, App Router)
- Chamadas de API passam pelo cliente central `frontend/lib/api/client.ts` e pelos módulos em `frontend/lib/api/*`.
- Permissões na UI via `hasPermission` + `frontend/lib/menu-config.tsx`. Não duplicar listas de permissão soltas.
- Não criar um caminho de API novo para algo que já existe num módulo de `lib/api`.

### Banco
- Mudança de schema vai em `database/setup.sql` (e seed, quando fizer sentido).
- Escola nova copia o template de perfis/permissões.

---

## 6. Segurança / o que NÃO commitar

- Nunca commitar `.env`, `.env.local`, senhas, ou `Jwt:Key` real.
- `appsettings.json` fica com `ConnectionStrings` e `Jwt:Key` vazios no repo; cada dev preenche localmente.
- Não logar segredos nem dados sensíveis do aluno/responsável.

---

## 7. Antes de finalizar uma tarefa (checklist)

- [ ] Frontend: `npm run build` passa (o `build` checa tipos; o `dev` não pega tudo).
- [ ] Backend: `dotnet build` passa.
- [ ] Testei o fluxo afetado de ponta a ponta (não só um botão).
- [ ] Se mexi em banco/permissão: recriei o banco e fiz logout/login.
- [ ] Não deixei referência morta (import/variável/rota sem uso).

---

## 8. Trabalho em equipe (duas máquinas)

- Git é a fonte da verdade do código. `node_modules`, `.env*` e o banco local NÃO sincronizam por Git.
- Fluxo de branches: ver `docs/tutorial.md` (Git Flow com `develop` + `feature/*`).
- Sempre `git pull` na `develop` antes de começar.
- Combine quem mexe em qual área para evitar conflito.

---

## 9. Como subir o sistema

Ver `docs/iniciar_sistema.txt`. Resumo:
- Backend: `cd backend/Learly.API` -> `dotnet restore` -> `dotnet run`
- Frontend: `cd frontend` -> `npm install` -> `npm run dev`
- Banco: criar/recriar com `database/setup.sql` (+ `database/seed_cwb_idiomas.sql` para a escola piloto).
- Configurar `frontend/.env.local` a partir de `frontend/.env.example`.
