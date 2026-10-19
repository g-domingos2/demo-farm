// =====================================================================
//  Shell compartilhado dos modais flutuantes (pivô e bomba): monta o
//  backdrop, injeta o diálogo, faz a ligação de fechamento e oferece
//  os utilitários de data usados pelos formulários de agendamento.
//  Os estilos vivem em css/partials/_modals.css.
// =====================================================================

// Abre um modal único por id (reabrir com o mesmo id é ignorado).
// Qualquer elemento com [data-close] dentro do diálogo fecha o modal —
// o backdrop já vem com esse atributo.
// Retorna { el, close } ou null se já houver um aberto.
export function openModal({ id, dialogHTML, top = false, onClose }) {
  if (document.getElementById(id)) return null;

  const el = document.createElement('div');
  el.id = id;
  el.className = top ? 'op-modal op-modal--top' : 'op-modal';
  el.innerHTML = `<div class="op-modal__backdrop" data-close></div>${dialogHTML}`;
  document.body.appendChild(el);

  const close = () => {
    if (onClose) onClose();
    el.remove();
  };
  el.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', close));
  return { el, close };
}

// agora local em formato datetime-local (YYYY-MM-DDTHH:mm), sem segundos
export function nowLocalIso() {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// soma horas a um valor datetime-local, devolvendo no mesmo formato
export function addHours(iso, h) {
  const d = new Date(iso);
  d.setHours(d.getHours() + h);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
