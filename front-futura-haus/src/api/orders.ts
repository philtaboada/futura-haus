import api from './auth'
import type { Order, CreateOrderDto } from '@/types/order'

const normalizeOrder = (order: any): Order => ({
  ...order,
  id: Number(order.id),
  customerId: Number(order.customerId),
  total: Number(order.total),
  items: order.items?.map((item: any) => ({
    ...item,
    id: Number(item.id),
    productId: Number(item.productId),
    qty: Number(item.qty),
    price: Number(item.price),
  })) || [],
})

export const getOrders = async (): Promise<Order[]> => {
  const response = await api.get('/orders')
  const orders = Array.isArray(response.data) ? response.data : []
  return orders.map(normalizeOrder)
}

export const getOrder = async (id: number): Promise<Order> => {
  const response = await api.get(`/orders/${id}`)
  return normalizeOrder(response.data)
}

export const createOrder = async (data: CreateOrderDto): Promise<Order> => {
  const response = await api.post('/orders', data)
  return normalizeOrder(response.data)
}

export const confirmOrder = async (id: number): Promise<Order> => {
  const response = await api.post(`/orders/${id}/confirm`)
  return normalizeOrder(response.data)
}

