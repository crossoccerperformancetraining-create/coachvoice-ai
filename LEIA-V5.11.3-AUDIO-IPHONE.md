# CoachVoice AI v5.11.3 — Recuperação de áudio do iPhone

## Objetivo

Esta versão mantém a base **v5.11.2**, o iPad e os módulos anteriores (Notícias, Mercado, Mentor, Reflexões, Competição, Study Coach e biblioteca privada), e reforça a recuperação de áudio **especificamente no iPhone**. Não reabre o microfone depois da resposta no modo manual.

## Mudanças

1. **Sem fala vazia de preparação no iPhone.** A v5.11.2 colocava uma utterance quase silenciosa na fila ao tocar em Falar/Enviar. Certas implementações de Web Speech podem deixar a fila presa. No iPhone, a v5.11.3 prepara a voz sem enfileirar essa fala; o iPad conserva o comportamento anterior.
2. **Rota de áudio após gravar.** Quando o navegador oferece `navigator.audioSession`, a sessão volta a `auto` antes de captar microfone e pede `playback` antes de falar no iPhone. É uma tentativa condicionada ao suporte da versão do iOS, não uma garantia de saída no alto-falante.
3. **Falha da voz nativa → áudio alternativo.** Quando a fala local relata erro ou bloqueio, o aplicativo tenta gerar áudio Gemini (usando a API existente, sem reenviar a pergunta ao Mentor). O reprodutor é exibido e permite iniciar o arquivo com um toque se o Safari bloquear o autoplay.
4. **Recuperação do arquivo sem refazer a resposta.** Se o arquivo já estiver carregado, tocar em “Ouvir resposta” reproduz aquele mesmo áudio no reprodutor.
5. **Safari pode dizer “concluído” e mesmo assim não sair som.** Nesse caso, o botão “Ouvir pela voz Gemini (alternativa)” fica disponível na conversa no iPhone, usando o texto já respondido.
6. **Perfil → Diagnóstico de áudio do iPhone.** Testes separados: (1) sinal sonoro local em WAV, sem IA; (2) voz nativa do Safari; (3) arquivo de voz Gemini. Inclui `Copiar diagnóstico` (modelo de aparelho, suporte e erros técnicos; sem transcrição de conversas, senhas ou chaves).
7. A versão do service worker e os parâmetros dos arquivos modificados foram incrementados para reduzir a chance de uso de recursos antigos em cache.

## Como instalar

**Antes de tudo:** em Perfil, faça backup de seus dados. Não limpe o armazenamento do Safari. Gravações guardadas no aparelho podem exigir exportação separada.

- **Já usa v5.11.2 no GitHub/Vercel?** Extraia `CoachVoice_AI_v5.11.3_PATCH_SOBRE_V5112.zip` e substitua apenas os arquivos correspondentes **na raiz** do repositório, mantendo os demais.
- **Não tem certeza da versão do repositório?** Use `CoachVoice_AI_v5.11.3_COMPLETO.zip`; extraia o conteúdo para a raiz, preservando `api`, `data` e `tests`. Não envie o ZIP como arquivo único na raiz.
- Aguarde a publicação no seu fluxo GitHub/Vercel, feche e reabra a aba. A versão deverá aparecer como **v5.11.3**. Se o app estiver instalado na tela inicial, feche-o completamente e reabra após a atualização.
- Não compartilhe nem altere `GEMINI_API_KEY`: a mesma configuração existente na Vercel é usada no áudio Gemini. A biblioteca privada de livros não está embutida no ZIP.

O ZIP **não atualiza** automaticamente seu site `chatgpt.site`; esse site é uma publicação separada.

## Testes recomendados no iPhone

1. Abra no Safari, confira **Perfil → Voz da IA → Áudio da conversa → Estável** e procure **Diagnóstico de áudio do iPhone**.
2. Toque em **1 · Testar som do iPhone**. Se não ouvir o sinal, verifique volume de mídia, modo silencioso e Bluetooth/AirPlay; tente pelo reprodutor. A falha pode ser da rota física de saída, não da IA.
3. Toque em **2 · Testar voz do aparelho**. Se o teste 1 toca e o teste 2 não, há forte indício de falha do sintetizador local do Safari.
4. Toque em **3 · Testar Gemini**. Se o áudio carregar e não tocar, pressione ▶ no próprio reprodutor para oferecer um gesto direto ao Safari.
5. Abra **Conversas → Mentor → Falar → Enviar** e teste a resposta. Caso a fala continue silenciosa, use **▶ Ouvir pela voz Gemini (alternativa)**, sem repetir a pergunta.
6. Se ainda não ouvir nada, use **Copiar diagnóstico** e compartilhe o relatório técnico. Ele não contém o texto de suas mensagens.
7. Compare com o iPad. Mantenha o iPad no modo que já está funcionando; não é preciso trocar a seleção de voz dele.

## Verificação e limites

- Sintaxe dos scripts JS, IDs do HTML e ZIP conferidos; testes automatizados originais e testes adicionais de áudio do iPhone executados.
- O teste visual em Chromium local não foi concluído: a execução foi interrompida pelo ambiente. **Não há validação visual nem reprodução real em um iPhone físico.**
- O Safari pode bloquear autoplay; `speechSynthesis` pode sinalizar início/fim sem que o usuário ouça; `navigator.audioSession` pode não existir ou não aceitar mudança no dispositivo.
- O fallback Gemini depende de internet, API e quota. Se a geração falhar, a resposta em texto permanece.
- No modo Estável, o timbre masculino não é garantido. Para solicitar voz Orus, configure Gemini. Mesmo assim, sua disponibilidade depende do provedor.
