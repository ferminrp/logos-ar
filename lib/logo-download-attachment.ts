/** Parse `filename` from a `Content-Disposition` attachment header. */
export function parseAttachmentFilename(
  contentDisposition: string | null,
): string | null {
  if (!contentDisposition) {
    return null
  }

  const filenameStar = contentDisposition.match(/filename\*=UTF-8''([^;\s]+)/i)
  if (filenameStar?.[1]) {
    try {
      return decodeURIComponent(filenameStar[1])
    } catch {
      return filenameStar[1]
    }
  }

  const quoted = contentDisposition.match(/filename="([^"]+)"/i)
  if (quoted?.[1]) {
    return quoted[1]
  }

  const unquoted = contentDisposition.match(/filename=([^;\s]+)/i)
  if (unquoted?.[1]) {
    return unquoted[1]
  }

  return null
}

export function resolveLogoDownloadFilename(
  response: Response,
  fallbackFilename: string,
): string {
  return parseAttachmentFilename(response.headers.get('Content-Disposition')) ?? fallbackFilename
}

export function logoDownloadFilenameExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  if (dot === -1 || dot === filename.length - 1) {
    return ''
  }
  return filename.slice(dot + 1).toLowerCase()
}
