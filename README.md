# Plataforma de Domicilios por WhatsApp 🚴‍♂️💬

## 🧠 Descripción
Aplicación que permite gestionar pedidos de domicilios realizados por WhatsApp.  
Incluye un **bot**, una **API REST en Node.js**, una **base de datos PostgreSQL**,  
y una **aplicación web en Angular** para administradores y domiciliarios.

---

## ⚙️ Tecnologías principales
- **Backend:** Node.js + Express (API REST)
- **Frontend:** Angular
- **Base de datos:** PostgreSQL
- **Mensajería:** Twilio o 360dialog (para WhatsApp)
- **Despliegue:** VPS o Render
- **Lenguaje:** TypeScript

---

## 🚀 Instalación y ejecución

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/mookie34/yum-now-api
cd plataforma-YouNoWApi
```

### 2️⃣ Crear el archivo de entorno
Copia el archivo de ejemplo y completa tus variables:
```bash
cp .env.example .env
```
Luego edita el archivo `.env` con tus valores (por ejemplo, credenciales de DB y Twilio).

---

### 3️⃣ Instalar dependencias
```bash
npm install
```

---

### 4️⃣ Ejecutar el servidor
```bash
npm run dev
```
Por defecto la API se ejecutará en:  
👉 **http://localhost:3000**

---

## 🧩 Estructura del proyecto

```
backend/
 ├─ src/
 │   ├─ controllers/
 │   ├─ models/
 │   ├─ routes/
 │   ├─ services/
 │   └─ app.js
 ├─ .env.example
 └─ package.json

frontend/
 ├─ src/
 │   ├─ app/
 │   ├─ assets/
 │   └─ environments/
 └─ angular.json
```

---

## 🔐 Variables de entorno principales

| Variable | Descripción |
|-----------|-------------|
| `PORT` | Puerto donde corre el servidor |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD` | Configuración de PostgreSQL |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Credenciales de Twilio |
| `JWT_SECRET` | Clave secreta para autenticación |
| `FRONTEND_URL` | URL del panel admin (Angular) |

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
