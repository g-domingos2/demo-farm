// =====================================================================
//  Árvores e pedras (assentadas no relevo, fora dos campos e dos rios)
// =====================================================================
import { scene } from '../core/setup.js';
import { PIVOTS_POS, CROP_R } from '../config.js';
import { terrainHeight, distToRiver, distToRoad } from '../terrain/noise.js';

// árvore realista (Poly Haven "island_tree_01", CC0, decimada p/ web) —
// o .glb tem ~5 de altura; é carregado UMA vez e clonado em cada posição
const TREE_FILE = 'models/tree/island_tree_01_web.glb';
// pedra fotoescaneada (Poly Haven "namaqualand_boulder_02", CC0, ~2.5 de comprimento)
const STONE_FILE = 'models/stones/boulder_web.glb';

// posições conferidas contra os círculos dos pivôs (raio 75) — nada dentro
// deles; as últimas ficam em volta da sede (celeiro/silo/curral)
const TREES = [[-60, -85], [-95, -25], [-40, -115], [30, -105],
  [-75, 115], [-130, 90], [60, 120],
  [-155, 45], [-25, 130],
  [-40, -120], [-42, -82], [-75, -120]];

// carrega um .glb uma única vez e entrega o protótipo com sombras ligadas
function loadPrototype(file, onReady) {
  if (!(window.THREE && THREE.GLTFLoader)) return;
  new THREE.GLTFLoader().load(file, (gltf) => {
    const proto = gltf.scene;
    proto.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    onReady(proto);
  }, undefined, () => console.warn(`Não foi possível carregar ${file}`));
}

export function plantVegetation() {
  loadPrototype(TREE_FILE, (proto) => {
    TREES.forEach(([x, z]) => {
      const tree = proto.clone();
      tree.scale.setScalar(1.4 + Math.random() * 0.8);
      tree.position.set(x, terrainHeight(x, z), z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      scene.add(tree);
    });
  });

  loadPrototype(STONE_FILE, (proto) => {
    for (let i = 0; i < 14; i++) {
      let rx, rz, tries = 0;
      do {
        const a = Math.random() * Math.PI * 2, r = 100 + Math.random() * 90;
        rx = Math.cos(a) * r; rz = Math.sin(a) * r;
        tries++;
      } while (tries < 20 && (
        PIVOTS_POS.some(([px, pz]) => Math.hypot(rx - px, rz - pz) < CROP_R + 5) ||   // fora dos campos
        distToRiver(rx, rz) < 14 || distToRoad(rx, rz) < 11));                        // fora dos dois rios
      const rock = proto.clone();
      rock.scale.setScalar(0.6 + Math.random() * 1.7);   // de pedrinha a pedregulho
      rock.position.set(rx, terrainHeight(rx, rz) - 0.03, rz);
      rock.rotation.y = Math.random() * Math.PI * 2;
      scene.add(rock);
    }
  });
}
