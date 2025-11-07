import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      const result = await signIn('dev', {
        email,
        code,
        callbackUrl: '/studio',
      });
      if (result?.error) {
        alert('Login failed. Use code: 000000');
      }
    } catch (error: unknown) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>Sign In</h1>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Dev Login</h3>
        <p className="muted">For local development and testing</p>

        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label className="label" style={{ marginTop: 12 }}>
          Code (enter: 000000)
        </label>
        <input
          className="input"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
        />

        <button
          className="btn"
          onClick={handleDevLogin}
          disabled={loading || !email || code !== '000000'}
          style={{ marginTop: 16 }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>

      <p className="muted" style={{ marginTop: 16 }}>
        No account? Your account will be created automatically on first sign-in.
        <br />
        <Link href="/billing">View plans</Link>
      </p>
    </main>
  );
}
