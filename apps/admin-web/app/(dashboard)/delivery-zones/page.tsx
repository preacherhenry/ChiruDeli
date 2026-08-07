'use client';

import { Plus } from 'lucide-react';
import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';

const ZONES = [
  { name: 'Chirundu Town', feeType: 'Fixed', fee: 'K15', radius: '2.5 km' },
  { name: 'Border Area', feeType: 'Fixed', fee: 'K25', radius: '2 km' },
  { name: 'Farm Area', feeType: 'Fixed', fee: 'K30', radius: '6 km' },
  { name: 'Custom Area', feeType: 'Fixed', fee: 'K40', radius: '15 km' },
];

export default function DeliveryZonesPage() {
  return (
    <div>
      <PageHeader
        title="Delivery Zones"
        action={
          <Button>
            <Plus size={16} /> Add zone
          </Button>
        }
      />
      <p className="mb-4 max-w-2xl text-sm text-neutral-500">
        Zones define both the delivery fee for an area and ChiruDeli&apos;s service coverage —
        addresses outside every zone below see &quot;ChiruDeli is currently available in Chirundu.
        We&apos;re working on expanding to more areas.&quot;
      </p>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Zone</th>
              <th className="px-5 py-3 font-medium">Fee type</th>
              <th className="px-5 py-3 font-medium">Delivery fee</th>
              <th className="px-5 py-3 font-medium">Radius</th>
            </tr>
          </thead>
          <tbody>
            {ZONES.map((z) => (
              <tr key={z.name} className="border-t border-neutral-50">
                <td className="px-5 py-3 font-medium text-neutral-900">{z.name}</td>
                <td className="px-5 py-3 text-neutral-500">{z.feeType}</td>
                <td className="px-5 py-3 text-neutral-900">{z.fee}</td>
                <td className="px-5 py-3 text-neutral-500">{z.radius}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
