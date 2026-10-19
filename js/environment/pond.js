// =====================================================================
//  Reservatório principal (lagoa + margem + ondulação de captação)
// =====================================================================
import { scene } from '../core/setup.js';
import { loadRepeatTexture } from '../core/textures.js';
import { POND_X, POND_Z } from '../config.js';
import { makeWaterMaterial } from './water-material.js';

export function createPond() {
  const POND = new THREE.Vector3(POND_X, 0, POND_Z);
  const pond = new THREE.Mesh(
    new THREE.CircleGeometry(16, 48),
    makeWaterMaterial({ repeat: [5, 5], speed: [0.012, 0.009], tint: 0x4a7264 })
  );
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(POND.x, 0.08, POND.z);
  scene.add(pond);

  // mesma terra fotográfica das margens dos rios (ambientCG "Ground085", CC0);
  // mapeamento planar do anel — ~1 tile a cada 8 unidades
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(16, 19.5, 48),
    new THREE.MeshLambertMaterial({
      map: loadRepeatTexture('models/ground/Ground085_Color.jpg', { repeat: [5, 5] })
    })
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(POND.x, 0.06, POND.z);
  scene.add(rim);

  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(3, 3.4, 40),
    new THREE.MeshBasicMaterial({ color: 0xa8dcf2, transparent: true, opacity: 0.5, depthWrite: false })
  );
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(POND.x, 0.12, POND.z);
  scene.add(ripple);

  return { POND, pond, rim, ripple };
}
