export function appendChild(next) {
  return (...args) => {
    const [{window, bindings}, element, child] = args

    if (
      child instanceof window.Node ||
      typeof child === 'string' ||
      typeof child === 'number'
    ) {
      element.append(child)
    } else if (child?.element) {
      const template = child
      element.append(template.element)

      const binding = {
        connect() {
          for (const binding of template.bindings) {
            binding.connect()
          }
        },
        disconnect() {
          for (const binding of template.bindings) {
            binding.isconnect()
          }
        },
      }
      bindings.push(binding)
    } else {
      next(...args)
    }
  }
}
