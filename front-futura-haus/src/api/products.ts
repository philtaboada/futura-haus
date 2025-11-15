import api from './auth'
import type { Product, CreateProductDto, UpdateProductDto } from '@/types/product'

const normalizeProduct = (product: any): Product => ({
  ...product,
  id: Number(product.id),
  price: Number(product.price),
  stock: Number(product.stock),
})

export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get('/products')
  const products = Array.isArray(response.data) ? response.data : []
  return products.map(normalizeProduct)
}

export const getProduct = async (id: number): Promise<Product> => {
  const response = await api.get(`/products/${id}`)
  return normalizeProduct(response.data)
}

export const createProduct = async (data: CreateProductDto): Promise<Product> => {
  const response = await api.post('/products', data)
  return normalizeProduct(response.data)
}

export const updateProduct = async (id: number, data: UpdateProductDto): Promise<Product> => {
  const response = await api.put(`/products/${id}`, data)
  return normalizeProduct(response.data)
}

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`)
}

