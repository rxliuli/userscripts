import { querySelectorDeep } from 'query-selector-shadow-dom'

export interface ObserveElementOptions {
  selector: string
  onElement: (element: Element) => void
  supportShadowDOM?: boolean
  root?: Element
}

export function observeElement(options: ObserveElementOptions): () => void {
  const { selector, onElement, supportShadowDOM, root = document.body } = options

  const processedElements = new WeakSet<Element>()
  const observers: MutationObserver[] = []
  const observedShadowRoots = new WeakSet<ShadowRoot>()

  const findElement = (): Element | null => {
    const querySelector: (selector: string) => Element | null = supportShadowDOM
      ? querySelectorDeep
      : document.querySelector.bind(document)
    const el = querySelector(selector)
    if (el) {
      return el
    }
    return null
  }

  const observeShadowRoot = (shadowRoot: ShadowRoot) => {
    if (observedShadowRoots.has(shadowRoot)) {
      return
    }
    observedShadowRoots.add(shadowRoot)

    const shadowObserver = new MutationObserver(checkElement)
    shadowObserver.observe(shadowRoot, {
      childList: true,
      subtree: true,
    })
    observers.push(shadowObserver)
  }

  const findAndObserveShadowRoots = (node: Node) => {
    if (node instanceof Element && node.shadowRoot) {
      observeShadowRoot(node.shadowRoot)
    }
    // node.childNodes.forEach((child) => findAndObserveShadowRoots(child))
  }

  const checkElement = () => {
    const element = findElement()

    if (!element) {
      return
    }

    if (processedElements.has(element)) {
      return
    }

    processedElements.add(element)
    onElement(element)
  }

  checkElement()

  if (supportShadowDOM) {
    findAndObserveShadowRoots(root)
  }

  const observer = new MutationObserver((mutations) => {
    checkElement()

    if (supportShadowDOM) {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          findAndObserveShadowRoots(node)
        })
      })
    }
  })

  observer.observe(root, {
    childList: true,
    subtree: true,
  })
  observers.push(observer)

  const cleanup = () => {
    observers.forEach((obs) => obs.disconnect())
  }

  return cleanup
}
