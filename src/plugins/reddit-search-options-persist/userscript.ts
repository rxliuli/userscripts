import { debounce } from 'es-toolkit'
import { observe, querySelector } from './filters'

observe(
  document.body,
  '.input-container > input[name="q"]',
  debounce((elements) => {
    const searchInput = elements[0] as HTMLInputElement
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
      {
        capture: true,
      },
    )
  }, 100),
)

let controller = new AbortController()
observe(
  document.body,
  'a[type="button"][href*="/search/"]',
  debounce(() => {
    controller.abort()
    controller = new AbortController()
    document.querySelectorAll('a[type="button"][href*="/search/"]').forEach((anchor) => {
      const searchAnchor = anchor as HTMLAnchorElement
      searchAnchor.addEventListener(
        'click',
        (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          const url = new URL(searchAnchor.href)
          // merge existing search params from current location
          new URLSearchParams(location.search).forEach((value, key) => {
            if (!url.searchParams.has(key)) {
              url.searchParams.set(key, value)
            }
          })
          url.searchParams.delete('iId')
          location.href = url.toString()
        },
        {
          signal: controller.signal,
        },
      )
    })
  }, 100),
)

function performSearch(query: string) {
  let baseURL = '/search'
  if (querySelector(document.body, '#search-input-chip')) {
    const subredditMatch = location.pathname.match(/^\/r\/([^\/]+)/)
    if (subredditMatch) {
      baseURL = `/r/${subredditMatch[1]}/search`
    }
  }
  const filter = querySelector(document.body, '#search-input-remove-filter') as HTMLDivElement | null
  if (filter && filter.innerText.trim().startsWith('u/')) {
    const username = filter.innerText.trim().slice(2)
    if (username) {
      baseURL = `/user/${username}/search`
    }
  }

  const params = new URLSearchParams(location.search)
  const paramsToKeep = ['type', 'sort', 't']
  const keysToDelete = Array.from(params.keys()).filter((key) => !paramsToKeep.includes(key))
  keysToDelete.forEach((key) => params.delete(key))
  params.set('q', query)
  location.href = `${baseURL}?${params.toString()}`
}
