# CoachVoice AI v4.4 — Mentor IA Conversa Estável

## O que foi corrigido

A conversa do Mentor não usa mais a gravação/transcrição de servidor como primeira opção.

### Fluxo principal
1. Toque no microfone.
2. O navegador reconhece sua fala diretamente.
3. A frase aparece na tela: **Entendi: ...**
4. Ela é enviada automaticamente ao Mentor.
5. O Mentor responde em texto.
6. A resposta é falada pelo aparelho.
7. A tela volta para **Sua vez**.

### Modo automático
Existe uma opção para tentar voltar a ouvir automaticamente depois que o Mentor termina de falar.
Para maior estabilidade, ela vem como opção e pode ser desligada.

## Diagnóstico rápido

A nova área **Diagnóstico rápido** testa separadamente:
- microfone;
- reconhecimento de fala;
- resposta em voz;
- fallback `/api/transcribe`;
- conexão com o Mentor IA `/api/coach-ai`.

Isso evita tratar todos os problemas como “microfone”.

## Fallback

Se o navegador não tiver reconhecimento direto, o Mentor tenta o gravador/transcrição alternativa.

Se `OPENAI_API_KEY` não estiver configurada:
- o reconhecimento direto do Chrome ainda pode funcionar;
- o Mentor ainda possui respostas locais;
- a IA completa e a transcrição alternativa ficam limitadas.

## Tudo que continua disponível

- Voz
- Videochamada
- Conversa livre
- Modo Mentor
- Só perguntas
- Simulação
- Estou evitando essa conversa
- Questione minha decisão
- Me prepare em 5 minutos
- Não quero conselho
- Refazer resposta
- Repetir resposta
- Filtro da Crítica
- Memória
- Modo Pré-Clube
- CoachPrep 12 semanas
- CoachDay

## Publicação

Estrutura correta:

```text
api/
├── coach-ai.js
├── english-coach.js
├── mentor.js
└── transcribe.js
```

Commit sugerido:

`Corrigir conversa por voz e diagnóstico do Mentor v4.4`

Teste:

`https://coachvoice-ai.vercel.app/?v=44`
