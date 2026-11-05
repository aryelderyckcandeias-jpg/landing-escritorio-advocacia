// Impressão: papel branco. A tarja e a luz são efeitos de tela e não podem esconder nada no papel.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('./helpers.cjs');

let app;
before(async () => { app = await iniciar(); });
after(async () => { await app.encerrar(); });

for (const caminho of ['/', '/privacidade.html']) {
  test(`${caminho}: na impressão, títulos sem tarja, texto escuro e sem navegação`, async () => {
    const ctx = await app.navegador.newContext();
    const pagina = await ctx.newPage();
    await pagina.goto(app.base + caminho);
    await pagina.waitForSelector('html.js-pronto');
    await pagina.emulateMedia({ media: 'print' });
    const r = await pagina.evaluate(() => {
      const luminancia = (cor) => {
        const [vr, vg, vb] = cor.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return 0.2126 * vr + 0.7152 * vg + 0.0722 * vb;
      };
      const contrasteNoBranco = (el) => 1.05 / (luminancia(getComputedStyle(el).color) + 0.05);
      const textos = [...document.querySelectorAll('main h1, main h2, main h3, main p, main li, main summary')];
      const visivel = (sel) => [...document.querySelectorAll(sel)].some((el) => getComputedStyle(el).display !== 'none');
      return {
        tarjasVisiveis: [...document.querySelectorAll('.tarjado')]
          .filter((el) => { const c = getComputedStyle(el, '::after'); return c.content !== 'none' && c.display !== 'none'; })
          .map((el) => el.id || el.tagName),
        piorContraste: Math.min(...textos.map(contrasteNoBranco)).toFixed(2),
        luzVisivel: document.querySelector('.hero') ? getComputedStyle(document.querySelector('.hero'), '::before').display !== 'none' : false,
        navegacaoVisivel: visivel('.menu, .menu-movel, .pular, .topo__contato'),
      };
    });
    assert.deepEqual(r.tarjasVisiveis, [], 'nenhum título coberto no papel');
    assert.ok(Number(r.piorContraste) >= 4.5, `pior contraste do texto sobre o papel branco: ${r.piorContraste}:1`);
    assert.equal(r.luzVisivel, false, 'sem a luz do holofote');
    assert.equal(r.navegacaoVisivel, false, 'sem menu e links de navegação');
    await ctx.close();
  });
}
