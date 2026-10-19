// =====================================================================
//  Modal de operação do pivô — dial de segmentos (SVG) + formulário
//  de irrigação. Escreve direto no estado do pivô (entities/pivot.js);
//  a simulação lê esse estado a cada quadro.
//  Estilos em css/partials/_modals.css; shell em ui/modal.js.
// =====================================================================
import { openModal, nowLocalIso } from './modal.js';

const SEGMENT_COLORS = ['rgb(0, 31, 153)', 'rgb(160, 0, 229)', 'rgb(0, 196, 179)', 'rgb(82, 183, 0)'];

const toDeg360 = (rad) => ((rad * 180 / Math.PI) % 360 + 360) % 360;

function describeWedge(cx, cy, r, a0, a1) {
  const p0x = cx + r * Math.cos(a0), p0y = cy + r * Math.sin(a0);
  const p1x = cx + r * Math.cos(a1), p1y = cy + r * Math.sin(a1);
  return `M${cx},${cy} L${p0x.toFixed(1)},${p0y.toFixed(1)} ` +
    `A${r},${r} 0 0 1 ${p1x.toFixed(1)},${p1y.toFixed(1)} Z`;
}

function buildDialSVG(cx, cy, r) {
  const wedges = SEGMENT_COLORS.map((color, i) => {
    const a0 = (-90 + i * 90) * Math.PI / 180, a1 = (-90 + (i + 1) * 90) * Math.PI / 180;
    return `<path d="${describeWedge(cx, cy, r, a0, a1)}" fill="${color}" fill-opacity="0.78" stroke="#fff" stroke-width="2"></path>`;
  }).join('');

  // marcações de grau (a cada 10°, maiores a cada 30°) + rótulos 0/90/180/270
  let ticks = '';
  for (let deg = 0; deg < 360; deg += 10) {
    const a = (deg - 90) * Math.PI / 180;
    const big = deg % 30 === 0;
    const r0 = r - (big ? 9 : 5), r1 = r - 1;
    ticks += `<line x1="${(cx + r0 * Math.cos(a)).toFixed(1)}" y1="${(cy + r0 * Math.sin(a)).toFixed(1)}"` +
      ` x2="${(cx + r1 * Math.cos(a)).toFixed(1)}" y2="${(cy + r1 * Math.sin(a)).toFixed(1)}"` +
      ` stroke="#fff" stroke-opacity="0.8" stroke-width="${big ? 1.8 : 1.1}"></line>`;
  }
  const labels = [0, 90, 180, 270].map((deg) => {
    const a = (deg - 90) * Math.PI / 180;
    return `<text x="${(cx + (r + 13) * Math.cos(a)).toFixed(1)}" y="${(cy + (r + 13) * Math.sin(a)).toFixed(1)}"` +
      ` font-size="10" fill="#334155" text-anchor="middle" dominant-baseline="middle">${deg}°</text>`;
  }).join('');

  return `<svg viewBox="0 -10 ${cx * 2} ${cy * 2 + 20}" width="100%" height="100%">` +
    `<circle cx="${cx}" cy="${cy}" r="${r + 2}" fill="#eef2f7"></circle>` +
    wedges + ticks + labels +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="2"></circle>` +
    `<g id="dialPointerGroup">` +
      `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r}" stroke="rgba(0,0,0,0.8)" stroke-width="3.5" stroke-linecap="round"></line>` +
      `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r}" stroke="#fff" stroke-width="2" stroke-linecap="round"></line>` +
      `<circle cx="${cx}" cy="${cy}" r="6" fill="#fff" stroke="rgba(0,0,0,0.45)" stroke-width="2"></circle>` +
    `</g></svg>`;
}

function dialogHTML(name, pv, running) {
  const legend = SEGMENT_COLORS.map((c, i) =>
    `<div class="op-modal__legend-item"><span class="op-modal__legend-color" style="background:${c}"></span><span>Segmento ${i + 1}</span></div>`
  ).join('');

  return `
    <div class="op-modal__dialog">
      <header class="op-modal__header">
        <div class="op-modal__title-row"><h3 class="op-modal__title">${name}</h3>
          <span class="op-modal__peak-icon" title="Horário de pico habilitado"><i class="fa-solid fa-circle-exclamation"></i></span></div>
        <div class="op-modal__header-center"><button type="button" class="op-modal__load-btn" id="opLoadBtn">Carregar última irrigação</button></div>
        <div class="op-modal__header-actions">
          <button type="button" class="op-modal__details-btn" data-close>Detalhes</button>
          <button type="button" class="op-modal__close" data-close aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </header>
      <div class="op-modal__content">
        <span class="op-modal__pos-badge"><i class="fa-solid fa-circle-info"></i> Ângulo atual: <span id="opCurAngle">${toDeg360(pv.angle).toFixed(1)}°</span></span>
        <div class="op-modal__visualizer">
          <div class="op-modal__dial-container" id="opDial">${buildDialSVG(100, 100, 88)}</div>
          <div class="op-modal__legend">${legend}</div>
        </div>
        <div class="op-form__summary-bar">
          <div class="op-form__summary-pills">
            <div class="op-form__summary-item is-active">
              <span class="op-form__summary-title">Operação 1</span>
              <div class="op-form__summary-pill"><span>Agora</span><span class="op-form__summary-sep">|</span>
                <i class="fa-solid fa-arrow-rotate-right"></i><span class="op-form__summary-sep">|</span>
                <i class="fa-solid fa-droplet"></i><span class="op-form__summary-sep">|</span><span>${pv.pct.toFixed(2)}%</span></div>
            </div>
          </div>
        </div>
        <div class="op-form__grid">
          <div class="op-form__group">
            <label class="op-form__label">Modo de início</label>
            <select class="op-form__select" id="opStartMode">
              <option value="agora">Agora</option>
              <option value="agendado">Agendado</option>
              <option value="pos_pico">Após horário de pico</option>
            </select>
          </div>
          <div class="op-form__group">
            <label class="op-form__label">Data de início</label>
            <div class="op-form__input--with-suffix"><input type="datetime-local" id="opStartAt" value="${nowLocalIso()}" disabled>
              <div class="op-form__input-suffix"><i class="fa-regular fa-calendar"></i></div></div>
          </div>
          <div class="op-form__group">
            <label class="op-form__label">Direção</label>
            <div class="op-form__segmented" id="opDirGroup">
              <button type="button" class="op-form__seg-btn${pv.dir === 1 ? ' is-active' : ''}" data-value="avanco">Avanço <i class="fa-solid fa-arrow-rotate-right"></i></button>
              <button type="button" class="op-form__seg-btn${pv.dir === -1 ? ' is-active' : ''}" data-value="reverso">Reverso <i class="fa-solid fa-arrow-rotate-left"></i></button>
            </div>
          </div>
          <div class="op-form__group">
            <label class="op-form__label">Modo de irrigação</label>
            <div class="op-form__segmented" id="opWetGroup">
              <button type="button" class="op-form__seg-btn${pv.wet ? ' is-active' : ''}" data-value="molhado">Molhado <i class="fa-solid fa-droplet"></i></button>
              <button type="button" class="op-form__seg-btn${!pv.wet ? ' is-active' : ''}" data-value="seco">Seco <i class="fa-solid fa-droplet-slash"></i></button>
            </div>
          </div>
          <div class="op-form__group" style="grid-column:span 2;">
            <div class="op-form__checkbox-label"><span>Fertirrigação</span>
              <label class="op-form__switch"><input type="checkbox" id="opFerti"><span class="op-form__switch-slider"></span></label></div>
          </div>
          <div class="op-form__group is-hidden" id="opFertiObsGroup" style="grid-column:span 2;">
            <label class="op-form__label">Observação</label>
            <textarea id="opFertiObs" class="op-form__textarea" rows="2" placeholder="Por favor insira"></textarea>
          </div>
          <div class="op-form__group">
            <label class="op-form__label">Percentímetro</label>
            <div class="op-form__input--with-suffix"><input type="number" id="opPct" value="${pv.pct.toFixed(0)}" min="1" max="100" step="1"><div class="op-form__input-suffix">%</div></div>
          </div>
          <div class="op-form__group">
            <label class="op-form__label">Lâmina</label>
            <div class="op-form__input--with-suffix"><input type="number" id="opLamina" value="5.75" step="0.01"><div class="op-form__input-suffix">mm</div></div>
          </div>
          <div class="op-form__group" id="opStopModeGroup">
            <label class="op-form__label">Modo de parada</label>
            <select class="op-form__select" id="opStopMode">
              <option value="sem_parar">Sem parar</option>
              <option value="por_voltas">Por voltas</option>
              <option value="por_angulo">Por ângulo</option>
            </select>
          </div>
          <div class="op-form__group is-hidden" id="opStopFieldGroup">
            <label class="op-form__label" id="opStopFieldLabel">Ângulo de parada</label>
            <div class="op-form__input--with-suffix"><input type="number" id="opStopField" value="0" min="0"><div class="op-form__input-suffix" id="opStopFieldSuffix">°</div></div>
          </div>
        </div>
      </div>
      <footer class="op-modal__footer">
        <div class="op-schedule__footer-row">
          <button type="button" class="btn btn--schedule-remove" disabled><i class="fa-solid fa-circle-minus"></i> Remover Operação</button>
          <button type="button" class="btn btn--schedule-add"><i class="fa-solid fa-circle-plus"></i> Adicionar Operação</button>
        </div>
        <div class="op-modal__footer-confirm">
          ${running ? '<button type="button" class="btn btn--stop" id="opStop"><i class="fa-regular fa-square"></i> Parar Pivô</button>' : ''}
          <button type="button" class="btn btn--cancel" data-close>${running ? 'Fechar' : 'Cancelar'}</button>
          <button type="button" class="btn btn--ok" id="opConfirm">OK</button>
        </div>
      </footer>
    </div>`;
}

let pivotsRef = [];

export function openPivotModal({ name = 'Pivô', pivotIndex } = {}) {
  const pv = pivotsRef[pivotIndex];
  if (!pv) return;

  // atualiza o ângulo/ponteiro ao vivo enquanto o modal está aberto
  let pollTimer = 0;
  const modal = openModal({
    id: 'icPivotModal',
    dialogHTML: dialogHTML(name, pv, pv.active),
    onClose: () => clearInterval(pollTimer)
  });
  if (!modal) return;
  const { el, close } = modal;

  pollTimer = setInterval(() => {
    const deg = toDeg360(pv.angle);
    el.querySelector('#opCurAngle').textContent = `${deg.toFixed(1)}°`;
    const pointer = el.querySelector('#dialPointerGroup');
    if (pointer) pointer.setAttribute('transform', `rotate(${deg} 100 100)`);
  }, 200);

  el.querySelector('#opLoadBtn').addEventListener('click', () => {});

  // grupos segmentados (direção / molhado-seco)
  const wireSegGroup = (sel) => {
    el.querySelectorAll(`${sel} .op-form__seg-btn`).forEach((btn) => {
      btn.addEventListener('click', () => {
        el.querySelectorAll(`${sel} .op-form__seg-btn`).forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
  };
  wireSegGroup('#opDirGroup');
  wireSegGroup('#opWetGroup');

  // modo de início: habilita a data só quando não for "Agora"
  el.querySelector('#opStartMode').addEventListener('change', (e) => {
    el.querySelector('#opStartAt').disabled = e.target.value === 'agora';
  });

  // fertirrigação: mostra/esconde observação
  el.querySelector('#opFerti').addEventListener('change', (e) => {
    el.querySelector('#opFertiObsGroup').classList.toggle('is-hidden', !e.target.checked);
  });

  // modo de parada: mostra o campo dinâmico certo
  const stopModeEl = el.querySelector('#opStopMode');
  const applyStopMode = () => {
    const mode = stopModeEl.value;
    const group = el.querySelector('#opStopFieldGroup');
    const label = el.querySelector('#opStopFieldLabel');
    const suffix = el.querySelector('#opStopFieldSuffix');
    const field = el.querySelector('#opStopField');
    if (mode === 'sem_parar') {
      group.classList.add('is-hidden');
      return;
    }
    group.classList.remove('is-hidden');
    if (mode === 'por_voltas') {
      label.textContent = 'Voltas'; suffix.textContent = 'voltas';
      field.value = String(pv.laps + 1); field.removeAttribute('max');
    } else {
      label.textContent = 'Ângulo de parada'; suffix.textContent = '°';
      field.value = '0'; field.max = '360';
    }
  };
  if (pv.stopLaps !== null) stopModeEl.value = 'por_voltas';
  else if (pv.stopAngle !== null) stopModeEl.value = 'por_angulo';
  stopModeEl.addEventListener('change', applyStopMode);
  applyStopMode();
  if (pv.stopAngle !== null) el.querySelector('#opStopField').value = String(pv.stopAngle);
  if (pv.stopLaps !== null) el.querySelector('#opStopField').value = String(pv.stopLaps);

  const stopBtn = el.querySelector('#opStop');
  if (stopBtn) stopBtn.addEventListener('click', () => {
    pv.active = false;
    pv.finished = false;
    close();
  });

  el.querySelector('#opConfirm').addEventListener('click', () => {
    pv.dir = el.querySelector('#opDirGroup .op-form__seg-btn.is-active').dataset.value === 'reverso' ? -1 : 1;
    pv.wet = el.querySelector('#opWetGroup .op-form__seg-btn.is-active').dataset.value === 'molhado';
    pv.pct = Math.max(1, Math.min(100, parseFloat(el.querySelector('#opPct').value) || 100));
    pv.ferti = el.querySelector('#opFerti').checked;

    const mode = stopModeEl.value;
    const fieldVal = parseFloat(el.querySelector('#opStopField').value);
    pv.stopAngle = mode === 'por_angulo' && !isNaN(fieldVal) ? ((fieldVal % 360) + 360) % 360 : null;
    pv.stopLaps = mode === 'por_voltas' && !isNaN(fieldVal) ? fieldVal : null;

    pv.active = true;
    pv.finished = false;
    close();
  });
}

// guarda a referência dos pivôs e mantém o alias global usado fora dos módulos
export function installPivotModal(pivots) {
  pivotsRef = pivots;
  window.IcPivotModal = { open: openPivotModal };
}
