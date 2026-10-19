# Fazenda Demo 3D — Irrigação por Pivô

Demo interativa em Three.js: 5 pivôs centrais irrigando, bomba puxando água
do reservatório e de um segundo ponto de captação no rio, relevo procedural,
sede da fazenda (modelos .glb reais) e dois braços de rio. Painel lateral
(estilo plataforma) com lista de pivôs/bombas, badges de status e modais de
operação.

## Como abrir

O projeto usa ES Modules (`<script type="module">`), então **precisa ser
servido por um servidor local** — não abre direto do disco:

```
cd C:\projetos\demo_farm
npx serve
# ou: python -m http.server 8000
```

E abra `http://localhost:3000` (ou `:8000`).

## Estrutura

```
index.html                      página principal (painel + canvas)
css/style.css                   agrega os partials abaixo
css/partials/_tokens.css        variáveis de cor/espaçamento
css/partials/_base.css          reset e estilos base
css/partials/_map-card.css      painel lateral (lista de pivôs/bombas)
css/partials/_modals.css        modais de operação (pivô + bomba)

js/
  main.js                       ponto de entrada — monta a cena e roda o loop
  config.js                     constantes de layout (pivôs, reservatório, sede)
  gltf-models.js                carregamento opcional de modelos .glb/.gltf
  three.min.js                  Three.js r128 (local, script clássico)
  GLTFLoader.js                 loader de modelos .glb/.gltf (script clássico)
  RGBELoader.js                 loader de HDRI (opcional, p/ createHdriSky)

  core/
    setup.js                    renderer, cena, câmera, luzes, resize
    textures.js                 helper único p/ texturas fotográficas repetidas
    ribbon.js                   fita de geometria — base das estradas e rios

  terrain/
    noise.js                    ruído procedural, altura do terreno,
                                 distância até rio (achatamento)

  environment/
    ground.js                   solo com relevo e cores por vértice
    pond.js                     reservatório principal (lagoa + ondulação)
    pump-house.js               casa de bomba (.glb de casa de madeira)
    river.js                    rio leste + 2º braço + ponto de captação CAP-02
    roads.js                    estradas de terra + trator estacionado
    farm-hq.js                  sede: casa-sede (.glb), caminhonete e dono da fazenda
    vegetation.js               árvores e pedras assentadas no relevo
    sky.js                      céu em gradiente + montanhas 360° (foto em models/sky/)
    water-material.js           material de água animado (correnteza)

  entities/
    materials.js                materiais compartilhados + helper (rodBetween)
    sign.js                     placa de identificação (canvas → textura)
    pivot.js                    fábrica do pivô central (braço, spray, cultura)
    crop-field.js               plantas dos círculos via InstancedMesh
    birds.js                    pássaros circulando o mapa
    farmer.js                   personagem controlável (gingado procedural)

  controls/
    orbit-camera.js             câmera orbital + voo livre (WASD)
    farmer-control.js           controle em 3ª pessoa do fazendeiro

  ui/
    modal.js                    shell compartilhado dos modais + utils de data
    status.js                   taxonomia de status do pivô (cores/rótulos)
    panel-toggles.js            categorias expansíveis (Pivôs / Bombas)
    pivot-panel.js              cartões de pivô, badges e busca
    pump-panel.js               catálogo PUMP_CONFIG + estado + cartões
    pump-modal.js               modal de operação da bomba
    pivot-modal.js              modal de operação do pivô (dial + formulário)

  simulation.js                 física por quadro: giro/pressurização/spray

models/
  farm/                         celeiro, silo, cerca, moinho, galinheiro (.glb)
  plant/                        plantas dos círculos de cultivo (.glb)
  sky/mountains.jpg             foto panorâmica do horizonte
```

## Onde customizar (js/config.js)

| O quê | Constante |
|---|---|
| Tamanho do pivô | `SPANS` (vãos) e `SPAN_LEN` (comprimento) |
| Posição dos pivôs | `PIVOTS_POS` |
| Posição do reservatório | `POND_X`, `POND_Z` |
| Posição da sede (celeiro/silo) | `HQ_X`, `HQ_Z` |
| Vazão nominal | `FLOW_NOMINAL` |
| Velocidade base dos pivôs | `SPEED_FACTOR` |
| Regiões planas do relevo | `FLAT_ZONES` |
| Traçado dos rios | `ROAD_PATH`, `RIVER_PATH` |

Relevo (altura das colinas): `terrainHeight()` em `js/terrain/noise.js`
— fator `4 + 13 * edge`.

## Adicionar uma bomba ao painel

O painel de bombas é orientado a dados: acrescente uma entrada em
`PUMP_CONFIG` (`js/ui/pump-panel.js`) e o cartão, o badge da categoria e o
modal de operação já funcionam:

```js
{ id: 'bomba07', name: 'Bomba 07', lastComm: '10 jul 2026 08:00' }
```

`drivesIrrigation: true` marca a bomba que de fato alimenta os pivôs na
simulação (só uma na demo).

## Modelos GLTF (casa-sede, casa de bomba, decorações)

A sede da fazenda (`js/environment/farm-hq.js`) carrega modelos `.glb`
reais via `registerModel()`:

```js
import { registerModel } from '../gltf-models.js';

registerModel({ file: 'models/house/home_house_farm_-_61mb.glb', position: [HQ.x - 4.4, 0, HQ.z + 0.6], scale: 0.7 });
registerModel({ file: 'models/car/ford_f150.glb', position: [HQ.x + 3, 0, HQ.z + 14], scale: 0.35, rotationY: -0.9 });
```

Dica de desenvolvimento: abra com `?cam=x,z[,dist[,theta]]` na URL
(ex.: `http://localhost:8000/?cam=-60,-100,80`) pra câmera já iniciar
enquadrando a região que você está ajustando.

`registerModel()` só enfileira o modelo — quem efetivamente dispara o
carregamento é `loadGltfModels()`, chamado uma única vez em `js/main.js`
depois que toda a cena já registrou o que precisava.

O modelo é posicionado automaticamente na altura do terreno (`terrainHeight`);
`position[1]` é só um deslocamento extra em Y, se precisar. `scale` e
`rotationY` são opcionais (padrão `1` e `0`).

Modelos alternativos já disponíveis em `models/farm/` (não usados por
padrão, troque o `file` acima para testar): `Barn.glb`, `Open Barn.glb`,
`Small Barn.glb`, `Silo House.glb`, `Fence.glb` / `Fence-e02PFKKhbr.glb`.

Para adicionar um modelo novo:

1. Baixe `.glb` gratuitos (CC0): [poly.pizza](https://poly.pizza),
   [Quaternius](https://quaternius.com), [Kenney](https://kenney.nl/assets)
2. Salve em `models/farm/`, `models/plant/` ou uma subpasta nova
3. Chame `registerModel({ file: 'models/.../arquivo.glb', position: [x, 0, z] })`
   a partir do módulo de ambiente relevante (ou direto em `js/main.js`)

## Crédito da imagem de fundo

Horizonte (`models/sky/mountains.jpg`): foto "Turnau Hochanger Panorama
20171014" — Wikimedia Commons, licença CC BY-SA:
https://commons.wikimedia.org/wiki/File:Turnau_Hochanger_Panorama_20171014.jpg
