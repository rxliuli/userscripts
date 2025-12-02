import { querySelectorAllDeep } from 'query-selector-shadow-dom'

function blackenImage(imgNode: HTMLImageElement) {
  imgNode.style.filter = 'brightness(0)'
}

function blankNode(node: HTMLElement) {
  node.style.color = 'transparent'
}

function blackenVideo(videoNode: HTMLVideoElement) {
  videoNode.pause() // 暂停播放
  videoNode.controls = false
  videoNode.style.filter = 'brightness(0)' // 变黑
  // 可选：循环监听，如果视频重播
  videoNode.addEventListener('play', () => {
    videoNode.pause()
    videoNode.currentTime = 0 // 重置到开头
  })
}

function hideNode(node: HTMLElement) {
  node.style.display = 'none'
}

function blackenBackground(node: HTMLElement) {
  node.style.backgroundImage = 'none'
  node.style.backgroundColor = 'transparent'
}

function processExistingPosts(
  selectors: string[],
  action:
    | ((el: HTMLVideoElement) => void)
    | ((el: HTMLImageElement) => void)
    | ((el: HTMLInputElement) => void)
    | ((el: HTMLElement) => void),
) {
  querySelectorAllDeep(selectors.join(',')).forEach((el) => {
    if (el.getAttribute('data-processed') === 'true') {
      return
    }
    el.setAttribute('data-processed', 'true')
    action(el as any)
  })
}

function blankInputPlaceholders(el: HTMLInputElement) {
  el.setAttribute('placeholder', '')
}

const observer = new MutationObserver(() => {
  processExistingPosts(['community-status img[alt="announcement"]'], hideNode)
  processExistingPosts(['video'], blackenVideo)
  processExistingPosts(['shreddit-post img'], blackenImage)
  processExistingPosts(['lite-youtube'], blackenBackground)
  processExistingPosts(
    [
      'shreddit-post img',
      'shreddit-post a',
      'shreddit-post faceplate-number',
      'shreddit-post time',
      'shreddit-post .text-neutral-content-weak',
      'shreddit-post [id^="post-title-"]',
      'shreddit-post [data-testid="subreddit-name"]',
      'shreddit-post [data-post-click-location="text-body"]',
      'shreddit-post [slot="post-media-container"] .crosspost-credit-bar a',
      'shreddit-post [slot="post-media-container"] .crosspost-title a',
      'shreddit-post [slot="post-media-container"] .feed-card-text-preview',
    ],
    blankNode,
  )
  processExistingPosts(
    [
      'recent-posts a',
      'recent-posts faceplate-number',
      'recent-posts time',
      'recent-posts .post-thumbnail-overlay-container',
    ],
    blankNode,
  )
  processExistingPosts(['recent-posts img'], blackenImage)
  // timeline sidebar
  processExistingPosts(['left-nav-community-item a'], blankNode)
  processExistingPosts(['left-nav-community-item img'], blackenImage)
  processExistingPosts(['faceplate-auto-height-animator li a'], blankNode)
  processExistingPosts(['faceplate-auto-height-animator li img'], blackenImage)

  // detail
  // tag
  processExistingPosts(['faceplate-tracker div', 'faceplate-tracker a'], blankNode)
  processExistingPosts(['faceplate-tracker faceplate-img'], hideNode)
  processExistingPosts(['author-flair-event-handler .flair-content'], blankNode)
  processExistingPosts(['author-flair-event-handler .flair-content faceplate-img'], hideNode)
  // search
  processExistingPosts(['#search-input-chip'], blankNode)
  processExistingPosts(['#search-input-chip img'], blackenImage)
  processExistingPosts(['input[enterkeyhint="search"]'], blankInputPlaceholders)
  // subreddit header
  processExistingPosts(
    [
      '#title',
      '#description',
      'shreddit-subreddit-header a',
      'shreddit-subreddit-header .prefixedName',
      'shreddit-subreddit-header .community-details div',
      'shreddit-subreddit-header [slot="weekly-active-users-count"]',
      'shreddit-subreddit-header [slot="weekly-contributions-count"]',
    ],
    blankNode,
  )
  processExistingPosts(['community-author-flair img'], blackenImage)
  processExistingPosts(['community-author-flair .author-username'], blankNode)
  processExistingPosts(['.text-neutral-content-weak li img'], blackenImage)
  processExistingPosts(
    ['.text-neutral-content-weak li a', '.text-neutral-content-weak li .text-secondary-weak'],
    blankNode,
  )
  // comments
  processExistingPosts(
    [
      'shreddit-comment-tree a',
      'shreddit-comment-tree time',
      'shreddit-comment-tree [slot="comment"]',
      'shreddit-comment-tree faceplate-number',
    ],
    blankNode,
  )
  processExistingPosts(['shreddit-comment-tree faceplate-tracker image', 'shreddit-comment-tree img'], blackenImage)
  // rules
  processExistingPosts(['faceplate-expandable-section-helper li .text-14 .text-neutral-content-weak'], blankNode)
  processExistingPosts(
    [
      '.text-neutral-content-weak .uppercase  .i18n-translatable-text',
      'faceplate-partial aside .i18n-translatable-text',
    ],
    blankNode,
  )
  // right tags
  processExistingPosts(['faceplate-partial a[href^="/r/"] [id^="-post"][id$="-content"]'], blankNode)
  processExistingPosts(['faceplate-partial a[href^="/r/"] faceplate-img'], hideNode)
})
observer.observe(document.documentElement, { childList: true, subtree: true })
