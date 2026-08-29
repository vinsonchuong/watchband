import test from 'ava'
import {JSDOM} from 'jsdom'
import {EventPart} from './index.js'

test.beforeEach((t) => {
  const jsdom = new JSDOM('<!doctype html>')
  t.context.jsdom = jsdom
  t.context.window = jsdom.window
})

test('subscribing to a DOM event', (t) => {
  const {window} = t.context

  const button = window.document.createElement('button')
  const part = new EventPart(button, 'click')

  const clicks = []
  part.subscribe((event) => {
    clicks.push(event)
  })

  t.is(clicks.length, 0)

  button.click()

  t.is(clicks.length, 1)
  t.true(clicks[0] instanceof window.MouseEvent)
  t.is(clicks[0].type, 'click')

  button.click()

  t.is(clicks.length, 2)
  t.true(clicks[1] instanceof window.MouseEvent)
  t.is(clicks[1].type, 'click')
})
