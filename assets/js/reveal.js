/*
  REVEAL (tarjas)
  Abre, uma única vez, a tarja de cada elemento .tarjado quando ele aparece na tela.
  O texto sempre existe no HTML; a tarja é só uma camada visual (veja effects.css).
*/

const CLASSE_ABERTO = 'aberto';
const VISIBILIDADE_MINIMA = 0.4; // 40% do título visível

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
    { threshold: VISIBILIDADE_MINIMA },
  );

  alvos.forEach((alvo) => observer.observe(alvo));
}
