import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  LOGO_SVG_CONTENT_SECURITY_POLICY,
  applyLogoPngSecurityHeaders,
  applyLogoSvgSecurityHeaders,
  logoDownloadPngHeaders,
  logoDownloadSvgHeaders,
} from './logo-image-security-headers.ts'

describe('logo-image-security-headers', () => {
  it('sets nosniff on PNG', () => {
    const headers = new Headers({ 'Content-Type': 'image/png' })
    applyLogoPngSecurityHeaders(headers)
    assert.equal(headers.get('X-Content-Type-Options'), 'nosniff')
    assert.equal(headers.get('Content-Security-Policy'), null)
  })

  it('sets nosniff and restrictive CSP on SVG', () => {
    const headers = new Headers({ 'Content-Type': 'image/svg+xml' })
    applyLogoSvgSecurityHeaders(headers)
    assert.equal(headers.get('X-Content-Type-Options'), 'nosniff')
    assert.equal(headers.get('Content-Security-Policy'), LOGO_SVG_CONTENT_SECURITY_POLICY)
    assert.match(LOGO_SVG_CONTENT_SECURITY_POLICY, /sandbox/)
  })

  it('merges download header records', () => {
    const png = logoDownloadPngHeaders({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=1',
    })
    assert.equal(png['X-Content-Type-Options'], 'nosniff')
    assert.equal(png['Content-Type'], 'image/png')

    const svg = logoDownloadSvgHeaders({
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': 'attachment; filename="x.svg"',
    })
    assert.equal(svg['Content-Security-Policy'], LOGO_SVG_CONTENT_SECURITY_POLICY)
  })
})