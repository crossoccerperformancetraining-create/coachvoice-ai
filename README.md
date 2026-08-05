# CoachVoice AI v3.1 — revisão para celular

Esta versão corrige os principais problemas observados durante o primeiro uso no celular.

## Correções principais

- resultados não desaparecem mais depois de tocar em **Analisar**;
- abrir uma aba não apaga automaticamente a resposta da aba anterior;
- todos os botões de voz usam uma janela de gravação visível;
- o áudio é gravado mesmo quando o reconhecimento nativo do navegador falha;
- quando a IA estiver configurada, o áudio pode ser transcrito por `api/transcribe.js`;
- sem IA, o usuário pode ouvir a gravação e digitar o texto para continuar;
- câmera do Estúdio grava o vídeo e um áudio separado para transcrição;
- mensagens de erro de permissão ficaram mais claras;
- cache alterado para **network-first**, reduzindo o risco de abrir versão antiga.

## Entrevistas

Foram adicionados temas de:

- sequência sem vencer;
- derrota por placar elevado;
- vitória com atuação ruim;
- torcida e pressão;
- arbitragem, VAR e expulsão;
- jogador no banco, jovem após erro e falha do goleiro;
- reforços e vazamento do vestiário;
- mudança tática;
- clássico, final, apresentação e pressão por demissão.

Também há três estilos de jornalista: profissional, insistente e provocativo.

## Modelo de jogo

A área agora explica que um princípio é um **comportamento esperado em campo**. As escolhas estão divididas em:

- sem a bola;
- com a bola;
- transições;
- comportamento coletivo.

O botão **Usar um exemplo básico** preenche uma situação para o primeiro teste.

## Transcrição por IA

Para ativar a transcrição no celular, configure na Vercel:

- `OPENAI_API_KEY`
- opcional: `OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe`

Sem a chave, gravação e reprodução continuam funcionando.

## Publicação

Envie todos os arquivos para o repositório. A pasta `api` deve conter:

- `coach-ai.js`
- `english-coach.js`
- `mentor.js`
- `transcribe.js`

Commit sugerido:

`Revisar funções mobile e iniciar fase de treinos v3.1`

Teste no domínio oficial:

`https://coachvoice-ai.vercel.app/?v=31`
