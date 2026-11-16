// Gera áudio + timestamps palavra por palavra usando Edge TTS (gratuito, sem API key)
// Uso: node scripts/generate_audio_edgetts.cjs [voz] [entrada.txt] [saida.mp3] [words.json]
const fs = require("fs");
const path = require("path");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const ROOT = path.resolve(__dirname, "..");
const voice = process.argv[2] || "pt-BR-AntonioNeural";
const inputTxt = process.argv[3] || path.join(ROOT, "audio", "roteiro.txt");
const outAudio = process.argv[4] || path.join(ROOT, "audio", "narracao-edgetts.mp3");
const outWords = process.argv[5] || path.join(ROOT, "transcript", "words-edgetts.json");

async function main() {
  const text = fs.readFileSync(inputTxt, "utf-8").trim();
  if (!text) {
    console.error("Roteiro vazio em:", inputTxt);
    process.exit(1);
  }

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
  });

  const { audioStream, metadataStream } = tts.toStream(text);
  const chunks = [];
  const boundaries = [];

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
            boundaries.push({
              word: item.Data.text.Text,
              start,
              end: Number((start + dur).toFixed(3)),
            });
          }
        }
      } catch {}
    });
  }

  await new Promise((resolve, reject) => {
    audioStream.on("end", resolve);
    audioStream.on("error", reject);
  });

  fs.mkdirSync(path.dirname(outAudio), { recursive: true });
  fs.writeFileSync(outAudio, Buffer.concat(chunks));
  console.log("Áudio Edge TTS salvo em:", outAudio);

  if (boundaries.length > 0) {
    fs.mkdirSync(path.dirname(outWords), { recursive: true });
    fs.writeFileSync(outWords, JSON.stringify(boundaries, null, 2), "utf-8");
    console.log(`Timestamps salvos em: ${outWords} (${boundaries.length} palavras, ${boundaries[boundaries.length - 1].end}s)`);
  } else {
    console.log("Aviso: nenhum WordBoundary retornado pelo stream.");
  }
}

main().catch((err) => {
  console.error("Erro Edge TTS:", err);
  process.exit(1);
});
