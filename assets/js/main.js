/*
  MAIN
  Ponto de entrada: liga cada recurso da página.
  A classe "js-pronto" avisa o CSS (e marca-js.js) de que tudo carregou.
*/
import { initReveal } from './reveal.js';
import { initSpotlight } from './spotlight.js';
import { initForm } from './form.js';

initReveal();
initSpotlight(document.querySelector('[data-holofote]'));
initForm(document.getElementById('contato'));

document.documentElement.classList.add('js-pronto');
