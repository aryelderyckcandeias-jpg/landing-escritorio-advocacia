// TEMPORÁRIO (branch diagnostico-tarja): mede onde a tinta dos títulos começa e termina,
// sem tarja (movimento reduzido), em cada navegador. Falha de propósito para o CI mostrar os números.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, NAVEGADOR } = require('./helpers.cjs');
let app;
before(async () => { app = await iniciar(); });
after(async () => { await app.encerrar(); });

test(`medição de tinta (${NAVEGADOR})`, async () => {
  const linhas = [];
  for (const [w, h] of [[1440, 900], [390, 844], [320, 640]]) {
    const ctx = await app.navegador.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    const dec = await ctx.newPage();
    await p.goto(app.base + '/');
    await p.evaluate(() => document.fonts.ready);
    for (const id of await p.$$eval('.tarjado', (els) => els.map((e) => e.id))) {
      await p.$eval('#' + id, (el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      const c = await p.locator('#' + id).boundingBox();
      const info = await p.$eval('#' + id, (el) => ({ fs: parseFloat(getComputedStyle(el).fontSize), lh: parseFloat(getComputedStyle(el).lineHeight) }));
      const m = 20;
      const png = await p.screenshot({ clip: { x: Math.max(0, c.x - 4), y: c.y - m, width: Math.min(w - Math.max(0, c.x - 4), c.width + 8), height: c.height + 2 * m } });
      const r = await dec.evaluate(async (b64) => {
        const im = new Image(); im.src = `data:image/png;base64,${b64}`; await im.decode();
        const t = document.createElement('canvas'); t.width = im.width; t.height = im.height;
        const g = t.getContext('2d'); g.drawImage(im, 0, 0);
        const { data } = g.getImageData(0, 0, t.width, t.height);
        let y0 = Infinity; let y1 = -Infinity;
        for (let i = 0; i < data.length; i += 4) {
          if (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2] > 110) { const y = Math.floor(i / 4 / t.width); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        }
        return { y0, y1 };
      }, png.toString('base64'));
      const linhasDoTitulo = Math.round(c.height / info.lh);
      const topo = (r.y0 - m) / info.fs;
      const pe = (r.y1 + 1 - m - c.height) / info.fs;
      linhas.push(`${w}|${id}|fs${info.fs.toFixed(1)}|${linhasDoTitulo}l|topo ${topo.toFixed(3)}em|pe ${pe.toFixed(3)}em`);
    }
    await ctx.close();
  }
  assert.deepEqual(linhas, ['(medição)']);
});
