'use client';

import { useNotifications, useMarkNotificationRead } from '@chirudeli/api-client';
import { PageHeader } from '../../../src/components/PageHeader';

export default function NotificationsPage() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <div>
      <PageHeader title="Notifications" />
      <div className="space-y-2">
        {(notifications.data ?? []).map((n) => (
          <button
            key={n.id}
            onClick={() => !n.isRead && markRead.mutate(n.id)}
            className={`block w-full rounded-xl p-4 text-left shadow-sm ${n.isRead ? 'bg-white' : 'bg-primary-50'}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">{n.title}</h3>
              <span className="text-xs text-neutral-400">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-sm text-neutral-600">{n.body}</p>
          </button>
        ))}
        {(notifications.data ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">No notifications yet.</p>
        ) : null}
      </div>
    </div>
  );
}
