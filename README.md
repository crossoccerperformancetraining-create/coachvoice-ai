# CoachVoice AI v2.2 — inglês iniciante passo a passo

## Nova experiência de inglês

A área de inglês foi refeita para quem está começando do zero:

1. conhecer poucas palavras;
2. ouvir cada palavra;
3. ver o significado em português;
4. montar a frase na ordem correta;
5. ouvir devagar e na velocidade natural;
6. repetir pelo microfone;
7. visualizar palavras reconhecidas em verde;
8. visualizar palavras para repetir em vermelho;
9. receber uma orientação acolhedora;
10. avançar somente uma frase por vez.

## Observação importante

As cores se baseiam na transcrição de voz feita pelo navegador. Isso ajuda a
praticar, mas não é uma medição acústica precisa de pronúncia. O navegador pode
interpretar uma palavra de forma diferente mesmo quando a fala está razoável.

## IA opcional

Foi adicionada a função:

`api/english-coach.js`

Quando `OPENAI_API_KEY` estiver configurada na Vercel, o botão de explicação
personalizada usa IA. Sem a chave, o aplicativo continua funcionando com
orientação local.

## Publicação

Substitua todos os arquivos da versão anterior.

Commit sugerido:

`Criar inglês iniciante passo a passo`

Depois do deploy, abra:

`https://coachvoice-ai.vercel.app/?v=22`
