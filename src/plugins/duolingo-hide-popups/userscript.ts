function injectStyles() {
  const style = document.createElement('style')
  style.textContent = `
#overlays:has([href*="adj.st"]), [data-test="drawer-backdrop"] {
  display: none !important;
}

#root {
  overflow: auto !important;
}
  `.trim()
  document.head.appendChild(style)
  console.log('✨ Duolingo popups hidden')
}

injectStyles()
