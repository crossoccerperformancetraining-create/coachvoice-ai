# CoachVoice AI 5.5 — Central do Treinador

Esta versão reúne o upgrade de sessões 5.4 e a reorganização 5.5. Use este pacote completo para atualizar o GitHub.

## Atualização

1. Faça o backup do aplicativo na configuração, no mesmo aparelho onde estão seus registros.
2. Extraia o ZIP. Envie os arquivos extraídos diretamente para a raiz do repositório, sem criar uma pasta externa.
3. Inclua a pasta `api` e mantenha as variáveis privadas já configuradas na Vercel. Não coloque chaves no GitHub nem no HTML.
4. Aguarde a publicação ligada ao GitHub. A publicação feita pelo assistente não altera o conteúdo do repositório.
5. Abra https://coachvoice-ai.vercel.app/ e recarregue. A entrada mostra “Central do Treinador” e o menu informa v5.5. Não limpe os dados do Safari: os registros ainda são locais.

## Dez melhorias

1. Central do Treinador com equipe ativa, próximo compromisso, prioridade e continuidade.
2. Indicadores de sessões, minutos em sessão, pendências e áreas, em 7/30/90 dias; gráfico semanal com consulta por dia.
3. Navegação principal: Central, Equipe, Praticar, Conversas e Evolução.
4. Espaço próprio de conversa individual com histórico, compositor e controles acessíveis.
5. Troca de projeto na própria área de trabalho, sem depender da engrenagem.
6. Equipe e temporada: competição, divisão, grupo, datas, modelo, elenco, comissão, estrutura e memória confirmada.
7. Inglês e espanhol com situação, nível e objetivo antes de abrir a prática; acesso às aulas e trilhas anteriores.
8. Estúdio com roteiro/objetivo, situação, gravação e revisões; oratória, entrevistas e liderança com telas próprias.
9. Histórico com revisão e repetição das tentativas, biblioteca de exemplos e comparação de sessões.
10. Cartões compactos, navegação móvel e conversa com opções recolhidas. Os recursos anteriores ficam em seções expansíveis.

## Começar

- Em Equipe, abra “Editar projeto, calendário e memória” e salve o projeto da temporada. Campos sem informação permanecem “A preencher”. Os dados são informados e conferidos por você.
- Toque em “Trocar” na faixa da equipe para ativar outro projeto ou prática geral. A sugestão de continuidade usa o projeto atual; o histórico mantém a identificação da equipe de cada registro.
- Em Conversas, escolha Mentor individual ou escreva o assunto diretamente. Em Praticar, escolha idioma, oratória ou vídeo.
- Confira o objetivo e toque em Abrir conversa/Iniciar prática. A sessão mostra o objetivo compacto. Abra “Ajustar situação, idioma e contexto” para mudar idioma, captura, voz automática e equipe antes de iniciar.
- Iniciar sessão abre a atividade. Pausar interrompe voz e captura; Continuar retoma; Finalizar salva e gera revisão. Repetir resposta reproduz a última resposta.
- Ao encerrar, confirme apenas as memórias e tarefas que deseja guardar. Nada é confirmado automaticamente.

## Áudio, câmera e limites

A voz automática continua disponível. Em testes anteriores o provedor retornou limite temporário de solicitações (429); os áudios são reutilizados quando possível e o aplicativo tenta a voz do aparelho como alternativa. Um limite do provedor não é removido pela reorganização visual. Se a reprodução for bloqueada pelo navegador, use o controle de áudio exibido.

Conversa contínua envia a fala após uma pausa de cerca de dois segundos. Para campo barulhento, use o modo manual. Vídeo usa câmera e áudio; a análise visual opcional envia até quatro quadros e não interpreta movimento contínuo, emoção ou tom de voz. A transcrição não mede pronúncia. Microfone, câmera, alto-falante e comportamento com bloqueio de tela precisam ser conferidos fisicamente no seu iPhone.

As sessões e os projetos continuam neste aparelho, sem sincronização entre dispositivos. O backup de texto não inclui os arquivos de áudio/vídeo armazenados no banco local: baixe as gravações que deseja preservar antes de limpar os dados. A recuperação salva falas concluídas; um trecho ainda em gravação pode ser perdido quando o sistema encerra o navegador.

## Verificação

Os testes de sessões, contratos de API, áudio e limites do provedor passaram. Foi verificada no aplicativo publicado uma conversa com nome e equipe, pausa, retomada, resumo e acesso ao histórico. Inglês, seleção de nível, central da equipe e estúdio foram conferidos na interface. Os números do dashboard vêm dos registros locais; tempo em sessão não significa tempo exato de fala.
