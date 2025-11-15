import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
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
  email: z.string().email(),
  password: z.string().min(8),
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
      const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || 'Error al iniciar sesión'
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
                    <FieldLabel htmlFor="form-rhf-demo-title">
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-email"
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
                    <FieldLabel htmlFor="form-rhf-demo-description">
                      Password
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Password"
                      autoComplete="off"
                    />
                    <FieldDescription>
                      {fieldState.error?.message}
                    </FieldDescription>
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
