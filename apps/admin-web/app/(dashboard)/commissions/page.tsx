'use client';

import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';

const OVERRIDES = [
  { business: 'Chirundu Grill House', commission: '10% (default)' },
  { business: 'Zambezi Fresh Groceries', commission: '10% (default)' },
];

export default function CommissionsPage() {
  return (
    <div>
      <PageHeader title="Commissions" />

      <div className="mb-6 max-w-md space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Platform default commission (%)</label>
          <input
            defaultValue="10"
            type="number"
            className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
          />
        </div>
        <p className="text-xs text-neutral-400">
          Example: a K100 order at 10% commission pays ChiruDeli K10 and the business K90. Applied
          at order creation and snapshotted, so changing this never rewrites past orders.
        </p>
        <Button>Save default</Button>
      </div>

      <h2 className="mb-3 font-heading text-base font-semibold text-neutral-900">Per-business overrides</h2>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Business</th>
              <th className="px-5 py-3 font-medium">Commission</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {OVERRIDES.map((o) => (
              <tr key={o.business} className="border-t border-neutral-50">
                <td className="px-5 py-3 font-medium text-neutral-900">{o.business}</td>
                <td className="px-5 py-3 text-neutral-500">{o.commission}</td>
                <td className="px-5 py-3 text-right">
                  <Button variant="outline" className="h-8 px-3 text-xs">
                    Override
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
