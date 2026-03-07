# Guía de Deployment - Sistema Empanadas

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
cd /opt/empanadas-system/backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 2.2 Crear archivo `.env`:

```bash
# backend/.env
DATABASE_URL=postgresql://empanadas_user:tu_password_seguro@localhost:5432/empanadas_db
JWT_SECRET_KEY=tu_clave_jwt_super_secreta_de_32_caracteres_minimo
ADMIN_PASSWORD=password_admin_seguro
```

### 2.3 Ejecutar setup de base de datos:

```bash
cd /opt/empanadas-system/backend
source venv/bin/activate

# Este comando crea todas las tablas y datos iniciales
python setup_database.py
```

El script `setup_database.py` realiza:
1. Ejecuta todas las migraciones de Alembic
2. Crea las 3 sucursales (Mendoza, Pergamino, Lagos)
3. Crea el usuario admin con password del `.env`
4. Crea productos de ejemplo (si no existen)
5. Configura stock inicial para Mendoza
6. Crea proveedores de ejemplo

### 2.4 Verificar setup:

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
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Producción (con Gunicorn):
```bash
pip install gunicorn

gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile /var/log/empanadas/access.log \
    --error-logfile /var/log/empanadas/error.log
```

### Systemd Service (recomendado):

Crear `/etc/systemd/system/empanadas-backend.service`:

```ini
[Unit]
Description=Empanadas Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/empanadas-system/backend
Environment="PATH=/opt/empanadas-system/backend/venv/bin"
EnvironmentFile=/opt/empanadas-system/backend/.env
ExecStart=/opt/empanadas-system/backend/venv/bin/gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000
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

### 4.1 Build de producción:

```bash
cd /opt/empanadas-system/frontend

# Instalar dependencias
npm install

# Configurar URL de la API
echo "VITE_API_URL=https://tu-dominio.com/api" > .env.production

# Build
npm run build
```

### 4.2 Servir con Nginx:

El build genera la carpeta `dist/` que debe servirse como archivos estáticos.

---

## 5. Configuración Nginx (Producción)

Crear `/etc/nginx/sites-available/empanadas`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    # SSL certificates (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Frontend (React SPA)
    root /opt/empanadas-system/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/empanadas_access.log;
    error_log /var/log/nginx/empanadas_error.log;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/empanadas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Comandos Útiles

### Migraciones manuales:
```bash
cd /opt/empanadas-system/backend
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
| Password | Definido en `ADMIN_PASSWORD` del `.env` (default: `admin123`) |
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
curl http://localhost:8000/docs
```
