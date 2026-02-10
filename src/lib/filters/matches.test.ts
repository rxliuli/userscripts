import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { parse } from 'css-what'
import { matches } from './matches'

describe('matches', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  describe('tag selector', () => {
    it('should match by tag name', () => {
      container.innerHTML = '<span></span>'
      const el = container.querySelector('span')!
      expect(matches(el, parse('span'))).toBe(true)
      expect(matches(el, parse('div'))).toBe(false)
    })

    it('should be case-insensitive', () => {
      container.innerHTML = '<div></div>'
      const el = container.querySelector('div')!
      expect(matches(el, parse('DIV'))).toBe(true)
    })
  })

  describe('class selector', () => {
    it('should match single class', () => {
      container.innerHTML = '<div class="foo"></div>'
      const el = container.querySelector('.foo')!
      expect(matches(el, parse('.foo'))).toBe(true)
      expect(matches(el, parse('.bar'))).toBe(false)
    })

    it('should match element with multiple classes', () => {
      container.innerHTML = '<div class="foo bar baz"></div>'
      const el = container.querySelector('.foo')!
      expect(matches(el, parse('.foo'))).toBe(true)
      expect(matches(el, parse('.bar'))).toBe(true)
      expect(matches(el, parse('.baz'))).toBe(true)
      expect(matches(el, parse('.qux'))).toBe(false)
    })

    it('should match compound class selector', () => {
      container.innerHTML = '<div class="foo bar"></div><div class="foo"></div>'
      const el1 = container.children[0] as HTMLElement
      const el2 = container.children[1] as HTMLElement
      expect(matches(el1, parse('.foo.bar'))).toBe(true)
      expect(matches(el2, parse('.foo.bar'))).toBe(false)
    })
  })

  describe('id selector', () => {
    it('should match by id', () => {
      container.innerHTML = '<div id="myid"></div>'
      const el = container.querySelector('#myid')!
      expect(matches(el, parse('#myid'))).toBe(true)
      expect(matches(el, parse('#other'))).toBe(false)
    })
  })

  describe('universal selector', () => {
    it('should match any element', () => {
      container.innerHTML = '<div></div><span></span>'
      expect(matches(container.children[0] as Element, parse('*'))).toBe(true)
      expect(matches(container.children[1] as Element, parse('*'))).toBe(true)
    })
  })

  describe('attribute selectors', () => {
    it('[attr] - exists', () => {
      container.innerHTML = '<div data-x></div><div></div>'
      expect(matches(container.children[0] as Element, parse('[data-x]'))).toBe(true)
      expect(matches(container.children[1] as Element, parse('[data-x]'))).toBe(false)
    })

    it('[attr=value] - equals', () => {
      container.innerHTML = '<div data-x="hello"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse('[data-x="hello"]'))).toBe(true)
      expect(matches(el, parse('[data-x="world"]'))).toBe(false)
    })

    it('[attr^=value] - starts with', () => {
      container.innerHTML = '<div data-x="hello-world"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse('[data-x^="hello"]'))).toBe(true)
      expect(matches(el, parse('[data-x^="world"]'))).toBe(false)
    })

    it('[attr$=value] - ends with', () => {
      container.innerHTML = '<div data-x="hello-world"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse('[data-x$="world"]'))).toBe(true)
      expect(matches(el, parse('[data-x$="hello"]'))).toBe(false)
    })

    it('[attr*=value] - contains', () => {
      container.innerHTML = '<div data-x="hello-world"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse('[data-x*="lo-wo"]'))).toBe(true)
      expect(matches(el, parse('[data-x*="xyz"]'))).toBe(false)
    })

    it('[attr|=value] - hyphen', () => {
      container.innerHTML = '<div lang="en-US"></div><div lang="en"></div><div lang="fr"></div>'
      expect(matches(container.children[0] as Element, parse('[lang|="en"]'))).toBe(true)
      expect(matches(container.children[1] as Element, parse('[lang|="en"]'))).toBe(true)
      expect(matches(container.children[2] as Element, parse('[lang|="en"]'))).toBe(false)
    })
  })

  describe('compound selectors', () => {
    it('tag + class', () => {
      container.innerHTML = '<div class="foo"></div><span class="foo"></span>'
      expect(matches(container.children[0] as Element, parse('div.foo'))).toBe(true)
      expect(matches(container.children[1] as Element, parse('div.foo'))).toBe(false)
    })

    it('tag + id + class', () => {
      container.innerHTML = '<div id="x" class="foo"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse('div#x.foo'))).toBe(true)
      expect(matches(el, parse('span#x.foo'))).toBe(false)
    })
  })

  describe('child combinator (>)', () => {
    it('should match direct child', () => {
      container.innerHTML = '<div id="p"><span class="c"></span></div>'
      const child = container.querySelector('.c')!
      expect(matches(child, parse('#p > .c'))).toBe(true)
    })

    it('should NOT match non-direct descendant', () => {
      container.innerHTML = '<div id="p"><div><span class="c"></span></div></div>'
      const child = container.querySelector('.c')!
      expect(matches(child, parse('#p > .c'))).toBe(false)
    })
  })

  describe('descendant combinator (space)', () => {
    it('should match any descendant', () => {
      container.innerHTML = '<div id="p"><div><span class="c"></span></div></div>'
      const child = container.querySelector('.c')!
      expect(matches(child, parse('#p .c'))).toBe(true)
    })

    it('should not match unrelated element', () => {
      container.innerHTML = '<div id="p"></div><span class="c"></span>'
      const el = container.querySelector('.c')!
      expect(matches(el, parse('#p .c'))).toBe(false)
    })
  })

  describe('adjacent sibling combinator (+)', () => {
    it('should match immediate next sibling', () => {
      container.innerHTML = '<div class="a"></div><div class="b"></div>'
      const el = container.querySelector('.b')!
      expect(matches(el, parse('.a + .b'))).toBe(true)
    })

    it('should NOT match non-adjacent sibling', () => {
      container.innerHTML = '<div class="a"></div><div></div><div class="b"></div>'
      const el = container.querySelector('.b')!
      expect(matches(el, parse('.a + .b'))).toBe(false)
    })
  })

  describe('general sibling combinator (~)', () => {
    it('should match any preceding sibling', () => {
      container.innerHTML = '<div class="a"></div><div></div><div class="b"></div>'
      const el = container.querySelector('.b')!
      expect(matches(el, parse('.a ~ .b'))).toBe(true)
    })

    it('should NOT match following sibling', () => {
      container.innerHTML = '<div class="b"></div><div class="a"></div>'
      const el = container.querySelector('.b')!
      expect(matches(el, parse('.a ~ .b'))).toBe(false)
    })
  })

  describe('comma-separated selectors', () => {
    it('should match if any selector matches', () => {
      container.innerHTML = '<span class="x"></span>'
      const el = container.querySelector('.x')!
      expect(matches(el, parse('div, span.x'))).toBe(true)
      expect(matches(el, parse('div, p'))).toBe(false)
    })
  })

  describe('pseudo-classes', () => {
    it(':not()', () => {
      container.innerHTML = '<div class="a"></div><div class="b"></div>'
      expect(matches(container.querySelector('.a')!, parse(':not(.b)'))).toBe(true)
      expect(matches(container.querySelector('.b')!, parse(':not(.b)'))).toBe(false)
    })

    it(':is()', () => {
      container.innerHTML = '<div class="a"></div><span class="b"></span>'
      expect(matches(container.querySelector('.a')!, parse(':is(.a, .b)'))).toBe(true)
      expect(matches(container.querySelector('.b')!, parse(':is(.a, .b)'))).toBe(true)
    })

    it(':first-child', () => {
      container.innerHTML = '<div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':first-child'))).toBe(true)
      expect(matches(container.children[1] as Element, parse(':first-child'))).toBe(false)
    })

    it(':last-child', () => {
      container.innerHTML = '<div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':last-child'))).toBe(false)
      expect(matches(container.children[1] as Element, parse(':last-child'))).toBe(true)
    })

    it(':has()', () => {
      container.innerHTML = '<div><span class="inner"></span></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':has(.inner)'))).toBe(true)
      expect(matches(container.children[1] as Element, parse(':has(.inner)'))).toBe(false)
    })
  })

  describe('shadow DOM traversal', () => {
    it('should match across shadow boundary with descendant combinator', () => {
      container.innerHTML = '<div id="host-wrapper"></div>'
      const wrapper = container.querySelector('#host-wrapper')!
      const host = document.createElement('div')
      host.id = 'shadow-host'
      wrapper.appendChild(host)
      const shadow = host.attachShadow({ mode: 'open' })
      const inner = document.createElement('span')
      inner.className = 'deep'
      shadow.appendChild(inner)

      // "span.deep" is inside shadow, "#host-wrapper" is outside
      expect(matches(inner, parse('#host-wrapper span.deep'))).toBe(true)
    })

    it('should match across shadow boundary with child combinator', () => {
      const host = document.createElement('div')
      host.id = 'my-host'
      container.appendChild(host)
      const shadow = host.attachShadow({ mode: 'open' })
      const inner = document.createElement('div')
      inner.className = 'child'
      shadow.appendChild(inner)

      // Direct child of shadow host
      expect(matches(inner, parse('#my-host > .child'))).toBe(true)
    })

    it('should match nested shadow DOMs', () => {
      const outer = document.createElement('div')
      outer.id = 'outer'
      container.appendChild(outer)
      const shadow1 = outer.attachShadow({ mode: 'open' })
      const mid = document.createElement('div')
      mid.id = 'mid'
      shadow1.appendChild(mid)
      const shadow2 = mid.attachShadow({ mode: 'open' })
      const deep = document.createElement('span')
      deep.className = 'deep'
      shadow2.appendChild(deep)

      expect(matches(deep, parse('#outer span.deep'))).toBe(true)
      expect(matches(deep, parse('#mid > .deep'))).toBe(true)
    })
  })

  describe('complex real-world selectors', () => {
    it('#user-drawer-content faceplate-tracker:has([href$="/achievements"])', () => {
      container.innerHTML = '<div id="user-drawer-content"></div>'
      const drawer = container.querySelector('#user-drawer-content')!
      const tracker = document.createElement('faceplate-tracker')
      const link = document.createElement('a')
      link.setAttribute('href', '/user/test/achievements')
      tracker.appendChild(link)
      drawer.appendChild(tracker)

      expect(matches(tracker, parse('#user-drawer-content faceplate-tracker:has([href$="/achievements"])'))).toBe(true)
    })

    it('#left-sidebar [selectedpagetype] + hr', () => {
      container.innerHTML = '<div id="left-sidebar"></div>'
      const sidebar = container.querySelector('#left-sidebar')!
      const item = document.createElement('div')
      item.setAttribute('selectedpagetype', 'home')
      const hr = document.createElement('hr')
      sidebar.appendChild(item)
      sidebar.appendChild(hr)

      expect(matches(hr, parse('#left-sidebar [selectedpagetype] + hr'))).toBe(true)
    })
  })

  describe(':nth-child()', () => {
    it('should match by number', () => {
      container.innerHTML = '<div></div><div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':nth-child(1)'))).toBe(true)
      expect(matches(container.children[1] as Element, parse(':nth-child(2)'))).toBe(true)
      expect(matches(container.children[2] as Element, parse(':nth-child(3)'))).toBe(true)
      expect(matches(container.children[0] as Element, parse(':nth-child(2)'))).toBe(false)
    })

    it('should match odd', () => {
      container.innerHTML = '<div></div><div></div><div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':nth-child(odd)'))).toBe(true)
      expect(matches(container.children[1] as Element, parse(':nth-child(odd)'))).toBe(false)
      expect(matches(container.children[2] as Element, parse(':nth-child(odd)'))).toBe(true)
      expect(matches(container.children[3] as Element, parse(':nth-child(odd)'))).toBe(false)
    })

    it('should match even', () => {
      container.innerHTML = '<div></div><div></div><div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':nth-child(even)'))).toBe(false)
      expect(matches(container.children[1] as Element, parse(':nth-child(even)'))).toBe(true)
      expect(matches(container.children[2] as Element, parse(':nth-child(even)'))).toBe(false)
      expect(matches(container.children[3] as Element, parse(':nth-child(even)'))).toBe(true)
    })

    it('should match An+B expression', () => {
      container.innerHTML = '<div></div><div></div><div></div><div></div><div></div><div></div>'
      // 3n+1 matches 1, 4
      expect(matches(container.children[0] as Element, parse(':nth-child(3n+1)'))).toBe(true)
      expect(matches(container.children[1] as Element, parse(':nth-child(3n+1)'))).toBe(false)
      expect(matches(container.children[2] as Element, parse(':nth-child(3n+1)'))).toBe(false)
      expect(matches(container.children[3] as Element, parse(':nth-child(3n+1)'))).toBe(true)
    })

    it('should match -n+3 (first 3 elements)', () => {
      container.innerHTML = '<div></div><div></div><div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':nth-child(-n+3)'))).toBe(true)
      expect(matches(container.children[1] as Element, parse(':nth-child(-n+3)'))).toBe(true)
      expect(matches(container.children[2] as Element, parse(':nth-child(-n+3)'))).toBe(true)
      expect(matches(container.children[3] as Element, parse(':nth-child(-n+3)'))).toBe(false)
    })
  })

  describe(':nth-last-child()', () => {
    it('should count from the end', () => {
      container.innerHTML = '<div></div><div></div><div></div>'
      expect(matches(container.children[2] as Element, parse(':nth-last-child(1)'))).toBe(true)
      expect(matches(container.children[1] as Element, parse(':nth-last-child(2)'))).toBe(true)
      expect(matches(container.children[0] as Element, parse(':nth-last-child(3)'))).toBe(true)
      expect(matches(container.children[0] as Element, parse(':nth-last-child(1)'))).toBe(false)
    })
  })

  describe(':nth-of-type()', () => {
    it('should count only elements of the same type', () => {
      container.innerHTML = '<div></div><span></span><div></div><span></span><div></div>'
      // divs: index 0(1st), 2(2nd), 4(3rd)
      // spans: index 1(1st), 3(2nd)
      expect(matches(container.children[0] as Element, parse('div:nth-of-type(1)'))).toBe(true)
      expect(matches(container.children[2] as Element, parse('div:nth-of-type(2)'))).toBe(true)
      expect(matches(container.children[4] as Element, parse('div:nth-of-type(3)'))).toBe(true)
      expect(matches(container.children[1] as Element, parse('span:nth-of-type(1)'))).toBe(true)
      expect(matches(container.children[3] as Element, parse('span:nth-of-type(2)'))).toBe(true)
    })

    it('should match odd of type', () => {
      container.innerHTML = '<div></div><span></span><div></div><span></span><div></div>'
      expect(matches(container.children[0] as Element, parse('div:nth-of-type(odd)'))).toBe(true)
      expect(matches(container.children[2] as Element, parse('div:nth-of-type(odd)'))).toBe(false)
      expect(matches(container.children[4] as Element, parse('div:nth-of-type(odd)'))).toBe(true)
    })
  })

  describe(':nth-last-of-type()', () => {
    it('should count from the end by type', () => {
      container.innerHTML = '<div></div><span></span><div></div><span></span><div></div>'
      // divs from end: index 4(1st), 2(2nd), 0(3rd)
      expect(matches(container.children[4] as Element, parse('div:nth-last-of-type(1)'))).toBe(true)
      expect(matches(container.children[2] as Element, parse('div:nth-last-of-type(2)'))).toBe(true)
      expect(matches(container.children[0] as Element, parse('div:nth-last-of-type(3)'))).toBe(true)
    })
  })

  describe(':first-of-type / :last-of-type / :only-of-type', () => {
    it(':first-of-type', () => {
      container.innerHTML = '<div></div><span></span><div></div>'
      expect(matches(container.children[0] as Element, parse('div:first-of-type'))).toBe(true)
      expect(matches(container.children[2] as Element, parse('div:first-of-type'))).toBe(false)
      expect(matches(container.children[1] as Element, parse('span:first-of-type'))).toBe(true)
    })

    it(':last-of-type', () => {
      container.innerHTML = '<div></div><span></span><div></div>'
      expect(matches(container.children[0] as Element, parse('div:last-of-type'))).toBe(false)
      expect(matches(container.children[2] as Element, parse('div:last-of-type'))).toBe(true)
      expect(matches(container.children[1] as Element, parse('span:last-of-type'))).toBe(true)
    })

    it(':only-of-type', () => {
      container.innerHTML = '<div></div><span></span><div></div>'
      expect(matches(container.children[0] as Element, parse('div:only-of-type'))).toBe(false)
      expect(matches(container.children[1] as Element, parse('span:only-of-type'))).toBe(true)
    })
  })

  describe(':has-text()', () => {
    it('should match element containing literal text', () => {
      container.innerHTML = '<div>Hello World</div><div>Goodbye</div>'
      expect(matches(container.children[0] as Element, parse(':has-text("Hello")'))).toBe(true)
      expect(matches(container.children[1] as Element, parse(':has-text("Hello")'))).toBe(false)
    })

    it('should match text in nested children', () => {
      container.innerHTML = '<div><span>Deep <b>text</b></span></div>'
      expect(matches(container.children[0] as Element, parse(':has-text("Deep text")'))).toBe(true)
    })

    it('should support regex pattern', () => {
      container.innerHTML = '<div>Price: 42.99 USD</div><div>No price</div>'
      expect(matches(container.children[0] as Element, parse(':has-text(/[0-9]+\\.[0-9]+/)'))).toBe(true)
      expect(matches(container.children[1] as Element, parse(':has-text(/[0-9]+\\.[0-9]+/)'))).toBe(false)
    })

    it('should support regex flags', () => {
      container.innerHTML = '<div>HELLO world</div>'
      expect(matches(container.children[0] as Element, parse(':has-text(/hello/i)'))).toBe(true)
      expect(matches(container.children[0] as Element, parse(':has-text(/hello/)'))).toBe(false)
    })

    it('should work combined with :has()', () => {
      container.innerHTML = '<article><div>Promoted content</div></article><article><div>Normal post</div></article>'
      expect(matches(container.children[0] as Element, parse('article:has-text("Promoted")'))).toBe(true)
      expect(matches(container.children[1] as Element, parse('article:has-text("Promoted")'))).toBe(false)
    })
  })
})
