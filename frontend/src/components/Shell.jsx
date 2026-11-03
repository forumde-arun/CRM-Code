'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon, { Logo } from './Icon';
import { Spinner } from './ui';

const links = [['/connection', 'Connection', 'link'], ['/templates', 'Templates', 'doc'], ['/contacts', 'Contacts', 'users'], ['/campaigns', 'Campaigns', 'send']];

export default function Shell({ children }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) router.replace('/');
    else setReady(true);
  }, [router]);

  const logout = () => { localStorage.removeItem('token'); router.replace('/'); };

  if (!ready) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2.5 px-6">
          <Logo />
          <span className="text-lg font-bold tracking-tight">CRM</span>
        </div>
        <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-2">
          {links.map(([href, label, icon]) => (
            <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} className={path === href ? 'nav-item nav-item-active' : 'nav-item'}>
              <Icon name={icon} /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <button onClick={logout} className="nav-item w-full"><Icon name="out" /> Sign out</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2"><Logo className="h-7 w-7" /><span className="font-bold">CRM</span></div>
            <button onClick={logout} className="btn-link">Sign out</button>
          </div>
          <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-2">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={(path === href ? 'nav-item nav-item-active' : 'nav-item') + ' shrink-0 py-1.5'}>{label}</Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
