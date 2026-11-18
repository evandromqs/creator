// Gera index.html (v2) — remodelagem completa do vídeo "O Mar Vermelho de Moisés".
// Mantém audio/narracao.mp3 + transcript/words.json (timestamps originais).
// Uso: node scripts/build_v2.cjs  (a partir da pasta video-moises ou de qualquer lugar)
const fs = require("fs");
const path = require("path");

const TPL_DIR = __dirname;
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const wordsPath = fs.existsSync(path.join(PROJECT_ROOT, "transcript", "words.json"))
  ? path.join(PROJECT_ROOT, "transcript", "words.json")
  : path.join(TPL_DIR, "words.json");
const words = JSON.parse(fs.readFileSync(wordsPath, "utf-8"));
const hasNarration = fs.existsSync(path.join(PROJECT_ROOT, "audio", "narracao.mp3"));
const ambientSrc = fs.existsSync(path.join(PROJECT_ROOT, "audio", "ambient.mp3"))
  ? "audio/ambient.mp3"
  : fs.existsSync(path.join(TPL_DIR, "ambient.mp3"))
    ? "templates/kinetic-shorts/ambient.mp3"
    : null;
const TOTAL = 38.5;

// ---------- PRNG determinístico ----------
let seed = 1337;
function rnd() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const R = (a, b) => a + rnd() * (b - a);
const f = (n, d = 2) => Number(n.toFixed(d));

const js = []; // linhas de timeline
const sets = []; // estados iniciais (gsap.set)
const T = (s) => js.push(s);
const S = (s) => sets.push(s);

const splitChars = (txt, cls = "ch") =>
  [...txt].map((c) => (c === " " ? `<span class="${cls} sp">&nbsp;</span>` : `<span class="${cls}">${c}</span>`)).join("");

// Shake de câmera determinístico
function shake(target, t, amp = 18, n = 7) {
  let tt = t;
  for (let i = 0; i < n; i++) {
    const k = 1 - i / n;
    T(`tl.to("${target}", { x: ${f(R(-amp, amp) * k)}, y: ${f(R(-amp, amp) * k)}, rotation: ${f(R(-0.8, 0.8) * k)}, duration: 0.04, ease: "none" }, ${f(tt, 3)});`);
    tt += 0.04;
  }
  T(`tl.to("${target}", { x: 0, y: 0, rotation: 0, duration: 0.06, ease: "power2.out" }, ${f(tt, 3)});`);
}

// ================================================================
// FUNDO GLOBAL: blobs de luz + partículas
// ================================================================
const blobColors = ["#0ea5e9", "#1d4ed8", "#06b6d4", "#7c3aed", "#0f766e"];
let blobsHtml = "";
blobColors.forEach((c, i) => {
  const size = Math.round(R(700, 1100));
  const x = Math.round(R(-300, 700));
  const y = Math.round(R(-200, 1500));
  blobsHtml += `<div class="blob" id="blob-${i}" style="width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:radial-gradient(circle, ${c} 0%, transparent 65%);"></div>`;
  const dur = f(R(5, 8));
  const reps = Math.floor(TOTAL / dur);
  T(`tl.to("#blob-${i}", { x: ${Math.round(R(-260, 260))}, y: ${Math.round(R(-300, 300))}, scale: ${f(R(0.8, 1.3))}, duration: ${dur}, ease: "sine.inOut", yoyo: true, repeat: ${reps} }, 0);`);
});

let dustHtml = "";
for (let i = 0; i < 46; i++) {
  const s = f(R(2, 6), 1);
  const x = Math.round(R(0, 1080));
  const y = Math.round(R(0, 1920));
  dustHtml += `<i class="dust" id="dust-${i}" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;opacity:${f(R(0.15, 0.6))}"></i>`;
  T(`tl.to("#dust-${i}", { y: ${-Math.round(R(250, 700))}, x: ${Math.round(R(-80, 80))}, duration: ${TOTAL}, ease: "none" }, 0);`);
}

// Tintas de fundo por seção (crossfade de cor)
const tints = [
  ["#tint-red", 0.86, 3.04],
  ["#tint-gold", 4.3, 10.6],
  ["#tint-teal", 10.8, 16.7],
  ["#tint-blue", 16.8, 24.1],
  ["#tint-gold2", 24.3, 27.7],
  ["#tint-violet", 27.8, 32.4],
  ["#tint-gold3", 32.5, 38.0],
];
for (const [id, a, b] of tints) {
  T(`tl.to("${id}", { opacity: 1, duration: 0.5, ease: "power2.out" }, ${a});`);
  T(`tl.to("${id}", { opacity: 0, duration: 0.5, ease: "power2.in" }, ${f(b)});`);
}

// ================================================================
// CENA 1 — GANCHO (0 – 3.95)
// ================================================================
const s1 = `
<div id="s1" class="scene clip" data-start="0" data-duration="3.95">
  <div class="cam" id="cam1">
    <div class="eyebrow" id="s1-eyebrow" style="top:360px">VOCÊ SABIA?</div>
    <div class="huge anton center" id="s1-mar" style="top:470px;font-size:300px;">MAR</div>
    <div class="huge anton center red-text" id="s1-verm" style="top:760px;font-size:210px;">${splitChars("VERMELHO", "ch v1ch")}</div>
    <div class="strike" id="s1-strike" style="top:850px"></div>
    <div class="anton center" id="s1-moises" style="top:1000px;font-size:84px;letter-spacing:18px;color:#fde68a;">DE MOISÉS</div>
    <div class="anton qmark" id="s1-q">?</div>
  </div>
</div>`;
S(`gsap.set("#s1-eyebrow", { opacity: 1 });`);
S(`gsap.set("#s1-mar", { opacity: 1, scale: 1 });`);
S(`gsap.set(".v1ch", { opacity: 0, y: 120, rotationX: -90 });`);
S(`gsap.set("#s1-moises", { opacity: 0, y: 40 });`);
S(`gsap.set("#s1-strike", { scaleX: 0 });`);
S(`gsap.set("#s1-q", { opacity: 0, scale: 0.2, rotation: -40 });`);
T(`tl.to("#s1-eyebrow", { scale: 1.08, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.0);`);
T(`tl.to("#s1-mar", { color: "#ff9aae", scale: 1.12, duration: 0.12, ease: "power3.out" }, 0.86);`);
T(`tl.to("#s1-mar", { scale: 1, duration: 0.35, ease: "back.out(2)" }, 0.98);`);
shake("#cam1", 0.9, 26);
T(`tl.to(".v1ch", { opacity: 1, y: 0, rotationX: 0, duration: 0.4, ease: "back.out(2)", stagger: 0.035 }, 0.98);`);
T(`tl.to("#s1-moises", { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, 1.54);`);
T(`tl.to("#s1-verm", { scale: 1.06, duration: 1.2, ease: "sine.inOut" }, 1.6);`);
// "nem ter sido vermelho?" — a cor drena
T(`tl.to("#s1-eyebrow", { opacity: 0, duration: 0.3 }, 2.3);`);
T(`tl.to(".v1ch", { color: "#38bdf8", textShadow: "0 0 40px rgba(56,189,248,0.8)", duration: 0.25, stagger: 0.03, ease: "none" }, 3.04);`);
T(`tl.to("#s1-mar", { color: "#38bdf8", duration: 0.3 }, 3.04);`);
T(`tl.to(".v1ch", { keyframes: [{ x: -14, duration: 0.03 }, { x: 10, duration: 0.03 }, { x: -6, duration: 0.03 }, { x: 0, duration: 0.03 }] }, 3.06);`);
T(`tl.to("#s1-strike", { scaleX: 1, duration: 0.25, ease: "power4.out" }, 3.2);`);
T(`tl.to("#s1-q", { opacity: 1, scale: 1, rotation: 12, duration: 0.45, ease: "back.out(2.2)" }, 3.04);`);
shake("#cam1", 3.06, 20);
// Saída: zoom-through
T(`tl.to("#cam1", { scale: 1.6, opacity: 0, filter: "blur(16px)", duration: 0.32, ease: "power3.in" }, 3.62);`);

// ================================================================
// CENA 2 — YAM SUPH (3.9 – 10.95)
// ================================================================
let reeds = "";
for (let i = 0; i < 38; i++) {
  const x = Math.round(R(-20, 1100));
  const h = Math.round(R(320, 720));
  const w = f(R(4, 9), 1);
  const lean = f(R(-30, 30), 1);
  const tone = ["#134e4a", "#115e59", "#0f766e", "#164e63"][i % 4];
  const head = rnd() > 0.35;
  reeds += `<g class="reed" id="reed-${i}" style="transform-origin:${x}px 1920px">
      <path d="M${x} 1920 Q ${x + lean * 0.4} ${1920 - h * 0.5} ${x + lean} ${1920 - h}" stroke="${tone}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
      ${head ? `<rect x="${f(x + lean - w * 1.3)}" y="${1920 - h - 10}" width="${f(w * 2.6)}" height="${Math.round(R(60, 110))}" rx="${f(w * 1.3)}" fill="#3f2a14"/>` : ""}
      <path d="M${x} ${1920 - h * 0.35} q ${f(R(30, 80))} ${-f(R(40, 120))} ${f(R(80, 160))} ${-f(R(60, 160))}" stroke="${tone}" stroke-width="${f(w * 0.7)}" fill="none" stroke-linecap="round" opacity="0.8"/>
    </g>`;
  S(`gsap.set("#reed-${i}", { scaleY: 0 });`);
}
const s2 = `
<div id="s2" class="scene clip" data-start="3.9" data-duration="7.05">
  <div class="cam" id="cam2">
    <svg class="reeds" viewBox="0 0 1080 1920" preserveAspectRatio="none">${reeds}</svg>
    <div id="s2-group">
      <div class="eyebrow gold-line" id="s2-eyebrow" style="top:330px"><span class="ln"></span>TEXTO HEBRAICO ORIGINAL<span class="ln"></span></div>
      <div class="hebrew center" id="s2-heb" dir="rtl" style="top:430px">יַם־סוּף</div>
      <div class="anton center" id="s2-translit" style="top:830px;font-size:170px;letter-spacing:10px;">
        <span id="s2-yam" class="tl-word">YAM</span> <span id="s2-suph" class="tl-word">SUPH</span>
      </div>
      <div class="arrow-down" id="s2-arrow" style="top:1035px"><span class="arrow-label">TRADUÇÃO</span></div>
    </div>
    <div class="anton center juncos" id="s2-juncos" style="top:820px;">
      <span class="jw" id="j-mar">MAR</span> <span class="jw" id="j-de">DE</span><br><span class="jw big" id="j-juncos">JUNCOS</span>
    </div>
  </div>
</div>`;
S(`gsap.set("#s2-eyebrow", { opacity: 0, y: 20 });`);
S(`gsap.set("#s2-heb", { clipPath: "inset(0% 0% 0% 100%)", scale: 1.15 });`);
S(`gsap.set(".tl-word", { opacity: 0, y: 80, scale: 0.6 });`);
S(`gsap.set("#s2-arrow", { opacity: 0, scaleY: 0 });`);
S(`gsap.set(".jw", { opacity: 0, y: 90, scale: 0.7 });`);
S(`gsap.set("#cam2", { opacity: 0, scale: 0.85 });`);
T(`tl.to("#cam2", { opacity: 1, scale: 1, duration: 0.45, ease: "expo.out" }, 3.9);`);
T(`tl.to("#s2-eyebrow", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 4.06);`);
T(`tl.to("#s2-heb", { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.1, ease: "power2.inOut" }, 4.36);`);
T(`tl.to("#s2-heb", { textShadow: "0 0 80px rgba(250,204,21,0.95), 0 0 20px rgba(250,204,21,0.9)", scale: 1.08, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }, 6.26);`);
T(`tl.to("#s2-yam", { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2.5)" }, 6.26);`);
T(`tl.to("#s2-suph", { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2.5)" }, 6.6);`);
shake("#cam2", 6.28, 14, 5);
T(`tl.to("#s2-translit", { scale: 1.1, duration: 1.4, ease: "power2.out" }, 6.7);`);
T(`tl.to("#s2-arrow", { opacity: 1, scaleY: 1, duration: 0.45, ease: "power3.out" }, 8.7);`);
// sobe o grupo, entra "MAR DE JUNCOS"
T(`tl.to("#s2-group", { y: -150, scale: 0.78, opacity: 0.45, duration: 0.5, ease: "power3.inOut" }, 9.2);`);
T(`tl.to("#s2-arrow", { opacity: 0, duration: 0.2 }, 9.2);`);
T(`tl.to("#j-mar", { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)" }, 9.5);`);
T(`tl.to("#j-de", { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)" }, 9.78);`);
T(`tl.to("#j-juncos", { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2.4)" }, 10.02);`);
for (let i = 0; i < 38; i++) {
  T(`tl.to("#reed-${i}", { scaleY: 1, duration: ${f(R(0.5, 0.9))}, ease: "back.out(1.6)" }, ${f(9.4 + R(0, 0.6))});`);
  T(`tl.to("#reed-${i}", { rotation: ${f(R(-4, 4))}, duration: ${f(R(0.5, 0.8))}, ease: "sine.inOut", yoyo: true, repeat: 1 }, ${f(10.0 + R(0, 0.2))});`);
}
// Saída: whip pan para a esquerda
T(`tl.to("#cam2", { x: -1100, skewX: 12, filter: "blur(10px)", duration: 0.32, ease: "power3.in" }, 10.62);`);

// ================================================================
// CENA 3 — DELTA DO NILO (10.75 – 16.95)
// ================================================================
const s3 = `
<div id="s3" class="scene clip" data-start="10.75" data-duration="6.4">
  <div class="cam" id="cam3">
    <div class="anton qmark2" id="s3-q">?</div>
    <div class="eyebrow" id="s3-eyebrow" style="top:300px">ISSO LEVANTA UMA PERGUNTA</div>
    <div id="s3-map">
      <svg viewBox="0 0 1080 1100" width="1080" height="1100">
        <defs>
          <linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c4a6e"/><stop offset="1" stop-color="#0369a1" stop-opacity="0.35"/></linearGradient>
          <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.2" fill="#5eead4" opacity="0.55"/></pattern>
          <radialGradient id="marshG"><stop offset="0" stop-color="#14b8a6" stop-opacity="0.55"/><stop offset="1" stop-color="#14b8a6" stop-opacity="0"/></radialGradient>
        </defs>
        <path id="sea" d="M0 0 H1080 V210 C 960 250, 860 190, 760 225 C 660 260, 600 200, 520 222 C 430 248, 360 190, 270 230 C 190 262, 90 205, 0 240 Z" fill="url(#seaG)"/>
        <path class="coast draw" d="M0 240 C 90 205, 190 262, 270 230 C 360 190, 430 248, 520 222 C 600 200, 660 260, 760 225 C 860 190, 960 250, 1080 210" stroke="#7dd3fc" stroke-width="5" fill="none"/>
        <ellipse id="marsh1" cx="330" cy="330" rx="200" ry="90" fill="url(#marshG)"/>
        <ellipse id="marsh2" cx="760" cy="350" rx="190" ry="95" fill="url(#marshG)"/>
        <ellipse id="marsh1d" cx="330" cy="330" rx="170" ry="70" fill="url(#dots)"/>
        <ellipse id="marsh2d" cx="760" cy="350" rx="160" ry="72" fill="url(#dots)"/>
        <path class="river draw" d="M540 1100 C 545 950, 530 820, 540 650" stroke="#38bdf8" stroke-width="16" fill="none" stroke-linecap="round"/>
        <path class="river draw" d="M540 650 C 480 520, 360 420, 300 238" stroke="#38bdf8" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path class="river draw" d="M540 650 C 600 520, 720 430, 790 222" stroke="#38bdf8" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path class="river draw" d="M540 650 C 530 520, 520 400, 515 224" stroke="#38bdf8" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path class="river draw" d="M455 480 C 420 400, 410 320, 405 236" stroke="#38bdf8" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path class="river draw" d="M640 470 C 660 390, 670 320, 660 245" stroke="#38bdf8" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path class="river draw" d="M400 450 C 330 400, 230 340, 150 245" stroke="#38bdf8" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path class="river draw" d="M690 450 C 780 400, 880 330, 960 232" stroke="#38bdf8" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path id="route" d="M180 820 C 360 760, 520 600, 640 470 S 860 330, 980 300" stroke="#facc15" stroke-width="7" fill="none" stroke-dasharray="4 22" stroke-linecap="round"/>
        <circle class="ripple" id="rip1" cx="330" cy="330" r="60" stroke="#5eead4" stroke-width="4" fill="none"/>
        <circle class="ripple" id="rip2" cx="330" cy="330" r="60" stroke="#5eead4" stroke-width="4" fill="none"/>
        <circle class="ripple" id="rip3" cx="760" cy="350" r="60" stroke="#5eead4" stroke-width="4" fill="none"/>
        <circle class="ripple" id="rip4" cx="760" cy="350" r="60" stroke="#5eead4" stroke-width="4" fill="none"/>
        <g id="pin" transform="translate(540 650)">
          <circle id="pin-ring" r="40" fill="none" stroke="#facc15" stroke-width="5"/>
          <path d="M0 0 C -34 -40, -34 -90, 0 -96 C 34 -90, 34 -40, 0 0 Z" fill="#facc15"/>
          <circle cx="0" cy="-62" r="13" fill="#0b1220"/>
        </g>
      </svg>
      <div class="chip" id="chip-rasas" style="left:90px;top:440px">ÁGUAS RASAS</div>
      <div class="chip teal" id="chip-pant" style="left:600px;top:470px">PÂNTANOS</div>
    </div>
    <div class="anton center" id="s3-title" style="top:1210px;font-size:120px;">
      <span class="dw" id="d-delta">DELTA</span> <span class="dw small" id="d-do">DO</span> <span class="dw gold" id="d-nilo">NILO</span>
    </div>
  </div>
</div>`;
S(`gsap.set("#cam3", { x: 1100, skewX: -12 });`);
S(`gsap.set("#s3-q", { opacity: 0, scale: 0.3, rotation: -30 });`);
S(`gsap.set("#s3-eyebrow", { opacity: 0, y: 20 });`);
S(`gsap.set("#s3-map", { opacity: 0, y: 60 });`);
S(`gsap.set(".draw", { strokeDasharray: 1400, strokeDashoffset: 1400 });`);
S(`gsap.set("#route", { opacity: 0 });`);
S(`gsap.set(["#marsh1","#marsh2","#marsh1d","#marsh2d","#sea"], { opacity: 0 });`);
S(`gsap.set(".ripple", { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" });`);
S(`gsap.set("#pin", { opacity: 0, y: -200 });`);
S(`gsap.set(".chip", { opacity: 0, scale: 0.4 });`);
S(`gsap.set(".dw", { opacity: 0, y: 70 });`);
T(`tl.to("#cam3", { x: 0, skewX: 0, duration: 0.4, ease: "expo.out" }, 10.75);`);
T(`tl.to("#s3-eyebrow", { opacity: 1, y: 0, duration: 0.35 }, 11.0);`);
T(`tl.to("#s3-q", { opacity: 1, scale: 1, rotation: 0, duration: 0.45, ease: "elastic.out(1, 0.5)" }, 11.7);`);
T(`tl.to("#s3-q", { rotation: 8, duration: 0.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, 12.15);`);
T(`tl.to("#s3-q", { opacity: 0, scale: 2.4, duration: 0.35, ease: "power2.in" }, 12.5);`);
T(`tl.to("#s3-eyebrow", { opacity: 0, duration: 0.25 }, 12.5);`);
T(`tl.to("#s3-map", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 12.6);`);
T(`tl.to("#sea", { opacity: 1, duration: 0.6 }, 12.62);`);
T(`tl.to(".coast", { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 12.62);`);
T(`tl.to(".river", { strokeDashoffset: 0, duration: 1.1, ease: "power2.out", stagger: 0.07 }, 12.7);`);
T(`tl.to("#route", { opacity: 1, duration: 0.3 }, 13.14);`);
T(`tl.fromTo("#route", { strokeDashoffset: 0 }, { strokeDashoffset: -260, duration: 3.5, ease: "none", immediateRender: false }, 13.14);`);
T(`tl.to(["#marsh1","#marsh1d"], { opacity: 1, duration: 0.5 }, 13.8);`);
T(`tl.to("#chip-rasas", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.5)" }, 13.8);`);
T(`tl.to("#rip1", { opacity: 0.9, duration: 0.05 }, 13.85);`);
T(`tl.to("#rip1", { scale: 3.2, opacity: 0, duration: 1.1, ease: "power2.out" }, 13.9);`);
T(`tl.to("#rip2", { opacity: 0.9, duration: 0.05 }, 14.2);`);
T(`tl.to("#rip2", { scale: 3.2, opacity: 0, duration: 1.1, ease: "power2.out" }, 14.25);`);
T(`tl.to(["#marsh2","#marsh2d"], { opacity: 1, duration: 0.5 }, 14.72);`);
T(`tl.to("#chip-pant", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.5)" }, 14.72);`);
T(`tl.to("#rip3", { opacity: 0.9, duration: 0.05 }, 14.75);`);
T(`tl.to("#rip3", { scale: 3.2, opacity: 0, duration: 1.1, ease: "power2.out" }, 14.8);`);
T(`tl.to("#rip4", { opacity: 0.9, duration: 0.05 }, 15.1);`);
T(`tl.to("#rip4", { scale: 3.2, opacity: 0, duration: 1.1, ease: "power2.out" }, 15.15);`);
T(`tl.to("#pin", { opacity: 1, y: 0, duration: 0.35, ease: "bounce.out" }, 15.9);`);
T(`tl.fromTo("#pin-ring", { scale: 0.5, opacity: 1, transformOrigin: "50% 50%" }, { scale: 2.5, opacity: 0, duration: 0.7, ease: "power2.out", immediateRender: false }, 16.2);`);
T(`tl.to("#d-delta", { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, 15.8);`);
T(`tl.to("#d-do", { opacity: 1, y: 0, duration: 0.25, ease: "back.out(2)" }, 16.18);`);
T(`tl.to("#d-nilo", { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2.5)" }, 16.4);`);
T(`tl.to("#s3-map", { scale: 1.12, duration: 4.0, ease: "sine.inOut" }, 12.7);`);
// Saída: rajada de vento (blur horizontal)
T(`tl.to("#cam3", { x: -400, opacity: 0, filter: "blur(14px)", duration: 0.25, ease: "power3.in" }, 16.85);`);

// ================================================================
// CENA 4 — VENTO & ÁGUA (16.8 – 24.35)
// ================================================================
let streaks = "";
for (let i = 0; i < 54; i++) {
  const strong = i >= 22;
  const y = Math.round(R(120, 1800));
  const w = Math.round(strong ? R(300, 800) : R(150, 450));
  const h = f(strong ? R(2, 6) : R(1.5, 3), 1);
  streaks += `<i class="streak ${strong ? "strong" : "soft"}" id="st-${i}" style="top:${y}px;width:${w}px;height:${h}px;opacity:${f(R(0.3, 0.85))}"></i>`;
  const dur = f(strong ? R(0.35, 0.7) : R(0.9, 1.6));
  const t0 = strong ? 18.6 : 16.9;
  const end = 20.9;
  const reps = Math.max(0, Math.floor((end - t0) / dur) - 1);
  S(`gsap.set("#st-${i}", { x: ${1100 + Math.round(R(0, 600))} });`);
  T(`tl.to("#st-${i}", { x: -900, duration: ${dur}, ease: "none", repeat: ${reps} }, ${f(t0 + R(0, dur))});`);
}
let waveLines = "";
for (let i = 0; i < 22; i++) {
  const y = 80 + i * 85;
  waveLines += `<path d="M0 ${y} Q 70 ${y - 18} 135 ${y} T 270 ${y} T 405 ${y} T 540 ${y}" stroke="rgba(186,230,253,${f(R(0.1, 0.3))})" stroke-width="3" fill="none"/>`;
}
const s4 = `
<div id="s4" class="scene clip" data-start="16.8" data-duration="7.55">
  <div class="cam" id="cam4">
    <div class="seabed" id="seabed">
      <div class="seabed-light"></div>
      <svg class="seabed-lines" viewBox="0 0 1080 1920" preserveAspectRatio="none">
        <path d="M540 700 L 260 1920 M540 700 L 820 1920 M540 700 L 420 1920 M540 700 L 660 1920" stroke="rgba(120,53,15,0.35)" stroke-width="4"/>
      </svg>
      <div class="anton center" id="s4-recuou" style="top:560px;font-size:150px;color:#1c1206;">${splitChars("RECUOU", "ch rch")}</div>
    </div>
    <div class="water left" id="water-l"><svg viewBox="0 0 540 1920" width="540" height="1920">${waveLines}</svg><div class="foam r"></div></div>
    <div class="water right" id="water-r"><svg viewBox="0 0 540 1920" width="540" height="1920">${waveLines}</svg><div class="foam l"></div></div>
    <div id="streaks">${streaks}</div>
    <div class="eyebrow" id="s4-eyebrow" style="top:330px">ALGUNS PESQUISADORES SUGEREM</div>
    <div id="s4-wind">
      <div class="anton center" id="s4-forte" style="top:470px;font-size:90px;letter-spacing:20px;color:#bae6fd;">FORTE</div>
      <div class="anton center wind-text" id="s4-vento" style="top:560px;font-size:300px;">VENTO</div>
      <div class="anton center" id="s4-oriental" style="top:880px;font-size:110px;color:#38bdf8;">← ORIENTAL</div>
    </div>
    <div class="verse" id="s4-verse">
      <div class="verse-ref">ÊXODO 14:21</div>
      <div class="verse-txt">“…por um forte vento oriental… fez retirar-se o mar”</div>
    </div>
  </div>
</div>`;
S(`gsap.set("#cam4", { opacity: 0 });`);
S(`gsap.set("#s4-eyebrow", { opacity: 0, x: 200 });`);
S(`gsap.set("#s4-forte", { opacity: 0, x: 300 });`);
S(`gsap.set("#s4-vento", { opacity: 0, x: 1200, skewX: -25 });`);
S(`gsap.set("#s4-oriental", { opacity: 0, scaleX: 1.8 });`);
S(`gsap.set(".rch", { opacity: 0, y: 40 });`);
S(`gsap.set("#s4-verse", { opacity: 0, y: 80, rotationX: 40 });`);
S(`gsap.set(".streak.strong", { opacity: 0 });`);
T(`tl.to("#cam4", { opacity: 1, duration: 0.25 }, 16.8);`);
T(`tl.to("#s4-eyebrow", { opacity: 1, x: 0, duration: 0.45, ease: "expo.out" }, 17.0);`);
T(`tl.to(".streak.strong", { opacity: 0.8, duration: 0.2 }, 18.6);`);
T(`tl.to("#s4-forte", { opacity: 1, x: 0, duration: 0.35, ease: "expo.out" }, 18.7);`);
T(`tl.to("#s4-vento", { opacity: 1, x: 0, skewX: -12, duration: 0.45, ease: "expo.out" }, 19.0);`);
T(`tl.to("#s4-vento", { skewX: -4, x: -30, duration: 1.4, ease: "sine.inOut" }, 19.45);`);
T(`tl.to("#s4-oriental", { opacity: 1, scaleX: 1, duration: 0.45, ease: "power3.out" }, 19.5);`);
T(`tl.to(["#water-l","#water-r"], { y: -14, duration: 0.25, yoyo: true, repeat: 5, ease: "sine.inOut" }, 18.7);`);
// abertura das águas em "recuado" (20.62)
T(`tl.to("#s4-eyebrow", { opacity: 0, duration: 0.2 }, 20.3);`);
T(`tl.to("#s4-wind", { y: -500, opacity: 0, duration: 0.4, ease: "power3.in" }, 20.35);`);
T(`tl.to("#water-l", { x: -470, duration: 1.3, ease: "power4.inOut" }, 20.55);`);
T(`tl.to("#water-r", { x: 470, duration: 1.3, ease: "power4.inOut" }, 20.55);`);
T(`tl.to(".streak", { opacity: 0, duration: 0.3 }, 20.7);`);
shake("#cam4", 20.62, 24, 9);
T(`tl.to(".rch", { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "back.out(2)" }, 20.95);`);
T(`tl.to("#s4-recuou", { scale: 1.15, duration: 1.6, ease: "power2.out" }, 21.0);`);
T(`tl.to(["#water-l","#water-r"], { scaleY: 1.03, duration: 0.6, yoyo: true, repeat: 3, ease: "sine.inOut" }, 21.9);`);
T(`tl.to("#s4-verse", { opacity: 1, y: 0, rotationX: 0, duration: 0.5, ease: "back.out(1.6)" }, 21.6);`);
T(`tl.to("#s4-verse .verse-ref", { scale: 1.12, color: "#fde68a", duration: 0.2, yoyo: true, repeat: 1 }, 23.52);`);
// Saída: flash branco
T(`tl.to("#cam4", { scale: 1.25, opacity: 0, duration: 0.3, ease: "power2.in" }, 24.05);`);

// ================================================================
// CENA 5 — MILAGRE & MISTÉRIO (24.2 – 32.55)
// ================================================================
let sparks = "";
for (let i = 0; i < 34; i++) {
  const x = Math.round(R(100, 980));
  const s = f(R(3, 9), 1);
  sparks += `<i class="spark" id="sp-${i}" style="left:${x}px;top:${Math.round(R(1100, 1900))}px;width:${s}px;height:${s}px"></i>`;
  S(`gsap.set("#sp-${i}", { opacity: 0 });`);
  T(`tl.to("#sp-${i}", { opacity: ${f(R(0.5, 1))}, duration: 0.3 }, ${f(25.5 + R(0, 0.8))});`);
  T(`tl.to("#sp-${i}", { y: ${-Math.round(R(600, 1200))}, x: ${Math.round(R(-60, 60))}, duration: ${f(R(2, 3))}, ease: "power1.out" }, ${f(25.5 + R(0, 0.8))});`);
}
let fog = "";
for (let i = 0; i < 6; i++) {
  fog += `<div class="fog" id="fog-${i}" style="top:${Math.round(R(300, 1400))}px;left:${Math.round(R(-400, 400))}px"></div>`;
  S(`gsap.set("#fog-${i}", { opacity: 0 });`);
  T(`tl.to("#fog-${i}", { opacity: ${f(R(0.25, 0.5))}, duration: 0.8 }, ${f(27.9 + i * 0.12)});`);
  T(`tl.to("#fog-${i}", { x: ${Math.round(R(-300, 300))}, duration: 4.4, ease: "sine.inOut" }, 27.9);`);
}
const s5 = `
<div id="s5" class="scene clip" data-start="24.2" data-duration="8.35">
  <div class="cam" id="cam5">
    <div id="s5-mir">
      <div class="rays" id="rays"></div>
      ${sparks}
      <div class="eyebrow" id="s5-eyebrow" style="top:380px">OUTROS DEFENDEM UM</div>
      <div class="center miracle" id="s5-milagre" style="top:500px">${splitChars("MILAGRE", "ch mch")}</div>
      <div class="anton center" id="s5-soberano" style="top:790px;font-size:110px;letter-spacing:34px;">SOBERANO</div>
      <div class="shock" id="shock"></div>
      <div class="anton center" id="s5-inex" style="top:960px;font-size:72px;letter-spacing:8px;color:#fde68a;">E INEXPLICÁVEL</div>
    </div>
    <div id="s5-mys">
      ${fog}
      <div class="anton center" id="s5-sem" style="top:420px;font-size:90px;letter-spacing:16px;color:#cbd5e1;">SEM</div>
      <div class="anton center" id="s5-provas" style="top:510px;font-size:230px;color:#e2e8f0;">PROVAS</div>
      <div class="strike red" id="s5-strike" style="top:640px"></div>
      <div class="stamp" id="s5-stamp">DEFINITIVAS</div>
      <div class="center mystery" id="s5-misterio" style="top:520px">MISTÉRIO</div>
      <div class="anton center" id="s5-vivo" style="top:770px;font-size:120px;color:#c4b5fd;">PERMANECE <span id="s5-vivo-w" class="vivo">VIVO</span></div>
      <div class="center counter-wrap" id="s5-counter">
        <div class="anton counter" id="s5-num">+0</div>
        <div class="anton counter-lbl">ANOS · ATRAVÉS DOS SÉCULOS</div>
      </div>
    </div>
  </div>
</div>`;
S(`gsap.set("#cam5", { opacity: 0 });`);
S(`gsap.set("#rays", { opacity: 0, scale: 0.6 });`);
S(`gsap.set("#s5-eyebrow", { opacity: 0, y: 20 });`);
S(`gsap.set(".mch", { opacity: 0, scale: 2.2, filter: "blur(18px)" });`);
S(`gsap.set("#s5-soberano", { opacity: 0, scaleX: 1.7 });`);
S(`gsap.set("#shock", { opacity: 0, scale: 0.2 });`);
S(`gsap.set("#s5-inex", { opacity: 0, filter: "blur(12px)" });`);
S(`gsap.set(["#s5-sem","#s5-provas","#s5-stamp","#s5-misterio","#s5-vivo","#s5-counter"], { opacity: 0 });`);
S(`gsap.set("#s5-strike", { scaleX: 0 });`);
S(`gsap.set("#s5-stamp", { scale: 2.6, rotation: -14 });`);
S(`gsap.set("#s5-misterio", { filter: "blur(40px)", scale: 1.3 });`);
S(`gsap.set("#s5-vivo", { y: 40 });`);
S(`gsap.set("#s5-counter", { y: 60 });`);
T(`tl.to("#flash", { opacity: 1, duration: 0.06 }, 24.2);`);
T(`tl.to("#flash", { opacity: 0, duration: 0.6, ease: "power2.out" }, 24.28);`);
T(`tl.to("#cam5", { opacity: 1, duration: 0.1 }, 24.25);`);
T(`tl.to("#s5-eyebrow", { opacity: 1, y: 0, duration: 0.4 }, 24.36);`);
T(`tl.to("#rays", { opacity: 0.85, scale: 1, duration: 1.0, ease: "power2.out" }, 25.4);`);
T(`tl.to("#rays", { rotation: 25, duration: 2.3, ease: "none" }, 25.4);`);
T(`tl.to(".mch", { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.45, ease: "expo.out", stagger: 0.04 }, 25.62);`);
T(`tl.to("#s5-soberano", { opacity: 1, scaleX: 1, duration: 0.55, ease: "expo.out" }, 26.02);`);
T(`tl.to("#shock", { opacity: 1, duration: 0.05 }, 26.9);`);
T(`tl.to("#shock", { scale: 4, opacity: 0, duration: 0.8, ease: "power2.out" }, 26.95);`);
T(`tl.to("#s5-inex", { opacity: 1, filter: "blur(0px)", duration: 0.4 }, 26.9);`);
T(`tl.to("#s5-milagre", { textShadow: "0 0 120px rgba(250,204,21,1)", scale: 1.06, duration: 0.25, yoyo: true, repeat: 1 }, 26.9);`);
shake("#cam5", 26.92, 18, 7);
T(`tl.to("#s5-mir", { opacity: 0, scale: 0.9, filter: "blur(12px)", duration: 0.35, ease: "power2.in" }, 27.5);`);
// Sem provas definitivas
T(`tl.to("#s5-sem", { opacity: 1, duration: 0.25 }, 27.82);`);
T(`tl.fromTo("#s5-provas", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", immediateRender: false }, 28.34);`);
T(`tl.to("#s5-strike", { scaleX: 1, duration: 0.3, ease: "power4.out" }, 28.85);`);
T(`tl.to("#s5-stamp", { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)" }, 28.95);`);
shake("#cam5", 29.0, 14, 5);
T(`tl.to(["#s5-sem","#s5-provas","#s5-strike","#s5-stamp"], { opacity: 0, y: -60, duration: 0.3, ease: "power2.in" }, 29.6);`);
// O mistério permanece vivo
T(`tl.to("#s5-misterio", { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.7, ease: "power2.out" }, 29.88);`);
T(`tl.to("#s5-vivo", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 30.26);`);
T(`tl.to("#s5-vivo-w", { scale: 1.25, duration: 0.12, yoyo: true, repeat: 3, ease: "power2.out" }, 30.82);`);
// Através dos séculos (contador)
T(`tl.to(["#s5-misterio","#s5-vivo"], { y: -260, scale: 0.75, opacity: 0.35, duration: 0.45, ease: "power3.inOut" }, 31.05);`);
T(`tl.to("#s5-counter", { opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)" }, 31.1);`);
T(`(function(){ const o = { v: 0 }; const el = document.getElementById("s5-num"); tl.to(o, { v: 3000, duration: 1.1, ease: "power2.out", onUpdate: () => { const n = Math.round(o.v); el.textContent = "+" + String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, "."); } }, 31.15); })();`);
T(`tl.to("#cam5", { opacity: 0, scale: 1.1, duration: 0.3, ease: "power2.in" }, 32.3);`);

// ================================================================
// CENA 6 — CTA (32.5 – 38.5)
// ================================================================
let liveBubbles = "";
const choices = ["A", "B", "A", "B", "B", "A", "A", "B"];
choices.forEach((c, i) => {
  liveBubbles += `<div class="live ${c === "A" ? "la" : "lb"}" id="lv-${i}" style="left:${Math.round(R(60, 800))}px">${c === "A" ? "A · VENTO" : "B · MILAGRE"}</div>`;
  S(`gsap.set("#lv-${i}", { opacity: 0, y: 0 });`);
  const t0 = f(34.75 + i * 0.12);
  T(`tl.to("#lv-${i}", { opacity: 1, duration: 0.15 }, ${t0});`);
  T(`tl.to("#lv-${i}", { y: ${-Math.round(R(450, 700))}, duration: 1.4, ease: "power1.out" }, ${t0});`);
  T(`tl.to("#lv-${i}", { opacity: 0, duration: 0.3 }, ${f(t0 + 0.9)});`);
});
const s6 = `
<div id="s6" class="scene clip" data-start="32.5" data-duration="6.0">
  <div class="cam" id="cam6">
    <div class="anton center" id="s6-l1" style="top:250px;font-size:116px;">QUAL EXPLICAÇÃO</div>
    <div class="anton center gold-grad" id="s6-l2" style="top:370px;font-size:130px;">VOCÊ ACREDITA?</div>
    <div class="card ca" id="card-a">
      <div class="badge">A</div>
      <svg viewBox="0 0 120 120" width="150" height="150"><g fill="none" stroke="#7dd3fc" stroke-width="9" stroke-linecap="round"><path d="M10 45 H75 a16 16 0 1 0 -16 -16"/><path d="M10 68 H95 a16 16 0 1 1 -16 16"/><path d="M10 92 H55"/></g></svg>
      <div class="card-t">VENTO<br>NATURAL</div>
    </div>
    <div class="card cb" id="card-b">
      <div class="badge">B</div>
      <svg viewBox="0 0 120 120" width="150" height="150"><g fill="#facc15"><path d="M60 8 L70 48 L110 60 L70 72 L60 112 L50 72 L10 60 L50 48 Z"/></g><circle cx="98" cy="22" r="7" fill="#fde68a"/><circle cx="22" cy="100" r="5" fill="#fde68a"/></svg>
      <div class="card-t">MILAGRE<br>SOBERANO</div>
    </div>
    <div class="vs anton" id="vs">VS</div>
    <div class="cta-row" id="cta-row">
      <div class="pill comment" id="pill-c">
        <svg viewBox="0 0 24 24" width="54" height="54"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#0b1220"/></svg>
        <span>COMENTA AÍ</span>
      </div>
      <div class="pill follow" id="pill-f">
        <span id="f-plus">+ SEGUIR</span><span id="f-ok">✓ SEGUINDO</span>
        <i class="tap" id="tap"></i>
      </div>
    </div>
    ${liveBubbles}
  </div>
</div>`;
S(`gsap.set("#cam6", { opacity: 0 });`);
S(`gsap.set("#s6-l1", { opacity: 0, y: -60 });`);
S(`gsap.set("#s6-l2", { opacity: 0, scale: 0.5 });`);
S(`gsap.set("#card-a", { x: -700, rotation: -20 });`);
S(`gsap.set("#card-b", { x: 700, rotation: 20 });`);
S(`gsap.set("#vs", { opacity: 0, scale: 3, rotation: -30 });`);
S(`gsap.set("#pill-c", { opacity: 0, y: 60, scale: 0.6 });`);
S(`gsap.set("#pill-f", { opacity: 0, y: 60, scale: 0.6 });`);
S(`gsap.set("#f-ok", { opacity: 0, y: 40 });`);
S(`gsap.set("#tap", { opacity: 0, scale: 0 });`);
T(`tl.to("#cam6", { opacity: 1, duration: 0.25 }, 32.5);`);
T(`tl.to("#s6-l1", { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)" }, 32.62);`);
T(`tl.to("#card-a", { x: 0, rotation: -5, duration: 0.55, ease: "back.out(1.5)" }, 32.94);`);
T(`tl.to("#card-b", { x: 0, rotation: 5, duration: 0.55, ease: "back.out(1.5)" }, 33.1);`);
T(`tl.to("#s6-l2", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.6)" }, 33.56);`);
T(`tl.to("#vs", { opacity: 1, scale: 1, rotation: 0, duration: 0.35, ease: "back.out(3)" }, 33.6);`);
shake("#cam6", 33.62, 12, 5);
T(`tl.to("#card-a", { y: -24, rotation: -8, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }, 33.9);`);
T(`tl.to("#card-b", { y: -24, rotation: 8, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }, 34.2);`);
T(`tl.to("#pill-c", { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(2.5)" }, 34.72);`);
T(`tl.to("#pill-c", { scale: 1.08, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut" }, 35.15);`);
T(`tl.to("#pill-f", { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(2.5)" }, 35.64);`);
T(`tl.to("#pill-f", { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 }, 36.18);`);
T(`tl.to("#tap", { opacity: 0.6, scale: 1, duration: 0.05 }, 36.18);`);
T(`tl.to("#tap", { opacity: 0, scale: 3, duration: 0.5, ease: "power2.out" }, 36.23);`);
T(`tl.to("#f-plus", { opacity: 0, y: -40, duration: 0.2 }, 36.25);`);
T(`tl.to("#f-ok", { opacity: 1, y: 0, duration: 0.25, ease: "back.out(2)" }, 36.3);`);
T(`tl.to("#pill-f", { backgroundColor: "#22c55e", duration: 0.25 }, 36.3);`);
T(`tl.to("#s6-l2", { scale: 1.05, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, 36.46);`);
T(`tl.to("#fade", { opacity: 1, duration: 0.55, ease: "power1.in" }, 37.95);`);

// ================================================================
// LEGENDAS — karaokê com pílula de destaque
// ================================================================
const KW = [
  [/VERMELHO/, "#f43f5e", "#ffffff"],
  [/YAM|SUPH|JUNCOS|HEBRAICO/, "#5eead4", "#06201d"],
  [/ÁGUAS|RASAS|PANTANOS|DELTA|NILO/, "#38bdf8", "#04131f"],
  [/VENTO|ORIENTAL|RECUADO|ÁGUA/, "#38bdf8", "#04131f"],
  [/MILAGRE|SOBERANO|INEXPLICÁVEL|BÍBLICO/, "#facc15", "#1a1300"],
  [/MISTÉRIO|SÉCULOS|VIVO|PROVAS/, "#a78bfa", "#12052e"],
  [/COMENTA|SEGUE|ACREDITA/, "#facc15", "#1a1300"],
  [/MOISÉS/, "#fde68a", "#1a1300"],
];
const kwOf = (w) => {
  const clean = w.toUpperCase().replace(/[^\p{L}]/gu, "");
  for (const [re, bg, fg] of KW) if (re.test(clean)) return { bg, fg, kw: true };
  return { bg: "#ffffff", fg: "#0a0a0a", kw: false };
};

// Agrupamento: até 4 palavras / ~20 caracteres, quebra em pontuação ou pausa longa
const chunks = [];
let cur = [];
words.forEach((w, i) => {
  cur.push(w);
  const next = words[i + 1];
  const endS = /[.?!]$/.test(w.word);
  const endC = /[,:]$/.test(w.word);
  const gap = next ? next.start - w.end : 1;
  const chars = cur.map((x) => x.word).join(" ").length;
  const nextLen = next ? next.word.length + 1 : 0;
  if (!next || endS || endC || gap > 0.4 || cur.length >= 4 || chars + nextLen > 22) {
    chunks.push(cur);
    cur = [];
  }
});
if (cur.length) chunks.push(cur);
// funde blocos de 1 palavra curta com o seguinte (se couber)
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
  const dur = f(exitT + 0.12 - start, 3);
  let inner = "";
  ch.forEach((w, k) => {
    const txt = w.word.toUpperCase();
    const { bg, fg, kw } = kwOf(w.word);
    inner += `<span class="sw" id="sw-${wi}"><i class="hl" id="hl-${wi}" style="background:${bg}"></i><b id="sb-${wi}">${txt}</b></span>`;
    S(`gsap.set("#sw-${wi}", { opacity: 0, y: 40, scale: 0.7 });`);
    S(`gsap.set("#hl-${wi}", { scaleX: 0 });`);
    const ws = f(w.start, 3);
    const nextW = ch[k + 1] ? ch[k + 1].start : w.end;
    const we = f(Math.max(ws + 0.1, Math.min(w.end, nextW)), 3);
    // bloco inteiro entra junto (palavras ainda não faladas ficam esmaecidas)
    const entryT = f(start + k * 0.03, 3);
    const entryD = f(Math.max(0.04, Math.min(0.18, ws - entryT - 0.01)), 3);
    T(`tl.to("#sw-${wi}", { opacity: 0.5, y: 0, scale: 0.94, duration: ${entryD}, ease: "back.out(2.6)" }, ${entryT});`);
    // palavra falada: acende, cresce e ganha pílula
    T(`tl.to("#sw-${wi}", { opacity: 1, scale: 1.08, rotation: ${f(R(-3, 3), 1)}, duration: 0.1, ease: "back.out(3)" }, ${ws});`);
    T(`tl.to("#hl-${wi}", { scaleX: 1, transformOrigin: "0% 50%", duration: 0.08, ease: "power3.out" }, ${ws});`);
    T(`tl.to("#sb-${wi}", { color: "${fg}", duration: 0.05 }, ${ws});`);
    T(`tl.to("#hl-${wi}", { scaleX: 0, transformOrigin: "100% 50%", duration: 0.08, ease: "power2.in" }, ${f(we - 0.04, 3)});`);
    T(`tl.to("#sb-${wi}", { color: "${kw ? bg : "#ffffff"}", duration: 0.06 }, ${f(we - 0.02, 3)});`);
    T(`tl.to("#sw-${wi}", { scale: 1, rotation: 0, duration: 0.1 }, ${we});`);
    wi++;
  });
  subsHtml += `<div class="chunk clip" id="ck-${ci}" data-start="${start}" data-duration="${dur}"><div class="chunk-in" id="cki-${ci}">${inner}</div></div>\n`;
  T(`tl.to("#cki-${ci}", { opacity: 0, y: -36, scale: 0.92, duration: 0.12, ease: "power2.in" }, ${exitT});`);
});

// ================================================================
// HTML FINAL
// ================================================================
const html = `<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>O Mar Vermelho de Moisés — v2</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@800;900&family=Playfair+Display:ital,wght@1,900&family=Frank+Ruhl+Libre:wght@900&display=block" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#02060c;color:#fff;font-family:'Montserrat',system-ui,sans-serif}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#030a14}
.bg{position:absolute;inset:0;overflow:hidden}
.blob{position:absolute;border-radius:50%;opacity:.45;filter:blur(40px)}
.tint{position:absolute;inset:0;opacity:0}
#tint-red{background:radial-gradient(circle at 50% 45%,rgba(190,18,60,.55),rgba(80,10,20,.5) 45%,transparent 80%)}
#tint-gold,#tint-gold2,#tint-gold3{background:radial-gradient(circle at 50% 35%,rgba(250,204,21,.32),rgba(120,53,15,.3) 50%,transparent 85%)}
#tint-teal{background:radial-gradient(circle at 50% 40%,rgba(20,184,166,.35),rgba(8,47,73,.4) 60%,transparent 90%)}
#tint-blue{background:linear-gradient(180deg,rgba(14,165,233,.25),rgba(3,7,18,.2))}
#tint-violet{background:radial-gradient(circle at 50% 40%,rgba(124,58,237,.38),rgba(15,10,40,.5) 60%,transparent 90%)}
.dust{position:absolute;border-radius:50%;background:#e0f2fe;box-shadow:0 0 8px #bae6fd}
.scene{position:absolute;inset:0;overflow:hidden}
.cam{position:absolute;inset:0;transform-origin:50% 45%}
.center{position:absolute;left:0;right:0;text-align:center;white-space:nowrap}
.anton{font-family:'Anton',sans-serif;line-height:1;text-transform:uppercase}
.huge{line-height:.95;text-shadow:0 12px 60px rgba(0,0,0,.6)}
.ch{display:inline-block}
.eyebrow{position:absolute;left:0;right:0;text-align:center;font-weight:900;font-size:40px;letter-spacing:14px;color:#e0f2fe;opacity:.95}
.gold-line{display:flex;align-items:center;justify-content:center;gap:24px;color:#fde68a;font-size:34px;letter-spacing:10px}
.gold-line .ln{width:110px;height:3px;background:linear-gradient(90deg,transparent,#facc15)}
.gold-line .ln:last-child{background:linear-gradient(90deg,#facc15,transparent)}
.red-text{color:#ff9aae;-webkit-text-stroke:3px rgba(60,0,10,.55);text-shadow:0 0 50px rgba(244,63,94,.85),0 10px 40px rgba(0,0,0,.7);perspective:600px}
.strike{position:absolute;left:90px;right:90px;height:22px;background:#38bdf8;border-radius:12px;transform-origin:0 50%;box-shadow:0 0 30px #38bdf8;transform:rotate(-4deg)}
.strike.red{background:#ef4444;box-shadow:0 0 30px #ef4444;left:120px;right:120px}
.qmark{position:absolute;right:20px;top:180px;font-size:520px;color:transparent;-webkit-text-stroke:10px #38bdf8;filter:drop-shadow(0 0 30px rgba(56,189,248,.7))}
.qmark2{position:absolute;left:0;right:0;text-align:center;top:420px;font-size:640px;color:#facc15;text-shadow:0 0 90px rgba(250,204,21,.6)}
.hebrew{font-family:'Frank Ruhl Libre','Times New Roman',serif;font-weight:900;font-size:300px;line-height:1.2;background:linear-gradient(180deg,#fff7c2,#facc15 45%,#b45309);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 10px 40px rgba(250,204,21,.35))}
.tl-word{display:inline-block;margin:0 20px}
.arrow-down{position:absolute;left:538px;width:4px;height:120px;background:linear-gradient(#facc15,transparent);transform-origin:50% 0}
.arrow-label{position:absolute;left:24px;top:30px;font-weight:900;font-size:30px;letter-spacing:8px;color:#fde68a;white-space:nowrap}
.juncos{line-height:1.02}
.jw{display:inline-block;font-size:130px;color:#ccfbf1;margin:0 18px}
.jw.big{font-size:230px;color:#5eead4;text-shadow:0 0 60px rgba(94,234,212,.6)}
.reeds{position:absolute;inset:0;width:1080px;height:1920px;opacity:.9}
#s3-map{position:absolute;left:0;top:140px;width:1080px;height:1100px;transform-origin:50% 35%}
.chip{position:absolute;padding:16px 30px;border-radius:999px;background:#38bdf8;color:#04131f;font-weight:900;font-size:40px;letter-spacing:2px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.chip.teal{background:#5eead4;color:#06201d}
.dw{display:inline-block;margin:0 14px}.dw.small{font-size:80px}.dw.gold{color:#facc15;text-shadow:0 0 40px rgba(250,204,21,.6)}
.streak{position:absolute;left:0;border-radius:4px;background:linear-gradient(90deg,transparent,#e0f2fe 30%,rgba(224,242,254,.0))}
.water{position:absolute;top:0;width:540px;height:1920px;background:linear-gradient(180deg,#0c4a6e,#075985 40%,#0e7490 80%,#155e75);overflow:hidden}
.water.left{left:0}.water.right{left:540px}
.water svg{position:absolute;inset:0}
.foam{position:absolute;top:0;bottom:0;width:60px}
.foam.r{right:0;background:linear-gradient(90deg,transparent,rgba(224,242,254,.75))}
.foam.l{left:0;background:linear-gradient(270deg,transparent,rgba(224,242,254,.75))}
.seabed{position:absolute;inset:0;background:linear-gradient(180deg,#fde68a 0%,#f59e0b 45%,#92400e 100%)}
.seabed-light{position:absolute;left:290px;top:-200px;width:500px;height:1300px;background:radial-gradient(ellipse at 50% 30%,rgba(255,255,255,.9),transparent 70%)}
.seabed-lines{position:absolute;inset:0;width:1080px;height:1920px}
.wind-text{color:#f0f9ff;text-shadow:40px 0 0 rgba(56,189,248,.35),80px 0 0 rgba(56,189,248,.15),0 0 60px rgba(56,189,248,.6)}
.verse{position:absolute;left:90px;right:90px;top:1000px;padding:34px 40px;border-radius:28px;background:rgba(10,15,30,.82);border:3px solid rgba(250,204,21,.6);box-shadow:0 20px 60px rgba(0,0,0,.5);transform-origin:50% 100%}
.verse-ref{display:inline-block;font-family:'Anton',sans-serif;font-size:46px;color:#facc15;letter-spacing:4px;margin-bottom:10px}
.verse-txt{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:900;font-size:40px;line-height:1.3;color:#f8fafc}
.rays{position:absolute;left:-460px;top:-1100px;width:2000px;height:2000px;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(253,230,138,.55) 0deg 6deg,transparent 6deg 18deg);-webkit-mask:radial-gradient(circle,#000 0%,transparent 62%);mask:radial-gradient(circle,#000 0%,transparent 62%)}
.spark{position:absolute;border-radius:50%;background:#fde68a;box-shadow:0 0 12px #facc15}
.miracle{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:900;font-size:175px;line-height:1.1;color:#facc15;text-shadow:0 0 50px rgba(250,204,21,.7),0 10px 30px rgba(0,0,0,.6)}
.shock{position:absolute;left:340px;top:420px;width:400px;height:400px;border-radius:50%;border:10px solid #fde68a;box-shadow:0 0 60px #facc15}
.fog{position:absolute;width:1400px;height:500px;border-radius:50%;background:radial-gradient(ellipse,rgba(196,181,253,.7),transparent 70%);filter:blur(30px)}
.stamp{position:absolute;left:250px;top:900px;padding:14px 34px;border:8px solid #ef4444;color:#ef4444;font-family:'Anton',sans-serif;font-size:76px;letter-spacing:6px;border-radius:14px}
.mystery{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:900;font-size:190px;color:#ede9fe;text-shadow:0 0 70px rgba(167,139,250,.9)}
.vivo{display:inline-block;margin-left:28px;color:#fff;text-shadow:0 0 40px #a78bfa}
.counter-wrap{top:880px}
.counter{font-size:260px;color:#fff;text-shadow:0 0 60px rgba(167,139,250,.8)}
.counter-lbl{font-size:44px;letter-spacing:8px;color:#c4b5fd;margin-top:10px}
.gold-grad{background:linear-gradient(180deg,#fff7c2,#facc15 55%,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent}
.card{position:absolute;top:580px;width:430px;height:470px;border-radius:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;box-shadow:0 30px 80px rgba(0,0,0,.55)}
.card.ca{left:60px;background:linear-gradient(160deg,#0c4a6e,#082f49);border:4px solid #38bdf8}
.card.cb{left:590px;background:linear-gradient(160deg,#713f12,#422006);border:4px solid #facc15}
.card-t{font-family:'Anton',sans-serif;font-size:66px;line-height:1.02;text-align:center}
.badge{position:absolute;top:-34px;left:50%;margin-left:-38px;width:76px;height:76px;border-radius:50%;background:#fff;color:#0a0a0a;font-family:'Anton',sans-serif;font-size:50px;display:flex;align-items:center;justify-content:center}
.vs{position:absolute;left:465px;top:740px;width:150px;height:150px;border-radius:50%;background:#f43f5e;display:flex;align-items:center;justify-content:center;font-size:72px;box-shadow:0 0 0 10px #030a14,0 0 60px rgba(244,63,94,.8)}
.cta-row{position:absolute;left:0;right:0;top:1110px;display:flex;justify-content:center;gap:30px}
.pill{position:relative;display:flex;align-items:center;gap:16px;height:110px;padding:0 44px;border-radius:999px;font-weight:900;font-size:46px;overflow:hidden}
.pill.comment{background:#facc15;color:#0b1220}
.pill.follow{background:#be123c;color:#fff;min-width:420px;justify-content:center}
#f-ok{position:absolute}
.tap{position:absolute;left:50%;top:50%;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;background:#fff}
.live{position:absolute;top:1880px;padding:12px 26px;border-radius:999px;font-weight:900;font-size:32px;box-shadow:0 8px 24px rgba(0,0,0,.4)}
.live.la{background:rgba(56,189,248,.92);color:#04131f}
.live.lb{background:rgba(250,204,21,.95);color:#1a1300}
#subs{position:absolute;left:0;right:0;top:1360px;height:300px;z-index:50}
.chunk{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.chunk-in{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px 18px;max-width:980px;padding:0 30px}
.sw{position:relative;display:inline-block;padding:4px 16px}
.sw .hl{position:absolute;inset:0;border-radius:16px;transform-origin:0 50%;box-shadow:0 8px 24px rgba(0,0,0,.45)}
.sw b{position:relative;display:block;font-family:'Montserrat',system-ui,sans-serif;font-weight:900;font-size:78px;line-height:1.08;color:#fff;letter-spacing:-1px;-webkit-text-stroke:2px rgba(0,0,0,.35);text-shadow:0 6px 20px rgba(0,0,0,.85)}
#grain{position:absolute;inset:-50px;z-index:80;opacity:.09;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
#vignette{position:absolute;inset:0;z-index:81;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,transparent 50%,rgba(0,0,0,.7) 100%)}
#flash{position:absolute;inset:0;z-index:90;background:#fff;opacity:0;pointer-events:none}
#fade{position:absolute;inset:0;z-index:95;background:#000;opacity:0;pointer-events:none}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
  ${hasNarration ? `<audio id="audio-narration" src="audio/narracao.mp3" data-start="0" data-duration="37.8" data-volume="1.0"></audio>` : ""}
  ${ambientSrc ? `<audio id="audio-ambient" src="${ambientSrc}" data-start="0" data-duration="38.5" data-volume="0.2" data-fade-in="1.0" data-fade-out="1.5"></audio>` : ""}

  <div class="bg" id="bg">
    ${blobsHtml}
    <div class="tint" id="tint-red"></div><div class="tint" id="tint-gold"></div><div class="tint" id="tint-teal"></div>
    <div class="tint" id="tint-blue"></div><div class="tint" id="tint-gold2"></div><div class="tint" id="tint-violet"></div><div class="tint" id="tint-gold3"></div>
    ${dustHtml}
  </div>
${s1}
${s2}
${s3}
${s4}
${s5}
${s6}
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
tl.to("#grain", { x: 30, y: -20, duration: 0.1, repeat: ${Math.floor(TOTAL / 0.1) - 1}, yoyo: true, ease: "steps(1)" }, 0);
${js.join("\n")}
tl.set({}, {}, ${TOTAL});
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(TPL_DIR, "index.html"), html, "utf-8");
console.log(`index.html gerado: ${chunks.length} blocos de legenda, ${wi} palavras, ${js.length} tweens.`);
