document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.querySelector('.hamburger-menu');
  const menu = document.querySelector('#mobile-menu');
  if (!trigger || !menu) return;
  let previousOverflow = '';

  function restorePage() {
    if (menu.open) return;
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousOverflow;
  }

  function closeMenu() {
    menu.close();
    restorePage();
  }

  trigger.addEventListener('click', () => {
    if (menu.open) return;
    previousOverflow = document.body.style.overflow;
    menu.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  });

  menu.querySelector('.close-btn').addEventListener('click', closeMenu);
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  menu.addEventListener('close', restorePage);
  menu.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeMenu();
  });
  menu.addEventListener('click', (event) => {
    if (event.target !== menu) return;
    const bounds = menu.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 800 && menu.open) closeMenu();
  });
});
