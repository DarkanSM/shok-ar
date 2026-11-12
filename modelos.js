// Modelos 3D de Shok hechos solo con geometrías de three.js (sin archivos externos)
import * as THREE from 'three';

const AZUL = 0x0A3D91, CREMA = 0xF2E9D3;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .4, metalness: 0, side: THREE.DoubleSide, ...o });
const lathe = (pts, seg = 56) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

// Parche curvo con el logo, pegado a una superficie redonda (de frente hacia +Z)
function parcheLogo(tex, r, y, ancho) {
  const alto = ancho / 2.9, largoArco = ancho / r;
  const g = new THREE.CylinderGeometry(r, r, alto, 32, 1, true, -largoArco / 2, largoArco);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: tex, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.position.y = y; return m;
}

// Centra el modelo y lo escala para que su lado más grande mida "tam"
function normalizar(grupo, tam = 1) {
  const caja = new THREE.Box3().setFromObject(grupo), c = caja.getCenter(new THREE.Vector3()), s = caja.getSize(new THREE.Vector3());
  grupo.position.sub(c);
  const pivote = new THREE.Group(); pivote.add(grupo);
  pivote.scale.setScalar(tam / Math.max(s.x, s.y, s.z)); return pivote;
}

function coctel(logo) {
  const g = new THREE.Group();
  const vidrio = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .28, roughness: .05, side: THREE.DoubleSide, depthWrite: false });
  g.add(new THREE.Mesh(lathe([[0, 0], [.55, 0], [.6, .04], [.5, .08], [.08, .13], [.06, .25], [.06, 1], [.12, 1.05], [.5, 1.12], [.85, 1.3], [1, 1.55], [1.02, 1.78]]), vidrio));
  g.add(new THREE.Mesh(lathe([[0, 1.2], [.45, 1.18], [.8, 1.33], [.93, 1.55], [.95, 1.64], [0, 1.64]]), mat(0xF26B5B, { roughness: .25 })));
  const espuma = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .1, 48), mat(0xFFE3DC, { roughness: .8 })); espuma.position.y = 1.68; g.add(espuma);
  g.add(parcheLogo(logo, .9, 1.45, 1.1));
  const lima = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .08, 28, 1, false, 0, Math.PI), mat(0x8DBA2F));
  const pulpa = new THREE.Mesh(new THREE.CylinderGeometry(.43, .43, .1, 28, 1, false, 0, Math.PI), mat(0xE6E48A));
  const gl = new THREE.Group(); gl.add(lima, pulpa); gl.rotation.set(Math.PI / 2, 0, -.5); gl.position.set(.95, 1.78, 0); g.add(gl);
  for (let i = 0; i < 5; i++) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(.01, .025, .9, 6), mat(0x2E5E2A));
    r.position.set(.55 - i * .03, 2.2, (i - 2) * .05); r.rotation.set((i - 2) * .12, 0, -.35 + i * .04); g.add(r);
  }
  return normalizar(g);
}

function textoLatte() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#B97A45'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#F7E9D0';
  [[128, 150, 70, 46], [128, 115, 56, 38], [128, 85, 42, 30], [128, 58, 28, 22]].forEach(([cx, cy, rx, ry]) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); });
  x.strokeStyle = '#B97A45'; x.lineWidth = 6; x.beginPath(); x.moveTo(128, 30); x.lineTo(128, 200); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function taza(logo) {
  const g = new THREE.Group(), crema = mat(CREMA, { roughness: .3 });
  g.add(new THREE.Mesh(lathe([[0, 0], [.6, 0], [1, .06], [1.65, .2], [1.72, .25], [1.64, .25], [1, .13], [0, .11]]), crema));
  const taza = new THREE.Group(); taza.position.y = .13;
  taza.add(new THREE.Mesh(lathe([[0, .1], [.45, .1], [.8, .35], [1, .85], [1.06, 1.3], [.98, 1.3], [.93, .85], [.75, .42], [0, .32]]), crema));
  const cafe = new THREE.Mesh(new THREE.CircleGeometry(.97, 48), new THREE.MeshStandardMaterial({ map: textoLatte(), roughness: .3 }));
  cafe.rotation.x = -Math.PI / 2; cafe.position.y = 1.22; taza.add(cafe);
  const asa = new THREE.Mesh(new THREE.TorusGeometry(.38, .075, 14, 28, Math.PI), crema); asa.rotation.z = -Math.PI / 2; asa.position.set(1.0, .85, 0); taza.add(asa);
  taza.add(parcheLogo(logo, .975, .75, 1.15)); g.add(taza);
  return normalizar(g);
}

function snack(logo) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(lathe([[0, 0], [.9, 0], [1, .04], [1.62, .2], [1.7, .22], [1.62, .22], [1.2, .1], [0, .1]]), mat(CREMA, { roughness: .3 })));
  const aro = new THREE.Mesh(new THREE.TorusGeometry(1.6, .03, 8, 72), mat(AZUL)); aro.rotation.x = Math.PI / 2; aro.position.y = .205; g.add(aro);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9 / 2.9), new THREE.MeshBasicMaterial({ map: logo, transparent: true }));
  pl.rotation.x = -Math.PI / 2; pl.position.set(0, .11, 1.0); g.add(pl);
  const trozo = (prof, color, y, esc = 1, o = {}) => {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1.25, -.42); s.lineTo(1.25, .42); s.closePath();
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: false }), mat(color, o));
    m.rotation.x = -Math.PI / 2; m.position.set(-.62, y, 0); m.scale.set(esc, esc, 1); return m;
  };
  g.add(trozo(.12, 0xC98F4A, .1)); g.add(trozo(.3, 0xFFF4D6, .22, .98)); g.add(trozo(.07, 0x7B1130, .52, 1, { roughness: .15 }));
  [[.35, .62, .1, 0x2B2E6B], [.6, .6, -.12, 0xB3122E], [.85, .62, .12, 0x2B2E6B], [.45, .6, .0, 0xB3122E]].forEach(([x, y, z, c]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), mat(c, { roughness: .2 })); b.position.set(x - .62, y, z); g.add(b);
  });
  const hoja = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 8), mat(0x3E9B4F)); hoja.scale.set(1.4, .2, .8); hoja.position.set(-.15, .64, 0); hoja.rotation.z = .3; g.add(hoja);
  return normalizar(g);
}

const FABRICAS = { cafe: taza, cocteles: coctel, snacks: snack };
export const crearModelo = (clave, logo) => FABRICAS[clave](logo);
