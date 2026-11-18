const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const PORT = process.env.PORT || 3456;
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_HTML = path.join(ROOT, 'public', 'index.html');
const ROOT_INDEX = path.join(ROOT, 'index.html');
const QUIZ_JSON = path.join(ROOT, 'templates', 'quiz-mobile', 'quiz3-francisca.json');
const PREVIEW_JSON = path.join(ROOT, 'audio', 'preview-quiz.json');
const QUIZ_MP3 = path.join(ROOT, 'audio', 'quiz-mix.mp3');
const QUIZ_TIMINGS = path.join(ROOT, 'transcript', 'quiz-timings.json');
const TTS_SCRIPT = path.join(ROOT, 'scripts', 'generate_quiz_audio.cjs');
const BUILD_SCRIPT = path.join(ROOT, 'scripts', 'build.cjs');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2e6) {
        req.destroy();
        reject(new Error('Payload muito grande.'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function execNode(args) {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, args, { cwd: ROOT }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout || err.message));
      resolve(stdout);
    });
  });
}

function serveStaticFile(req, res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    return res.end('Not Found');
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  if (range && (ext === '.mp3' || ext === '.wav' || ext === '.mp4')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(filePath).pipe(res);
}

const PREVIEW_PLAYER_SNIPPET = `
<style>
  html, body {
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    background: #05080f !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    overflow: hidden !important;
  }
  #__studio_controls {
    position: fixed;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99999;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(15, 23, 42, 0.92);
    border: 1px solid rgba(99, 102, 241, 0.5);
    padding: 8px 14px;
    border-radius: 999px;
    color: #f8fafc;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  }
  #__studio_controls button {
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 5px 12px;
    font-weight: 700;
    cursor: pointer;
    font-size: 12px;
  }
  #__studio_controls button.sec {
    background: #334155;
  }
  #__studio_time {
    font-variant-numeric: tabular-nums;
    color: #cbd5e1;
    min-width: 86px;
    text-align: center;
  }
</style>
<div id="__studio_controls">
  <button id="__studio_play" type="button">▶ Play</button>
  <button id="__studio_restart" class="sec" type="button">↺</button>
  <span id="__studio_time">0.0s / 0.0s</span>
</div>
<script>
(function() {
  const root = document.getElementById('root');
  function fitRoot() {
    if (!root) return;
    const w = parseInt(root.dataset.width || '1080', 10);
    const h = parseInt(root.dataset.height || '1920', 10);
    const scale = Math.min(window.innerWidth / w, window.innerHeight / h);
    root.style.transformOrigin = 'center center';
    root.style.transform = 'scale(' + scale + ')';
    root.style.flexShrink = '0';
  }
  window.addEventListener('resize', fitRoot);
  fitRoot();

  const tl = window.__timelines && window.__timelines.main;
  const audio = document.getElementById('audio-narration');
  const ambient = document.getElementById('audio-ambient');
  const playBtn = document.getElementById('__studio_play');
  const restartBtn = document.getElementById('__studio_restart');
  const timeEl = document.getElementById('__studio_time');

  if (!tl) return;
  const total = tl.duration();
  let playing = false;
  let rafId = null;

  function fmt(t) { return t.toFixed(1) + 's'; }
  function updateLabel(t) {
    timeEl.textContent = fmt(t) + ' / ' + fmt(total);
  }
  updateLabel(0);

  function syncLoop() {
    if (!playing) return;
    if (audio) {
      const t = audio.currentTime;
      tl.time(Math.min(t, total));
      updateLabel(t);
      if (audio.ended || t >= total) {
        stopPlayback();
        return;
      }
    } else {
      updateLabel(tl.time());
      if (tl.time() >= total) {
        stopPlayback();
        return;
      }
    }
    rafId = requestAnimationFrame(syncLoop);
  }

  function startPlayback() {
    playing = true;
    playBtn.textContent = '⏸ Pause';
    const hint = document.getElementById('play-hint');
    if (hint) hint.style.display = 'none';
    if (audio) {
      if (audio.currentTime >= total) audio.currentTime = 0;
      audio.play().catch(() => {});
      if (ambient) {
        ambient.volume = parseFloat(ambient.dataset.volume || '0.2');
        ambient.currentTime = audio.currentTime;
        ambient.play().catch(() => {});
      }
    } else {
      tl.play();
    }
    rafId = requestAnimationFrame(syncLoop);
  }

  function stopPlayback() {
    playing = false;
    playBtn.textContent = '▶ Play';
    if (rafId) cancelAnimationFrame(rafId);
    if (audio) audio.pause();
    if (ambient) ambient.pause();
    tl.pause();
  }

  playBtn.addEventListener('click', () => {
    if (playing) stopPlayback();
    else startPlayback();
  });

  restartBtn.addEventListener('click', () => {
    stopPlayback();
    if (audio) audio.currentTime = 0;
    if (ambient) ambient.currentTime = 0;
    tl.time(0);
    updateLabel(0);
    startPlayback();
  });
})();
</script>
`;

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  if (req.method === 'GET' && (urlPath === '/' || urlPath === '/index.html')) {
    return serveStaticFile(req, res, PUBLIC_HTML);
  }

  if (req.method === 'GET' && urlPath === '/preview-video') {
    if (!fs.existsSync(ROOT_INDEX)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('index.html ainda não foi compilado. Execute um build primeiro.');
    }
    let html = fs.readFileSync(ROOT_INDEX, 'utf8');
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${PREVIEW_PLAYER_SNIPPET}\n</body>`);
    } else {
      html += PREVIEW_PLAYER_SNIPPET;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(html);
  }

  if (req.method === 'GET' && urlPath === '/api/preview-audio.mp3') {
    return serveStaticFile(req, res, QUIZ_MP3);
  }

  if (
    req.method === 'GET' &&
    (urlPath.startsWith('/assets/') ||
      urlPath.startsWith('/audio/') ||
      urlPath.startsWith('/templates/') ||
      urlPath.startsWith('/transcript/'))
  ) {
    const resolved = path.resolve(ROOT, '.' + urlPath);
    if (!resolved.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    return serveStaticFile(req, res, resolved);
  }

  if (req.method === 'POST' && urlPath === '/api/preview-audio') {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      const theme = parsed.theme || 'roxo';
      const category = parsed.category || '';

      if (!Array.isArray(questions) || questions.length === 0) {
        return sendJson(res, 400, { error: 'JSON de perguntas inválido.' });
      }

      fs.mkdirSync(path.dirname(QUIZ_JSON), { recursive: true });
      fs.mkdirSync(path.dirname(PREVIEW_JSON), { recursive: true });
      fs.mkdirSync(path.dirname(QUIZ_TIMINGS), { recursive: true });
      const payloadStr = JSON.stringify(questions, null, 2);
      fs.writeFileSync(QUIZ_JSON, payloadStr, 'utf8');
      fs.writeFileSync(PREVIEW_JSON, payloadStr, 'utf8');

      await execNode([TTS_SCRIPT, QUIZ_JSON, QUIZ_MP3, QUIZ_TIMINGS]);

      const buildArgs = [BUILD_SCRIPT, '--template=quiz-mobile', `--theme=${theme}`];
      if (category) buildArgs.push(`--category=${category}`);
      await execNode(buildArgs);

      const stamp = Date.now();
      return sendJson(res, 200, {
        ok: true,
        audioUrl: `/audio/quiz-mix.mp3?t=${stamp}`,
        videoPreviewUrl: `/preview-video?t=${stamp}`,
      });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  if (req.method === 'POST' && urlPath === '/api/compile') {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      const template = parsed.template || 'quiz-mobile';
      const theme = parsed.theme || 'roxo';
      const category = parsed.category || '';

      if (template === 'quiz-mobile' && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        fs.writeFileSync(QUIZ_JSON, JSON.stringify(parsed.questions, null, 2), 'utf8');
      } else if (typeof parsed.scriptText === 'string' && parsed.scriptText.trim()) {
        fs.mkdirSync(path.join(ROOT, 'audio'), { recursive: true });
        fs.writeFileSync(path.join(ROOT, 'audio', 'roteiro.txt'), parsed.scriptText.trim(), 'utf8');
      }

      const buildArgs = [BUILD_SCRIPT, `--template=${template}`, `--theme=${theme}`];
      if (category) buildArgs.push(`--category=${category}`);
      await execNode(buildArgs);

      return sendJson(res, 200, {
        ok: true,
        videoPreviewUrl: `/preview-video?t=${Date.now()}`,
      });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🎬 Creator Studio (Local) rodando em: http://127.0.0.1:${PORT}`);
  console.log('   Pressione Ctrl+C para encerrar.\n');
});
