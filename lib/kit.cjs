// Reusable Hyperframes Kinetic Shorts Engine (1080x1920, 30fps, GSAP 3.15.0)
// Provides: PRNG, text splitters, camera shake, atmospheric background, karaoke pill subtitles, and HTML shell.

function createRng(seed = 1337) {
  let s = seed | 0;
  const rnd = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const range = (a, b) => a + rnd() * (b - a);
  const fix = (n, d = 2) => Number(n.toFixed(d));
  return { rnd, range, fix };
}

function createTimelineCollector() {
  const js = [];
  const sets = [];
  return {
    js,
    sets,
    T: (line) => js.push(line),
    S: (line) => sets.push(line),
  };
}

function splitChars(txt, cls = "ch") {
  return [...txt]
    .map((c) => (c === " " ? `<span class="${cls} sp">&nbsp;</span>` : `<span class="${cls}">${c}</span>`))
    .join("");
}

function addShake(T, rng, target, t, amp = 18, steps = 7) {
  let tt = t;
  for (let i = 0; i < steps; i++) {
    const k = 1 - i / steps;
    const x = rng.fix(rng.range(-amp, amp) * k);
    const y = rng.fix(rng.range(-amp, amp) * k);
    const rot = rng.fix(rng.range(-0.8, 0.8) * k);
    T(`tl.to("${target}", { x: ${x}, y: ${y}, rotation: ${rot}, duration: 0.04, ease: "none" }, ${rng.fix(tt, 3)});`);
    tt += 0.04;
  }
  T(`tl.to("${target}", { x: 0, y: 0, rotation: 0, duration: 0.06, ease: "power2.out" }, ${rng.fix(tt, 3)});`);
}

function buildAtmosphere({ T, rng, totalDuration, blobColors, tints = [], dustCount = 44 }) {
  const colors = blobColors || ["#0ea5e9", "#1d4ed8", "#06b6d4", "#7c3aed", "#0f766e"];
  let blobsHtml = "";
  colors.forEach((c, i) => {
    const size = Math.round(rng.range(700, 1100));
    const x = Math.round(rng.range(-300, 700));
    const y = Math.round(rng.range(-200, 1500));
    blobsHtml += `<div class="blob" id="blob-${i}" style="width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:radial-gradient(circle, ${c} 0%, transparent 65%);"></div>`;
    const dur = rng.fix(rng.range(5, 8));
    const reps = Math.floor(totalDuration / dur);
    T(`tl.to("#blob-${i}", { x: ${Math.round(rng.range(-260, 260))}, y: ${Math.round(rng.range(-300, 300))}, scale: ${rng.fix(rng.range(0.8, 1.3))}, duration: ${dur}, ease: "sine.inOut", yoyo: true, repeat: ${reps} }, 0);`);
  });

  let dustHtml = "";
  for (let i = 0; i < dustCount; i++) {
    const s = rng.fix(rng.range(2, 6), 1);
    const x = Math.round(rng.range(0, 1080));
    const y = Math.round(rng.range(0, 1920));
    dustHtml += `<i class="dust" id="dust-${i}" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;opacity:${rng.fix(rng.range(0.15, 0.6))}"></i>`;
    T(`tl.to("#dust-${i}", { y: ${-Math.round(rng.range(250, 700))}, x: ${Math.round(rng.range(-80, 80))}, duration: ${totalDuration}, ease: "none" }, 0);`);
  }

  let tintsHtml = "";
  tints.forEach(([id, start, end, gradient]) => {
    tintsHtml += `<div class="tint" id="${id}" style="background:${gradient}"></div>`;
    T(`tl.to("#${id}", { opacity: 1, duration: 0.5, ease: "power2.out" }, ${start});`);
    T(`tl.to("#${id}", { opacity: 0, duration: 0.5, ease: "power2.in" }, ${rng.fix(end)});`);
  });

  return `${blobsHtml}\n${tintsHtml}\n${dustHtml}`;
}

function buildSubtitles({ words, totalDuration, keywordRules = [], S, T, rng }) {
  const kwOf = (w) => {
    const clean = w.toUpperCase().replace(/[^\p{L}]/gu, "");
    for (const [re, bg, fg] of keywordRules) {
      if (re.test(clean)) return { bg, fg, kw: true };
    }
    return { bg: "#ffffff", fg: "#0a0a0a", kw: false };
  };

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

  // Merge single short orphan words with the following chunk when safe
  for (let i = 0; i < chunks.length - 1; i++) {
    const a = chunks[i];
    const b = chunks[i + 1];
    const endsHard = /[.?!]$/.test(a[a.length - 1].word);
    if (a.length === 1 && !endsHard && a[0].word.length <= 4 && b.length < 4) {
      chunks.splice(i, 2, a.concat(b));
      i--;
    }
  }

  let subsHtml = "";
  let wi = 0;
  chunks.forEach((ch, ci) => {
    const start = rng.fix(Math.max(0, ch[0].start - 0.08), 3);
    const nextStart = chunks[ci + 1] ? chunks[ci + 1][0].start : totalDuration;
    const exitT = rng.fix(Math.min(ch[ch.length - 1].end + 0.45, nextStart - 0.1), 3);
    const dur = rng.fix(exitT + 0.12 - start, 3);
    let inner = "";

    ch.forEach((w, k) => {
      const txt = w.word.toUpperCase();
      const { bg, fg, kw } = kwOf(w.word);
      inner += `<span class="sw" id="sw-${wi}"><i class="hl" id="hl-${wi}" style="background:${bg}"></i><b id="sb-${wi}">${txt}</b></span>`;
      S(`gsap.set("#sw-${wi}", { opacity: 0, y: 40, scale: 0.7 });`);
      S(`gsap.set("#hl-${wi}", { scaleX: 0 });`);

      const ws = rng.fix(w.start, 3);
      const nextW = ch[k + 1] ? ch[k + 1].start : w.end;
      const we = rng.fix(Math.max(ws + 0.1, Math.min(w.end, nextW)), 3);
      const entryT = rng.fix(start + k * 0.03, 3);
      const entryD = rng.fix(Math.max(0.04, Math.min(0.18, ws - entryT - 0.01)), 3);

      T(`tl.to("#sw-${wi}", { opacity: 0.5, y: 0, scale: 0.94, duration: ${entryD}, ease: "back.out(2.6)" }, ${entryT});`);
      T(`tl.to("#sw-${wi}", { opacity: 1, scale: 1.08, rotation: ${rng.fix(rng.range(-3, 3), 1)}, duration: 0.1, ease: "back.out(3)" }, ${ws});`);
      T(`tl.to("#hl-${wi}", { scaleX: 1, transformOrigin: "0% 50%", duration: 0.08, ease: "power3.out" }, ${ws});`);
      T(`tl.to("#sb-${wi}", { color: "${fg}", duration: 0.05 }, ${ws});`);
      T(`tl.to("#hl-${wi}", { scaleX: 0, transformOrigin: "100% 50%", duration: 0.08, ease: "power2.in" }, ${rng.fix(we - 0.04, 3)});`);
      T(`tl.to("#sb-${wi}", { color: "${kw ? bg : "#ffffff"}", duration: 0.06 }, ${rng.fix(we - 0.02, 3)});`);
      T(`tl.to("#sw-${wi}", { scale: 1, rotation: 0, duration: 0.1 }, ${we});`);
      wi++;
    });

    subsHtml += `<div class="chunk clip" id="ck-${ci}" data-start="${start}" data-duration="${dur}"><div class="chunk-in" id="cki-${ci}">${inner}</div></div>\n`;
    T(`tl.to("#cki-${ci}", { opacity: 0, y: -36, scale: 0.92, duration: 0.12, ease: "power2.in" }, ${exitT});`);
  });

  return { subsHtml, chunkCount: chunks.length, wordCount: wi };
}

const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#02060c;color:#fff;font-family:'Montserrat',system-ui,sans-serif}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#030a14}
.bg{position:absolute;inset:0;overflow:hidden}
.blob{position:absolute;border-radius:50%;opacity:.45;filter:blur(40px)}
.tint{position:absolute;inset:0;opacity:0}
.dust{position:absolute;border-radius:50%;background:#e0f2fe;box-shadow:0 0 8px #bae6fd}
.scene{position:absolute;inset:0;overflow:hidden}
.cam{position:absolute;inset:0;transform-origin:50% 45%}
.center{position:absolute;left:0;right:0;text-align:center;white-space:nowrap}
.anton{font-family:'Anton',sans-serif;line-height:1;text-transform:uppercase}
.huge{line-height:.95;text-shadow:0 12px 60px rgba(0,0,0,.6)}
.ch{display:inline-block}
.eyebrow{position:absolute;left:0;right:0;text-align:center;font-weight:900;font-size:40px;letter-spacing:14px;color:#e0f2fe;opacity:.95}
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
`;

function renderHtml({
  title,
  totalDuration,
  narrationDuration,
  narrationSrc = "audio/narracao.mp3",
  ambientSrc = "audio/ambient.mp3",
  extraCss = "",
  bgHtml,
  scenesHtml,
  subsHtml,
  sets,
  js,
}) {
  const ambientTag = ambientSrc
    ? `<audio id="audio-ambient" src="${ambientSrc}" data-start="0" data-duration="${totalDuration}" data-volume="0.2" data-fade-in="1.0" data-fade-out="1.5"></audio>`
    : "";

  return `<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@800;900&family=Playfair+Display:ital,wght@1,900&family=Frank+Ruhl+Libre:wght@900&display=block" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
${BASE_CSS}
${extraCss}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${totalDuration}" data-width="1080" data-height="1920">
  <audio id="audio-narration" src="${narrationSrc}" data-start="0" data-duration="${narrationDuration}" data-volume="1.0"></audio>
  ${ambientTag}
  <div class="bg" id="bg">
    ${bgHtml}
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
tl.to("#grain", { x: 30, y: -20, duration: 0.1, repeat: ${Math.floor(totalDuration / 0.1) - 1}, yoyo: true, ease: "steps(1)" }, 0);
${js.join("\n")}
tl.set({}, {}, ${totalDuration});
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
</script>
</body>
</html>
`;
}

module.exports = {
  createRng,
  createTimelineCollector,
  splitChars,
  addShake,
  buildAtmosphere,
  buildSubtitles,
  renderHtml,
};
