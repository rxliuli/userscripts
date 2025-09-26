import { Vista, interceptEvent } from '@rxliuli/vista'
import { finder } from '@medv/finder'

export function nonStop() {
  Object.defineProperty(document, 'hidden', {
    get: () => false,
    configurable: true,
  })
  Object.defineProperty(document, 'visibilityState', {
    get: () => 'visible',
    configurable: true,
  })
  document.hasFocus = () => true
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (
          node.nodeName === 'YTMUSIC-YOU-THERE-RENDERER' ||
          (node instanceof HTMLElement && node.querySelector('ytmusic-you-there-renderer'))
        ) {
          console.log('Auto-closing "Are you there?" dialog')

          setTimeout(() => {
            const yesButton = document.querySelector(
              'ytmusic-you-there-renderer:not([aria-hidden="true"]) button[aria-label="Yes"]',
            )
            if (yesButton instanceof HTMLButtonElement) {
              yesButton.click()
              console.log('Clicked "Yes" button')
            }
          }, 100)
        }
      })
    })
  })
  observer.observe(document.body, {
    attributes: true,
  })
  new Vista([interceptEvent])
    .use(async (c, next) => {
      if (
        c.event.target instanceof HTMLVideoElement ||
        c.event.target instanceof HTMLAudioElement ||
        c.event.target instanceof HTMLImageElement ||
        c.event.target instanceof XMLHttpRequest ||
        c.event.target instanceof IDBRequest ||
        c.event.target instanceof IDBTransaction ||
        c.event.target instanceof SourceBuffer
      ) {
        return await next()
      }
      if (c.event.target === window || c.event.target === document) {
        if (
          ['focus', 'focusin', 'pageshow', 'visibilitychange', 'mouseenter', 'mouseover', 'mousemove'].includes(
            c.event.type,
          )
        ) {
          console.log('Blocked event listener:', c.event.target, c.event.type)
          return
        }
      }

      console.log('Event:', c.event.type, c.event.target instanceof Element ? finder(c.event.target) : null)
      await next()
    })
    .intercept()
}
