# Filters Module

A custom CSS selector matching and DOM observation engine with Shadow DOM support and uBlock Origin procedural cosmetic filter extensions.

## API

### `querySelectorAll(root, selector)`

Returns all elements under `root` matching `selector`, including inside shadow roots.

```ts
import { querySelectorAll } from './filters'

const elements = querySelectorAll(document.body, '.promoted:has-text("Ad")')
```

### `querySelector(root, selector)`

Returns the first matching element, or `null`.

```ts
const el = querySelector(document.body, '#sidebar .widget:upward(1)')
```

### `observe(root, selector, options)`

Watches `root` for matching elements — both existing and dynamically added. Returns a cleanup function.

```ts
const cleanup = observe(document.body, '.ad-banner', {
  onMatch: (elements) => {
    elements.forEach((el) => el.remove())
  },
})

// With onUnmatch (for conditional selectors)
const cleanup = observe(document.body, '.widget:matches-path(/^\\/r\\//)', {
  onMatch: (elements) => {
    elements.forEach((el) => (el.style.display = 'none'))
  },
  onUnmatch: (elements) => {
    elements.forEach((el) => (el.style.display = ''))
  },
})

// Stop observing
cleanup()
```

Behavior:

- Initial scan results are delivered synchronously
- Dynamic mutations are batched via `requestAnimationFrame`
- Each element is reported at most once (deduplicated via `WeakSet`)
- Shadow roots are detected both on scan and via 500ms polling for lazy creation

## Supported Selectors

### Standard CSS

| Selector | Example |
| --- | --- |
| Tag | `div`, `span` |
| Class | `.foo`, `.foo.bar` |
| ID | `#myid` |
| Universal | `*` |
| Attribute | `[attr]`, `[attr=val]`, `[attr^=val]`, `[attr$=val]`, `[attr*=val]`, `[attr\|=val]` |
| Descendant | `#parent .child` |
| Child | `#parent > .child` |
| Adjacent sibling | `.a + .b` |
| General sibling | `.a ~ .b` |
| Comma groups | `.a, .b` |
| `:not()` | `:not(.hidden)` |
| `:is()` / `:where()` | `:is(.a, .b)` |
| `:has()` | `div:has(.inner)` |
| `:first-child` / `:last-child` / `:only-child` | |
| `:nth-child()` / `:nth-last-child()` | `:nth-child(2n+1)`, `:nth-child(odd)` |
| `:nth-of-type()` / `:nth-last-of-type()` | |
| `:first-of-type` / `:last-of-type` / `:only-of-type` | |
| `:root` / `:empty` | |

### Extended (uBlock Origin procedural cosmetic filters)

| Selector | Description |
| --- | --- |
| `:has-text(text)` | Matches if the element's `textContent` contains `text`. Supports regex: `:has-text(/pattern/flags)`. |
| `:upward(n)` | Returns the ancestor `n` levels above the matched element. **Must be terminal** (see below). |
| `:upward(selector)` | Returns the closest ancestor matching `selector`. **Must be terminal** (see below). |
| `:matches-media(query)` | Matches only when the media query is true. Re-evaluated on viewport changes. |
| `:matches-path(path)` | Matches only when `location.pathname + location.search` contains `path`. Supports regex. Re-evaluated on SPA navigation. |

`:matches-media` and `:matches-path` are **conditional** — `observe()` automatically re-evaluates them when the environment changes and fires `onUnmatch` when they stop matching.

**`:upward()` must be terminal** — it cannot be followed by a combinator (`+`, `~`, `>`, or descendant space). The matching engine evaluates selectors right-to-left, so `:upward()` can only redirect the final match target. Selectors like `.child:upward(section) + hr` will throw an error at parse time. Use `:has()` instead for sibling selectors: `section:has(.child) + hr`.

## Architecture

```txt
index.ts          Public API re-exports
    │
    ├── query.ts      querySelectorAll / querySelector
    │     │
    │     └── matches.ts   Core matching engine
    │
    └── observe.ts    MutationObserver-based watcher
          │
          └── matches.ts
```

### matches.ts — Matching Engine

Evaluates a single element against a parsed [css-what](https://github.com/fb55/css-what) AST.

- **Right-to-left matching**: Tokens are consumed from the rightmost simple selector, then combinators walk up/across the DOM tree.
- **Return type**: `Element | null`. Normally returns the input element on match. `:upward()` redirects the return to an ancestor, so callers should use the returned element rather than the input.
- **Shadow DOM**: The `getParent()` helper crosses shadow boundaries transparently — when an element's parent is a `ShadowRoot`, it jumps to `shadowRoot.host`.

### query.ts — Static Queries

Wraps `matches()` with a depth-first DOM walker (`walkDOM`) that enters shadow roots. Straightforward: parse selector, walk tree, collect matches.

### observe.ts — Dynamic Observation

Layers reactivity on top of `matches()`:

1. **AST splitting** — The parsed selector groups are classified as *unconditional* (pure DOM) or *conditional* (contains `:matches-media` / `:matches-path`). Unconditional elements are tracked in a `WeakSet` (fire-and-forget). Conditional elements are tracked in a `Set` (iterable for re-evaluation).

2. **MutationObserver** — Watches `childList` (subtree) and `attributes` (`class`, `id`) on the root and on discovered shadow roots.

3. **Shadow root polling** — A 500ms `setInterval` walks the tree looking for newly attached shadow roots (Web Components often create them asynchronously in `connectedCallback`).

4. **Environment listeners** — For conditional selectors:
   - Media queries: `matchMedia(query).addEventListener('change', ...)`
   - Path changes: monkey-patches `history.pushState` / `replaceState` and listens for `popstate`. Uses a shared reference-counted install so multiple `observe()` calls don't patch repeatedly.

5. **Re-evaluation** — When the environment changes, `reevaluateConditional()` runs two phases:
   - *Un-hide*: Remove elements from the conditional set that no longer match, call `onUnmatch`.
   - *Re-scan*: Walk the DOM for newly matching elements, call `onMatch`.

6. **Batching** — Mutations within the same frame are coalesced into a single `onMatch` call via `requestAnimationFrame`.
