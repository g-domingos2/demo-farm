// =====================================================================
//  Sede da fazenda: casa-sede (.glb), caminhonete e dono da fazenda
// =====================================================================
import { HQ_X, HQ_Z } from '../config.js';
import { registerModel } from '../gltf-models.js';

export function createFarmHQ() {
  const HQ = new THREE.Vector3(HQ_X, 0, HQ_Z);

  // casa-sede (home_house_farm, Sketchfab) no lugar do antigo celeiro + silo.
  // O .glb é um diorama de ~34x34 com o quintal em volta e o centro visual
  // deslocado em (+12, -5) da origem — a posição abaixo compensa isso (x0.7)
  // pra casa cair centrada entre os pontos do celeiro e do silo.
  registerModel({
    file: 'models/house/home_house_farm_-_61mb.glb',
    position: [HQ.x - 4.4, 0, HQ.z + 0.6], scale: 0.7
  });
  // as árvores (inclusive a da sede) são plantadas em environment/vegetation.js,
  // que carrega a island_tree_01 uma única vez e clona em todas as posições

  // caminhonete estacionada em frente à casa (o .glb tem ~16 de comprimento
  // — escala 0.35 traz pro tamanho real de uma F-150, ~5.7)
  registerModel({ file: 'models/car/ford_f150.glb', position: [HQ.x + 3, 0, HQ.z + 14], scale: 0.35, rotationY: -0.9 });
  // "dono da fazenda": estátua do Straw Hat Farmer ao lado da caminhonete
  // (origem no tronco — o offset y=0.95 põe os pés no chão)
  registerModel({ file: 'models/farmer/straw_hat_farmer.glb', position: [HQ.x + 8, 0.95, HQ.z + 18], rotationY: 2.3 });
  // Farmer.glb é carregado à parte em js/main.js (js/entities/farmer.js), pois
  // precisa de uma referência ao objeto para o controle em 3ª pessoa (WASD)
}
