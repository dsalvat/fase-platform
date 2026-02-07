# Plataforma FASE
## Plataforma de Gestio Estrategica - Ametller Origen

---

## Indice
1. [Objetivo del Sistema](#1-objetivo-del-sistema)
2. [Aplicacion FASE](#2-aplicacion-fase)
3. [Aplicacion OKR](#3-aplicacion-okr)
4. [Usuarios, Autenticacion y Autorizacion](#4-usuarios-autenticacion-y-autorizacion)
5. [Administracion](#5-administracion)
6. [Chat IA](#6-chat-ia)
7. [Sistema de Gamificacion](#7-sistema-de-gamificacion)
8. [Arquitectura Tecnica](#8-arquitectura-tecnica)
9. [Estructura del Proyecto](#9-estructura-del-proyecto)
10. [Estado Actual y Pendientes](#10-estado-actual-y-pendientes)

---

## 1. Objetivo del Sistema

La plataforma es un sistema de gestion estrategica con **dos aplicaciones** independientes:

- **FASE**: Planificacion y seguimiento de objetivos mensuales personales (Big Rocks) con ciclos semanales y diarios
- **OKR**: Gestion de Objetivos y Resultados Clave trimestrales a nivel de equipo

### Caracteristicas principales
- **Multi-aplicacion**: Los usuarios pueden tener acceso a FASE, OKR o ambas, y cambiar entre ellas con el App Switcher
- **Multi-empresa**: Soporte para multiples organizaciones (Companies) con usuarios compartidos
- **Multi-idioma**: Interfaz disponible en Espanol (ES), Catalan (CA) e Ingles (EN)
- **Plataforma web responsive** con soporte movil
- **Integracion con IA** (Claude/Anthropic) para chat y feedback
- **Sistema de gamificacion** independiente por aplicacion

---

## 2. Aplicacion FASE

### 2.1 Conceptos Clave

#### Big Rocks (Objetivos Mensuales)

Los Big Rocks son los objetivos mensuales principales del usuario.

| Campo | Descripcion |
|-------|-------------|
| **Titulo** | Nombre del objetivo (3-100 caracteres) |
| **Descripcion** | Detalle completo (10-2000 caracteres) |
| **Indicador** | Metrica de exito / KPI (5-500 caracteres) |
| **Numero de TAR** | Cantidad de tareas a crear (1-20) |
| **Mes** | Mes de ejecucion |
| **Personas Clave** | Usuarios de la empresa vinculados |
| **Reuniones Clave** | Reuniones con titulo, objetivo, decision esperada, fecha |

**Estados de un Big Rock:**
```
CREADO → CONFIRMADO → EN_PROGRESO → FINALIZADO
                   → FEEDBACK_RECIBIDO (via supervisor)
```

- **CREADO**: Campos editables, borrador
- **CONFIRMADO**: Campos principales bloqueados (titulo, descripcion, indicador, mes). Se pueden seguir gestionando TARs, reuniones y personas clave
- **EN_PROGRESO / FINALIZADO**: Estados de progreso durante la ejecucion

#### TAR (Tareas de Alto Rendimiento)

Bloques de trabajo que contribuyen directamente al Big Rock.

| Campo | Descripcion |
|-------|-------------|
| **Descripcion** | Detalle de la tarea |
| **Estado** | PENDIENTE / EN_PROGRESO / COMPLETADA |
| **Progreso** | Porcentaje 0-100% |
| **Actividades** | Desglose semanal y diario |

**Calculo de progreso**: El progreso del Big Rock = media del progreso de todas sus TARs.

#### Activities (Actividades)

Desglose de las TARs en acciones concretas:
- **Tipo SEMANAL**: Planificacion de la semana
- **Tipo DIARIA**: Tareas del dia

#### Key Meetings (Reuniones Clave)

Reuniones para validar, refinar y tomar decisiones sobre Big Rocks:
- Titulo, objetivo, decision esperada, fecha, descripcion
- Se vinculan a un Big Rock especifico

#### Key People (Personas Clave)

Usuarios de la empresa identificados como necesarios para lograr el objetivo.

### 2.2 Workflow FASE - Paso a Paso

#### Paso 1: Planificacion Mensual

```
1. Abrir mes futuro
   └── Ir a Calendario → Si el mes esta bloqueado, pulsar "Abrir Mes"
       (Los meses deben abrirse secuencialmente)

2. Crear Big Rocks (3-5 objetivos)
   └── /big-rocks → "Nuevo Big Rock"
       ├── Rellenar: titulo, descripcion, indicador, num. TARs
       ├── Asignar personas clave
       └── Crear reuniones clave

3. Confirmar cada Big Rock
   └── Abrir Big Rock → Pulsar "Confirmar"
       (Los campos principales se bloquean)

4. Crear TARs para cada Big Rock
   └── Dentro del Big Rock → "Nueva TAR"
       └── Definir descripcion y actividades

5. Confirmar planificacion mensual
   └── Solo aparece cuando TODOS los Big Rocks estan confirmados
       └── El supervisor puede ver la planificacion
```

#### Paso 2: Ejecucion Semanal

```
1. Vista semanal del calendario
   └── /calendario/semana/[semana]
       ├── Ver actividades distribuidas por dia
       └── Crear/actualizar actividades semanales por TAR

2. Seguimiento de TARs
   └── Actualizar progreso (%) de cada TAR
       └── El progreso del Big Rock se recalcula automaticamente
```

#### Paso 3: Seguimiento Diario

```
1. Vista diaria del calendario
   └── /calendario/dia/[fecha]
       ├── Ver actividades del dia
       ├── Ver reuniones clave programadas
       └── Marcar actividades como completadas

2. Registrar progreso
   └── Actualizar estado de TARs y actividades
```

#### Paso 4: Revision Semanal (Viernes)

```
1. Evaluar la semana
   ├── Que TARs se completaron?
   ├── Que quedo pendiente y por que?
   └── Que obstaculos surgieron?

2. Replanificar
   ├── Ajustar actividades de la semana siguiente
   ├── Redistribuir TARs si es necesario
   └── Actualizar prioridades
```

### 2.3 Supervision FASE

El supervisor tiene una vista de solo lectura de sus supervisados:

- **Pagina de supervisor** (`/supervisor`): Lista de supervisados con estado de planificacion
- **Vista de planificacion** (`/supervisor/[userId]/[month]`): Big Rocks, TARs, reuniones y personas clave del supervisado
- **Feedback**: El supervisor puede dejar comentarios y valoracion en:
  - Cada Big Rock individual
  - La planificacion mensual global
- La vista solo esta disponible cuando el supervisado ha confirmado su planificacion mensual

### 2.4 Calendario FASE

Tres niveles de vista:

| Vista | Ruta | Contenido |
|-------|------|-----------|
| **Mensual** | `/calendario` | Cuadricula del mes con resumen de actividades por dia |
| **Semanal** | `/calendario/semana/[week]` | Actividades distribuidas por dia de la semana |
| **Diaria** | `/calendario/dia/[date]` | Actividades y reuniones del dia |

**Estados del mes**:
- **Pasado**: Solo lectura
- **Actual**: Editable
- **Futuro**: Bloqueado hasta apertura manual (secuencial)

---

## 3. Aplicacion OKR

### 3.1 Conceptos Clave

#### Trimestres (Quarters)

Periodos trimestrales (Q1, Q2, Q3, Q4) que enmarcan los objetivos.
- Solo un trimestre activo por empresa a la vez
- Los trimestres deben ser activados por un admin
- Duracion automatica: 12 semanas

#### Equipos (Teams)

Agrupaciones de usuarios para trabajar objetivos compartidos.

**Roles de equipo:**
| Rol | Permisos |
|-----|----------|
| **RESPONSABLE** | Crear/editar/eliminar objetivos, gestionar equipo |
| **EDITOR** | Editar objetivos y Key Results existentes |
| **VISUALIZADOR** | Solo lectura |
| **DIRECTOR** | Solo lectura (supervisores) |

#### Objetivos (Objectives)

Metas trimestrales de un equipo.

| Campo | Descripcion |
|-------|-------------|
| **Titulo** | Nombre del objetivo |
| **Descripcion** | Contexto e importancia |
| **Indicador** | Metrica de exito |
| **Estado** | DRAFT / ACTIVE / COMPLETED / CANCELLED |
| **Progreso** | Calculado automaticamente (media de Key Results) |
| **Equipo** | Equipo propietario |
| **Owner** | Usuario creador |

#### Key Results (Resultados Clave)

Metricas medibles que indican el avance del objetivo.

| Campo | Descripcion |
|-------|-------------|
| **Titulo** | Que se mide |
| **Indicador** | Descripcion de la metrica |
| **Valor Inicial** | Punto de partida |
| **Valor Objetivo** | Meta a alcanzar |
| **Valor Actual** | Progreso actual |
| **Unidad** | %, euros, # (unidades) |
| **Responsable** | Usuario asignado |

#### Key Activities (Actividades Clave)

Sub-tareas asociadas a un Key Result con fecha limite y asignacion.

#### Actualizaciones Semanales (Key Result Updates)

Progreso semanal por Key Result:
- Una actualizacion por semana por Key Result (semanas 1-12)
- Incluye: nuevo valor del indicador + comentario
- Sistema muestra si la semana actual esta actualizada o pendiente

### 3.2 Workflow OKR - Paso a Paso

#### Paso 1: Setup del Trimestre (Solo Admin)

```
1. Activar trimestre
   └── /okr/trimestres → "Activar Trimestre"
       ├── Seleccionar anyo y trimestre (Q1-Q4)
       └── Sistema calcula fechas automaticamente
```

#### Paso 2: Crear y Gestionar Equipos

```
1. Crear equipo (Solo Admin)
   └── /okr/equipos/nuevo
       └── Nombre y descripcion

2. Anadir miembros
   └── /okr/equipos/[id]
       └── "Agregar miembro" → Asignar rol (RESPONSABLE/EDITOR/VISUALIZADOR)
```

#### Paso 3: Crear Objetivos

```
1. Nuevo objetivo (RESPONSABLE)
   └── /okr/objetivos/nuevo
       ├── Seleccionar equipo
       ├── Titulo (obligatorio)
       ├── Descripcion (opcional)
       └── Indicador de exito (obligatorio)

2. El objetivo se crea en estado DRAFT con progreso 0%
```

#### Paso 4: Definir Key Results

```
1. Abrir objetivo → "Agregar Resultado Clave"
   ├── Titulo
   ├── Indicador
   ├── Valor inicial y valor objetivo
   ├── Unidad (%, euros, #...)
   └── Asignar responsable
```

#### Paso 5: Ejecucion Semanal (Ciclo Principal)

```
Cada semana durante el trimestre (semanas 1-12):

1. Abrir objetivo → Para cada Key Result:
   ├── "Agregar actualizacion semanal"
   │   ├── Nuevo valor del indicador
   │   └── Comentario (progreso, obstaculos, logros)
   └── Sistema muestra:
       ├── Badge "Actualizado" o "Pendiente actualizacion"
       ├── Barra de progreso (valor actual vs objetivo)
       └── Historial de actualizaciones

2. Gestionar actividades
   ├── Crear actividades con fecha limite
   ├── Marcar completadas
   └── Ver ratio: "3/5 actividades completadas"
```

#### Paso 6: Seguimiento de Progreso

```
- Progreso del objetivo = media de todos sus Key Results
- Colores: verde (>=70%), ambar (30-70%), gris (<30%)
- Historial visible: "Ver historial 6/12" semanas
```

### 3.3 Dashboard OKR

La pagina `/okr` muestra:
- Estadisticas del trimestre activo
- Objetivos del usuario y sus equipos
- Progreso global

---

## 4. Usuarios, Autenticacion y Autorizacion

### 4.1 Autenticacion

- **Metodo**: Google Single Sign-On (SSO) via NextAuth.js
- **Estrategia de sesion**: JWT
- **Requisito**: El usuario debe ser invitado previamente por un admin (email en la BD)
- **Primer login**: Estado cambia de INVITED a ACTIVE automaticamente

### 4.2 Roles de Usuario

| Rol | Descripcion |
|-----|-------------|
| **USER** | Gestiona sus propios objetivos (FASE y/o OKR) |
| **SUPERVISOR** | Todo lo anterior + visualiza objetivos de sus supervisados (solo lectura) + da feedback |
| **ADMIN** | Todo lo anterior + gestiona usuarios de su empresa (invitar, roles, estado, supervisor, acceso a apps) |
| **SUPERADMIN** | Todo lo anterior + gestiona todas las empresas y usuarios globalmente |

### 4.3 Estados del Usuario

| Estado | Descripcion |
|--------|-------------|
| **INVITED** | Invitado pero nunca ha hecho login |
| **ACTIVE** | Usuario activo |
| **DEACTIVATED** | Deshabilitado por admin (no puede hacer login) |

### 4.4 Multi-Empresa

- Los usuarios pueden pertenecer a multiples empresas (relacion M:N via `UserCompany`)
- El usuario selecciona la empresa activa con el Company Switcher
- Cada empresa tiene sus propios Big Rocks, equipos OKR, trimestres, etc.

### 4.5 Multi-Aplicacion

- Cada usuario tiene acceso a una o mas aplicaciones (FASE/OKR) via `UserApp`
- El App Switcher permite cambiar entre aplicaciones
- La navegacion se adapta segun la aplicacion activa:
  - **FASE**: Home, Big Rocks, Calendario
  - **OKR**: Dashboard, Objetivos, Equipos, Trimestres

### 4.6 Supervision

- Relacion uno a uno: cada usuario tiene como maximo un supervisor
- El supervisor ve la planificacion de sus supervisados (solo lectura)
- El supervisor puede dar feedback (comentario + valoracion)

---

## 5. Administracion

### 5.1 Gestion de Usuarios (`/admin/usuarios`)

Accesible para ADMIN y SUPERADMIN.

Funcionalidades:
- **Invitar usuarios**: Por email, el usuario recibe acceso al hacer login con Google
- **Cambiar rol**: Asignar USER, SUPERVISOR, ADMIN
- **Cambiar estado**: Activar o desactivar usuarios
- **Asignar supervisor**: Relacion 1:1
- **Gestionar acceso a apps**: Activar/desactivar FASE y/o OKR por usuario

Estadisticas: total usuarios, por rol, por estado.

### 5.2 Gestion de Empresas (`/admin/empresas`)

Solo accesible para SUPERADMIN.

Funcionalidades:
- Crear nuevas empresas
- Editar informacion (nombre, slug, logo)
- Eliminar empresas
- Ver estadisticas globales

---

## 6. Chat IA

### Integracion

- **Motor**: Anthropic Claude SDK
- **Interfaz**: Panel deslizable accesible desde cualquier pagina

### Funcionalidades

- Chat conversacional con IA
- Historial de conversaciones con titulos
- Sistema de creditos diarios: **10 mensajes/dia** (reset diario)
- Marcado de mensajes leidos/no leidos
- Eliminar conversaciones

### Modelos de datos

- `ChatConversation`: Conversaciones por usuario
- `ChatMessage`: Mensajes individuales con tracking de uso
- `UserChatCredits`: Creditos diarios por usuario

---

## 7. Sistema de Gamificacion

### 7.1 Gamificacion FASE

#### Puntos

| Accion | Puntos |
|--------|--------|
| Crear Big Rock | 50 |
| Planificar semana | 30 |
| Revision semanal | 40 |
| Registro diario | 10 |
| Completar TAR | 25 |
| Racha de 7 dias | 100 |
| Racha de 30 dias | 500 |

#### Medallas (4 tipos x 4 niveles: Bronce, Plata, Oro, Diamante)

| Medalla | Bronce | Plata | Oro | Diamante |
|---------|--------|-------|-----|----------|
| **Constancia** | 7 dias racha | 30 dias | 90 dias | 365 dias |
| **Claridad** | 5 Big Rocks score >70 | 15 con >80 | 50 con >90 | 100 con >90 |
| **Ejecucion** | 10 TARs completadas | 50 | 200 | 500 |
| **Mejora Continua** | 10 revisiones | 50 | 200 | 500 |

#### Niveles

10 niveles basados en puntos acumulados (0 a 10.000+).

#### Contadores

- `bigRocksCreated`, `tarsCompleted`, `weeklyReviews`, `dailyLogs`
- `currentStreak`, `longestStreak`

### 7.2 Gamificacion OKR

#### Puntos

| Accion | Puntos |
|--------|--------|
| Crear Objetivo | 50 |
| Crear Key Result | 25 |
| Completar Key Result | 100 |
| Completar Actividad | 10 |
| Objetivo al 100% | 200 |

#### Niveles

- Nivel = (Puntos / 500) + 1
- Barra de progreso hacia el siguiente nivel

---

## 8. Arquitectura Tecnica

### Stack

| Capa | Tecnologia |
|------|-----------|
| **Framework** | Next.js 16 + React 19 |
| **Lenguaje** | TypeScript |
| **Base de datos** | PostgreSQL + Prisma ORM |
| **Autenticacion** | NextAuth.js v4 + Google OAuth 2.0 |
| **Estilos** | Tailwind CSS 3.4 |
| **Componentes UI** | Radix UI + shadcn/ui |
| **Iconos** | lucide-react |
| **Estado** | Zustand + React Context |
| **Calendario** | react-big-calendar |
| **i18n** | next-intl (ES, CA, EN) |
| **IA** | Anthropic Claude SDK |
| **Dark mode** | next-themes |
| **Validacion** | Zod |
| **Fechas** | date-fns |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **Hosting** | Vercel |
| **Repositorio** | GitHub |
| **CI/CD** | GitHub → Vercel (deploy automatico) |

### Flujo de Autenticacion

```
1. Usuario pulsa "Iniciar sesion con Google"
2. Redireccion a Google OAuth
3. Callback a NextAuth.js
4. Verificacion: usuario invitado en BD?
   ├── NO → Redirigir a /auth/error?error=NotInvited
   ├── DEACTIVATED → Redirigir a /auth/error?error=UserDeactivated
   └── SI → Activar usuario si INVITED, crear sesion JWT
5. JWT incluye: id, role, status, companies[], apps[], currentCompanyId, currentAppCode
6. Redireccion al dashboard
```

### Despliegue

```
Codigo → GitHub (push) → Vercel (build automatico) → Produccion
```

---

## 9. Estructura del Proyecto

```
fase-platform/
├── prisma/
│   ├── schema.prisma          # Modelos de datos
│   └── seed.ts                # Datos iniciales
├── messages/
│   ├── es.json                # Traducciones espanol
│   ├── ca.json                # Traducciones catalan
│   └── en.json                # Traducciones ingles
├── src/
│   ├── app/
│   │   ├── api/auth/          # NextAuth API routes
│   │   ├── actions/           # Server Actions
│   │   │   ├── big-rocks.ts
│   │   │   ├── tars.ts
│   │   │   ├── planning.ts
│   │   │   ├── apps.ts
│   │   │   ├── chat.ts
│   │   │   ├── companies.ts
│   │   │   └── ...
│   │   └── (dashboard)/       # Paginas protegidas
│   │       ├── home/          # Dashboard principal
│   │       ├── big-rocks/     # FASE: Big Rocks CRUD
│   │       │   └── [id]/
│   │       │       ├── tars/          # TARs del Big Rock
│   │       │       ├── meetings/      # Reuniones clave
│   │       │       └── edit/
│   │       ├── calendario/    # FASE: Calendario
│   │       │   ├── semana/[week]/
│   │       │   └── dia/[date]/
│   │       ├── supervisor/    # FASE: Vista de supervisor
│   │       │   └── [userId]/[month]/
│   │       ├── okr/           # OKR: Modulo completo
│   │       │   ├── objetivos/
│   │       │   ├── equipos/
│   │       │   ├── trimestres/
│   │       │   └── gamificacion/
│   │       ├── gamificacion/  # FASE: Gamificacion
│   │       ├── logros/        # FASE: Medallas
│   │       ├── actividad/     # Timeline de actividad
│   │       ├── admin/         # Administracion
│   │       │   ├── usuarios/
│   │       │   └── empresas/
│   │       └── perfil/        # Perfil de usuario
│   ├── components/
│   │   ├── big-rocks/         # Componentes FASE
│   │   ├── calendar/          # Componentes calendario
│   │   ├── tars/              # Componentes TAR
│   │   ├── activities/        # Componentes actividades
│   │   ├── key-meetings/      # Componentes reuniones
│   │   ├── okr/               # Componentes OKR
│   │   ├── gamification/      # Componentes gamificacion
│   │   ├── chat/              # Chat con IA
│   │   ├── admin/             # Componentes admin
│   │   ├── app-switcher.tsx   # Cambio FASE/OKR
│   │   ├── mobile-nav.tsx     # Navegacion movil
│   │   ├── language-selector.tsx
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── auth-options.ts    # Configuracion NextAuth
│   │   ├── db.ts              # Cliente Prisma
│   │   └── gamification.ts    # Logica de gamificacion
│   └── i18n/
│       ├── config.ts          # Configuracion idiomas
│       └── request.ts         # Setup server-side
├── next.config.ts
├── package.json
└── CLAUDE.md                  # Este archivo
```

---

## 10. Estado Actual y Pendientes

### Implementado

- FASE: Big Rocks CRUD completo con confirmacion, TARs, actividades, reuniones y personas clave
- FASE: Calendario mensual/semanal/diario con gestion de meses
- FASE: Vista de supervisor con feedback
- FASE: Gamificacion completa (puntos, medallas, niveles, rachas)
- OKR: Trimestres, equipos, objetivos, Key Results con actualizaciones semanales
- OKR: Gamificacion basica (puntos y niveles)
- Autenticacion Google SSO con sistema de invitaciones
- Multi-empresa y multi-aplicacion con switchers
- Internacionalizacion (ES, CA, EN)
- Chat con IA (Claude) con creditos diarios
- Administracion de usuarios y empresas
- Dark mode
- Responsive design / mobile

### Pendiente

- **Categorias FASE**: El framework menciona categorias F-A-S-E para clasificar Big Rocks, pero no esta implementado en el schema ni UI
- **Evaluacion IA automatica**: Los campos `aiScore`, `aiObservations`, `aiRecommendations`, `aiRisks` existen en el modelo BigRock pero no hay workflow automatico (n8n) que los genere
- **Integracion n8n**: Preparada conceptualmente pero sin workflows activos
- **PWA**: Configuracion de Progressive Web App

---

**Plataforma FASE** - Sistema de gestion estrategica de alto rendimiento
