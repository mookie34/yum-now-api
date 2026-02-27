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
- **Tests de integracion** con Jest y Supertest (8 archivos de test)
- **Seguridad** con Helmet, CORS y Rate Limiting (100 req/15min)
- **Manejo de errores** centralizado con clases personalizadas (ValidationError, NotFoundError, DuplicateError, BusinessRuleError)
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
  400 ValidationError | 404 NotFoundError | 409 DuplicateError | 500 Error generico
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
├── test-connection.js        # Script para verificar conexion a la DB
│
├── routes/                   # Definicion de endpoints HTTP
│   ├── addresses.js
│   ├── assignOrders.js
│   ├── couriers.js
│   ├── customerPreferences.js
│   ├── customers.js
│   ├── orderItems.js
│   ├── orders.js
│   └── products.js
│
├── controllers/              # Manejo de requests/responses HTTP
│   ├── addressesController.js
│   ├── assignOrdersController.js
│   ├── couriersController.js
│   ├── customerController.js
│   ├── customerPreferencesController.js
│   ├── orderItemsController.js
│   ├── ordersController.js
│   └── productsController.js
│
├── services/                 # Logica de negocio y validacion
│   ├── addressesService.js
│   ├── couriersService.js
│   ├── CustomerService.js
│   ├── ordersItemsService.js
│   ├── ordersService.js
│   └── productService.js
│
├── repositories/             # Capa de persistencia (queries SQL)
│   ├── addressesRepository.js
│   ├── couriersRepository.js
│   ├── customerRepository.js
│   ├── orderItemsRepository.js
│   ├── ordersRepository.js
│   └── productsRepository.js
│
├── errors/                   # Clases de error personalizadas
│   └── customErrors.js
│
├── test/                     # Tests de integracion (Jest + Supertest)
│   ├── setupTests.js
│   ├── addresses.test.js
│   ├── assignOrders.test.js
│   ├── couriers.test.js
│   ├── customerPreferences.test.js
│   ├── customers.test.js
│   ├── orderItems.test.js
│   ├── orders.test.js
│   └── products.test.js
│
├── .env.example              # Plantilla de variables de entorno
├── .gitignore
└── package.json
```

---

## Endpoints de la API

### Productos (`/api/products`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/products` | Listar productos (soporta filtros por nombre, precio, activo) |
| GET | `/api/products/:id` | Obtener producto por ID |
| GET | `/api/products/search` | Buscar productos |
| POST | `/api/products` | Crear producto |
| PUT | `/api/products/:id` | Actualizar producto completo |
| PATCH | `/api/products/:id` | Actualizar producto parcialmente |
| DELETE | `/api/products/:id/soft` | Soft delete (desactivar) |
| DELETE | `/api/products/:id/hard` | Hard delete (eliminar permanentemente) |

### Pedidos (`/api/orders`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/orders` | Listar todos los pedidos |
| GET | `/api/orders/:id` | Obtener pedido por ID |
| GET | `/api/orders/customer/:customerId` | Pedidos por cliente |
| GET | `/api/orders/status/:status` | Pedidos por estado |
| GET | `/api/orders/count/today` | Contar pedidos del dia |
| POST | `/api/orders` | Crear pedido |
| PATCH | `/api/orders/:id` | Actualizar pedido parcialmente |
| PATCH | `/api/orders/:id/status` | Cambiar estado del pedido |
| PATCH | `/api/orders/:id/total` | Recalcular total del pedido |
| DELETE | `/api/orders/:id` | Eliminar pedido |

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
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/couriers` | Listar domiciliarios |
| GET | `/api/couriers/available` | Listar disponibles |
| GET | `/api/couriers/filter` | Filtrar por nombre, telefono, placa |
| GET | `/api/couriers/:id` | Obtener por ID |
| POST | `/api/couriers` | Crear domiciliario |
| PUT | `/api/couriers/:id` | Actualizar completo |
| PATCH | `/api/couriers/:id` | Actualizar parcialmente |
| DELETE | `/api/couriers/:id` | Eliminar domiciliario |

### Asignacion de Pedidos (`/api/assign-orders`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/assign-orders` | Listar asignaciones |
| GET | `/api/assign-orders/:id` | Obtener asignacion por ID |
| GET | `/api/assign-orders/order/:orderId` | Asignacion por pedido |
| GET | `/api/assign-orders/courier/:courierId` | Asignaciones por domiciliario |
| POST | `/api/assign-orders` | Asignar pedido a domiciliario |
| PUT | `/api/assign-orders/:id` | Reasignar pedido |
| DELETE | `/api/assign-orders/:id` | Eliminar asignacion |

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
node test-connection.js
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
| `JWT_SECRET` | Secret para JWT (no implementado aun) | - |
| `TWILIO_ACCOUNT_SID` | SID de Twilio (no implementado aun) | - |
| `TWILIO_AUTH_TOKEN` | Token de Twilio (no implementado aun) | - |
| `TWILIO_WHATSAPP_NUMBER` | Numero WhatsApp de Twilio | - |
| `FRONTEND_URL` | URL del frontend Angular | `http://localhost:4200` |
| `LOG_LEVEL` | Nivel de logging | `info` |

---

## Middlewares de Seguridad

- **Helmet**: Proteccion de headers HTTP contra ataques comunes
- **CORS**: Control de origenes permitidos (actualmente permite todos)
- **Rate Limiting**: 100 requests por IP cada 15 minutos en rutas `/api/*`
- **Body Parsing**: JSON y URL-encoded via Express built-in

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
- Autenticacion y autorizacion con JWT

---

## Autor

**Santiago Mazo Padierna**
Proyecto: *Yum Now - Plataforma Domicilios por WhatsApp*
Backend + Frontend + Bot WhatsApp + DB PostgreSQL
