import type { BusinessStatus } from '@chirudeli/shared-types';

const LABELS: Record<BusinessStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_APPROVAL: 'Pending Approval',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RESUBMISSION: 'Changes Requested',
  SUSPENDED: 'Suspended',
  DEACTIVATED: 'Deactivated',
};

const STYLES: Record<BusinessStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600',
  SUBMITTED: 'bg-info/10 text-info',
  PENDING_APPROVAL: 'bg-info/10 text-info',
  UNDER_REVIEW: 'bg-info/10 text-info',
  APPROVED: 'bg-primary-50 text-primary-700',
  REJECTED: 'bg-error/10 text-error',
  RESUBMISSION: 'bg-secondary-50 text-secondary-700',
  SUSPENDED: 'bg-error/10 text-error',
  DEACTIVATED: 'bg-neutral-100 text-neutral-500',
};

export function StatusPill({ status, isActivated }: { status: BusinessStatus; isActivated?: boolean }) {
  const label = status === 'APPROVED' && isActivated === false ? 'Approved (inactive)' : LABELS[status];
  return <span className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>{label}</span>;
}
