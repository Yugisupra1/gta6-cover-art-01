// Vice Cover — the cover drawing engine.
//
// Everything here is plain 2D canvas: a gradient sky with a low sun, three
// photo panels separated by white gaps, a colour grade washed over the
// whole poster, and a bold outlined title. No image assets are needed for
// the frame itself — only the photos the user loads into the panels.
//
// Coordinates: layout() returns panel rects in 0..1 space (fractions of
// the canvas), so the same layout works for every export size.

export const SIZES = {
  square: { w: 1080, h: 1080 },
  portrait: { w: 1080, h: 1350 },
  landscape: { w: 1920, h: 1080 },
};

export const GRADES = {
  sunset: {
    sky: ['#2b1055', '#b13a7d', '#ff7a1a'],
    sun: '#ffd166',
    tint: 'rgba(255, 122, 26, 0.14)',
    band: '#1d0f2e',
  },
  neon: {
    sky: ['#0b0620', '#3b1d8f', '#ff2e88'],
    sun: '#39e6ff',
    tint: 'rgba(255, 46, 136, 0.16)',
    band: '#120826',
  },
  noir: {
    sky: ['#0d0d0f', '#2e2e35', '#5c5c68'],
    sun: '#e8e8ec',
    tint: 'rgba(10, 10, 14, 0.22)',
    band: '#101014',
  },
};

const GAP = 0.012; // white gap between panels, as a fraction of the width

/** Panel rects for a size: [hero, small top/right, small bottom/right].
 *  Portrait reserves a solid band at the foot for the title; square and
 *  landscape overlay the title on the hero panel instead. */
export function layout(size) {
  if (size === 'portrait') {
    const bandH = 0.20;
    const photoH = 1 - bandH;
    const heroH = photoH * 0.62;
    const smallH = photoH - heroH - GAP;
    return [
      { x: 0, y: 0, w: 1, h: heroH },
      { x: 0, y: heroH + GAP, w: 0.5 - GAP / 2, h: smallH },
      { x: 0.5 + GAP / 2, y: heroH + GAP, w: 0.5 - GAP / 2, h: smallH },
      { x: 0, y: photoH, w: 1, h: bandH, band: true },
    ];
  }
  if (size === 'landscape') {
    const heroW = 0.56;
    const smallW = 1 - heroW - GAP;
    const smallH = 0.5 - GAP / 2;
    return [
      { x: 0, y: 0, w: heroW, h: 1 },
      { x: heroW + GAP, y: 0, w: smallW, h: smallH },
      { x: heroW + GAP, y: 0.5 + GAP / 2, w: smallW, h: smallH },
    ];
  }
  // square
  const heroW = 0.60;
  const smallW = 1 - heroW - GAP;
  const smallH = 0.5 - GAP / 2;
  return [
    { x: 0, y: 0, w: heroW, h: 1 },
    { x: heroW + GAP, y: 0, w: smallW, h: smallH },
    { x: heroW + GAP, y: 0.5 + GAP / 2, w: smallW, h: smallH },
  ];
}

/** Draws one photo cover-fitting its panel, shifted by pan and zoomed. */
function drawPhoto(ctx, photo, rect, pan, W, H) {
  if (!photo) return false;
  const px = rect.x * W;
  const py = rect.y * H;
  const pw = rect.w * W;
  const ph = rect.h * H;
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  // Cover-fit first, then pan (in panel fractions) and zoom around the centre.
  // The pan is capped at +/-1 by the editor, so the photo always covers.
  const scale = Math.max(pw / iw, ph / ih) * (pan.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = px + (pw - dw) / 2 + (pan.x || 0) * pw * 0.5;
  const dy = py + (ph - dh) / 2 + (pan.y || 0) * ph * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
  return true;
}

function drawSky(ctx, grade, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, grade.sky[0]);
  g.addColorStop(0.55, grade.sky[1]);
  g.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Low sun disc, centred on the hero panel's upper half. It sits high
  // enough that it never pokes below the hero into the panel gaps.
  const sunR = Math.min(W, H) * 0.13;
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(W * 0.3, H * 0.30, sunR, 0, Math.PI * 2);
  ctx.fill();
}

function drawTitle(ctx, text, sub, x, y, maxW, size, accent) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const titlePx = Math.round(size * 0.115);
  ctx.font = `900 ${titlePx}px "Arial Black", "DejaVu Sans", sans-serif`;
  ctx.lineWidth = Math.max(2, titlePx * 0.10);
  ctx.strokeStyle = '#111';
  ctx.fillStyle = '#fff';
  const upper = (text || '').toUpperCase();
  ctx.strokeText(upper, x, y, maxW);
  ctx.fillText(upper, x, y, maxW);
  if (sub) {
    const subPx = Math.round(size * 0.038);
    ctx.font = `700 ${subPx}px "Arial Black", "DejaVu Sans", sans-serif`;
    ctx.lineWidth = Math.max(1.5, subPx * 0.10);
    ctx.strokeStyle = '#111';
    ctx.fillStyle = accent;
    ctx.strokeText(sub, x, y + subPx * 1.7, maxW);
    ctx.fillText(sub, x, y + subPx * 1.7, maxW);
  }
}

/** Renders the whole cover onto the canvas. state: { photos, pans, title,
 *  subtitle, size, grade }. Photos are HTMLImageElements (or null). */
export function drawCover(canvas, state) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.sunset;
  const panels = layout(state.size);

  const band = panels.find((p) => p.band);
  const photoPanels = panels.filter((p) => !p.band);

  // White page behind everything: it shows as the thin gaps between panels.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // Sky only inside the photo panels: clip to their union so the gradient
  // and the sun never bleed into the white gaps between panels.
  ctx.save();
  ctx.beginPath();
  for (const p of photoPanels) ctx.rect(p.x * W, p.y * H, p.w * W, p.h * H);
  ctx.clip();
  drawSky(ctx, grade, W, H);
  ctx.restore();

  for (let i = 0; i < photoPanels.length; i++) {
    const p = photoPanels[i];
    const inset = GAP * W * 0.5;
    const rect = {
      x: p.x + inset / W,
      y: p.y + inset / H,
      w: p.w - (2 * inset) / W,
      h: p.h - (2 * inset) / H,
    };
    const filled = drawPhoto(ctx, state.photos[i], rect, state.pans[i] || { x: 0, y: 0, zoom: 1 }, W, H);
    if (!filled) {
      // Empty panel: keep the sky showing through as a placeholder.
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(rect.x * W, rect.y * H, rect.w * W, rect.h * H);
    }
  }

  // Colour grade wash over everything.
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, W, H);

  if (band) {
    ctx.fillStyle = grade.band;
    ctx.fillRect(0, band.y * H, W, band.h * H);
    drawTitle(ctx, state.title, state.subtitle, W * 0.05, band.y * H + band.h * H * 0.52, W * 0.9, Math.min(W, H), grade.sun);
  } else {
    // Title overlaid on the foot of the hero panel, with a dark scrim.
    const hero = photoPanels[0];
    const scrimH = H * 0.24;
    const scrimY = (hero.y + hero.h) * H - scrimH;
    const scrim = ctx.createLinearGradient(0, scrimY, 0, scrimY + scrimH);
    scrim.addColorStop(0, 'rgba(10, 5, 20, 0)');
    scrim.addColorStop(1, 'rgba(10, 5, 20, 0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(hero.x * W, scrimY, hero.w * W, scrimH);
    drawTitle(ctx, state.title, state.subtitle, hero.x * W + W * 0.03, scrimY + scrimH * 0.55, hero.w * W * 0.94, Math.min(W, H), grade.sun);
  }
}
