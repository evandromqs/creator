// Arquiva o vídeo atual em posts/<id>/ (vídeo, áudio, legendas .json/.srt, CTA e metadados para agendamento)
// e limpa as cenas/artefatos do workspace para começar um novo vídeo.
// Uso: node scripts/reset_project.cjs [--slug=meu-video] [--force]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v === undefined ? true : v];
  })
);

function readJsonSafe(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function fmtSrtTime(sec) {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const rem = String(ms % 1000).padStart(3, "0");
  return `${h}:${m}:${s},${rem}`;
}

function wordsToSrt(words) {
  if (!Array.isArray(words) || words.length === 0) return "";
  const chunks = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const endS = /[.?!]$/.test(w.word);
    const endC = /[,:]$/.test(w.word);
    const gap = next ? next.start - w.end : 1;
    if (!next || endS || endC || gap > 0.4 || cur.length >= 4) {
      chunks.push(cur);
      cur = [];
    }
  });
  return chunks
    .map((ch, idx) => {
      const start = fmtSrtTime(ch[0].start);
      const end = fmtSrtTime(ch[ch.length - 1].end);
      const text = ch.map((w) => w.word).join(" ");
      return `${idx + 1}\n${start} --> ${end}\n${text}\n`;
    })
    .join("\n");
}

function extractCta(roteiro) {
  if (!roteiro) return "Comenta aí o que você achou e segue para mais vídeos!";
  const sentences = roteiro
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length >= 2) {
    return sentences.slice(-2).join(" ");
  }
  return sentences[sentences.length - 1] || "";
}

function copyIfExists(src, dst) {
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    return true;
  }
  return false;
}

function main() {
  const meta = readJsonSafe(path.join(ROOT, "meta.json"), {});
  const outputDir = path.join(ROOT, "output");
  const mp4s = fs.existsSync(outputDir)
    ? fs
        .readdirSync(outputDir)
        .filter((f) => f.endsWith(".mp4"))
        .map((f) => ({
          name: f,
          full: path.join(outputDir, f),
          mtime: fs.statSync(path.join(outputDir, f)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime)
    : [];

  if (mp4s.length === 0 && !args.force) {
    console.log("Nenhum .mp4 encontrado em output/. Use --force para arquivar/limpar mesmo assim.");
    process.exit(0);
  }

  const slugBase = String(args.slug || meta.id || "video")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-|-$/g, "");

  let postDir = path.join(ROOT, "posts", slugBase);
  if (fs.existsSync(postDir) && !args.force) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    postDir = path.join(ROOT, "posts", `${slugBase}-${stamp}`);
  }
  fs.mkdirSync(postDir, { recursive: true });

  // 1. Arquivar vídeo principal
  const mainVideo = mp4s[0];
  let archivedVideoName = null;
  if (mainVideo) {
    archivedVideoName = "video.mp4";
    fs.copyFileSync(mainVideo.full, path.join(postDir, archivedVideoName));
  }

  // 2. Arquivar áudios e roteiro
  const hasNarration = copyIfExists(path.join(ROOT, "audio", "narracao.mp3"), path.join(postDir, "audio", "narracao.mp3"));
  const hasQuizAudio = copyIfExists(path.join(ROOT, "audio", "quiz-mix.mp3"), path.join(postDir, "audio", "quiz-mix.mp3"));
  const hasAmbient = copyIfExists(path.join(ROOT, "audio", "ambient.mp3"), path.join(postDir, "audio", "ambient.mp3"));
  const roteiroPath = path.join(ROOT, "audio", "roteiro.txt");
  const roteiro = fs.existsSync(roteiroPath) ? fs.readFileSync(roteiroPath, "utf-8").trim() : "";
  if (roteiro) {
    fs.writeFileSync(path.join(postDir, "audio", "roteiro.txt"), roteiro, "utf-8");
  }

  // 3. Arquivar legendas e timings
  const wordsPath = path.join(ROOT, "transcript", "words.json");
  const quizTimingsPath = path.join(ROOT, "transcript", "quiz-timings.json");
  const words = readJsonSafe(wordsPath, []);
  if (words.length > 0) {
    fs.mkdirSync(path.join(postDir, "transcript"), { recursive: true });
    fs.writeFileSync(path.join(postDir, "transcript", "words.json"), JSON.stringify(words, null, 2), "utf-8");
    fs.writeFileSync(path.join(postDir, "transcript", "subtitles.srt"), wordsToSrt(words), "utf-8");
  }
  copyIfExists(quizTimingsPath, path.join(postDir, "transcript", "quiz-timings.json"));

  // 4. Arquivar snapshot do código-fonte da composição
  copyIfExists(path.join(ROOT, "index.html"), path.join(postDir, "source", "index.html"));
  copyIfExists(path.join(ROOT, "scripts", "build.cjs"), path.join(postDir, "source", "build.cjs"));

  // 5. Gerar manifesto do post
  const cta = extractCta(roteiro);
  const title = meta.name || slugBase;
  const caption = `${title}\n\n${cta}\n\n#shorts #viral #criador #quiz`;
  const postManifest = {
    id: path.basename(postDir),
    title,
    status: "ready_to_schedule",
    scheduledAt: null,
    platforms: ["youtube_shorts", "tiktok", "instagram_reels"],
    archivedAt: new Date().toISOString(),
    durationSeconds: words.length > 0 ? Number((words[words.length - 1].end + 0.8).toFixed(2)) : null,
    ctaComment: cta,
    caption,
    script: roteiro,
    files: {
      video: archivedVideoName,
      narration: hasNarration ? "audio/narracao.mp3" : hasQuizAudio ? "audio/quiz-mix.mp3" : null,
      ambient: hasAmbient ? "audio/ambient.mp3" : null,
      wordsJson: words.length > 0 ? "transcript/words.json" : null,
      subtitlesSrt: words.length > 0 ? "transcript/subtitles.srt" : null,
    },
  };
  fs.writeFileSync(path.join(postDir, "post.json"), JSON.stringify(postManifest, null, 2), "utf-8");
  fs.writeFileSync(path.join(postDir, "caption.txt"), caption, "utf-8");

  // 6. Limpar workspace para o próximo vídeo
  if (fs.existsSync(outputDir)) {
    for (const f of fs.readdirSync(outputDir)) {
      fs.rmSync(path.join(outputDir, f), { recursive: true, force: true });
    }
  }
  if (fs.existsSync(path.join(ROOT, "audio", "narracao.mp3"))) {
    fs.rmSync(path.join(ROOT, "audio", "narracao.mp3"));
  }
  if (fs.existsSync(path.join(ROOT, "audio", "quiz-mix.mp3"))) {
    fs.rmSync(path.join(ROOT, "audio", "quiz-mix.mp3"));
  }

  // Reset meta.json
  fs.writeFileSync(
    path.join(ROOT, "meta.json"),
    JSON.stringify(
      {
        id: "novo-video",
        name: "Novo Vídeo",
        createdAt: new Date().toISOString(),
      },
      null,
      2
    ) + "\n",
    "utf-8"
  );

  console.log(`\n✅ Post arquivado com sucesso em: ${postDir}`);
  console.log("✅ Workspace limpo e pronto para o próximo vídeo!");
}

main();
