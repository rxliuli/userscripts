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
  document.addEventListener(
    'visibilitychange',
    (e) => {
      e.stopImmediatePropagation()
      e.preventDefault()
    },
    true,
  )

  function watchMediaElement(video: HTMLVideoElement) {
    console.log('[Youtube Music] Watching video element for pause events')
    const pause = video.pause.bind(video)
    let lastPauseTime = 0
    video.pause = () => {
      console.log('[Youtube Music] Prevented video from pausing')
      lastPauseTime = Date.now()
      return pause()
    }
    video.addEventListener('play', () => {
      console.log('[Youtube Music] Video play event detected')
      lastPauseTime = 0
    })
    video.addEventListener('timeupdate', () => {
      try {
        if (
          navigator.mediaSession &&
          navigator.mediaSession.setPositionState &&
          video.duration &&
          isFinite(video.duration) &&
          video.currentTime >= 0
        ) {
          navigator.mediaSession.setPositionState({
            duration: video.duration,
            playbackRate: video.playbackRate || 1,
            position: video.currentTime,
          })
        }
      } catch (e) {
        // ignore
      }
    })
    video.addEventListener('pause', () => {
      if (Date.now() - lastPauseTime <= 200) {
        console.log('[Youtube Music] Pause was intentional, not resuming playback')
        return
      }
      if (video.ended || video.currentTime === 0) {
        console.log('[Youtube Music] Video ended or reset, not resuming playback')
        return
      }
      console.log('[Youtube Music] Resuming video playback')
      video.play()
      lastPauseTime = 0
    })
  }

  // console.log('[Youtube Music] Setting up observer for video element')
  observe(
    document.documentElement,
    'video,ytmusic-you-there-renderer:not([aria-hidden="true"]) button[aria-label="Yes"]',
    {
      onMatch([element]) {
        if (element instanceof HTMLVideoElement) {
          watchMediaElement(element)
        }
        if (element instanceof HTMLButtonElement) {
          console.log('Auto-closing "Are you there?" dialog via observer')
          setTimeout(() => {
            element.click()
            console.log('Clicked "Yes" button')
          }, 100)
        }
      },
    },
  )
}
