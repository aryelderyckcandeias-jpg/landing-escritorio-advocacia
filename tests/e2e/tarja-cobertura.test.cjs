// A tarja fechada precisa cobrir o título inteiro: acentos, cedilha, "g" e "q".
// Os valores --tarja-vao, --tarja-descida e a altura de linha dos títulos foram ajustados
// medindo pixels; este teste mede de novo, em três larguras, para nada vazar depois de mudanças.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar } = require('./helpers.cjs');

let app;
before(async () => { app = await iniciar(); });
after(async () => { await app.encerrar(); });

// Conta pixels claros (texto --papel) numa captura PNG, decodificando no próprio navegador.
// Devolve também onde eles estão (linhas e colunas), para a mensagem de falha ser útil.
async function pixelsClaros(decodificador, png) {
  return decodificador.evaluate(async (base64) => {
    const imagem = new Image();
    imagem.src = `data:image/png;base64,${base64}`;
    await imagem.decode();
    const tela = document.createElement('canvas');
    tela.width = imagem.width;
    tela.height = imagem.height;
    const desenho = tela.getContext('2d');
    desenho.drawImage(imagem, 0, 0);
    const { data } = desenho.getImageData(0, 0, tela.width, tela.height);
    const r = { claros: 0, yMin: Infinity, yMax: -Infinity, xMin: Infinity, xMax: -Infinity };
    for (let i = 0; i < data.length; i += 4) {
      if (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2] <= 110) continue;
      const x = (i / 4) % tela.width;
      const y = Math.floor(i / 4 / tela.width);
      r.claros += 1;
      r.yMin = Math.min(r.yMin, y);
      r.yMax = Math.max(r.yMax, y);
      r.xMin = Math.min(r.xMin, x);
      r.xMax = Math.max(r.xMax, x);
    }
    return r;
  }, png.toString('base64'));
}

for (const [largura, altura] of [[1440, 900], [390, 844], [320, 640]]) {
  test(`${largura}px: a tarja fechada não deixa nenhum pedaço de texto aparecer`, async () => {
    const ctx = await app.navegador.newContext({ viewport: { width: largura, height: altura } });
    const pagina = await ctx.newPage();
    const decodificador = await ctx.newPage(); // about:blank, sem o CSP da página
    await pagina.goto(app.base + '/');
    await pagina.waitForSelector('html.js-pronto');
    await pagina.evaluate(() => document.fonts.ready);
    const ids = await pagina.$$eval('.tarjado', (els) => els.map((e) => e.id));
    // Passa por todos os títulos: cada tarja abre e deixa de ser observada (não reabre depois).
    for (const id of ids) {
      await pagina.$eval('#' + id, (el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await pagina.waitForFunction((alvo) => document.getElementById(alvo).classList.contains('aberto'), id);
    }
    // Fecha todas e espera a animação de fechar terminar.
    await pagina.evaluate(() => document.querySelectorAll('.tarjado').forEach((e) => e.classList.remove('aberto')));
    await pagina.waitForTimeout(1100);
    const vazamentos = [];
    for (const id of ids) {
      await pagina.$eval('#' + id, (el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      const caixa = await pagina.locator('#' + id).boundingBox();
      const margem = 10;
      const x = Math.max(0, caixa.x - margem);
      const png = await pagina.screenshot({ clip: { x, y: caixa.y - margem, width: Math.min(largura - x, caixa.width + 2 * margem), height: caixa.height + 2 * margem } });
      const r = await pixelsClaros(decodificador, png);
      if (r.claros > 0) {
        // Onde vazou, em relação ao título: negativo = acima do topo; positivo = abaixo do pé.
        const fonte = await pagina.$eval('#' + id, (el) => parseFloat(getComputedStyle(el).fontSize));
        const acima = r.yMin - margem;
        const abaixo = r.yMax - margem - caixa.height;
        const em = (px) => (px / fonte).toFixed(3);
        vazamentos.push(`${id}: ${r.claros} px, linhas ${acima}..${abaixo} px do topo/pé `
          + `(${em(acima)}em / ${em(abaixo)}em), colunas ${r.xMin}..${r.xMax}, fonte ${fonte}px, caixa ${caixa.height.toFixed(1)}px`);
      }
    }
    assert.deepEqual(vazamentos, []);
    await ctx.close();
  });
}
