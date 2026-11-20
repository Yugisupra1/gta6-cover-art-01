// Fixed scenes for screenshots.
//
// ?shot=editor shows the page with sample photos loaded; ?shot=cover shows
// the cover alone (the controls are hidden). Query params pick the scene:
// `photos` is a comma list of sample names in panel order, `title`,
// `subtitle`, `size` and `grade` set the rest. window.__shotReady is set
// once the cover has been painted, so a screenshot script can wait on it.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photos = (query.get('photos') || 'pier,neon,palm').split(',');
  await load({
    photos,
    title: query.get('title') ?? 'Vice City',
    subtitle: query.get('subtitle') ?? 'Sunset Heist',
    size: query.get('size') ?? 'square',
    grade: query.get('grade') ?? 'sunset',
  });
  // Two frames: one to let the canvas paint, one to let it settle, so the
  // screenshot catches the finished cover rather than a half-drawn one.
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
