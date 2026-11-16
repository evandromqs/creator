// Quiz Mobile 14 (Hyperframes) — réplica fiel do layout Remotion sincronizada ao 14.json + narracao14.mp3 (113.109s)
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "quiz3-francisca.json"), "utf-8"));
const TOTAL = Number(data.durationInSeconds.toFixed(2));
const totalQ = data.questions.length;

const stripesHtml = Array.from({ length: 10 }, (_, i) =>
  `<div class="stripe" style="left:${i * 220 - 400}px"></div>`
).join("");

const jsLines = [];
const sets = [];

const scenesHtml = data.questions.map((q, qi) => {
  const qNum = qi + 1;
  const id = `q${qNum}`;
  const dur = Number((q.endSec - q.startSec).toFixed(2));

  const dotsHtml = data.questions
    .map((_, di) => `<span class="dot ${di < qNum ? (di === qi ? "active" : "done") : ""}"></span>`)
    .join("");

  const optsHtml = q.options
    .map((opt, oi) => `
      <div class="opt" id="${id}-opt-${oi}">
        <span class="opt-let">${["A", "B", "C"][oi]}</span>
        <span class="opt-txt">${opt}</span>
        <span class="opt-check" id="${id}-chk-${oi}">✓</span>
      </div>`)
    .join("");

  if (qi > 0) {
    sets.push(`gsap.set("#${id}", { opacity: 0, x: 60 });`);
    jsLines.push(`tl.to("#${id}", { opacity: 1, x: 0, duration: 0.28, ease: "power3.out" }, ${q.startSec});`);
  }

  // Animação de entrada da pergunta e opções
  sets.push(`gsap.set("#${id}-qbox", { opacity: 0, scale: 0.94 });`);
  jsLines.push(`tl.to("#${id}-qbox", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, ${q.startSec + 0.1});`);
  q.options.forEach((_, oi) => {
    sets.push(`gsap.set("#${id}-opt-${oi}", { opacity: 0, y: 24 });`);
    sets.push(`gsap.set("#${id}-chk-${oi}", { opacity: 0, scale: 0.4 });`);
    jsLines.push(`tl.to("#${id}-opt-${oi}", { opacity: 1, y: 0, duration: 0.28, ease: "back.out(1.8)" }, ${Number((q.startSec + 1.2 + oi * 0.35).toFixed(2))});`);
  });

  // Relógio 5 -> 4 -> 3 -> 2 -> 1 -> 0 nos timestamps exatos de countdownCuesSec + revealSec
  const cues = q.countdownCuesSec || [];
  const barStart = cues[0] || q.countdownStartSec || q.startSec + 4;
  const barDur = Number(Math.max(0.5, q.revealSec - barStart).toFixed(2));
  sets.push(`gsap.set("#${id}-bar", { scaleX: 0 });`);
  jsLines.push(`tl.to("#${id}-bar", { scaleX: 1, duration: ${barDur}, ease: "none" }, ${barStart});`);

  cues.forEach((cueT, ci) => {
    const val = 5 - ci;
    jsLines.push(`tl.set("#${id}-num", { textContent: "${val}" }, ${cueT});`);
    jsLines.push(`tl.fromTo("#${id}-clock", { scale: 1.15 }, { scale: 1, duration: 0.25, ease: "back.out(2)", immediateRender: false }, ${cueT});`);
  });

  // Revelação em revealSec (0 + verde + check)
  jsLines.push(`tl.set("#${id}-num", { textContent: "0" }, ${q.revealSec});`);
  jsLines.push(`tl.to("#${id}-clock", { backgroundColor: "#4ade80", scale: 1.12, duration: 0.2, yoyo: true, repeat: 1 }, ${q.revealSec});`);
  q.options.forEach((_, oi) => {
    const sel = `#${id}-opt-${oi}`;
    if (oi === q.correctIndex) {
      jsLines.push(`tl.to("${sel}", { backgroundColor: "#4ade80", borderColor: "#ffffff", boxShadow: "0 0 36px rgba(74,222,128,.75)", scale: 1.03, duration: 0.28, ease: "back.out(2)" }, ${q.revealSec});`);
      jsLines.push(`tl.to("#${id}-chk-${oi}", { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.5)" }, ${q.revealSec + 0.05});`);
    } else {
      jsLines.push(`tl.to("${sel}", { opacity: 0.48, duration: 0.25 }, ${q.revealSec});`);
    }
  });

  // Saída da rodada
  jsLines.push(`tl.to("#${id}", { opacity: 0, x: -60, duration: 0.25, ease: "power2.in" }, ${Number((q.endSec - 0.25).toFixed(2))});`);

  return `
  <div id="${id}" class="scene clip" data-start="${q.startSec}" data-duration="${dur}">
    <div class="header">
      <span class="h-brand">QUIZ MOBILE</span>
      <span class="h-round">RODADA ${qNum}/${totalQ}</span>
    </div>
    <div class="dots">${dotsHtml}</div>
    <div class="category">${q.category}</div>
    <div class="q-box" id="${id}-qbox">${q.question}</div>
    <div class="clock-wrap">
      <div class="clock" id="${id}-clock"><span id="${id}-num">5</span></div>
    </div>
    <div class="timer-track"><div class="timer-fill" id="${id}-bar"></div></div>
    <div class="opts">${optsHtml}</div>
    <div class="footer">@QUIZMOBILE</div>
  </div>`;
}).join("\n");

// Outro (107.01s -> 113.11s)
const outroDur = Number((TOTAL - data.outro.startSec).toFixed(2));
const outroHtml = `
  <div id="outro" class="scene outro clip" data-start="${data.outro.startSec}" data-duration="${outroDur}">
    <img class="outro-logo" src="assets/quiz_logo.png" alt="Quiz Mobile" />
    <div class="outro-title">${data.outro.title}</div>
    <div class="outro-sub">${data.outro.subtitle}</div>
    <div class="outro-cta" id="outro-cta">${data.outro.callToAction}</div>
  </div>`;
sets.push(`gsap.set("#outro", { opacity: 0, scale: 0.94 });`);
jsLines.push(`tl.to("#outro", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, ${data.outro.startSec});`);
jsLines.push(`tl.to("#outro-cta", { scale: 1.07, duration: 0.4, yoyo: true, repeat: 6, ease: "sine.inOut" }, ${data.outro.startSec + 0.5});`);

const html = `<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>Quiz Mobile 3 (Francisca + SFX) — Hyperframes</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&display=block" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;font-family:'Poppins',sans-serif;background:#3b0764}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:linear-gradient(155deg,#4c1d95 0%,#6d28d9 45%,#3b0764 100%)}
.stripes{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.stripe{position:absolute;top:-300px;width:4px;height:2600px;background:rgba(255,255,255,.06);transform:rotate(20deg)}
.scene{position:absolute;inset:0;padding:66px 70px 80px;display:flex;flex-direction:column;align-items:center}
.header{width:100%;height:106px;padding:0 36px;border-radius:26px;background:rgba(15,23,42,.72);border:3px solid #22d3ee;box-shadow:0 0 28px rgba(34,211,238,.45);display:flex;align-items:center;justify-content:space-between}
.h-brand{font-weight:900;font-size:38px;color:#ffffff;letter-spacing:1px}
.h-round{font-weight:800;font-size:34px;color:#e2e8f0}
.dots{width:100%;display:grid;grid-template-columns:repeat(6,1fr);gap:18px;margin-top:34px}
.dot{height:14px;border-radius:999px;background:rgba(255,255,255,.32)}
.dot.done{background:rgba(34,211,238,.55)}
.dot.active{background:#22d3ee;box-shadow:0 0 18px rgba(34,211,238,.9)}
.category{margin-top:54px;font-weight:900;font-size:36px;letter-spacing:3px;color:#22d3ee}
.q-box{width:100%;margin-top:30px;padding:64px 48px;border-radius:36px;background:#ffffff;border:5px solid #22d3ee;box-shadow:0 24px 60px rgba(0,0,0,.35);font-weight:900;font-size:56px;line-height:1.25;color:#0f172a;text-align:center;min-height:290px;display:flex;align-items:center;justify-content:center}
.clock-wrap{margin-top:64px;display:flex;justify-content:center}
.clock{width:170px;height:170px;border-radius:50%;background:#fde047;border:8px solid #ffffff;box-shadow:0 0 40px rgba(253,224,71,.7);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:82px;color:#0f172a}
.timer-track{width:94%;height:16px;border-radius:999px;background:rgba(255,255,255,.28);overflow:hidden;margin-top:56px}
.timer-fill{width:100%;height:100%;background:#22d3ee;transform-origin:0 50%}
.opts{width:100%;margin-top:56px;display:flex;flex-direction:column;gap:26px}
.opt{position:relative;width:100%;padding:28px 32px;border-radius:28px;background:#ffffff;border:4px solid #0f172a;box-shadow:0 12px 30px rgba(0,0,0,.28);display:flex;align-items:center;gap:28px}
.opt-let{width:76px;height:76px;border-radius:20px;background:#0f172a;color:#ffffff;font-weight:900;font-size:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.opt-txt{font-weight:800;font-size:44px;color:#0f172a;flex:1}
.opt-check{font-weight:900;font-size:44px;color:#0f172a;margin-right:10px}
.footer{margin-top:auto;font-weight:900;font-size:32px;letter-spacing:2px;color:#ffffff}
.outro{justify-content:center;text-align:center;gap:34px}
.outro-logo{width:210px;height:210px;border-radius:50%;box-shadow:0 16px 40px rgba(0,0,0,.4)}
.outro-title{font-weight:900;font-size:74px;color:#ffffff;text-shadow:0 8px 0 #1e1b4b}
.outro-sub{font-weight:700;font-size:44px;color:#f8fafc}
.outro-cta{margin-top:16px;padding:34px 66px;border-radius:28px;background:#fde047;color:#0f172a;font-weight:900;font-size:42px;box-shadow:0 14px 36px rgba(0,0,0,.3)}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
  <audio id="audio-narration" src="assets/quiz3-mix.mp3" data-start="0" data-duration="${TOTAL}" data-volume="1.0"></audio>
  <div class="stripes" data-layout-allow-overflow>${stripesHtml}</div>
${scenesHtml}
${outroHtml}
</div>
<script>
${sets.join("\n")}
const tl = gsap.timeline({ paused: true });
${jsLines.join("\n")}
tl.set({}, {}, ${TOTAL});
window.__timelines = { main: tl };
</script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, "index.html"), html, "utf-8");
console.log(`quiz14 index.html gerado: ${totalQ} rodadas + outro (${TOTAL}s)!`);
