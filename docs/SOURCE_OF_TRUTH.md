# Source Of Truth Policy

Date: 2026-04-04 (updated)

## Rule

When documentation and code disagree, **code is the source of truth**.

## Current Source-Of-Truth Files (Shaka-first)

- `oss/shaka-hls-dash-player/shaka-hls-dash-player.js`
- `oss/shaka-hls-dash-player/index.html`
- `roncodev-site/public/players/shaka-hls-dash-player.js`
- `roncodev-site/src/pages/demo.astro`
- `video-converter-app/public/player-templates/player-shaka.html`
- `video-converter-app/CLAUDE.md` (cross-checked against code)
- `video-converter-app/PROJECT_CONTEXT.md` (cross-checked against code)

## Legacy Migration Baseline (Reference Only)

These files are kept only to preserve migration context and API-compat notes:

- `video-converter-app/public/player-templates/player-videojs.html`
- `oss/videojs-hls-dash-player/player.js`
- `oss/videojs-hls-dash-demo/index.html`

## Why this exists

Some docs get stale over time. This folder records decisions for the Shaka component while anchoring behavior in current implementation reality.

