import {State} from 'watchband/signal'
import {findAllShadowRoots} from 'watchband/html'

export class Navigator {
  #window
  #routes
  #previousRoute = new State(null)
  #currentRoute = new State(null)

  constructor(window, provider, routes) {
    this.#window = window
    this.#routes = routes.map((route) => ({
      ...route,
      pattern: new URLPattern({pathname: route.path}),
    }))

    this.#setRoute(window.location, false)

    provider.provide('previousRoute', this.#previousRoute)
    provider.provide('route', this.#currentRoute)

    window.navigation.addEventListener('navigate', (event) => {
      if (
        !event.canIntercept ||
        event.hashChange ||
        event.downloadRequest !== null
      ) {
        return
      }

      const url = new URL(event.destination.url)

      event.intercept({
        handler: () => {
          this.#setRoute(url)
        },
      })
    })
  }

  #setRoute(url, shouldTransition = true) {
    const {pathname, hash} = url

    for (const route of this.#routes) {
      const match = route.pattern.exec({pathname})

      if (match) {
        const oldRoute = this.#currentRoute.get()

        if (shouldTransition) {
          this.#window.document.startViewTransition({
            types: [`${oldRoute.id}_${route.id}`],
            update: () => {
              this.#previousRoute.set(oldRoute)
              this.#currentRoute.set({
                id: route.id,
                data: match.pathname.groups,
                url,
              })
              if (hash) {
                this.#scroll(hash)
              }
            },
          })
        } else {
          this.#previousRoute.set(oldRoute)
          this.#currentRoute.set({
            id: route.id,
            data: match.pathname.groups,
            url,
          })
        }

        return
      }
    }
  }

  #scroll(hash) {
    const roots = [this.#window.document, ...findAllShadowRoots(this.#window)]
    for (const root of roots) {
      const element = root.querySelector(hash)
      if (element) {
        element.scrollIntoView({block: 'center', inline: 'center'})
        return
      }
    }
  }

  navigate(pathname) {
    this.#window.navigation.navigate(pathname)
  }
}
