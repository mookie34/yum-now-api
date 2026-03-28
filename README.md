# Yum Now API - Plataforma de Domicilios por WhatsApp

## Descripcion

API REST en Node.js para la gestion de pedidos de domicilios realizados por WhatsApp.
Incluye una **API REST con Express 5**, una **base de datos PostgreSQL** con esquema `YuNowDataBase`,
y esta disenada para integrarse con una **aplicacion web en Angular** para administradores y domiciliarios.

---

## Caracteristicas Principales

- **API REST completa** con CRUD para todos los recursos del dominio
- **Arquitectura en capas** (Routes -> Controllers -> Services -> Repositories)
- **Base de datos PostgreSQL** con pool de conexiones (max 20)
- **Tests de integracion** con Jest y Supertest (9 archivos de test)
- **Seguridad** con Helmet, CORS y Rate Limiting (100 req/15min)
- **Autenticacion JWT** para proteger los endpoints de administracion (login, token Bearer)
- **Manejo de errores** centralizado con clases personalizadas (ValidationError, NotFoundError, DuplicateError, BusinessRuleError, UnauthorizedError)
- **Hot reload** en desarrollo con Nodemon
- **Health check** endpoint para monitoreo (`GET /health`)
- **Graceful shutdown** con cierre de conexiones y timeout de 10s
- **Soft delete y hard delete** en productos
- **Actualizaciones parciales** (PATCH) y completas (PUT) en la mayoria de recursos

---

## Stack Tecnologico

| Categoria | Tecnologia | Version |
|-----------|-----------|---------|
| Runtime | Node.js | - |
| Framework | Express | 5.1.0 |
| Base de datos | PostgreSQL (pg) | 8.16.3 |
| Seguridad HTTP | Helmet | 8.1.0 |
| CORS | cors | 2.8.5 |
| Rate Limiting | express-rate-limit | 8.1.0 |
| Variables de entorno | dotenv | 17.2.1 |
| Autenticacion JWT | jsonwebtoken | 9.x |
| Testing | Jest | 30.1.3 |
| HTTP Testing | Supertest | 7.1.4 |
| Hot Reload | Nodemon | 3.1.10 |

---

## Arquitectura

El proyecto sigue una **arquitectura en capas (N-Tier)** con separacion clara de responsabilidades:

```
Request HTTP
     |
     v
  Routes          -> Define endpoints y aplica rate limiting
     |
     v
  Controllers     -> Maneja req/res HTTP, mapea errores a codigos HTTP
     |
     v
  Services        -> Logica de negocio, validacion, normalizacion
     |
     v
  Repositories    -> Acceso a datos, queries SQL directas con pg
     |
     v
  PostgreSQL      -> Base de datos (esquema YuNowDataBase)
```

### Flujo de errores

```
Repository (lanza error generico)
     |
     v
Service (captura, valida y lanza error personalizado)
     |
     v
Controller (mapea error a codigo HTTP)
     |
     v
  400 ValidationError | 404 NotFoundError | 409 DuplicateError | 401 UnauthorizedError | 500 Error generico
```

---

## Modelo de Datos

### Diagrama de relaciones

```
customers (1) -----> (*) addresses
    |                        |
    | (1)                    | (*)
    v                        v
  orders (*) <------------- (1)
    |
    |--- (*) order_items (*) ---> products
    |
    |--- (1) assignment_order (1) ---> couriers
    |
    |--- (*:1) payment_methods
    |--- (*:1) order_statuses

customers (1) -----> (*) customer_preferences
```

### Tablas principales

| Tabla | Campos clave | Descripcion |
|-------|-------------|-------------|
| `customers` | id, name, phone (UNIQUE), email | Clientes del sistema |
| `addresses` | id, customer_id (FK), address_text, latitude, longitude, is_primary | Direcciones de entrega |
| `products` | id, name, description, price, is_active | Menu de productos |
| `orders` | id, customer_id (FK), address_id (FK), total, payment_method_id, status_id | Pedidos |
| `order_items` | id, order_id (FK), product_id (FK), quantity, price | Items dentro de un pedido |
| `couriers` | id, name, phone, vehicle, license_plate, available | Domiciliarios |
| `assignment_order` | id, order_id (FK-UNIQUE), courier_id (FK), assigned_at | Asignacion pedido-domiciliario |
| `customer_preferences` | id, customer_id (FK), preference_key, preference_value | Preferencias clave-valor |
| `payment_methods` | id, display_name, name, is_active | Metodos de pago |
| `order_statuses` | id, display_name, name | Estados del pedido |

---

## Estructura del Proyecto

```
yum-now-api/
├── app.js                    # Configuracion de Express, middlewares y rutas
├── server.js                 # Punto de entrada, startup y graceful shutdown
├── db.js                     # Pool de conexiones PostgreSQL
│
├── routes/                   # Definicion de endpoints HTTP
│   ├── auth.js               # POST /api/auth/login
│   ├── addresses.js
│   ├── assign-orders.js
│   ├── couriers.js
│   ├── customer-preferences.js
│   ├── customers.js
│   ├── order-items.js
│   ├── orders.js
│   ├── payments.js
│   └── products.js
│
├── controllers/              # Manejo de requests/responses HTTP
│   ├── auth-controller.js
│   ├── addresses-controller.js
│   ├── assign-orders-controller.js
│   ├── couriers-controller.js
│   ├── customer-controller.js
│   ├── customer-preferences-controller.js
│   ├── order-items-controller.js
│   ├── orders-controller.js
│   ├── payments-controller.js
│   └── products-controller.js
│
├── services/                 # Logica de negocio y validacion
│   ├── auth-service.js       # Validacion de credenciales y generacion de token
│   ├── addresses-service.js
│   ├── assign-orders-service.js
│   ├── couriers-service.js
│   ├── customer-service.js
│   ├── customer-preferences-service.js
│   ├── orders-items-service.js
│   ├── orders-service.js
│   ├── payments-service.js
│   └── product-service.js
│
├── repositories/             # Capa de persistencia (queries SQL)
│   ├── addresses-repository.js
│   ├── assign-orders-repository.js
│   ├── couriers-repository.js
│   ├── customer-repository.js
│   ├── customer-preferences-repository.js
│   ├── order-items-repository.js
│   ├── orders-repository.js
│   ├── payments-repository.js
│   └── products-repository.js
│
├── middleware/               # Middlewares personalizados
│   └── authenticate.js       # Verificacion de token JWT
│
├── utils/                    # Utilidades compartidas
│   └── sanitize.js           # Sanitizacion de inputs y parseo de paginacion
│
├── errors/                   # Clases de error personalizadas
│   └── custom-errors.js
│
├── test/                     # Tests de integracion (Jest + Supertest)
│   ├── setupTests.js
│   ├── test-connection.js
│   ├── addresses.test.js
│   ├── assignOrders.test.js
│   ├── couriers.test.js
│   ├── customerPreferences.test.js
│   ├── customers.test.js
│   ├── orderItems.test.js
│   ├── orders.test.js
│   ├── payments.test.js
│   └── products.test.js
│
├── .env.example              # Plantilla de variables de entorno
├── .gitignore
└── package.json
```

---

## Autenticacion

La API usa **JWT (JSON Web Token)** para proteger los endpoints de administracion.

### Como funciona

```
1. El admin hace POST /api/auth/login con usuario y contrasena
2. El servidor valida las credenciales contra las variables de entorno
3. Si son correctas, devuelve un token JWT valido por 8 horas
4. El admin incluye ese token en cada request protegido
5. El middleware authenticate.js verifica el token antes de llegar al controlador
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "tu-password"
}
```

Respuesta exitosa (`200`):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Credenciales incorrectas (`401`):

```json
{
  "error": "Credenciales incorrectas"
}
```

### Usar el token en requests protegidos

Incluye el token en el header `Authorization` con el prefijo `Bearer`:

```http
DELETE /api/products/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Sin token o token invalido, la API responde `401`:

```json
{
  "error": "Token de autenticacion requerido"
}
```

### Endpoints publicos vs protegidos

Los endpoints **publicos** no requieren token porque los usan el bot de WhatsApp o la app del repartidor:

| Recurso | Publico | Protegido (admin) |
|---------|---------|-------------------|
| Productos | GET (ver catalogo) | POST, PUT, PATCH, DELETE |
| Pedidos | POST (bot crea), GET por cliente/ID | GET lista completa, PATCH estado, DELETE |
| Repartidores | GET (app repartidor) | POST, PUT, PATCH, DELETE |
| Asignaciones | GET por repartidor/pedido | GET lista, POST, PUT, DELETE |

### Variables de entorno requeridas

```env
JWT_SECRET=una-clave-secreta-larga-y-aleatoria
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu-password-seguro
```

> El token expira en **8 horas**. Vuelve a hacer login para obtener uno nuevo.

---

## Endpoints de la API

### Autenticacion (`/api/auth`)
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Obtener token JWT |

### Productos (`/api/products`)
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/products` | No | Listar productos (paginacion: ?limit=&offset=) |
| GET | `/api/products/filter` | No | Buscar productos por filtros |
| GET | `/api/products/:id` | No | Obtener producto por ID |
| POST | `/api/products` | **Si** | Crear producto |
| PUT | `/api/products/:id` | **Si** | Actualizar producto completo |
| PATCH | `/api/products/:id` | **Si** | Actualizar producto parcialmente |
| PATCH | `/api/products/:id/deactivate` | **Si** | Desactivar producto (soft delete) |
| DELETE | `/api/products/:id` | **Si** | Eliminar producto permanentemente |

### Pedidos (`/api/orders`)
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/api/orders` | No | Crear pedido (usado por el bot) |
| GET | `/api/orders/:id` | No | Obtener pedido por ID |
| GET | `/api/orders/customer/:customerId` | No | Pedidos por cliente |
| GET | `/api/orders` | **Si** | Listar todos los pedidos |
| GET | `/api/orders/count` | **Si** | Contar pedidos del dia |
| GET | `/api/orders/status/:statusId` | **Si** | Pedidos por estado |
| PUT | `/api/orders/:id/total` | **Si** | Actualizar total del pedido |
| PATCH | `/api/orders/:id/status` | **Si** | Cambiar estado del pedido |
| PATCH | `/api/orders/:id` | **Si** | Actualizar pedido parcialmente |
| DELETE | `/api/orders/:id` | **Si** | Eliminar pedido |

### Items de Pedido (`/api/order-items`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/order-items` | Listar todos los items |
| GET | `/api/order-items/order/:orderId` | Items por pedido |
| POST | `/api/order-items` | Agregar item (precio auto-poblado desde producto) |
| PUT | `/api/order-items` | Actualizar cantidad/precio de item |
| DELETE | `/api/order-items/order/:orderId` | Eliminar todos los items de un pedido |
| DELETE | `/api/order-items/order/:orderId/product/:productId` | Eliminar item especifico |

### Clientes (`/api/customers`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/customers` | Listar clientes |
| GET | `/api/customers/:id` | Obtener por ID |
| GET | `/api/customers/phone/:phone` | Buscar por telefono (ILIKE) |
| POST | `/api/customers` | Crear cliente |
| PUT | `/api/customers/:id` | Actualizar cliente completo |
| PATCH | `/api/customers/:id` | Actualizar cliente parcialmente |
| DELETE | `/api/customers/:id` | Eliminar cliente |

### Domiciliarios (`/api/couriers`)
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/couriers` | No | Listar domiciliarios |
| GET | `/api/couriers/available` | No | Listar disponibles |
| GET | `/api/couriers/filter` | No | Filtrar por nombre, telefono, placa |
| GET | `/api/couriers/:id` | No | Obtener por ID |
| POST | `/api/couriers` | **Si** | Crear domiciliario |
| PUT | `/api/couriers/:id` | **Si** | Actualizar completo |
| PATCH | `/api/couriers/:id` | **Si** | Actualizar parcialmente |
| DELETE | `/api/couriers/:id` | **Si** | Eliminar domiciliario |

### Asignacion de Pedidos (`/api/assign-orders`)
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/assign-orders/courier/:courierId` | No | Pedidos asignados a un repartidor |
| GET | `/api/assign-orders/order/:orderId` | No | Quien lleva un pedido |
| GET | `/api/assign-orders` | **Si** | Listar todas las asignaciones |
| POST | `/api/assign-orders` | **Si** | Asignar pedido a domiciliario |
| PUT | `/api/assign-orders/:orderId` | **Si** | Reasignar pedido |
| DELETE | `/api/assign-orders/:orderId` | **Si** | Eliminar asignacion |

### Direcciones (`/api/addresses`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/addresses` | Listar direcciones |
| GET | `/api/addresses/:id` | Obtener por ID |
| GET | `/api/addresses/customer/:customerId` | Direcciones por cliente |
| GET | `/api/addresses/customer/:customerId/primary` | Direccion principal del cliente |
| POST | `/api/addresses` | Crear direccion |
| PUT | `/api/addresses/:id` | Actualizar completa |
| PATCH | `/api/addresses/:id` | Actualizar parcialmente |
| DELETE | `/api/addresses/:id` | Eliminar direccion |

### Preferencias de Clientes (`/api/customer-preferences`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/customer-preferences` | Listar preferencias |
| GET | `/api/customer-preferences/:id` | Obtener por ID |
| GET | `/api/customer-preferences/customer/:customerId` | Preferencias por cliente |
| POST | `/api/customer-preferences` | Crear preferencia |
| PUT | `/api/customer-preferences/:id` | Actualizar preferencia |
| DELETE | `/api/customer-preferences/:id` | Eliminar preferencia |

### Pagos (`/api/payments`)
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | `/api/payments` | No | Registrar pago (usado por el bot) |
| PATCH | `/api/payments/order/:order_id/receipt` | No | Actualizar comprobante de pago |
| GET | `/api/payments` | **Si** | Listar todos los pagos (paginacion: ?limit=&offset=) |
| GET | `/api/payments/status/:status` | **Si** | Pagos por estado (pending, verified, rejected) |
| GET | `/api/payments/order/:order_id` | **Si** | Obtener pago por ID de orden |
| PATCH | `/api/payments/order/:order_id/verify` | **Si** | Verificar o rechazar un pago |
| PATCH | `/api/payments/order/:order_id/amount` | **Si** | Actualizar monto reportado |

### Health Check
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/health` | Estado del servidor |

---

## Instalacion y Ejecucion

### 1. Clonar el repositorio
```bash
git clone https://github.com/mookie34/yum-now-api
cd yum-now-api
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```
Editar `.env` con las credenciales de PostgreSQL.

### 3. Instalar dependencias
```bash
npm install
```

### 4. Verificar conexion a la base de datos
```bash
node test/test-connection.js
```

### 5. Ejecutar el servidor

**Desarrollo (con hot reload):**
```bash
npm run dev
```

**Produccion:**
```bash
npm start
```

La API estara disponible en: `http://localhost:3000`

### 6. Ejecutar tests
```bash
npm test
```

---

## Variables de Entorno

| Variable | Descripcion | Valor por defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Entorno de ejecucion | `development` |
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `domicilios_db` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contrasena de PostgreSQL | - |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | - |
| `ADMIN_USERNAME` | Usuario del panel de administracion | `admin` |
| `ADMIN_PASSWORD` | Contrasena del panel de administracion | - |
| `TWILIO_ACCOUNT_SID` | SID de Twilio (no implementado aun) | - |
| `TWILIO_AUTH_TOKEN` | Token de Twilio (no implementado aun) | - |
| `TWILIO_WHATSAPP_NUMBER` | Numero WhatsApp de Twilio | - |
| `FRONTEND_URL` | URL del frontend Angular | `http://localhost:4200` |
| `LOG_LEVEL` | Nivel de logging | `info` |

---

## Middlewares de Seguridad

- **Helmet**: Proteccion de headers HTTP contra ataques comunes
- **CORS**: Control de origenes permitidos segun `FRONTEND_URL`
- **Rate Limiting**: 100 requests por IP cada 15 minutos en rutas `/api/*`
- **JWT authenticate**: Verifica token Bearer en endpoints de administracion
- **Body Parsing**: JSON y URL-encoded via Express built-in
- **Sanitizacion de inputs**: Limpieza de caracteres especiales en mensajes de error y validacion de parametros de paginacion (`utils/sanitize.js`)

---

## Roadmap

### MVP
- Menu dinamico desde app web
- Pedido via WhatsApp
- Validacion manual de pagos
- Asignacion de domiciliarios
- Control de pagos en efectivo y conciliacion

### Futuras mejoras
- Integracion con APIs bancarias (Nequi, Bancolombia)
- Tracking en mapa en tiempo real
- Asignacion automatica de domiciliarios
- Metricas y dashboards avanzados
- Refresh tokens y lista negra de tokens expirados
- Tabla de usuarios para multiples administradores con roles

---

## Autor

**Santiago Mazo Padierna**
Proyecto: *Yum Now - Plataforma Domicilios por WhatsApp*
Backend + Frontend + Bot WhatsApp + DB PostgreSQL
