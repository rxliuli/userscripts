import { type Selector, SelectorType, parse } from 'css-what'
import { matches, validateSelector } from './matches'

export interface ObserveOptions {
  onMatch: (elements: Element[]) => void
  onUnmatch?: (elements: Element[]) => void
}

export function observe(root: Element, selector: string, options: ObserveOptions): () => void {
  const { onMatch, onUnmatch } = options

  const ast = parse(selector)
  validateSelector(ast)
  const unconditionalAst: Selector[][] = []
  const conditionalAst: Selector[][] = []
  for (const group of ast) {
    if (groupHasCondition(group)) {
      conditionalAst.push(group)
    } else {
      unconditionalAst.push(group)
    }
  }

  const seen = new WeakSet<Element>()
  const conditionallyHidden = new Set<Element>()
  const observedShadows = new WeakSet<ShadowRoot>()
  const observers: MutationObserver[] = []
  let pending: Element[] = []
  let rafId: number | null = null

  function flush() {
    rafId = null
    if (pending.length > 0) {
      const batch = pending
      pending = []
      onMatch(batch)
    }
  }

  function schedule(el: Element) {
    pending.push(el)
    if (rafId === null) {
      rafId = requestAnimationFrame(flush)
    }
  }

  function checkElement(el: Element) {
    // Check unconditional selectors (fire-and-forget)
    if (unconditionalAst.length > 0) {
      const matched = matches(el, unconditionalAst)
      if (matched && !seen.has(matched)) {
        seen.add(matched)
        schedule(matched)
      }
    }
    // Check conditional selectors
    if (conditionalAst.length > 0) {
      const matched = matches(el, conditionalAst)
      if (matched && !conditionallyHidden.has(matched)) {
        conditionallyHidden.add(matched)
        schedule(matched)
      }
    }
  }

  /** Walk a subtree (including shadow roots) and check all elements. */
  function scanSubtree(node: Element) {
    checkElement(node)
    if (node.shadowRoot) {
      scanShadowRoot(node.shadowRoot)
    }
    let child = node.firstElementChild
    while (child) {
      scanSubtree(child)
      child = child.nextElementSibling
    }
  }

  function handleMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            scanSubtree(node)
          }
        }
      } else if (mutation.type === 'attributes') {
        if (mutation.target instanceof Element) {
          checkElement(mutation.target)
        }
      }
    }
  }

  function observeTarget(target: Node) {
    const mo = new MutationObserver(handleMutations)
    mo.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'id'] })
    observers.push(mo)
  }

  function scanShadowRoot(shadow: ShadowRoot) {
    if (observedShadows.has(shadow)) return
    observedShadows.add(shadow)
    observeTarget(shadow)
    let child = shadow.firstElementChild
    while (child) {
      scanSubtree(child)
      child = child.nextElementSibling
    }
  }

  /**
   * Periodically re-check elements for lazily-created shadow roots.
   * Web Components often create their shadow DOM asynchronously
   * (e.g. in connectedCallback or later), so we can't catch them
   * with a single scan at insertion time.
   */
  function pollForShadowRoots() {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
    let node: Element | null = walker.currentNode as Element
    while (node) {
      if (node.shadowRoot && !observedShadows.has(node.shadowRoot)) {
        scanShadowRoot(node.shadowRoot)
      }
      node = walker.nextNode() as Element | null
    }
  }

  /** Re-evaluate all conditional selectors when environment changes */
  function reevaluateConditional() {
    // Phase 1: Un-hide elements that no longer match
    const toUnhide: Element[] = []
    for (const el of conditionallyHidden) {
      if (!el.isConnected) {
        conditionallyHidden.delete(el)
        continue
      }
      if (!matches(el, conditionalAst)) {
        conditionallyHidden.delete(el)
        // Only un-hide if it also doesn't match unconditional selectors
        if (unconditionalAst.length === 0 || !matches(el, unconditionalAst)) {
          toUnhide.push(el)
        }
      }
    }
    if (toUnhide.length > 0 && onUnmatch) {
      onUnmatch(toUnhide)
    }

    // Phase 2: Find newly matching elements
    const toHide: Element[] = []
    const walkAll = (node: Element) => {
      const matched = matches(node, conditionalAst)
      if (matched && !conditionallyHidden.has(matched)) {
        conditionallyHidden.add(matched)
        toHide.push(matched)
      }
      if (node.shadowRoot) {
        let child = node.shadowRoot.firstElementChild
        while (child) {
          walkAll(child)
          child = child.nextElementSibling
        }
      }
      let child = node.firstElementChild
      while (child) {
        walkAll(child)
        child = child.nextElementSibling
      }
    }
    walkAll(root)
    if (toHide.length > 0) {
      onMatch(toHide)
    }
  }

  // Initial scan
  scanSubtree(root)
  // Synchronously flush initial results (no RAF delay)
  if (pending.length > 0) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    const batch = pending
    pending = []
    onMatch(batch)
  }

  // Start observing for dynamic changes
  observeTarget(root)

  // Poll for lazily-created shadow roots
  const pollId = setInterval(pollForShadowRoots, 500)

  // Set up environment listeners for conditional selectors
  const cleanupListeners: (() => void)[] = []

  if (conditionalAst.length > 0) {
    // Media query listeners
    const mediaQueries = extractMediaQueries(conditionalAst)
    for (const query of mediaQueries) {
      const mql = window.matchMedia(query)
      const handler = () => reevaluateConditional()
      mql.addEventListener('change', handler)
      cleanupListeners.push(() => mql.removeEventListener('change', handler))
    }

    // Path change listeners
    if (hasPathCondition(conditionalAst)) {
      const cleanup = onNavigate(reevaluateConditional)
      cleanupListeners.push(cleanup)
    }
  }

  return () => {
    clearInterval(pollId)
    for (const mo of observers) {
      mo.disconnect()
    }
    observers.length = 0
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    pending.length = 0
    conditionallyHidden.clear()
    for (const cleanup of cleanupListeners) {
      cleanup()
    }
  }
}

// --- AST condition helpers ---

const CONDITIONAL_NAMES = new Set(['matches-media', 'matches-path'])

/** Check if a single selector group contains any conditional pseudo-classes */
function groupHasCondition(tokens: Selector[]): boolean {
  return tokens.some((token) => tokenHasCondition(token))
}

function tokenHasCondition(token: Selector): boolean {
  if (token.type === SelectorType.Pseudo) {
    if (CONDITIONAL_NAMES.has(token.name)) return true
    // Recurse into sub-selectors (:not, :is, :has, etc.)
    if (Array.isArray(token.data)) {
      return (token.data as Selector[][]).some((group) => groupHasCondition(group))
    }
  }
  return false
}

/** Extract all unique media query strings from conditional AST */
function extractMediaQueries(ast: Selector[][]): string[] {
  const queries = new Set<string>()
  for (const group of ast) {
    for (const token of group) {
      collectMediaQueries(token, queries)
    }
  }
  return [...queries]
}

function collectMediaQueries(token: Selector, queries: Set<string>): void {
  if (token.type === SelectorType.Pseudo) {
    if (token.name === 'matches-media' && typeof token.data === 'string') {
      queries.add(token.data)
    }
    if (Array.isArray(token.data)) {
      for (const group of token.data as Selector[][]) {
        for (const t of group) {
          collectMediaQueries(t, queries)
        }
      }
    }
  }
}

/** Check if any conditional selector contains :matches-path */
function hasPathCondition(ast: Selector[][]): boolean {
  for (const group of ast) {
    for (const token of group) {
      if (tokenHasPathCondition(token)) return true
    }
  }
  return false
}

function tokenHasPathCondition(token: Selector): boolean {
  if (token.type === SelectorType.Pseudo) {
    if (token.name === 'matches-path') return true
    if (Array.isArray(token.data)) {
      return (token.data as Selector[][]).some((group) => group.some((t) => tokenHasPathCondition(t)))
    }
  }
  return false
}

// --- Navigation listener (shared across observe instances) ---

type NavigationCallback = () => void
const navListeners = new Set<NavigationCallback>()
let navInstalled = false
let origPushState: typeof history.pushState | null = null
let origReplaceState: typeof history.replaceState | null = null

function navNotify() {
  for (const cb of navListeners) cb()
}

function installNavListeners() {
  if (navInstalled) return
  navInstalled = true
  origPushState = history.pushState.bind(history)
  origReplaceState = history.replaceState.bind(history)

  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    origPushState!(...args)
    navNotify()
  }
  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    origReplaceState!(...args)
    navNotify()
  }

  window.addEventListener('popstate', navNotify)
}

function uninstallNavListeners() {
  if (!navInstalled) return
  navInstalled = false
  if (origPushState) history.pushState = origPushState
  if (origReplaceState) history.replaceState = origReplaceState
  origPushState = null
  origReplaceState = null
  window.removeEventListener('popstate', navNotify)
}

function onNavigate(cb: NavigationCallback): () => void {
  navListeners.add(cb)
  installNavListeners()
  return () => {
    navListeners.delete(cb)
    if (navListeners.size === 0) {
      uninstallNavListeners()
    }
  }
}
