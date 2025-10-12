import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Nav } from '@/components/Nav';
import { Upsell } from '@/components/Upsell';

interface Snippet {
  text: string;
  context: string;
}

export default function Snippets() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('persuasive');
  const [type, setType] = useState('social');
  const [variants, setVariants] = useState(5);
  const [loading, setLoading] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [showUpsell, setShowUpsell] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic');
      return;
    }

    setLoading(true);
    setSnippets([]);

    try {
      const response = await fetch('/api/snippets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone, type, variants }),
      });

      if (response.status === 402) {
        setShowUpsell(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate snippets');
      }

      const data = await response.json();
      setSnippets(data.snippets || []);
    } catch (error: any) {
      alert(error.message || 'Failed to generate snippets');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  };

  if (status === 'loading') {
    return (
      <main className="container">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <header
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1 style={{ margin: 0 }}>Marketing Snippets</h1>
        <span className="badge">AI-Powered</span>
      </header>
      <Nav />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Generate Marketing Copy</h3>
        <p className="muted" style={{ fontSize: 14 }}>
          Create compelling marketing content for social media, emails, ads, and more.
        </p>

        <div className="col" style={{ gap: 16 }}>
          <div>
            <label className="label">Topic or Product</label>
            <input
              className="input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Sustainable Coffee Subscription"
            />
          </div>

          <div className="row" style={{ gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Content Type</label>
              <select
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="social">Social Media</option>
                <option value="email">Email Marketing</option>
                <option value="ad">Advertisement</option>
                <option value="blog">Blog Content</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label className="label">Tone</label>
              <select
                className="input"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="professional">Professional</option>
                <option value="persuasive">Persuasive</option>
                <option value="friendly">Friendly</option>
                <option value="authoritative">Authoritative</option>
                <option value="playful">Playful</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label className="label">Variants</label>
              <input
                className="input"
                type="number"
                min="1"
                max="10"
                value={variants}
                onChange={(e) => setVariants(Number(e.target.value))}
              />
            </div>
          </div>

          <button
            className="btn"
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
          >
            {loading ? 'Generating...' : 'Generate Snippets'}
          </button>
        </div>
      </div>

      {snippets.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Generated Snippets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {snippets.map((snippet, index) => (
              <div
                key={index}
                style={{
                  background: '#0f1117',
                  border: '1px solid #2a2d3b',
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: 15 }}>
                      {snippet.text}
                    </p>
                    <p
                      className="muted"
                      style={{ margin: 0, fontSize: 12 }}
                    >
                      {snippet.context}
                    </p>
                  </div>
                  <button
                    className="btn"
                    onClick={() => handleCopy(snippet.text, index)}
                    style={{ minWidth: 80 }}
                  >
                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Upsell show={showUpsell} onClose={() => setShowUpsell(false)} />
    </main>
  );
}
