# My UserScripts

- [Duolingo Hide App Popups](./src/plugins/duolingo-hide-popups/README.md): Hide annoying app download popups and restore scrolling on Duolingo.
- [Reddit Ctrl+Enter Sender](./src/plugins/reddit-ctrl-enter-sender/README.md): Send Reddit comments with Ctrl+Enter.
- [Reddit Search Options Persist](./src/plugins/reddit-search-options-persist/README.md): Keep Reddit search filters when searching with new keywords.
- [YouTube Music Background Play](./src/plugins/youtube-music-background-play/README.md): Enable background play on YouTube Music.
- [TVTropes Anti-Adblock Bypass](./src/plugins/tvtropes-anti-adblock-bypass/README.md): Bypass anti-adblock detection on TVTropes.org.

## FAQ

### Why not publish on GreasyFork?

In fact, they removed my userscript. Since they require all code to be unminified, while third-party dependencies (like React) are minified by default and can only be included via `@require`, but not all npm packages support the iife (browser-specific) format (usually they support esm/cjs), I gave up because I didn't want to deal with these complications.
