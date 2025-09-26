# My UserScripts

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/rxliuli)

- [Reddit Ctrl+Enter Sender](./packages//reddit-ctrl-enter-sender/README.md): A userscript to send Reddit comments with Ctrl+Enter.
- [YouTube Music Background Play](./packages/youtube-music-background-play/README.md): A userscript to enable background play on YouTube Music.

## FAQ

### Why not publish on GreasyFork?

In fact, they removed my userscript. Since they require all code to be unminified, while third-party dependencies (like React) are minified by default and can only be included via `@require`, but not all npm packages support the iife (browser-specific) format (usually they support esm/cjs), I gave up because I didn't want to deal with these complications.
