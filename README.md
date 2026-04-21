# Controle de Acesso por Cargo com Firebase

Aplicação web desenvolvida para demonstrar **modelagem de dados**, **autenticação com Firebase Auth** e **controle de acesso por cargo** utilizando **Firebase Realtime Database** e **Firebase Security Rules**.

O sistema possui dois tipos de usuário:

- **user**
- **admin**

Cada cargo possui permissões diferentes de acesso ao banco de dados, definidas diretamente nas regras de segurança do Firebase.

---

## Objetivo do projeto

O objetivo deste projeto é implementar uma aplicação web conectada ao **Firebase Realtime Database**, com autenticação de usuários e separação de permissões conforme o cargo atribuído no momento do cadastro.

A aplicação demonstra, na prática:

- modelagem do banco em estrutura JSON;
- autenticação com email e senha;
- salvamento do cargo do usuário no banco;
- restrição de acesso por cargo com Firebase Security Rules;
- interface visual para testar e comparar as permissões de cada perfil.

---

## Tecnologias utilizadas

- **HTML5**
- **CSS3**
- **JavaScript**
- **Firebase Authentication**
- **Firebase Realtime Database**
- **Firebase Security Rules**

---

## Estrutura do banco de dados

A modelagem do banco foi organizada em formato de árvore JSON, com os nós principais exigidos pela atividade:

- `/users`
- `/admin-data`

### Exemplo da estrutura JSON

```json
{
  "users": {
    "UID_DO_USUARIO": {
      "email": "aluno@exemplo.com",
      "role": "user",
      "createdAt": 1710000000000,
      "lastLoginAt": 1710001234567
    },
    "UID_DO_ADMIN": {
      "email": "admin@exemplo.com",
      "role": "admin",
      "createdAt": 1710000000000,
      "lastLoginAt": 1710009876543
    }
  },
  "admin-data": {
    "dashboardMessage": "Somente admin pode acessar este nó.",
    "lastUpdatedBy": "UID_DO_ADMIN",
    "updatedAt": 1710009876543
  }
}
