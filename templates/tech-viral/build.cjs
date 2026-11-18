#!/usr/bin/env node
/**
 * build.cjs — Hyperframes Motion Design
 * Projeto: A História Secreta do Wi-Fi
 *
 * Gera:
 *   - index.html (player + timeline GSAP)
 *   - assets/scenes.svg (SVGs inline por cena)
 *   - data/timing.json (palavras sincronizadas por cena)
 *
 * Filosofia:
 *   1. Nada de slide isolado — câmera navega num mundo infinito.
 *   2. Match cuts entre cenas (ondas→frequência, teclas→blocos, cofre→buraco negro).
 *   3. Tipografia cinética mascarada (sem caixinha de legenda).
 *   4. Paleta por era (1941 sépia → 1992 cósmico → moderna ciano).
 *   5. Camera shake em impactos + grain/vinheta overlay.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 0. Carregar dados
// ---------------------------------------------------------------------------
const script = JSON.parse(fs.readFileSync(path.join(__dirname, 'script.json'), 'utf8'));
const alignment = JSON.parse(fs.readFileSync(path.join(__dirname, 'alignment.json'), 'utf8'));

const OUT_DIR = path.join(__dirname, 'dist');
const ASSETS_DIR = path.join(OUT_DIR, 'assets');
const DATA_DIR = path.join(OUT_DIR, 'data');
[OUT_DIR, ASSETS_DIR, DATA_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ---------------------------------------------------------------------------
// 1. Reconstruir palavras com timestamps a partir do alignment
// ---------------------------------------------------------------------------
function buildWordTimings(alignment, fullText) {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  const words = [];
  let current = { text: '', start: null, end: null };

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    const st = character_start_times_seconds[i];
    const en = character_end_times_seconds[i];

    if (ch === ' ') {
      if (current.text.trim()) {
        current.end = en;
        words.push({ ...current, text: current.text.trim() });
      }
      current = { text: '', start: null, end: null };
    } else {
      if (current.start === null) current.start = st;
      current.text += ch;
      current.end = en;
    }
  }
  if (current.text.trim()) {
    words.push({ ...current, text: current.text.trim() });
  }
  return words;
}

const words = buildWordTimings(alignment, script.fullText);

// ---------------------------------------------------------------------------
// 2. Mapear cada cena para seu intervalo de tempo (por proporção de texto)
// ---------------------------------------------------------------------------
function buildSceneTimings(scenes, words) {
  const totalChars = scenes.reduce((acc, s) => acc + s.text.length, 0);
  const totalDuration = words.length ? words[words.length - 1].end : 60;

  let cursor = 0;
  return scenes.map((scene, i) => {
    const ratio = scene.text.length / totalChars;
    const dur = totalDuration * ratio;
    const start = cursor;
    const end = i === scenes.length - 1 ? totalDuration : cursor + dur;
    cursor = end;

    // palavras dentro da cena
    const sceneWords = words.filter(w => w.start >= start - 0.05 && w.start < end - 0.01);
    return { ...scene, start, end, words: sceneWords };
  });
}

const sceneTimings = buildSceneTimings(script.scenes, words);

// ---------------------------------------------------------------------------
// 3. Paleta por era
// ---------------------------------------------------------------------------
const PALETTES = {
  war1941: {
    bg0: '#1a1608', bg1: '#2b2410', accent: '#c9a227',
    alert: '#b3261e', ink: '#e8dcc0', paper: '#3a3018',
  },
  space1992: {
    bg0: '#04030a', bg1: '#0d0620', accent: '#8b5cf6',
    alert: '#f0abfc', ink: '#d8d0f0', paper: '#1a1030',
  },
  modern: {
    bg0: '#02060a', bg1: '#04141c', accent: '#22d3ee',
    alert: '#ffffff', ink: '#e8fbff', paper: '#0a2030',
  },
};

function paletteForScene(id) {
  if (/S0[2-6]/.test(id)) return 'war1941';
  if (/S0[7-9]/.test(id)) return 'space1992';
  return 'modern';
}

// ---------------------------------------------------------------------------
// 4. Definição de cada cena como SVG (ilustração + texto)
// ---------------------------------------------------------------------------
function sceneSVG(scene, idx) {
  const pal = PALETTES[paletteForScene(scene.id)];
  const w = 1920, h = 1080;
  const cx = w / 2, cy = h / 2;

  // bloco de ilustração por cena
  let art = '';
  const id = scene.id;

  if (id.startsWith('S01')) {
    art = `
      <g id="wifi-arcs" stroke="${pal.accent}" fill="none" stroke-width="8" stroke-linecap="round">
        <path d="M ${cx - 260} ${cy - 40} A 260 260 0 0 1 ${cx + 260} ${cy - 40}" />
        <path d="M ${cx - 180} ${cy + 40} A 180 180 0 0 1 ${cx + 180} ${cy + 40}" />
        <path d="M ${cx - 100} ${cy + 120} A 100 100 0 0 1 ${cx + 100} ${cy + 120}" />
        <circle cx="${cx}" cy="${cy + 180}" r="14" fill="${pal.accent}" />
      </g>
      <g id="top-secret" opacity="0">
        <rect x="${cx - 220}" y="${cy - 320}" width="440" height="120" rx="8"
              fill="none" stroke="${pal.alert}" stroke-width="6" stroke-dasharray="16 10"/>
        <text x="${cx}" y="${cy - 235}" text-anchor="middle" font-family="monospace"
              font-size="64" fill="${pal.alert}" letter-spacing="8">TOP SECRET</text>
      </g>
      <g id="magnifier" opacity="0.9">
        <circle cx="${cx + 300}" cy="${cy - 100}" r="90" fill="none" stroke="${pal.ink}" stroke-width="10"/>
        <line x1="${cx + 360}" y1="${cy - 40}" x2="${cx + 440}" y2="${cy + 40}" stroke="${pal.ink}" stroke-width="12" stroke-linecap="round"/>
      </g>
    `;
  } else if (id.startsWith('S02')) {
    art = `
      <g id="radio-tower">
        <rect x="${cx - 20}" y="${cy - 200}" width="40" height="400" fill="${pal.ink}"/>
        <line x1="${cx}" y1="${cy - 200}" x2="${cx - 120}" y2="${cy + 200}" stroke="${pal.ink}" stroke-width="8"/>
        <line x1="${cx}" y1="${cy - 200}" x2="${cx + 120}" y2="${cy + 200}" stroke="${pal.ink}" stroke-width="8"/>
        <circle cx="${cx}" cy="${cy - 220}" r="16" fill="${pal.alert}">
          <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite"/>
        </circle>
      </g>
      <g id="year-1941">
        <text x="${cx}" y="${cy + 320}" text-anchor="middle" font-family="serif"
              font-size="180" fill="${pal.paper}" opacity="0.5" letter-spacing="12">1941</text>
      </g>
    `;
  } else if (id.startsWith('S03')) {
    art = `
      <g id="hedy">
        <circle cx="${cx - 180}" cy="${cy - 80}" r="140" fill="${pal.paper}" stroke="${pal.accent}" stroke-width="6"/>
        <path d="M ${cx - 320} ${cy + 40} Q ${cx - 180} ${cy + 220} ${cx - 40} ${cy + 40}"
              fill="${pal.accent}" opacity="0.85"/>
        <g id="sparkles" fill="${pal.alert}">
          <polygon points="${cx + 60},${cy - 160} ${cx + 80},${cy - 120} ${cx + 120},${cy - 110} ${cx + 80},${cy - 90} ${cx + 70},${cy - 50} ${cx + 50},${cy - 90} ${cx + 10},${cy - 100} ${cx + 50},${cy - 120}"/>
        </g>
      </g>
      <g id="film-strip" opacity="0.7">
        <rect x="${cx + 120}" y="${cy - 40}" width="340" height="180" rx="10" fill="${pal.paper}" stroke="${pal.ink}" stroke-width="4"/>
        <line x1="${cx + 160}" y1="${cy - 40}" x2="${cx + 160}" y2="${cy + 140}" stroke="${pal.ink}" stroke-width="4" stroke-dasharray="8 8"/>
        <line x1="${cx + 420}" y1="${cy - 40}" x2="${cx + 420}" y2="${cy + 140}" stroke="${pal.ink}" stroke-width="4" stroke-dasharray="8 8"/>
      </g>
    `;
  } else if (id.startsWith('S04')) {
    art = `
      <g id="frequency-block">
        <line x1="${cx - 400}" y1="${cy}" x2="${cx + 400}" y2="${cy}" stroke="${pal.accent}" stroke-width="4"/>
        <g id="signal" stroke="${pal.alert}" fill="none" stroke-width="6">
          <path d="M ${cx - 400} ${cy - 60} q 25 60 0 120 t 0 120" opacity="0.5"/>
          <path d="M ${cx - 200} ${cy - 60} q 25 60 0 120 t 0 120" opacity="0.7"/>
          <path d="M ${cx} ${cy - 60} q 25 60 0 120 t 0 120" opacity="0.9"/>
          <path d="M ${cx + 200} ${cy - 60} q 25 60 0 120 t 0 120"/>
        </g>
        <g id="wall">
          <rect x="${cx - 20}" y="${cy - 300}" width="40" height="600" fill="${pal.paper}" stroke="${pal.alert}" stroke-width="6"/>
          <text x="${cx}" y="${cy - 330}" text-anchor="middle" font-family="monospace"
                font-size="52" fill="${pal.alert}" letter-spacing="4">BLOQUEADO</text>
        </g>
      </g>
    `;
  } else if (id.startsWith('S05')) {
    art = `
      <g id="piano">
        ${Array.from({ length: 12 }).map((_, i) => {
      const x = cx - 480 + i * 80;
      return `<rect x="${x}" y="${cy - 120}" width="76" height="340" rx="6"
                        fill="${pal.ink}" stroke="${pal.paper}" stroke-width="3"/>`;
    }).join('')}
        ${Array.from({ length: 8 }).map((_, i) => {
      const x = cx - 440 + i * 80;
      return `<rect x="${x}" y="${cy - 120}" width="44" height="200" rx="4"
                        fill="${pal.paper}" stroke="${pal.ink}" stroke-width="2"/>`;
    }).join('')}
      </g>
      <g id="hopping-dot" fill="${pal.alert}">
        <circle cx="${cx - 440}" cy="${cy + 260}" r="18"/>
      </g>
      <g id="channel-label">
        <text x="${cx}" y="${cy - 180}" text-anchor="middle" font-family="monospace"
              font-size="44" fill="${pal.accent}" letter-spacing="6">SALTO DE FREQUÊNCIA</text>
      </g>
    `;
  } else if (id.startsWith('S06')) {
    art = `
      <g id="vault">
        <circle cx="${cx}" cy="${cy}" r="260" fill="${pal.paper}" stroke="${pal.ink}" stroke-width="10"/>
        <circle cx="${cx}" cy="${cy}" r="200" fill="none" stroke="${pal.accent}" stroke-width="4" stroke-dasharray="20 12"/>
        <circle cx="${cx}" cy="${cy}" r="120" fill="none" stroke="${pal.ink}" stroke-width="6"/>
        <g id="vault-handle" stroke="${pal.accent}" stroke-width="10" stroke-linecap="round">
          <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 90}"/>
          <line x1="${cx}" y1="${cy}" x2="${cx + 78}" y2="${cy + 45}"/>
          <line x1="${cx}" y1="${cy}" x2="${cx - 78}" y2="${cy + 45}"/>
        </g>
      </g>
      <g id="patent-stamp" opacity="0">
        <text x="${cx}" y="${cy + 380}" text-anchor="middle" font-family="monospace"
              font-size="72" fill="${pal.alert}" letter-spacing="10">CLASSIFICADO</text>
      </g>
    `;
  } else if (id.startsWith('S07')) {
    art = `
      <g id="blackhole">
        <circle cx="${cx}" cy="${cy}" r="300" fill="url(#bh-grad-${idx})"/>
        <ellipse cx="${cx}" cy="${cy}" rx="460" ry="120" fill="none"
                 stroke="${pal.accent}" stroke-width="10" opacity="0.7"/>
        <ellipse cx="${cx}" cy="${cy}" rx="520" ry="140" fill="none"
                 stroke="${pal.alert}" stroke-width="4" opacity="0.4"/>
        <circle cx="${cx}" cy="${cy}" r="120" fill="#000"/>
        <g id="stars" fill="${pal.ink}">
          ${Array.from({ length: 40 }).map(() => {
      const a = Math.random() * Math.PI * 2, r = 350 + Math.random() * 500;
      return `<circle cx="${cx + Math.cos(a) * r}" cy="${cy + Math.sin(a) * r}" r="${1 + Math.random() * 2}" opacity="${0.3 + Math.random() * 0.6}"/>`;
    }).join('')}
        </g>
      </g>
    `;
  } else if (id.startsWith('S08')) {
    art = `
      <g id="echo-walls">
        <rect x="${cx - 420}" y="${cy - 260}" width="60" height="520" fill="${pal.paper}"/>
        <rect x="${cx + 360}" y="${cy - 260}" width="60" height="520" fill="${pal.paper}"/>
        <g stroke="${pal.accent}" fill="none" stroke-width="5">
          ${Array.from({ length: 6 }).map((_, i) => {
      const y = cy - 200 + i * 80;
      return `<path d="M ${cx - 360} ${y} q 100 -60 200 0 t 200 0 t 200 0 t 200 0" opacity="${0.3 + i * 0.1}"/>`;
    }).join('')}
        </g>
        <g id="echo-dots" fill="${pal.alert}">
          <circle cx="${cx - 360}" cy="${cy}" r="12"/>
          <circle cx="${cx + 360}" cy="${cy}" r="12"/>
        </g>
      </g>
    `;
  } else if (id.startsWith('S09')) {
    art = `
      <g id="fusion">
        <circle cx="${cx - 260}" cy="${cy}" r="140" fill="${pal.paper}" stroke="${pal.accent}" stroke-width="6"/>
        <text x="${cx - 260}" y="${cy + 16}" text-anchor="middle" font-family="monospace"
              font-size="42" fill="${pal.accent}">λ</text>
        <circle cx="${cx + 260}" cy="${cy}" r="140" fill="${pal.paper}" stroke="${pal.alert}" stroke-width="6"/>
        <text x="${cx + 260}" y="${cy + 16}" text-anchor="middle" font-family="monospace"
              font-size="42" fill="${pal.alert}">♪</text>
        <line x1="${cx - 120}" y1="${cy}" x2="${cx + 120}" y2="${cy}" stroke="${pal.ink}" stroke-width="4" stroke-dasharray="12 8"/>
        <g id="wifi-born" stroke="${pal.accent}" fill="none" stroke-width="8" stroke-linecap="round" opacity="0">
          <path d="M ${cx - 200} ${cy + 240} A 200 200 0 0 1 ${cx + 200} ${cy + 240}"/>
          <path d="M ${cx - 120} ${cy + 320} A 120 120 0 0 1 ${cx + 120} ${cy + 320}"/>
          <circle cx="${cx}" cy="${cy + 400}" r="12" fill="${pal.accent}"/>
        </g>
      </g>
    `;
  } else if (id.startsWith('S10')) {
    art = `
      <g id="wifi-vs-hifi">
        <text x="${cx - 260}" y="${cy}" text-anchor="middle" font-family="sans-serif"
              font-size="140" fill="${pal.accent}" font-weight="800">Wi-Fi</text>
        <text x="${cx + 260}" y="${cy}" text-anchor="middle" font-family="sans-serif"
              font-size="140" fill="${pal.alert}" font-weight="800">Hi-Fi</text>
        <line x1="${cx}" y1="${cy - 120}" x2="${cx}" y2="${cy + 120}" stroke="${pal.ink}" stroke-width="4" stroke-dasharray="10 10"/>
        <g id="equal-sign" opacity="0">
          <text x="${cx}" y="${cy + 220}" text-anchor="middle" font-family="monospace"
                font-size="72" fill="${pal.ink}" letter-spacing="6">? = ?</text>
        </g>
      </g>
    `;
  } else if (id.startsWith('S11')) {
    art = `
      <g id="evolution">
        <g id="router">
          <rect x="${cx - 160}" y="${cy + 120}" width="320" height="120" rx="16" fill="${pal.paper}" stroke="${pal.ink}" stroke-width="6"/>
          <circle cx="${cx - 80}" cy="${cy + 180}" r="10" fill="${pal.accent}"/>
          <circle cx="${cx}" cy="${cy + 180}" r="10" fill="${pal.accent}"/>
          <circle cx="${cx + 80}" cy="${cy + 180}" r="10" fill="${pal.accent}"/>
          <line x1="${cx}" y1="${cy + 120}" x2="${cx}" y2="${cy + 40}" stroke="${pal.ink}" stroke-width="8"/>
          <line x1="${cx - 100}" y1="${cy + 120}" x2="${cx - 140}" y2="${cy + 40}" stroke="${pal.ink}" stroke-width="8"/>
          <line x1="${cx + 100}" y1="${cy + 120}" x2="${cx + 140}" y2="${cy + 40}" stroke="${pal.ink}" stroke-width="8"/>
        </g>
        <g id="globe" stroke="${pal.accent}" fill="none" stroke-width="4">
          <circle cx="${cx}" cy="${cy - 160}" r="220"/>
          <ellipse cx="${cx}" cy="${cy - 160}" rx="220" ry="80"/>
          <ellipse cx="${cx}" cy="${cy - 160}" rx="80" ry="220"/>
          <line x1="${cx - 220}" y1="${cy - 160}" x2="${cx + 220}" y2="${cy - 160}"/>
        </g>
        <g id="orbit-dots" fill="${pal.alert}">
          ${Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return `<circle cx="${cx + Math.cos(a) * 220}" cy="${cy - 160 + Math.sin(a) * 80}" r="10"/>`;
    }).join('')}
        </g>
      </g>
    `;
  } else {
    // S12 CTA
    art = `
      <g id="cta">
        <text x="${cx}" y="${cy - 60}" text-anchor="middle" font-family="sans-serif"
              font-size="96" fill="${pal.ink}" font-weight="800" letter-spacing="2">COMENTA AÍ!</text>
        <g id="cta-arrows" stroke="${pal.accent}" stroke-width="8" fill="none" stroke-linecap="round">
          <path d="M ${cx - 300} ${cy + 120} q 150 80 300 0"/>
          <path d="M ${cx + 300} ${cy + 120} q -150 80 -300 0"/>
        </g>
      </g>
    `;
  }

  return `
    <svg id="scene-${idx}" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"
         style="position:absolute; inset:0; overflow:visible;">
      <defs>
        <radialGradient id="bh-grad-${idx}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000"/>
          <stop offset="55%" stop-color="${pal.bg1}"/>
          <stop offset="100%" stop-color="${pal.accent}" stop-opacity="0.15"/>
        </radialGradient>
        <linearGradient id="bg-grad-${idx}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${pal.bg0}"/>
          <stop offset="100%" stop-color="${pal.bg1}"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#bg-grad-${idx})"/>
      ${art}
    </svg>
  `;
}

// ---------------------------------------------------------------------------
// 5. Gerar SVG de cada cena e container de câmera
// ---------------------------------------------------------------------------
const sceneSVGs = sceneTimings.map((s, i) => sceneSVG(s, i)).join('\n');

// ---------------------------------------------------------------------------
// 6. Tipografia cinética (palavras mascaradas)
// ---------------------------------------------------------------------------
const TOTAL_DURATION = sceneTimings[sceneTimings.length - 1].end;

const wordSpans = words.map((w, i) => {
  return `<span class="word" data-t="${w.start}" data-e="${w.end}">${escapeHtml(w.text)}</span>`;
}).join(' ');

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------------------
// 7. Timeline de animação (definida em JS, injetada no HTML)
// ---------------------------------------------------------------------------
const timelineData = sceneTimings.map((s, i) => ({
  idx: i,
  id: s.id,
  title: s.title,
  start: round(s.start),
  end: round(s.end),
  palette: paletteForScene(s.id),
  matchCutIn: matchCutForScene(s.id, 'in'),
  matchCutOut: matchCutForScene(s.id, 'out'),
}));

function round(n) { return Math.round(n * 1000) / 1000; }

// Match cuts: qual transformação a câmera faz entre esta cena e a próxima
function matchCutForScene(id, dir) {
  const map = {
    S01_Hook: { out: 'whip-pan-right', in: 'whip-pan-left' },
    S02_Origem1941: { out: 'zoom-in', in: 'zoom-out' },
    S03_HedyLamarr: { out: 'whip-pan-right', in: 'whip-pan-left' },
    S04_SinalBloqueado: { out: 'shake-cut', in: 'shake-cut' },
    S05_SaltoFrequencia: { out: 'zoom-in', in: 'zoom-out' },
    S06_PatenteSecreta: { out: 'zoom-in-dark', in: 'zoom-out-dark' },
    S07_BuracosNegros1992: { out: 'whip-pan-right', in: 'whip-pan-left' },
    S08_CaosEcos: { out: 'shake-cut', in: 'shake-cut' },
    S09_FusaoEspacial: { out: 'zoom-in', in: 'zoom-out' },
    S10_MitoWiFi: { out: 'whip-pan-right', in: 'whip-pan-left' },
    S11_Evolucao: { out: 'zoom-in', in: 'zoom-out' },
    S12_CTA: { out: 'hold', in: 'hold' },
  };
  return (map[id] || {})[dir] || 'whip-pan-right';
}

fs.writeFileSync(
  path.join(DATA_DIR, 'timing.json'),
  JSON.stringify({ totalDuration: round(TOTAL_DURATION), scenes: timelineData, words }, null, 2)
);

// ---------------------------------------------------------------------------
// 8. HTML final
// ---------------------------------------------------------------------------
const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${script.topic}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<style>
  :root { --stage-w: 1920px; --stage-h: 1080px; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:100%; height:100%; overflow:hidden; background:#000; }
  #viewport {
    position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    background:#000;
  }
  #stage {
    position:relative; width:var(--stage-w); height:var(--stage-h);
    transform-origin: center center;
    overflow:hidden;
    background:#000;
  }
  /* mundo infinito: todas as cenas dentro do camera-rig */
  #camera-rig {
    position:absolute; inset:0;
    will-change: transform, filter;
  }
  #world {
    position:absolute; top:0; left:0;
    width:calc(var(--stage-w) * ${sceneTimings.length}); height:var(--stage-h);
    display:flex; flex-wrap:nowrap;
    will-change: transform;
  }
  .scene-slot {
    position:relative; width:var(--stage-w); height:var(--stage-h); flex:0 0 var(--stage-w);
    overflow:visible;
  }
  .scene-slot svg { position:absolute; inset:0; }
  /* tipografia cinética */
  #kinetic-type {
    position:absolute; left:50%; bottom:8%; transform:translateX(-50%);
    width:80%; text-align:center;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 64px; font-weight: 800; line-height:1.05;
    color:#fff; letter-spacing:-0.02em;
    pointer-events:none;
    display:flex; flex-wrap:wrap; justify-content:center; gap:0.25em;
    z-index:50;
    text-shadow: 0 4px 24px rgba(0,0,0,0.8);
  }
  #kinetic-type .word {
    display:inline-block; overflow:hidden;
    line-height:1.1;
  }
  #kinetic-type .word > .inner {
    display:inline-block;
    transform: translateY(110%);
    will-change: transform;
  }
  #kinetic-type .word.trigger { color: var(--accent, #22d3ee); }
  #kinetic-type .word.mega {
    position:absolute;
    font-size: 22vw;
    opacity: 0.12;
    z-index:-1;
    pointer-events:none;
  }
  /* overlays */
  #grain {
    position:absolute; inset:0; pointer-events:none; z-index:90;
    opacity:0.05; mix-blend-mode:screen;
  }
  #vignette {
    position:absolute; inset:0; pointer-events:none; z-index:91;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%);
  }
  #ui {
    position:absolute; inset:0; pointer-events:none; z-index:100;
    font-family: monospace; color:#fff;
  }
  #ui .hud {
    position:absolute; bottom:16px; left:16px;
    font-size:12px; opacity:0.5; letter-spacing:0.2em;
  }
  #ui .era-badge {
    position:absolute; top:24px; left:24px;
    padding:8px 16px; border:1px solid currentColor;
    font-size:12px; letter-spacing:0.3em;
    opacity:0.8;
  }
  #play-hint {
    position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    background:rgba(0,0,0,0.85); color:#fff; font-family:monospace;
    font-size:18px; cursor:pointer; z-index:200; letter-spacing:0.3em;
  }
</style>
</head>
<body>
<div id="viewport">
  <div id="stage" data-composition-id="main" data-start="0" data-duration="${round(TOTAL_DURATION)}" data-width="1920" data-height="1080">
    <div id="camera-rig">
      <div id="world">
        ${sceneTimings.map((s, i) => `<div class="scene-slot" data-idx="${i}" data-id="${s.id}">${sceneSVG(s, i)}</div>`).join('\n')}
      </div>
    </div>
    <div id="kinetic-type"></div>
    <svg id="grain" xmlns="http://www.w3.org/2000/svg">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)"/>
    </svg>
    <div id="vignette"></div>
    <div id="ui">
      <div class="era-badge" id="era-badge">ERA</div>
      <div class="hud" id="hud">00:00 / 00:00</div>
    </div>
  </div>
</div>
<div id="play-hint">▶ CLIQUE PARA INICIAR</div>

<script>
// ============================================================
// DATA
// ============================================================
const TIMING = ${JSON.stringify({ totalDuration: round(TOTAL_DURATION), scenes: timelineData, words }, null, 2)};
const PALETTES = ${JSON.stringify(PALETTES)};
const STAGE_W = 1920, STAGE_H = 1080;

// ============================================================
// FIT STAGE
// ============================================================
function fitStage() {
  const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  document.getElementById('stage').style.transform = \`scale(\${s})\`;
}
window.addEventListener('resize', fitStage);
fitStage();

// ============================================================
// KINETIC TYPE — monta spans com inner wrapper
// ============================================================
const kt = document.getElementById('kinetic-type');
const wordEls = [];
TIMING.words.forEach((w, i) => {
  const outer = document.createElement('span');
  outer.className = 'word';
  outer.dataset.t = w.start;
  outer.dataset.e = w.end;
  outer.dataset.idx = i;
  const inner = document.createElement('span');
  inner.className = 'inner';
  inner.textContent = w.text;
  outer.appendChild(inner);
  kt.appendChild(outer);
  wordEls.push({ outer, inner, start: w.start, end: w.end, text: w.text });
});

// ============================================================
// HUD helpers
// ============================================================
const hud = document.getElementById('hud');
const eraBadge = document.getElementById('era-badge');
function fmt(t) {
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  return m + ':' + s;
}
const ERA_LABEL = {
  war1941: '1941 · SEGUNDA GUERRA',
  space1992: '1992 · BURACOS NEGROS',
  modern: 'HOJE · ERA DIGITAL',
};

// ============================================================
// GSAP TIMELINE
// ============================================================
gsap.registerPlugin(ScrollTrigger);
const master = gsap.timeline({ paused: true });

const worldEl = document.getElementById('world');
const cameraRig = document.getElementById('camera-rig');
const sceneSlots = Array.from(document.querySelectorAll('.scene-slot'));

// posição X do mundo para cada cena (0, -1920, -3840, ...)
const sceneX = (i) => -i * STAGE_W;

// estado inicial
gsap.set(worldEl, { x: 0 });
gsap.set(cameraRig, { scale: 1, filter: 'blur(0px)' });
sceneSlots.forEach((slot, i) => {
  gsap.set(slot, { opacity: i === 0 ? 1 : 1 }); // todos visíveis no mundo
});

// -------- utilidades de efeito --------
function shakeRig(tl, intensity = 12, dur = 0.25, at = '>') {
  tl.to(cameraRig, {
    x: () => gsap.utils.random(-intensity, intensity),
    y: () => gsap.utils.random(-intensity * 0.6, intensity * 0.6),
    duration: 0.05,
    repeat: Math.floor(dur / 0.05),
    yoyo: true,
    ease: 'none',
  }, at);
}

function whipPan(tl, fromX, toX, dur = 0.35) {
  // motion blur horizontal durante o pan
  tl.set(cameraRig, { filter: 'blur(0px)' }, '<');
  tl.to(cameraRig, { filter: 'blur(14px)', duration: dur * 0.4, ease: 'power2.in' }, '<');
  tl.to(worldEl, { x: toX, duration: dur, ease: 'power3.inOut' }, '<');
  tl.to(cameraRig, { filter: 'blur(0px)', duration: dur * 0.6, ease: 'power2.out' }, '>-' + (dur * 0.5));
}

function zoomDive(tl, cx, cy, scale = 6, dur = 0.9) {
  // zoom no centro do objeto da cena atual
  tl.to(cameraRig, {
    scale: scale,
    transformOrigin: \`\${cx}px \${cy}px\`,
    duration: dur,
    ease: 'power3.in',
  }, '>');
  tl.to(cameraRig, {
    scale: 1,
    duration: 0.001,
    onComplete: () => {
      // reposiciona o mundo para a próxima cena, sem salto visual
      gsap.set(cameraRig, { transformOrigin: 'center center' });
    }
  }, '>');
}

// ============================================================
// CONSTRUÇÃO DA TIMELINE
// ============================================================

// -------- abertura: foco no Wi-Fi --------
master.to({}, { duration: 0.2 }); // respiro

// -------- para cada cena --------
TIMING.scenes.forEach((scene, i) => {
  const slot = sceneSlots[i];
  const isFirst = i === 0;
  const isLast = i === TIMING.scenes.length - 1;
  const dur = scene.end - scene.start;

  // 1. muda paleta de fundo global (cor do body/vinheta)
  const pal = PALETTES[scene.palette];
  master.to(document.documentElement, {
    '--accent': pal.accent,
    duration: 0.6,
    ease: 'power2.out',
  }, '<');

  // 2. atualiza era badge + HUD (via callback)
  master.call(() => {
    eraBadge.textContent = ERA_LABEL[scene.palette];
    eraBadge.style.color = pal.accent;
  }, null, '<');

  // 3. flutuação contínua (zero frame morto) no SVG da cena
  const art = slot.querySelector('svg');
  if (art) {
    gsap.to(art, {
      y: i % 2 === 0 ? 12 : -12,
      scale: 1.03,
      duration: 4 + Math.random() * 2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  // 4. parallax interno: elementos com data-depth
  slot.querySelectorAll('[data-depth]').forEach(el => {
    const depth = parseFloat(el.dataset.depth);
    gsap.to(el, {
      x: depth * 40,
      duration: dur,
      ease: 'none',
    });
  });

  // 5. tipografia cinética: revela palavras da cena
  scene.words.forEach((w, wi) => {
    const idx = TIMING.words.findIndex(x => x.start === w.start && x.text === w.text);
    const word = wordEls[idx];
    if (!word) return;
    const localT = w.start - scene.start;

    // revela subindo de trás da máscara
    master.to(word.inner, {
      y: '0%',
      duration: 0.28,
      ease: 'power3.out',
    }, scene.start + localT);

    // palavra-gatilho: fica destacada por 0.6s
    const isTrigger = /bloqueava|salto|Wi-Fi|Hi-Fi|buraco|conectou/i.test(w.text);
    if (isTrigger) {
      master.call(() => word.outer.classList.add('trigger'), null, scene.start + localT);
      master.to(word.inner, {
        scale: 1.25,
        duration: 0.2,
        ease: 'back.out(2)',
      }, scene.start + localT);
      master.to(word.inner, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.inOut',
      }, scene.start + localT + 0.35);
      master.call(() => word.outer.classList.remove('trigger'), null, scene.start + localT + 0.7);
    }
  });

  // 6. efeitos específicos por cena
  const id = scene.id;

  if (id.startsWith('S01')) {
    // ondas do Wi-Fi se desenham
    const arcs = slot.querySelectorAll('#wifi-arcs path');
    master.from(arcs, {
      drawSVG: '0%',
      duration: 0.6,
      stagger: 0.12,
      ease: 'power2.out',
    }, scene.start + 0.2);
    // top secret carimba
    master.to(slot.querySelector('#top-secret'), {
      opacity: 1, duration: 0.15, ease: 'back.out(3)',
    }, scene.start + 0.8);
    master.call(() => shakeRig(master, 16, 0.3), null, scene.start + 0.85);
    master.to(slot.querySelector('#top-secret'), {
      opacity: 0, y: -20, duration: 0.3, ease: 'power2.in',
    }, scene.end - 0.5);
  }

  if (id.startsWith('S04')) {
    // parede de bloqueio cai
    const wall = slot.querySelector('#wall');
    master.from(wall, {
      y: -400, opacity: 0, duration: 0.45, ease: 'bounce.out',
    }, scene.start + 1.2);
    master.call(() => shakeRig(master, 14, 0.35), null, scene.start + 1.6);
    // sinal fica bloqueado
    master.to(slot.querySelector('#signal'), {
      opacity: 0.15, duration: 0.4, ease: 'power2.inOut',
    }, scene.start + 1.7);
  }

  if (id.startsWith('S05')) {
    // bolinha quica nas teclas
    const dot = slot.querySelector('#hopping-dot');
    if (dot) {
      const steps = 8;
      for (let k = 0; k < steps; k++) {
        master.to(dot, {
          x: 80 * (k + 1),
          y: k % 2 === 0 ? -160 : 0,
          duration: 0.22,
          ease: 'power1.inOut',
        }, scene.start + 0.6 + k * 0.22);
      }
    }
  }

  if (id.startsWith('S06')) {
    // cofre escurece → vira buraco negro
    const vault = slot.querySelector('#vault');
    master.to(vault, {
      scale: 0.2, opacity: 0, duration: 0.6, ease: 'power3.in',
    }, scene.end - 0.7);
    master.to(slot.querySelector('#patent-stamp'), {
      opacity: 1, duration: 0.2,
    }, scene.start + 0.5);
    master.call(() => shakeRig(master, 10, 0.25), null, scene.start + 0.55);
  }

  if (id.startsWith('S07')) {
    // zoom infinito no buraco negro
    const bh = slot.querySelector('#blackhole');
    if (bh) {
      master.to(bh, {
        rotation: 30, scale: 1.08, duration: dur, ease: 'none',
      }, scene.start);
    }
  }

  if (id.startsWith('S09')) {
    // fusão: dois círculos colidem e revelam Wi-Fi
    master.to(slot.querySelectorAll('#fusion > circle'), {
      x: (k) => k === 0 ? 260 : -260,
      duration: 0.6, ease: 'power3.in',
    }, scene.start + 0.8);
    master.to(slot.querySelector('#wifi-born'), {
      opacity: 1, y: -20, duration: 0.4, ease: 'back.out(2)',
    }, scene.start + 1.4);
  }

  if (id.startsWith('S11')) {
    // globo gira
    const globe = slot.querySelector('#globe');
    if (globe) {
      master.to(globe, {
        rotation: 360, transformOrigin: 'center', duration: dur, ease: 'none',
      }, scene.start);
    }
  }

  // 7. transição para a próxima cena
  if (!isLast) {
    const transStart = scene.end - 0.35;
    const nextX = sceneX(i + 1);
    const curX = sceneX(i);

    switch (scene.matchCutOut) {
      case 'whip-pan-right':
        master.call(() => whipPan(master, curX, nextX, 0.4), null, transStart);
        break;
      case 'shake-cut':
        master.call(() => shakeRig(master, 18, 0.2), null, transStart);
        master.to(worldEl, {
          x: nextX, duration: 0.01, ease: 'none',
        }, transStart + 0.25);
        break;
      case 'zoom-in':
      case 'zoom-in-dark':
        // zoom no centro e corta
        master.to(cameraRig, {
          scale: 8,
          transformOrigin: 'center center',
          duration: 0.45,
          ease: 'power3.in',
        }, transStart);
        master.set(worldEl, { x: nextX }, transStart + 0.45);
        master.set(cameraRig, { scale: 1 }, transStart + 0.45);
        master.to(cameraRig, {
          scale: 1, duration: 0.001,
        }, transStart + 0.46);
        break;
      case 'hold':
      default:
        master.to(worldEl, { x: nextX, duration: 0.5, ease: 'power2.inOut' }, transStart);
    }
  }

  // 8. esmaece palavras antigas ao sair
  if (!isLast) {
    scene.words.forEach(w => {
      const idx = TIMING.words.findIndex(x => x.start === w.start && x.text === w.text);
      if (idx >= 0) {
        master.to(wordEls[idx].inner, {
          y: '-110%',
          duration: 0.25,
          ease: 'power2.in',
        }, scene.end - 0.3);
      }
    });
  }
});

// -------- finalização --------
master.call(() => {
  gsap.to('#play-hint', { opacity: 1, duration: 0.4 });
}, null, TIMING.totalDuration);
master.to({}, { duration: 0.1 });

// ============================================================
// HUD update (ticker)
// ============================================================
master.eventCallback('onUpdate', () => {
  const t = master.time();
  hud.textContent = fmt(t) + ' / ' + fmt(TIMING.totalDuration);
});

// ============================================================
// PLAY / PAUSE
// ============================================================
const hint = document.getElementById('play-hint');
let playing = false;

function start() {
  if (playing) return;
  playing = true;
  hint.style.display = 'none';
  master.play(0);
}
hint.addEventListener('click', start);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (playing) { master.paused() ? master.play() : master.pause(); }
    else start();
  }
  if (e.code === 'KeyR') { master.restart(); }
});
window.addEventListener('click', () => { if (!playing) start(); });
window.__timelines = window.__timelines || {};
window.__timelines.main = master;
</script>
</body>
</html>`;

fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
fs.writeFileSync(path.join(__dirname, 'index.html'), html);

// ---------------------------------------------------------------------------
// 9. Relatório
// ---------------------------------------------------------------------------
console.log('✔ build.cjs concluído');
console.log('  → dist/index.html');
console.log('  → dist/data/timing.json');
console.log('  Duração total: ' + round(TOTAL_DURATION) + 's');
console.log('  Cenas: ' + sceneTimings.length);
console.log('  Palavras sincronizadas: ' + words.length);
console.log('\nAbra dist/index.html no navegador e clique para iniciar.');