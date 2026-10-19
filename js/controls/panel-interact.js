// =====================================================================
//  Interação com a porta do painel do pivô — chegando perto (modo
//  fazendeiro) aparece a dica "Pressione E"; a tecla E abre/fecha.
// =====================================================================
const RANGE = 5;          // distância (unidades da cena) até a porta pra dica aparecer / E funcionar
const HINT_DURATION = 3500; // ms que a dica fica visível a cada aproximação — depois some sozinha

export function createPanelInteract(pivots, farmerControl) {
  const hintEl = document.getElementById('panelDoorHint');
  let nearIdx = -1;
  let eHeld = false;
  let hintTimer = null;

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyE' || eHeld) return;
    eHeld = true;
    if (nearIdx < 0) return;
    const pv = pivots[nearIdx];
    pv.doorOpen = !pv.doorOpen;
  });
  window.addEventListener('keyup', (e) => { if (e.code === 'KeyE') eHeld = false; });

  function update() {
    const farmerPos = farmerControl.getPosition();
    const wasNear = nearIdx >= 0;
    nearIdx = -1;
    if (farmerPos) {
      let best = RANGE;
      pivots.forEach((pv, i) => {
        if (!pv.doorHinge) return;
        const d = farmerPos.distanceTo(pv.doorPos);
        if (d < best) { best = d; nearIdx = i; }
      });
    }
    // dica aparece só no instante em que entra no alcance — some sozinha depois,
    // mesmo que o personagem continue parado ali (não fica piscando/preso na tela)
    if (nearIdx >= 0 && !wasNear && hintEl) {
      hintEl.style.display = '';
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => { hintEl.style.display = 'none'; }, HINT_DURATION);
    } else if (nearIdx < 0 && wasNear) {
      clearTimeout(hintTimer);
      if (hintEl) hintEl.style.display = 'none';
    }
  }

  return { update };
}
