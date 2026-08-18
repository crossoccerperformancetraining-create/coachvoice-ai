# CoachVoice AI v4.6 — Gemini

Esta versão troca a IA principal da OpenAI pelo **Gemini API**.

## Variável necessária na Vercel

```text
GEMINI_API_KEY
```

Opcionalmente:

```text
GEMINI_MODEL=gemini-3.1-flash-lite
```

O modelo padrão do pacote é `gemini-3.1-flash-lite`.

## O que usa Gemini

- Mentor IA
- conversa livre e modos de gestão
- CoachDay
- CoachPrep
- entrevistas
- oratória
- liderança
- inglês com IA
- modelo de jogo
- fallback de transcrição por áudio

## Diagnóstico

Depois do deploy, abra:

```text
https://coachvoice-ai.vercel.app/api/coach-ai
```

O esperado:

```json
{
  "ok": true,
  "provider": "gemini",
  "configured": true,
  "model": "gemini-3.1-flash-lite",
  "environment": "production"
}
```

## Publicação

Commit sugerido:

`Migrar CoachVoice para Gemini v4.6`

Teste:

`https://coachvoice-ai.vercel.app/?v=46`
