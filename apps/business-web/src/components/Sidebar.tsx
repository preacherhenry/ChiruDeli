'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ClipboardList, Package, Store, TrendingUp, Bell, LogOut } from 'lucide-react';
import { useLogout } from '@chirudeli/api-client';
import { Logo } from './Logo';
import { useSessionStore } from '../state/sessionStore';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/profile', label: 'Business Profile', icon: Store },
  { href: '/sales', label: 'Sales', icon: TrendingUp },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const setSignedOut = useSessionStore((s) => s.setSignedOut);
  const logout = useLogout();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-100 bg-white">
      <div className="border-b border-neutral-100 px-5 py-5">
        <Logo size={28} badge="BUSINESS" />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-100 p-3">
        <div className="mb-2 px-3 text-xs text-neutral-400">{user?.fullName ?? 'ChiruDeli Business'}</div>
        <button
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => {
                setSignedOut();
                router.push('/login');
              },
            })
          }
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-error hover:bg-error/5"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}
