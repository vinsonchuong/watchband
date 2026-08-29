import test from 'ava'
import {JSDOM} from 'jsdom'
import {AttributePart} from './index.js'

test.beforeEach((t) => {
  const jsdom = new JSDOM('<!doctype html>')
  t.context.jsdom = jsdom
  t.context.window = jsdom.window
})

test('managing an element attribute', (t) => {
  const {window} = t.context

  const div = window.document.createElement('div')
  const part = new AttributePart(div, 'lang')

  t.is(part.value, null)
  t.is(div.getAttribute('lang'), null)

  part.value = 'en-US'

  t.is(div.getAttribute('lang'), 'en-US')
  t.is(part.value, 'en-US')

  part.value = 'en-GB'

  t.is(div.getAttribute('lang'), 'en-GB')
  t.is(part.value, 'en-GB')

  part.value = null
  t.is(div.getAttribute('lang'), null)
})

test('managing a boolean attribute', (t) => {
  const {window} = t.context

  const input = window.document.createElement('input')
  input.setAttribute('type', 'checkbox')

  const part = new AttributePart(input, 'checked')

  t.is(part.value, null)

  part.value = ''

  t.is(input.getAttribute('checked'), '')
  t.true(input.checked)
  t.is(part.value, '')

  part.value = null

  t.is(input.getAttribute('checked'), null)
  t.false(input.checked)
  t.is(part.value, null)
})

test('managing an element property', (t) => {
  const {window} = t.context

  const input = window.document.createElement('input')
  const part = new AttributePart(input, 'prop:value')

  t.is(part.value, '')

  part.value = 'Hello World!'

  t.is(input.value, 'Hello World!')
  t.is(part.value, 'Hello World!')

  part.value = 'Something Else.'

  t.is(input.value, 'Something Else.')
  t.is(part.value, 'Something Else.')
})
