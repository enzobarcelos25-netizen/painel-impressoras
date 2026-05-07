# Painel de Impressoras

Painel web para acompanhamento de impressoras em ambiente de TI, com cadastro, filtros, logs e base para verificacao de status.

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-111?style=for-the-badge&logo=javascript" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-111?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-111?style=for-the-badge&logo=express" alt="Express" />
</p>

## Visao geral

Este projeto simula uma ferramenta interna para suporte tecnico acompanhar impressoras, identificar prioridades, registrar acoes e consultar status.

A interface funciona offline com `localStorage` e dados JSON. O back-end em Node/Express serve como base para verificacoes reais via ping.

## Destaques

- Projeto alinhado a rotina real de suporte e infraestrutura.
- Interface simples para operacao diaria.
- Logs de eventos e exportacao CSV.
- Separacao entre painel front-end e back-end de status.
- Base pronta para evoluir para autenticacao e monitoramento real.

## Funcionalidades

- Listagem de impressoras em cards.
- Busca por nome, IP ou setor.
- Filtros por online, offline e urgente.
- Cadastro, edicao e remocao de impressoras.
- Marcacao de prioridade/urgencia.
- Persistencia no navegador com `localStorage`.
- Historico de logs.
- Exportacao de logs em CSV.
- Endpoint `/status` no back-end para checagem por ping.

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

## Como rodar

Interface:

```txt
Abra index.html no navegador
```

Back-end:

```bash
npm install
node server.js
```

Endpoint:

```txt
http://localhost:3000/status
```

## Proximos passos

- Conectar o front-end diretamente ao endpoint `/status`.
- Padronizar a fonte de dados em um unico arquivo ou banco.
- Remover dados sensiveis antes de uso publico.
- Adicionar login para uso interno.
- Criar dashboard historico de disponibilidade.

## Status

Projeto de TI corporativa em evolucao, pensado como ferramenta interna de suporte.
