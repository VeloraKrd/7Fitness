/* 7F Kinetic Core — процедурная 3D-секция (three.js, без React-обвязки).
   Загружается лениво из app.js (KineticCore), когда секция приближается к viewport.
   Архитектура: initKineticCore({ root, reduced }) → { destroy }.
   Модель процедурная; позже её можно заменить на GLB — достаточно переписать buildModel(),
   не трогая сценарий, слои UI и жизненный цикл. */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ================== НАСТРОЙКИ ==================
   Все цвета, скорости, глубины разлёта и тайминги сценария — здесь. */
const KC = {
  colors: {
    bg: 0x050505,
    red: 0xE4141C,          // emissive-вставки
    redDeep: 0x7d1016,      // металл цифры «7»
    silver: 0x8d939c,       // металл буквы «F»
    metalDark: 0x121215,    // матовый чёрный металл
    gunmetal: 0x24272c,
    graphite: 0x1a1c1f,
    chrome: 0x34373d,       // тёмный хром
  },
  /* 7 колец, от внутреннего к внешнему: [rIn, rOut, глубина, сегментов-накладок, тон] */
  rings: [
    [0.84, 0.98, 0.34, 6,  'chrome'],
    [1.02, 1.18, 0.30, 8,  'metalDark'],
    [1.22, 1.34, 0.40, 5,  'gunmetal'],
    [1.38, 1.56, 0.28, 9,  'graphite'],
    [1.60, 1.72, 0.36, 6,  'metalDark'],
    [1.76, 1.94, 0.30, 10, 'gunmetal'],
    [1.98, 2.18, 0.44, 7,  'graphite'],
  ],
  spreadZ: [0.55, -0.40, 0.70, -0.55, 0.50, -0.70, 0.35], // разлёт по Z при полном раскрытии
  spinAngle: [1.4, -1.2, 1.0, -0.85, 0.7, -0.6, 0.5],     // угол поворота (рад) при полном раскрытии; знак = направление
  idleSpin: { outer: 0.05, inner: -0.04 },                 // рад/с фонового вращения (внешнее и кольцо №3)
  yawMax: 0.45,            // ~26° поворот модели при раскрытии
  tiltMax: 0.10,           // ~6° реакция на курсор
  stages: { glow: [0.0, 0.15], logo: [0.15, 0.35], spread: [0.35, 0.70], merge: [0.70, 0.90], final: [0.90, 1.0] },
  pulseAt: 0.355,          // момент импульса после сборки логотипа
  desktop: { dpr: 1.5, modelX: 1.05, camZ: 5.6 },
  mobile:  { dpr: 1.25, modelY: -0.45, camZ: 6.6, spreadScale: 0.5, scale: 0.82 },
};

const clamp01 = v => Math.max(0, Math.min(1, v));
const sub = (p, a, b) => clamp01((p - a) / (b - a));
const easeIO = v => v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

/* ---- Кольцо с прямоугольным сечением и фасками ---- */
function ringGeometry(rIn, rOut, depth) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  if (rIn > 0) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, curveSegments: 48, bevelEnabled: true,
    bevelThickness: 0.018, bevelSize: 0.018, bevelSegments: 2,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

/* ---- Полигоны монограммы (единичная высота ~1) ---- */
function shapeFromPoints(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}
const SEVEN_PTS = [[-0.42, 0.5], [0.42, 0.5], [0.10, -0.5], [-0.16, -0.5], [0.12, 0.26], [-0.42, 0.26]];
const EFF_PTS = [[-0.10, 0.5], [0.44, 0.5], [0.44, 0.28], [0.14, 0.28], [0.14, 0.10], [0.38, 0.10], [0.38, -0.12], [0.14, -0.12], [0.14, -0.5], [-0.10, -0.5]];

function letterMesh(pts, material) {
  const g = new THREE.ExtrudeGeometry(shapeFromPoints(pts), {
    depth: 0.10, curveSegments: 8, bevelEnabled: true,
    bevelThickness: 0.02, bevelSize: 0.016, bevelSegments: 2,
  });
  g.translate(0, 0, -0.05);
  return new THREE.Mesh(g, material);
}

export function initKineticCore({ root, reduced = false }) {
  const stickyEl = root.querySelector('.kc-sticky');
  const host = root.querySelector('.kc-canvas');
  const items = [...root.querySelectorAll('[data-kc-item]')];
  const listEl = root.querySelector('.kc-list');
  const finalEl = root.querySelector('.kc-final');
  const els = [...root.querySelectorAll('.kc-el')];

  const finePointer = matchMedia('(pointer: fine)').matches;
  const isMobile = innerWidth < 768 || !finePointer;
  const M = isMobile ? KC.mobile : KC.desktop;

  /* ---- Рендерер ---- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, M.dpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(KC.colors.bg);
  scene.fog = new THREE.Fog(KC.colors.bg, 7, 14);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  camera.position.set(0, 0.15, M.camZ);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.05;

  /* ---- Свет: минимум источников ---- */
  const ambient = new THREE.AmbientLight(0xffffff, 0.12);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 0.2);
  key.position.set(3.5, 4.5, 4);
  scene.add(key);
  const coreLight = new THREE.PointLight(KC.colors.red, 0, 7, 1.8);
  coreLight.position.set(0, 0, 0.6);
  scene.add(coreLight);

  /* ================== МОДЕЛЬ ================== */
  const modelG = new THREE.Group();   // общий: позиция/наклон/поворот
  scene.add(modelG);

  const tones = KC.colors;
  const mkMetal = (tone, rough) => new THREE.MeshStandardMaterial({
    color: tones[tone], metalness: 0.9, roughness: rough,
  });

  /* --- Кольца: каждое — независимая группа --- */
  const rings = KC.rings.map(([rIn, rOut, depth, nSeg, tone], i) => {
    const g = new THREE.Group();
    const metal = mkMetal(tone, tone === 'chrome' ? 0.28 : 0.52);
    const body = new THREE.Mesh(ringGeometry(rIn, rOut, depth), metal);
    g.add(body);

    /* сегменты-накладки: детерминированная раскладка, без случайных винтов */
    const rMid = (rIn + rOut) / 2, w = (rOut - rIn) * 0.92;
    const segGeo = new THREE.BoxGeometry(w * 1.4, w, depth + 0.055);
    const segMat = mkMetal(tone === 'graphite' ? 'gunmetal' : 'graphite', 0.45);
    for (let k = 0; k < nSeg; k++) {
      const a = (k / nSeg) * Math.PI * 2 + i * 0.7;
      const seg = new THREE.Mesh(segGeo, segMat);
      seg.position.set(Math.cos(a) * rMid, Math.sin(a) * rMid, 0);
      seg.rotation.z = a;
      g.add(seg);
    }

    /* красная emissive-линия по внутреннему краю (уникальный материал — для подсветки) */
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: KC.colors.red, emissiveIntensity: 0.5, roughness: 0.4,
    });
    const glow = new THREE.Mesh(new THREE.TorusGeometry(rIn - 0.015, 0.008, 12, 72), glowMat);
    glow.position.z = -depth * 0.15;
    g.add(glow);

    modelG.add(g);
    return { g, metal, segMat, glowMat, depth, idle: 0, hl: 0, baseColor: metal.color.clone(), baseSeg: segMat.color.clone() };
  });

  /* --- Центральный медальон --- */
  const coreG = new THREE.Group();
  modelG.add(coreG);
  const medMat = mkMetal('graphite', 0.5);
  const medallion = new THREE.Mesh(ringGeometry(0, 0.80, 0.30), medMat);
  coreG.add(medallion);
  const faceMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: 0.75, roughness: 0.6 });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.74, 48), faceMat);
  face.position.z = 0.171;
  coreG.add(face);
  const haloMat = new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: KC.colors.red, emissiveIntensity: 0.4, roughness: 0.4,
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.014, 12, 96), haloMat);
  halo.position.z = 0.185;
  coreG.add(halo);

  /* --- Монограмма: «7» (красный металл) и «F» (холодный серебристый), входят с разных сторон --- */
  const sevenMat = new THREE.MeshStandardMaterial({ color: KC.colors.redDeep, metalness: 0.9, roughness: 0.3 });
  const effMat = new THREE.MeshStandardMaterial({ color: KC.colors.silver, metalness: 1.0, roughness: 0.35 });
  const sevenG = new THREE.Group();
  const effG = new THREE.Group();
  sevenG.add(letterMesh(SEVEN_PTS, sevenMat));
  effG.add(letterMesh(EFF_PTS, effMat));
  const LOGO_S = 0.55;
  sevenG.scale.setScalar(LOGO_S); effG.scale.setScalar(LOGO_S);
  const logoZ = 0.26, sevenX = -0.17, effX = 0.19;
  sevenG.position.set(sevenX, 0.02, logoZ);
  effG.position.set(effX, 0.02, logoZ);
  coreG.add(sevenG, effG);

  modelG.rotation.x = 0.06;

  /* ================== РАСКЛАДКА ================== */
  function layout() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (isMobile) {
      modelG.position.set(0, M.modelY, 0);
      modelG.scale.setScalar(M.scale);
    } else {
      modelG.position.set(w >= 1100 ? M.modelX : M.modelX * 0.6, 0, 0);
      modelG.scale.setScalar(1);
    }
  }

  /* ================== СЦЕНАРИЙ ==================
     Всё детерминировано от p (0..1) — реверсивно при скролле вверх. */
  const spreadScale = isMobile ? KC.mobile.spreadScale : 1;
  const S = KC.stages;
  let hoverIdx = null;
  let tiltX = 0, tiltY = 0, tTiltX = 0, tTiltY = 0;

  /* кэш UI-состояний, чтобы не дёргать DOM каждый кадр */
  const ui = { els: false, itemsOn: -1, active: -2, dim: null, final: null };

  function applyProgress(p, dt, t) {
    const eGlow = easeIO(sub(p, S.glow[0], S.glow[1]));
    const eLogo = easeIO(sub(p, S.logo[0], S.logo[1]));
    const eOut = easeIO(sub(p, S.spread[0], S.spread[1]));
    const eBack = easeIO(sub(p, S.merge[0], S.merge[1]));
    const spread = eOut * (1 - eBack);
    const eFinal = sub(p, S.final[0], S.final[1]);

    /* этап 1: свет включается из темноты, красное ядро оживает */
    const pulse = Math.exp(-Math.pow(p - KC.pulseAt, 2) / (2 * 0.015 * 0.015));
    key.intensity = 0.2 + 1.7 * eGlow;
    scene.environmentIntensity = 0.05 + 0.30 * eGlow;
    const idlePulse = reduced ? 0 : Math.sin(t * 1.4) * 0.1;
    coreLight.intensity = 5.5 * Math.min(eGlow, sub(p, 0.04, 0.15)) * (0.85 + idlePulse) + pulse * 9;
    haloMat.emissiveIntensity = 0.25 + 0.55 * eGlow + pulse * 1.6 + idlePulse * 0.3;

    /* этап 2: «7» слева, «F» справа → сборка логотипа */
    sevenG.position.x = sevenX - 1.7 * (1 - eLogo);
    effG.position.x = effX + 1.7 * (1 - eLogo);
    sevenG.position.z = logoZ + 0.5 * (1 - eLogo);
    effG.position.z = logoZ + 0.5 * (1 - eLogo);

    /* этапы 3–4: разлёт по глубине + вращение, затем сборка */
    rings.forEach((r, i) => {
      const hlT = (hoverIdx === i ? 1 : 0) + (ui.active === i ? 0.7 : 0);
      r.hl = lerp(r.hl, Math.min(hlT, 1), reduced ? 1 : Math.min(1, dt * 6));
      const dim = hoverIdx !== null && hoverIdx !== i ? 0.5 : 1;
      r.metal.color.copy(r.baseColor).multiplyScalar(lerp(1, dim, 0.8));
      r.segMat.color.copy(r.baseSeg).multiplyScalar(lerp(1, dim, 0.8));
      r.g.position.z = KC.spreadZ[i] * spread * spreadScale + r.hl * 0.15;
      r.g.rotation.z = r.idle + KC.spinAngle[i] * spread;
      r.glowMat.emissiveIntensity = (0.2 + 0.5 * eGlow) * (1 + spread * 0.8) + r.hl * 1.4 + pulse * 0.8;
    });

    /* поворот модели при раскрытии + наклон за курсором */
    modelG.rotation.y = KC.yawMax * spread + tiltY;
    modelG.rotation.x = 0.06 + spread * 0.10 + tiltX;
    if (!reduced) modelG.position.y = (isMobile ? M.modelY : 0) + Math.sin(t * 0.6) * 0.025;

    /* ---- HTML-слой (только при изменении состояния) ---- */
    const showEls = p > 0.04;
    if (showEls !== ui.els) { ui.els = showEls; els.forEach(el => el.classList.toggle('is-on', showEls)); }

    let active = -1, itemsOn = -1;
    if (p >= S.spread[0] + 0.01 && p < 0.72) {
      active = Math.min(6, Math.floor(sub(p, 0.36, 0.68) * 7));
      itemsOn = active;
    } else if (p >= 0.72) { itemsOn = 6; }
    if (itemsOn !== ui.itemsOn || active !== ui.active) {
      ui.itemsOn = itemsOn; ui.active = active;
      items.forEach((el, i) => {
        el.classList.toggle('is-on', i <= itemsOn);
        el.classList.toggle('is-active', i === active);
      });
    }
    const dim = p >= 0.74;
    if (dim !== ui.dim) { ui.dim = dim; listEl.classList.toggle('is-dim', dim); }
    const fin = eFinal > 0.1;
    if (fin !== ui.final) { ui.final = fin; finalEl.classList.toggle('is-on', fin); }
  }

  /* ================== ЦИКЛ ================== */
  const timer = new THREE.Timer();
  let raf = 0, running = false, destroyed = false;

  function progress() {
    const rect = root.getBoundingClientRect();
    const span = rect.height - innerHeight;
    return span > 0 ? clamp01(-rect.top / span) : 1;
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();
    /* idle: внешнее кольцо и кольцо №3 медленно вращаются в противофазе */
    rings[6].idle += KC.idleSpin.outer * dt;
    rings[2].idle += KC.idleSpin.inner * dt;
    tiltX = lerp(tiltX, tTiltX, Math.min(1, dt * 4));
    tiltY = lerp(tiltY, tTiltY, Math.min(1, dt * 4));
    applyProgress(progress(), dt, t);
    renderer.render(scene, camera);
  }
  function start() { if (!running && !destroyed) { running = true; timer.update(); raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  /* ================== СОБЫТИЯ ================== */
  const onResize = () => { layout(); if (reduced) renderStatic(); };
  addEventListener('resize', onResize);

  let io = null;
  const listeners = [];

  function onPointerMove(e) {
    tTiltY = (e.clientX / innerWidth - 0.5) * 2 * KC.tiltMax;
    tTiltX = (e.clientY / innerHeight - 0.5) * 2 * KC.tiltMax * 0.7;
  }
  function onPointerLeave() { tTiltX = 0; tTiltY = 0; }

  if (!reduced) {
    io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) start(); else stop();
    }, { threshold: 0 });
    io.observe(root);

    if (finePointer && !isMobile) {
      stickyEl.addEventListener('pointermove', onPointerMove);
      stickyEl.addEventListener('pointerleave', onPointerLeave);
      listeners.push([stickyEl, 'pointermove', onPointerMove], [stickyEl, 'pointerleave', onPointerLeave]);
      items.forEach((el, i) => {
        const enter = () => { hoverIdx = i; };
        const leave = () => { hoverIdx = null; };
        el.addEventListener('pointerenter', enter);
        el.addEventListener('pointerleave', leave);
        listeners.push([el, 'pointerenter', enter], [el, 'pointerleave', leave]);
      });
    }
  }

  /* reduced motion: собранная модель, один статичный рендер */
  function renderStatic() {
    applyProgress(1, 1, 0);
    /* в reduced-режиме текст остаётся полностью читаемым */
    listEl.classList.remove('is-dim');
    items.forEach(el => el.classList.add('is-on'));
    modelG.rotation.y = 0; modelG.rotation.x = 0.06;
    renderer.render(scene, camera);
  }

  layout();
  if (reduced) renderStatic(); else start();

  /* ================== ОЧИСТКА ================== */
  function destroy() {
    destroyed = true;
    stop();
    removeEventListener('resize', onResize);
    listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    if (io) io.disconnect();
    scene.traverse(o => {
      if (o.isMesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      }
    });
    envRT.dispose(); pmrem.dispose();
    renderer.dispose(); renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  return { destroy };
}
