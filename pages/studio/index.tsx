import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Nav } from '@/components/Nav';
import { Upsell } from '@/components/Upsell';

interface Brief {
  topic: string;
  audience: string;
  goals: string;
  tone: string;
  chapters: number;
  wordsPerChapter: number;
  citations: boolean;
}

export default function StudioBrief() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [brief, setBrief] = useState<Brief>({
    topic: '',
    audience: '',
    goals: '',
    tone: 'professional',
    chapters: 10,
    wordsPerChapter: 1800,
    citations: true,
  });

  const [loading, setLoading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const generateOutline = async () => {
    if (!brief.topic.trim()) {
      alert('Please enter a topic for your book');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/studio/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      });

      if (response.status === 402) {
        setShowUpsell(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate outline');
      }

      const data = await response.json();
      router.push(`/studio/draft?id=${data.manuscriptId}`);
    } catch (error: any) {
      alert(error.message || 'Failed to generate outline');
    } finally {
      setLoading(false);
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
        <h1 style={{ margin: 0 }}>E-Book Studio</h1>
        <span className="badge">Create New Book</span>
      </header>
      <Nav />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Start Your Book</h3>
        <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
          Fill out this brief to generate an AI-powered outline and start writing.
        </p>

        <div className="row" style={{ gap: 16 }}>
          <div className="col" style={{ flex: 2 }}>
            <label className="label">Topic / Title</label>
            <input
              className="input"
              value={brief.topic}
              onChange={(e) => setBrief({ ...brief, topic: e.target.value })}
              placeholder="e.g., Building Sustainable Businesses"
            />

            <label className="label">Target Audience</label>
            <input
              className="input"
              value={brief.audience}
              onChange={(e) => setBrief({ ...brief, audience: e.target.value })}
              placeholder="e.g., Entrepreneurs and startup founders"
            />

            <label className="label">Goals & Key Takeaways</label>
            <textarea
              className="input"
              rows={4}
              value={brief.goals}
              onChange={(e) => setBrief({ ...brief, goals: e.target.value })}
              placeholder="What should readers learn or achieve?"
            />
          </div>

          <div className="col" style={{ flex: 1 }}>
            <label className="label">Writing Tone</label>
            <select
              className="input"
              value={brief.tone}
              onChange={(e) => setBrief({ ...brief, tone: e.target.value })}
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="authoritative">Authoritative</option>
              <option value="conversational">Conversational</option>
              <option value="academic">Academic</option>
            </select>

            <label className="label">Number of Chapters</label>
            <input
              className="input"
              type="number"
              min="3"
              max="40"
              value={brief.chapters}
              onChange={(e) =>
                setBrief({ ...brief, chapters: Number(e.target.value) })
              }
            />

            <label className="label">Words per Chapter</label>
            <input
              className="input"
              type="number"
              min="500"
              max="5000"
              step="100"
              value={brief.wordsPerChapter}
              onChange={(e) =>
                setBrief({ ...brief, wordsPerChapter: Number(e.target.value) })
              }
            />

            <label
              className="label"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <input
                type="checkbox"
                checked={brief.citations}
                onChange={(e) =>
                  setBrief({ ...brief, citations: e.target.checked })
                }
              />
              Include citations
            </label>
          </div>
        </div>

        <button
          className="btn"
          onClick={generateOutline}
          disabled={loading || !brief.topic.trim()}
          style={{ marginTop: 16 }}
        >
          {loading ? 'Generating Outline...' : 'Generate Outline & Create Book'}
        </button>

        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Cost: 1,000 credits for outline generation
        </p>
      </div>

      <Upsell show={showUpsell} onClose={() => setShowUpsell(false)} />
    </main>
  );
}
