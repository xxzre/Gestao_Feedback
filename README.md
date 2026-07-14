# Gestão de Feedback & DISC

App de gestão de feedback, agenda de conversas e teste DISC, com login para
gestores e colaboradores. Os dados ficam salvos no **Firebase Firestore**,
então todo mundo que acessa o site vê os mesmos dados, em tempo real.

## 1. Rodar no seu computador (antes de publicar)

Você vai precisar do [Node.js](https://nodejs.org) instalado (versão 18+).

```bash
npm install
npm run dev
```

Isso abre o app em `http://localhost:5173`. Mas antes de testar o login,
faça o passo 2.

## 2. Criar o banco de dados gratuito no Firebase

1. Acesse https://console.firebase.google.com e crie um projeto (gratuito,
   não precisa cartão de crédito).
2. Dentro do projeto, clique no ícone **`</>`** ("Adicionar app" → Web) e
   dê um nome qualquer ao app.
3. O Firebase vai mostrar um bloco `firebaseConfig = {...}`. Copie esses
   valores para o arquivo `src/firebase.js`, substituindo os `SEU_...`.
4. No menu lateral esquerdo, vá em **Firestore Database** → **Criar banco de dados** → escolha uma região (ex: `southamerica-east1`) → modo de produção.
5. No menu lateral esquerdo, vá em **Authentication** → **Get Started** / **Começar** → ative o método de login por **E-mail/Senha** (Email/Password).
6. Depois de criado o Firestore, vá na aba **Regras** (Rules) do Firestore Database e cole as regras seguras definidas em `firestore.rules` (ou use a CLI do Firebase):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /feedbacks/{feedbackId} {
      allow read, write: if request.auth != null;
    }
    match /agenda/{agendaId} {
      allow read, write: if request.auth != null;
    }
    match /discResults/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

> 🔒 **Segurança Ativada:** o banco de dados agora está devidamente seguro e protegido. Apenas usuários autenticados via Firebase Authentication possuem acesso de leitura/escrita, e um usuário não pode modificar os dados DISC ou cadastrais de outros usuários.

Salve, rode `npm run dev` de novo e crie sua primeira conta (ela vira
Gestor automaticamente).

## 3. Publicar no GitHub Pages (do jeito que você já usa)

1. Suba este projeto para um repositório novo no GitHub (pelo GitHub
   Desktop, como sempre: commit → push).
2. Abra `vite.config.js` e troque `/NOME-DO-REPOSITORIO/` pelo nome exato
   do seu repositório (ex: se a URL é `github.com/seu-usuario/feedback-app`,
   use `/feedback-app/`). Faça commit dessa alteração.
3. No GitHub, vá em **Settings → Pages** do repositório e em "Build and
   deployment" escolha **Source: GitHub Actions**.
4. Pronto — este projeto já vem com o arquivo
   `.github/workflows/deploy.yml`, que builda e publica o site
   automaticamente a cada push na branch `main`.
5. Depois do primeiro push, acompanhe em **Actions** no GitHub até o
   workflow terminar (ícone verde). O link do site aparece em
   **Settings → Pages**.

A partir daí, seu fluxo continua igual: edita, commita, dá push no GitHub
Desktop, e o site atualiza sozinho em 1-2 minutos.

## Estrutura do projeto

```
src/
  App.jsx        -> todo o app (login, dashboard, feedbacks, agenda, DISC)
  firebase.js     -> configuração de conexão com o Firestore
  main.jsx        -> ponto de entrada do React
index.html
vite.config.js
```
