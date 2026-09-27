const MAX_TEXT = 14000;

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}


function extractGeminiText(data) {
  const pieces = [];
  for (const candidate of data?.candidates || []) {
    for (const part of candidate?.content?.parts || []) {
      if (typeof part?.text === 'string' && part.text.trim()) {
        pieces.push(part.text.trim());
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

function uniqueModels(primary) {
  return [...new Set([
    primary,
    'gemini-3.1-flash-lite',
    'gemini-3.7-flash'
  ].filter(Boolean))];
}

async function callGenerateContent({ apiKey, model, input, systemInstruction = '', authMode = 'header' }) {
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const url = authMode === 'query'
    ? `${base}?key=${encodeURIComponent(apiKey)}`
    : base;

  const headers = { 'Content-Type': 'application/json' };
  if (authMode === 'header') headers['x-goog-api-key'] = apiKey;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: input }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.35,
        maxOutputTokens: 4096
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function callGemini({ apiKey, model, input, systemInstruction = '' }) {
  const models = uniqueModels(model);
  let last = null;

  // generateContent aceita API key. Tentamos primeiro o header oficial;
  // se houver uma incompatibilidade de autenticação, tentamos ?key=.
  for (const candidateModel of models) {
    for (const authMode of ['header', 'query']) {
      try {
        const result = await callGenerateContent({
          apiKey,
          model: candidateModel,
          input,
          systemInstruction,
          authMode
        });

        if (result.response.ok) {
          return { ...result, modelUsed: candidateModel, authMode };
        }

        last = { ...result, modelUsed: candidateModel, authMode };

        const status = result.response.status;
        const message = String(result.data?.error?.message || '');

        console.error('Gemini Coach AI attempt failed:', {
          status,
          model: candidateModel,
          authMode,
          code: result.data?.error?.status || result.data?.error?.code || '',
          message
        });

        // Quota não melhora trocando autenticação/modelo muitas vezes.
        if (status === 429) return last;

        // Se o modelo não existir/estiver indisponível, passa para o próximo.
        if (status === 404 || /model|not found|not supported/i.test(message)) break;
      } catch (error) {
        last = {
          response: { ok: false, status: 502 },
          data: { error: { message: error?.message || 'Falha de rede ao chamar Gemini.', status: 'NETWORK_ERROR' } },
          modelUsed: candidateModel,
          authMode
        };
        console.error('Gemini Coach AI network attempt failed:', {
          model: candidateModel,
          authMode,
          message: error?.message || String(error)
        });
      }
    }
  }

  return last || {
    response: { ok: false, status: 502 },
    data: { error: { message: 'O Gemini não respondeu.', status: 'GEMINI_ERROR' } },
    modelUsed: model
  };
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
    task: 'Atue como assessor e jornalista esportivo. Ajude o treinador a responder diretamente, proteger o grupo e mostrar um próximo passo. Use o campo pressure para adaptar a pergunta seguinte: friendly = colaborativo; normal = neutro/profissional; insistent = cobra objetividade; provocative = confronta a resposta sem insultar; hostile = duro e desconfortável, mas ainda profissional e sem humilhação. A próxima pergunta deve continuar o tema real da resposta do treinador, não repetir um roteiro fixo.'
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
    task: 'Converse como um Mentor IA humano, natural e experiente, com ritmo de conversa real e sem parecer formulário, prova, interrogatório ou central de atendimento. REGRA PRINCIPAL: responda diretamente ao que o treinador realmente disse antes de pensar em uma pergunta. Se ele fez uma pergunta objetiva, responda objetivamente. Não comece toda resposta com “entendi”, não repita a fala dele com outras palavras e não elogie por hábito. Evite bordões automáticos como “faz sentido?”, “qual é o objetivo central?”, “como você se sente?” e “quer que eu...?”. Em free, daylife, unload e mentor, nextQuestion deve ficar VAZIO na maioria das respostas. Só faça UMA pergunta quando a resposta realmente depender de uma informação ausente ou quando o próprio fluxo da conversa pedir continuação. Não faça perguntas em duas respostas consecutivas sem necessidade; use history para perceber isso. Compare a intenção da pergunta com as últimas mensagens e nunca repita uma pergunta já feita. Nunca coloque a mesma pergunta em spoken e nextQuestion. spoken deve soar natural em voz alta: português brasileiro claro, frases de tamanhos variados, poucas listas e sem sermão. Às vezes 2 ou 3 frases bastam; quando o assunto exigir, aprofunde sem transformar a resposta em palestra. coachProfile contém preferências de tom e tamanho e deve ser respeitado silenciosamente. Se já houver informação suficiente, dê conclusão, orientação ou companhia e pare. Se o treinador disser que quer apenas conversar ou desabafar, acompanhe sem converter tudo em plano, tarefa ou futebol. daylife: trate rotina, agenda, horários, estudo, viagem, cansaço e vida cotidiana naturalmente. questions é o ÚNICO modo em que perguntas são o centro: uma pergunta útil por vez. simulation: interprete o papel indicado e reaja ao conteúdo real. avoid, challenge, decide, proscons, hardtalk, unhappy, captainmode, five, pretraining, pregame, boardmeeting e pressprep: ajude de forma prática, com no máximo uma pergunta quando indispensável. organize: organize sem aconselhar. reflectday e improve: reflexão curta e concreta, sem julgamento geral. closeday: feche sem abrir novas perguntas. Use todayEarlierContext discretamente quando ajudar. NUNCA traga dias anteriores espontaneamente; só use previousDayContext quando o treinador escolheu retomar. Não bajule, não rotule pessoas, não diagnostique emoções, não invente fatos e não prometa resultados. A conversa deve parecer um bom colega experiente: atento, direto quando necessário, acolhedor sem frases feitas e confortável com silêncio/conclusão.'
  },
  'mentor-conclusion': {
    schema: '{"spoken":"...","summary":"...","decision":"...","pending":"...","nextStep":"..."}',
    task: 'Feche ou conclua a conversa do treinador de forma humana, curta e útil. NÃO faça perguntas e NÃO termine com “faz sentido?”, “quer que eu...?” ou convite genérico para continuar. Use history e transcript para chegar a uma conclusão com o que já foi dito, sem reabrir investigação. purpose=conclude: entregue uma conclusão prática, mas a conversa pode continuar depois. purpose=end: escreva uma frase natural de encerramento e organize silenciosamente o essencial. spoken deve ter de 2 a 6 frases e soar bem em voz alta. summary é um resumo factual curto. decision só deve existir se uma decisão foi realmente tomada; caso contrário, vazio. pending só deve existir se algo ficou claramente em aberto; caso contrário, vazio. nextStep só deve existir se houver um próximo passo concreto mencionado ou logicamente necessário; não invente tarefa. Não repita a última pergunta, não diagnostique emoções e não transforme o fechamento em sermão.'
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
  'today-brief': {
    schema: '{"brief":"..."}',
    task: 'Crie um briefing de manhã extremamente curto e humano para o treinador usando SOMENTE tarefas, compromissos e janela de trabalho enviados. brief deve ter de 2 a 4 frases. Identifique no máximo três prioridades reais, respeite horários fixos e evite encher todos os espaços livres. Não invente compromissos, não faça julgamento emocional e não termine com pergunta. Se o dia estiver sobrecarregado, sugira adiar uma prioridade menor de forma neutra. Se estiver leve, preserve margem para imprevistos.'
  },
  'dashboard-day-summary': {
    schema: '{"summary":"...","doneHighlights":["..."],"pending":["..."],"tomorrowPriority":"..."}',
    task: 'Faça o fechamento do dia do treinador sem interrogatório. Use somente tarefas, notas e eventual resumo do Mentor enviados. summary deve ter no máximo 4 frases, factual e humano. doneHighlights: até 5 coisas realmente concluídas ou relevantes. pending: somente o que ficou aberto. tomorrowPriority: escolha no máximo UMA prioridade concreta para amanhã; se nada estiver pendente, deixe vazio. Não invente eventos e não faça julgamento emocional.'
  },
  'dashboard-weekly-review': {
    schema: '{"summary":"...","wins":["..."],"patterns":["..."],"pending":["..."],"nextWeekFocus":"...","languageFocus":"..."}',
    task: 'Faça uma revisão profissional dos últimos 7 dias do treinador usando SOMENTE os dados enviados de tarefas, fechamentos do dia, registros do Mentor e prática de idiomas. Não invente acontecimentos nem emoções. summary: no máximo 5 frases, claro e humano. wins: até 5 avanços concretos realmente registrados. patterns: até 3 padrões OBSERVÁVEIS nos dados (por exemplo tarefas frequentemente adiadas ou foco recorrente), sem diagnóstico psicológico. pending: até 5 assuntos ainda abertos. nextWeekFocus: escolha no máximo UMA prioridade concreta para a próxima semana; se não houver base suficiente, deixe vazio. languageFocus: uma recomendação curta baseada somente nas contagens disponíveis de inglês/espanhol; se não houver dados, vazio. Não faça sermão e não transforme a revisão em lista de perguntas.'
  },
  'spanish-beginner': {
    schema: '{"feedback":"...","natural":"...","focus":"..."}',
    task: 'Atue como professor de espanhol para treinador brasileiro iniciante. Compare target e spoken. feedback em português, curto e encorajador sem elogio automático. natural deve trazer a frase espanhola correta e natural. focus deve indicar no máximo um ponto de pronúncia ou palavra para repetir. Não exija perfeição de sotaque.'
  },
  'spanish-intermediate': {
    schema: '{"feedback":"...","natural":"...","focus":"..."}',
    task: 'Atue como coach de espanhol profissional para futebol. Analise a resposta em espanhol no cenário enviado. feedback em português: clareza, gramática e naturalidade, no máximo 3 pontos. natural: uma alternativa espanhola curta que um treinador realmente usaria. focus: uma prioridade para a próxima tentativa.'
  },
  'spanish-advanced': {
    schema: '{"feedback":"...","natural":"...","risk":"..."}',
    task: 'Atue como coach de espanhol de alto nível para treinador de futebol. Avalie se a resposta é profissional, clara e natural para vestiário, diretoria ou imprensa. feedback em português, objetivo. natural: alternativa em espanhol sem soar traduzida literalmente. risk: indique apenas se houver uma expressão que possa soar ambígua, agressiva ou pouco natural; caso contrário, vazio.'
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
      routeVersion: '5.2-generate-content',
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

  const expectedShape = cleanJson(config.schema);

  const systemInstruction = `
Você faz parte do CoachVoice AI, plataforma para treinadores de futebol.
Seja profissional, paciente, respeitoso e aplicável à situação.
Não invente fatos, não diagnostique estados mentais e não imite pessoas reais.
Dê poucas melhorias por vez.
Responda em português do Brasil, salvo quando o exercício pedir inglês ou espanhol.
Siga exatamente o esquema JSON solicitado.
`.trim();

  const input = `${config.task}

FORMATO OBRIGATÓRIO:
Retorne SOMENTE um objeto JSON válido.
Use exatamente estas chaves/estrutura como referência:
${JSON.stringify(expectedShape)}

Dados enviados:
${payloadText}`;

  try {
    const { response, data, modelUsed } = await callGemini({
      apiKey,
      model,
      systemInstruction,
      input
    });

    if (!response.ok) {
      console.error('Gemini Coach AI error:', data);
      const upstreamStatus = response.status || 502;
      return sendJson(res, upstreamStatus === 429 ? 429 : 502, {
        error: data?.error?.message || 'O Gemini não respondeu.',
        code: data?.error?.status || data?.error?.code || 'gemini_error',
        upstreamStatus,
        modelUsed
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
