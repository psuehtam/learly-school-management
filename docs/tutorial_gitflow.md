# 🧭 **Guia Prático: Git Flow e GitHub**
---

## 🚀 **COMEÇAR A PROGRAMAR (FLUXO NORMAL)**

---

### 1️⃣ **Atualizar sua `develop` local com o que seus amigos já fizeram**

```bash
git checkout develop
git pull origin develop
```

> [!TIP]
> Sempre atualize sua `develop` antes de começar qualquer coisa.
> Isso evita conflitos e garante que você está trabalhando com o **código mais recente da equipe**.

✅ Agora sua `develop` local está **sincronizada com o GitHub**.

---

### 2️⃣ **Criar uma nova feature para sua tarefa**

```bash
git flow feature start tarefa-exemplo
```

> [!NOTE]
> Isso cria a branch **`feature/tarefa-exemplo`** a partir da sua `develop` e já muda para ela automaticamente.

---

### 3️⃣ **Trabalhar na feature e salvar (Commit)**

Faça suas alterações normalmente no código. Quando quiser salvar seu progresso:

```bash
git add .
git commit -m "Descrição clara do que você fez"
```

> [!TIP]
> Faça **commits pequenos e frequentes**. Isso facilita entender o histórico e corrigir problemas depois.

---

### 4️⃣ **Publicar a feature para seus amigos (Opcional)**

Se você precisa que alguém veja seu código ou quer apenas um backup na nuvem antes de terminar:

```bash
git flow feature publish tarefa-exemplo
```

✅ Agora seus amigos podem acessar sua branch no GitHub.

---

### 5️⃣ **Finalizar a feature e enviar para o GitHub**

Quando terminar **100% da tarefa** e estiver pronto para juntar com o projeto principal:

```bash
# 1. Garanta que sua develop está atualizada antes de finalizar
git checkout develop
git pull origin develop

# 2. Volte para a feature e finalize (o Git Flow fará o merge e apagará a branch local)
git checkout feature/tarefa-exemplo
git flow feature finish tarefa-exemplo
```

> [!NOTE]
> Abriu uma tela estranha no terminal? Não se assuste! > Se após o comando de finish o terminal abrir um editor de texto (Vim) com a mensagem "Merge branch...", o Git está apenas pedindo para confirmar a mensagem do commit de mesclagem.
>  **Para confirmar e sair dessa tela, aperte a tecla `Esc`, digite `:wq` e aperte `Enter`.**

> Se fizer isso não precisa fazer `git push`.

```bash
# 3. Suba a develop (agora com a sua feature integrada) para o GitHub
git push origin develop
```

> [!CAUTION]
> Se aparecerem conflitos ao rodar o comando `finish`, o Git vai pausar. **Resolva os conflitos no seu editor**, salve, rode `git add .` e `git commit`. A feature será mesclada.

✅ Agora **todas as suas mudanças estão na develop do GitHub**.

---

## 👥 **COMO SEUS AMIGOS PEGAM O QUE VOCÊ FEZ**

Eles só precisam rodar:

```bash
git checkout develop
git pull origin develop
```

> [!NOTE]
> Assim, o repositório deles fica **atualizado com tudo que você acabou de enviar**.

---

## ⚠️ **CASO PROGRAME NA DEVELOP SEM QUERER**

Se você começou a digitar código na `develop` por engano, **mas ainda não deu commit**, não se desespere! O Git leva suas alterações junto com você.

### 1️⃣ **Criar a feature (o Git leva o código junto)**

```bash
git flow feature start nome-da-feature
```

> [!NOTE]
> Suas alterações não salvas vão automaticamente para essa nova branch. A `develop` ficará limpa!

### 2️⃣ **Salvar o código na feature correta**

```bash
git add .
git commit -m "Minhas alterações salvas no lugar certo"
```

✅ Pronto! Agora é só continuar trabalhando normalmente no passo 3 do fluxo normal.

---

## 🧩 **CASO PROGRAME DIRETO NA DEVELOP (E QUEIRA MANTER LÁ)**

Pequenas correções urgentes que não precisam de uma feature inteira.

### 1️⃣ **Verificar e commitar suas alterações**

```bash
git add .
git commit -m "Correção rápida na develop"
```

### 2️⃣ **Atualizar antes de enviar (para evitar conflitos)**

```bash
git pull origin develop
```

> [!CAUTION]
> Se der conflito, resolva no editor, salve e faça um novo commit antes de prosseguir.

### 3️⃣ **Enviar as alterações para o GitHub**

```bash
git push origin develop
```

✅ Suas mudanças estão na `develop` da nuvem, sem precisar de aprovação ou Pull Request.

---

## 💬 **DICAS FINAIS DE OURO**

> [!IMPORTANT]
> 🔹 **1.** Sempre **puxe (`pull`)** antes de começar a programar.
> 🔹 **2.** Sempre **envie (`push`)** depois que terminar a feature.
> 🔹 **3.** Use **features separadas** para tarefas diferentes. Nunca faça duas coisas gigantes na mesma branch.
> 🔹 **4.** Evite trabalhar direto na `develop`, deixe isso só para emergências ou ajustes mínimos.

---