# YouTube Music Background Play

A userscript that prevents YouTube Music from pausing playback when running in background tabs.

## What it does

This userscript intercepts browser APIs that YouTube uses to detect if you're actively watching, allowing music to continue playing when you switch to other tabs.

## Installation

1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/)
2. Download the userscript from <https://github.com/rxliuli/userscripts/releases/latest/download/youtube-music-background-play.user.js>

## Limitations

- **Unstable**: YouTube may update their detection methods at any time, causing this userscript to stop working
- **Computer sleep**: Playback will still pause when your computer goes to sleep or hibernates
- **iOS Safari**: This userscript does not work on iOS Safari due to platform-specific restrictions
- **Updates**: May break when YouTube updates their site

## How it works

The userscript overrides the following browser APIs:

- `document.hidden` - always returns `false`
- `document.visibilityState` - always returns `'visible'`
- `document.hasFocus()` - always returns `true`
- Blocks visibility change and focus events

## Disclaimer

This userscript is for personal use. Use at your own risk.
