import api from './auth'
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer'

export const getCustomers = async (): Promise<Customer[]> => {
  const response = await api.get('/customers')
  return response.data
}

export const getCustomer = async (id: number): Promise<Customer> => {
  const response = await api.get(`/customers/${id}`)
  return response.data
}

export const createCustomer = async (data: CreateCustomerDto): Promise<Customer> => {
  const response = await api.post('/customers', data)
  return response.data
}

export const updateCustomer = async (id: number, data: UpdateCustomerDto): Promise<Customer> => {
  const response = await api.put(`/customers/${id}`, data)
  return response.data
}

export const deleteCustomer = async (id: number): Promise<void> => {
  await api.delete(`/customers/${id}`)
}

