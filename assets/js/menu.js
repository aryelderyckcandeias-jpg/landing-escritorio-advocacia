/*
  MENU (celular e tablet)
  O menu é um <details>: abre e fecha sem JavaScript. Aqui só melhoramos o uso:
  fecha ao escolher um link, com Esc (devolvendo o foco ao botão) e ao tocar fora dele.
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
}
