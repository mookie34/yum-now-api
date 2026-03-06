# Code Review – Yum Now API

**Date:** 2026-03-06
**Reviewed by:** code-reviewer agent
**Scope:** Full project — all `.js` files excluding `node_modules`

---

## Summary

The project has a solid and consistent layered architecture. Controllers are thin, services contain business logic, and repositories are properly isolated. Parameterized queries are used throughout with field whitelists in `updatePartial` methods — no SQL injection risk. Test coverage is present for all modules and follows Arrange/Act/Assert.

Since the last review (2026-03-05), the following issues were resolved: the `ordersService.js` direct `db.query()` calls were moved to the repository, the SQL injection risk in `addressesRepository` and `customerRepository` was fixed with whitelists, the `DuplicateError → 409` mapping in `addressesController.js` was corrected, the `ValidateAddressData` PascalCase naming was fixed, the `assignOrdersController` was updated to use `message` instead of `mensaje`, and the `couriersService` `validateCourierData` was made synchronous.

The remaining issues are concentrated in: one incorrect HTTP status code, a Spanish JSON key, a cross-platform filename bug, semantically wrong error types, and widespread Spanish inline comments.

---

## Critical Issues 🔴

### 1. `DuplicateError` mapped to HTTP 400 instead of 409
**File:** `controllers/assignOrdersController.js:23`

CLAUDE.md explicitly specifies `DuplicateError → 409`. This is the only controller in the project that still maps it to 400.

```js
// ❌ Current
if (err instanceof DuplicateError) {
  return res.status(400).json({ error: err.message });
}

// ✅ Fix
if (err instanceof DuplicateError) {
  return res.status(409).json({ error: err.message });
}
```

---

### 2. Spanish JSON key in API response
**File:** `controllers/customerPreferencesController.js:7, 64`

JSON response keys must be in English. `preferencia` is Spanish.

```js
// ❌ Current (line 7)
res.status(201).json({ message: "Preferencia creada exitosamente", preferencia: preference });

// ✅ Fix
res.status(201).json({ message: "Preferencia creada exitosamente", preference: preference });
```

Same fix at line 64:
```js
// ❌
res.status(200).json({ message: "Preferencia actualizada exitosamente.", preferencia: preference });
// ✅
res.status(200).json({ message: "Preferencia actualizada exitosamente.", preference: preference });
```

---

### 3. `CustomerService.js` — PascalCase filename causes cross-platform failure
**File:** `services/CustomerService.js`

CLAUDE.md requires `kebab-case` file names. More critically, the file is required as `'../services/customerService'` in both `controllers/customerController.js:1` and `test/customers.test.js:5`. This resolves on Windows (case-insensitive filesystem) but **fails on Linux** — breaking Docker containers, CI pipelines, and production servers.

```
Rename: services/CustomerService.js  →  services/customer-service.js
Update require paths in:
  - controllers/customerController.js:1
  - test/customers.test.js:1,5
```

---

### 4. `NotFoundError` condition throws `ValidationError` in `ordersService`
**File:** `services/ordersService.js:22–24, 33–35`

When a customer or address does not exist in the DB, a `ValidationError` (→ 400) is thrown. The correct type is `NotFoundError` (→ 404). A record not being found is not a validation error.

```js
// ❌ Current — customer not found, but thrown as ValidationError (400)
customer = await customerRepository.getById(customer_id);
if (!customer) {
  throw new ValidationError("Cliente no encontrado");
}

// ✅ Fix
customer = await customerRepository.getById(customer_id);
if (!customer) {
  throw new NotFoundError("Cliente no encontrado");
}
```

Same issue at line 33–35 for address not found.

> **Note:** Tests at `test/orders.test.js:82,100` currently expect `400` for these cases and must be updated alongside this fix.

---

## Warnings 🟡

### 5. Spanish inline comments throughout service and route files

CLAUDE.md mandates **all** comments be in English. Spanish comments are widespread:

**`services/ordersService.js`** (lines 15, 28, 49, 56, 68):
```js
// Validar customer_id                                       ← ❌
// Validar address_id                                        ← ❌
// Validar total (solo en actualizaciones, no en create)     ← ❌
// Validar payment_method_id                                 ← ❌
// Validar status_id                                         ← ❌
```

**`services/assignOrdersService.js`** — most comments are Spanish (lines 12, 33, 42, 61, 66, 72, 80, 88, 115, 125, 145, 171, 209, and more):
```js
// Validar ID numérico           ← ❌
// Verificar que la orden existe  ← ❌
// Crear la asignación            ← ❌
```

**`services/couriersService.js`** (lines 9, 21, 35, 46, 56):
```js
// Validar name      ← ❌
// Validar phone     ← ❌
// Validar vehicle   ← ❌
```

**`services/productService.js`** (lines 43, 76, 84, 92, 104, 113, 157):
```js
// Verificar dígitos enteros (máximo 8)  ← ❌
// Validar nombre si se proporciona      ← ❌
// Default si no se puede convertir      ← ❌
```

**`services/CustomerService.js`** (line 4):
```js
// Clase del servicio   ← ❌
```

**All route files** — Spanish operation descriptions:
```js
// Crear un cliente              ← ❌ (routes/customers.js)
// Listar clientes               ← ❌
// Crear un producto             ← ❌ (routes/products.js)
// actualizar una dirección...   ← ❌ (routes/addresses.js:15)
// ← NUEVA (opcional)            ← ❌ (routes/orders.js:7)
```

---

### 6. Business logic inside controller (`getCouriersByFilter`)
**File:** `controllers/couriersController.js:57–61`

The controller checks `couriers.length === 0` and returns 404 directly. Business rules belong in the service layer.

```js
// ❌ Current — business logic in controller
const couriers = await couriersService.getCouriersByFilter(filters);
if (couriers.length === 0) {
  return res.status(404).json({ message: "No se encontraron domiciliarios..." });
}

// ✅ Fix — move to couriersService.getCouriersByFilter
const couriers = await couriersRepository.getForFilter(filters);
if (couriers.length === 0) {
  throw new NotFoundError("No se encontraron domiciliarios con esos filtros");
}
return couriers;
```

---

### 7. Global error handler can leak internal error messages
**File:** `app.js:73–79`

The fallback `app.use((err, req, res, next) => ...)` handler exposes `err.message` for all unhandled errors. If any error bypasses the controller's `try/catch`, sensitive DB or system error details are returned to clients.

Additionally, none of the custom error classes set a `status` property, making `err.status` always `undefined` — so the fallback is always 500, but `err.message` is still exposed.

```js
// ❌ Current
res.status(err.status || 500).json({
  error: err.message || 'Error interno del servidor'
});

// ✅ Fix
const statusCode = err.status || 500;
const message = statusCode === 500 ? 'Error interno del servidor' : err.message;
res.status(statusCode).json({ error: message });
```

---

### 8. Validation message mismatch in `couriersService`
**File:** `services/couriersService.js:32`

The error message says "máximo 15 caracteres" but the actual limit enforced is 20 characters.

```js
// ❌ Current — message says 15, check is > 20
if (phone && phone.length > 20) {
  errors.push("El teléfono no puede exceder los 15 caracteres");
}

// ✅ Fix
errors.push("El teléfono no puede exceder los 20 caracteres");
```

---

### 9. File naming convention — camelCase instead of kebab-case
**Files:** All controllers, services, repositories, and routes

CLAUDE.md requires `kebab-case` for file names (example given: `order-service.js`). The entire codebase uses camelCase consistently, which is itself a systemic CLAUDE.md violation. The `CustomerService.js` case is Critical (cross-platform failure). The rest should be migrated over time.

Key targets:
```
services/productService.js         → product-service.js
services/ordersItemsService.js     → orders-items-service.js
routes/orderItems.js               → order-items.js
routes/assignOrders.js             → assign-orders.js
routes/customerPreferences.js      → customer-preferences.js
controllers/ordersController.js    → orders-controller.js
```

---

### 10. Typo in variable name: `addressessRouter`
**File:** `app.js:13`

```js
// ❌ Typo — double 's'
const addressessRouter = require('./routes/addresses');
app.use('/api/addresses', addressessRouter);

// ✅ Fix
const addressesRouter = require('./routes/addresses');
app.use('/api/addresses', addressesRouter);
```

---

### 11. API error response format inconsistent with CLAUDE.md spec
**Files:** All controllers

CLAUDE.md defines error responses as:
```json
{ "error": "ValidationError", "message": "El teléfono es obligatorio" }
```

All controllers return:
```json
{ "error": "El teléfono es obligatorio" }
```

The error type name is absent. This makes client-side error handling harder and contradicts the documented contract. Consider aligning with the spec as a followup.

---

## Suggestions 🟢

### 12. Redundant partial update for orders
**File:** `services/ordersService.js:162–188`, `routes/orders.js:13`

`updateOrderPartial` (used by `PATCH /:id`) only accepts `status_id`, making it functionally identical to `updateStatusOrder` (used by `PATCH /:id/status`). Consider removing one endpoint or expanding `updateOrderPartial` to support additional mutable fields to justify its existence.

---

### 13. `validateAddressData` has too many positional parameters
**File:** `services/addressesService.js:6`

The method takes 8 positional parameters, making call sites error-prone and hard to read:
```js
validateAddressData(customer_id, label, address_text, reference, latitude, longitude, is_primary, isPartial)
```

Consider accepting `(addressData, isPartial = false)` and destructuring internally:
```js
validateAddressData(addressData, isPartial = false) {
  const { customer_id, label, address_text, reference, latitude, longitude, is_primary } = addressData;
  ...
}
```

---

### 14. Dead code in `normalizeProductData`
**File:** `services/productService.js:145–147`

Inside `if (is_active !== undefined)`, the inner check `if (is_active === undefined || ...)` can never be true:

```js
// ❌ Inner check is dead code
if (is_active !== undefined) {
  if (is_active === undefined || is_active === null || is_active === '') { // always false
    normalized.is_active = false;
  }
```

Remove the dead inner condition.

---

### 15. Duplicated SQL JOIN query in `assignOrdersRepository.js`
**File:** `repositories/assignOrdersRepository.js:33–134`

The same large SELECT + JOIN block is copy-pasted across `getAll()`, `getByCourierId()`, and `getByOrderId()`. Extract to a private base query constant and append the `WHERE` clause per method.

---

### 16. Service-level unit tests are missing
**Files:** All `test/*.test.js`

Tests mock either the service layer or the repository layer and test through the HTTP controller. There are no isolated unit tests for service methods (e.g., validating edge cases in `validateOrderData`, `validateProductData`). Consider adding service-level tests for complex validation logic.

---

### 17. `test-connection.js` at project root — unclear purpose
**File:** `test-connection.js`

This file exists at the root but is not referenced in any test suite or npm script. If it's a one-time utility, remove it. If needed, add an npm script and document its purpose.

---

### 18. SSL `rejectUnauthorized: false` in production
**File:** `db.js:31`

Disabling SSL certificate verification in production exposes the DB connection to man-in-the-middle attacks. Provide a proper CA certificate:

```js
// ✅ Safer
poolConfig.ssl = {
  rejectUnauthorized: true,
  ca: process.env.DB_SSL_CA
};
```

---

## CLAUDE.md Violations

| Rule | Violation | File(s) | Severity |
|------|-----------|---------|----------|
| `DuplicateError → 409` | Mapped to 400 | `assignOrdersController.js:23` | 🔴 Critical |
| JSON keys in English | `preferencia` key in response | `customerPreferencesController.js:7,64` | 🔴 Critical |
| Files: kebab-case | `CustomerService.js` uses PascalCase; all others use camelCase | `services/CustomerService.js`, all other files | 🔴 Critical (filename) / 🟡 Warning (others) |
| `NotFoundError → 404` | Customer/address not found throws `ValidationError` (400) | `ordersService.js:22,33` | 🔴 Critical |
| Comments in English | Spanish comments throughout services and routes | `ordersService.js`, `assignOrdersService.js`, `couriersService.js`, `productService.js`, `CustomerService.js`, all route files | 🟡 Warning |
| No business logic in controllers | Array-length check for couriers in controller | `couriersController.js:57–61` | 🟡 Warning |

---

## Checklist Summary

| Area | Item | Status |
|------|------|--------|
| **Architecture** | Layered architecture respected | ✅ Pass |
| **Architecture** | Controllers contain no business logic | ⚠️ Partial — `couriersController.js:57` |
| **Architecture** | Services contain no Express objects | ✅ Pass |
| **Architecture** | Repositories contain only SQL | ✅ Pass |
| **Architecture** | Services use repositories (no direct `db.query`) | ✅ Pass |
| **Language** | Variable/function names in English | ✅ Pass |
| **Language** | File names in English | ✅ Pass |
| **Language** | Comments in English | ❌ Fail — Spanish comments in services and all route files |
| **Language** | JSON response keys in English | ❌ Fail — `preferencia` in `customerPreferencesController.js` |
| **Language** | User-facing error strings in Spanish | ✅ Pass |
| **Naming** | Variables/functions: camelCase | ✅ Pass |
| **Naming** | Files: kebab-case | ❌ Fail — `CustomerService.js` is PascalCase; all others camelCase |
| **Naming** | DB tables/columns: snake_case | ✅ Pass |
| **Error Handling** | Custom error classes used | ✅ Pass |
| **Error Handling** | `ValidationError → 400` | ✅ Pass |
| **Error Handling** | `NotFoundError → 404` | ❌ Fail — `ordersService.js` throws `ValidationError` for not-found |
| **Error Handling** | `DuplicateError → 409` | ❌ Fail — `assignOrdersController.js` maps to 400 |
| **Error Handling** | `BusinessRuleError → 422` | ✅ Pass (not triggered in current flow) |
| **Error Handling** | Repositories do not re-wrap errors | ✅ Pass |
| **Error Handling** | Services translate PG error codes | ✅ Pass |
| **Security** | Parameterized queries | ✅ Pass |
| **Security** | Dynamic field names use whitelist before SQL injection | ✅ Pass |
| **Security** | No exposed secrets | ✅ Pass |
| **Security** | Input validation on all endpoints | ✅ Pass |
| **Clean Code** | Functions do one thing | ✅ Pass |
| **Clean Code** | Functions under 20 lines | ⚠️ Partial — `validateProductData`, `validateAddressData` exceed 20 lines |
| **Clean Code** | Descriptive, intention-revealing names | ✅ Pass |
| **Clean Code** | No duplicated code | ⚠️ Partial — SQL JOIN duplicated 3× in `assignOrdersRepository.js` |
| **Clean Code** | Early returns preferred | ✅ Pass |
| **Testing** | Test coverage for endpoints | ✅ Pass |
| **Testing** | Tests follow Arrange/Act/Assert | ✅ Pass |
| **Testing** | Service-level unit tests | ⚠️ Partial — tests are primarily integration-level via controllers |
| **Performance** | No N+1 query problems | ✅ Pass |
| **Performance** | Pagination for large datasets | ⚠️ Partial — `getAllAddresses` has `limit` but no `offset` |
