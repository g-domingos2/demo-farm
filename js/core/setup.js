// =====================================================================
//  Núcleo: renderer, cena, câmera e luzes
// =====================================================================

export const canvas = document.getElementById('scene');

export const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fc8e8);
scene.fog = new THREE.Fog(0x9fc8e8, 280, 720);

// far precisa cobrir o lado mais distante da esfera do céu (raio 1000) vista de um
// ponto fora do centro (câmera orbita bem afastada às vezes) — senão ela é cortada
// pelo plano de corte e aparece um "buraco"/cúpula no céu.
export const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 1500);
scene.add(camera);

scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x5d7a43, 0.55));
const sun = new THREE.DirectionalLight(0xfff0d6, 1.15);
sun.position.set(130, 170, 70);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -260; sun.shadow.camera.right = 260;
sun.shadow.camera.top = 260; sun.shadow.camera.bottom = -260;
sun.shadow.camera.far = 650;
sun.shadow.bias = -0.0004;
scene.add(sun);

export function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
