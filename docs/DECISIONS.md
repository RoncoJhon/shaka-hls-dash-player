# Design Decisions

## 1) New isolated repo folder

Created as `oss/shaka-hls-dash-player` to keep Shaka web component independent from Video.js repos.

## 2) API compatibility for migration

The component keeps attribute names close to the existing Video.js component:

- `base-url`, `hls-manifest`, `dash-manifest`, `poster`, `preview-video`, `thumbnails-vtt`
- `playback-rates`, `no-preview`, `no-thumbnails`, `no-poster`, `no-keyboard`

Plus `format` (`auto|hls|dash`).

## 3) Thumbnail strategy

Current output folder uses `thumbnails/thumbnails.vtt`, so this component parses VTT cues and renders hover thumbnails directly.

## 4) Format strategy

- `auto`: Apple -> HLS, others -> DASH
- If DASH fails, fallback to HLS once

## 5) Version strategy

Pinned to Shaka `4.10.0` initially (matches current shipped local Shaka template in the app), then can be upgraded after validation.
