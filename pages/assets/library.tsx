import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { supabase } from '@/lib/supabase';

interface MediaAsset {
  id: string;
  kind: string;
  url: string;
  alt: string;
  meta: any;
  manuscript_id: string | null;
  created_at: string;
}

export default function AssetLibrary() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'authenticated') {
      loadAssets();
    }
  }, [status]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });

      setAssets(data || []);
    } catch (error: unknown) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('Delete this asset?')) return;

    try {
      await supabase.from('media_assets').delete().eq('id', id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } catch (error: unknown) {
      alert('Failed to delete asset');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredAssets =
    filter === 'all' ? assets : assets.filter((a) => a.kind === filter);

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
        <h1 style={{ margin: 0 }}>Asset Library</h1>
        <Link href="/assets" className="btn">
          Generate New
        </Link>
      </header>
      <Nav />

      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={`btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            style={{
              background: filter === 'all' ? '#1f2937' : 'transparent',
              border: '1px solid',
              borderColor: filter === 'all' ? '#6ee7b7' : '#2a2d3b',
            }}
          >
            All ({assets.length})
          </button>
          <button
            className={`btn ${filter === 'image' ? 'active' : ''}`}
            onClick={() => setFilter('image')}
            style={{
              background: filter === 'image' ? '#1f2937' : 'transparent',
              border: '1px solid',
              borderColor: filter === 'image' ? '#6ee7b7' : '#2a2d3b',
            }}
          >
            Images ({assets.filter((a) => a.kind === 'image').length})
          </button>
          <button
            className={`btn ${filter === 'logo' ? 'active' : ''}`}
            onClick={() => setFilter('logo')}
            style={{
              background: filter === 'logo' ? '#1f2937' : 'transparent',
              border: '1px solid',
              borderColor: filter === 'logo' ? '#6ee7b7' : '#2a2d3b',
            }}
          >
            Logos ({assets.filter((a) => a.kind === 'logo').length})
          </button>
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p className="muted">No assets found.</p>
          <Link href="/assets" className="btn" style={{ marginTop: 16 }}>
            Generate Your First Asset
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 16,
          }}
        >
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="card"
              style={{ padding: 0, overflow: 'hidden' }}
            >
              <div
                style={{
                  width: '100%',
                  height: 200,
                  background: '#0f1117',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid #2a2d3b',
                }}
              >
                <img
                  src={asset.url}
                  alt={asset.alt || 'Asset'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <div style={{ padding: 12 }}>
                <p
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {asset.alt || 'Untitled'}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                  }}
                  className="muted"
                >
                  <span>{formatDate(asset.created_at)}</span>
                  <button
                    onClick={() => deleteAsset(asset.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
