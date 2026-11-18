// Root Builder do estúdio de vídeos Creator
// Suporta a geração de index.html para diferentes templates:
// Uso: node scripts/build.cjs [--template=quiz-mobile|kinetic-shorts|tech-viral|story-loop|commercial-ad] [--theme=roxo|neon|cyberpunk|esmeralda|solar]
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

// ============================================================================
// QUIZ MOBILE — Cartoon Pop Studio + Papel de Parede Rotacionando + SVGs IA
// ============================================================================

const THEMES = {
  roxo: {
    headerBg: "#31105f",
    accent: "#22d3ee",
    clockRing: "#e11d48",
    clockFace: "#fde047",
    roundBgs: ["#facc15", "#22d3ee", "#fb7185", "#4ade80", "#a78bfa", "#fb923c"],
  },
  neon: {
    headerBg: "#090d16",
    accent: "#10b981",
    clockRing: "#10b981",
    clockFace: "#fde047",
    roundBgs: ["#34d399", "#38bdf8", "#a78bfa", "#facc15", "#fb7185", "#2dd4bf"],
  },
  cyberpunk: {
    headerBg: "#2e1065",
    accent: "#f43f5e",
    clockRing: "#f43f5e",
    clockFace: "#facc15",
    roundBgs: ["#f43f5e", "#facc15", "#22d3ee", "#c084fc", "#fb923c", "#4ade80"],
  },
  esmeralda: {
    headerBg: "#064e3b",
    accent: "#34d399",
    clockRing: "#f59e0b",
    clockFace: "#fde047",
    roundBgs: ["#4ade80", "#facc15", "#2dd4bf", "#38bdf8", "#fb923c", "#a3e635"],
  },
  solar: {
    headerBg: "#7c2d12",
    accent: "#fb923c",
    clockRing: "#dc2626",
    clockFace: "#fde047",
    roundBgs: ["#fb923c", "#facc15", "#fb7185", "#38bdf8", "#4ade80", "#f472b6"],
  },
};

const themeName = String(args.theme || "roxo").toLowerCase();
const theme = THEMES[themeName] || THEMES.roxo;

// Doodles SVG line-art para o papel de parede animado de acordo com o tema
const WALLPAPER_DOODLES = {
  school: [
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="10" width="36" height="44" rx="5"/><line x1="22" y1="20" x2="42" y2="20"/><line x1="22" y1="28" x2="42" y2="28"/><line x1="22" y1="36" x2="34" y2="36"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 50L22 48L48 22L42 16L16 42L14 50Z"/><line x1="38" y1="20" x2="44" y2="26"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="10" width="32" height="44" rx="6"/><rect x="22" y="16" width="20" height="10" rx="2"/><circle cx="24" cy="34" r="2"/><circle cx="32" cy="34" r="2"/><circle cx="40" cy="34" r="2"/><circle cx="24" cy="42" r="2"/><circle cx="32" cy="42" r="2"/><circle cx="40" cy="42" r="2"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 46H40M26 52H38M32 12C23 12 18 18 18 26C18 31 22 35 24 39H40C42 35 46 31 46 26C46 18 41 12 32 12Z"/></svg>`,
  ],
  geography: [
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="20"/><ellipse cx="32" cy="32" rx="9" ry="20"/><line x1="12" y1="32" x2="52" y2="32"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="20"/><polygon points="26,38 30,26 42,22 36,34"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 12C23 12 16 19 16 28C16 40 32 52 32 52C32 52 48 40 48 28C48 19 41 12 32 12Z"/><circle cx="32" cy="28" r="6"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="8,48 26,20 38,38 46,26 56,48"/></svg>`,
  ],
  nature: [
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 48C16 28 32 14 48 14C48 30 36 48 16 48Z"/><path d="M16 48L36 28"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="38" r="9"/><circle cx="20" cy="26" r="4"/><circle cx="28" cy="20" r="4"/><circle cx="38" cy="20" r="4"/><circle cx="45" cy="26" r="4"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="10"/><line x1="32" y1="12" x2="32" y2="17"/><line x1="32" y1="47" x2="32" y2="52"/><line x1="12" y1="32" x2="17" y2="32"/><line x1="47" y1="32" x2="52" y2="32"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="32,12 16,38 28,38 24,52 48,26 36,26"/></svg>`,
  ],
  science: [
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(30 32 32)"/><ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(-30 32 32)"/><circle cx="32" cy="32" r="4"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 12C40 20 42 34 38 44H26C22 34 24 20 32 12Z"/><path d="M26 38L18 46L26 44M38 38L46 46L38 44"/><circle cx="32" cy="28" r="4"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="12"/><ellipse cx="32" cy="32" rx="24" ry="7" transform="rotate(-20 32 32)"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M26 14H38M29 14V26L18 46C17 48 18 50 21 50H43C46 50 47 48 46 46L35 26V14"/></svg>`,
  ],
  history: [
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,46 16,22 26,32 32,18 38,32 48,22 52,46"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 12L50 20V32C50 44 32 52 32 52C32 52 14 44 14 32V20L32 12Z"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14H44M20 50H44M22 14C22 26 32 28 32 32C32 36 22 38 22 50M42 14C42 26 32 28 32 32C32 36 42 38 42 50"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="32,14 10,48 54,48"/><line x1="32" y1="14" x2="38" y2="48"/></svg>`,
  ],
  pop: [
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="32,12 38,25 52,27 42,37 44,51 32,44 20,51 22,37 12,27 26,25"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16H42V28C42 34 37 38 32 38C27 38 22 34 22 28V16Z"/><path d="M22 20H14V26C14 30 18 32 22 32M42 20H50V26C50 30 46 32 42 32M32 38V48M22 48H42"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="22" width="36" height="28" rx="4"/><path d="M14 22L46 14L50 22"/></svg>`,
    `<svg viewBox="0 0 64 64" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="24" width="40" height="22" rx="10"/><line x1="22" y1="31" x2="22" y2="39"/><line x1="18" y1="35" x2="26" y2="35"/><circle cx="40" cy="33" r="2"/><circle cx="45" cy="37" r="2"/></svg>`,
  ],
};

function detectBgTheme(category, questionText, explicitTheme) {
  if (explicitTheme && WALLPAPER_DOODLES[explicitTheme]) return explicitTheme;
  const s = `${category || ""} ${questionText || ""}`.toLowerCase();
  if (/geograf|pa[ií]s|capital|rio|oceano|ilha| continente|mapa|mundo|cidade/.test(s)) return "geography";
  if (/animal|floresta|natureza|planta|baleia|canguru|rato|bioma|amaz[oô]nia|mar|ave|peixe/.test(s)) return "nature";
  if (/ci[eê]ncia|espa[cç]o|planeta|f[ií]sica|qu[ií]mica|corpo|luz|sol|estrela|[aá]tomo/.test(s)) return "science";
  if (/hist[oó]ria|antig|rei|imp[eé]rio|guerra|egito|romano|idade|descobrimento/.test(s)) return "history";
  if (/filme|cinema|her[oó]i|m[uú]sica|esporte|futebol|jogo|s[eé]rie|pop| Oscar/.test(s)) return "pop";
  return "school";
}

function sanitizeInlineSvg(svgStr) {
  if (!svgStr || typeof svgStr !== "string") return null;
  const trimmed = svgStr.trim();
  if (!trimmed.startsWith("<svg") || !trimmed.endsWith("</svg>")) return null;
  return trimmed;
}

// Gerador inteligente de Sticker SVG Cartoon colorido para opções que não tenham optSvgs customizados
function getContextualOptionSvg(optText, category, oi) {
  const t = `${optText || ""} ${category || ""}`.toLowerCase();
  if (/baleia|golfinho|peixe|mar|oceano|tubar/.test(t)) {
    return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#bae6fd" stroke="#0f172a" stroke-width="3.5"/><path d="M14 36C14 24 26 20 38 22C46 23 50 20 52 16C52 24 48 30 46 34C48 38 52 40 52 40C44 44 26 44 14 36Z" fill="#0284c7" stroke="#0f172a" stroke-width="3"/><circle cx="24" cy="30" r="2.5" fill="#0f172a"/></svg>`;
  }
  if (/canguru|le[aã]o|tigre|cachorro|lobo|urso|macaco|girafa|elefante|animal/.test(t)) {
    return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#fde68a" stroke="#0f172a" stroke-width="3.5"/><path d="M22 20L18 10L28 16M42 20L46 10L36 16" fill="#d97706" stroke="#0f172a" stroke-width="3"/><circle cx="32" cy="34" r="15" fill="#f59e0b" stroke="#0f172a" stroke-width="3"/><circle cx="26" cy="31" r="2.5" fill="#0f172a"/><circle cx="38" cy="31" r="2.5" fill="#0f172a"/><ellipse cx="32" cy="37" rx="5" ry="3.5" fill="#78350f"/></svg>`;
  }
  if (/rato|coelho|gato|hamster|esquilo/.test(t)) {
    return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#e2e8f0" stroke="#0f172a" stroke-width="3.5"/><circle cx="20" cy="22" r="8" fill="#94a3b8" stroke="#0f172a" stroke-width="3"/><circle cx="44" cy="22" r="8" fill="#94a3b8" stroke="#0f172a" stroke-width="3"/><circle cx="32" cy="35" r="14" fill="#cbd5e1" stroke="#0f172a" stroke-width="3"/><circle cx="27" cy="32" r="2.5" fill="#0f172a"/><circle cx="37" cy="32" r="2.5" fill="#0f172a"/><circle cx="32" cy="38" r="3" fill="#f43f5e"/></svg>`;
  }
  if (/avi[aã]o|jato|voo|foguet|helic/.test(t)) {
    return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#e0f2fe" stroke="#0f172a" stroke-width="3.5"/><path d="M14 36L50 20L42 46L32 38L24 44L26 36L14 36Z" fill="#38bdf8" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/></svg>`;
  }
  if (/bicicleta|moto|carro|trem|[oô]nibus|roda/.test(t)) {
    return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#dcfce7" stroke="#0f172a" stroke-width="3.5"/><circle cx="21" cy="40" r="8" fill="#fff" stroke="#0f172a" stroke-width="3"/><circle cx="43" cy="40" r="8" fill="#fff" stroke="#0f172a" stroke-width="3"/><path d="M21 40L29 26H39L32 40H21M39 26L43 40" fill="none" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  if (/amaz[oô]nia|floresta|mata|cerrado|planta|[aá]rvore|ilha/.test(t)) {
    return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#bbf7d0" stroke="#0f172a" stroke-width="3.5"/><rect x="28" y="38" width="8" height="14" fill="#92400e" stroke="#0f172a" stroke-width="3"/><circle cx="32" cy="26" r="14" fill="#22c55e" stroke="#0f172a" stroke-width="3"/><circle cx="23" cy="31" r="9" fill="#16a34a" stroke="#0f172a" stroke-width="3"/><circle cx="41" cy="31" r="9" fill="#16a34a" stroke="#0f172a" stroke-width="3"/></svg>`;
  }
  if (/rio|nilo|água|mar|lago|cachoeira/.test(t)) {
    return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#cffafe" stroke="#0f172a" stroke-width="3.5"/><path d="M14 28Q23 20 32 28T50 28M14 38Q23 30 32 38T50 38" fill="none" stroke="#0284c7" stroke-width="4" stroke-linecap="round"/></svg>`;
  }
  if (/jap[aã]o|sol|china|coreia|[aá]sia/.test(t)) {
    return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#fef3c7" stroke="#0f172a" stroke-width="3.5"/><circle cx="32" cy="32" r="13" fill="#ef4444" stroke="#0f172a" stroke-width="3"/></svg>`;
  }
  const fallbacks = [
    `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#ddd6fe" stroke="#0f172a" stroke-width="3.5"/><circle cx="32" cy="32" r="15" fill="#38bdf8" stroke="#0f172a" stroke-width="3"/><path d="M22 28Q30 22 36 28T44 34" fill="none" stroke="#22c55e" stroke-width="4" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#fde68a" stroke="#0f172a" stroke-width="3.5"/><polygon points="32,13 37,25 50,26 40,35 43,48 32,41 21,48 24,35 14,26 27,25" fill="#f59e0b" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/></svg>`,
    `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#fecdd3" stroke="#0f172a" stroke-width="3.5"/><polygon points="34,12 18,35 30,35 28,52 46,28 34,28" fill="#fb7185" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/></svg>`,
  ];
  return fallbacks[oi % fallbacks.length];
}

console.log(`Compilando template padrão: Quiz Mobile (tema: ${THEMES[themeName] ? themeName : "roxo"})...`);
const timingsFile = fs.existsSync(path.join(ROOT, "transcript", "quiz-timings.json"))
  ? path.join(ROOT, "transcript", "quiz-timings.json")
  : path.join(ROOT, "templates", "quiz-mobile", "quiz3-francisca.json");

const data = JSON.parse(fs.readFileSync(timingsFile, "utf-8"));
const TOTAL = Number((data.durationInSeconds || data.totalDuration || 100.27).toFixed(2));
const questions = data.questions || data.rounds;
const totalQ = questions.length;

const jsLines = [];
const sets = [];
const RING_CIRC = 339.29; // 2 * PI * 54

const scenesHtml = questions.map((q, qi) => {
  const qNum = qi + 1;
  const id = `q${qNum}`;
  const startSec = q.startSec !== undefined ? q.startSec : q.start;
  const endSec = q.endSec !== undefined ? q.endSec : q.end;
  const dur = Number((endSec - startSec).toFixed(2));
  const category = String(q.category || (typeof args.category === "string" ? args.category : "") || data.category || "CONHECIMENTOS GERAIS").toUpperCase();
  const questionText = q.question || q.q || "";
  const options = q.options || q.opts || [];
  const cues = q.countdownCuesSec || q.cues || [];
  const revealSec = q.revealSec !== undefined ? q.revealSec : q.reveal;
  const correctIndex = q.correctIndex !== undefined ? q.correctIndex : options.findIndex((o) => o === (q.answer || q.ans));
  const roundBg = theme.roundBgs[qi % theme.roundBgs.length];

  // Papel de parede rotacionando de acordo com o tema da rodada
  const bgThemeKey = detectBgTheme(category, questionText, q.bgTheme);
  const baseDoodles = WALLPAPER_DOODLES[bgThemeKey] || WALLPAPER_DOODLES.school;
  const customBgSvg = sanitizeInlineSvg(q.bgSvg);
  const doodlePool = customBgSvg ? [customBgSvg, ...baseDoodles] : baseDoodles;

  const wpTiles = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      const idxDoodle = (row * 5 + col) % doodlePool.length;
      const topPx = row * 310 - 120 + (col % 2 === 0 ? 0 : 110);
      const leftPx = col * 260 - 80;
      const tileId = `${id}-wpt-${row}-${col}`;
      wpTiles.push(
        `<div class="wp-tile" id="${tileId}" style="top:${topPx}px;left:${leftPx}px">${doodlePool[idxDoodle]}</div>`
      );
      const dir = (row + col) % 2 === 0 ? 1 : -1;
      jsLines.push(
        `tl.fromTo("#${tileId}", { rotation: ${dir * -18} }, { rotation: ${dir * 28}, duration: ${dur}, ease: "none", immediateRender: false }, ${startSec});`
      );
    }
  }

  // Drift contínuo do papel de parede durante toda a rodada
  jsLines.push(
    `tl.fromTo("#${id}-wp", { x: 0, y: 0 }, { x: -160, y: -220, duration: ${dur}, ease: "none", immediateRender: false }, ${startSec});`
  );

  const dotsHtml = questions
    .map((_, di) => `<span class="dot ${di < qNum ? (di === qi ? "active" : "done") : ""}"></span>`)
    .join("");

  const optsHtml = options
    .map((opt, oi) => {
      const customSvg = Array.isArray(q.optSvgs) ? sanitizeInlineSvg(q.optSvgs[oi]) : null;
      const iconSvg = customSvg || getContextualOptionSvg(opt, category, oi);
      return `
      <div class="opt" id="${id}-opt-${oi}">
        <div class="opt-ico" id="${id}-ico-${oi}">${iconSvg}</div>
        <span class="opt-let">${["A", "B", "C"][oi]}</span>
        <span class="opt-txt">${opt}</span>
        <span class="opt-check" id="${id}-chk-${oi}">✓</span>
      </div>`;
    })
    .join("");

  // Transição Swoosh de entrada da rodada
  if (qi > 0) {
    sets.push(`gsap.set("#${id}", { opacity: 0, x: 980, rotation: 4, scale: 0.94 });`);
    jsLines.push(
      `tl.to("#${id}", { opacity: 1, x: 0, rotation: 0, scale: 1, duration: 0.34, ease: "back.out(1.2)" }, ${startSec});`
    );
  }

  // Entrada da caixa de pergunta e opções com ícones SVG saltando
  sets.push(`gsap.set("#${id}-qbox", { opacity: 0, y: 30, scale: 0.92 });`);
  jsLines.push(`tl.to("#${id}-qbox", { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "back.out(1.7)" }, ${Number((startSec + 0.08).toFixed(2))});`);
  options.forEach((_, oi) => {
    const optAppear = Number((startSec + 1.15 + oi * 0.36).toFixed(2));
    sets.push(`gsap.set("#${id}-opt-${oi}", { opacity: 0, x: -70, scale: 0.9 });`);
    sets.push(`gsap.set("#${id}-ico-${oi}", { scale: 0, rotation: -25 });`);
    sets.push(`gsap.set("#${id}-chk-${oi}", { opacity: 0, scale: 0.3 });`);
    jsLines.push(`tl.to("#${id}-opt-${oi}", { opacity: 1, x: 0, scale: 1, duration: 0.32, ease: "back.out(1.8)" }, ${optAppear});`);
    jsLines.push(`tl.to("#${id}-ico-${oi}", { scale: 1, rotation: 0, duration: 0.36, ease: "back.out(2.4)" }, ${Number((optAppear + 0.06).toFixed(2))});`);
  });

  // Animação do Relógio Despertador (5 -> 4 -> 3 -> 2 -> 1 -> 0) + Anel circular + Sinos vibrando
  const barStart = cues[0] || startSec + 4;
  const barDur = Number(Math.max(0.5, revealSec - barStart).toFixed(2));
  sets.push(`gsap.set("#${id}-bar", { scaleX: 1 });`);
  jsLines.push(`tl.to("#${id}-bar", { scaleX: 0, duration: ${barDur}, ease: "none" }, ${barStart});`);
  sets.push(`gsap.set("#${id}-ring", { strokeDashoffset: 0 });`);
  jsLines.push(`tl.to("#${id}-ring", { strokeDashoffset: ${RING_CIRC}, duration: ${barDur}, ease: "none" }, ${barStart});`);

  cues.forEach((cueT, ci) => {
    const val = 5 - ci;
    jsLines.push(`tl.set("#${id}-num", { textContent: "${val}" }, ${cueT});`);
    jsLines.push(
      `tl.fromTo("#${id}-clock", { scale: 1.22, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.28, ease: "elastic.out(1.2, 0.5)", immediateRender: false }, ${cueT});`
    );
    jsLines.push(
      `tl.fromTo("#${id}-bells", { rotation: -14, transformOrigin: "50% 80%" }, { rotation: 0, duration: 0.26, ease: "elastic.out(1.5, 0.3)", immediateRender: false }, ${cueT});`
    );
  });

  // Revelação em revealSec (Despertador toca + verde + check)
  jsLines.push(`tl.set("#${id}-num", { textContent: "0" }, ${revealSec});`);
  jsLines.push(`tl.to("#${id}-dial", { attr: { fill: "#4ade80" }, duration: 0.2 }, ${revealSec});`);
  jsLines.push(
    `tl.fromTo("#${id}-clock", { scale: 1.28, rotation: -10 }, { scale: 1.05, rotation: 0, duration: 0.35, ease: "back.out(1.5)", immediateRender: false }, ${revealSec});`,
    `tl.set("#${id}-clock", { scale: 1.05, rotation: 0, x: 0, y: 0 }, ${(Number(revealSec) + 0.36).toFixed(3)});`
  );
  jsLines.push(
    `tl.fromTo("#${id}-bells", { rotation: -22, transformOrigin: "50% 80%" }, { rotation: 22, duration: 0.07, yoyo: true, repeat: 7, ease: "sine.inOut", immediateRender: false }, ${revealSec});`
  );

  options.forEach((_, oi) => {
    const sel = `#${id}-opt-${oi}`;
    if (oi === correctIndex) {
      jsLines.push(
        `tl.to("${sel}", { backgroundColor: "#4ade80", scale: 1.04, boxShadow: "0 14px 0 #0f172a, 0 0 40px rgba(74,222,128,0.85)", duration: 0.3, ease: "back.out(2)" }, ${revealSec});`
      );
      jsLines.push(`tl.to("#${id}-ico-${oi}", { scale: 1.18, rotation: 8, duration: 0.25, yoyo: true, repeat: 1 }, ${revealSec});`);
      jsLines.push(`tl.to("#${id}-chk-${oi}", { opacity: 1, scale: 1, duration: 0.28, ease: "back.out(2.5)" }, ${Number((revealSec + 0.05).toFixed(2))});`);
    } else {
      jsLines.push(`tl.to("${sel}", { opacity: 0.45, scale: 0.97, duration: 0.25 }, ${revealSec});`);
    }
  });

  // Saída Swoosh da rodada
  jsLines.push(
    `tl.to("#${id}", { opacity: 0, x: -920, rotation: -4, duration: 0.28, ease: "power2.in" }, ${Number((endSec - 0.28).toFixed(2))});`
  );

  const badgeSvg = customBgSvg || baseDoodles[0];

  return `
  <div id="${id}" class="scene clip" style="background:${roundBg}" data-start="${startSec}" data-duration="${dur}">
    <div class="wp-wrap" data-layout-allow-overflow>
      <div class="wp-grid" id="${id}-wp">${wpTiles.join("")}</div>
    </div>

    <div class="wave-header">
      <div class="h-left">
        <div class="h-mascot">${badgeSvg}</div>
        <div class="h-titles">
          <span class="h-cat">${category}</span>
          <span class="h-round">RODADA ${qNum} DE ${totalQ}</span>
        </div>
      </div>

      <div class="alarm-clock" id="${id}-clock">
        <svg viewBox="0 0 160 160" width="168" height="168">
          <g id="${id}-bells">
            <path d="M22 38 C12 22, 30 6, 48 18 Z" fill="#facc15" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
            <path d="M138 38 C148 22, 130 6, 112 18 Z" fill="#facc15" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
            <rect x="74" y="8" width="12" height="18" rx="4" fill="#facc15" stroke="#0f172a" stroke-width="5"/>
          </g>
          <line x1="38" y1="136" x2="26" y2="152" stroke="#0f172a" stroke-width="9" stroke-linecap="round"/>
          <line x1="122" y1="136" x2="134" y2="152" stroke="#0f172a" stroke-width="9" stroke-linecap="round"/>
          <circle cx="80" cy="86" r="62" fill="${theme.clockRing}" stroke="#0f172a" stroke-width="7"/>
          <circle id="${id}-dial" cx="80" cy="86" r="49" fill="${theme.clockFace}" stroke="#0f172a" stroke-width="5"/>
          <circle id="${id}-ring" cx="80" cy="86" r="54" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"
            stroke-dasharray="${RING_CIRC}" stroke-dashoffset="0" transform="rotate(-90 80 86)"/>
        </svg>
        <span class="alarm-num" id="${id}-num">5</span>
      </div>
    </div>

    <div class="dots">${dotsHtml}</div>

    <div class="q-box" id="${id}-qbox">
      <div class="q-text">${questionText}</div>
    </div>

    <div class="timer-track"><div class="timer-fill" id="${id}-bar"></div></div>

    <div class="opts">${optsHtml}</div>

    <div class="footer">@CREATORSTUDIO</div>
  </div>`;
}).join("\n");

// Outro
const outroStart = data.outro?.startSec !== undefined ? data.outro.startSec : (data.outroStart || 93.5);
const outroDur = Number(Math.max(1, TOTAL - outroStart).toFixed(2));
const outroTitle = data.outro?.title || "DESAFIO CONCLUÍDO!";
const outroSub = data.outro?.subtitle || "QUANTAS VOCÊ ACERTOU?";
const outroCta = data.outro?.callToAction || "COMENTE SUA PONTUAÇÃO!";

const outroHtml = `
  <div id="outro" class="scene outro clip" style="background:${theme.headerBg}" data-start="${outroStart}" data-duration="${outroDur}">
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
<title>Quiz Mobile — Creator Studio</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&display=block" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;font-family:'Poppins',sans-serif;background:${theme.headerBg}}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:${theme.headerBg}}
.scene{position:absolute;inset:0;padding:0 64px 64px;display:flex;flex-direction:column;align-items:center;overflow:hidden}
.wp-wrap{position:absolute;inset:-240px;pointer-events:none;z-index:0;transform:rotate(-12deg)}
.wp-grid{position:relative;width:1560px;height:2400px}
.wp-tile{position:absolute;width:130px;height:130px;opacity:.14}
.wp-tile svg{width:100%;height:100%}
.wave-header{position:relative;z-index:2;width:calc(100% + 128px);margin:0 -64px;padding:44px 60px 42px;background:${theme.headerBg};border-bottom:8px solid #0f172a;border-radius:0 0 68px 68px;box-shadow:0 14px 0 rgba(15,23,42,.28);display:flex;align-items:center;justify-content:space-between}
.h-left{display:flex;align-items:center;gap:24px}
.h-mascot{width:96px;height:96px;border-radius:28px;background:#fde047;border:5px solid #0f172a;box-shadow:0 7px 0 #0f172a;padding:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.h-mascot svg{width:100%;height:100%}
.h-titles{display:flex;flex-direction:column;gap:4px}
.h-cat{font-weight:900;font-size:40px;color:#ffffff;text-shadow:0 5px 0 #0f172a;letter-spacing:1px;line-height:1.1}
.h-round{font-weight:800;font-size:27px;color:#fde047;letter-spacing:1.5px}
.alarm-clock{position:relative;width:168px;height:168px;display:flex;align-items:center;justify-content:center;flex-shrink:0;filter:drop-shadow(0 8px 0 #0f172a)}
.alarm-num{position:absolute;top:54%;left:50%;transform:translate(-50%,-50%);font-weight:900;font-size:68px;color:#0f172a;line-height:1}
.dots{position:relative;z-index:2;width:100%;display:grid;grid-template-columns:repeat(${totalQ},1fr);gap:16px;margin-top:32px}
.dot{height:16px;border-radius:999px;background:rgba(15,23,42,.22);border:3px solid #0f172a}
.dot.done{background:#0f172a}
.dot.active{background:#ffffff;box-shadow:0 4px 0 #0f172a}
.q-box{position:relative;z-index:2;width:100%;margin-top:38px;padding:58px 48px;border-radius:42px;background:#ffffff;border:7px solid #0f172a;box-shadow:0 16px 0 #0f172a;min-height:340px;display:flex;align-items:center;justify-content:center}
.q-text{font-weight:900;font-size:56px;line-height:1.24;color:#0f172a;text-align:center}
.timer-track{position:relative;z-index:2;width:96%;height:22px;border-radius:999px;background:rgba(15,23,42,.25);border:4px solid #0f172a;overflow:hidden;margin-top:42px}
.timer-fill{width:100%;height:100%;background:#ffffff;transform-origin:0 50%}
.opts{position:relative;z-index:2;width:100%;margin-top:42px;display:flex;flex-direction:column;gap:30px}
.opt{position:relative;width:100%;padding:22px 34px 22px 24px;border-radius:999px;background:#ffffff;border:6px solid #0f172a;box-shadow:0 12px 0 #0f172a;display:flex;align-items:center;gap:22px}
.opt-ico{width:96px;height:96px;margin:-14px 0 -14px -8px;flex-shrink:0;filter:drop-shadow(0 5px 0 rgba(15,23,42,.35))}
.opt-ico svg{width:100%;height:100%}
.opt-let{width:68px;height:68px;border-radius:50%;background:${theme.headerBg};border:4px solid #0f172a;color:#ffffff;font-weight:900;font-size:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.opt-txt{font-weight:900;font-size:44px;color:#0f172a;flex:1;line-height:1.15}
.opt-check{font-weight:900;font-size:48px;color:#0f172a;margin-right:8px}
.footer{position:relative;z-index:2;margin-top:auto;font-weight:900;font-size:30px;letter-spacing:3px;color:#0f172a;opacity:.8}
.outro{justify-content:center;text-align:center;gap:34px}
.outro-logo{width:210px;height:210px;border-radius:50%;border:6px solid #0f172a;box-shadow:0 14px 0 #0f172a}
.outro-title{font-weight:900;font-size:74px;color:#ffffff;text-shadow:0 8px 0 #0f172a}
.outro-sub{font-weight:700;font-size:44px;color:#f8fafc}
.outro-cta{margin-top:16px;padding:34px 66px;border-radius:999px;background:#fde047;border:6px solid #0f172a;color:#0f172a;font-weight:900;font-size:42px;box-shadow:0 14px 0 #0f172a}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
  <audio id="audio-narration" src="${audioSrc}" data-start="0" data-duration="${TOTAL}" data-volume="1.0"></audio>
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
fs.writeFileSync(path.join(ROOT, "templates", "quiz-mobile", "index.html"), html, "utf-8");
console.log(`✅ index.html gerado com sucesso: ${totalQ} rodadas + outro (${TOTAL}s)!`);
