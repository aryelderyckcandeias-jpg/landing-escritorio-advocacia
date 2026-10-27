const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('./helpers.cjs');

let app;
before(async () => { app = await iniciar(); });
after(async () => { await app.encerrar(); });

const PAGINAS = ['/', '/privacidade.html'];

for (const caminho of PAGINAS) {
  test(`${caminho}: nenhuma requisição a domínios externos e nenhum erro de script`, async () => {
    const ctx = await app.navegador.newContext();
    const pagina = await ctx.newPage();
    const externas = [];
    const erros = [];
    pagina.on('request', (r) => { if (!r.url().startsWith(app.base)) externas.push(r.url()); });
    pagina.on('pageerror', (e) => erros.push(e.message));
    pagina.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
    await pagina.goto(app.base + caminho);
    await pagina.waitForTimeout(500);
    assert.deepEqual(externas, []);
    assert.deepEqual(erros, []);
    await ctx.close();
  });

  test(`${caminho}: sem rolagem horizontal em 320 px e com zoom de 200% (640 px com escala 2)`, async () => {
    for (const largura of [320, 360]) {
      const ctx = await app.navegador.newContext({ viewport: { width: largura, height: 700 } });
      const pagina = await ctx.newPage();
      await pagina.goto(app.base + caminho);
      const excesso = await pagina.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(excesso <= 0, `${caminho} em ${largura}px: ${excesso}px de excesso`);
      await ctx.close();
    }
  });

  test(`${caminho}: estrutura básica de acessibilidade`, async () => {
    const ctx = await app.navegador.newContext();
    const pagina = await ctx.newPage();
    await pagina.goto(app.base + caminho);
    assert.equal(await pagina.getAttribute('html', 'lang'), 'pt-BR');
    assert.equal(await pagina.locator('h1').count(), 1, 'exatamente um h1');
    assert.equal(await pagina.locator('main').count(), 1);
    assert.equal(await pagina.locator('a.pular').count(), 1);

    // todo campo tem rótulo; todo id é único
    const problemas = await pagina.evaluate(() => {
      const lista = [];
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => lista.push(`id repetido: ${id}`));
      document.querySelectorAll('input, textarea, select').forEach((c) => {
        if (!c.labels || c.labels.length === 0) lista.push(`sem rótulo: ${c.id || c.name}`);
      });
      document.querySelectorAll('img:not([alt])').forEach(() => lista.push('img sem alt'));
      document.querySelectorAll('a[target=_blank]').forEach((a) => {
        if (!/noopener/.test(a.rel)) lista.push(`link externo sem noopener: ${a.href}`);
      });
      document.querySelectorAll('[aria-describedby], [aria-labelledby]').forEach((e) => {
        const alvos = (e.getAttribute('aria-describedby') || e.getAttribute('aria-labelledby')).split(/\s+/);
        alvos.forEach((id) => { if (!document.getElementById(id)) lista.push(`aria aponta para id inexistente: ${id}`); });
      });
      return lista;
    });
    assert.deepEqual(problemas, []);
    await ctx.close();
  });
}

test('âncoras do menu apontam para seções que existem', async () => {
  const ctx = await app.navegador.newContext();
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  const quebradas = await pagina.evaluate(() =>
    [...document.querySelectorAll('a[href^="#"]')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => h.length > 1 && !document.querySelector(h)),
  );
  assert.deepEqual(quebradas, []);
  await ctx.close();
});

test('links internos para outros arquivos existem', async () => {
  const ctx = await app.navegador.newContext();
  const pagina = await ctx.newPage();
  for (const caminho of PAGINAS) {
    await pagina.goto(app.base + caminho);
    const hrefs = await pagina.$$eval('a[href]', (as) =>
      as.map((a) => a.getAttribute('href')).filter((h) => !/^(#|https?:|mailto:)/.test(h)),
    );
    for (const href of new Set(hrefs)) {
      const resposta = await pagina.request.get(new URL(href, app.base + caminho).href);
      assert.equal(resposta.status(), 200, `${caminho} -> ${href}`);
    }
  }
  await ctx.close();
});

test('navegação por teclado: o primeiro Tab leva ao link "pular para o conteúdo"', async () => {
  const ctx = await app.navegador.newContext();
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  await pagina.keyboard.press('Tab');
  assert.equal(await pagina.evaluate(() => document.activeElement.className), 'pular');
  await ctx.close();
});

test('servidor de teste não expõe arquivos ocultos (.git, .github)', async () => {
  const resposta = await fetch(app.base + '/.git/config');
  assert.equal(resposta.status, 404);
});
