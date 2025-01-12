import {makeHtml, makeCss} from './lib/html/index.js'

export * from './lib/html/index.js'
export {chain} from './lib/strategy/index.js'

export const html = makeHtml(globalThis)
export const css = makeCss(globalThis)
