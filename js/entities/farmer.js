// =====================================================================
//  Fazendeiro (personagem controlável em 3ª pessoa)
//  Modelo oficial: Farmer.glb (Quaternius, CC0) — riggado, com clipes
//  Idle/Walk/Run de verdade (crossfade abaixo). Se um dia usar um modelo
//  estático (sem esqueleto), o gingado procedural assume automaticamente;
//  ajuste FEET_OFFSET se a origem dele não for nos pés.
// =====================================================================
import { scene } from '../core/setup.js';
import { terrainHeight } from '../terrain/noise.js';

const FARMER_FILE = 'models/farm/Farmer.glb';
const FEET_OFFSET = 0;       // modelo riggado já tem origem nos pés
const FACE_FLIP = 0;         // se ele andar de costas, troque para Math.PI
const CLIP_NAMES = {
  idle: 'CharacterArmature|Idle',
  walk: 'CharacterArmature|Walk',
  run: 'CharacterArmature|Run'
};

// gingado procedural p/ modelo estático (sem esqueleto): pulinho no passo,
// balanço lateral e inclinação pra frente, pra não deslizar feito estátua
function proceduralGait(model) {
  let mode = 'idle', t = 0;
  return {
    play: (name) => { mode = name; },
    mixer: {
      update(dt) {
        t += dt;
        if (mode === 'idle') {
          model.position.y = FEET_OFFSET + Math.sin(t * 2) * 0.015;   // respiração
          model.rotation.z *= 0.9;
          model.rotation.x *= 0.9;
          return;
        }
        const freq = mode === 'run' ? 13 : 8;      // cadência dos passos
        const amp = mode === 'run' ? 0.09 : 0.05;  // altura do quique
        model.position.y = FEET_OFFSET + Math.abs(Math.sin(t * freq)) * amp;
        model.rotation.z = Math.sin(t * freq) * amp * 0.9;             // gingado
        model.rotation.x = mode === 'run' ? 0.1 : 0.05;                // inclina
      }
    }
  };
}

// carrega o modelo + animações e devolve { obj, mixer, play(name) } para que
// o controle em 3ª pessoa (controls/farmer-control.js) possa mover/animar
export function loadFarmer(x, z, rotationY) {
  return new Promise((resolve, reject) => {
    new THREE.GLTFLoader().load(encodeURI(FARMER_FILE), (gltf) => {
      const model = gltf.scene;
      model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      model.position.y = FEET_OFFSET;
      model.rotation.y = FACE_FLIP;
      // grupo com origem nos pés — o controle em 3ª pessoa cola essa origem no chão
      const obj = new THREE.Group();
      obj.add(model);
      obj.rotation.y = rotationY || 0;
      obj.position.set(x, terrainHeight(x, z), z);
      scene.add(obj);

      const mixer = new THREE.AnimationMixer(obj);
      const actions = {};
      for (const [key, clipName] of Object.entries(CLIP_NAMES)) {
        const clip = gltf.animations.find((c) => c.name === clipName);
        if (clip) actions[key] = mixer.clipAction(clip);
      }

      if (Object.keys(actions).length) {
        // modelo riggado: troca de clipes com crossfade suave
        let current = null;
        const play = (name, duration = 0.2) => {
          const next = actions[name];
          if (!next || current === next) return;
          if (current) current.fadeOut(duration);
          next.reset().setEffectiveWeight(1).fadeIn(duration).play();
          current = next;
        };
        play('idle', 0);
        resolve({ obj, mixer, play });
      } else {
        const gait = proceduralGait(model);
        resolve({ obj, mixer: gait.mixer, play: gait.play });
      }
    }, undefined, () => {
      console.warn('Não foi possível carregar o fazendeiro — verifique o caminho e se está rodando via servidor local.');
      reject();
    });
  });
}
