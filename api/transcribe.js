export const config = { api: { bodyParser: false } };

const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (req.body instanceof Uint8Array) return Buffer.from(req.body);
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_AUDIO_BYTES) throw new Error('AUDIO_TOO_LARGE');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function extractGeminiText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const pieces = [];
  for (const step of data?.steps || []) {
    if (step?.type !== 'model_output') continue;
    for (const content of step?.content || []) {
      if (content?.type === 'text' && typeof content?.text === 'string') pieces.push(content.text);
    }
  }
  return pieces.join('\n').trim();
}

function geminiMediaBlock(contentType, base64) {
  const type = String(contentType || '').toLowerCase().split(';')[0];

  if (type.includes('webm')) {
    return { type: 'video', data: base64, mime_type: 'video/webm' };
  }
  if (type.includes('mp4') || type.includes('m4a')) {
    return { type: 'audio', data: base64, mime_type: 'audio/m4a' };
  }
  if (type.includes('wav')) return { type: 'audio', data: base64, mime_type: 'audio/wav' };
  if (type.includes('mpeg') || type.includes('mp3')) return { type: 'audio', data: base64, mime_type: 'audio/mp3' };
  if (type.includes('aiff')) return { type: 'audio', data: base64, mime_type: 'audio/aiff' };
  if (type.includes('aac')) return { type: 'audio', data: base64, mime_type: 'audio/aac' };
  if (type.includes('ogg')) return { type: 'audio', data: base64, mime_type: 'audio/ogg' };
  if (type.includes('flac')) return { type: 'audio', data: base64, mime_type: 'audio/flac' };
  return null;
}

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_TRANSCRIBE_MODEL || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

  if (req.method === 'GET') {
    return sendJson(res, 200, {
      configured: Boolean(apiKey),
      provider: 'gemini',
      model
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  if (!apiKey) {
    return sendJson(res, 503, {
      error: 'GEMINI_API_KEY ainda não foi configurada. O reconhecimento direto do navegador continua disponível.'
    });
  }

  try {
    const audio = await readBody(req);
    if (!audio.length) return sendJson(res, 400, { error: 'O áudio recebido está vazio.' });
    if (audio.length > MAX_AUDIO_BYTES) return sendJson(res, 413, { error: 'O áudio está muito grande.' });

    const contentType = String(req.headers['content-type'] || 'audio/mp4').split(';')[0];
    const media = geminiMediaBlock(contentType, audio.toString('base64'));
    if (!media) {
      return sendJson(res, 415, {
        error: `Formato de áudio não suportado pelo fallback Gemini: ${contentType}`
      });
    }

    const language = String(req.query?.lang || 'pt-BR');
    const prompt = `Transcreva fielmente esta fala em ${language}. Retorne somente a transcrição, sem explicações. Preserve termos de futebol, nomes próprios e vícios de linguagem quando forem audíveis.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: [
          { type: 'text', text: prompt },
          media
        ]
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Gemini transcription error:', data);
      return sendJson(res, 502, {
        error: data?.error?.message || 'A transcrição Gemini não respondeu.'
      });
    }

    const text = extractGeminiText(data);
    if (!text) return sendJson(res, 502, { error: 'A transcrição retornou um texto vazio.' });
    return sendJson(res, 200, { text });
  } catch (error) {
    console.error('Gemini transcription route error:', error);
    if (error?.message === 'AUDIO_TOO_LARGE') {
      return sendJson(res, 413, { error: 'O áudio ultrapassou o limite desta versão.' });
    }
    return sendJson(res, 500, { error: 'Não foi possível processar o áudio.' });
  }
}
