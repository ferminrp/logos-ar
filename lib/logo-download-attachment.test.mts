import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  logoDownloadFilenameExtension,
  parseAttachmentFilename,
  resolveLogoDownloadFilename,
} from './logo-download-attachment.ts'

describe('logo-download-attachment', () => {
  it('parseAttachmentFilename reads quoted filename', () => {
    assert.equal(
      parseAttachmentFilename('attachment; filename="www_telecentro_com_ar_logo.jpg"'),
      'www_telecentro_com_ar_logo.jpg',
    )
  })

  it('resolveLogoDownloadFilename prefers Content-Disposition over client fallback', () => {
    const response = new Response(null, {
      headers: {
        'Content-Disposition': 'attachment; filename="www_telecentro_com_ar_logo.jpg"',
        'Content-Type': 'image/jpeg',
      },
    })
    const filename = resolveLogoDownloadFilename(
      response,
      'www_telecentro_com_ar_logo.png',
    )
    assert.equal(filename, 'www_telecentro_com_ar_logo.jpg')
    assert.notEqual(logoDownloadFilenameExtension(filename), 'png')
  })
})
