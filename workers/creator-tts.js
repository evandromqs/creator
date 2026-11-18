const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const SEC_MS_GEC_VERSION = "2-143.0.3650.96";
const WSS_URL = "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
const EDGE_COPYRIGHT = "Copyright (C) Microsoft Corporation. All rights reserved.";

const SWAP_FIRST_WORD = { swappedWord: 0xEF0569FB, swappedSum: 0x76F50F34, swappedProduct: 0xC3EFEA97 };
const SWAP_SECOND_WORD = { swappedWord: 0xC31713DB, swappedSum: 0x1881CE3C, swappedProduct: 0x35BD1EC9 };
const MIX_FIRST_WORD = [0xCF98B111, 0x87085B9F, 0x12CEB96D, 0x257E1D83];
const MIX_SECOND_WORD = [0xA27416F5, 0xD38396FF, 0x7C932B89, 0xBFA49F69];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function swapHalves(value) {
  return ((value << 16) | (value >>> 16)) >>> 0;
}

function swapTerm(word, key, multipliers) {
  const sum = Math.imul(word, key) + Math.imul(swapHalves(word), multipliers.swappedWord);
  const product = Math.imul(swapHalves(sum), multipliers.swappedSum) >>> 0;
  return (Math.imul(swapHalves(product), multipliers.swappedProduct) + product) >>> 0;
}

function swapAndMultiply(value, multipliers) {
  for (const multiplier of multipliers) {
    value = Math.imul(swapHalves(value), multiplier) >>> 0;
  }
  return value;
}

function cs64(message, digest) {
  const digestView = new DataView(digest.buffer, digest.byteOffset, digest.byteLength);
  const firstKey = (digestView.getUint32(0, true) | 1) >>> 0;
  const secondKey = (digestView.getUint32(4, true) | 1) >>> 0;
  const padded = new Uint8Array(Math.ceil(message.length / 8) * 8);
  padded.set(message);
  const words = new DataView(padded.buffer);
  let swapSum = 0;
  let lastSwap = 0;
  let mix = 0;
  let mixSum = 0;
  for (let offset = 0; offset < padded.length; offset += 8) {
    const firstWord = words.getUint32(offset, true);
    const secondWord = words.getUint32(offset + 4, true);
    const firstSwap = swapTerm(firstWord, firstKey, SWAP_FIRST_WORD);
    lastSwap = swapTerm(secondWord, secondKey, SWAP_SECOND_WORD);
    swapSum = (swapSum + firstSwap + lastSwap) >>> 0;
    mix = swapAndMultiply(Math.imul(mix + firstWord, firstKey), MIX_FIRST_WORD);
    mixSum = (mixSum + mix) >>> 0;
    mix = swapAndMultiply(Math.imul(mix + secondWord, secondKey), MIX_SECOND_WORD);
    mixSum = (mixSum + mix) >>> 0;
  }
  const checksum = new Uint8Array(8);
  const checksumView = new DataView(checksum.buffer);
  checksumView.setUint32(0, lastSwap ^ mix, true);
  checksumView.setUint32(4, swapSum ^ mixSum, true);
  return checksum;
}

function toUpperHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

async function hashSecMsGecV2(ticksAndToken) {
  const message = new TextEncoder().encode(EDGE_COPYRIGHT + ticksAndToken);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", message));
  return `${toUpperHex(cs64(message, digest))}-${toUpperHex(digest)}`;
}

async function generateSecMsGec(clockOffsetMs = 0) {
  const ticks = Math.floor((Date.now() + clockOffsetMs) / 1000) + 11644473600;
  const rounded = ticks - (ticks % 300);
  const windowsTicks = rounded * 10000000;
  return hashSecMsGecV2(`${windowsTicks}${TRUSTED_CLIENT_TOKEN}`);
}

function randomHex(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function findSequence(haystack, needle) {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

const AUDIO_DELIM_BYTES = new TextEncoder().encode("Path:audio\r\n");

async function connectEdgeWs(clockOffsetMs = 0, retry = true) {
  const secMsGec = await generateSecMsGec(clockOffsetMs);
  const connId = crypto.randomUUID().replace(/-/g, "");
  const url = `${WSS_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connId}`;

  const resp = await fetch(url, {
    headers: {
      Upgrade: "websocket",
      Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
    },
  });

  if (resp.status !== 101 || !resp.webSocket) {
    const serverDateStr = resp.headers.get("Date");
    const serverTime = serverDateStr ? Date.parse(serverDateStr) : NaN;
    if (retry && resp.status === 403 && Number.isFinite(serverTime)) {
      return connectEdgeWs(serverTime - Date.now(), false);
    }
    const errText = await resp.text().catch(() => "");
    throw new Error(`Edge TTS handshake falhou: HTTP ${resp.status} ${errText}`.trim());
  }

  return resp.webSocket;
}

async function synthesizeMp3(text, voice = "pt-BR-FranciscaNeural", rate = "0.9") {
  const ws = await connectEdgeWs();
  ws.accept();

  const requestId = randomHex(16);
  const voiceLangMatch = /\b[a-z]{2,}-[A-Z]{2}\b/.exec(voice);
  const lang = voiceLangMatch ? voiceLangMatch[0] : "pt-BR";

  const chunks = [];
  let totalBytes = 0;

  const audioPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error("Timeout na síntese Edge TTS"));
    }, 25000);

    ws.addEventListener("message", (event) => {
      if (typeof event.data === "string") {
        if (event.data.includes("Path:turn.end")) {
          clearTimeout(timer);
          try { ws.close(1000, "done"); } catch {}
          resolve();
        }
        return;
      }

      if (event.data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(event.data);
        const idx = findSequence(bytes, AUDIO_DELIM_BYTES);
        if (idx !== -1) {
          const audioPart = bytes.subarray(idx + AUDIO_DELIM_BYTES.length);
          if (audioPart.length > 0) {
            chunks.push(audioPart);
            totalBytes += audioPart.length;
          }
        }
      }
    });

    ws.addEventListener("close", () => {
      clearTimeout(timer);
      resolve();
    });

    ws.addEventListener("error", (err) => {
      clearTimeout(timer);
      reject(new Error(err?.message || "Erro no WebSocket Edge TTS"));
    });
  });

  const configMsg =
    `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
    JSON.stringify({
      context: {
        synthesis: {
          audio: {
            metadataoptions: {
              sentenceBoundaryEnabled: "false",
              wordBoundaryEnabled: "false",
            },
            outputFormat: "audio-24khz-96kbitrate-mono-mp3",
          },
        },
      },
    });
  ws.send(configMsg);

  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}"><voice name="${escapeXml(voice)}"><prosody pitch="+0Hz" rate="${escapeXml(rate)}" volume="100.0">${escapeXml(text)}</prosody></voice></speak>`;
  const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
  ws.send(ssmlMsg);

  await audioPromise;

  const out = new Uint8Array(totalBytes);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, service: "creator-tts" }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (url.pathname !== "/tts" && url.pathname !== "/") {
      return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    }

    try {
      let text = url.searchParams.get("text") || "";
      let voice = url.searchParams.get("voice") || "pt-BR-FranciscaNeural";
      let rate = url.searchParams.get("rate") || "0.9";

      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (body.text) text = String(body.text);
        if (body.voice) voice = String(body.voice);
        if (body.rate !== undefined) rate = String(body.rate);
      }

      text = text.trim();
      if (!text) {
        return new Response(JSON.stringify({ error: "Parâmetro 'text' obrigatório." }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const mp3Bytes = await synthesizeMp3(text, voice, rate);
      if (mp3Bytes.length === 0) {
        return new Response(JSON.stringify({ error: "Nenhum áudio retornado pelo Edge TTS." }), {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      return new Response(mp3Bytes, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  },
};
