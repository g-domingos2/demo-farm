// =====================================================================
//  Painel lateral — cartões de pivô, badges de categoria e busca
// =====================================================================
import { FLOW_NOMINAL } from '../config.js';
import { STATUS, STATUS_ORDER, pivotStatusKey } from './status.js';
import { openPivotModal } from './pivot-modal.js';

const metricIco = (faClass) =>
  `<span class="map-card__metric-ico"><i class="fa-solid ${faClass}"></i></span>`;
const ICONS = {
  angle: metricIco('fa-compass'),
  flow: metricIco('fa-droplet'),
  clock: metricIco('fa-clock'),
  rain: metricIco('fa-cloud-rain'),
  refresh: metricIco('fa-rotate'),
  zap: metricIco('fa-bolt')
};

const pivotsPanel = document.getElementById('pivotsPanel');
const pivotsBadge = document.getElementById('pivotsBadge');
const searchInput = document.getElementById('mapSearchInput');

let pivotEls = [];
let flowShown = 0;

// helpers de escrita "só se mudou" — evita reparse/relayout do DOM quando o
// valor exibido é igual ao já escrito (painel é texto pra humano ler, não
// precisa reescrever a cada quadro só porque o loop rodou)
function setText(el, value) {
  if (el.textContent !== value) el.textContent = value;
}
function setClass(el, value) {
  if (el.className !== value) el.className = value;
}

let lastBadgeHtml = null;
function updatePivotsBadge(t, pivots, pumpOn) {
  const counts = {};
  pivots.forEach((pv) => {
    const key = pivotStatusKey(pv, t, pumpOn);
    counts[key] = (counts[key] || 0) + 1;
  });
  const html = STATUS_ORDER
    .filter((key) => counts[key])
    .map((key) => `<span class="map-card__equip-badge ${STATUS[key].badge}">${counts[key]} ${STATUS[key].short}</span>`)
    .join('');
  if (html !== lastBadgeHtml) {
    lastBadgeHtml = html;
    pivotsBadge.innerHTML = html;
  }
}

function createPivotCard(i) {
  const el = document.createElement('div');
  el.className = 'map-card__equip is-clickable';
  el.style.cursor = 'pointer';
  el.dataset.name = `pivô ${i + 1}`;
  el.dataset.pivotIndex = i;
  el.innerHTML = `
    <div class="map-card__equip-head">
      <span class="map-card__equip-name">Pivô ${i + 1}</span>
      <span class="map-card__equip-badge map-card__equip-badge--success" data-badge>EM OPERAÇÃO</span>
    </div>
    <div class="map-card__metrics map-card__metrics--three">
      <div class="map-card__metric">${ICONS.angle}<span class="map-card__metric-val" data-angle>0°</span><span class="map-card__tooltip">Ângulo</span></div>
      <div class="map-card__metric">${ICONS.flow}<span class="map-card__metric-val" data-flow>--</span><span class="map-card__tooltip">Vazão</span></div>
      <div class="map-card__metric">${ICONS.clock}<span class="map-card__metric-val" data-hours>00h00min</span><span class="map-card__tooltip">Horas ligado</span></div>
    </div>
    <div class="map-card__metrics map-card__metrics--three">
      <div class="map-card__metric">${ICONS.rain}<span class="map-card__metric-val" data-area>0%</span><span class="map-card__tooltip">Área irrigada</span></div>
      <div class="map-card__metric">${ICONS.refresh}<span class="map-card__metric-val" data-laps>0</span><span class="map-card__tooltip">Voltas completas</span></div>
      <div class="map-card__metric">${ICONS.zap}<span class="map-card__metric-val">220 V</span><span class="map-card__tooltip">Voltagem</span></div>
    </div>
    <div class="map-card__equip-foot"><span class="comm-label">Última leitura:</span> <span data-time>agora</span></div>`;
  el.addEventListener('click', () => openPivotModal({ name: `Pivô ${i + 1}`, pivotIndex: i }));
  pivotsPanel.appendChild(el);
  return {
    root: el,
    badge: el.querySelector('[data-badge]'),
    angle: el.querySelector('[data-angle]'),
    flow: el.querySelector('[data-flow]'),
    hours: el.querySelector('[data-hours]'),
    area: el.querySelector('[data-area]'),
    laps: el.querySelector('[data-laps]'),
    activeSeconds: 0
  };
}

export function createPivotPanel(pivots) {
  pivotEls = pivots.map((_, i) => createPivotCard(i));
  updatePivotsBadge(0, pivots, false);

  // busca filtra os cards de pivô pelo nome
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    pivotEls.forEach((pe) => {
      pe.root.style.display = (!q || pe.root.dataset.name.includes(q)) ? '' : 'none';
    });
  });
}

// contabilidade (activeSeconds/flowShown) precisa do dt real todo quadro pra
// não perder precisão, mas a ESCRITA no DOM é jogada fora do olho — o painel
// é lido por humano, 10x/s já é imperceptível e poupa reflow nos outros ~50
// quadros por segundo.
const PANEL_REFRESH_INTERVAL = 0.1;
let panelRefreshAccum = 0;

export function refreshPivotPanel(pivots, dt, t, pumpOn) {
  flowShown += (FLOW_NOMINAL - flowShown) * Math.min(1, dt * 3);
  pivots.forEach((pv, i) => {
    if (pv.active) pivotEls[i].activeSeconds += dt;
  });

  panelRefreshAccum += dt;
  if (panelRefreshAccum < PANEL_REFRESH_INTERVAL) return;
  panelRefreshAccum = 0;

  pivots.forEach((pv, i) => {
    const pe = pivotEls[i];
    const deg = ((pv.angle * 180 / Math.PI) % 360 + 360) % 360;
    setText(pe.angle, `${deg.toFixed(0)}°`);
    setText(pe.flow, (pv.active && pv.wet && pumpOn) ? `${flowShown.toFixed(0)} m³/h` : '--');
    const pct = Math.min(100, (pv.wetSwept / (Math.PI * 2)) * 100);
    setText(pe.area, `${pct.toFixed(0)}%`);
    setText(pe.laps, String(pv.laps));
    const totalMin = Math.floor(pe.activeSeconds / 60);
    setText(pe.hours, `${String(Math.floor(totalMin / 60)).padStart(2, '0')}h${String(totalMin % 60).padStart(2, '0')}min`);
    // status do pivô — mesma taxonomia da plataforma (irrigando / seco / ferti / finalizada / alerta)
    const status = STATUS[pivotStatusKey(pv, t, pumpOn)];
    setText(pe.badge, status.text);
    setClass(pe.badge, `map-card__equip-badge ${status.badge}`);
  });
  updatePivotsBadge(t, pivots, pumpOn);
}
