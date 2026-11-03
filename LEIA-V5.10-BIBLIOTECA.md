# CoachVoice AI 5.10 — Livros do Drive no Study Coach

## O que está pronto
Os arquivos do Google Drive foram consultados e baixados para extração local. Os originais não foram movidos, renomeados nem apagados. Foram preparados 18 livros para importação privada, com 7.767 passagens de texto em 5.183 páginas físicas de PDFs. Esse número representa páginas com texto indexado; não significa cobertura visual integral das obras.

Foram usados texto nativo de PDF e OCR. Seirul·lo e Bielsa, antes sem texto pesquisável, foram processados com OCR em espanhol. Também foi tratado texto corrompido de El Segundo Entrenador e feita uma tentativa de ampliar o texto dos slides de Paulo Victor Gomes. Páginas ilegíveis, com pouco texto ou baixa confiança foram deixadas fora. Diagramas e imagens não são interpretados por esse índice.

Barroca — Modelo de Trabalho permanece no catálogo, mas nenhum arquivo correspondente foi localizado nas buscas realizadas no Drive. Não foi incluído conteúdo presumido desse livro.

## Dois arquivos com destinos diferentes

1. CoachVoice_AI_v5.10_Biblioteca_Drive_GitHub.zip: código completo para o GitHub. Mantém Study Coach, sala de voz, projetos e Central de Competições. Não contém os textos privados dos livros.
2. Study_Coach_Biblioteca_Privada_Importar.json: índice privado, com aproximadamente 11,4 MB. Importe pelo próprio app; NÃO coloque esse arquivo no GitHub ou em hospedagem pública.

## Como instalar
1. Exporte o backup atual no perfil do CoachVoice.
2. Extraia o ZIP 5.10 e envie seu conteúdo inteiro para a raiz de coachvoice-ai no GitHub, incluindo api e data. Aguarde a publicação da Vercel.
3. No iPhone, baixe o JSON privado para o app Arquivos.
4. Abra o CoachVoice atualizado. Entre em Evolução → Abrir Study Coach → Biblioteca.
5. Em Livros do meu Drive neste aparelho, toque em Importar índice privado e escolha o JSON.
6. Aguarde aparecerem 18 livros importados. A cobertura por livro estará disponível em Ver cobertura por livro.
7. Em Estudar, selecione Só biblioteca e descreva sua situação. As passagens selecionadas aparecem com título, página física e método de extração.

O pacote ainda precisa ser publicado pelo GitHub. Não foi feito deploy nesta entrega.

## Como a busca funciona
A busca acontece primeiro no aparelho, por palavras e temas, incluindo termos relacionados em português, espanhol e inglês. Até cinco passagens são selecionadas, com diversidade entre livros, e enviadas à IA somente quando você solicita um estudo, Mesa de Referências ou avaliação de caso. A busca lexical não garante encontrar todas as passagens relevantes; reformule a situação se necessário.

Só biblioteca usa as passagens selecionadas e as notas conferidas; se não houver material relevante, indica a limitação. Se a consulta falhar, não passa silenciosamente para IA geral. Comparar permite relacionar essas passagens com uma síntese geral claramente separada. IA geral não busca na biblioteca privada.

Cada referência usa a página física do PDF, que pode diferir da página impressa do livro. Textos reconhecidos por OCR são identificados e podem conter erros: confira o original antes de usar uma citação literal. O app não deve inventar capítulo, página impressa nem afirmações não sustentadas pelos trechos.

Mesa e casos também podem receber passagens reais. O Mentor recebe apenas o caso/contexto selecionado, sem alegar que leu integralmente todos os livros. Meu Modelo de Trabalho continua dependendo das suas notas e confirmações pessoais; os textos dos autores não viram automaticamente convicções suas.

## Privacidade e armazenamento
O índice fica no IndexedDB deste navegador/aparelho. Não cria uma conexão permanente entre o site e o Google Drive e não atualiza automaticamente quando um PDF mudar. A conexão autorizada do Drive no ChatGPT não é transferida para o site.

Os livros não ficam no ZIP público, no serviço offline do site nem em arquivos públicos do GitHub. O app usa a configuração Gemini existente para as consultas e envia somente as passagens selecionadas como contexto. Nenhuma credencial de Drive foi incluída no código, e GEMINI_API_KEY não foi alterada.

Guarde o JSON privado: o backup geral do perfil cobre notas e preferências, mas não inclui esse índice. Se limpar os dados do site, trocar de aparelho ou usar outro navegador, importe novamente. Remover livros deste aparelho apaga apenas a biblioteca importada, preservando suas notas pessoais. Dados privados continuam sujeitos às proteções e limitações do navegador.

## Cobertura verificada em 19/10/2026

| Referência | Páginas físicas | Páginas com texto indexado | Passagens | Origem do texto |
|---|---:|---:|---:|---|
| [Cabeça Fria, Coração Quente](https://drive.google.com/file/d/10Vn-qYy2nE_ELNsiQRuToWCZhoWT4s8i/view) | 677 | 427 | 515 | texto do PDF |
| [Liderança](https://drive.google.com/file/d/1VjOuwYn_bNVf6ORqnx4KOwkNGlRFzwwS/view) | 498 | 428 | 429 | texto do PDF |
| [Quiet Leadership](https://drive.google.com/file/d/1M9k-HO2x2gbooVTHEz9iocskgj5OnjUQ/view) | 140 | 128 | 283 | texto do PDF |
| [Guardiola Confidencial](https://drive.google.com/file/d/1K7iJQBo86OOG8sADJx9LEDcg8kICEaX9/view) | 355 | 320 | 575 | texto do PDF |
| [Pep Guardiola — A Evolução](https://drive.google.com/file/d/1f6JC1T0GMAJ0jVV638f0pGxtTWN5Qg1b/view) | 463 | 452 | 529 | texto do PDF |
| [Klopp](https://drive.google.com/file/d/1CCiKVzShwPBrVv7wDM7Y__quqlrv5C6o/view) | 276 | 250 | 471 | texto do PDF |
| [A Pirâmide Invertida](https://drive.google.com/file/d/1YEfQX_IZ8gd1vAbq0DjA6Aduna1peMDR/view) | 527 | 511 | 879 | texto do PDF |
| [A Organização do Jogo](https://drive.google.com/file/d/1sd2kSxgf802844dju-MPOrngS9bxtplE/view) | 534 | 527 | 823 | texto do PDF |
| [Para um Futebol Jogado com Ideias](https://drive.google.com/file/d/1yRPmISID7herWKcGInO6-k_V1QXZ00jJ/view) | 454 | 310 | 350 | texto do PDF |
| [Futebol, Conceitos & Ideias dos Momentos do Jogo](https://drive.google.com/file/d/1ykdO8PRwvqmqJiPdMY0BFD8Cfb8ceMB-/view) | 36 | 12 | 12 | OCR parcial |
| [Análise de Desempenho no Futebol](https://drive.google.com/file/d/1kwKi4qvextMUgrz7B0JAzgDfsu5xoLM1/view) | 84 | 75 | 96 | texto do PDF |
| [Os Números do Jogo](https://drive.google.com/file/d/12GjtXMTJj311vijOmjoj_Bgao_R5bTP3/view) | 239 | 231 | 401 | texto do PDF |
| [Treinamento nos Esportes Coletivos](https://drive.google.com/file/d/1hlo4To-LA51giCqUYlxEUPyvTT1tGRWJ/view) | 436 | 394 | 491 | OCR parcial |
| [Psicologia do jogador de futebol](https://drive.google.com/file/d/175_OHUrtU_OVj_VXFwrasPoTuIa3Egui/view) | 316 | 300 | 445 | texto do PDF |
| [Os 11 Caminhos para o Gol](https://drive.google.com/file/d/1UyAcfQNj8EuUxnewgL5lG196rb6aF21F/view) | 138 | 121 | 164 | OCR parcial |
| [Rápido & Devagar](https://drive.google.com/file/d/1hwFdTKa7OK8H56sEOljQ31aPQNmuEUCX/view) | 497 | 409 | 816 | texto do PDF |
| [Los 15 Escalones del Liderazgo](https://drive.google.com/file/d/1uhPaZ8du1D_qJGU0cfi-7ayd6BkNofdC/view) | 127 | 100 | 167 | texto do PDF |
| [El Segundo Entrenador](https://drive.google.com/file/d/1V765RbtJGi-L7uoapZv2zIBdY8EtXXus/view) | 193 | 188 | 321 | OCR parcial |
| Modelo de Trabalho — pendente | 0 | 0 | 0 | arquivo não localizado |

## Verificação realizada
- Oito grupos de testes automatizados passaram, preservando sessões, áudio, competições e Study Coach.
- Testadas importação, validação do índice, atualização sem duplicar livros e busca por página.
- Testada a importação do arquivo real e quatro consultas com retorno de passagens existentes nos PDFs.
- Teste de DOM com a biblioteca real e respostas de IA simuladas: seleção de fontes, confirmação de notas/modelo/decisão, revisão, ditado e áudio em partes.
- Conferidas sintaxe, arquivos offline e ausência do índice privado no pacote público.

Falta conferir aparência, importação e voz no iPhone real após publicação. Não foi feita uma consulta real de IA com os textos privados durante os testes; as chamadas de geração foram simuladas.
