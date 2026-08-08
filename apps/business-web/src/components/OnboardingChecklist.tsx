import { Check, Circle } from 'lucide-react';
import type { OnboardingChecklist as OnboardingChecklistType } from '@chirudeli/shared-types';
import { Button } from './Button';

const STEPS: Array<{ key: keyof OnboardingChecklistType; label: string; hint: string }> = [
  { key: 'profileComplete', label: 'Complete store profile', hint: 'Description, phone, and address' },
  { key: 'openingHoursSet', label: 'Set opening hours', hint: 'At least one day open' },
  { key: 'hasProductCategory', label: 'Create a product category', hint: 'e.g. Popular, Drinks' },
  { key: 'hasProduct', label: 'Add a product', hint: 'At least one product in the catalogue' },
  { key: 'hasPricedAvailableProduct', label: 'Price and enable a product', hint: 'Available with a price above K0' },
  { key: 'requiredDocumentsApproved', label: 'Get required documents approved', hint: 'Reviewed by ChiruDeli admin' },
];

export function OnboardingChecklist({
  checklist,
  onActivate,
  activating,
}: {
  checklist: OnboardingChecklistType;
  onActivate: () => void;
  activating: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-heading text-base font-semibold text-neutral-900">Finish setting up your store</h2>
      <p className="mb-4 text-sm text-neutral-500">Complete every step below, then activate your store to go live.</p>
      <div className="space-y-2">
        {STEPS.map((step) => {
          const done = checklist[step.key];
          return (
            <div key={step.key} className="flex items-center gap-3">
              {done ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600">
                  <Check size={12} className="text-white" />
                </div>
              ) : (
                <Circle size={20} className="text-neutral-300" />
              )}
              <div>
                <div className={`text-sm font-medium ${done ? 'text-neutral-900' : 'text-neutral-500'}`}>{step.label}</div>
                <div className="text-xs text-neutral-400">{step.hint}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5">
        <Button onClick={onActivate} disabled={!checklist.isComplete} loading={activating} className="w-full sm:w-auto">
          Activate Store
        </Button>
      </div>
    </div>
  );
}
