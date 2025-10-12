import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Nav } from '@/components/Nav';
import { Upsell } from '@/components/Upsell';

export default function Assets() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photorealistic');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter an image description');
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/media/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          width: 1024,
          height: 1024,
        }),
      });

      if (response.status === 402) {
        setShowUpsell(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImage(data.url);
    } catch (error: any) {
      alert(error.message || 'Failed to generate image');
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
        <h1 style={{ margin: 0 }}>Assets & Media</h1>
        <span className="badge">AI Images</span>
      </header>
      <Nav />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Generate Cover Art & Graphics</h3>
        <p className="muted" style={{ fontSize: 14 }}>
          Create professional book covers, logos, and graphics with AI.
        </p>

        <div className="col" style={{ gap: 16 }}>
          <div>
            <label className="label">Image Description</label>
            <textarea
              className="input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={4}
            />
          </div>

          <div className="row" style={{ gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Style</label>
              <select
                className="input"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="photorealistic">Photorealistic</option>
                <option value="digital-art">Digital Art</option>
                <option value="illustration">Illustration</option>
                <option value="minimalist">Minimalist</option>
                <option value="watercolor">Watercolor</option>
                <option value="vintage">Vintage</option>
              </select>
            </div>
          </div>

          <button
            className="btn"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>

          <p className="muted" style={{ fontSize: 12, margin: '8px 0 0 0' }}>
            Cost: 200 credits per image
          </p>
        </div>
      </div>

      {generatedImage && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Generated Image</h3>
          <div
            style={{
              background: '#0f1117',
              border: '1px solid #2a2d3b',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <img
              src={generatedImage}
              alt="Generated cover"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 8,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn">Download</button>
              <button className="btn">Use as Cover</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Upload Assets</h3>
        <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
          Upload your own logos, images, and brand assets.
        </p>
        <input
          type="file"
          accept="image/*"
          style={{
            padding: 10,
            border: '1px solid #2a2d3b',
            borderRadius: 8,
            background: '#0f1117',
            color: '#fff',
          }}
        />
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Supported formats: PNG, JPG, SVG (max 10MB)
        </p>
      </div>

      <Upsell show={showUpsell} onClose={() => setShowUpsell(false)} />
    </main>
  );
}
