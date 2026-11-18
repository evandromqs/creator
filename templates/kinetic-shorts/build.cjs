// Motor Dinâmico Kinetic Shorts (1080x1920, 30fps, GSAP 3.15.0)
// Motor viral com elementos visuais procedurais animados em SVG + GSAP em todas as cenas,
// câmera contínua (Ken Burns / dolly), transições dinâmicas e legendas karaokê — sem contadores de cena.
const fs = require("fs");
const path = require("path");

const TPL_DIR = __dirname;
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

const timingsPath = path.join(PROJECT_ROOT, "transcript", "kinetic-timings.json");
const scenesPath = path.join(TPL_DIR, "scenes.json");
const rootWordsPath = path.join(PROJECT_ROOT, "transcript", "words.json");
const tplWordsPath = path.join(TPL_DIR, "words.json");

let title = "Documentário Kinetic Shorts";
let scenes = [];
let words = [];
let hasTimedAudio = false;

if (fs.existsSync(timingsPath)) {
  const timed = JSON.parse(fs.readFileSync(timingsPath, "utf-8"));
  title = timed.title || title;
  scenes = timed.scenes || [];
  words = timed.words || [];
  hasTimedAudio = true;
} else if (fs.existsSync(scenesPath)) {
  const raw = JSON.parse(fs.readFileSync(scenesPath, "utf-8"));
  title = raw.title || title;
  scenes = Array.isArray(raw) ? raw : raw.scenes || [];
  if (fs.existsSync(rootWordsPath)) words = JSON.parse(fs.readFileSync(rootWordsPath, "utf-8"));
  else if (fs.existsSync(tplWordsPath)) words = JSON.parse(fs.readFileSync(tplWordsPath, "utf-8"));
}

if (scenes.length === 0) {
  throw new Error("Nenhuma cena encontrada para Kinetic Shorts.");
}

// Calcula tempos proporcionais se ainda não tiver startSec/endSec
let TOTAL = 0;
if (scenes.every((s) => typeof s.startSec === "number" && typeof s.endSec === "number")) {
  TOTAL = Number((scenes[scenes.length - 1].endSec + 0.4).toFixed(2));
} else {
  const totalWordsFallback = words.length > 0 ? words[words.length - 1].end + 0.6 : scenes.length * 4;
  const counts = scenes.map((s) => Math.max(4, String(s.narration || s.headline || "").split(/\s+/).length));
  const sumCounts = counts.reduce((a, b) => a + b, 0);
  let cur = 0;
  scenes = scenes.map((s, idx) => {
    const dur = (counts[idx] / sumCounts) * totalWordsFallback;
    const startSec = Number(cur.toFixed(3));
    cur += dur;
    const endSec = Number(cur.toFixed(3));
    return { ...s, startSec, endSec };
  });
  TOTAL = Number(cur.toFixed(2));
}

// ---------- PRNG determinístico ----------
let seed = 2026;
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const R = (a, b) => a + rnd() * (b - a);
const f = (n, d = 2) => Number(n.toFixed(d));

const js = [];
const sets = [];
const T = (s) => js.push(s);
const S = (s) => sets.push(s);

const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const splitChars = (txt, cls = "ch") =>
  [...String(txt || "")].map((c) => (c === " " ? `<span class="${cls} sp">&nbsp;</span>` : `<span class="${cls}">${esc(c)}</span>`)).join("");

function shake(target, t, amp = 16, n = 6) {
  let tt = t;
  for (let i = 0; i < n; i++) {
    const k = 1 - i / n;
    T(`tl.to("${target}", { x: ${f(R(-amp, amp) * k)}, y: ${f(R(-amp, amp) * k)}, rotation: ${f(R(-0.7, 0.7) * k)}, duration: 0.04, ease: "none" }, ${f(tt, 3)});`);
    tt += 0.04;
  }
  T(`tl.to("${target}", { x: 0, y: 0, rotation: 0, duration: 0.06, ease: "power2.out" }, ${f(tt, 3)});`);
}

const ACCENTS = {
  gold: {
    main: "#facc15",
    soft: "#fde68a",
    dark: "#1a1300",
    tint: "radial-gradient(circle at 50% 38%, rgba(250,204,21,.34), rgba(120,53,15,.28) 52%, transparent 86%)",
  },
  crimson: {
    main: "#f43f5e",
    soft: "#fda4af",
    dark: "#2c050f",
    tint: "radial-gradient(circle at 50% 42%, rgba(244,63,94,.42), rgba(88,10,24,.38) 48%, transparent 84%)",
  },
  cyan: {
    main: "#38bdf8",
    soft: "#bae6fd",
    dark: "#04131f",
    tint: "radial-gradient(circle at 50% 40%, rgba(56,189,248,.34), rgba(8,47,73,.38) 58%, transparent 88%)",
  },
  emerald: {
    main: "#34d399",
    soft: "#a7f3d0",
    dark: "#032117",
    tint: "radial-gradient(circle at 50% 40%, rgba(52,211,153,.32), rgba(6,78,59,.38) 58%, transparent 88%)",
  },
  violet: {
    main: "#a78bfa",
    soft: "#ddd6fe",
    dark: "#140633",
    tint: "radial-gradient(circle at 50% 40%, rgba(167,139,250,.36), rgba(30,14,72,.42) 58%, transparent 88%)",
  },
};

const DEFAULT_VISUAL_BY_LAYOUT = {
  impact: "shockwave",
  timeline: "ancient_scroll",
  stat: "cyber_grid",
  quote: "sun_rays",
  stamp: "shockwave",
  mystery: "eclipse",
  split_vs: "scales_duel",
  cta: "viral_cta",
};

function headlineSize(txt) {
  const len = String(txt || "").length;
  if (len <= 10) return 185;
  if (len <= 16) return 140;
  if (len <= 24) return 108;
  return 86;
}

// ================================================================
// GERADOR DE ELEMENTOS VISUAIS PROCEDURAIS ANIMADOS POR CENA
// Cada cena recebe um cenário vetorial dinâmico dirigido por GSAP
// ================================================================
function buildSceneVisual(visualRaw, id, idx, t0, dur, pal) {
  const visual = String(visualRaw || "shockwave").toLowerCase();
  const vid = `${id}-v`;

  if (visual === "waves") {
    let spHtml = "";
    for (let i = 0; i < 16; i++) {
      const bx = Math.round(R(60, 1020));
      const by = Math.round(R(1150, 1580));
      const r = Math.round(R(4, 12));
      spHtml += `<circle class="vis-bub" id="${vid}-b${i}" cx="${bx}" cy="${by}" r="${r}" fill="${pal.soft}" opacity="0.55"/>`;
      T(`tl.to("#${vid}-b${i}", { y: ${-Math.round(R(260, 620))}, x: ${Math.round(R(-60, 60))}, opacity: 0, duration: ${dur}, ease: "power1.out" }, ${t0});`);
    }
    T(`tl.to("#${vid}-w1", { x: -240, duration: ${dur}, ease: "none" }, ${t0});`);
    T(`tl.to("#${vid}-w2", { x: 220, duration: ${dur}, ease: "none" }, ${t0});`);
    T(`tl.to("#${vid}-w3", { x: -160, y: -18, duration: ${dur}, ease: "sine.inOut" }, ${t0});`);
    T(`tl.to("#${vid}-wl", { x: -130, duration: ${f(dur * 0.7)}, ease: "power2.out" }, ${t0 + 0.1});`);
    T(`tl.to("#${vid}-wr", { x: 130, duration: ${f(dur * 0.7)}, ease: "power2.out" }, ${t0 + 0.1});`);
    return `<div class="vis-layer" data-layout-allow-overflow>
      <svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">
        <defs>
          <linearGradient id="${vid}-wg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${pal.main}" stop-opacity="0.34"/><stop offset="100%" stop-color="#02060c" stop-opacity="0"/></linearGradient>
        </defs>
        <g id="${vid}-wl" opacity="0.45"><path d="M-120,1920 L-120,1040 Q260,960 440,1240 L480,1920 Z" fill="url(#${vid}-wg1)"/></g>
        <g id="${vid}-wr" opacity="0.45"><path d="M1200,1920 L1200,1040 Q820,960 640,1240 L600,1920 Z" fill="url(#${vid}-wg1)"/></g>
        <g id="${vid}-w1" opacity="0.32"><path d="M-200,1250 Q80,1170 360,1250 T920,1250 T1480,1250 L1480,1920 L-200,1920 Z" fill="${pal.main}"/></g>
        <g id="${vid}-w2" opacity="0.24"><path d="M-360,1330 Q-60,1240 240,1330 T840,1330 T1440,1330 L1440,1920 L-360,1920 Z" fill="${pal.soft}"/></g>
        <g id="${vid}-w3" opacity="0.45"><path d="M-120,1290 Q180,1220 480,1290 T1080,1290 T1680,1290" fill="none" stroke="${pal.soft}" stroke-width="5"/></g>
        ${spHtml}
      </svg>
    </div>`;
  }

  if (visual === "wind") {
    let lines = "";
    for (let i = 0; i < 9; i++) {
      const y = 260 + i * 165 + Math.round(R(-20, 20));
      const dir = idx % 2 === 0 ? 1 : -1;
      const startX = dir > 0 ? -520 : 1200;
      const endX = dir > 0 ? 1180 : -620;
      const w = Math.round(R(280, 560));
      lines += `<path id="${vid}-g${i}" d="M${startX},${y} Q${startX + w * 0.45},${y - 36} ${startX + w},${y} Q${startX + w * 0.72},${y + 32} ${startX + w * 0.5},${y + 12}" fill="none" stroke="${i % 2 === 0 ? pal.soft : pal.main}" stroke-width="${Math.round(R(3, 8))}" stroke-linecap="round" opacity="${f(R(0.25, 0.65))}"/>`;
      const delay = f(R(0, Math.min(0.6, dur * 0.3)), 2);
      T(`tl.to("#${vid}-g${i}", { x: ${endX - startX}, duration: ${f(Math.max(0.7, dur - delay))}, ease: "power1.inOut" }, ${f(t0 + delay, 3)});`);
    }
    let reeds = "";
    for (let j = 0; j < 11; j++) {
      const rx = 50 + j * 100;
      const rh = Math.round(R(220, 390));
      reeds += `<path id="${vid}-rd${j}" d="M${rx},1920 Q${rx - 18},${1920 - rh * 0.55} ${rx + 12},${1920 - rh}" fill="none" stroke="${pal.main}" stroke-width="10" stroke-linecap="round" opacity="0.34" style="transform-origin:${rx}px 1920px"/>`;
      T(`tl.to("#${vid}-rd${j}", { rotation: ${idx % 2 === 0 ? 22 : -22}, duration: ${f(dur * 0.45)}, ease: "sine.inOut", yoyo: true, repeat: 1 }, ${t0});`);
    }
    return `<div class="vis-layer" data-layout-allow-overflow>
      <svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">${lines}${reeds}</svg>
    </div>`;
  }

  if (visual === "map_radar") {
    S(`gsap.set("#${vid}-coast", { strokeDashoffset: 1600 });`);
    S(`gsap.set("#${vid}-p1", { opacity: 0.75, scale: 0.2, transformOrigin: "540px 660px" });`);
    S(`gsap.set("#${vid}-p2", { opacity: 0.75, scale: 0.2, transformOrigin: "540px 660px" });`);
    S(`gsap.set("#${vid}-pin", { opacity: 0, y: -90, scale: 1.5, transformOrigin: "540px 660px" });`);
    T(`tl.to("#${vid}-coast", { strokeDashoffset: 0, duration: ${f(Math.min(1.6, dur * 0.75))}, ease: "power2.out" }, ${t0});`);
    T(`tl.to("#${vid}-beam", { rotation: 360, transformOrigin: "540px 660px", duration: ${f(Math.max(1.8, dur))}, ease: "none" }, ${t0});`);
    T(`tl.to("#${vid}-p1", { opacity: 0, scale: 2.8, duration: ${f(Math.min(1.5, dur * 0.7))}, ease: "power2.out", repeat: 1 }, ${t0 + 0.1});`);
    T(`tl.to("#${vid}-p2", { opacity: 0, scale: 2.8, duration: ${f(Math.min(1.5, dur * 0.7))}, ease: "power2.out", repeat: 1 }, ${t0 + 0.55});`);
    T(`tl.to("#${vid}-pin", { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "bounce.out" }, ${t0 + 0.35});`);
    return `<div class="vis-layer" data-layout-allow-overflow>
      <svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0;opacity:0.62">
        <defs>
          <radialGradient id="${vid}-rg"><stop offset="0%" stop-color="${pal.main}" stop-opacity="0.35"/><stop offset="100%" stop-color="${pal.main}" stop-opacity="0"/></radialGradient>
        </defs>
        <g stroke="${pal.main}" stroke-opacity="0.14" stroke-width="2">
          <line x1="0" y1="420" x2="1080" y2="420"/><line x1="0" y1="660" x2="1080" y2="660"/><line x1="0" y1="900" x2="1080" y2="900"/>
          <line x1="270" y1="200" x2="270" y2="1280"/><line x1="540" y1="200" x2="540" y2="1280"/><line x1="810" y1="200" x2="810" y2="1280"/>
        </g>
        <circle cx="540" cy="660" r="360" fill="none" stroke="${pal.main}" stroke-width="2" stroke-dasharray="10 14" opacity="0.35"/>
        <circle cx="540" cy="660" r="220" fill="none" stroke="${pal.soft}" stroke-width="2" opacity="0.28"/>
        <path id="${vid}-coast" d="M120,460 Q280,520 350,620 T540,670 T760,590 T960,720" fill="none" stroke="${pal.soft}" stroke-width="6" stroke-dasharray="1600" stroke-linecap="round"/>
        <path id="${vid}-beam" d="M540,660 L540,300 A360,360 0 0,1 850,480 Z" fill="url(#${vid}-rg)" opacity="0.65"/>
        <circle id="${vid}-p1" cx="540" cy="660" r="140" fill="none" stroke="${pal.main}" stroke-width="4"/>
        <circle id="${vid}-p2" cx="540" cy="660" r="140" fill="none" stroke="${pal.soft}" stroke-width="3"/>
        <g id="${vid}-pin">
          <circle cx="540" cy="660" r="20" fill="${pal.main}" stroke="#fff" stroke-width="5"/>
        </g>
      </svg>
    </div>`;
  }

  if (visual === "sun_rays") {
    let spk = "";
    for (let i = 0; i < 20; i++) {
      const sx = Math.round(R(100, 980));
      const sy = Math.round(R(650, 1450));
      const r = f(R(2.5, 6), 1);
      spk += `<div class="vis-spark" id="${vid}-sp${i}" style="left:${sx}px;top:${sy}px;width:${r * 2}px;height:${r * 2}px;background:${pal.soft};box-shadow:0 0 18px ${pal.main}"></div>`;
      T(`tl.to("#${vid}-sp${i}", { y: ${-Math.round(R(250, 620))}, opacity: 0, scale: 0.4, duration: ${dur}, ease: "power1.out" }, ${t0});`);
    }
    T(`tl.to("#${vid}-rays", { rotation: 38, duration: ${dur}, ease: "none" }, ${t0});`);
    T(`tl.to("#${vid}-halo", { scale: 1.22, opacity: 0.72, duration: ${f(dur * 0.5)}, ease: "sine.inOut", yoyo: true, repeat: 1 }, ${t0});`);
    return `<div class="vis-layer" data-layout-allow-overflow>
      <div class="rays" id="${vid}-rays" style="opacity:0.6;background:repeating-conic-gradient(from 0deg, ${pal.main}44 0deg 6deg, transparent 6deg 18deg)"></div>
      <div id="${vid}-halo" style="position:absolute;left:240px;top:240px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,${pal.main}66,transparent 68%);opacity:0.45"></div>
      ${spk}
    </div>`;
  }

  if (visual === "ancient_scroll") {
    const glyphs = ["א", "ב", "ש", "ם", "Ω", "Σ", "Δ", "Ψ"];
    let gHtml = "";
    for (let i = 0; i < 8; i++) {
      const gx = i % 2 === 0 ? Math.round(R(40, 220)) : Math.round(R(820, 980));
      const gy = Math.round(R(280, 1280));
      gHtml += `<div id="${vid}-gl${i}" style="position:absolute;left:${gx}px;top:${gy}px;font-family:'Playfair Display',serif;font-size:${Math.round(R(58, 105))}px;color:${pal.soft};opacity:0.16;font-weight:900">${glyphs[i % glyphs.length]}</div>`;
      T(`tl.to("#${vid}-gl${i}", { y: ${-Math.round(R(90, 190))}, opacity: 0.32, duration: ${dur}, ease: "none" }, ${t0});`);
    }
    T(`tl.to("#${vid}-scan", { y: 820, duration: ${f(Math.max(1.2, dur))}, ease: "sine.inOut" }, ${t0});`);
    return `<div class="vis-layer" data-layout-allow-overflow>
      <svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0;opacity:0.28">
        <rect x="110" y="250" width="860" height="920" rx="28" fill="none" stroke="${pal.main}" stroke-width="3" stroke-dasharray="18 12"/>
        <line x1="170" y1="390" x2="910" y2="390" stroke="${pal.soft}" stroke-width="2" opacity="0.4"/>
        <line x1="170" y1="530" x2="860" y2="530" stroke="${pal.soft}" stroke-width="2" opacity="0.25"/>
        <line x1="170" y1="880" x2="910" y2="880" stroke="${pal.soft}" stroke-width="2" opacity="0.25"/>
        <line x1="170" y1="1040" x2="840" y2="1040" stroke="${pal.soft}" stroke-width="2" opacity="0.4"/>
      </svg>
      <div id="${vid}-scan" style="position:absolute;left:110px;right:110px;top:270px;height:6px;background:linear-gradient(90deg,transparent,${pal.main},transparent);box-shadow:0 0 28px ${pal.main};opacity:0.7"></div>
      ${gHtml}
    </div>`;
  }

  if (visual === "cyber_grid") {
    T(`tl.to("#${vid}-ret", { rotation: 180, transformOrigin: "540px 640px", duration: ${dur}, ease: "none" }, ${t0});`);
    T(`tl.to("#${vid}-grid", { y: 85, duration: ${dur}, ease: "none" }, ${t0});`);
    return `<div class="vis-layer" data-layout-allow-overflow>
      <svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0;opacity:0.48">
        <g id="${vid}-grid" stroke="${pal.main}" stroke-opacity="0.24" stroke-width="2">
          <line x1="0" y1="1120" x2="1080" y2="1120"/><line x1="0" y1="1220" x2="1080" y2="1220"/>
          <line x1="0" y1="1340" x2="1080" y2="1340"/><line x1="0" y1="1490" x2="1080" y2="1490"/>
          <line x1="540" y1="980" x2="540" y2="1920"/>
          <line x1="420" y1="980" x2="120" y2="1920"/><line x1="660" y1="980" x2="960" y2="1920"/>
          <line x1="300" y1="980" x2="-180" y2="1920"/><line x1="780" y1="980" x2="1260" y2="1920"/>
        </g>
        <g id="${vid}-ret" opacity="0.48">
          <circle cx="540" cy="640" r="320" fill="none" stroke="${pal.main}" stroke-width="3" stroke-dasharray="40 20 12 20"/>
          <circle cx="540" cy="640" r="245" fill="none" stroke="${pal.soft}" stroke-width="2" stroke-dasharray="8 16"/>
        </g>
      </svg>
    </div>`;
  }

  if (visual === "eclipse") {
    S(`gsap.set("#${vid}-moon", { x: -110 });`);
    T(`tl.to("#${vid}-moon", { x: 25, duration: ${dur}, ease: "sine.inOut" }, ${t0});`);
    T(`tl.to("#${vid}-cor", { scale: 1.18, opacity: 0.8, rotation: 28, duration: ${dur}, ease: "none" }, ${t0});`);
    let stars = "";
    for (let i = 0; i < 14; i++) {
      stars += `<circle id="${vid}-st${i}" cx="${Math.round(R(70, 1010))}" cy="${Math.round(R(140, 1280))}" r="${f(R(1.5, 4), 1)}" fill="#fff" opacity="${f(R(0.2, 0.7))}"/>`;
      T(`tl.to("#${vid}-st${i}", { opacity: ${f(R(0.3, 0.95))}, scale: 1.4, duration: ${f(dur * 0.5)}, yoyo: true, repeat: 1 }, ${t0});`);
    }
    return `<div class="vis-layer" data-layout-allow-overflow>
      <svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">
        ${stars}
        <g id="${vid}-cor" style="transform-origin:540px 580px;opacity:0.65">
          <circle cx="540" cy="580" r="250" fill="none" stroke="${pal.main}" stroke-width="14" opacity="0.38" style="filter:blur(10px)"/>
          <circle cx="540" cy="580" r="218" fill="${pal.main}" opacity="0.22"/>
        </g>
        <circle cx="540" cy="580" r="210" fill="none" stroke="${pal.soft}" stroke-width="4" opacity="0.65"/>
        <circle id="${vid}-moon" cx="540" cy="580" r="204" fill="#030a14" opacity="0.92"/>
      </svg>
    </div>`;
  }

  if (visual === "scales_duel") {
    T(`tl.to("#${vid}-bar", { rotation: 9, transformOrigin: "540px 580px", duration: ${f(dur * 0.45)}, ease: "sine.inOut", yoyo: true, repeat: 1 }, ${t0});`);
    T(`tl.to("#${vid}-cl", { x: 40, opacity: 0.68, duration: ${f(dur * 0.5)}, ease: "sine.inOut", yoyo: true, repeat: 1 }, ${t0});`);
    T(`tl.to("#${vid}-cr", { x: -40, opacity: 0.68, duration: ${f(dur * 0.5)}, ease: "sine.inOut", yoyo: true, repeat: 1 }, ${t0});`);
    return `<div class="vis-layer" data-layout-allow-overflow>
      <div id="${vid}-cl" style="position:absolute;left:-140px;top:380px;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,0.45),transparent 65%);opacity:0.4"></div>
      <div id="${vid}-cr" style="position:absolute;right:-140px;top:380px;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,rgba(244,63,94,0.45),transparent 65%);opacity:0.4"></div>
      <svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0;opacity:0.35">
        <line id="${vid}-bar" x1="170" y1="580" x2="910" y2="580" stroke="${pal.soft}" stroke-width="6" stroke-linecap="round"/>
      </svg>
    </div>`;
  }

  if (visual === "viral_cta") {
    const bubbles = [
      { l: "A", c: "#38bdf8", x: 110, y: 1220, txt: "Vento científico!" },
      { l: "B", c: "#facc15", x: 640, y: 1245, txt: "Milagre total!" },
      { l: "B", c: "#f43f5e", x: 190, y: 1325, txt: "Chocado com isso" },
    ];
    let bHtml = "";
    bubbles.forEach((b, bi) => {
      const bt = f(t0 + 0.35 + bi * 0.45, 3);
      S(`gsap.set("#${vid}-cb${bi}", { opacity: 0, y: 45, scale: 0.8 });`);
      T(`tl.to("#${vid}-cb${bi}", { opacity: 0.92, y: 0, scale: 1, duration: 0.36, ease: "back.out(2)" }, ${bt});`);
      T(`tl.to("#${vid}-cb${bi}", { opacity: 0, y: -55, duration: 0.4 }, ${f(Math.max(bt + 0.5, t0 + dur - 0.55), 3)});`);
      bHtml += `<div class="live-pop" id="${vid}-cb${bi}" style="left:${b.x}px;top:${b.y}px"><span class="live-av" style="background:${b.c}">${b.l}</span><span>${b.txt}</span></div>`;
    });
    S(`gsap.set("#${vid}-tap", { opacity: 0, scale: 0.3 });`);
    T(`tl.to("#${vid}-tap", { opacity: 0.9, scale: 1.5, duration: 0.32, ease: "power2.out" }, ${f(t0 + Math.min(1.4, dur * 0.55), 3)});`);
    T(`tl.to("#${vid}-tap", { opacity: 0, scale: 2.3, duration: 0.35 }, ${f(t0 + Math.min(1.72, dur * 0.55 + 0.32), 3)});`);
    return `<div class="vis-layer" data-layout-allow-overflow>
      ${bHtml}
      <div id="${vid}-tap" style="position:absolute;left:710px;top:1142px;width:96px;height:96px;border-radius:50%;border:6px solid #fff"></div>
    </div>`;
  }

  // Default: shockwave (ondas de choque + linhas radiais explosivas)
  S(`gsap.set("#${vid}-sw1", { opacity: 0.85, scale: 0.25, transformOrigin: "540px 650px" });`);
  S(`gsap.set("#${vid}-sw2", { opacity: 0.7, scale: 0.2, transformOrigin: "540px 650px" });`);
  T(`tl.to("#${vid}-sw1", { opacity: 0, scale: 2.7, duration: ${f(Math.min(1.4, dur * 0.65))}, ease: "power2.out", repeat: 1 }, ${t0});`);
  T(`tl.to("#${vid}-sw2", { opacity: 0, scale: 2.7, duration: ${f(Math.min(1.4, dur * 0.65))}, ease: "power2.out", repeat: 1 }, ${t0 + 0.25});`);
  let rays = "";
  for (let i = 0; i < 12; i++) {
    const ang = (i * 30 * Math.PI) / 180;
    const x1 = Math.round(540 + Math.cos(ang) * 190);
    const y1 = Math.round(650 + Math.sin(ang) * 190);
    const x2 = Math.round(540 + Math.cos(ang) * 520);
    const y2 = Math.round(650 + Math.sin(ang) * 520);
    rays += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${pal.main}" stroke-width="4" stroke-dasharray="14 18" opacity="0.32"/>`;
  }
  T(`tl.to("#${vid}-burst", { rotation: 40, transformOrigin: "540px 650px", duration: ${dur}, ease: "none" }, ${t0});`);
  return `<div class="vis-layer" data-layout-allow-overflow>
    <svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">
      <g id="${vid}-burst">${rays}</g>
      <circle id="${vid}-sw1" cx="540" cy="650" r="220" fill="none" stroke="${pal.main}" stroke-width="8"/>
      <circle id="${vid}-sw2" cx="540" cy="650" r="220" fill="none" stroke="${pal.soft}" stroke-width="5"/>
    </svg>
  </div>`;
}

// ================================================================
// FUNDO ATMOSFÉRICO GLOBAL (Blobs + Partículas + Tints por Cena)
// ================================================================
const blobColors = ["#0ea5e9", "#1d4ed8", "#06b6d4", "#7c3aed", "#0f766e"];
let blobsHtml = "";
blobColors.forEach((c, i) => {
  const size = Math.round(R(680, 1080));
  const x = Math.round(R(-280, 680));
  const y = Math.round(R(-180, 1480));
  blobsHtml += `<div class="blob" id="blob-${i}" style="width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:radial-gradient(circle, ${c} 0%, transparent 65%);"></div>`;
  const dur = f(R(5, 8));
  const reps = Math.max(1, Math.floor(TOTAL / dur));
  T(`tl.to("#blob-${i}", { x: ${Math.round(R(-240, 240))}, y: ${Math.round(R(-280, 280))}, scale: ${f(R(0.82, 1.28))}, duration: ${dur}, ease: "sine.inOut", yoyo: true, repeat: ${reps} }, 0);`);
});

let dustHtml = "";
for (let i = 0; i < 42; i++) {
  const s = f(R(2, 6), 1);
  const x = Math.round(R(0, 1080));
  const y = Math.round(R(0, 1920));
  dustHtml += `<i class="dust" id="dust-${i}" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;opacity:${f(R(0.15, 0.55))}"></i>`;
  T(`tl.to("#dust-${i}", { y: ${-Math.round(R(240, 680))}, x: ${Math.round(R(-70, 70))}, duration: ${TOTAL}, ease: "none" }, 0);`);
}

let tintsHtml = "";
scenes.forEach((sc, idx) => {
  const pal = ACCENTS[sc.accent] || ACCENTS.gold;
  const tid = `tint-sc-${idx}`;
  tintsHtml += `<div class="tint" id="${tid}" style="background:${pal.tint}"></div>`;
  T(`tl.to("#${tid}", { opacity: 1, duration: 0.4, ease: "power2.out" }, ${f(sc.startSec, 3)});`);
  T(`tl.to("#${tid}", { opacity: 0, duration: 0.4, ease: "power2.in" }, ${f(Math.max(sc.startSec + 0.4, sc.endSec - 0.1), 3)});`);
});

// ================================================================
// MONTAGEM DAS CENAS DINÂMICAS (ZERO CONTADORES DE CENA)
// ================================================================
const scenesHtml = scenes
  .map((sc, idx) => {
    const id = `sc${idx + 1}`;
    const camId = `cam-${id}`;
    const dollyId = `dolly-${id}`;
    const t0 = sc.startSec;
    const t1 = sc.endSec;
    const dur = f(Math.max(0.5, t1 - t0), 3);
    const pal = ACCENTS[sc.accent] || ACCENTS.gold;
    const layout = String(sc.layout || "impact").toLowerCase();
    const visual = sc.visual || DEFAULT_VISUAL_BY_LAYOUT[layout] || "shockwave";
    const ey = esc(sc.eyebrow || "");
    const hl = String(sc.headline || "");
    const sub = esc(sc.subheadline || "");
    const badge = esc(sc.badge || "DESTAQUE");
    const hSize = headlineSize(hl);

    // Câmera Ken Burns contínua (evita qualquer frame estático)
    const driftY = idx % 2 === 0 ? -14 : 14;
    T(`tl.fromTo("#${dollyId}", { scale: 1.0, y: 0 }, { scale: 1.08, y: ${driftY}, duration: ${dur}, ease: "none", immediateRender: false }, ${t0});`);

    // Transições energéticas + flash branco sutil entre cortes
    if (idx > 0) {
      if (idx % 2 === 0) {
        const flashAt = f(Math.max(0.05, t0 - 0.05), 3);
        T(`tl.to("#flash", { opacity: 0.62, duration: 0.05, ease: "power2.out" }, ${flashAt});`);
        T(`tl.to("#flash", { opacity: 0, duration: 0.22, ease: "power2.out" }, ${t0});`);
      }
      if (idx % 3 === 1) {
        S(`gsap.set("#${camId}", { opacity: 0, x: 900, skewX: -10 });`);
        T(`tl.to("#${camId}", { opacity: 1, x: 0, skewX: 0, duration: 0.36, ease: "expo.out" }, ${t0});`);
      } else if (idx % 3 === 2) {
        S(`gsap.set("#${camId}", { opacity: 0, scale: 0.82 });`);
        T(`tl.to("#${camId}", { opacity: 1, scale: 1, duration: 0.38, ease: "back.out(1.6)" }, ${t0});`);
      } else {
        S(`gsap.set("#${camId}", { opacity: 0, y: 140 });`);
        T(`tl.to("#${camId}", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, ${t0});`);
      }
    }

    // Saída da câmera (última cena faz fade out suave)
    if (idx < scenes.length - 1) {
      const exitAt = f(Math.max(t0 + 0.35, t1 - 0.28), 3);
      if (idx % 2 === 0) {
        T(`tl.to("#${camId}", { opacity: 0, x: -750, skewX: 8, duration: 0.26, ease: "power3.in" }, ${exitAt});`);
      } else {
        T(`tl.to("#${camId}", { opacity: 0, scale: 1.18, filter: "blur(10px)", duration: 0.26, ease: "power2.in" }, ${exitAt});`);
      }
    } else {
      T(`tl.to("#fade", { opacity: 1, duration: 0.45, ease: "power1.in" }, ${f(Math.max(t0 + 0.5, TOTAL - 0.45), 3)});`);
    }

    const visualLayerHtml = buildSceneVisual(visual, id, idx, t0, dur, pal);
    let bodyHtml = "";

    if (layout === "timeline") {
      bodyHtml = `
        <svg class="tl-ring" id="${id}-ring" viewBox="0 0 500 500" width="460" height="460">
          <circle cx="250" cy="250" r="210" fill="none" stroke="${pal.main}" stroke-width="4" stroke-dasharray="14 14" opacity="0.45"/>
          <circle id="${id}-arc" cx="250" cy="250" r="180" fill="none" stroke="${pal.soft}" stroke-width="8" stroke-dasharray="1130" stroke-dashoffset="1130" stroke-linecap="round"/>
        </svg>
        <div class="eyebrow gold-line" id="${id}-ey" style="top:310px;color:${pal.soft}"><span class="ln" style="background:${pal.main}"></span>${ey}<span class="ln" style="background:${pal.main}"></span></div>
        <div class="badge-pill" id="${id}-bd" style="top:420px;background:${pal.main};color:${pal.dark}">${badge}</div>
        <div class="anton center wrap-hl" id="${id}-hl" style="top:560px;font-size:${hSize}px;color:#fff;text-shadow:0 0 50px ${pal.main}88">${esc(hl)}</div>
        <div class="subline" id="${id}-sub" style="top:960px;color:${pal.soft}">${sub}</div>`;
      S(`gsap.set(["#${id}-ey","#${id}-bd","#${id}-hl","#${id}-sub"], { opacity: 0, y: 40 });`);
      S(`gsap.set("#${id}-ring", { opacity: 0, scale: 0.7 });`);
      T(`tl.to("#${id}-ring", { opacity: 1, scale: 1, rotation: 35, duration: ${dur}, ease: "none" }, ${t0});`);
      T(`tl.to("#${id}-arc", { strokeDashoffset: 0, duration: ${f(Math.min(1.1, dur * 0.6))}, ease: "power2.out" }, ${t0 + 0.1});`);
      T(`tl.to("#${id}-ey", { opacity: 1, y: 0, duration: 0.3 }, ${t0 + 0.08});`);
      T(`tl.to("#${id}-bd", { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2)" }, ${t0 + 0.18});`);
      T(`tl.to("#${id}-hl", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }, ${t0 + 0.28});`);
      T(`tl.to("#${id}-sub", { opacity: 1, y: 0, duration: 0.35 }, ${t0 + 0.45});`);
    } else if (layout === "stat") {
      const targetNum = parseInt(sc.statNumber, 10) || 1000;
      const statLbl = esc(sc.statLabel || sub || "REGISTROS");
      bodyHtml = `
        <div class="pulse-ring" id="${id}-p1" style="border-color:${pal.main}"></div>
        <div class="pulse-ring" id="${id}-p2" style="border-color:${pal.soft}"></div>
        <div class="eyebrow" id="${id}-ey" style="top:330px;color:${pal.soft}">${ey}</div>
        <div class="anton center" id="${id}-num" style="top:490px;font-size:230px;color:${pal.main};text-shadow:0 0 70px ${pal.main}99">+0</div>
        <div class="anton center wrap-hl" id="${id}-hl" style="top:770px;font-size:74px;color:#fff">${esc(hl)}</div>
        <div class="subline" id="${id}-sub" style="top:960px;color:${pal.soft}">${statLbl}</div>`;
      S(`gsap.set(["#${id}-ey","#${id}-num","#${id}-hl","#${id}-sub"], { opacity: 0, y: 40 });`);
      S(`gsap.set(["#${id}-p1","#${id}-p2"], { opacity: 0, scale: 0.4 });`);
      T(`tl.to("#${id}-ey", { opacity: 1, y: 0, duration: 0.3 }, ${t0 + 0.08});`);
      T(`tl.to("#${id}-num", { opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)" }, ${t0 + 0.18});`);
      T(`(function(){ const o={v:0}; const el=document.getElementById("${id}-num"); tl.to(o,{v:${targetNum},duration:${f(Math.min(1.4, dur * 0.6))},ease:"power2.out",onUpdate:()=>{const n=Math.round(o.v);el.textContent="+"+String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g,".");}},${t0 + 0.2}); })();`);
      T(`tl.to("#${id}-p1", { opacity: 0.7, scale: 2.2, duration: 1.2, ease: "power2.out" }, ${t0 + 0.25});`);
      T(`tl.to("#${id}-p1", { opacity: 0, duration: 0.4 }, ${t0 + 1.0});`);
      T(`tl.to("#${id}-hl", { opacity: 1, y: 0, duration: 0.35 }, ${t0 + 0.35});`);
      T(`tl.to("#${id}-sub", { opacity: 1, y: 0, duration: 0.35 }, ${t0 + 0.5});`);
    } else if (layout === "quote") {
      bodyHtml = `
        <div class="eyebrow" id="${id}-ey" style="top:320px;color:${pal.soft}">${ey}</div>
        <div class="quote-card" id="${id}-card" style="border-color:${pal.main}">
          <div class="quote-badge" style="color:${pal.main}">${esc(hl || badge)}</div>
          <div class="quote-txt">“${sub || esc(sc.narration || "")}”</div>
        </div>`;
      S(`gsap.set("#${id}-ey", { opacity: 0, y: 20 });`);
      S(`gsap.set("#${id}-card", { opacity: 0, y: 70, rotationX: 25 });`);
      T(`tl.to("#${id}-ey", { opacity: 1, y: 0, duration: 0.3 }, ${t0 + 0.08});`);
      T(`tl.to("#${id}-card", { opacity: 1, y: 0, rotationX: 0, duration: 0.48, ease: "back.out(1.6)" }, ${t0 + 0.2});`);
    } else if (layout === "stamp") {
      bodyHtml = `
        <div class="eyebrow" id="${id}-ey" style="top:330px;color:${pal.soft}">${ey}</div>
        <div class="anton center wrap-hl" id="${id}-hl" style="top:460px;font-size:${hSize}px;color:#fff">${esc(hl)}</div>
        <div class="strike" id="${id}-st" style="top:680px;background:${pal.main};box-shadow:0 0 30px ${pal.main}"></div>
        <div class="stamp" id="${id}-stp" style="border-color:${pal.main};color:${pal.main}">${badge}</div>
        <div class="subline" id="${id}-sub" style="top:1050px;color:${pal.soft}">${sub}</div>`;
      S(`gsap.set(["#${id}-ey","#${id}-hl","#${id}-sub"], { opacity: 0, y: 35 });`);
      S(`gsap.set("#${id}-st", { scaleX: 0 });`);
      S(`gsap.set("#${id}-stp", { opacity: 0, scale: 2.5, rotation: -16 });`);
      T(`tl.to("#${id}-ey", { opacity: 1, y: 0, duration: 0.28 }, ${t0 + 0.06});`);
      T(`tl.to("#${id}-hl", { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, ${t0 + 0.16});`);
      T(`tl.to("#${id}-st", { scaleX: 1, duration: 0.28, ease: "power4.out" }, ${t0 + 0.55});`);
      T(`tl.to("#${id}-stp", { opacity: 1, scale: 1, rotation: -7, duration: 0.26, ease: "back.out(3)" }, ${t0 + 0.62});`);
      shake(`#${camId}`, t0 + 0.65, 14, 5);
      T(`tl.to("#${id}-sub", { opacity: 1, y: 0, duration: 0.35 }, ${t0 + 0.8});`);
    } else if (layout === "mystery") {
      let fogHtml = "";
      for (let fi = 0; fi < 4; fi++) {
        fogHtml += `<div class="fog" id="${id}-fog-${fi}" style="top:${400 + fi * 180}px;left:${(fi % 2 === 0 ? -220 : 120)}px;background:radial-gradient(ellipse,${pal.main}55,transparent 70%)"></div>`;
        S(`gsap.set("#${id}-fog-${fi}", { opacity: 0 });`);
        T(`tl.to("#${id}-fog-${fi}", { opacity: 0.45, x: ${fi % 2 === 0 ? 180 : -180}, duration: ${dur}, ease: "sine.inOut" }, ${t0});`);
      }
      bodyHtml = `
        ${fogHtml}
        <div class="eyebrow" id="${id}-ey" style="top:340px;color:${pal.soft}">${ey}</div>
        <div class="mystery center wrap-hl" id="${id}-hl" style="top:500px;font-size:${Math.min(165, hSize)}px;color:${pal.soft};text-shadow:0 0 70px ${pal.main}">${esc(hl)}</div>
        <div class="subline" id="${id}-sub" style="top:960px;color:#fff">${sub}</div>`;
      S(`gsap.set("#${id}-ey", { opacity: 0, y: 20 });`);
      S(`gsap.set("#${id}-hl", { opacity: 0, filter: "blur(34px)", scale: 1.24 });`);
      S(`gsap.set("#${id}-sub", { opacity: 0, y: 30 });`);
      T(`tl.to("#${id}-ey", { opacity: 1, y: 0, duration: 0.35 }, ${t0 + 0.08});`);
      T(`tl.to("#${id}-hl", { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.65, ease: "power2.out" }, ${t0 + 0.22});`);
      T(`tl.to("#${id}-sub", { opacity: 1, y: 0, duration: 0.4 }, ${t0 + 0.5});`);
    } else if (layout === "split_vs" || layout === "cta") {
      const leftTxt = esc(sc.vsLeft || "OPÇÃO A");
      const rightTxt = esc(sc.vsRight || "OPÇÃO B");
      const isCta = layout === "cta";
      bodyHtml = `
        <div class="eyebrow" id="${id}-ey" style="top:250px;color:${pal.soft}">${ey}</div>
        <div class="anton center wrap-hl" id="${id}-hl" style="top:330px;font-size:102px;color:#fff">${esc(hl)}</div>
        <div class="card ca" id="${id}-ca"><div class="badge">A</div><div class="card-t">${leftTxt}</div></div>
        <div class="card cb" id="${id}-cb"><div class="badge">B</div><div class="card-t">${rightTxt}</div></div>
        <div class="vs anton" id="${id}-vs">VS</div>
        ${
          isCta
            ? `<div class="cta-row" id="${id}-cta">
                <div class="pill comment" id="${id}-pc">COMENTA AÍ</div>
                <div class="pill follow" id="${id}-pf"><span id="${id}-fp">+ SEGUIR</span><span id="${id}-fo">✓ SEGUINDO</span></div>
              </div>`
            : `<div class="subline" id="${id}-sub" style="top:1120px;color:${pal.soft}">${sub}</div>`
        }`;
      S(`gsap.set(["#${id}-ey","#${id}-hl"], { opacity: 0, y: -30 });`);
      S(`gsap.set("#${id}-ca", { x: -650, rotation: -16 });`);
      S(`gsap.set("#${id}-cb", { x: 650, rotation: 16 });`);
      S(`gsap.set("#${id}-vs", { opacity: 0, scale: 2.8, rotation: -30 });`);
      T(`tl.to("#${id}-ey", { opacity: 1, y: 0, duration: 0.28 }, ${t0 + 0.05});`);
      T(`tl.to("#${id}-hl", { opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)" }, ${t0 + 0.12});`);
      T(`tl.to("#${id}-ca", { x: 0, rotation: -4, duration: 0.45, ease: "back.out(1.5)" }, ${t0 + 0.25});`);
      T(`tl.to("#${id}-cb", { x: 0, rotation: 4, duration: 0.45, ease: "back.out(1.5)" }, ${t0 + 0.35});`);
      T(`tl.to("#${id}-vs", { opacity: 1, scale: 1, rotation: 0, duration: 0.35, ease: "back.out(3)" }, ${t0 + 0.45});`);
      shake(`#${camId}`, t0 + 0.48, 12, 4);
      if (isCta) {
        S(`gsap.set(["#${id}-pc","#${id}-pf"], { opacity: 0, y: 50, scale: 0.7 });`);
        S(`gsap.set("#${id}-fo", { opacity: 0, y: 30 });`);
        T(`tl.to("#${id}-pc", { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2)" }, ${t0 + 0.7});`);
        T(`tl.to("#${id}-pf", { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2)" }, ${t0 + 0.9});`);
        T(`tl.to("#${id}-fp", { opacity: 0, y: -30, duration: 0.2 }, ${t0 + 1.45});`);
        T(`tl.to("#${id}-fo", { opacity: 1, y: 0, duration: 0.25, ease: "back.out(2)" }, ${t0 + 1.5});`);
        T(`tl.to("#${id}-pf", { backgroundColor: "#22c55e", duration: 0.25 }, ${t0 + 1.5});`);
      } else {
        S(`gsap.set("#${id}-sub", { opacity: 0, y: 30 });`);
        T(`tl.to("#${id}-sub", { opacity: 1, y: 0, duration: 0.35 }, ${t0 + 0.7});`);
      }
    } else {
      // impact (default)
      bodyHtml = `
        <div class="eyebrow" id="${id}-ey" style="top:340px;color:${pal.soft}">${ey}</div>
        <div class="huge anton center wrap-hl" id="${id}-hl" style="top:460px;font-size:${hSize}px;color:${pal.soft};text-shadow:0 0 50px ${pal.main}88">${splitChars(hl, `ch c${idx}`)}</div>
        <div class="subline" id="${id}-sub" style="top:960px;color:#fff">${sub}</div>`;
      S(`gsap.set("#${id}-ey", { opacity: 0, y: 20 });`);
      S(`gsap.set(".c${idx}", { opacity: 0, y: 90, rotationX: -85 });`);
      S(`gsap.set("#${id}-sub", { opacity: 0, y: 35 });`);
      T(`tl.to("#${id}-ey", { opacity: 1, y: 0, duration: 0.28 }, ${t0 + 0.05});`);
      T(`tl.to(".c${idx}", { opacity: 1, y: 0, rotationX: 0, duration: 0.38, ease: "back.out(2)", stagger: 0.025 }, ${t0 + 0.14});`);
      shake(`#${camId}`, t0 + 0.2, 16, 5);
      T(`tl.to("#${id}-sub", { opacity: 1, y: 0, duration: 0.35 }, ${t0 + 0.45});`);
    }

    return `
<div id="${id}" class="scene clip" data-start="${t0}" data-duration="${dur}">
  <div class="cam" id="${camId}">
    <div class="dolly" id="${dollyId}">
      ${visualLayerHtml}
      <div class="fg-layer">
        ${bodyHtml}
      </div>
    </div>
  </div>
</div>`;
  })
  .join("\n");

// ================================================================
// LEGENDAS KARAOKÊ COM PÍLULAS DINÂMICAS
// ================================================================
const chunks = [];
let curChunk = [];
words.forEach((w, i) => {
  curChunk.push(w);
  const next = words[i + 1];
  const endS = /[.?!]$/.test(w.word);
  const endC = /[,:]$/.test(w.word);
  const gap = next ? next.start - w.end : 1;
  const chars = curChunk.map((x) => x.word).join(" ").length;
  const nextLen = next ? next.word.length + 1 : 0;
  if (!next || endS || endC || gap > 0.4 || curChunk.length >= 4 || chars + nextLen > 22) {
    chunks.push(curChunk);
    curChunk = [];
  }
});
if (curChunk.length) chunks.push(curChunk);

for (let i = 0; i < chunks.length - 1; i++) {
  const a = chunks[i], b = chunks[i + 1];
  const endsHard = /[.?!]$/.test(a[a.length - 1].word);
  if (a.length === 1 && !endsHard && a[0].word.length <= 4 && b.length < 4) {
    chunks.splice(i, 2, a.concat(b));
    i--;
  }
}

let subsHtml = "";
let wi = 0;
chunks.forEach((ch, ci) => {
  const start = f(Math.max(0, ch[0].start - 0.08), 3);
  const nextStart = chunks[ci + 1] ? chunks[ci + 1][0].start : TOTAL;
  const exitT = f(Math.min(ch[ch.length - 1].end + 0.45, nextStart - 0.1), 3);
  const dur = f(Math.max(0.2, exitT + 0.12 - start), 3);
  let inner = "";
  ch.forEach((w, k) => {
    const txt = esc(w.word.toUpperCase());
    const cleanLen = w.word.replace(/[^\p{L}0-9]/gu, "").length;
    const isKw = cleanLen >= 6 || /\d/.test(w.word);
    const bg = isKw ? "#facc15" : "#ffffff";
    const fg = isKw ? "#1a1300" : "#0a0a0a";
    inner += `<span class="sw" id="sw-${wi}"><i class="hl" id="hl-${wi}" style="background:${bg}"></i><b id="sb-${wi}">${txt}</b></span>`;
    S(`gsap.set("#sw-${wi}", { opacity: 0, y: 40, scale: 0.7 });`);
    S(`gsap.set("#hl-${wi}", { scaleX: 0 });`);
    const ws = f(w.start, 3);
    const nextW = ch[k + 1] ? ch[k + 1].start : w.end;
    const we = f(Math.max(ws + 0.1, Math.min(w.end, nextW)), 3);
    const entryT = f(start + k * 0.03, 3);
    const entryD = f(Math.max(0.04, Math.min(0.18, ws - entryT - 0.01)), 3);
    T(`tl.to("#sw-${wi}", { opacity: 0.5, y: 0, scale: 0.94, duration: ${entryD}, ease: "back.out(2.6)" }, ${entryT});`);
    T(`tl.to("#sw-${wi}", { opacity: 1, scale: 1.08, rotation: ${f(R(-3, 3), 1)}, duration: 0.1, ease: "back.out(3)" }, ${ws});`);
    T(`tl.to("#hl-${wi}", { scaleX: 1, transformOrigin: "0% 50%", duration: 0.08, ease: "power3.out" }, ${ws});`);
    T(`tl.to("#sb-${wi}", { color: "${fg}", duration: 0.05 }, ${ws});`);
    T(`tl.to("#hl-${wi}", { scaleX: 0, transformOrigin: "100% 50%", duration: 0.08, ease: "power2.in" }, ${f(we - 0.04, 3)});`);
    T(`tl.to("#sb-${wi}", { color: "${isKw ? bg : "#ffffff"}", duration: 0.06 }, ${f(we - 0.02, 3)});`);
    T(`tl.to("#sw-${wi}", { scale: 1, rotation: 0, duration: 0.1 }, ${we});`);
    wi++;
  });
  subsHtml += `<div class="chunk clip" id="ck-${ci}" data-start="${start}" data-duration="${dur}"><div class="chunk-in" id="cki-${ci}">${inner}</div></div>\n`;
  T(`tl.to("#cki-${ci}", { opacity: 0, y: -36, scale: 0.92, duration: 0.12, ease: "power2.in" }, ${exitT});`);
});

const hasNarration = fs.existsSync(path.join(PROJECT_ROOT, "audio", "narracao.mp3"));
const ambientSrc = !hasTimedAudio
  ? fs.existsSync(path.join(PROJECT_ROOT, "audio", "ambient.mp3"))
    ? "audio/ambient.mp3"
    : fs.existsSync(path.join(TPL_DIR, "ambient.mp3"))
      ? "templates/kinetic-shorts/ambient.mp3"
      : null
  : null;

const html = `<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@800;900&family=Playfair+Display:ital,wght@1,900&display=block" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#02060c;color:#fff;font-family:'Montserrat',system-ui,sans-serif}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#030a14}
.bg{position:absolute;inset:0;overflow:hidden}
.blob{position:absolute;border-radius:50%;opacity:.45;filter:blur(40px)}
.tint{position:absolute;inset:0;opacity:0}
.dust{position:absolute;border-radius:50%;background:#e0f2fe;box-shadow:0 0 8px #bae6fd}
.scene{position:absolute;inset:0;overflow:hidden}
.cam{position:absolute;inset:0;transform-origin:50% 45%}
.dolly{position:absolute;inset:0;transform-origin:50% 42%}
.vis-layer{position:absolute;inset:0;pointer-events:none;z-index:0}
.fg-layer{position:absolute;inset:0;z-index:5}
.vis-spark{position:absolute;border-radius:50%}
.live-pop{position:absolute;display:flex;align-items:center;gap:14px;background:rgba(15,23,42,.88);border:2px solid rgba(255,255,255,.22);padding:14px 24px;border-radius:999px;font-weight:800;font-size:28px;color:#fff;box-shadow:0 16px 40px rgba(0,0,0,.55)}
.live-av{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Anton',sans-serif;font-size:24px;color:#02060c}
.center{position:absolute;left:0;right:0;text-align:center}
.wrap-hl{padding:0 70px;line-height:1.02}
.anton{font-family:'Anton',sans-serif;line-height:1;text-transform:uppercase}
.huge{line-height:.95;text-shadow:0 12px 60px rgba(0,0,0,.6)}
.ch{display:inline-block}
.eyebrow{position:absolute;left:60px;right:60px;text-align:center;font-weight:900;font-size:36px;letter-spacing:10px;text-transform:uppercase}
.subline{position:absolute;left:90px;right:90px;text-align:center;font-weight:900;font-size:44px;line-height:1.25;letter-spacing:2px;text-transform:uppercase}
.gold-line{display:flex;align-items:center;justify-content:center;gap:22px}
.gold-line .ln{width:90px;height:3px}
.badge-pill{position:absolute;left:50%;transform:translateX(-50%);padding:14px 36px;border-radius:999px;font-weight:900;font-size:34px;letter-spacing:4px}
.tl-ring{position:absolute;left:310px;top:410px;pointer-events:none;opacity:.45}
.pulse-ring{position:absolute;left:340px;top:420px;width:400px;height:400px;border-radius:50%;border:10px solid #facc15}
.rays{position:absolute;left:-460px;top:-1100px;width:2000px;height:2000px;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(253,230,138,.42) 0deg 6deg,transparent 6deg 18deg);-webkit-mask:radial-gradient(circle,#000 0%,transparent 62%);mask:radial-gradient(circle,#000 0%,transparent 62%)}
.quote-card{position:absolute;left:85px;right:85px;top:480px;padding:54px 48px;border-radius:34px;background:rgba(10,15,30,.86);border:4px solid #facc15;box-shadow:0 24px 60px rgba(0,0,0,.55);text-align:center}
.quote-badge{font-family:'Anton',sans-serif;font-size:52px;letter-spacing:5px;margin-bottom:22px}
.quote-txt{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:900;font-size:48px;line-height:1.35;color:#f8fafc}
.strike{position:absolute;left:110px;right:110px;height:18px;border-radius:10px;transform-origin:0 50%;transform:rotate(-3deg)}
.stamp{position:absolute;left:50%;top:790px;transform:translateX(-50%);padding:16px 42px;border:8px solid #ef4444;font-family:'Anton',sans-serif;font-size:74px;letter-spacing:6px;border-radius:16px}
.fog{position:absolute;width:1300px;height:460px;border-radius:50%;filter:blur(32px)}
.mystery{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:900;line-height:1.08}
.card{position:absolute;top:590px;width:430px;height:430px;border-radius:36px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;box-shadow:0 30px 80px rgba(0,0,0,.55)}
.card.ca{left:60px;background:linear-gradient(160deg,#0c4a6e,#082f49);border:4px solid #38bdf8}
.card.cb{left:590px;background:linear-gradient(160deg,#713f12,#422006);border:4px solid #facc15}
.card-t{font-family:'Anton',sans-serif;font-size:58px;line-height:1.08;text-align:center;text-transform:uppercase}
.badge{position:absolute;top:-32px;left:50%;margin-left:-36px;width:72px;height:72px;border-radius:50%;background:#fff;color:#0a0a0a;font-family:'Anton',sans-serif;font-size:46px;display:flex;align-items:center;justify-content:center}
.vs{position:absolute;left:470px;top:740px;width:140px;height:140px;border-radius:50%;background:#f43f5e;display:flex;align-items:center;justify-content:center;font-size:66px;box-shadow:0 0 0 10px #030a14,0 0 50px rgba(244,63,94,.8)}
.cta-row{position:absolute;left:0;right:0;top:1090px;display:flex;justify-content:center;gap:26px}
.pill{position:relative;display:flex;align-items:center;justify-content:center;height:104px;padding:0 44px;border-radius:999px;font-weight:900;font-size:42px;overflow:hidden}
.pill.comment{background:#facc15;color:#0b1220}
.pill.follow{background:#be123c;color:#fff;min-width:390px}
#subs{position:absolute;left:0;right:0;top:1370px;height:300px;z-index:50}
.chunk{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.chunk-in{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px 18px;max-width:980px;padding:0 30px}
.sw{position:relative;display:inline-block;padding:4px 16px}
.sw .hl{position:absolute;inset:0;border-radius:16px;transform-origin:0 50%;box-shadow:0 8px 24px rgba(0,0,0,.45)}
.sw b{position:relative;display:block;font-family:'Montserrat',system-ui,sans-serif;font-weight:900;font-size:74px;line-height:1.08;color:#fff;letter-spacing:-1px;-webkit-text-stroke:2px rgba(0,0,0,.35);text-shadow:0 6px 20px rgba(0,0,0,.85)}
#grain{position:absolute;inset:-50px;z-index:80;opacity:.09;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
#vignette{position:absolute;inset:0;z-index:81;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,transparent 50%,rgba(0,0,0,.7) 100%)}
#flash{position:absolute;inset:0;z-index:90;background:#fff;opacity:0;pointer-events:none}
#fade{position:absolute;inset:0;z-index:95;background:#000;opacity:0;pointer-events:none}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
  ${hasNarration ? `<audio id="audio-narration" src="audio/narracao.mp3" data-start="0" data-duration="${TOTAL}" data-volume="1.0"></audio>` : ""}
  ${ambientSrc ? `<audio id="audio-ambient" src="${ambientSrc}" data-start="0" data-duration="${TOTAL}" data-volume="0.18" data-fade-in="1.0" data-fade-out="1.2"></audio>` : ""}
  <div class="bg" id="bg">
    ${blobsHtml}
    ${tintsHtml}
    ${dustHtml}
  </div>
${scenesHtml}
  <div id="subs">
${subsHtml}  </div>
  <div id="grain" data-layout-allow-occlusion></div>
  <div id="vignette" data-layout-allow-occlusion></div>
  <div id="flash" data-layout-allow-occlusion></div>
  <div id="fade" data-layout-allow-occlusion></div>
</div>
<script>
${sets.join("\n")}
const tl = gsap.timeline({ paused: true });
tl.to("#grain", { x: 30, y: -20, duration: 0.1, repeat: ${Math.max(1, Math.floor(TOTAL / 0.1) - 1)}, yoyo: true, ease: "steps(1)" }, 0);
${js.join("\n")}
tl.set({}, {}, ${TOTAL});
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
</script>
</body>
</html>`;

fs.writeFileSync(path.join(TPL_DIR, "index.html"), html, "utf-8");
console.log(`index.html gerado: ${scenes.length} cenas dinâmicas (0 contadores), ${chunks.length} blocos de legenda, ${wi} palavras (${TOTAL}s).`);
