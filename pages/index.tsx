import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <header
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1 style={{ margin: 0 }}>CRAV E-Book Creator</h1>
        <span className="badge">Creator Suite</span>
      </header>

      <p className="muted" style={{ fontSize: 16, marginTop: 12 }}>
        Turn a few sentences into a sellable, professional e-book. Credits-based,
        team-ready, export to EPUB/PDF/DOCX.
      </p>

      <div className="row" style={{ marginTop: 24 }}>
        <Link className="btn" href="/auth/signin">
          Sign In
        </Link>
        <Link className="btn" href="/studio">
          Open Studio
        </Link>
        <Link className="btn" href="/billing">
          View Pricing
        </Link>
      </div>

      <div className="card" style={{ marginTop: 32 }}>
        <h3 style={{ marginTop: 0 }}>Features</h3>
        <ul>
          <li>AI-powered outline and chapter generation</li>
          <li>Credits-based usage model</li>
          <li>Export to EPUB, PDF, and DOCX formats</li>
          <li>Multi-tenant with team support</li>
          <li>Flexible billing with Stripe integration</li>
        </ul>
      </div>
    </main>
  );
}
