// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone. `photos` picks the samples
// (samples/<name>.jpg, in panel order), `title`, `subtitle`, `size` and
// `grade` set the rest. window.__shotReady is set once painted.
// (Rewritten under the make.fun recording so the build is witnessed end to end.)
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
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
