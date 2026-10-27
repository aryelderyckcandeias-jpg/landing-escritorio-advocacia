const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('./helpers.cjs');

let app;
before(async () => { app = await iniciar(); });
after(async () => { await app.encerrar(); });

// Registra requisições feitas E tentativas barradas pelo CSP (aparecem como erro no console).
function vigiarRede(pagina) {
  const registro = { requisicoes: [], violacoes: [] };
  pagina.on('request', (r) => registro.requisicoes.push(r.url()));
  pagina.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|Refused to/i.test(m.text())) registro.violacoes.push(m.text());
  });
  return registro;
}

async function abrir() {
  const ctx = await app.navegador.newContext();
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  await pagina.waitForSelector('html.js-pronto');
  return { ctx, pagina };
}

test('envio vazio mostra erros ligados aos campos e leva o foco ao primeiro', async () => {
  const { ctx, pagina } = await abrir();
  await pagina.click('#contato button[type=submit]');
  for (const campo of ['name', 'contact', 'subject', 'consent']) {
    assert.equal(await pagina.locator(`#erro-${campo}`).isVisible(), true, campo);
    assert.equal(await pagina.locator(`#campo-${campo}`).getAttribute('aria-invalid'), 'true', campo);
  }
  assert.equal(await pagina.evaluate(() => document.activeElement.id), 'campo-name');
  assert.match(await pagina.locator('#contato-status').textContent(), /corrigir/);
  await ctx.close();
});

test('formulário válido mostra aviso de demonstração e NÃO faz requisição de rede', async () => {
  const { ctx, pagina } = await abrir();
  const rede = vigiarRede(pagina);

  await pagina.fill('#campo-name', 'Ana Souza');
  await pagina.fill('#campo-contact', 'ana@exemplo.com');
  await pagina.fill('#campo-subject', 'Quero marcar uma conversa inicial.');
  await pagina.check('#campo-consent');
  await pagina.click('#contato button[type=submit]');

  await pagina.waitForFunction(() => /demonstra/i.test(document.getElementById('contato-status').textContent));
  await pagina.waitForTimeout(300);
  assert.deepEqual(rede.requisicoes, [], 'nenhuma requisição deve ser feita ao enviar');
  assert.deepEqual(rede.violacoes, [], 'nenhuma tentativa de rede (nem barrada pelo CSP)');
  assert.equal(await pagina.inputValue('#campo-name'), '', 'formulário é limpo depois');
  await ctx.close();
});

test('corrigir um erro limpa a mensagem na próxima tentativa', async () => {
  const { ctx, pagina } = await abrir();
  await pagina.click('#contato button[type=submit]');
  await pagina.fill('#campo-name', 'Ana Souza');
  await pagina.click('#contato button[type=submit]');
  assert.equal(await pagina.locator('#erro-name').isVisible(), false);
  assert.equal(await pagina.locator('#campo-name').getAttribute('aria-invalid'), null);
  await ctx.close();
});

test('campo oculto (robô) não é enviado nem revela o motivo', async () => {
  const { ctx, pagina } = await abrir();
  const rede = vigiarRede(pagina);
  await pagina.fill('#campo-name', 'Robô Silva');
  await pagina.fill('#campo-contact', 'robo@exemplo.com');
  await pagina.fill('#campo-subject', 'Mensagem automática de teste.');
  await pagina.check('#campo-consent');
  await pagina.$eval('#campo-website', (el) => { el.value = 'http://spam.example'; });
  await pagina.click('#contato button[type=submit]');
  await pagina.waitForTimeout(300);
  assert.deepEqual(rede.requisicoes, []);
  assert.deepEqual(rede.violacoes, []);
  assert.equal(await pagina.locator('.erro:visible').count(), 0);
  assert.equal(await pagina.inputValue('#campo-name'), 'Robô Silva', 'robô não limpa o formulário');
  await ctx.close();
});

test('campo oculto não recebe foco pelo teclado', async () => {
  const { ctx, pagina } = await abrir();
  assert.equal(await pagina.getAttribute('#campo-website', 'tabindex'), '-1');
  await ctx.close();
});

test('campos com fonte de pelo menos 16 px (o iPhone dá zoom sozinho em campos menores)', async () => {
  const { ctx, pagina } = await abrir();
  const tamanhos = await pagina.$$eval('#contato input:not([type=checkbox]):not(#campo-website), #contato textarea', (campos) =>
    campos.map((c) => [c.id, parseFloat(getComputedStyle(c).fontSize)]),
  );
  assert.ok(tamanhos.length >= 3);
  for (const [id, px] of tamanhos) assert.ok(px >= 16, `${id}: ${px}px`);
  await ctx.close();
});
