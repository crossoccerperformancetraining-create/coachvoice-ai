# CoachVoice AI 5.11.5 — resposta completa em etapas

Base: pacote completo 5.11.4, sem substituir o motor de voz do iPhone ou as APIs de transcrição.

## Mudanças
- Reflexões/devocionais, insights e Study Coach apresentam o conteúdo recebido em etapas progressivas (até três). Continuar leitura e Ver resposta completa NÃO chamam a IA novamente.
- Ouvir esta parte utiliza o mecanismo de voz estável existente para dividir a locução em trechos curtos. A resposta original não é cortada.
- Em caso de limite 429, o aplicativo mostra mensagem honesta: não é possível gerar uma resposta nova até a cota permitir. Dividir apresentação não burla limites do provedor.
- Se a reflexão usar um exemplo local enquanto a IA falha, ele é rotulado como exemplo local e não é salvo como geração da IA.
- Detecta fim de geração MAX_TOKENS para não mostrar um JSON truncado como resposta completa.
- Aumenta moderadamente o orçamento de saída para modos de estudo/reflexão; isso pode consumir mais tokens e não aumenta cotas.

## Instalação
1. Faça backup das informações locais no aplicativo no iPhone.
2. Extraia ZIP completo e envie o conteúdo para a raiz do repositório, incluindo `api`. Não envie o ZIP sem extrair.
3. Ou aplique o patch sobre a versão 5.11.4, copiando somente arquivos modificados.
4. Publique pela Vercel e reabra o site no iPhone. Não limpe dados do Safari.
5. Em Reflexão e Study Coach, confira Etapa 1/2/3, Continuar leitura, Ver resposta completa e Ouvir esta parte.

## Limites
Os testes automatizados e a sintaxe JS NÃO substituem teste real do Safari no iPhone, do serviço Gemini ou da conta e cotas existentes.
A divisão é da apresentação de uma resposta recebida em uma solicitação; não é streaming real de tokens do provedor.
Os textos privados da biblioteca continuam fora do pacote público.
