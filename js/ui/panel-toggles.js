// =====================================================================
//  Categorias expansíveis do painel (Pivôs / Bombas) + minimizar o card
// =====================================================================

export function wirePanelToggles() {
  document.querySelectorAll('.map-card__item--toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = document.querySelector(`.map-card__panel[data-panel="${btn.dataset.panel}"]`);
      const willOpen = !panel.classList.contains('is-open');
      panel.classList.toggle('is-open', willOpen);
      btn.classList.toggle('is-open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    });
  });

  // minimizar/restaurar o card inteiro (sobra só o cabeçalho)
  const card = document.getElementById('mapCard');
  const minBtn = document.getElementById('mapCardMinimize');
  if (card && minBtn) {
    minBtn.addEventListener('click', () => {
      const minimized = card.classList.toggle('is-minimized');
      minBtn.setAttribute('aria-expanded', String(!minimized));
      minBtn.title = minimized ? 'Expandir' : 'Minimizar';
    });
  }
}
