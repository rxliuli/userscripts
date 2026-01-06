import { observeElement } from '../reddit-search-options-persist/observeElement'

// Hide Duolingo popups that promote their app
function injectStyles() {
  const style = document.createElement('style')
  style.textContent = `
#overlays:has([href*="adj.st"]), #root:has([href*="adj.st"]) [data-test="drawer-backdrop"] {
  display: none !important;
}
  `.trim()
  document.head.appendChild(style)
}

injectStyles()

// Automatically close the popups
observeElement({
  selector: '#overlays [href*="adj.st"]+button',
  onElement(element) {
    console.log('✨ Duolingo popups hidden')
    ;(element as HTMLElement).click()
  },
  root: document.documentElement,
})
