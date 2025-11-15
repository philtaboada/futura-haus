import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Controller } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useNavigate } from 'react-router'
import { useState, useEffect } from 'react'
import { login } from '@/api/auth'
import { AxiosError } from 'axios'
import { getValidToken } from '@/utils/jwt'

const formSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida').min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

type FormSchema = z.infer<typeof formSchema>
export const Login = () => {

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const navigate = useNavigate()

  // Verificar si ya hay un token válido al montar el componente
  useEffect(() => {
    const token = getValidToken();
    if (token) {
      // Si hay un token válido, redirigir a la primera ruta protegida
      navigate('/products', { replace: true });
    }
  }, [navigate]);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: FormSchema) => {
    setError(null)
    setLoading(true)
    try {
      const response = await login(data.email, data.password)
      if (response && response.token) {
        localStorage.setItem('token', response.token)
        navigate('/products')
      } else {
        setError('No se recibió un token válido')
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; statusCode?: number }>
      let errorMessage = 'Error al iniciar sesión'
      
      if (axiosError.response) {
        const responseData = axiosError.response.data
        const backendMessage = responseData?.message || ''
        const statusCode = axiosError.response.status || responseData?.statusCode
        
        // Traducir mensajes comunes del backend
        if (statusCode === 401 || backendMessage.toLowerCase().includes('invalid credentials') || backendMessage.toLowerCase().includes('unauthorized')) {
          errorMessage = 'Credenciales incorrectas. Verifique su email y contraseña.'
        } else if (statusCode === 404) {
          errorMessage = 'Usuario no encontrado.'
        } else if (statusCode && statusCode >= 500) {
          errorMessage = 'Error del servidor. Por favor, intente más tarde.'
        } else if (backendMessage) {
          // Si hay un mensaje del backend pero no coincide con los casos anteriores, usarlo
          errorMessage = backendMessage
        }
      } else if (axiosError.request) {
        errorMessage = 'No se pudo conectar al servidor. Verifique su conexión.'
      }
      
      setError(errorMessage)
      console.error('Error en login:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingrese su email y contraseña para iniciar sesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-email">
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="Email"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-password">
                      Contraseña
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Contraseña"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            {error && (
              <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="flex flex-col justify-between w-full gap-4 mt-4">
            <Button className="w-full" type="submit" size="lg" variant="default" disabled={loading}>
              {loading ? 'Cargando...' : 'Ingresar'}
            </Button>
            <Button type="button" variant="link" onClick={() => navigate('/register')}>
              Registrarse
            </Button>
          </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
