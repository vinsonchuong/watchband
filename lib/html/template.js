export function html(strings, ...values) {
  return new HtmlTemplate(strings, values)
}

export function css(strings, ...values) {
  return new CssTemplate(strings, values)
}

export class Template {
  constructor(strings, values) {
    this.strings = strings
    this.values = values
  }
}

export class HtmlTemplate extends Template {
  type = 'html'
}

export class CssTemplate extends Template {
  type = 'css'
}
