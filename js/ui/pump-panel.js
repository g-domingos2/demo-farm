// =====================================================================
//  Bombas: catálogo + estado + cartões do painel lateral.
//  Para adicionar uma bomba à demo, basta acrescentar uma entrada em
//  PUMP_CONFIG — o cartão, o badge da categoria e o modal já funcionam.
// =====================================================================
import { openPumpModal } from './pump-modal.js';

// drivesIrrigation: só a bomba marcada alimenta de fato os pivôs na demo
const PUMP_CONFIG = [
  { id: 'bomba01', name: 'Bomba 01', drivesIrrigation: true, lastComm: 'agora' },
  { id: 'bomba02', name: 'Bomba 02', lastComm: '31 mar 2026 13:52' },
  { id: 'bomba05', name: 'GH Bomba 05', lastComm: '03 jul 2026 14:10' }
];

const pumpPanel = document.getElementById('pumpPanel');
const pumpBadge = document.getElementById('pumpBadge');

// lido pela simulação a cada quadro: true quando a bomba da irrigação roda
export const pumpState = { on: false };

export const pumps = Object.fromEntries(
  PUMP_CONFIG.map((cfg) => [cfg.id, { ...cfg, running: false }])
);

function updatePumpCardUI(equipId) {
  const card = pumpPanel.querySelector(`.map-card__equip[data-equip-id="${equipId}"]`);
  if (!card) return;
  const { running } = pumps[equipId];
  const badge = card.querySelector('[data-pump-badge]');
  badge.textContent = running ? 'LIGADA VIA INTERNET' : 'DESLIGADA';
  badge.className = `map-card__equip-badge ${running ? 'map-card__equip-badge--info' : 'map-card__equip-badge--warn'}`;
  if (running) card.querySelector('[data-pump-comm]').textContent = 'agora';
}

function updatePumpCategoryBadge() {
  const running = Object.values(pumps).filter((p) => p.running).length;
  const off = Object.keys(pumps).length - running;
  pumpBadge.innerHTML =
    (running ? `<span class="map-card__equip-badge map-card__equip-badge--info">${running} Ligada via internet</span>` : '') +
    (off ? `<span class="map-card__equip-badge map-card__equip-badge--warn">${off} Desligada</span>` : '');
}

export function setPumpRunning(equipId, running) {
  if (!pumps[equipId]) return;
  pumps[equipId].running = running;
  updatePumpCardUI(equipId);
  updatePumpCategoryBadge();
  if (pumps[equipId].drivesIrrigation) pumpState.on = running;
}
window.IcSetBombaRunning = setPumpRunning;   // alias global usado fora dos módulos

export function initPumpPanel() {
  PUMP_CONFIG.forEach((cfg) => {
    const card = document.createElement('div');
    card.className = 'map-card__equip is-clickable';
    card.style.cursor = 'pointer';
    card.dataset.equipId = cfg.id;
    card.innerHTML = `
      <div class="map-card__equip-head">
        <span class="map-card__equip-name">${cfg.name}</span>
        <span class="map-card__equip-badge map-card__equip-badge--warn" data-pump-badge>DESLIGADA</span>
      </div>
      <div class="map-card__equip-foot"><span class="comm-label">Última comunicação:</span> <span data-pump-comm>${cfg.lastComm}</span></div>`;
    card.addEventListener('click', () => {
      openPumpModal({ name: cfg.name, equipId: cfg.id, running: pumps[cfg.id].running });
    });
    pumpPanel.appendChild(card);
  });

  updatePumpCategoryBadge();
}
