const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, cobertura } = require('./helpers.cjs');

let app;
before(async () => { app = await iniciar(); });
after(async () => { await app.encerrar(); });

test('tarja do título principal abre sozinha ao carregar', async () => {
  const ctx = await app.navegador.newContext();
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  await pagina.waitForSelector('#titulo-hero.aberto');
  await pagina.waitForTimeout(1100); // duração da animação (900 ms)
  const c = await cobertura(pagina, '#titulo-hero');
  assert.match(c.transform, /matrix\(0, 0, 0, 1|none/, `esperava scaleX(0), veio ${c.transform}`);
  await ctx.close();
});

test('título abaixo da dobra só abre ao rolar, e continua aberto depois', async () => {
  const ctx = await app.navegador.newContext({ viewport: { width: 1280, height: 720 } });
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  await pagina.waitForSelector('html.js-pronto');
  assert.equal((await cobertura(pagina, '#titulo-contato')).aberto, false);

  await pagina.locator('#titulo-contato').scrollIntoViewIfNeeded();
  await pagina.waitForSelector('#titulo-contato.aberto');

  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForTimeout(300);
  assert.equal((await cobertura(pagina, '#titulo-contato')).aberto, true, 'a tarja não pode fechar de novo');
  await ctx.close();
});

test('sem JavaScript: nenhuma tarja e todo o texto visível', async () => {
  const ctx = await app.navegador.newContext({ javaScriptEnabled: false });
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  const c = await cobertura(pagina, '#titulo-hero');
  assert.equal(c.conteudo, 'none');
  assert.equal(await pagina.locator('#titulo-hero').isVisible(), true);
  assert.equal(await pagina.locator('#contato').isVisible(), true);
  await ctx.close();
});

test('movimento reduzido: sem tarja e sem animação', async () => {
  const ctx = await app.navegador.newContext({ reducedMotion: 'reduce' });
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  await pagina.waitForSelector('html.js-pronto');
  const c = await cobertura(pagina, '#titulo-hero');
  assert.equal(c.display, 'none');
  const luz = await pagina.$eval('.hero', (el) => getComputedStyle(el, '::before').animationName);
  assert.equal(luz, 'none');
  await ctx.close();
});

test('falha do script principal: depois de 3 s a tarja é removida e o texto aparece', async () => {
  const ctx = await app.navegador.newContext();
  const pagina = await ctx.newPage();
  await pagina.route('**/assets/js/main.js', (rota) => rota.abort());
  await pagina.goto(app.base + '/');
  assert.equal(await pagina.evaluate(() => document.documentElement.classList.contains('js')), true);
  await pagina.waitForTimeout(3400);
  assert.equal(await pagina.evaluate(() => document.documentElement.classList.contains('js')), false);
  assert.equal((await cobertura(pagina, '#titulo-hero')).conteudo, 'none');
  await ctx.close();
});

test('holofote segue o ponteiro no desktop', async () => {
  const ctx = await app.navegador.newContext({ viewport: { width: 1280, height: 800 } });
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  await pagina.waitForSelector('html.js-pronto');
  await pagina.mouse.move(400, 300);
  await pagina.waitForTimeout(150);
  const lx = await pagina.$eval('.hero', (el) => el.style.getPropertyValue('--lx'));
  assert.match(lx, /^\d+(\.\d+)?px$/);
  await ctx.close();
});

test('toque: a luz anda sozinha e fica pausada fora da tela, mesmo depois de trocar de aba', async () => {
  const ctx = await app.navegador.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  await pagina.waitForSelector('html.js-pronto');
  const luz = () => pagina.$eval('.hero', (el) => ({
    animacao: getComputedStyle(el, '::before').animationName,
    pausada: el.classList.contains('holofote-pausado'),
  }));
  assert.equal((await luz()).animacao, 'varredura', 'no toque a luz anda por animação CSS');
  assert.equal((await luz()).pausada, false);

  await pagina.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await pagina.waitForFunction(() => document.querySelector('.hero').classList.contains('holofote-pausado'));

  // Simula sair da aba e voltar com a primeira tela ainda fora da vista.
  await pagina.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.equal((await luz()).pausada, true, 'voltar à aba não pode religar a luz fora da tela');

  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForFunction(() => !document.querySelector('.hero').classList.contains('holofote-pausado'));
  await ctx.close();
});
