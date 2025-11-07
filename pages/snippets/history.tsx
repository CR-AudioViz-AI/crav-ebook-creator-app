import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { supabase } from '@/lib/supabase';

interface SnippetJob {
  id: string;
  topic: string;
  tone: string;
  type: string;
  variants: number;
  result: Array<{ text: string; context: string }>;
  created_at: string;
}

export default function SnippetHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [snippets, setSnippets] = useState<SnippetJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      loadSnippets();
    }
  }, [status]);

  const loadSnippets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('snippet_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setSnippets(data || []);
    } catch (error: unknown) {
      console.error('Failed to load snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error: unknown) {
      alert('Failed to copy to clipboard');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <main className="container">
        <p>Loading...</p>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <main className="container">
      <header
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1 style={{ margin: 0 }}>Snippet History</h1>
        <Link href="/snippets" className="btn">
          Generate New
        </Link>
      </header>
      <Nav />

      {snippets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p className="muted">No snippets generated yet.</p>
          <Link href="/snippets" className="btn" style={{ marginTop: 16 }}>
            Generate Your First Snippet
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {snippets.map((job) => (
            <div key={job.id} className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, marginBottom: 4 }}>{job.topic}</h3>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13 }} className="muted">
                    <span className="badge">{job.type}</span>
                    <span className="badge">{job.tone}</span>
                    <span>{formatDate(job.created_at)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {job.result?.map((snippet, index) => (
                  <div
                    key={index}
                    style={{
                      background: '#0f1117',
                      border: '1px solid #2a2d3b',
                      borderRadius: 6,
                      padding: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14 }}>{snippet.text}</p>
                      {snippet.context && (
                        <p
                          className="muted"
                          style={{ margin: '4px 0 0 0', fontSize: 12 }}
                        >
                          {snippet.context}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => copyText(snippet.text, `${job.id}-${index}`)}
                      className="btn"
                      style={{ minWidth: 70, fontSize: 12 }}
                    >
                      {copiedId === `${job.id}-${index}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
