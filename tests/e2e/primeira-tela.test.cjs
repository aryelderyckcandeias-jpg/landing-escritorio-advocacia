// A primeira tela precisa caber: título legível e o botão principal visível sem rolar.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('./helpers.cjs');

let app;
before(async () => { app = await iniciar(); });
after(async () => { await app.encerrar(); });

const TELAS = [
  [1440, 900],
  [1280, 720],
  [1024, 768],
  [390, 844],
];

for (const [largura, altura] of TELAS) {
  test(`${largura}x${altura}: título em até 3 linhas e botão principal visível sem rolar`, async () => {
    const ctx = await app.navegador.newContext({ viewport: { width: largura, height: altura } });
    const pagina = await ctx.newPage();
    await pagina.goto(app.base + '/');
    await pagina.evaluate(() => document.fonts.ready);
    const medida = await pagina.evaluate(() => {
      const h1 = document.querySelector('#titulo-hero');
      const linhas = Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight));
      const botao = document.querySelector('.hero__acoes .botao').getBoundingClientRect();
      return { linhas, baseDoBotao: Math.ceil(botao.bottom), altura: window.innerHeight };
    });
    assert.ok(medida.linhas <= 3, `título em ${medida.linhas} linhas`);
    assert.ok(medida.baseDoBotao <= medida.altura, `botão termina em ${medida.baseDoBotao}px, tela tem ${medida.altura}px`);
    await ctx.close();
  });
}

// Celular deitado: tela baixa. O título não pode ocupar a tela toda.
for (const [largura, altura] of [[844, 390], [667, 375]]) {
  test(`${largura}x${altura} (toque, deitado): título ocupa no máximo metade da altura da tela`, async () => {
    const ctx = await app.navegador.newContext({ viewport: { width: largura, height: altura }, hasTouch: true });
    const pagina = await ctx.newPage();
    await pagina.goto(app.base + '/');
    await pagina.evaluate(() => document.fonts.ready);
    const alturaTitulo = await pagina.$eval('#titulo-hero', (h1) => h1.getBoundingClientRect().height);
    assert.ok(alturaTitulo <= altura / 2, `título com ${Math.round(alturaTitulo)}px numa tela de ${altura}px`);
    await ctx.close();
  });
}

// Zoom de 200% no computador = janela com metade dos pixels CSS e cada pixel CSS com o dobro do tamanho.
// O título precisa crescer na tela (WCAG 1.4.4). Antes ele era limitado pela altura e não crescia nada.
for (const [largura, altura] of [[1280, 720], [1440, 900]]) {
  test(`${largura}x${altura}: com zoom de 200% o título cresce na tela`, async () => {
    const tamanho = async (w, h, escala) => {
      const ctx = await app.navegador.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: escala });
      const pagina = await ctx.newPage();
      await pagina.goto(app.base + '/');
      await pagina.evaluate(() => document.fonts.ready);
      const px = await pagina.$eval('#titulo-hero', (h1) => parseFloat(getComputedStyle(h1).fontSize));
      await ctx.close();
      return px * escala; // tamanho em pixels da tela
    };
    const normal = await tamanho(largura, altura, 1);
    const ampliado = await tamanho(largura / 2, altura / 2, 2);
    assert.ok(ampliado / normal >= 1.5, `cresceu só ${(ampliado / normal).toFixed(2)}x`);
  });
}
