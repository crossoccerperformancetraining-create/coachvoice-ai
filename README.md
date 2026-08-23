# CoachVoice AI v4.7 — Conversa Fluida + Memória por Dia

## O que mudou no Mentor

### Conversa livre é o padrão
O Mentor responde primeiro ao que você realmente disse. Ele não é obrigado a terminar cada resposta com uma pergunta. Pergunta apenas quando isso ajuda a conversa.

### O dia começa limpo
Conversas de dias anteriores não entram automaticamente. O histórico anterior só é usado quando você toca em **Usar contexto anterior** ou **Retomar** em um dia salvo.

### Salvar o dia
Um único botão **💾 Salvar o dia**:
- guarda a conversa completa do dia neste aparelho;
- combina, quando existir, o registro do CoachDay do mesmo dia;
- usa Gemini para criar resumo, destaques, decisões, pessoas citadas, pendências e aprendizados.

### Resumo de ontem
O botão **📅 Resumo de ontem** mostra o resumo sem começar automaticamente uma conversa sobre ele.

### Histórico pesquisável
Busca por data, nome, assunto ou palavra. Cada dia pode abrir:
- Resumo
- Conversa completa
- Retomar contexto

### Memória permanente separada
O **Perfil do treinador** guarda princípios que devem atravessar os dias. Ele é separado das conversas diárias.

### Voz mais fluida
A conversa contínua vem ativada por padrão:
**você fala → Mentor responde em voz → o microfone tenta ouvir novamente**.
O botão do microfone continua disponível como fallback no iPhone.

## Armazenamento
Nesta versão, histórico e perfil continuam armazenados localmente no navegador/aparelho. Use **Exportar** para gerar um backup JSON. Login e nuvem ficam para uma etapa posterior.

## Gemini
A integração continua usando:
`GEMINI_API_KEY`

Não é necessário alterar a chave que já está funcionando.

## Publicação
Commit sugerido:
`Adicionar conversa fluida e memória por dia v4.7`

Teste:
`https://coachvoice-ai.vercel.app/?v=47`
