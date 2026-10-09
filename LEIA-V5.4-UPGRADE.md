# CoachVoice AI 5.4 — Sessões e projeto da temporada

## Começar
1. Atualize o site e abra a engrenagem Meu CoachVoice.
2. Confira seu nome e a preferência de voz.
3. Em Projeto da temporada, cadastre a equipe, competição, divisão, grupo, datas, objetivo, modelo de jogo, elenco, comissão e estrutura. Informe fontes e data da conferência. Nenhum calendário foi preenchido automaticamente.
4. Clique em Salvar projeto e ativar. Você pode manter vários projetos separados e voltar à prática geral.
5. Em qualquer área, use Abrir sessão. Escolha a situação, nível, idioma e objetivo. Ative Usar projeto da equipe quando fizer sentido.
6. Use Iniciar sessão, Pausar, Continuar e Finalizar. As respostas são automaticamente reproduzidas quando a opção de áudio está marcada. Repetir resposta e Ouvir exemplo ficam disponíveis.
7. No modo contínuo, uma pausa de aproximadamente 2 segundos após fala detectada envia o trecho. Em campo barulhento, escolha Manual e toque em Enviar fala. Texto funciona sem permissão de microfone.
8. Finalize para salvar resumo, falas e gravações. Selecione e corrija os pontos que deseja guardar na memória e as tarefas que deseja adicionar à agenda. Nada é confirmado automaticamente.

## Melhorias por área
- Inglês e espanhol: situação do futebol, nível, feedback textual em português, exemplo no idioma da prática e repetição. O inglês iniciante também abre a sessão com a frase da aula.
- Oratória: estrutura, pausa sugerida, fechamento e métricas estimadas da transcrição. Comparação entre tentativas.
- Estúdio: gravação com guia de enquadramento, pausa, revisão, download e análise opcional de até quatro quadros JPEG. Observações visuais são separadas da fala; não se infere emoção nem movimento a partir de imagens estáticas.
- Mentor e Dia a Dia: conversa contínua, histórico e memória da equipe confirmada.
- Agenda e CoachDay: sessões recebem os compromissos e tarefas reais de hoje. Tarefas sugeridas só são adicionadas após seleção.
- CoachPrep: preparação e ensaio por fase da equipe, público e objetivo.
- Entrevistas: pergunta seguinte ligada à resposta e seleção de pressão.
- Liderança: simulações com jogador, capitão, comissão e diretoria.
- Modelo e biblioteca: princípios do projeto e exemplos próprios pesquisáveis, com botão para praticar novamente.
- Formação e evolução: sessões por período/área, gráfico de frequência, tempo de prática, falas, gravações e comparação de duas tentativas. Não são atribuídas notas de competência.

## iPhone
O aplicativo tenta manter a tela ativa quando o navegador suporta essa função. Se a tela bloquear ou o aplicativo ficar em segundo plano, a sessão pausa e preserva as falas já enviadas. Um trecho ainda não finalizado depende do comportamento do navegador; ele não deve ser considerado salvo até concluir a gravação. Ao voltar, toque em Continuar. Navegadores podem exigir um primeiro toque no reprodutor para liberar áudio; depois, a sessão continua automaticamente.

Microfone, câmera, detecção de silêncio e reprodução devem ser conferidos no aparelho físico. Em ambiente silencioso, teste um trecho curto antes de usar a conversa contínua no campo.

## Histórico e dados
Projetos, resumos e exemplos ficam neste navegador. Gravações usam IndexedDB e podem ser baixadas pelo registro da sessão. O backup JSON existente inclui os novos dados textuais, mas não os arquivos de áudio/vídeo: baixe suas gravações separadamente. Não limpe os dados do navegador sem exportar o que deseja guardar.
A sincronização automática entre aparelhos ainda exige um serviço de conta e banco de dados. Não foi criada uma conta, contratado um plano nem ativado banco remoto neste upgrade.
Texto, áudio e, quando solicitado, quadros do vídeo são enviados à integração Gemini já configurada. Fotos de perfil e escudos não são enviados nas sessões.

## Atualizar GitHub
Este é o pacote completo. Extraia os arquivos e envie seu conteúdo à raiz do repositório coachvoice-ai, incluindo a pasta api e os novos session-v54.js / session-v54.css. Não envie somente o ZIP. A publicação direta na Vercel não altera o repositório GitHub.
As variáveis GEMINI_API_KEY e os modelos opcionais continuam configurados na Vercel; não coloque chaves no código.

## Verificação automatizada
Execute npm test. O teste verifica início simultâneo, pausa/continuação do microfone, gravação → transcrição → IA → resumo, preservação de mídia e repetição após falhas, isolamento dos projetos e ausência de gravação automática de memórias/tarefas. Permissões, microfone e câmera são simulados nesse teste.

## Limite do serviço de voz
Os áudios gerados recentemente são reutilizados nesta sessão do navegador. Se a API de voz atingir um limite de solicitações (429), o aplicativo tenta a síntese de voz do aparelho. Se nenhuma voz estiver disponível, a resposta fica preservada em texto e pode ser repetida depois. Os limites do provedor dependem da conta e não são removidos pelo upgrade.
