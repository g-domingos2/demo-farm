// =====================================================================
//  Pivô central (fábrica) — modelo 3D comprado, girando em torno de Y
// =====================================================================
import { scene } from '../core/setup.js';
import { loadRepeatTexture } from '../core/textures.js';
import { CROP_R, PIVOTS_POS } from '../config.js';
import { plantCropCircle } from './crop-field.js';

// modelo 3D "Bauer" — carregado uma vez e clonado para cada pivô. O .glb já
// vem separado em nós: "eixo_pivo" carrega tudo que gira (curva, 3 torres com
// rodas, GPS, placa); o resto (painel, torre central, motor da curva,
// tubulação) é base fixa.
// medidas no espaço do arquivo (transformações dos nós aplicadas):
//   eixo de giro em x=-91.507 z=-0.294; braço segue ~+Z até a ponta em z=185.13
//   chão em y=-0.24; rodas das 3 torres a 52.8 / 105.4 / 159.1 do eixo
const PIVOT_MODEL_FILE = 'models/pivot/pivot-bauer.glb';
const PIVOT_MODEL_AXIS_X = -91.507;      // eixo do cano central — vira o centro de giro
const PIVOT_MODEL_AXIS_Z = -0.294;
const PIVOT_MODEL_MIN_Y = -0.24;         // ponto mais baixo (rodas) — alinha ao chão
const PIVOT_MODEL_LEN = 185.43;          // eixo → ponta do balanço
const PIVOT_MODEL_ARM_DIR = 1.5528;      // rad: direção do braço no arquivo (~+Z); girado pra +X na cena
export const PIVOT_ARM_REACH = 73;       // até a ponta do canhão (68 = braço original)
const PIVOT_MODEL_SCALE = PIVOT_ARM_REACH / PIVOT_MODEL_LEN;   // mantém o alcance correto (largura/comprimento)
const PIVOT_MODEL_Y_BOOST = 1.4;   // pivô maior pra ler melhor perto do fazendeiro (1.80m) — boost
                                   // uniforme em X/Y (ver wrapPart), não distorce as pernas (1 = tamanho real)

// porta do painel — nó "dobradica_porta_painel" do .glb (giro puro em Y no arquivo).
// abre/fecha animando esse giro; interação (tecla E por proximidade) fica em
// controls/panel-interact.js, que lê/escreve pv.doorOpen e pv.doorAnim
const DOOR_HINGE_NODE = 'dobradica_porta_painel';
const DOOR_OPEN_ANGLE = 1.7;    // ~97° de giro ao abrir — inverta o sinal se abrir pro lado errado
const DOOR_ANIM_SPEED = 3;      // rad/s de aproximação do alvo (abre/fecha em ~0.3-0.5s)

// raios das rodas das 3 torres no arquivo — viram raio em cena (marca no
// chão) e razão trilha/raio da roda (giro visual por rad de avanço)
const WHEEL_TRACK_RADII = [52.84, 105.43, 159.12];
const WHEEL_FILE_R = 0.77;   // raio da roda no arquivo (Ø 1.54)
const WHEEL_RADII = WHEEL_TRACK_RADII.map((r) => r * PIVOT_MODEL_SCALE);
const WHEEL_SPIN_RATIO = WHEEL_TRACK_RADII.map((r) => r / WHEEL_FILE_R);

// spray de água dos aspersores (partículas presas ao braço)
export const DROPS = 3000;         // nº de gotas por pivô (mais bocais agora — precisa de mais gotas
                                   // no total pra cada um continuar com jato visível)
export const SPRAY_TOP = 5.8 * PIVOT_MODEL_SCALE * PIVOT_MODEL_Y_BOOST;   // altura do cano em cena (~5.8 no arquivo × escala × boost)
const SPRAY_G = 7;                 // gravidade do spray (um tico menor que a real, pra leitura)
// bocais espaçados ao longo do cano — as gotas nascem na boca de cada um.
// quem cairia em cima de uma torre (treliça/eixo das rodas) é deslocado pra
// logo antes dela, em vez de sumir — todo slot continua com água, só não
// nasce atravessando a estrutura
const TOWER_MARGIN = 0.7;
const NOZZLE_SKIP_FIRST = 3;   // os 3 primeiros bocais (perto do painel) ficam sem água — não molha o painel
const NOZZLE_XS = [];
for (let nx = 0.8; nx <= PIVOT_ARM_REACH - 1.5; nx += 0.8) {
  const nearTower = WHEEL_RADII.find((wr) => Math.abs(nx - wr) < TOWER_MARGIN);
  const x = nearTower !== undefined ? nearTower - TOWER_MARGIN : nx;
  if (NOZZLE_XS[NOZZLE_XS.length - 1] === x) continue;   // 2 bocais vizinhos desviados pro mesmo ponto — não duplica
  NOZZLE_XS.push(x);
}
NOZZLE_XS.splice(0, NOZZLE_SKIP_FIRST);
NOZZLE_XS.push(PIVOT_ARM_REACH - 0.8);   // bocal extra na ponta (balanço, depois da torre motriz)
let pivotModelPromise = null;

// sprite das gotas a partir da textura Water Droplets 001 (3dtextures.me, CC0):
// a máscara (gotículas brancas em fundo preto) vira alfa + brilho da sprite,
// com esmaecimento radial pra borda ficar redonda. Enquanto a foto carrega,
// fica um gradiente circular difuso de fallback.
const DROP_MASK_FILE = 'models/Water_Droplets_001_SD/Water_Droplets_001_mask.jpg';
let dropSprite = null;
function makeDropSprite() {
  if (dropSprite) return dropSprite;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.4, 'rgba(222,240,255,0.55)');
  grad.addColorStop(1, 'rgba(205,232,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  dropSprite = new THREE.CanvasTexture(c);

  const img = new Image();
  img.onload = () => {
    const t = document.createElement('canvas');
    t.width = t.height = S;
    const tg = t.getContext('2d');
    tg.drawImage(img, 0, 0, S, S);
    const d = tg.getImageData(0, 0, S, S);
    const px = d.data;
    const half = S / 2;
    for (let i = 0; i < px.length; i += 4) {
      const lum = px[i];                                    // máscara é P&B
      const x = (i / 4) % S - half, y = Math.floor(i / 4 / S) - half;
      const fall = Math.max(0, 1 - Math.hypot(x, y) / half); // borda circular
      px[i] = 228; px[i + 1] = 242; px[i + 2] = 255;         // azul-claro d'água
      px[i + 3] = Math.min(255, Math.round(lum * fall * 1.5));
    }
    tg.putImageData(d, 0, 0);
    g.clearRect(0, 0, S, S);
    g.drawImage(t, 0, 0);
    dropSprite.needsUpdate = true;
  };
  img.onerror = () => console.warn(`Sem ${DROP_MASK_FILE} — usando sprite de fallback`);
  img.src = DROP_MASK_FILE;
  return dropSprite;
}

// foto de solo (ambientCG "Ground003", CC0) usada como base do círculo de cultivo —
// textura repetida de verdade (mesma densidade/nitidez da grama), compartilhada
// entre os 5 pivôs; a pintura dinâmica fica numa camada transparente por cima
const GROUND_TEX_FILE = 'models/ground/Ground003_Color.jpg';
let soilTexShared = null;
function soilTexture() {
  if (!soilTexShared) {
    // repeat 17 → ~8.8 unidades por tile, igual à grama
    soilTexShared = loadRepeatTexture(GROUND_TEX_FILE, { repeat: [17, 17], anisotropy: 4 });
  }
  return soilTexShared;
}

// foto de cimento p/ a laje da base do pivô (nó "Cube" do .glb, hoje só cor
// chapada cinza) — mesma técnica da soilTexture acima, compartilhada entre pivôs
const CONCRETE_TEX_FILE = 'models/pivot/base-concreto.jpg';
let concreteTexShared = null;
function concreteTexture() {
  if (!concreteTexShared) {
    concreteTexShared = loadRepeatTexture(CONCRETE_TEX_FILE, { repeat: [2, 2], anisotropy: 4 });
  }
  return concreteTexShared;
}

// foto de aço galvanizado p/ torres/tubulação/treliças do .glb. Tentamos
// detectar pela cor do material (cinza neutro sem textura), mas o GLTFLoader
// clona o material por peça e o valor numérico da cor não fica consistente
// entre cópias — pegava a curva do pivô mas não as torres, mesmo sendo
// nominalmente a "mesma" cor. Por isso vai direto pelo nome dos objetos
// (confirmados na hierarquia do Blender), com exclusão só do que não deve
// virar metal (pneu de borracha e a carcaça pintada do motor da curva).
const METAL_TEX_FILE = 'models/pivot/metal-galvanizado.jpg';
let metalTexShared = null;
function metalTexture() {
  if (!metalTexShared) {
    metalTexShared = loadRepeatTexture(METAL_TEX_FILE, { repeat: [12, 12], anisotropy: 4 });
  }
  return metalTexShared;
}
const METAL_NODE_NAMES = new Set([
  'torre_central.001', 'tubulação_torre', 'curva_pivo',
  'primeira_torre', 'segunda_torre', 'terceira_torre',
  'rodas_primeira_torre', 'rodas_segunda_torre', 'rodas_terceira_torre',
  'suporte_irrimesh', 'latch_top', 'latch_top.001', 'latch_painel_interno',
  'motor_curva',
]);
function isUnderMetalNode(obj) {
  for (let n = obj; n; n = n.parent) {
    if (METAL_NODE_NAMES.has(n.name)) return true;
  }
  return false;
}
function isExcludedFromMetal(mat) {
  const n = (mat?.name || '').toLowerCase();
  return n.includes('weel') || n.includes('motor material');
}
// leva o eixo de giro do modelo pra origem, aponta o braço pra +X (convenção
// do spray e da pintura do círculo) e escala pro alcance da cena.
// boostZ=true (base fixa): boost uniforme nos 3 eixos — cresce igual em todo
// lugar, sem distorcer nada (é só um objeto maior, como um slider de escala no Blender).
// boostZ=false (braço/lance): boost só em X/Y (o corte transversal onde as
// pernas em treliça vivem) — Z fica intocado porque é o eixo do comprimento
// do braço, já calibrado pro alcance real (PIVOT_ARM_REACH / círculo de cultivo).
// Boost igual em X e Y preserva o ângulo de cada perna (cresce a "silhueta"
// inteira igual, não estica só uma direção).
function wrapPart(nodes, boostZ) {
  const inner = new THREE.Group();
  nodes.forEach((n) => inner.add(n));
  inner.position.set(-PIVOT_MODEL_AXIS_X, -PIVOT_MODEL_MIN_Y, -PIVOT_MODEL_AXIS_Z);
  const outer = new THREE.Group();
  outer.rotation.y = PIVOT_MODEL_ARM_DIR;
  const xy = PIVOT_MODEL_SCALE * PIVOT_MODEL_Y_BOOST;
  const z = boostZ ? xy : PIVOT_MODEL_SCALE;
  outer.scale.set(xy, xy, z);
  outer.add(inner);
  return outer;
}

// Cada nó rodas_* tem o par de rodas numa malha só: as duas separadas em ±X
// local, eixo de giro em Z local. Divide os triângulos pelo lado do X e embrulha
// cada roda num grupo com origem no próprio centro — girar rotation.z do grupo
// faz a roda rolar no lugar. O fator trilha/raio fica em userData.wheelSpin
// (sobrevive ao clone) pra simulação achar e aplicar o giro.
function splitWheelsForSpin(model) {
  ['rodas_primeira_torre', 'rodas_segunda_torre', 'rodas_terceira_torre'].forEach((name, ti) => {
    const node = model.getObjectByName(name);
    if (!node || node.isMesh) {
      console.warn(`Nó de rodas "${name}" ausente ou em formato inesperado — sem giro visual`);
      return;
    }
    const meshes = [];
    node.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const sideMeshes = [[], []];
    meshes.forEach((m) => {
      const pos = m.geometry.attributes.position;
      const idx = m.geometry.index;
      const triCount = (idx ? idx.count : pos.count) / 3;
      const sideIdx = [[], []];
      for (let t = 0; t < triCount; t++) {
        const a = idx ? idx.getX(t * 3) : t * 3;
        const b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
        const c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
        const side = pos.getX(a) + pos.getX(b) + pos.getX(c) < 0 ? 0 : 1;
        sideIdx[side].push(a, b, c);
      }
      sideIdx.forEach((indices, side) => {
        if (!indices.length) return;
        const geo = new THREE.BufferGeometry();
        for (const k in m.geometry.attributes) geo.setAttribute(k, m.geometry.attributes[k]);
        geo.setIndex(indices);
        const half = new THREE.Mesh(geo, m.material);
        half.castShadow = true; half.receiveShadow = true;
        sideMeshes[side].push(half);
      });
      m.removeFromParent ? m.removeFromParent() : m.parent.remove(m);
    });
    const v = new THREE.Vector3();
    sideMeshes.forEach((list) => {
      if (!list.length) return;
      // centro real da roda (bbox pelo índice — computeBoundingBox ignoraria o índice)
      const box = new THREE.Box3();
      list.forEach((half) => {
        const p = half.geometry.attributes.position, ix = half.geometry.index;
        for (let i = 0; i < ix.count; i++) box.expandByPoint(v.fromBufferAttribute(p, ix.getX(i)));
      });
      const center = box.getCenter(new THREE.Vector3());
      const wheel = new THREE.Group();
      wheel.position.copy(center);
      list.forEach((half) => { half.position.copy(center).negate(); wheel.add(half); });
      wheel.userData.wheelSpin = WHEEL_SPIN_RATIO[ti];
      node.add(wheel);
    });
  });
}

function loadPivotModel() {
  if (pivotModelPromise) return pivotModelPromise;
  pivotModelPromise = new Promise((resolve) => {
    if (!(window.THREE && THREE.GLTFLoader)) return resolve(null);
    new THREE.GLTFLoader().load(PIVOT_MODEL_FILE, (gltf) => {
      const model = gltf.scene;
      model.traverse((o) => {
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
      });
      const baseSlab = model.getObjectByName('Cube');
      if (baseSlab?.isMesh) {
        baseSlab.material.map = concreteTexture();
        baseSlab.material.color.set(0xffffff);
        baseSlab.material.needsUpdate = true;
      }
      model.traverse((o) => {
        if (!o.isMesh || !isUnderMetalNode(o)) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((mat) => {
          if (!mat || mat.map || isExcludedFromMetal(mat)) return;
          mat.map = metalTexture();
          mat.color.set(0xffffff);
          // arquivo vem com roughness 0 + extensão KHR_materials_specular
          // (specularColorFactor ~0.4-0.5, bem acima do ~0.04 padrão de um
          // dielétrico) — em peças curvas isso estoura o brilho e lava a
          // textura por cima. Só baixar o roughness não resolve porque esse
          // reflexo extra continua forte em qualquer rugosidade; precisa
          // abaixar os dois.
          if ('roughness' in mat) mat.roughness = 0.7;
          if ('specularIntensity' in mat) mat.specularIntensity = 0.15;
          if (mat.specularColor) mat.specularColor.set(0x222222);
          mat.needsUpdate = true;
        });
      });
      splitWheelsForSpin(model);
      // painel (corpo, tampa e miolo interno) na proporção real — sem Y_BOOST
      // pra compensar, não precisa encolher (k=1 = tamanho real do arquivo)
      const PANEL_K = 1;
      const shrinkY = (node, k) => {
        if (!node) return;
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(node);
        const oy = node.getWorldPosition(new THREE.Vector3()).y;
        node.scale.y *= k;
        node.position.y += (box.min.y - oy) * (1 - k);
      };
      shrinkY(model.getObjectByName('painel_bauer'), PANEL_K);
      shrinkY(model.getObjectByName('dobradica_porta_painel'), PANEL_K);   // tampa (gira em Y, dobradiça)
      shrinkY(model.getObjectByName('painel_bauer_interno'), PANEL_K);     // miolo (botões, display)
      const spin = model.getObjectByName('eixo_pivo');   // tudo que gira
      if (!spin) {
        console.warn(`Nó "eixo_pivo" não encontrado em ${PIVOT_MODEL_FILE}`);
        return resolve({ base: new THREE.Group(), lance: wrapPart(model.children.slice(), true) });
      }
      const rest = model.children.filter((n) => n !== spin);
      const base = wrapPart(rest, true);    // fixa: boost uniforme nos 3 eixos, sem distorção
      const lance = wrapPart([spin], false); // braço: boost só X/Y, Z (alcance) fica calibrado
      resolve({ base, lance });
    }, undefined, () => {
      console.warn(`Não foi possível carregar ${PIVOT_MODEL_FILE}`);
      resolve(null);
    });
  });
  return pivotModelPromise;
}

function createPivot(cx, cz) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  let pv;   // atribuído no fim da função — o .then() abaixo só dispara depois, já com pv pronto

  // círculo de cultivo: a foto de solo entra como textura repetida (nitidez
  // idêntica à da grama), com um véu esverdeado leve via `color` do material
  const crop = new THREE.Mesh(
    new THREE.CircleGeometry(CROP_R, 96),
    new THREE.MeshLambertMaterial({ map: soilTexture(), color: 0xeef0dc })
  );
  crop.rotation.x = -Math.PI / 2;
  crop.position.y = 0.05;
  crop.receiveShadow = true;
  g.add(crop);

  // camada de pintura por cima (transparente): trilhas das rodas + véu de
  // irrigação. O setor irrigado vive numa MÁSCARA opaca à parte — repintar o
  // mesmo lugar não acumula — e entra na camada visível com alpha fixo baixo,
  // então o véu nunca escurece além do tom escolhido.
  const CS = 1024, HALF = CS / 2, TRACK_W = CS / 170;
  const WET_VEIL = 0.14;   // intensidade do véu azul de "já irrigado"
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropCanvas.height = CS;
  const cctx = cropCanvas.getContext('2d');
  const wetMask = document.createElement('canvas');
  wetMask.width = wetMask.height = CS;
  const wctx = wetMask.getContext('2d');

  const drawTracks = () => {
    cctx.strokeStyle = 'rgba(90,64,40,0.55)';     // trilhas das rodas
    cctx.lineWidth = TRACK_W;
    for (const r of WHEEL_RADII) {
      cctx.beginPath();
      cctx.arc(HALF, HALF, (r / CROP_R) * HALF, 0, Math.PI * 2);
      cctx.stroke();
    }
  };
  const compose = () => {
    cctx.clearRect(0, 0, CS, CS);
    cctx.globalAlpha = WET_VEIL;
    cctx.drawImage(wetMask, 0, 0);
    cctx.globalAlpha = 1;
    drawTracks();
    cropTex.needsUpdate = true;
  };
  const cropTex = new THREE.CanvasTexture(cropCanvas);
  cropTex.anisotropy = 4;
  compose();

  const paintLayer = new THREE.Mesh(
    new THREE.CircleGeometry(CROP_R, 96),
    new THREE.MeshLambertMaterial({ map: cropTex, transparent: true, depthWrite: false })
  );
  paintLayer.rotation.x = -Math.PI / 2;
  paintLayer.position.y = 0.08;
  g.add(paintLayer);
  plantCropCircle(g, CROP_R);   // plantas espalhadas dentro do círculo (InstancedMesh)

  // compose() faz clearRect+drawImage no canvas de 1024² inteiro e força reenvio
  // da textura pra GPU (needsUpdate) — caro se rodar nos 60fps do loop principal
  // pra cada pivô irrigando ao mesmo tempo. A pintura da cunha em si (wctx) é
  // barata e roda todo frame p/ o rastro ficar contínuo sem buracos; só o
  // recompose visível (o que a GPU realmente recebe) é limitado a ~15Hz —
  // imperceptível pra um véu de "já irrigado" que muda devagar.
  const COMPOSE_EVERY_N_FRAMES = 4;
  let composeCounter = 0;
  const paintWedge = (a0, a1, color) => {
    // pinta OPACO na máscara — passar de novo pelo mesmo setor não acumula
    wctx.save();
    wctx.translate(HALF, HALF);
    wctx.fillStyle = color || 'rgb(80,170,255)';
    wctx.beginPath();
    wctx.moveTo(0, 0);
    wctx.arc(0, 0, HALF - TRACK_W, a0 - 0.02, a1 + 0.02);
    wctx.closePath();
    wctx.fill();
    wctx.restore();
    if (composeCounter <= 0) {
      compose();
      composeCounter = COMPOSE_EVERY_N_FRAMES;
    } else {
      composeCounter--;
    }
  };

  const arm = new THREE.Group();                  // gira em torno de Y
  g.add(arm);

  // modelo 3D: base fixa fica em `g` (não gira); eixo + torres ficam em `arm`
  // e giram juntos (as partes já saem do loader centradas no eixo de giro)
  const spinners = [];   // grupos de roda deste pivô — a simulação gira rotation.z
  loadPivotModel().then((parts) => {
    if (!parts) return;
    const base = parts.base.clone();
    g.add(base);
    const hinge = base.getObjectByName(DOOR_HINGE_NODE);
    if (hinge) {
      pv.doorHinge = hinge;
      pv.doorClosedY = hinge.rotation.y;
      g.updateMatrixWorld(true);   // g nunca renderizou ainda — força o cálculo da cadeia toda
      hinge.getWorldPosition(pv.doorPos);
    }
    const lance = parts.lance.clone();
    lance.traverse((o) => { if (o.userData.wheelSpin) spinners.push(o); });
    arm.add(lance);
  });

  // spray de água: cada gota nasce na boca de um bocal (NOZZLE_XS) com um jato
  // em cone pros lados e cai em parábola (gravidade) até o chão
  const dropPos = new Float32Array(DROPS * 3);
  const dropVel = new Float32Array(DROPS * 3);

  const resetDrop = (i) => {
    const i3 = i * 3;
    const nozzle = i % NOZZLE_XS.length;
    const nx = NOZZLE_XS[nozzle];
    // offsets em fração do SPRAY_TOP (acompanham o boost em vez de fixos em metros):
    // painel até a 3ª torre (motriz) fica tudo no mesmo nível. Depois da torre
    // motriz é um arco suave: começa na mesma altura da torre e sobe aos
    // poucos até a ponta (sem degrau — curva contínua)
    let dropFrac = 0.38;
    if (nx >= WHEEL_RADII[2]) {
      const t = Math.min(1, (nx - WHEEL_RADII[2]) / (PIVOT_ARM_REACH - WHEEL_RADII[2]));
      const eased = 1 - Math.cos(t * Math.PI / 2);   // sobe suave (arco), começa devagar
      dropFrac = 0.38 - eased * (0.38 - 0.14);
    }
    const drop = dropFrac * SPRAY_TOP;
    dropPos[i3] = nx + (Math.random() - 0.5) * 0.25;      // boca do bocal
    dropPos[i3 + 1] = SPRAY_TOP - drop;                   // aspersor pendurado abaixo do cano
    dropPos[i3 + 2] = (Math.random() - 0.5) * 0.15;
    const ang = Math.random() * Math.PI * 2;              // jato em cone (leque)
    const spd = 1.1 + Math.random() * 1.7;
    dropVel[i3] = Math.cos(ang) * spd;
    dropVel[i3 + 1] = -(0.3 + Math.random() * 0.9);
    dropVel[i3 + 2] = Math.sin(ang) * spd;
  };
  for (let i = 0; i < DROPS; i++) {
    resetDrop(i);
    // espalha cada gota num ponto aleatório da própria trajetória, pra não pulsar
    const t0 = Math.random() * 1.0;
    const i3 = i * 3;
    dropPos[i3] += dropVel[i3] * t0;
    dropPos[i3 + 1] += dropVel[i3 + 1] * t0 - 0.5 * SPRAY_G * t0 * t0;
    dropPos[i3 + 2] += dropVel[i3 + 2] * t0;
    dropVel[i3 + 1] -= SPRAY_G * t0;
  }

  const updateSpray = (dt) => {
    for (let i = 0; i < DROPS; i++) {
      const i3 = i * 3;
      dropVel[i3 + 1] -= SPRAY_G * dt;
      dropPos[i3] += dropVel[i3] * dt;
      dropPos[i3 + 1] += dropVel[i3 + 1] * dt;
      dropPos[i3 + 2] += dropVel[i3 + 2] * dt;
      if (dropPos[i3 + 1] <= 0.05) resetDrop(i);
    }
    dropGeo.attributes.position.needsUpdate = true;
  };

  const dropGeo = new THREE.BufferGeometry();
  dropGeo.setAttribute('position', new THREE.BufferAttribute(dropPos, 3));
  const dropMat = new THREE.PointsMaterial({
    map: makeDropSprite(), color: 0xd9edff, size: 0.7,
    transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true
  });
  arm.add(new THREE.Points(dropGeo, dropMat));

  scene.add(g);
  pv = {
    arm, paint: paintWedge, spinners,
    updateSpray, dropMat,
    pos: g.position,   // centro do pivô em mundo — usado pra detectar câmera embaixo do braço molhando
    angle: Math.random() * Math.PI * 2,           // cada um começa numa fase
    swept: 0, wetSwept: 0, laps: 0,
    speedMul: 0.75 + Math.random() * 0.5,         // velocidades levemente diferentes
    // ---- controle individual (via modal de operação) ----
    active: false,         // liga/desliga o pivô sozinho (começa desligado)
    dir: 1,                // 1 = avanço, -1 = reverso
    wet: true,             // molhado (spray) vs seco (só gira, sem água)
    pct: 100,              // percentímetro (velocidade em %)
    stopAngle: null,       // grau (0-360) onde deve parar sozinho
    stopLaps: null,        // nº de voltas onde deve parar sozinho
    ferti: false,          // fertirrigação (status "Ferti irrigando")
    finished: false,       // operação concluída sozinha (stopAngle/stopLaps atingido)
    alertUntil: 0,         // clock.elapsedTime até quando mostrar "Alerta no pivô"
    fillProgress: 0,       // 0-1: quanto do cano já está pressurizado (molhado só gira em 1)
    ramp: 0,               // 0-1: "aceleração" do motor ao ligar — sobe devagar em vez de já nascer na velocidade máxima (ver simulation.js)
    // ---- porta do painel (tecla E por proximidade — ver panel-interact.js) ----
    doorHinge: null,       // nó "dobradica_porta_painel" do clone (setado quando o modelo carrega)
    doorClosedY: 0,        // rotation.y da dobradiça fechada (pose original do arquivo)
    doorOpen: false,       // estado alvo (aberto/fechado)
    doorAnim: 0,           // 0..1 progresso da animação até o alvo
    doorPos: new THREE.Vector3()   // posição mundial da porta, p/ checar distância do fazendeiro
  };
  return pv;
}

// chamado todo frame do loop principal — anima a dobradiça de cada pivô em
// direção ao estado alvo (doorOpen) e aplica o giro no nó real
export function updatePivotDoors(pivots, dt) {
  for (const pv of pivots) {
    if (!pv.doorHinge) continue;
    const target = pv.doorOpen ? 1 : 0;
    if (pv.doorAnim === target) continue;
    const step = DOOR_ANIM_SPEED * dt;
    pv.doorAnim = target > pv.doorAnim
      ? Math.min(target, pv.doorAnim + step)
      : Math.max(target, pv.doorAnim - step);
    pv.doorHinge.rotation.y = pv.doorClosedY + pv.doorAnim * DOOR_OPEN_ANGLE;
  }
}

export function createPivots() {
  const pivots = PIVOTS_POS.map(([x, z]) => createPivot(x, z));
  pivots[0].angle = 0;                              // pivô principal: fase e ritmo de referência
  pivots[0].speedMul = 1;
  for (const pv of pivots) pv.arm.rotation.y = pv.angle;
  return pivots;
}
