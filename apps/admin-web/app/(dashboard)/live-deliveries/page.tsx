import { Radio, MapPin } from 'lucide-react';
import { PageHeader } from '../../../src/components/PageHeader';

const ACTIVE = [
  { order: 'CD-260807-K3F9', rider: 'Kunda Banda', stage: 'On the way', destination: 'Chirundu Town Centre' },
  { order: 'CD-260807-P0M4', rider: 'Grace Tembo', stage: 'Picking up', destination: 'Border Area' },
];

/** Live map view needs a Google Maps key + the admin:live socket room (see
 * docs/roadmap.md, "Admin dashboard backend") — this is the list fallback. */
export default function LiveDeliveriesPage() {
  return (
    <div>
      <PageHeader title="Live Deliveries" />
      <div className="mb-6 flex h-64 items-center justify-center gap-2 rounded-xl bg-white text-neutral-400 shadow-sm">
        <Radio size={20} />
        <span className="text-sm">Live map view — connect a Google Maps key to enable</span>
      </div>
      <div className="space-y-3">
        {ACTIVE.map((d) => (
          <div key={d.order} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-neutral-900">{d.order}</p>
              <p className="text-xs text-neutral-500">Rider: {d.rider}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <MapPin size={14} /> {d.destination}
            </div>
            <span className="rounded-pill bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
              {d.stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
