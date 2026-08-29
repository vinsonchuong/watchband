import test from 'ava'
import {RenderState} from './signal.js'

test('getting and setting state', (t) => {
  const state = new RenderState(1)
  t.is(state.get(), 1)

  state.set(2)
  t.is(state.get(), 2)
})

test('deriving computed state', (t) => {
  const state = new RenderState()
  const a = state.map('a')
  const b = state.map('b')

  t.is(state.get(), undefined)
  t.is(a.get(), undefined)
  t.is(b.get(), undefined)

  state.set({a: 1, b: 2})
  t.deepEqual(state.get(), {a: 1, b: 2})
  t.is(a.get(), 1)
  t.is(b.get(), 2)
})

test('memoized computations over arrays', (t) => {
  const state = new RenderState()
  const list = state.map('items').mapList('id', (item) => ({
    name: item.map('name').map((name) => `${name} Computed`),
  }))
  t.is(list.get(), undefined)

  state.set({
    a: 1,
    items: [],
  })
  t.deepEqual(list.get(), [])

  state.set({
    a: 1,
    items: [{id: 1, name: 'One'}],
  })

  t.is(list.get().length, 1)

  const transformedItemOne = list.get()[0]
  t.is(transformedItemOne.name.get(), 'One Computed')

  state.set({
    a: 1,
    items: [
      {id: 1, name: 'One'},
      {id: 2, name: 'Two'},
    ],
  })

  t.is(list.get().length, 2)
  t.is(list.get()[0], transformedItemOne)

  state.set({
    a: 1,
    items: [
      {id: 1, name: 'One!'},
      {id: 2, name: 'Two'},
    ],
  })

  t.is(list.get()[0], transformedItemOne)
  t.is(transformedItemOne.name.get(), 'One! Computed')
})

test('mapping over a base array', (t) => {
  const state = new RenderState()
  const list = state.mapList('id', (item) => ({
    name: item.map('name'),
  }))
  t.is(list.get(), undefined)

  state.set([])
  t.deepEqual(list.get(), [])

  state.set([{id: 1, name: 'One'}])

  t.is(list.get().length, 1)

  const transformedItemOne = list.get()[0]
  t.is(transformedItemOne.name.get(), 'One')

  state.set([
    {id: 1, name: 'One'},
    {id: 2, name: 'Two'},
  ])

  t.is(list.get().length, 2)
  t.is(list.get()[0], transformedItemOne)

  state.set([
    {id: 1, name: 'One!'},
    {id: 2, name: 'Two'},
  ])

  t.is(list.get()[0], transformedItemOne)
  t.is(transformedItemOne.name.get(), 'One!')
})
