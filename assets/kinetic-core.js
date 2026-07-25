/* 7F Kinetic Core — процедурная 3D-секция (three.js, без React-обвязки).
   Загружается лениво из app.js (KineticCore), когда секция приближается к viewport.
   Архитектура: initKineticCore({ root, reduced }) → { destroy }.
   Модель процедурная; позже её можно заменить на GLB — достаточно переписать buildModel(),
   не трогая сценарий, слои UI и жизненный цикл.

   Сценарий — единый детерминированный «таймлайн» от прогресса скролла (0..1):
   sticky-экран внутри высокой секции, прогресс сглаживается scrub-фильтром,
   каждый из 7 пунктов имеет собственный сегмент enter → hold → exit. */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ================== НАСТРОЙКИ СКРОЛЛА ==================
   screens     — высота секции в экранах (высота = screens × 100vh);
   scrub       — сглаживание прогресса, сек (аналог числового scrub в GSAP);
   introShare  — доля таймлайна на интро (темнота → свечение → сборка логотипа);
   stepsShare  — доля на семь пунктов (каждый пункт = stepsShare / 7);
   finalShare  — доля на удержание «РЕЗУЛЬТАТ», сборку колец и финальную фразу;
   step        — фазы внутри сегмента пункта (enter + hold + exit = 1). */
const KINETIC_SCROLL_CONFIG = {
  desktop: { screens: 6.0, scrub: 1.35, introShare: 0.11, stepsShare: 0.74, finalShare: 0.15,
             step: { enter: 0.20, hold: 0.62, exit: 0.18 } },
  tablet:  { screens: 6.5, scrub: 1.15, introShare: 0.10, stepsShare: 0.76, finalShare: 0.14,
             step: { enter: 0.20, hold: 0.62, exit: 0.18 } },
  mobile:  { screens: 7.2, scrub: 0.90, introShare: 0.09, stepsShare: 0.77, finalShare: 0.14,
             step: { enter: 0.22, hold: 0.60, exit: 0.18 } },
};
const pickBreakpoint = () => innerWidth < 768 ? 'mobile' : (innerWidth <= 1024 ? 'tablet' : 'desktop');

/* ================== НАСТРОЙКИ МОДЕЛИ ================== */
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
  spinAngle: [1.4, -1.2, 1.0, -0.85, 0.7, -0.6, 0.5],     // угол поворота (рад) при полном раскрытии
  idleSpin: { outer: 0.05, inner: -0.04 },                 // рад/с фонового вращения
  driftSpin: 0.045,        // рад/с непрерывного дрейфа колец в раскрытом состоянии
  yawMax: 0.45,            // ~26° поворот модели при раскрытии
  tiltMax: 0.10,           // ~6° реакция на курсор
  activeRing: { z: 0.22, glow: 1.4, slow: 0.5 },           // активное кольцо: выдвижение, свечение, замедление
  desktop: { dpr: 1.5, modelX: 1.05, camZ: 5.6 },
  mobile:  { dpr: 1.25, modelY: -0.45, camZ: 6.6, spreadScale: 0.5, scale: 0.82 },
};

const clamp01 = v => Math.max(0, Math.min(1, v));
const ss = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }; // smoothstep
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
  const finalEl = root.querySelector('.kc-final');
  const els = [...root.querySelectorAll('.kc-el')];

  const finePointer = matchMedia('(pointer: fine)').matches;
  const isMobile = innerWidth < 768 || !finePointer;
  const M = isMobile ? KC.mobile : KC.desktop;

  /* ---- Брейкпоинт и высота секции (аналог invalidateOnRefresh — пересчёт на resize) ---- */
  let bp = pickBreakpoint();
  let cfg = KINETIC_SCROLL_CONFIG[bp];
  function applySectionHeight() {
    if (!reduced) root.style.height = (cfg.screens * 100) + 'vh';
  }
  applySectionHeight();
  if (!reduced) root.classList.add('kc-live');   // текстом пунктов управляет JS, CSS-transition отключается

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
  const modelG = new THREE.Group();
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

  /* --- Монограмма: «7» и «F», входят с разных сторон --- */
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

  /* ================== РАСКЛАДКА ==================
     Компоновка зависит от текущей ширины (а не от снимка при инициализации) —
     корректно переживает resize и смену ориентации. */
  let mobileLayout = isMobile;
  let spreadScale = isMobile ? KC.mobile.spreadScale : 1;
  function layout() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    mobileLayout = w < 768;
    spreadScale = mobileLayout ? KC.mobile.spreadScale : 1;
    camera.position.z = mobileLayout ? KC.mobile.camZ : KC.desktop.camZ;
    if (mobileLayout) {
      modelG.position.set(0, KC.mobile.modelY, 0);
      modelG.scale.setScalar(KC.mobile.scale);
    } else {
      modelG.position.set(w >= 1100 ? KC.desktop.modelX : KC.desktop.modelX * 0.6, 0, 0);
      modelG.scale.setScalar(1);
    }
  }

  /* ================== СЦЕНАРИЙ ==================
     Зоны таймлайна (доли 0..1) пересчитываются из конфига брейкпоинта. */
  let Z = null;                       // зоны текущего брейкпоинта
  function computeZones() {
    const introEnd = cfg.introShare;
    const finalStart = introEnd + cfg.stepsShare;
    const f = cfg.finalShare;
    Z = {
      introEnd,
      finalStart,
      segLen: cfg.stepsShare / 7,
      spreadIn: [introEnd, introEnd + 0.12],                       // кольца расходятся в начале зоны пунктов
      resultHoldEnd: finalStart + f * 0.25,                        // «07 РЕЗУЛЬТАТ» остаётся видимым
      merge: [finalStart + f * 0.10, finalStart + f * 0.55],       // сборка колец + разворот к пользователю
      phraseIn: [finalStart + f * 0.55, finalStart + f * 0.75],    // финальная фраза, дальше — удержание до конца
      pulseAt: introEnd,                                            // импульс сразу после сборки логотипа
    };
  }
  computeZones();

  let hoverIdx = null;
  let tiltX = 0, tiltY = 0, tTiltX = 0, tTiltY = 0;
  const ui = { els: false, active: -1, final: null };
  const stepEnv = new Array(7).fill(0);

  /* Конверт сегмента пункта: enter → hold → exit (аналог addStep из ТЗ).
     Для пункта 07 сегмент продлён до resultHoldEnd. */
  function stepEnvelope(i, p) {
    const s = Z.introEnd + i * Z.segLen;
    const len = i === 6 ? (Z.resultHoldEnd - s) : Z.segLen;
    const e = (p - s) / len;
    if (e <= 0 || e >= 1) return 0;
    const { enter, exit } = cfg.step;
    return ss(0, enter, e) * (1 - ss(1 - exit, 1, e));
  }

  function applyProgress(p, dt, t) {
    /* --- интро: свет из темноты, сборка логотипа, импульс --- */
    const eGlow = ss(0, Z.introEnd * 0.5, p);
    const eLogo = ss(Z.introEnd * 0.35, Z.introEnd, p);
    const pulse = Math.exp(-Math.pow(p - Z.pulseAt, 2) / (2 * 0.012 * 0.012));

    key.intensity = 0.2 + 1.7 * eGlow;
    scene.environmentIntensity = 0.05 + 0.30 * eGlow;
    const idlePulse = reduced ? 0 : Math.sin(t * 1.4) * 0.1;
    coreLight.intensity = 5.5 * eGlow * (0.85 + idlePulse) + pulse * 9;
    haloMat.emissiveIntensity = 0.25 + 0.55 * eGlow + pulse * 1.6 + idlePulse * 0.3;

    sevenG.position.x = sevenX - 1.7 * (1 - eLogo);
    effG.position.x = effX + 1.7 * (1 - eLogo);
    sevenG.position.z = logoZ + 0.5 * (1 - eLogo);
    effG.position.z = logoZ + 0.5 * (1 - eLogo);

    /* --- раскрытие/сборка колец --- */
    const spread = ss(Z.spreadIn[0], Z.spreadIn[1], p) * (1 - ss(Z.merge[0], Z.merge[1], p));

    /* --- пункты: конверты enter/hold/exit --- */
    let active = -1;
    for (let i = 0; i < 7; i++) {
      stepEnv[i] = stepEnvelope(i, p);
      if (stepEnv[i] > 0.6) active = i;
    }

    rings.forEach((r, i) => {
      const env = stepEnv[i];
      const hlT = Math.max(env, hoverIdx === i ? 1 : 0);
      r.hl = reduced ? hlT : lerp(r.hl, hlT, Math.min(1, dt * 6));
      const dim = hoverIdx !== null && hoverIdx !== i ? 0.5 : 1;
      r.metal.color.copy(r.baseColor).multiplyScalar(lerp(1, dim, 0.8));
      r.segMat.color.copy(r.baseSeg).multiplyScalar(lerp(1, dim, 0.8));
      r.g.position.z = KC.spreadZ[i] * spread * spreadScale + r.hl * KC.activeRing.z;
      /* активное кольцо вращается медленнее соседних */
      r.g.rotation.z = r.idle + KC.spinAngle[i] * spread * (1 - KC.activeRing.slow * r.hl);
      r.glowMat.emissiveIntensity = (0.2 + 0.5 * eGlow) * (1 + spread * 0.8) + r.hl * KC.activeRing.glow + pulse * 0.8;
    });

    /* --- модель: поворот при раскрытии, наклон за курсором, парение --- */
    modelG.rotation.y = KC.yawMax * spread + tiltY;
    modelG.rotation.x = 0.06 + spread * 0.10 + tiltX;
    if (!reduced) modelG.position.y = (mobileLayout ? KC.mobile.modelY : 0) + Math.sin(t * 0.6) * 0.025;

    /* ---- HTML-слой ---- */
    const showEls = p > 0.02;
    if (showEls !== ui.els) { ui.els = showEls; els.forEach(el => el.classList.toggle('is-on', showEls)); }

    if (!reduced) {
      /* текст пунктов: opacity/translateY напрямую из конверта (плавно и реверсивно) */
      for (let i = 0; i < 7; i++) {
        const env = stepEnv[i];
        const el = items[i];
        const s = Z.introEnd + i * Z.segLen;
        const len = i === 6 ? (Z.resultHoldEnd - s) : Z.segLen;
        const e = clamp01((p - s) / len);
        const eIn = ss(0, cfg.step.enter, e);
        const eOut = ss(1 - cfg.step.exit, 1, e);
        el.style.opacity = (eIn * (1 - eOut)).toFixed(3);
        el.style.transform = `translateY(${(20 * (1 - eIn) - 12 * eOut).toFixed(1)}px) translateX(${(8 * env).toFixed(1)}px)`;
      }
    }
    if (active !== ui.active) {
      ui.active = active;
      items.forEach((el, i) => el.classList.toggle('is-active', i === active));
    }

    const fin = ss(Z.phraseIn[0], Z.phraseIn[1], p) > 0.2;
    if (fin !== ui.final) { ui.final = fin; finalEl.classList.toggle('is-on', fin); }
  }

  /* ================== ЦИКЛ ================== */
  const timer = new THREE.Timer();
  let raf = 0, running = false, destroyed = false;
  let pSmooth = null;

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

    /* scrub: прогресс догоняет цель с постоянной времени cfg.scrub (сек) */
    const pTarget = progress();
    pSmooth = pSmooth === null ? pTarget : lerp(pSmooth, pTarget, 1 - Math.exp(-dt / cfg.scrub));

    /* idle: фон + непрерывный дрейф колец в раскрытом состоянии — движение не замирает */
    const spreadNow = ss(Z.spreadIn[0], Z.spreadIn[1], pSmooth) * (1 - ss(Z.merge[0], Z.merge[1], pSmooth));
    rings.forEach((r, i) => {
      const dir = i % 2 ? -1 : 1;
      r.idle += dir * KC.driftSpin * spreadNow * (1 - KC.activeRing.slow * r.hl) * dt;
    });
    rings[6].idle += KC.idleSpin.outer * dt;
    rings[2].idle += KC.idleSpin.inner * dt;

    tiltX = lerp(tiltX, tTiltX, Math.min(1, dt * 4));
    tiltY = lerp(tiltY, tTiltY, Math.min(1, dt * 4));
    applyProgress(pSmooth, dt, t);
    renderer.render(scene, camera);
  }
  function start() { if (!running && !destroyed) { running = true; timer.update(); raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  /* ================== СОБЫТИЯ ================== */
  const onResize = () => {
    const nbp = pickBreakpoint();
    if (nbp !== bp) { bp = nbp; cfg = KINETIC_SCROLL_CONFIG[bp]; computeZones(); }
    applySectionHeight();
    layout();
    if (reduced) renderStatic();
  };
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

  /* reduced motion: собранная модель, статичный рендер, весь текст читаем через классы */
  function renderStatic() {
    applyProgress(1, 1, 0);
    items.forEach(el => { el.classList.add('is-on'); el.style.opacity = ''; el.style.transform = ''; });
    finalEl.classList.add('is-on');
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
    root.style.height = '';
    root.classList.remove('kc-live');
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
