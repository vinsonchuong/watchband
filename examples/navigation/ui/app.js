import {Component, html, css} from 'watchband/web-component'

export class App extends Component {
  static tagName = 'navigation-app'
  static styles = css`
    main {
      display: grid;
    }
  `
  route = this.context('route')
  routeId = this.signal(() => this.route.get()?.id)
  template = html`
    <main>
      <nav>
        <ul>
          <li><a href="/one">One</a></li>
          <li><a href="/two">Two</a></li>
          <li><a href="/three">Three</a></li>
        </ul>
      </nav>

      <article>
        <p>${this.routeId}</p>
      </article>
    </main>
  `
}
