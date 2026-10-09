# CoachVoice AI 5.6 — integração das versões

Este pacote integra a versão “coachvoice-ai-v5.4-conversation-mode-github” enviada pelo treinador com a Central do Treinador 5.5. Ele contém o projeto completo, incluindo `api`.

## O que foi incorporado do pacote enviado

- Conversa manual como padrão: pausas naturais não enviam a fala. Você escolhe quando enviar.
- Estilos Conversa livre, Mentor e Só perguntas no Mentor e Dia a Dia.
- Resposta automática por voz após o processamento, quando essa opção está ativa.
- Pausar/continuar a reprodução, repetir, parar a voz e velocidades 1x, 1.15x e 1.25x.
- Interromper a resposta e falar; o botão passa a Finalizar e enviar durante a gravação.
- Ocultar/mostrar a transcrição, deixando a conversa por voz em destaque.
- Conversa rápida na Central.
- Acesso administrativo pelo perfil; navegação principal pelas cinco áreas da Central.
- Preferência de velocidade da chave antiga `coachvoice-conversation-v54` preservada; dados existentes de agenda, perfil e histórico continuam nas mesmas chaves.

## O que permanece da Central 5.5

Central com indicadores reais, gráfico semanal, objetivos, agenda e continuidade. Equipe e temporada com projetos separados, memória confirmada, telas por função, idiomas com níveis, estúdio, revisão, tarefas e exemplos. O áudio gerado no servidor e a voz alternativa do aparelho continuam disponíveis. As APIs da 5.5 são mantidas, pois a cópia antiga não tinha os modos de sessão e resumo nem a geração de áudio no servidor.

As melhorias equivalentes do pacote antigo foram incorporadas à tela unificada; as duas interfaces de conversa não são carregadas simultaneamente. Isso evita microfones, vozes e controles concorrentes.

## Atualizar o GitHub

1. Faça backup no aplicativo, no aparelho onde estão os registros.
2. Extraia o ZIP 5.6 e envie o conteúdo para a raiz do repositório. Não envie uma pasta externa contendo o projeto.
3. Inclua `api`, os arquivos de sessões, a Central e `conversation-merge-v56.js`/`.css`. Use a pasta `api` deste pacote.
4. Mantenha as variáveis privadas já configuradas na Vercel. Não coloque chaves no HTML, no GitHub nem nesta conversa.
5. Commit sugerido: `Integrar Conversation Mode com Central do Treinador v5.6`.
6. Aguarde a publicação do GitHub na Vercel. Abra o aplicativo e recarregue. O menu/rodapé deve indicar v5.6.
7. Não limpe o armazenamento do Safari: sessões, projetos e gravações permanecem locais.

Este pacote foi preparado para atualizar seu repositório. A publicação atualmente ligada ao GitHub não foi substituída durante esta comparação.

## Testar no iPhone

Na Central, toque em Conversa rápida. Abra Ajustar situação, idioma e contexto: confira Estilo da conversa, captura manual, equipe, voz automática e idioma. Inicie, fale com pausas e escolha Finalizar e enviar. Confira transcrição e resposta automática. Teste Repetir, Pausar voz/Continuar voz, Parar voz, velocidade e Interromper e falar. Confira os três estilos de diálogo. Finalize a sessão e revise o resumo antes de confirmar memória/tarefas.

A primeira abertura da versão integrada seleciona captura manual. O modo contínuo continua disponível nas opções. Os demais registros não são apagados.

## Limites práticos

- Áudio manual: até três minutos por trecho; áudio contínuo: até um minuto; vídeo: até 90 segundos. O tamanho do arquivo também pode exigir uma fala menor.
- Autoplay, microfone, câmera, voz do aparelho e tela ativa dependem do navegador/dispositivo; faça o teste físico no iPhone. A proteção de tela não impede todas as interrupções do sistema.
- A voz do servidor pode atingir limite temporário do provedor (429). A velocidade não altera esse limite; o aplicativo tenta reutilizar áudio e usar a voz do aparelho.
- Os dados não têm sincronização entre dispositivos. Baixe gravações importantes: o backup textual não inclui os arquivos de áudio/vídeo do banco local.
- A análise visual usa quadros selecionados; não interpreta movimento contínuo. Texto transcrito não mede pronúncia, emoção ou tom de voz.

## Verificação realizada

Passaram os testes automatizados de sessões, transcrição, resumo, confirmação explícita, isolamento de projetos, contratos das APIs, cache de áudio e erro de limite do provedor. Os testes adicionados verificam o estilo enviado à API, a pausa/retomada do áudio sem mudar o ponto da reprodução, velocidade e interrupção sem deixar a promessa de voz pendente. Testes físicos em Safari/iPhone continuam necessários.
