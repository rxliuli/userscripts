import { debounce } from 'es-toolkit'
import { querySelectorDeep } from 'query-selector-shadow-dom'
import { observeElement } from './observeElement'

observeElement({
  selector: '.input-container > input[name="q"]',
  onElement: debounce((element) => {
    const searchInput = element as HTMLInputElement
    console.debug('interceptSearch', searchInput)

    searchInput.addEventListener(
      'keydown',
      (ev) => {
        // console.debug('keydown', ev.key)
        if (ev.key === 'Enter') {
          ev.preventDefault()
          ev.stopPropagation()

          const query = searchInput.value.trim()
          if (!query) {
            return
          }

          performSearch(query)
        }
      },
      true,
    )
  }, 100),
  supportShadowDOM: true,
  root: document.body,
})

function performSearch(query: string) {
  let baseURL = '/search'
  if (querySelectorDeep('faceplate-search-input #search-input-chip')) {
    const subredditMatch = location.pathname.match(/^\/r\/([^\/]+)/)
    if (subredditMatch) {
      baseURL = `/r/${subredditMatch[1]}/search`
    }
    const userMatch = location.pathname.match(/^\/user\/([^\/]+)/)
    if (userMatch) {
      baseURL = `/user/${userMatch[1]}/search`
    }
  }
  const params = new URLSearchParams(location.search)
  const paramsToKeep = ['sort', 't', 'type']
  const keysToDelete = Array.from(params.keys()).filter((key) => !paramsToKeep.includes(key))
  keysToDelete.forEach((key) => params.delete(key))
  params.set('q', query)
  location.href = `${baseURL}?${params.toString()}`
}
