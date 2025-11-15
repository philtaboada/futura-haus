import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/api/customers'
import type { Customer } from '@/types/customer'
import { AxiosError } from 'axios'
import { Plus, Edit, Trash2, Users } from 'lucide-react'

const customerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
})

type CustomerFormData = z.infer<typeof customerSchema>

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [showForm, setShowForm] = useState(false)

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const data = await getCustomers()
      setCustomers(data)
      setError(null)
    } catch (err) {
      const errorMessage = (err as AxiosError<{ message: string }>)?.response?.data?.message || 'Error al cargar clientes'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data)
      } else {
        await createCustomer(data)
      }
      await loadCustomers()
      resetForm()
    } catch (err) {
      const errorMessage = (err as AxiosError<{ message: string }>)?.response?.data?.message || 'Error al guardar cliente'
      setError(errorMessage)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    form.reset({
      name: customer.name,
      email: customer.email,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return
    try {
      await deleteCustomer(id)
      await loadCustomers()
    } catch (err) {
      const errorMessage = (err as AxiosError<{ message: string }>)?.response?.data?.message || 'Error al eliminar cliente'
      setError(errorMessage)
    }
  }

  const resetForm = () => {
    form.reset()
    setEditingCustomer(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tu base de datos de clientes</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancelar' : 'Nuevo Cliente'}
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
            <CardTitle>{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</CardTitle>
            <CardDescription>
              {editingCustomer ? 'Modifica los datos del cliente' : 'Completa los datos para crear un nuevo cliente'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Nombre</FieldLabel>
                      <Input {...field} placeholder="Nombre del cliente" />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Email</FieldLabel>
                      <Input {...field} type="email" placeholder="cliente@example.com" />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
              <div className="flex gap-2">
                <Button type="submit">{editingCustomer ? 'Actualizar' : 'Crear'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando clientes...</div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay clientes registrados</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primer cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{customer.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{customer.email}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Customers

