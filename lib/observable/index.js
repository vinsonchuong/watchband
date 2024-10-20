import {Observable} from 'rxjs'

export function isObserver(object) {
  return object?.next || typeof object === 'function'
}

export function isObservable(object) {
  return object instanceof Observable
}
