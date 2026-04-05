/**
 * <shaka-hls-dash-player> standalone web component (no Video.js).
 */
(function () {
    'use strict';

    var LIBS = {
        css: [
            'https://cdn.jsdelivr.net/npm/shaka-player@4.10.0/dist/controls.min.css'
        ],
        js: [
            'https://cdn.jsdelivr.net/npm/shaka-player@4.10.0/dist/shaka-player.compiled.min.js',
            'https://cdn.jsdelivr.net/npm/shaka-player@4.10.0/dist/shaka-player.ui.min.js'
        ]
    };

    var libsPromise = null;
    var stylesInjected = false;
    var polyfillsInstalled = false;
    var instanceCounter = 0;

    function loadCSS(url) {
        return new Promise(function (resolve, reject) {
            var found = document.querySelector('link[href="' + url + '"]');
            if (found) return resolve();
            var el = document.createElement('link');
            el.rel = 'stylesheet';
            el.href = url;
            el.onload = resolve;
            el.onerror = reject;
            document.head.appendChild(el);
        });
    }

    function loadJS(url) {
        return new Promise(function (resolve, reject) {
            var found = document.querySelector('script[src="' + url + '"]');
            if (found && found.dataset.loaded === 'true') return resolve();
            if (found) {
                found.addEventListener('load', function () { resolve(); }, { once: true });
                found.addEventListener('error', function () { reject(new Error('Failed: ' + url)); }, { once: true });
                return;
            }

            var el = document.createElement('script');
            el.src = url;
            el.async = true;
            el.onload = function () {
                el.dataset.loaded = 'true';
                resolve();
            };
            el.onerror = function () { reject(new Error('Failed: ' + url)); };
            document.head.appendChild(el);
        });
    }

    function loadLibs() {
        if (libsPromise) return libsPromise;

        libsPromise = Promise.all(LIBS.css.map(loadCSS))
            .then(function () {
                var chain = Promise.resolve();
                LIBS.js.forEach(function (url) {
                    chain = chain.then(function () { return loadJS(url); });
                });
                return chain;
            })
            .then(function () {
                if (!polyfillsInstalled && window.shaka && shaka.polyfill) {
                    shaka.polyfill.installAll();
                    polyfillsInstalled = true;
                }
            });

        return libsPromise;
    }

    function injectStyles() {
        if (stylesInjected) return;
        stylesInjected = true;

        var style = document.createElement('style');
        style.textContent = [
            'shaka-hls-dash-player{display:block;width:100%;height:100%}',
            '.sdp-wrap{position:relative;width:100%;height:100%;min-height:200px;background:#000;overflow:hidden}',
            '@media (max-width:369px){.sdp-wrap{min-height:0!important}}',
            '.sdp-preview{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:5;opacity:0;transition:opacity .2s;pointer-events:none}',
            '.sdp-preview.active{opacity:1}.sdp-wrap.playing .sdp-preview{display:none}',
            '.sdp-wrap.prestart .shaka-controls-container,.sdp-wrap.prestart .shaka-overflow-menu,.sdp-wrap.prestart .shaka-settings-menu,.sdp-wrap.prestart .shaka-play-button-container{opacity:0!important;visibility:hidden!important;pointer-events:none!important;z-index:0!important}',
            '.sdp-wrap.prestart{cursor:pointer}',
            '.sdp-container{position:relative;width:100%;height:100%}.sdp-video{width:100%;height:100%}',
            '.sdp-badge{display:none!important;position:absolute;top:10px;right:10px;z-index:20;background:rgba(0,0,0,.7);color:#34d399;border-radius:4px;font-size:12px;font-weight:600;padding:4px 10px;pointer-events:none}',
            '.sdp-thumb{display:none;position:absolute;left:0;bottom:74px;z-index:3000;pointer-events:none}',
            '.sdp-thumb-frame{position:relative;width:240px;height:135px;border-radius:6px;overflow:hidden;border:2px solid rgba(255,255,255,.9);background:#111;box-shadow:0 4px 12px rgba(0,0,0,.55)}',
            '.sdp-thumb-img{position:absolute;left:0;top:0}.sdp-thumb-time{display:block;width:fit-content;margin:8px auto 0;padding:4px 10px;text-align:center;color:#fff;font-size:13px;font-weight:400;line-height:1.1;border-radius:999px;background:rgba(0,0,0,.78);box-shadow:0 4px 12px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.15);text-shadow:0 1px 2px rgba(0,0,0,.95)}',
            '.sdp-container .shaka-range-container.shaka-seek-bar-container{box-shadow:0 1px 2px rgba(0,0,0,.22)!important}',
            '.sdp-container .shaka-range-element.shaka-seek-bar{box-shadow:none!important;filter:none!important}',
            '.sdp-container .shaka-range-element.shaka-seek-bar::-webkit-slider-runnable-track{box-shadow:none!important}',
            '.sdp-container .shaka-range-element.shaka-seek-bar::-moz-range-track{box-shadow:none!important}',
            '.sdp-container .shaka-volume-bar-container{width:66px!important;min-width:66px!important}',
            '.sdp-container .shaka-overflow-menu,.sdp-container .shaka-settings-menu{max-height:min(70vh,calc(100% - 64px))!important;overflow-y:auto!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}',
            '@media (max-width:499px){.sdp-container .shaka-overflow-menu,.sdp-container .shaka-settings-menu{max-height:min(78vh,calc(100% - 52px))!important}}',
            '.sdp-container .shaka-player-ui-thumbnail-container{display:none!important}',
            '.sdp-container .shaka-player-ui-thumbnail-time-container{display:none!important}',
            '.sdp-container .shaka-player-ui-thumbnail-time{display:none!important}',
            '.sdp-container .shaka-seek-bar-container .shaka-hover-time{display:none!important}',
            '.sdp-container .shaka-seek-bar-container .shaka-thumbnail-container{display:none!important}',
            '.sdp-container .shaka-seek-bar-container > :not(.shaka-ad-markers):not(.shaka-chapter-markers):not(.shaka-seek-bar){display:none!important}',
        ].join('');
        document.head.appendChild(style);
    }

    function isApple() {
        var ua = navigator.userAgent;
        return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|Brave/.test(ua));
    }

    function trailingSlash(v) { return (v || './').replace(/\/?$/, '/'); }

    function parseRates(raw) {
        if (!raw) return [0.5, 0.75, 1, 1.25, 1.5, 2];
        var rates = raw.split(',').map(function (n) { return parseFloat(n.trim()); }).filter(function (n) { return !isNaN(n) && n > 0; });
        return rates.length ? rates : [0.5, 0.75, 1, 1.25, 1.5, 2];
    }

    function parseTs(v) {
        var p = v.trim().split(':');
        if (p.length < 2 || p.length > 3) return NaN;
        var sec = p[p.length - 1].split('.');
        var h = p.length === 3 ? parseInt(p[0], 10) : 0;
        var m = parseInt(p[p.length - 2], 10);
        var s = parseInt(sec[0], 10);
        var ms = parseInt((sec[1] || '0').padEnd(3, '0').slice(0, 3), 10);
        if ([h, m, s, ms].some(function (n) { return isNaN(n); })) return NaN;
        return (h * 3600) + (m * 60) + s + (ms / 1000);
    }

    function fmtTime(s) {
        s = Math.max(0, Math.floor(s));
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var sec = s % 60;
        return h > 0 ? (h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0')) : (m + ':' + String(sec).padStart(2, '0'));
    }

    function parseVtt(text, vttUrl) {
        var lines = (text || '').replace(/\r/g, '').split('\n');
        var cues = [];

        // Support both absolute and relative VTT URLs (local testing often uses relative paths).
        var vttBase = vttUrl || '';
        if (typeof document !== 'undefined' && document.baseURI) {
            try { vttBase = new URL(vttBase, document.baseURI).href; } catch (e) {}
        }

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line === 'WEBVTT' || line.indexOf('-->') === -1) continue;

            var times = line.split('-->');
            if (times.length !== 2) continue;

            var start = parseTs(times[0]);
            var end = parseTs(times[1].trim().split(/\s+/)[0]);
            if (isNaN(start) || isNaN(end)) continue;

            var payload = '';
            var j = i + 1;
            while (j < lines.length && !payload) { payload = lines[j].trim(); j++; }
            if (!payload) continue;

            var abs = payload;
            try { abs = new URL(payload, vttBase).href; } catch (e) {}
            var m = abs.match(/#xywh=(\d+),(\d+),(\d+),(\d+)$/);
            cues.push({
                start: start,
                end: end,
                src: abs.replace(/#xywh=.*$/, ''),
                x: m ? parseInt(m[1], 10) : null,
                y: m ? parseInt(m[2], 10) : null,
                w: m ? parseInt(m[3], 10) : null,
                h: m ? parseInt(m[4], 10) : null
            });
        }

        return cues;
    }

    function preferredFormat(mode) {
        if (mode === 'hls' || mode === 'dash') return mode;
        return isApple() ? 'hls' : 'dash';
    }

    var PlayerEl = /** @class */ (function () {
        function PlayerEl() {
            var el = Reflect.construct(HTMLElement, [], PlayerEl);
            el._id = 'sdp-' + (++instanceCounter);
            el._player = null;
            el._ui = null;
            el._initialized = false;
            el._suppressReload = false;
            el._version = 0;
            el._format = null;
            el._fallbackTried = false;
            el._started = false;
            el._thumbCues = [];
            el._thumbRatioBySrc = Object.create(null);
            el._thumbRetryTimer = null;
            el._thumbObserver = null;
            el._seekTrack = null;
            el._vttAbort = null;
            el._streamLoaded = false;
            el._starting = false;
            el._startPromise = null;
            el._unloadPromise = Promise.resolve();
            el._onStartRequest = null;
            el._onMenuClick = null;
            el._onUiResize = null;
            el._resizeUiTimer = null;
            el._lastCfg = null;
            return el;
        }

        PlayerEl.prototype = Object.create(HTMLElement.prototype);
        PlayerEl.prototype.constructor = PlayerEl;

        Object.defineProperty(PlayerEl, 'observedAttributes', {
            get: function () {
                return [
                    'base-url', 'hls-manifest', 'dash-manifest', 'poster',
                    'preview-video', 'thumbnails-vtt', 'playback-rates', 'format',
                    'no-preview', 'no-thumbnails', 'no-poster', 'no-keyboard'
                ];
            }
        });

        PlayerEl.prototype.connectedCallback = function () {
            var self = this;
            injectStyles();
            this._buildDom();
            loadLibs().then(function () { self._init(); }).catch(function (e) {
                console.error('[shaka-hls-dash-player] Failed to load libraries:', e);
            });
        };

        PlayerEl.prototype.disconnectedCallback = function () {
            this._removePreviewHandlers();
            this._removeKeyboard();
            this._removeMenuAutoClose();
            this._removeResponsiveUi();
            this._removeStartRequest();
            this._teardownThumbs();

            if (this._vttAbort) {
                this._vttAbort.abort();
                this._vttAbort = null;
            }

            if (this._player && this._onPlayerError) this._player.removeEventListener('error', this._onPlayerError);
            if (this._player && this._onAdapt) this._player.removeEventListener('adaptation', this._onAdapt);
            if (this._player && this._onVariant) this._player.removeEventListener('variantchanged', this._onVariant);
            if (this._video && this._onPlaying) this._video.removeEventListener('playing', this._onPlaying);

            var player = this._player;
            var ui = this._ui;

            this._player = null;
            this._ui = null;
            this._initialized = false;

            if (ui && typeof ui.destroy === 'function') {
                try { ui.destroy(); } catch (e) {}
            }
            if (player && typeof player.destroy === 'function') {
                player.destroy().catch(function () {});
            }
        };

        PlayerEl.prototype.attributeChangedCallback = function (name) {
            if (!this._initialized || this._suppressReload) return;
            if (name === 'no-keyboard') {
                this._updateKeyboard();
                return;
            }
            if (name === 'playback-rates') {
                this._configure(this._cfg());
                return;
            }
            this._reload();
        };

        PlayerEl.prototype.loadVideo = function (cfg) {
            this._suppressReload = true;
            try {
                this._setAttr('base-url', cfg.baseUrl);
                this._setAttr('hls-manifest', cfg.hlsManifest);
                this._setAttr('dash-manifest', cfg.dashManifest);
                this._setAttr('poster', cfg.poster);
                this._setAttr('preview-video', cfg.previewVideo);
                this._setAttr('thumbnails-vtt', cfg.thumbnailsVtt);
                this._setAttr('playback-rates', cfg.playbackRates);
                this._setAttr('format', cfg.format);
                if (cfg.noPreview !== undefined) this._boolAttr('no-preview', cfg.noPreview);
                if (cfg.noThumbnails !== undefined) this._boolAttr('no-thumbnails', cfg.noThumbnails);
                if (cfg.noPoster !== undefined) this._boolAttr('no-poster', cfg.noPoster);
                if (cfg.noKeyboard !== undefined) this._boolAttr('no-keyboard', cfg.noKeyboard);
            } finally {
                this._suppressReload = false;
            }
            if (this._initialized) this._reload();
        };

        PlayerEl.prototype.getPlayer = function () { return this._player; };
        PlayerEl.prototype.getCurrentFormat = function () { return this._format; };

        PlayerEl.prototype._buildDom = function () {
            this.innerHTML = '';

            var wrap = document.createElement('div');
            wrap.className = 'sdp-wrap';

            var preview = document.createElement('video');
            preview.className = 'sdp-preview';
            preview.muted = true;
            preview.loop = true;
            preview.playsInline = true;
            preview.setAttribute('playsinline', '');
            preview.preload = 'auto';

            var container = document.createElement('div');
            container.className = 'sdp-container';

            var video = document.createElement('video');
            video.className = 'sdp-video';
            video.id = this._id + '-video';
            video.controls = false;
            video.preload = 'auto';
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            container.appendChild(video);

            var badge = document.createElement('div');
            badge.className = 'sdp-badge';
            badge.textContent = 'Auto';

            var thumb = document.createElement('div');
            thumb.className = 'sdp-thumb';

            var frame = document.createElement('div');
            frame.className = 'sdp-thumb-frame';

            var img = document.createElement('img');
            img.className = 'sdp-thumb-img';
            img.alt = '';
            img.draggable = false;
            var self = this;
            img.addEventListener('load', function () {
                var src = img.currentSrc || img.src;
                if (!src) return;
                if (!img.naturalWidth || !img.naturalHeight) return;
                var ratio = img.naturalWidth / img.naturalHeight;
                if (!isFinite(ratio) || ratio <= 0) return;
                self._thumbRatioBySrc[src] = ratio;
                if (self._thumb && self._thumb.style.display === 'block') {
                    var activeSrc = self._thumbImg.currentSrc || self._thumbImg.src;
                    if (activeSrc === src && self._thumbImg.style.objectFit === 'contain') {
                        self._applyThumbFrameRatio(ratio);
                    }
                }
            });
            frame.appendChild(img);

            var time = document.createElement('div');
            time.className = 'sdp-thumb-time';
            time.textContent = '0:00';

            thumb.appendChild(frame);
            thumb.appendChild(time);
            container.appendChild(thumb);
            wrap.appendChild(preview);
            wrap.appendChild(container);
            wrap.appendChild(badge);
            this.appendChild(wrap);

            this._wrap = wrap;
            this._preview = preview;
            this._container = container;
            this._video = video;
            this._badge = badge;
            this._thumb = thumb;
            this._thumbFrame = frame;
            this._thumbImg = img;
            this._thumbTime = time;
        };

        PlayerEl.prototype._init = function () {
            var self = this;
            if (this._initialized) return;
            if (!window.shaka || !shaka.Player || !shaka.Player.isBrowserSupported()) {
                console.error('[shaka-hls-dash-player] Browser not supported.');
                return;
            }

            this._player = new shaka.Player();
            this._player.attach(this._video).then(function () {
                self._ui = new shaka.ui.Overlay(self._player, self._container, self._video);

                self._onPlayerError = function (ev) { self._playerError(ev); };
                self._onAdapt = function () { self._updateBadge(); };
                self._onVariant = function () { self._updateBadge(); };
                self._onPlaying = function () { self._onMainPlaying(); };

                self._player.addEventListener('error', self._onPlayerError);
                self._player.addEventListener('adaptation', self._onAdapt);
                self._player.addEventListener('variantchanged', self._onVariant);
                self._video.addEventListener('playing', self._onPlaying);
                self._updateMenuAutoClose();

                self._initialized = true;
                self._reload();
            }).catch(function (e) {
                console.error('[shaka-hls-dash-player] Attach failed:', e);
            });
        };

        PlayerEl.prototype._cfg = function () {
            var base = trailingSlash(this.getAttribute('base-url') || './');
            var fmt = (this.getAttribute('format') || 'auto').toLowerCase();
            if (fmt !== 'hls' && fmt !== 'dash' && fmt !== 'auto') fmt = 'auto';

            var noPreview = this.hasAttribute('no-preview');
            var noThumbs = this.hasAttribute('no-thumbnails');
            var noPoster = this.hasAttribute('no-poster');

            return {
                hlsManifest: this.getAttribute('hls-manifest') || (base + 'master.m3u8'),
                dashManifest: this.getAttribute('dash-manifest') || (base + 'manifest.mpd'),
                poster: noPoster ? null : (this.getAttribute('poster') || (base + 'poster/hd_image.jpg')),
                previewVideo: noPreview ? null : (this.getAttribute('preview-video') || (base + 'preview/preview.mp4')),
                thumbnailsVtt: noThumbs ? null : (this.getAttribute('thumbnails-vtt') || (base + 'thumbnails/thumbnails.vtt')),
                playbackRates: parseRates(this.getAttribute('playback-rates')),
                format: fmt,
                noKeyboard: this.hasAttribute('no-keyboard')
            };
        };

        PlayerEl.prototype._configure = function (cfg) {
            this._player.configure({
                streaming: {
                    bufferingGoal: 30,
                    rebufferingGoal: 2,
                    bufferBehind: 30,
                    retryParameters: { maxAttempts: 5, baseDelay: 1000, backoffFactor: 2, timeout: 30000 },
                    alwaysStreamText: true
                },
                abr: {
                    enabled: true,
                    defaultBandwidthEstimate: 5000000,
                    switchInterval: 4,
                    bandwidthUpgradeTarget: 0.85,
                    bandwidthDowngradeTarget: 0.95
                }
            });

            this._lastCfg = cfg;

            if (this._ui) {
                this._applyUiConfig(cfg);
                this._ensureResponsiveUi();
            }
        };

        PlayerEl.prototype._applyUiConfig = function (cfg) {
            if (!this._ui) return;

            var compact = false;
            if (typeof window !== 'undefined' && typeof window.innerWidth === 'number') {
                compact = window.innerWidth < 500;
            } else if (window.matchMedia) {
                compact = window.matchMedia('(max-width: 499px)').matches;
            }

            var controlPanelElements = compact
                ? ['play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 'fullscreen', 'overflow_menu']
                : ['play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 'captions', 'quality', 'playback_rate', 'picture_in_picture', 'fullscreen', 'overflow_menu'];

            this._ui.configure({
                controlPanelElements: controlPanelElements,
                overflowMenuButtons: ['quality', 'captions', 'playback_rate', 'language', 'picture_in_picture', 'loop'],
                addSeekBar: true,
                addBigPlayButton: true,
                enableTooltips: true,
                enableKeyboardPlaybackControls: !cfg.noKeyboard,
                playbackRates: cfg.playbackRates,
                seekBarColors: { base: 'rgba(255,255,255,.30)', buffered: 'rgba(255,255,255,.45)', played: '#6366f1' }
            });
        };

        PlayerEl.prototype._ensureResponsiveUi = function () {
            var self = this;
            if (typeof window === 'undefined' || !window.addEventListener) return;
            if (this._onUiResize) return;

            this._onUiResize = function () {
                if (!self._ui || !self._lastCfg) return;

                if (self._resizeUiTimer) clearTimeout(self._resizeUiTimer);
                self._resizeUiTimer = setTimeout(function () {
                    self._resizeUiTimer = null;
                    self._applyUiConfig(self._lastCfg);
                    self._refreshThumbBindings();
                }, 80);
            };

            window.addEventListener('resize', this._onUiResize);
        };

        PlayerEl.prototype._removeResponsiveUi = function () {
            if (typeof window !== 'undefined' && window.removeEventListener && this._onUiResize) {
                window.removeEventListener('resize', this._onUiResize);
            }
            this._onUiResize = null;

            if (this._resizeUiTimer) {
                clearTimeout(this._resizeUiTimer);
                this._resizeUiTimer = null;
            }
        };

        PlayerEl.prototype._reload = function () {
            if (!this._player) return;

            ++this._version;
            var cfg = this._cfg();

            this._started = false;
            this._starting = false;
            this._streamLoaded = false;
            this._startPromise = null;
            this._fallbackTried = false;
            this._wrap.classList.remove('playing');
            this._wrap.classList.add('prestart');

            this._applyPosterPreview(cfg);
            this._configure(cfg);
            this._updateKeyboard();
            this._teardownThumbs();
            this._armStartRequest();

            this._unloadPromise = this._player.unload().catch(function () {});
        };

        PlayerEl.prototype._loadWithFallback = function (cfg, version) {
            var self = this;
            var preferred = preferredFormat(cfg.format);
            var first = preferred === 'hls' ? cfg.hlsManifest : cfg.dashManifest;
            var fallback = preferred === 'dash' ? cfg.hlsManifest : null;

            this._format = preferred;

            return this._player.load(first).then(function () {
                if (version !== self._version) return;
                self._format = preferred;
            }).catch(function () {
                if (version !== self._version) return;
                if (!fallback || self._fallbackTried) throw new Error('No fallback available');
                self._fallbackTried = true;
                return self._player.load(fallback).then(function () {
                    if (version !== self._version) return;
                    self._format = 'hls';
                });
            });
        };

        PlayerEl.prototype._applyPosterPreview = function (cfg) {
            if (cfg.poster) {
                this._video.setAttribute('poster', cfg.poster);
                this._preview.setAttribute('poster', cfg.poster);
            } else {
                this._video.removeAttribute('poster');
                this._preview.removeAttribute('poster');
            }

            this._removePreviewHandlers();
            this._preview.pause();
            this._preview.classList.remove('active');
            this._preview.innerHTML = '';

            if (!cfg.previewVideo) {
                this._preview.style.display = 'none';
                return;
            }

            this._preview.style.display = '';
            var src = document.createElement('source');
            src.src = cfg.previewVideo;
            src.type = 'video/mp4';
            this._preview.appendChild(src);
            this._preview.load();
            this._addPreviewHandlers();
        };

        PlayerEl.prototype._addPreviewHandlers = function () {
            var self = this;
            this._onPreviewEnter = function () {
                if (self._started || self._starting || !self._cfg().previewVideo) return;
                self._preview.classList.add('active');
                self._preview.play().catch(function () {});
            };
            this._onPreviewLeave = function () {
                if (self._started) return;
                self._preview.classList.remove('active');
                self._preview.pause();
                self._preview.currentTime = 0;
            };
            this._wrap.addEventListener('mouseenter', this._onPreviewEnter);
            this._wrap.addEventListener('mouseleave', this._onPreviewLeave);
        };

        PlayerEl.prototype._removePreviewHandlers = function () {
            if (this._onPreviewEnter) this._wrap.removeEventListener('mouseenter', this._onPreviewEnter);
            if (this._onPreviewLeave) this._wrap.removeEventListener('mouseleave', this._onPreviewLeave);
            this._onPreviewEnter = null;
            this._onPreviewLeave = null;
        };

        PlayerEl.prototype._onMainPlaying = function () {
            this._started = true;
            this._starting = false;
            this._wrap.classList.remove('prestart');
            this._wrap.classList.add('playing');
            this._preview.pause();
            this._preview.classList.remove('active');
            this._removeStartRequest();
        };

        PlayerEl.prototype._armStartRequest = function () {
            var self = this;
            this._removeStartRequest();
            if (!this._wrap) return;

            this._onStartRequest = function (ev) {
                if (self._started || self._starting) return;
                if (ev && typeof ev.button === 'number' && ev.button !== 0) return;
                self._startStreamPlayback();
            };

            this._wrap.addEventListener('click', this._onStartRequest);
        };

        PlayerEl.prototype._removeStartRequest = function () {
            if (!this._wrap || !this._onStartRequest) return;
            this._wrap.removeEventListener('click', this._onStartRequest);
            this._onStartRequest = null;
        };

        PlayerEl.prototype._startStreamPlayback = function () {
            var self = this;
            if (!this._player) return Promise.resolve();
            if (this._startPromise) return this._startPromise;

            var version = this._version;
            var cfg = this._cfg();

            this._starting = true;
            this._wrap.classList.remove('prestart');
            this._preview.pause();
            this._preview.classList.remove('active');

            this._startPromise = Promise.resolve(this._unloadPromise)
                .then(function () {
                    if (version !== self._version) return;
                    if (self._streamLoaded) return;
                    return self._loadWithFallback(cfg, version).then(function () {
                        if (version !== self._version) return;
                        self._streamLoaded = true;
                        self._updateBadge();
                        self._setupThumbs(cfg, version);
                    });
                })
                .then(function () {
                    if (version !== self._version) return;
                    return self._video.play();
                })
                .catch(function (e) {
                    if (version !== self._version) return;
                    self._starting = false;
                    if (!self._streamLoaded) self._wrap.classList.add('prestart');
                    console.error('[shaka-hls-dash-player] Start playback failed:', e);
                })
                .finally(function () {
                    if (version === self._version) self._startPromise = null;
                });

            return this._startPromise;
        };

        PlayerEl.prototype._setupThumbs = function (cfg, version) {
            var self = this;
            this._teardownThumbs();
            if (!cfg.thumbnailsVtt) return;

            if (this._vttAbort) this._vttAbort.abort();
            this._vttAbort = new AbortController();

            fetch(cfg.thumbnailsVtt, { signal: this._vttAbort.signal })
                .then(function (res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.text();
                })
                .then(function (txt) {
                    if (version !== self._version) return;
                    self._thumbCues = parseVtt(txt, cfg.thumbnailsVtt);
                    if (!self._thumbCues.length) return;

                    // Bind immediately if controls exist, otherwise watch DOM until they appear.
                    if (!self._bindThumbSeek()) {
                        self._observeThumbSeekBar();
                    }
                })
                .catch(function (e) {
                    if (e && e.name === 'AbortError') return;
                    console.warn('[shaka-hls-dash-player] Thumbnails disabled:', e);
                });
        };

        PlayerEl.prototype._findThumbSeek = function () {
            var bars = Array.prototype.slice.call(this._container.querySelectorAll('.shaka-seek-bar'));
            var containers = Array.prototype.slice.call(this._container.querySelectorAll('.shaka-seek-bar-container'));

            function isVisible(el) {
                if (!el) return false;
                var rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            }

            var bar = null;
            for (var i = 0; i < bars.length; i++) {
                if (isVisible(bars[i])) {
                    bar = bars[i];
                    break;
                }
            }
            if (!bar && bars.length) bar = bars[0];

            var container = null;
            if (bar) {
                for (var j = 0; j < containers.length; j++) {
                    if (containers[j].contains(bar)) {
                        container = containers[j];
                        break;
                    }
                }
            }
            if (!container) {
                for (var k = 0; k < containers.length; k++) {
                    if (isVisible(containers[k])) {
                        container = containers[k];
                        break;
                    }
                }
                if (!container && containers.length) container = containers[0];
            }

            var target = bar || container;
            var track = container || bar;
            return target ? { target: target, track: track } : null;
        };

        PlayerEl.prototype._unbindThumbSeek = function () {
            var targets = this._hoverTargets || [];

            for (var i = 0; i < targets.length; i++) {
                var t = targets[i];
                if (!t) continue;
                if (this._onSeekMove) {
                    t.removeEventListener('mousemove', this._onSeekMove);
                    t.removeEventListener('pointermove', this._onSeekMove);
                }
                if (this._onSeekLeave) {
                    t.removeEventListener('mouseleave', this._onSeekLeave);
                    t.removeEventListener('pointerleave', this._onSeekLeave);
                }
            }

            if (this._wrap && this._onWrapMove) {
                this._wrap.removeEventListener('mousemove', this._onWrapMove);
                this._wrap.removeEventListener('pointermove', this._onWrapMove);
            }
            if (this._wrap && this._onWrapLeave) {
                this._wrap.removeEventListener('mouseleave', this._onWrapLeave);
                this._wrap.removeEventListener('pointerleave', this._onWrapLeave);
            }

            this._hoverTargets = [];
            this._onWrapMove = null;
            this._onWrapLeave = null;
        };

        PlayerEl.prototype._bindThumbSeek = function () {
            var self = this;
            var seek = this._findThumbSeek();
            var target = seek ? seek.target : null;

            if (!target) return false;

            this._unbindThumbSeek();

            this._seekBar = target;
            this._seekTrack = (seek && seek.track) ? seek.track : target;
            this._onSeekMove = function (ev) { self._hoverThumb(ev); };
            this._onSeekLeave = function () { self._hideThumb(); };

            var targets = [target];
            if (this._seekTrack && targets.indexOf(this._seekTrack) === -1) targets.push(this._seekTrack);

            this._hoverTargets = targets;

            for (var i = 0; i < targets.length; i++) {
                var t = targets[i];
                t.addEventListener('mousemove', this._onSeekMove);
                t.addEventListener('pointermove', this._onSeekMove);
                t.addEventListener('mouseleave', this._onSeekLeave);
                t.addEventListener('pointerleave', this._onSeekLeave);
            }
            return true;
        };

        PlayerEl.prototype._observeThumbSeekBar = function () {
            var self = this;
            if (!window.MutationObserver) return;

            if (this._thumbObserver) {
                this._thumbObserver.disconnect();
                this._thumbObserver = null;
            }

            this._thumbObserver = new MutationObserver(function () {
                if (!self._thumbCues.length) return;
                if (self._bindThumbSeek()) {
                    self._thumbObserver.disconnect();
                    self._thumbObserver = null;
                }
            });

            this._thumbObserver.observe(this._container, { childList: true, subtree: true });
        };

        PlayerEl.prototype._refreshThumbBindings = function () {
            var self = this;
            if (!this._thumbCues || !this._thumbCues.length) return;

            this._hideThumb();
            this._unbindThumbSeek();

            var attempts = 0;
            var tryBind = function () {
                attempts++;
                if (self._bindThumbSeek()) return;
                if (attempts >= 8) {
                    self._observeThumbSeekBar();
                    return;
                }

                if (typeof window !== 'undefined' && window.requestAnimationFrame) {
                    window.requestAnimationFrame(tryBind);
                } else {
                    setTimeout(tryBind, 16);
                }
            };

            if (typeof window !== 'undefined' && window.requestAnimationFrame) {
                window.requestAnimationFrame(tryBind);
            } else {
                setTimeout(tryBind, 0);
            }
        };

        PlayerEl.prototype._teardownThumbs = function () {
            if (this._thumbRetryTimer) {
                clearTimeout(this._thumbRetryTimer);
                this._thumbRetryTimer = null;
            }
            if (this._thumbObserver) {
                this._thumbObserver.disconnect();
                this._thumbObserver = null;
            }
            this._unbindThumbSeek();
            this._seekBar = null;
            this._seekTrack = null;
            this._onSeekMove = null;
            this._onSeekLeave = null;
            this._thumbCues = [];
            this._hideThumb();
        };

        PlayerEl.prototype._hoverThumb = function (ev) {
            if (!this._thumbCues.length) return;
            if (!this._started) { this._hideThumb(); return; }
            if (!ev || typeof ev.clientX !== 'number' || typeof ev.clientY !== 'number') return;
            if (!this._seekBar && !this._bindThumbSeek()) return;

            var trackEl = this._seekTrack || this._seekBar;
            var rect = trackEl.getBoundingClientRect();
            if (!rect.width) {
                if (this._bindThumbSeek()) {
                    trackEl = this._seekTrack || this._seekBar;
                    rect = trackEl.getBoundingClientRect();
                }
            }
            if (!rect.width) return;

            var yMargin = 8;
            if (ev.clientY < (rect.top - yMargin) || ev.clientY > (rect.bottom + yMargin)) {
                this._hideThumb();
                return;
            }

            var ratio = (ev.clientX - rect.left) / rect.width;
            ratio = Math.max(0, Math.min(1, ratio));

            var start = 0;
            var end = this._video.duration;
            if (!isFinite(end) && this._player && this._player.seekRange) {
                var range = this._player.seekRange();
                start = isFinite(range.start) ? range.start : 0;
                end = isFinite(range.end) ? range.end : start;
            }
            if ((!isFinite(end) || end <= start) && this._thumbCues.length) {
                var lastCue = this._thumbCues[this._thumbCues.length - 1];
                if (lastCue && isFinite(lastCue.end) && lastCue.end > start) {
                    end = lastCue.end;
                }
            }
            if (!isFinite(end) || end <= start) {
                this._hideThumb();
                return;
            }

            var time = start + ((end - start) * ratio);
            var cue = null;
            for (var i = 0; i < this._thumbCues.length; i++) {
                var c = this._thumbCues[i];
                if (time >= c.start && time < c.end) { cue = c; break; }
            }

            if (!cue) {
                this._hideThumb();
                return;
            }

            this._showThumb(cue, time, ev);
        };

        PlayerEl.prototype._defaultThumbRatio = function () {
            if (this._video && this._video.videoWidth > 0 && this._video.videoHeight > 0) {
                var videoRatio = this._video.videoWidth / this._video.videoHeight;
                if (isFinite(videoRatio) && videoRatio > 0) return videoRatio;
            }
            if (this._container) {
                var rect = this._container.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    var containerRatio = rect.width / rect.height;
                    if (isFinite(containerRatio) && containerRatio > 0) return containerRatio;
                }
            }
            return 16 / 9;
        };

        PlayerEl.prototype._applyThumbFrameRatio = function (ratio) {
            var maxW = 260;
            var maxH = 260;
            if (!isFinite(ratio) || ratio <= 0) ratio = this._defaultThumbRatio();

            var boxW = maxW;
            var boxH = Math.round(boxW / ratio);
            if (boxH > maxH) {
                boxH = maxH;
                boxW = Math.round(boxH * ratio);
            }

            this._thumbFrame.style.width = boxW + 'px';
            this._thumbFrame.style.height = boxH + 'px';
        };

        PlayerEl.prototype._showThumb = function (cue, time, ev) {
            this._thumbTime.textContent = fmtTime(time);

            if (cue.w && cue.h && cue.x !== null && cue.y !== null) {
                this._thumbFrame.style.width = cue.w + 'px';
                this._thumbFrame.style.height = cue.h + 'px';
                this._thumbImg.src = cue.src;
                this._thumbImg.style.width = 'auto';
                this._thumbImg.style.height = 'auto';
                this._thumbImg.style.left = (-cue.x) + 'px';
                this._thumbImg.style.top = (-cue.y) + 'px';
                this._thumbImg.style.objectFit = 'unset';
            } else {
                var ratio = 0;
                var cueSrc = cue.src || '';
                if (cueSrc && this._thumbRatioBySrc[cueSrc]) {
                    ratio = this._thumbRatioBySrc[cueSrc];
                }

                if ((!isFinite(ratio) || ratio <= 0) && this._thumbImg && this._thumbImg.src === cue.src && this._thumbImg.naturalWidth > 0 && this._thumbImg.naturalHeight > 0) {
                    ratio = this._thumbImg.naturalWidth / this._thumbImg.naturalHeight;
                    if (cueSrc && isFinite(ratio) && ratio > 0) {
                        this._thumbRatioBySrc[cueSrc] = ratio;
                    }
                }
                if (!isFinite(ratio) || ratio <= 0) ratio = this._defaultThumbRatio();

                this._applyThumbFrameRatio(ratio);
                this._thumbImg.src = cue.src;
                this._thumbImg.style.width = '100%';
                this._thumbImg.style.height = '100%';
                this._thumbImg.style.left = '0';
                this._thumbImg.style.top = '0';
                this._thumbImg.style.objectFit = 'contain';
            }

            var rootEl = (this._thumb && this._thumb.offsetParent) || this._container || this._wrap;
            var rootRect = rootEl.getBoundingClientRect();
            var left = ev.clientX - rootRect.left;
            var frameW = parseInt(this._thumbFrame.style.width, 10) || 240;
            var clamped = Math.max(8, Math.min(rootRect.width - frameW - 8, left - (frameW / 2)));

            this._thumb.style.left = clamped + 'px';
            this._thumb.style.display = 'block';

            var seekEl = this._seekTrack || this._seekBar;
            if (seekEl) {
                var seekRect = seekEl.getBoundingClientRect();
                var thumbH = this._thumb.offsetHeight || ((parseInt(this._thumbFrame.style.height, 10) || 135) + 20);
                var gap = 42;
                var top = (seekRect.top - rootRect.top) - thumbH - gap;
                var maxTop = Math.max(8, rootRect.height - thumbH - 8);
                var clampedTop = Math.max(8, Math.min(maxTop, top));
                this._thumb.style.top = clampedTop + 'px';
                this._thumb.style.bottom = 'auto';
            }
        };

        PlayerEl.prototype._hideThumb = function () {
            if (this._thumb) this._thumb.style.display = 'none';
        };

        PlayerEl.prototype._updateBadge = function () {
            if (!this._badge || !this._player || !this._player.getVariantTracks) return;
            var tracks = this._player.getVariantTracks();
            var active = null;
            for (var i = 0; i < tracks.length; i++) {
                if (tracks[i].active) { active = tracks[i]; break; }
            }
            this._badge.textContent = (active && active.height) ? (active.height + 'p') : 'Auto';
        };

        PlayerEl.prototype._updateKeyboard = function () {
            var self = this;
            this._removeKeyboard();
            if (this.hasAttribute('no-keyboard')) return;

            this._onKeyDown = function (e) {
                if (!self._video) return;
                if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

                switch (String(e.key || '').toLowerCase()) {
                    case ' ':
                    case 'k':
                        e.preventDefault();
                        if (!self._streamLoaded) { self._startStreamPlayback(); break; }
                        self._video.paused ? self._video.play() : self._video.pause();
                        break;
                    case 'f':
                        e.preventDefault();
                        if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
                        else if (self._container.requestFullscreen) self._container.requestFullscreen().catch(function () {});
                        break;
                    case 'm':
                        e.preventDefault();
                        self._video.muted = !self._video.muted;
                        break;
                    case 'arrowleft':
                        e.preventDefault();
                        self._video.currentTime = Math.max(0, self._video.currentTime - 5);
                        break;
                    case 'arrowright':
                        e.preventDefault();
                        self._video.currentTime = Math.min(self._video.duration || Infinity, self._video.currentTime + 5);
                        break;
                    case 'arrowup':
                        e.preventDefault();
                        self._video.volume = Math.min(1, self._video.volume + 0.1);
                        break;
                    case 'arrowdown':
                        e.preventDefault();
                        self._video.volume = Math.max(0, self._video.volume - 0.1);
                        break;
                    case 'c':
                        e.preventDefault();
                        self._toggleSubs();
                        break;
                }
            };

            document.addEventListener('keydown', this._onKeyDown);
        };

        PlayerEl.prototype._removeKeyboard = function () {
            if (!this._onKeyDown) return;
            document.removeEventListener('keydown', this._onKeyDown);
            this._onKeyDown = null;
        };

        PlayerEl.prototype._updateMenuAutoClose = function () {
            var self = this;
            this._removeMenuAutoClose();
            if (!this._container) return;

            this._onMenuClick = function (ev) {
                var target = ev && ev.target;
                if (!target || !target.closest) return;

                var btn = target.closest('button');
                if (!btn || !self._container.contains(btn)) return;
                if (!btn.closest('.shaka-settings-menu')) return;
                if (btn.classList.contains('shaka-back-to-overflow-button') || btn.classList.contains('shaka-back-button')) return;
                if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;

                setTimeout(function () { self._closeShakaMenus(); }, 0);
            };

            this._container.addEventListener('click', this._onMenuClick, true);
        };

        PlayerEl.prototype._removeMenuAutoClose = function () {
            if (!this._container || !this._onMenuClick) return;
            this._container.removeEventListener('click', this._onMenuClick, true);
            this._onMenuClick = null;
        };

        PlayerEl.prototype._closeShakaMenus = function () {
            var controls = null;
            if (this._ui && typeof this._ui.getControls === 'function') {
                controls = this._ui.getControls();
            }
            if (controls && typeof controls.hideSettingsMenus === 'function') {
                controls.hideSettingsMenus();
                return;
            }

            if (!this._container) return;
            var menus = this._container.querySelectorAll('.shaka-overflow-menu, .shaka-settings-menu');
            for (var i = 0; i < menus.length; i++) {
                menus[i].classList.remove('shaka-displayed');
                menus[i].classList.add('shaka-hidden');
                menus[i].setAttribute('aria-hidden', 'true');
            }

            var expanded = this._container.querySelectorAll('[aria-expanded="true"]');
            for (var j = 0; j < expanded.length; j++) {
                expanded[j].setAttribute('aria-expanded', 'false');
            }
        };

        PlayerEl.prototype._toggleSubs = function () {
            if (!this._player || !this._player.getTextTracks) return;
            var tracks = this._player.getTextTracks();
            if (!tracks.length) return;
            var visible = this._player.isTextTrackVisible();
            this._player.setTextTrackVisibility(!visible);
        };

        PlayerEl.prototype._playerError = function (ev) {
            var self = this;
            if (!ev || !ev.detail) return;

            if (!this._fallbackTried && this._format === 'dash') {
                this._fallbackTried = true;
                this._player.load(this._cfg().hlsManifest).then(function () {
                    self._format = 'hls';
                    self._updateBadge();
                }).catch(function () {});
                return;
            }

            console.error('[shaka-hls-dash-player] Playback error:', ev.detail);
        };

        PlayerEl.prototype._boolAttr = function (name, value) {
            if (value) this.setAttribute(name, '');
            else this.removeAttribute(name);
        };

        PlayerEl.prototype._setAttr = function (name, value) {
            if (value === undefined) return;
            if (value === null || value === '') this.removeAttribute(name);
            else this.setAttribute(name, String(value));
        };

        return PlayerEl;
    })();

    if (!customElements.get('shaka-hls-dash-player')) {
        customElements.define('shaka-hls-dash-player', PlayerEl);
    }
})();
















