# CoachVoice AI 5.8 — Central de Competições

## Entrega
Pacote completo para atualizar o repositório existente coachvoice-ai. Mantém a Central do Treinador e a tela de conversa da 5.7. Não foi publicado por esta entrega.

## Como atualizar
1. No perfil do app, exporte seu backup atual.
2. Extraia o ZIP. Envie o conteúdo extraído para a raiz do GitHub, substituindo os arquivos e incluindo as pastas api, data e tests.
3. Confirme na branch main e aguarde a publicação automática da Vercel.
4. Feche e reabra o app; o menu identifica a versão 5.8.
5. Na Central, use Abrir Central de Competições ou o atalho Competições do cabeçalho.

## Funcionalidades
- Dashboard com saudação, campeonato selecionado, principal manchete disponível e acesso à central.
- Seleção das 27 unidades federativas, incluindo o Distrito Federal, campeonato e temporada. São Paulo e Alagoas têm atalhos de competições; outras competições podem ser nomeadas em Outro campeonato.
- Panorama, notícias, clubes, treinadores, elencos, jogos/classificação, estudo e fontes.
- A4 Paulista 2027 inicia com 16 participantes, grupos, resumo e datas anunciadas na FPF. A fonte e a data ficam visíveis. Esse cadastro inicial não representa uma consulta ao vivo a cada abertura.
- Notícias por futebol, estado, competição e temporada, agregadas por Google Notícias. Consulta ao abrir após dez minutos ou pelo botão Atualizar notícias. Conteúdo salvo fica disponível quando uma nova consulta falha.
- Pesquisa web por seção, com fontes, usando Gemini/Google Search. Os fatos sem fonte retornada pela busca ou de outro ano são descartados. Resultado pesquisado permanece identificado como pesquisa; não vira confirmação oficial.
- Notícias salvas e radar de novas manchetes detectadas entre consultas; não há monitoramento com app fechado.
- Clube selecionável, pesquisa de técnico/elenco e definição de adversário de estudo. Esse marcador é sua escolha, não um jogo confirmado em calendário.
- Campo para registrar análises, vídeos, fatos e suas fontes. Todo registro pertence à competição e temporada selecionadas.
- Checklist de chegada ao clube e preparação da pré-temporada.
- Vídeos YouTube válidos podem abrir dentro do app. Links de outros serviços permanecem na fonte.
- Botão Conversar com o Mentor leva o material selecionado à sessão de voz, sem acessar memórias de outra equipe.
- Vincular ao projeto ativo guarda uma referência da competição. Sessões futuras que usam esse projeto recebem o contexto salvo da competição vinculada; não recebem dados de outra seleção.
- Backup próprio da central com exportação e importação. O backup geral do perfil também inclui as novas chaves locais.

## Pesquisa de técnicos, elencos, tabela e vídeos
Abra a seção e toque em Pesquisar esta seção. A pesquisa consulta fontes públicas e pode consumir cota do serviço Gemini já configurado no aplicativo. Não é necessário colocar chave no navegador.

A nova rota usa GEMINI_API_KEY, a mesma variável existente do Mentor. O modelo de pesquisa padrão é gemini-3.8-flash, com google_search na Interactions API. GEMINI_RESEARCH_MODEL permite escolher outro modelo compatível, sem alterar GEMINI_MODEL do Mentor. A disponibilidade do modelo, busca e cota deve ser validada na conta da Vercel após publicação.

A resposta só é armazenada como fato se trouxer uma URL citada nos metadados de busca e a temporada correspondente. Isso reduz conteúdo sem fonte, mas não substitui a leitura crítica do treinador. Se o provedor não devolver o formato ou evidências necessários, a tela preserva os registros anteriores e informa que a pesquisa não pôde ser concluída. A busca não garante cobertura completa de divisões menores; listas podem ser parciais. Classificação e jogos são apresentados como registros com fonte, sem gerar pontos ou resultados estimados.

## Fontes iniciais
- FPF, anúncio de 06/10/2026: https://futebolpaulista.com.br/Noticias/Detalhe.aspx?Noticia=33388
- FPF, documentos e competições: https://futebolpaulista.com.br/
- FAF, competições: https://futeboldealagoas.net/pt/competicoes/
- A área Fontes reúne atalhos de federações e veículos; a origem exata acompanha cada notícia/pesquisa.

## Validação realizada
- Seis grupos de testes automatizados passaram, incluindo os anteriores de sessão, áudio e APIs.
- Novos testes: RSS, cache, rejeição de URLs inseguras, temporada/estado separados, fatos sem citações recusados, erro de configuração e estrutura do cadastro oficial.
- Teste de DOM: renderização de 16 clubes, seleção de clube, pesquisa simulada, envio de contexto ao Mentor, escape de manchetes e ausência de vazamento entre temporadas e estados.
- RSS real respondeu com sucesso durante a implementação.
- Sintaxe de JavaScript/JSON e lista de arquivos offline verificadas.
- A pesquisa real por IA e a aparência no iPhone ainda não foram validadas. Não foi feita publicação nem instalação de navegador de teste nesta entrega.

## Conferir após publicar
1. Abra a Central, escolha SP / Paulista A4 / 2027 e confira os clubes e grupos.
2. Atualize notícias; salve uma e abra Conversar sobre isso.
3. Escolha Ecus, abra Treinadores e Elencos e solicite a pesquisa; confira as fontes.
4. Troque para 2026 e depois Alagoas: os dados de 2027 não devem aparecer como atuais.
5. Registre uma análise, marque uma tarefa do checklist, teste um vídeo e exporte o backup.
6. Vincule a competição a um projeto e teste uma conversa com esse projeto ativo.

## Limites
Os registros e as pesquisas salvas continuam no aparelho; não há login ou sincronização de dados entre aparelhos nesta versão. Registros antigos do app não foram migrados nem apagados. Elencos, técnicos e documentos indisponíveis não são preenchidos por suposição. O modelo de jogo deve vir de análise de vídeo e evidência; não é inferido da escalação.
