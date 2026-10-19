// =====================================================================
//  Rio (lado leste) + segundo braço (lado noroeste) + ponto de
//  captação CAP-02, usado pelos ramais dos pivôs 3 e 5
// =====================================================================
import { scene } from '../core/setup.js';
import { buildRibbonGeometry } from '../core/ribbon.js';
import { loadRepeatTexture } from '../core/textures.js';
import { ROAD_SAMPLED, RIVER_SAMPLED } from '../terrain/noise.js';
import { steel, pipeBlue, rodBetween } from '../entities/materials.js';
import { makeSign } from '../entities/sign.js';
import { makeWaterMaterial } from './water-material.js';

// fita d'água/margem: o U acompanha o traçado (1 repetição por "largura"
// andada → texel ~quadrado) e o V cruza de uma beirada à outra
function riverRibbon(pts, width, yOffset) {
  return buildRibbonGeometry(pts, width, {
    elevate: (x, z, p) => p.y + yOffset,
    uvAt: (dist, side) => [dist / width, side]
  });
}

function addRibbonMesh(pts, width, yOffset, material) {
  const mesh = new THREE.Mesh(riverRibbon(pts, width, yOffset), material);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

export function createRivers() {
  // reaproveita as mesmas curvas usadas no achatamento do relevo (noise.js),
  // garantindo que a malha visível dos rios bata exatamente com a área plana
  // (terrainHeight já força y=0 bem no leito do rio — base 0 aqui, com só
  // uma leve elevação nos offsets abaixo, do mesmo jeito que o pond.js faz
  // pra colar no chão real sem flutuar nem cravar z-fighting)
  const riverSamples = RIVER_SAMPLED.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const river2Samples = ROAD_SAMPLED.map(([x, z]) => new THREE.Vector3(x, 0, z));

  // solo fotográfico das margens (ambientCG "Ground085", CC0)
  const bankMat = new THREE.MeshLambertMaterial({
    map: loadRepeatTexture('models/ground/Ground085_Color.jpg')
  });
  // água texturizada: o U da fita acompanha o rio, então o offset.x vira correnteza
  // (tint esverdeado neutraliza o azul da textura — água doce natural)
  const waterOpts = { repeat: [1, 1], speed: [-0.05, 0.008], tint: 0x54806e };

  addRibbonMesh(riverSamples, 17, 0.05, bankMat);
  addRibbonMesh(riverSamples, 9, 0.08, makeWaterMaterial(waterOpts));

  // segundo braço de rio — lado noroeste, perto do celeiro
  addRibbonMesh(river2Samples, 13, 0.05, bankMat);
  addRibbonMesh(river2Samples, 7, 0.08, makeWaterMaterial(waterOpts));

  // ponto do rio mais próximo do meio-caminho entre os pivôs 3 e 5
  const midTarget = new THREE.Vector3(178, 0, -30);
  let intake2Idx = 0, bestD = Infinity;
  riverSamples.forEach((p, i) => {
    const d = Math.hypot(p.x - midTarget.x, p.z - midTarget.z);
    if (d < bestD) { bestD = d; intake2Idx = i; }
  });
  const intake2Pt = riverSamples[intake2Idx];
  const prevPt = riverSamples[Math.max(0, intake2Idx - 1)];
  const nextPt = riverSamples[Math.min(riverSamples.length - 1, intake2Idx + 1)];
  const tangent2 = new THREE.Vector3().subVectors(nextPt, prevPt).normalize();
  const bankNormal2 = new THREE.Vector3(-tangent2.z, 0, tangent2.x).normalize();
  if (bankNormal2.x > 0) bankNormal2.multiplyScalar(-1);   // margem oeste, voltada p/ os pivôs
  const capBase = intake2Pt.clone().addScaledVector(bankNormal2, 9);

  const cap2 = new THREE.Group();
  cap2.add(rodBetween(
    new THREE.Vector3(intake2Pt.x, -0.3, intake2Pt.z),
    new THREE.Vector3(capBase.x, 1.0, capBase.z), 0.28, steel));
  const valve2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), pipeBlue);
  valve2.position.set(capBase.x, 1.0, capBase.z);
  valve2.castShadow = true;
  cap2.add(valve2);
  const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), steel);
  pole2.position.set(capBase.x + bankNormal2.x * 1.6, 1.3, capBase.z + bankNormal2.z * 1.6);
  cap2.add(pole2);
  const sign2 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1), makeSign('CAP-02'));
  sign2.position.set(pole2.position.x, 2.75, pole2.position.z);
  sign2.lookAt(pole2.position.x + bankNormal2.x * 20, 2.75, pole2.position.z + bankNormal2.z * 20);
  cap2.add(sign2);
  scene.add(cap2);

  const ripple2 = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.5, 32),
    new THREE.MeshBasicMaterial({ color: 0xa8dcf2, transparent: true, opacity: 0.5, depthWrite: false })
  );
  ripple2.rotation.x = -Math.PI / 2;
  ripple2.position.set(intake2Pt.x, 1.15, intake2Pt.z);
  scene.add(ripple2);

  return { intake2Pt, ripple2 };
}
