/** Triggers a browser download for a `href` (data URI or object URL) without leaving a stray `<a>` in the DOM. */
export const downloadFromHref = (href: string, filename: string): void => {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/** Same as `downloadFromHref`, but for in-memory JSON — builds and revokes the object URL itself. */
export const downloadJson = (data: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  downloadFromHref(url, filename)
  URL.revokeObjectURL(url)
}
