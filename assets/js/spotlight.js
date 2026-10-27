/*
  SPOTLIGHT (holofote)
  Move a luz da primeira tela junto com o cursor, via variáveis CSS --lx e --ly.
  - Em telas de toque (pointer: coarse) a luz anda sozinha por CSS; aqui só pausamos.
  - Com movimento reduzido, a luz fica parada.
  - Pausa quando a primeira tela sai da vista ou a aba fica oculta.
*/

export function initSpotlight(hero) {
  if (!hero) return;

  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toque = window.matchMedia('(pointer: coarse)').matches;
  if (semMovimento) return;

  const alternarPausa = (pausado) => hero.classList.toggle('holofote-pausado', pausado);

  document.addEventListener('visibilitychange', () => alternarPausa(document.hidden));

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entrada]) => alternarPausa(!entrada.isIntersecting)).observe(hero);
  }

  if (toque) return; // a animação CSS cuida do resto

  let quadro = 0;
  let x = 0;
  let y = 0;

  hero.addEventListener('pointermove', (evento) => {
    const caixa = hero.getBoundingClientRect();
    x = evento.clientX - caixa.left;
    y = evento.clientY - caixa.top;
    if (quadro) return; // já existe uma atualização agendada
    quadro = requestAnimationFrame(() => {
      hero.style.setProperty('--lx', `${x}px`);
      hero.style.setProperty('--ly', `${y}px`);
      quadro = 0;
    });
  });
}
