export interface Customer {
  id: number
  name: string
  email: string
}

export interface CreateCustomerDto {
  name: string
  email: string
}

export interface UpdateCustomerDto {
  name?: string
  email?: string
}

