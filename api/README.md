# CoachVoice AI v4.1 — CoachPrep: Gestão e Liderança

## Nova aba: CoachPrep

O CoachPrep prepara o treinador antes de assumir uma equipe e continua disponível depois como área de desenvolvimento.

### Jornada
- data prevista para iniciar o trabalho;
- contagem regressiva;
- fase de preparação;
- sessão recomendada de aproximadamente 20 minutos;
- check-in profissional antes de liderar;
- pergunta prática;
- resposta por texto, áudio ou vídeo;
- feedback: Você fez bem / Melhore agora / Repita desta forma;
- reflexão pós-sessão.

### Plano de estudos
O período até a data de início é dividido progressivamente em:

1. Liderança pessoal e Código.
2. Gestão do grupo.
3. Conversas e decisões difíceis.
4. Comunicação profissional.
5. Simulação da chegada ao clube.

Cada semana combina reflexão, conversa, simulação, áudio/vídeo e registro.

### 3 Minutos de Conexão
Treino de conversa individual baseado em:

1. Ouvir.
2. Alinhar critério.
3. Definir micro-meta.
4. Fechar com clareza.

Perfis:
- atleta que não vem jogando;
- titular em fase ruim;
- jovem;
- experiente;
- reserva que perdeu espaço;
- retorno de lesão;
- resposta positiva;
- jogador que pode ser decisivo.

### Simulador de Gestão
A IA pode interpretar:
- jogador;
- capitão;
- comissão;
- diretoria.

A conversa pode continuar por vários turnos. O feedback observa clareza, respeito, critério e escuta.

### Meu Código de Liderança
Princípios editáveis, incluindo:
- decisão com critério;
- corrigir comportamento sem rotular a pessoa;
- evitar decisão importante no calor da reação;
- proteger o grupo publicamente;
- ouvir antes de explicar;
- não prometer titularidade;
- distribuir atenção;
- coerência entre discurso, decisão e atitude.

### Decisões difíceis
Cenários:
- retirar titular;
- mudar capitão;
- erro de jovem;
- reação à substituição;
- reclamação pública;
- treino abaixo do padrão;
- conflito;
- pressão de dirigente por escalação;
- jogador fora da convocação.

Estrutura:
Fato → Critério → Quem precisa saber → Comunicação → Revisão.

### Primeira Semana
Sete simulações:
1. primeiro encontro com o elenco;
2. conhecer antes de concluir;
3. primeiro critério de equipe;
4. primeiro jogador insatisfeito;
5. primeira comunicação externa;
6. reunião pré-jogo;
7. primeiro pós-jogo.

### Progresso
Não há nota artificial de “liderança”.
São exibidos:
- sessões realizadas;
- conversas de 3 minutos;
- simulações;
- decisões treinadas;
- reflexões;
- histórico recente.

## Áudio e vídeo
Os exercícios usam a captura de voz já existente no CoachVoice.
Situações podem ser enviadas ao Estúdio do Treinador para treino em vídeo.

## IA
`api/coach-ai.js` possui novos modos:
- coachprep-session
- coachprep-conversation
- coachprep-simulation
- coachprep-decision
- coachprep-code

Sem `OPENAI_API_KEY`, o CoachPrep mantém orientações locais e as funções de registro.

## Publicação

Estrutura da pasta `api` deve ser:

```text
api/
├── coach-ai.js
├── english-coach.js
├── mentor.js
└── transcribe.js
```

Nunca use `api/api/`.

Commit sugerido:

`Adicionar CoachPrep de gestão e liderança v4.1`

Depois do deployment verde:

`https://coachvoice-ai.vercel.app/?v=41`
