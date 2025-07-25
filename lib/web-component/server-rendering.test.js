import test from 'ava'
import {parse as parseHtml} from 'parse5'
import {Subject} from 'rxjs'
import {State, Computed} from '../signal/index.js'
import {render} from './server-rendering.js'
import {html, css, Component as BaseComponent} from './index.js'

test('rendering static components', (t) => {
  class ParentComponent {
    static tagName = 'wc-parent'
    static styles = css`
      p {
        color: pink;
      }
    `
    template = html`<wc-child></wc-child>`
  }

  class ChildComponent {
    static tagName = 'wc-child'
    template = html`<p>Hello World!</p>`
  }

  const document = parseHtml(
    render(ParentComponent, {
      components: [ChildComponent],
    }),
  )

  const docType = document.childNodes[0]
  t.is(docType.name, 'html')

  const body = document.childNodes[1].childNodes[1]

  const parentComponent = body.childNodes.find((n) => n.tagName === 'wc-parent')
  t.truthy(parentComponent)

  const parentComponentTemplate = parentComponent.childNodes[0]
  t.is(parentComponentTemplate.tagName, 'template')
  t.deepEqual(parentComponentTemplate.attrs, [
    {name: 'shadowrootmode', value: 'open'},
  ])

  t.is(parentComponentTemplate.content.childNodes[0].tagName, 'style')

  const childComponent = parentComponentTemplate.content.childNodes[1]
  const childComponentTemplate = childComponent.childNodes[0]

  const paragraph = childComponentTemplate.content.childNodes[0]
  t.is(paragraph.childNodes[0].value, 'Hello World!')
})

test('using components as tags', (t) => {
  class ParentComponent {
    static tagName = 'wc-parent'
    static styles = css`
      p {
        color: pink;
      }
    `
    template = html`<${ChildComponent}><//>`
  }

  class ChildComponent {
    static tagName = 'wc-child'
    template = html`<p>Hello World!</p>`
  }

  const document = parseHtml(render(ParentComponent))

  const docType = document.childNodes[0]
  t.is(docType.name, 'html')

  const body = document.childNodes[1].childNodes[1]

  const parentComponent = body.childNodes.find((n) => n.tagName === 'wc-parent')
  t.truthy(parentComponent)

  const parentComponentTemplate = parentComponent.childNodes[0]
  t.is(parentComponentTemplate.tagName, 'template')
  t.deepEqual(parentComponentTemplate.attrs, [
    {name: 'shadowrootmode', value: 'open'},
  ])

  t.is(parentComponentTemplate.content.childNodes[0].tagName, 'style')

  const childComponent = parentComponentTemplate.content.childNodes[1]
  const childComponentTemplate = childComponent.childNodes[0]

  const paragraph = childComponentTemplate.content.childNodes[0]
  t.is(paragraph.childNodes[0].value, 'Hello World!')
})

test('rendering components that use signals', (t) => {
  class ParentComponent {
    static tagName = 'wc-parent'
    message = new State('Hello World!')
    template = html`<wc-child message=${this.message}></wc-child>`
  }

  class ChildComponent {
    static tagName = 'wc-child'
    static attributes = ['message']
    message = new State('')
    template = html`<p>${this.message}</p>`
  }

  const document = parseHtml(
    render(ParentComponent, {
      components: [ChildComponent],
    }),
  )

  const docType = document.childNodes[0]
  t.is(docType.name, 'html')

  const body = document.childNodes[1].childNodes[1]

  const parentComponent = body.childNodes.find((n) => n.tagName === 'wc-parent')
  t.truthy(parentComponent)

  const parentComponentTemplate = parentComponent.childNodes[0]
  t.is(parentComponentTemplate.tagName, 'template')
  t.deepEqual(parentComponentTemplate.attrs, [
    {name: 'shadowrootmode', value: 'open'},
  ])

  const childComponent = parentComponentTemplate.content.childNodes[0]
  t.deepEqual(childComponent.attrs, [
    {name: 'data-wb', value: '0:message'},
    {name: 'message', value: 'Hello World!'},
  ])

  const childComponentTemplate = childComponent.childNodes[0]

  const paragraph = childComponentTemplate.content.childNodes[0]
  t.deepEqual(paragraph.attrs, [{name: 'data-wb', value: '0>0'}])
  t.is(paragraph.childNodes[0].value, 'Hello World!')
})

test('rendering components that use signals to render elements', (t) => {
  class ParentComponent extends BaseComponent {
    static tagName = 'wc-parent'
    show = new State(true)
    template = html`<${ChildComponent} show=${this.show}><//>`
  }

  class ChildComponent extends BaseComponent {
    static tagName = 'wc-child'
    static attributes = ['show']
    show = new State(false)
    template = html`
      ${new Computed(() => {
        return this.show.get() ? html`<p>Hello World!</p>` : html`<p></p>`
      })}
    `
  }

  const document = parseHtml(render(ParentComponent))
  const body = document.childNodes[1].childNodes[1]
  const parentComponent = body.childNodes.find((n) => n.tagName === 'wc-parent')
  const parentComponentTemplate = parentComponent.childNodes[0]
  const childComponent = parentComponentTemplate.content.childNodes[0]
  t.deepEqual(childComponent.attrs, [
    {name: 'data-wb', value: '1:show'},
    {name: 'show', value: ''},
  ])

  const childComponentTemplate = childComponent.childNodes[0]
  const paragraph = childComponentTemplate.content.childNodes[0]
  t.is(paragraph.childNodes[0].value, 'Hello World!')
})

test('rendering components that use observables', (t) => {
  class Component {
    static tagName = 'wc-component'
    clicks = new Subject()
    template = html`<button on:click=${this.clicks}></button>`
  }

  const document = parseHtml(render(Component))

  const docType = document.childNodes[0]
  t.is(docType.name, 'html')

  const body = document.childNodes[1].childNodes[1]

  const component = body.childNodes.find((n) => n.tagName === 'wc-component')
  t.truthy(component)

  const componentTemplate = component.childNodes[0]
  t.is(componentTemplate.tagName, 'template')
  t.deepEqual(componentTemplate.attrs, [
    {name: 'shadowrootmode', value: 'open'},
  ])

  const button = componentTemplate.content.childNodes[0]
  t.deepEqual(button.attrs, [{name: 'data-wb', value: '0<click'}])
})

test('rendering components that ask for dependencies', (t) => {
  class Component extends BaseComponent {
    static tagName = 'wc-component'
    message = this.ask('message')
    template = html`<p>${this.message}</p>`
  }

  const document = parseHtml(
    render(Component, {
      dependencies(key) {
        t.is(key, 'message')
        return 'Hello World!'
      },
    }),
  )
  const body = document.childNodes[1].childNodes[1]
  const component = body.childNodes.find((n) => n.tagName === 'wc-component')
  const componentTemplate = component.childNodes[0]
  const paragraph = componentTemplate.content.childNodes[0]
  t.is(paragraph.childNodes[0].value, 'Hello World!')
})

test('rendering components that ask for dependencies and then render components that ask for more dependencies', (t) => {
  class Parent extends BaseComponent {
    static tagName = 'wc-parent'
    message1 = this.ask('message1')
    template = html`
      ${new Computed(() =>
        this.message1.get()
          ? html`<${Child} message1=${this.message1}><//>`
          : null,
      )}
    `
  }

  class Child extends BaseComponent {
    static tagName = 'wc-child'
    static attributes = ['message1']
    message1 = new State('')
    message2 = this.ask('message2')
    template = html`<p>${this.message1} ${this.message2}</p>`
  }

  const document = parseHtml(
    render(Parent, {
      dependencies(key) {
        if (key === 'message1') return 'Hello'
        if (key === 'message2') return 'World!'
      },
    }),
  )
  const body = document.childNodes[1].childNodes[1]
  const parent = body.childNodes.find((n) => n.tagName === 'wc-parent')
  const parentTemplate = parent.childNodes[0]
  const child = parentTemplate.content.childNodes[0]
  const childTemplate = child.childNodes[0]
  const paragraph = childTemplate.content.childNodes[0]
  t.is(paragraph.childNodes[0].value, 'Hello World!')
})
