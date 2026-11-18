// Gera narração de Quiz com a voz Francisca (pt-BR) em 0.9x com pausas exatas e mixa os SFX (tick e trim_alarm).
// Uso: node scripts/generate_quiz_audio.cjs [quiz.json] [audio_out.mp3] [timings_out.json]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const ROOT = path.resolve(__dirname, "..");

// Localiza ffmpeg e ffprobe instalados no sistema
function getBin(name) {
  const custom = `C:\\Users\\evand\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0-full_build\\bin\\${name}.exe`;
  if (fs.existsSync(custom)) return custom;
  return name; // fallback para PATH
}
const FFMPEG = getBin("ffmpeg");
const FFPROBE = getBin("ffprobe");

const DEFAULT_QUESTIONS = [
  { q: "Qual país tem mais ilhas no mundo?", opts: ["Indonésia", "Filipinas", "Suécia"], ans: "Suécia" },
  { q: "Qual é a capital da Austrália?", opts: ["Sydney", "Melbourne", "Canberra"], ans: "Canberra" },
  { q: "Qual país é conhecido como a Terra do Sol Nascente?", opts: ["China", "Japão", "Coreia do Sul"], ans: "Japão" },
  { q: "Qual é o rio mais longo do mundo?", opts: ["Rio Amazonas", "Rio Nilo", "Rio Yangtzé"], ans: "Rio Nilo" },
  { q: "Qual país possui a maior extensão de costa marítima do mundo?", opts: ["Rússia", "Austrália", "Canadá"], ans: "Canadá" },
  { q: "Qual é o menor país do mundo em território?", opts: ["Mônaco", "Vaticano", "San Marino"], ans: "Vaticano" },
];

const inputQuizFile = process.argv[2];
let questions = DEFAULT_QUESTIONS;
if (inputQuizFile && fs.existsSync(inputQuizFile)) {
  try {
    const raw = JSON.parse(fs.readFileSync(inputQuizFile, "utf-8"));
    if (Array.isArray(raw)) questions = raw;
    else if (Array.isArray(raw.questions)) questions = raw.questions;
  } catch (err) {
    console.warn("Aviso ao carregar quiz personalizado, usando padrão:", err.message);
  }
}

const outMp3Final = process.argv[3] || path.join(ROOT, "audio", "quiz-mix.mp3");
const outTimingsFinal = process.argv[4] || path.join(ROOT, "transcript", "quiz-timings.json");

const tickSfx = path.join(ROOT, "assets", "sfx", "tick.mp3");
const trimSfx = path.join(ROOT, "assets", "sfx", "trim_alarm.mp3");

async function synthChunk(tts, text, outMp3) {
  const { audioStream, metadataStream } = tts.toStream(text, { rate: 0.9 });
  const chunks = [];
  const words = [];

  audioStream.on("data", (d) => chunks.push(d));
  if (metadataStream) {
    metadataStream.on("data", (buf) => {
      try {
        const msg = JSON.parse(buf.toString("utf-8"));
        const items = msg.Metadata || (Array.isArray(msg) ? msg : [msg]);
        for (const item of items) {
          if (item.Type === "WordBoundary" && item.Data?.text?.Text) {
            const start = Number((item.Data.Offset / 1e7).toFixed(3));
            const dur = Number((item.Data.Duration / 1e7).toFixed(3));
            words.push({ word: item.Data.text.Text, start, end: Number((start + dur).toFixed(3)) });
          }
        }
      } catch {}
    });
  }

  await new Promise((resolve, reject) => {
    audioStream.on("end", resolve);
    audioStream.on("error", reject);
  });

  const rawMp3 = outMp3 + ".raw.mp3";
  fs.writeFileSync(rawMp3, Buffer.concat(chunks));
  execFileSync(
    FFMPEG,
    [
      "-y",
      "-i",
      rawMp3,
      "-af",
      "silenceremove=start_periods=1:start_silence=0.02:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_silence=0.02:start_threshold=-45dB,areverse",
      "-b:a",
      "96k",
      outMp3,
    ],
    { stdio: "ignore" }
  );
  fs.rmSync(rawMp3, { force: true });

  const durStr = execFileSync(
    FFPROBE,
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", outMp3],
    { encoding: "utf-8" }
  ).trim();
  return { duration: parseFloat(durStr), words };
}

async function main() {
  const tmpDir = path.join(ROOT, "audio", "_tmp_quiz_build");
  fs.mkdirSync(tmpDir, { recursive: true });

  const tts = new MsEdgeTTS();
  await tts.setMetadata("pt-BR-FranciscaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
  });

  // Gera arquivos de silêncio para pausas calibradas
  const silMap = {};
  for (const d of [0.2, 0.3, 0.35, 0.45, 0.7, 0.9]) {
    const f = path.join(tmpDir, `sil_${d}.mp3`);
    execFileSync(
      FFMPEG,
      ["-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", String(d), "-b:a", "96k", f],
      { stdio: "ignore" }
    );
    silMap[d] = f;
  }

  console.log(`Gerando narração para ${questions.length} rodadas de quiz (Voz Francisca 0.9x)...`);

  const listLines = [];
  const roundsData = [];
  let cursor = 0;
  let segIndex = 0;

  for (let qIdx = 0; qIdx < questions.length; qIdx++) {
    const item = questions[qIdx];
    const roundStart = cursor;
    const cues = [];

    // 1. Pergunta
    const qFile = path.join(tmpDir, `seg_${segIndex++}.mp3`);
    const qInfo = await synthChunk(tts, item.q, qFile);
    listLines.push(`file '${qFile.replace(/\\/g, "/")}'`);
    cursor += qInfo.duration;
    listLines.push(`file '${silMap[0.35].replace(/\\/g, "/")}'`);
    cursor += 0.35;

    // 2. Alternativas A, B, C com pausas na letra e interrogação
    for (let oIdx = 0; oIdx < 3; oIdx++) {
      const letChar = ["A", "B", "C"][oIdx];
      const optText = item.opts[oIdx];

      // Letra A / B / C
      const letFile = path.join(tmpDir, `seg_${segIndex++}.mp3`);
      const letInfo = await synthChunk(tts, `${letChar}:`, letFile);
      listLines.push(`file '${letFile.replace(/\\/g, "/")}'`);
      cursor += letInfo.duration;
      listLines.push(`file '${silMap[0.2].replace(/\\/g, "/")}'`);
      cursor += 0.2;

      // Opção com interrogação
      const optFile = path.join(tmpDir, `seg_${segIndex++}.mp3`);
      const optInfo = await synthChunk(tts, `${optText}?`, optFile);
      listLines.push(`file '${optFile.replace(/\\/g, "/")}'`);
      cursor += optInfo.duration;
      const pauseOpt = oIdx < 2 ? 0.3 : 0.45;
      listLines.push(`file '${silMap[pauseOpt].replace(/\\/g, "/")}'`);
      cursor += pauseOpt;
    }

    // 3. Contagem regressiva 5..1 com pausas de 0.70s
    for (const num of ["5", "4", "3", "2", "1"]) {
      cues.push(Number(cursor.toFixed(3)));
      const numFile = path.join(tmpDir, `seg_${segIndex++}.mp3`);
      const numInfo = await synthChunk(tts, num, numFile);
      listLines.push(`file '${numFile.replace(/\\/g, "/")}'`);
      cursor += numInfo.duration;
      listLines.push(`file '${silMap[0.7].replace(/\\/g, "/")}'`);
      cursor += 0.7;
    }

    // 4. Resposta e Revelação
    const revealTime = Number(cursor.toFixed(3));
    const ansFile = path.join(tmpDir, `seg_${segIndex++}.mp3`);
    const ansInfo = await synthChunk(tts, `Resposta certa: ${item.ans}!`, ansFile);
    listLines.push(`file '${ansFile.replace(/\\/g, "/")}'`);
    cursor += ansInfo.duration;
    listLines.push(`file '${silMap[0.9].replace(/\\/g, "/")}'`);
    cursor += 0.9;

    const roundEnd = Number(cursor.toFixed(3));
    roundsData.push({
      round: qIdx + 1,
      category: item.category || undefined,
      question: item.q,
      options: item.opts,
      answer: item.ans,
      start: Number(roundStart.toFixed(3)),
      cues,
      reveal: revealTime,
      end: roundEnd,
    });
  }

  // 5. Outro / Chamada para ação
  const outroStart = Number(cursor.toFixed(3));
  const outroFile = path.join(tmpDir, `seg_${segIndex++}.mp3`);
  const outroInfo = await synthChunk(
    tts,
    "Qual foi a mais difícil? Comente sua nota aqui embaixo e siga o canal para mais desafios!",
    outroFile
  );
  listLines.push(`file '${outroFile.replace(/\\/g, "/")}'`);
  cursor += outroInfo.duration;
  const totalDur = Number(cursor.toFixed(3));

  // Concatena a voz limpa
  const voiceMp3 = path.join(tmpDir, "voice_clean.mp3");
  const concatTxt = path.join(tmpDir, "concat.txt");
  fs.writeFileSync(concatTxt, listLines.join("\n"), "utf-8");
  execFileSync(
    FFMPEG,
    ["-y", "-f", "concat", "-safe", "0", "-i", concatTxt, "-c:a", "libmp3lame", "-b:a", "96k", voiceMp3],
    { stdio: "ignore" }
  );

  console.log(`Voz base gerada (${totalDur}s). Mixando SFX (tick e trim_alarm)...`);

  // Monta o filtro de mixagem do FFmpeg para inserir ticks e trim_alarm nos momentos exatos
  // tick.mp3 em cada um dos cues da contagem (volume moderado e nítido)
  // trim_alarm.mp3 em cada uma das revelações de resposta
  const hasTick = fs.existsSync(tickSfx);
  const hasTrim = fs.existsSync(trimSfx);

  if (hasTick && hasTrim) {
    const inputs = ["-i", voiceMp3, "-i", tickSfx, "-i", trimSfx];
    const filterParts = [];
    let mixInputsCount = 1; // [0:a] voz

    // ticks
    roundsData.forEach((r, rIdx) => {
      r.cues.forEach((cueTime, cIdx) => {
        const delayMs = Math.round(cueTime * 1000);
        const label = `tick_${rIdx}_${cIdx}`;
        filterParts.push(`[1:a]adelay=${delayMs}|${delayMs},volume=0.85[${label}]`);
        mixInputsCount++;
      });
    });

    // trims
    roundsData.forEach((r, rIdx) => {
      const delayMs = Math.round(r.reveal * 1000);
      const label = `trim_${rIdx}`;
      filterParts.push(`[2:a]adelay=${delayMs}|${delayMs},volume=0.90[${label}]`);
      mixInputsCount++;
    });

    const mixInputsLabels = ["[0:a]"];
    roundsData.forEach((r, rIdx) => {
      r.cues.forEach((_, cIdx) => mixInputsLabels.push(`[tick_${rIdx}_${cIdx}]`));
    });
    roundsData.forEach((r, rIdx) => {
      mixInputsLabels.push(`[trim_${rIdx}]`);
    });

    filterParts.push(
      `${mixInputsLabels.join("")}amix=inputs=${mixInputsCount}:duration=first:dropout_transition=0,volume=1.0[outa]`
    );

    fs.mkdirSync(path.dirname(outMp3Final), { recursive: true });
    execFileSync(
      FFMPEG,
      ["-y", ...inputs, "-filter_complex", filterParts.join(";"), "-map", "[outa]", "-c:a", "libmp3lame", "-b:a", "128k", outMp3Final],
      { stdio: "ignore" }
    );
  } else {
    // Caso faltem SFX, copia a voz diretamente
    fs.mkdirSync(path.dirname(outMp3Final), { recursive: true });
    fs.copyFileSync(voiceMp3, outMp3Final);
  }

  // Salva timings estruturados
  const outputTimings = {
    totalDuration: totalDur,
    outroStart,
    rounds: roundsData,
  };
  fs.mkdirSync(path.dirname(outTimingsFinal), { recursive: true });
  fs.writeFileSync(outTimingsFinal, JSON.stringify(outputTimings, null, 2), "utf-8");

  // Limpa arquivos temporários
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`✅ Áudio final mixado salvo em: ${outMp3Final}`);
  console.log(`✅ Timings de Quiz salvos em: ${outTimingsFinal} (${roundsData.length} rodadas, ${totalDur}s)`);
}

main().catch((e) => {
  console.error("Erro na geração do Quiz:", e);
  process.exit(1);
});
