import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Nav } from '@/components/Nav';
import { Upsell } from '@/components/Upsell';

export default function Export() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const downloadFile = async (format: 'pdf' | 'epub' | 'docx') => {
    const chaptersStr = localStorage.getItem('chapters');
    const briefStr = localStorage.getItem('brief');

    if (!chaptersStr || !briefStr) {
      alert('Please create chapters first');
      router.push('/studio/draft');
      return;
    }

    const chapters = JSON.parse(chaptersStr);
    const brief = JSON.parse(briefStr);

    const manuscript = {
      title: brief.topic || 'E-Book',
      subtitle: '',
      author: 'CRAV Studio',
      description: `A comprehensive guide on ${brief.topic || 'the topic'}`,
      chapters,
    };

    setLoading(true);

    try {
      const response = await fetch('/api/studio/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manuscript, format }),
      });

      if (response.status === 402) {
        setShowUpsell(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${manuscript.title.replace(/\W+/g, '_')}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
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
        <span className="badge">Export</span>
      </header>
      <Nav />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Export Your E-Book</h3>
        <p className="muted">Choose your preferred format. Each export spends credits.</p>

        <div className="row" style={{ marginTop: 16 }}>
          <button
            className="btn"
            onClick={() => downloadFile('epub')}
            disabled={loading}
          >
            Download EPUB
          </button>
          <button
            className="btn"
            onClick={() => downloadFile('pdf')}
            disabled={loading}
          >
            Download PDF
          </button>
          <button
            className="btn"
            onClick={() => downloadFile('docx')}
            disabled={loading}
          >
            Download DOCX
          </button>
        </div>

        {loading && <p className="muted" style={{ marginTop: 12 }}>Generating export...</p>}
      </div>

      <Upsell show={showUpsell} onClose={() => setShowUpsell(false)} />
    </main>
  );
}
