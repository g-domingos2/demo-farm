// =====================================================================
//  Materiais compartilhados e helper geométrico usados pelas estruturas
// =====================================================================

export const steel = new THREE.MeshStandardMaterial({ color: 0xd3d8dd, metalness: 0.65, roughness: 0.35 });
export const darkRubber = new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 0.9 });
export const concrete = new THREE.MeshStandardMaterial({ color: 0xa8a29a, roughness: 0.95 });
export const pipeBlue = new THREE.MeshStandardMaterial({ color: 0x3b6ea5, metalness: 0.3, roughness: 0.5 });
// indicador de pressurização: mostra a água enchendo o cano do pivô, do centro até a ponta
export const fillMat = new THREE.MeshStandardMaterial({ color: 0x4fa8e0, transparent: true, opacity: 0.55, metalness: 0.1, roughness: 0.3 });
// tubulação "raio-x": visível por baixo do terreno, semitransparente, ignora profundidade
export const ghostMat = new THREE.MeshBasicMaterial({
  color: 0x9fe0ff, transparent: true, opacity: 0.4,
  depthWrite: false, depthTest: false
});
export const undergroundPulseMat = new THREE.MeshBasicMaterial({
  color: 0xd8f3ff, transparent: true, opacity: 0.85, depthWrite: false, depthTest: false
});

export function rodBetween(p1, p2, radius, material) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 6), material);
  rod.position.copy(p1).addScaledVector(dir, 0.5);
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  rod.castShadow = true;
  return rod;
}
