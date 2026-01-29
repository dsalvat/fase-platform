# Plataforma FASE

Plataforma de gestión de objetivos basada en la metodología FASE (Focus, Atención, Sistemas, Energía) creada por Agustín Peralt.

## Sobre el Proyecto

FASE es una metodología de gestión de objetivos que ayuda a los usuarios a planificar, ejecutar y hacer seguimiento de sus objetivos mensuales (Big Rocks) con foco en tareas de alto rendimiento.

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 15.1.6 (React 19)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Estado**: Zustand
- **Calendario**: react-big-calendar

### Backend
- **Runtime**: Node.js 22+
- **API**: Next.js API Routes
- **ORM**: Prisma
- **Base de datos**: PostgreSQL (Neon/Supabase)
- **Validación**: Zod

### Autenticación
- **Provider**: NextAuth.js v5
- **OAuth**: Google SSO
- **Sesiones**: JWT

### Integración IA
- **Orquestación**: n8n
- **LLM**: OpenAI GPT-4 / Claude API (futuro)

## Características Principales

- ✅ Gestión de Big Rocks (objetivos mensuales)
- ✅ Tareas de Alto Rendimiento (TAR)
- ✅ Planificación mensual, semanal y diaria
- ✅ Calendario visual con estados
- ✅ Sistema de gamificación (puntos, medallas, ranking)
- ✅ Roles de usuario (Usuario, Supervisor, Admin)
- ✅ Evaluación con IA
- ✅ Integración con n8n para workflows

## Instalación

### Requisitos Previos

- Node.js 22+ instalado
- npm o yarn
- Cuenta en Neon o Supabase (para PostgreSQL)
- Credenciales de Google OAuth (opcional para desarrollo)

### Paso 1: Clonar el Repositorio

```bash
git clone <repository-url>
cd fase
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Variables de Entorno

Copia `.env.example` a `.env.local` y completa las variables:

```bash
cp .env.example .env.local
```

Edita `.env.local` y configura:

#### Base de Datos (Neon - Recomendado)

1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la connection string
5. Pégala en `DATABASE_URL`

#### NextAuth Secret

Genera un secret seguro:

```bash
openssl rand -base64 32
```

Copia el resultado en `NEXTAUTH_SECRET`

#### Google OAuth (Opcional)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crea un nuevo proyecto
3. Configura OAuth consent screen
4. Crea credenciales OAuth 2.0
5. Añade `http://localhost:3000/api/auth/callback/google` como redirect URI
6. Copia Client ID y Client Secret a `.env.local`

### Paso 4: Configurar Base de Datos

```bash
# Generar cliente Prisma
npm run prisma:generate

# Push schema a la base de datos
npm run prisma:push

# (Opcional) Abrir Prisma Studio para ver los datos
npm run prisma:studio
```

### Paso 5: Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Construye para producción
npm start            # Inicia servidor de producción

# Linting
npm run lint         # Ejecuta ESLint

# Prisma
npm run prisma:generate  # Genera cliente Prisma
npm run prisma:push      # Push schema a DB
npm run prisma:studio    # Abre Prisma Studio
npm run prisma:migrate   # Crea migración
```

## Estructura del Proyecto

```
fase/
├── prisma/
│   └── schema.prisma        # Esquema de base de datos
├── public/                  # Assets estáticos
├── src/
│   ├── app/                 # App Router (Next.js 14)
│   │   ├── (auth)/         # Rutas de autenticación
│   │   ├── (dashboard)/    # Dashboard principal
│   │   ├── api/            # API routes
│   │   ├── layout.tsx      # Layout raíz
│   │   └── page.tsx        # Landing page
│   ├── components/
│   │   ├── ui/            # Componentes shadcn/ui
│   │   ├── big-rocks/     # Componentes de Big Rocks
│   │   ├── calendar/      # Componentes de calendario
│   │   ├── gamification/  # Gamificación
│   │   └── tars/          # TAR components
│   ├── lib/
│   │   ├── db.ts          # Cliente Prisma
│   │   ├── auth.ts        # Configuración NextAuth
│   │   ├── n8n/           # Cliente n8n
│   │   └── utils.ts       # Utilidades
│   └── types/             # TypeScript types
├── .env.local              # Variables de entorno (no commitear)
├── .env.example            # Template de variables
└── README.md               # Este archivo
```

## Modelos de Datos

### Principales Entidades

- **User**: Usuarios con roles (USER, SUPERVISOR, ADMIN)
- **BigRock**: Objetivos mensuales con categorías FASE
- **TAR**: Tareas de Alto Rendimiento
- **Activity**: Actividades semanales/diarias
- **KeyPerson**: Personas clave para objetivos
- **KeyMeeting**: Reuniones críticas
- **Gamification**: Sistema de puntos y medallas

### Categorías FASE

- **Focus**: Enfoque y priorización
- **Atención**: Presencia y conciencia
- **Sistemas**: Procesos y estructuras
- **Energía**: Vitalidad y bienestar

## Despliegue en Vercel

### Paso 1: Conectar Repositorio

1. Ve a [vercel.com](https://vercel.com)
2. Importa tu repositorio de GitHub
3. Configura el proyecto

### Paso 2: Configurar Variables de Entorno

En Vercel, añade todas las variables de `.env.example`:

- `DATABASE_URL`
- `NEXTAUTH_URL` (tu dominio de Vercel)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `N8N_API_URL`
- `N8N_API_KEY`

### Paso 3: Deploy

```bash
git push origin main
```

Vercel desplegará automáticamente.

## Desarrollo

### Convenciones de Código

- TypeScript estricto (no usar `any`)
- Componentes funcionales con hooks
- Server Components por defecto
- Client Components solo cuando necesario (`'use client'`)
- Validación con Zod en formularios y API

### Roadmap

- [x] Setup inicial del proyecto
- [x] Configuración de Prisma y base de datos
- [x] Autenticación con NextAuth
- [ ] CRUD de Big Rocks
- [ ] CRUD de TAR
- [ ] Calendario mensual interactivo
- [ ] Sistema de gamificación
- [ ] Integración con n8n
- [ ] PWA y optimización móvil
- [ ] Tests unitarios e integración

## Documentación Adicional

Para más información sobre la metodología FASE, consulta [claude.md](claude.md).

## Contribución

Este proyecto sigue la metodología FASE creada por Agustín Peralt.

## Licencia

Privado - Todos los derechos reservados
