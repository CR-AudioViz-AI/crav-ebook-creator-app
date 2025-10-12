import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Nav } from '@/components/Nav';
import { Upsell } from '@/components/Upsell';

export default function Outline() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [outline, setOutline] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const saved = localStorage.getItem('outline');
    if (saved) {
      setOutline(saved);
    }
  }, []);

  const generate = async () => {
    const briefStr = localStorage.getItem('brief');
    if (!briefStr) {
      alert('Please save a brief first');
      router.push('/studio');
      return;
    }

    const brief = JSON.parse(briefStr);
    setLoading(true);

    try {
      const response = await fetch('/api/studio/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      });

      if (response.status === 402) {
        setShowUpsell(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate outline');
      }

      const data = await response.json();
      setOutline(data.outline || '');
      localStorage.setItem('outline', data.outline || '');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <main className="container"><p>Loading...</p></main>;
  }

  return (
    <main className="container">
      <header
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1 style={{ margin: 0 }}>E-Book Studio</h1>
        <span className="badge">Outline</span>
      </header>
      <Nav />

      <div className="card">
        <button className="btn" onClick={generate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Outline'}
        </button>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          This will spend credits based on your configured rates
        </p>

        {outline && (
          <div style={{ marginTop: 16 }}>
            <label className="label">Generated Outline</label>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                background: '#0f1117',
                padding: 16,
                borderRadius: 8,
                maxHeight: 500,
                overflow: 'auto',
              }}
            >
              {outline}
            </pre>
          </div>
        )}
      </div>

      {outline && (
        <p className="muted" style={{ marginTop: 16 }}>
          Next: <a href="/studio/draft">Draft Chapters</a>
        </p>
      )}

      <Upsell show={showUpsell} onClose={() => setShowUpsell(false)} />
    </main>
  );
}
