# Painel de Impressoras

Painel web para visualizar, cadastrar e acompanhar impressoras de um ambiente de TI.

O projeto mistura uma interface offline com `localStorage`, arquivos JSON de impressoras e um back-end Node/Express para consulta de status por ping.

## Objetivo

Criar uma ferramenta simples para suporte tecnico acompanhar impressoras, marcar prioridades e registrar acoes do dia a dia.

## Funcionalidades

- Listagem de impressoras em cards.
- Busca e filtro por status.
- Marcacao de impressoras urgentes.
- Cadastro, edicao e remocao de impressoras.
- Persistencia local com `localStorage`.
- Logs de acoes e verificacoes.
- Exportacao de logs em CSV.
- Back-end Express com rota `/status` para verificar impressoras via ping.

## Stack

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- Docker Compose

## Estrutura

```txt
painel-impressoras/
  index.html
  style.css
  app.js
  server.js
  impressoras.json
  printers.json
  package.json
  docker-compose.yml
  vercel.json
```

## Como rodar a interface

Abra o arquivo `index.html` no navegador.

## Como rodar o back-end

```bash
npm install
node server.js
```

Endpoint local:

```txt
http://localhost:3000/status
```

## Observacoes

O front-end atual tambem simula verificacoes de status para evitar problemas de CORS no navegador. O back-end fica disponivel como base para evoluir para checagens reais em rede local.

## Proximos passos

- Integrar a interface diretamente ao endpoint `/status`.
- Padronizar um unico arquivo de impressoras.
- Proteger dados sensiveis de rede antes de publicar.
- Adicionar autenticacao para uso interno.

## Status

Projeto de TI corporativa em evolucao.
