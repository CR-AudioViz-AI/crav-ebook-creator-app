import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Nav } from '@/components/Nav';

interface Manuscript {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  brief: any;
  chapters: { count: number }[];
}

export default function Library() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    if (authStatus === 'authenticated') {
      loadManuscripts();
    }
  }, [authStatus, search, statusFilter, sortBy]);

  const loadManuscripts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (sortBy) params.set('sort', sortBy);
      params.set('order', 'desc');

      const response = await fetch(`/api/studio/manuscripts?${params}`);
      if (!response.ok) throw new Error('Failed to load manuscripts');

      const data = await response.json();
      setManuscripts(data.manuscripts || []);
    } catch (error: any) {
      console.error('Failed to load manuscripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: '#6b7280',
      OUTLINE: '#3b82f6',
      WRITING: '#f59e0b',
      EDITING: '#8b5cf6',
      READY: '#10b981',
      PUBLISHED: '#059669',
    };
    return (
      <span
        className="badge"
        style={{ background: colors[status] || '#6b7280' }}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authStatus === 'loading') {
    return (
      <main className="container">
        <p>Loading...</p>
      </main>
    );
  }

  if (authStatus === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <main className="container">
      <header
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1 style={{ margin: 0 }}>My Library</h1>
        <Link href="/studio" className="btn">
          New Book
        </Link>
      </header>
      <Nav />

      <div className="card">
        <div className="row" style={{ gap: 12, marginBottom: 16 }}>
          <input
            className="input"
            placeholder="Search titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="OUTLINE">Outline</option>
            <option value="WRITING">Writing</option>
            <option value="EDITING">Editing</option>
            <option value="READY">Ready</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <select
            className="input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="created_at">Created Date</option>
            <option value="updated_at">Updated Date</option>
            <option value="title">Title</option>
          </select>
        </div>

        {loading ? (
          <p className="muted">Loading manuscripts...</p>
        ) : manuscripts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p className="muted" style={{ marginBottom: 16 }}>
              No manuscripts found. Start creating your first book!
            </p>
            <Link href="/studio" className="btn">
              Create Your First Book
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {manuscripts.map((manuscript) => (
              <Link
                key={manuscript.id}
                href={`/studio/draft?id=${manuscript.id}`}
                style={{
                  display: 'block',
                  background: '#0f1117',
                  border: '1px solid #2a2d3b',
                  borderRadius: 8,
                  padding: 16,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6ee7b7';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a2d3b';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: 18 }}>
                        {manuscript.title}
                      </h3>
                      {getStatusBadge(manuscript.status)}
                    </div>
                    {manuscript.subtitle && (
                      <p
                        className="muted"
                        style={{ margin: '4px 0', fontSize: 14 }}
                      >
                        {manuscript.subtitle}
                      </p>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        marginTop: 12,
                        fontSize: 13,
                      }}
                      className="muted"
                    >
                      <span>
                        {manuscript.chapters?.[0]?.count || 0} chapters
                      </span>
                      <span>Created {formatDate(manuscript.created_at)}</span>
                      <span>Updated {formatDate(manuscript.updated_at)}</span>
                    </div>
                  </div>
                  {manuscript.brief?.coverImage && (
                    <img
                      src={manuscript.brief.coverImage}
                      alt={manuscript.title}
                      style={{
                        width: 80,
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 4,
                        border: '1px solid #2a2d3b',
                      }}
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
