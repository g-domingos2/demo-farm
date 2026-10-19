// =====================================================================
//  Carregamento de texturas — helper único para as fotos em mosaico
//  (grama, solo, margens, água). Centraliza wrap/repeat/encoding pra
//  todo material fotográfico da cena nascer com a mesma configuração.
// =====================================================================

// opts: { repeat: [u, v], srgb: true|false (false p/ normal maps),
//         anisotropy: n (segura a nitidez em ângulos rasos) }
export function loadRepeatTexture(file, { repeat = [1, 1], srgb = true, anisotropy = 0 } = {}) {
  const tex = new THREE.TextureLoader().load(file);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  if (srgb) tex.encoding = THREE.sRGBEncoding;
  if (anisotropy) tex.anisotropy = anisotropy;
  return tex;
}
