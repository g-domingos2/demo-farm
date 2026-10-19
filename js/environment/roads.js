// =====================================================================
//  Estradas de terra — fitas contínuas que seguem o relevo, com a
//  textura de barro/marcas de pneu extraída de models/road (Sketchfab).
//  Traçado passa pelos corredores entre os círculos dos pivôs.
//  Também estaciona o trator David Brown na estrada do sul.
// =====================================================================
import { scene } from '../core/setup.js';
import { buildRibbonGeometry } from '../core/ribbon.js';
import { HQ_X, HQ_Z } from '../config.js';
import { terrainHeight } from '../terrain/noise.js';
import { registerModel } from '../gltf-models.js';

const WIDTH = 6;
const LIFT = 0.12;        // um tico acima do gramado, sem z-fighting
const TILE_LEN = 7;       // comprimento de estrada coberto por 1 repetição da textura

// Textura de estrada de fazenda: a foto de areia/terra (Poly Haven
// "coast_sand_04", CC0, reduzida pra 1K) aparece SÓ nas duas faixas dos
// pneus; o meio e as bordas ficam transparentes — a grama real do terreno
// aparece entre as trilhas, como estrada de uso de trator.
const ROAD_PHOTO = 'models/road/road_sand_1k.jpg';

function makeRoadTexture() {
  const W = 256, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;

  const TRACKS = [W * 0.27, W * 0.73];
  const TRACK_W = W * 0.19;

  // máscara de alpha das duas faixas (bordas esvaindo)
  const trackMask = () => {
    const m = document.createElement('canvas');
    m.width = W; m.height = H;
    const mg = m.getContext('2d');
    for (const cx of TRACKS) {
      const grad = mg.createLinearGradient(cx - TRACK_W, 0, cx + TRACK_W, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.3, 'rgba(255,255,255,1)');
      grad.addColorStop(0.7, 'rgba(255,255,255,1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      mg.fillStyle = grad;
      mg.fillRect(cx - TRACK_W, 0, TRACK_W * 2, H);
    }
    return m;
  };

  // desenha com espelho vertical ±H pro padrão emendar sem costura
  const blob = (x, y, rx, ry, color) => {
    g.fillStyle = color;
    for (const dy of [-H, 0, H]) {
      g.beginPath();
      g.ellipse(x, y + dy, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
    }
  };

  const paint = (photo) => {
    g.clearRect(0, 0, W, H);
    // base das trilhas: foto (ou terra chapada até a foto carregar),
    // recortada pela máscara das duas faixas
    const base = document.createElement('canvas');
    base.width = W; base.height = H;
    const bg = base.getContext('2d');
    if (photo) {
      bg.drawImage(photo, 0, 0, W, H);
    } else {
      bg.fillStyle = 'rgb(125,102,72)';
      bg.fillRect(0, 0, W, H);
    }
    bg.globalCompositeOperation = 'destination-in';
    bg.drawImage(trackMask(), 0, 0);
    g.drawImage(base, 0, 0);

    // marcas de pneu atravessadas nas trilhas
    g.fillStyle = 'rgba(88,70,48,0.4)';
    for (const cx of TRACKS) {
      for (let y = 0; y < H; y += 5) {
        g.fillRect(cx - TRACK_W * 0.55 + (Math.random() - 0.5) * 4, y, TRACK_W * 1.1, 1.7);
      }
    }
    // tufos de capim invadindo o canteiro central e as beiradas
    for (let i = 0; i < 150; i++) {
      const green = 100 + Math.random() * 55 | 0;
      blob(W * 0.5 + (Math.random() - 0.5) * W * 0.16, Math.random() * H,
        1.4 + Math.random() * 3, 1 + Math.random() * 2.2,
        `rgba(${green * 0.55 | 0},${green},${green * 0.42 | 0},0.7)`);
    }
    tex.needsUpdate = true;
  };

  paint(null);
  const img = new Image();
  img.onload = () => paint(img);
  img.onerror = () => console.warn(`Sem ${ROAD_PHOTO} — trilhas com cor procedural`);
  img.src = ROAD_PHOTO;
  return tex;
}

// principal: sai pelo lado leste da sede (desviando do moinho), desce o
// corredor entre pivôs 1 e 4, contorna o 3 e margeia o rio do leste
// passando entre ele e o pivô 5 — folga mínima de ~80 dos centros
const ROAD_A = [
  [HQ_X + 20, HQ_Z + 30], [-24, -108], [8, -150], [48, -182],
  [110, -200], [175, -202], [238, -150], [246, -60], [254, 10],
  [256, 95], [240, 160]
];
// ramal: nasce na mesma saída da principal (bifurcação), sobe o corredor
// entre pivôs 1 e 2 e morre na beira do 2º rio
const ROAD_B = [
  [HQ_X + 20, HQ_Z + 30], [-75, -40], [-82, 28], [-98, 52]
];

function buildRoad(waypoints, material) {
  const curve = new THREE.CatmullRomCurve3(
    waypoints.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const pts = curve.getPoints(Math.max(24, Math.round(curve.getLength() / 4)));

  const geo = buildRibbonGeometry(pts, WIDTH, {
    // cada beirada acompanha o relevo — a estrada "deita" no morro
    elevate: (x, z) => terrainHeight(x, z) + LIFT,
    // textura corre ao longo da estrada
    uvAt: (dist, side) => [side, dist / TILE_LEN]
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

export function createRoads() {
  const mat = new THREE.MeshLambertMaterial({
    map: makeRoadTexture(),
    transparent: true,   // meio e bordas deixam a grama real aparecer
    depthWrite: false
  });

  buildRoad(ROAD_A, mat);
  buildRoad(ROAD_B, mat);

  // trator estacionado na reta do sul da estrada principal, virado no
  // sentido da via (o .glb vem ~6× maior que o real — escala 0.16)
  registerModel({
    file: 'models/tractor/david_brown_25d_tractor.glb',
    position: [60, 0, -186], scale: 0.16, rotationY: 2.0
  });

  // galpão de tesouras de madeira ao lado do trator, paralelo à estrada
  // (lado sul, na faixa achatada do relevo). O .glb tem 60x13.9 de base
  // com origem no CANTO, não no centro — a posição abaixo é esse canto;
  // com escala 0.5 ele se estende ~29 ao longo da via a partir dali.
  registerModel({
    file: 'models/timber/timber_trusses_for_goat_farm.glb',
    position: [54.5, 0, -189.7], scale: 0.5, rotationY: 0.285
  });
}
