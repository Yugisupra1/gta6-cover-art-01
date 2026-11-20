// Vice Cover — the drawing engine.
//
// A cover is three photo panels in a GTA-poster layout plus a bold title
// and a subtitle, over a sunset / neon / noir colour grade. Everything is
// drawn on one canvas so the export is exactly what the preview shows.
//
// state:
//   photos: [Image|null, Image|null, Image|null]  one per panel
//   pans:   [{x, y, zoom}, ...]                   per-panel crop offset (-1..1) and zoom (>=1)
//   title, subtitle: strings
//   size: 'square' | 'portrait' | 'landscape'
//   grade: 'sunset' | 'neon' | 'noir'

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  landscape: { w: 1920, h: 1080, label: '1920 x 1080' },
};

export const GRADES = {
  sunset: {
    sky: ['#2b1055', '#7597de'],
    tint: ['rgba(255, 122, 26, 0)', 'rgba(255, 45, 120, 0.55)'],
    band: '#1c0b2e',
    accent: '#ffb347',
  },
  neon: {
    sky: ['#0d0221', '#3b0f66'],
    tint: ['rgba(0, 229, 255, 0)', 'rgba(255, 0, 128, 0.5)'],
    band: '#12042b',
    accent: '#00e5ff',
  },
  noir: {
    sky: ['#101014', '#2a2a33'],
    tint: ['rgba(255, 255, 255, 0)', 'rgba(0, 0, 0, 0.55)'],
    band: '#0c0c10',
    accent: '#e8e8e8',
  },
};

// Panel rectangles (fractions of the canvas) for each size.
// panels[0] is the hero, panels[1] and panels[2] the two small ones.
export function layout(size) {
  if (size === 'portrait') {
    return [
      { x: 0, y: 0, w: 1, h: 0.52 },
      { x: 0, y: 0.52, w: 0.5, h: 0.28 },
      { x: 0.5, y: 0.52, w: 0.5, h: 0.28 },
    ];
  }
  if (size === 'landscape') {
    return [
      { x: 0, y: 0, w: 0.6, h: 1 },
      { x: 0.6, y: 0, w: 0.4, h: 0.5 },
      { x: 0.6, y: 0.5, w: 0.4, h: 0.5 },
    ];
  }
  return [
    { x: 0, y: 0, w: 1, h: 0.58 },
    { x: 0, y: 0.58, w: 0.5, h: 0.42 },
    { x: 0.5, y: 0.58, w: 0.5, h: 0.42 },
  ];
}

// Where the title band sits (fractions). Portrait gets a solid band at the
// foot; square and landscape overlay the title on the hero's foot.
export function titleBand(size) {
  if (size === 'portrait') return { x: 0, y: 0.8, w: 1, h: 0.2, solid: true };
  if (size === 'landscape') return { x: 0, y: 0.72, w: 0.6, h: 0.28, solid: false };
  return { x: 0, y: 0.4, w: 1, h: 0.18, solid: false };
}

function drawPhoto(ctx, photo, rect, pan) {
  if (!photo) return false;
  const pw = photo.naturalWidth;
  const ph = photo.naturalHeight;
  // Cover-fit the panel, then apply the pan offset and zoom on top.
  const scale = Math.max(rect.w / pw, rect.h / ph) * (pan.zoom || 1);
  const dw = pw * scale;
  const dh = ph * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (pan.x || 0) * rect.w * 0.3;
  const dy = rect.y + (rect.h - dh) / 2 + (pan.y || 0) * rect.h * 0.3;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
  return true;
}

function drawPanelGap(ctx, rect, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

function fitFont(ctx, text, maxW, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", "DejaVu Sans", sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = `900 ${size}px "Arial Black", "DejaVu Sans", sans-serif`;
  }
  return size;
}

/** Draws the whole cover onto `canvas` (its width/height must match the size). */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const panels = layout(state.size).map((p) => ({
    x: p.x * w, y: p.y * h, w: p.w * w, h: p.h * h,
  }));

  // Sky background (shows where no photo is loaded).
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(1, grade.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sun disc behind the hero, low on the horizon.
  const sunX = w * 0.72;
  const sunY = panels[0].y + panels[0].h * 0.62;
  const sunR = Math.min(w, h) * 0.16;
  const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
  sun.addColorStop(0, 'rgba(255, 214, 130, 0.95)');
  sun.addColorStop(0.6, 'rgba(255, 120, 60, 0.55)');
  sun.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  // Panels.
  let anyPhoto = false;
  panels.forEach((rect, i) => {
    const photo = state.photos[i];
    const pan = state.pans[i] || { x: 0, y: 0, zoom: 1 };
    if (drawPhoto(ctx, photo, rect, pan)) anyPhoto = true;
    drawPanelGap(ctx, rect, w, h);
  });

  // Colour grade over the whole cover.
  const tint = ctx.createLinearGradient(0, h * 0.3, 0, h);
  tint.addColorStop(0, grade.tint[0]);
  tint.addColorStop(1, grade.tint[1]);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);

  if (!anyPhoto) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `600 ${Math.round(h * 0.022)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Load a photo to start your cover', w / 2, h * 0.5);
  }

  // Title band.
  const band = titleBand(state.size);
  const bx = band.x * w, by = band.y * h, bw = band.w * w, bh = band.h * h;
  if (band.solid) {
    ctx.fillStyle = grade.band;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(bx, by, bw, Math.max(4, h * 0.006));
  }

  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (title) {
    const size = fitFont(ctx, title, bw * 0.92, bh * 0.52);
    const ty = by + bh * (band.solid ? 0.52 : 0.72);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = Math.max(4, size * 0.14);
    ctx.strokeText(title, bx + bw / 2, ty);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, bx + bw / 2, ty);
    if (subtitle) {
      const subSize = Math.max(14, size * 0.32);
      ctx.font = `700 ${subSize}px sans-serif`;
      ctx.fillStyle = grade.accent;
      ctx.fillText(subtitle.toUpperCase(), bx + bw / 2, ty + subSize * 1.6);
    }
  }
}
