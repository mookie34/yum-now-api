# Code Review – Yum Now API

**Date:** 2026-03-05
**Reviewed by:** code-reviewer agent
**Scope:** Full project — all 46 `.js` files (app, server, db, errors, 8 controllers, 8 services, 8 repositories, 8 routes, 9 tests + setup)

---

## Summary

The overall architecture is solid and correctly follows the Routes → Controllers → Services → Repositories → DB layered pattern. Custom error classes are used consistently, parameterized queries are the norm, and test coverage is broad across all modules. However, there are recurring critical violations of the CLAUDE.md language rule (Spanish comments in code), one architectural violation in `ordersService.js` (direct DB access), a real SQL injection vector in two repository `updatePartial` methods, and several consistency gaps in error mapping and response keys.

---

## Critical Issues 🔴

### 1. Spanish comments throughout the codebase

**Rule violated:** "All code must be written in English — no exceptions. This applies to… Comments (inline and block)"

The following files contain Spanish-language comments in code (not user-facing strings):

| File | Lines | Example |
|------|-------|---------|
| `app.js` | 17–70 | `// MIDDLEWARES DE SEGURIDAD`, `// Helmet - Protege headers HTTP`, `// 15 minutos`, `// PARSEO DE BODY`, `// RUTAS`, `// MANEJO DE ERRORES` |
| `server.js` | 1–66 | `// Cargar variables de entorno desde un archivo .env`, `// Variable para almacenar la instancia del servidor`, `// Salir del proceso con un código de error` |
| `db.js` | 4–55 | `// VALIDACIÓN DE VARIABLES DE ENTORNO`, `// CONFIGURACIÓN DEl POOL`, `// número máximo de conexiones en el pool`, `// SSL solo en producción` |
| `repositories/ordersRepository.js` | 12, 14 | `// Siempre inicia en 0, se calcula después`, `// Por defecto "CREATED"` |
| `services/addressesService.js` | 44 | `// Validar longitude (OPCIONAÑ, ...)` — also a typo |
| `services/customerService.js` | 77, 124, 154, 172 | `// Código de error de violación de unicidad en PostgreSQL`, `// Re-lanzar otros errores` |
| `repositories/productsRepository.js` | 113 | `// Construir query dinámicamente` |

**Fix:** Replace all Spanish inline/block comments with English equivalents.

---

### 2. `DuplicateError` mapped to HTTP 400 instead of 409 in `addressesController.js`

**File:** `controllers/addressesController.js` — line 20

**Problem:** The CLAUDE.md error mapping table specifies `DuplicateError → 409`. This controller incorrectly maps it to `400`.

```js
// Current (WRONG)
} else if (error instanceof DuplicateError) {
    return res.status(400).json({ error: error.message }); // ❌ Should be 409
}
```

**Fix:**
```js
} else if (error instanceof DuplicateError) {
    return res.status(409).json({ error: error.message });
}
```

---

### 3. `ordersService.js` directly calls `db.query()` — architectural violation

**File:** `services/ordersService.js` — lines 62–69, 77–84, 207–213, 242–245

**Problem:** The service layer imports and directly queries the database (`db.query()`), bypassing the repository layer. CLAUDE.md states: "Business logic must never depend on infrastructure details such as HTTP frameworks or database drivers." The dependency chain must be `Services → Repositories → Database`.

```js
// Current (WRONG) — service calls db directly
const result = await db.query(
    "SELECT id FROM yunowdatabase.payment_methods WHERE id = $1 AND is_active = true",
    [payment_method_id]
);
```

**Fix:** Create repository methods (e.g., in a `paymentMethodsRepository` or extend `ordersRepository`) for existence checks:

```js
// In ordersRepository.js
async paymentMethodExists(paymentMethodId) {
    const result = await db.query(
        'SELECT id FROM yunowdatabase.payment_methods WHERE id = $1 AND is_active = true',
        [paymentMethodId]
    );
    return result.rows.length > 0;
}

async orderStatusExists(statusId) {
    const result = await db.query(
        'SELECT id FROM yunowdatabase.order_statuses WHERE id = $1',
        [statusId]
    );
    return result.rows.length > 0;
}
```

Then in `ordersService.js`, remove the `db` import and use the repository methods.

---

### 4. SQL injection via unwhitelisted field names in `updatePartial` methods

**Files:**
- `repositories/addressesRepository.js` — lines 49–61
- `repositories/customerRepository.js` — lines 54–66

**Problem:** Both `updatePartial` methods iterate over all keys in the `addressData`/`customerData` object and inject them directly into the SQL column names without a whitelist. If a caller ever passes unexpected keys (e.g., from unsanitized request body), those keys become part of the SQL string, creating a SQL injection vector.

```js
// Current (RISKY)
for (const [key, value] of Object.entries(addressData)) {
    fields.push(`${key} = $${index}`); // key is injected directly into SQL
    values.push(value);
    index++;
}
```

**Fix:** Apply an explicit allowlist:

```js
// In addressesRepository.js updatePartial
const ALLOWED_FIELDS = ['label', 'address_text', 'reference', 'latitude', 'longitude', 'is_primary', 'customer_id'];
const fields = [];
const values = [];
let index = 1;

for (const [key, value] of Object.entries(addressData)) {
    if (!ALLOWED_FIELDS.includes(key)) continue;
    fields.push(`${key} = $${index}`);
    values.push(value);
    index++;
}
```

---

### 5. `OrderItemsRepository` swallows pg error codes by re-wrapping errors

**File:** `repositories/orderItemsRepository.js` — lines 18–19, 33–34, etc.

**Problem:** Every method wraps caught errors in `new Error(...)`, discarding the original error's properties (including `err.code`). The service layer relies on `err.code === '23505'` in other modules to detect constraint violations. This pattern breaks error propagation uniformly.

```js
// Current (WRONG)
} catch (error) {
    throw new Error(`Error al crear item de orden: ${error.message}`); // loses error.code
}
```

**Fix:** Let errors propagate naturally (remove all try/catch in the repository), as the other repositories do:

```js
async create(orderItemData) {
    const { order_id, product_id, quantity, price } = orderItemData;
    const query = `INSERT INTO ${this.tableName} ... RETURNING *`;
    const result = await db.query(query, [order_id, product_id, quantity, price]);
    return result.rows[0];
}
```

---

### 6. Method name `ValidateAddressData` uses PascalCase — naming convention violation

**File:** `services/addressesService.js` — line 6

**Problem:** Methods must use `camelCase` per CLAUDE.md. `ValidateAddressData` starts with an uppercase letter, treating it as a class/constructor name, not a method.

```js
// Current (WRONG)
ValidateAddressData(customer_id, label, ...) { ... }
```

**Fix:**
```js
validateAddressData(customer_id, label, ...) { ... }
```

All call sites (`this.ValidateAddressData(...)`) must be updated accordingly.

---

### 7. JSON response key `mensaje` in `assignOrdersController.js` — Spanish key name

**File:** `controllers/assignOrdersController.js` — lines 12, 91, 113

**Problem:** The response JSON uses `mensaje` (Spanish) as a key. All JSON response keys must be in English. User-facing _values_ can be in Spanish, but the key must be `message`.

```js
// Current (WRONG)
res.status(201).json({ mensaje: "Orden asignada exitosamente.", assignOrder: assignment });
```

**Fix:**
```js
res.status(201).json({ message: "Orden asignada exitosamente.", assignOrder: assignment });
```

---

## Warnings 🟡

### 8. Business logic in `couriersController.js` — empty result check

**File:** `controllers/couriersController.js` — lines 39–42

**Problem:** The controller checks if `couriers.length === 0` and returns 404. This is a business rule and belongs in the service layer.

```js
// Current (WRONG — business logic in controller)
const couriers = await couriersService.getAvailableCouriers();
if (couriers.length === 0) {
    return res.status(404).json({ error: "No hay Domiciliarios disponibles" });
}
```

**Fix:** Move the empty check into `couriersService.getAvailableCouriers()`:

```js
async getAvailableCouriers() {
    const couriers = await couriersRepository.getAvailable();
    if (couriers.length === 0) {
        throw new NotFoundError("No hay Domiciliarios disponibles");
    }
    return couriers;
}
```

---

### 9. `assignOrdersController.js` 500 error messages in English — violates Spanish user-facing rule

**File:** `controllers/assignOrdersController.js` — lines 26, 39, 59, 78, 102, 124

**Problem:** All 500 responses return `"Internal server error"` in English. CLAUDE.md requires user-facing strings to be in Spanish.

```js
// Current (WRONG)
res.status(500).json({ error: "Internal server error" });
```

**Fix:**
```js
res.status(500).json({ error: "Error interno del servidor" });
```

---

### 10. `validateCourierData` is marked `async` without any `await`

**File:** `services/couriersService.js` — line 5

**Problem:** `async validateCourierData(...)` contains no `await` expressions. Marking a synchronous function `async` is misleading and causes unnecessary Promise wrapping. All callers use `await this.validateCourierData(...)` unnecessarily.

**Fix:** Remove `async`:
```js
validateCourierData(courierData, isPartial = false) { ... }
```

---

### 11. Dead code in `normalizeProductData`

**File:** `services/productService.js` — lines 135–141

**Problem:** Inside `if (description !== undefined)`, there is an inner check `if (description === undefined || ...)` which can never be true because the outer condition guarantees `description !== undefined`.

```js
if (description !== undefined) {
    // description is ALWAYS defined here, so this inner check is dead code:
    if (description === undefined || description === null || ...) {
        normalized.description = null;
    }
}
```

**Fix:** Remove the redundant inner condition:
```js
if (description !== undefined) {
    normalized.description = (description === null || description.trim() === '')
        ? null
        : description.trim();
}
```

---

### 12. `ordersRepository.js` throws a generic `Error` from repository layer

**File:** `repositories/ordersRepository.js` — line 138

**Problem:** Repository methods should not throw domain errors. The repository throws `new Error("No hay campos válidos para actualizar")`, which is a domain-level decision that belongs in the service.

```js
// Current (WRONG — in repository)
if (fields.length === 0) {
    throw new Error("No hay campos válidos para actualizar");
}
```

**Fix:** Guard against empty fields in the service before calling the repository, and remove this throw from the repository. Alternatively return `null` and let the service check:

```js
// In repository
if (fields.length === 0) return null;

// In service
const updated = await ordersRepository.updatePartial(id, orderData);
if (!updated) throw new ValidationError("No se proporcionaron campos para actualizar");
```

---

### 13. Inconsistent function naming — "ForFilter" and "ForPhone" patterns

**Files:**
- `controllers/customerController.js` — `getCustomerForPhone` (line 36)
- `controllers/couriersController.js` — `getCourierForFilter` (line 53)
- `controllers/productsController.js` — `getProductForFilter` (line 55)

**Problem:** These names are unconventional. Standard naming would be `getCustomerByPhone`, `getCouriersByFilter`, `getProductsByFilter`. The inconsistency continues in the route files and the service method name (`getCustomerByPhone` in service vs `getCustomerForPhone` in controller).

---

### 14. `customerRepository.getByPhone` uses wildcard ILIKE — returns an array of matches

**File:** `repositories/customerRepository.js` — lines 22–26

**Problem:** The query uses `ILIKE '%phone%'`, which returns multiple results. The method name `getByPhone` implies lookup by unique identifier. This could silently return multiple customers. The service treats it as potentially empty (`customer.length === 0`) but never limits to a single result.

```js
// Wildcard allows partial match, multiple results
const result = await db.query(
    '... WHERE phone ILIKE $1', [`%${phone}%`]
);
```

**Fix:** If exact match is intended (phone is unique), use `= $1` without wildcards. If search is intended, rename to `searchByPhone` and document accordingly.

---

### 15. CORS is fully open — no origin restriction

**File:** `app.js` — line 25

**Problem:** `app.use(cors())` with no options allows requests from any origin. In production this is a security risk and should be restricted to the known frontend URL.

**Fix:**
```js
app.use(cors({ origin: process.env.FRONTEND_URL }));
```

---

## Suggestions 🟢

### 16. Duplicated SQL JOIN query in `assignOrdersRepository.js`

**File:** `repositories/assignOrdersRepository.js` — `getAll()`, `getByCourierId()`, `getByOrderId()` (lines 33–60, 69–97, 106–134)

The same large JOIN SELECT is copy-pasted three times. Extract the common SELECT + JOINs to a private helper string and append `WHERE` clauses as needed.

---

### 17. Several functions exceed the 20-line guideline

**Files:**
- `services/productService.js` — `validateProductData` (59 lines), `normalizeProductData` (39 lines), `validateFilters` (54 lines), `normalizeFilters` (26 lines)
- `services/ordersItemsService.js` — `updateOrderItem` (47 lines)
- `services/addressesService.js` — `ValidateAddressData` (55 lines)

Consider splitting large validation methods into smaller focused helpers (e.g., `validateName`, `validatePrice`, `validatePriceRange`).

---

### 18. `getAllAddresses` only supports `limit`, not `offset`

**File:** `services/addressesService.js` — line 89; `repositories/addressesRepository.js` — line 13

All other collection endpoints support `limit + offset` pagination. Addresses only supports `limit`. Add `offset` for consistency.

---

### 19. Inconsistent test mock strategies

Some tests mock the service layer (`customers.test.js`, `products.test.js`, `addresses.test.js`), some mock the repository layer (`couriers.test.js`, `orders.test.js`), and `customerPreferences.test.js` mocks `db` directly. Standardize on mocking the service layer in controller tests for isolation.

---

### 20. `test-connection.js` at project root — unclear purpose

**File:** `test-connection.js`

This file exists at the project root but is not referenced in any test suite or npm script. If it's a one-time utility, it should be removed. If it's needed, document its purpose and add an npm script for it.

---

### 21. SSL `rejectUnauthorized: false` in production

**File:** `db.js` — line 31

This disables SSL certificate verification in production, which exposes the connection to man-in-the-middle attacks. Provide a proper CA certificate instead:

```js
poolConfig.ssl = {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA
};
```

---

### 22. Inconsistent success response format

CLAUDE.md defines success responses as `{ "data": {...} }`, but the codebase uses mixed formats:

- `{ message, order }` (orders)
- `{ message, customer }` (customers)
- `{ message, preferencia }` (customerPreferences — also a Spanish key)
- Raw arrays (get-all endpoints)

Standardize to the format defined in CLAUDE.md, and fix the `preferencia` key to `preference`.

---

## CLAUDE.md Violations

| Rule | Files Affected |
|------|----------------|
| All code in English — no Spanish comments | `app.js`, `server.js`, `db.js`, `ordersRepository.js`, `addressesService.js`, `customerService.js`, `productsRepository.js` |
| All code in English — no Spanish JSON keys | `assignOrdersController.js` (`mensaje`), `customerPreferencesController.js` (`preferencia`) |
| User-facing strings in Spanish — 500 errors | `assignOrdersController.js` (returns `"Internal server error"` in English) |
| Controllers contain no business logic | `couriersController.js` (empty check for available couriers) |
| Services must not depend on infrastructure | `ordersService.js` (direct `db.query()` calls) |
| Repositories contain only SQL — no business logic | `ordersRepository.js` (throws domain error) |
| Error mapping: DuplicateError → 409 | `addressesController.js` (maps to 400) |
| Parameterized queries only — no injection risk | `addressesRepository.js`, `customerRepository.js` (unwhitelisted field names in SQL) |
| camelCase for methods | `addressesService.js` (`ValidateAddressData`) |
| Functions under 20 lines | `productService.js`, `ordersItemsService.js`, `addressesService.js` |

---

## Checklist Summary

| Checklist Item | Status |
|----------------|--------|
| Layered architecture respected (Routes → Controllers → Services → Repositories) | ⚠️ Partial — `ordersService.js` bypasses repositories |
| Code written entirely in English (variables, functions, files, comments, SQL) | ❌ Fail — Spanish comments in 7+ files |
| User-facing error messages written in Spanish | ⚠️ Partial — `assignOrdersController.js` uses English in 500 responses |
| Functions do one thing only and are under 20 lines | ⚠️ Partial — several service validation methods exceed 20 lines |
| Descriptive, intention-revealing names (camelCase, PascalCase, kebab-case) | ⚠️ Partial — `ValidateAddressData`, `getCustomerForPhone`, `getCourierForFilter` |
| No duplicated code | ⚠️ Partial — SQL JOIN duplicated 3× in `assignOrdersRepository.js` |
| Early returns preferred over nested conditionals | ✅ Pass |
| Controllers contain no business logic | ⚠️ Partial — `couriersController.js` has empty result check |
| Services contain no Express objects (req, res) | ✅ Pass |
| Repositories contain only SQL — no business logic | ⚠️ Partial — `ordersRepository.js` throws domain error |
| Parameterized queries only — no string concatenation in SQL | ⚠️ Partial — column names injected unwhitelisted in `updatePartial` methods |
| Custom error classes used (ValidationError, NotFoundError, etc.) | ✅ Pass |
| No exposed secrets or API keys | ✅ Pass |
| Input validation implemented | ✅ Pass |
| Test coverage for endpoints, services, and error handling | ✅ Pass |
| No N+1 query problems | ✅ Pass |
| Pagination used for large datasets | ⚠️ Partial — `getAllAddresses` missing `offset` |
