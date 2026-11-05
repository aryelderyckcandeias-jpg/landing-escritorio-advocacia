// Simula o GitHub Pages: o site fica em /landing-escritorio-advocacia/ e qualquer endereço
// inexistente recebe a página 404.html, com status 404.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('./helpers.cjs');

const PREFIXO = '/landing-escritorio-advocacia';
let app;
before(async () => { app = await iniciar({ prefixo: PREFIXO }); });
after(async () => { await app.encerrar(); });

// Abre um endereço e anota todo arquivo que falhou (status 400 ou mais).
async function abrir(caminho) {
  const ctx = await app.navegador.newContext();
  const pagina = await ctx.newPage();
  const falhas = [];
  pagina.on('response', (r) => { if (r.status() >= 400 && r.url() !== app.base + PREFIXO + caminho) falhas.push(`${r.status()} ${r.url()}`); });
  const resposta = await pagina.goto(app.base + PREFIXO + caminho);
  await pagina.evaluate(() => document.fonts.ready);
  return { ctx, pagina, falhas, status: resposta.status() };
}

for (const caminho of ['/', '/privacidade.html']) {
  test(`${caminho}: com o prefixo do GitHub Pages, todos os arquivos carregam`, async () => {
    const { ctx, pagina, falhas, status } = await abrir(caminho);
    assert.equal(status, 200);
    assert.deepEqual(falhas, []);
    assert.equal(await pagina.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(28, 17, 19)');
    await ctx.close();
  });
}

for (const caminho of ['/nao-existe', '/pasta/funda/de/verdade.html']) {
  test(`endereço inexistente (${caminho}) mostra a página 404 com estilos e fontes`, async () => {
    const { ctx, pagina, falhas, status } = await abrir(caminho);
    assert.equal(status, 404);
    assert.deepEqual(falhas, [], 'CSS, JS e fontes da 404 precisam carregar em qualquer profundidade');
    assert.equal((await pagina.textContent('h1')).trim(), 'Página não encontrada');
    assert.equal(await pagina.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(28, 17, 19)');
    assert.equal(await pagina.evaluate(() => [...document.fonts].some((f) => f.family.includes('Bodoni') && f.status === 'loaded')), true);
    await pagina.click('main .botao');
    await pagina.waitForLoadState();
    assert.equal(new URL(pagina.url()).pathname, PREFIXO + '/');
    assert.equal(await pagina.locator('#titulo-hero').count(), 1, 'voltou para a página inicial');
    await ctx.close();
  });
}

let AxeBuilder = null;
try { AxeBuilder = require('@axe-core/playwright').AxeBuilder; } catch { /* pulado abaixo */ }

test('página 404 sem violações no axe', { skip: !AxeBuilder && '@axe-core/playwright não instalado' }, async () => {
  const { ctx, pagina } = await abrir('/nao-existe');
  await pagina.waitForSelector('html.js-pronto');
  await pagina.evaluate(() => document.querySelectorAll('.tarjado').forEach((e) => e.classList.add('aberto')));
  await pagina.waitForTimeout(1100);
  const r = await new AxeBuilder({ page: pagina }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  assert.deepEqual(r.violations.map((v) => v.id), []);
  await ctx.close();
});
