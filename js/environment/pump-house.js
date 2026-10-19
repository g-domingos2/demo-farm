// =====================================================================
//  Casa de bomba — modelo .glb real (casa de fazenda de madeira),
//  no mesmo ponto plano do relevo entre o reservatório e o 2º rio
// =====================================================================
import { registerModel } from '../gltf-models.js';

const PUMP_HOUSE_FILE = 'models/housepump/house_farm_wooden_-_28mb.glb';

// o .glb tem ~6.5 x 8.8 de base e ~5 de altura em cena (escala 0.01 já
// embutida no nó FBX); 0.8 traz pro porte de casa de bomba. A zona plana
// correspondente do relevo está em FLAT_ZONES ([72, -42] em config.js).
export function createPumpHouse() {
  registerModel({
    file: PUMP_HOUSE_FILE,
    position: [72, 0, -42],
    scale: 0.8,
    rotationY: 2.0   // frente voltada pro reservatório (sudeste)
  });
}
