async function main() {
  console.log('Reddit Ctrl+Enter Sender: Content script loaded')

  document.addEventListener('keydown', handleKeyDown, true)

  function handleKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      console.log('Reddit Ctrl+Enter Sender: Ctrl/Cmd+Enter detected')

      event.preventDefault()
      event.stopPropagation()

      findAndClickButton()
    }
  }

  function findAndClickButton() {
    const activeElement = document.activeElement
    if (!activeElement) {
      console.log('Reddit Ctrl+Enter Sender: No active element found')
      return
    }

    console.log('Reddit Ctrl+Enter Sender: Active element:', activeElement)
    console.log('Reddit Ctrl+Enter Sender: Active element tag:', activeElement.tagName)
    console.log('Reddit Ctrl+Enter Sender: Active element class:', activeElement.className)

    // First try to find edit save button (highest priority)
    let submitButton = findEditSaveButton(activeElement)

    // If no edit save button found, try to find reply submit button
    if (!submitButton) {
      submitButton = findReplySubmitButton(activeElement)
    }

    // Finally try to search in the page (as a fallback)
    if (!submitButton) {
      console.log('Reddit Ctrl+Enter Sender: Trying to find submit button in page')
      submitButton = findSubmitButtonInPage()
    }

    if (submitButton) {
      console.log('Reddit Ctrl+Enter Sender: Found submit button:', submitButton)
      console.log('Reddit Ctrl+Enter Sender: Button text:', submitButton.textContent?.trim())
      console.log('Reddit Ctrl+Enter Sender: Button type:', submitButton.type)
      console.log('Reddit Ctrl+Enter Sender: Button aria-label:', submitButton.getAttribute('aria-label'))
      console.log('Reddit Ctrl+Enter Sender: Clicking button...')

      try {
        submitButton.click()
        console.log('Reddit Ctrl+Enter Sender: Button clicked successfully')
      } catch (error) {
        console.error('Reddit Ctrl+Enter Sender: Error clicking button:', error)
      }
    } else {
      console.log('Reddit Ctrl+Enter Sender: No submit button found')
    }
  }

  function findEditSaveButton(activeElement: Element): HTMLButtonElement | null {
    // Find edit save button - usually contains "save edits", "save" etc.
    let composer = activeElement.closest('shreddit-composer')
    if (!composer) {
      console.log('Reddit Ctrl+Enter Sender: No shreddit-composer found in parent elements')
      return null
    }

    console.log('Reddit Ctrl+Enter Sender: Looking for edit save button in composer')

    // Prioritize finding explicit edit save buttons
    const allButtons = composer.querySelectorAll('button')
    for (const button of allButtons) {
      const buttonText = button.textContent?.toLowerCase().trim() || ''
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || ''

      // Check if it's an edit save button
      if (isEditSaveButton(button as HTMLButtonElement, buttonText, ariaLabel)) {
        console.log('Reddit Ctrl+Enter Sender: Found edit save button:', buttonText)
        return button as HTMLButtonElement
      }
    }

    return null
  }

  function findReplySubmitButton(activeElement: Element): HTMLButtonElement | null {
    // Find reply submit button - usually used to submit new comments or replies
    let composer = activeElement.closest('shreddit-composer')
    if (!composer) {
      return null
    }

    console.log('Reddit Ctrl+Enter Sender: Looking for reply submit button in composer')

    const allButtons = composer.querySelectorAll('button')
    for (const button of allButtons) {
      const buttonText = button.textContent?.toLowerCase().trim() || ''
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || ''

      // Check if it's a reply submit button
      if (isReplySubmitButton(button as HTMLButtonElement, buttonText, ariaLabel)) {
        console.log('Reddit Ctrl+Enter Sender: Found reply submit button:', buttonText)
        return button as HTMLButtonElement
      }
    }

    return null
  }

  function isEditSaveButton(button: HTMLButtonElement, buttonText: string, ariaLabel: string): boolean {
    // Characteristics of edit save button
    const editSavePatterns = ['save edits', 'save edit', 'save changes', 'update comment']

    // Check button text
    if (editSavePatterns.some((pattern) => buttonText.includes(pattern))) {
      return true
    }

    // Check aria-label
    if (editSavePatterns.some((pattern) => ariaLabel.includes(pattern))) {
      return true
    }

    // Check if button is in edit context (by parent element or other attributes)
    const isInEditContext = button.closest('[data-testid*="edit"], [class*="edit"], [id*="edit"]')
    if (isInEditContext && buttonText.includes('save')) {
      return true
    }

    return false
  }

  function isReplySubmitButton(button: HTMLButtonElement, buttonText: string, ariaLabel: string): boolean {
    // Characteristics of reply submit button
    const replySubmitPatterns = ['reply', 'comment', 'post', 'submit', 'send']

    // Check button text
    if (replySubmitPatterns.some((pattern) => buttonText.includes(pattern))) {
      return true
    }

    // Check aria-label
    if (replySubmitPatterns.some((pattern) => ariaLabel.includes(pattern))) {
      return true
    }

    // Check if it's a standard submit button
    if (button.type === 'submit' && button.getAttribute('slot') === 'submit-button') {
      return true
    }

    return false
  }

  function findSubmitButtonInPage(): HTMLButtonElement | null {
    const possibleSelectors = [
      'button[slot="submit-button"]',
      'button[type="submit"]',
      'button',
      'input[type="submit"]',
    ]

    for (const selector of possibleSelectors) {
      try {
        const elements = document.querySelectorAll(selector)
        console.log(`Reddit Ctrl+Enter Sender: Found ${elements.length} elements with selector: ${selector}`)

        for (const element of elements) {
          if (element instanceof HTMLButtonElement && isSubmitButton(element)) {
            console.log('Reddit Ctrl+Enter Sender: Found submit button with selector:', selector)
            return element
          }
        }
      } catch (e) {
        console.log(`Reddit Ctrl+Enter Sender: Selector ${selector} not supported, continuing...`)
        continue
      }
    }

    return null
  }

  function isSubmitButton(button: HTMLButtonElement): boolean {
    const text = button.textContent?.toLowerCase().trim() || ''
    const classes = button.className.toLowerCase()
    const type = button.type.toLowerCase()
    const slot = button.getAttribute('slot')

    console.log('Reddit Ctrl+Enter Sender: Checking button:', {
      text,
      classes,
      type,
      slot,
      tagName: button.tagName,
    })

    if (type === 'submit') {
      console.log('Reddit Ctrl+Enter Sender: Button is type="submit"')
      return true
    }

    const submitTexts = ['save edits', 'reply', 'comment', 'post', 'submit', 'send', 'save']
    if (submitTexts.some((submitText) => text.includes(submitText))) {
      console.log('Reddit Ctrl+Enter Sender: Button text matches submit pattern:', text)
      return true
    }

    if (classes.includes('button-primary') || classes.includes('submit') || classes.includes('primary')) {
      console.log('Reddit Ctrl+Enter Sender: Button has primary/submit class')
      return true
    }

    if (slot === 'submit-button') {
      console.log('Reddit Ctrl+Enter Sender: Button has slot="submit-button"')
      return true
    }

    if (button.offsetParent === null || button.disabled) {
      console.log('Reddit Ctrl+Enter Sender: Button is not visible or disabled')
      return false
    }

    console.log('Reddit Ctrl+Enter Sender: Button does not match submit criteria')
    return false
  }

  return () => {
    document.removeEventListener('keydown', handleKeyDown, true)
    console.log('Reddit Ctrl+Enter Sender: Content script unloaded')
  }
}

main()
