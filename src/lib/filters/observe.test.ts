import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { observe } from './observe'

describe('observe', () => {
  let container: HTMLElement
  let cleanup: (() => void) | null = null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    cleanup?.()
    cleanup = null
    container.remove()
  })

  const waitForObserver = () =>
    new Promise<void>((resolve) => {
      queueMicrotask(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve())
        })
      })
    })

  describe('initial scan', () => {
    it('should match existing elements synchronously', () => {
      container.innerHTML = '<div class="target"></div>'
      const cb = vi.fn()
      cleanup = observe(container, '.target', cb)

      expect(cb).toHaveBeenCalledTimes(1)
      expect(cb).toHaveBeenCalledWith([container.querySelector('.target')])
    })

    it('should not call callback when nothing matches initially', () => {
      container.innerHTML = '<div></div>'
      const cb = vi.fn()
      cleanup = observe(container, '.target', cb)

      expect(cb).not.toHaveBeenCalled()
    })
  })

  describe('dynamic elements', () => {
    it('should detect dynamically added elements', async () => {
      const cb = vi.fn()
      cleanup = observe(container, '.target', cb)

      const el = document.createElement('div')
      el.className = 'target'
      container.appendChild(el)

      await waitForObserver()

      expect(cb).toHaveBeenCalledWith([el])
    })

    it('should detect elements within added subtree', async () => {
      const cb = vi.fn()
      cleanup = observe(container, '.target', cb)

      const wrapper = document.createElement('div')
      wrapper.innerHTML = '<div class="target">1</div><div class="target">2</div>'
      container.appendChild(wrapper)

      await waitForObserver()

      expect(cb).toHaveBeenCalledWith(expect.arrayContaining([wrapper.children[0], wrapper.children[1]]))
    })

    it('should not report the same element twice', async () => {
      const cb = vi.fn()
      cleanup = observe(container, '.target', cb)

      const el = document.createElement('div')
      el.className = 'target'
      container.appendChild(el)
      await waitForObserver()

      // Remove and re-add
      container.removeChild(el)
      container.appendChild(el)
      await waitForObserver()

      // Only one call for this element
      expect(cb).toHaveBeenCalledTimes(1)
    })
  })

  describe('batching', () => {
    it('should batch multiple synchronous mutations into one callback', async () => {
      const cb = vi.fn()
      cleanup = observe(container, '.target', cb)

      for (let i = 0; i < 5; i++) {
        const el = document.createElement('div')
        el.className = 'target'
        container.appendChild(el)
      }

      await waitForObserver()

      expect(cb).toHaveBeenCalledTimes(1)
      expect(cb.mock.calls[0][0]).toHaveLength(5)
    })
  })

  describe('combinators', () => {
    it('should match descendant combinator for dynamically added elements', async () => {
      container.innerHTML = '<div id="parent"></div>'
      const parent = container.querySelector('#parent')!

      const cb = vi.fn()
      cleanup = observe(container, '#parent .child', cb)

      const child = document.createElement('span')
      child.className = 'child'
      parent.appendChild(child)

      await waitForObserver()

      expect(cb).toHaveBeenCalledWith([child])
    })

    it('should match adjacent sibling combinator', async () => {
      container.innerHTML = '<div id="sidebar"></div>'
      const sidebar = container.querySelector('#sidebar')!

      const cb = vi.fn()
      cleanup = observe(container, '#sidebar [data-type] + hr', cb)

      const item = document.createElement('div')
      item.setAttribute('data-type', 'home')
      const hr = document.createElement('hr')
      sidebar.appendChild(item)
      sidebar.appendChild(hr)

      await waitForObserver()

      expect(cb).toHaveBeenCalledWith([hr])
    })
  })

  describe('shadow DOM', () => {
    it('should match elements inside existing shadow roots on initial scan', () => {
      const host = document.createElement('div')
      const shadow = host.attachShadow({ mode: 'open' })
      const target = document.createElement('div')
      target.className = 'target'
      shadow.appendChild(target)
      container.appendChild(host)

      const cb = vi.fn()
      cleanup = observe(container, '.target', cb)

      expect(cb).toHaveBeenCalledWith([target])
    })

    it('should detect elements added inside shadow roots dynamically', async () => {
      const host = document.createElement('div')
      const shadow = host.attachShadow({ mode: 'open' })
      container.appendChild(host)

      const cb = vi.fn()
      cleanup = observe(container, '.target', cb)

      const target = document.createElement('div')
      target.className = 'target'
      shadow.appendChild(target)

      await waitForObserver()

      expect(cb).toHaveBeenCalledWith([target])
    })

    it('should detect elements inside lazily-created shadow roots', async () => {
      // Simulate a Web Component that creates its shadow DOM after being added
      const host = document.createElement('div')
      container.appendChild(host)

      const cb = vi.fn()
      cleanup = observe(container, '.target', cb)

      // Shadow root created after observe() starts (like connectedCallback)
      const shadow = host.attachShadow({ mode: 'open' })
      const target = document.createElement('hr')
      target.className = 'target'
      shadow.appendChild(target)

      // Wait for the poll interval (500ms) + RAF
      await new Promise<void>((resolve) => setTimeout(resolve, 600))
      await waitForObserver()

      expect(cb).toHaveBeenCalledWith([target])
    })
  })

  describe('cleanup', () => {
    it('should stop observing after cleanup', async () => {
      const cb = vi.fn()
      cleanup = observe(container, '.target', cb)

      cleanup()
      cleanup = null

      const el = document.createElement('div')
      el.className = 'target'
      container.appendChild(el)

      await waitForObserver()

      expect(cb).not.toHaveBeenCalled()
    })
  })
})
