import type { CreateProductCategoryInput, UpdateProductCategoryInput, UpsertProductInput } from '@chirudeli/shared-types';
import { prisma } from '../../lib/prisma';
import { ConflictError, NotFoundError } from '../../lib/errors';
import { getManagedBusinessId, requireManagedBusiness } from '../../lib/storeAccess';
import { recordAudit } from '../../lib/audit';

function mapProduct(p: {
  id: string;
  businessId: string;
  categoryId: string;
  category: { name: string };
  name: string;
  description: string;
  price: unknown;
  imageUrl: string | null;
  isAvailable: boolean;
  stock: number | null;
  addOns: Array<{ id: string; name: string; priceDelta: unknown }>;
}) {
  return {
    id: p.id,
    businessId: p.businessId,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    imageUrl: p.imageUrl,
    isAvailable: p.isAvailable,
    stock: p.stock,
    addOns: p.addOns.map((a) => ({ id: a.id, name: a.name, priceDelta: Number(a.priceDelta) })),
  };
}

// ── Product categories ───────────────────────────────────────────────────

export async function listMyProductCategories(userId: string) {
  const businessId = await getManagedBusinessId(userId);
  const categories = await prisma.productCategory.findMany({ where: { businessId }, orderBy: { sortOrder: 'asc' } });
  return categories.map((c) => ({ id: c.id, name: c.name, sortOrder: c.sortOrder }));
}

export async function createMyProductCategory(userId: string, input: CreateProductCategoryInput) {
  const businessId = await getManagedBusinessId(userId);
  const category = await prisma.productCategory.create({ data: { businessId, name: input.name, sortOrder: input.sortOrder } });
  return { id: category.id, name: category.name, sortOrder: category.sortOrder };
}

export async function updateMyProductCategory(userId: string, categoryId: string, input: UpdateProductCategoryInput) {
  const category = await prisma.productCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new NotFoundError('Product category');
  await requireManagedBusiness(userId, category.businessId);
  const updated = await prisma.productCategory.update({ where: { id: categoryId }, data: input });
  return { id: updated.id, name: updated.name, sortOrder: updated.sortOrder };
}

export async function deleteMyProductCategory(userId: string, categoryId: string) {
  const category = await prisma.productCategory.findUnique({ where: { id: categoryId }, include: { _count: { select: { products: true } } } });
  if (!category) throw new NotFoundError('Product category');
  await requireManagedBusiness(userId, category.businessId);
  if (category._count.products > 0) {
    throw new ConflictError(`Move or delete the ${category._count.products} product(s) in this category first.`);
  }
  await prisma.productCategory.delete({ where: { id: categoryId } });
}

// ── Products ──────────────────────────────────────────────────────────

export async function listMyProducts(userId: string) {
  const businessId = await getManagedBusinessId(userId);
  const products = await prisma.product.findMany({
    where: { businessId },
    include: { category: true, addOns: true },
    orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
  });
  return products.map(mapProduct);
}

async function requireOwnCategory(userId: string, businessId: string, categoryId: string) {
  const category = await prisma.productCategory.findUnique({ where: { id: categoryId } });
  if (!category || category.businessId !== businessId) {
    throw new NotFoundError('Product category');
  }
}

export async function createMyProduct(userId: string, input: UpsertProductInput) {
  const businessId = await getManagedBusinessId(userId);
  await requireOwnCategory(userId, businessId, input.categoryId);

  const product = await prisma.product.create({
    data: {
      businessId,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      price: input.price,
      imageUrl: input.imageUrl,
      isAvailable: input.isAvailable,
      stock: input.stock ?? null,
      sortOrder: input.sortOrder,
      addOns: { create: input.addOns.map((a) => ({ name: a.name, priceDelta: a.priceDelta })) },
    },
    include: { category: true, addOns: true },
  });
  await recordAudit({ actorUserId: userId, action: 'PRODUCT_CREATED', entityType: 'Product', entityId: product.id, metadata: { businessId, name: product.name } });
  return mapProduct(product);
}

export async function updateMyProduct(userId: string, productId: string, input: UpsertProductInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product');
  await requireManagedBusiness(userId, product.businessId);
  await requireOwnCategory(userId, product.businessId, input.categoryId);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.productAddOn.deleteMany({ where: { productId } });
    return tx.product.update({
      where: { id: productId },
      data: {
        categoryId: input.categoryId,
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        isAvailable: input.isAvailable,
        stock: input.stock ?? null,
        sortOrder: input.sortOrder,
        addOns: { create: input.addOns.map((a) => ({ name: a.name, priceDelta: a.priceDelta })) },
      },
      include: { category: true, addOns: true },
    });
  }, { maxWait: 10_000, timeout: 20_000 });
  await recordAudit({ actorUserId: userId, action: 'PRODUCT_UPDATED', entityType: 'Product', entityId: productId, metadata: { changes: input } });
  return mapProduct(updated);
}

export async function deleteMyProduct(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product');
  await requireManagedBusiness(userId, product.businessId);
  await prisma.productAddOn.deleteMany({ where: { productId } });
  await prisma.product.delete({ where: { id: productId } });
  await recordAudit({ actorUserId: userId, action: 'PRODUCT_DELETED', entityType: 'Product', entityId: productId, metadata: { businessId: product.businessId, name: product.name } });
}
