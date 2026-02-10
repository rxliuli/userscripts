import { observe } from '../../lib/filters'

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
  observe(
    document.body,
    'ytmusic-you-there-renderer:not([aria-hidden="true"]) button[aria-label="Yes"]',
    ([yesButton]) => {
      if (yesButton instanceof HTMLButtonElement) {
        console.log('Auto-closing "Are you there?" dialog via observer')
        setTimeout(() => {
          yesButton.click()
          console.log('Clicked "Yes" button')
        }, 100)
      }
    },
  )
}
