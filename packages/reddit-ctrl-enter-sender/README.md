# Reddit Ctrl+Enter Sender

A userscript that enables quick submission of replies, comments, or edits on Reddit using the Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac) keyboard shortcut.

## Features

- **Universal Shortcuts**: Supports Ctrl+Enter (Windows/Linux) and Cmd+Enter (Mac)
- **Smart Button Detection**: Automatically identifies submit/save buttons on the current page
- **Multi-level Search**: Prioritizes buttons within the current editing area, falls back to global page buttons
- **Multiple Scenarios**: Works with comment replies, edit submissions, post creation, and more
- **Lightweight**: No permissions required, works entirely in the browser

## Installation

1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/)
2. Download the userscript from <https://github.com/rxliuli/userscripts/releases/latest/download/reddit-ctrl-enter-sender.user.js>

## How to Use

1. **Visit Reddit**: Navigate to any Reddit page (the script works on `https://www.reddit.com/**`)
2. **Start Typing**: Enter your content in a comment box, reply field, or edit area
3. **Use the Shortcut**: Press Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
4. **Auto Submit**: The script automatically finds and clicks the appropriate submit/save button
