const MAX_FIELD_LENGTH = 600;

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


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  if (!apiKey) {
    return sendJson(res, 503, { error: 'Gemini ainda não configurado na Vercel.' });
  }

  const {
    phrase = '',
    meaning = '',
    pronunciation = '',
    transcript = '',
    score = 0
  } = req.body || {};

  const fields = [phrase, meaning, pronunciation, transcript].map(value => String(value).trim());
  if (!fields[0] || !fields[3]) {
    return sendJson(res, 400, { error: 'Frase e tentativa são obrigatórias.' });
  }
  if (fields.some(value => value.length > MAX_FIELD_LENGTH)) {
    return sendJson(res, 400, { error: 'Texto muito longo.' });
  }

  const systemInstruction = `
Você é um professor paciente de inglês para um treinador brasileiro iniciante.
Dê feedback em português do Brasil.
Explique apenas uma ou duas melhorias por vez.
Não ridicularize erros e não diga que a pessoa "falou errado" de forma absoluta,
pois a transcrição automática também pode falhar.
Use linguagem simples, acolhedora e prática.
Não use IPA. Pode usar aproximação de pronúncia em português como apoio.
A resposta deve ter no máximo 90 palavras.
`.trim();

  const input = `
Frase-alvo: ${fields[0]}
Significado: ${fields[1]}
Apoio de pronúncia: ${fields[2]}
O navegador transcreveu: ${fields[3]}
Pontuação textual: ${Number(score) || 0}%
Explique o que treinar agora e dê um exercício curto de repetição.
`.trim();

  const schema = {
    type: 'object',
    properties: { feedback: { type: 'string' } },
    required: ['feedback']
  };

  try {
    const { response, data } = await callGemini({
      apiKey, model, systemInstruction, input, schema
    });

    if (!response.ok) {
      console.error('Gemini English coach error:', data);
      return sendJson(res, 502, {
        error: data?.error?.message || 'O Gemini não respondeu.'
      });
    }

    const raw = extractGeminiText(data);
    if (!raw) return sendJson(res, 502, { error: 'Resposta vazia.' });
    const parsed = cleanJson(raw);
    return sendJson(res, 200, { feedback: String(parsed.feedback || '').trim() });
  } catch (error) {
    console.error('English coach route error:', error);
    return sendJson(res, 500, { error: 'Erro ao preparar o feedback.' });
  }
}
