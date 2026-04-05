# Shaka HLS + DASH Player (Web Component)

Standalone embeddable web component built on **Shaka Player**.

- No Video.js dependency
- HLS + DASH playback
- Auto format detection (`hls` on Apple, `dash` elsewhere)
- DASH -> HLS automatic fallback
- Quality selector, subtitles, playback speed
- Seek thumbnails via `thumbnails.vtt`
- Hover preview video before first play
- Keyboard shortcuts

## Quick Start

```html
<script src="./shaka-hls-dash-player.js"></script>

<shaka-hls-dash-player
  base-url="https://cdn.example.com/videos/my-video/"
></shaka-hls-dash-player>
```

## Attributes

- `base-url` (default `./`)
- `hls-manifest` (default `baseUrl/master.m3u8`)
- `dash-manifest` (default `baseUrl/manifest.mpd`)
- `poster` (default `baseUrl/poster/hd_image.jpg`)
- `preview-video` (default `baseUrl/preview/preview.mp4`)
- `thumbnails-vtt` (default `baseUrl/thumbnails/thumbnails.vtt`)
- `playback-rates` (comma separated, default `0.5,0.75,1,1.25,1.5,2`)
- `format` (`auto` | `hls` | `dash`, default `auto`)
- `no-preview`
- `no-thumbnails`
- `no-poster`
- `no-keyboard`

## JS API

```js
const el = document.querySelector('shaka-hls-dash-player');

el.loadVideo({
  baseUrl: '/videos/another-video/',
  format: 'auto',
  noPreview: false,
  noThumbnails: false
});

const player = el.getPlayer();
const activeFormat = el.getCurrentFormat();
```

## Expected Folder Layout

```text
your-video/
  master.m3u8
  manifest.mpd
  poster/hd_image.jpg
  preview/preview.mp4
  thumbnails/thumbnails.vtt
```

## Notes

- This repo intentionally starts with Shaka `4.10.0` to match the currently-shipped local template in `video-converter-app/public/player-templates/player-shaka.html`.
- See [`docs/SOURCE_OF_TRUTH.md`](./docs/SOURCE_OF_TRUTH.md) before changing behavior.

