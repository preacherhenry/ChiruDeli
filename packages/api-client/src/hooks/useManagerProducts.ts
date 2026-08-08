import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProductCategoryInput, UpdateProductCategoryInput, UpsertProductInput } from '@chirudeli/shared-types';
import { useApiClient } from '../context';

export function useMyProductCategories() {
  const client = useApiClient();
  return useQuery({ queryKey: ['manager', 'productCategories'], queryFn: () => client.manager.productCategories.list() });
}

export function useCreateMyProductCategory() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductCategoryInput) => client.manager.productCategories.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager', 'productCategories'] }),
  });
}

export function useUpdateMyProductCategory() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductCategoryInput }) => client.manager.productCategories.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager', 'productCategories'] }),
  });
}

export function useDeleteMyProductCategory() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.manager.productCategories.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'productCategories'] });
      qc.invalidateQueries({ queryKey: ['manager', 'products'] });
    },
  });
}

export function useMyProducts() {
  const client = useApiClient();
  return useQuery({ queryKey: ['manager', 'products'], queryFn: () => client.manager.products.list() });
}

export function useCreateMyProduct() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertProductInput) => client.manager.products.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager', 'products'] }),
  });
}

export function useUpdateMyProduct() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpsertProductInput }) => client.manager.products.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager', 'products'] }),
  });
}

export function useDeleteMyProduct() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.manager.products.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager', 'products'] }),
  });
}
