'use client';

import { PageHeader } from '../../../src/components/PageHeader';
import { Button } from '../../../src/components/Button';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" />

      <div className="max-w-xl space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-heading text-sm font-semibold text-neutral-900">Cancellation window</h2>
          <p className="mb-3 text-sm text-neutral-500">
            Customers can cancel orders up until this status — currently &quot;Confirmed&quot; (before
            preparation starts).
          </p>
          <select
            defaultValue="Up to Confirmed"
            className="h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary-500"
          >
            <option>Pending confirmation only</option>
            <option>Up to Confirmed</option>
            <option>Up to Preparing</option>
          </select>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-heading text-sm font-semibold text-neutral-900">Two-factor authentication</h2>
          <p className="mb-3 text-sm text-neutral-500">
            Require admin accounts to confirm a TOTP code at login. (Schema-ready — see docs/roadmap.md.)
          </p>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" className="h-4 w-4 rounded" disabled />
            Require 2FA for all admins
          </label>
        </div>

        <Button>Save settings</Button>
      </div>
    </div>
  );
}
