# CoachVoice AI v5.11.1 — Notícias no menu e correção de reprodução no iPhone

## O que mudou

1. A barra inferior passa a ter **Central · Equipe · Praticar · Conversas · Notícias · Evolução**. Tocar em Notícias abre diretamente a aba de manchetes da Central de Competições, que contém também o botão para o Radar de Mercado. O menu se ajusta aos celulares menores.
2. A sala de conversas exibe **🔊 Ouvir resposta** quando o Safari impede a reprodução automática. A fala permanece preservada para reprodução manual; o microfone não reabre sozinho.
3. Se a geração de voz no servidor e a síntese preferida falharem, há um botão **Ouvir com a voz do iPhone (pode ser diferente)**. Esta opção é explícita para não substituir automaticamente a voz masculina Orus por uma voz diferente.
4. Respostas longas são divididas em trechos menores para minimizar cortes e falhas por tamanho.
5. O backend Gemini TTS 3.1 passa a utilizar o formato de requisição REST documentado e aceita áudio PCM de retorno, encapsulando-o em WAV quando necessário. A voz masculina selecionada continua sendo Orus, feminina Kore; sem alteração em GEMINI_API_KEY.
6. A voz do Mentor antigo também pode apresentar um botão destacado para tocar quando o navegador bloquear o autoplay. A recuperação só é mostrada quando necessária.
7. O service worker ganhou novo identificador de cache, permitindo substituir os arquivos antigos no modo instalado/offline.

## Instalação

- Antes de atualizar, **exporte o backup pelo Perfil no próprio iPhone**; não limpe o armazenamento do Safari.
- Se o GitHub já estiver no **v5.11**, extraia o ZIP PATCH e envie seu conteúdo para a **raiz do mesmo repositório**, substituindo os arquivos homônimos. A pasta `api/` deve manter essa estrutura.
- Se estiver numa versão anterior ou não tiver certeza, use o ZIP **COMPLETO** v5.11.1. O pacote completo preserva os módulos da base v5.10 (Study Coach e biblioteca privada por importação), sem colocar livros privados no GitHub.
- Faça commit na branch publicada na Vercel. Não envie GEMINI_API_KEY ao GitHub: a chave permanece apenas nas variáveis de ambiente do projeto.
- Feche o aplicativo na Tela Inicial e reabra. Se a atualização não aparecer, abra o site pela aba Safari, recarregue e retorne ao aplicativo instalado. Evite limpar os dados locais.

## Teste no iPhone

1. Confira o sexto botão **Notícias** e toque: devem abrir as notícias da competição, com acesso ao **Mercado da Bola**.
2. Vá a Perfil, selecione Masculina e teste a voz. Se não funcionar, verifique a rede e o status do servidor Gemini.
3. Abra **Conversas → Mentor**, inicie, fale, finalize/envie. A resposta deve ficar salva em texto. Se o Safari não tocar, toque em **🔊 Ouvir resposta** (sem reabrir o microfone).
4. Repita nas áreas **Coach, Dia a Dia, Inglês e Espanhol**, e verifique no iPhone se os botões funcionam.
5. Quando ocorrer falha de TTS ou não houver voz masculina nativa, experimente **Ouvir com a voz do iPhone**, sabendo que o timbre pode ser diferente da voz masculina selecionada.

## Limites da validação

- Os testes estáticos e simulados passaram, incluindo resposta em áudio bloqueada, ação de retomada pelo usuário, contrato Gemini e filtro do menu.
- **Não** foi realizado um teste real em Safari/iPhone, nem chamadas com a GEMINI_API_KEY da conta. A voz no aparelho precisa ser confirmada após publicar.
- A verificação visual por Chromium headless não terminou neste ambiente; não afirmar que o layout foi validado visualmente.
- Esta publicação NÃO modifica o site privado hospedado em `chatgpt.site`. Para esse site separado, é necessário aplicar as mudanças ao código do projeto correspondente.

## Referência Gemini TTS
- https://ai.google.dev/gemini-api/docs/speech-generation
