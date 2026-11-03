# CoachVoice AI v5.11.2 — Conversa de voz estável no iPhone

## Objetivo

Recuperar a experiência das versões em que o treinador tocava no microfone, falava, enviava, recebia a resposta e a escutava. **O microfone permanece fechado depois da resposta** no modo manual. A atualização parte da **v5.11.1**, preservando Notícias, Mercado da Bola, clubes favoritos, Mentor, Study Coach, biblioteca privada por importação, Reflexões, competições e demais módulos.

## O que mudou

- **Modo Estável (padrão):** fala do próprio iPhone/Safari usando Web Speech (`speechSynthesis`), sem requisição extra ao Gemini TTS para a voz da conversa. Usa trechos curtos e recuperação explícita se o Safari bloquear a reprodução.
- **Modo Gemini (opcional):** selecionável em Perfil → Voz da IA → Áudio da conversa e nos ajustes da sessão. TTS masculino Orus, feminino Kore e automático Gacrux, sujeito a disponibilidade e cotas do Gemini.
- **Toque para liberar áudio:** a captura de voz é preparada em gesto direto antes da chamada à IA; quando bloqueado, a resposta textual é preservada e aparece **🔊 Ouvir resposta**. Não é preciso enviar sua fala novamente.
- **Fluxo protegido:** falar → terminar/enviar → resposta escrita e falada → microfone fechado até novo toque. Pausar, interromper e finalizar cancelam reproduções pendentes.
- **Leitura em outras áreas:** o mecanismo estável também atende comandos `speakText` das demais áreas no modo Estável.

## Sobre a voz masculina

A voz do iPhone é selecionada pelo sistema e pelas vozes instaladas. **Não há garantia de timbre masculino no modo Estável**, ainda que Masculina esteja marcada no perfil; esse modo dá prioridade a ouvir a resposta. Para solicitar explicitamente **Orus** escolha **Modo Gemini**, desde que a API Gemini esteja disponível. O app não inventa uma voz masculina local que não existe.

## Atualizar sem apagar dados

1. Exporte o backup do perfil no aparelho atual. Não limpe os dados do Safari. Áudios/vídeos gravados podem exigir exportação própria.
2. Para a instalação GitHub/Vercel existente, extraia o ZIP completo e envie seu conteúdo diretamente à raiz do repositório, incluindo a pasta `api`. Alternativamente, se já usa a **v5.11.1**, aplique apenas o patch da v5.11.2, preservando os demais arquivos.
3. Mantenha `GEMINI_API_KEY` somente nas variáveis privadas da Vercel; não envie chaves ao repositório.
4. Confirme a publicação e reabra o aplicativo; no menu deve aparecer `v5.11.2`. Se estiver usando versão instalada na tela inicial, feche-a totalmente e abra novamente.
5. Em **Perfil → Voz da IA**, escolha **Estável (recomendado)**. Teste a voz. Depois teste **Conversas/Mentor → Falar → Encerrar fala e enviar**. Caso não toque automaticamente, pressione **🔊 Ouvir resposta**.

**Atenção:** o site `coachvoice-estudio-privado.adrianokabeca.chatgpt.site` é outra publicação. Estes ZIPs não atualizam esse endereço automaticamente.

## Validação e limites

Foram executados os testes de regressão do projeto e testes novos para modo estável, divisão de mensagens, bloqueio simulado do Safari, cancelamento e preservação do menu. Validação estática de scripts, arquivos e ZIP. Os testes em navegador simulado **não comprovam reprodução real no iPhone**; é indispensável confirmar no Safari/iOS. Transcrição e respostas da IA ainda dependem de internet e das APIs configuradas.

A biblioteca privada de livros **não está no ZIP público**: mantenha seu índice privado em importação separada.
