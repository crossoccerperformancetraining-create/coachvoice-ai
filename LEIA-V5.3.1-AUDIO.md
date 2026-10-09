# CoachVoice AI v5.3.1 — Áudio e perfil

## O que mudou
- Painel de áudio no início da aba Mentor, com Iniciar áudio e Encerrar áudio separados.
- Ouvir resposta, Parar voz e Testar voz visíveis.
- Resposta automática por voz com preferência sincronizada e reprodutor visível após gerar o áudio.
- Nome atual do perfil enviado para a IA em todas as chamadas; nomes antigos não têm prioridade.
- Mentor usa a seleção de voz feminina/masculina/automática da engrenagem. A resposta gera um áudio WAV com reprodutor; a voz do aparelho funciona como alternativa se a geração falhar.
- Proteção contra dois toques abrindo dois microfones e contra iniciar uma gravação enquanto a IA responde.
- Encerrar áudio termina a gravação e envia; Encerrar conversa fecha o registro da conversa.

## Teste no iPhone
1. Na engrenagem, salve nome e equipe; escolha a preferência de voz.
2. Abra Mentor IA e toque em Testar voz. A apresentação deve usar seu nome salvo.
3. Deixe Responder em áudio automaticamente marcado.
4. Toque em Iniciar áudio e permita o microfone. Fale por alguns segundos.
5. Toque em Encerrar áudio; aguarde transcrição e resposta.
6. Se a resposta automática não tocar, use Ouvir resposta para iniciar a reprodução por toque.
7. Para terminar o registro, use Encerrar conversa.

## Atualizar GitHub
Envie os arquivos extraídos na raiz de crossoccerperformancetraining-create/coachvoice-ai, incluindo api. Este pacote é completo; não envie o ZIP fechado. A publicação direta na Vercel não altera o GitHub.

## Validação
Sintaxe dos scripts e APIs verificada. Testes com microfone e síntese de voz simulados: dois toques no início, iniciar/encerrar/transcrição/IA/voz, mudança de nome e voz, transcrição com falha e repetição do mesmo áudio, permissão negada e falha de IA. Não equivalem a teste de captura ou reprodução em um iPhone físico.

Na versão publicada, os controles foram conferidos na aba Mentor. As alterações de perfil ficam no aparelho em que você salva; o teste remoto não altera o perfil salvo no seu iPhone.

## Geração da voz
Usa GEMINI_API_KEY já configurada na Vercel. GEMINI_TTS_MODEL é opcional. Nenhuma chave é enviada ao navegador. Respostas de até 3000 caracteres; falhas usam síntese nativa do aparelho. O áudio gerado permanece temporariamente no navegador e não é salvo no histórico.
