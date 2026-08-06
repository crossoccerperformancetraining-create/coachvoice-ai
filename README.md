# CoachVoice AI v3.3 — Câmera, fases do jogo e inglês guiado

## Câmera adaptável

- Entrevista em plano próximo.
- Corpo inteiro no celular vertical.
- Apresentação e gestos no celular horizontal.
- Quadro tático no horizontal.
- O modo vertical usa moldura 9:16 e `object-fit: contain`, evitando o corte
  automático que mostrava apenas o rosto.
- Para corpo inteiro, o treinador deve afastar o aparelho e manter cabeça,
  mãos e pés dentro da moldura.
- Somente o quadro tático bloqueia a gravação quando o celular está vertical.

## Modelo de jogo por fases

### Organização ofensiva
- saída de tiro de meta;
- primeira fase de construção;
- segunda fase de construção;
- último terço;
- finalização e ocupação da área.

### Organização defensiva
- marcação no tiro de meta;
- bloco alto;
- bloco médio;
- bloco baixo;
- defesa da área.

### Transição ofensiva
- primeiro passe;
- contra-ataque e profundidade;
- manutenção da posse.

### Transição defensiva
- pressão pós-perda;
- proteção do centro;
- recomposição do bloco.

### Bolas paradas
- ofensivas: escanteio, falta e lateral;
- defensivas: escanteio, falta e segunda bola.

Cada subfase pergunta:

1. qual é o objetivo;
2. qual é o gatilho;
3. quem inicia e quem continua;
4. como saber que funcionou;
5. qual é a alternativa.

## Entrevistas

Foram adicionados temas sobre:

- pênalti e acréscimos;
- lesões;
- capitão;
- base;
- saída de bola;
- bloco alto e baixo;
- transições;
- bolas paradas;
- contrato;
- diretoria;
- calendário.

O treinador pode escolher padrões profissionais genéricos:

- direto e responsável;
- proteção do grupo;
- tático e simples;
- calmo sob pressão;
- institucional.

O aplicativo não imita nem atribui respostas a treinadores reais.

## Professor de frase em inglês

Na etapa iniciante, o treinador pode digitar qualquer frase curta.

Exemplo:

- frase esperada: `My name is`;
- fala reconhecida: `My name`;
- correção: repetir `is`.

A tela mostra:

- o que o celular entendeu;
- a frase esperada;
- palavras verdes e vermelhas;
- o trecho que deve ser repetido;
- áudio lento somente da correção.

## Publicação

Estrutura principal:

- `index.html`
- `studio.css`
- `studio.js`
- `studio-framing.js`
- `coachvoice-v33.js`
- `sw.js`
- `manifest.webmanifest`
- `package.json`
- `vercel.json`

Pasta `api`:

- `coach-ai.js`
- `english-coach.js`
- `mentor.js`
- `transcribe.js`

Commit sugerido:

`Adicionar câmera adaptável, fases do jogo e inglês guiado v3.3`

Depois do deploy:

`https://coachvoice-ai.vercel.app/?v=33`
