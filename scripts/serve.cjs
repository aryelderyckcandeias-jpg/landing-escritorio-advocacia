#!/usr/bin/env node
// Servidor estático mínimo, sem dependências.
// Usado pelos testes E2E e por `npm run serve` (http://127.0.0.1:4173).
// `npm run serve:pages` imita o GitHub Pages: o site fica em /landing-escritorio-advocacia/
// e todo endereço inexistente recebe a página 404.html, com status 404.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const PREFIXO_PAGES = '/landing-escritorio-advocacia';

function criarServidor(raiz = RAIZ, { prefixo = '' } = {}) {
  const naoEncontrado = (res) => {
    if (!prefixo) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Não encontrado');
    }
    // Como no GitHub Pages: a página 404.html do site, com status 404.
    fs.readFile(path.join(raiz, '404.html'), (erro, pagina) => {
      res.writeHead(404, { 'Content-Type': erro ? 'text/plain; charset=utf-8' : TIPOS['.html'] });
      res.end(erro ? 'Não encontrado' : pagina);
    });
  };

  return http.createServer((req, res) => {
    let caminho;
    try {
      caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400);
      return res.end('Requisição inválida');
    }
    if (prefixo) {
      if (caminho === prefixo) caminho += '/';
      if (!caminho.startsWith(prefixo + '/')) return naoEncontrado(res);
      caminho = caminho.slice(prefixo.length);
    }
    if (caminho.endsWith('/')) caminho += 'index.html';

    // Nunca serve arquivos ocultos (.git, .github, .env...).
    if (caminho.split('/').some((parte) => parte.startsWith('.'))) return naoEncontrado(res);

    const arquivo = path.normalize(path.join(raiz, caminho));
    if (!arquivo.startsWith(raiz + path.sep)) {
      res.writeHead(403);
      return res.end('Proibido');
    }

    fs.readFile(arquivo, (erro, dados) => {
      if (erro) return naoEncontrado(res);
      res.writeHead(200, {
        'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(dados);
    });
  });
}

module.exports = { criarServidor };

if (require.main === module) {
  const porta = Number(process.env.PORT || 4173);
  const prefixo = process.argv.includes('--pages') ? PREFIXO_PAGES : '';
  criarServidor(RAIZ, { prefixo }).listen(porta, '127.0.0.1', () => {
    console.log(`Servindo em http://127.0.0.1:${porta}${prefixo}/`);
  });
}
