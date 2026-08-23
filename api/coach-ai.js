const MAX_TEXT = 14000;

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
  'coachday-pre': {
    schema: '{"recommendation":"...","duration":"none|quick|short|meeting|special","why":"...","message":"...","structure":["..."],"avoid":["..."],"questionToSelf":"..."}',
    task: 'Atue como assistente cotidiano de um treinador. Decida se ele precisa falar antes da atividade e por quanto tempo. Evite discurso diário por hábito. Use o contexto, o que é novo e o que já foi comunicado. Produza uma comunicação humana, prática e não teatral.'
  },
  'coachday-post': {
    schema: '{"summary":"...","field":["..."],"communication":["..."],"squad":[{"person":"...","fact":"...","nextStep":"...","when":"..."}],"tomorrow":["..."],"noActionYet":["..."],"reflection":"..."}',
    task: 'Organize o relato livre do treinador após treino ou jogo. Separe fatos observáveis de interpretações. Identifique campo, comunicação, acompanhamento de pessoas, pendências para amanhã e situações que talvez não exijam ação agora. Não rotule jogadores nem diagnostique emoções.'
  },
  'coachday-week': {
    schema: '{"weekTheme":"...","cadence":[{"day":"...","focus":"...","communication":"...","duration":"..."}],"opponentMessages":["..."],"avoid":"..."}',
    task: 'Organize uma semana de trabalho e uma cadência de comunicação. Não entregue todas as informações do adversário no primeiro dia. Conecte mensagens aos treinos e evite reuniões longas repetidas.'
  },
  'coachday-moment': {
    schema: '{"duration":"...","opening":"...","keyPoints":["..."],"script":"...","avoid":["..."],"questions":["..."]}',
    task: 'Prepare um momento profissional de treinador: chegada ao clube, apresentação ao elenco, diretoria, imprensa, comissão, início de competição ou crise. Adapte a mesma situação ao público. Não imite treinadores reais nem faça promessas de resultado.'
  },
  'coachday-radar': {
    schema: '{"attention":[{"icon":"...","subject":"...","why":"...","nextStep":"..."}],"communicationNote":"...","question":"..."}',
    task: 'Crie um radar diário curto usando memória, semana e acompanhamento do elenco. Mostre no máximo seis itens. Não julgue pessoas. Ajude o treinador a lembrar pendências, equilibrar atenção e decidir quando falar menos.'
  },
  'coachday-reaction': {
    schema: '{"facts":"...","separateDecisionFromRelationship":"...","options":["..."],"suggestedAction":"...","shortScript":"..."}',
    task: 'Ajude o treinador antes de reagir a uma situação com atleta ou membro da equipe. Trabalhe apenas com o fato informado, separe decisão de relação e ofereça opções: agir agora, conversar em privado, observar ou não agir. Não diagnostique intenção ou estado mental.'
  },
  'coachprep-session': {
    schema: '{"didWell":"...","improve":"...","nextAttempt":"...","question":"..."}',
    task: 'Atue como mentor de desenvolvimento de liderança para um treinador. Analise somente o texto da resposta. Dê uma qualidade observável, uma melhoria, uma próxima tentativa e uma pergunta. Trabalhe critério, escuta, clareza, coerência e próximo passo. Não diagnostique personalidade ou emoção.'
  },
  'coachprep-conversation': {
    schema: '{"feedback":"...","otherPersonReply":"...","nextQuestion":"...","nextAttempt":"..."}',
    task: 'Simule uma conversa curta de gestão de grupo. Responda como a outra pessoa de forma realista, sem agressividade artificial. Depois dê feedback ao treinador sobre escuta, critério, micro-meta e fechamento. Não prometa escalação nem imite pessoas reais.'
  },
  'coachprep-simulation': {
    schema: '{"feedback":"...","otherPersonReply":"...","nextQuestion":"...","leadershipSignal":"...","nextAttempt":"..."}',
    task: 'Simule jogador, capitão, comissão ou diretoria em uma conversa profissional de futebol. Reaja ao que o treinador realmente escreveu, continue a situação e avalie apenas comportamentos textuais observáveis como clareza, respeito, critério e abertura para ouvir.'
  },
  'coachprep-decision': {
    schema: '{"facts":"...","criterion":"...","risks":["..."],"communication":"...","review":"...","avoid":"..."}',
    task: 'Ajude um treinador a revisar uma decisão difícil. Separe fato de interpretação, teste se há critério coerente, identifique riscos de comunicação, sugira uma forma clara de conversar e indique quando revisar a decisão. Não rotule atletas.'
  },
  'coachprep-code': {
    schema: '{"strengths":"...","tensions":["..."],"additions":["..."],"practice":"..."}',
    task: 'Revise um Código de Liderança de treinador. Procure coerência prática, possíveis contradições e princípios ausentes. Evite slogans vazios. Transforme valores em comportamentos observáveis e proponha uma prática semanal.'
  },
  'mentor-dialogue': {
    schema: '{"spoken":"...","reflection":"...","nextQuestion":"...","savePoint":"..."}',
    task: 'Converse como Mentor IA de um treinador de futebol, de forma natural e fluida. O campo dialogueMode define o comportamento. free: RESPONDA primeiro ao que o treinador realmente disse, como numa conversa aberta; não transforme toda resposta em exercício, não use roteiro fixo e não faça pergunta por obrigação. Faça no máximo UMA pergunta no final e somente quando ela realmente ajudar a conversa; nextQuestion pode ser vazio. mentor: responda e oriente primeiro, depois questione com respeito quando houver um ponto que vale testar; no máximo uma pergunta. questions: NÃO dê solução, faça somente uma pergunta útil por resposta. simulation: interprete o papel indicado e reaja de forma natural ao que o treinador disse. avoid: ajude a preparar uma conversa evitada, mas responda antes de perguntar. challenge: teste critério e coerência sem interrogatório. five: seja objetivo e faça no máximo uma pergunta essencial antes de estruturar. organize: apenas organize fato, interpretação, decisão e pendência, sem aconselhar. Use history para continuidade da conversa atual e todayEarlierContext apenas quando for relevante. NUNCA traga dias anteriores espontaneamente. Só use previousDayContext quando specialContext indicar que o treinador escolheu explicitamente retomar aquele dia. coachProfile é memória permanente e deve orientar discretamente o estilo, sem ser recitado. spoken deve soar natural quando lido em voz alta. Não bajule, não rotule pessoas e não diagnostique emoções.'
  },
  'mentor-daily-summary': {
    schema: '{"summary":"...","highlights":["..."],"decisions":["..."],"people":[{"name":"...","context":"..."}],"pending":["..."],"learning":["..."]}',
    task: 'Resuma o dia do treinador de forma factual e útil. Use a conversa e, quando existir, o registro CoachDay. Não invente acontecimentos. summary deve ter no máximo 5 frases. highlights: fatos e temas relevantes. decisions: decisões ou critérios realmente mencionados. people: somente pessoas citadas e o contexto, sem diagnosticar emoção. pending: apenas assuntos que ficaram claramente abertos. learning: aprendizados observáveis do próprio treinador. Não planeje o dia seguinte e não faça sermão.'
  },
  'mentor-review-answer': {
    schema: '{"didWell":"...","improve":"...","retryPrompt":"...","model":"..."}',
    task: 'Revise a resposta do treinador usando apenas o texto fornecido. Aponte UMA qualidade observável, UMA melhoria prioritária, uma instrução curta para refazer e uma alternativa de fala. Avalie clareza, escuta, critério, coerência e próximo passo. Não diga que analisou tom de voz ou linguagem corporal.'
  },
  'mentor-filter-criticism': {
    schema: '{"actionable":true,"actionableWhy":"...","usefulPart":"...","outsideControl":"...","noise":"...","respondNow":false,"action":"...","blindSpot":"..."}',
    task: 'Aplique um Filtro da Crítica. Separe: 1) o que pode virar ação observável; 2) parte útil mesmo se a crítica foi mal colocada; 3) o que está fora do controle; 4) ruído/opinião sem evidência; 5) se exige resposta agora. Se challenge for true, faça uma pergunta de possível ponto cego sem assumir que a crítica é verdadeira. Preserve o princípio: eu não controlo toda crítica, eu escolho o que merece minha atenção.'
  },
  'mentor-close-session': {
    schema: '{"summary":"...","learning":"...","nextAction":"...","carryForward":"..."}',
    task: 'Resuma uma conversa de desenvolvimento do treinador em quatro campos curtos. Registre o contexto sem rotular pessoas. learning deve ser um aprendizado observável. nextAction deve ser concreto e revisável. carryForward deve indicar o que perguntar ou verificar na próxima conversa.'
  },
  'game-model': {
    schema: '{"message":"...","briefing":"...","avoid":"..."}',
    task: 'Transforme fase, subfase, objetivo, gatilho, funções, critério de sucesso e alternativa em uma mensagem curta e compreensível aos jogadores. Use ações observáveis, preserve a lógica tática e evite excesso de jargão.'
  }
};

export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

  if (req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      provider: 'gemini',
      configured: Boolean(apiKey),
      exactKeyPresent: Object.prototype.hasOwnProperty.call(process.env, 'GEMINI_API_KEY'),
      model,
      environment: process.env.VERCEL_ENV || 'unknown'
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  if (!apiKey) {
    return sendJson(res, 503, {
      error: 'GEMINI_API_KEY não configurada na Vercel.',
      code: 'missing_gemini_api_key'
    });
  }

  const { mode = '', payload = {} } = req.body || {};
  const config = modeInstructions[mode];
  if (!config) return sendJson(res, 400, { error: 'Modo inválido.' });

  const payloadText = JSON.stringify(payload);
  if (payloadText.length > MAX_TEXT) {
    return sendJson(res, 400, { error: 'Conteúdo muito longo.' });
  }

  const schema = cleanJson(config.schema);

  const systemInstruction = `
Você faz parte do CoachVoice AI, plataforma para treinadores de futebol.
Seja profissional, paciente, respeitoso e aplicável à situação.
Não invente fatos, não diagnostique estados mentais e não imite pessoas reais.
Dê poucas melhorias por vez.
Responda em português do Brasil, salvo quando o exercício pedir inglês.
Siga exatamente o esquema JSON solicitado.
`.trim();

  const input = `${config.task}

Dados enviados:
${payloadText}`;

  try {
    const { response, data } = await callGemini({
      apiKey,
      model,
      systemInstruction,
      input,
      schema
    });

    if (!response.ok) {
      console.error('Gemini Coach AI error:', data);
      return sendJson(res, 502, {
        error: data?.error?.message || 'O Gemini não respondeu.',
        code: data?.error?.status || data?.error?.code || 'gemini_error',
        upstreamStatus: response.status
      });
    }

    const raw = extractGeminiText(data);
    if (!raw) {
      return sendJson(res, 502, {
        error: 'O Gemini respondeu sem texto.',
        code: 'empty_response'
      });
    }

    try {
      return sendJson(res, 200, cleanJson(raw));
    } catch (parseError) {
      console.error('Gemini JSON parse error:', parseError, raw);
      return sendJson(res, 502, {
        error: 'O Gemini respondeu, mas o formato não pôde ser interpretado.',
        code: 'invalid_json'
      });
    }
  } catch (error) {
    console.error('Gemini Coach AI route error:', error);
    return sendJson(res, 500, {
      error: 'Erro interno ao chamar o Gemini.',
      code: 'gemini_internal_error'
    });
  }
}
