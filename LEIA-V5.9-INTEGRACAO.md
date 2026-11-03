# CoachVoice AI 5.9 — Study Coach + Central de Competições

## Resultado
Esta é uma versão completa que integra o Study Coach Intelligence recebido (identificado como 5.6) à base 5.8 da Central de Competições. Preserva a sala de conversa com o botão Falar da 5.7. Os números diferentes dos pacotes anteriores não indicavam que um já continha os recursos do outro.

## Publicar no GitHub
1. Exporte o backup atual no perfil do aplicativo.
2. Extraia o ZIP 5.9. Envie todos os arquivos para a raiz de coachvoice-ai, substituindo os anteriores, incluindo api e data.
3. Confirme o commit na main e aguarde a publicação da Vercel.
4. Feche e abra novamente o aplicativo. O menu passa a identificar 5.9.
5. Abra Evolução e toque em Abrir Study Coach.

Use este pacote completo. Não aplique depois o antigo patch api/coach-ai.js da 5.6 sobre a 5.9: ele não contém os modos de sessão e o contexto das competições desta integração. Não é necessário alterar GEMINI_API_KEY.

## Study Coach
Fluxo: Situação → Estudo → Decisão → Simulação → Reflexão.

- Estudar por situação com modos Só biblioteca, IA geral e Comparar.
- Mesa de Referências com fontes conferidas quando disponíveis. Sem trechos, ela indica lentes/perguntas pelo catálogo; não afirma conhecer a posição de um autor.
- Casos para resolver por texto ou gravação, com avaliação qualitativa.
- Simulação abre a sala de conversa atual. O cenário é enviado ao Mentor sem imitar autores e sem importar memórias de outra equipe.
- Caderno com reflexão por voz e confirmação pessoal de sugestões da IA.
- Registrar decisão pede que você escreva o caminho escolhido e a aplicação. A proposta automática não é registrada como decisão sua.
- Aplicado e Dominado são marcados por você; o app não atribui domínio automaticamente. O domínio fica disponível após aplicação e revisão registradas.
- Revisões previstas para aproximadamente 2, 7, 21 e 60 dias após o registro, com adaptação quando uma revisão estiver atrasada. As pendências aparecem ao abrir a área Revisar; não são notificações com o aplicativo fechado.
- Meu Modelo de Trabalho tem dez áreas. A organização por IA usa apenas notas pessoais confirmadas, respostas de casos e texto já salvo. Sugestões de estudo antigas sem confirmação não entram automaticamente como sua filosofia.
- A IA devolve rascunhos do modelo para sua revisão. Somente Salvar confirma o conteúdo. É possível exportar as seções confirmadas em Markdown.
- Revisão em áudio usa o serviço de voz atual, com reprodutor visível e roteiro disponível. Textos são divididos em partes para evitar corte na primeira resposta. A duração depende do roteiro e da velocidade. Fechar o Study Coach interrompe essa reprodução.

## Fontes e biblioteca
O catálogo recebido tem 19 referências: 16 com links cadastrados e 3 pendentes. São metadados do pacote fornecido; os PDFs não estão embutidos e o acesso atual a cada link não foi revalidado nesta entrega.

O site ainda NÃO recebe acesso automático aos PDFs do Google Drive. Não foi criada autenticação de Drive nem incluída credencial de Drive no código.

O modo Só biblioteca usa trechos/notas que você conferiu e adicionou à Biblioteca. Saber título, autor e temas não equivale a ter lido o livro. Se uma consulta aos trechos falhar, o app mostra o erro e não troca silenciosamente para IA geral. Sem trechos relevantes, indica leituras pelo catálogo. A seleção envia até cinco trechos curtos, limitados por chamada; não é uma busca integral nos PDFs.

Comparar envia as fontes conferidas selecionadas e orienta a IA a distinguir a síntese delas do conhecimento geral. Divergências entre autores exigem evidência nos trechos. O aplicativo não valida independentemente se uma nota colada é fiel ao livro; a conferência é sua.

## Preservado
- Central de Competições: notícias, seleção de estado/temporada, clubes, pesquisa de técnicos/elencos/jogos, estudo e contexto do Mentor.
- Sala de voz, iniciar/falar/enviar, pausa, interrupção e finalização.
- Devocional, insight e memória de aprendizado do pacote recebido, dentro de Evolução. Não há geração automática desses textos a cada abertura do app.
- Chaves locais antigas do Study Coach, caderno, fontes, modelo, projetos e sessões. Nenhum dado local é apagado pela atualização.
- Backup geral do perfil: inclui as novas e antigas chaves coachvoice.

## Testes realizados
- Sete grupos de testes automatizados passaram: sessão, APIs, voz, controles de conversa, competições e integração Study Coach.
- Teste de DOM com dados simulados: catálogo com 19 entradas, dez áreas do modelo, confirmação de reflexão, rascunho sem salvamento automático, decisão explícita, aplicação, revisão, simulação na sala atual, erro de fonte sem fallback geral, ditado e áudio em partes.
- Verificados: sintaxe de todos os JavaScripts, IDs sem duplicação, arquivos referenciados e recursos offline.

Limites da verificação: as respostas reais de IA e a aparência/voz no iPhone ainda precisam ser conferidas após publicação. Não foi feito deploy nesta entrega. Os testes de DOM não substituem a conferência visual em aparelho real.

## Teste rápido após publicar
1. Em Evolução, abra Study Coach e descreva um jogador insatisfeito.
2. Em Comparar, gere o estudo. Toque em Isso é meu, revise e confirme uma reflexão.
3. Em Meu Modelo, organize Liderança com suas notas e confira que nada é salvo antes de Salvar.
4. Registre uma decisão e abra Simular no Mentor. Confira os controles atuais de áudio.
5. Na Biblioteca, adicione um trecho conferido e teste Só biblioteca.
6. Confira a Central de Competições e os dados locais anteriores.

Dados continuam no aparelho; não foi adicionada sincronização em nuvem. Os recursos de IA e voz dependem da disponibilidade e cota do serviço já configurado.
