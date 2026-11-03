## CoachVoice AI v5.2 — Experiência Final

Hoje · Agenda · CoachDay · Mentor humanizado · Treinar · Evolução · Backup local

## CoachVoice AI v5.1 — Dashboard Integrado

# CoachVoice AI v5.0 — Dashboard + Inglês e Espanhol

Versão v5.0: Dashboard diário com tarefas e fechamento do dia, Mentor humanizado com voz manual sem interrupção, CoachDay, CoachPrep, Dia a Dia, entrevistas e treino profissional de inglês e espanhol.

Variável necessária na Vercel: `GEMINI_API_KEY`.
# CoachVoice AI v4.9 — Conversa Humana + Encerramentontrevistas mais reais

## Novidades

- **☕ Dia a Dia**: nova aba para conversar sobre rotina, horários, prioridades, estudo, viagem, cansaço ou qualquer assunto do cotidiano.
- **Mentor com mais modos**, organizados em grupos: conversa, decisão, gestão, preparação e reflexão.
- **Entrevistas** com botão **Responder próxima pergunta**, pular pergunta e encerrar coletiva.
- **Coletiva contínua** opcional com 5 ou 10 perguntas.
- Mais cenários, incluindo **Vitória na estreia**, derrota/empate na estreia, clássicos, classificação, eliminação, liderança, acesso, risco de rebaixamento, título e outros.
- Jornalistas: amigável, neutro, insistente, provocador e hostil-profissional.
- Mantida a memória por dia da v4.7 e a voz estável no iPhone da v4.6.1.

## Vercel

A variável continua sendo:

`GEMINI_API_KEY`

Não é necessário trocar a chave se a v4.7 já estava funcionando.

## Teste recomendado

1. Abra `Dia a Dia` e diga: “Hoje meu dia vai ser bastante corrido...”.
2. Abra `Entrevistas` → `Vitória na estreia`.
3. Responda e toque em `Responder próxima pergunta`.
4. Ligue `Coletiva contínua` e faça uma sequência de 5 perguntas.

## v5.7.5 — Áudio iPhone + continuidade diária
- iPhone: a fala usa primeiro Gemini TTS em áudio real; se a rota falhar, volta automaticamente para a voz do navegador.
- iPad e demais aparelhos mantêm o mecanismo já usado na v5.7.3.
- Novo acompanhamento leve na tela Hoje: check-in rápido, continuidade do registro de ontem e fechamento noturno.
- Devocional/reflexões, diário, Study Coach, biblioteca, curso, agenda e Mentor foram preservados.
- Nova função serverless: `api/tts.js`, usando a mesma `GEMINI_API_KEY` já configurada no Vercel.



## v5.7.5 — Voz natural, pausas e fontes
- Voz TTS com prosódia mais conversacional no iPhone e fallback preservado.
- Devocional lido por blocos: passagem, reflexão, oração e atitude, com pausas reais.
- Reflexões e leitura do dia com pausa entre título e conteúdo.
- Leitura do livro mostra fonte, autor, status de trecho verificado e botão Abrir fonte.
- Study Coach mostra referência/fonte e link para a obra quando disponível.

## v5.7.6 — Cancelamento de áudio seguro (03/11/2026)

Corrige reprodução tardia após interrupção, espera indefinida de áudio pausado e solicitações TTS pendentes. A prioridade para áudio real no iPhone, o fallback do Safari e todos os módulos v5.7.5 permanecem. Leia `LEIA-V5.7.6-AUDIO-ESTAVEL.txt`.
