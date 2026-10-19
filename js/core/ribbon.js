// =====================================================================
//  Fita de geometria — malha contínua de 2 vértices por amostra que
//  segue uma polilinha no plano XZ. Base comum das estradas e dos rios
//  (antes cada um tinha sua cópia deste triângulo-a-triângulo).
// =====================================================================

// pts: Vector3[] amostrados ao longo do traçado.
// width: largura total da fita.
// elevate(x, z, pt): altura do vértice — estradas usam o relevo, rios a
//   cota d'água do próprio ponto.
// uvAt(dist, side): UV do vértice; `dist` é a distância acumulada ao
//   longo do traçado e `side` 0/1 é a beirada esquerda/direita.
export function buildRibbonGeometry(pts, width, { elevate, uvAt }) {
  const positions = [];
  const uvs = [];
  let dist = 0;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    // normal da fita no plano XZ (perpendicular à direção local do traçado)
    const dx = next.x - prev.x, dz = next.z - prev.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len, nz = dx / len;
    if (i > 0) dist += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);

    const lx = p.x + nx * width / 2, lz = p.z + nz * width / 2;
    const rx = p.x - nx * width / 2, rz = p.z - nz * width / 2;
    positions.push(lx, elevate(lx, lz, p), lz);
    positions.push(rx, elevate(rx, rz, p), rz);
    uvs.push(...uvAt(dist, 0), ...uvAt(dist, 1));
  }

  const indices = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    // ordem que deixa a normal virada pra cima (senão a fita fica de
    // costas pra câmera vista de cima)
    indices.push(a, c, b, b, c, d);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
