# CoachVoice AI v5.11.6 — Conversa com o Coach em etapas

## O que foi corrigido
- O sistema de 2 ou 3 etapas foi integrado à **conversa ao vivo com o Coach (Mentor e Dia a Dia)**. As etapas só aparecem quando a resposta recebida é longa.
- O texto completo é gerado em **uma** chamada e salvo no histórico; as partes são apresentadas e narradas na sequência. É possível usar **Próxima parte** ou **Ver resposta completa**, sem fazer nova consulta à IA.
- A conversa continua em modo manual: usuário fala, envia, recebe uma resposta e o microfone permanece fechado.
- Quando a API devolve **429 / RESOURCE_EXHAUSTED (limite da conta)**, a conversa não é encerrada. A mensagem enviada permanece no histórico, o botão de tentar novamente fica visível, e o aplicativo evita repetir a requisição nos primeiros 45 segundos. O momento em que a cota volta depende da conta e do provedor; não há bypass ou garantia de resposta até o limite ser renovado.
- Quando o provedor devolve **output_truncated**, aparece **Tentar resposta mais curta**; o novo pedido é explícito e busca uma resposta coerente de até 90 palavras. Não inventa o trecho que faltou.
- Voz estável do iPhone, voz Gemini opcional, menu Notícias, Mercado da Bola, Study Coach, Reflexões e biblioteca continuam preservados.

## Instalar
1. Faça backup dos dados do CoachVoice no iPhone antes da atualização. Não limpe o armazenamento local.
2. Para uma instalação nova/atualização não linear, extraia o pacote **COMPLETO** e envie todo o conteúdo para a raiz do repositório GitHub ligado à Vercel (inclua a pasta `api`).
3. Se a versão publicada for exatamente a **v5.11.5**, pode usar o **PATCH**: extraia os arquivos e substitua na raiz, preservando a estrutura de pastas.
4. Mantenha `GEMINI_API_KEY` exclusivamente na configuração da Vercel. Não envie a chave para o GitHub.
5. Após o deploy, feche e abra o app no Safari. Confira o texto **v5.11.6** no menu. Caso uma versão anterior fique armazenada no app instalado, atualize a página online; não apague dados sem exportar backup.

## Testar no iPhone
1. Abra Conversas → Mentor, fale e finalize o envio.
2. Em resposta longa, confira **Resposta do Coach · parte 1 de 2/3** e ouça as partes em sequência; toque em **Ver resposta completa** e depois em **Falar** para continuar.
3. Se o serviço informar limite, a sessão **não encerra**. Confira a fala preservada e use o botão **Tentar quando a cota voltar** mais tarde. O texto só será gerado quando a API voltar a responder.
4. Teste também as Reflexões e Study Coach para verificar que o comportamento anterior foi preservado.

## Validação e limites
Verificação de sintaxe JavaScript, integridade ZIP, IDs HTML estáticos e testes automatizados locais aprovados. A verificação visual automatizada via navegador foi bloqueada no ambiente de teste, e chamadas reais à API/voz no iPhone não foram realizadas nesta entrega. O novo fluxo não remove limites financeiros, temporais ou de tokens do serviço Gemini.

O pacote não atualiza automaticamente o site separado `chatgpt.site`.
