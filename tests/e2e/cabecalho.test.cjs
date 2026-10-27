// O cabeçalho fica em uma linha só em qualquer largura: nada de botão ou menu quebrando.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('./helpers.cjs');

let app;
before(async () => { app = await iniciar(); });
after(async () => { await app.encerrar(); });

const LARGURAS = [320, 360, 375, 390, 414, 430, 480, 768, 844, 960, 1024, 1280, 1440];

for (const caminho of ['/', '/privacidade.html']) {
  test(`${caminho}: cabeçalho sem quebra de linha de 320 a 1440 px`, async () => {
    const quebras = [];
    for (const largura of LARGURAS) {
      const ctx = await app.navegador.newContext({ viewport: { width: largura, height: 800 } });
      const pagina = await ctx.newPage();
      await pagina.goto(app.base + caminho);
      await pagina.evaluate(() => document.fonts.ready);
      const aqui = await pagina.evaluate(() => {
        const linhas = (el) => {
          const faixa = document.createRange();
          faixa.selectNodeContents(el);
          return new Set([...faixa.getClientRects()].map((r) => Math.round(r.top))).size;
        };
        const itens = document.querySelectorAll('.topo .marca__nome, .topo .marca__tipo, .topo .menu a, .topo .botao');
        return [...itens]
          .filter((el) => getComputedStyle(el).display !== 'none' && getComputedStyle(el.parentElement).display !== 'none')
          .filter((el) => linhas(el) > 1)
          .map((el) => `"${el.textContent.trim()}"`);
      });
      if (aqui.length) quebras.push(`${largura}px: ${aqui.join(', ')}`);
      await ctx.close();
    }
    assert.deepEqual(quebras, []);
  });
}
