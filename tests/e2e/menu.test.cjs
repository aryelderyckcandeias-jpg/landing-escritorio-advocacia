// Menu do celular e do tablet (abaixo de 960 px): um <details> que abre um painel com as seções.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('./helpers.cjs');

let app;
before(async () => { app = await iniciar(); });
after(async () => { await app.encerrar(); });

async function abrir(largura, opcoes = {}) {
  const ctx = await app.navegador.newContext({ viewport: { width: largura, height: 800 }, ...opcoes });
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  if (opcoes.javaScriptEnabled !== false) await pagina.waitForSelector('html.js-pronto');
  return { ctx, pagina };
}

const textos = (pagina, seletor) => pagina.$$eval(seletor, (els) =>
  els.filter((e) => e.getClientRects().length > 0).map((e) => e.textContent.trim()));

test('celular: o menu abre com as seções e o contato, e fecha ao escolher um link', async () => {
  const { ctx, pagina } = await abrir(390);
  assert.equal(await pagina.locator('.menu').isVisible(), false, 'menu do desktop escondido');
  assert.equal(await pagina.locator('.topo__contato').isVisible(), false, 'contato vai para dentro do menu');
  await pagina.click('.menu-movel summary');
  assert.deepEqual(await textos(pagina, '.menu-movel__painel a'),
    ['Atuação', 'Como atuamos', 'Sócios', 'Perguntas', 'Contato sigiloso']);
  await pagina.click('.menu-movel__painel a[href="#socios"]');
  assert.equal(await pagina.$eval('.menu-movel', (d) => d.open), false, 'menu fecha depois do toque');
  assert.equal(await pagina.evaluate(() => location.hash), '#socios');
  await ctx.close();
});

test('celular: Esc fecha o menu e devolve o foco ao botão', async () => {
  const { ctx, pagina } = await abrir(390);
  await pagina.focus('.menu-movel summary');
  await pagina.keyboard.press('Enter');
  assert.equal(await pagina.$eval('.menu-movel', (d) => d.open), true);
  await pagina.keyboard.press('Escape');
  assert.equal(await pagina.$eval('.menu-movel', (d) => d.open), false);
  assert.equal(await pagina.evaluate(() => document.activeElement.tagName), 'SUMMARY');
  await ctx.close();
});

test('celular: tocar fora fecha o menu', async () => {
  const { ctx, pagina } = await abrir(390);
  await pagina.click('.menu-movel summary');
  await pagina.mouse.click(200, 600);
  assert.equal(await pagina.$eval('.menu-movel', (d) => d.open), false);
  await ctx.close();
});

test('tablet (768 px): contato no cabeçalho, menu só com as seções', async () => {
  const { ctx, pagina } = await abrir(768);
  assert.equal(await pagina.locator('.topo__contato').isVisible(), true);
  await pagina.click('.menu-movel summary');
  assert.deepEqual(await textos(pagina, '.menu-movel__painel a'), ['Atuação', 'Como atuamos', 'Sócios', 'Perguntas']);
  await ctx.close();
});

test('desktop: menu completo no cabeçalho, sem o botão de menu', async () => {
  const { ctx, pagina } = await abrir(1280);
  assert.equal(await pagina.locator('.menu-movel').isVisible(), false);
  assert.equal(await pagina.locator('.menu').isVisible(), true);
  assert.equal(await pagina.locator('.topo__contato').isVisible(), true);
  await ctx.close();
});

test('sem JavaScript o menu do celular abre e fecha sozinho (details)', async () => {
  const { ctx, pagina } = await abrir(390, { javaScriptEnabled: false });
  await pagina.click('.menu-movel summary');
  assert.equal(await pagina.locator('.menu-movel__painel a[href="#atuacao"]').isVisible(), true);
  await pagina.click('.menu-movel summary');
  assert.equal(await pagina.locator('.menu-movel__painel a[href="#atuacao"]').isVisible(), false);
  await ctx.close();
});

test('o menu do celular e o do desktop levam às mesmas seções', async () => {
  const { ctx, pagina } = await abrir(1280);
  const destinos = await pagina.evaluate(() => ({
    desktop: [...document.querySelectorAll('.menu a')].map((a) => a.getAttribute('href')),
    celular: [...document.querySelectorAll('.menu-movel__painel a:not(.botao)')].map((a) => a.getAttribute('href')),
  }));
  assert.deepEqual(destinos.celular, destinos.desktop);
  await ctx.close();
});
