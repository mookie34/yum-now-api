# Code Review – Yum Now API

**Date:** 2026-03-28
**Reviewed by:** code-reviewer agent
**Scope:** Full project — 54 files reviewed

---

## Summary

The project has a solid layered architecture (Routes → Controllers → Services → Repositories) with consistent use of custom error classes, parameterized SQL queries, JWT authentication, and good test coverage via Jest/Supertest. The payments module added recently is well-structured and follows existing conventions. The main areas to address are: inconsistent PostgreSQL schema name casing across repositories, missing `offset` pagination in two repositories, an unused import, and English-only violations in test descriptions and one comment.

---

## Critical Issues 🔴

### 1. Inconsistent PostgreSQL schema name casing across repositories

PostgreSQL schema names are case-sensitive when double-quoted at creation time. Half the repositories use `YuNowDataBase` while the other half use `yunowdatabase`. If the schema was created with quotes (`"YuNowDataBase"`), the lowercase references will fail at runtime.

| File | Schema used |
|------|------------|
| `repositories/products-repository.js` | `YuNowDataBase` |
| `repositories/customer-repository.js` | `YuNowDataBase` |
| `repositories/addresses-repository.js` | `YuNowDataBase` |
| `repositories/couriers-repository.js` | `YuNowDataBase` |
| `repositories/assign-orders-repository.js` | `YuNowDataBase` |
| `repositories/customer-preferences-repository.js` | `YuNowDataBase` |
| `repositories/orders-repository.js` | `yunowdatabase` |
| `repositories/order-items-repository.js` | `yunowdatabase` |
| `repositories/payments-repository.js` | `yunowdatabase` |

**Fix:** Standardize to a single casing throughout. If the schema was created unquoted (lowercase in PostgreSQL), use `yunowdatabase` everywhere. Centralize the schema name in a single constant to prevent future drift:

```js
// db.js or a shared config file
const SCHEMA = 'yunowdatabase';
module.exports = { SCHEMA };

// In each repository:
const { SCHEMA } = require('../db');
this.tableName = `${SCHEMA}.orders`;
```

---

## Warnings 🟡

### 2. `BusinessRuleError` imported but never used — `services/assign-orders-service.js:6`

```js
// Current
const {
  ValidationError,
  NotFoundError,
  DuplicateError,
  BusinessRuleError,   // ← never thrown in this file
} = require("../errors/custom-errors");
```

**Fix:** Remove the unused import.

```js
const { ValidationError, NotFoundError, DuplicateError } = require("../errors/custom-errors");
```

---

### 3. `getAll()` missing `offset` parameter — `repositories/customer-repository.js:12` and `repositories/addresses-repository.js:12`

Both repositories only accept `limit`, breaking consistent pagination across the API.

`customer-repository.js:12`:
```js
async getAll(limit) {  // ← no offset
    const result = await db.query(
        'SELECT ... FROM YuNowDataBase.customers ORDER BY id ASC LIMIT $1',
        [limit]
    );
```

`addresses-repository.js:12`:
```js
async getAll(limit) {  // ← no offset
    const result = await db.query('SELECT * FROM YuNowDataBase.addresses ORDER BY id ASC LIMIT $1', [limit]);
```

**Fix:** Add `offset = 0` parameter and `OFFSET $2` to both queries, matching all other repositories.

---

### 4. `assign-orders-repository.js:58` — `getAll()` has no pagination at all

```js
async getAll() {
    const query = `${BASE_ASSIGNMENT_QUERY} ORDER BY ao.assigned_at DESC`;
    // ← no LIMIT / OFFSET
```

As the dataset grows this query returns every row. **Fix:** Add `limit = 100, offset = 0` parameters and `LIMIT $1 OFFSET $2`.

---

### 5. Commented-out code left in production file — `app.js:85`

```js
//console.log("DB host:", process.env.DB_HOST);
```

Dead code should not live in production files. **Fix:** Remove the commented line.

---

### 6. English-only violation — test description strings in Spanish

All `it()` / `describe()` descriptions in the test files are written in Spanish, violating the English-only rule for code.

Examples from `test/payments.test.js`:
```js
it("Deberia crear un pago digital exitosamente", ...)       // line 16
it("Deberia devolver error cuando order_id es invalido", ...)  // line 125
```

Comment in Spanish from `test/setupTests.js:13`:
```js
// Silencia todos los console.error en los tests
```

**Fix:** Write all `describe()`/`it()` strings and inline comments in English:
```js
it("should create a digital payment successfully", ...)
it("should return error when order_id is invalid", ...)

// Silence all console.error calls in tests
```

---

### 7. Inconsistent validation pattern in `services/orders-service.js:44`

`validateTotal` returns a string or `null` instead of throwing, unlike all other validators in the project which throw directly.

```js
// Current — inconsistent
validateTotal(total) {
    if (total !== undefined && (isNaN(total) || parseFloat(total) < 0)) {
      return "El total no puede ser negativo";  // ← returns string
    }
    return null;
}

// All other validators do this:
validateId(id) {
    if (!id || isNaN(id) || parseInt(id) <= 0) {
        throw new ValidationError('ID inválido');  // ← throws directly
    }
}
```

This forces callers to check the return value, increasing cognitive load. **Fix:** Either throw directly or document the return-value pattern explicitly and apply it consistently.

---

## Suggestions 🟢

### 8. `CLAUDE.md` does not exist in the repository

The project references a `CLAUDE.md` with architecture and coding rules, but the file is missing. **Fix:** Create the file with the agreed-upon rules so all contributors can reference them.

---

### 9. `auth-service.js:27` — timing-safe compare short-circuits on length mismatch

```js
function timingSafeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));

  if (bufA.length !== bufB.length) return false;  // ← early return reveals expected length

  return crypto.timingSafeEqual(bufA, bufB);
}
```

The early-exit on length mismatch is measurably faster than the full comparison, allowing a timing attacker to enumerate the expected credential length. For a single-admin system this is low risk, but a constant-time approach is preferred (e.g., pad both buffers to the same length before comparison).

---

### 10. `products-repository.js:43` — `SELECT *` in dynamic filter query

```js
let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
```

Prefer an explicit column list to avoid returning unintended fields if the schema changes.

---

### 11. No tests verify that protected routes reject unauthenticated requests

`test/setupTests.js` globally mocks the `authenticate` middleware, which means no test confirms that a real request without a token receives a `401`. Consider adding at least one test per protected route group without the mock to validate the auth middleware itself.

---

### 12. `orders-items-service.js` — `updateQuantityOrderItem` and `updatePriceOrderItem` are unreachable from the controller

`controllers/order-items-controller.js` only calls `updateOrderItem`. The standalone `updateQuantityOrderItem` and `updatePriceOrderItem` methods in the service are dead code.

---

## CLAUDE.md Violations

> Note: `CLAUDE.md` was not found in the repository. The violations below are assessed against the rules defined in the `code-reviewer` command.

| Rule | Violation | Location |
|------|-----------|----------|
| English-only code | `it()` descriptions in Spanish | All test files |
| English-only code | Comment in Spanish (`// Silencia todos…`) | `test/setupTests.js:13` |
| No dead code | Commented-out `console.log` | `app.js:85` |
| Consistent naming | Schema casing `YuNowDataBase` vs `yunowdatabase` | 9 repository files |
| No unused imports | `BusinessRuleError` imported but unused | `services/assign-orders-service.js:6` |

---

## Checklist Summary

| Category | Item | Status |
|----------|------|--------|
| **Architecture** | Layered architecture respected (Routes → Controllers → Services → Repositories) | ✅ Pass |
| **Architecture** | Controllers contain no business logic | ✅ Pass |
| **Architecture** | Services contain no Express objects (req, res) | ✅ Pass |
| **Architecture** | Repositories contain only SQL | ✅ Pass |
| **Architecture** | Services never call `db.query()` directly | ✅ Pass |
| **Language** | Variable and function names in English | ✅ Pass |
| **Language** | File names in English (kebab-case) | ✅ Pass |
| **Language** | Inline comments in English | ⚠️ Partial — one comment in Spanish (`setupTests.js:13`) |
| **Language** | `console.log()` messages in English | ✅ Pass |
| **Language** | JSON response keys in English | ✅ Pass |
| **Language** | Test descriptions in English | ❌ Fail — all `it()` strings in Spanish |
| **Naming** | camelCase for variables and functions | ✅ Pass |
| **Naming** | PascalCase for classes | ✅ Pass |
| **Naming** | kebab-case for file names | ✅ Pass |
| **Naming** | UPPER_SNAKE_CASE for constants | ✅ Pass |
| **Error Handling** | Custom error classes used | ✅ Pass |
| **Error Handling** | ValidationError → 400 | ✅ Pass |
| **Error Handling** | NotFoundError → 404 | ✅ Pass |
| **Error Handling** | DuplicateError → 409 | ✅ Pass |
| **Error Handling** | BusinessRuleError → 422 | ✅ Pass (used in assign-orders-controller) |
| **Error Handling** | Repositories do not re-wrap errors | ✅ Pass |
| **Error Handling** | Services translate PostgreSQL error codes | ✅ Pass (23505, 23503 handled) |
| **Security** | Parameterized queries only | ✅ Pass |
| **Security** | Dynamic fields use whitelist before SQL injection | ✅ Pass |
| **Security** | No exposed secrets or API keys | ✅ Pass |
| **Security** | Input validation on all endpoints | ✅ Pass |
| **Clean Code** | Functions do one thing | ✅ Pass |
| **Clean Code** | No duplicated code | ✅ Pass |
| **Clean Code** | No dead/commented code | ⚠️ Partial — `app.js:85` |
| **Testing** | Test coverage for endpoints and error handling | ✅ Pass |
| **Testing** | Tests follow Arrange / Act / Assert | ✅ Pass |
| **Testing** | Auth middleware tested without mock | ❌ Fail — globally mocked, no negative-path auth tests |
| **Performance** | Pagination used for large datasets | ⚠️ Partial — `customer-repository`, `addresses-repository`, `assign-orders-repository` missing full pagination |
| **Performance** | No N+1 query problems | ✅ Pass |
| **Consistency** | Consistent schema name casing across repositories | ❌ Fail — `YuNowDataBase` vs `yunowdatabase` |
