#!/usr/bin/env node
/**
 * Cliente CLI para se conectar ao servidor temporário do Google Colab via Cloudflare Tunnel.
 * Uso:
 *   node scripts/colab_client.cjs --url=https://xxx.trycloudflare.com --health
 *   node scripts/colab_client.cjs --url=https://xxx.trycloudflare.com --transcribe=audio/narracao.mp3 --out=transcript/whisper.json
 *   node scripts/colab_client.cjs --url=https://xxx.trycloudflare.com --image="futuristic neon studio" --out=assets/test-flux.png
 *   node scripts/colab_client.cjs --url=https://xxx.trycloudflare.com --tts="Olá! Bem-vindo ao Creator Studio." --out=audio/test-xtts.wav
 *   node scripts/colab_client.cjs --url=https://xxx.trycloudflare.com --shutdown
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {};
  for (const item of argv.slice(2)) {
    if (item.startsWith('--')) {
      const [key, ...rest] = item.slice(2).split('=');
      args[key] = rest.length ? rest.join('=') : true;
    }
  }
  return args;
}

async function checkHealth(baseUrl) {
  const res = await fetch(`${baseUrl}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  console.log('✅ Colab GPU Server:', JSON.stringify(data, null, 2));
}

async function transcribeFile(baseUrl, audioPath, outPath, language = 'pt') {
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Arquivo de áudio não encontrado: ${audioPath}`);
  }

  const form = new FormData();
  const buffer = fs.readFileSync(audioPath);
  form.append('file', new Blob([buffer]), path.basename(audioPath));
  form.append('language', language);

  console.log(`⏳ Enviando ${audioPath} para Whisper large-v3 no Colab...`);
  const res = await fetch(`${baseUrl}/transcribe`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const target = outPath || path.join('transcript', `${path.parse(audioPath).name}-whisper.json`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Transcrição salva em ${target} (${data.words?.length || 0} palavras, ${data.duration}s)`);
}

async function generateImage(baseUrl, prompt, outPath) {
  const form = new FormData();
  form.append('prompt', prompt);

  console.log(`⏳ Enviando tarefa de imagem (Qwen-Image) para o Colab...`);
  const res = await fetch(`${baseUrl}/image`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  const { job_id } = await res.json();
  console.log(`🔄 Job ${job_id} na fila. Aguardando GPU...`);

  while (true) {
    await new Promise((r) => setTimeout(r, 5000));
    const poll = await fetch(`${baseUrl}/jobs/${job_id}`);
    const contentType = poll.headers.get('content-type') || '';

    if (contentType.includes('image/png')) {
      const buf = Buffer.from(await poll.arrayBuffer());
      const target = outPath || path.join('assets', 'qwen-test.png');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, buf);
      console.log(`✅ Imagem salva em ${target} (${(buf.length / 1024).toFixed(1)} KB)`);
      return;
    }

    if (!poll.ok) {
      throw new Error(`HTTP ${poll.status}: ${await poll.text()}`);
    }
  }
}

async function generateTTS(baseUrl, text, outPath, language = 'pt') {
  const form = new FormData();
  form.append('text', text);
  form.append('language', language);

  console.log(`⏳ Gerando áudio com XTTS-v2 no Colab...`);
  const res = await fetch(`${baseUrl}/tts`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const target = outPath || path.join('audio', 'xtts-test.wav');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buf);
  console.log(`✅ Áudio salvo em ${target} (${(buf.length / 1024).toFixed(1)} KB)`);
}

async function shutdownServer(baseUrl) {
  const res = await fetch(`${baseUrl}/shutdown`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  console.log('🛑 Comando de desligamento enviado ao Colab (runtime.unassign).');
}

async function main() {
  const args = parseArgs(process.argv);
  const baseUrl = (args.url || process.env.COLAB_URL || '').replace(/\/+$/, '');

  if (!baseUrl) {
    console.error('Uso: node scripts/colab_client.cjs --url=https://xxx.trycloudflare.com [--health | --transcribe=... | --image="..." | --tts="..." | --shutdown]');
    process.exit(1);
  }

  if (args.shutdown) {
    await shutdownServer(baseUrl);
  } else if (args.transcribe) {
    await transcribeFile(baseUrl, args.transcribe, args.out, args.lang || 'pt');
  } else if (args.image) {
    await generateImage(baseUrl, args.image, args.out);
  } else if (args.tts) {
    await generateTTS(baseUrl, args.tts, args.out, args.lang || 'pt');
  } else {
    await checkHealth(baseUrl);
  }
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
