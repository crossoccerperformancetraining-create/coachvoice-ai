const MAX_TEXT = 420;
const ROUTE_VERSION = '5.7.6-stable-audio';

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function models() {
  return [...new Set([
    process.env.GEMINI_TTS_MODEL || '',
    'gemini-3.8-flash-lite-tts',
    'gemini-3.8-flash-tts'
  ].filter(Boolean))];
}

function extractAudio(data) {
  let found = null;
  for (const step of data?.steps || []) {
    if (step?.type !== 'model_output') continue;
    for (const item of step?.content || []) {
      if (item?.type === 'audio' && item?.data) {
        found = {
          data: item.data,
          mimeType: item.mime_type || item.mimeType || 'audio/wav'
        };
      }
    }
  }
  return found;
}

function styleFor(profile) {
  const base = 'Português do Brasil natural, humano, acolhedor e profissional. Fale como em uma conversa real: entonação variada, articulação clara, sem voz de robô, sem tom de locutor e sem pressa.';
  if (profile === 'devotional') return base + ' Tom sereno e respeitoso. Faça pausas perceptíveis entre passagem, reflexão, oração e atitude. Na oração, fale mais devagar, com calor e reverência, sem dramatização.';
  if (profile === 'reflection') return base + ' Ritmo calmo e contemplativo. Faça uma pausa breve depois do título e pausas maiores entre blocos de reflexão.';
  if (profile === 'reading') return base + ' Leitura clara e agradável. Diga título e autor, pause, então leia o trecho. Faça outra pausa antes da pergunta final.';
  if (profile === 'podcast') return base + ' Ritmo de podcast pessoal, próximo e fluido, com pausas naturais entre ideias.';
  return base + ' Ritmo moderado e conversacional.';
}

async function requestTts({apiKey, model, text, voice, profile}) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      model,
      input: [{
        type: 'user_input',
        content: [{
          type: 'text',
          text,
          annotations: [{
            type: 'speech_metadata',
            style: styleFor(profile)
          }]
        }]
      }],
      response_format: { type: 'audio' },
      generation_config: {
        speech_config: [{ voice }]
      }
    })
  });
  const data = await response.json().catch(() => ({}));
  return {response, data};
}

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  const defaultModel = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts';

  if (req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      configured: Boolean(apiKey),
      model: defaultModel,
      routeVersion: ROUTE_VERSION
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, {error:'Método não permitido.'});
  }

  if (!apiKey) {
    return sendJson(res, 503, {
      error:'GEMINI_API_KEY não configurada.',
      code:'missing_gemini_api_key'
    });
  }

  const text = String(req.body?.text || '').replace(/\s+/g,' ').trim();
  const voice = String(req.body?.voice || 'Gacrux').trim() || 'Gacrux';
  const profile = String(req.body?.profile || 'conversation').trim().toLowerCase();

  if (!text) return sendJson(res, 400, {error:'Texto vazio.', code:'empty_text'});
  if (text.length > MAX_TEXT) {
    return sendJson(res, 400, {
      error:`Trecho muito longo para uma chamada de voz (${text.length}/${MAX_TEXT}).`,
      code:'text_too_long'
    });
  }

  let last = null;
  for (const model of models()) {
    try {
      const result = await requestTts({apiKey, model, text, voice, profile});
      if (result.response.ok) {
        const audio = extractAudio(result.data);
        if (audio?.data && /^[A-Za-z0-9+/]+={0,2}$/.test(audio.data) && audio.data.length > 64) {
          return sendJson(res, 200, {
            ok:true,
            audio:audio.data,
            mimeType:audio.mimeType,
            modelUsed:model,
            voice,
            profile,
            routeVersion:ROUTE_VERSION
          });
        }
      }
      last = {
        status: result.response.status,
        message: result.data?.error?.message || 'O Gemini TTS não retornou áudio.',
        code: result.data?.error?.status || result.data?.error?.code || 'tts_error',
        model
      };
      // Permissões, limites e payload inválido não melhoram trocando o modelo.
      if ([400, 401, 403, 429].includes(result.response.status)) break;
    } catch (error) {
      last = {
        status: 502,
        message: error?.message || 'Falha de rede no Gemini TTS.',
        code: 'network_error',
        model
      };
    }
  }

  return sendJson(res, last?.status === 429 ? 429 : 502, {
    error: last?.message || 'Não foi possível gerar a voz.',
    code: last?.code || 'tts_error',
    modelUsed: last?.model || defaultModel,
    routeVersion: ROUTE_VERSION
  });
}
