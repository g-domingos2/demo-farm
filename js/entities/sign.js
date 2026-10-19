// =====================================================================
//  Placa de identificação (ponto de captação)
// =====================================================================

export function makeSign(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 96;
  const sx = c.getContext('2d');
  sx.fillStyle = '#1e3a6e';
  sx.fillRect(0, 0, 256, 96);
  sx.strokeStyle = '#ffffff'; sx.lineWidth = 4;
  sx.strokeRect(6, 6, 244, 84);
  sx.fillStyle = '#ffffff';
  sx.font = 'bold 40px "Segoe UI", sans-serif';
  sx.textAlign = 'center'; sx.textBaseline = 'middle';
  sx.fillText(text, 128, 50);
  return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.DoubleSide });
}
