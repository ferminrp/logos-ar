import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export const alt = 'Logos Argentina - Directorio de Favicons'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #050a1a 0%, #0b1024 55%, #131b34 100%)',
          color: 'white',
          padding: '56px 64px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
            }}
          >
            🇦🇷
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>Logos Argentina</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, fontWeight: 800, maxWidth: 980 }}>
            Directorio de favicons de bancos, fintechs y ALyCs
          </div>
          <div style={{ fontSize: 32, color: '#A7B8FF', fontWeight: 500 }}>
            Copiá el curl y usalo en tu web
          </div>
        </div>

        <div style={{ fontSize: 26, color: '#9FB0D8' }}>logos-ar.vercel.app</div>
      </div>
    ),
    size,
  )
}
