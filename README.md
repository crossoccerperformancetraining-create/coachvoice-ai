# CoachVoice AI v2.0 — modo individual

Esta versão foi reorganizada para os testes iniciais de uma única pessoa, sem
login e sem Firebase.

## Novidades

- navegação principal com Início, Mentor, Treinar, Biblioteca e Evolução;
- página de inglês interativa:
  - frase em inglês;
  - áudio lento e natural;
  - significado em português;
  - pergunta “o que você diria?”;
  - ditado por voz quando disponível;
  - resposta recomendada;
  - feedback textual demonstrativo;
- preferência global de voz feminina, masculina ou automática;
- escolha entre inglês americano e britânico;
- níveis iniciante, intermediário e avançado;
- biblioteca de situações profissionais;
- modo Dia de Jogo: pré-jogo, intervalo e pós-jogo;
- Coach Mentor integrado ao treino de oratória;
- histórico local de sessões do Mentor e exercícios de inglês;
- nome, progresso e preferências salvos no próprio aparelho.

## Dados

O aplicativo usa `localStorage`. Nenhuma conta é necessária.

O Firebase será retomado somente quando houver necessidade de:

- mais usuários;
- sincronização entre dispositivos;
- recuperação de progresso;
- armazenamento de áudio e vídeo.

## IA do Coach Mentor

A rota opcional `api/mentor.js` continua incluída. Quando `OPENAI_API_KEY`
estiver configurada na Vercel, o Mentor usa IA real. Sem a variável, o
aplicativo apresenta a orientação demonstrativa local.

Nunca coloque a chave da API dentro do `index.html` ou do GitHub.

## Publicação

Envie os arquivos para a raiz do repositório do CoachVoice. A Vercel fará um
novo deploy automaticamente.

Commit sugerido:

`Criar CoachVoice v2.0 em modo individual`
