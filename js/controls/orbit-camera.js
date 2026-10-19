// =====================================================================
//  Câmera orbital + voo livre — arrastar gira, scroll aproxima/afasta,
//  WASD desloca pelo mapa (E/Espaço sobe, Q desce, Shift acelera)
// =====================================================================
import { camera } from '../core/setup.js';

const ZOOM_MIN = 6;         // pode chegar bem perto (era 45)
const ZOOM_MAX = 380;
const FLY_MIN_SPD = 14;     // unidades/s no zoom máximo de perto
const FLY_DIST_FACTOR = 0.6; // quanto mais longe o zoom, mais rápido voa
const MAP_LIMIT = 340;      // não deixa sair do terreno modelado
const ALT_MIN = 1, ALT_MAX = 180;

export function createOrbitCamera(canvas, isSuspended) {
  isSuspended = isSuspended || function () { return false; };
  const target = new THREE.Vector3(0, 2, 0);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { theta: 2.35, phi: 1.3, dist: 60, distGoal: 60, reducedMotion };
  if (reducedMotion) state.dist = state.distGoal;

  // vista inicial via URL: ?cam=x,z[,dist[,theta]] — ex.: ?cam=-60,-100,70
  // Atalho de desenvolvimento pra conferir uma região do mapa sem mexer no código.
  const camParam = new URLSearchParams(location.search).get('cam');
  if (camParam) {
    const [cx, cz, d, th] = camParam.split(',').map(Number);
    if (Number.isFinite(cx) && Number.isFinite(cz)) target.set(cx, 2, cz);
    if (Number.isFinite(d)) { state.dist = d; state.distGoal = d; }
    if (Number.isFinite(th)) state.theta = th;
  }

  function updateCamera() {
    camera.position.set(
      target.x + state.dist * Math.sin(state.phi) * Math.cos(state.theta),
      target.y + state.dist * Math.cos(state.phi),
      target.z + state.dist * Math.sin(state.phi) * Math.sin(state.theta)
    );
    camera.lookAt(target);
  }

  // dirty: só recalcula posição/lookAt da câmera quando algo de fato mudou
  // (arrastar, zoom, voo por teclado) — parada, o update() não faz nada além
  // de checar essa flag, em vez de refazer o mesmo cálculo/lookAt 60x/s à toa.
  let dirty = true;   // primeiro frame sempre posiciona a câmera

  let dragging = false, px = 0, py = 0;
  canvas.addEventListener('pointerdown', function (e) {
    if (isSuspended()) return;
    dragging = true; px = e.clientX; py = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging || isSuspended()) return;
    state.theta += (e.clientX - px) * 0.005;
    state.phi = Math.min(1.52, Math.max(0.08, state.phi - (e.clientY - py) * 0.005));
    px = e.clientX; py = e.clientY;
    dirty = true;
  });
  canvas.addEventListener('pointerup', function () { dragging = false; });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (isSuspended()) return;
    state.distGoal = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, state.distGoal * (1 + e.deltaY * 0.001)));
    dirty = true;
  }, { passive: false });

  // ---- voo livre por teclado (só quando o modo fazendeiro está inativo) ----
  const keys = {};
  function typing() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ||
                  el.tagName === 'SELECT' || el.isContentEditable);
  }
  window.addEventListener('keydown', function (e) {
    if (typing()) return;
    keys[e.code] = true;
    // espaço sobe — evita a página rolar junto
    if (e.code === 'Space' && !isSuspended()) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () {
    for (const k in keys) keys[k] = false;
  });

  function fly(dt) {
    const spd = (keys['ShiftLeft'] || keys['ShiftRight'] ? 2.2 : 1) *
      Math.max(FLY_MIN_SPD, state.dist * FLY_DIST_FACTOR);
    // direção pra onde a câmera olha, achatada no plano XZ
    const fx = -Math.cos(state.theta), fz = -Math.sin(state.theta);
    const rx = -fz, rz = fx;   // vetor "direita" da tela
    let mx = 0, mz = 0, my = 0;
    if (keys['KeyW'] || keys['ArrowUp']) { mx += fx; mz += fz; }
    if (keys['KeyS'] || keys['ArrowDown']) { mx -= fx; mz -= fz; }
    if (keys['KeyD'] || keys['ArrowRight']) { mx += rx; mz += rz; }
    if (keys['KeyA'] || keys['ArrowLeft']) { mx -= rx; mz -= rz; }
    if (keys['KeyE'] || keys['Space']) my += 1;
    if (keys['KeyQ'] || keys['KeyC']) my -= 1;
    if (mx === 0 && mz === 0 && my === 0) return;

    const len = Math.hypot(mx, mz) || 1;
    target.x = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, target.x + (mx / len) * spd * dt));
    target.z = Math.max(-MAP_LIMIT, Math.min(MAP_LIMIT, target.z + (mz / len) * spd * dt));
    target.y = Math.max(ALT_MIN, Math.min(ALT_MAX, target.y + my * spd * dt));
    dirty = true;
  }

  function update(dt) {
    if (isSuspended()) return;
    fly(dt);
    const distDiff = state.distGoal - state.dist;
    if (Math.abs(distDiff) > 0.001) {
      state.dist += distDiff * (state.reducedMotion ? 1 : Math.min(1, dt * 2));
      dirty = true;
    } else if (state.dist !== state.distGoal) {
      state.dist = state.distGoal;   // fecha a última fração — evita lerp infinito por ponto flutuante
      dirty = true;
    }
    if (!dirty) return;
    updateCamera();
    dirty = false;
  }

  return { update };
}
