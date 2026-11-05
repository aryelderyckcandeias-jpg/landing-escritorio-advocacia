const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, celular } = require('./helpers.cjs');

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

  // 320 px equivale a zoom de 400% numa tela de 1280 px; 640 px, a zoom de 200%.
  test(`${caminho}: sem rolagem horizontal em 320, 360 e 640 px (zoom de 400% e 200%)`, async () => {
    for (const largura of [320, 360, 640]) {
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

// WCAG 2.5.8: alvos de toque com pelo menos 24x24 px. Links no meio de uma frase são exceção.
for (const caminho of PAGINAS) {
  test(`${caminho}: alvos de toque com pelo menos 24x24 px no celular`, async () => {
    const ctx = await app.navegador.newContext({ viewport: { width: 390, height: 844 }, ...celular });
    const pagina = await ctx.newPage();
    await pagina.goto(app.base + caminho);
    const pequenos = await pagina.evaluate(() =>
      [...document.querySelectorAll('a, button, summary, input, textarea')]
        .filter((el) => !el.closest('.isca'))
        .filter((el) => {
          const b = el.getBoundingClientRect();
          if (b.width === 0 && b.height === 0) return false; // invisível nesta largura
          const frase = el.parentElement.textContent.trim();
          const noMeioDaFrase = el.tagName === 'A' && frase !== el.textContent.trim();
          return !noMeioDaFrase && (b.width < 24 || b.height < 24);
        })
        .map((el) => `${el.id || el.textContent.trim()}: ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`),
    );
    assert.deepEqual(pequenos, []);
    await ctx.close();
  });
}

test('perguntas: abrir uma fecha a que estava aberta', async () => {
  const ctx = await app.navegador.newContext();
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  await pagina.click('.faq details:nth-child(1) summary');
  await pagina.click('.faq details:nth-child(2) summary');
  const abertas = await pagina.$$eval('.faq details', (lista) => lista.map((d) => d.open));
  assert.deepEqual(abertas, [false, true, false, false, false]);
  await ctx.close();
});

test('seção Sigilo: entre Como atuamos e Sócios, com título tarjado e o espaçamento certo', async () => {
  const ctx = await app.navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  const r = await pagina.evaluate(() => {
    const ordem = [...document.querySelectorAll('main > section')].map((s) => s.id);
    const px = (sel, lado) => parseFloat(getComputedStyle(document.querySelector(sel))[lado]);
    return {
      ordem,
      tarjado: document.querySelector('#sigilo h2')?.classList.contains('tarjado'),
      itens: document.querySelectorAll('#sigilo li').length,
      // Fundos diferentes: respiro inteiro. Mesmo fundo (Sócios -> Perguntas): meio respiro.
      sociosTopo: px('#socios', 'paddingTop'),
      sigiloPe: px('#sigilo', 'paddingBottom'),
      perguntasTopo: px('#perguntas', 'paddingTop'),
    };
  });
  assert.deepEqual(r.ordem.slice(2, 5), ['como-atuamos', 'sigilo', 'socios']);
  assert.equal(r.tarjado, true);
  assert.ok(r.itens >= 3, `${r.itens} itens`);
  assert.equal(r.sociosTopo, r.sigiloPe, 'Sócios tem fundo diferente do Sigilo: respiro inteiro');
  assert.equal(r.perguntasTopo, r.sociosTopo / 2, 'Perguntas repete o fundo de Sócios: meio respiro');
  await ctx.close();
});

// Alto contraste do Windows: as cores de fundo somem. Botões precisam de contorno próprio.
test('alto contraste: todo botão tem contorno visível', async () => {
  const ctx = await app.navegador.newContext({ viewport: { width: 1280, height: 800 }, forcedColors: 'active' });
  const pagina = await ctx.newPage();
  await pagina.goto(app.base + '/');
  const semContorno = await pagina.$$eval('.botao, .menu-movel summary', (botoes) => botoes
    .filter((b) => b.getClientRects().length > 0)
    .filter((b) => { const c = getComputedStyle(b); return c.borderTopStyle === 'none' || parseFloat(c.borderTopWidth) < 1; })
    .map((b) => b.textContent.trim()));
  assert.deepEqual(semContorno, []);
  await ctx.close();
});

// Link que abre em nova aba avisa isso a quem usa leitor de tela.
for (const caminho of PAGINAS) {
  test(`${caminho}: links que abrem em nova aba avisam`, async () => {
    const ctx = await app.navegador.newContext();
    const pagina = await ctx.newPage();
    await pagina.goto(app.base + caminho);
    const semAviso = await pagina.$$eval('a[target=_blank]', (links) =>
      links.filter((a) => !/nova aba/.test(a.textContent)).map((a) => a.textContent.trim()));
    assert.deepEqual(semAviso, []);
    await ctx.close();
  });
}
