import { Link } from 'react-router-dom'
import SplitText from '@/components/SplitText'

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full text-center space-y-16">
        {/* Título principal */}
        <div className="space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">
            <SplitText text="Futura Haus" className="text-5xl md:text-6xl font-bold text-foreground tracking-tight" />
          </h1>
          <div className="space-y-4">
            <p className="text-xl md:text-2xl text-muted-foreground">
              Sistema de Gestión
            </p>
            <p className="text-base md:text-lg text-muted-foreground/80 max-w-md mx-auto">
              Gestiona tu negocio de manera eficiente y profesional
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Iniciar Sesión
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold text-lg hover:bg-secondary/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-border"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home