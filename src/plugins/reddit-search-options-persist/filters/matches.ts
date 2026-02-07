import { type Selector, SelectorType, type AttributeSelector } from 'css-what'

/**
 * Check if an element matches a parsed css-what AST (Selector[][]).
 * Outer array = comma-separated groups, inner array = token sequence.
 */
export function matches(el: Element, ast: Selector[][]): boolean {
  return ast.some((tokens) => matchesCompound(el, tokens, tokens.length - 1))
}

/**
 * Right-to-left matching of a single selector token sequence.
 * `pos` is the current index into `tokens` we need to satisfy.
 */
function matchesCompound(el: Element, tokens: Selector[], pos: number): boolean {
  // Consume all simple selectors at current position (right-to-left)
  let i = pos
  while (i >= 0 && !isTraversal(tokens[i])) {
    if (!matchesToken(el, tokens[i])) return false
    i--
  }

  // All tokens consumed — full match
  if (i < 0) return true

  // tokens[i] is a combinator — resolve it
  const combinator = tokens[i]
  const nextPos = i - 1 // position of the tokens before the combinator

  switch (combinator.type) {
    case SelectorType.Child:
      return matchesChild(el, tokens, nextPos)
    case SelectorType.Descendant:
      return matchesDescendant(el, tokens, nextPos)
    case SelectorType.Adjacent:
      return matchesAdjacent(el, tokens, nextPos)
    case SelectorType.Sibling:
      return matchesSibling(el, tokens, nextPos)
    default:
      return false
  }
}

// --- Combinator handlers ---

/** `>` — parent must match, with shadow DOM traversal */
function matchesChild(el: Element, tokens: Selector[], pos: number): boolean {
  const parent = getParent(el)
  return parent !== null && matchesCompound(parent, tokens, pos)
}

/** ` ` (space) — any ancestor must match, with shadow DOM traversal */
function matchesDescendant(el: Element, tokens: Selector[], pos: number): boolean {
  let current = getParent(el)
  while (current !== null) {
    if (matchesCompound(current, tokens, pos)) return true
    current = getParent(current)
  }
  return false
}

/** `+` — previous sibling must match */
function matchesAdjacent(el: Element, tokens: Selector[], pos: number): boolean {
  const prev = el.previousElementSibling
  return prev !== null && matchesCompound(prev, tokens, pos)
}

/** `~` — any previous sibling must match */
function matchesSibling(el: Element, tokens: Selector[], pos: number): boolean {
  let prev = el.previousElementSibling
  while (prev !== null) {
    if (matchesCompound(prev, tokens, pos)) return true
    prev = prev.previousElementSibling
  }
  return false
}

// --- Single token matching ---

function matchesToken(el: Element, token: Selector): boolean {
  switch (token.type) {
    case SelectorType.Tag:
      return el.localName === token.name.toLowerCase()
    case SelectorType.Universal:
      return true
    case SelectorType.Attribute:
      return matchesAttribute(el, token)
    case SelectorType.Pseudo:
      return matchesPseudo(el, token)
    case SelectorType.PseudoElement:
      // pseudo-elements don't apply to element matching
      return false
    default:
      return false
  }
}

function matchesAttribute(el: Element, token: AttributeSelector): boolean {
  // Class shorthand: css-what parses `.foo` as attribute with name="class" action="element"
  // ID shorthand: css-what parses `#foo` as attribute with name="id" action="equals"
  const attrValue = el.getAttribute(token.name)

  if (token.action === 'exists') {
    return attrValue !== null
  }

  if (attrValue === null) return false

  const expected = token.ignoreCase === true ? token.value.toLowerCase() : token.value
  const actual = token.ignoreCase === true ? attrValue.toLowerCase() : attrValue

  switch (token.action) {
    case 'equals':
      return actual === expected
    case 'element':
      // Whitespace-separated word match (class matching)
      return actual.split(/\s+/).includes(expected)
    case 'start':
      return expected !== '' && actual.startsWith(expected)
    case 'end':
      return expected !== '' && actual.endsWith(expected)
    case 'any':
      return expected !== '' && actual.includes(expected)
    case 'hyphen':
      return actual === expected || actual.startsWith(expected + '-')
    case 'not':
      return actual !== expected
    default:
      return false
  }
}

function matchesPseudo(el: Element, token: { name: string; data: Selector[][] | string | null }): boolean {
  switch (token.name) {
    case 'not':
      return Array.isArray(token.data) && !matches(el, token.data)
    case 'is':
    case 'matches':
    case 'where':
      return Array.isArray(token.data) && matches(el, token.data)
    case 'has':
      return (
        Array.isArray(token.data) &&
        Array.from(el.querySelectorAll('*')).some((child) => matches(child, token.data as Selector[][]))
      )
    case 'first-child':
      return el.previousElementSibling === null
    case 'last-child':
      return el.nextElementSibling === null
    case 'only-child':
      return el.previousElementSibling === null && el.nextElementSibling === null
    case 'empty':
      return el.childNodes.length === 0
    case 'root':
      return el === el.ownerDocument?.documentElement
    case 'nth-child':
    case 'nth-last-child':
    case 'nth-of-type':
    case 'nth-last-of-type': {
      if (typeof token.data !== 'string') return false
      const { a, b } = parseNth(token.data)
      const pos = getNthPosition(el, token.name as 'nth-child' | 'nth-last-child' | 'nth-of-type' | 'nth-last-of-type')
      return matchesNth(pos, a, b)
    }
    case 'first-of-type':
      return getNthPosition(el, 'nth-of-type') === 1
    case 'last-of-type':
      return getNthPosition(el, 'nth-last-of-type') === 1
    case 'only-of-type':
      return getNthPosition(el, 'nth-of-type') === 1 && getNthPosition(el, 'nth-last-of-type') === 1
    case 'has-text': {
      if (typeof token.data !== 'string') return false
      const text = el.textContent ?? ''
      if (token.data.startsWith('/')) {
        const end = token.data.lastIndexOf('/')
        const pattern = token.data.slice(1, end)
        const flags = token.data.slice(end + 1)
        return new RegExp(pattern, flags).test(text)
      }
      const literal = token.data.replace(/^["']|["']$/g, '')
      return text.includes(literal)
    }
    default:
      return false
  }
}

// --- Utilities ---

function isTraversal(token: Selector): boolean {
  return (
    token.type === SelectorType.Child ||
    token.type === SelectorType.Descendant ||
    token.type === SelectorType.Adjacent ||
    token.type === SelectorType.Sibling ||
    token.type === SelectorType.ColumnCombinator
  )
}

/** Parse An+B expression string into { a, b } */
function parseNth(data: string): { a: number; b: number } {
  const s = data.replace(/\s+/g, '').toLowerCase()
  if (s === 'odd') return { a: 2, b: 1 }
  if (s === 'even') return { a: 2, b: 0 }

  const match = s.match(/^([+-]?\d*)?n([+-]\d+)?$/)
  if (!match) {
    // Pure number like "3"
    const num = parseInt(s, 10)
    return { a: 0, b: isNaN(num) ? 0 : num }
  }

  const aStr = match[1]
  const a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : parseInt(aStr, 10)
  const b = match[2] ? parseInt(match[2], 10) : 0
  return { a, b }
}

/** Get 1-based position of element among siblings for nth pseudo-classes */
function getNthPosition(
  el: Element,
  type: 'nth-child' | 'nth-last-child' | 'nth-of-type' | 'nth-last-of-type',
): number {
  const reverse = type === 'nth-last-child' || type === 'nth-last-of-type'
  const filterTag = type === 'nth-of-type' || type === 'nth-last-of-type'
  const tagName = el.localName
  let count = 1
  let sibling: Element | null = reverse ? el.nextElementSibling : el.previousElementSibling
  while (sibling !== null) {
    if (!filterTag || sibling.localName === tagName) count++
    sibling = reverse ? sibling.nextElementSibling : sibling.previousElementSibling
  }
  return count
}

/** Check if position matches An+B formula (for non-negative integer k) */
function matchesNth(pos: number, a: number, b: number): boolean {
  if (a === 0) return pos === b
  const diff = pos - b
  if (a > 0) return diff >= 0 && diff % a === 0
  // a < 0: diff must be <= 0 and divisible by |a|
  return diff <= 0 && diff % a === 0
}

/**
 * Get parent element, transparently crossing shadow DOM boundaries.
 * When an element is a direct child of a ShadowRoot, jump to the shadow host.
 */
function getParent(el: Element): Element | null {
  const parent = el.parentElement
  if (parent !== null) return parent
  // Check if we're inside a shadow root
  const root = el.getRootNode()
  if (root instanceof ShadowRoot) {
    return root.host
  }
  return null
}
