# CoachVoice AI 5.7 — acabamento da conversa

## O que muda
- Uma ação principal grande: Iniciar conversa, Falar, Encerrar fala e enviar ou Interromper e falar.
- Controles fora da área de rolagem: o botão principal, repetir, ver conversa, pausar conversa e finalizar ficam acessíveis.
- Continuar aparece quando a conversa está pausada.
- Texto recolhido no modo voz; Ver conversa revela as falas. Digitar mensagem abre o campo de texto.
- Mais opções reúne controles de voz, velocidade, exemplo, reprodutor e novas tentativas em caso de erro.
- Cabeçalho compacto; objetivo disponível em uma seção expansível.
- Mesmo padrão nas sessões de Mentor, inglês, espanhol, oratória e vídeo.
- Se o navegador bloquear o áudio, o botão principal oferece Ouvir resposta; o reprodutor continua disponível.

## Atualizar pelo GitHub
1. Faça backup dos dados na opção de perfil do aplicativo antes de atualizar.
2. Extraia o ZIP. Envie os arquivos extraídos para a raiz do repositório coachvoice-ai, incluindo api, e substitua os anteriores.
3. Confirme as alterações na main e aguarde a Vercel concluir a publicação.
4. Feche e abra novamente o aplicativo. A identificação de versão passa a 5.7.

## Validação
Os cinco grupos de testes automatizados passaram: sessão, contratos das APIs, reprodução/cache de voz, controles de voz e fluxo dos novos botões. A nova verificação usa um DOM simulado; não substitui uma avaliação visual ou o teste em aparelho real. A tentativa de verificação visual local não foi concluída porque o navegador de teste não pôde ser instalado neste ambiente.

Depois da publicação, confira no iPhone: iniciar, falar, enviar, receber resposta, interromper, pausar, continuar e finalizar; abrir Ver conversa, Digitar mensagem e Mais opções. Confira uma sessão em inglês, espanhol, oratória e vídeo. Teste também com o teclado aberto se os controles permanecem acessíveis.

## Escopo
O pacote completo mantém a Central, o contexto de equipe, o histórico e as APIs da versão 5.6. O armazenamento continua no aparelho; não foi adicionada sincronização em nuvem. Microfone, câmera e voz dependem de permissões do aparelho e da disponibilidade dos serviços. Este pacote ainda precisa ser enviado ao GitHub para entrar no site publicado.
