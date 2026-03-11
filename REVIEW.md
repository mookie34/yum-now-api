# Code Review – Yum Now API

**Date:** 2026-03-11
**Reviewed by:** code-reviewer agent
**Scope:** Full project — all `.js` files excluding `node_modules`

---

## Summary

The project maintains a solid and consistent layered architecture. Controllers are thin, services contain business logic, repositories are properly isolated, and all SQL uses parameterized queries with field whitelists in `updatePartial` methods — no SQL injection risk. All 264 tests pass. Error handling is correct: `DuplicateError → 409`, `NotFoundError → 404`, `ValidationError → 400`. The `ordersService` now throws `NotFoundError` correctly for missing customer/address records.

Since the last review (2026-03-06), the following issues were resolved: `DuplicateError → 409` corrected in `assignOrdersController.js`, Spanish JSON key `preferencia` fixed in `customerPreferencesController.js`, `NotFoundError` used correctly in `ordersService.js`, `CustomerService.js` renamed to `customer-service.js`, business logic moved from `couriersController` to `couriersService`, global error handler hardened in `app.js`, phone validation message corrected in `couriersService.js`, and Spanish comments removed from all route files and most service files.

Remaining issues are concentrated in: SSL security in production, Spanish `console.error` messages across all controllers, Spanish JSDoc in `assignOrdersRepository.js`, a Spanish comment in `productsController.js`, Spanish messages in `test-connection.js`, an unreferenced root-level utility file, duplicated SQL JOIN blocks, and functions that exceed the 20-line limit.

---

## Critical Issues 🔴

### 1. `rejectUnauthorized: false` in production SSL config
**File:** `db.js:31`

Disabling SSL certificate verification in production exposes the database connection to man-in-the-middle attacks. The current code silently accepts any certificate, including forged ones.

```js
// ❌ Current
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

// ✅ Fix — use a proper CA certificate supplied via env variable
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA
  };
}
```

Add `DB_SSL_CA` to `.env.example` and provision the certificate in the deployment environment.

---

## Warnings 🟡

### 2. Spanish `console.error` messages throughout all controllers

CLAUDE.md mandates **all code in English**, including `console.log` and `console.error` calls. Every controller in the project uses Spanish log messages.

**`controllers/addressesController.js`** (lines 22, 36, 54, 72, 93, 114, 136, 154):
```js
// ❌
console.error('Error al crear la dirección:', error);
console.error('Error al obtener las direcciones:', error);
console.error('Error al obtener las direcciones del cliente:', error);
// ✅
console.error('Error creating address:', error);
console.error('Error fetching addresses:', error);
console.error('Error fetching addresses by customer:', error);
```

**`controllers/ordersController.js`** (lines 12, 32, 49, 63, 80, 97, 118, 140, 162, 178):
```js
// ❌
console.error("Error al crear la orden:", err.message);
console.error("Error al obtener las órdenes:", err.message);
// ✅
console.error("Error creating order:", err.message);
console.error("Error fetching orders:", err.message);
```

**`controllers/customerController.js`** (lines 12, 31, 41, 60, 78, 104, 130):
```js
// ❌
console.error('Error al crear cliente:', err.message);
console.error('Error al buscar cliente: ', err.message);
// ✅
console.error('Error creating customer:', err.message);
console.error('Error fetching customer by phone:', err.message);
```

**`controllers/productsController.js`** (lines 20, 44, 60, 81, 107, 136, 166, 188):
```js
// ❌
console.error("Error al crear producto:", err.message);
console.error("Error al obtener productos:", err.message);
// ✅
console.error("Error creating product:", err.message);
console.error("Error fetching products:", err.message);
```

Same pattern applies to `couriersController.js`, `assignOrdersController.js`, `customerPreferencesController.js`, and `orderItemsController.js`.

---

### 3. Spanish comment in `productsController.js`
**File:** `controllers/productsController.js:46`

```js
// ❌
// ✅ AGREGADO: Manejo de ValidationError para límites inválidos

// ✅ Fix
// Added: ValidationError handling for invalid pagination limits
```

---

### 4. Spanish JSDoc comments in `assignOrdersRepository.js`
**File:** `repositories/assignOrdersRepository.js` — all JSDoc blocks (lines 11–15, 29–31, 64–66, 101–103, 138–140, 152–154, 163–165, 174–177, 191–193, 206–208)

```js
// ❌ Current
/**
 * Crear una nueva asignación de orden a un courier
 * @param {Object} assignData - Datos de la asignación
 * @param {number} assignData.order_id - ID de la orden
 * @returns {Object} Asignación creada
 */

// ✅ Fix
/**
 * Creates a new order-to-courier assignment
 * @param {Object} assignData - Assignment data
 * @param {number} assignData.order_id - Order ID
 * @returns {Object} Created assignment
 */
```

All JSDoc blocks in this file must be translated to English.

---

### 5. Spanish console messages in `test-connection.js`
**File:** `test-connection.js:6,8`

```js
// ❌
console.log("✅ Conectado a Supabase:", res.rows[0]);
console.error("❌ Error de conexión:", err);

// ✅
console.log("Connected to database:", res.rows[0]);
console.error("Connection error:", err);
```

---

### 6. File naming convention — camelCase instead of kebab-case
**Files:** Most service, controller, repository, and route files

CLAUDE.md requires kebab-case file names. `customer-service.js` is the only file that follows this rule. All other files use camelCase. This causes cross-platform failures on Linux (Docker, CI/CD, production servers) if `require` paths differ in casing.

Key targets for migration:
```
services/ordersService.js              → orders-service.js
services/couriersService.js            → couriers-service.js
services/addressesService.js           → addresses-service.js
services/productService.js             → product-service.js
services/ordersItemsService.js         → orders-items-service.js
services/customerPreferencesService.js → customer-preferences-service.js
services/assignOrdersService.js        → assign-orders-service.js
controllers/ordersController.js        → orders-controller.js
controllers/customerController.js      → customer-controller.js
(and all other controllers/repositories/routes)
```

---

### 7. `validateOrderData` far exceeds 20-line limit
**File:** `services/ordersService.js:7–83` (77 lines)

CLAUDE.md requires functions under 20 lines with a single responsibility.

```js
// ❌ One 77-line method doing 5 different validations
async validateOrderData(orderData, isPartial = false, isCreate = false) { ... }

// ✅ Extract into focused helpers
validateCustomerId(customer_id) { ... }         // ~8 lines
validateAddressId(address_id) { ... }           // ~8 lines
async resolveCustomer(customer_id) { ... }      // ~6 lines
async resolveAddress(address_id) { ... }        // ~6 lines
validateAddressBelongsToCustomer(...) { ... }   // ~5 lines
```

---

### 8. `validateProductData` far exceeds 20-line limit
**File:** `services/productService.js:5–64` (60 lines)

```js
// ❌ One 60-line method
validateProductData(name, description, price, is_active, isPartial = false) { ... }

// ✅ Extract
validateName(name, isPartial) { ... }
validateDescription(description) { ... }
validatePrice(price, isPartial) { ... }
```

---

### 9. `validateCourierData` exceeds 20-line limit
**File:** `services/couriersService.js:5–64` (60 lines)

Same issue as above — break into `validateName`, `validatePhone`, `validateVehicle`, `validateLicensePlate`.

---

### 10. `validateAddressData` exceeds 20-line limit
**File:** `services/addressesService.js:6` (approx. 55 lines)

Same pattern — extract individual field validators.

---

### 11. Duplicated SQL JOIN block in `assignOrdersRepository.js`
**File:** `repositories/assignOrdersRepository.js:33–134`

The same 26-line `SELECT … JOIN` block is copy-pasted identically across `getAll()`, `getByCourierId()`, and `getByOrderId()`. Any future schema change must be applied in three places.

```js
// ✅ Fix — extract base query
const BASE_ASSIGNMENT_QUERY = `
  SELECT
    ao.id AS assignment_id, ao.assigned_at,
    c.id AS courier_id, c.name AS courier_name, ...
  FROM YuNowDataBase.assignment_order ao
  INNER JOIN YuNowDataBase.couriers c ON ao.courier_id = c.id
  INNER JOIN YuNowDataBase.orders o ON ao.order_id = o.id
  LEFT JOIN YuNowDataBase.order_statuses os ON o.status_id = os.id
  ...
`;

async getAll() {
  const result = await db.query(`${BASE_ASSIGNMENT_QUERY} ORDER BY ao.assigned_at DESC`);
  return result.rows;
}

async getByCourierId(courier_id) {
  const result = await db.query(
    `${BASE_ASSIGNMENT_QUERY} WHERE ao.courier_id = $1 ORDER BY ao.assigned_at DESC`,
    [courier_id]
  );
  return result.rows;
}
```

---

### 12. `test-connection.js` at project root — unreferenced utility
**File:** `test-connection.js`

This file exists at the root but is not referenced in any test suite or npm script. If it's a one-time utility, remove it. If needed, move it to `test/` and add an npm script.

---

### 13. API error response format inconsistent with CLAUDE.md spec
**Files:** All controllers

CLAUDE.md specifies:
```json
{ "error": "ValidationError", "message": "El teléfono es obligatorio" }
```

All controllers currently return:
```json
{ "error": "El teléfono es obligatorio" }
```

The error type name is absent, making client-side error handling harder and contradicting the documented contract. This requires updating both controllers and tests simultaneously.

---

## Suggestions 🟢

### 14. Extract error handling to shared middleware
**Files:** All controllers

The `catch` block pattern is repeated in every controller function (8 controllers × ~5 functions = ~40 identical blocks). A reusable error handler would eliminate this duplication:

```js
// middleware/errorHandler.js
const handleControllerError = (err, res, fallbackMessage = 'Error interno del servidor') => {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  if (err instanceof NotFoundError)   return res.status(404).json({ error: err.message });
  if (err instanceof DuplicateError)  return res.status(409).json({ error: err.message });
  if (err instanceof BusinessRuleError) return res.status(422).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: fallbackMessage });
};
```

---

### 15. Missing `BusinessRuleError` handling in controllers
**Files:** `controllers/ordersController.js`, `controllers/addressesController.js`, others

`BusinessRuleError` is defined in `customErrors.js` and mapped to 422, but no controller currently catches it. If a service ever throws one, it falls through to 500.

```js
// Add to catch blocks
if (err instanceof BusinessRuleError) {
  return res.status(422).json({ error: err.message });
}
```

---

### 16. Redundant partial update for orders
**File:** `services/ordersService.js:162–188`, `routes/orders.js:13`

`updateOrderPartial` (`PATCH /:id`) only accepts `status_id`, making it functionally identical to `updateStatusOrder` (`PATCH /:id/status`). Consider removing one endpoint or expanding `updateOrderPartial` to support additional mutable fields.

---

### 17. `validateAddressData` has 8 positional parameters
**File:** `services/addressesService.js:6`

```js
// ❌ 8 positional parameters — error-prone
validateAddressData(customer_id, label, address_text, reference, latitude, longitude, is_primary, isPartial)

// ✅ Accept an object and destructure
validateAddressData(addressData, isPartial = false) {
  const { customer_id, label, address_text, reference, latitude, longitude, is_primary } = addressData;
}
```

---

### 18. Dead code in `normalizeProductData`
**File:** `services/productService.js:146–148`

Inside `if (is_active !== undefined)`, the inner check `if (is_active === undefined || ...)` can never be true — it's unreachable dead code:

```js
// ❌ Inner check is dead code — outer guard already prevents is_active === undefined
if (is_active !== undefined) {
  if (is_active === undefined || is_active === null || is_active === '') { // always false
    normalized.is_active = false;
  }
```

Remove the dead inner condition. The `else` branch at line 157 covers the default case correctly.

---

### 19. Service-level unit tests are missing
**Files:** All `test/*.test.js`

All tests mock either the service or repository layer and test through the HTTP controller. There are no isolated unit tests for complex service validation logic (e.g., `validateOrderData`, `validateProductData`). Consider adding service-level tests for edge cases.

---

## CLAUDE.md Violations

| Rule | Violation | File(s) | Severity |
|------|-----------|---------|----------|
| SSL secure in production | `rejectUnauthorized: false` | `db.js:31` | 🔴 Critical |
| Comments/logs in English | Spanish `console.error` in all controllers | All `controllers/*.js` | 🟡 Warning |
| Comments in English | Spanish comment `// ✅ AGREGADO:` | `productsController.js:46` | 🟡 Warning |
| Comments in English | Spanish JSDoc throughout | `assignOrdersRepository.js` | 🟡 Warning |
| Comments/logs in English | Spanish `console.log/error` | `test-connection.js:6,8` | 🟡 Warning |
| Files: kebab-case | camelCase file names across entire codebase | All files except `customer-service.js` | 🟡 Warning |
| Functions ≤ 20 lines | `validateOrderData` is 77 lines | `ordersService.js:7` | 🟡 Warning |
| Functions ≤ 20 lines | `validateProductData` is 60 lines | `productService.js:5` | 🟡 Warning |
| Functions ≤ 20 lines | `validateCourierData` is 60 lines | `couriersService.js:5` | 🟡 Warning |
| Functions ≤ 20 lines | `validateAddressData` is ~55 lines | `addressesService.js:6` | 🟡 Warning |
| No duplicated code | SQL JOIN block duplicated 3× | `assignOrdersRepository.js` | 🟡 Warning |

---

## Checklist Summary

| Area | Item | Status |
|------|------|--------|
| **Architecture** | Layered architecture respected | ✅ Pass |
| **Architecture** | Controllers contain no business logic | ✅ Pass |
| **Architecture** | Services contain no Express objects | ✅ Pass |
| **Architecture** | Repositories contain only SQL | ✅ Pass |
| **Architecture** | Services use repositories (no direct `db.query`) | ✅ Pass |
| **Language** | Variable/function names in English | ✅ Pass |
| **Language** | File names in English | ✅ Pass |
| **Language** | Comments in English | ❌ Fail — Spanish JSDoc in `assignOrdersRepository.js`; Spanish comment in `productsController.js:46` |
| **Language** | `console.log/error` in English | ❌ Fail — Spanish messages in all controllers and `test-connection.js` |
| **Language** | JSON response keys in English | ✅ Pass |
| **Language** | User-facing error strings in Spanish | ✅ Pass |
| **Naming** | Variables/functions: camelCase | ✅ Pass |
| **Naming** | Files: kebab-case | ❌ Fail — only `customer-service.js` is kebab-case; all others are camelCase |
| **Naming** | DB tables/columns: snake_case | ✅ Pass |
| **Error Handling** | Custom error classes used | ✅ Pass |
| **Error Handling** | `ValidationError → 400` | ✅ Pass |
| **Error Handling** | `NotFoundError → 404` | ✅ Pass |
| **Error Handling** | `DuplicateError → 409` | ✅ Pass |
| **Error Handling** | `BusinessRuleError → 422` | ⚠️ Partial — no controller catches it |
| **Error Handling** | `Unknown → 500` with no leak | ✅ Pass |
| **Error Handling** | Repositories do not re-wrap errors | ✅ Pass |
| **Error Handling** | Services translate PG error codes | ✅ Pass |
| **Security** | Parameterized queries | ✅ Pass |
| **Security** | Dynamic field names use whitelist | ✅ Pass |
| **Security** | No exposed secrets | ✅ Pass |
| **Security** | SSL `rejectUnauthorized` in production | ❌ Fail — `db.js:31` |
| **Security** | Input validation on all endpoints | ✅ Pass |
| **Clean Code** | Functions do one thing | ⚠️ Partial — large validation functions in services |
| **Clean Code** | Functions under 20 lines | ❌ Fail — `validateOrderData` (77 lines), `validateProductData` (60 lines), `validateCourierData` (60 lines), `validateAddressData` (~55 lines) |
| **Clean Code** | Descriptive, intention-revealing names | ✅ Pass |
| **Clean Code** | No duplicated code | ⚠️ Partial — SQL JOIN duplicated 3× in `assignOrdersRepository.js` |
| **Clean Code** | Early returns preferred | ✅ Pass |
| **Testing** | Test coverage for endpoints | ✅ Pass |
| **Testing** | Tests follow Arrange/Act/Assert | ✅ Pass |
| **Testing** | Service-level unit tests | ⚠️ Partial — tests are primarily integration-level via controllers |
| **Performance** | No N+1 query problems | ✅ Pass |
| **Performance** | Pagination for large datasets | ✅ Pass |
