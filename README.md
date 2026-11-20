# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Yugisupra1/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Yugisupra1/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Cover** — a GTA-style cover art maker that turns your photos and a caption into a multi-panel poster, exported as a PNG to share.

## The app

Three photo panels in a poster layout (a hero panel plus two smaller ones), a bold outlined title and subtitle, and a Vice City sunset, neon or noir colour grade — all drawn live on canvas.

- **Any photo**: load your own photos from your machine into each panel, or try the four free samples. Click a panel to select it, drag on the preview to move its photo, use the zoom slider to crop in.
- **Fill all three panels** with one click, or mix one photo across panels.
- **Caption**: edit the title and subtitle; the lettering is bold, outlined, GTA-poster style.
- **Sizes**: Square 1080 x 1080, Portrait 1080 x 1350, Wide 1920 x 1080.
- **Grades**: Sunset, Neon, Noir.
- **Export**: one click saves the cover as a PNG at the chosen size.

Everything runs offline: static files under `app/`, no network request, photos never leave your machine. No Rockstar logo, artwork or font — the design and lettering are original.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

Or serve `app/` with any static file server.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=b3kapa6k&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
