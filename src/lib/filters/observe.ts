import { parse } from 'css-what'
import { matches } from './matches'

export function observe(root: Element, selector: string, cb: (matched: Element[]) => void): () => void {
  const ast = parse(selector)
  const seen = new WeakSet<Element>()
  const observedShadows = new WeakSet<ShadowRoot>()
  const observers: MutationObserver[] = []
  let pending: Element[] = []
  let rafId: number | null = null

  function flush() {
    rafId = null
    if (pending.length > 0) {
      const batch = pending
      pending = []
      cb(batch)
    }
  }

  function schedule(el: Element) {
    if (seen.has(el)) return
    seen.add(el)
    pending.push(el)
    if (rafId === null) {
      rafId = requestAnimationFrame(flush)
    }
  }

  function checkElement(el: Element) {
    if (matches(el, ast)) {
      schedule(el)
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
    cb(batch)
  }

  // Start observing for dynamic changes
  observeTarget(root)

  // Poll for lazily-created shadow roots
  const pollId = setInterval(pollForShadowRoots, 500)

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
  }
}
