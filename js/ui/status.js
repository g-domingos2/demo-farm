// =====================================================================
//  Taxonomia de status do pivô — mesmas cores/rótulos da plataforma
// =====================================================================

// "short" é o rótulo resumido usado no cabeçalho da categoria (ex: "1 Irrigando")
export const STATUS = {
  alerta: { text: 'ALERTA NO PIVÔ', short: 'Alerta', badge: 'map-card__equip-badge--danger' },
  pressurizando: { text: 'PRESSURIZANDO', short: 'Pressurizando', badge: 'map-card__equip-badge--success' },
  ferti: { text: 'FERTI IRRIGANDO', short: 'Ferti', badge: 'map-card__equip-badge--ferti' },
  irrigando: { text: 'IRRIGANDO', short: 'Irrigando', badge: 'map-card__equip-badge--info' },
  seco: { text: 'MOVENDO A SECO', short: 'Seco', badge: 'map-card__equip-badge--brown' },
  finalizada: { text: 'IRRIGAÇÃO FINALIZADA', short: 'Finalizado', badge: 'map-card__equip-badge--complete' },
  idle: { text: 'PAINEL ENERGIZADO', short: 'Stand-By', badge: 'map-card__equip-badge--warn' }
};

// ordem de exibição no cabeçalho: mais urgente/relevante primeiro, Stand-By por último
export const STATUS_ORDER = ['alerta', 'ferti', 'irrigando', 'pressurizando', 'seco', 'finalizada', 'idle'];

export function pivotStatusKey(pv, t, pumpOn) {
  if (t < pv.alertUntil) return 'alerta';
  if (pv.active) {
    // molhado só irriga de verdade depois que o cano encher (bomba ligada); até lá, fica pressurizando
    if (pv.wet && pv.fillProgress < 1) return 'pressurizando';
    if (pv.ferti && pv.wet && pumpOn) return 'ferti';
    if (pv.wet && pumpOn) return 'irrigando';
    return 'seco';
  }
  return pv.finished ? 'finalizada' : 'idle';
}
