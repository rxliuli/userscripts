# Duolingo Hide App Popups

A userscript that hides annoying app download popups on Duolingo and restores normal page scrolling.

## What it does

This userscript automatically hides:

- App download overlays (containing adj.st links)
- Drawer backdrops that block interaction
- Restores scrolling on the main page content

## Installation

1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/)
2. Download the userscript from <https://github.com/rxliuli/userscripts/releases/latest/download/duolingo-hide-popups.user.js>

## How it works

The userscript runs at document-start and injects CSS rules to:

- Hide overlay elements that contain app download links (`#overlays:has([href*="adj.st"])`)
- Hide drawer backdrop elements (`[data-test="drawer-backdrop"]`)
- Restore scrolling to the root element (`#root { overflow: auto !important; }`)
