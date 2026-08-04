# CoachVoice AI v2.3 — versão consolidada de testes

Esta é a versão planejada para permanecer em teste antes de novas atualizações.

## Áreas principais

- Diário do Treinador:
  - plano da manhã;
  - inglês;
  - oratória;
  - entrevista, treino, reunião ou jogo;
  - reflexão no final do dia.
- Inglês em três níveis:
  - iniciante: palavras, montagem, repetição e correção visual;
  - intermediário: situações e respostas guiadas;
  - alto nível: simulações profissionais em inglês.
- Oratória:
  - transcrição;
  - contagem de palavras;
  - duração estimada;
  - vícios e repetições;
  - reescrita com IA e marcação de pausas.
- Entrevistas com IA.
- Liderança com IA.
- Comunicação do modelo de jogo.
- Coach Mentor.
- Dia de jogo, biblioteca e formação completa.
- Pontos, sequência de dias e atividades recentes.

## IA

O aplicativo continua funcionando sem IA, usando respostas locais.

Para ativar as respostas personalizadas, configure na Vercel:

- `OPENAI_API_KEY`
- opcional: `OPENAI_MODEL` com valor `gpt-5-mini`

Arquivos de API:

- `api/mentor.js`
- `api/english-coach.js`
- `api/coach-ai.js`

## Publicação

Substitua os arquivos da versão anterior pelos arquivos deste pacote.

Commit sugerido:

`Criar versão consolidada de testes v2.3`

Depois do deploy, abra:

`https://coachvoice-ai.vercel.app/?v=23`

Use somente o domínio oficial. Não use URLs antigas de deployments marcados
como `Ready Stale`.
