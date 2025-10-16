# Plataforma de Domicilios por WhatsApp 🚴‍♂️💬

## 🧠 Descripción
Aplicación que permite gestionar pedidos de domicilios realizados por WhatsApp.  
Incluye un **bot**, una **API REST en Node.js**, una **base de datos PostgreSQL**,  
y una **aplicación web en Angular** para administradores y domiciliarios.

---

## ✨ Características Principales

- ✅ **API REST completa** con endpoints para todos los recursos
- ✅ **Base de datos PostgreSQL** con pool de conexiones
- ✅ **Tests automatizados** con Jest y Supertest
- ✅ **Seguridad mejorada** con Helmet y Rate Limiting
- ✅ **Manejo de errores** centralizado y personalizado
- ✅ **Hot reload** en desarrollo con Nodemon
- ✅ **Health check** endpoint para monitoreo
- ✅ **Graceful shutdown** para cerrar conexiones correctamente

---

## ⚡ Tecnologías principales

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5.1.0
- **Base de datos:** PostgreSQL (pg 8.16.3)
- **Seguridad:** Helmet, CORS, Express Rate Limit
- **Variables de entorno:** dotenv

### Testing
- **Framework:** Jest 30.1.3
- **HTTP Testing:** Supertest 7.1.4

### Desarrollo
- **Hot Reload:** Nodemon 3.1.10

---

## 🚀 Instalación y ejecución

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/mookie34/yum-now-api
cd yum-now-api
```

### 2️⃣ Crear el archivo de entorno
Copia el archivo de ejemplo y completa tus variables:
```bash
cp .env.example .env
```
Luego edita el archivo `.env` con tus credenciales de PostgreSQL.

---

### 3️⃣ Instalar dependencias
```bash
npm install
```

---

### 4️⃣ Ejecutar el servidor

**Modo desarrollo (con nodemon):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

Por defecto la API se ejecutará en:  
👉 **http://localhost:3000**

### 5️⃣ Ejecutar las pruebas
```bash
npm test
```

---

## 🧩 Estructura del proyecto

```
yum-now-api/
├─ controllers/          # Controladores de las rutas
│   ├─ addressesController.js
│   ├─ assignOrdersController.js
│   ├─ couriersController.js
│   ├─ customerController.js
│   ├─ customerPreferencesController.js
│   ├─ orderItemsController.js
│   ├─ ordersController.js
│   └─ productsController.js
│
├─ routes/               # Definición de rutas de la API
│   ├─ addresses.js
│   ├─ assignOrders.js
│   ├─ couriers.js
│   ├─ customerPreferences.js
│   ├─ customers.js
│   ├─ orderItems.js
│   ├─ orders.js
│   └─ products.js
│
├─ services/             # Lógica de negocio
│   ├─ addressesService.js
│   ├─ CustomerService.js
│   └─ productService.js
│
├─ repositories/         # Acceso a datos (capa de persistencia)
│   ├─ addressesRepository.js
│   ├─ customerRepository.js
│   └─ productsRepository.js
│
├─ test/                 # Pruebas unitarias y de integración
│   ├─ addresses.test.js
│   ├─ assignOrders.test.js
│   ├─ couriers.test.js
│   ├─ customerPreferences.test.js
│   ├─ customers.test.js
│   ├─ orderItems.test.js
│   ├─ orders.test.js
│   ├─ products.test.js
│   └─ setupTests.js
│
├─ errors/               # Manejo de errores personalizados
│   └─ customErrors.js
│
├─ app.js                # Configuración de Express y middlewares
├─ server.js             # Punto de entrada del servidor
├─ db.js                 # Configuración de conexión a PostgreSQL
├─ test-connection.js    # Script para probar la conexión a la DB
├─ .env.example          # Plantilla de variables de entorno
├─ .gitignore            # Archivos ignorados por Git
└─ package.json          # Dependencias y scripts del proyecto
```

---

## 📡 Endpoints de la API

La API REST incluye los siguientes endpoints:

| Endpoint | Descripción |
|----------|-------------|
| `GET /health` | Health check del servidor |
| `/api/products` | Gestión de productos del menú |
| `/api/orders` | Gestión de pedidos |
| `/api/order-items` | Ítems de los pedidos |
| `/api/customers` | Gestión de clientes |
| `/api/couriers` | Gestión de domiciliarios |
| `/api/assign-orders` | Asignación de pedidos a domiciliarios |
| `/api/addresses` | Direcciones de entrega |
| `/api/customer-preferences` | Preferencias de clientes |

---

## 🏛️ Arquitectura del Proyecto

El proyecto sigue una **arquitectura en capas** para mantener el código organizado y escalable:

1. **Routes** (`/routes`): Definen los endpoints de la API y enrutan las peticiones
2. **Controllers** (`/controllers`): Manejan las peticiones HTTP y validan datos
3. **Services** (`/services`): Contienen la lógica de negocio
4. **Repositories** (`/repositories`): Gestionan el acceso a la base de datos
5. **Errors** (`/errors`): Manejo centralizado de errores personalizados

### Middlewares de Seguridad

- **Helmet**: Protección de headers HTTP
- **CORS**: Configuración de orígenes permitidos
- **Rate Limiting**: Protección contra ataques de fuerza bruta (100 req/15min)

---

## 🔐 Variables de entorno principales

Crea un archivo `.env` basado en `.env.example` con las siguientes variables:

| Variable | Descripción |
|-----------|-------------|
| `PORT` | Puerto donde corre el servidor (por defecto 3000) |
| `DB_HOST` | Host de PostgreSQL |
| `DB_PORT` | Puerto de PostgreSQL (por defecto 5432) |
| `DB_USER` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `DB_NAME` | Nombre de la base de datos |
| `NODE_ENV` | Entorno de ejecución (development, production) |

---

## 💡 Roadmap del MVP
- Menú dinámico desde app web.  
- Pedido vía WhatsApp.  
- Validación manual de pagos.  
- Asignación de domiciliarios.  
- Control de pagos en efectivo y conciliación.

---

## ✨ Futuras mejoras
- Integración automática con APIs bancarias (Nequi, Bancolombia).  
- Tracking en mapa en tiempo real.  
- Asignación automática de domiciliarios.  
- Métricas y dashboards avanzados.

---

## 🧑‍💻 Autor
**Santiago Mazo Padierna**  
Proyecto: *Plataforma Domicilios por WhatsApp*  
Backend + Frontend + Bot WhatsApp + DB PostgreSQL
