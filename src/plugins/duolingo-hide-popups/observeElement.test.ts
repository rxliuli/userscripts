import { expect, it, vi } from 'vitest'
import { observeElement } from './observeElement'
import { userEvent } from '@vitest/browser/context'
import { debounce } from 'es-toolkit'

const sleep = (ms: number = 0) => new Promise((resolve) => setTimeout(resolve, ms))
it('listen single selector changes', async () => {
  const onChange = vi.fn()
  const cleanup = observeElement({
    selector: 'input',
    onElement: (element) => {
      ;(element as HTMLInputElement).addEventListener('input', onChange)
    },
  })

  const input = document.createElement('input')
  document.body.append(input)
  const trigger = () => userEvent.type(document.querySelector('input')!, 'a')
  await trigger()
  expect(onChange).toHaveBeenCalledTimes(1)
  document.querySelector('input')!.replaceWith(input.cloneNode())
  await trigger()
  expect(onChange).toHaveBeenCalledTimes(2)
  cleanup()
})
it('stop observing when onElement', async () => {
  const onElement = vi.fn()
  const cleanup = observeElement({
    selector: 'div',
    onElement,
  })
  onElement.mockImplementation(cleanup)
  const div = document.createElement('div')
  document.body.append(div)
  await Promise.resolve()
  expect(onElement).toHaveBeenCalledTimes(1)
  div.replaceWith(div.cloneNode())
  expect(onElement).toHaveBeenCalledTimes(1)
})
it('observe within a custom root element', async () => {
  const root = document.createElement('div')
  document.body.append(root)
  const onElement = vi.fn()
  const cleanup = observeElement({
    selector: 'span',
    root,
    onElement,
  })
  const span = document.createElement('span')
  root.append(span)
  await sleep()
  expect(onElement).toHaveBeenCalledTimes(1)
  span.replaceWith(span.cloneNode())
  await sleep()
  expect(onElement).toHaveBeenCalledTimes(2)
  document.body.append(span.cloneNode())
  await sleep()
  expect(onElement).toHaveBeenCalledTimes(2)
  cleanup()
})
it('cleanup works correctly', async () => {
  const onElement = vi.fn()
  const cleanup = observeElement({
    selector: 'span',
    onElement,
  })
  const span = document.createElement('span')
  document.body.append(span)
  await sleep()
  expect(onElement).toHaveBeenCalledTimes(1)
  cleanup()
  await sleep()
  expect(onElement).toHaveBeenCalledTimes(1)
})
it('works with Shadow DOM', async () => {
  const onElement = vi.fn()
  const cleanup = observeElement({
    selector: 'button',
    onElement,
    supportShadowDOM: true,
  })
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })
  const button = document.createElement('button')
  document.body.append(host)
  shadow.append(button)
  await sleep()
  expect(onElement).toHaveBeenCalledTimes(1)
  const cloned = button.cloneNode()
  shadow.replaceChild(cloned, button)
  await sleep()
  console.log(shadow.innerHTML)
  expect(onElement).toHaveBeenCalledTimes(2)
  expect(onElement).toHaveBeenCalledWith(button)
  expect(onElement).toHaveBeenCalledWith(cloned)
  cleanup()
})
it('debounce works correctly', async () => {
  const onElement = vi.fn(debounce(() => {}, 100))
  const cleanup = observeElement({
    selector: 'input',
    onElement,
  })
  const input = document.createElement('input')
  document.body.append(input)
  const trigger = () => userEvent.type(document.querySelector('input')!, 'a')
  await trigger()
  await trigger()
  await trigger()
  await sleep(200)
  expect(onElement).toHaveBeenCalledTimes(1)
  cleanup()
})
