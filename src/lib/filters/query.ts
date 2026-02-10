import { parse } from 'css-what'
import { matches, validateSelector } from './matches'

export function querySelectorAll(root: Element, selector: string): Element[] {
  const ast = parse(selector)
  validateSelector(ast)
  const results: Element[] = []
  for (const el of walkDOM(root)) {
    const matched = matches(el, ast)
    if (matched) {
      results.push(matched)
    }
  }
  return results
}

export function querySelector(root: Element, selector: string): Element | null {
  const ast = parse(selector)
  validateSelector(ast)
  for (const el of walkDOM(root)) {
    const matched = matches(el, ast)
    if (matched) {
      return matched
    }
  }
  return null
}

/** Depth-first traversal of all elements, including inside shadow roots. */
function* walkDOM(el: Element): Generator<Element> {
  yield el
  if (el.shadowRoot) {
    yield* walkChildren(el.shadowRoot)
  }
  yield* walkChildren(el)
}

function* walkChildren(parent: Element | ShadowRoot): Generator<Element> {
  let child = parent.firstElementChild
  while (child) {
    yield* walkDOM(child)
    child = child.nextElementSibling
  }
}
