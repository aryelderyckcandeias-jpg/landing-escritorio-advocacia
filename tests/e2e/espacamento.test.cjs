// WCAG 1.4.12: quem precisa de mais espaço entre letras, palavras e linhas (por extensão
// ou estilo próprio do navegador) não pode perder conteúdo. Simulamos esse estilo e
// conferimos que nada sai da tela nem é cortado.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('./helpers.cjs');

let app;
before(async () => { app = await iniciar(); });
after(async () => { await app.encerrar(); });

const ESPACAMENTO =
  '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }' +
  ' p { margin-bottom: 2em !important; }';

for (const caminho of ['/', '/privacidade.html']) {
  test(`${caminho}: espaçamento de texto aumentado não tira nada da tela`, async () => {
    const problemas = [];
    for (const largura of [320, 390, 480, 768, 1024, 1440]) {
      // bypassCSP: o estilo do usuário não passa pelo CSP da página; aqui simulamos isso.
      const ctx = await app.navegador.newContext({ viewport: { width: largura, height: 800 }, bypassCSP: true });
      const pagina = await ctx.newPage();
      await pagina.goto(app.base + caminho);
      await pagina.evaluate(() => document.fonts.ready);
      await pagina.addStyleTag({ content: ESPACAMENTO });
      const fora = await pagina.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return [...document.querySelectorAll('body *')]
          .filter((el) => !el.closest('.isca, .pular, details:not([open]) > :not(summary)'))
          .filter((el) => el.getBoundingClientRect().right > vw + 1)
          .map((el) => `${el.tagName.toLowerCase()}.${el.className}`);
      });
      if (fora.length) problemas.push(`${largura}px: ${[...new Set(fora)].join(', ')}`);
      await ctx.close();
    }
    assert.deepEqual(problemas, []);
  });
}
