/*
  MENU (celular e tablet)
  O menu é um <details>: abre e fecha sem JavaScript. Aqui só melhoramos o uso:
  fecha ao escolher um link, com Esc (devolvendo o foco ao botão), ao tocar fora dele
  e quando o foco sai dele com Tab.
*/

export function initMenu(menu) {
  if (!menu) return;
  const botao = menu.querySelector('summary');
  const fechar = () => {
    menu.open = false;
  };

  menu.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) fechar();
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu.open) {
      fechar();
      botao.focus();
    }
  });

  document.addEventListener('click', (evento) => {
    if (menu.open && !menu.contains(evento.target)) fechar();
  });

  // Tab para fora do menu: o painel aberto cobriria o elemento que recebeu o foco.
  // Só fecha quando o foco vai para outro elemento (relatedTarget); um clique num espaço
  // vazio do painel também tira o foco, mas sem destino, e não deve fechar.
  menu.addEventListener('focusout', (evento) => {
    if (menu.open && evento.relatedTarget && !menu.contains(evento.relatedTarget)) fechar();
  });
}
