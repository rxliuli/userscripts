import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { querySelectorAll, querySelector } from './query'

describe('query', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  describe('querySelectorAll', () => {
    it('should find elements by class', () => {
      container.innerHTML = '<div class="a"></div><div class="b"></div><div class="a"></div>'
      const results = querySelectorAll(container, '.a')
      expect(results).toHaveLength(2)
    })

    it('should find nested elements', () => {
      container.innerHTML = '<div><span class="x"></span></div><span class="x"></span>'
      const results = querySelectorAll(container, 'span.x')
      expect(results).toHaveLength(2)
    })

    it('should find elements with descendant combinator', () => {
      container.innerHTML = '<div id="p"><div><span class="c"></span></div></div><span class="c"></span>'
      const results = querySelectorAll(container, '#p .c')
      expect(results).toHaveLength(1)
      expect(results[0]).toBe(container.querySelector('#p .c'))
    })

    it('should return empty array when nothing matches', () => {
      container.innerHTML = '<div></div>'
      expect(querySelectorAll(container, '.nonexistent')).toEqual([])
    })

    it('should find elements inside shadow DOM', () => {
      const host = document.createElement('div')
      container.appendChild(host)
      const shadow = host.attachShadow({ mode: 'open' })
      const inner = document.createElement('span')
      inner.className = 'deep'
      shadow.appendChild(inner)

      const results = querySelectorAll(container, '.deep')
      expect(results).toHaveLength(1)
      expect(results[0]).toBe(inner)
    })

    it('should find elements in nested shadow DOMs', () => {
      const outer = document.createElement('div')
      container.appendChild(outer)
      const shadow1 = outer.attachShadow({ mode: 'open' })
      const mid = document.createElement('div')
      shadow1.appendChild(mid)
      const shadow2 = mid.attachShadow({ mode: 'open' })
      const deep = document.createElement('span')
      deep.className = 'target'
      shadow2.appendChild(deep)

      const results = querySelectorAll(container, '.target')
      expect(results).toHaveLength(1)
      expect(results[0]).toBe(deep)
    })
  })

  describe('querySelector', () => {
    it('should return first matching element', () => {
      container.innerHTML = '<div class="a">1</div><div class="a">2</div>'
      const result = querySelector(container, '.a')
      expect(result).toBe(container.children[0])
    })

    it('should return null when nothing matches', () => {
      container.innerHTML = '<div></div>'
      expect(querySelector(container, '.nonexistent')).toBeNull()
    })

    it('should find element inside shadow DOM', () => {
      const host = document.createElement('div')
      container.appendChild(host)
      const shadow = host.attachShadow({ mode: 'open' })
      const inner = document.createElement('div')
      inner.id = 'shadow-child'
      shadow.appendChild(inner)

      expect(querySelector(container, '#shadow-child')).toBe(inner)
    })
  })
})
