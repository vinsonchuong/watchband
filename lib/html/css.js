export function renderStyles(window, template) {
  const styles = serializeStyles(template)
  const stylesheet = new window.CSSStyleSheet()
  stylesheet.replace(styles)
  return stylesheet
}

export function serializeStyles(template) {
  const {strings, values} = template
  return strings.reduce(
    (result, string, i) => result + string + (values[i] ?? ''),
    '',
  )
}
