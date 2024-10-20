export function makeCss(window) {
  return function (strings, ...values) {
    const styles = strings.reduce(
      (result, string, i) => result + string + (values[i] ?? ''),
      '',
    )
    const stylesheet = new window.CSSStyleSheet()
    stylesheet.replace(styles)
    return stylesheet
  }
}
