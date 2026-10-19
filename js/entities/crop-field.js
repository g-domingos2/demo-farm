// =====================================================================
//  Plantas dentro do círculo de cada pivô (Poly Haven "weed_plant_02",
//  CC0, decimada p/ web) — espalhadas via InstancedMesh: todas as
//  plantas de um círculo custam 1 draw call, não centenas
// =====================================================================

const PLANT_FILE = 'models/plant/weed_plant_web.glb';
const ROW_SPACING = 3.5;     // distância entre fileiras concêntricas
const PLANT_SPACING = 2.6;   // distância entre plantas na mesma fileira
const JITTER = 0.7;          // bagunçinha natural na posição de cada planta
const INNER_GAP = 7;         // raio livre em torno da torre central
const OUTER_MARGIN = 0.92;   // fração do raio até onde as plantas chegam
const SCALE_MIN = 2.4;       // a planta original tem ~0.3 de altura
const SCALE_VAR = 1.6;

let plantPromise = null;
function loadPlantMeshes() {
  if (!plantPromise) {
    plantPromise = new Promise((resolve, reject) => {
      new THREE.GLTFLoader().load(encodeURI(PLANT_FILE), (gltf) => {
        gltf.scene.updateMatrixWorld(true);
        const meshes = [];
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          // recorte firme das folhas via alphaTest — evita os bugs de
          // ordenação que material transparente daria com instancing
          o.material.alphaTest = 0.5;
          o.material.transparent = false;
          o.material.side = THREE.DoubleSide;
          // assa a transformação do nó na geometria (conversão Y-up etc.),
          // pra instância com matriz própria já nascer em pé
          const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
          meshes.push({ geometry: geo, material: o.material });
        });
        resolve(meshes);
      }, undefined, reject);
    });
  }
  return plantPromise;
}

// `group` é o grupo estático do pivô (não gira com o braço); `radius` é o
// raio de cultivo (CROP_R). Plantação em fileiras concêntricas (como cultivo
// de pivô real), com leve bagunça por planta pra não parecer carimbo.
export function plantCropCircle(group, radius) {
  loadPlantMeshes().then((meshes) => {
    const dummy = new THREE.Object3D();
    const matrices = [];
    const maxR = radius * OUTER_MARGIN;
    for (let r = INNER_GAP; r <= maxR; r += ROW_SPACING) {
      const count = Math.max(8, Math.round((2 * Math.PI * r) / PLANT_SPACING));
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        dummy.position.set(
          Math.cos(a) * r + (Math.random() - 0.5) * JITTER,
          0.05,
          Math.sin(a) * r + (Math.random() - 0.5) * JITTER
        );
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.scale.setScalar(SCALE_MIN + Math.random() * SCALE_VAR);
        dummy.updateMatrix();
        matrices.push(dummy.matrix.clone());
      }
    }
    meshes.forEach(({ geometry, material }) => {
      const inst = new THREE.InstancedMesh(geometry, material, matrices.length);
      matrices.forEach((m, i) => inst.setMatrixAt(i, m));
      inst.instanceMatrix.needsUpdate = true;
      group.add(inst);
    });
  }).catch(() => {
    console.warn(`Não foi possível carregar ${PLANT_FILE} — verifique o caminho e se está rodando via servidor local.`);
  });
}
