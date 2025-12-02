import { hijackScript } from './hijackScript'

hijackScript((node) => {
  let text = node.textContent
  if (text.includes('Please allow ads on our site or subscribe')) {
    // Modify detection logic to never trigger
    text = text.replace(text.match(/if\((\w+?>=2.+?===false\))\)/)?.[1]!, 'false')
    text = text.replace(text.match(/else if\((\(.+?<40)\){/)?.[1]!, 'false')
    node.textContent = text
    console.log('✏️ Modified anti-adblock script')
  }
})
