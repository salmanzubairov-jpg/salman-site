const menu = document.querySelector('.menu-disclosure');
menu?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});
menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => { menu.open = false; });
});
const motionButton = document.querySelector('.motion-toggle');
motionButton?.addEventListener('click', () => {
  const paused = document.documentElement.classList.toggle('motion-paused');
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = paused ? 'Включить анимацию' : 'Остановить анимацию';
});
