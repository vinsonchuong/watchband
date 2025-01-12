import {svgTagNames} from 'svg-tag-names'
import {htmlTagNames} from 'html-tag-names'

const htmlTagLookup = new Set(htmlTagNames)

const svgTagLookup = new Set(svgTagNames)
for (const htmlTag of htmlTagNames) {
  svgTagLookup.delete(htmlTag)
}

svgTagLookup.add('svg')

export function isTag(window, tag) {
  return (
    htmlTagLookup.has(tag) ||
    svgTagLookup.has(tag) ||
    window.customElements.get(tag)
  )
}

export function createElementFromTag(window, tag) {
  return svgTagLookup.has(tag)
    ? window.document.createElementNS('http://www.w3.org/2000/svg', tag)
    : window.document.createElement(tag)
}
