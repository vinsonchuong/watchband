import test from 'ava'
import {JSDOM} from 'jsdom'
import {ChildNodePart} from './index.js'

test.beforeEach((t) => {
  const jsdom = new JSDOM('<!doctype html>')
  t.context.jsdom = jsdom
  t.context.window = jsdom.window
})

test('managing a single child node', (t) => {
  const {window} = t.context

  const div = window.document.createElement('div')
  const part = new ChildNodePart(div)

  t.deepEqual(part.value, [])

  const p = window.document.createElement('p')

  part.value = p

  t.is(part.value, p)
  t.deepEqual(Array.from(div.children), [p])

  const span = window.document.createElement('span')
  part.value = span

  t.is(part.value, span)
  t.deepEqual(Array.from(div.children), [span])
})

test('managing a list of child nodes', (t) => {
  const {window} = t.context

  const div = window.document.createElement('div')
  const part = new ChildNodePart(div)

  t.deepEqual(part.value, [])

  const p1 = window.document.createElement('p')
  const p2 = window.document.createElement('p')
  const p3 = window.document.createElement('p')

  part.value = [p1, p2, p3]

  t.deepEqual(part.value, [p1, p2, p3])
  t.deepEqual(Array.from(div.children), [p1, p2, p3])

  part.value = [p3, p2, p1]

  t.deepEqual(part.value, [p3, p2, p1])
  t.deepEqual(Array.from(div.children), [p3, p2, p1])

  part.value = [p3, p1]

  t.deepEqual(part.value, [p3, p1])
  t.deepEqual(Array.from(div.children), [p3, p1])
})

test('adding a ChildNodePart after another ChildNodePart', (t) => {
  const {window} = t.context

  const div = window.document.createElement('div')
  const part1 = new ChildNodePart(div)
  const part2 = new ChildNodePart(div, div.lastChild)

  t.deepEqual(part1.value, [])
  t.deepEqual(part2.value, [])

  const p1 = window.document.createElement('p')
  const p2 = window.document.createElement('p')
  const p3 = window.document.createElement('p')
  const p4 = window.document.createElement('p')
  const p5 = window.document.createElement('p')
  const p6 = window.document.createElement('p')

  part1.value = [p1, p2, p3]
  part2.value = [p4, p5, p6]

  t.deepEqual(Array.from(div.childNodes), [
    part1.startSentinelNode,
    p1,
    p2,
    p3,
    part1.endSentinelNode,
    part2.startSentinelNode,
    p4,
    p5,
    p6,
    part2.endSentinelNode,
  ])
  t.deepEqual(part1.value, [p1, p2, p3])
  t.deepEqual(part2.value, [p4, p5, p6])

  part1.value = [p1, p3, p5]
  part2.value = [p2, p4, p6]

  t.deepEqual(Array.from(div.childNodes), [
    part1.startSentinelNode,
    p1,
    p3,
    p5,
    part1.endSentinelNode,
    part2.startSentinelNode,
    p2,
    p4,
    p6,
    part2.endSentinelNode,
  ])
  t.deepEqual(part1.value, [p1, p3, p5])
  t.deepEqual(part2.value, [p2, p4, p6])
})

test('adding a ChildNodePart before another ChildNodePart', (t) => {
  const {window} = t.context

  const div = window.document.createElement('div')
  const part1 = new ChildNodePart(div)
  const part2 = new ChildNodePart(div, null, div.firstChild)

  t.deepEqual(part1.value, [])
  t.deepEqual(part2.value, [])

  const p1 = window.document.createElement('p')
  const p2 = window.document.createElement('p')
  const p3 = window.document.createElement('p')
  const p4 = window.document.createElement('p')
  const p5 = window.document.createElement('p')
  const p6 = window.document.createElement('p')

  part1.value = [p1, p2, p3]
  part2.value = [p4, p5, p6]

  t.deepEqual(Array.from(div.childNodes), [
    part2.startSentinelNode,
    p4,
    p5,
    p6,
    part2.endSentinelNode,
    part1.startSentinelNode,
    p1,
    p2,
    p3,
    part1.endSentinelNode,
  ])
  t.deepEqual(part1.value, [p1, p2, p3])
  t.deepEqual(part2.value, [p4, p5, p6])

  part1.value = [p1, p3, p5]
  part2.value = [p2, p4, p6]

  t.deepEqual(Array.from(div.childNodes), [
    part2.startSentinelNode,
    p2,
    p4,
    p6,
    part2.endSentinelNode,
    part1.startSentinelNode,
    p1,
    p3,
    p5,
    part1.endSentinelNode,
  ])
  t.deepEqual(part1.value, [p1, p3, p5])
  t.deepEqual(part2.value, [p2, p4, p6])
})

test('managing a text node', (t) => {
  const {window} = t.context

  const div = window.document.createElement('div')
  const part = new ChildNodePart(div)

  t.deepEqual(part.value, [])

  part.value = 'Hello World!'

  t.is(div.textContent, 'Hello World!')
  t.is(div.childNodes[1].data, 'Hello World!')
  t.deepEqual(part.value, div.childNodes[1])

  part.value = 'Something Else!'

  t.is(div.textContent, 'Something Else!')
  t.is(div.childNodes[1].data, 'Something Else!')
  t.deepEqual(part.value, div.childNodes[1])
})

test('using DocumentFragment', (t) => {
  const {window} = t.context

  const div = window.document.createElement('div')
  const part = new ChildNodePart(div)

  t.deepEqual(part.value, [])

  const p1 = window.document.createElement('p')
  const p2 = window.document.createElement('p')
  const p3 = window.document.createElement('p')

  {
    const fragment = new window.DocumentFragment()
    fragment.append(p1, p2, p3)
    part.value = fragment

    t.deepEqual(part.value, [p1, p2, p3])
    t.deepEqual(Array.from(div.children), [p1, p2, p3])
  }

  {
    const fragment = new window.DocumentFragment()
    fragment.append(p3, p2, p1)
    part.value = fragment

    t.deepEqual(part.value, [p3, p2, p1])
    t.deepEqual(Array.from(div.children), [p3, p2, p1])
  }

  {
    const fragment = new window.DocumentFragment()
    fragment.append(p3, p1)
    part.value = fragment

    t.deepEqual(part.value, [p3, p1])
    t.deepEqual(Array.from(div.children), [p3, p1])
  }
})
