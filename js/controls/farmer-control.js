// =====================================================================
//  Controle do fazendeiro em 3ª pessoa — WASD anda/vira, câmera segue
//  atrás do personagem. Ativado/desativado pelo botão #farmerBtn.
// =====================================================================
import { camera, canvas } from '../core/setup.js';
import { terrainHeight } from '../terrain/noise.js';

const MOVE_SPD = 9;          // unidades/s andando
const RUN_SPD = 18;          // unidades/s correndo (Shift)
const TURN_SPD = 2.2;        // rad/s
const CAM_BACK = 7.5;        // distância da câmera atrás do personagem (zoom padrão)
const CAM_UP = 3.2;          // altura da câmera acima do chão (zoom padrão)
const CAM_BACK_MIN = 2.5;    // mais perto (zoom máximo)
const CAM_BACK_MAX = 18;     // mais longe (zoom mínimo)
const CAM_LOOK_UP = 1.6;     // altura do ponto mirado (por volta da cabeça)
const HINT_DURATION = 5000;  // ms que a dica de WASD fica visível ao entrar no modo

export function createFarmerControl() {
  let handle = null;    // { obj, mixer, play(name) } — ver entities/farmer.js
  let active = false;
  let yaw = 0;
  let camBack = CAM_BACK;   // distância atual da câmera — ajustada pelo scroll do mouse
  const keys = {};
  const camPos = new THREE.Vector3();
  const lookAt = new THREE.Vector3();

  const btn = document.getElementById('farmerBtn');
  const hintEl = document.getElementById('farmerHint');
  let hintTimer = null;

  // zoom com o scroll do mouse — só reage quando o modo fazendeiro está ativo
  canvas.addEventListener('wheel', function (e) {
    if (!active) return;
    e.preventDefault();
    camBack = Math.min(CAM_BACK_MAX, Math.max(CAM_BACK_MIN, camBack * (1 + e.deltaY * 0.001)));
  }, { passive: false });

  function setFarmer(farmerHandle, initialYaw) {
    handle = farmerHandle;
    yaw = initialYaw || 0;
  }

  function enter() {
    if (!handle) return;   // modelo ainda não carregou
    active = true;
    yaw = handle.obj.rotation.y;
    btn.classList.add('active');
    // dica aparece só uma vez ao entrar e some sozinha depois de um tempo
    if (hintEl) {
      hintEl.style.display = '';
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => { hintEl.style.display = 'none'; }, HINT_DURATION);
    }
  }
  function exit() {
    active = false;
    if (handle) handle.play('idle');
    btn.classList.remove('active');
    clearTimeout(hintTimer);
    if (hintEl) hintEl.style.display = 'none';
  }

  btn.addEventListener('click', function () {
    if (active) exit(); else enter();
  });
  window.addEventListener('keydown', function (e) {
    keys[e.code] = true;
    if (active && e.code === 'Escape') exit();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });

  function update(dt) {
    if (!handle) return;
    handle.mixer.update(dt);   // mantém a respiração do Idle mesmo fora do modo ativo
    if (!active) return;

    const farmer = handle.obj;
    const running = keys['ShiftLeft'] || keys['ShiftRight'];
    const spd = running ? RUN_SPD : MOVE_SPD;
    if (keys['KeyA'] || keys['ArrowLeft']) yaw += TURN_SPD * dt;
    if (keys['KeyD'] || keys['ArrowRight']) yaw -= TURN_SPD * dt;

    let move = 0;
    if (keys['KeyW'] || keys['ArrowUp']) move += 1;
    if (keys['KeyS'] || keys['ArrowDown']) move -= 1;

    if (move !== 0) {
      farmer.position.x += Math.sin(yaw) * move * spd * dt;
      farmer.position.z += Math.cos(yaw) * move * spd * dt;
      // limites do mapa — não deixa o fazendeiro sair do terreno modelado
      farmer.position.x = Math.max(-320, Math.min(320, farmer.position.x));
      farmer.position.z = Math.max(-320, Math.min(320, farmer.position.z));
    }
    farmer.position.y = terrainHeight(farmer.position.x, farmer.position.z);
    farmer.rotation.y = yaw;
    handle.play(move !== 0 ? (running ? 'run' : 'walk') : 'idle');

    // câmera em 3ª pessoa: segue atrás e um pouco acima, olhando para a cabeça
    // (CAM_UP acompanha o zoom pra manter o mesmo ângulo de visão ao aproximar/afastar)
    const camUp = CAM_UP * (camBack / CAM_BACK);
    camPos.set(
      farmer.position.x - Math.sin(yaw) * camBack,
      farmer.position.y + camUp,
      farmer.position.z - Math.cos(yaw) * camBack
    );
    camera.position.lerp(camPos, Math.min(1, dt * 6));
    lookAt.set(farmer.position.x, farmer.position.y + CAM_LOOK_UP, farmer.position.z);
    camera.lookAt(lookAt);
  }

  return {
    setFarmer, update,
    isActive: function () { return active; },
    getPosition: function () { return active && handle ? handle.obj.position : null; }
  };
}
