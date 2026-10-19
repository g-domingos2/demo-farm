// =====================================================================
//  Modal de operação da bomba — mesma estrutura/comportamento do
//  original da plataforma (platform-design-main/bombas/index.js).
//  Estilos em css/partials/_modals.css; shell em ui/modal.js.
// =====================================================================
import { openModal, nowLocalIso, addHours } from './modal.js';
import { setPumpRunning } from './pump-panel.js';

function dialogHTML(name, running, now) {
  return `
    <div class="ic-bmb-dialog">
      <header class="ic-bmb-header">
        <h3 class="ic-bmb-title">${name}</h3>
        <div class="ic-bmb-header-actions">
          <button type="button" class="op-modal__details-btn" data-close>Detalhes</button>
          <button class="ic-bmb-close" data-close aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </header>
      <div class="ic-bmb-content">
        <div class="ic-bmb-tabs">
          <button class="ic-bmb-tab is-active" data-mode="agora">Começar agora</button>
          <button class="ic-bmb-tab" data-mode="sem_parar">Sem parar</button>
          <button class="ic-bmb-tab" data-mode="intervalo">Intervalo</button>
        </div>
        <div class="ic-bmb-fields">
          <div>
            <label class="ic-bmb-label">${running ? 'Ligada em' : 'Começar em'}</label>
            <div class="ic-bmb-input-wrap">
              <input class="ic-bmb-input" type="datetime-local" id="icBmbStart" value="${now}" min="${now}" disabled />
              <button class="ic-bmb-cal" type="button" data-for="icBmbStart"><i class="fa-regular fa-calendar"></i></button>
            </div>
          </div>
          <div>
            <label class="ic-bmb-label">Parar em</label>
            <div class="ic-bmb-input-wrap">
              <input class="ic-bmb-input" type="datetime-local" id="icBmbEnd" value="${addHours(now, 1)}" min="${now}" disabled />
              <button class="ic-bmb-cal" type="button" data-for="icBmbEnd"><i class="fa-regular fa-calendar"></i></button>
            </div>
          </div>
        </div>
      </div>
      <footer class="ic-bmb-footer">
        <button class="ic-bmb-btn-cancel" data-close>${running ? 'Fechar' : 'Cancelar'}</button>
        ${running
          ? '<button class="ic-bmb-btn-stop" id="icBmbStop"><i class="fa-regular fa-square"></i> Desligar Bomba</button>'
          : '<button class="ic-bmb-btn-ok" id="icBmbOk">OK</button>'}
      </footer>
    </div>`;
}

export function openPumpModal({ name = 'Bomba', equipId, running = false } = {}) {
  const modal = openModal({
    id: 'icBombaFloatModal',
    top: true,
    dialogHTML: dialogHTML(name, running, nowLocalIso())
  });
  if (!modal) return;
  const { el, close } = modal;

  // botões de calendário abrem o seletor nativo do input correspondente
  el.querySelectorAll('.ic-bmb-cal').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = el.querySelector(`#${btn.dataset.for}`);
      if (input && !input.disabled && typeof input.showPicker === 'function') input.showPicker();
    });
  });

  // abas habilitam os campos de data conforme o modo escolhido
  const applyMode = (mode) => {
    el.querySelector('#icBmbStart').disabled = mode === 'agora';
    el.querySelector('#icBmbEnd').disabled = mode === 'sem_parar';
  };
  el.querySelectorAll('.ic-bmb-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      el.querySelectorAll('.ic-bmb-tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      applyMode(tab.dataset.mode);
    });
  });
  applyMode('agora');

  // fim nunca fica antes do início
  el.querySelector('#icBmbStart').addEventListener('change', (e) => {
    const end = el.querySelector('#icBmbEnd');
    if (end.value <= e.target.value) end.value = addHours(e.target.value, 1);
    end.min = e.target.value;
  });

  const okBtn = el.querySelector('#icBmbOk');
  if (okBtn) okBtn.addEventListener('click', () => {
    setPumpRunning(equipId, true);
    close();
  });
  const stopBtn = el.querySelector('#icBmbStop');
  if (stopBtn) stopBtn.addEventListener('click', () => {
    setPumpRunning(equipId, false);
    close();
  });
}

// mantém o alias global usado fora dos módulos
export function installPumpModal() {
  window.IcBombaModal = { open: openPumpModal };
}
