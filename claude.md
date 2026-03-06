# CLAUDE.md

# Yum Now API – Engineering Guidelines

## Project Overview

**Yum Now API** is a REST API built with **Node.js, Express 5, and PostgreSQL** for managing delivery orders received via **WhatsApp**.

The API is designed to integrate with:

- An **Angular web application** for administrators
- A **courier interface**
- A **future WhatsApp bot integration**

The backend follows a **layered architecture** designed for scalability, maintainability, and clear separation of responsibilities.

Core stack:

- Node.js
- Express 5
- PostgreSQL
- Jest + Supertest
- Helmet
- express-rate-limit
- dotenv
- Nodemon

---

# AI Development Guidelines

When modifying or generating code in this repository, follow these rules:

1. **Always explain the reason for any change before implementing it.**

Explain:

- What problem the change solves
- Why the current implementation is insufficient
- Why the proposed solution is appropriate
- Which part of the architecture is affected

2. **Never introduce breaking changes without justification.**

3. **Respect the existing architecture and coding standards.**

4. **Prefer minimal, safe changes rather than large refactors unless explicitly requested.**

---

# Architecture

This project uses a **layered architecture**.

```
HTTP Request
     |
     v
Routes
     |
     v
Controllers
     |
     v
Services
     |
     v
Repositories
     |
     v
PostgreSQL
```

Responsibilities:

### Routes

- Define API endpoints
- Apply middleware
- Apply rate limiting

### Controllers

- Handle HTTP request and response
- Validate request structure
- Convert service errors to HTTP responses

Controllers **must not contain business logic**.

### Services

- Contain **business rules**
- Validate domain logic
- Normalize data

Services **must not depend on Express objects (`req`, `res`)**.

### Repositories

- Execute **SQL queries**
- Interact with PostgreSQL through the connection pool

Repositories **must not contain business logic**.

---

# Language Standards

**All code must be written in English — no exceptions.**

This applies to:

- Variable names
- Function names
- Class and module names
- File names
- SQL column and table names
- Comments (inline and block)
- Console logs used for debugging

**Never use Spanish in code**, even if the domain concept is easier to express in Spanish.

Correct:

```js
// Validate that the order has at least one product
const getOrdersByCustomer = (customerId) => { ... }
const deliveryAddress = req.body.address
```

Incorrect:

```js
// Validar que el pedido tenga al menos un producto
const obtenerPedidosPorCliente = (clienteId) => { ... }
const direccionEntrega = req.body.address
```

> **Exception:** User-facing strings returned in API responses must be written in **Spanish**,
> since the product targets Spanish-speaking users.
>
> Example:
>
> ```js
> throw new ValidationError("El teléfono del cliente es obligatorio");
> throw new NotFoundError("El pedido no fue encontrado");
> ```

---

# Clean Code Requirements

All code must strictly follow **Clean Code principles**.

## General Rules

- Functions must do **one thing only**
- Functions should be **small** — aim for under 20 lines
- Use **descriptive and intention-revealing names**
- Avoid abbreviations and cryptic names
- Avoid duplicated code — extract reusable logic into shared functions
- Avoid deeply nested conditionals — prefer early returns
- Keep controllers thin — no business logic inside them
- Keep business logic inside services
- Keep SQL inside repositories
- Prefer early returns over nested conditions

## Naming Conventions

| Element    | Convention  | Example                 |
| ---------- | ----------- | ----------------------- |
| Variables  | camelCase   | `deliveryAddress`       |
| Functions  | camelCase   | `getOrdersByCustomer()` |
| Classes    | PascalCase  | `OrderService`          |
| Files      | kebab-case  | `order-service.js`      |
| Constants  | UPPER_SNAKE | `MAX_DELIVERY_RADIUS`   |
| DB tables  | snake_case  | `delivery_orders`       |
| DB columns | snake_case  | `customer_phone`        |

## Function Design

Correct:

```js
// Single responsibility, descriptive name, early return
async function getActiveOrdersByCustomer(customerId) {
  if (!customerId)
    throw new ValidationError("El ID del cliente es obligatorio");

  const orders = await ordersRepository.findActiveByCustomerId(customerId);

  if (!orders.length)
    throw new NotFoundError("No se encontraron pedidos activos");

  return orders;
}
```

Incorrect:

```js
// Multiple responsibilities, vague name, nested conditions
async function process(id) {
  if (id) {
    const data = await repo.get(id);
    if (data) {
      if (data.active) {
        return data;
      }
    }
  }
}
```

## Comments

- Write comments only when code **cannot be self-explanatory**
- Never write comments that just repeat what the code does
- Prefer renaming functions/variables over adding explanatory comments

Incorrect:

```js
// Get the customer
const c = await customerRepository.findById(id);
```

Correct:

```js
const customer = await customerRepository.findById(customerId);
```

Code must be **self-explanatory** whenever possible.

---

# SOLID Principles

All new code must respect the **SOLID principles**.

## S — Single Responsibility Principle (SRP)

A class or module must have **one responsibility** and **one reason to change**.

In this project:

- Routes → API definition
- Controllers → HTTP handling
- Services → Business logic
- Repositories → Data persistence

Responsibilities must **not overlap**.

---

## O — Open / Closed Principle (OCP)

Modules must be **open for extension but closed for modification**.

When adding functionality:

Prefer:

- Creating new service methods
- Creating new modules

Avoid modifying stable code unnecessarily.

---

## L — Liskov Substitution Principle (LSP)

Derived implementations must **not break the expected behavior** of their parent types.

All implementations must:

- Return the same data structure
- Respect the same method contracts
- Throw consistent errors

---

## I — Interface Segregation Principle (ISP)

Prefer **small and focused modules** rather than large multipurpose ones.

Avoid creating large services responsible for unrelated tasks.

Example:

Correct:

- CustomerService
- OrdersService
- ProductsService
- CouriersService

Incorrect:

- MegaService managing multiple domains.

---

## D — Dependency Inversion Principle (DIP)

High-level modules must **not depend directly on low-level modules**.

Dependencies should follow:

```
Controllers → Services
Services → Repositories
Repositories → Database layer
```

Business logic must **never depend on infrastructure details** such as HTTP frameworks or database drivers.

---

# Error Handling

Errors are centralized in **custom error classes**.

Examples:

- `ValidationError`
- `NotFoundError`
- `DuplicateError`
- `BusinessRuleError`

Rules:

- Repositories throw generic errors
- Services translate them to domain errors
- Controllers map them to HTTP responses
- Error messages thrown must be written in **Spanish** (user-facing)

Example mapping:

| Error             | HTTP Code |
| ----------------- | --------- |
| ValidationError   | 400       |
| NotFoundError     | 404       |
| DuplicateError    | 409       |
| BusinessRuleError | 422       |
| Unknown Error     | 500       |

---

# Database Rules

All database operations must follow these rules:

1. **Use parameterized queries**
2. Never build SQL using string concatenation
3. Keep SQL inside repositories
4. Avoid business logic inside SQL
5. Use the PostgreSQL connection pool

Connection pool configuration:

Max connections: **20**

---

# API Design Rules

Follow REST best practices.

### Resource Naming

Use plural resources.

Correct:

```
/api/products
/api/orders
/api/customers
```

Avoid:

```
/api/getProducts
```

---

### HTTP Methods

Use proper HTTP semantics.

| Method | Purpose          |
| ------ | ---------------- |
| GET    | Retrieve data    |
| POST   | Create resource  |
| PUT    | Replace resource |
| PATCH  | Partial update   |
| DELETE | Remove resource  |

---

### Response Consistency

API responses should be consistent.

Success example:

```json
{
  "data": {...}
}
```

Error example:

```json
{
  "error": "ValidationError",
  "message": "El teléfono del cliente es obligatorio"
}
```

---

# Security Rules

Security middleware includes:

- Helmet
- CORS
- express-rate-limit

Rate limit:

```
100 requests per IP every 15 minutes
```

Rules:

- Never expose internal errors
- Validate all user inputs
- Avoid returning sensitive information

---

# Testing Standards

Testing stack:

- Jest
- Supertest

Tests must cover:

- API endpoints
- Service logic
- Error handling

Tests should follow the pattern:

```
Arrange
Act
Assert
```

---

# Environment Variables

Environment variables are stored in `.env`.

Example variables:

```
NODE_ENV
PORT
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
JWT_SECRET
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER
FRONTEND_URL
LOG_LEVEL
```

Never commit secrets to the repository.

---

# Performance Guidelines

When modifying queries or services:

- Avoid unnecessary database queries
- Prefer indexed columns in filters
- Avoid N+1 query problems
- Use pagination for large datasets

---

# Health Check

Endpoint:

```
GET /health
```

Purpose:

- Verify server status
- Used for monitoring and deployment checks

---

# Project Structure

```
yum-now-api/
│
├── app.js
├── server.js
├── db.js
│
├── routes/
├── controllers/
├── services/
├── repositories/
│
├── errors/
│   └── customErrors.js
│
├── test/
│
├── .env.example
└── package.json
```

---

# Future Improvements

Planned roadmap:

- WhatsApp bot integration
- Payment APIs (Nequi, Bancolombia)
- Real-time courier tracking
- Automatic courier assignment
- JWT authentication
- Admin dashboards and analytics

---

# Author

**Santiago Mazo Padierna**

Project:
**Yum Now – WhatsApp Delivery Platform**
