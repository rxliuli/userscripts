import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { parse } from 'css-what'
import { matches, validateSelector } from './matches'

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
      expect(matches(el, parse('span'))).toBeTruthy()
      expect(matches(el, parse('div'))).toBeFalsy()
    })

    it('should be case-insensitive', () => {
      container.innerHTML = '<div></div>'
      const el = container.querySelector('div')!
      expect(matches(el, parse('DIV'))).toBeTruthy()
    })
  })

  describe('class selector', () => {
    it('should match single class', () => {
      container.innerHTML = '<div class="foo"></div>'
      const el = container.querySelector('.foo')!
      expect(matches(el, parse('.foo'))).toBeTruthy()
      expect(matches(el, parse('.bar'))).toBeFalsy()
    })

    it('should match element with multiple classes', () => {
      container.innerHTML = '<div class="foo bar baz"></div>'
      const el = container.querySelector('.foo')!
      expect(matches(el, parse('.foo'))).toBeTruthy()
      expect(matches(el, parse('.bar'))).toBeTruthy()
      expect(matches(el, parse('.baz'))).toBeTruthy()
      expect(matches(el, parse('.qux'))).toBeFalsy()
    })

    it('should match compound class selector', () => {
      container.innerHTML = '<div class="foo bar"></div><div class="foo"></div>'
      const el1 = container.children[0] as HTMLElement
      const el2 = container.children[1] as HTMLElement
      expect(matches(el1, parse('.foo.bar'))).toBeTruthy()
      expect(matches(el2, parse('.foo.bar'))).toBeFalsy()
    })
  })

  describe('id selector', () => {
    it('should match by id', () => {
      container.innerHTML = '<div id="myid"></div>'
      const el = container.querySelector('#myid')!
      expect(matches(el, parse('#myid'))).toBeTruthy()
      expect(matches(el, parse('#other'))).toBeFalsy()
    })
  })

  describe('universal selector', () => {
    it('should match any element', () => {
      container.innerHTML = '<div></div><span></span>'
      expect(matches(container.children[0] as Element, parse('*'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse('*'))).toBeTruthy()
    })
  })

  describe('attribute selectors', () => {
    it('[attr] - exists', () => {
      container.innerHTML = '<div data-x></div><div></div>'
      expect(matches(container.children[0] as Element, parse('[data-x]'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse('[data-x]'))).toBeFalsy()
    })

    it('[attr=value] - equals', () => {
      container.innerHTML = '<div data-x="hello"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse('[data-x="hello"]'))).toBeTruthy()
      expect(matches(el, parse('[data-x="world"]'))).toBeFalsy()
    })

    it('[attr^=value] - starts with', () => {
      container.innerHTML = '<div data-x="hello-world"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse('[data-x^="hello"]'))).toBeTruthy()
      expect(matches(el, parse('[data-x^="world"]'))).toBeFalsy()
    })

    it('[attr$=value] - ends with', () => {
      container.innerHTML = '<div data-x="hello-world"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse('[data-x$="world"]'))).toBeTruthy()
      expect(matches(el, parse('[data-x$="hello"]'))).toBeFalsy()
    })

    it('[attr*=value] - contains', () => {
      container.innerHTML = '<div data-x="hello-world"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse('[data-x*="lo-wo"]'))).toBeTruthy()
      expect(matches(el, parse('[data-x*="xyz"]'))).toBeFalsy()
    })

    it('[attr|=value] - hyphen', () => {
      container.innerHTML = '<div lang="en-US"></div><div lang="en"></div><div lang="fr"></div>'
      expect(matches(container.children[0] as Element, parse('[lang|="en"]'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse('[lang|="en"]'))).toBeTruthy()
      expect(matches(container.children[2] as Element, parse('[lang|="en"]'))).toBeFalsy()
    })
  })

  describe('compound selectors', () => {
    it('tag + class', () => {
      container.innerHTML = '<div class="foo"></div><span class="foo"></span>'
      expect(matches(container.children[0] as Element, parse('div.foo'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse('div.foo'))).toBeFalsy()
    })

    it('tag + id + class', () => {
      container.innerHTML = '<div id="x" class="foo"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse('div#x.foo'))).toBeTruthy()
      expect(matches(el, parse('span#x.foo'))).toBeFalsy()
    })
  })

  describe('child combinator (>)', () => {
    it('should match direct child', () => {
      container.innerHTML = '<div id="p"><span class="c"></span></div>'
      const child = container.querySelector('.c')!
      expect(matches(child, parse('#p > .c'))).toBeTruthy()
    })

    it('should NOT match non-direct descendant', () => {
      container.innerHTML = '<div id="p"><div><span class="c"></span></div></div>'
      const child = container.querySelector('.c')!
      expect(matches(child, parse('#p > .c'))).toBeFalsy()
    })
  })

  describe('descendant combinator (space)', () => {
    it('should match any descendant', () => {
      container.innerHTML = '<div id="p"><div><span class="c"></span></div></div>'
      const child = container.querySelector('.c')!
      expect(matches(child, parse('#p .c'))).toBeTruthy()
    })

    it('should not match unrelated element', () => {
      container.innerHTML = '<div id="p"></div><span class="c"></span>'
      const el = container.querySelector('.c')!
      expect(matches(el, parse('#p .c'))).toBeFalsy()
    })
  })

  describe('adjacent sibling combinator (+)', () => {
    it('should match immediate next sibling', () => {
      container.innerHTML = '<div class="a"></div><div class="b"></div>'
      const el = container.querySelector('.b')!
      expect(matches(el, parse('.a + .b'))).toBeTruthy()
    })

    it('should NOT match non-adjacent sibling', () => {
      container.innerHTML = '<div class="a"></div><div></div><div class="b"></div>'
      const el = container.querySelector('.b')!
      expect(matches(el, parse('.a + .b'))).toBeFalsy()
    })
  })

  describe('general sibling combinator (~)', () => {
    it('should match any preceding sibling', () => {
      container.innerHTML = '<div class="a"></div><div></div><div class="b"></div>'
      const el = container.querySelector('.b')!
      expect(matches(el, parse('.a ~ .b'))).toBeTruthy()
    })

    it('should NOT match following sibling', () => {
      container.innerHTML = '<div class="b"></div><div class="a"></div>'
      const el = container.querySelector('.b')!
      expect(matches(el, parse('.a ~ .b'))).toBeFalsy()
    })
  })

  describe('comma-separated selectors', () => {
    it('should match if any selector matches', () => {
      container.innerHTML = '<span class="x"></span>'
      const el = container.querySelector('.x')!
      expect(matches(el, parse('div, span.x'))).toBeTruthy()
      expect(matches(el, parse('div, p'))).toBeFalsy()
    })
  })

  describe('pseudo-classes', () => {
    it(':not()', () => {
      container.innerHTML = '<div class="a"></div><div class="b"></div>'
      expect(matches(container.querySelector('.a')!, parse(':not(.b)'))).toBeTruthy()
      expect(matches(container.querySelector('.b')!, parse(':not(.b)'))).toBeFalsy()
    })

    it(':is()', () => {
      container.innerHTML = '<div class="a"></div><span class="b"></span>'
      expect(matches(container.querySelector('.a')!, parse(':is(.a, .b)'))).toBeTruthy()
      expect(matches(container.querySelector('.b')!, parse(':is(.a, .b)'))).toBeTruthy()
    })

    it(':first-child', () => {
      container.innerHTML = '<div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':first-child'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse(':first-child'))).toBeFalsy()
    })

    it(':last-child', () => {
      container.innerHTML = '<div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':last-child'))).toBeFalsy()
      expect(matches(container.children[1] as Element, parse(':last-child'))).toBeTruthy()
    })

    it(':has()', () => {
      container.innerHTML = '<div><span class="inner"></span></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':has(.inner)'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse(':has(.inner)'))).toBeFalsy()
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
      expect(matches(inner, parse('#host-wrapper span.deep'))).toBeTruthy()
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
      expect(matches(inner, parse('#my-host > .child'))).toBeTruthy()
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

      expect(matches(deep, parse('#outer span.deep'))).toBeTruthy()
      expect(matches(deep, parse('#mid > .deep'))).toBeTruthy()
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

      expect(
        matches(tracker, parse('#user-drawer-content faceplate-tracker:has([href$="/achievements"])')),
      ).toBeTruthy()
    })

    it('#left-sidebar [selectedpagetype] + hr', () => {
      container.innerHTML = '<div id="left-sidebar"></div>'
      const sidebar = container.querySelector('#left-sidebar')!
      const item = document.createElement('div')
      item.setAttribute('selectedpagetype', 'home')
      const hr = document.createElement('hr')
      sidebar.appendChild(item)
      sidebar.appendChild(hr)

      expect(matches(hr, parse('#left-sidebar [selectedpagetype] + hr'))).toBeTruthy()
    })
  })

  describe(':nth-child()', () => {
    it('should match by number', () => {
      container.innerHTML = '<div></div><div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':nth-child(1)'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse(':nth-child(2)'))).toBeTruthy()
      expect(matches(container.children[2] as Element, parse(':nth-child(3)'))).toBeTruthy()
      expect(matches(container.children[0] as Element, parse(':nth-child(2)'))).toBeFalsy()
    })

    it('should match odd', () => {
      container.innerHTML = '<div></div><div></div><div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':nth-child(odd)'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse(':nth-child(odd)'))).toBeFalsy()
      expect(matches(container.children[2] as Element, parse(':nth-child(odd)'))).toBeTruthy()
      expect(matches(container.children[3] as Element, parse(':nth-child(odd)'))).toBeFalsy()
    })

    it('should match even', () => {
      container.innerHTML = '<div></div><div></div><div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':nth-child(even)'))).toBeFalsy()
      expect(matches(container.children[1] as Element, parse(':nth-child(even)'))).toBeTruthy()
      expect(matches(container.children[2] as Element, parse(':nth-child(even)'))).toBeFalsy()
      expect(matches(container.children[3] as Element, parse(':nth-child(even)'))).toBeTruthy()
    })

    it('should match An+B expression', () => {
      container.innerHTML = '<div></div><div></div><div></div><div></div><div></div><div></div>'
      // 3n+1 matches 1, 4
      expect(matches(container.children[0] as Element, parse(':nth-child(3n+1)'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse(':nth-child(3n+1)'))).toBeFalsy()
      expect(matches(container.children[2] as Element, parse(':nth-child(3n+1)'))).toBeFalsy()
      expect(matches(container.children[3] as Element, parse(':nth-child(3n+1)'))).toBeTruthy()
    })

    it('should match -n+3 (first 3 elements)', () => {
      container.innerHTML = '<div></div><div></div><div></div><div></div>'
      expect(matches(container.children[0] as Element, parse(':nth-child(-n+3)'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse(':nth-child(-n+3)'))).toBeTruthy()
      expect(matches(container.children[2] as Element, parse(':nth-child(-n+3)'))).toBeTruthy()
      expect(matches(container.children[3] as Element, parse(':nth-child(-n+3)'))).toBeFalsy()
    })
  })

  describe(':nth-last-child()', () => {
    it('should count from the end', () => {
      container.innerHTML = '<div></div><div></div><div></div>'
      expect(matches(container.children[2] as Element, parse(':nth-last-child(1)'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse(':nth-last-child(2)'))).toBeTruthy()
      expect(matches(container.children[0] as Element, parse(':nth-last-child(3)'))).toBeTruthy()
      expect(matches(container.children[0] as Element, parse(':nth-last-child(1)'))).toBeFalsy()
    })
  })

  describe(':nth-of-type()', () => {
    it('should count only elements of the same type', () => {
      container.innerHTML = '<div></div><span></span><div></div><span></span><div></div>'
      // divs: index 0(1st), 2(2nd), 4(3rd)
      // spans: index 1(1st), 3(2nd)
      expect(matches(container.children[0] as Element, parse('div:nth-of-type(1)'))).toBeTruthy()
      expect(matches(container.children[2] as Element, parse('div:nth-of-type(2)'))).toBeTruthy()
      expect(matches(container.children[4] as Element, parse('div:nth-of-type(3)'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse('span:nth-of-type(1)'))).toBeTruthy()
      expect(matches(container.children[3] as Element, parse('span:nth-of-type(2)'))).toBeTruthy()
    })

    it('should match odd of type', () => {
      container.innerHTML = '<div></div><span></span><div></div><span></span><div></div>'
      expect(matches(container.children[0] as Element, parse('div:nth-of-type(odd)'))).toBeTruthy()
      expect(matches(container.children[2] as Element, parse('div:nth-of-type(odd)'))).toBeFalsy()
      expect(matches(container.children[4] as Element, parse('div:nth-of-type(odd)'))).toBeTruthy()
    })
  })

  describe(':nth-last-of-type()', () => {
    it('should count from the end by type', () => {
      container.innerHTML = '<div></div><span></span><div></div><span></span><div></div>'
      // divs from end: index 4(1st), 2(2nd), 0(3rd)
      expect(matches(container.children[4] as Element, parse('div:nth-last-of-type(1)'))).toBeTruthy()
      expect(matches(container.children[2] as Element, parse('div:nth-last-of-type(2)'))).toBeTruthy()
      expect(matches(container.children[0] as Element, parse('div:nth-last-of-type(3)'))).toBeTruthy()
    })
  })

  describe(':first-of-type / :last-of-type / :only-of-type', () => {
    it(':first-of-type', () => {
      container.innerHTML = '<div></div><span></span><div></div>'
      expect(matches(container.children[0] as Element, parse('div:first-of-type'))).toBeTruthy()
      expect(matches(container.children[2] as Element, parse('div:first-of-type'))).toBeFalsy()
      expect(matches(container.children[1] as Element, parse('span:first-of-type'))).toBeTruthy()
    })

    it(':last-of-type', () => {
      container.innerHTML = '<div></div><span></span><div></div>'
      expect(matches(container.children[0] as Element, parse('div:last-of-type'))).toBeFalsy()
      expect(matches(container.children[2] as Element, parse('div:last-of-type'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse('span:last-of-type'))).toBeTruthy()
    })

    it(':only-of-type', () => {
      container.innerHTML = '<div></div><span></span><div></div>'
      expect(matches(container.children[0] as Element, parse('div:only-of-type'))).toBeFalsy()
      expect(matches(container.children[1] as Element, parse('span:only-of-type'))).toBeTruthy()
    })
  })

  describe(':matches-media()', () => {
    it('should match when media query is true', () => {
      container.innerHTML = '<div class="target"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse(':matches-media(all)'))).toBeTruthy()
      expect(matches(el, parse(':matches-media((min-width: 0px))'))).toBeTruthy()
    })

    it('should not match when media query is false', () => {
      container.innerHTML = '<div class="target"></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse(':matches-media(print)'))).toBeFalsy()
      expect(matches(el, parse(':matches-media((min-width: 99999px))'))).toBeFalsy()
    })

    it('should work combined with other selectors', () => {
      container.innerHTML = '<div class="target"></div><span class="target"></span>'
      expect(matches(container.children[0] as Element, parse('div.target:matches-media(all)'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse('div.target:matches-media(all)'))).toBeFalsy()
    })
  })

  describe(':matches-path()', () => {
    it('should match literal path substring', () => {
      container.innerHTML = '<div></div>'
      const el = container.children[0] as Element
      // In test environment, location.pathname is typically '/' or a test path
      const path = location.pathname
      expect(matches(el, parse(`:matches-path(${path})`))).toBeTruthy()
    })

    it('should not match when path does not contain substring', () => {
      container.innerHTML = '<div></div>'
      const el = container.children[0] as Element
      expect(matches(el, parse(':matches-path(/this-path-definitely-does-not-exist-12345)'))).toBeFalsy()
    })

    it('should support regex pattern', () => {
      container.innerHTML = '<div></div>'
      const el = container.children[0] as Element
      // Match any path (regex that matches everything)
      expect(matches(el, parse(':matches-path(/.*/)'))).toBeTruthy()
      // Match a pattern that won't match
      expect(matches(el, parse(':matches-path(/^NOMATCH$/)'))).toBeFalsy()
    })

    it('should work combined with other selectors', () => {
      container.innerHTML = '<div class="target"></div><span class="other"></span>'
      expect(matches(container.children[0] as Element, parse('div.target:matches-path(/.*/)'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse('div.target:matches-path(/.*/)'))).toBeFalsy()
    })
  })

  describe(':upward()', () => {
    it('should return ancestor with numeric argument', () => {
      container.innerHTML = '<article><div><span class="child"></span></div></article>'
      const child = container.querySelector('.child')!
      const result = matches(child, parse('.child:upward(2)'))
      expect(result).toBe(container.querySelector('article'))
    })

    it('should return parent with :upward(1)', () => {
      container.innerHTML = '<div class="parent"><span class="child"></span></div>'
      const child = container.querySelector('.child')!
      const result = matches(child, parse('.child:upward(1)'))
      expect(result).toBe(container.querySelector('.parent'))
    })

    it('should return null when going beyond root', () => {
      container.innerHTML = '<span class="child"></span>'
      const child = container.querySelector('.child')!
      expect(matches(child, parse('.child:upward(999)'))).toBeFalsy()
    })

    it('should return ancestor matching CSS selector', () => {
      container.innerHTML = '<article class="post"><div><span class="target"></span></div></article>'
      const target = container.querySelector('.target')!
      const result = matches(target, parse('.target:upward(article.post)'))
      expect(result).toBe(container.querySelector('article.post'))
    })

    it('should find closest matching ancestor', () => {
      container.innerHTML = '<div class="outer"><div class="inner"><span class="child"></span></div></div>'
      const child = container.querySelector('.child')!
      const result = matches(child, parse('.child:upward(div)'))
      // Should find the closest div ancestor (inner)
      expect(result).toBe(container.querySelector('.inner'))
    })

    it('should return null when no ancestor matches selector', () => {
      container.innerHTML = '<div><span class="child"></span></div>'
      const child = container.querySelector('.child')!
      expect(matches(child, parse('.child:upward(article)'))).toBeFalsy()
    })

    it('should work with complex ancestor selectors', () => {
      container.innerHTML = '<article id="post"><div class="wrap"><span class="ad"></span></div></article>'
      const ad = container.querySelector('.ad')!
      const result = matches(ad, parse('.ad:upward(article#post)'))
      expect(result).toBe(container.querySelector('article#post'))
    })
  })

  describe(':has-text()', () => {
    it('should match element containing literal text', () => {
      container.innerHTML = '<div>Hello World</div><div>Goodbye</div>'
      expect(matches(container.children[0] as Element, parse(':has-text("Hello")'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse(':has-text("Hello")'))).toBeFalsy()
    })

    it('should match text in nested children', () => {
      container.innerHTML = '<div><span>Deep <b>text</b></span></div>'
      expect(matches(container.children[0] as Element, parse(':has-text("Deep text")'))).toBeTruthy()
    })

    it('should support regex pattern', () => {
      container.innerHTML = '<div>Price: 42.99 USD</div><div>No price</div>'
      expect(matches(container.children[0] as Element, parse(':has-text(/[0-9]+\\.[0-9]+/)'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse(':has-text(/[0-9]+\\.[0-9]+/)'))).toBeFalsy()
    })

    it('should support regex flags', () => {
      container.innerHTML = '<div>HELLO world</div>'
      expect(matches(container.children[0] as Element, parse(':has-text(/hello/i)'))).toBeTruthy()
      expect(matches(container.children[0] as Element, parse(':has-text(/hello/)'))).toBeFalsy()
    })

    it('should work combined with :has()', () => {
      container.innerHTML = '<article><div>Promoted content</div></article><article><div>Normal post</div></article>'
      expect(matches(container.children[0] as Element, parse('article:has-text("Promoted")'))).toBeTruthy()
      expect(matches(container.children[1] as Element, parse('article:has-text("Promoted")'))).toBeFalsy()
    })
  })
})

describe('validateSelector', () => {
  it('should accept :upward() as terminal operation', () => {
    expect(() => validateSelector(parse('.child:upward(2)'))).not.toThrow()
    expect(() => validateSelector(parse('.child:upward(article)'))).not.toThrow()
    expect(() => validateSelector(parse('[noun="menu"]:upward(section)'))).not.toThrow()
  })

  it('should throw when :upward() is followed by adjacent sibling combinator', () => {
    expect(() => validateSelector(parse('.child:upward(section) + hr'))).toThrow(':upward()')
  })

  it('should throw when :upward() is followed by general sibling combinator', () => {
    expect(() => validateSelector(parse('.child:upward(section) ~ hr'))).toThrow(':upward()')
  })

  it('should throw when :upward() is followed by child combinator', () => {
    expect(() => validateSelector(parse('.child:upward(section) > div'))).toThrow(':upward()')
  })

  it('should throw when :upward() is followed by descendant combinator', () => {
    expect(() => validateSelector(parse('.child:upward(section) div'))).toThrow(':upward()')
  })

  it('should accept :upward() with combinators inside its argument', () => {
    // The + here is inside the :upward() argument, not after it
    expect(() => validateSelector(parse('[href="x"]:upward([aria-label="y"] + div)'))).not.toThrow()
  })

  it('should accept comma-separated selectors where :upward() is terminal in each group', () => {
    expect(() => validateSelector(parse('.a:upward(div), .b:upward(span)'))).not.toThrow()
  })

  it('should throw if any group has non-terminal :upward()', () => {
    expect(() => validateSelector(parse('.a:upward(div), .b:upward(span) + hr'))).toThrow(':upward()')
  })
})
