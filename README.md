# CoachVoice AI v4.2 — Mentor IA por Voz

## Principal evolução

O **Mentor IA do Treinador** agora funciona como uma área de conversa contínua sob demanda.

Você pode:
- falar pelo microfone;
- receber resposta em texto e voz;
- continuar a conversa quantas vezes quiser;
- pedir correção da sua resposta;
- refazer;
- ouvir uma alternativa do Mentor;
- salvar resumo, aprendizado e próximo passo.

> No celular, a conversa por voz funciona em turnos: toque no microfone para falar; a resposta pode ser lida automaticamente pelo aparelho.

## Modos do Mentor

### Conversa livre
Conte uma situação sem preencher formulário.

### Modo Mentor
A IA pode orientar e também questionar seu primeiro raciocínio.

### Só perguntas
A IA não oferece solução pronta; faz uma pergunta por vez.

### Simulação
A IA pode interpretar:
- jogador;
- capitão;
- auxiliar/comissão;
- diretoria;
- jornalista.

Níveis:
- guiada;
- realista;
- sob pressão.

### Estou evitando essa conversa
Ajuda a reduzir a conversa ao essencial:
- fato;
- objetivo;
- abertura;
- critério;
- o que não prometer;
- primeiro questionamento.

### Questione minha decisão
Testa:
- critério;
- coerência;
- aplicação do mesmo critério a pessoas diferentes;
- possível ponto cego;
- alternativa.

### Me prepare em 5 minutos
Usado antes de:
- treino;
- reunião;
- vestiário;
- diretoria;
- imprensa.

### Não quero conselho
Organiza:
- fato;
- interpretação;
- decisão;
- pendência.

Sem tentar resolver a situação.

## Filtro da Crítica

O Mentor separa a crítica usando o conceito do **X**:

- X — Posso agir sobre isso.
- X — Existe uma parte útil.
- — Não depende totalmente de mim.
- — É ruído/opinião sem ação específica.
- X/— Exige resposta agora?

Também pode procurar um possível ponto cego.

Princípio:
**Eu não controlo toda crítica. Eu escolho o que merece minha atenção.**

## Crítica da Sexta

O CoachPrep agora conecta a sexta-feira ao Filtro da Crítica para revisar:
- uma crítica recebida;
- uma decisão importante;
- algo evitado durante a semana;
- coerência do critério.

## Memória do Mentor

Ao encerrar uma conversa, são salvos:
- resumo;
- aprendizado;
- próximo passo;
- o que deve ser retomado depois.

Na próxima abertura, o Mentor mostra a pendência anterior.

## Modo Pré-Clube

Quando faltarem até 14 dias para a data configurada no CoachPrep, o Mentor mostra uma simulação diária de chegada ao clube.

## CoachPrep — programa fixo de 12 semanas

Segunda a sexta, aproximadamente 15 a 25 minutos por dia.

### Semanas 1–2
Identidade do treinador e processo coletivo.

### Semanas 3–5
Conversas individuais.

### Semanas 6–8
Conflitos e decisões difíceis.

### Semanas 9–10
Pós-jogo, críticas, imprensa e diretoria.

### Semanas 11–12
Simulação completa da chegada e primeira semana.

Princípio base:
**Todos têm valor; as decisões precisam servir ao coletivo.**

## Novos modos da API

`api/coach-ai.js`:
- mentor-dialogue
- mentor-review-answer
- mentor-filter-criticism
- mentor-close-session

Os modos do CoachDay e CoachPrep anteriores permanecem.

## Publicação no GitHub

Estrutura correta:

```text
api/
├── coach-ai.js
├── english-coach.js
├── mentor.js
└── transcribe.js
```

Nunca `api/api/`.

Arquivos novos/atualizados:
- mentor-v42.js
- mentor-v42.css
- coachprep-v42.js
- index.html
- sw.js
- manifest.webmanifest
- package.json
- vercel.json
- api/coach-ai.js

Commit sugerido:

`Adicionar Mentor IA por voz e Filtro da Crítica v4.2`

Depois do deployment **Production — Ready**:

`https://coachvoice-ai.vercel.app/?v=42`
