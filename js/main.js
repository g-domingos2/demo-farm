// =====================================================================
//  Fazenda Demo 3D — Irrigação por Pivô
//  5 pivôs centrais irrigando, bomba puxando água do reservatório e de
//  um segundo ponto de captação no rio, relevo procedural, celeiro,
//  silo e dois braços de rio.
//
//  Ponto de entrada: monta a cena a partir dos módulos em js/ e roda
//  o loop de animação. Ver README.md para o mapa completo dos módulos.
// =====================================================================
import { canvas, renderer, scene, camera, resize } from './core/setup.js';
import { HQ_X, HQ_Z } from './config.js';

import { createGround } from './environment/ground.js';
import { createPond } from './environment/pond.js';
import { createPumpHouse } from './environment/pump-house.js';
import { createPumpModel } from './environment/pump-model.js';
import { createRivers } from './environment/river.js';
import { createRoads } from './environment/roads.js';
import { createFarmHQ } from './environment/farm-hq.js';
import { plantVegetation } from './environment/vegetation.js';
import { createSky, createMountains } from './environment/sky.js';
import { updateWater } from './environment/water-material.js';

import { createPivots, updatePivotDoors } from './entities/pivot.js';
import { loadFarmer } from './entities/farmer.js';
import { createBirds, updateBirds } from './entities/birds.js';

import { loadGltfModels } from './gltf-models.js';
import { createOrbitCamera } from './controls/orbit-camera.js';
import { createFarmerControl } from './controls/farmer-control.js';
import { createPanelInteract } from './controls/panel-interact.js';
import { createScreenWet } from './controls/screen-wet.js';

import { createPivotPanel } from './ui/pivot-panel.js';
import { initPumpPanel } from './ui/pump-panel.js';
import { installPumpModal } from './ui/pump-modal.js';
import { installPivotModal } from './ui/pivot-modal.js';
import { wirePanelToggles } from './ui/panel-toggles.js';

import { createSimulation } from './simulation.js';

// ---------- Terreno e água ----------
createGround();
const { ripple } = createPond();
createPumpHouse();
createPumpModel();
const { ripple2 } = createRivers();
createRoads();

// ---------- Sede, vegetação e céu ----------
createFarmHQ();
plantVegetation();
const birds = createBirds();
createSky();        // céu em gradiente + montanhas (p/ HDRI: trocar por createHdriSky())
createMountains();
loadGltfModels();

// ---------- Pivôs ----------
const pivots = createPivots();

// ---------- Painel lateral e modais ----------
createPivotPanel(pivots);
initPumpPanel();
installPumpModal();
installPivotModal(pivots);
wirePanelToggles();

// ---------- Câmera, fazendeiro controlável e simulação ----------
const farmerControl = createFarmerControl();
const orbitCamera = createOrbitCamera(canvas, farmerControl.isActive);
const panelInteract = createPanelInteract(pivots, farmerControl);
const screenWet = createScreenWet(pivots);
const simulation = createSimulation({ pivots, ripple, ripple2 });

loadFarmer(HQ_X + 2, HQ_Z + 22, 0)
  .then((handle) => farmerControl.setFarmer(handle, 0))
  .catch(() => {});

// ---------- Resize ----------
resize();

// ---------- Loop ----------
const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  orbitCamera.update(dt);
  farmerControl.update(dt);
  panelInteract.update();
  screenWet.update(dt);
  updatePivotDoors(pivots, dt);
  updateBirds(birds, dt, t);
  updateWater(dt);
  simulation.update(dt, t);

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
