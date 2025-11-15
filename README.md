# Gestor de Pedidos - Prueba Técnica Full-Stack

Aplicación full-stack para gestionar productos, clientes y pedidos con autenticación JWT.

## 🚀 Tecnologías

### Backend
- **NestJS** - Framework Node.js
- **TypeScript** - Lenguaje de programación
- **PostgreSQL** - Base de datos
- **Prisma** - ORM
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas
- **class-validator** - Validación de datos

### Frontend
- **React 19** con **TypeScript**
- **Vite 7** con plugin `@tailwindcss/vite` para Tailwind CSS 4
- **Tailwind CSS 4** y `tw-animate-css` para estilos y animaciones utilitarias
- **shadcn/ui** sobre **Radix UI** para componentes reutilizables
- **React Router 7** para enrutamiento basado en hooks
- **React Hook Form** + **Zod** + `@hookform/resolvers` para formularios tipados con validación
- **Axios** con interceptores JWT para el cliente HTTP
- **GSAP** + `@gsap/react` para animaciones de texto y scroll
- **Lucide React** para iconografía

### DevOps
- **Docker Compose** - Orquestación de contenedores

## 📋 Requisitos Previos

- Node.js 20+ y npm/pnpm
- Docker y Docker Compose (opcional)
- PostgreSQL (si no usas Docker)

## 🛠️ Instalación y Configuración

### Opción 1: Con Docker Compose (Recomendado)

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd futura-haus
```

2. Levantar los servicios:
```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en el puerto 5432
- Backend en el puerto 3000
- Frontend en el puerto 5173

3. Ejecutar migraciones:
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Opción 2: Sin Docker

#### Backend

1. Navegar al directorio del backend:
```bash
cd backend-futura-haus
```

2. Instalar dependencias:
```bash
npm install
# o
pnpm install
# o
bun install
```

3. Configurar variables de entorno:
Crear archivo `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/futura_haus?schema=public
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
FRONTEND_URL=http://localhost:5173
```

4. Configurar base de datos:
```bash
# Asegúrate de que PostgreSQL esté corriendo
npx prisma migrate deploy
npx prisma generate
```

5. Iniciar el servidor:
```bash
npm run start:dev
```

#### Frontend

1. Navegar al directorio del frontend:
```bash
cd front-futura-haus
```

2. Instalar dependencias:
```bash
npm install
# o
pnpm install
# o
bun install
```

3. Configurar variables de entorno:
Crear archivo `.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
# o
pnpm run dev
# o
bun run dev
```

## 📚 API Endpoints

Base URL: `http://localhost:3000/api`

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registro de usuario | No |
| POST | `/auth/login` | Login de usuario | No |
| GET | `/auth/me` | Usuario autenticado actual | Sí |

**Ejemplo de registro:**
```json
POST /api/auth/register
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Ejemplo de login:**
```json
POST /api/auth/login
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

### Productos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/products` | Listar productos | Sí |
| GET | `/products/:id` | Obtener producto | Sí |
| POST | `/products` | Crear producto | Sí |
| PUT | `/products/:id` | Actualizar producto | Sí |
| DELETE | `/products/:id` | Eliminar producto | Sí |

**Ejemplo de creación:**
```json
POST /api/products
{
  "name": "Producto Ejemplo",
  "sku": "SKU-001",
  "price": 99.99,
  "stock": 100
}
```

### Clientes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/customers` | Listar clientes | Sí |
| GET | `/customers/:id` | Obtener cliente | Sí |
| POST | `/customers` | Crear cliente | Sí |
| PUT | `/customers/:id` | Actualizar cliente | Sí |
| DELETE | `/customers/:id` | Eliminar cliente | Sí |

**Ejemplo de creación:**
```json
POST /api/customers
{
  "name": "Juan Pérez",
  "email": "juan@example.com"
}
```

### Pedidos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/orders` | Listar pedidos | Sí |
| GET | `/orders/:id` | Obtener pedido | Sí |
| POST | `/orders` | Crear pedido | Sí |
| POST | `/orders/:id/confirm` | Confirmar pedido | Sí |

**Ejemplo de creación:**
```json
POST /api/orders
{
  "customerId": 1,
  "items": [
    {
      "productId": 1,
      "qty": 2
    },
    {
      "productId": 2,
      "qty": 1
    }
  ]
}
```

**Confirmar pedido:**
```json
POST /api/orders/1/confirm
```

## 🔐 Autenticación

Todas las rutas protegidas requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

El token se obtiene al hacer login o registro y se almacena automáticamente en el frontend.

## 🧪 Testing

### Backend

Ejecutar tests unitarios:
```bash
cd backend-futura-haus
npm run test
```

Ejecutar tests con cobertura:
```bash
npm run test:cov
```

Ejecutar tests e2e:
```bash
npm run test:e2e
```

### Tests Implementados

- **AuthService**: Registro, login, validación de usuarios
- **ProductsService**: CRUD, validación de SKU único, validación de precios/stock
- **OrdersService**: Creación de pedidos, confirmación con transacciones, validación de stock

## 📊 Modelo de Datos

### Users
- `id`: ID único
- `email`: Email único
- `password_hash`: Hash de contraseña
- `created_at`: Fecha de creación

### Products
- `id`: ID único
- `name`: Nombre del producto
- `sku`: SKU único
- `price`: Precio (>= 0)
- `stock`: Stock disponible (>= 0)

### Customers
- `id`: ID único
- `name`: Nombre del cliente
- `email`: Email único

### Orders
- `id`: ID único
- `customer_id`: ID del cliente
- `status`: Estado (PENDING | CONFIRMED)
- `total`: Total calculado automáticamente
- `created_at`: Fecha de creación

### OrderItems
- `id`: ID único
- `order_id`: ID del pedido
- `product_id`: ID del producto
- `qty`: Cantidad (>= 1)
- `price`: Precio al momento de la creación

## 🔄 Reglas de Negocio

1. **Productos**:
   - SKU debe ser único
   - Precio y stock no pueden ser negativos

2. **Clientes**:
   - Email debe ser único

3. **Pedidos**:
   - Solo pueden estar en estado PENDING o CONFIRMED
   - Al confirmar, se realiza una transacción SQL que:
     - Verifica stock disponible
     - Descuenta las cantidades correspondientes
     - Cambia el estado a CONFIRMED
     - En caso de error, revierte todo (rollback)

## 👤 Usuarios de Prueba

Puedes crear usuarios de prueba registrándote desde la interfaz web o usando la API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
```

## 🐛 Solución de Problemas

### Error de conexión a la base de datos
- Verifica que PostgreSQL esté corriendo
- Revisa la URL de conexión en `.env`
- Asegúrate de que la base de datos exista

### Error de migraciones
```bash
cd backend-futura-haus
npx prisma migrate reset  # Cuidado: elimina todos los datos
npx prisma migrate deploy
```

## 📝 Notas sobre el Uso de IA

Este proyecto fue desarrollado utilizando **Cursor AI** como herramienta de asistencia. 

### Partes generadas/mejoradas con IA:
- Generación de tipos TypeScript para el frontend
- Creación de componentes React con manejo de estado
- Optimización de queries y transacciones de base de datos


