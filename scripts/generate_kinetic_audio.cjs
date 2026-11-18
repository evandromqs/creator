// Gera narração cena por cena para Kinetic Shorts via Edge TTS (com wordBoundaryEnabled)
// Uso: node scripts/generate_kinetic_audio.cjs [scenes.json] [out_audio.mp3] [out_timings.json] [voice]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const ROOT = path.resolve(__dirname, "..");

function getBin(name) {
  const custom = `C:\\Users\\evand\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0-full_build\\bin\\${name}.exe`;
  if (fs.existsSync(custom)) return custom;
  return name;
}
const FFMPEG = getBin("ffmpeg");
const FFPROBE = getBin("ffprobe");

const inputScenesFile = process.argv[2] || path.join(ROOT, "templates", "kinetic-shorts", "scenes.json");
const outAudioFinal = process.argv[3] || path.join(ROOT, "audio", "narracao.mp3");
const outTimingsFinal = process.argv[4] || path.join(ROOT, "transcript", "kinetic-timings.json");
const outWordsFinal = path.join(ROOT, "transcript", "words.json");

async function synthScene(tts, text, outMp3, rate = 0.95) {
  const { audioStream, metadataStream } = tts.toStream(text, { rate });
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
  const raw = JSON.parse(fs.readFileSync(inputScenesFile, "utf-8"));
  const scenes = Array.isArray(raw) ? raw : raw.scenes || [];
  if (scenes.length === 0) throw new Error("Nenhuma cena encontrada em " + inputScenesFile);

  const voice = process.argv[5] || raw.voice || "pt-BR-AntonioNeural";
  const rate = voice.includes("Francisca") ? 0.9 : 0.95;

  const tmpDir = path.join(ROOT, "audio", "_tmp_kinetic_build");
  fs.mkdirSync(tmpDir, { recursive: true });

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
  });

  const silFile = path.join(tmpDir, "sil_0.22.mp3");
  execFileSync(
    FFMPEG,
    ["-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.22", "-b:a", "96k", silFile],
    { stdio: "ignore" }
  );

  console.log(`Gerando narração de ${scenes.length} cenas para Kinetic Shorts (${voice})...`);

  const listLines = [];
  const allWords = [];
  const timedScenes = [];
  let cursor = 0;

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const text = String(sc.narration || sc.text || sc.headline || "").trim();
    const segFile = path.join(tmpDir, `scene_${i}.mp3`);
    const info = await synthScene(tts, text || " ", segFile, rate);

    const startSec = Number(cursor.toFixed(3));
    const shiftedWords = info.words.map((w) => ({
      word: w.word,
      start: Number((cursor + w.start).toFixed(3)),
      end: Number((cursor + Math.min(info.duration, w.end)).toFixed(3)),
    }));
    allWords.push(...shiftedWords);

    listLines.push(`file '${segFile.replace(/\\/g, "/")}'`);
    cursor += info.duration;

    if (i < scenes.length - 1) {
      listLines.push(`file '${silFile.replace(/\\/g, "/")}'`);
      cursor += 0.22;
    }

    const endSec = Number(cursor.toFixed(3));
    timedScenes.push({
      ...sc,
      startSec,
      endSec,
      duration: Number((endSec - startSec).toFixed(3)),
      words: shiftedWords,
    });
  }

  const totalDuration = Number((cursor + 0.4).toFixed(3));
  const voiceMp3 = path.join(tmpDir, "voice_concat.mp3");
  const concatTxt = path.join(tmpDir, "concat.txt");
  fs.writeFileSync(concatTxt, listLines.join("\n"), "utf-8");
  execFileSync(
    FFMPEG,
    ["-y", "-f", "concat", "-safe", "0", "-i", concatTxt, "-c:a", "libmp3lame", "-b:a", "128k", voiceMp3],
    { stdio: "ignore" }
  );

  const ambientPath = fs.existsSync(path.join(ROOT, "audio", "ambient.mp3"))
    ? path.join(ROOT, "audio", "ambient.mp3")
    : path.join(ROOT, "templates", "kinetic-shorts", "ambient.mp3");

  fs.mkdirSync(path.dirname(outAudioFinal), { recursive: true });
  if (fs.existsSync(ambientPath)) {
    const fadeOutSt = Math.max(0, totalDuration - 1.2).toFixed(2);
    execFileSync(
      FFMPEG,
      [
        "-y",
        "-i",
        voiceMp3,
        "-stream_loop",
        "-1",
        "-i",
        ambientPath,
        "-filter_complex",
        `[0:a]aformat=sample_rates=44100:channel_layouts=stereo[v];[1:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:${totalDuration},afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeOutSt}:d=1.2,volume=0.18[amb];[v][amb]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[outa]`,
        "-map",
        "[outa]",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "128k",
        outAudioFinal,
      ],
      { stdio: "ignore" }
    );
  } else {
    fs.copyFileSync(voiceMp3, outAudioFinal);
  }

  const timingsPayload = {
    title: raw.title || "Documentário Kinetic Shorts",
    voice,
    totalDuration,
    scenes: timedScenes,
    words: allWords,
  };

  fs.mkdirSync(path.dirname(outTimingsFinal), { recursive: true });
  fs.writeFileSync(outTimingsFinal, JSON.stringify(timingsPayload, null, 2), "utf-8");
  fs.mkdirSync(path.dirname(outWordsFinal), { recursive: true });
  fs.writeFileSync(outWordsFinal, JSON.stringify(allWords, null, 2), "utf-8");

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`✅ Áudio Kinetic salvo em ${outAudioFinal} (${timedScenes.length} cenas, ${totalDuration}s, ${allWords.length} palavras)`);
}

main().catch((e) => {
  console.error("Erro em generate_kinetic_audio:", e);
  process.exit(1);
});
