export function findAllShadowRoots(window) {
  const allRoots = []

  const queue = [window.document.body]
  while (queue.length > 0) {
    const root = queue.shift()
    allRoots.push(root)
    const walker = window.document.createTreeWalker(
      root,
      window.NodeFilter.SHOW_ELEMENT,
    )

    let currentElement = walker.nextNode()
    while (currentElement) {
      const shadowRoot = currentElement.shadowRoot
      if (shadowRoot) {
        queue.push(shadowRoot)
      }

      currentElement = walker.nextNode()
    }
  }

  allRoots.shift()
  return allRoots
}
