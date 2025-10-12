import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Nav } from '@/components/Nav';

export default function Admin() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
      router.push('/studio');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <main className="container"><p>Loading...</p></main>;
  }

  return (
    <main className="container">
      <header
        className="row"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1 style={{ margin: 0 }}>Admin</h1>
        <span className="badge">RBAC</span>
      </header>
      <Nav />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Admin Dashboard</h3>
        <p className="muted">
          Admins can view organization-wide audits, manage credit grants, process
          refunds, and perform manual topups.
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Future Features</h3>
        <ul className="muted">
          <li>View all organization users</li>
          <li>Manage credit allocations</li>
          <li>Process refunds and adjustments</li>
          <li>View audit logs</li>
          <li>Export analytics and reports</li>
        </ul>
      </div>
    </main>
  );
}
