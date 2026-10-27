/*
  MARCA JS
  Roda no <head>, antes da primeira pintura. Marca a página com a classe "js"
  para o CSS saber que as tarjas podem existir.

  Rede de segurança: se main.js não confirmar que carregou em 3 segundos
  (classe "js-pronto"), a marca é removida e o texto aparece normalmente.
  Assim, uma falha de script nunca deixa um título coberto para sempre.
*/
(function () {
  var html = document.documentElement;
  html.classList.add('js');
  window.setTimeout(function () {
    if (!html.classList.contains('js-pronto')) html.classList.remove('js');
  }, 3000);
})();
