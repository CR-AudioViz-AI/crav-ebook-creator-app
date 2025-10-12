interface UpsellProps {
  show: boolean;
  onClose: () => void;
}

export function Upsell({ show, onClose }: UpsellProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 999,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Out of Credits</h3>
        <p>
          Upgrade to Pro (150k credits/mo) or Scale (750k credits/mo) to keep creating
          amazing e-books.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            className="btn"
            onClick={() => (window.location.href = '/billing')}
          >
            See Plans
          </button>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
