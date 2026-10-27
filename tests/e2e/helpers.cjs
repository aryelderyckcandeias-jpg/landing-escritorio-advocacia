// Utilitários dos testes E2E: sobe o servidor estático e abre o navegador.
// NAVEGADOR=firefox ou NAVEGADOR=webkit (motor do Safari) troca o navegador; o padrão é chromium.
const playwright = require('playwright');
const { criarServidor } = require('../../scripts/serve.cjs');

const NAVEGADOR = process.env.NAVEGADOR || 'chromium';

// Contexto de celular. O Firefox do Playwright não emula "isMobile", só o toque.
const celular = { hasTouch: true, ...(NAVEGADOR === 'firefox' ? {} : { isMobile: true }) };

async function iniciar() {
  const servidor = criarServidor();
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const navegador = await playwright[NAVEGADOR].launch();
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

module.exports = { iniciar, cobertura, celular, NAVEGADOR };
