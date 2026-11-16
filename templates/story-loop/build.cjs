// Story Loop Template (Hyperframes) — Histórias narrativas com loop infinito perfeito
const fs = require("fs");
const path = require("path");
const kit = require("../../lib/kit.cjs");

const ROOT = __dirname;
const story = JSON.parse(fs.readFileSync(path.join(ROOT, "story.json"), "utf-8"));
const TOTAL = story.scenes[story.scenes.length - 1].end;

const rng = kit.createRng(42);
const { js, sets, T, S } = kit.createTimelineCollector();

const bgHtml = kit.buildAtmosphere({
  T,
  rng,
  totalDuration: TOTAL,
  blobColors: ["#4f46e5", "#7c3aed", "#2563eb", "#db2777"],
  tints: [
    { at: 0, color: "rgba(15, 23, 42, 0.85)" },
    { at: 6, color: "rgba(30, 27, 75, 0.85)" },
    { at: 13, color: "rgba(88, 28, 135, 0.85)" },
  ],
});

const scenesHtml = story.scenes
  .map((s, idx) => {
    const dur = s.end - s.start;
    if (idx > 0) {
      S(`gsap.set("#${s.id}", { opacity: 0, scale: 0.95 });`);
      T(`tl.to("#${s.id}", { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }, ${s.start});`);
    }
    T(`tl.to("#${s.id}", { opacity: 0, scale: 1.05, duration: 0.5, ease: "power2.in" }, ${s.end - 0.5});`);

    return `
  <div id="${s.id}" class="scene clip" data-start="${s.start}" data-duration="${dur}">
    <div class="cam" id="cam-${s.id}">
      <div class="eyebrow">${s.eyebrow}</div>
      <div class="huge anton center title">${s.title}</div>
      <div class="story-card">
        <p>${s.text}</p>
      </div>
    </div>
  </div>`;
  })
  .join("\n");

const html = kit.renderHtml({
  title: story.title,
  totalDuration: TOTAL,
  narrationDuration: TOTAL,
  bgHtml,
  scenesHtml,
  subsHtml: "",
  sets,
  js,
});

fs.writeFileSync(path.join(ROOT, "index.html"), html, "utf-8");
console.log(`Story-loop index.html gerado: ${TOTAL}s`);
