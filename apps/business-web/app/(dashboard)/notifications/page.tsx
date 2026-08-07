import { PageHeader } from '../../../src/components/PageHeader';

const NOTIFICATIONS = [
  { title: 'New order received', body: 'Order CD-260807-P0M4 for K120 just came in.', time: '2m ago', unread: true },
  { title: 'Order cancelled', body: 'Order CD-260806-9ZQ1 was cancelled by the customer.', time: '1h ago', unread: false },
  { title: 'Rider assigned', body: 'Kunda Banda is heading to pick up order CD-260807-K3F9.', time: '3h ago', unread: false },
];

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader title="Notifications" />
      <div className="space-y-2">
        {NOTIFICATIONS.map((n) => (
          <div key={n.title + n.time} className={`rounded-xl p-4 shadow-sm ${n.unread ? 'bg-primary-50' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">{n.title}</h3>
              <span className="text-xs text-neutral-400">{n.time}</span>
            </div>
            <p className="mt-1 text-sm text-neutral-600">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
