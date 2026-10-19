// =====================================================================
//  Configuração geral — layout da fazenda (pivôs, reservatório, sede)
// =====================================================================

// regiões que ficam planas: [cx, cz, raio, transição, cota?]
// cota (opcional) = altura do platô; sem ela o terreno aplaina na cota 0
export const FLAT_ZONES = [
  [0, 0, 83, 40],        // pivô principal
  [-150, -85, 83, 50],   // pivô 2
  [160, -115, 83, 50],   // pivô 3
  [-62, -217, 83, 50],   // pivô 4
  [185, 55, 83, 50],     // pivô 5
  [95, -55, 30, 25],     // reservatório
  [72, -42, 18, 20],     // casa de bomba
  [-60, -100, 26, 22],   // sede (casa-sede / quintal) — entre os pivôs 1, 2 e 4
  [68, -197, 20, 30, 5]  // galpão de madeira ao lado do trator — platô baixo (cota 5),
                         // entre as baixadas e os topos vizinhos pra assentar natural
];
// segundo braço de rio, lado noroeste (passa perto do celeiro até a casa de bomba)
export const ROAD_PATH = [
  [-170, 95], [-100, 62], [-40, 88], [25, 84], [70, 55], [86, 4], [94, -40]
];
// rio no lado leste do mapa, atrás dos pivôs 3 e 5 (curva afastada do raio do pivô 5)
export const RIVER_PATH = [
  [278, -190], [255, -125], [270, -55], [272, 15], [278, 75], [242, 125]
];

// ---------- Pivôs (fábrica: 5 unidades) ----------
export const CROP_R = 75;   // um pouco além do alcance do braço (73), pra ponta não vazar do círculo
// posições dos centros — o primeiro é o pivô principal (dados no painel)
export const PIVOTS_POS = [[0, 0], [-150, -85], [160, -115], [-62, -217], [185, 55]];

export const POND_X = 95, POND_Z = -55;
export const HQ_X = -60, HQ_Z = -100;

export const FLOW_NOMINAL = 248;
export const SPEED_FACTOR = 0.06;   // velocidade de cruzeiro bem devagar, sempre — pivô real não acelera, gira devagar o tempo todo
