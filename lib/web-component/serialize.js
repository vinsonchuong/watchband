import CleanCSS from 'clean-css'
import {serializeStyles} from '../html/index.js'
import {serialize as baseSerialize} from '../html/serialize.js'
import {Element, Text} from '../html/ssr-dom.js'
import {isSignal, effect} from '../signal/index.js'

export function serialize(template, {components = [], context = {}} = {}) {
  const tagLookup = new Map(components.map((c) => [c.tagName, c]))
  const pendingContextRequests = []
  return baseSerialize(template, {
    Element: class extends Element {
      constructor(tag, {parse}) {
        super(tag)

        const Component = tagLookup.get(tag)
        if (!Component) {
          return
        }

        const component = new Component()
        this.component = component

        for (const property of Component.properties) {
          const signal = component.metadata.properties[property]
          Object.defineProperty(this, property, {
            get() {
              return signal.get()
            },
            set(value) {
              signal.set(value)
            },
          })
        }

        for (const [
          key,
          signal,
        ] of component.metadata.context.consumer.entries()) {
          pendingContextRequests.push({
            element: this,
            key,
            signal,
          })
        }

        const nodes = parse(component.template)

        const templateElement = new Element('template')
        templateElement.setAttribute('shadowrootmode', 'open')

        const cleanCss = new CleanCSS({level: 0, inline: false})
        if (Component.styles) {
          const styleElement = new Element('style')
          const {styles} = cleanCss.minify(serializeStyles(Component.styles))
          styleElement.append(styles)
          templateElement.append(styleElement)
        }

        if (isSignal(this.component.styles)) {
          const styleElement = new Element('style')
          styleElement.setAttribute('data-instance', '')
          const styleText = new Text('')
          styleElement.append(styleText)
          templateElement.append(styleElement)

          effect(() => {
            const {styles} = cleanCss.minify(
              serializeStyles(this.component.styles.get()),
            )
            styleText.data = styles
          })
        }

        templateElement.append(...nodes)

        this.prepend(templateElement)
      }

      setAttribute(name, value) {
        super.setAttribute(name, value)

        const signal = this.component.metadata.attributes[name]

        if (signal) {
          signal.set(value)
        }
      }
    },

    afterParse() {
      function resolveContext(element, key, signal) {
        let currentNode = element
        while (currentNode.parent) {
          currentNode = currentNode.parent
          const upstreamSignal =
            currentNode.component?.metadata?.context?.provider?.[key]
          if (upstreamSignal) {
            effect(() => {
              signal.set(upstreamSignal.get())
            })

            break
          }
        }

        if (Object.hasOwn(context, key)) {
          signal.set(context[key])
        }
      }

      for (const {element, key, signal} of pendingContextRequests) {
        if (isSignal(key)) {
          effect(() => {
            resolveContext(element, key.get(), signal)
          })
        } else {
          resolveContext(element, key, signal)
        }
      }
    },
  })
}
