const MAX_TEXT = 5000;

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function extractText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const pieces = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') pieces.push(content.text);
    }
  }
  return pieces.join('\n').trim();
}

function cleanJson(raw) {
  return JSON.parse(
    raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
  );
}

const modeInstructions = {
  health: {
    schema: '{"ok":true}',
    task: 'Responda somente {"ok":true}.'
  },
  'daily-plan': {
    schema: '{"summary":"...","focus":"...","tasks":[{"id":"...","period":"morning|afternoon|evening","icon":"...","title":"...","description":"...","page":"english|oratory|interviews|leadership|gamemodel|matchday|mentor|daily"}]}',
    task: 'Crie um plano diário curto para um treinador. Inclua inglês, comunicação e reflexão. No máximo 6 tarefas.'
  },
  'english-beginner': {
    schema: '{"feedback":"..."}',
    task: 'Explique em português, com acolhimento, apenas uma melhoria de pronúncia ou repetição. Máximo 80 palavras. A transcrição automática pode falhar.'
  },
  'english-intermediate': {
    schema: '{"feedback":"...","model":"...","tip":"..."}',
    task: 'Avalie inglês intermediário de um treinador brasileiro. Corrija poucas coisas, preserve a intenção e forneça uma resposta-modelo curta.'
  },
  'english-advanced': {
    schema: '{"feedback":"...","model":"...","nextQuestion":"...","tip":"..."}',
    task: 'Atue como interlocutor profissional no futebol. Avalie clareza e naturalidade, dê modelo e faça uma pergunta seguinte.'
  },
  oratory: {
    schema: '{"feedback":"...","rewritten":"...","pauses":"...","exercise":"..."}',
    task: 'Atue como assessor de comunicação. Reorganize a fala em português sem apagar o estilo. Use / para pausa curta e // para pausa longa.'
  },
  interview: {
    schema: '{"feedback":"...","model":"...","avoid":"...","nextQuestion":"..."}',
    task: 'Atue como assessor e jornalista esportivo. Ajude o treinador a responder diretamente, proteger o grupo e mostrar um próximo passo.'
  },
  leadership: {
    schema: '{"feedback":"...","otherPersonReply":"...","nextStep":"..."}',
    task: 'Simule uma conversa profissional. Avalie respeito, critério e clareza; responda como a outra pessoa e proponha um próximo passo.'
  },
  'video-session': {
    schema: '{"feedback":"...","contentStructure":"...","nextAttempt":"..."}',
    task: 'Analise somente a transcrição, as métricas textuais e a autoavaliação fornecidas. Não afirme que viu o vídeo. Dê feedback curto sobre a estrutura verbal e uma meta prática para a próxima tentativa.'
  },
  'game-model': {
    schema: '{"message":"...","briefing":"...","avoid":"..."}',
    task: 'Transforme princípios de jogo em uma mensagem curta e compreensível aos jogadores. Use ações observáveis e evite excesso de jargão.'
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return sendJson(res, 503, { error: 'IA não configurada.' });

  const { mode = '', payload = {} } = req.body || {};
  const config = modeInstructions[mode];
  if (!config) return sendJson(res, 400, { error: 'Modo inválido.' });

  const payloadText = JSON.stringify(payload);
  if (payloadText.length > MAX_TEXT) return sendJson(res, 400, { error: 'Conteúdo muito longo.' });

  const instructions = `
Você faz parte do CoachVoice AI, plataforma para treinadores de futebol.
Seja profissional, paciente, respeitoso e aplicável à situação.
Não invente fatos, não diagnostique estados mentais e não imite pessoas reais.
Dê poucas melhorias por vez.
Responda SOMENTE com JSON válido no formato:
${config.schema}
`.trim();

  const input = `${config.task}\n\nDados enviados:\n${payloadText}`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5-mini',
        instructions,
        input
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI Coach AI error:', data);
      return sendJson(res, 502, { error: data?.error?.message || 'A IA não respondeu.' });
    }

    const raw = extractText(data);
    if (!raw) return sendJson(res, 502, { error: 'Resposta vazia.' });
    return sendJson(res, 200, cleanJson(raw));
  } catch (error) {
    console.error('Coach AI route error:', error);
    return sendJson(res, 500, { error: 'Erro ao preparar orientação.' });
  }
}
