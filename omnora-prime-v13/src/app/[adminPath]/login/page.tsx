'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const params = useParams()
  const adminPath = params.adminPath as string

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)

  const handleLogin = async () => {
    if (!password.trim()) return
    setLoading(true)
    setError('')

    // Generate a secure client-side nonce (32 hex characters)
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const nonce = Array.from(array, dec => dec.toString(16).padStart(2, '0')).join('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password, nonce }),
      })
      const data = await res.json()

      if (res.ok) {
        router.push(`/${adminPath}/dashboard`)
        return
      }

      setError(data.error || 'Access denied')
      if (data.attemptsRemaining !== undefined) {
        setAttemptsLeft(data.attemptsRemaining)
      }
    } catch {
      setError('Connection failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 320,
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        borderRadius: 8,
        padding: 32,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: '#1a1a1a',
          marginBottom: 24,
        }} />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e =>
            e.key === 'Enter' && handleLogin()
          }
          placeholder="Access code"
          autoFocus
          style={{
            width: '100%',
            background: '#111',
            border: '1px solid #222',
            borderRadius: 4,
            color: '#fff',
            fontSize: 14,
            padding: '10px 12px',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 12,
          }}
        />
        {error && (
          <p style={{
            color: '#EF4444',
            fontSize: 12,
            marginBottom: 12,
          }}>
            {error}
            {attemptsLeft !== null &&
              attemptsLeft > 0 &&
              ` (${attemptsLeft} attempts left)`}
          </p>
        )}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? '#222' : '#fff',
            color: '#000',
            border: 'none',
            borderRadius: 4,
            padding: '10px',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
