# CoachVoice AI v5.11.7 — Resposta ágil do Coach

## Motivo
Após a v5.11.6, houve relato de demora entre terminar a fala, receber a resposta e iniciar a voz no iPhone. A conversa utiliza duas operações em sequência (transcrever a gravação e gerar a resposta no Gemini), e só inicia a voz quando a resposta de texto chega. As 2–3 etapas são **apresentação** de uma resposta já gerada, não 2–3 chamadas independentes.

## Melhorias realizadas
- Para Mentor IA e Dia a Dia, o Gemini recebe orientação para **começar pela resposta**, evitando introduções longas. Questões simples costumam caber em 60–110 palavras; assuntos complexos podem ir até o limite atual do modo, **sem eliminar a explicação necessária**.
- A API deixa de repetir a mesma solicitação em até seis combinações de modelos e autenticação quando ocorre 400, 403, 429, 5xx ou falha de rede. Essas repetições em erros não recuperáveis só aumentavam o tempo de espera. Falha 404 pode passar ao modelo seguinte, e erro 401 pode testar a alternativa de autenticação apenas uma vez.
- O diagnóstico local do Perfil agora registra **tempo-transcricao**, **tempo-coach-ia** e **tempo-inicio-voz** quando esses eventos ocorrem. Não grava texto da conversa, áudio ou credenciais no diagnóstico.
- Modo Estável de voz do iPhone, Gemini opcional, narrativa em 2–3 etapas, gravação manual, microfone fechado após a resposta, notícias, Mercado, estudo e Reflexões permanecem.

## Como atualizar
1. Exporte o backup no app antes de atualizar, especialmente no iPhone.
2. Se a versão publicada for exatamente a v5.11.6, extraia e envie os arquivos do **PATCH** para a raiz do repositório, mantendo a estrutura de `api` e `tests`.
3. Caso contrário, utilize o **COMPLETO** e substitua o conteúdo do repositório ligado à Vercel.
4. Mantenha GEMINI_API_KEY somente nas variáveis privadas da Vercel. Não envie esse segredo ao GitHub.
5. No Safari, confirme **v5.11.7** no menu. Não limpe os dados locais antes de exportar.

## Teste recomendado
- Abra Conversas → Mentor → fale uma frase curta → envie → ouça a resposta. Depois faça uma pergunta mais longa.
- Em Perfil → Diagnóstico de áudio → Copiar diagnóstico, compare os tempos registrados de transcrição, IA e primeira voz.
- Se a resposta continuar lenta, os tempos ajudam a localizar o gargalo: gravação/rede/transcrição, modelo Gemini ou início da reprodução.

## Limites e validação
A nova versão **não garante resposta instantânea**: rede móvel, tamanho da gravação, serviço Gemini e restrições do Safari ainda afetam o tempo. O app não faz novas consultas para cada etapa e não contorna o erro 429/limites da conta. Os testes automatizados usam simulações, e nenhuma medição real de latência foi realizada no seu iPhone. Arquivos de texto privados da biblioteca de livros continuam fora do ZIP público.
