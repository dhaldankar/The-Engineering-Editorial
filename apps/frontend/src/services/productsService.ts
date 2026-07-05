import { apiFetch } from './apiClient';
import type { ProductDTO, UpdateProductInput } from '../types/product';

export function getCurrentProduct(): Promise<ProductDTO> {
  return apiFetch<ProductDTO>('/products/current');
}

export function listProducts(): Promise<ProductDTO[]> {
  return apiFetch<ProductDTO[]>('/products');
}

export function updateCurrentProduct(patch: UpdateProductInput): Promise<ProductDTO> {
  return apiFetch<ProductDTO>('/products/current', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
