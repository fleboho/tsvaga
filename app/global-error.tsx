'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app] fatal error', {
      message: error.message,
      digest: error.digest,
    })
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
        <p style={{ color: '#555', marginBottom: '1.5rem' }}>
          The application hit an unexpected error.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        {error.digest && (
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#999' }}>
            Reference: {error.digest}
          </p>
        )}
      </body>
    </html>
  )
}
