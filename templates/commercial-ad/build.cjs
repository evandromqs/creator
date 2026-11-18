// Caneto Ad (Hyperframes) — alinhado ao áudio real caneto_audio_2.mp3 (18.91s)
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const adJsonPath = path.join(ROOT, "ad.json");
const customAd = fs.existsSync(adJsonPath) ? JSON.parse(fs.readFileSync(adJsonPath, "utf-8")) : {};
const tag = customAd.tag || "PRODUTIVIDADE REAL";
const headline = customAd.headline || "CHEGA DE";
const highlight = customAd.highlight || "DESPERDIÇAR";
const headlineEnd = customAd.headlineEnd !== undefined ? customAd.headlineEnd : "TEMPO";
const sub = customAd.sub || "Conheça o Caneto e organize tudo em segundos.";
const cards = Array.isArray(customAd.cards) && customAd.cards.length >= 3
  ? customAd.cards
  : [
      "✓ Tarefas e rotina em um só painel",
      "✓ Lembretes automáticos inteligentes",
      "✓ Mais foco, menos estresse diário",
    ];
const ctaTitle = customAd.ctaTitle || "COMECE";
const ctaHighlight = customAd.ctaHighlight || "AGORA";
const ctaButton = customAd.ctaButton || "TESTAR GRÁTIS";
const narrationSrc = fs.existsSync(path.join(PROJECT_ROOT, "audio", "narracao.mp3"))
  ? "audio/narracao.mp3"
  : "templates/commercial-ad/assets/narracao.mp3";
const TOTAL = 19.0;

const html = `<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>Caneto Ad — Alinhado (19.0s)</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=block" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;font-family:'Inter',sans-serif;background:#fffbeb}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:linear-gradient(180deg,#fffbeb 0%,#fef3c7 100%);color:#111827}
.scene{position:absolute;inset:0;padding:180px 80px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.tag{padding:14px 34px;border-radius:999px;background:#ffedd5;color:#c2410c;font-weight:800;font-size:34px;margin-bottom:40px}
h1{font-weight:900;font-size:128px;line-height:1.02;color:#111827;letter-spacing:-3px}
.accent{color:#ea580c}
.sub{margin-top:36px;font-weight:700;font-size:48px;color:#4b5563;line-height:1.35}
.cards{width:100%;display:flex;flex-direction:column;gap:30px;margin-top:40px}
.card{padding:40px;border-radius:28px;background:#ffffff;border:3px solid #fed7aa;font-weight:800;font-size:46px;color:#111827;box-shadow:0 16px 40px rgba(234,88,12,.12);text-align:left}
.btn{margin-top:70px;padding:36px 80px;border-radius:999px;background:#ea580c;color:#ffffff;font-weight:900;font-size:56px;box-shadow:0 20px 50px rgba(234,88,12,.35)}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
  <audio id="audio-narration" src="${narrationSrc}" data-start="0" data-duration="18.91" data-volume="1.0"></audio>
  <div id="s1" class="scene clip" data-start="0" data-duration="5.2">
    <div class="tag">${tag}</div>
    <h1>${headline} <span class="accent">${highlight}</span> ${headlineEnd}</h1>
    <div class="sub" id="s1-sub">${sub}</div>
  </div>
  <div id="s2" class="scene clip" data-start="5.2" data-duration="8.3">
    <div class="tag">POR QUE USAR?</div>
    <div class="cards">
      <div class="card" id="c1">${cards[0]}</div>
      <div class="card" id="c2">${cards[1]}</div>
      <div class="card" id="c3">${cards[2]}</div>
    </div>
  </div>
  <div id="s3" class="scene clip" data-start="13.5" data-duration="5.5">
    <h1>${ctaTitle} <span class="accent">${ctaHighlight}</span></h1>
    <div class="btn" id="btn">${ctaButton}</div>
  </div>
</div>
<script>
const tl = gsap.timeline({ paused: true });
gsap.set("#s1-sub", { opacity: 0, y: 25 });
tl.to("#s1-sub", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.8);
tl.to("#s1", { opacity: 0, y: -30, duration: 0.3 }, 4.9);
gsap.set("#s2", { opacity: 0 });
tl.to("#s2", { opacity: 1, duration: 0.3 }, 5.2);
["#c1", "#c2", "#c3"].forEach((c, i) => {
  gsap.set(c, { opacity: 0, x: -60 });
  tl.to(c, { opacity: 1, x: 0, duration: 0.35, ease: "back.out(1.7)" }, 5.6 + i * 0.9);
});
tl.to("#s2", { opacity: 0, duration: 0.3 }, 13.2);
gsap.set("#s3", { opacity: 0, scale: 0.92 });
tl.to("#s3", { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.8)" }, 13.5);
tl.to("#btn", { scale: 1.07, duration: 0.35, yoyo: true, repeat: 5, ease: "sine.inOut" }, 14.1);
tl.set({}, {}, ${TOTAL});
window.__timelines = { main: tl };
</script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, "index.html"), html, "utf-8");
console.log("caneto-ad/index.html alinhado (19.0s) gerado!");
