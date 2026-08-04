# CoachVoice AI v1.8 — Firebase Login e Progresso

## Novidades

- Tela de conta do treinador.
- Cadastro por e-mail e senha.
- Login por e-mail e senha.
- Login com Google.
- Progresso salvo no Firestore.
- Progresso carregado ao entrar em outro aparelho.
- Modo demonstração quando o Firebase não está configurado.

## Configuração

1. Crie um projeto no Firebase.
2. Registre um aplicativo Web.
3. Ative Authentication:
   - E-mail/senha
   - Google
4. Crie o Firestore.
5. Copie `firebase-config.example.js` para `firebase-config.js`.
6. Cole a configuração fornecida pelo Firebase.
7. Publique as regras de `firestore.rules`.
8. Envie os arquivos para o GitHub.

## Segurança

Não coloque chaves privadas ou credenciais de conta de serviço no navegador.
O objeto firebaseConfig identifica o projeto, mas a segurança depende das regras do Firebase.
