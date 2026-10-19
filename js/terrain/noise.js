// =====================================================================
//  Ruído / relevo procedural — altura do terreno e achatamento junto
//  a pivôs, estrada (2º braço de rio) e rio
// =====================================================================
import { FLAT_ZONES, ROAD_PATH, RIVER_PATH } from '../config.js';

function hash(ix, iz) {
  let h = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function valueNoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
export function fbm(x, z) {
  return valueNoise(x, z) * 0.55 + valueNoise(x * 2.1, z * 2.1) * 0.28 + valueNoise(x * 4.3, z * 4.3) * 0.17;
}
export function smooth01(v) { return v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v); }

// amostra uma polilinha [x,z] como curva suave (Catmull-Rom) no plano XZ
function samplePath(path, samples) {
  const curve = new THREE.CatmullRomCurve3(path.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  return curve.getPoints(samples).map((v) => [v.x, v.z]);
}
export const ROAD_SAMPLED = samplePath(ROAD_PATH, 90);
// rio no lado leste do mapa, atrás dos pivôs 3 e 5
export const RIVER_SAMPLED = samplePath(RIVER_PATH, 110);

function distToPolyline(points, x, z) {
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const ax = points[i][0], az = points[i][1];
    const dx = points[i + 1][0] - ax, dz = points[i + 1][1] - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    const ex = ax + dx * t - x, ez = az + dz * t - z;
    best = Math.min(best, Math.sqrt(ex * ex + ez * ez));
  }
  return best;
}
export function distToRoad(x, z) { return distToPolyline(ROAD_SAMPLED, x, z); }
export function distToRiver(x, z) { return distToPolyline(RIVER_SAMPLED, x, z); }

export function terrainHeight(x, z) {
  const edge = smooth01((Math.hypot(x, z) - 70) / 170);   // colinas crescem longe do centro
  let h = fbm(x * 0.012, z * 0.012) * (4 + 13 * edge);

  // calhas dos dois rios: achatam o relevo pra cota 0
  h *= Math.min(
    smooth01((distToRoad(x, z) - 9) / 16),
    smooth01((distToRiver(x, z) - 10) / 18)
  );

  // zonas planas: cada uma mistura o terreno pra sua cota de platô
  // ([cx, cz, raio, transição, cota] — cota 0 quando omitida). Com cota > 0
  // o terreno SOBE até ficar reto em cima, em vez de afundar até o nível
  // do mar (que cavava um buraco em região de colina).
  for (const [cx, cz, r, trans, level = 0] of FLAT_ZONES) {
    const f = smooth01((Math.hypot(x - cx, z - cz) - r) / trans);
    h = level + (h - level) * f;
  }
  return h;
}
