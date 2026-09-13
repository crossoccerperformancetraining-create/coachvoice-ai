export const config = { api: { bodyParser: false } };

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const ROUTE_VERSION = '5.1.1-generate-content';

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

function normalizeMime(value) {
  const raw = String(value || '').toLowerCase().split(';')[0].trim();

  // Safari/iPhone costuma gravar AAC dentro de MP4.
  if (raw === 'audio/mp4' || raw === 'video/mp4' || raw === 'audio/x-m4a') return 'audio/m4a';

  // Gravação somente de áudio em WebM deve continuar sendo enviada como áudio.
  if (raw === 'video/webm' || raw.includes('webm')) return 'audio/webm';

  if (raw.includes('ogg')) return 'audio/ogg';
  if (raw.includes('wav')) return 'audio/wav';
  if (raw.includes('mpeg') || raw.includes('mp3')) return 'audio/mpeg';
  if (raw.includes('aac')) return 'audio/aac';
  if (raw.includes('aiff')) return 'audio/aiff';
  if (raw.includes('flac')) return 'audio/flac';
  if (raw.includes('opus')) return 'audio/opus';

  return raw.startsWith('audio/') ? raw : 'audio/m4a';
}

function extractGenerateContentText(data) {
  const pieces = [];
  for (const candidate of data?.candidates || []) {
    for (const part of candidate?.content?.parts || []) {
      if (typeof part?.text === 'string' && part.text.trim()) pieces.push(part.text.trim());
    }
  }
  return pieces.join('\n').trim();
}

function uniqueModels() {
  const configured = process.env.GEMINI_TRANSCRIBE_MODEL || '';
  return [...new Set([
    configured,
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.7-flash'
  ].filter(Boolean))];
}

async function generateTranscript({ apiKey, model, mimeType, base64, language, authMode }) {
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const url = authMode === 'query'
    ? `${baseUrl}?key=${encodeURIComponent(apiKey)}`
    : baseUrl;

  const headers = { 'Content-Type': 'application/json' };
  if (authMode === 'header') headers['x-goog-api-key'] = apiKey;

  const prompt = [
    `Transcreva fielmente esta fala em ${language}.`,
    'Retorne somente a transcrição, sem comentários, sem aspas e sem explicações.',
    'Preserve nomes próprios, termos de futebol e mudanças de idioma quando forem audíveis.',
    'Use pontuação natural, mas não resuma nem invente palavras.'
  ].join(' ');

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64
            }
          },
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 4096
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  return { response, data, text: extractGenerateContentText(data) };
}

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  const models = uniqueModels();

  if (req.method === 'GET') {
    return sendJson(res, 200, {
      configured: Boolean(apiKey),
      provider: 'gemini',
      routeVersion: ROUTE_VERSION,
      model: models[0],
      fallbackModels: models.slice(1)
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  if (!apiKey) {
    return sendJson(res, 503, {
      error: 'GEMINI_API_KEY ainda não foi configurada para a transcrição.'
    });
  }

  try {
    const audio = await readBody(req);
    if (!audio.length) return sendJson(res, 400, { error: 'O áudio recebido está vazio.' });
    if (audio.length > MAX_AUDIO_BYTES) {
      return sendJson(res, 413, { error: 'O áudio ficou grande demais. Grave uma fala um pouco mais curta.' });
    }

    const mimeType = normalizeMime(req.headers['content-type']);
    const language = String(req.query?.lang || 'pt-BR');
    const base64 = audio.toString('base64');

    let lastStatus = 502;
    let lastMessage = 'A transcrição Gemini não respondeu.';

    // Primeiro usa ?key=, documentado para generateContent. Se houver problema,
    // tenta também x-goog-api-key antes de mudar de modelo.
    for (const model of models) {
      for (const authMode of ['query', 'header']) {
        try {
          const { response, data, text } = await generateTranscript({
            apiKey, model, mimeType, base64, language, authMode
          });

          if (response.ok && text) {
            return sendJson(res, 200, {
              text,
              provider: 'gemini',
              model,
              routeVersion: ROUTE_VERSION
            });
          }

          lastStatus = response.status || 502;
          lastMessage =
            data?.error?.message ||
            (response.ok ? 'A transcrição retornou um texto vazio.' : 'A transcrição Gemini não respondeu.');

          console.error('Gemini transcription attempt failed:', {
            status: lastStatus,
            model,
            authMode,
            mimeType,
            message: lastMessage
          });

          // Erros de quota/limite não melhoram trocando apenas a forma de autenticação.
          if (lastStatus === 429) break;
        } catch (error) {
          lastMessage = error?.message || 'Falha de rede ao chamar o Gemini.';
          console.error('Gemini transcription request error:', {
            model, authMode, mimeType, message: lastMessage
          });
        }
      }
    }

    const clientStatus =
      lastStatus === 429 ? 429 :
      lastStatus === 401 || lastStatus === 403 ? 502 :
      lastStatus >= 400 && lastStatus < 500 ? 422 :
      502;

    return sendJson(res, clientStatus, {
      error: lastStatus === 429
        ? 'O serviço de transcrição atingiu o limite temporário. Tente novamente em instantes.'
        : 'Não foi possível transcrever este áudio agora. A gravação pode ser reenviada sem você falar novamente.',
      detail: lastMessage,
      routeVersion: ROUTE_VERSION
    });
  } catch (error) {
    console.error('Gemini transcription route error:', error);
    if (error?.message === 'AUDIO_TOO_LARGE') {
      return sendJson(res, 413, {
        error: 'O áudio ficou grande demais. Grave uma fala um pouco mais curta.'
      });
    }
    return sendJson(res, 500, {
      error: 'Não foi possível processar o áudio.',
      routeVersion: ROUTE_VERSION
    });
  }
}
