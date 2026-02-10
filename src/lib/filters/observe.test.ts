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
      cleanup = observe(container, '.target', { onMatch: cb })

      expect(cb).toHaveBeenCalledTimes(1)
      expect(cb).toHaveBeenCalledWith([container.querySelector('.target')])
    })

    it('should not call callback when nothing matches initially', () => {
      container.innerHTML = '<div></div>'
      const cb = vi.fn()
      cleanup = observe(container, '.target', { onMatch: cb })

      expect(cb).not.toHaveBeenCalled()
    })
  })

  describe('dynamic elements', () => {
    it('should detect dynamically added elements', async () => {
      const cb = vi.fn()
      cleanup = observe(container, '.target', { onMatch: cb })

      const el = document.createElement('div')
      el.className = 'target'
      container.appendChild(el)

      await waitForObserver()

      expect(cb).toHaveBeenCalledWith([el])
    })

    it('should detect elements within added subtree', async () => {
      const cb = vi.fn()
      cleanup = observe(container, '.target', { onMatch: cb })

      const wrapper = document.createElement('div')
      wrapper.innerHTML = '<div class="target">1</div><div class="target">2</div>'
      container.appendChild(wrapper)

      await waitForObserver()

      expect(cb).toHaveBeenCalledWith(expect.arrayContaining([wrapper.children[0], wrapper.children[1]]))
    })

    it('should not report the same element twice', async () => {
      const cb = vi.fn()
      cleanup = observe(container, '.target', { onMatch: cb })

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
      cleanup = observe(container, '.target', { onMatch: cb })

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
      cleanup = observe(container, '#parent .child', { onMatch: cb })

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
      cleanup = observe(container, '#sidebar [data-type] + hr', { onMatch: cb })

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
      cleanup = observe(container, '.target', { onMatch: cb })

      expect(cb).toHaveBeenCalledWith([target])
    })

    it('should detect elements added inside shadow roots dynamically', async () => {
      const host = document.createElement('div')
      const shadow = host.attachShadow({ mode: 'open' })
      container.appendChild(host)

      const cb = vi.fn()
      cleanup = observe(container, '.target', { onMatch: cb })

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
      cleanup = observe(container, '.target', { onMatch: cb })

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

  describe('conditional selectors', () => {
    it('should match elements with :matches-media when condition is true', () => {
      container.innerHTML = '<div class="target"></div>'
      const cb = vi.fn()
      cleanup = observe(container, '.target:matches-media(all)', { onMatch: cb })

      expect(cb).toHaveBeenCalledTimes(1)
      expect(cb).toHaveBeenCalledWith([container.querySelector('.target')])
    })

    it('should not match elements with :matches-media when condition is false', () => {
      container.innerHTML = '<div class="target"></div>'
      const cb = vi.fn()
      cleanup = observe(container, '.target:matches-media(print)', { onMatch: cb })

      expect(cb).not.toHaveBeenCalled()
    })

    it('should match elements with :matches-path when path matches', () => {
      container.innerHTML = '<div class="target"></div>'
      const cb = vi.fn()
      // Use regex that matches any path
      cleanup = observe(container, '.target:matches-path(/.*/)', { onMatch: cb })

      expect(cb).toHaveBeenCalledTimes(1)
      expect(cb).toHaveBeenCalledWith([container.querySelector('.target')])
    })

    it('should not match elements with :matches-path when path does not match', () => {
      container.innerHTML = '<div class="target"></div>'
      const cb = vi.fn()
      cleanup = observe(container, '.target:matches-path(/^NOMATCH$/)', { onMatch: cb })

      expect(cb).not.toHaveBeenCalled()
    })

    it('should support onUnmatch callback via options object', () => {
      container.innerHTML = '<div class="target"></div>'
      const onMatch = vi.fn()
      const onUnmatch = vi.fn()
      cleanup = observe(container, '.target:matches-media(all)', { onMatch, onUnmatch })

      expect(onMatch).toHaveBeenCalledTimes(1)
      expect(onUnmatch).not.toHaveBeenCalled()
    })

    it('should handle mixed conditional and unconditional selectors', () => {
      container.innerHTML = '<div class="always"></div><div class="conditional"></div>'
      const cb = vi.fn()
      cleanup = observe(container, '.always, .conditional:matches-media(all)', { onMatch: cb })

      expect(cb).toHaveBeenCalledTimes(1)
      // Both elements should be matched
      const matched = cb.mock.calls[0][0] as Element[]
      expect(matched).toHaveLength(2)
    })

    it('should re-evaluate conditional selectors on path change', async () => {
      container.innerHTML = '<div class="target"></div>'
      const onMatch = vi.fn()
      const onUnmatch = vi.fn()
      // Use a path pattern that doesn't match current path
      cleanup = observe(container, '.target:matches-path(/^\/test-nav-path$/)', { onMatch, onUnmatch })

      expect(onMatch).not.toHaveBeenCalled()

      // Simulate navigation to the matching path
      history.pushState(null, '', '/test-nav-path')

      // Wait a tick for the navigation listener to fire
      await new Promise<void>((resolve) => setTimeout(resolve, 50))

      expect(onMatch).toHaveBeenCalledTimes(1)

      // Navigate away
      history.pushState(null, '', '/')

      await new Promise<void>((resolve) => setTimeout(resolve, 50))

      expect(onUnmatch).toHaveBeenCalledTimes(1)
    })
  })

  describe('cleanup', () => {
    it('should stop observing after cleanup', async () => {
      const cb = vi.fn()
      cleanup = observe(container, '.target', { onMatch: cb })

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
