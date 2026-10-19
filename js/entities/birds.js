// =====================================================================
//  Pássaros voando em círculos sobre a fazenda (models/farm/Bird.glb)
//  — o modelo é uma malha rígida sem esqueleto/animação embutida, então
//  o "bater de asas" é simulado com um pulso de escala (achatamento
//  vertical periódico) em cima do voo em círculo.
// =====================================================================
import { scene } from '../core/setup.js';

const BIRD_FILE = 'models/farm/Bird.glb';
const BIRD_SCALE = 0.018;   // o modelo vem em escala bem maior que a cena
const COUNT = 9;

let birdPromise = null;
function loadBirdTemplate() {
  if (!birdPromise) {
    birdPromise = new Promise((resolve, reject) => {
      new THREE.GLTFLoader().load(encodeURI(BIRD_FILE), (gltf) => {
        gltf.scene.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        resolve(gltf.scene);
      }, undefined, reject);
    });
  }
  return birdPromise;
}

// devolve um array vazio de imediato; ele é preenchido assim que o
// modelo termina de carregar (updateBirds ignora enquanto estiver vazio)
export function createBirds() {
  const birds = [];
  loadBirdTemplate().then((template) => {
    for (let i = 0; i < COUNT; i++) {
      const b = template.clone(true);
      b.scale.setScalar(BIRD_SCALE * (0.85 + Math.random() * 0.3));
      Object.assign(b.userData, {
        cx: (Math.random() - 0.5) * 480,
        cz: (Math.random() - 0.5) * 480,
        radius: 50 + Math.random() * 140,
        height: 55 + Math.random() * 70,
        speed: (0.08 + Math.random() * 0.1) * (Math.random() < 0.5 ? 1 : -1),
        phase: Math.random() * Math.PI * 2,
        flapPhase: Math.random() * Math.PI * 2
      });
      scene.add(b);
      birds.push(b);
    }
  }).catch(() => {
    console.warn('Não foi possível carregar os pássaros — verifique o caminho e se está rodando via servidor local.');
  });
  return birds;
}

export function updateBirds(birds, dt, t) {
  for (const b of birds) {
    const ud = b.userData;
    const ang = t * ud.speed + ud.phase;
    const vx = -Math.sin(ang) * Math.sign(ud.speed);
    const vz = Math.cos(ang) * Math.sign(ud.speed);
    b.position.set(
      ud.cx + Math.cos(ang) * ud.radius,
      ud.height + Math.sin(t * 0.25 + ud.phase) * 4,
      ud.cz + Math.sin(ang) * ud.radius
    );
    b.rotation.y = Math.atan2(vx, vz);
    // batida de asas simulada: achatamento vertical periódico
    const flap = Math.sin(t * 9 + ud.flapPhase);
    b.scale.y = b.scale.x * (1 + flap * 0.3);
  }
}
