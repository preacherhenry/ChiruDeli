import { prisma } from './prisma';
import { ForbiddenError } from './errors';

export async function requireCustomerProfile(userId: string) {
  const customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) throw new ForbiddenError('This action requires a customer account.');
  return customer;
}
