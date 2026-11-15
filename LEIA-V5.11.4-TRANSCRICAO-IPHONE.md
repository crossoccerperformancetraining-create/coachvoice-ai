# CoachVoice AI v5.11.4 — transcrição e recuperação de falhas no iPhone

## O que motivou
Na v5.11.3, o Mentor falou no iPhone, mas depois apareceu `The string did not match the expected pattern. Sua gravação foi preservada.` A mensagem vem do `catch` da transcrição em `session-v54.js`. Não é evidência de defeito no áudio que reproduz a voz. Uma causa plausível, não confirmada sem diagnóstico de rede do aparelho, é a tentativa do Safari de interpretar como JSON uma página/resposta de erro do servidor.

## Correções incluídas
- Resposta da rota `/api/transcribe` lida e validada antes do parse; erros HTML, vazios ou inesperados deixam de aparecer como o genérico `The string did not match the expected pattern`.
- Falhas de envio, retorno inválido, HTTP 429/413 e expiração recebem mensagens em português e são marcadas por etapa no diagnóstico existente. Nenhum conteúdo de conversa, áudio, chave ou token é gravado no diagnóstico.
- Cabeçalhos MIME normalizados antes de enviar o Blob do iPhone, com `Accept: application/json` e `cache: no-store`.
- Botão **↻ Reenviar gravação salva** visível na própria sala após falha: reutiliza a gravação mantida em memória, sem nova gravação e sem repetir a pergunta. A opção já existente em “Mais opções” continua disponível.
- Todas as respostas da IA e reprodução de voz da v5.11.3 foram preservadas; não muda seleção de voz ou Gemini TTS. O microfone permanece fechado após enviar a fala.
- Atualizados carimbo de versão, versão de cache do service worker e parâmetros de scripts/estilo para evitar cópia misturada.

## Instalação
1. Exporte seu backup no aplicativo antes de atualizar. Não limpe os dados do Safari; gravações armazenadas no aparelho podem precisar de cópia individual.
2. Para a base v5.11.3, extraia o ZIP PATCH e envie o conteúdo à raiz do repositório GitHub ligado à Vercel, substituindo os arquivos correspondentes. Se não tiver certeza da base, use o ZIP COMPLETO em vez do PATCH. Não envie o ZIP fechado.
3. Após a publicação, feche e reabra o app no iPhone e confira **v5.11.4** no menu. Não é necessário alterar a GEMINI_API_KEY.
4. Teste Mentor: fale, envie e ouça a resposta. Se a transcrição falhar, toque em **Reenviar gravação salva**. Se voltar a falhar, abra Perfil e use **Copiar diagnóstico** para compartilhar somente as etapas/status do erro.

## Limitações
O motivo exato do retorno do servidor no aparelho ainda não foi comprovado; os testes no iPhone e chamadas reais a Gemini precisam ocorrer na publicação. HTML ou erros da infraestrutura são exibidos de maneira útil, mas não podem ser eliminados apenas no navegador. A gravação para reenvio imediato é mantida na sessão; após fechar, só os arquivos de mídia salvos no armazenamento local poderão estar disponíveis. Esta atualização não publica automaticamente no GitHub, na Vercel nem no site separado chatgpt.site.
