# Analisis de Debilidades y Plan de Mejoras - Yum Now API

## Resumen Ejecutivo

Este documento identifica las debilidades tecnicas del proyecto Yum Now API organizadas por severidad (critica, alta, media, baja) con propuestas concretas de mejora para cada una.

---

## SEVERIDAD CRITICA

### 1. Sin Autenticacion ni Autorizacion

**Problema:** Todos los endpoints de la API son publicos. Cualquier persona con acceso a la URL puede crear, modificar o eliminar cualquier recurso (clientes, pedidos, productos, etc.).

**Archivos afectados:** Todos los archivos en `routes/`, `controllers/`

**Evidencia:** No existe ningun middleware de autenticacion. El `.env.example` tiene un placeholder `JWT_SECRET` pero no se usa en ninguna parte del codigo.

**Mejora propuesta:**
- Implementar autenticacion con JWT (jsonwebtoken)
- Crear middleware `authMiddleware.js` que valide tokens en cada request
- Implementar roles (admin, courier, customer) con RBAC
- Proteger todos los endpoints bajo `/api/*` excepto login/registro
- Agregar tabla `users` con credenciales hasheadas (bcrypt)

---

### 2. Controladores sin capa de servicio (assignOrders, customerPreferences)

**Problema:** Los controladores `assignOrdersController.js` y `customerPreferencesController.js` ejecutan queries SQL directamente contra la base de datos, saltandose las capas de Service y Repository. Esto rompe la arquitectura en capas del proyecto.

**Archivos afectados:**
- `controllers/assignOrdersController.js`
- `controllers/customerPreferencesController.js`

**Evidencia:** Ambos controladores importan `pool` directamente de `db.js` y ejecutan `pool.query()` sin pasar por ningun servicio ni repositorio.

**Mejora propuesta:**
- Crear `services/assignOrdersService.js` y `repositories/assignOrdersRepository.js`
- Crear `services/customerPreferencesService.js` y `repositories/customerPreferencesRepository.js`
- Mover toda la logica SQL a los repositorios
- Agregar validaciones de negocio en los servicios (ej: validar que el courier este disponible antes de asignar)
- Los controladores solo deben manejar req/res

---

### 3. Sin transacciones en operaciones multi-paso

**Problema:** Operaciones que involucran multiples queries no usan transacciones de base de datos. Si una query falla a mitad de la operacion, la base de datos queda en un estado inconsistente.

**Ejemplos criticos:**
- Crear un pedido y agregar items: si la creacion del pedido tiene exito pero los items fallan, queda un pedido vacio
- Cambiar la direccion principal: se desmarca la anterior y se marca la nueva. Si falla la segunda operacion, el cliente queda sin direccion principal
- Asignar un pedido a un courier: deberia marcar al courier como no disponible en la misma transaccion

**Archivos afectados:** Todos los archivos en `repositories/`

**Mejora propuesta:**
- Implementar soporte para transacciones usando `pool.connect()` y `client.query('BEGIN')`, `COMMIT`, `ROLLBACK`
- Crear un helper `withTransaction(callback)` reutilizable
- Aplicar transacciones en todas las operaciones que involucren mas de una query

---

## SEVERIDAD ALTA

### 4. CORS permite todos los origenes

**Problema:** La configuracion de CORS usa `cors()` sin opciones, lo que permite requests desde cualquier origen. En produccion esto es un riesgo de seguridad.

**Archivo afectado:** `app.js`

**Mejora propuesta:**
```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
```

---

### 5. Sin logging estructurado

**Problema:** El proyecto usa `console.log` y `console.error` para logging. No hay formato estandar, no hay niveles de log configurables, y no hay persistencia de logs.

**Archivos afectados:** `server.js`, `db.js`, todos los controllers

**Mejora propuesta:**
- Integrar una libreria de logging como `winston` o `pino`
- Configurar niveles de log (error, warn, info, debug) segun `LOG_LEVEL` del .env
- Agregar formato JSON para logs en produccion (facilita integracion con herramientas como ELK, Datadog)
- Incluir contexto en cada log (request ID, usuario, timestamp)

---

### 6. Sin validacion de entrada a nivel de middleware

**Problema:** La validacion de datos se hace dentro de los servicios con metodos personalizados. No hay validacion en la capa de middleware/controlador antes de que el request llegue al servicio. Esto significa que datos invalidos recorren varias capas antes de ser rechazados.

**Archivos afectados:** Todos los archivos en `services/`, `controllers/`

**Mejora propuesta:**
- Integrar una libreria de validacion como `joi`, `zod` o `express-validator`
- Crear schemas de validacion para cada endpoint
- Aplicar validacion como middleware en las rutas antes del controlador
- Mantener las validaciones de negocio en los servicios (ej: "el cliente existe", "el metodo de pago esta activo")

---

### 7. Queries SQL vulnerables a inconsistencias

**Problema:** Aunque se usan consultas parametrizadas (protegidas contra SQL injection), la construccion de queries dinamicas en los repositorios es fragil y propensa a errores. Filtros dinamicos se construyen concatenando condiciones manualmente.

**Archivos afectados:** `repositories/productsRepository.js`, `repositories/couriersRepository.js`

**Ejemplo problematico:**
```javascript
// Construccion manual de WHERE clauses con indices dinamicos
if (filters.name) {
  conditions.push(`name ILIKE $${paramIndex++}`);
  values.push(`%${filters.name}%`);
}
```

**Mejora propuesta:**
- Considerar un query builder como `knex.js` para queries dinamicas
- O crear un helper reutilizable para construir filtros de forma segura
- Estandarizar el patron de construccion de queries en todos los repositorios

---

## SEVERIDAD MEDIA

### 8. Sin paginacion en endpoints de listado

**Problema:** Los endpoints GET que retornan listas (productos, pedidos, clientes, etc.) retornan TODOS los registros de la base de datos. A medida que el sistema crezca, esto causara problemas de rendimiento y consumo de memoria.

**Archivos afectados:** Todos los repositorios y controllers con metodos `getAll*`

**Mejora propuesta:**
- Implementar paginacion con `LIMIT` y `OFFSET` en todas las queries de listado
- Aceptar parametros `page` y `limit` en los query params
- Retornar metadata de paginacion: `{ data: [...], total: N, page: 1, limit: 20, totalPages: X }`
- Establecer un limite maximo por defecto (ej: 100 registros)

---

### 9. Inconsistencia en nombres de archivos

**Problema:** Los archivos no siguen una convencion de nombres consistente.

**Evidencia:**
- `CustomerService.js` (PascalCase) vs `productService.js` (camelCase)
- `ordersItemsService.js` (plural+plural) vs `addressesService.js` (plural)
- `customerRepository.js` (singular) vs `productsRepository.js` (plural)

**Mejora propuesta:**
- Definir y aplicar una convencion unica: `camelCase` para todos los archivos
- Usar patron consistente: `{recurso}Service.js`, `{recurso}Repository.js`, `{recurso}Controller.js`
- Ejemplo: `customerService.js`, `customerRepository.js`, `customerController.js`

---

### 10. Sin documentacion de API (Swagger/OpenAPI)

**Problema:** No existe documentacion interactiva de la API. Los consumidores del API (frontend Angular, bot WhatsApp) deben leer el codigo o el README para entender los endpoints.

**Mejora propuesta:**
- Integrar `swagger-jsdoc` y `swagger-ui-express`
- Documentar cada endpoint con: parametros, body esperado, respuestas posibles, codigos de error
- Servir documentacion en `/api-docs`

---

### 11. Tests acoplados a base de datos real

**Problema:** Los tests de integracion ejecutan queries reales contra la base de datos. No hay mocking ni base de datos de test separada. Esto hace que los tests sean lentos, no reproducibles y potencialmente destructivos.

**Archivos afectados:** Todos los archivos en `test/`

**Mejora propuesta:**
- Configurar una base de datos de test separada (`domicilios_db_test`)
- Agregar scripts de seed/teardown para datos de prueba
- Considerar mocking del pool de base de datos para tests unitarios puros
- Separar tests unitarios (con mocks) de tests de integracion (con DB real)

---

### 12. Sin manejo de variables de entorno obligatorias al iniciar

**Problema:** El archivo `db.js` valida las variables de base de datos, pero otras variables criticas no se validan al inicio. Si falta una variable, el error aparecera en tiempo de ejecucion cuando se intente usar.

**Mejora propuesta:**
- Crear un archivo `config/index.js` que valide TODAS las variables de entorno requeridas al iniciar
- Fallar rapido con un mensaje claro si falta alguna variable critica
- Usar un schema de validacion (ej: `joi` o `zod`) para el objeto de configuracion

---

## SEVERIDAD BAJA

### 13. Sin compresion de respuestas HTTP

**Problema:** Las respuestas no estan comprimidas. Para listados grandes de datos, esto aumenta el consumo de ancho de banda innecesariamente.

**Mejora propuesta:**
- Agregar middleware `compression` para respuestas gzip/deflate
- `npm install compression` y `app.use(compression())`

---

### 14. Sin cache de respuestas

**Problema:** Endpoints que retornan datos que cambian con poca frecuencia (productos del menu, metodos de pago, estados de pedido) ejecutan queries a la DB en cada request.

**Mejora propuesta:**
- Implementar cache en memoria para datos semi-estaticos (ej: `node-cache`)
- Agregar headers de cache HTTP (`Cache-Control`, `ETag`)
- Para produccion, considerar Redis como capa de cache

---

### 15. Sin migraciones de base de datos

**Problema:** No hay un sistema de migraciones para el esquema de base de datos. Los cambios al esquema deben hacerse manualmente, lo que dificulta la reproducibilidad y el trabajo en equipo.

**Mejora propuesta:**
- Integrar una herramienta de migraciones como `knex` (que incluye migraciones) o `db-migrate`
- Crear migraciones para el esquema actual como baseline
- Agregar scripts npm para ejecutar migraciones (`npm run migrate`, `npm run migrate:rollback`)

---

### 16. Sin health check profundo

**Problema:** El endpoint `/health` solo retorna `{ status: 'OK' }` sin verificar el estado real de las dependencias (base de datos, servicios externos).

**Mejora propuesta:**
```javascript
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'connected', uptime: process.uptime() });
  } catch (error) {
    res.status(503).json({ status: 'ERROR', database: 'disconnected' });
  }
});
```

---

## Plan de Accion Sugerido (Priorizado)

| Prioridad | Tarea | Esfuerzo estimado |
|-----------|-------|-------------------|
| 1 | Implementar autenticacion JWT + RBAC | Alto |
| 2 | Crear service/repository para assignOrders y customerPreferences | Medio |
| 3 | Implementar transacciones en operaciones multi-paso | Medio |
| 4 | Configurar CORS restrictivo | Bajo |
| 5 | Agregar validacion de entrada con Joi/Zod | Medio |
| 6 | Implementar paginacion en listados | Medio |
| 7 | Integrar logging estructurado (Winston/Pino) | Bajo |
| 8 | Estandarizar nombres de archivos | Bajo |
| 9 | Agregar Swagger/OpenAPI | Medio |
| 10 | Configurar base de datos de test separada | Medio |
| 11 | Agregar sistema de migraciones | Medio |
| 12 | Implementar cache y compresion | Bajo |
| 13 | Mejorar health check | Bajo |
| 14 | Validar todas las env vars al inicio | Bajo |
