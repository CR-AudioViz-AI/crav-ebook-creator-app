import Link from 'next/link';
import { useRouter } from 'next/router';

export function Nav() {
  const { asPath } = useRouter();

  const items = [
    { href: '/studio', label: 'Studio' },
    { href: '/studio/library', label: 'Library' },
    { href: '/snippets', label: 'Snippets' },
    { href: '/assets', label: 'Assets' },
    { href: '/credits', label: 'Credits' },
    { href: '/billing', label: 'Billing' },
    { href: '/account', label: 'Account' },
  ];

  return (
    <nav className="nav">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={asPath.startsWith(item.href) ? 'active' : ''}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
