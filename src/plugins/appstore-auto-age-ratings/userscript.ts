const CHECK_INTERVAL = 500
const NEXT_DELAY = 500
const MAX_ATTEMPTS = 60

function hasSaveButton(): boolean {
  return [...document.querySelectorAll('[id^="modal-dialog"] button')].some((b) =>
    (b as HTMLButtonElement).innerText.toLowerCase().includes('save'),
  )
}

function findNextButton(): HTMLButtonElement | undefined {
  return [...document.querySelectorAll<HTMLButtonElement>('[id^="modal-dialog"] button')].find(
    (b) => b.innerText.trim().toLowerCase() === 'next',
  )
}

function autoClickNoUntilSave() {
  console.log('[AutoAge] Started: auto-selecting false/NONE until Save')

  let attempt = 0
  let seenSave = false
  let warnedNoFalse = false

  function processStep() {
    attempt++

    if (hasSaveButton()) {
      console.log('[AutoAge] Save button detected, stopping')
      seenSave = true
      return
    }

    if (attempt >= MAX_ATTEMPTS) {
      console.warn('[AutoAge] Max attempts reached, stopping')
      return
    }

    const targets = document.querySelectorAll(
      '[id^="modal-dialog"] input[type="radio"][value="false"]:not(:checked), ' +
        '[id^="modal-dialog"] input[type="radio"][value="NONE"]:not(:checked), ' +
        '[id^="modal-dialog"] input[type="radio"][value="NO"]:not(:checked)',
    )

    if (targets.length > 0) {
      console.log(`[AutoAge] Found ${targets.length} false/NONE/NO options, clicking...`)
      targets.forEach((el) => (el as HTMLElement).click())
      warnedNoFalse = false
      // Wait for user to see the selections before clicking Next
      setTimeout(() => {
        clickNextAndContinue(targets.length)
      }, NEXT_DELAY)
      return
    } else {
      if (!warnedNoFalse) {
        console.log('[AutoAge] No false/NONE/NO options found in this step (may be the last step or already selected)')
        warnedNoFalse = true
      }
    }

    clickNextAndContinue(targets.length)
  }

  function clickNextAndContinue(targetCount: number) {
    if (!seenSave) {
      const nextBtn = findNextButton()
      if (nextBtn) {
        console.log('[AutoAge] Found Next button, clicking...')
        nextBtn.click()
      } else if (targetCount === 0) {
        console.log('[AutoAge] No Next button found and no false/NONE to click, checking if Save step is reached')
      }
    }
    setTimeout(processStep, CHECK_INTERVAL)
  }

  setTimeout(processStep, 1200)
}

GM_registerMenuCommand('Auto-select NO/NONE (Age Ratings)', autoClickNoUntilSave, 'n')
console.log('[AutoAge] Script loaded. Use menu "Auto-select NO/NONE (Age Ratings)" to start')
