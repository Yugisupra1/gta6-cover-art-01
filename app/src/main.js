// Vice Cover — wires the editor: pick photos, crop and position each panel,
// write the caption, choose a size and a grade, export the cover as a PNG.
// A `?shot=` query sets up a fixed scene for a screenshot (./shots.js).
import { drawCover, layout, SIZES, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const sizeSelect = document.getElementById('size');
const gradeSelect = document.getElementById('grade');
const zoomInput = document.getElementById('zoom');
const status = document.getElementById('status');
const panelButtons = [...document.querySelectorAll('[data-panel]')];

const state = {
  photos: [null, null, null],
  pans: [{ x: 0, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }],
  title: 'Vice City',
  subtitle: 'Sunset Heist',
  size: 'square',
  grade: 'sunset',
};
let selected = 0;

function resizeCanvas() {
  const s = SIZES[state.size];
  canvas.width = s.w;
  canvas.height = s.h;
}

function redraw() {
  resizeCanvas();
  state.title = titleInput.value;
  state.subtitle = subtitleInput.value;
  state.size = sizeSelect.value;
  state.grade = gradeSelect.value;
  drawCover(canvas, state);
  panelButtons.forEach((b, i) => b.classList.toggle('active', i === selected));
  zoomInput.value = state.pans[selected].zoom;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSample(name) {
  state.photos[selected] = await loadImage(`samples/${name}.jpg`);
  state.pans[selected] = { x: 0, y: 0, zoom: 1 };
  redraw();
}

document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  state.photos[selected] = await loadImage(URL.createObjectURL(file));
  state.pans[selected] = { x: 0, y: 0, zoom: 1 };
  redraw();
});

document.querySelectorAll('[data-sample]').forEach((b) => {
  b.addEventListener('click', () => loadSample(b.dataset.sample));
});

panelButtons.forEach((b, i) => {
  b.addEventListener('click', () => { selected = i; redraw(); });
});

[titleInput, subtitleInput].forEach((el) => el.addEventListener('input', redraw));
[sizeSelect, gradeSelect].forEach((el) => el.addEventListener('change', redraw));
zoomInput.addEventListener('input', () => {
  state.pans[selected].zoom = Number(zoomInput.value);
  redraw();
});

// Drag on the canvas pans the selected panel's photo.
let dragging = null;
function panelAt(cx, cy) {
  const r = canvas.getBoundingClientRect();
  const x = (cx - r.left) / r.width;
  const y = (cy - r.top) / r.height;
  const panels = layout(state.size);
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    if (x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) return i;
  }
  return -1;
}
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  selected = i;
  dragging = { x: e.clientX, y: e.clientY, pan: { ...state.pans[i] } };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const r = canvas.getBoundingClientRect();
  const pan = state.pans[selected];
  pan.x = dragging.pan.x + ((e.clientX - dragging.x) / r.width) * 2;
  pan.y = dragging.pan.y + ((e.clientY - dragging.y) / r.height) * 2;
  pan.x = Math.max(-1, Math.min(1, pan.x));
  pan.y = Math.max(-1, Math.min(1, pan.y));
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });

document.getElementById('export').addEventListener('click', () => {
  const s = SIZES[state.size];
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${s.w}x${s.h}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${s.w}x${s.h}.png`;
  }, 'image/png');
});

document.getElementById('sample-all').addEventListener('click', async () => {
  for (const [i, name] of ['pier', 'neon', 'palm'].entries()) {
    state.photos[i] = await loadImage(`samples/${name}.jpg`);
    state.pans[i] = { x: 0, y: 0, zoom: 1 };
  }
  redraw();
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (setup) => {
    for (const [i, name] of (setup.photos || []).entries()) {
      state.photos[i] = await loadImage(`samples/${name}.jpg`);
    }
    state.title = setup.title ?? state.title;
    state.subtitle = setup.subtitle ?? state.subtitle;
    state.size = setup.size ?? state.size;
    state.grade = setup.grade ?? state.grade;
    titleInput.value = state.title;
    subtitleInput.value = state.subtitle;
    sizeSelect.value = state.size;
    gradeSelect.value = state.grade;
    redraw();
  });
} else {
  redraw();
}
