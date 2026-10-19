// =====================================================================
//  Solo com relevo: foto de grama (ambientCG "Ground037", CC0) em mosaico,
//  tingida pelas cores de vértice (seco nos topos, viçoso nas baixadas,
//  terra nas margens) — a textura multiplica o vertex color
// =====================================================================
import { scene } from '../core/setup.js';
import { loadRepeatTexture } from '../core/textures.js';
import { terrainHeight, fbm, distToRoad, distToRiver, smooth01 } from '../terrain/noise.js';

const GRASS_TEX_FILE = 'models/ground/Ground037_Color.jpg';

export function createGround() {
  const groundGeo = new THREE.PlaneGeometry(1400, 1400, 220, 220);
  const pos = groundGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  // tons claros: funcionam como "tinta" sobre a foto (branco = foto pura)
  const grass = new THREE.Color(0xf0f0ea), dry = new THREE.Color(0xe2d8a6),
        lush = new THREE.Color(0xa9cf94), dirt = new THREE.Color(0xb6885c);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i), wz = -pos.getY(i);   // plano rotacionado: y local = -z mundo
    const h = terrainHeight(wx, wz);
    pos.setZ(i, h);                              // z local vira altura (y mundo)
    const n = fbm(wx * 0.03 + 40, wz * 0.03 - 15);
    c.copy(grass);
    c.lerp(dry, Math.min(1, smooth01((h - 4) / 9) * 0.8 + n * 0.3));   // topos mais secos
    c.lerp(lush, smooth01((2 - h) / 2) * n * 0.45);                    // baixadas mais viçosas
    c.lerp(dirt, 1 - smooth01((distToRoad(wx, wz) - 7) / 5));          // margem do 2º rio
    c.lerp(dirt, 1 - smooth01((distToRiver(wx, wz) - 7) / 5));         // margem do rio
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();

  // repeat 160 → 1 tile a cada ~8.75 unidades; anisotropy segura a
  // nitidez da grama em ângulos rasos
  const grassTex = loadRepeatTexture(GRASS_TEX_FILE, { repeat: [160, 160], anisotropy: 4 });

  const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ map: grassTex, vertexColors: true }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return ground;
}
