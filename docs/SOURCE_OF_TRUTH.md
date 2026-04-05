# Source Of Truth Policy

Date: 2026-04-04 (updated)

## Rule

When documentation and code disagree, **code is the source of truth**.

## Source-Of-Truth Files

- `oss/shaka-hls-dash-player/shaka-hls-dash-player.js`
- `oss/shaka-hls-dash-player/index.html`
- `roncodev-site/public/players/shaka-hls-dash-player.js`
- `roncodev-site/src/pages/demo.astro`
- `video-converter-app/public/player-templates/player-shaka.html`
- `video-converter-app/CLAUDE.md` (cross-checked against code)
- `video-converter-app/PROJECT_CONTEXT.md` (cross-checked against code)

## Why this exists

Some docs get stale over time. This folder records decisions for the Shaka component while anchoring behavior in current implementation reality.

## Migration Note (2026-04-05)

All Video.js player code and repos have been removed. Legacy repos archived on GitHub:
- `RoncoJhon/videojs-hls-dash-player` (archived)
- `RoncoJhon/videojs-hls-dash-demo` (archived)
- `RoncoJhon/hls-dash-video-player` (archived)
- `RoncoJhon/hls-dash-demo-player` (archived)

