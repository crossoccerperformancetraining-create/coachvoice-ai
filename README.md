# CoachVoice AI v5.11 — Football Intelligence

**Atualização completa sobre a base oficial do pacote v5.10 da Biblioteca do Drive**, mantendo Study Coach, Biblioteca privada por importação, Central de Competições, projeto da equipe, Mentor, inglês/espanhol, CoachDay e demais áreas existentes.

## Novidades integradas

1. **Voz masculina Orus** e feminina Kore com Gemini TTS, seletor persistente no Perfil, botão de teste e reprodutor. Voz automática Gacrux. Em caso de bloqueio de reprodução do Safari, use o botão ▶ no reprodutor. A voz do aparelho só é usada como alternativa, sem substituir silenciosamente a preferência masculina.
2. **Mercado da Bola** abaixo de Competições e Notícias no menu, com link também na aba Notícias e na Central.
3. **Paulista A4 2027**, com os 16 clubes de dois grupos confirmados pela FPF em 06/10/2026. A lista indica participação, não contratações, escalações ou inscrição dos atletas.
4. **Brasileirão Séries A, B, C e D**, **estaduais dos 27 estados/DF** e busca por nome de clube. Nas Séries A–D e estaduais, digite o nome da equipe: o módulo não possui uma base oficial completa de elencos.
5. **Favoritos** de clubes e competições e **notícias salvas** no navegador; as consultas não rodam com o app fechado.
6. **Boletim por voz**, narrando manchetes disponíveis e identificando o caráter não confirmado das reportagens, sem alucinar jogadores ou contratações.
7. **Conversar sobre uma notícia com o Mentor**, enviando título, data e endereço da fonte como contexto de análise (sem registrar decisão ou memória automaticamente).
8. Links para **FPF, CBF, ge, Futebol Interior, Transfermarkt e oGol**. Notícias via RSS de Google Notícias; consulte a fonte primária e o BID para confirmação.

## Instalar no GitHub → Vercel

1. No seu iPhone, **exporte um backup** no Perfil do CoachVoice antes da atualização. Não limpe os dados do Safari nem instale outra cópia do PWA sem backup.
2. Extraia `CoachVoice_AI_v5.11_FOOTBALL_INTELLIGENCE_COMPLETO.zip` e envie **todo o conteúdo da pasta extraída para a raiz** do mesmo repositório GitHub do CoachVoice. Mantenha `api/`, `data/`, `tests/` e arquivos da raiz.
3. Faça commit na branch que publica o site na Vercel. **A GEMINI_API_KEY permanece somente nas configurações da Vercel**. Nunca coloque a chave no HTML nem no repositório.
4. Após a publicação, atualize a aba Safari ou abra o aplicativo na Tela Inicial novamente. Em Meu CoachVoice → Voz da IA, escolha Masculina e toque em **Testar voz selecionada**.
5. Abra Competições e Notícias → **Mercado da Bola** e teste Paulista A4, Série B, estaduais e clube. Toque em Atualizar, salve um favorito, abra uma matéria e teste o boletim.

**Atenção:** este ZIP foi preparado para o projeto GitHub/Vercel baseado na v5.10. O endereço `coachvoice-estudio-privado.adrianokabeca.chatgpt.site` pode representar outro projeto/site. Este ZIP **não atualiza automaticamente** esse endereço, nem foi publicado pelo assistente. Antes de trocar o conteúdo do site, confirme se ele usa o mesmo código; evite substituir um site separado sem integração específica.

## Cobertura de dados e limites

- O Radar busca até 30 manchetes por consulta em feeds públicos. **Não prova registro, conclusão de transferência nem cobertura de todos os clubes.** Rumores não são automaticamente classificados como confirmação.
- FPF A4 2027: participantes e formato anunciados em 06/10/2026: https://futebolpaulista.com.br/Noticias/Detalhe.aspx?Noticia=33388
- A voz Gemini requer internet, `GEMINI_API_KEY`, disponibilidade do modelo TTS e cota da conta; não é possível validar a voz real sem a chave e um teste físico no aparelho.
- O Safari pode bloquear autoplay após tarefas assíncronas. O reprodutor permanece acessível para toque manual.
- Não há sincronização em nuvem entre celulares; favoritos e notícias salvas ficam no navegador. O **backup geral** inclui as chaves de armazenamento local do Mercado.
- O índice privado dos livros do Study Coach **não está incluído** no ZIP de código. Ele permanece importado no aparelho conforme a documentação v5.10.

## Verificações realizadas

- `npm test`: grupos originais da v5.10 e novos testes v5.11 aprovados.
- `node --check` dos JavaScripts e trechos inline do HTML aprovado.
- 535 IDs estáticos do HTML sem duplicações; referências a scripts e CSS existentes.
- Integridade do ZIP validada no ato da entrega.
- **Teste em iPhone físico, publicação na Vercel, acesso real a feeds e chamada de voz Gemini NÃO executados.**

Mais detalhes de biblioteca privada estão no arquivo `LEIA-V5.10-BIBLIOTECA.md` que acompanha o pacote.
