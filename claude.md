# Empanadas System - Documentación del Proyecto

**Objetivo**: Crear el mejor sistema gastronómico del mundo

**Última actualización**: 2026-01-24 (Sistema de Proveedores y Cajeros)

---

## 1. VISIÓN GENERAL DEL PROYECTO

### Descripción
Sistema de Punto de Venta (POS) full-stack diseñado para negocios gastronómicos, con enfoque inicial en una empanadora. El sistema maneja inventario, ventas, clientes y personal con arquitectura moderna y escalable.

### Tipo de Aplicación
Aplicación web full-stack con API REST y frontend SPA (Single Page Application)

---

## 2. STACK TECNOLÓGICO

### Backend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Python | - | Lenguaje principal |
| FastAPI | Latest | Framework web async para REST API |
| PostgreSQL | 16 | Base de datos relacional |
| SQLAlchemy | Latest | ORM (Object-Relational Mapping) |
| Alembic | Latest | Sistema de migraciones de BD |
| Pydantic | Latest | Validación de datos (vía FastAPI) |
| Uvicorn | Latest | Servidor ASGI |
| psycopg2-binary | Latest | Adaptador PostgreSQL |

### Frontend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| React | 19 | Framework UI |
| TypeScript | Latest | Tipado estático |
| Vite | Latest | Build tool y dev server |
| React Router DOM | 7 | Navegación client-side |
| Tailwind CSS | 4 | Framework CSS utility-first |
| PostCSS | Latest | Procesador CSS |
| Radix UI | Latest | Componentes UI accesibles |
| Lucide React | Latest | Iconos |
| Sonner | Latest | Notificaciones toast |
| clsx, CVA, tailwind-merge | Latest | Utilidades CSS |

### DevOps
| Tecnología | Propósito |
|-----------|-----------|
| Docker Compose | Containerización de PostgreSQL |
| npm | Gestión de paquetes frontend |
| pip | Gestión de paquetes backend |

---

## 3. ARQUITECTURA DEL SISTEMA

### Patrón Arquitectónico
**Cliente-Servidor REST con SPA**

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │  HTTP   │                 │  SQL    │                 │
│  React Frontend │◄───────►│  FastAPI Backend│◄───────►│   PostgreSQL    │
│  (Port 5173)    │  JSON   │  (Port 8000)    │         │   (Port 5433)   │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Principios de Diseño

1. **Separation of Concerns**
   - Modelos (SQLAlchemy) - Capa de datos
   - Esquemas (Pydantic) - Validación
   - Routers (FastAPI) - Endpoints API
   - Componentes (React) - UI

2. **Dependency Injection**
   - FastAPI `Depends()` para sesiones de BD
   - `get_db()` maneja ciclo de vida de sesión

3. **Component-Based Architecture**
   - Componentes React reutilizables
   - Radix UI como base accesible
   - Tailwind para estilos consistentes

4. **Type Safety**
   - TypeScript en frontend
   - Pydantic en backend
   - Contratos de API tipados

---

## 4. ESTRUCTURA DE DIRECTORIOS

```
empanadas-system/
│
├── backend/                          # Backend FastAPI
│   ├── app/
│   │   ├── core/
│   │   │   └── database.py          # Config BD, engine, sessions
│   │   ├── models/                  # SQLAlchemy Models
│   │   │   ├── product.py           # Productos (categoría, precio, stock)
│   │   │   ├── user.py              # Usuarios del sistema (staff)
│   │   │   ├── customer.py          # Clientes (compradores)
│   │   │   └── sale.py              # Ventas y items de venta
│   │   ├── routers/                 # API Endpoints
│   │   │   ├── product.py           # GET/POST productos
│   │   │   ├── user.py              # Gestión de usuarios
│   │   │   └── pos.py               # Operaciones POS (ventas, clientes)
│   │   ├── schemas/                 # Pydantic Schemas (validación)
│   │   │   ├── product.py           # Schemas de productos
│   │   │   ├── user.py              # Schemas de usuarios
│   │   │   ├── customer.py          # Schemas de clientes
│   │   │   └── pos.py               # Schemas de ventas
│   │   └── main.py                  # App FastAPI principal, CORS, routers
│   ├── alembic/                     # Migraciones de base de datos
│   │   ├── versions/                # Scripts de migración
│   │   └── env.py                   # Config Alembic
│   ├── alembic.ini                  # Configuración Alembic
│   ├── requirements.txt             # Dependencias Python
│   └── venv/                        # Virtual environment
│
├── frontend/                         # Frontend React
│   ├── src/
│   │   ├── pages/                   # Páginas/Vistas principales
│   │   │   ├── POS.tsx              # Interfaz POS principal
│   │   │   ├── Productos.tsx        # Gestión de productos
│   │   │   ├── Compras.tsx          # Compras/Procurement (stub)
│   │   │   └── Usuarios.tsx         # Gestión de usuarios
│   │   ├── layout/
│   │   │   └── AppLayout.tsx        # Layout principal con sidebar
│   │   ├── components/
│   │   │   └── ui/                  # Componentes UI reutilizables
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── input.tsx
│   │   │       ├── table.tsx
│   │   │       └── ...              # Otros componentes
│   │   ├── lib/
│   │   │   ├── api.ts               # Cliente API genérico
│   │   │   ├── products.ts          # Funciones API de productos
│   │   │   └── utils.ts             # Utilidades
│   │   ├── types/
│   │   │   └── product.ts           # Definiciones TypeScript
│   │   ├── data/
│   │   │   └── users.ts             # Datos mock de usuarios
│   │   ├── hooks/
│   │   │   └── use-mobile.tsx       # Hook detección mobile
│   │   ├── App.tsx                  # Router principal
│   │   ├── main.tsx                 # Entry point React
│   │   └── index.css                # Estilos globales
│   ├── public/                      # Assets estáticos
│   ├── vite.config.ts               # Configuración Vite
│   ├── tsconfig.json                # Configuración TypeScript
│   ├── tailwind.config.js           # Configuración Tailwind
│   ├── postcss.config.js            # Configuración PostCSS
│   ├── package.json                 # Dependencias y scripts npm
│   └── index.html                   # HTML entry point
│
├── docker-compose.yml               # PostgreSQL container
├── cargar_productos.py              # Script carga masiva desde CSV
├── productos.csv                    # Datos de productos (26KB)
└── claude.md                        # Este documento
```

---

## 5. MODELO DE DATOS

### Diagrama de Relaciones

```
┌─────────────┐
│   Users     │     (Sistema - Staff)
│─────────────│
│ id (PK)     │
│ username    │
│ email       │
│ is_active   │
│ created_at  │
└─────────────┘

┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Products   │         │  SaleItems   │         │    Sales    │
│─────────────│         │──────────────│         │─────────────│
│ id (PK)     │◄───────┤ product_id   │    ┌───►│ id (PK)     │
│ category    │    1..N │ sale_id      │─┬─┘ N..1│ created_at  │
│ subcategory │         │ quantity     │ │       │ customer_id │─┐
│ name        │         │ unit_price   │ │       │ is_invoiced │ │
│ variant     │         │ subtotal     │ │       │ total_ars   │ │
│ price_ars   │         └──────────────┘ │       └─────────────┘ │
│ description │                          │                        │
│ stock       │                          │       ┌─────────────┐ │
│ is_active   │                          └───────┤  Customers  │◄┘
└─────────────┘                              1..N│─────────────│0..1
                                                  │ id (PK)     │
                                                  │ name        │
                                                  │ phone       │
                                                  └─────────────┘
```

### Entidades Detalladas

#### Products (Productos)
```python
- id: Integer (PK, autoincrement)
- category: String(100) - Categoría principal
- subcategory: String(100) - Subcategoría
- name: String(200) - Nombre del producto
- variant: String(100), nullable - Variante (tamaño, sabor, etc.)
- price_ars: Integer - Precio en pesos argentinos
- description: Text, nullable - Descripción detallada
- stock_qty: Integer, default=0 - Stock disponible (ACTUALIZADO 2026-01-24)
- is_active: Boolean, default=True - Producto activo
```

#### Users (Usuarios del Sistema)
```python
- id: Integer (PK, autoincrement)
- username: String(50), unique - Nombre de usuario
- email: String(100), unique - Email
- is_active: Boolean, default=True - Usuario activo
- created_at: DateTime - Fecha de creación
```

#### Customers (Clientes)
```python
- id: Integer (PK, autoincrement)
- name: String(200) - Nombre completo
- phone: String(20), nullable - Teléfono
```

#### Sales (Ventas)
```python
- id: Integer (PK, autoincrement)
- created_at: DateTime - Fecha y hora de venta
- customer_id: Integer (FK -> customers.id), nullable
- is_invoiced: Boolean, default=False - Venta facturada
- total_ars: Decimal(10,2) - Total de la venta
```

#### SaleItems (Items de Venta)
```python
- id: Integer (PK, autoincrement)
- sale_id: Integer (FK -> sales.id)
- product_id: Integer (FK -> products.id)
- quantity: Integer - Cantidad vendida
- unit_price: Decimal(10,2) - Precio unitario al momento de venta
- subtotal: Decimal(10,2) - quantity * unit_price
```

#### StockMovements (Movimientos de Stock) - NUEVO 2026-01-24
```python
- id: Integer (PK, autoincrement)
- product_id: Integer (FK -> products.id, CASCADE)
- movement_type: String(20) - Tipo: 'entrada', 'salida', 'ajuste'
- quantity: Integer - Cantidad del movimiento (siempre positivo)
- reason: Text, nullable - Motivo del movimiento
- previous_stock: Integer - Stock antes del movimiento
- new_stock: Integer - Stock después del movimiento
- user_id: Integer (FK -> users.id, SET NULL), nullable - Usuario que realizó
- sale_id: Integer (FK -> sales.id, SET NULL), nullable - Venta asociada
- created_at: DateTime - Timestamp del movimiento

Constraints:
- movement_type IN ('entrada', 'salida', 'ajuste')
- quantity > 0
- Validación de coherencia entre previous_stock, quantity y new_stock

Indices:
- idx_stock_movements_product (product_id)
- idx_stock_movements_created (created_at DESC)
- idx_stock_movements_type (movement_type)
```

---

## 6. API ENDPOINTS

### Base URL
```
http://127.0.0.1:8000
```

### Productos (`/products`)

#### GET /products
Lista todos los productos activos
```typescript
Response: Product[]
{
  id: number
  category: string
  subcategory: string
  name: string
  variant: string | null
  price_ars: number
  description: string | null
  stock: number
  is_active: boolean
}
```

#### POST /products
Crea un nuevo producto
```typescript
Request: {
  category: string
  subcategory: string
  name: string
  variant?: string
  price_ars: number
  description?: string
  stock?: number
  is_active?: boolean
}

Response: Product
```

### Usuarios (`/users`)

#### GET /users
Lista todos los usuarios
```typescript
Response: User[]
{
  id: number
  username: string
  email: string
  is_active: boolean
  created_at: string
}
```

#### POST /users
Crea un nuevo usuario
```typescript
Request: {
  username: string
  email: string (validación email)
  is_active?: boolean
}

Response: User
```

### POS (`/pos`)

#### GET /pos/customers
Busca clientes por nombre o teléfono
```typescript
Query params: ?search=texto
Response: Customer[]
{
  id: number
  name: string
  phone: string | null
}
```

#### POST /pos/customers
Crea un nuevo cliente
```typescript
Request: {
  name: string
  phone?: string
}

Response: Customer
```

#### POST /pos/sales
Registra una nueva venta
```typescript
Request: {
  customer_id?: number
  is_invoiced?: boolean
  items: [
    {
      product_id: number
      quantity: number
    }
  ]
}

Response: Sale con items incluidos
```

#### GET /pos/sales/recent
Obtiene las ventas recientes (últimas 10)
```typescript
Response: Sale[]
{
  id: number
  created_at: string
  customer_id: number | null
  is_invoiced: boolean
  total_ars: number
  items: SaleItem[]
}
```

### Stock (`/stock`) - NUEVO 2026-01-24

#### POST /stock/movements
Registra un nuevo movimiento de stock (entrada/salida/ajuste)
```typescript
Request: {
  product_id: number
  movement_type: "entrada" | "salida" | "ajuste"
  quantity: number (> 0)
  reason?: string
  user_id?: number
  sale_id?: number
}

Response: StockMovement
{
  id: number
  product_id: number
  movement_type: string
  quantity: number
  reason: string | null
  previous_stock: number
  new_stock: number
  user_id: number | null
  sale_id: number | null
  created_at: string
  product_name?: string
  product_category?: string
  user_name?: string
}
```

Validaciones:
- Producto debe existir
- Para "salida": valida que haya stock suficiente
- Actualiza automáticamente el stock_qty del producto

#### GET /stock/movements
Lista movimientos de stock con filtros opcionales
```typescript
Query params:
  ?limit=100 (default)
  &offset=0 (default)
  &product_id=123 (opcional)

Response: StockMovement[]
```

#### GET /stock/levels
Obtiene niveles de stock de todos los productos activos
```typescript
Response: ProductStock[]
{
  product_id: number
  product_name: string
  category: string
  variant: string | null
  current_stock: number
  min_stock: number (default 10)
}
```

#### GET /stock/product/{product_id}
Obtiene el nivel de stock de un producto específico
```typescript
Response: ProductStock
{
  product_id: number
  product_name: string
  category: string
  variant: string | null
  current_stock: number
  min_stock: number
}
```

---

## 7. FUNCIONALIDADES IMPLEMENTADAS

### ✅ Módulo POS (Point of Sale)
**Ubicación**: `/frontend/src/pages/POS.tsx`

**Características**:
- **Vista Agrupada por Subcategoría (Por Defecto)** - NUEVO 2026-01-24:
  - Toggle "Agrupar" activado por defecto
  - Muestra tarjetas de subcategorías con:
    - Nombre de la subcategoría
    - Categoría principal
    - Cantidad de productos
  - Click en subcategoría despliega sus productos
  - Botón "Volver" para regresar a vista de subcategorías
  - Modo desagrupado muestra tabla tradicional de productos
- Catálogo de productos con búsqueda en tiempo real
- Carrito de compras con:
  - Agregar/quitar productos
  - Ajuste de cantidades
  - Cálculo automático de totales
- Selección de cliente (opcional)
  - Búsqueda de clientes existentes
  - Creación rápida de nuevos clientes
- Procesamiento de venta:
  - Validación de stock
  - Descuento automático de inventario
  - Flag de facturación
- Historial de ventas recientes:
  - Tabla clickeable
  - Modal con detalle completo de venta
  - Información de items, precios y totales
- Interfaz responsive

**Flujo de Venta (Modo Agrupado)**:
1. Usuario ve subcategorías organizadas en tarjetas
2. Selecciona subcategoría de interés
3. Ve productos de esa subcategoría
4. Agrega productos al carrito con un click
5. Puede volver a subcategorías o buscar directamente
6. Ajusta cantidades según necesidad
7. Opcionalmente selecciona/crea cliente
8. Marca si requiere factura
9. Confirma venta
10. Sistema valida stock
11. Registra venta y actualiza inventario
12. Muestra confirmación y limpia carrito

### ✅ Gestión de Productos
**Ubicación**: `/frontend/src/pages/Productos.tsx`

**Características**:
- Listado de productos en tabla
- Búsqueda y filtrado
- Visualización de:
  - Categoría y subcategoría
  - Nombre y variante
  - Precio en ARS
  - Stock disponible
  - Estado (activo/inactivo)
- Formulario de creación (UI implementada)

### ✅ Gestión de Usuarios
**Ubicación**: `/frontend/src/pages/Usuarios.tsx`

**Características**:
- Formulario de creación de usuarios
  - Validación de username
  - Validación de email
  - Toggle activo/inactivo
- Listado de usuarios
- Integración completa con API backend

### ✅ Sistema de Gestión de Clientes (MEJORADO - 2026-01-24)
**Ubicaciones**:
- `/frontend/src/pages/Clientes.tsx`
- `/backend/app/routers/customer.py`
- Integrado en POS

**Características**:
- **Página Dedicada de Clientes**:
  - Listado completo con estadísticas
  - Búsqueda por nombre, email o teléfono
  - Vista de compras totales y monto gastado
  - Fecha de última compra
  - Click en cliente para ver detalles

- **Modal de Detalle de Cliente**:
  - Información personal completa (nombre, email, teléfono, dirección)
  - Fecha de alta como cliente
  - Estadísticas: total de compras y monto total gastado
  - Historial completo de compras recientes
  - Detalle de cada venta (ID, fecha, items, total, facturación)

- **Modal de Creación de Cliente** (en POS y Clientes):
  - Nombre (obligatorio)
  - Email
  - Teléfono
  - Dirección
  - Creación rápida desde POS
  - Creación desde página de Clientes

- **Integración con Ventas**:
  - Asignación opcional de cliente en POS
  - Búsqueda rápida por nombre, email o teléfono
  - Trazabilidad de compras por cliente
  - Análisis de comportamiento de compra

- **Base de Datos Mejorada**:
  - Campos nuevos: email, address, created_at
  - Índices para búsqueda optimizada
  - Relación bidireccional con Sales
  - 20 clientes dummy precargados para testing

**API Endpoints** (`/customers`):
- `GET /customers`: Listar clientes con búsqueda
- `GET /customers/with-stats`: Listar con estadísticas de compra
- `GET /customers/{id}`: Obtener cliente específico
- `GET /customers/{id}/sales`: Obtener ventas del cliente
- `POST /customers`: Crear nuevo cliente
- `PUT /customers/{id}`: Actualizar cliente
- `DELETE /customers/{id}`: Eliminar cliente

**Script de Datos Dummy**:
- `/backend/create_dummy_customers.py`
- Crea 20 clientes con datos realistas
- Nombres, emails, teléfonos y direcciones de Buenos Aires
- Fechas de creación distribuidas en últimos 6 meses

### ✅ Sistema de Base de Datos
**Ubicación**: `/backend/app/core/database.py`

**Características**:
- PostgreSQL 16 containerizado
- SQLAlchemy ORM
- Migraciones con Alembic
- Sesiones con dependency injection
- Transacciones ACID

### ✅ Herramientas de Carga de Datos
**Ubicación**: `/cargar_productos.py`

**Características**:
- Carga masiva desde CSV
- Validación de datos
- Conversión de precios
- Limpieza de strings
- Manejo de errores

### ✅ Sistema de Gestión de Stock (NUEVO - 2026-01-24)
**Ubicaciones**:
- `/frontend/src/pages/Stock.tsx`
- `/backend/app/routers/stock.py`
- `/backend/app/models/stock_movement.py`

**Características**:
- **Gestión Automática de Stock en Ventas**:
  - Descuento automático de stock al realizar ventas
  - Validación de stock disponible antes de confirmar venta
  - Creación automática de movimientos de stock tipo "salida"
  - Trazabilidad completa con referencia a venta (`sale_id`)

- **Movimientos de Stock Manuales**:
  - Entrada: Carga de stock (compras, producción)
  - Salida: Dar de baja stock (mermas, donaciones)
  - Ajuste: Correcciones de inventario
  - Registro de motivo/razón de cada movimiento
  - Auditoría con stock anterior y nuevo

- **Interfaz de Stock con 3 Tabs**:
  - **Niveles de Stock**: Vista de stock actual de todos los productos
    - Indicadores visuales (Bajo/Medio/OK)
    - Stock mínimo configurable
    - Alertas de productos con stock bajo
  - **Movimientos**: Historial completo de movimientos
    - Fecha, tipo, producto, cantidad
    - Stock anterior y nuevo
    - Usuario y motivo
    - Referencia a venta si aplica
  - **Cargar/Dar de Baja**: Formulario para registrar movimientos
    - Selección de producto
    - Tipo de movimiento (entrada/salida/ajuste)
    - Cantidad y motivo
    - Validación de stock disponible

- **API Endpoints de Stock** (`/stock`):
  - `POST /stock/movements`: Crear movimiento de stock
  - `GET /stock/movements`: Listar movimientos (con filtros)
  - `GET /stock/levels`: Obtener niveles de stock de todos productos
  - `GET /stock/product/{id}`: Obtener stock de producto específico

**Base de Datos - Tabla stock_movements**:
```sql
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'ajuste')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason TEXT,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campo stock_qty en Products**:
- Agregado campo `stock_qty INTEGER DEFAULT 0` a tabla products
- Migración Alembic: `c3d8aba58c16_add_stock_qty_to_products.py`
- Todos los productos existentes actualizados con stock inicial de 50 unidades

**Flujo Completo de Stock**:
1. **Crear Producto**: Se define stock inicial al crear
2. **Cargar Stock**: Movimiento tipo "entrada" aumenta stock
3. **Venta en POS**: Automáticamente crea movimiento "salida" y descuenta stock
4. **Ajuste**: Correcciones manuales de inventario
5. **Auditoría**: Todos los movimientos quedan registrados con trazabilidad completa

**Validaciones Implementadas**:
- Stock no puede ser negativo
- No se permite vender sin stock disponible
- Cantidades deben ser positivas
- Tipo de movimiento debe ser válido (entrada/salida/ajuste)
- Consistencia de datos: previous_stock + quantity = new_stock

### ✅ Dashboard de Analytics / Business Intelligence (NUEVO - 2026-01-24)
**Ubicaciones**:
- `/frontend/src/pages/Analytics.tsx`
- `/backend/app/routers/analytics.py`

**Características**:
- **Selector de Período Temporal**:
  - Hoy
  - Ayer
  - Últimos 7 días
  - Últimos 30 días
  - Rango personalizado con selección de fechas inicio/fin
  - Información del período mostrado (fechas y cantidad de días)

- **KPIs Principales con Comparación Temporal**:
  - **Ventas Totales**: Monto total en ARS
  - **Transacciones**: Número de ventas realizadas
  - **Ticket Promedio**: Promedio por transacción
  - Cada métrica muestra:
    - Valor actual del período
    - % de crecimiento vs período anterior
    - Indicador visual (flecha arriba/abajo)
    - Color según tendencia (verde/rojo)

- **Análisis de Ventas por Hora** (CLICKEABLE):
  - Tabla horaria completa (00:00 a 23:59)
  - Transacciones por franja horaria
  - Total vendido por hora
  - Filtrado automático de horas sin actividad
  - **Click en hora → Modal con transacciones de esa hora**

- **Análisis de Ventas por Categoría** (CLICKEABLE):
  - Tabla con todas las categorías
  - Cantidad total vendida por categoría
  - Revenue total por categoría
  - Ordenado por revenue descendente
  - **Click en categoría → Modal con ventas de esa categoría**

- **Tendencia Diaria** (cuando período > 1 día) (CLICKEABLE):
  - Tabla día por día
  - Transacciones diarias
  - Total vendido por día
  - Formato de fecha localizado (es-AR)
  - **Click en día → Modal con ventas de ese día**

- **Top Productos - Doble Ranking** (CLICKEABLE):
  - **Top 10 por Cantidad Vendida**:
    - Productos más vendidos por unidades
    - Nombre, variante y categoría
    - Total de unidades vendidas
    - Revenue generado
    - **Click en producto → Modal con ventas de ese producto**
  - **Top 10 por Revenue**:
    - Productos más rentables
    - Mismo detalle que top por cantidad
    - Ordenamiento por revenue total
    - **Click en producto → Modal con ventas de ese producto**

- **Modal de Transacciones Detalladas** (NUEVO):
  - Se abre al hacer click en cualquier sección
  - Título dinámico según filtro
  - Resumen: cantidad de transacciones y total acumulado
  - Tabla completa de ventas con:
    - ID de venta
    - Fecha y hora completa
    - Cantidad de items
    - Lista de productos con cantidades
    - Total de cada venta
    - Estado de facturación
  - Scroll para muchas transacciones
  - Máximo 100 transacciones por consulta

- **API Endpoints**:
  - `GET /analytics/summary`:
    - Parámetros: `start_date`, `end_date` (YYYY-MM-DD)
    - Agregaciones SQL optimizadas con SQLAlchemy
    - Cálculos automáticos de período anterior
    - Agrupaciones por hora, día, categoría y producto
    - Response con todas las métricas y datos agregados

  - `GET /analytics/sales` (NUEVO):
    - Parámetros de filtrado:
      - `start_date`, `end_date`: Rango de fechas
      - `date`: Día específico
      - `hour`: Hora específica (0-23)
      - `category`: Categoría de productos
      - `product_id`: Producto específico
    - Retorna ventas completas con items
    - Límite de 100 ventas
    - Ordenadas por fecha descendente

**Flujo de Uso**:
1. Usuario accede a página Analytics desde navegación
2. Selecciona período de tiempo de interés
3. Sistema consulta datos de ventas del período
4. Calcula automáticamente período anterior para comparación
5. Muestra KPIs con tendencias
6. Presenta análisis detallados en tablas organizadas
7. Usuario puede cambiar período para comparar diferentes rangos
8. **Usuario hace click en cualquier fila de análisis**
9. **Se abre modal con transacciones específicas de ese filtro**
10. **Usuario puede revisar cada venta individual con detalles completos**

**Métricas Calculadas**:
- Total de ventas del período
- Cantidad de transacciones
- Ticket promedio (total / transacciones)
- % de crecimiento de ventas
- % de crecimiento de transacciones
- % de crecimiento de ticket promedio

**Visualización**:
- Cards coloridos para KPIs principales
- Tablas con scroll para datos extensos
- Badges para valores numéricos destacados
- Iconos Bootstrap para mejor UX
- Diseño responsivo con grid de Bootstrap
- Formato de moneda en ARS
- Formato de porcentajes con signo +/-

**Casos de Uso**:
- Análisis de ventas diarias
- Comparación de rendimiento semanal/mensual
- Identificación de horas pico
- **Drill-down desde resumen a transacciones individuales**
- **Verificación de métricas con datos reales**
- **Análisis detallado de productos específicos**
- **Auditoría de ventas por hora/categoría/producto**
- Evaluación de productos más rentables
- Detección de tendencias de crecimiento
- Planificación de inventario basada en ventas
- Análisis de categorías más vendidas

### ✅ Modal de Detalle de Venta en POS (NUEVO - 2026-01-24)
**Ubicación**: `/frontend/src/pages/POS.tsx`

**Características**:
- Últimas ventas en tabla son clickeables
- Modal Bootstrap desplegable con:
  - ID de la venta
  - Fecha y hora completa (formato localizado)
  - Estado de facturación con badge visual
  - Tabla de items vendidos:
    - Nombre del producto con variante
    - Cantidad con badge
    - Precio unitario
    - Subtotal por línea
  - Total de la venta destacado
- Identificación automática de productos por ID
- Matching con catálogo de productos cargado
- Formato de moneda consistente (ARS)

**Flujo**:
1. Usuario ve historial de ventas recientes
2. Click en cualquier venta de la tabla
3. Modal se despliega mostrando detalle completo
4. Usuario puede revisar items y totales
5. Cierra modal para volver a POS

### ✅ Modo Oscuro (Dark Mode) - Tema Azul Profundo (NUEVO - 2026-01-24)
**Ubicaciones**:
- `/frontend/src/contexts/ThemeContext.tsx`
- `/frontend/src/styles/theme.css`
- `/frontend/src/layout/AppLayout.tsx`

**Características**:
- **Toggle de Tema en Navbar**:
  - Botón con icono de sol/luna
  - Ubicado en la parte superior derecha
  - Cambia instantáneamente entre modo claro y oscuro
  - Ícono cambia según el modo activo

- **Tema Azul Oscuro Personalizado - Versión Ultra Oscura**:
  - Fondo principal: `#020814` (azul casi negro)
  - Fondo secundario: `#0a1628` (azul profundo oscuro)
  - Fondo terciario: `#0f2744` (azul oscuro medio)
  - Navbar: `#000000` (negro puro)
  - Texto principal: `#f0f7ff` (blanco azulado)
  - Texto secundario: `#c5e1ff` (azul muy claro)
  - Texto muted: `#9ec8f5` (azul claro)

- **Persistencia de Preferencia**:
  - Guardado en localStorage
  - Se mantiene entre sesiones
  - Carga automática al iniciar

- **Componentes Estilizados**:
  - ✅ Cards con fondos azul oscuro
  - ✅ Tablas con headers y rows adaptados
  - ✅ Formularios e inputs con fondo oscuro y texto claro
  - ✅ Modals completamente adaptados
  - ✅ Dropdowns con fondo oscuro
  - ✅ Alerts con colores ajustados para contraste
  - ✅ Badges con colores vibrantes y buen contraste
  - ✅ Botones mantienen colores distintivos
  - ✅ Nav tabs y list groups adaptados
  - ✅ Navbar oscuro consistente
  - ✅ Footer adaptado

- **Optimizaciones de Contraste**:
  - Todo el texto negro convertido a texto claro
  - Badges warning mantienen amarillo con texto negro (contraste)
  - Badges de colores mantienen visibilidad óptima
  - Bordes sutiles pero visibles
  - Inputs con placeholder visible
  - Links en azul claro (#4a90e2)

- **Implementación Técnica**:
  - React Context API para state global
  - Atributo `data-theme` en HTML root
  - Variables CSS para colores
  - Selectores CSS específicos para modo oscuro
  - Sin dependencias adicionales

**Flujo de Uso**:
1. Usuario hace click en botón de sol/luna en navbar
2. Tema cambia instantáneamente
3. Preferencia se guarda en localStorage
4. Al recargar página, mantiene preferencia

**Casos de Uso**:
- Reducción de fatiga visual en ambientes con poca luz
- Preferencia estética del usuario
- Ahorro de batería en pantallas OLED
- Comodidad durante horarios nocturnos

### ✅ Rediseño de UI con Bootstrap (2026-01-24)
**Descripción**: Todas las páginas rediseñadas con Bootstrap 5 para un diseño más limpio y profesional.

**Cambios Implementados**:
- Migración completa de Tailwind CSS a Bootstrap 5
- Diseño horizontal y compacto en todas las páginas
- Uso de Bootstrap Icons
- Tablas con sticky headers para mejor UX
- Modales Bootstrap para formularios
- Badges para estadísticas y estados
- Componentes responsivos

**Páginas Actualizadas**:
1. **POS**:
   - Layout horizontal con catálogo (70%) y carrito (30%)
   - Tabla de productos con stock visible
   - Header con badges de estadísticas
   - Validación visual de stock bajo

2. **Productos**:
   - Header horizontal con badges (total, activos, inactivos, categorías)
   - Tabla con columnas: Producto, Categoría, Subcategoría, Precio, Estado, Acciones
   - Modal Bootstrap para crear productos
   - Campo stock_qty en formulario
   - Botones de acción: Activar/Desactivar, Editar, Eliminar

3. **Stock** (NUEVA):
   - Sistema de tabs Bootstrap
   - Tablas con información de stock
   - Formulario de movimientos
   - Indicadores visuales de alerta

4. **Usuarios**:
   - Header horizontal con estadísticas
   - Tabla con avatares generados (iniciales)
   - Modal Bootstrap para crear usuarios
   - Acciones inline: Activar/Desactivar, Editar, Eliminar

**Beneficios del Rediseño**:
- Interfaz más limpia y profesional
- Mejor aprovechamiento del espacio horizontal
- Componentes estándar y familiares
- Más fácil de mantener
- Performance mejorado (menos CSS custom)

---

## 8. FUNCIONALIDADES PENDIENTES

### ⏳ Compras/Procurement
**Ubicación**: `/frontend/src/pages/Compras.tsx` (stub)

**A Implementar**:
- Registro de compras a proveedores
- Gestión de proveedores
- Órdenes de compra
- Recepción de mercadería
- Actualización automática de inventario
- Cálculo de costos

### ⏳ Reportes y Estadísticas
**No implementado**

**A Implementar**:
- Dashboard con métricas clave
- Reportes de ventas (diario, semanal, mensual)
- Productos más vendidos
- Análisis de clientes
- Proyecciones de inventario
- Reportes de rentabilidad
- Gráficos y visualizaciones

### ⏳ Autenticación y Autorización
**No implementado**

**A Implementar**:
- Login/Logout
- JWT tokens
- Roles de usuario (admin, cajero, etc.)
- Permisos por módulo
- Sesiones seguras
- Password hashing

### ⏳ Facturación Electrónica
**Parcial - solo flag is_invoiced**

**A Implementar**:
- Integración con AFIP (Argentina)
- Generación de facturas A/B/C
- QR codes
- PDF de facturas
- Registro de comprobantes
- Libro IVA

### ⏳ Mejoras Avanzadas de Inventario
**Sistema básico completado** ✅

**A Implementar** (Futuro):
- Stock de seguridad configurable por producto
- Predicción de demanda con ML
- Múltiples ubicaciones/sucursales
- Control de lotes y fechas de vencimiento
- Transferencias entre sucursales
- Inventario físico vs contable
- Reportes de rotación de inventario

### ⏳ Gestión de Mesas (para restaurante)
**No implementado**

**A Implementar**:
- Layout de mesas
- Estados (disponible, ocupada, reservada)
- Asignación de pedidos a mesas
- División de cuenta
- Transferencia entre mesas

### ⏳ Comandas de Cocina
**No implementado**

**A Implementar**:
- Envío de pedidos a cocina
- Estados de preparación
- Tiempos de cocción
- Priorización de órdenes
- Impresión de tickets

### ⏳ Integraciones de Pago
**No implementado**

**A Implementar**:
- Mercado Pago
- Tarjetas de crédito/débito
- Transferencias bancarias
- QR de pago
- Múltiples métodos de pago por venta
- Gestión de propinas

### ⏳ Programa de Fidelización
**No implementado**

**A Implementar**:
- Puntos por compra
- Descuentos para clientes frecuentes
- Promociones personalizadas
- Cupones

---

## 9. CONFIGURACIÓN DE DESARROLLO

### Prerrequisitos
- Python 3.9+
- Node.js 18+
- Docker y Docker Compose
- PostgreSQL (o usar Docker)

### Setup Backend

```bash
# Navegar a backend
cd backend

# Crear virtual environment
python -m venv venv

# Activar virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Levantar base de datos
docker-compose up -d

# Ejecutar migraciones
alembic upgrade head

# Correr servidor de desarrollo
uvicorn app.main:app --reload
```

**Servidor corriendo en**: `http://127.0.0.1:8000`
**Documentación API**: `http://127.0.0.1:8000/docs` (Swagger UI)

### Setup Frontend

```bash
# Navegar a frontend
cd frontend

# Instalar dependencias
npm install

# Correr servidor de desarrollo
npm run dev
```

**Aplicación corriendo en**: `http://localhost:5173`

### Base de Datos

**Configuración Docker**:
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: empanadas_db
      POSTGRES_USER: empanadas_user
      POSTGRES_PASSWORD: empanadas_pass
```

**Conexión**:
- Host: `localhost`
- Port: `5433`
- Database: `empanadas_db`
- User: `empanadas_user`
- Password: `empanadas_pass`

### Cargar Datos de Ejemplo

```bash
# Asegurarse de que el backend esté corriendo
# Ejecutar script de carga
python cargar_productos.py
```

---

## 10. GUÍA DE DESARROLLO

### Agregar Nuevo Endpoint

1. **Crear Schema Pydantic** (`/backend/app/schemas/`)
```python
from pydantic import BaseModel

class MyEntityCreate(BaseModel):
    name: str
    value: int

class MyEntityOut(MyEntityCreate):
    id: int
```

2. **Crear Modelo SQLAlchemy** (`/backend/app/models/`)
```python
from sqlalchemy import Column, Integer, String
from app.core.database import Base

class MyEntity(Base):
    __tablename__ = "my_entities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    value = Column(Integer)
```

3. **Crear Router** (`/backend/app/routers/`)
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.my_entity import MyEntityCreate, MyEntityOut
from app.models.my_entity import MyEntity

router = APIRouter(prefix="/my-entity", tags=["My Entity"])

@router.post("/", response_model=MyEntityOut)
def create_entity(entity: MyEntityCreate, db: Session = Depends(get_db)):
    db_entity = MyEntity(**entity.dict())
    db.add(db_entity)
    db.commit()
    db.refresh(db_entity)
    return db_entity
```

4. **Registrar Router** (`/backend/app/main.py`)
```python
from app.routers import my_entity
app.include_router(my_entity.router)
```

5. **Crear Migración**
```bash
alembic revision --autogenerate -m "Add my_entity table"
alembic upgrade head
```

### Agregar Nuevo Componente React

1. **Crear Componente UI** (`/frontend/src/components/ui/`)
```typescript
interface MyComponentProps {
  title: string
  onAction: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  )
}
```

2. **Crear Página** (`/frontend/src/pages/`)
```typescript
import { useState, useEffect } from 'react'
import { MyComponent } from '@/components/ui/my-component'

export default function MyPage() {
  const [data, setData] = useState([])

  useEffect(() => {
    // Fetch data
  }, [])

  return <MyComponent title="My Page" onAction={() => {}} />
}
```

3. **Agregar Ruta** (`/frontend/src/App.tsx`)
```typescript
import MyPage from './pages/MyPage'

// En el router:
<Route path="/my-page" element={<MyPage />} />
```

4. **Agregar al Sidebar** (`/frontend/src/layout/AppLayout.tsx`)

---

## 11. MEJORES PRÁCTICAS

### Backend
- Usar dependency injection para sesiones de BD
- Validar todos los inputs con Pydantic
- Manejar errores con HTTPException
- Documentar endpoints con docstrings
- Usar transacciones para operaciones múltiples
- Implementar logging adecuado

### Frontend
- Componentizar UI reutilizable
- Usar TypeScript para type safety
- Manejar estados de carga y error
- Implementar validación de formularios
- Usar hooks personalizados para lógica reutilizable
- Optimizar renders con useMemo/useCallback

### General
- Commits descriptivos y atómicos
- Code review antes de merge
- Testing (unit + integration)
- Documentación actualizada
- Seguir convenciones de naming

---

## 12. ROADMAP: HACIA EL MEJOR SISTEMA GASTRONÓMICO

### Fase 1: Fundación Sólida ✅ (COMPLETADO - 2026-01-24)
- [x] Arquitectura base backend/frontend
- [x] Modelos de datos principales
- [x] POS básico funcional
- [x] Gestión de productos con stock
- [x] Gestión de clientes
- [x] Sistema de ventas con descuento automático de stock
- [x] **Gestión completa de inventario (Stock Management)** - NUEVO
  - [x] Movimientos de stock (entrada/salida/ajuste)
  - [x] Integración automática con ventas
  - [x] Historial y auditoría de movimientos
  - [x] Validación de stock disponible
  - [x] Alertas de stock bajo
- [x] **Rediseño UI con Bootstrap 5** - NUEVO
  - [x] POS rediseñado
  - [x] Productos rediseñado
  - [x] Stock (página nueva)
  - [x] Usuarios rediseñado

### Fase 2: Operaciones Completas (EN PROGRESO)
- [ ] Autenticación y autorización completa
- [ ] Módulo de compras/proveedores
- [ ] Facturación electrónica (AFIP)
- [ ] Reportes básicos de ventas
- [ ] Alertas de stock bajo
- [ ] Mejoras en UI/UX

### Fase 3: Optimización de Restaurante
- [ ] Sistema de mesas
- [ ] Comandas de cocina
- [ ] División de cuentas
- [ ] Gestión de turnos
- [ ] Control de propinas
- [ ] Reservas

### Fase 4: Inteligencia de Negocio
- [ ] Dashboard analytics avanzado
- [ ] Predicción de demanda (ML)
- [ ] Análisis de rentabilidad por producto
- [ ] Optimización de inventario
- [ ] Reportes personalizados
- [ ] KPIs en tiempo real

### Fase 5: Ecosistema Completo
- [ ] App móvil para meseros
- [ ] Panel de cocina (display)
- [ ] Pedidos online
- [ ] Delivery integrado
- [ ] Programa de fidelización
- [ ] Marketing automatizado

### Fase 6: Escalabilidad Empresarial
- [ ] Multi-sucursal
- [ ] Franquicias
- [ ] Central de compras
- [ ] Consolidación de reportes
- [ ] API pública para integraciones
- [ ] Marketplace de plugins

---

## 13. NOTAS TÉCNICAS

### CORS Configuration
El backend permite solo requests desde `http://localhost:5173` (frontend dev server)

### Manejo de Stock
- Stock se descuenta automáticamente al registrar venta
- Validación de stock disponible antes de venta
- No permite ventas con stock insuficiente

### Precios
- Todos los precios en pesos argentinos (ARS)
- Formato: Decimal(10,2)
- Se guarda precio unitario en SaleItem (histórico)

### Timestamps
- created_at en ventas para tracking temporal
- created_at en usuarios para auditoría

### Clientes Opcionales
- Las ventas pueden o no tener cliente asociado
- Útil para ventas rápidas sin registro de cliente

---

## 14. RECURSOS Y COMANDOS ÚTILES

### Backend Commands
```bash
# Crear nueva migración
alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1

# Ver histórico de migraciones
alembic history

# Correr tests
pytest

# Ver logs de Docker
docker-compose logs -f
```

### Frontend Commands
```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Linting
npm run lint

# Type checking
tsc --noEmit
```

### Database Commands
```bash
# Conectar a PostgreSQL
docker exec -it empanadas-postgres psql -U empanadas_user -d empanadas_db

# Backup database
docker exec empanadas-postgres pg_dump -U empanadas_user empanadas_db > backup.sql

# Restore database
docker exec -i empanadas-postgres psql -U empanadas_user empanadas_db < backup.sql
```

---

## 15. CONTACTO Y CONTRIBUCIÓN

### Estructura del Equipo
(A definir según necesidades del proyecto)

### Convenciones de Commits
```
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
style: Formateo, semicolons, etc.
refactor: Refactorización de código
test: Agregar/modificar tests
chore: Tareas de mantenimiento
```

### Issues y Pull Requests
(A definir workflow de GitHub/GitLab)

---

## 16. GLOSARIO

**POS**: Point of Sale - Punto de Venta
**SPA**: Single Page Application
**ORM**: Object-Relational Mapping
**CORS**: Cross-Origin Resource Sharing
**CRUD**: Create, Read, Update, Delete
**API**: Application Programming Interface
**REST**: Representational State Transfer
**JWT**: JSON Web Token
**AFIP**: Administración Federal de Ingresos Públicos (Argentina)
**SKU**: Stock Keeping Unit
**KPI**: Key Performance Indicator

---

## 17. CHANGELOG Y RESOLUCIÓN DE PROBLEMAS

### 2026-01-24 (Noche): Sistema Completo de Proveedores y Cajeros

#### Funcionalidad Agregada

**1. Sistema de Proveedores (Suppliers)**:
- **Base de Datos**:
  - Nueva tabla `suppliers` con campos:
    - id, name, contact_name, phone, email, address, notes, created_at
  - Tabla asociativa many-to-many `product_supplier`:
    - product_id, supplier_id (composite PK)
    - supplier_product_code (opcional)
    - notes (opcional)
  - Relación muchos-a-muchos: productos ↔ proveedores
  - Un producto puede tener múltiples proveedores
  - Migración: `c5cdde790805_create_suppliers_and_product_supplier_relation.py`

- **Stock Movements Extendido**:
  - Agregados campos a `stock_movements`:
    - `supplier_id` (FK a suppliers, nullable, SET NULL on delete)
    - `purchase_price_ars` (INTEGER, nullable)
  - Permite registrar proveedor y precio al dar de alta stock
  - Trazabilidad completa de compras a proveedores

- **API de Proveedores** (`/suppliers`):
  - `GET /suppliers`: Listar proveedores
  - `GET /suppliers/with-stats`: Proveedores con estadísticas de compra
  - `GET /suppliers/{id}`: Obtener proveedor específico
  - `GET /suppliers/{id}/purchases`: Historial de compras del proveedor
  - `POST /suppliers`: Crear nuevo proveedor
  - `PUT /suppliers/{id}`: Actualizar proveedor
  - `DELETE /suppliers/{id}`: Eliminar proveedor

- **Página de Proveedores** (`/frontend/src/pages/Proveedores.tsx`):
  - Tabla completa de proveedores con estadísticas
  - Búsqueda por nombre, contacto o email
  - Columnas: Nombre, Contacto, Email, Teléfono, Compras, Total Gastado, Última Compra
  - Modal de creación con todos los campos
  - Modal de detalles con:
    - Información completa del proveedor
    - Estadísticas (total de compras, monto gastado)
    - Historial de compras con detalle
    - Tabla de movimientos de stock

- **Integración con Stock**:
  - Formulario de Stock ahora incluye:
    - Selector de proveedor (solo visible en tipo "entrada")
    - Campo de precio de compra
    - Cálculo automático de total (precio × cantidad)
  - Tabla de movimientos muestra proveedor y precio
  - Frontend: tipos actualizados, API calls con nuevos campos

- **Script de Datos Dummy**:
  - `/backend/create_dummy_suppliers.py`
  - 5 proveedores con datos realistas:
    - Distribuidora La Abundancia (cárnicos)
    - Almacén Don Pepe (verduras y frescos)
    - Lácteos del Sur S.A. (quesos premium)
    - Panificadora Central (masa y tapas)
    - Especias y Condimentos S.R.L. (especias)

**2. Sistema de Cajeros y Medios de Pago**:
- **Base de Datos (Sales)**:
  - Agregados campos a tabla `sales`:
    - `payment_method` VARCHAR(50) nullable
    - `cashier` VARCHAR(100) nullable
  - CHECK constraint para payment_method:
    - Valores válidos: 'efectivo', 'tarjeta', 'mercadopago', NULL
  - Índices en ambos campos para queries eficientes
  - Migración: `dc6ef529f898_add_payment_method_and_cashier_to_sales.py`

- **POS Actualizado**:
  - Selector de medio de pago:
    - Sin especificar
    - Efectivo
    - Tarjeta
    - MercadoPago
  - Campo de texto para nombre del cajero
  - Ambos campos opcionales
  - Ubicados junto a cliente y facturación
  - Valores se guardan automáticamente en cada venta

- **Modal de Detalle de Venta**:
  - Ahora muestra:
    - Medio de pago usado (si se especificó)
    - Cajero que procesó la venta
    - Iconos visuales para cada campo
    - Formato capitalizado para medio de pago

**3. Analytics Extendido**:
- **Estadísticas de Proveedores** (`/analytics/suppliers`):
  - Endpoint con filtros de fecha
  - Muestra por proveedor:
    - Nombre del proveedor
    - Total de compras (movimientos de entrada)
    - Total gastado (suma de precio × cantidad)
  - Ordenado por gasto descendente
  - Integrado en página Analytics

- **Estadísticas de Cajeros** (`/analytics/cashiers`):
  - Endpoint con filtros de fecha
  - Muestra por cajero:
    - Nombre del cajero
    - Total de ventas procesadas
    - Monto total vendido
    - Desglose por medio de pago:
      - Efectivo
      - Tarjeta
      - MercadoPago
  - Ordenado por monto total descendente
  - Integrado en página Analytics

- **Visualización en Analytics**:
  - Nueva sección "Compras por Proveedor":
    - Tabla con todos los proveedores
    - Compras y monto total por proveedor
    - Fila de totales al pie
  - Nueva sección "Ventas por Cajero":
    - Tabla con todos los cajeros
    - Ventas y monto total por cajero
    - Badges con montos por medio de pago
    - Iconos visuales (💵 efectivo, 💳 tarjeta, 📱 MercadoPago)
    - Fila de totales al pie
  - Ambas secciones respetan el rango de fechas seleccionado

#### Archivos Creados
**Backend**:
- `/backend/app/models/supplier.py`
- `/backend/app/schemas/supplier.py`
- `/backend/app/routers/supplier.py`
- `/backend/alembic/versions/c5cdde790805_create_suppliers_and_product_supplier_.py`
- `/backend/alembic/versions/dc6ef529f898_add_payment_method_and_cashier_to_sales.py`
- `/backend/create_dummy_suppliers.py`

**Frontend**:
- `/frontend/src/pages/Proveedores.tsx`

#### Archivos Modificados
**Backend**:
- `/backend/app/models/product.py`: Relación suppliers
- `/backend/app/models/stock_movement.py`: Campos supplier_id y purchase_price_ars
- `/backend/app/models/sale.py`: Campos payment_method y cashier
- `/backend/app/schemas/stock.py`: Schemas con supplier fields
- `/backend/app/schemas/pos.py`: SaleCreate con payment_method y cashier (Literal type)
- `/backend/app/routers/stock.py`: Manejo de supplier en stock movements
- `/backend/app/routers/analytics.py`: Nuevos endpoints suppliers y cashiers
- `/backend/app/main.py`: Router de suppliers registrado

**Frontend**:
- `/frontend/src/pages/POS.tsx`:
  - Selectores de payment_method y cashier
  - Modal de detalle muestra nuevos campos
  - Tipos actualizados (SaleOut)
- `/frontend/src/pages/Stock.tsx`:
  - Selector de proveedor
  - Campo de precio de compra
  - Tabla de movimientos con supplier y precio
  - Load suppliers en useEffect
- `/frontend/src/pages/Analytics.tsx`:
  - Secciones de proveedores y cajeros
  - Load functions para nuevas estadísticas
  - Tipos SupplierStats y CashierStats
- `/frontend/src/App.tsx`: Ruta /proveedores
- `/frontend/src/layout/AppLayout.tsx`: Link a Proveedores en navbar
- `/frontend/src/types/stock.ts`: Campos supplier en StockMovement
- `/frontend/src/lib/stock.ts`: createStockMovement con supplier fields

#### Beneficios
**Gestión de Proveedores**:
- Trazabilidad completa de compras
- Análisis de costos por proveedor
- Gestión de relaciones comerciales
- Historial de precios de compra
- Identificación de mejores proveedores
- Base para negociación de precios

**Control de Cajeros**:
- Trazabilidad de ventas por empleado
- Análisis de rendimiento por cajero
- Control de medios de pago utilizados
- Auditoría de caja por turno
- Identificación de patrones de venta
- Base para sistema de comisiones

**Analytics Mejorado**:
- Visibilidad completa de gastos a proveedores
- Comparación de costos entre proveedores
- Análisis de ventas por cajero
- Distribución de medios de pago
- Datos para toma de decisiones de compra
- Métricas de desempeño de personal

#### Flujos de Uso

**Flujo de Compra a Proveedor**:
1. Usuario va a página Stock
2. Selecciona tab "Cargar/Dar de Baja"
3. Elige producto a cargar
4. Selecciona tipo "Entrada"
5. Elige proveedor del selector
6. Ingresa cantidad y precio de compra
7. Ve total calculado automáticamente
8. Registra movimiento
9. Sistema actualiza stock y guarda relación con proveedor

**Flujo de Venta con Cajero**:
1. Usuario procesa venta en POS
2. Agrega productos al carrito
3. Selecciona medio de pago (efectivo/tarjeta/mercadopago)
4. Ingresa nombre del cajero
5. Confirma venta
6. Sistema registra venta con cajero y medio de pago

**Flujo de Análisis**:
1. Usuario va a Analytics
2. Selecciona período de tiempo
3. Ve estadísticas generales
4. Scroll down a "Compras por Proveedor"
5. Revisa gastos por proveedor
6. Continúa a "Ventas por Cajero"
7. Analiza rendimiento por empleado
8. Ve distribución de medios de pago

### 2026-01-24 (Tarde - Parte 5): Analytics con Drill-Down a Transacciones

#### Funcionalidad Agregada

**Secciones Clickeables en Analytics**:
- Todas las tablas y secciones de Analytics ahora son interactivas
- Click en cualquier fila abre modal con transacciones relacionadas

**Modal de Transacciones Filtradas**:
- Muestra todas las ventas específicas de la sección clickeada
- Título dinámico según el filtro aplicado
- Resumen: cantidad de transacciones y total
- Tabla detallada con:
  - ID de venta
  - Fecha y hora completa
  - Cantidad de items
  - Lista de productos vendidos con cantidades
  - Total de la venta
  - Estado de facturación

**Secciones Interactivas**:
- **Ventas por Hora**: Click en hora → ver transacciones de esa hora
- **Ventas por Categoría**: Click en categoría → ver ventas de esa categoría
- **Tendencia Diaria**: Click en día → ver ventas de ese día específico
- **Top Productos por Cantidad**: Click en producto → ver ventas de ese producto
- **Top Productos por Revenue**: Click en producto → ver ventas de ese producto

**Endpoint Nuevo de Backend**:
- `GET /analytics/sales` con filtros múltiples:
  - `start_date`, `end_date`: Rango de fechas
  - `date`: Día específico
  - `hour`: Hora específica (0-23)
  - `category`: Categoría de productos
  - `product_id`: Producto específico
- Devuelve ventas completas con items
- Límite de 100 ventas por consulta
- Ordenadas por fecha descendente

**Archivos Modificados**:
- `/backend/app/routers/analytics.py`: Nuevo endpoint `/analytics/sales`
- `/frontend/src/pages/Analytics.tsx`:
  - Estados para modal y ventas filtradas
  - Función `loadFilteredSales()` con múltiples filtros
  - Función `openSalesModal()` para abrir con título
  - Todas las tablas con onClick handlers
  - Modal completo con tabla de transacciones
  - Carga de productos para mostrar nombres

#### Beneficios
- Análisis profundo: del resumen a los detalles
- Trazabilidad completa de métricas
- Verificación de datos en tiempo real
- UX intuitiva: click para explorar
- Contexto completo de cada métrica
- Identificación rápida de transacciones específicas

### 2026-01-24 (Tarde - Parte 4): Sistema de Clientes Mejorado

#### Funcionalidad Agregada

**Mejoras a la Base de Datos de Clientes**:
- Migración `cb8cde288614_add_fields_to_customers.py`
- Agregados campos: `email`, `address`, `created_at`
- Índice en email para búsquedas optimizadas
- Relación bidireccional con tabla sales

**Página de Clientes Nueva**:
- Tabla completa con todos los clientes
- Búsqueda por nombre, email o teléfono
- Estadísticas por cliente:
  - Total de compras realizadas
  - Monto total gastado
  - Fecha de última compra
- Click en fila para ver detalles
- Botón para crear nuevos clientes

**Modal de Detalles de Cliente**:
- Información personal completa
- Cards con estadísticas destacadas
- Historial de compras recientes en tabla
- Detalles de cada venta (fecha, items, total, factura)
- Carga dinámica al hacer click en cliente

**Modal de Creación Mejorado**:
- Disponible en POS y en página de Clientes
- Campos: nombre, email, teléfono, dirección
- Validaciones de formulario
- Asignación automática en POS al crear

**API de Clientes Completa**:
- Router dedicado `/customers`
- Endpoints CRUD completos
- Endpoint especial `/with-stats` para estadísticas
- Endpoint `/customers/{id}/sales` para historial
- Búsqueda mejorada por múltiples campos

**Clientes Dummy**:
- Script `create_dummy_customers.py`
- 20 clientes creados con datos realistas
- Nombres argentinos
- Direcciones en CABA
- Emails y teléfonos válidos
- Fechas de creación distribuidas

**Archivos Creados**:
- `/backend/app/routers/customer.py`
- `/backend/alembic/versions/cb8cde288614_add_fields_to_customers.py`
- `/backend/create_dummy_customers.py`
- `/frontend/src/pages/Clientes.tsx`

**Archivos Modificados**:
- `/backend/app/models/customer.py`: Campos y relación
- `/backend/app/models/sale.py`: Relación con customer
- `/backend/app/schemas/customer.py`: Nuevos schemas
- `/backend/app/routers/pos.py`: Búsqueda y creación mejorada
- `/backend/app/main.py`: Router de customers registrado
- `/frontend/src/pages/POS.tsx`: Tipo y modal actualizados
- `/frontend/src/App.tsx`: Ruta de Clientes
- `/frontend/src/layout/AppLayout.tsx`: Link en navbar

#### Beneficios
- Gestión completa de base de clientes
- Trazabilidad de compras por cliente
- Análisis de comportamiento de compra
- Comunicación mejorada (email y dirección)
- UX mejorada con búsqueda rápida
- Estadísticas útiles para marketing
- Historial completo para atención al cliente

### 2026-01-24 (Tarde - Parte 3): Modo Oscuro con Tema Azul Profundo

#### Funcionalidad Agregada

**Sistema de Dark Mode Completo**:
- Toggle de tema en navbar (botón con ícono sol/luna)
- Tema oscuro con paleta de azul profundo personalizada
- Persistencia en localStorage
- Transiciones suaves entre temas

**Archivos Creados**:
- `/frontend/src/contexts/ThemeContext.tsx`: Context provider para gestión de tema
- `/frontend/src/styles/theme.css`: 400+ líneas de CSS para modo oscuro

**Archivos Modificados**:
- `/frontend/src/main.tsx`: Importar theme.css y envolver App con ThemeProvider
- `/frontend/src/layout/AppLayout.tsx`: Agregar botón toggle de tema en navbar

**Paleta de Colores del Modo Oscuro (Ultra Oscuro)**:
```css
--bg-primary: #020814      /* Azul casi negro */
--bg-secondary: #0a1628    /* Azul profundo oscuro */
--bg-tertiary: #0f2744     /* Azul oscuro medio */
--text-primary: #f0f7ff    /* Blanco azulado */
--text-secondary: #c5e1ff  /* Azul muy claro */
--navbar-bg: #000000       /* Negro puro */
```

**Mejoras Aplicadas**:
- Fondos mucho más oscuros para mejor contraste
- Filas de tabla con fondo oscuro garantizado (no más blanco)
- Texto más claro y brillante para mejor legibilidad
- Eliminación completa de fondos blancos en todos los componentes
- Reglas específicas para tbody, tfoot, thead
- Table striped con alternancias oscuras
- Todos los elementos de formulario oscuros

**Componentes Adaptados**:
- Cards, Tables, Forms, Inputs
- Modals, Alerts, Badges
- Buttons, Dropdowns, Nav tabs
- Navbar, Footer, Links
- Todos los textos negros → texto claro
- Todos los fondos blancos → fondos azul oscuro

**Características Técnicas**:
- Uso de CSS attribute selector `[data-theme="dark"]`
- Variables CSS para colores reutilizables
- Contraste optimizado WCAG AA
- Sin dependencias adicionales
- Performance óptimo (solo CSS)

#### Beneficios
- Reduce fatiga visual en horarios nocturnos
- Mejor experiencia en ambientes oscuros
- Ahorro de batería en dispositivos OLED
- Estética moderna y profesional
- Mantiene legibilidad óptima en ambos modos

### 2026-01-24 (Tarde - Parte 2): Modal de Detalle de Venta y Dashboard de Analytics

#### Problema Resuelto: Analytics mostraba todo en 0
- **Causa**: El endpoint estaba usando `datetime.fromisoformat()` que no parseaba correctamente las fechas en formato YYYY-MM-DD
- **Solución**: Cambiado a `datetime.strptime()` con formato explícito y uso de `datetime.combine()` para crear rangos de fecha correctos
- **Resultado**: Analytics ahora muestra correctamente todas las ventas del día seleccionado

#### Funcionalidad Agregada

**1. Modal de Detalle de Venta en POS**:
- Últimas ventas ahora son clickeables
- Modal muestra información completa de la venta:
  - ID de venta
  - Fecha y hora
  - Estado de facturación (badge visual)
  - Lista completa de items con:
    - Nombre del producto (con variante)
    - Cantidad vendida
    - Precio unitario
    - Subtotal por item
  - Total de la venta destacado
- Identificación automática de productos por ID
- Formato de moneda en ARS

**2. Dashboard de Analytics/BI**:
- Nueva página completa de Business Intelligence
- **Selector de período de tiempo**:
  - Hoy
  - Ayer
  - Últimos 7 días
  - Últimos 30 días
  - Rango personalizado (con selección de fechas)
- **Métricas principales (KPIs)**:
  - Ventas totales
  - Número de transacciones
  - Ticket promedio
  - Comparación vs período anterior con % de crecimiento
  - Indicadores visuales de tendencia (flechas arriba/abajo)
- **Análisis de ventas por hora**:
  - Tabla con desglose horario
  - Transacciones y total por franja horaria
- **Análisis de ventas por categoría**:
  - Tabla con cantidad y revenue por categoría
  - Ordenado por revenue descendente
- **Tendencia diaria** (cuando el rango es > 1 día):
  - Datos día por día
  - Transacciones y totales diarios
- **Top productos**:
  - Top 10 productos por cantidad vendida
  - Top 10 productos por revenue generado
  - Información completa: nombre, variante, categoría, cantidad, revenue

#### Archivos Creados
- `/backend/app/routers/analytics.py`:
  - Endpoint `/analytics/summary` con parámetros de fecha
  - Agregaciones SQL complejas
  - Cálculo de métricas comparativas
  - Agrupaciones por hora, día, categoría y producto

- `/frontend/src/pages/Analytics.tsx`:
  - Página completa de dashboard
  - Estado de selección de rango de fechas
  - Componentes de tarjetas de métricas
  - Tablas de datos con scroll
  - Formato de moneda y porcentajes
  - Diseño responsivo con Bootstrap 5

#### Archivos Modificados
- `/backend/app/main.py`:
  - Registrado router de analytics

- `/frontend/src/pages/POS.tsx`:
  - Agregado estado `selectedSale`
  - Listeners onClick en tabla de ventas recientes
  - Atributos Bootstrap para modal
  - Componente modal completo para detalle de venta

- `/frontend/src/App.tsx`:
  - Importado componente Analytics
  - Agregada ruta `/analytics`

- `/frontend/src/layout/AppLayout.tsx`:
  - Agregado link de navegación a Analytics
  - Removido container fijo para permitir container-fluid en algunas páginas
  - Icono `bi-graph-up` para Analytics

#### Beneficios
- Visibilidad completa de ventas individuales sin necesidad de backend adicional
- Herramienta completa de Business Intelligence integrada
- Análisis temporal flexible (día, semana, mes, personalizado)
- Comparación automática de períodos para detectar tendencias
- Identificación de productos más vendidos y rentables
- Análisis de patrones horarios de venta
- Datos accionables para toma de decisiones de negocio

### 2026-01-24 (Tarde - Parte 1): Vista Agrupada en POS

#### Funcionalidad Agregada
- **Vista Agrupada por Subcategoría en POS**:
  - Toggle "Agrupar" activado por defecto
  - Muestra subcategorías como tarjetas clickeables
  - Navegación: Subcategorías → Productos → Carrito
  - Cada tarjeta muestra:
    - Nombre de subcategoría
    - Categoría principal
    - Cantidad de productos
  - Click en tarjeta despliega productos de esa subcategoría
  - Botón "Volver" para regresar a vista de subcategorías
  - Toggle desactiva agrupación y muestra tabla tradicional
  - Búsqueda funciona en ambos modos

#### Archivos Modificados
- `/frontend/src/pages/POS.tsx`:
  - Agregado estado `isGrouped` (default: true)
  - Agregado estado `selectedSubcategory`
  - Nueva función `subcategoryGroups` para agrupar productos
  - Vista condicional: tarjetas de subcategorías vs tabla de productos
  - Toggle en header del catálogo

#### Beneficios
- Navegación más intuitiva en catálogos grandes
- Organización visual por categorías
- Menos scroll para encontrar productos
- Mantiene compatibilidad con vista de lista tradicional

### 2026-01-24 (Mañana): Sistema de Stock Implementado y UI Rediseñada

#### Problema Encontrado
- POS mostraba "No se encontraron productos"
- La columna `stock_qty` no existía en la tabla `products`
- Los productos existentes (222) no tenían el campo de stock

#### Solución Aplicada

1. **Migración de Base de Datos**:
   ```bash
   # Migración actualizada: c3d8aba58c16_add_stock_qty_to_products.py
   ALTER TABLE products ADD COLUMN stock_qty INTEGER DEFAULT 0 NOT NULL;

   # Nueva migración: e8f9a1b2c3d4_create_stock_movements.py
   CREATE TABLE stock_movements (...);

   # Marcada como aplicada:
   alembic stamp e8f9a1b2c3d4
   ```

2. **Script de Verificación y Corrección** (`check_db.py`):
   - Verifica existencia de columna `stock_qty`
   - Agrega la columna si no existe
   - Actualiza todos los productos existentes con stock inicial de 50
   - Crea productos de ejemplo si la BD está vacía

   ```bash
   # Ejecutado:
   python check_db.py
   # Resultado: 222 productos actualizados con stock_qty = 50
   ```

3. **Archivos Modificados**:
   - `/backend/app/models/product.py`: Agregado campo `stock_qty`
   - `/backend/app/schemas/product.py`: Agregado campo en schemas
   - `/frontend/src/types/product.ts`: Agregado tipo `stock_qty`
   - `/frontend/src/pages/Productos.tsx`: Agregado campo en formulario
   - `/backend/app/models/stock_movement.py`: Nuevo modelo
   - `/backend/app/schemas/stock.py`: Nuevos schemas
   - `/backend/app/routers/stock.py`: Nuevos endpoints
   - `/backend/app/routers/pos.py`: Integración con movimientos de stock
   - `/frontend/src/pages/Stock.tsx`: Nueva página completa
   - `/frontend/src/lib/stock.ts`: Funciones API de stock
   - Todas las páginas rediseñadas con Bootstrap 5

4. **Estado Final**:
   - ✅ 222 productos con stock disponible
   - ✅ Sistema de stock completamente funcional
   - ✅ Integración automática con ventas
   - ✅ UI rediseñada con Bootstrap 5
   - ✅ Trazabilidad completa de movimientos

#### Lecciones Aprendidas
- Siempre verificar que las migraciones se hayan aplicado correctamente
- Usar scripts de verificación para asegurar integridad de datos
- Mantener sincronizados modelos backend, schemas y tipos frontend
- Documentar cambios significativos en claude.md

---

**Documento vivo - se actualiza con cada cambio significativo del proyecto**
