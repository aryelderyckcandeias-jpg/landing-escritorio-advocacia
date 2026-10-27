#!/usr/bin/env node
// Servidor estático mínimo, sem dependências.
// Usado pelos testes E2E e por `npm run serve` (http://127.0.0.1:4173).
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

function criarServidor(raiz = RAIZ) {
  return http.createServer((req, res) => {
    let caminho;
    try {
      caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400);
      return res.end('Requisição inválida');
    }
    if (caminho.endsWith('/')) caminho += 'index.html';

    // Nunca serve arquivos ocultos (.git, .github, .env...).
    if (caminho.split('/').some((parte) => parte.startsWith('.'))) {
      res.writeHead(404);
      return res.end('Não encontrado');
    }

    const arquivo = path.normalize(path.join(raiz, caminho));
    if (!arquivo.startsWith(raiz + path.sep)) {
      res.writeHead(403);
      return res.end('Proibido');
    }

    fs.readFile(arquivo, (erro, dados) => {
      if (erro) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Não encontrado');
      }
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
  criarServidor().listen(porta, '127.0.0.1', () => {
    console.log(`Servindo em http://127.0.0.1:${porta}`);
  });
}
