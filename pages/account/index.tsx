import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Nav } from '@/components/Nav';

export default function Account() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
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
        <h1 style={{ margin: 0 }}>Account</h1>
        <span className="badge">Profile</span>
      </header>
      <Nav />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Profile Information</h3>
        <div className="col">
          <div>
            <label className="label">Email</label>
            <p style={{ margin: '4px 0 0 0' }}>{session?.user?.email}</p>
          </div>

          <div>
            <label className="label">Organization</label>
            <p style={{ margin: '4px 0 0 0' }}>
              {(session?.user as any)?.orgId || 'Personal'}
            </p>
          </div>

          <div>
            <label className="label">Role</label>
            <p style={{ margin: '4px 0 0 0' }}>
              {(session?.user as any)?.role || 'User'}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Actions</h3>
        <button className="btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Future Features</h3>
        <p className="muted">
          Coming soon: API keys, brand presets, team management, and more.
        </p>
      </div>
    </main>
  );
}
