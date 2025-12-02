import type { BaseContext, BaseMiddleware, Interceptor } from '@rxliuli/vista'

async function handleRequest<T extends BaseContext>(context: T, middlewares: BaseMiddleware<T>[]) {
  const compose = (i: number): Promise<void> => {
    if (i >= middlewares.length) {
      return Promise.resolve()
    }
    return middlewares[i](context, () => compose(i + 1)) as Promise<void>
  }
  await compose(0)
}

export interface EventContext {
  type: 'event'
  event: Event
}
export type EventMiddleware = BaseMiddleware<EventContext>

export interface InterceptEventOptions {
  wrappedListeners?: {
    original: EventListenerOrEventListenerObject
    wrapped: EventListener // to wrapped
    type: string
    dom: EventTarget // to element
    options?: boolean | AddEventListenerOptions
  }[]
}

export const interceptEvent: Interceptor<EventMiddleware, InterceptEventOptions> = (middlewares, options) => {
  const originalAddEventListener = EventTarget.prototype.addEventListener
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener
  const wrappedListeners = options?.wrappedListeners ?? []
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (!listener) {
      console.warn('Event listener is null or undefined')
      return
    }
    const wrappedListener = function (this: EventTarget, event: Event) {
      if (typeof options === 'object' && 'once' in options && options.once) {
        this.removeEventListener(type, listener)
      }
      return handleRequest({ type: 'event' as const, event }, [
        ...middlewares,
        (c) => (typeof listener === 'function' ? listener?.(c.event) : listener?.handleEvent(c.event)),
      ])
    }
    wrappedListeners.push({
      original: listener,
      dom: this,
      wrapped: wrappedListener,
      type,
      options,
    })
    return originalAddEventListener.call(this, type, wrappedListener, options)
  }
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    if (!listener) {
      console.warn('Event listener is null or undefined')
      return
    }
    const listeners = wrappedListeners.filter((it) => it.dom === this && it.type === type && it.original === listener)
    if (listeners.length === 0) {
      console.warn('Event listener is not wrapped, cannot remove listener')
      return
    }
    listeners.forEach((it) => {
      originalRemoveEventListener.call(this, type, it.wrapped, options)
      wrappedListeners.splice(wrappedListeners.indexOf(it), 1)
    })
  }
  return () => {
    wrappedListeners.forEach((it) => {
      originalRemoveEventListener.call(it.dom, it.type, it.wrapped, it.options)
      originalAddEventListener.call(it.dom, it.type, it.original, it.options)
    })
    wrappedListeners.length = 0
    EventTarget.prototype.addEventListener = originalAddEventListener
    EventTarget.prototype.removeEventListener = originalRemoveEventListener
  }
}
