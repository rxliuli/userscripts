# TVTropes Anti-Adblock Bypass

A userscript that bypasses anti-adblock detection on TVTropes.org, allowing you to browse the site with your adblocker enabled.

## What it does

This userscript intercepts and modifies scripts that detect ad blockers on TVTropes, preventing the anti-adblock warning from appearing. It also blocks ad-related scripts from loading.

## Installation

1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/)
2. Download the userscript from <https://github.com/rxliuli/userscripts/releases/latest/download/tvtropes-anti-adblock-bypass.user.js>

## How it works

The userscript runs at document-start and:

- Intercepts script loading via DOM manipulation hooks and MutationObserver
- Blocks ad scripts from Google (googlesyndication, doubleclick, googletagservices) and BigCrunch
- Modifies the anti-adblock detection script to prevent it from triggering

## Disclaimer

This userscript is for personal use. Please consider supporting TVTropes by subscribing or allowing ads if you find their content valuable.
