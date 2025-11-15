export interface Product {
  id: number
  name: string
  sku: string
  price: number
  stock: number
}

export interface CreateProductDto {
  name: string
  sku: string
  price: number
  stock: number
}

export interface UpdateProductDto {
  name?: string
  sku?: string
  price?: number
  stock?: number
}

