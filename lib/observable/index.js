export function isObserver(object) {
  return object?.next || typeof object === 'function'
}

export {isObservable} from 'rxjs'
