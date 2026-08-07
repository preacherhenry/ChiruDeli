import { Plus } from 'lucide-react';
import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';

const PROMOTIONS = [
  { code: 'CHIRU10', type: 'Percentage · 10% off', scope: 'Platform-wide', status: 'Active' },
  { code: 'FREESHIP', type: 'Free delivery', scope: 'Platform-wide', status: 'Active' },
];

export default function PromotionsPage() {
  return (
    <div>
      <PageHeader
        title="Promotions"
        action={
          <Button>
            <Plus size={16} /> New promotion
          </Button>
        }
      />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Scope</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {PROMOTIONS.map((p) => (
              <tr key={p.code} className="border-t border-neutral-50">
                <td className="px-5 py-3 font-mono text-sm font-semibold text-neutral-900">{p.code}</td>
                <td className="px-5 py-3 text-neutral-500">{p.type}</td>
                <td className="px-5 py-3 text-neutral-500">{p.scope}</td>
                <td className="px-5 py-3">
                  <span className="rounded-pill bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
