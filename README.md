# CoachVoice AI v2.1 — microfone nas aulas

## Correções

- o botão “Responder pelo microfone” das aulas agora solicita o microfone;
- a fala é convertida em texto;
- o treinador pode corrigir a transcrição;
- a resposta recebe uma comparação textual inicial;
- é possível ouvir a própria resposta;
- as práticas ficam registradas localmente;
- o `sw.js` não procura mais o arquivo Firebase removido;
- o novo service worker assume o controle e apaga caches antigos.

## Limite desta primeira análise

A nota da aula é uma comparação da transcrição. Ela ainda não mede diretamente:

- pronúncia;
- qualidade da voz;
- velocidade real;
- duração das pausas;
- clareza acústica.

Essas medições exigirão gravação de áudio e análise específica na próxima
etapa.

## Publicação

Substitua todos os arquivos do repositório pelos arquivos deste pacote.

Commit sugerido:

`Ativar microfone nas aulas e corrigir cache`

Depois do deploy, abra:

`https://coachvoice-ai.vercel.app/?v=21`

No computador, use `Ctrl + F5` uma vez.
