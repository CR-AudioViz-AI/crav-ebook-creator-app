import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Nav } from '@/components/Nav';
import { PLANS } from '@/lib/billing';

export default function Billing() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [session]);

  const handleCheckout = async (priceId?: string) => {
    if (!priceId) {
      alert('This plan is not available for purchase yet');
      return;
    }

    if (!email) {
      alert('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/billing/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error: unknown) {
      alert('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1 style={{ margin: 0 }}>Plans & Pricing</h1>
        <span className="badge">Billing</span>
      </header>
      <Nav />

      <div className="card">
        <label className="label">Billing Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </div>

      <div className="row">
        {PLANS.map((plan) => (
          <div key={plan.id} className="card" style={{ flex: '1 1 280px' }}>
            <h3 style={{ marginTop: 0 }}>{plan.name}</h3>
            <div className="kpi">${plan.monthly}/mo</div>
            <p className="muted" style={{ fontSize: 13 }}>
              {plan.monthlyCredits.toLocaleString()} credits/month
            </p>
            <ul style={{ fontSize: 14, lineHeight: 1.8 }}>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            {plan.id === 'free' ? (
              <button
                className="btn"
                onClick={() => (window.location.href = '/auth/signin')}
              >
                Start Free
              </button>
            ) : (
              <button
                className="btn"
                onClick={() => handleCheckout(plan.stripePriceId)}
                disabled={loading}
              >
                {loading ? 'Loading...' : `Upgrade to ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
