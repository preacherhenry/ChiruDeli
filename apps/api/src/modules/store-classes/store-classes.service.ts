import { prisma } from '../../lib/prisma';
import { ConflictError, NotFoundError } from '../../lib/errors';
import { recordAudit } from '../../lib/audit';
import type { CreateStoreClassInput, UpdateStoreClassInput } from '@chirudeli/shared-types';

const withRequirements = {
  include: { requiredDocuments: { orderBy: { sortOrder: 'asc' as const } } },
};

function mapStoreClass(sc: {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  coverImageUrl: string | null;
  isActive: boolean;
  isVisible: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  requiredDocuments: Array<{ id: string; documentLabel: string; isRequired: boolean; sortOrder: number }>;
  _count?: { businesses: number };
}) {
  return {
    id: sc.id,
    name: sc.name,
    slug: sc.slug,
    description: sc.description,
    icon: sc.icon,
    coverImageUrl: sc.coverImageUrl,
    isActive: sc.isActive,
    isVisible: sc.isVisible,
    sortOrder: sc.sortOrder,
    storeCount: sc._count?.businesses ?? 0,
    requiredDocuments: sc.requiredDocuments.map((d) => ({
      id: d.id,
      documentLabel: d.documentLabel,
      isRequired: d.isRequired,
      sortOrder: d.sortOrder,
    })),
    createdAt: sc.createdAt.toISOString(),
    updatedAt: sc.updatedAt.toISOString(),
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || 'store-class';
  let slug = base;
  let n = 1;
  // Small tables, small n — a loop is simpler and clearer than a clever query here.
  while (await prisma.storeClass.findFirst({ where: { slug, id: excludeId ? { not: excludeId } : undefined } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Customer-facing + store-registration list: only classes an admin has
 * both activated and made visible. */
export async function listStoreClasses() {
  const classes = await prisma.storeClass.findMany({
    where: { isActive: true, isVisible: true },
    orderBy: { sortOrder: 'asc' },
    ...withRequirements,
  });
  return classes.map(mapStoreClass);
}

export async function listAdminStoreClasses() {
  const classes = await prisma.storeClass.findMany({
    orderBy: { sortOrder: 'asc' },
    ...withRequirements,
    include: { ...withRequirements.include, _count: { select: { businesses: true } } },
  });
  return classes.map(mapStoreClass);
}

export async function createStoreClass(input: CreateStoreClassInput, actorUserId: string) {
  const slug = await uniqueSlug(input.name);
  const created = await prisma.storeClass.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      icon: input.icon,
      coverImageUrl: input.coverImageUrl,
      isActive: input.isActive,
      isVisible: input.isVisible,
      sortOrder: input.sortOrder,
      requiredDocuments: {
        create: input.requiredDocuments.map((d) => ({
          documentLabel: d.documentLabel,
          isRequired: d.isRequired,
          sortOrder: d.sortOrder,
        })),
      },
    },
    ...withRequirements,
  });
  await recordAudit({
    actorUserId,
    action: 'STORE_CLASS_CREATED',
    entityType: 'StoreClass',
    entityId: created.id,
    metadata: { name: created.name },
  });
  return mapStoreClass(created);
}

export async function updateStoreClass(id: string, input: UpdateStoreClassInput, actorUserId: string) {
  const existing = await prisma.storeClass.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Store class');

  const slug = input.name && input.name !== existing.name ? await uniqueSlug(input.name, id) : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    if (input.requiredDocuments) {
      await tx.storeClassDocumentRequirement.deleteMany({ where: { storeClassId: id } });
    }
    return tx.storeClass.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        description: input.description,
        icon: input.icon,
        coverImageUrl: input.coverImageUrl,
        isActive: input.isActive,
        isVisible: input.isVisible,
        sortOrder: input.sortOrder,
        ...(input.requiredDocuments
          ? {
              requiredDocuments: {
                create: input.requiredDocuments.map((d) => ({
                  documentLabel: d.documentLabel,
                  isRequired: d.isRequired,
                  sortOrder: d.sortOrder,
                })),
              },
            }
          : {}),
      },
      ...withRequirements,
    });
  }, { maxWait: 10_000, timeout: 20_000 });

  await recordAudit({
    actorUserId,
    action: 'STORE_CLASS_UPDATED',
    entityType: 'StoreClass',
    entityId: id,
    metadata: { changes: input },
  });
  return mapStoreClass(updated);
}

export async function deleteStoreClass(id: string, actorUserId: string) {
  const existing = await prisma.storeClass.findUnique({
    where: { id },
    include: { _count: { select: { businesses: true } } },
  });
  if (!existing) throw new NotFoundError('Store class');
  if (existing._count.businesses > 0) {
    throw new ConflictError(
      `Cannot delete "${existing.name}" — ${existing._count.businesses} store(s) still belong to it. Deactivate it instead.`,
    );
  }
  await prisma.storeClassDocumentRequirement.deleteMany({ where: { storeClassId: id } });
  await prisma.storeClass.delete({ where: { id } });
  await recordAudit({ actorUserId, action: 'STORE_CLASS_DELETED', entityType: 'StoreClass', entityId: id, metadata: { name: existing.name } });
}
