# CoachVoice AI v1.9 — Coach Mentor com IA

## Novidade principal

A tela Coach Mentor agora chama uma função segura da Vercel em:

`POST /api/mentor`

A chave da OpenAI fica na Vercel e nunca aparece no navegador ou no GitHub.

## Configuração na Vercel

1. Abra o projeto CoachVoice na Vercel.
2. Entre em **Settings → Environment Variables**.
3. Crie:

```text
OPENAI_API_KEY = sua chave secreta da API
```

4. Opcionalmente, crie:

```text
OPENAI_MODEL = gpt-5-mini
```

5. Marque Production, Preview e Development.
6. Salve.
7. Faça um novo deploy.

## Arquivos novos

- `api/mentor.js`: função segura que consulta a OpenAI.
- `package.json`: configura o runtime Node.js.

## Teste

Abra o app, entre em **Mentor**, descreva uma situação e toque em
**Preparar orientação**.

Se a variável ainda não estiver configurada, o aplicativo mantém o modo
demonstrativo como fallback.

## Segurança

Nunca coloque `OPENAI_API_KEY` em:

- `index.html`;
- `firebase-config.js`;
- arquivos enviados ao GitHub;
- código executado no navegador.

O `firebaseConfig` é configuração pública do aplicativo Firebase. A chave da
OpenAI é secreta e deve permanecer apenas no servidor.
