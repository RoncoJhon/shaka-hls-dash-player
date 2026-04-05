# shaka-hls-dash-player

A standalone web component for HLS and DASH adaptive streaming, built on [Shaka Player](https://github.com/shaka-project/shaka-player).

One script tag, one HTML element. No build step, no npm install, no framework required.

```html
<script src="https://cdn.jsdelivr.net/gh/RoncoJhon/shaka-hls-dash-player/shaka-hls-dash-player.js"></script>

<shaka-hls-dash-player base-url="https://cdn.example.com/my-video/"></shaka-hls-dash-player>
```

## Features

- **HLS + DASH** — Plays both formats from a single element
- **Auto format detection** — HLS on Apple devices (native), DASH elsewhere (MSE + AV1 support)
- **DASH-to-HLS fallback** — If DASH fails, automatically retries with HLS
- **Quality selector** — Adaptive bitrate by default, manual resolution override via Shaka UI
- **Subtitles** — WebVTT tracks auto-discovered from the manifest
- **Seek thumbnails** — Hover the progress bar for frame previews via `thumbnails.vtt`
- **Hover preview** — Short preview video plays on mouse hover before first play
- **Poster image** — Displayed before playback starts
- **Keyboard shortcuts** — Space/K, F, M, arrows, C for subtitles
- **Responsive** — Compact control layout on small screens (<500px)
- **Self-contained** — Loads Shaka Player 4.10 from CDN automatically
- **Multiple instances** — Use several players on the same page

## Quick Start

### Via CDN (recommended)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Video</title>
    <script src="https://cdn.jsdelivr.net/gh/RoncoJhon/shaka-hls-dash-player/shaka-hls-dash-player.js"></script>
</head>
<body>
    <div style="max-width: 960px; margin: 0 auto; aspect-ratio: 16/9;">
        <shaka-hls-dash-player base-url="/videos/my-video/"></shaka-hls-dash-player>
    </div>
</body>
</html>
```

### Self-hosted

Download `shaka-hls-dash-player.js` and serve it alongside your video:

```html
<script src="./shaka-hls-dash-player.js"></script>

<shaka-hls-dash-player base-url="./"></shaka-hls-dash-player>
```

### In a framework (React, Vue, Svelte, etc.)

Web components work in any framework. Just load the script and use the tag:

```jsx
// React example
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/RoncoJhon/shaka-hls-dash-player/shaka-hls-dash-player.js';
  document.head.appendChild(script);
}, []);

return <shaka-hls-dash-player base-url="/videos/my-video/" />;
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `base-url` | string | `"./"` | Base URL for all auto-discovered resources. Trailing slash is added automatically. |
| `hls-manifest` | string | `{base-url}/master.m3u8` | Full URL to the HLS manifest. Overrides auto-discovery. |
| `dash-manifest` | string | `{base-url}/manifest.mpd` | Full URL to the DASH manifest. Overrides auto-discovery. |
| `poster` | string | `{base-url}/poster/hd_image.jpg` | Poster image shown before playback. |
| `preview-video` | string | `{base-url}/preview/preview.mp4` | Short video that plays on hover before first play. |
| `thumbnails-vtt` | string | `{base-url}/thumbnails/thumbnails.vtt` | WebVTT file for seek bar thumbnail previews. Supports both sprite sheets (`#xywh=`) and individual images. |
| `playback-rates` | string | `"0.5,0.75,1,1.25,1.5,2"` | Comma-separated playback speed options. |
| `format` | string | `"auto"` | Format strategy: `"auto"` (Apple=HLS, others=DASH), `"hls"`, or `"dash"`. |
| `no-preview` | boolean | — | Disable hover preview video. |
| `no-thumbnails` | boolean | — | Disable seek bar thumbnails. |
| `no-poster` | boolean | — | Disable poster image. |
| `no-keyboard` | boolean | — | Disable keyboard shortcuts. |

Boolean attributes are enabled by presence: `<shaka-hls-dash-player no-preview no-thumbnails>`.

## JavaScript API

### `loadVideo(config)`

Load a new video without removing the element from the DOM:

```js
const player = document.querySelector('shaka-hls-dash-player');

player.loadVideo({
  baseUrl: '/videos/another-video/',
  format: 'auto',          // 'auto' | 'hls' | 'dash'
  noPreview: false,
  noThumbnails: false,
  noPoster: false,
  noKeyboard: false,
  // Override individual paths:
  hlsManifest: null,        // null = use baseUrl default
  dashManifest: null,
  poster: null,
  previewVideo: null,
  thumbnailsVtt: null,
  playbackRates: '0.5,1,1.5,2'
});
```

All properties are optional. Omitted properties keep their current attribute values.

### `getPlayer()`

Returns the underlying `shaka.Player` instance for advanced configuration:

```js
const shakaPlayer = document.querySelector('shaka-hls-dash-player').getPlayer();

// Example: get available quality tracks
const tracks = shakaPlayer.getVariantTracks();
console.log(tracks.map(t => t.height + 'p'));

// Example: force a specific quality
shakaPlayer.configure('abr.enabled', false);
shakaPlayer.selectVariantTrack(tracks.find(t => t.height === 720));
```

### `getCurrentFormat()`

Returns the currently active format: `"hls"` or `"dash"`.

```js
const format = document.querySelector('shaka-hls-dash-player').getCurrentFormat();
// "dash" or "hls"
```

## Expected Folder Structure

The component auto-discovers resources from `base-url` using these default paths:

```
your-video/
├── master.m3u8              ← HLS master playlist
├── manifest.mpd             ← DASH manifest
├── 240p/
│   ├── init.mp4
│   ├── chunk_0.m4s
│   └── video.m3u8
├── 720p/ ...
├── 1080p/ ...
├── subtitles/               ← WebVTT files (discovered from manifest)
│   ├── english.vtt
│   └── spanish.vtt
├── thumbnails/
│   ├── thumb_0001.jpg       ← Thumbnail images
│   └── thumbnails.vtt       ← VTT cue file (timestamps + image refs)
├── poster/
│   └── hd_image.jpg         ← Poster image
└── preview/
    └── preview.mp4          ← Hover preview video
```

Only `master.m3u8` and/or `manifest.mpd` are required. Everything else is optional and gracefully skipped if missing.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| <kbd>Space</kbd> / <kbd>K</kbd> | Play / Pause |
| <kbd>F</kbd> | Toggle fullscreen |
| <kbd>M</kbd> | Mute / Unmute |
| <kbd>&larr;</kbd> / <kbd>&rarr;</kbd> | Seek -5s / +5s |
| <kbd>&uarr;</kbd> / <kbd>&darr;</kbd> | Volume up / down |
| <kbd>C</kbd> | Toggle subtitles |

Disable with `no-keyboard` attribute.

## Browser Compatibility

| Browser | Format Used | AV1 | H.264 |
|---------|-------------|-----|-------|
| Chrome 70+ | DASH (Shaka + MSE) | Yes | Yes |
| Firefox 67+ | DASH (Shaka + MSE) | Yes | Yes |
| Edge 79+ | DASH (Shaka + MSE) | Yes | Yes |
| Safari 14+ | HLS (native) | 16.4+ | Yes |
| iOS Safari | HLS (native) | 17+ | Yes |

## Customization

### CSS

The component injects minimal styles scoped to its own elements. Key CSS classes you can override:

```css
/* Player wrapper */
.sdp-wrap { /* ... */ }

/* Thumbnail preview on seek */
.sdp-thumb { /* ... */ }
.sdp-thumb-frame { /* ... */ }
.sdp-thumb-time { /* ... */ }

/* Quality badge overlay */
.sdp-badge { /* ... */ }

/* Preview video */
.sdp-preview { /* ... */ }
```

Shaka UI controls use standard Shaka CSS classes (`.shaka-*`). See [Shaka UI customization docs](https://shaka-player-demo.appspot.com/docs/api/tutorial-ui-customization.html).

### Shaka Player Configuration

Access the underlying Shaka Player instance for advanced configuration:

```js
const el = document.querySelector('shaka-hls-dash-player');
const player = el.getPlayer();

// Customize ABR
player.configure('abr.defaultBandwidthEstimate', 3000000);

// Customize streaming
player.configure('streaming.bufferingGoal', 60);
```

## How It Works

1. On `connectedCallback`, the component builds its DOM (video element, preview, thumbnail overlay)
2. Shaka Player CSS and JS are loaded from jsDelivr CDN (cached across instances)
3. Polyfills are installed once via `shaka.polyfill.installAll()`
4. A `shaka.Player` + `shaka.ui.Overlay` are created and configured
5. On first click, the manifest is loaded and playback begins
6. Format selection: `auto` picks HLS for Apple devices, DASH for others
7. If DASH load fails, HLS is tried as fallback (once)
8. Thumbnails are fetched from the VTT file and rendered on seek bar hover

## Notes

- Shaka Player 4.10.0 is loaded from CDN. The component handles deduplication if multiple instances exist on the same page.
- The component uses `customElements.define()` and is registered as `shaka-hls-dash-player`. It will not re-register if already defined.
- Playback doesn't start until the user clicks the player. This avoids autoplay restrictions and saves bandwidth.

## License

MIT
