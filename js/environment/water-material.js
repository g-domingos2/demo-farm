// =====================================================================
//  Água texturizada (3dtextures.me "Water 002", CC0): cor + normal map
//  em repetição, com offset animado pra dar correnteza/ondulação.
//  updateWater(dt) é chamado no loop principal (main.js).
// =====================================================================
import { loadRepeatTexture } from '../core/textures.js';

const COLOR_FILE = 'models/Water_002_SD/Water_002_COLOR.jpg';
const NORM_FILE = 'models/Water_002_SD/Water_002_NORM.jpg';

const flows = [];   // texturas vivas + velocidade de deriva de cada superfície

// opts: { repeat: [u,v], speed: [u,v] em unidades de UV/s, tint: 0xRRGGBB,
//         useColorMap: true } — por padrão a cor é sólida (tint) e só o
// normal map anima a ondulação; o mapa de cor do pacote é azul-royal demais
export function makeWaterMaterial({ repeat, speed, tint, useColorMap = false }) {
  const normalMap = loadRepeatTexture(NORM_FILE, { repeat, srgb: false });
  const maps = [normalMap];
  const params = {
    color: tint || 0x5d8273,
    normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughness: 0.18,
    metalness: 0.08
  };
  if (useColorMap) {
    params.map = loadRepeatTexture(COLOR_FILE, { repeat });
    maps.push(params.map);
  }
  flows.push({ maps, speed });
  return new THREE.MeshStandardMaterial(params);
}

export function updateWater(dt) {
  for (const f of flows) {
    for (const m of f.maps) {
      m.offset.x += f.speed[0] * dt;
      m.offset.y += f.speed[1] * dt;
    }
  }
}
