import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Nav } from '@/components/Nav';

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  reason: string;
  created_at: string;
}

export default function Credits() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const balanceRes = await fetch('/api/credits/balance');
      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setBalance(data.balance);
      }

      const ledgerRes = await fetch('/api/credits/ledger');
      if (ledgerRes.ok) {
        const data = await ledgerRes.json();
        setLedger(data.ledger || []);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  if (status === 'loading') {
    return <main className="container"><p>Loading...</p></main>;
  }

  return (
    <main className="container">
      <header
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1 style={{ margin: 0 }}>Credits</h1>
        <span className="badge kpi">{balance?.toLocaleString() ?? '...'}</span>
      </header>
      <Nav />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Transaction History</h3>
        {ledger.length === 0 ? (
          <p className="muted">No transactions yet</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.created_at).toLocaleString()}</td>
                  <td>{entry.type}</td>
                  <td style={{ color: entry.amount >= 0 ? '#6ee7b7' : '#f87171' }}>
                    {entry.amount >= 0 ? '+' : ''}
                    {entry.amount.toLocaleString()}
                  </td>
                  <td>{entry.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
