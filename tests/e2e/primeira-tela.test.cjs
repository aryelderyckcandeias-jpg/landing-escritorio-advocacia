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
