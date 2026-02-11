# YouTube Music Background Play

A userscript that prevents YouTube Music from pausing playback when switching tabs or running the browser in the background.

## What it does

This userscript intercepts browser APIs that YouTube uses to detect if you're actively watching, allowing music to continue playing when you:

- Switch to other tabs
- Minimize the browser window
- Switch to other applications

## Browser Support

- ✅ Chrome/Edge/Firefox - Full support
- ✅ macOS Safari - Full support (requires Tampermonkey or Userscripts extension)
- ✅ iOS Safari - Full support (requires Userscripts extension)

## Installation

1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/)
2. Download the userscript from <https://github.com/rxliuli/userscripts/releases/latest/download/youtube-music-background-play.user.js>

## Limitations

- **Unstable**: YouTube may update their detection methods at any time, causing this userscript to stop working
- **Computer sleep**: Playback will still pause when your computer goes to sleep or hibernates
- **Updates**: May break when YouTube updates their site

## How it works

The userscript overrides the following browser APIs:

- `document.hidden` - always returns `false`
- `document.visibilityState` - always returns `'visible'`
- `document.hasFocus()` - always returns `true`
- Blocks visibility change and focus events

## Disclaimer

This userscript is for personal use. Use at your own risk.

## Screenshot

<img width="590" height="1280" alt="iOS Safari Screenshot" src="https://github.com/user-attachments/assets/c2bf18d7-fbdc-486f-9b68-5f0e3e966b3d" />

## Discord

Join the discussion: <https://discord.gg/C2baQRZUCW>
