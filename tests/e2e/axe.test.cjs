// Auditoria automática de acessibilidade com axe-core.
// Se @axe-core/playwright não estiver instalado (ex.: sem acesso ao npm), o teste é pulado.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('./helpers.cjs');

let AxeBuilder = null;
try {
  AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright').AxeBuilder;
} catch {
  /* pulado abaixo */
}

let app;
before(async () => { app = await iniciar(); });
after(async () => { await app.encerrar(); });

for (const caminho of ['/', '/privacidade.html']) {
  test(`axe: ${caminho} sem violações`, { skip: !AxeBuilder && '@axe-core/playwright não instalado' }, async () => {
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const ctx = await app.navegador.newContext({ reducedMotion });
      const pagina = await ctx.newPage();
      await pagina.goto(app.base + caminho);
      await pagina.waitForSelector('html.js-pronto');
      await pagina.waitForTimeout(1200); // tarjas abertas antes de medir contraste
      await pagina.evaluate(() => document.querySelectorAll('.tarjado').forEach((e) => e.classList.add('aberto')));
      await pagina.waitForTimeout(1100);
      const resultado = await new AxeBuilder({ page: pagina }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      const resumo = resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
      assert.deepEqual(resumo, [], `violações (${reducedMotion})`);
      await ctx.close();
    }
  });
}
