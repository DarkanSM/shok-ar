// Bar Mode · filtro del gato de Shok con cámara frontal (three.js + MindAR face)
import * as THREE from 'three';

// Ajusta aquí la sensibilidad de los gestos
const CONFIG = { abrirBoca: .13, sonrisa: 1.13, cejas: 1.17, guino: .5, espera: 1400 };
const V3 = THREE.Vector3, DS = THREE.DoubleSide, ADD = THREE.AdditiveBlending;

const CSS = `
#hud{position:fixed;inset:0;z-index:20;pointer-events:none;font-family:'Fredoka',system-ui,sans-serif;color:#0A3D91}
#hud button{pointer-events:auto;font-family:inherit;cursor:pointer}
#hud .fila{position:absolute;top:max(10px,env(safe-area-inset-top));left:10px;right:56px;display:flex;gap:6px}
#hud .chip{flex:1;background:#F6EFE2;border:3px solid #0A3D91;border-radius:14px;padding:5px 2px;line-height:1.1;box-shadow:0 4px 0 #072C6B;color:#0A3D91;transition:.2s}
#hud .chip b{display:block;font-size:20px}#hud .chip span{display:block;font-size:11px;font-weight:700}#hud .chip small{display:block;font-size:9px;opacity:.75}
#hud .chip.on{background:#0A3D91;color:#F6EFE2;transform:scale(1.08)}
#hud .volver{position:absolute;top:max(10px,env(safe-area-inset-top));right:10px;width:38px;height:38px;border-radius:50%;border:3px solid #0A3D91;background:#F6EFE2;color:#0A3D91;font-size:18px;font-weight:700}
#hud .msg{position:absolute;left:0;right:0;top:30%;text-align:center;font-weight:700;font-size:20px;color:#F6EFE2;text-shadow:0 2px 10px #072C6B;transition:opacity .3s}
#hud .obt{position:absolute;bottom:max(22px,env(safe-area-inset-bottom));left:50%;margin-left:-37px;width:74px;height:74px;border-radius:50%;border:5px solid #F6EFE2;background:#0A3D91;font-size:32px;box-shadow:0 0 18px #4db8ff}
#hud .obt:active{transform:scale(.92)}
#hud .burbuja{position:absolute;left:50%;top:34%;transform:translate(-50%,0) scale(0);background:#F6EFE2;color:#0A3D91;border:4px solid #0A3D91;border-radius:26px;padding:8px 22px;font-size:34px;font-weight:700;box-shadow:0 6px 0 #072C6B;white-space:nowrap}
#hud .burbuja.va{animation:pop 1.3s ease-out forwards}
@keyframes pop{0%{transform:translate(-50%,10px) scale(0)}15%{transform:translate(-50%,0) scale(1.15)}30%{transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{transform:translate(-50%,-30px) scale(1);opacity:0}}
#hud .flash{position:absolute;inset:0;background:#cfe9ff;opacity:0;transition:opacity .35s}#hud .flash.on{opacity:.85;transition:none}
`;

const GESTOS = [['miau', '😮', 'Miau', 'abre la boca'], ['sonrisa', '😊', 'Ronroneo', 'sonríe'], ['shok', '🤨', '¡Shok!', 'sube las cejas'], ['modo', '😉', 'Modo bar', 'guiña un ojo']];

export async function iniciarFiltro({ container, audio, listo }) {
  await (document.fonts?.ready ?? Promise.resolve());
  const { MindARThree } = await import('mindar-face-three');
  const mind = new MindARThree({ container, uiLoading: 'no', uiScanning: 'no', uiError: 'no' });
  const { renderer, scene, camera } = mind;

  /* ---------- HUD ---------- */
  const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  const hud = document.createElement('div'); hud.id = 'hud';
  hud.innerHTML = `<div class="fila">${GESTOS.map(([k, e, t, h]) => `<button class="chip" data-k="${k}"><b>${e}</b><span>${t}</span><small>${h}</small></button>`).join('')}</div>
  <button class="volver" aria-label="Volver">✕</button><div class="msg">Muéstrame tu cara 🐱</div><div class="burbuja"></div>
  <button class="obt" aria-label="Foto">🐱</button><div class="flash"></div>`;
  document.body.append(hud);
  const $ = s => hud.querySelector(s);

  /* ---------- Landmarks (MediaPipe) ---------- */
  const IDX = [168, 234, 454, 10, 152, 1, 13, 14, 61, 291, 159, 145, 386, 374, 105, 334, 33, 133, 362, 263];
  const A = {}, V = {}; IDX.forEach(i => { A[i] = mind.addAnchor(i); V[i] = new V3(); });

  /* ---------- Materiales neón ---------- */
  const NEON = new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, blending: ADD, depthWrite: false, side: DS });
  const HALO = new THREE.MeshBasicMaterial({ color: 0x1f6bff, transparent: true, opacity: .3, blending: ADD, depthWrite: false, side: DS });
  const LENS = new THREE.MeshBasicMaterial({ color: 0x2a7bff, transparent: true, opacity: .22, blending: ADD, depthWrite: false, side: DS });
  const RELLENO = new THREE.MeshBasicMaterial({ color: 0x2a7bff, transparent: true, opacity: .35, blending: ADD, depthWrite: false, side: DS });
  const ROSA = new THREE.MeshBasicMaterial({ color: 0xff7eb6, transparent: true, opacity: .95, side: DS });

  const cil = (a, b, r, mat) => {
    const d = new V3().subVectors(b, a), len = d.length(), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
    m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); return m;
  };
  const neonLinea = (pts, r, cerrar) => {
    const g = new THREE.Group(), n = pts.length;
    for (let i = 0; i < (cerrar ? n : n - 1); i++) { const a = pts[i], b = pts[(i + 1) % n]; g.add(cil(a, b, r, NEON), cil(a, b, r * 3, HALO)); }
    pts.forEach(p => [[r, NEON], [r * 3, HALO]].forEach(([rr, mm]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(rr, 8, 6), mm); s.position.copy(p); g.add(s); }));
    return g;
  };

  /* ---------- Gato: orejas, lentes, nariz, bigotes (unidad = ancho de la cara) ---------- */
  const cat = new THREE.Group(); cat.visible = false; scene.add(cat);
  const oreja = lado => {
    const g = new THREE.Group(), base = new THREE.Group(); g.add(base);
    base.add(neonLinea([new V3(-.13, 0, 0), new V3(0, .34, 0), new V3(.13, 0, 0)], .014, true));
    const sh = new THREE.Shape(); sh.moveTo(-.1, .012); sh.lineTo(0, .27); sh.lineTo(.1, .012); sh.closePath();
    base.add(new THREE.Mesh(new THREE.ShapeGeometry(sh), RELLENO)); g.userData = { lado, base }; return g;
  };
  const orejaL = oreja(-1), orejaR = oreja(1); cat.add(orejaL, orejaR);

  const gafa = () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(.17, .016, 8, 40), NEON), new THREE.Mesh(new THREE.TorusGeometry(.17, .05, 8, 40), HALO), new THREE.Mesh(new THREE.CircleGeometry(.165, 32), LENS));
    return g;
  };
  const gafaA = gafa(), gafaB = gafa(); cat.add(gafaA, gafaB);
  const barra = (eje) => { const geo = new THREE.CylinderGeometry(.014, .014, 1, 8); eje === 'x' ? geo.rotateZ(Math.PI / 2) : geo.rotateX(Math.PI / 2); return new THREE.Mesh(geo, NEON); };
  const puente = barra('x'), patillaA = barra('z'), patillaB = barra('z'); cat.add(puente, patillaA, patillaB);

  const nariz = new THREE.Group(); { const t = new THREE.Shape(); t.moveTo(-.05, .03); t.lineTo(.05, .03); t.lineTo(0, -.03); t.closePath();
    nariz.add(new THREE.Mesh(new THREE.ShapeGeometry(t), ROSA), neonLinea([new V3(-.05, .03, .002), new V3(.05, .03, .002), new V3(0, -.03, .002)], .006, true)); } cat.add(nariz);
  const bigotes = new THREE.Group(), bigoteList = []; cat.add(bigotes);
  [-1, 1].forEach(s => [0, 1, 2].forEach(k => {
    const g = new THREE.Group(); g.position.set(s * .1, (1 - k) * .0, 0); g.add(neonLinea([new V3(0, 0, 0), new V3(s * .42, 0, 0)], .006));
    g.userData = { base: s * (k - 1) * .2, k }; bigotes.add(g); bigoteList.push(g);
  }));

  /* ---------- Partículas (sprites) ---------- */
  const tex = (draw, w = 128, h = 128) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const TEX = {
    heart: tex(x => { x.fillStyle = '#ff6fb5'; x.shadowColor = '#ff3d9a'; x.shadowBlur = 16; x.beginPath(); x.moveTo(64, 106); x.bezierCurveTo(8, 66, 22, 18, 64, 44); x.bezierCurveTo(106, 18, 120, 66, 64, 106); x.fill(); }),
    star: tex(x => { x.fillStyle = '#d8f1ff'; x.shadowColor = '#4db8ff'; x.shadowBlur = 18; x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 14 : 50, a = i * Math.PI / 4 - Math.PI / 2; x.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); } x.closePath(); x.fill(); }),
    bolt: tex(x => { x.fillStyle = '#fff7a8'; x.shadowColor = '#ffd400'; x.shadowBlur = 18; x.beginPath(); x.moveTo(78, 8); x.lineTo(34, 70); x.lineTo(62, 70); x.lineTo(46, 120); x.lineTo(96, 50); x.lineTo(68, 50); x.closePath(); x.fill(); })
  };
  const parts = [];
  const spawn = (t, pos, tam, vel, vida) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX[t], transparent: true, depthTest: false }));
    s.position.copy(pos); s.scale.setScalar(tam); s.renderOrder = 10; scene.add(s); parts.push({ s, vel, t: 0, vida });
  };
  const punto = (x, y, z) => cat.localToWorld(new V3(x, y, z));
  const lluvia = (t, n, desde, vel, tam) => { for (let i = 0; i < n; i++) spawn(t, punto(...desde(i)), W * tam * (.7 + Math.random() * .6), new V3((Math.random() - .5) * W * vel, (.3 + Math.random()) * W * vel, 0), 1 + Math.random() * .6); };

  /* ---------- Sonidos (WebAudio) ---------- */
  const ruido = (c, seg) => { const b = c.createBuffer(1, c.sampleRate * seg, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; };
  const SON = {
    miau(c, t) {
      const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; f.type = 'bandpass'; f.Q.value = 3;
      o.frequency.setValueAtTime(420, t); o.frequency.linearRampToValueAtTime(780, t + .18); o.frequency.exponentialRampToValueAtTime(380, t + .7);
      f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(2200, t + .2); f.frequency.linearRampToValueAtTime(1000, t + .7);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.55, t + .05); g.gain.setValueAtTime(.5, t + .4); g.gain.linearRampToValueAtTime(0, t + .75);
      o.connect(f).connect(g).connect(c.destination); o.start(t); o.stop(t + .8);
    },
    sonrisa(c, t) { // ronroneo
      const n = ruido(c, 2), lp = c.createBiquadFilter(), am = c.createGain(), lfo = c.createOscillator(), prof = c.createGain(), env = c.createGain(), o = c.createOscillator();
      lp.type = 'lowpass'; lp.frequency.value = 420; am.gain.value = .5; lfo.frequency.value = 26; prof.gain.value = .5; lfo.connect(prof).connect(am.gain);
      o.type = 'triangle'; o.frequency.value = 130; env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(.9, t + .3); env.gain.linearRampToValueAtTime(0, t + 1.7);
      n.connect(lp).connect(am); o.connect(am); am.connect(env).connect(c.destination);
      [n, lfo, o].forEach(x => { x.start(t); x.stop(t + 1.8); });
    },
    shok(c, t) { // descarga eléctrica
      const o = c.createOscillator(), g = c.createGain(); o.type = 'square';
      for (let i = 0; i < 10; i++) o.frequency.setValueAtTime(300 + Math.random() * 2200, t + i * .03);
      o.frequency.exponentialRampToValueAtTime(90, t + .55); g.gain.setValueAtTime(.3, t); g.gain.linearRampToValueAtTime(0, t + .55);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + .6);
      const n = ruido(c, .3), hp = c.createBiquadFilter(), gn = c.createGain(); hp.type = 'highpass'; hp.frequency.value = 3000; gn.gain.setValueAtTime(.35, t); gn.gain.linearRampToValueAtTime(0, t + .25);
      n.connect(hp).connect(gn).connect(c.destination); n.start(t); n.stop(t + .3);
    },
    modo(c, t) { // brindis
      [0, .14].forEach((d, j) => [2093, 3136, 4186].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f * (1 + j * .004);
        g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.22 / (i + 1), t + d + .005); g.gain.exponentialRampToValueAtTime(.0001, t + d + .9 - i * .2);
        o.connect(g).connect(c.destination); o.start(t + d); o.stop(t + d + 1);
      }));
    }
  };
  const sonar = k => { const c = audio(); if (c) SON[k](c, c.currentTime); };

  /* ---------- Interacciones ---------- */
  let modoBar = false, perk = 0, flare = 0, W = 1;
  const burbuja = txt => { const b = $('.burbuja'); b.textContent = txt; b.classList.remove('va'); void b.offsetWidth; b.classList.add('va'); };
  const flash = () => { const f = $('.flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 60); };
  const aplicarModo = () => {
    NEON.color.setHex(modoBar ? 0xffc2f0 : 0xbfe6ff); HALO.color.setHex(modoBar ? 0xff2fb5 : 0x1f6bff); RELLENO.color.setHex(modoBar ? 0xff2fb5 : 0x2a7bff);
    LENS.color.setHex(modoBar ? 0x050b1f : 0x2a7bff); LENS.opacity = modoBar ? .93 : .22; LENS.blending = modoBar ? THREE.NormalBlending : ADD; LENS.needsUpdate = true;
  };
  const HAZ = {
    miau() { burbuja('¡MIAUUU!'); lluvia('star', 8, () => [(Math.random() - .5) * .8, -.3 + Math.random() * .2, .2], .5, .12); },
    sonrisa() { burbuja('prrr… 💙'); flare = 1; lluvia('heart', 9, () => [(Math.random() - .5) * .9, .2 + Math.random() * .5, .2], .4, .14); },
    shok() { burbuja('¡SHOK! ⚡'); perk = 1; flash(); lluvia('bolt', 7, () => [(Math.random() - .5) * 1.1, .3 + Math.random() * .6, .2], .6, .16); },
    modo() { modoBar = !modoBar; aplicarModo(); burbuja(modoBar ? 'Modo bar ON 🍸' : 'Modo gato 🐱'); lluvia('star', 12, () => [(Math.random() - .5) * 1.2, (Math.random() - .3) * .9, .2], .5, .12); }
  };
  const ultimo = {};
  const chip = k => { const e = hud.querySelector(`.chip[data-k="${k}"]`); e.classList.add('on'); setTimeout(() => e.classList.remove('on'), 800); };
  const dispara = k => { const now = performance.now(); if (now - (ultimo[k] || 0) < CONFIG.espera) return; ultimo[k] = now; cat.updateMatrixWorld(true); sonar(k); HAZ[k](); chip(k); };
  hud.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => dispara(b.dataset.k)));
  $('.volver').addEventListener('click', () => location.reload());

  /* ---------- Foto ---------- */
  let pedirFoto = false;
  const espejo = el => { let neg = false; for (let e = el; e && e !== document.body; e = e.parentElement) { const m = new DOMMatrix(getComputedStyle(e).transform); if (m.a < 0) neg = !neg; } return neg; };
  const foto = () => {
    pedirFoto = false; const cv = renderer.domElement, w = cv.width, h = cv.height, v = mind.video;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    const pinta = (el, sw, sh) => { x.save(); if (espejo(el)) { x.translate(w, 0); x.scale(-1, 1); } const s = Math.max(w / sw, h / sh); x.drawImage(el, (w - sw * s) / 2, (h - sh * s) / 2, sw * s, sh * s); x.restore(); };
    pinta(v, v.videoWidth, v.videoHeight); pinta(cv, w, h); flash();
    c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'shok-bar-mode.png'; a.click(); }, 'image/png');
  };
  $('.obt').addEventListener('click', () => { pedirFoto = true; });

  /* ---------- Seguimiento del rostro ---------- */
  const O = new V3(), R = new V3(), U = new V3(), F = new V3(), T = new V3(), Mx = new THREE.Matrix4(), Q = new THREE.Quaternion(), tmp = new V3();
  const lo = (p, out) => { out.copy(p).sub(O); return out.set(out.dot(R), out.dot(U), out.dot(F)).divideScalar(W); };
  const mid = (a, b) => tmp.addVectors(V[a], V[b]).multiplyScalar(.5);
  const d = (a, b) => V[a].distanceTo(V[b]);
  const pose = () => {
    IDX.forEach(i => V[i].setFromMatrixPosition(A[i].group.matrix));
    if (!A[168].group.visible || V[168].lengthSq() < 1e-8 || d(234, 454) < 1e-6) return false;
    O.copy(V[168]); R.subVectors(V[454], V[234]); W = R.length(); R.normalize();
    U.subVectors(V[10], V[152]); U.addScaledVector(R, -U.dot(R)).normalize();
    F.crossVectors(R, U); if (F.dot(T.copy(O).negate()) < 0) { R.negate(); F.crossVectors(R, U); }
    Mx.makeBasis(R, U, F); Q.setFromRotationMatrix(Mx); return true;
  };

  const base = {}, cuenta = {}; let frames = 0, visto = false;
  const mantiene = (k, cond, frames_) => { cuenta[k] = cond ? (cuenta[k] || 0) + 1 : 0; if (cuenta[k] === frames_) dispara(k); };
  const a = new V3(), b = new V3(), c3 = new V3();

  const actualizar = (dt, t) => {
    const hay = pose();
    $('.msg').style.opacity = hay ? 0 : 1; cat.visible = hay;
    if (hay) {
      if (!visto) { cat.position.copy(O); cat.quaternion.copy(Q); cat.scale.setScalar(W); visto = true; }
      else { cat.position.lerp(O, .6); cat.quaternion.slerp(Q, .55); cat.scale.setScalar(cat.scale.x + (W - cat.scale.x) * .5); }
      cat.updateMatrixWorld(true);

      // medidas de expresión (relativas al ancho de la cara)
      const m = { boca: d(13, 14) / W, sonrisa: d(61, 291) / W, cejas: (d(105, 159) + d(334, 386)) / 2 / W, ojoA: d(159, 145) / W, ojoB: d(386, 374) / W };
      m.ojo = Math.max(m.ojoA, m.ojoB);
      frames++;
      ['sonrisa', 'cejas', 'ojo'].forEach(k => { base[k] = base[k] == null ? m[k] : base[k] + (m[k] - base[k]) * (frames < 25 ? .3 : .004); });
      if (frames > 25) {
        mantiene('miau', m.boca > CONFIG.abrirBoca, 3);
        mantiene('sonrisa', m.sonrisa > base.sonrisa * CONFIG.sonrisa && m.boca < .1, 4);
        mantiene('shok', m.cejas > base.cejas * CONFIG.cejas, 3);
        mantiene('modo', (m.ojoA < base.ojo * CONFIG.guino && m.ojoB > base.ojo * .8) || (m.ojoB < base.ojo * CONFIG.guino && m.ojoA > base.ojo * .8), 3);
      }

      // lentes sobre los ojos
      const eA = lo(mid(33, 133), a).clone(), eB = lo(mid(362, 263), b).clone(), nz = lo(V[1], c3), top = lo(V[10], tmp.clone());
      gafaA.position.set(eA.x, eA.y, eA.z + .03); gafaB.position.set(eB.x, eB.y, eB.z + .03);
      puente.position.set((eA.x + eB.x) / 2, (eA.y + eB.y) / 2, eA.z + .03); puente.scale.x = Math.max(.02, Math.abs(eA.x - eB.x) - .34);
      const sg = Math.sign(eA.x - eB.x) || 1;
      patillaA.position.set(eA.x + sg * .17, eA.y, eA.z + .03 - .25); patillaA.scale.z = .5;
      patillaB.position.set(eB.x - sg * .17, eB.y, eB.z + .03 - .25); patillaB.scale.z = .5;
      nariz.position.set(nz.x, nz.y + .015, nz.z + .025); bigotes.position.set(nz.x, nz.y - .07, nz.z);

      // orejas
      perk = Math.max(0, perk - dt * 1.1); flare = Math.max(0, flare - dt * .8);
      [orejaL, orejaR].forEach(o => {
        const l = o.userData.lado; o.position.set(l * .33, top.y - .05, top.z - .02);
        o.userData.base.rotation.z = -l * (.3 - perk * .22) + Math.sin(t / 700 + l) * .03; o.userData.base.scale.y = 1 + .35 * perk;
      });
      bigoteList.forEach((g, i) => { g.rotation.z = g.userData.base * (1 + flare * .9) + Math.sin(t / 400 + i) * .03; });
    }
    // partículas
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt; p.s.position.addScaledVector(p.vel, dt); p.s.material.opacity = Math.max(0, 1 - p.t / p.vida);
      if (p.t >= p.vida) { scene.remove(p.s); p.s.material.dispose(); parts.splice(i, 1); }
    }
  };

  await mind.start(); listo();
  let prev = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now(), dt = Math.min((now - prev) / 1000, .1); prev = now;
    actualizar(dt, now); renderer.render(scene, camera); if (pedirFoto) foto();
  });
}
