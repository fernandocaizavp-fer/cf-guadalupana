# Sistema de Gestión Académica — CFA Guadalupana

Sistema web de gestión académica para el **Centro de Formación Artesanal Particular Guadalupana** (Riobamba, Ecuador). Digitaliza procesos que se hacían en papel y Excel: matrículas, notas, asistencia, tareas y documentos oficiales.

> Proyecto desarrollado como trabajo de titulación de Ingeniería en Software (ESPOCH).

---

## ✨ Funcionalidades

**Portal público**
- Landing institucional con información de la oferta académica.

**Administración**
- Gestión de cursos, materias, docentes y estudiantes.
- Matrículas con consulta de datos por número de cédula.
- Generación de documentos oficiales en Word a partir de plantillas (matrícula, certificado de matrícula, cuadros de calificaciones, asistencia, promoción y exámenes de grado).
- Reportes, anuncios y configuración del sistema.

**Profesores**
- Registro de notas, asistencia, disciplina, supletorios y examen de grado.
- Publicación de tareas con archivos adjuntos.

**Estudiantes**
- Consulta de materias, notas y tareas; entrega de trabajos.

**Seguridad**
- Inicio de sesión con JWT y cambio obligatorio de contraseña en el primer ingreso.
- Recuperación de contraseña por código enviado al correo.
- Control de acceso por roles (Admin / Profesor / Estudiante) y límite de peticiones por IP.

## 🛠️ Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | Angular 21, TypeScript, Angular Material, SCSS |
| Backend | Node.js, Express 4, TypeScript |
| Base de datos | PostgreSQL con Prisma ORM (migraciones versionadas) |
| Seguridad | JWT, contraseñas con bcrypt, middleware de roles |
| Archivos | Multer, Cloudinary |
| Documentos | Docxtemplater + PizZip (plantillas Word) |
| Correo | EmailJS |
| Rendimiento | Pruebas de carga con Apache JMeter |

## 🏗️ Arquitectura

```
Navegador ──► Angular (SPA) ──► API REST Express ──► Prisma ──► PostgreSQL
                                     ├── Cloudinary (archivos)
                                     └── API externa de consulta de cédula
```

## 🚀 Ejecutar en local

Requisitos: Node.js 22 y una base de datos PostgreSQL.

```bash
# Backend
cd backend
npm ci
# crear backend/.env con las variables de la tabla de abajo
npx prisma migrate deploy
npx prisma generate
npm run dev            # http://localhost:3000/api

# Frontend (en otra terminal)
cd frontend
npm ci
npm start              # http://localhost:4200
```

Variables de entorno del backend (`backend/.env`, nunca se sube al repositorio):

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `JWT_SECRET` | Firma de los tokens de sesión |
| `CEDULA_API_TOKEN` | Consulta de datos por cédula |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Almacenamiento de archivos |
| `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY` | Envío del código de recuperación |
| `ADMIN_CORREO`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE`, `ADMIN_APELLIDO`, `ADMIN_CEDULA` | Administrador inicial (opcional, `npm run seed`) |

## 📁 Estructura

```
backend/    API Express + Prisma (controladores, rutas, middlewares, plantillas Word)
frontend/   Aplicación Angular (componentes por módulo, servicios, guards)
jmeter/     Escenarios y resultados de pruebas de carga
```

## 👤 Autor

**Fernando Caiza** — Estudiante de Ingeniería en Software, ESPOCH
GitHub: [@fernandocaizavp-fer](https://github.com/fernandocaizavp-fer)
