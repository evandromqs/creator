// Root Builder do estúdio de vídeos Creator
// Suporta a geração de index.html para diferentes templates:
// Uso: node scripts/build.cjs [--template=quiz-mobile|kinetic-shorts|tech-viral|story-loop|commercial-ad]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v === undefined ? true : v];
  })
);

const template = String(args.template || "quiz-mobile").toLowerCase();

if (template === "kinetic-shorts") {
  const tplDir = path.join(ROOT, "templates", "kinetic-shorts");
  console.log("Compilando template Kinetic Shorts...");
  execFileSync(process.execPath, [path.join(tplDir, "build.cjs")], { cwd: tplDir, stdio: "inherit" });
  fs.copyFileSync(path.join(tplDir, "index.html"), path.join(ROOT, "index.html"));
  console.log("index.html atualizado na raiz a partir de kinetic-shorts.");
  process.exit(0);
}

if (template === "story-loop") {
  const tplDir = path.join(ROOT, "templates", "story-loop");
  console.log("Compilando template Story Loop...");
  execFileSync(process.execPath, [path.join(tplDir, "build.cjs")], { cwd: tplDir, stdio: "inherit" });
  fs.copyFileSync(path.join(tplDir, "index.html"), path.join(ROOT, "index.html"));
  console.log("index.html atualizado na raiz a partir de story-loop.");
  process.exit(0);
}

if (template === "tech-viral") {
  const tplDir = path.join(ROOT, "templates", "tech-viral");
  console.log("Compilando template Tech Viral...");
  execFileSync(process.execPath, [path.join(tplDir, "build.cjs")], { cwd: tplDir, stdio: "inherit" });
  fs.copyFileSync(path.join(tplDir, "index.html"), path.join(ROOT, "index.html"));
  console.log("index.html atualizado na raiz a partir de tech-viral.");
  process.exit(0);
}

if (template === "commercial-ad") {
  const tplDir = path.join(ROOT, "templates", "commercial-ad");
  console.log("Compilando template Commercial Ad...");
  execFileSync(process.execPath, [path.join(tplDir, "build.cjs")], { cwd: tplDir, stdio: "inherit" });
  fs.copyFileSync(path.join(tplDir, "index.html"), path.join(ROOT, "index.html"));
  console.log("index.html atualizado na raiz a partir de commercial-ad.");
  process.exit(0);
}

// Default: Quiz Mobile (Francisca 0.9x + SFX tick + trim_alarm)
console.log("Compilando template padrão: Quiz Mobile...");
const timingsFile = fs.existsSync(path.join(ROOT, "transcript", "quiz-timings.json"))
  ? path.join(ROOT, "transcript", "quiz-timings.json")
  : path.join(ROOT, "templates", "quiz-mobile", "quiz3-francisca.json");

const data = JSON.parse(fs.readFileSync(timingsFile, "utf-8"));
const TOTAL = Number((data.durationInSeconds || data.totalDuration || 108.77).toFixed(2));
const questions = data.questions || data.rounds;
const totalQ = questions.length;

const stripesHtml = Array.from({ length: 10 }, (_, i) =>
  `<div class="stripe" style="left:${i * 220 - 400}px"></div>`
).join("");

const jsLines = [];
const sets = [];

const scenesHtml = questions.map((q, qi) => {
  const qNum = qi + 1;
  const id = `q${qNum}`;
  const startSec = q.startSec !== undefined ? q.startSec : q.start;
  const endSec = q.endSec !== undefined ? q.endSec : q.end;
  const dur = Number((endSec - startSec).toFixed(2));
  const category = q.category || "GEOGRAFIA";
  const questionText = q.question;
  const options = q.options;
  const cues = q.countdownCuesSec || q.cues || [];
  const revealSec = q.revealSec !== undefined ? q.revealSec : q.reveal;
  const correctIndex = q.correctIndex !== undefined ? q.correctIndex : options.findIndex((o) => o === q.answer);

  const dotsHtml = questions
    .map((_, di) => `<span class="dot ${di < qNum ? (di === qi ? "active" : "done") : ""}"></span>`)
    .join("");

  const optsHtml = options
    .map((opt, oi) => `
      <div class="opt" id="${id}-opt-${oi}">
        <span class="opt-let">${["A", "B", "C"][oi]}</span>
        <span class="opt-txt">${opt}</span>
        <span class="opt-check" id="${id}-chk-${oi}">✓</span>
      </div>`)
    .join("");

  if (qi > 0) {
    sets.push(`gsap.set("#${id}", { opacity: 0, x: 60 });`);
    jsLines.push(`tl.to("#${id}", { opacity: 1, x: 0, duration: 0.28, ease: "power3.out" }, ${startSec});`);
  }

  // Entrada pergunta e opções
  sets.push(`gsap.set("#${id}-qbox", { opacity: 0, scale: 0.94 });`);
  jsLines.push(`tl.to("#${id}-qbox", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }, ${startSec + 0.1});`);
  options.forEach((_, oi) => {
    sets.push(`gsap.set("#${id}-opt-${oi}", { opacity: 0, y: 24 });`);
    sets.push(`gsap.set("#${id}-chk-${oi}", { opacity: 0, scale: 0.4 });`);
    jsLines.push(`tl.to("#${id}-opt-${oi}", { opacity: 1, y: 0, duration: 0.28, ease: "back.out(1.8)" }, ${Number((startSec + 1.2 + oi * 0.35).toFixed(2))});`);
  });

  // Relógio 5 -> 4 -> 3 -> 2 -> 1 -> 0
  const barStart = cues[0] || startSec + 4;
  const barDur = Number(Math.max(0.5, revealSec - barStart).toFixed(2));
  sets.push(`gsap.set("#${id}-bar", { scaleX: 0 });`);
  jsLines.push(`tl.to("#${id}-bar", { scaleX: 1, duration: ${barDur}, ease: "none" }, ${barStart});`);

  cues.forEach((cueT, ci) => {
    const val = 5 - ci;
    jsLines.push(`tl.set("#${id}-num", { textContent: "${val}" }, ${cueT});`);
    jsLines.push(`tl.fromTo("#${id}-clock", { scale: 1.15 }, { scale: 1, duration: 0.25, ease: "back.out(2)", immediateRender: false }, ${cueT});`);
  });

  // Revelação em revealSec (0 + verde + check)
  jsLines.push(`tl.set("#${id}-num", { textContent: "0" }, ${revealSec});`);
  jsLines.push(`tl.to("#${id}-clock", { backgroundColor: "#4ade80", scale: 1.12, duration: 0.2, yoyo: true, repeat: 1 }, ${revealSec});`);
  options.forEach((_, oi) => {
    const sel = `#${id}-opt-${oi}`;
    if (oi === correctIndex) {
      jsLines.push(`tl.to("${sel}", { backgroundColor: "#4ade80", borderColor: "#ffffff", boxShadow: "0 0 36px rgba(74,222,128,.75)", scale: 1.03, duration: 0.28, ease: "back.out(2)" }, ${revealSec});`);
      jsLines.push(`tl.to("#${id}-chk-${oi}", { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.5)" }, ${revealSec + 0.05});`);
    } else {
      jsLines.push(`tl.to("${sel}", { opacity: 0.48, duration: 0.25 }, ${revealSec});`);
    }
  });

  // Saída da rodada
  jsLines.push(`tl.to("#${id}", { opacity: 0, x: -60, duration: 0.25, ease: "power2.in" }, ${Number((endSec - 0.25).toFixed(2))});`);

  return `
  <div id="${id}" class="scene clip" data-start="${startSec}" data-duration="${dur}">
    <div class="header">
      <span class="h-brand">QUIZ MOBILE</span>
      <span class="h-round">RODADA ${qNum}/${totalQ}</span>
    </div>
    <div class="dots">${dotsHtml}</div>
    <div class="category">${category}</div>
    <div class="q-box" id="${id}-qbox">${questionText}</div>
    <div class="clock-wrap">
      <div class="clock" id="${id}-clock"><span id="${id}-num">5</span></div>
    </div>
    <div class="timer-track"><div class="timer-fill" id="${id}-bar"></div></div>
    <div class="opts">${optsHtml}</div>
    <div class="footer">@QUIZMOBILE</div>
  </div>`;
}).join("\n");

// Outro
const outroStart = data.outro?.startSec !== undefined ? data.outro.startSec : (data.outroStart || 100.81);
const outroDur = Number((TOTAL - outroStart).toFixed(2));
const outroTitle = data.outro?.title || "DESAFIO CONCLUÍDO!";
const outroSub = data.outro?.subtitle || "QUANTAS VOCÊ ACERTOU?";
const outroCta = data.outro?.callToAction || "COMENTE SUA PONTUAÇÃO!";

const outroHtml = `
  <div id="outro" class="scene outro clip" data-start="${outroStart}" data-duration="${outroDur}">
    <img class="outro-logo" src="assets/sfx/quiz_logo.png" alt="Quiz Mobile" />
    <div class="outro-title">${outroTitle}</div>
    <div class="outro-sub">${outroSub}</div>
    <div class="outro-cta" id="outro-cta">${outroCta}</div>
  </div>`;

sets.push(`gsap.set("#outro", { opacity: 0, scale: 0.94 });`);
jsLines.push(`tl.to("#outro", { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, ${outroStart});`);
jsLines.push(`tl.to("#outro-cta", { scale: 1.07, duration: 0.4, yoyo: true, repeat: 6, ease: "sine.inOut" }, ${outroStart + 0.5});`);

const audioSrc = fs.existsSync(path.join(ROOT, "audio", "quiz-mix.mp3"))
  ? "audio/quiz-mix.mp3"
  : "audio/video3-francisca-pausado.mp3";

const html = `<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>Quiz Mobile — Hyperframes Studio</title>
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
  <audio id="audio-narration" src="${audioSrc}" data-start="0" data-duration="${TOTAL}" data-volume="1.0"></audio>
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
console.log(`✅ index.html gerado com sucesso: ${totalQ} rodadas + outro (${TOTAL}s)!`);
