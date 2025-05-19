'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const [role, setRole] = useState<'student' | 'admin' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const res = await signIn('credentials', {
      email,
      password,
      expectedRole: role,
      redirect: false,
    })

    if (res?.ok) {
      router.push(role === 'student' ? '/student/dashboard' : '/admin/dashboard')
    } else {
      alert('Login failed: incorrect credentials or user not found.')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/imperial-logo.png" alt="Imperial Business School" style={styles.logoImage} />

        {!role ? (
          <>
            <h2 style={styles.title}>Sign in</h2>
            <p style={styles.subtitle}>Select your role to continue</p>
            <div style={styles.buttonGroup}>
              <button style={styles.roleButton} onClick={() => setRole('student')}>
                🎓 Student
              </button>
              <button style={styles.roleButton} onClick={() => setRole('admin')}>
                🛠️ Admin
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={styles.title}>{role === 'student' ? 'Student Login' : 'Admin Login'}</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
            />
            <div style={styles.buttonGroup}>
              <button style={styles.confirmButton} onClick={handleLogin}>
                Sign In
              </button>
              <button style={styles.cancelButton} onClick={() => setRole(null)}>
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    maxWidth: 400,
    width: '100%',
    textAlign: 'center',
  },
  logo: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1e3a8a',
    letterSpacing: 3,
    marginBottom: 20,
  },
  title: {
    fontSize: '1.4rem',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: '1rem',
    color: '#555',
    marginBottom: 30,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },
  roleButton: {
    padding: '12px',
    fontSize: '1rem',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    padding: 10,
    marginTop: 10,
    border: '1px solid #ccc',
    borderRadius: 6,
    fontSize: '1rem',
  },
  confirmButton: {
    padding: '12px',
    fontSize: '1rem',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#10b981',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 600,
  },
  cancelButton: {
    padding: '12px',
    fontSize: '1rem',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#e11d48',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 600,
  },
  logoImage: {
    width: '100%',
    maxWidth: 220,
    marginBottom: 20,
  },
}
