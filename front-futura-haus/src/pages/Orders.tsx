import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getOrders, createOrder, confirmOrder } from '@/api/orders'
import { getCustomers } from '@/api/customers'
import { getProducts } from '@/api/products'
import type { Order } from '@/types/order'
import type { Customer } from '@/types/customer'
import type { Product } from '@/types/product'
import { AxiosError } from 'axios'
import { Plus, ShoppingCart, CheckCircle2, Clock } from 'lucide-react'

const orderItemSchema = z.object({
  productId: z.number().positive('Selecciona un producto'),
  qty: z.number().min(1, 'La cantidad debe ser al menos 1'),
})

const orderSchema = z.object({
  customerId: z.number().positive('Selecciona un cliente'),
  items: z.array(orderItemSchema).min(1, 'Debe agregar al menos un producto'),
})

type OrderFormData = z.infer<typeof orderSchema>

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: 0,
      items: [],
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ordersData, customersData, productsData] = await Promise.all([
        getOrders(),
        getCustomers(),
        getProducts(),
      ])
      setOrders(ordersData)
      setCustomers(customersData)
      setProducts(productsData)
      setError(null)
    } catch (err) {
      const errorMessage = (err as AxiosError<{ message: string }>)?.response?.data?.message || 'Error al cargar datos'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: OrderFormData) => {
    try {
      await createOrder(data)
      await loadData()
      resetForm()
    } catch (err) {
      const errorMessage = (err as AxiosError<{ message: string }>)?.response?.data?.message || 'Error al crear pedido'
      setError(errorMessage)
    }
  }

  const handleConfirm = async (id: number) => {
    if (!confirm('¿Estás seguro de confirmar este pedido? Se descontará el stock de los productos.')) return
    try {
      await confirmOrder(id)
      await loadData()
    } catch (err) {
      const errorMessage = (err as AxiosError<{ message: string }>)?.response?.data?.message || 'Error al confirmar pedido'
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  const resetForm = () => {
    form.reset({
      customerId: 0,
      items: [],
    })
    setShowForm(false)
  }

  const addItem = () => {
    const currentItems = form.getValues('items')
    form.setValue('items', [...currentItems, { productId: 0, qty: 1 }])
  }

  const removeItem = (index: number) => {
    const currentItems = form.getValues('items')
    form.setValue('items', currentItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: 'productId' | 'qty', value: number) => {
    const currentItems = form.getValues('items')
    const updatedItems = [...currentItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    form.setValue('items', updatedItems)
  }

  const getProductName = (productId: number) => {
    return products.find(p => p.id === productId)?.name || 'Selecciona un producto'
  }

  const getCustomerName = (customerId: number) => {
    return customers.find(c => c.id === customerId)?.name || 'Cliente desconocido'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">Gestiona los pedidos de tus clientes</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancelar' : 'Nuevo Pedido'}
        </Button>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Pedido</CardTitle>
            <CardDescription>Selecciona un cliente y agrega productos al pedido</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FieldGroup>
                <Controller
                  name="customerId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Cliente</FieldLabel>
                      <select
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value={0}>Selecciona un cliente</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} - {customer.email}
                          </option>
                        ))}
                      </select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FieldLabel>Productos</FieldLabel>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Producto
                    </Button>
                  </div>

                  {form.watch('items').map((item, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value={0}>Selecciona un producto</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - Stock: {product.stock} - ${Number(product.price).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
                          placeholder="Cantidad"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => removeItem(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </FieldGroup>
              <div className="flex gap-2">
                <Button type="submit">Crear Pedido</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando pedidos...</div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay pedidos registrados</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primer pedido
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Pedido #{order.id}
                      {order.status === 'CONFIRMED' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      Cliente: {getCustomerName(order.customerId)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${Number(order.total).toFixed(2)}</div>
                    <div className={`text-sm font-medium ${
                      order.status === 'CONFIRMED' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {order.status === 'CONFIRMED' ? 'Confirmado' : 'Pendiente'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.product?.name || getProductName(item.productId)} x {item.qty}
                        </span>
                        <span className="font-medium">
                          ${(Number(item.price) * Number(item.qty)).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin productos</p>
                  )}
                </div>
                {order.status === 'PENDING' && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={() => handleConfirm(order.id)}
                      className="w-full"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmar Pedido
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders
