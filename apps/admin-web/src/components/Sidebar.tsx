'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  ShieldCheck,
  LayoutGrid,
  UserCog,
  Bike,
  Users,
  ClipboardList,
  Radio,
  Package,
  MapPinned,
  Wallet,
  Percent,
  Tag,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useLogout } from '@chirudeli/api-client';
import { Logo } from './Logo';
import { useSessionStore } from '../state/sessionStore';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/businesses/approval', label: 'Store Approvals', icon: ShieldCheck },
  { href: '/businesses', label: 'Stores', icon: Store },
  { href: '/store-classes', label: 'Store Classes', icon: LayoutGrid },
  { href: '/store-managers', label: 'Store Managers', icon: UserCog },
  { href: '/riders', label: 'Riders', icon: Bike },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/live-deliveries', label: 'Live Deliveries', icon: Radio },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/delivery-zones', label: 'Delivery Zones', icon: MapPinned },
  { href: '/delivery-fees', label: 'Delivery Fees', icon: Wallet },
  { href: '/commissions', label: 'Commissions', icon: Percent },
  { href: '/promotions', label: 'Promotions', icon: Tag },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const setSignedOut = useSessionStore((s) => s.setSignedOut);
  const logout = useLogout();

  return (
    <aside className="flex h-screen w-64 flex-col overflow-y-auto border-r border-neutral-100 bg-white">
      <div className="border-b border-neutral-100 px-5 py-5">
        <Logo size={26} badge="ADMIN" />
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
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-100 p-3">
        <div className="mb-2 px-3 text-xs text-neutral-400">{user?.fullName ?? 'ChiruDeli Admin'}</div>
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
          <LogOut size={17} />
          Log out
        </button>
      </div>
    </aside>
  );
}
