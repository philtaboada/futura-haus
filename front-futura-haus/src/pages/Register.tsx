import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Controller } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import { getValidToken } from '@/utils/jwt'
import { register } from '@/api/auth'
import { AxiosError } from 'axios'

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

type FormSchema = z.infer<typeof formSchema>
export const Register = () => {

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = getValidToken();
    if (token) {
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
      const response = await register(data.email, data.password)
      if (response && response.token) {
        localStorage.setItem('token', response.token)
        navigate('/products')
      } else {
        setError('No se recibió un token válido')
      }
    } catch (error) {
      const errorMessage = (error as AxiosError<{ message: string }>)?.response?.data?.message || 'Error al registrar usuario'
      setError(errorMessage)
      console.error('Error en registro:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Registrarse</CardTitle>
          <CardDescription>
            Cree una cuenta para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="form-register" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-register-email">
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-register-email"
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
                    <FieldLabel htmlFor="form-register-password">
                      Contraseña
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-register-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Contraseña"
                      autoComplete="off"
                    />
                    <FieldDescription>
                      Mínimo 8 caracteres
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
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </Button>
              <Button type="button" variant="link" onClick={() => navigate('/login')}>
                ¿Ya tienes cuenta? Iniciar sesión
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
