/*
  REVEAL (tarjas)
  Abre, uma única vez, a tarja de cada elemento .tarjado quando ele aparece na tela.
  O texto sempre existe no HTML; a tarja é só uma camada visual (veja effects.css).
*/

const CLASSE_ABERTO = 'aberto';
// A tarja abre quando qualquer parte do título (limiar 0) passa da linha a 75% da altura da tela:
// assim ela abre onde a pessoa está olhando, não na beirada de baixo. O limiar 0 garante que
// até um título mais alto que essa área (zoom grande) abra.
const VISIBILIDADE_MINIMA = 0;
const AREA_DE_ABERTURA = '0px 0px -25% 0px'; // tira o quarto de baixo da tela

export function initReveal(root = document) {
  const alvos = root.querySelectorAll('.tarjado');
  const semObserver = !('IntersectionObserver' in window);
  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sem suporte, ou com movimento reduzido: nada de tarja, tudo aberto.
  if (semObserver || semMovimento) {
    alvos.forEach((alvo) => alvo.classList.add(CLASSE_ABERTO));
    return;
  }

  const observer = new IntersectionObserver(
    (entradas, obs) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        entrada.target.classList.add(CLASSE_ABERTO);
        obs.unobserve(entrada.target); // abre uma vez só
      }
    },
    { threshold: VISIBILIDADE_MINIMA, rootMargin: AREA_DE_ABERTURA },
  );

  alvos.forEach((alvo) => observer.observe(alvo));
}
