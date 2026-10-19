// =====================================================================
//  Bomba (pump-bauer.glb) — posicionada dentro da casa de bomba,
//  no mesmo ponto plano do relevo ([72, -42] em config.js).
//  Posição/escala/rotação iniciais a ajustar.
// =====================================================================
import { registerModel } from '../gltf-models.js';
import { loadRepeatTexture } from '../core/textures.js';

const PUMP_FILE = 'models/pump/pump-bauer.glb';

// mesma foto de aço galvanizado usada nos canos do pivô (js/entities/pivot.js)
const METAL_TEX_FILE = 'models/pivot/metal-galvanizado.jpg';
let metalTexShared = null;
function metalTexture() {
  if (!metalTexShared) {
    metalTexShared = loadRepeatTexture(METAL_TEX_FILE, { repeat: [4, 4], anisotropy: 4 });
  }
  return metalTexShared;
}

function applyPipeTexture(model) {
  model.traverse((o) => {
    if (!o.isMesh || !/cano|pipe|tubo/i.test(o.name)) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((mat) => {
      if (!mat) return;
      mat.map = metalTexture();
      mat.color.set(0xffffff);
      mat.needsUpdate = true;
    });
  });
}

export function createPumpModel() {
  registerModel({
    file: PUMP_FILE,
    position: [72, 0, -42],
    scale: 0.02,
    rotationY: 2.0 + Math.PI / 2,
    onLoad: applyPipeTexture
  });
}
