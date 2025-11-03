/**
 * hijackScript - Intercept script loading
 * @param callback Callback function that receives the script node and can modify or block script execution
 */
export function hijackScript(callback: (node: HTMLScriptElement) => void) {
  const dynamicScripts = new WeakSet<HTMLScriptElement>()

  const originalCreateElement = document.createElement.bind(document)
  document.createElement = ((tagName: string, options?: any) => {
    const element = originalCreateElement(tagName, options)
    if (tagName.toLowerCase() === 'script') {
      dynamicScripts.add(element as HTMLScriptElement)
    }
    return element
  }) as typeof document.createElement

  const originalAppendChild = Node.prototype.appendChild
  Node.prototype.appendChild = function <T extends Node>(node: T): T {
    if (node instanceof HTMLScriptElement && dynamicScripts.has(node)) {
      callback(node)
    }
    return originalAppendChild.call(this, node) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(node: T, child: Node | null): T {
    if (node instanceof HTMLScriptElement && dynamicScripts.has(node)) {
      callback(node)
    }
    return originalInsertBefore.call(this, node, child) as T
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLScriptElement && !dynamicScripts.has(node)) {
          callback(node)
        }
      })
    })
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })

  return () => {
    document.createElement = originalCreateElement
    Node.prototype.appendChild = originalAppendChild
    Node.prototype.insertBefore = originalInsertBefore
    observer.disconnect()
  }
}
