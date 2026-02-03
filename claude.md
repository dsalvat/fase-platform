# Plataforma FASE
## Plataforma de metodologia de gestio Estrategica - Ametller Origen

---

## Índice
1. [Objetivo del Sistema](#1-objetivo-del-sistema)
2. [Conceptos Clave](#2-conceptos-clave)
3. [Tareas de Alto Rendimiento (TAR)](#3-tareas-de-alto-rendimiento-tar)
4. [Planificación Temporal](#4-planificación-temporal)
5. [Personas y Reuniones Clave](#5-personas-y-reuniones-clave)
6. [Usuarios, Autenticación y Autorización](#6-usuarios-autenticación-y-autorización)
7. [Gestión de Calendario](#7-gestión-de-calendario)
8. [Principios de Diseño](#8-principios-de-diseño)
9. [Sistema de Evaluación con IA](#9-sistema-de-evaluación-con-ia)
10. [Arquitectura Técnica](#10-arquitectura-técnica)
11. [Sistema de Gamificación](#11-sistema-de-gamificación)
12. [Flujo de Trabajo](#12-flujo-de-trabajo)

---

## 1. Objetivo del Sistema

La aplicación tiene como objetivo ayudar al usuario a **planificar, ejecutar y hacer seguimiento** de sus objetivos mensuales (Big Rocks).

### Características principales
- **Plataforma web y móvil** para acceso multiplataforma
- **Integración con IA** para recomendaciones y feedback en tiempo real
- **Sistema de gamificación** para mantener la motivación
- **Planificación estructurada** mensual, semanal y diaria

El sistema asegura alineación entre objetivos mensuales, planificación semanal y ejecución diaria, con foco en tareas de alto rendimiento.

---

## 2. Conceptos Clave

### 2.1 Big Rocks (Objetivos Mensuales)

Los Big Rocks son los **objetivos mensuales** principales del usuario.

#### Características principales
- Siempre se planifican para el **mes siguiente**
- Cada mes activo tiene su propio conjunto de Big Rocks
- Los meses pasados son de **solo lectura**
- Los meses futuros deben ser **abiertos explícitamente** para su planificación

#### Estructura de un Big Rock

Cada Big Rock contiene:

| Campo | Descripción |
|-------|-------------|
| **Identificador único** | ID del objetivo |
| **Título** | Nombre descriptivo del objetivo |
| **Descripción** | Detalle completo del objetivo |
| **Indicador** | Métrica para medir el éxito |
| **Número de TAR** | Cantidad de Tareas de Alto Rendimiento |
| **Lista de TAR** | Tareas asociadas al objetivo |
| **Key People** | Personas clave para el logro |
| **Key Meetings** | Reuniones críticas necesarias |
| **Estado** | Planificado / En progreso / Finalizado |

---

## 3. Tareas de Alto Rendimiento (TAR)

### 3.1 Definición

Las TAR son **bloques de trabajo relevantes** que contribuyen directamente a la consecución del Big Rock.

### 3.2 Estructura de una TAR

Cada TAR incluye:

| Campo | Descripción |
|-------|-------------|
| **Identificador** | ID único de la TAR |
| **Descripción** | Detalle de la tarea |
| **Big Rock asociado** | Referencia al objetivo principal |
| **Actividades semanales** | Desglose por semana |
| **Actividades diarias** | Desglose por día |
| **Estado de progreso** | Porcentaje o estado de completitud |

### 3.3 Reglas importantes

- El **número de TAR debe definirse explícitamente** al crear el Big Rock
- Cada TAR debe tener una relación clara con el Big Rock
- Las TAR se descomponen en actividades semanales y diarias

---

## 4. Planificación Temporal

### 4.1 Planificación Mensual

**Cuándo**: Mes anterior al mes de ejecución

**Actividades**:
- El usuario define los Big Rocks del **mes siguiente**
- Se asignan TAR, personas clave y reuniones clave
- El sistema valida que los objetivos estén equilibrados dentro del marco FASE

**Validación del sistema**:
- Verifica distribución equilibrada entre categorías FASE
- Sugiere ajustes si hay desbalance

### 4.2 Planificación Semanal

**Cuándo**: Viernes anterior a la semana de ejecución

**Actividades**:
- Cada Big Rock se descompone en **acciones semanales**
- El sistema puede sugerir una distribución semanal basada en las TAR
- Se ajustan prioridades según progreso actual

### 4.3 Revisión Semanal (Viernes)

**Actividad obligatoria** que incluye:

#### Evaluación
- ¿Qué se ha completado?
- ¿Qué queda pendiente?
- ¿Qué obstáculos surgieron?

#### Replanificación
- Ajustar la semana siguiente
- Redistribuir TAR si es necesario
- Alinear actividades con Big Rocks

**Duración estimada**: 30–60 minutos

### 4.4 Seguimiento Diario

**Actividades diarias**:
- Reservar tiempo para ejecutar TAR
- Registrar progreso en la aplicación
- Completar actividades planificadas para la semana
- Breve reflexión sobre el día

**El sistema permite**:
- Registrar ejecución diaria
- Marcar actividades completadas
- Añadir notas y aprendizajes

---

## 5. Personas y Reuniones Clave

### 5.1 Key People (Personas Clave)

**Definición**: Personas identificadas que ayudan a lograr el objetivo

**Características**:
- Se registran con **nombre y apellidos**
- Deben identificarse **antes de iniciar la ejecución**
- Pueden asociarse a Big Rocks o TAR específicas

**Ejemplos**:
- Colaboradores en el proyecto
- Mentores o coaches
- Stakeholders importantes

### 5.2 Key Meetings (Reuniones Clave)

**Definición**: Reuniones necesarias para validar, refinar y tomar decisiones

**Propósito**:
- **Validar**: Confirmar que se va por el camino correcto
- **Refinar**: Ajustar detalles y enfoque
- **Tomar decisiones**: Resolver bloqueadores

**Asociación**:
- Se vinculan a Big Rocks específicos
- Pueden asociarse a TAR individuales
- Se programan con fecha y objetivo claro

---

## 6. Usuarios, Autenticación y Autorización

### 6.1 Autenticación

**Método**: Google Single Sign-On (SSO)

**Ventajas**:
- Acceso rápido y seguro
- No requiere crear contraseñas adicionales
- Integración nativa con ecosistema Google

### 6.2 Roles de Usuario

#### Usuario Estándar
**Permisos**:
- Gestiona sus propios Big Rocks, TAR y actividades
- Solo tiene acceso a su información personal
- Puede interactuar con la IA para feedback

**Limitaciones**:
- No puede ver información de otros usuarios
- No puede administrar permisos

#### Supervisor
**Permisos**:
- Todo lo del usuario estándar
- **Visualiza** los Big Rocks y TAR de usuarios supervisados
- Puede dar feedback a sus supervisados

**Características**:
- **Relación uno a uno**: Cada usuario tiene como máximo un supervisor
- Solo tiene visibilidad de lectura sobre supervisados
- No puede editar objetivos de otros usuarios

#### Administrador de la Aplicación
**Permisos**:
- Todo lo anterior
- **Gestión completa de usuarios**:
  - Alta de nuevos usuarios
  - Edición de perfiles
  - Deshabilitación temporal
  - Baja definitiva
- Asigna supervisor a cada usuario
- Gestiona configuración global

**Casos especiales**:
- Puede existir un usuario sin supervisor (supervisor global)
- Los administradores tienen visibilidad total del sistema

---

## 7. Gestión de Calendario

### 7.1 Vista Mensual

**Característica obligatoria**: La vista principal es mensual

### 7.2 Estados del Mes

| Estado | Descripción | Permisos |
|--------|-------------|----------|
| **Pasado** | Meses anteriores al actual | Solo lectura |
| **Actual** | Mes en curso | Editable (Big Rocks y TAR) |
| **Futuro** | Meses posteriores | Bloqueado hasta apertura manual |

### 7.3 Apertura de Meses Futuros

**Proceso**:
1. Usuario solicita abrir mes futuro
2. Sistema valida que no haya meses intermedios sin abrir
3. Se habilita la planificación para ese mes
4. Usuario puede empezar a crear Big Rocks

**Regla importante**: Los meses futuros deben abrirse explícitamente para permitir planificación anticipada.

---

## 8. Principios de Diseño

### Principios de la Metodología
1. **Gestión individual como base**: Cada usuario es dueño de sus objetivos
2. **Visibilidad jerárquica controlada**: Solo quienes necesitan ver, ven
3. **Planificación orientada a impacto**: Foco en lo que realmente importa
4. **Revisión continua y aprendizaje iterativo**: Mejora constante

### Principios del Sistema
1. **Motivación intrínseca**: El sistema motiva desde dentro
2. **Feedback constructivo**: La IA acompaña, no juzga
3. **Transparencia**: Claridad en objetivos y progreso
4. **Aprendizaje continuo**: Cada acción es una oportunidad de mejora
5. **Progreso visible**: El usuario ve su avance claramente

---

## 9. Sistema de Evaluación con IA

### 9.1 Objetivo del Sistema de IA

Proporcionar **feedback en tiempo real** sobre:
- Calidad de los objetivos (Big Rocks)
- Coherencia con la metodología FASE
- Viabilidad mensual, semanal y diaria
- Nivel de ejecución y consistencia del usuario

### 9.2 Criterios de Evaluación

La IA evalúa según:

| Criterio | Descripción |
|----------|-------------|
| **Claridad del objetivo** | ¿Está bien definido? |
| **Medibilidad del indicador** | ¿Se puede medir el éxito? |
| **Coherencia con categoría FASE** | ¿Encaja en la categoría seleccionada? |
| **Número adecuado de TAR** | ¿Cantidad apropiada de tareas? |
| **Realismo temporal** | ¿Es alcanzable en el tiempo estimado? |
| **Dependencias identificadas** | ¿Están claras las personas y reuniones clave? |

### 9.3 Output de la IA

Cada evaluación genera:

1. **Score de calidad** (0–100)
   - 0-40: Necesita trabajo significativo
   - 41-70: Objetivo aceptable con mejoras sugeridas
   - 71-100: Objetivo bien definido

2. **Observaciones clave**
   - Puntos fuertes del objetivo
   - Áreas de mejora específicas

3. **Recomendaciones de mejora**
   - Acciones concretas para mejorar el objetivo
   - Sugerencias de TAR adicionales
   - Refinamiento de indicadores

4. **Alertas de riesgo**
   - Señales de objetivos demasiado ambiciosos
   - Falta de dependencias identificadas
   - Desbalance en categorías FASE

### 9.4 Interacción Diaria

**Solicitud de la aplicación**:
- Registro de actividades del día
- Breve reflexión (1-3 líneas)

**Respuesta del sistema**:
- Feedback **inmediato y contextual**
- Reconocimiento de logros
- Sugerencias para mañana

**Filosofía**: El sistema actúa como **acompañante, no como juez**

---

## 10. Arquitectura Técnica

### 10.1 Frontend / App

**Plataforma**: Vercel
**Framework**: Next.js / React

**Responsabilidades**:
- Interfaz principal de interacción del usuario
- Gestión de objetivos, planificación y seguimiento
- Visualización de calendario y progreso
- Interfaz de gamificación

**Acceso**:
- Web responsive
- Progressive Web App (PWA) para móvil

### 10.2 Backend Lógico

**Tecnología**: Node.js / TypeScript

**Responsabilidades**:
- API REST para la aplicación
- Gestión de usuarios y autenticación
- Persistencia de datos
- Integración con n8n

### 10.3 n8n (Motor de Orquestación)

**Integración**: n8n-MCP y n8n-skills

**Recibe eventos de la aplicación**:
- Creación de objetivos (Big Rocks)
- Planificación semanal
- Registro diario de actividades
- Finalización de TAR

**Ejecuta flujos de evaluación**:
- Análisis de calidad de objetivos
- Generación de feedback personalizado
- Recomendaciones accionables
- Cálculo de puntos de gamificación

**Ventajas de n8n**:
- Orquestación visual de workflows
- Integración fácil con APIs de IA
- Escalabilidad
- Mantenimiento simplificado

### 10.4 Base de Datos

**Opciones**: PostgreSQL o MongoDB

**Modelos principales**:
- Users (usuarios con roles)
- BigRocks (objetivos mensuales)
- TARs (tareas de alto rendimiento)
- Activities (actividades diarias/semanales)
- KeyPeople (personas clave)
- KeyMeetings (reuniones clave)
- Gamification (puntos, medallas, ranking)

### 10.5 Autenticación

**Proveedor**: Google SSO

**Flujo**:
1. Usuario hace clic en "Iniciar sesión con Google"
2. Redirección a Google OAuth
3. Usuario autoriza la aplicación
4. Recepción de token
5. Creación/actualización de sesión
6. Redirección a dashboard

### 10.6 Despliegue

**Repositorio**: GitHub (GitHub MCP)
**CI/CD**: Integración automática GitHub → Vercel

**Flujo de despliegue**:
```
Código → GitHub (push) → Vercel (build automático) → Producción
```

**Ventajas**:
- Despliegue continuo automático
- Preview deployments para cada PR
- Rollback fácil a versiones anteriores

### 10.7 Skills y Herramientas

- **Frontend designer claude skills**: Para diseño de UI/UX
- **n8n-MCP**: Para gestión de workflows de n8n
- **n8n-skills**: Funcionalidades adicionales de n8n
- **GitHub MCP**: Para operaciones de Git y GitHub

---

## 11. Sistema de Gamificación

### 11.1 Sistema de Puntos

El usuario obtiene puntos por:

| Acción | Puntos | Frecuencia |
|--------|--------|------------|
| Definir un Big Rock | 50 | Por Big Rock |
| Planificar la semana | 30 | Semanal |
| Realizar revisión semanal | 40 | Semanal (viernes) |
| Registrar actividades diarias | 10 | Diaria |
| Completar una TAR | 25 | Por TAR |
| Mantener racha de 7 días | 100 | Por racha |
| Mantener racha de 30 días | 500 | Por racha |

### 11.2 Medallas

Medallas por hitos alcanzados:

#### Medalla de Constancia
- **Bronce**: 7 días consecutivos de registro
- **Plata**: 30 días consecutivos
- **Oro**: 90 días consecutivos
- **Diamante**: 365 días consecutivos

#### Medalla de Claridad
- **Bronce**: 5 Big Rocks con score >70
- **Plata**: 15 Big Rocks con score >80
- **Oro**: 50 Big Rocks con score >90

#### Medalla de Ejecución
- **Bronce**: 10 TAR completadas
- **Plata**: 50 TAR completadas
- **Oro**: 200 TAR completadas

#### Medalla de Mejora Continua
- **Bronce**: 10 revisiones semanales
- **Plata**: 50 revisiones semanales
- **Oro**: 200 revisiones semanales

### 11.3 Ranking

**Visibilidad**: Ranking visible entre usuarios (opcional por organización)

**Basado en**:
- **Actividad**: Frecuencia de uso
- **Consistencia**: Rachas mantenidas
- **Engagement**: Interacción con el sistema

**Importante**:
- **No mide resultados absolutos, solo engagement**
- Fomenta la participación, no la competencia destructiva
- Cada usuario compite consigo mismo principalmente

**Opciones de privacidad**:
- Usuario puede optar por no aparecer en ranking público
- Mantiene sus medallas y puntos personales

---

## 12. Flujo de Trabajo

### Diagrama de Ciclo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLANIFICACIÓN MENSUAL                       │
│  (Mes anterior)                                                 │
│                                                                 │
│  • Define Big Rocks (3-5 objetivos)                            │
│  • Asigna categoría FASE a cada uno                            │
│  • Define TAR por Big Rock                                     │
│  • Identifica Key People y Key Meetings                        │
│  • Valida equilibrio FASE                                      │
│                                                                 │
│  [IA evalúa y da score de calidad]                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PLANIFICACIÓN SEMANAL                        │
│  (Viernes anterior)                                             │
│                                                                 │
│  • Desglosa cada Big Rock en actividades semanales             │
│  • Asigna TAR a días específicos                               │
│  • Programa Key Meetings                                       │
│  • Define prioridades de la semana                             │
│                                                                 │
│  [Sistema sugiere distribución óptima]                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EJECUCIÓN DIARIA                           │
│  (Lunes a Viernes)                                              │
│                                                                 │
│  • Consulta actividades del día                                │
│  • Ejecuta TAR planificadas                                    │
│  • Registra progreso                                           │
│  • Completa reflexión breve                                    │
│  • Marca actividades completadas                               │
│                                                                 │
│  [IA da feedback diario y reconocimiento]                       │
│  [Sistema acumula puntos de gamificación]                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  REVISIÓN SEMANAL (Viernes)                     │
│  (30-60 minutos)                                                │
│                                                                 │
│  EVALUACIÓN:                                                    │
│  • ¿Qué TAR se completaron?                                    │
│  • ¿Qué quedó pendiente y por qué?                             │
│  • ¿Qué obstáculos surgieron?                                 │
│  • ¿Qué aprendizajes hubo?                                     │
│                                                                 │
│  REPLANIFICACIÓN:                                               │
│  • Ajustar semana siguiente                                    │
│  • Redistribuir TAR si es necesario                            │
│  • Reprogramar Key Meetings                                    │
│  • Actualizar prioridades                                      │
│                                                                 │
│  [IA analiza tendencias y sugiere mejoras]                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FEEDBACK IA                                │
│                                                                 │
│  • Score de calidad (0-100)                                    │
│  • Observaciones clave                                         │
│  • Recomendaciones accionables                                 │
│  • Alertas de riesgo                                           │
│  • Actualización de puntos y medallas                          │
│  • Sugerencias para siguiente ciclo                            │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ (El ciclo se repite)
                         │
                         ▼
            [Nueva semana / Nuevo mes]
```

### Frecuencias de Interacción

| Actividad | Frecuencia | Duración estimada |
|-----------|------------|-------------------|
| Planificación mensual | 1 vez/mes | 1-2 horas |
| Planificación semanal | 1 vez/semana | 20-30 minutos |
| Revisión semanal | 1 vez/semana | 30-60 minutos |
| Ejecución diaria | Diaria | 2-4 horas (trabajo en TAR) |
| Registro diario | Diaria | 5-10 minutos |

---

## Stack Tecnológico Completo

### Frontend
- **Framework**: Next.js 14+ (React 18+)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: Zustand o React Context
- **UI Components**: shadcn/ui o MUI
- **Calendario**: react-big-calendar o similar

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes o Express
- **Lenguaje**: TypeScript
- **ORM**: Prisma o TypeORM
- **Validación**: Zod

### Base de Datos
- **Opción 1**: PostgreSQL (Supabase o Neon)
- **Opción 2**: MongoDB Atlas

### Autenticación
- **Proveedor**: NextAuth.js con Google Provider
- **Sesiones**: JWT o Database Sessions

### IA y Orquestación
- **n8n**: Motor de workflows
- **LLM**: OpenAI GPT-4 o Claude API
- **Integraciones**: n8n-MCP, n8n-skills

### DevOps
- **Control de versiones**: GitHub
- **CI/CD**: GitHub Actions + Vercel
- **Hosting**: Vercel
- **Monitoreo**: Vercel Analytics

### Herramientas de Desarrollo
- **GitHub MCP**: Gestión de repositorio
- **Frontend designer claude skills**: Diseño de interfaces
- **ESLint + Prettier**: Calidad de código

---

## Próximos Pasos

### Fase 1: Setup Inicial
1. Inicializar repositorio en GitHub
2. Configurar proyecto Next.js con TypeScript
3. Configurar Vercel para despliegue automático
4. Setup base de datos (PostgreSQL/MongoDB)

### Fase 2: Autenticación
1. Implementar Google SSO
2. Crear sistema de roles (Usuario/Supervisor/Admin)
3. Proteger rutas según roles

### Fase 3: Core Features
1. Crear modelo de datos (Big Rocks, TAR)
2. Implementar CRUD de Big Rocks
3. Implementar CRUD de TAR
4. Calendario mensual con estados

### Fase 4: Planificación
1. Vista de planificación mensual
2. Vista de planificación semanal
3. Vista de seguimiento diario
4. Revisión semanal (viernes)

### Fase 5: IA Integration
1. Configurar n8n
2. Crear workflows de evaluación
3. Integrar feedback en tiempo real
4. Sistema de recomendaciones

### Fase 6: Gamificación
1. Sistema de puntos
2. Medallas y logros
3. Ranking (opcional)
4. Notificaciones de logros

### Fase 7: Mobile & Polish
1. PWA configuration
2. Responsive design
3. Performance optimization
4. Testing end-to-end

---

**Metodología FASE** - Sistema de gestión de objetivos de alto rendimiento
Documentación creada para desarrollo de la plataforma
