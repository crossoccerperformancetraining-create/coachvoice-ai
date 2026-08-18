const MAX_SITUATION_LENGTH = 3000;

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}


function extractGeminiText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const pieces = [];
  for (const step of data?.steps || []) {
    if (step?.type !== 'model_output') continue;
    for (const content of step?.content || []) {
      if (content?.type === 'text' && typeof content?.text === 'string') {
        pieces.push(content.text);
      }
    }
  }
  return pieces.join('\n').trim();
}

function cleanJson(raw) {
  return JSON.parse(
    String(raw || '')
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
  );
}

async function callGemini({ apiKey, model, input, systemInstruction = '', schema = null }) {
  const body = {
    model,
    input,
    system_instruction: systemInstruction
  };
  if (schema) {
    body.response_format = {
      type: 'text',
      mime_type: 'application/json',
      schema
    };
  }

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}


function parseMentorJson(raw) {
  const parsed = cleanJson(raw);
  const required = ['analysis', 'answer', 'pauseAnswer', 'avoid', 'followup'];
  for (const key of required) {
    if (typeof parsed[key] !== 'string' || !parsed[key].trim()) {
      throw new Error(`Resposta sem o campo ${key}.`);
    }
  }
  return Object.fromEntries(required.map(key => [key, parsed[key].trim()]));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  if (!apiKey) {
    return sendJson(res, 503, {
      error: 'A variável GEMINI_API_KEY ainda não foi configurada na Vercel.'
    });
  }

  const {
    situation = '',
    audience = 'Imprensa',
    tone = 'Sereno',
    duration = '30 segundos',
    language = 'Português'
  } = req.body || {};

  const normalizedSituation = String(situation).trim();
  if (!normalizedSituation) return sendJson(res, 400, { error: 'Descreva uma situação.' });
  if (normalizedSituation.length > MAX_SITUATION_LENGTH) {
    return sendJson(res, 400, { error: 'A situação está muito longa.' });
  }

  const schema = {
    type: 'object',
    properties: {
      analysis: { type: 'string' },
      answer: { type: 'string' },
      pauseAnswer: { type: 'string' },
      avoid: { type: 'string' },
      followup: { type: 'string' }
    },
    required: ['analysis','answer','pauseAnswer','avoid','followup']
  };

  const systemInstruction = `
Você é o Coach Mentor AI, assistente de comunicação para treinadores de futebol.
Ajude a preparar falas éticas, respeitosas, profissionais e aplicáveis à situação.
Não invente fatos sobre clubes, jogadores ou partidas.
Não imite pessoas reais nem reproduza bordões de treinadores conhecidos.
Adapte a resposta ao público, tom, duração e idioma pedidos.
A marcação de pausas deve usar "/" para pausa curta e "//" para pausa longa.
`.trim();

  const input = `
Situação: ${normalizedSituation}
Público: ${String(audience)}
Tom: ${String(tone)}
Duração desejada: ${String(duration)}
Idioma: ${String(language)}
`.trim();

  try {
    const { response, data } = await callGemini({
      apiKey, model, systemInstruction, input, schema
    });

    if (!response.ok) {
      console.error('Gemini mentor error:', data);
      return sendJson(res, 502, {
        error: data?.error?.message || 'A inteligência artificial não respondeu.'
      });
    }

    const raw = extractGeminiText(data);
    if (!raw) return sendJson(res, 502, { error: 'A IA retornou uma resposta vazia.' });
    return sendJson(res, 200, parseMentorJson(raw));
  } catch (error) {
    console.error('Mentor route error:', error);
    return sendJson(res, 500, {
      error: 'O Coach Mentor encontrou um erro ao preparar a orientação.'
    });
  }
}
