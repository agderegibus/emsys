# Guía de Deployment - Sistema Empanadas

## Configuración del Servidor (La Orden)

| Servicio | Puerto |
|----------|--------|
| Frontend | 9000 |
| Backend  | 8000 |
| PostgreSQL | 5432 |

**Directorio base:** `/home/sistema/`

---

## Requisitos del Servidor

- Python 3.10+
- PostgreSQL 14+
- Node.js 18+ (para el frontend)

---

## 1. Configuración de Base de Datos

### Crear la base de datos PostgreSQL:

```sql
CREATE USER empanadas_user WITH PASSWORD 'tu_password_seguro';
CREATE DATABASE empanadas_db OWNER empanadas_user;
GRANT ALL PRIVILEGES ON DATABASE empanadas_db TO empanadas_user;
```

---

## 2. Configuración del Backend

### 2.1 Clonar y configurar:

```bash
cd /home/sistema/empanadas-system/backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 2.2 Crear archivo `.env`:

```bash
# Copiar el ejemplo
cp .env.example .env

# Editar con los valores de producción
nano .env
```

Contenido del `.env`:
```bash
# Database (puerto 5432 en el servidor)
DATABASE_URL=postgresql+psycopg2://empanadas_user:tu_password_seguro@localhost:5432/empanadas_db

# CORS (frontend corre en puerto 9000)
CORS_ORIGINS=http://localhost:9000,http://127.0.0.1:9000

# JWT - CAMBIAR EN PRODUCCIÓN
JWT_SECRET_KEY=tu_clave_jwt_super_secreta_de_32_caracteres_minimo
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480

# Admin inicial
FIRST_ADMIN_USERNAME=admin
FIRST_ADMIN_EMAIL=admin@empanadas.com
FIRST_ADMIN_PASSWORD=password_seguro_aqui
```

### 2.3 Ejecutar migraciones:

```bash
cd /home/sistema/empanadas-system/backend
source venv/bin/activate

# Aplicar migraciones
alembic upgrade head
```

### 2.4 Ejecutar setup de base de datos (opcional):

```bash
# Este comando crea datos iniciales
python setup_database.py
```

El script `setup_database.py` realiza:
1. Ejecuta todas las migraciones de Alembic
2. Crea las 3 sucursales (Mendoza, Pergamino, Lagos)
3. Crea el usuario admin con password del `.env`
4. Crea productos de ejemplo (si no existen)
5. Configura stock inicial para Mendoza
6. Crea proveedores de ejemplo

### 2.5 Verificar setup:

```bash
# Ver resumen de la base de datos
python -c "
from app.core.database import SessionLocal
from app.models.branch import Branch
from app.models.user import User
from app.models.product import Product

db = SessionLocal()
print(f'Sucursales: {db.query(Branch).count()}')
print(f'Usuarios: {db.query(User).count()}')
print(f'Productos: {db.query(Product).count()}')
db.close()
"
```

---

## 3. Iniciar Backend

### Desarrollo:
```bash
cd /home/sistema/empanadas-system/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Producción (con Gunicorn):
```bash
pip install gunicorn

gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000
```

### Systemd Service (recomendado):

Crear `/etc/systemd/system/empanadas-backend.service`:

```ini
[Unit]
Description=Empanadas Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=sistema
Group=sistema
WorkingDirectory=/home/sistema/empanadas-system/backend
Environment="PATH=/home/sistema/empanadas-system/backend/venv/bin"
EnvironmentFile=/home/sistema/empanadas-system/backend/.env
ExecStart=/home/sistema/empanadas-system/backend/venv/bin/gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable empanadas-backend
sudo systemctl start empanadas-backend
sudo systemctl status empanadas-backend
```

---

## 4. Configuración del Frontend

### 4.1 Crear archivo `.env`:

```bash
cd /home/sistema/empanadas-system/frontend

# Copiar el ejemplo
cp .env.example .env

# Editar para producción (backend en puerto 8000)
echo "VITE_API_URL=http://localhost:8000" > .env
```

### 4.2 Build de producción:

```bash
cd /home/sistema/empanadas-system/frontend

# Instalar dependencias
npm install

# Build
npm run build
```

El build genera la carpeta `dist/` que debe servirse.

### 4.3 Servir el frontend (desarrollo/testing):

```bash
# Servir en puerto 9000
npx serve -s dist -l 9000
```

---

## 5. Actualizar el Sistema (Pull & Build)

Cuando hay cambios en el repositorio:

```bash
cd /home/sistema/empanadas-system

# Traer cambios
git pull

# Backend - aplicar migraciones si hay nuevas
cd backend
source venv/bin/activate
alembic upgrade head
pip install -r requirements.txt  # si hay nuevas dependencias

# Reiniciar backend
sudo systemctl restart empanadas-backend

# Frontend - rebuild
cd ../frontend
npm install  # si hay nuevas dependencias
npm run build
```

---

## 6. Comandos Útiles

### Migraciones:
```bash
cd /home/sistema/empanadas-system/backend
source venv/bin/activate

# Ver estado de migraciones
alembic current

# Aplicar migraciones pendientes
alembic upgrade head

# Revertir última migración
alembic downgrade -1
```

### Crear nuevo usuario admin:
```bash
python -c "
from app.core.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
db = SessionLocal()

user = User(
    username='nuevo_admin',
    email='nuevo@empanadas.com',
    password_hash=pwd_context.hash('password_seguro'),
    role='admin',
    is_active=True
)
db.add(user)
db.commit()
print('Usuario creado!')
db.close()
"
```

### Backup de base de datos:
```bash
pg_dump -U empanadas_user -h localhost empanadas_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup:
```bash
psql -U empanadas_user -h localhost empanadas_db < backup_20260307_120000.sql
```

---

## 7. Credenciales por Defecto

Después de ejecutar `setup_database.py`:

| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Password | Definido en `FIRST_ADMIN_PASSWORD` del `.env` (default: `admin123`) |
| Rol | `admin` (acceso total) |
| Sucursales | Todas (Mendoza, Pergamino, Lagos) |

---

## 8. Estructura de Sucursales

| Sucursal | Código |
|----------|--------|
| Mendoza | MZA |
| Pergamino | PER |
| Lagos | LAG |

Cada sucursal tiene su propio:
- Stock de productos
- Historial de ventas
- Movimientos de stock
- Cadetes de delivery

---

## 9. Troubleshooting

### Error de conexión a PostgreSQL:
```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -U empanadas_user -h localhost -d empanadas_db -c "SELECT 1"
```

### Error de migraciones:
```bash
# Ver historial de migraciones
alembic history

# Marcar migración como aplicada (si la tabla ya existe)
alembic stamp head
```

### Logs del backend:
```bash
sudo journalctl -u empanadas-backend -f
```

### Verificar que el backend responde:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/docs
```

### Verificar puertos en uso:
```bash
sudo netstat -tlnp | grep -E "8000|9000|5432"
```
