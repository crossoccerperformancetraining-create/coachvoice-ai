# CoachVoice AI v3.2 — Estabilidade e Enquadramento

Esta versão mantém as correções mobile da v3.1 e melhora o Estúdio do Treinador.

## Novidades do Estúdio

### Orientação horizontal

O modo horizontal é obrigatório em:

- oratória em vídeo;
- apresentação profissional;
- quadro tático;
- vestiário e liderança.

Entrevistas em plano próximo podem ser gravadas na vertical ou horizontal.

Quando o celular está na orientação incorreta:

- aparece um aviso para girar;
- a prévia recebe uma mensagem visual;
- o botão de gravação permanece bloqueado.

### Três molduras

- **Entrevista — plano próximo:** rosto, ombros e parte das mãos.
- **Apresentação — plano médio:** cabeça, tronco, mãos e gestos.
- **Quadro tático — plano aberto:** treinador de um lado e quadro completo do outro.

O aplicativo escolhe automaticamente a moldura recomendada, mas ela pode ser
alterada manualmente.

### Teste de gestos

Antes de gravar nos planos médio e aberto, o treinador confirma manualmente:

1. levantar as duas mãos;
2. abrir os braços;
3. apontar para a direita;
4. apontar para a esquerda.

Esta versão **não detecta automaticamente** cabeça, mãos ou gestos. O teste usa a
prévia da câmera para o próprio treinador confirmar o enquadramento.

### Qualidade e preparação

- solicitação de vídeo em 1280 × 720;
- limite de 30 quadros por segundo;
- informação da resolução entregue pelo aparelho;
- checklist de apoio do celular, iluminação, ruído e espaço lateral;
- enquadramento e orientação ficam registrados junto ao vídeo salvo.

## Arquivos

Na raiz:

- `index.html`
- `studio.css`
- `studio.js`
- `studio-framing.js`
- `sw.js`
- `manifest.webmanifest`
- `package.json`
- `vercel.json`

Na pasta `api`:

- `coach-ai.js`
- `english-coach.js`
- `mentor.js`
- `transcribe.js`

## Publicação

Commit sugerido:

`Adicionar enquadramento horizontal e teste de gestos v3.2`

Depois do deploy, abra:

`https://coachvoice-ai.vercel.app/?v=32`

Faça uma atualização forçada ou use o botão de atualização do aplicativo quando
ele estiver disponível.

## Primeiro teste

1. Abra **Estúdio do Treinador**.
2. Escolha **Apresentação profissional**.
3. Ative a câmera.
4. Gire o celular para horizontal.
5. Faça os quatro movimentos do teste.
6. Grave 30 segundos.
7. Salve e confira se aparece na biblioteca.
