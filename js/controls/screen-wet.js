// =====================================================================
//  Tela molhada — quando a câmera passa por baixo do braço de um pivô
//  que está borrifando de verdade, mostra um overlay de gotas na "lente"
// =====================================================================
import { camera } from '../core/setup.js';
import { PIVOT_ARM_REACH, SPRAY_TOP } from '../entities/pivot.js';

const BAND = 4;            // largura (m) embaixo do braço que ainda molha a câmera
const HEIGHT_MARGIN = 3;   // até quanto acima do cano ainda conta como "embaixo"
const SMOOTH = 3;          // velocidade de entrada/saída do efeito (por segundo)
const MAX_OPACITY = 0.55;

export function createScreenWet(pivots) {
  const el = document.getElementById('screenWet');
  let wet = 0;

  function update(dt) {
    let target = 0;
    for (const pv of pivots) {
      if (pv.dropMat.opacity <= 0) continue;
      if (camera.position.y > SPRAY_TOP + HEIGHT_MARGIN) continue;
      const ry = pv.arm.rotation.y;
      const cosT = Math.cos(ry), sinT = Math.sin(ry);
      const dx = camera.position.x - pv.pos.x;
      const dz = camera.position.z - pv.pos.z;
      const along = dx * cosT - dz * sinT;    // distância ao longo do braço (0 = eixo, +reach = ponta)
      const perp = dx * sinT + dz * cosT;     // distância perpendicular ao braço
      if (along < -1 || along > PIVOT_ARM_REACH + 3) continue;
      if (Math.abs(perp) > BAND) continue;
      target = Math.max(target, pv.dropMat.opacity / 0.8);   // acompanha a intensidade real do spray
    }
    const step = Math.min(Math.abs(target - wet), SMOOTH * dt);
    wet += Math.sign(target - wet) * step;
    if (el) {
      el.style.opacity = (wet * MAX_OPACITY).toFixed(3);
      el.style.backdropFilter = wet > 0.02 ? `blur(${(wet * 1.6).toFixed(2)}px)` : 'none';
    }
  }

  return { update };
}
