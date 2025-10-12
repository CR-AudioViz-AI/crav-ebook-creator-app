import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Nav } from '@/components/Nav';
import { Upsell } from '@/components/Upsell';
import { RichTextEditor } from '@/components/RichTextEditor';
import { supabase } from '@/lib/supabase';

interface Chapter {
  id: string;
  title: string;
  content_html: string;
  position: number;
}

export default function Draft() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id: manuscriptId } = router.query;

  const [manuscript, setManuscript] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (manuscriptId && status === 'authenticated') {
      loadManuscript();
    }
  }, [manuscriptId, status]);

  const loadManuscript = async () => {
    if (!manuscriptId) return;

    try {
      const { data: ms } = await supabase
        .from('manuscripts')
        .select('*')
        .eq('id', manuscriptId)
        .single();

      setManuscript(ms);

      const { data: chaps } = await supabase
        .from('chapters')
        .select('*')
        .eq('manuscript_id', manuscriptId)
        .order('position', { ascending: true });

      setChapters(chaps || []);
      if (chaps && chaps.length > 0) {
        setActiveChapterId(chaps[0].id);
      }
    } catch (error) {
      console.error('Failed to load manuscript:', error);
    }
  };

  const generateChapter = async (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    setLoading(true);

    try {
      const response = await fetch('/api/studio/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          wordsPerChapter: manuscript?.brief?.wordsPerChapter || 1800,
          tone: manuscript?.brief?.tone || 'professional',
        }),
      });

      if (response.status === 402) {
        setShowUpsell(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate chapter');
      }

      const data = await response.json();

      const { error } = await supabase
        .from('chapters')
        .update({ content_html: data.contentMd || '' })
        .eq('id', chapterId);

      if (!error) {
        await loadManuscript();
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveChapter = useCallback(
    async (chapterId: string, content: string) => {
      setSaving(true);
      try {
        await supabase
          .from('chapters')
          .update({ content_html: content })
          .eq('id', chapterId);
      } catch (error) {
        console.error('Failed to save:', error);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleContentChange = (chapterId: string, content: string) => {
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, content_html: content } : c))
    );
  };

  useEffect(() => {
    if (!activeChapterId) return;

    const timeoutId = setTimeout(() => {
      const chapter = chapters.find((c) => c.id === activeChapterId);
      if (chapter) {
        saveChapter(activeChapterId, chapter.content_html);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [chapters, activeChapterId, saveChapter]);

  if (status === 'loading') {
    return (
      <main className="container">
        <p>Loading...</p>
      </main>
    );
  }

  if (!manuscriptId) {
    return (
      <main className="container">
        <p>No manuscript selected</p>
      </main>
    );
  }

  const activeChapter = chapters.find((c) => c.id === activeChapterId);

  return (
    <main className="container">
      <header
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1 style={{ margin: 0 }}>
          {manuscript?.title || 'Draft'}
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saving && <span className="muted" style={{ fontSize: 12 }}>Saving...</span>}
          <a href={`/studio/export?id=${manuscriptId}`} className="btn">
            Export
          </a>
        </div>
      </header>
      <Nav />

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 16 }}>
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginTop: 0 }}>Chapters</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {chapters.map((chapter) => (
              <li key={chapter.id} style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setActiveChapterId(chapter.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: activeChapterId === chapter.id ? '#1f2937' : 'transparent',
                    border: '1px solid',
                    borderColor: activeChapterId === chapter.id ? '#6ee7b7' : '#2a2d3b',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {chapter.title}
                </button>
                {!chapter.content_html && (
                  <button
                    onClick={() => generateChapter(chapter.id)}
                    disabled={loading}
                    className="btn"
                    style={{ width: '100%', marginTop: 4, fontSize: 11 }}
                  >
                    {loading ? '...' : 'Generate'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          {activeChapter ? (
            <>
              <h2 style={{ marginTop: 0 }}>{activeChapter.title}</h2>
              <RichTextEditor
                content={activeChapter.content_html || ''}
                onChange={(content) => handleContentChange(activeChapter.id, content)}
                placeholder="Start writing or generate content with AI..."
              />
            </>
          ) : (
            <p className="muted">Select a chapter to edit</p>
          )}
        </div>
      </div>

      <Upsell show={showUpsell} onClose={() => setShowUpsell(false)} />
    </main>
  );
}
