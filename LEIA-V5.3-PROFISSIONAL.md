# CoachVoice AI — v5.3 Profissional

Interface renovada no mesmo aplicativo: menu lateral fixo no computador, acesso rápido ao Mentor, CoachDay, idiomas e estúdio, cabeçalhos compactos, melhores espaçamentos e controles acessíveis.

## Preservação
Os módulos JavaScript anteriores e os quatro arquivos da API foram mantidos byte a byte. As chaves de armazenamento, perfil, agenda e históricos permanecem iguais. A atualização do service worker inclui os arquivos móveis e a nova interface no cache offline.

## Atualizar o GitHub
1. Extraia este ZIP.
2. Abra o repositório crossoccerperformancetraining-create/coachvoice-ai.
3. Envie os arquivos na raiz, incluindo a pasta api, substituindo as versões anteriores. Não envie o ZIP fechado nem uma pasta envolvendo o projeto.
4. Confirme o commit e acompanhe o deploy automático da Vercel.
5. Reabra o aplicativo para carregar a nova interface.

A publicação pela Vercel não cria um commit no GitHub. Atualize o repositório com este pacote antes de enviar alterações futuras, para manter a nova interface. As variáveis de ambiente existentes continuam sendo necessárias para IA e transcrição; não inclua chaves no código.

## Validação
Sintaxe dos scripts internos e externos verificada. Todos os destinos do menu e arquivos locais referenciados foram encontrados. APIs e módulos originais comparados com o pacote de origem. Navegação publicada conferida em 17 módulos, além das abas da agenda. O botão de organização do dia retornou uma resposta da integração com IA. Corrigido o erro de inicialização causado pela tentativa de preencher o contêiner legado progressBlocks, ausente nesta versão. A validação completa de microfone e câmera deve ser feita em iPhone/iPad/Android reais; sem gravação real, não é possível certificar captura, bloqueio de tela ou permissões do aparelho.
