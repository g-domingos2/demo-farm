// =====================================================================
//  Céu: gradiente + montanhas 360° (padrão) — ou HDRI (createHdriSky,
//  mantido pra voltar fácil trocando a chamada em main.js)
// =====================================================================
import { scene, renderer } from '../core/setup.js';

// Foto do horizonte: "Turnau Hochanger Panorama 20171014" — Wikimedia
// Commons (CC BY-SA). Arquivo binário em models/sky/ (era um base64 de
// 441 KB embutido em JS; como .jpg o navegador baixa em paralelo e
// decodifica nativamente, sem custo de parse).
const MOUNTAIN_FILE = 'models/sky/mountains.jpg';

// Panorama HDRI: esfera 360° nítida de fundo + PMREM como luz ambiente/reflexos
// (o .hdr 2K vem do Poly Haven, CC0 — modelos MeshStandard ganham a luz dourada)
export function createHdriSky() {
  if (!THREE.RGBELoader) {
    console.warn('RGBELoader ausente — mantendo céu em gradiente');
    createSky(); createMountains();
    return;
  }
  new THREE.RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .load('models/grasslands_sunset_2k.hdr', (tex) => {
      const sky = new THREE.Mesh(
        new THREE.SphereGeometry(1000, 64, 40),
        new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })
      );
      sky.rotation.y = -0.9;   // gira o panorama pra alinhar o sol com a luz da cena
      scene.add(sky);

      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      scene.environment = pmrem.fromEquirectangular(tex).texture;
      pmrem.dispose();
    }, undefined, () => {
      console.warn('Falha ao carregar o HDRI — voltando ao céu em gradiente');
      createSky(); createMountains();
    });
}

export function createSky() {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 256;
  const x = c.getContext('2d');
  const grad = x.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#4f8cc7');
  grad.addColorStop(0.45, '#8ebede');
  grad.addColorStop(0.75, '#c3ddee');
  grad.addColorStop(1, '#dcecf5');
  x.fillStyle = grad;
  x.fillRect(0, 0, 2, 256);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1000, 48, 32),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.BackSide, fog: false })
  );
  scene.add(sky);
}

export function createMountains() {
  const RADIUS = 660;
  const mountains = new THREE.Mesh(
    new THREE.CylinderGeometry(RADIUS, RADIUS, 150, 64, 1, true),
    new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, fog: false, visible: false })
  );
  mountains.position.y = 69;
  scene.add(mountains);

  const img = new Image();
  img.onload = () => {
    const bandY = Math.round(img.height * 0.02);   // recorta a faixa do horizonte
    const bandH = Math.round(img.height * 0.60);
    const PW = 4096, PH = 256;                     // potência de 2 p/ repeat no WebGL1
    const pc = document.createElement('canvas');
    pc.width = PW; pc.height = PH;
    const g = pc.getContext('2d');
    g.drawImage(img, 0, bandY, img.width, bandH, 0, 0, PW, PH);
    // véu atmosférico para casar com a névoa da cena
    g.fillStyle = 'rgba(159,200,232,0.18)';
    g.fillRect(0, 0, PW, PH);
    // topo dissolvendo no céu
    g.globalCompositeOperation = 'destination-out';
    const gt = g.createLinearGradient(0, 0, 0, PH * 0.3);
    gt.addColorStop(0, 'rgba(0,0,0,1)');
    gt.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gt;
    g.fillRect(0, 0, PW, PH * 0.3);
    g.globalCompositeOperation = 'source-over';
    // base dissolvendo na névoa do horizonte
    const gb = g.createLinearGradient(0, PH * 0.72, 0, PH);
    gb.addColorStop(0, 'rgba(159,200,232,0)');
    gb.addColorStop(1, 'rgba(159,200,232,1)');
    g.fillStyle = gb;
    g.fillRect(0, PH * 0.72, PW, PH * 0.28);

    const ptex = new THREE.CanvasTexture(pc);
    ptex.wrapS = THREE.MirroredRepeatWrapping;     // espelha p/ fechar 360° sem emenda
    ptex.repeat.x = 2;
    const worldH = Math.PI * RADIUS * (bandH / img.width) * 1.35;
    mountains.geometry.dispose();
    mountains.geometry = new THREE.CylinderGeometry(RADIUS, RADIUS, worldH, 64, 1, true);
    mountains.position.y = worldH / 2 - 6;
    mountains.material.map = ptex;
    mountains.material.visible = true;
    mountains.material.needsUpdate = true;
  };
  img.onerror = () => console.warn(`Sem ${MOUNTAIN_FILE} — horizonte fica só com o gradiente do céu`);
  img.src = MOUNTAIN_FILE;
}
