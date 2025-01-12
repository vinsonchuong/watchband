import flowRight from 'lodash/flowRight.js'

function ignore() {
  return () => null
}

export function chain(...strategies) {
  return flowRight(...strategies)(ignore)
}
