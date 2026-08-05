# CoachVoice AI v3.0 — Estúdio do Treinador

## Novidade principal

A versão 3.0 acrescenta o **Estúdio do Treinador**, mantendo todas as funções da v2.3.

### Modos de vídeo

- oratória em português;
- entrevista em português;
- entrevista em inglês;
- explicação no quadro tático;
- vestiário e liderança;
- apresentação profissional.

### Recursos disponíveis

- câmera frontal ou traseira;
- gravações de 30, 45 ou 60 segundos;
- reprodução imediata;
- nova tentativa e descarte;
- transcrição pelo navegador quando disponível;
- duração, palavras, palavras por minuto e vícios localizados;
- checklist de autoavaliação visual;
- salvamento local no IndexedDB;
- biblioteca de vídeos;
- exclusão de gravações;
- comparação lado a lado entre duas tentativas;
- feedback local e IA opcional sobre a transcrição.

## Limites desta primeira versão

O aplicativo **não interpreta automaticamente** postura, direção do olhar, gestos ou emoções. Ele analisa a transcrição e usa a autoavaliação marcada pelo treinador. Isso evita apresentar conclusões visuais que o sistema ainda não mediu.

Os vídeos ficam somente no navegador atual. Eles podem ser perdidos ao limpar os dados do navegador, usar navegação anônima, trocar de computador ou reinstalar o navegador.

## Publicação

Substitua os arquivos da v2.3 pelos arquivos deste pacote. Dois arquivos novos devem ficar na raiz:

- `studio.css`
- `studio.js`

A pasta `api` continua com:

- `mentor.js`
- `english-coach.js`
- `coach-ai.js`

Commit sugerido:

`Adicionar Estúdio do Treinador v3.0`

Depois do deploy, abra somente o domínio oficial:

`https://coachvoice-ai.vercel.app/?v=30`

## Teste inicial

1. Abra **Estúdio do Treinador**.
2. Escolha **Oratória em português**.
3. Selecione 30 segundos.
4. Ative câmera e microfone.
5. Grave a primeira tentativa.
6. Assista e marque a autoavaliação.
7. Salve o vídeo.
8. Grave uma segunda tentativa.
9. Compare os dois vídeos.
