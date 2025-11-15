import type { Product } from './product'
import type { Customer } from './customer'

export interface OrderItem {
  id: number
  productId: number
  qty: number
  price: number
  product?: Product
}

export interface Order {
  id: number
  customerId: number
  status: 'PENDING' | 'CONFIRMED'
  total: number
  createdAt: string
  customer?: Customer
  items?: OrderItem[]
}

export interface CreateOrderDto {
  customerId: number
  items: {
    productId: number
    qty: number
  }[]
}

