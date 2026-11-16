// Gera áudio + timestamps palavra por palavra usando ElevenLabs v3 (/with-timestamps)
// Uso: node scripts/generate_audio_elevenlabs.cjs [roteiro.txt] [audio_out.mp3] [words_out.json]
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");

// Carrega variáveis do .env local ou do sistema
const envFiles = [
  path.join(ROOT, ".env"),
  "C:\\Users\\evand\\projects\\videomaketool\\.env.local",
  "C:\\Users\\evand\\projects\\video-moises\\.env",
];
for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("ERRO: ELEVENLABS_API_KEY não definida no arquivo .env nem nas variáveis de ambiente!");
  process.exit(1);
}

const inputTxt = process.argv[2] || path.join(ROOT, "audio", "roteiro.txt");
const audioOut = process.argv[3] || path.join(ROOT, "audio", "narracao.mp3");
const wordsOut = process.argv[4] || path.join(ROOT, "transcript", "words.json");

if (!fs.existsSync(inputTxt)) {
  console.error("Arquivo de roteiro não encontrado:", inputTxt);
  process.exit(1);
}

const text = fs.readFileSync(inputTxt, "utf-8").trim();
if (!text) {
  console.error("Roteiro vazio em:", inputTxt);
  process.exit(1);
}

const voiceId = process.env.ELEVENLABS_VOICE_ID || "Qrdut83w0Cr152Yb4Xn3"; // Paulo Radames (pt-BR)
const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_v3";

const payload = JSON.stringify({
  text,
  model_id: modelId,
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.8,
    use_speaker_boost: true,
  },
});

function alignmentToWords(alignment) {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  const words = [];
  let cur = "";
  let wStart = null;
  let wEnd = null;

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    const st = character_start_times_seconds[i];
    const en = character_end_times_seconds[i];
    if (/\s/.test(ch)) {
      if (cur) {
        words.push({ word: cur, start: Number(wStart.toFixed(3)), end: Number(wEnd.toFixed(3)) });
        cur = "";
        wStart = null;
        wEnd = null;
      }
    } else {
      if (!cur) wStart = st;
      cur += ch;
      wEnd = en;
    }
  }
  if (cur) {
    words.push({ word: cur, start: Number(wStart.toFixed(3)), end: Number(wEnd.toFixed(3)) });
  }
  return words;
}

const options = {
  hostname: "api.elevenlabs.io",
  path: `/v1/text-to-speech/${voiceId}/with-timestamps`,
  method: "POST",
  headers: {
    "xi-api-key": apiKey,
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json",
    "Content-Length": Buffer.byteLength(payload),
  },
};

console.log(`Gerando áudio via ElevenLabs (${modelId})...`);

const req = https.request(options, (res) => {
  let body = "";
  res.on("data", (d) => (body += d));
  res.on("end", () => {
    if (res.statusCode !== 200) {
      console.error("Erro na API ElevenLabs:", res.statusCode, body);
      process.exit(1);
    }

    const data = JSON.parse(body);
    if (!data.audio_base64) {
      console.error("Resposta sem audio_base64:", Object.keys(data));
      process.exit(1);
    }

    fs.mkdirSync(path.dirname(audioOut), { recursive: true });
    fs.writeFileSync(audioOut, Buffer.from(data.audio_base64, "base64"));
    console.log("✅ Áudio salvo em:", audioOut);

    if (data.alignment) {
      const words = alignmentToWords(data.alignment);
      fs.mkdirSync(path.dirname(wordsOut), { recursive: true });
      fs.writeFileSync(wordsOut, JSON.stringify(words, null, 2), "utf-8");
      const dur = words.length ? words[words.length - 1].end : 0;
      console.log(`✅ Timestamps salvos em: ${wordsOut} (${words.length} palavras, ${dur}s)`);
    }
  });
});

req.on("error", (e) => {
  console.error("Erro na requisição ElevenLabs:", e.message);
  process.exit(1);
});

req.write(payload);
req.end();
