// =====================================================================
//  Modelos GLTF (opcional) — coloque .glb em models/ e registre aqui
//  (ou chame registerModel() a partir de outro módulo, antes de
//  loadGltfModels() rodar em main.js).
//  IMPORTANTE: precisa abrir via servidor local (ex.: `npx serve` na
//  pasta do projeto) — abrindo o index.html direto do disco o navegador
//  bloqueia a leitura dos arquivos .glb.
// =====================================================================
import { scene } from './core/setup.js';
import { terrainHeight } from './terrain/noise.js';

const GLTF_MODELS = [
  // exemplo:
  // { file: 'models/trator.glb', position: [-85, 0, 60], scale: 2, rotationY: 0.6 },
];

// permite que outros módulos (ex.: environment/farm-hq.js) registrem
// modelos antes da carga — { file, position: [x,y,z], scale, rotationY }
export function registerModel(entry) {
  GLTF_MODELS.push(entry);
}

export function loadGltfModels() {
  if (!(window.THREE && THREE.GLTFLoader && GLTF_MODELS.length)) return;
  const gltfLoader = new THREE.GLTFLoader();
  GLTF_MODELS.forEach(({ file, position, scale = 1, rotationY = 0, onLoad }) => {
    gltfLoader.load(encodeURI(file), (gltf) => {
      const obj = gltf.scene;
      obj.traverse((o) => {
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
      });
      obj.scale.setScalar(scale);
      obj.rotation.y = rotationY;
      // o modelo assenta na altura do terreno; position[1] é só offset extra em Y
      obj.position.set(
        position[0],
        terrainHeight(position[0], position[2]) + (position[1] || 0),
        position[2]
      );
      if (onLoad) onLoad(obj);
      scene.add(obj);
    }, undefined, () => {
      console.warn(`Não foi possível carregar ${file} — verifique o caminho e se está rodando via servidor local.`);
    });
  });
}
