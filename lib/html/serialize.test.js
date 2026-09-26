import test from 'ava'
import {State} from '../signal/index.js'
import {TestObserver} from '../observable/test-observer.js'
import {serialize} from './serialize.js'
import {html} from './index.js'

test('serializing a single HTML element', (t) => {
  t.is(
    serialize(html`<p lang="en">Hello World!</p>`),
    '<p lang="en">Hello World!</p>',
  )
})

test('ignoring comment nodes', (t) => {
  t.is(serialize(html`<p><!-- comment text --></p>`), '<p></p>')
})

test('serializing multiple top-level HTML elements', (t) => {
  t.is(
    serialize(html`
      <p>One</p>
      <p>Two</p>
      <p>Three</p>
    `),
    '<p>One</p><p>Two</p><p>Three</p>',
  )
})

test('serializing boolean attributes', (t) => {
  t.is(
    serialize(html`<input type="checkbox" checked />`),
    '<input type="checkbox" checked>',
  )
})

test('serializing nested HTML', (t) => {
  t.is(
    serialize(html`
      <div>
        <p>Paragraph One</p>
        <p>Paragraph <span>Two</span></p>
        <p>Paragraph Three</p>
      </div>
    `),
    '<div><p>Paragraph One</p><p>Paragraph <span>Two</span></p><p>Paragraph Three</p></div>',
  )
})

test('serializing nested templates', (t) => {
  t.is(
    serialize(html`<div>${html`<p>Hello World!</p>`}</div>`),
    '<div><!--template 0--><p>Hello World!</p><!--/template--></div>',
  )
})

test('serializing an array of nested templates', (t) => {
  t.is(
    serialize(
      html`<div>
        ${[html`<p>One</p>`, html`<p>Two</p>`, html`<p>Three</p>`]}
      </div>`,
    ),
    '<div><!--template--><p>One</p><!--/template--><!--template--><p>Two</p><!--/template--><!--template--><p>Three</p><!--/template--></div>',
  )
})

test('serializing DOM Parts for a single element', (t) => {
  t.is(
    serialize(html`<p lang="{lang}">{text}</p>`),
    '<!--attribute-parts lang=lang--><p><!--child-node-part text--><!--/child-node-part--></p>',
  )
})

test('serializing DOM Parts for multiple top-level elements', (t) => {
  t.is(
    serialize(html`
      <p lang="{lang1}">{text1}</p>
      <p lang="{lang2}">{text2}</p>
    `),
    [
      '<!--attribute-parts lang=lang1--><p><!--child-node-part text1--><!--/child-node-part--></p>',
      '<!--attribute-parts lang=lang2--><p><!--child-node-part text2--><!--/child-node-part--></p>',
    ].join(''),
  )
})

test('serializing DOM Parts for nested HTML', (t) => {
  t.is(
    serialize(html`
      <div>
        <p lang="{lang1}">{text1}</p>
        <p lang="{lang2}">{text2}</p>
      </div>
    `),
    [
      '<div>',
      '<!--attribute-parts lang=lang1--><p><!--child-node-part text1--><!--/child-node-part--></p>',
      '<!--attribute-parts lang=lang2--><p><!--child-node-part text2--><!--/child-node-part--></p>',
      '</div>',
    ].join(''),
  )
})

test('serializing DOM Parts for nested templates', (t) => {
  t.is(
    // prettier-ignore
    serialize(html`
      <div>
        {parentText}
        ${html`
          <p>
            {childText}
          </p>
        `}
      </div>
    `),
    [
      '<div>',
      '<!--child-node-part parentText--><!--/child-node-part-->',
      '<!--template 0--><p><!--child-node-part childText--><!--/child-node-part--></p><!--/template-->',
      '</div>',
    ].join(''),
  )
})

test('serializing DOM Parts for properties', (t) => {
  t.is(
    serialize(html`<input prop:value="{value}" />`),
    ['<!--attribute-parts prop:value=value-->', '<input>'].join(''),
  )
})

test('serializing DOM Parts for events', (t) => {
  t.is(
    serialize(html`
      <div>
        <button on:click="{oneClicks}">One</button>
        <button on:click="{twoClicks}">Two</button>
      </div>
    `),
    [
      '<div>',
      '<!--attribute-parts on:click=oneClicks-->',
      '<button>One</button>',
      '<!--attribute-parts on:click=twoClicks-->',
      '<button>Two</button>',
      '</div>',
    ].join(''),
  )
})

test('serializing bound signals', (t) => {
  const title1 = new State('P1')
  const content1 = new State('Paragraph 1')
  const title2 = new State('P2')
  const content2 = new State('Paragraph 2')

  t.is(
    serialize(html`
      <div>
        <p title="${title1}">${content1}</p>
        <p title="${title2}">${content2}</p>
      </div>
    `),
    [
      '<div>',
      '<!--attribute-parts title=0-->',
      '<p title="P1"><!--child-node-part 1-->Paragraph 1<!--/child-node-part--></p>',
      '<!--attribute-parts title=2-->',
      '<p title="P2"><!--child-node-part 3-->Paragraph 2<!--/child-node-part--></p>',
      '</div>',
    ].join(''),
  )
})

test('serializing top level elements with bound signals', (t) => {
  const title1 = new State('P1')
  const content1 = new State('Paragraph 1')
  const title2 = new State('P2')
  const content2 = new State('Paragraph 2')

  t.is(
    serialize(html`
      <p title="${title1}">${content1}</p>
      <p title="${title2}">${content2}</p>
    `),
    [
      '<!--attribute-parts title=0-->',
      '<p title="P1"><!--child-node-part 1-->Paragraph 1<!--/child-node-part--></p>',
      '<!--attribute-parts title=2-->',
      '<p title="P2"><!--child-node-part 3-->Paragraph 2<!--/child-node-part--></p>',
    ].join(''),
  )
})

test('serializing elements with bound signals containing templates', (t) => {
  const nestedTemplate = new State(html`<p>Hello World!</p>`)

  t.is(
    serialize(html`<div>${nestedTemplate}</div>`),
    [
      '<div>',
      '<!--child-node-part 0-->',
      '<!--template--><p>Hello World!</p><!--/template-->',
      '<!--/child-node-part-->',
      '</div>',
    ].join(''),
  )
})

test('serializing elements with bound signals containing lists of templates', (t) => {
  const listOfTemplates = new State([
    html`<p>One</p>`,
    html`<p>Two</p>`,
    html`<p>Three</p>`,
  ])

  t.is(
    serialize(html`<div>${listOfTemplates}</div>`),
    [
      '<div>',
      '<!--child-node-part 0-->',
      '<!--template--><p>One</p><!--/template-->',
      '<!--template--><p>Two</p><!--/template-->',
      '<!--template--><p>Three</p><!--/template-->',
      '<!--/child-node-part-->',
      '</div>',
    ].join(''),
  )
})

test('serializing bound observers', (t) => {
  t.is(
    serialize(html`
      <div>
        <button on:click=${new TestObserver()}>One</button>
        <button on:click=${() => {}}>Two</button>
      </div>
    `),
    [
      '<div>',
      '<!--attribute-parts on:click=0-->',
      '<button>One</button>',
      '<!--attribute-parts on:click=1-->',
      '<button>Two</button>',
      '</div>',
    ].join(''),
  )
})
