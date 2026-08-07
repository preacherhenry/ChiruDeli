import { PageHeader } from '../../../src/components/PageHeader';

const PRODUCTS = [
  { name: 'Nshima & Chicken Combo', business: 'Chirundu Grill House', price: 'K65', available: true },
  { name: 'Mealie Meal (5kg)', business: 'Zambezi Fresh Groceries', price: 'K90', available: true },
  { name: 'Panadol (20 tabs)', business: 'Riverside Pharmacy', price: 'K20', available: true },
  { name: 'Bluetooth Speaker', business: 'Chirundu Electronics Hub', price: 'K250', available: false },
];

export default function AdminProductsPage() {
  return (
    <div>
      <PageHeader title="Products" />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-400">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Business</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => (
              <tr key={p.name} className="border-t border-neutral-50">
                <td className="px-5 py-3 font-medium text-neutral-900">{p.name}</td>
                <td className="px-5 py-3 text-neutral-500">{p.business}</td>
                <td className="px-5 py-3 text-neutral-900">{p.price}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${
                      p.available ? 'bg-primary-50 text-primary-700' : 'bg-error/10 text-error'
                    }`}
                  >
                    {p.available ? 'Available' : 'Unavailable'}
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
