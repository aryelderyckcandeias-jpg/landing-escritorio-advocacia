// Utilitários dos testes E2E: sobe o servidor estático e abre o Chromium.
const { chromium } = require('playwright');
const { criarServidor } = require('../../scripts/serve.cjs');

async function iniciar() {
  const servidor = criarServidor();
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const navegador = await chromium.launch();
  return {
    base,
    navegador,
    async encerrar() {
      await navegador.close();
      servidor.close();
    },
  };
}

// Estado da cobertura (::after) de um elemento .tarjado
const cobertura = (pagina, seletor) =>
  pagina.$eval(seletor, (el) => {
    const css = getComputedStyle(el, '::after');
    return { conteudo: css.content, display: css.display, transform: css.transform, aberto: el.classList.contains('aberto') };
  });

module.exports = { iniciar, cobertura };
