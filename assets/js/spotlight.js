/*
  SPOTLIGHT (holofote)
  Move a luz da primeira tela junto com o cursor, via variáveis CSS --lx e --ly.
  - Em telas de toque (pointer: coarse) a luz anda sozinha por CSS; aqui só pausamos.
  - Com movimento reduzido, a luz fica parada.
  - Pausa quando a primeira tela sai da vista ou a aba fica oculta.
*/

// Inércia da luz no desktop: a cada 1/60 s ela anda esta fração do caminho até o cursor.
// 1 = segue sem atraso; 0.1 = bem suave. Valores entre 0.12 e 0.25 costumam parecer naturais.
const INERCIA = 0.18;
const QUADRO_60HZ = 1000 / 60;

export function initSpotlight(hero) {
  if (!hero) return;

  const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toque = window.matchMedia('(pointer: coarse)').matches;
  if (semMovimento) return;

  // Dois motivos independentes para pausar: um não pode desfazer o outro.
  let abaOculta = document.hidden;
  let foraDaTela = false;
  const atualizarPausa = () => hero.classList.toggle('holofote-pausado', abaOculta || foraDaTela);

  document.addEventListener('visibilitychange', () => {
    abaOculta = document.hidden;
    atualizarPausa();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entrada]) => {
      foraDaTela = !entrada.isIntersecting;
      atualizarPausa();
    }).observe(hero);
  }

  if (toque) return; // a animação CSS cuida do resto

  let alvoX = 0; // onde o cursor está
  let alvoY = 0;
  let x = null; // onde a luz está (null até o primeiro movimento)
  let y = null;
  let quadro = 0;
  let anterior = 0; // horário do quadro anterior

  const animar = (agora) => {
    // Conta pelo tempo, não por quadro: a luz anda igual em telas de 60 Hz e de 144 Hz.
    const passos = anterior ? Math.min((agora - anterior) / QUADRO_60HZ, 4) : 1;
    anterior = agora;
    const fator = 1 - (1 - INERCIA) ** passos;
    x += (alvoX - x) * fator;
    y += (alvoY - y) * fator;
    const chegou = Math.abs(alvoX - x) < 0.5 && Math.abs(alvoY - y) < 0.5;
    if (chegou) {
      x = alvoX;
      y = alvoY;
      anterior = 0;
    }
    hero.style.setProperty('--lx', `${x.toFixed(1)}px`);
    hero.style.setProperty('--ly', `${y.toFixed(1)}px`);
    quadro = chegou ? 0 : requestAnimationFrame(animar); // parado, não gasta nada
  };

  hero.addEventListener('pointermove', (evento) => {
    const caixa = hero.getBoundingClientRect();
    alvoX = evento.clientX - caixa.left;
    alvoY = evento.clientY - caixa.top;
    if (x === null) {
      // Primeiro movimento: a luz parte da posição inicial do CSS (--holofote-x e --holofote-y).
      const estilo = getComputedStyle(hero);
      x = emPixels(estilo.getPropertyValue('--lx'), caixa.width);
      y = emPixels(estilo.getPropertyValue('--ly'), caixa.height);
    }
    if (!quadro) quadro = requestAnimationFrame(animar);
  });
}

// "70%" vira 70% do tamanho; "300px" vira 300.
function emPixels(valor, tamanho) {
  const numero = parseFloat(valor);
  return valor.trim().endsWith('%') ? (numero / 100) * tamanho : numero;
}
